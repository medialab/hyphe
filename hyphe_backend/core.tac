#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, sys, time, random, types, json, bson
import urllib, urllib2
import pymongo
import subprocess
from txjsonrpc import jsonrpclib
from txjsonrpc.jsonrpc import Introspection
from txjsonrpc.web import jsonrpc
from twisted.web import server
from twisted.python import log as logger
from twisted.application import service, internet
from twisted.internet import reactor, defer, task, threads
from twisted.internet.defer import inlineCallbacks, returnValue as returnD
from twisted.internet.endpoints import TCP4ClientEndpoint
from twisted.internet.error import DNSLookupError
from twisted.web.http_headers import Headers
from twisted.web.client import Agent, ProxyAgent, _HTTP11ClientFactory
_HTTP11ClientFactory.noisy = False
from thrift.Thrift import TException
from thrift.transport.TSocket import TSocket
from hyphe_backend import processor
from hyphe_backend.memorystructure import MemoryStructure as ms, constants as ms_const
from hyphe_backend.lib import config_hci, urllru, gexf, user_agents
from hyphe_backend.lib.utils import *
from hyphe_backend.lib.jsonrpc_utils import *
from hyphe_backend.lib.corpus import CorpusFactory

config = config_hci.load_config()
if not config:
    exit()

corpus_project = lambda x: ("%s.%s" % (config['mongo-scrapy']['db_name'], x)).lower()

crawling_statuses = Enum(['UNCRAWLED', 'PENDING', 'RUNNING', 'FINISHED', 'CANCELED', 'RETRIED'])
indexing_statuses = Enum(['UNINDEXED', 'PENDING', 'BATCH_RUNNING', 'BATCH_FINISHED', 'BATCH_CRASHED', 'FINISHED', 'CANCELED'])

DUMMY = "--test--"

class Core(jsonrpc.JSONRPC):

    addSlash = True

    def __init__(self):
        jsonrpc.JSONRPC.__init__(self)
        self.db = pymongo.Connection(config['mongo-scrapy']['host'],config['mongo-scrapy']['mongo_port'])[config['mongo-scrapy']['db_name']]
        self.corpora = {}
        self.crawler = Crawler(self)
        self.store = Memory_Structure(self)

    def close(self):
        for corpus in self.corpora:
            self.jsonrpc_stop_corpus(corpus)
        self.store.close()

    def render(self, request):
        request.setHeader("Access-Control-Allow-Origin", "*")
        from_ip = ""
        # TODO : put this in generic twisted or txjsonrpc logs
        if request.getHeader("x-forwarded-for"):
            from_ip = " from %s" % request.getHeader("x-forwarded-for")
        if config['DEBUG']:
            logger.msg(request.content.read(), system="DEBUG - QUERY%s" % from_ip)
        return jsonrpc.JSONRPC.render(self, request)

    def _cbRender(self, result, request, id, version):
        if config['DEBUG'] == 2:
            txt = jsonrpclib.dumps(result, id=id, version=2.0)
            logger.msg("%s%s" % (txt[:1000], " ... [%d cars truncated]" % (len(txt)-1000) if len(txt) > 1000 else ''), system="DEBUG - ANSWER")
        return jsonrpc.JSONRPC._cbRender(self, result, request, id, version)

    def jsonrpc_ping(self):
        return format_result('pong')

    def jsonrpc_create_corpus(self, name=DUMMY):
        corpus_id = clean_corpus_id(name)
        self.crawler.init_indexes(corpus_id)
        try:
            res = self.crawler.deploy_spider(name)
        except:
            return format_error("Could not deploy corpus' scrapyd spider")
        if not res:
            return res
        res = self.jsonrpc_start_corpus(corpus_id)
        if not res:
            return res
        return format_success({'corpus_id': corpus_id, 'corpus_status': self.store.msclients.status_corpus(corpus_id)})

    def jsonrpc_start_corpus(self, corpus=DUMMY):
        if corpus in self.corpora and self.store.msclients.test_corpus(corpus):
            return format_success("Corpus %s already ready" % corpus)
        res = self.store.msclients.start_corpus(corpus)
        if not res:
            return format_error("Could not start corpus %s" % corpus)
        self.corpora[corpus] = {
          "index_loop": task.LoopingCall(self.store.index_batch_loop, corpus),
          "jobs_loop": task.LoopingCall(self.refresh_jobs, corpus)
        }
        self.corpora[corpus]['jobs_loop'].start(1, False)
        self.store._start_loop(corpus)
        return format_success("Corpus %s started" % corpus)

    def jsonrpc_stop_corpus(self, corpus=DUMMY):
        if self.corpora[corpus]['jobs_loop'].running:
            self.corpora[corpus]['jobs_loop'].stop()
        self.store._stop_loop(corpus)
        res = self.store.msclients.stop_corpus(corpus, corpus == DUMMY)
        if not res:
            return format_success("Corpus %s was already stopped" % corpus)
        return format_success("Corpus %s stopped" % corpus)

    def jsonrpc_reinitialize(self, corpus=DUMMY):
        """Reinitializes both crawl jobs and memory structure."""
        if self.corpora[corpus]['jobs_loop'].running:
            self.corpora[corpus]['jobs_loop'].stop()
        res = self.crawler.jsonrpc_reinitialize(corpus)
        self.corpora[corpus]['jobs_loop'].start(1, False)
        if is_error(res):
            return res
        res = self.store.jsonrpc_reinitialize(corpus)
        if is_error(res):
            return res
        return format_result('Memory structure and crawling database contents emptied.')

    def refresh_jobs(self, corpus=DUMMY):
        """Runs a monitoring task on the list of jobs in the database to update their status from scrapy API and indexing tasks."""
        scrapyjobs = self.crawler.jsonrpc_list(corpus)
        if is_error(scrapyjobs):
            return scrapyjobs
        scrapyjobs = scrapyjobs['result']
        # clean lost jobs
        if len(scrapyjobs['running']) + len(scrapyjobs['pending']) == 0:
            resdb = self.db['%s.jobs' % corpus].update({'crawling_status': {'$in': [crawling_statuses.PENDING, crawling_statuses.RUNNING]}}, {'$set': {'crawling_status': crawling_statuses.FINISHED}}, multi=True, safe=True)
            if (resdb['err']):
                logger.msg("Pb while updating lost jobs crawling_statuses %s" % resdb, system="ERROR - %s" % corpus)
                return
        # clean canceled jobs
        resdb = self.db['%s.jobs' % corpus].update({'crawling_status': crawling_statuses.CANCELED}, {'$set': {'indexing_status': indexing_statuses.CANCELED}}, multi=True, safe=True)
        if (resdb['err']):
            logger.msg("Pb while updating canceled jobs indexing_statuses %s" % resdb, system="ERROR - %s" % corpus)
            return
        # update jobs crawling status accordingly to crawler's statuses
        running_ids = [job['id'] for job in scrapyjobs['running']]
        for job_id in running_ids:
            crawled_pages = self.db['%s.pages' % corpus].find({'_job': job_id}).count()
            self.db['%s.jobs' % corpus].update({'_id': job_id}, {'$set': {'nb_crawled_pages': crawled_pages}})
        update_ids = [job['_id'] for job in self.db['%s.jobs' % corpus].find({'_id': {'$in': running_ids}, 'crawling_status': crawling_statuses.PENDING}, fields=['_id'])]
        if len(update_ids):
            resdb = self.db['%s.jobs' % corpus].update({'_id': {'$in': update_ids}}, {'$set': {'crawling_status': crawling_statuses.RUNNING}}, multi=True, safe=True)
            if (resdb['err']):
                logger.msg("Pb while updating running crawling jobs statuses %s %s" % (update_ids, resdb), system="ERROR - %s" % corpus)
                return
            jobslog(update_ids, "CRAWL_"+crawling_statuses.RUNNING, self.db, corpus=corpus)
        # update crawling status for finished jobs
        finished_ids = [job['id'] for job in scrapyjobs['finished']]
        update_ids = [job['_id'] for job in self.db['%s.jobs' % corpus].find({'_id': {'$in': finished_ids}, 'crawling_status': {'$nin': [crawling_statuses.RETRIED, crawling_statuses.CANCELED, crawling_statuses.FINISHED]}}, fields=['_id'])]
        if len(update_ids):
            resdb = self.db['%s.jobs' % corpus].update({'_id': {'$in': update_ids}}, {'$set': {'crawling_status': crawling_statuses.FINISHED}}, multi=True, safe=True)
            if (resdb['err']):
                logger.msg("Pb while updating finished crawling jobs statuses %s %s" % (update_ids, resdb), system="ERROR - %s" % corpus)
                return
            jobslog(update_ids, "CRAWL_"+crawling_statuses.FINISHED, self.db, corpus=corpus)
        # collect list of crawling jobs whose outputs is not fully indexed yet
        jobs_in_queue = self.db['%s.queue' % corpus].distinct('_job')
        # set index finished for jobs with crawling finished and no page left in queue
        finished_ids = set([job['_id'] for job in self.db['%s.jobs' % corpus].find({'crawling_status': crawling_statuses.FINISHED})] + finished_ids)
        update_ids = [job['_id'] for job in self.db['%s.jobs' % corpus].find({'_id': {'$in': list(finished_ids-set(jobs_in_queue))}, 'crawling_status': crawling_statuses.FINISHED, 'indexing_status': {'$nin': [indexing_statuses.BATCH_RUNNING, indexing_statuses.FINISHED]}}, fields=['_id'])]
        if len(update_ids):
            resdb = self.db['%s.jobs' % corpus].update({'_id': {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.FINISHED}}, multi=True, safe=True)
            if (resdb['err']):
                logger.msg("Pb while updating finished indexing jobs statuses %s %s" % (update_ids, resdb), system="ERROR - %s" % corpus)
                return
            jobslog(update_ids, "INDEX_"+indexing_statuses.FINISHED, self.db, corpus=corpus)
            # Try to restart in phantom mode all regular crawls that seem to have failed (less than 3 pages found for a depth of at least 1)
            for job in self.db['%s.jobs' % corpus].find({'_id': {'$in': update_ids}, 'nb_crawled_pages': {'$lt': 3}, 'crawl_arguments.phantom': False, 'crawl_arguments.maxdepth': {'$gt': 0}}):
                logger.msg("Crawl job %s seems to have failed, trying to restart it in phantom mode" % job['_id'], system="INFO - %s" % corpus)
                self.jsonrpc_crawl_webentity(job['webentity_id'], job['crawl_arguments']['maxdepth'], False, False, True)
                jobslog(job['_id'], "CRAWL_RETRIED_AS_PHANTOM", self.db, corpus=corpus)
                resdb = self.db['%s.jobs' % corpus].update({'_id': job['_id']}, {'$set': {'crawling_status': crawling_statuses.RETRIED}}, safe=True)
                if (resdb['err']):
                    logger.msg("Pb while updating finished indexing jobs statuses %s %s" % (jobs['_id'], resdb), system="ERROR - %s" % corpus)
        return self.jsonrpc_listjobs(corpus=corpus)

    def jsonrpc_listjobs(self, list_ids=None, corpus=DUMMY):
        query = {}
        if list_ids:
            query = {'_id': {'$in': list_ids}}
        return format_result(list(self.db['%s.jobs' % corpus].find(query, sort=[('crawling_status', pymongo.ASCENDING), ('indexing_status', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)])))

    def jsonrpc_declare_page(self, url, corpus=DUMMY):
        return handle_standard_results(self.store.declare_page(url, corpus=corpus))

    def jsonrpc_declare_pages(self, list_urls, corpus=DUMMY):
        res = []
        errors = []
        for url in list_urls:
            WE = self.jsonrpc_declare_page(url, corpus=corpus)
            if is_error(WE):
                errors.append({'url': url, 'error': WE['message']})
            else:
                res.append(WE['result'])
        if len(errors):
            return {'code': 'fail', 'message': '%d urls failed, see details in "errors" field and successes in "results" field.' % len(errors), 'errors': errors, 'results': res}
        return format_result(res)

    @inlineCallbacks
    def jsonrpc_lookup_httpstatus(self, url, timeout=5, tryout=0, noproxy=False, corpus=None):
        res = format_result(0)
        timeout = int(timeout)
        use_proxy = config['proxy']['host'] and not noproxy
        url = urllru.url_clean(str(url))
        try:
            if use_proxy:
                agent = ProxyAgent(TCP4ClientEndpoint(reactor, config['proxy']['host'], config['proxy']['port'], timeout=timeout))
            else:
                agent = Agent(reactor, connectTimeout=timeout)
            method = "HEAD"
            if tryout > 2:
                method = "GET"
            headers = {'Accept': ['*/*'],
                      'User-Agent': [user_agents.agents[random.randint(0, len(user_agents.agents) -1)]]}
            response = yield agent.request(method, url, Headers(headers), None)
        except DNSLookupError as e:
            res['message'] = "DNS not found for url %s : %s" % (url, e)
        except Exception as e:
            res['result'] = -1
            res['message'] = "Cannot process url %s : %s." % (url, e)
        if 'message' in res:
            returnD(res)
        try:
            assert(response.code == 200 or url in " ".join(response.headers._rawHeaders['location']))
            res['result'] = 200
        except:
            try:
                assert(url.startswith("http:") and tryout == 4 and response.code == 403 and "IIS" in response.headers._rawHeaders['server'][0])
                res['result'] = 301
            except:
                if use_proxy or response.code in [403, 405, 500, 501, 503]:
                    if tryout == 5 and use_proxy:
                        noproxy = True
                        tryout = 3
                    if tryout < 5:
                        if config['DEBUG']:
                            logger.msg("Retry lookup %s %s %s %s" % (method, url, tryout, response.__dict__), system="DEBUG - %s" % corpus)
                        res = yield self.jsonrpc_lookup_httpstatus(url, timeout=timeout+2, tryout=tryout+1, noproxy=noproxy)
                        returnD(res)
                res['result'] = response.code
        returnD(res)

    @inlineCallbacks
    def jsonrpc_lookup(self, url, timeout=5, noproxy=False):
        res = yield self.jsonrpc_lookup_httpstatus(url, timeout=timeout, noproxy=noproxy)
        if res['code'] == 'success' and (res['result'] == 200 or 300 < res['result'] < 400):
            returnD(format_result("true"))
        returnD(format_result("false"))

    def jsonrpc_get_status(self, corpus=DUMMY):
        crawls = self.crawler.jsonrpc_list(corpus)
        pages = self.db['%s.queue' % corpus].count()
        crawled = self.db['%s.pages' % corpus].count()
        jobs = list(self.db['%s.jobs' % corpus].find(fields=['nb_pages', 'nb_links']))
        found_pages = sum([j['nb_pages'] for j in jobs])
        found_links = sum([j['nb_links'] for j in jobs])
        res = {'crawler': {'jobs_pending': len(crawls['result']['pending']),
                           'jobs_running': len(crawls['result']['running']),
                           'pages_crawled': crawled,
                           'pages_found': found_pages,
                           'links_found': found_links},
               'memory_structure': {'job_running': self.store.corpora[corpus]['loop_running'],
                                    'job_running_since': self.store.corpora[corpus]['loop_running_since']*1000,
                                    'last_index': self.store.corpora[corpus]['last_index_loop']*1000,
                                    'last_links_generation': self.store.corpora[corpus]['last_links_loop']*1000,
                                    'pages_to_index': pages,
                                    'webentities': self.store.corpora[corpus]['total_webentities']}}
        return format_result(res)

    @inlineCallbacks
    def jsonrpc_crawl_webentity(self, webentity_id, maxdepth=None, use_all_pages_as_startpages=False, use_prefixes_as_startpages=False, phantom_crawl=False, corpus=DUMMY):
        """Tells scrapy to run crawl on a WebEntity defined by its id from memory structure."""
        try:
            maxdepth = int(maxdepth)
        except:
            maxdepth = config['mongo-scrapy']['maxdepth']
        if maxdepth > config['mongo-scrapy']['maxdepth']:
            returnD(format_error('No crawl with a bigger depth than %d is allowed on this Hyphe instance.' % config['mongo-scrapy']['maxdepth']))
        WE = yield self.store.get_webentity_with_pages_and_subWEs(webentity_id, use_all_pages_as_startpages, corpus=corpus)
        if test_bool_arg(use_prefixes_as_startpages) and not test_bool_arg(use_all_pages_as_startpages):
            WE['pages'] = [urllru.lru_to_url(lru) for lru in WE['lrus']]
        if is_error(WE):
            returnD(WE)
        if WE['status'] == ms.WebEntityStatus._VALUES_TO_NAMES[ms.WebEntityStatus.DISCOVERED]:
            yield self.store.jsonrpc_set_webentity_status(webentity_id, ms.WebEntityStatus._VALUES_TO_NAMES[ms.WebEntityStatus.UNDECIDED], corpus=corpus)
        yield self.store.jsonrpc_rm_webentity_tag_value(webentity_id, "CORE", "recrawl_needed", "true", corpus=corpus)
        res = yield self.crawler.jsonrpc_start(webentity_id, WE['pages'], WE['lrus'], WE['subWEs'], config['discoverPrefixes'], maxdepth, phantom_crawl)
        returnD(res)

    def jsonrpc_get_webentity_logs(self, webentity_id):
        jobs = self.db['%s.jobs' % corpus].find({'webentity_id': webentity_id}, fields=['_id'], order=[('timestamp', pymongo.ASCENDING)])
        if not jobs.count():
            return format_error('No job found for WebEntity %s.' % webentity_id)
        res = self.db['%s.logs' % corpus].find({'_job': {'$in': [a['_id'] for a in list(jobs)]}}, order=[('timestamp', pymongo.ASCENDING)])
        return format_result([{'timestamp': log['timestamp'], 'job': log['_job'], 'log': log['log']} for log in list(res)])


class Crawler(jsonrpc.JSONRPC):

    scrapy_url = 'http://%s:%s/' % (config['mongo-scrapy']['host'], config['mongo-scrapy']['scrapy_port'])

    def __init__(self, parent=None):
        jsonrpc.JSONRPC.__init__(self)
        self.parent = parent
        self.db = self.parent.db
        self.corpora = self.parent.corpora

    def init_indexes(self, corpus=DUMMY):
        self.db['%s.pages' % corpus].ensure_index([('timestamp', pymongo.ASCENDING)], safe=True)
        self.db['%s.pages' % corpus].ensure_index([('_job', pymongo.ASCENDING)], safe=True)
        self.db['%s.pages' % corpus].ensure_index([('url', pymongo.ASCENDING)], safe=True)
        self.db['%s.queue' % corpus].ensure_index([('timestamp', pymongo.ASCENDING)], safe=True)
        self.db['%s.queue' % corpus].ensure_index([('_job', pymongo.ASCENDING), ('timestamp', pymongo.DESCENDING)], safe=True)
        self.db['%s.logs' % corpus].ensure_index([('timestamp', pymongo.ASCENDING)], safe=True)
        self.db['%s.jobs' % corpus].ensure_index([('crawling_status', pymongo.ASCENDING)], safe=True)
        self.db['%s.jobs' % corpus].ensure_index([('indexing_status', pymongo.ASCENDING)], safe=True)
        self.db['%s.jobs' % corpus].ensure_index([('webentity_id', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)], safe=True)
        self.db['%s.jobs' % corpus].ensure_index([('crawling_status', pymongo.ASCENDING), ('indexing_status', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)], safe=True)

    def deploy_spider(self, corpus=DUMMY):
        output = subprocess.Popen(['bash', 'bin/deploy_scrapy_spider.sh', corpus_project(corpus), '--noenv'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT).communicate()[0]
        res = self.send_scrapy_query('listprojects')
        if is_error(res) or "projects" not in res['result'] or corpus_project(corpus) not in res['result']['projects']:
            return format_error(output)
        return format_success('Spider %s deployed' % corpus_project(corpus))

    def jsonrpc_cancel_all(self, corpus=DUMMY):
        """Stops all current crawls."""
        list_jobs = self.jsonrpc_list(corpus)
        if is_error(list_jobs):
            return list_jobs
        list_jobs = list_jobs['result']
        for item in list_jobs['running'] + list_jobs['pending']:
            res = self.jsonrpc_cancel(item['id'])
            if config['DEBUG']:
                logger.msg(res, system="DEBUG - %s" % corpus)
        while 'running' in list_jobs and len(list_jobs['running']):
            list_jobs = self.jsonrpc_list(corpus)
            if not is_error(list_jobs):
                list_jobs = list_jobs['result']
        return format_result('All crawling jobs canceled.')

    def jsonrpc_reinitialize(self, corpus=DUMMY):
        """Cancels all current crawl jobs running or planned and empty mongodbs."""
        logger.msg("Empty crawl list + mongodb queue", system="INFO - %s" % corpus)
        canceljobs = self.jsonrpc_cancel_all(corpus)
        if is_error(canceljobs):
            return canceljobs
        try:
            self.db['%s.queue' % corpus].drop()
            self.db['%s.pages' % corpus].drop()
            self.db['%s.jobs' % corpus].drop()
            self.db['%s.logs' % corpus].drop()
            self.init_indexes(corpus)
        except:
            return format_error('Error while resetting mongoDB.')
        return format_result('Crawling database reset.')

    def send_scrapy_query(self, action, arguments=None, tryout=0):
        url = self.scrapy_url+action+".json"
        if action == 'listjobs':
            url += '?'+'&'.join([par+'='+val for (par,val) in arguments.iteritems()])
            req = urllib2.Request(url)
        else:
            data = None
            if arguments:
                data = urllib.urlencode(arguments)
            req = urllib2.Request(url, data)
        try:
            response = urllib2.urlopen(req)
            result = json.loads(response.read())
            return format_result(result)
        except urllib2.URLError as e:
            return format_error("Could not contact scrapyd server, maybe it's not started...")
        except Exception as e:
            return format_error(e)

    def jsonrpc_start(self, webentity_id, starts, follow_prefixes, nofollow_prefixes, discover_prefixes=config['discoverPrefixes'], maxdepth=config['mongo-scrapy']['maxdepth'], phantom_crawl=False, download_delay=config['mongo-scrapy']['download_delay'], corpus=DUMMY):
        """Starts a crawl with scrapy from arguments using a list of urls and of lrus for prefixes."""
        if not phantom_crawl and urls_match_domainlist(starts, config['phantom']['whitelist_domains']):
            phantom_crawl = True
        if maxdepth > config['mongo-scrapy']['maxdepth']:
            return format_error('No crawl with a bigger depth than %d is allowed on this Hyphe instance.' % config['mongo-scrapy']['maxdepth'])
        if len(starts) < 1:
            return format_error('No startpage defined for crawling WebEntity %s.' % webentity_id)
        # preparation of the request to scrapyd
        args = {'project': corpus_project(corpus),
                  'spider': 'pages',
                  'phantom': phantom_crawl,
                  'setting': 'DOWNLOAD_DELAY=' + str(download_delay),
                  'maxdepth': maxdepth,
                  'start_urls': list(starts),
                  'follow_prefixes': list(follow_prefixes),
                  'nofollow_prefixes': list(nofollow_prefixes),
                  'discover_prefixes': list(discover_prefixes),
                  'user_agent': user_agents.agents[random.randint(0, len(user_agents.agents) - 1)]}
        res = self.send_scrapy_query('schedule', args)
        if is_error(res):
            return res
        res = res['result']
        if 'jobid' in res:
            ts = int(time.time()*1000)
            jobslog(res['jobid'], "CRAWL_ADDED", self.db, ts, corpus=corpus)
            resdb = self.db['%s.jobs' % corpus].update({'_id': res['jobid']}, {'$set': {'webentity_id': webentity_id, 'nb_crawled_pages': 0, 'nb_pages': 0, 'nb_links': 0, 'crawl_arguments': args, 'crawling_status': crawling_statuses.PENDING, 'indexing_status': indexing_statuses.PENDING, 'timestamp': ts}}, upsert=True, safe=True)
            if (resdb['err']):
                logger.msg("Pb while saving crawling job %s in database for WebEntity %s with arguments %s: %s" % (res['jobid'], webentity_id, args, resdb), system="ERROR - %s" % corpus)
                return format_error(resdb['err'])
        return format_result(res)

    def jsonrpc_cancel(self, job_id, corpus=DUMMY):
        """Cancels a scrapy job with id job_id."""
        logger.msg("Cancel crawl: %s" % job_id, system="INFO - %s" % corpus)
        args = {'project': corpus_project(corpus),
                  'job': job_id}
        res = self.send_scrapy_query('cancel', args)
        if is_error(res):
            return res
        res = res['result']
        if 'prevstate' in res:
            resdb = self.db['%s.jobs' % corpus].update({'_id': job_id}, {'$set': {'crawling_status': crawling_statuses.CANCELED}}, safe=True)
            if (resdb['err']):
                 logger.msg("Pb while updating job %s in database: %s" % (job_id, resdb), system="ERROR - %s" % corpus)
                 return format_error(resdb['err'])
            jobslog(job_id, "CRAWL_"+crawling_statuses.CANCELED, self.db, corpus=corpus)
        return format_result(res)

    def jsonrpc_list(self, corpus=DUMMY):
        """Calls Scrappy monitoring API, returns list of scrapy jobs."""
        return self.send_scrapy_query('listjobs', {'project': corpus_project(corpus)})

    def jsonrpc_get_job_logs(self, job_id, corpus=DUMMY):
        res = self.db['%s.logs' % corpus].find({'_job': job_id}, fields=['timestamp', 'log'], order=[('timestamp', pymongo.ASCENDING)])
        if not res.count():
            return format_error('No log found for job %s.' % job_id)
        return format_result([{'timestamp': log['timestamp'], 'log': log['log']} for log in res])


class Memory_Structure(jsonrpc.JSONRPC):

    def __init__(self, parent=None):
        jsonrpc.JSONRPC.__init__(self)
        self.parent = parent
        self.db = self.parent.db
        self.corpora = self.parent.corpora
        self.msclients = CorpusFactory(config['memoryStructure']['thrift.host'],
          port_range = config['memoryStructure']['thrift.portrange'],
          max_ram = config['memoryStructure']['thrift.max_ram'],
          loglevel = config['memoryStructure']['log.level'])

    def close(self):
        self.msclients.stop()

    def _start_loop(self, corpus=DUMMY):
        self.corpora[corpus]['webentities'] = []
        self.corpora[corpus]['total_webentities'] = -1
        self.corpora[corpus]['last_WE_update'] = 0
        self.corpora[corpus]['webentities_links'] = []
        self.corpora[corpus]['tags'] = {}
        self.corpora[corpus]['recent_tagging'] = True
        self.corpora[corpus]['precision_exceptions'] = []
        threads.deferToThread(self.jsonrpc_get_precision_exceptions, corpus=corpus)
        self.corpora[corpus]['loop_running_since'] = time.time()
        self.corpora[corpus]['last_links_loop'] = time.time()
        self.corpora[corpus]['last_index_loop'] = time.time()
        self.corpora[corpus]['recent_indexes'] = 0
        self.corpora[corpus]['loop_running'] = "Collecting WebEntities & WebEntityLinks"
        if corpus != DUMMY:
            reactor.callLater(0, self.jsonrpc_get_webentities, light=True, corelinks=True, corpus=corpus)
            reactor.callLater(5, self.corpora[corpus]['index_loop'].start, 1, True)

    def _stop_loop(self, corpus=DUMMY):
        if self.corpora[corpus]['index_loop'].running:
            self.corpora[corpus]['index_loop'].stop()

    def format_webentity(self, WE, jobs=None, light=False, semilight=False, light_for_csv=False, corpus=DUMMY):
        if WE:
            res = {'id': WE.id, 'name': WE.name}
            if test_bool_arg(light):
                return res
            res['lru_prefixes'] = list(WE.LRUSet)
            res['status'] = WE.status
            res['creation_date'] = WE.creationDate
            res['last_modification_date'] = WE.lastModificationDate
            if test_bool_arg(semilight):
                return res
            res['homepage'] = WE.homepage
            res['startpages'] = list(WE.startpages)
            res['tags'] = {}
            for tag, values in WE.metadataItems.iteritems():
                res['tags'][tag] = {}
                for key, val in values.iteritems():
                    res['tags'][tag][key] = list(val)
            if test_bool_arg(light_for_csv):
                return {'id': WE.id, 'name': WE.name, 'status': WE.status,
                        'prefixes': "|".join([urllru.lru_to_url(lru, nocheck=True) for lru in WE.LRUSet]),
                        'tags': "|".join(["|".join(res['tags'][ns][key]) for ns in res['tags'] for key in res['tags'][ns] if ns != "CORE"])}
            # pages = yield self.msclients.pool.getWebEntityCrawledPages(WE.id, corpus=corpus)
            # nb_pages = len(pages)
            # nb_links
            job = None
            if not jobs:
                job = self.db['%s.jobs' % corpus].find_one({'webentity_id': WE.id}, fields=['crawling_status', 'indexing_status'], sort=[('timestamp', pymongo.DESCENDING)])
            elif WE.id in jobs:
                job = jobs[WE.id]
            if job:
                res['crawling_status'] = job['crawling_status']
                res['indexing_status'] = job['indexing_status']
            else:
                res['crawling_status'] = crawling_statuses.UNCRAWLED
                res['indexing_status'] = indexing_statuses.UNINDEXED
            return res
        return None

    def format_webentities(self, WEs, jobs=None, light=False, semilight=False, light_for_csv=False, corpus=DUMMY):
        return [self.format_webentity(WE, jobs, light, semilight, light_for_csv, corpus=corpus) for WE in WEs]

    def reset(self, corpus=DUMMY):
        logger.msg("Empty memory structure content", system="INFO - %s" % corpus)
        res = self.msclients.sync.clearIndex(corpus=corpus)
        if is_error(res):
            return res
        return self.ensureDefaultCreationRuleExists(corpus)

    @inlineCallbacks
    def jsonrpc_get_all_nodelinks(self, corpus=DUMMY):
        res = yield self.msclients.pool.getNodeLinks(corpus=corpus)
        returnD(handle_standard_results(res))

    def jsonrpc_delete_all_nodelinks(self, corpus=DUMMY):
        self.corpora[corpus]['recent_indexes'] += 1
        return handle_standard_results(self.msclients.sync.deleteNodeLinks(corpus=corpus))

    def ensureDefaultCreationRuleExists(self, corpus=DUMMY):
        rules = self.msclients.sync.getWebEntityCreationRules(corpus=corpus)
        if is_error(rules) or len(rules) == 0:
            default_regexp = "(s:[a-zA-Z]+\\|(t:[0-9]+\\|)?(h:[^\\|]+\\|)(h:[^\\|]+\\|)+)"
            if corpus != DUMMY:
                logger.msg("Saves default WE creation rule", system="INFO - %s" % corpus)
            res = self.msclients.sync.addWebEntityCreationRule(ms.WebEntityCreationRule(default_regexp, ''), corpus=corpus)
            if is_error(res):
                return res
            return format_success('Default creation rule created')
        return format_success('Default creation rule was already created')

    def jsonrpc_reinitialize(self, corpus=DUMMY):
        try:
            self.corpora[corpus]['index_loop'].stop()
            self.reset(corpus)
            self._start_loop(corpus)
            return format_result("MemoryStructure reinitialized")
        except:
            return format_error("Service initialization not finished. Please retry in a second.")

    def return_new_webentity(self, lru_prefix, new=False, source=None, corpus=DUMMY):
        WE = self.msclients.sync.findWebEntityMatchingLRUPrefix(lru_prefix, corpus=corpus)
        if is_error(WE):
            return WE
        if test_bool_arg(new):
            self.corpora[corpus]['recent_indexes'] += 1
            self.corpora[corpus]['total_webentities'] += 1
            if source:
                self.jsonrpc_add_webentity_tag_value(WE.id, 'CORE', 'user_created_via', source)
        WE = self.format_webentity(WE, corpus=corpus)
        WE['created'] = True if new else False
        return WE

    def handle_url_precision_exceptions(self, url, corpus=DUMMY):
        lru = urllru.url_to_lru_clean(url, False)
        return self.handle_lru_precision_exceptions(lru, corpus=corpus)

    def handle_lru_precision_exceptions(self, lru_prefix, corpus=DUMMY):
        if not corpus in self.corpora:
            return format_error("Corpus %s is not started" % corpus)
        lru_head = urllru.lru_get_head(lru_prefix, self.corpora[corpus]['precision_exceptions'])
        if not urllru.lru_is_node(lru_prefix, config["precisionLimit"], lru_head=lru_head) and lru_prefix != lru_head:
            res = self.msclients.sync.addPrecisionExceptions([lru_prefix], corpus=corpus)
            if is_error(res):
                return res
            self.corpora[corpus]['precision_exceptions'].append(lru_prefix)
            return format_success("LRU Precision Exceptions handled")

    def declare_page(self, url, corpus=DUMMY):
        try:
            url, lru = urllru.url_clean_and_convert(url)
        except ValueError as e:
            return format_error(e)
        res = self.handle_lru_precision_exceptions(lru, corpus=corpus)
        if is_error(res):
            return res
        is_node = urllru.lru_is_node(lru, config["precisionLimit"], self.corpora[corpus]['precision_exceptions'])
        is_full_precision = urllru.lru_is_full_precision(lru, self.corpora[corpus]['precision_exceptions'])
        t = str(int(time.time()*1000))
        page = ms.PageItem(url, lru, t, None, -1, None, ['USER'], is_full_precision, is_node, {})
        cache_id = self.msclients.sync.createCache([page], corpus=corpus)
        if is_error(cache_id):
            return cache_id
        res = self.msclients.sync.indexCache(cache_id, corpus=corpus)
        print "T1", res
        if is_error(res):
            return res
        new = self.msclients.sync.createWebEntitiesFromCache(cache_id, corpus=corpus)
        print "T2", new
        if is_error(new):
            return new
        return self.return_new_webentity(lru, new, 'page', corpus=corpus)

    def jsonrpc_declare_webentity_by_lruprefix_as_url(self, url, name=None, status=None, corpus=DUMMY):
        try:
            url, lru_prefix = urllru.url_clean_and_convert(url, False)
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_declare_webentity_by_lrus([lru_prefix], name, status, corpus=corpus)

    def jsonrpc_declare_webentity_by_lru(self, lru_prefix, name=None, status=None, corpus=DUMMY):
        return self.jsonrpc_declare_webentity_by_lrus([lru_prefix], name, status, corpus=corpus)

    def jsonrpc_declare_webentity_by_lrus(self, list_lrus, name=None, status=None, corpus=DUMMY):
        if not isinstance(list_lrus, list):
            list_lrus = [list_lrus]
        lru_prefixes_list = []
        if name:
            name = name.encode('utf-8')
        for lru in list_lrus:
            try:
                url, lru = urllru.lru_clean_and_convert(lru, False)
                lru = urllru.lru_strip_path_trailing_slash(lru)
            except ValueError as e:
                return format_error(e)
            existing = self.msclients.sync.getWebEntityByLRUPrefix(lru, corpus=corpus)
            if not is_error(existing):
                return format_error('LRU prefix "%s" is already set to an existing WebEntity : %s' % (lru, existing))
            if not name:
                name = urllru.url_shorten(url)
            lru_prefixes_list.append(lru)
        WE = ms.WebEntity(None, lru_prefixes_list, name)
        if status:
            for s in ms.WebEntityStatus._NAMES_TO_VALUES:
                if status.lower() == s.lower():
                    WE.status = s
                    break
            if not WE.status:
                return format_error('Status %s is not a valid WebEntity Status, please provide one of the following values: %s' % (status, ms.WebEntityStatus._NAMES_TO_VALUES.keys()))
        res = self.msclients.sync.updateWebEntity(WE, corpus=corpus)
        if is_error(res):
            return res
        new_WE = self.return_new_webentity(WE.LRUSet[0], True, 'lru', corpus=corpus)
        if is_error(new_WE):
            return new_WE
        for lru in new_WE['lru_prefixes']:
            res = self.handle_lru_precision_exceptions(lru, corpus=corpus)
            if is_error(res):
                return res
        return format_result(new_WE)

    def update_webentity(self, webentity_id, field_name, value, array_behavior=None, array_key=None, array_namespace=None, corpus=DUMMY):
        WE = self.msclients.sync.getWebEntity(webentity_id, corpus=corpus)
        if is_error(WE):
           return format_error("ERROR could not retrieve WebEntity with id %s" % webentity_id)
        try:
            if isinstance(value, list):
                value = [i.encode('utf-8') for i in value]
            else:
                value = value.encode('utf-8')
            if array_behavior:
                if array_key:
                    array_key = array_key.encode('utf-8')
                    tmparr = getattr(WE, field_name, {})
                    if array_namespace:
                        array_namespace = array_namespace.encode('utf-8')
                        tmparr = tmparr[array_namespace] if array_namespace in tmparr else {}
                    arr = tmparr[array_key] if array_key in tmparr else set()
                else:
                    arr = getattr(WE, field_name, set())
                if array_behavior == "push":
                    if isinstance(arr, list):
                        arr.append(value)
                    elif isinstance(arr, set):
                        arr.add(value)
                    if field_name == 'LRUSet':
                        res = self.handle_lru_precision_exceptions(value, corpus=corpus)
                        if is_error(res):
                            return res
                    elif field_name == 'startpages':
                        res = self.handle_url_precision_exceptions(value, corpus=corpus)
                        if is_error(res):
                            return res
                elif array_behavior == "pop":
                    arr.remove(value)
                elif array_behavior == "update":
                    arr = value
                if array_key:
                    tmparr[array_key] = arr
                    if array_namespace:
                        tmparr2 = getattr(WE, field_name, {})
                        tmparr2[array_namespace] = tmparr
                        tmparr = tmparr2
                    arr = tmparr
                setattr(WE, field_name, arr)
            else:
                setattr(WE, field_name, value)
            if len(WE.LRUSet):
                res = self.msclients.sync.updateWebEntity(WE, corpus=corpus)
                if is_error(res):
                    return res
                self.corpora[corpus]['recent_indexes'] += 1
                return format_result("%s field of WebEntity %s updated." % (field_name, res))
            else:
                res = self.msclients.sync.deleteWebEntity(WE, corpus=corpus)
                if is_error(res):
                    return res
                self.corpora[corpus]['recent_indexes'] += 1
                self.corpora[corpus]['total_webentities'] -= 1
                return format_result("webentity %s had no LRUprefix left and was removed." % webentity_id)
        except Exception as x:
            return format_error("ERROR while updating WebEntity : %s" % x)

    def jsonrpc_rename_webentity(self, webentity_id, new_name, corpus=DUMMY):
        if not new_name or new_name == "":
            return format_error("ERROR: please specify a value for the WebEntity's name")
        return self.update_webentity(webentity_id, "name", new_name, corpus=corpus)

    def jsonrpc_change_webentity_id(self, webentity_old_id, webentity_new_id, corpus=DUMMY):
        res = self.update_webentity(webentity_old_id, "id", webentity_new_id, corpus=corpus)
        if is_error(res):
            return format_error('ERROR a WebEntity with id %s already seems to exist' % webentity_new_id)
        res = self.jsonrpc_delete_webentity(webentity_old_id, corpus=corpus)
        if is_error(res):
            return format_error('ERROR a WebEntity with id %s already seems to exist' % webentity_new_id)
        self.corpora[corpus]['total_webentities'] += 1
        return format_result("WebEntity %s was re-ided as %s" % (webentity_old_id, webentity_new_id))

    def jsonrpc_set_webentity_status(self, webentity_id, status, corpus=DUMMY):
        return self.update_webentity(webentity_id, "status", status, corpus=corpus)

    def jsonrpc_set_webentity_homepage(self, webentity_id, homepage, corpus=DUMMY):
        try:
            homepage, _ = urllru.url_clean_and_convert(url)
        except ValueError as e:
            return format_error(e)
        return self.update_webentity(webentity_id, "homepage", homepage, corpus=corpus)

    def add_backend_tags(self, webentity_id, key, value, corpus=DUMMY):
        self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", key, value, corpus=corpus)
        self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", "recrawl_needed", "true", corpus=corpus)

    def jsonrpc_add_webentity_lruprefix(self, webentity_id, lru_prefix, corpus=DUMMY):
        try:
            url, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
        except ValueError as e:
            return format_error(e)
        old_WE = self.msclients.sync.getWebEntityByLRUPrefix(lru_prefix, corpus=corpus)
        if not is_error(old_WE):
            logger.msg("Removing LRUPrefix %s from WebEntity %s" % (lru_prefix, old_WE.name), system="INFO - %s" % corpus)
            res = self.jsonrpc_rm_webentity_lruprefix(old_WE.id, lru_prefix, corpus=corpus)
            if is_error(res):
                return res
        self.add_backend_tags(webentity_id, "lruprefixes_modified", "added %s" % lru_prefix, corpus=corpus)
        res = self.update_webentity(webentity_id, "LRUSet", lru_prefix, "push", corpus=corpus)
        self.corpora[corpus]['recent_indexes'] += 1
        return res

    def jsonrpc_rm_webentity_lruprefix(self, webentity_id, lru_prefix, corpus=DUMMY):
        """ Will delete WebEntity if no LRUprefix left"""
        try:
            url, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
        except ValueError as e:
            return format_error(e)
        self.add_backend_tags(webentity_id, "lruprefixes_modified", "removed %s" % lru_prefix, corpus=corpus)
        res = self.update_webentity(webentity_id, "LRUSet", lru_prefix, "pop", corpus=corpus)
        self.corpora[corpus]['recent_indexes'] += 1
        return res

    def jsonrpc_add_webentity_startpage(self, webentity_id, startpage_url, corpus=DUMMY):
        try:
            startpage_url, _ = urllru.url_clean_and_convert(startpage_url)
        except ValueError as e:
            return format_error(e)
        self.add_backend_tags(webentity_id, "startpages_modified", "added %s" % startpage_url, corpus=corpus)
        return self.update_webentity(webentity_id, "startpages", startpage_url, "push", corpus=corpus)

    def jsonrpc_rm_webentity_startpage(self, webentity_id, startpage_url, corpus=DUMMY):
        try:
            startpage_url, _ = urllru.url_clean_and_convert(startpage_url)
        except ValueError as e:
            return format_error(e)
        self.add_backend_tags(webentity_id, "startpages_modified", "removed %s" % startpage_url, corpus=corpus)
        return self.update_webentity(webentity_id, "startpages", startpage_url, "pop", corpus=corpus)

    def jsonrpc_add_webentity_tag_value(self, webentity_id, tag_namespace, tag_key, tag_value, corpus=DUMMY):
        self.corpora[corpus]['recent_tagging'] = True
        return self.update_webentity(webentity_id, "metadataItems", tag_value, "push", tag_key, tag_namespace, corpus=corpus)

    def jsonrpc_rm_webentity_tag_key(self, webentity_id, tag_namespace, tag_key, corpus=DUMMY):
        return self.jsonrpc_set_webentity_tag_values(webentity_id, tag_namespace, tag_key, [], corpus=corpus)

    def jsonrpc_rm_webentity_tag_value(self, webentity_id, tag_namespace, tag_key, tag_value, corpus=DUMMY):
        self.corpora[corpus]['recent_tagging'] = True
        return self.update_webentity(webentity_id, "metadataItems", tag_value, "pop", tag_key, tag_namespace, corpus=corpus)

    def jsonrpc_set_webentity_tag_values(self, webentity_id, tag_namespace, tag_key, tag_values, corpus=DUMMY):
        if not isinstance(tag_values, list):
            tag_values = list(tag_values)
        self.corpora[corpus]['recent_tagging'] = True
        return self.update_webentity(webentity_id, "metadataItems", tag_values, "update", tag_key, tag_namespace, corpus=corpus)

    def jsonrpc_merge_webentity_into_another(self, old_webentity_id, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False, corpus=DUMMY):
        old_WE = self.msclients.sync.getWebEntity(old_webentity_id, corpus=corpus)
        if is_error(old_WE):
            return format_error('ERROR retrieving WebEntity with id %s' % old_webentity_id)
        res = []
        if test_bool_arg(include_home_and_startpages_as_startpages):
            a = self.jsonrpc_add_webentity_startpage(good_webentity_id, old_WE.homepage)
            res.append(a)
            for page in old_WE.startpages:
                a = self.jsonrpc_add_webentity_startpage(good_webentity_id, page)
                res.append(a)
        if test_bool_arg(include_tags):
            for tag_namespace in old_WE.metadataItems.keys():
                for tag_key in old_WE.metadataItems[tag_namespace].keys():
                    for tag_val in old_WE.metadataItems[tag_namespace][tag_key]:
                        a = self.jsonrpc_add_webentity_tag_value(good_webentity_id, tag_namespace, tag_key, tag_val)
                        res.append(a)
        for lru in old_WE.LRUSet:
            a = self.jsonrpc_rm_webentity_lruprefix(old_webentity_id, lru)
            res.append(a)
            b = self.jsonrpc_add_webentity_lruprefix(good_webentity_id, lru, corpus=corpus)
            res.append(b)
        self.add_backend_tags(good_webentity_id, "alias_added", old_WE.name)
        self.corpora[corpus]['total_webentities'] -= 1
        self.corpora[corpus]['recent_indexes'] += 1
        return format_result(res)

    def jsonrpc_delete_webentity(self, webentity_id, corpus=DUMMY):
        WE = self.msclients.sync.getWebEntity(webentity_id, corpus=corpus)
        if is_error(WE):
            return format_error('ERROR retrieving WebEntity with id %s' % old_webentity_id)
        res = self.msclients.sync.deleteWebEntity(WE, corpus=corpus)
        if is_error(res):
            return res
        self.corpora[corpus]['total_webentities'] -= 1
        self.corpora[corpus]['recent_indexes'] += 1
        return format_result("WebEntity %s (%s) was removed" % (webentity_id, WE.name))

    @inlineCallbacks
    def index_batch(self, page_items, jobid, corpus=DUMMY):
        ids = [bson.ObjectId(str(record['_id'])) for record in page_items]
        nb_crawled_pages = len(ids)
        if (nb_crawled_pages > 0):
            page_items.rewind()
            pages, links = yield threads.deferToThread(processor.generate_cache_from_pages_list, page_items, config["precisionLimit"], self.corpora[corpus]['precision_exceptions'], config['DEBUG'] > 0)
            s=time.time()
            cache_id = yield self.msclients.loop.createCache(pages.values(), corpus=corpus)
            if is_error(cache_id):
                logger.msg(cache_id['message'], system="ERROR - %s" % corpus)
                returnD(False)
            nb_pages = yield self.msclients.loop.indexCache(cache_id, corpus=corpus)
            if is_error(nb_pages):
                logger.msg(nb_pages['message'], system="ERROR - %s" % corpus)
                returnD(False)
            logger.msg("..."+str(nb_pages)+" pages indexed in "+str(time.time()-s)+"s...", system="INFO - %s" % corpus)
            s=time.time()
            nb_links = len(links)
            for link_list in [links[i:i+config['memoryStructure']['max_simul_links_indexing']] for i in range(0, nb_links, config['memoryStructure']['max_simul_links_indexing'])]:
                res = yield self.msclients.loop.saveNodeLinks([ms.NodeLink(source.encode('utf-8'),target.encode('utf-8'),weight) for source,target,weight in link_list], corpus=corpus)
                if is_error(res):
                    logger.msg(res['message'], system="ERROR - %s" % corpus)
                    returnD(False)
            logger.msg("..."+str(nb_links)+" links indexed in "+str(time.time()-s)+"s...", system="INFO - %s" % corpus)
            s=time.time()
            n_WE = yield self.msclients.loop.createWebEntitiesFromCache(cache_id, corpus=corpus)
            if is_error(n_WE):
                logger.msg(nb_WE['message'], system="ERROR - %s" % corpus)
                returnD(False)
            logger.msg("...%s web entities created in %s" % (n_WE, str(time.time()-s))+"s", system="INFO - %s" % corpus)
            self.corpora[corpus]['total_webentities'] += n_WE
            res = yield self.msclients.loop.deleteCache(cache_id, corpus=corpus)
            if is_error(res):
                logger.msg(res['message'], system="ERROR - %s" % corpus)
                returnD(False)
            resdb = self.db['%s.queue' % corpus].remove({'_id': {'$in': ids}}, safe=True)
            if (resdb['err']):
                logger.msg("Pb while cleaning queue in database for job %s: %s" % (jobid, resdb), system="ERROR - %s" % corpus)
                returnD(False)
            tot_crawled_pages = self.db['%s.pages' % corpus].find({'_job': jobid}).count()
            res = self.db['%s.jobs' % corpus].find_and_modify({'_id': jobid}, update={'$inc': {'nb_pages': nb_pages, 'nb_links': nb_links}, '$set': {'nb_crawled_pages': tot_crawled_pages, 'indexing_status': indexing_statuses.BATCH_FINISHED}})
            if not res:
                logger.msg("ERROR updating job %s" % jobid, system="ERROR - %s" % corpus)
                returnD(False)
            jobslog(jobid, "INDEX_"+indexing_statuses.BATCH_FINISHED, self.db, corpus=corpus)

    def jsonrpc_trigger_links(self, corpus=DUMMY):
        self.corpora[corpus]['recent_indexes'] += 105
        return format_result("Links generation should start soon")

    @inlineCallbacks
    def index_batch_loop(self, corpus=DUMMY):
        if self.corpora[corpus]['loop_running']:
            returnD(False)
        self.corpora[corpus]['loop_running'] = True
        crashed = self.db['%s.jobs' % corpus].find_one({'indexing_status': indexing_statuses.BATCH_RUNNING})
        if crashed:
            logger.msg("Indexing job declared as running but probably crashed ,trying to restart it.", system="WARNING - %s" % corpus)
            self.db['%s.jobs' % corpus].update({'_id' : crashed}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}})
            jobslog(crashed, "INDEX_"+indexing_statuses.BATCH_CRASHED, self.db, corpus=corpus)
            self.corpora[corpus]['loop_running'] = False
            returnD(False)
        oldest_page_in_queue = self.db['%s.queue' % corpus].find_one(sort=[('timestamp', pymongo.ASCENDING)], fields=['_job'], skip=random.randint(0, 2))
        # Run linking WebEntities on a regular basis when needed
        if self.corpora[corpus]['recent_indexes'] > 100 or (self.corpora[corpus]['recent_indexes'] and not oldest_page_in_queue) or (self.corpora[corpus]['recent_indexes'] and time.time() - self.corpora[corpus]['last_links_loop'] >= 3600):
            self.corpora[corpus]['loop_running'] = "generating links"
            self.corpora[corpus]['loop_running_since'] = time.time()
            s = time.time()
            logger.msg("Generating links between web entities...", system="INFO - %s" % corpus)
            jobslog("WE_LINKS", "Starting WebEntity links generation...", self.db, corpus=corpus)
            res = yield self.msclients.loop.generateWebEntityLinks(corpus=corpus)
            if is_error(res):
                logger.msg(res['message'], system="ERROR - %s" % corpus)
                self.corpora[corpus]['loop_running'] = False
                returnD(False)
            self.corpora[corpus]['webentities_links'] = res
            s = str(time.time() -s)
            jobslog("WE_LINKS", "...finished WebEntity links generation (%ss)" %s, self.db, corpus=corpus)
            logger.msg("...processed WebEntity links in %ss..." % s, system="INFO - %s" % corpus)
            self.corpora[corpus]['recent_indexes'] = 0
            self.corpora[corpus]['last_links_loop'] = time.time()
        elif oldest_page_in_queue:
            # find next job to be indexed and set its indexing status to batch_running
            job = self.db['%s.jobs' % corpus].find_one({'_id': oldest_page_in_queue['_job'], 'crawling_status': {'$ne': crawling_statuses.PENDING}, 'indexing_status': {'$ne': indexing_statuses.BATCH_RUNNING}}, fields=['_id'], sort=[('timestamp', pymongo.ASCENDING)])
            if not job:
                self.corpora[corpus]['loop_running'] = False
                returnD(False)
            jobid = job['_id']
            logger.msg("Indexing pages from job %s" % jobid, system="INFO - %s" % corpus)
            page_items = self.db['%s.queue' % corpus].find({'_job': jobid}, limit=config['memoryStructure']['max_simul_pages_indexing'], sort=[('timestamp', pymongo.ASCENDING)])
            if (page_items.count(with_limit_and_skip=True)) > 0:
                resdb = self.db['%s.jobs' % corpus].update({'_id': jobid}, {'$set': {'indexing_status': indexing_statuses.BATCH_RUNNING}}, safe=True)
                if (resdb['err']):
                    logger.msg("ERROR updating job %s's indexing status" % jobid, resdb, system="ERROR - %s" % corpus)
                    self.corpora[corpus]['loop_running'] = False
                    returnD(False)
                jobslog(jobid, "INDEX_"+indexing_statuses.BATCH_RUNNING, self.db, corpus=corpus)
                self.corpora[corpus]['loop_running'] = "indexing"
                self.corpora[corpus]['loop_running_since'] = time.time()
                res = yield self.index_batch(page_items, jobid, corpus=corpus)
                if is_error(res):
                    logger.msg(res['message'], system="ERROR - %s" % corpus)
                    self.corpora[corpus]['loop_running'] = False
                    returnD(False)
                self.corpora[corpus]['recent_indexes'] += 1
                self.corpora[corpus]['last_index_loop'] = time.time()
            else:
                logger.msg("job %s found for index but no page corresponding found in queue." % jobid, system="WARNING - %s" % corpus)
        if self.corpora[corpus]['loop_running'] != True:
            logger.msg("...loop run finished.", system="INFO - %s" % corpus)
        self.corpora[corpus]['loop_running'] = None

    def handle_index_error(self, failure, corpus=DUMMY):
        update_ids = [job['_id'] for job in self.db['%s.jobs' % corpus].find({'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'])]
        if len(update_ids):
            self.db['%s.jobs' % corpus].update({'_id' : {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}}, multi=True)
            jobslog(update_ids, "INDEX_"+indexing_statuses.BATCH_CRASHED, self.db, corpus=corpus)
        failure.trap(Exception)
        logger.msg(failure, system="ERROR - %s" % corpus)
        return {'code': 'fail', 'message': failure}

    def jsonrpc_get_precision_exceptions(self, corpus=DUMMY):
        exceptions = self.msclients.sync.getPrecisionExceptions(corpus=corpus)
        if is_error(exceptions):
            return exceptions
        self.corpora[corpus]['precision_exceptions'] = exceptions
        return format_result(exceptions)

    def jsonrpc_remove_precision_exceptions(self, list_exceptions, corpus=DUMMY):
        res = self.msclients.sync.removePrecisionExceptions(list_exceptions, corpus=corpus)
        if is_error(res):
            return res
        for e in list_exceptions:
            self.corpora[corpus]['precision_exceptions'].remove(e)
        return format_result("Precision Exceptions %s removed." % list_exceptions)

    @inlineCallbacks
    def ramcache_webentities(self, corpus=DUMMY):
        WEs = self.corpora[corpus]['webentities']
        if WEs == [] or self.corpora[corpus]['recent_indexes'] or self.corpora[corpus]['last_links_loop'] > self.corpora[corpus]['last_WE_update']:
            WEs = yield self.msclients.pool.getWebEntities(corpus=corpus)
            if is_error(WEs):
                returnD(WEs)
            self.corpora[corpus]['last_WE_update'] = time.time()
            self.corpora[corpus]['webentities'] = WEs
        self.corpora[corpus]['total_webentities'] = len(WEs)
        returnD(WEs)

    def jsonrpc_get_webentity(self, we_id, corpus=DUMMY):
        return self.jsonrpc_get_webentities([we_id], corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentities(self, list_ids=None, light=False, semilight=False, corelinks=False, light_for_csv=False, corpus=DUMMY):
        if not corpus in self.corpora:
            returnD(format_error("Corpus %s is not started" % corpus))
        jobs = {}
        if isinstance(list_ids, unicode):
            list_ids = [list_ids] if list_ids else []
        n_WEs = len(list_ids) if list_ids else 0
        if n_WEs:
            MAX_WE_AT_ONCE = 100
            WEs = []
            for sublist_ids in [list_ids[MAX_WE_AT_ONCE*i : MAX_WE_AT_ONCE*(i+1)] for i in range((n_WEs-1)/MAX_WE_AT_ONCE + 1)]:
                res = yield self.msclients.pool.getWebEntitiesByIDs(sublist_ids, corpus=corpus)
                if is_error(res):
                    returnD(res)
                WEs.extend(res)
            for job in self.db['%s.jobs' % corpus].find({'webentity_id': {'$in': [WE.id for WE in WEs]}}, fields=['webentity_id', 'crawling_status', 'indexing_status'], sort=[('timestamp', pymongo.ASCENDING)]):
                jobs[job['webentity_id']] = job
        else:
            if test_bool_arg(corelinks):
                logger.msg("Collecting WebEntities...", system="INFO - %s" % corpus)
            WEs = yield self.ramcache_webentities(corpus)
            if is_error(WEs):
                returnD(WEs)
            jobs = None
        res = self.format_webentities(WEs, jobs, light, semilight, light_for_csv, corpus=corpus)
        if test_bool_arg(corelinks):
            logger.msg("...got WebEntities, collecting WebEntityLinks...", system="INFO - %s" % corpus)
            res = yield self.msclients.pool.getWebEntityLinks(corpus=corpus)
            if is_error(res):
                returnD(res)
            self.corpora[corpus]['webentities_links'] = res
            logger.msg("...got WebEntityLinks.", system="INFO - %s" % corpus)
            self.corpora[corpus]['loop_running'] = False
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_advanced_search_webentities(self, allFieldsKeywords=[], fieldKeywords=[], corpus=DUMMY):
        afk = []
        fk = []
        if isinstance(allFieldsKeywords, unicode):
            allFieldsKeywords = [allFieldsKeywords]
        if not (isinstance(allFieldsKeywords, list) and isinstance(fieldKeywords, list)):
            returnD(format_error("ERROR: Both arguments must be lists."))
        for k in allFieldsKeywords:
            if not (isinstance(k, unicode)):
                returnD(format_error("ERROR: allFieldsKeywords must be a list of strings."))
            afk.append(k.encode('utf-8'))
        for kv in fieldKeywords:
            if not (isinstance(kv, list) and len(kv) == 2 and ((isinstance(kv[0], unicode) and isinstance(kv[1], unicode)) or (isinstance(kv[0], str) and isinstance(kv[1], str)))):
                returnD(format_error("ERROR: fieldKeywords must be a list of two-string-elements lists. %s" % fieldKeywords))
            fk.append([kv[0].encode('utf-8'), kv[1].encode('utf-8')])
        WEs = yield self.msclients.pool.searchWebEntities(afk, fk, corpus_corpus)
        if is_error(WEs):
            returnD(WEs)
        returnD(format_result(self.format_webentities(WEs, light=True, corpus=corpus)))

    def jsonrpc_escape_search_query(self, query):
        for char in ["\\", "+", "-", "!", "(", ")", ":", "^", "[", "]", "{", "}", "~", "*", "?"]:
            query = query.replace(char, "\\%s" % char)
        return query.replace(' ', '?')

    def _optionnal_field_search(self, query, field=None, corpus=DUMMY):
        if field:
            if not isinstance(field, unicode):
                field = unicode(field)
            return self.jsonrpc_advanced_search_webentities([], [[field, query]], corpus=corpus)
        return self.jsonrpc_advanced_search_webentities([query], corpus=corpus)

    def jsonrpc_exact_search_webentities(self, query, field=None, corpus=DUMMY):
        query = self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, corpus=corpus)

    def jsonrpc_prefixed_search_webentities(self, query, field=None, corpus=DUMMY):
        query = "%s*" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, corpus=corpus)

    def jsonrpc_postfixed_search_webentities(self, query, field=None, corpus=DUMMY):
        query = "*%s" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, corpus=corpus)

    def jsonrpc_free_search_webentities(self, query, field=None, corpus=DUMMY):
        query = "*%s*" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, corpus=corpus)

    def jsonrpc_get_webentities_by_status(self, status, corpus=DUMMY):
        status = status.lower()
        valid_statuses = [s.lower() for s in ms.WebEntityStatus._NAMES_TO_VALUES]
        if status not in valid_statuses:
            returnD(format_error("ERROR: status argument must be one of %s" % ",".join(valid_statuses)))
        return self.jsonrpc_exact_search_webentities(status, 'STATUS', corpus=corpus)

    def jsonrpc_get_webentities_by_name(self, name, corpus=DUMMY):
        return self.jsonrpc_exact_search_webentities(name, 'NAME', corpus=corpus)

    def jsonrpc_get_webentities_by_tag_value(self, value, corpus=DUMMY):
        return self.jsonrpc_exact_search_webentities(value, 'TAG_VALUE', corpus=corpus)

    def jsonrpc_get_webentities_by_tag_category(self, category, corpus=DUMMY):
        return self.jsonrpc_exact_search_webentities(category, 'TAG_CATEGORY', corpus=corpus)

    def jsonrpc_get_webentities_by_user_tag(self, category, value, corpus=DUMMY):
        return self.jsonrpc_exact_search_webentities("USER:%s=%s" % (category, value), 'TAG', corpus=corpus)

    def jsonrpc_get_webentity_by_lruprefix_as_url(self, url, corpus=DUMMY):
        try:
            _, lru = urllru.url_clean_and_convert(url)
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_get_webentity_by_lruprefix(lru, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentity_by_lruprefix(self, lru_prefix, corpus=DUMMY):
        try:
            lru_prefix = urllru.lru_clean(lru_prefix)
        except ValueError as e:
            returnD(format_error(e))
        WE = yield self.msclients.pool.getWebEntityByLRUPrefix(lru_prefix, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        if WE.name == ms_const.DEFAULT_WEBENTITY:
            returnD(format_error("No matching WebEntity found for lruprefix %s" % lru_prefix))
        returnD(format_result(self.format_webentity(WE, corpus=corpus)))

    def jsonrpc_get_webentity_for_url(self, url, corpus=DUMMY):
        try:
            _, lru = urllru.url_clean_and_convert(url)
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_get_webentity_for_url_as_lru(lru, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentity_for_url_as_lru(self, lru, corpus=DUMMY):
        try:
            url, lru = urllru.lru_clean_and_convert(lru)
        except ValueError as e:
            returnD(format_error(e))
        WE = yield self.msclients.pool.findWebEntityMatchingLRUPrefix(lru, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        if WE.name == ms_const.DEFAULT_WEBENTITY:
            returnD(format_error("No matching WebEntity found for url %s" % url))
        returnD(format_result(self.format_webentity(WE, corpus=corpus)))

    @inlineCallbacks
    def ramcache_tags(self, corpus=DUMMY):
        tags = self.corpora[corpus]['tags']
        if tags == {} or self.corpora[corpus]['recent_tagging']:
            tags = yield self.msclients.pool.getTags(corpus=corpus)
            if is_error(tags):
                returnD(tags)
            self.corpora[corpus]['recent_tagging'] = False
            self.corpora[corpus]['tags'] = tags
        returnD(tags)

    @inlineCallbacks
    def jsonrpc_get_tags(self, corpus=DUMMY):
        tags = yield self.ramcache_tags(corpus)
        returnD(format_result(tags))

    @inlineCallbacks
    def jsonrpc_get_tag_namespaces(self, corpus=DUMMY):
        tags = yield self.ramcache_tags(corpus)
        returnD(format_result(tags.keys()))

    @inlineCallbacks
    def jsonrpc_get_tag_categories(self, namespace=None, corpus=DUMMY):
        tags = yield self.ramcache_tags(corpus)
        categories = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                categories |= set(tags[ns].keys())
        returnD(format_result(list(categories)))

    @inlineCallbacks
    def jsonrpc_get_tag_values(self, namespace=None, category=None, corpus=DUMMY):
        tags = yield self.ramcache_tags(corpus)
        values = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                for cat in tags[ns].keys():
                    if not category or (cat == category):
                        values |= set(tags[ns][cat])
        returnD(format_result(list(values)))

    @inlineCallbacks
    def jsonrpc_get_webentity_pages(self, webentity_id, onlyCrawled=True, corpus=DUMMY):
        if onlyCrawled:
            pages = yield self.msclients.pool.getWebEntityCrawledPages(webentity_id, corpus=corpus)
        else:
            pages = yield self.msclients.pool.getWebEntityPages(webentity_id, corpus=corpus)
        if is_error(pages):
            returnD(pages)
        formatted_pages = [{'lru': p.lru, 'sources': list(p.sourceSet), 'crawl_timestamp': p.crawlerTimestamp, 'url': p.url, 'depth': p.depth, 'error': p.errorCode, 'http_status': p.httpStatusCode, 'is_node': p.isNode, 'is_full_precision': p.isFullPrecision, 'creation_date': p.creationDate, 'last_modification_date': p.lastModificationDate} for p in pages]
        returnD(format_result(formatted_pages))

    @inlineCallbacks
    def jsonrpc_get_webentity_by_url(self, url, corpus=DUMMY):
        try:
            lru = urllru.url_to_lru_clean(url)
        except ValueError as e:
            returnD(format_error(e))
        WE = yield self.msclients.pool.findWebEntityMatchingLRUPrefix(lru, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        if WE.name == ms_const.DEFAULT_WEBENTITY:
            returnD(format_error("No matching WebEntity found for url %s" % url))
        returnD(format_result(self.format_webentity(WE, corpus=corpus)))

    @inlineCallbacks
    def jsonrpc_get_webentity_subwebentities(self, webentity_id, corpus=DUMMY):
        res = yield self.get_webentity_relative_webentities(webentity_id, "children", corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentity_parentwebentities(self, webentity_id, corpus=DUMMY):
        res = yield self.get_webentity_relative_webentities(webentity_id, "parents", corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def get_webentity_relative_webentities(self, webentity_id, relative_type="children", corpus=DUMMY):
        if relative_type != "children" and relative_type != "parents":
            returnD(format_error("ERROR: must set relative type as children or parents"))
        jobs = {}
        if relative_type == "children":
            WEs = yield self.msclients.pool.getWebEntitySubWebEntities(webentity_id, corpus=corpus)
        else:
            WEs = yield self.msclients.pool.getWebEntityParentWebEntities(webentity_id, corpus=corpus)
        if is_error(WEs):
            returnD(WEs)
        for job in self.db['%s.jobs' % corpus].find({'webentity_id': {'$in': [WE.id for WE in WEs]}}, fields=['webentity_id', 'crawling_status', 'indexing_status'], sort=[('timestamp', pymongo.ASCENDING)]):
            jobs[job['webentity_id']] = job
        res = self.format_webentities(WEs, jobs, corpus=corpus)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_lru_definedprefixes(self, lru, corpus=DUMMY):
        try:
            lru = urllru.lru_clean(lru)
            parent_prefixes = [lru]
            parent_prefixes.extend(urllru.lru_parent_prefixes(lru))
        except ValueError as e:
            returnD(format_error(e))
        WEs = []
        for prefix in parent_prefixes:
            WE = yield self.msclients.pool.getWebEntityByLRUPrefix(prefix, corpus=corpus)
            if not is_error(WE):
                WEs.append({
                    "lru": prefix,
                    "stems_count": len(urllru.split_lru_in_stems(prefix)),
                    "id": WE.id,
                    "name": WE.name
                })
        returnD(format_result(WEs))

    @inlineCallbacks
    def jsonrpc_get_webentities_network_json(self, corpus=DUMMY):
        res = yield self.generate_network_WEs("json", corpus=corpus)
        returnD(handle_standard_results(res))

    @inlineCallbacks
    def jsonrpc_generate_webentities_network_gexf(self, corpus=DUMMY):
        res = yield self.generate_network_WEs("gexf", corpus=corpus)
        if "code" in res:
            returnD(res)
        returnD(format_result('GEXF graph generation started...'))

    @inlineCallbacks
    def jsonrpc_get_webentity_nodelinks_network_json(self, webentity_id=None, outformat="json", include_external_links=False, corpus=DUMMY):
        if outformat == "gexf":
            returnD(format_error("...GEXF NodeLinks network not implemented yet."))
        s = time.time()
        logger.msg("Generating %s NodeLinks network for WebEntity %s..." % (outformat, webentity_id), system="INFO - %s" % corpus)
        links = yield self.msclients.pool.getWebentityNodeLinks(webentity_id, test_bool_arg(include_external_links), corpus=corpus)
        if is_error(links):
            returnD(format_error(links))
        res = [[l.sourceLRU, l.targetLRU, l.weight] for l in links]
        logger.msg("...JSON network generated in %ss" % str(time.time()-s), system="INFO - %s" % corpus)
        returnD(format_result(res))

    @inlineCallbacks
    def get_webentity_with_pages_and_subWEs(self, webentity_id, all_pages_as_startpoints=False, corpus=DUMMY):
        WE = yield self.msclients.pool.getWebEntity(webentity_id, corpus=corpus)
        if is_error(WE):
            returnD(format_error("No WebEntity with id %s found" % webentity_id))
        res = {'status': WE.status, 'lrus': list(WE.LRUSet), 'pages': [urllru.lru_to_url(lr) for lr in WE.LRUSet], 'subWEs': []}
        if test_bool_arg(all_pages_as_startpoints):
            pages = yield self.msclients.pool.getWebEntityCrawledPages(WE.id, corpus=corpus)
            if is_error(pages):
                returnD(pages)
            if pages:
                res['pages'] = [p.url for p in pages]
        else:
            res['pages'] = list(WE.startpages)
        subs = yield self.msclients.pool.getWebEntitySubWebEntities(WE.id, corpus=corpus)
        if is_error(subs):
            returnD(subs)
        if subs:
            res['subWEs'] = [lr for subwe in subs for lr in subwe.LRUSet]
        returnD(res)

    @inlineCallbacks
    def generate_network_WEs(self, outformat="json", corpus=DUMMY):
        s = time.time()
        logger.msg("Generating %s WebEntities network..." % outformat, system="INFO - %s" % corpus)
        if self.corpora[corpus]['webentities_links'] == []:
            links = yield self.msclients.loop.getWebEntityLinks(corpus=corpus)
            if is_error(links):
                logger.msg(links['message'], system="ERROR - %s" % corpus)
                returnD(False)
            self.corpora[corpus]['webentities_links'] = links
        if outformat == "gexf":
            WEs = yield self.ramcache_webentities(corpus)
            if is_error(WEs):
                logger.msg(WEs['message'], system="ERROR - %s" % corpus)
                returnD(False)
            WEs_metadata = {}
            for WE in WEs:
                date = ''
                if WE.lastModificationDate:
                    date = WE.lastModificationDate
                elif WE.creationDate:
                    date = WE.creationDate
                pages = yield self.msclients.pool.getWebEntityCrawledPages(WE.id, corpus=corpus)
                if is_error(pages):
                    logger.msg(pages['message'], system="ERROR - %s" % corpus)
                    returnD(False)
                WEs_metadata[WE.id] = {"name": WE.name, "date": date, "LRUSet": ",".join(WE.LRUSet), "nb_crawled_pages": len(pages), "nb_intern_links": 0}
                WE_links = yield self.msclients.pool.getWebEntityLinksByWebEntitySource(WE.id, corpus=corpus)
                if is_error(WE_links):
                    logger.msg(WE_links['message'], system="ERROR - %s" % corpus)
                    returnD(False)
                for link in WE_links:
                    if link.targetId == WE.id:
                        WEs_metadata[WE.id]['nb_intern_links'] = link.weight
            gexf.write_WEs_network_from_MS(self.corpora[corpus]['webentities_links'], WEs_metadata, 'test_welinks.gexf')
            logger.msg("...GEXF network generated in test_welinks.gexf in "+str(time.time()-s), system="INFO - %s" % corpus)
            returnD(None)
        elif outformat == "json":
            res = [[link.sourceId, link.targetId, link.weight] for link in self.corpora[corpus]['webentities_links']]
            logger.msg("...JSON network generated in %ss" % str(time.time()-s), system="INFO - %s" % corpus)
            returnD(res)

def test_connexions():
# TEST API SANITY
    try:
        run = Core()
    except Exception as x:
        print "ERROR: Cannot start API, something should probbaly not have been pushed..."
        if config['DEBUG']:
            print type(x), x
        return None
# MONGO
    try:
        reactor.addSystemEventTrigger('before', 'shutdown', run.close)
        # clean possible previous crash
        update_ids = [job['_id'] for job in run.db['%s.jobs' % DUMMY].find({'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'])]
        if len(update_ids):
            run.db['%s.jobs' % DUMMY].update({'_id' : {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}}, multi=True)
            jobslog(update_ids, "INDEX_"+indexing_statuses.BATCH_CRASHED, run.db, corpus=DUMMY)
    except Exception as x:
        print "ERROR: Cannot connect to mongoDB, please check your server and the configuration in config.json."
        if config['DEBUG']:
            print x
        return None
# SCRAPY
    if 'phantom' not in config:
        print "ERROR: Hyphe's newest version requires to set up phantom in your configuration, please copy paste and adapt it from config/config.json.example"
        return None
    res = run.crawler.send_scrapy_query('delproject', {'project': corpus_project(DUMMY)})
    if is_error(res):
        print "WARNING: Could not delete existing version of HCI's scrapy spider"
        print res['message']
        print "Trying to deploy anyway"
    try:
        run.crawler.deploy_spider()
    except Exception as e:
        print "ERROR: Could not connect to scrapyd server to deploy spider, please check your server and the configuration in config.json."
        print e
        return None
# INIT DUMMY CORPUS
    try:
        now = time.time()
        run.jsonrpc_create_corpus()
        res = run.store.msclients.sync.ping(corpus=DUMMY)
        while is_error(res) and time.time() - now < 10:
            time.sleep(0.3)
            res = run.store.msclients.sync.ping(corpus=DUMMY)
        if is_error(res):
            print res
            raise Exception(res['message'])
    except Exception as x:
        print "ERROR: Cannot create dummy corpus %s" % DUMMY
        if config['DEBUG']:
            print x
        return None
# INIT DEFAULT CREATION RULE
    try:
        res = run.store.ensureDefaultCreationRuleExists()
        if is_error(res):
            raise Exception(res['message'])
    except Exception as x:
        print "ERROR: Cannot save default web entity into memory structure."
        if config['DEBUG']:
            print x
        return None
# CLEANUP DUMMY CORPUS
    try:
        res = run.jsonrpc_stop_corpus()
        if is_error(res):
            raise Exception(res['message'])
        del(run.store.msclients.corpora[DUMMY])
    except Exception as x:
        print "ERROR: Cannot close dummy corpus %s" % DUMMY
        if config['DEBUG']:
            print x
        return None
    return run

core = test_connexions()
if not core:
    exit(1)

# JSON-RPC interface
core.putSubHandler('crawl', core.crawler)
core.putSubHandler('store', core.store)
core.putSubHandler('system', Introspection(core))
site = server.Site(core)

# Run as 'python core.tac' ...
if __name__ == '__main__':
    reactor.listenTCP(config['twisted']['port'], site)
    reactor.run()
# ... or in the background when called with 'twistd -noy core.tac'
elif __name__ == '__builtin__':
    application = service.Application("Hyphe backend API Server")
    server = internet.TCPServer(config['twisted']['port'], site)
    server.setServiceParent(application)

