#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, sys, time, random, types, json, bson
import urllib, urllib2, httplib, urlparse
import pymongo
from txjsonrpc import jsonrpclib
from txjsonrpc.jsonrpc import Introspection
from txjsonrpc.web import jsonrpc
from twisted.web import server
from twisted.python import log
from twisted.application import service, internet
from twisted.internet import reactor, defer, task, threads
from twisted.internet.defer import inlineCallbacks, returnValue as returnD
from thrift.Thrift import TException
from thrift.transport.TSocket import TSocket
from hyphe_backend import processor
from hyphe_backend.memorystructure import MemoryStructure as ms
from hyphe_backend.memorystructure.ttypes import *
from hyphe_backend.lib import config_hci, urllru, gexf, user_agents
from hyphe_backend.lib.thriftpool import *
from hyphe_backend.lib.jsonrpc_utils import *

config = config_hci.load_config()
if not config:
    exit()

if config['DEBUG']:
    defer.setDebugging(True)

class Enum(set):
    def __getattr__(self, name):
        if name in self:
            return name
        raise AttributeError
crawling_statuses = Enum(['UNCRAWLED', 'PENDING', 'RUNNING', 'FINISHED', 'CANCELED'])
indexing_statuses = Enum(['UNINDEXED', 'PENDING', 'BATCH_RUNNING', 'BATCH_FINISHED', 'BATCH_CRASHED', 'FINISHED', 'CANCELED'])

def jobslog(jobid, msg, db, timestamp=None):
    if timestamp is None:
        timestamp = int(time.time()*1000)
    if isinstance(jobid, types.ListType):
        return db[config['mongo-scrapy']['jobLogsCol']].insert([{'_job': _id, 'timestamp': timestamp, 'log': msg} for _id in jobid])
    return db[config['mongo-scrapy']['jobLogsCol']].insert({'_job': jobid, 'timestamp': timestamp, 'log': msg})

def format_result(res, nolog=True):
    if not nolog and config['DEBUG'] and len(str(res)) < 1000:
        print res
    return format_success(res)

def handle_standard_results(res):
    if is_error(res):
        return res
    return format_success(res)

class Core(jsonrpc.JSONRPC):

    addSlash = True

    def __init__(self):
        jsonrpc.JSONRPC.__init__(self)
        self.db = pymongo.Connection(config['mongo-scrapy']['host'],config['mongo-scrapy']['mongo_port'])[config['mongo-scrapy']['project']]
        self.crawler = Crawler(self.db, self)
        self.store = Memory_Structure(self.db, self)
        self.monitor_loop = task.LoopingCall(self.refresh_jobs)
        self.monitor_loop.start(1, False)

    def close(self):
        self.monitor_loop.stop()
        self.store.close()

    def render(self, request):
        request.setHeader("Access-Control-Allow-Origin", "*")
        if config['DEBUG']:
            print "QUERY: %s" % request.content.read()
        return jsonrpc.JSONRPC.render(self, request)

    def _cbRender(self, result, request, id, version):
        if config['DEBUG'] == 2:
            txt = jsonrpclib.dumps(result, id=id, version=2.0)
            print "RESULT: %s%s" % (txt[:1000], " ... [%d cars truncated]" % (len(txt)-1000) if len(txt) > 1000 else '')
        return jsonrpc.JSONRPC._cbRender(self, result, request, id, version)

    def jsonrpc_ping(self):
        return format_result('pong')

    def jsonrpc_reinitialize(self):
        """Reinitializes both crawl jobs and memory structure."""
        self.monitor_loop.stop()
        res = self.crawler.jsonrpc_reinitialize()
        self.monitor_loop.start(1, False)
        if is_error(res):
            return res
        res = self.store.jsonrpc_reinitialize()
        if is_error(res):
            return res
        return format_result('Memory structure and crawling database contents emptied.')

    def refresh_jobs(self):
        """Runs a monitoring task on the list of jobs in the database to update their status from scrapy API and indexing tasks."""
        scrapyjobs = self.crawler.jsonrpc_list()
        if is_error(scrapyjobs):
            return scrapyjobs
        scrapyjobs = scrapyjobs['result']
        # clean lost jobs
        if len(scrapyjobs['running']) + len(scrapyjobs['pending']) == 0:
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'crawling_status': {'$in': [crawling_statuses.PENDING, crawling_statuses.RUNNING]}}, {'$set': {'crawling_status': crawling_statuses.FINISHED}}, multi=True, safe=True)
            if (resdb['err']):
                print "ERROR updating lost jobs crawling_statuses", resdb
                return
        # clean canceled jobs
        resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'crawling_status': crawling_statuses.CANCELED}, {'$set': {'indexing_status': indexing_statuses.CANCELED}}, multi=True, safe=True)
        if (resdb['err']):
            print "ERROR updating canceled jobs indexing_statuses", resdb
            return
        # update jobs crawling status accordingly to crawler's statuses
        running_ids = [job['id'] for job in scrapyjobs['running']]
        for job_id in running_ids:
            crawled_pages = self.db[config['mongo-scrapy']['pageStoreCol']].find({'_job': job_id}).count()
            self.db[config['mongo-scrapy']['jobListCol']].update({'_id': job_id}, {'$set': {'nb_crawled_pages': crawled_pages}})
        update_ids = [job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'_id': {'$in': running_ids}, 'crawling_status': crawling_statuses.PENDING}, fields=['_id'])]
        if len(update_ids):
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': {'$in': update_ids}}, {'$set': {'crawling_status': crawling_statuses.RUNNING}}, multi=True, safe=True)
            if (resdb['err']):
                print "ERROR updating running crawling jobs statuses", update_ids, resdb
                return
            jobslog(update_ids, "CRAWL_"+crawling_statuses.RUNNING, self.db)
        # update crawling status for finished jobs
        finished_ids = [job['id'] for job in scrapyjobs['finished']]
        update_ids = [job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'_id': {'$in': finished_ids}, 'crawling_status': {'$nin': [crawling_statuses.CANCELED, crawling_statuses.FINISHED]}}, fields=['_id'])]
        if len(update_ids):
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': {'$in': update_ids}}, {'$set': {'crawling_status': crawling_statuses.FINISHED}}, multi=True, safe=True)
            if (resdb['err']):
                print "ERROR updating finished crawling jobs statuses", update_ids, resdb
                return
            jobslog(update_ids, "CRAWL_"+crawling_statuses.FINISHED, self.db)
        # collect list of crawling jobs whose outputs is not fully indexed yet
        jobs_in_queue = self.db[config['mongo-scrapy']['queueCol']].distinct('_job')
        # set index finished for jobs with crawling finished and no page left in queue
        finished_ids = set([job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'crawling_status': crawling_statuses.FINISHED})] + finished_ids)
        update_ids = [job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'_id': {'$in': list(finished_ids-set(jobs_in_queue))}, 'crawling_status': crawling_statuses.FINISHED, 'indexing_status': {'$nin': [indexing_statuses.BATCH_RUNNING, indexing_statuses.FINISHED]}}, fields=['_id'])]
        if len(update_ids):
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.FINISHED}}, multi=True, safe=True)
            if (resdb['err']):
                print "ERROR updating finished indexing jobs statuses", update_ids, resdb
                return
            jobslog(update_ids, "INDEX_"+indexing_statuses.FINISHED, self.db)
        return self.jsonrpc_listjobs()

    def jsonrpc_listjobs(self, list_ids=None):
        query = {}
        if list_ids:
            query = {'_id': {'$in': list_ids}}
        return format_result(list(self.db[config['mongo-scrapy']['jobListCol']].find(query, sort=[('crawling_status', pymongo.ASCENDING), ('indexing_status', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)])))

    def jsonrpc_declare_page(self, url, corpus=''):
        return handle_standard_results(self.store.declare_page(url))

    def jsonrpc_declare_pages(self, list_urls, corpus=''):
        res = []
        errors = []
        for url in list_urls:
            WE = self.jsonrpc_declare_page(url)
            if is_error(WE):
                errors.append({'url': url, 'error': WE['message']})
            else:
                res.append(WE['result'])
        if len(errors):
            return {'code': 'fail', 'message': '%d urls failed, see details in "errors" field and successes in "results" field.' % len(errors), 'errors': errors, 'results': res}
        return format_result(res)

    def _prepare_conn(self, prot, host, timeout):
        if prot.endswith("s"):
            conn = httplib.HTTPSConnection(host, timeout=timeout)
        else:
            conn = httplib.HTTPConnection(host, timeout=timeout)
        return conn

    def jsonrpc_lookup_httpstatus(self, url, timeout=2):
        res = format_result(0)
        try:
            prot, host, path, _, query = urlparse.urlparse(url)[0:5]
            host = host.lower()
            conn = self._prepare_conn(prot, host, timeout)
            if query != "":
                query = "?%s" % query
            conn.request('HEAD', "%s%s" % (path, query))
            response = conn.getresponse()
            if response.status != 200:
                conn = self._prepare_conn(prot, host, timeout)
                conn.request('GET', "%s%s" % (path, query), headers= {'User-Agent': user_agents.agents[random.randint(0, len(user_agents.agents) - 1)], 'Accept': '*/*', 'Accept-Encoding': '*', 'Accept-Charset': '*'})
                response = conn.getresponse()
            res['result'] = response.status
        except socket.gaierror as e:
            res['message'] = "DNS not found for url %s : %s" % (url, e)
        except Exception as e:
            res['result'] = -1
            res['message'] = "Cannot process url %s : %s." % (url, e)
        return res

    def jsonrpc_lookup(self, url, timeout=2):
        res = self.jsonrpc_lookup_httpstatus(url, timeout)
        if res['code'] == 'success' and (res['result'] == 200 or 300 < res['result'] < 400):
            return format_result("true")
        return format_result("false")

    def jsonrpc_get_status(self):
        crawls = self.crawler.jsonrpc_list()
        pages = self.db[config['mongo-scrapy']['queueCol']].count()
        crawled = self.db[config['mongo-scrapy']['pageStoreCol']].count()
        jobs = list(self.db[config['mongo-scrapy']['jobListCol']].find(fields=['nb_pages', 'nb_links']))
        found_pages = sum([j['nb_pages'] for j in jobs])
        found_links = sum([j['nb_links'] for j in jobs])
        res = {'crawler': {'jobs_pending': len(crawls['result']['pending']),
                           'jobs_running': len(crawls['result']['running']),
                           'pages_crawled': crawled,
                           'pages_found': found_pages,
                           'links_found': found_links},
               'memory_structure': {'job_running': self.store.loop_running,
                                    'job_running_since': self.store.loop_running_since*1000,
                                    'last_index': self.store.last_index_loop*1000,
                                    'last_links_generation': self.store.last_links_loop*1000,
                                    'pages_to_index': pages,
                                    'webentities': self.store.total_webentities}}
        return format_result(res)

    @inlineCallbacks
    def jsonrpc_crawl_webentity(self, webentity_id, maxdepth=None, use_all_pages_as_startpages=False, use_prefixes_as_startpages=False):
        """Tells scrapy to run crawl on a WebEntity defined by its id from memory structure."""
        if not maxdepth:
            maxdepth = config['mongo-scrapy']['maxdepth']
        WE = yield self.store.get_webentity_with_pages_and_subWEs(webentity_id, use_all_pages_as_startpages)
        if test_bool_arg(use_prefixes_as_startpages) and not test_bool_arg(use_all_pages_as_startpages):
            WE['pages'] = [urllru.lru_to_url(lru) for lru in WE['lrus']]
        if is_error(WE):
            returnD(WE)
        if WE['status'] == "DISCOVERED":
            yield self.store.jsonrpc_set_webentity_status(webentity_id, "UNDECIDED")
        yield self.store.jsonrpc_rm_webentity_tag_value(webentity_id, "CORE", "recrawl_needed", "true")
        res = yield self.crawler.jsonrpc_start(webentity_id, WE['pages'], WE['lrus'], WE['subWEs'], config['discoverPrefixes'], maxdepth)
        returnD(res)

    def jsonrpc_get_webentity_logs(self, webentity_id):
        jobs = self.db[config['mongo-scrapy']['jobListCol']].find({'webentity_id': webentity_id}, fields=['_id'], order=[('timestamp', pymongo.ASCENDING)])
        if not jobs.count():
            return format_error('No job found for WebEntity %s.' % webentity_id)
        res = self.db[config['mongo-scrapy']['jobLogsCol']].find({'_job': {'$in': [a['_id'] for a in list(jobs)]}}, order=[('timestamp', pymongo.ASCENDING)])
        return format_result([{'timestamp': log['timestamp'], 'job': log['_job'], 'log': log['log']} for log in list(res)])


class Crawler(jsonrpc.JSONRPC):

    scrapy_url = 'http://%s:%s/' % (config['mongo-scrapy']['host'], config['mongo-scrapy']['scrapy_port'])

    def __init__(self, db=None, parent=None):
        jsonrpc.JSONRPC.__init__(self)
        self.parent = parent
        self.db = db
        self.init_indexes()

    def init_indexes(self):
        self.db[config['mongo-scrapy']['pageStoreCol']].ensure_index([('timestamp', pymongo.ASCENDING)], safe=True)
        self.db[config['mongo-scrapy']['queueCol']].ensure_index([('timestamp', pymongo.ASCENDING)], safe=True)
        self.db[config['mongo-scrapy']['queueCol']].ensure_index([('_job', pymongo.ASCENDING), ('timestamp', pymongo.DESCENDING)], safe=True)
        self.db[config['mongo-scrapy']['jobLogsCol']].ensure_index([('timestamp', pymongo.ASCENDING)], safe=True)
        self.db[config['mongo-scrapy']['jobListCol']].ensure_index([('crawling_status', pymongo.ASCENDING), ('indexing_status', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)], safe=True)

    def jsonrpc_cancel_all(self):
        """Stops all current crawls."""
        list_jobs = self.jsonrpc_list()
        if is_error(list_jobs):
            return list_jobs
        list_jobs = list_jobs['result']
        for item in list_jobs['running'] + list_jobs['pending']:
            res = self.jsonrpc_cancel(item['id'])
            if config['DEBUG']:
                print res
        while 'running' in list_jobs and len(list_jobs['running']):
            list_jobs = self.jsonrpc_list()
            if not is_error(list_jobs):
                list_jobs = list_jobs['result']
        return format_result('All crawling jobs canceled.')

    def jsonrpc_reinitialize(self, corpus=''):
        """Cancels all current crawl jobs running or planned and empty mongodbs."""
        print "Empty crawl list + mongodb queue"
        canceljobs = self.jsonrpc_cancel_all()
        if is_error(canceljobs):
            return canceljobs
        try:
            self.db[config['mongo-scrapy']['queueCol']].drop()
            self.db[config['mongo-scrapy']['pageStoreCol']].drop()
            self.db[config['mongo-scrapy']['jobListCol']].drop()
            self.db[config['mongo-scrapy']['jobLogsCol']].drop()
            self.init_indexes()
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

    def jsonrpc_start(self, webentity_id, starts, follow_prefixes, nofollow_prefixes, discover_prefixes=config['discoverPrefixes'], maxdepth=config['mongo-scrapy']['maxdepth'], download_delay=config['mongo-scrapy']['download_delay'], corpus=''):
        """Starts a crawl with scrapy from arguments using a list of urls and of lrus for prefixes."""
        if len(starts) < 1:
            return format_error('No startpage defined for crawling WebEntity %s.' % webentity_id)
        # preparation of the request to scrapyd
        args = {'project': config['mongo-scrapy']['project'],
                  'spider': 'pages',
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
            jobslog(res['jobid'], "CRAWL_ADDED", self.db, ts)
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': res['jobid']}, {'$set': {'webentity_id': webentity_id, 'nb_crawled_pages': 0, 'nb_pages': 0, 'nb_links': 0, 'crawl_arguments': args, 'crawling_status': crawling_statuses.PENDING, 'indexing_status': indexing_statuses.PENDING, 'timestamp': ts}}, upsert=True, safe=True)
            if (resdb['err']):
                print "ERROR saving crawling job %s in database for WebEntity %s with arguments %s" % (res['jobid'], webentity_id, args), resdb
                return format_error(resdb['err'])
        return format_result(res)

    def jsonrpc_cancel(self, job_id):
        """Cancels a scrapy job with id job_id."""
        print "Cancel crawl : ", job_id
        args = {'project': config['mongo-scrapy']['project'],
                  'job': job_id}
        res = self.send_scrapy_query('cancel', args)
        if is_error(res):
            return res
        res = res['result']
        if 'prevstate' in res:
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': job_id}, {'$set': {'crawling_status': crawling_statuses.CANCELED}}, safe=True)
            if (resdb['err']):
                 print "ERROR updating job %s in database" % job_id, resdb
                 return format_error(resdb['err'])
            jobslog(job_id, "CRAWL_"+crawling_statuses.CANCELED, self.db)
        return format_result(res)

    def jsonrpc_list(self):
        """Calls Scrappy monitoring API, returns list of scrapy jobs."""
        return self.send_scrapy_query('listjobs', {'project': config['mongo-scrapy']['project']})

    def jsonrpc_get_job_logs(self, job_id):
        res = self.db[config['mongo-scrapy']['jobLogsCol']].find({'_job': job_id}, fields=['timestamp', 'log'], order=[('timestamp', pymongo.ASCENDING)])
        if not res.count():
            return format_error('No log found for job %s.' % job_id)
        return format_result([{'timestamp': log['timestamp'], 'log': log['log']} for log in res])


class Memory_Structure(jsonrpc.JSONRPC):

    def __init__(self, db=None, parent=None):
        jsonrpc.JSONRPC.__init__(self)
        self.db = db
        self.parent = parent
        self.msclient_loop = ThriftASyncClient(ms.Client, config['memoryStructure']['thrift.host'], config['memoryStructure']['thrift.port'])
        self.msclient_pool = ThriftPooledClient(ms.Client, config['memoryStructure']['thrift.host'], config['memoryStructure']['thrift.port'])
        self.msclient_sync = ThriftSyncClient(ms.Client, config['memoryStructure']['thrift.host'], config['memoryStructure']['thrift.port'])
        self.index_loop = task.LoopingCall(self.index_batch_loop)
        self._start_loop()

    def close(self):
        self.msclient_loop.close()
        self.msclient_pool.close()
        self.msclient_sync.close()
        if self.index_loop.running:
            self.index_loop.stop()

    def _start_loop(self):
        self.webentities = []
        self.total_webentities = -1
        self.last_WE_update = 0
        self.webentities_links = []
        self.tags = {}
        self.recent_tagging = True
        threads.deferToThread(self.jsonrpc_get_precision_exceptions)
        self.loop_running_since = time.time()
        self.last_links_loop = time.time()
        self.last_index_loop = time.time()
        self.recent_indexes = 0
        self.loop_running = "Collecting WebEntities & WebEntityLinks"
        reactor.callLater(0, self.jsonrpc_get_webentities, light=True, corelinks=True)
        reactor.callLater(5, self.index_loop.start, 1, True)

    def format_webentity(self, WE, jobs=None, light=False, semilight=False, light_for_csv=False):
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
            # pages = yield self.msclient_pool.getPagesFromWebEntity(WE.id)
            # nb_pages = len(pages)
            # nb_links
            job = None
            if not jobs:
                job = self.db[config['mongo-scrapy']['jobListCol']].find_one({'webentity_id': WE.id}, fields=['crawling_status', 'indexing_status'], sort=[('timestamp', pymongo.DESCENDING)])
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

    def format_webentities(self, WEs, jobs=None, light=False, semilight=False, light_for_csv=False):
        return [self.format_webentity(WE, jobs, light, semilight, light_for_csv) for WE in WEs]

    def reset(self):
        print "Empty memory structure content"
        self.msclient_sync.clearIndex()
        self.ensureDefaultCreationRuleExists()

    def jsonrpc_delete_nodelinks(self):
        self.recent_indexes += 1
        return handle_standard_results(self.msclient_sync.deleteNodeLinks())

    def ensureDefaultCreationRuleExists(self):
        rules = self.msclient_sync.getWebEntityCreationRules()
        if is_error(rules) or len(rules) == 0:
            print "Saves default WE creation rule"
            self.msclient_sync.saveWebEntityCreationRule(WebEntityCreationRule(config['defaultWebEntityCreationRule']['regexp'], config['defaultWebEntityCreationRule']['prefix']))

    def jsonrpc_reinitialize(self):
        try:
            self.index_loop.stop()
            self.reset()
            self._start_loop()
            return format_result("Memory structure reinitialized.")
        except:
            return format_error("Service initialization not finished. Please retry in a second.")

    def return_new_webentity(self, lru_prefix, new=False, source=None):
        WE = self.msclient_sync.findWebEntityMatchingLRU(lru_prefix)
        if is_error(WE):
            return WE
        if test_bool_arg(new):
            self.recent_indexes += 1
            self.total_webentities += 1
            if source:
                self.jsonrpc_add_webentity_tag_value(WE.id, 'CORE', 'user_created_via', source)
        WE = self.format_webentity(WE)
        WE['created'] = True if new else False
        return WE

    def handle_url_precision_exceptions(self, url):
        lru = urllru.url_to_lru_clean(url)
        self.handle_lru_precision_exceptions(lru)

    def handle_lru_precision_exceptions(self, lru_prefix):
        lru_head = urllru.getLRUHead(lru_prefix, self.precision_exceptions)
        if not urllru.isLRUNode(lru_prefix, config["precisionLimit"], lru_head=lru_head) and lru_prefix.strip('|') != lru_head:
            self.msclient_sync.markPrecisionExceptions([lru_prefix])
            self.precision_exceptions.append(lru_prefix)

    def declare_page(self, url):
        url = urllru.fix_missing_http(url)
        try:
            lru = urllru.url_to_lru_clean(url)
        except ValueError as e:
            return format_error(e)
        self.handle_lru_precision_exceptions(lru)
        is_node = urllru.isLRUNode(lru, config["precisionLimit"], self.precision_exceptions)
        is_full_precision = urllru.isFullPrecision(lru, self.precision_exceptions)
        t = str(int(time.time()*1000))
        page = PageItem("%s/%s" % (lru, t), url, lru, t, None, -1, None, ['USER'], is_full_precision, is_node, {})
        cache_id = self.msclient_sync.createCache([page])
        if is_error(cache_id):
            return cache_id
        res = self.msclient_sync.indexCache(cache_id)
        if is_error(res):
            return res
        new = self.msclient_sync.createWebEntities(cache_id)
        if is_error(new):
            return new
        return self.return_new_webentity(lru, new, 'page')

    def jsonrpc_declare_webentity_by_lru_prefix_as_url(self, url):
        try:
            lru_prefix = urllru.url_to_lru(urllru.fix_missing_http(url))
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_declare_webentity_by_lru(lru_prefix)

    def _check_lru_prefix(self, lru_prefix):
        try:
            lru_prefix = urllru.cleanLRU(lru_prefix)
            url = urllru.lru_to_url(lru_prefix)
        except ValueError as e:
            return format_error(e)
        existing = self.msclient_sync.findWebEntityByLRUPrefix(lru_prefix)
        if not is_error(existing):
            return format_error('LRU prefix "%s" is already set to an existing WebEntity : %s' % (lru_prefix, existing))
        return lru_prefix, url

    def _create_and_return_webentity(self, WE):
        res = self.msclient_sync.updateWebEntity(WE)
        if is_error(res):
            return res
        new_WE = self.return_new_webentity(WE.LRUSet[0], True, 'lru')
        if is_error(new_WE):
            return new_WE
        for lru in new_WE['lru_prefixes']:
            self.handle_lru_precision_exceptions(lru)
        return format_result(new_WE)

    def jsonrpc_declare_webentity_by_lru(self, lru_prefix):
        res = self._check_lru_prefix(lru_prefix)
        if is_error(res):
            return res
        lru_prefix, url = res
        return self._create_and_return_webentity(WebEntity(None, [lru_prefix], urllru.url_shorten(url)))

    def jsonrpc_declare_webentity_by_lrus(self, list_lrus, name=None):
        if not isinstance(list_lrus, list):
            list_lrus = [list_lrus]
        lru_prefixes_list = []
        for lru in list_lrus:
            res = self._check_lru_prefix(lru)
            if is_error(res):
                return res
            lru_prefix, url = res
            if not name:
                name = urllru.url_shorten(url)
            lru_prefixes_list.append(lru_prefix)
        return self._create_and_return_webentity(WebEntity(None, lru_prefixes_list, name))

    def update_webentity(self, webentity_id, field_name, value, array_behavior=None, array_key=None, array_namespace=None):
        WE = self.msclient_sync.getWebEntity(webentity_id)
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
                    arr.add(value)
                    if field_name == 'LRUSet':
                        self.handle_lru_precision_exceptions(value)
                    elif field_name == 'startpages':
                        self.handle_url_precision_exceptions(value)
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
                res = self.msclient_sync.updateWebEntity(WE)
                if is_error(res):
                    return res
                self.recent_indexes += 1
                return format_result("%s field of WebEntity %s updated." % (field_name, res))
            else:
                res = self.msclient_sync.deleteWebEntity(WE)
                if is_error(res):
                    return res
                self.recent_indexes += 1
                self.total_webentities -= 1
                return format_result("webentity %s had no LRUprefix left and was removed." % webentity_id)
        except Exception as x:
            return format_error("ERROR while updating WebEntity : %s" % x)

    def jsonrpc_rename_webentity(self, webentity_id, new_name):
        if not new_name or new_name == "":
            return format_error("ERROR: please specify a value for the WebEntity's name")
        return self.update_webentity(webentity_id, "name", new_name)

    def jsonrpc_set_webentity_status(self, webentity_id, status):
        return self.update_webentity(webentity_id, "status", status)

    def jsonrpc_set_webentity_homepage(self, webentity_id, homepage):
        homepage = urllru.fix_missing_http(homepage)
        try:
            urllru.url_to_lru(homepage)
        except ValueError as e:
            return format_error(e)
        return self.update_webentity(webentity_id, "homepage", homepage)

    def add_backend_tags(self, webentity_id, key, value):
        self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", key, value)
        self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", "recrawl_needed", "true")

    def jsonrpc_add_webentity_lruprefix(self, webentity_id, lru_prefix):
        try:
            lru_prefix = urllru.cleanLRU(lru_prefix)
            url = urllru.lru_to_url(lru_prefix)
        except ValueError as e:
            return format_error(e)
        old_WE = self.msclient_sync.findWebEntityByLRUPrefix(lru_prefix)
        if not is_error(old_WE):
            print "Removing LRUPrefix %s from WebEntity %s" % (lru_prefix, old_WE.name)
            res = self.jsonrpc_rm_webentity_lruprefix(old_WE.id, lru_prefix)
            if is_error(res):
                return res
        self.add_backend_tags(webentity_id, "lruprefixes_modified", "added %s" % lru_prefix)
        res = self.update_webentity(webentity_id, "LRUSet", lru_prefix, "push")
        self.recent_indexes += 1
        return res

    def jsonrpc_rm_webentity_lruprefix(self, webentity_id, lru_prefix):
        """ Will delete WebEntity if no LRUprefix left"""
        try:
            lru_prefix = urllru.cleanLRU(lru_prefix)
            url = urllru.lru_to_url(lru_prefix)
        except ValueError as e:
            return format_error(e)
        self.add_backend_tags(webentity_id, "lruprefixes_modified", "removed %s" % lru_prefix)
        res = self.update_webentity(webentity_id, "LRUSet", lru_prefix, "pop")
        self.recent_indexes += 1
        return res

    def jsonrpc_add_webentity_startpage(self, webentity_id, startpage_url):
        startpage_url = urllru.fix_missing_http(startpage_url)
        try:
            urllru.url_to_lru(startpage_url)
        except ValueError as e:
            return format_error(e)
        self.add_backend_tags(webentity_id, "startpages_modified", "added %s" % startpage_url)
        return self.update_webentity(webentity_id, "startpages", startpage_url, "push")

    def jsonrpc_rm_webentity_startpage(self, webentity_id, startpage_url):
        startpage_url = urllru.fix_missing_http(startpage_url)
        try:
            urllru.url_to_lru(startpage_url)
        except ValueError as e:
            return format_error(e)
        self.add_backend_tags(webentity_id, "startpages_modified", "removed %s" % startpage_url)
        return self.update_webentity(webentity_id, "startpages", startpage_url, "pop")

    def jsonrpc_add_webentity_tag_value(self, webentity_id, tag_namespace, tag_key, tag_value):
        self.recent_tagging = True
        return self.update_webentity(webentity_id, "metadataItems", tag_value, "push", tag_key, tag_namespace)

    def jsonrpc_rm_webentity_tag_key(self, webentity_id, tag_namespace, tag_key):
        return self.jsonrpc_set_webentity_tag_values(webentity_id, tag_namespace, tag_key, [])

    def jsonrpc_rm_webentity_tag_value(self, webentity_id, tag_namespace, tag_key, tag_value):
        self.recent_tagging = True
        return self.update_webentity(webentity_id, "metadataItems", tag_value, "pop", tag_key, tag_namespace)

    def jsonrpc_set_webentity_tag_values(self, webentity_id, tag_namespace, tag_key, tag_values):
        if not isinstance(tag_values, list):
            tag_values = list(tag_values)
        self.recent_tagging = True
        return self.update_webentity(webentity_id, "metadataItems", tag_values, "update", tag_key, tag_namespace)

    def jsonrpc_merge_webentity_into_another(self, old_webentity_id, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False):
        old_WE = self.msclient_sync.getWebEntity(old_webentity_id)
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
            b = self.jsonrpc_add_webentity_lruprefix(good_webentity_id, lru)
            res.append(b)
        self.add_backend_tags(good_webentity_id, "alias_added", old_WE.name)
        self.total_webentities -= 1
        self.recent_indexes += 1
        return format_result(res)

    def jsonrpc_delete_webentity(self, webentity_id):
        WE = self.msclient_sync.getWebEntity(webentity_id)
        if is_error(WE):
            return format_error('ERROR retrieving WebEntity with id %s' % old_webentity_id)
        res = self.msclient_sync.deleteWebEntity(WE)
        if is_error(res):
            return res
        self.total_webentities -= 1
        self.recent_indexes += 1
        return format_result("WebEntity %s (%s) was removed" % (webentity_id, WE.name))

    @inlineCallbacks
    def index_batch(self, page_items, jobid):
        ids = [bson.ObjectId(str(record['_id'])) for record in page_items]
        nb_crawled_pages = len(ids)
        if (nb_crawled_pages > 0):
            page_items.rewind()
            pages, links = yield threads.deferToThread(processor.generate_cache_from_pages_list, page_items, config["precisionLimit"], self.precision_exceptions, config['DEBUG'] > 0)
            s=time.time()
            cache_id = yield self.msclient_loop.createCache(pages.values())
            if is_error(cache_id):
                print cache_id['message']
                returnD(False)
            nb_pages = yield self.msclient_loop.indexCache(cache_id)
            if is_error(nb_pages):
                print nb_pages['message']
                returnD(False)
            print "..."+str(nb_pages)+" pages indexed in "+str(time.time()-s)+"s..."
            s=time.time()
            nb_links = len(links)
            for link_list in [links[i:i+config['memoryStructure']['max_simul_links_indexing']] for i in range(0, nb_links, config['memoryStructure']['max_simul_links_indexing'])]:
                res = yield self.msclient_loop.saveNodeLinks([NodeLink("id",source,target,weight) for source,target,weight in link_list])
                if is_error(res):
                    print res['message']
                    returnD(False)
            print "..."+str(nb_links)+" links indexed in "+str(time.time()-s)+"s..."
            s=time.time()
            n_WE = yield self.msclient_loop.createWebEntities(cache_id)
            if is_error(n_WE):
                print nb_WE['message']
                returnD(False)
            print "...%s web entities created in %s" % (n_WE, str(time.time()-s))+"s"
            self.total_webentities += n_WE
            res = yield self.msclient_loop.deleteCache(cache_id)
            if is_error(res):
                print res['message']
                returnD(False)
            resdb = self.db[config['mongo-scrapy']['queueCol']].remove({'_id': {'$in': ids}}, safe=True)
            if (resdb['err']):
                print "ERROR cleaning queue in database for job %s" % jobid, resdb
                returnD(False)
            tot_crawled_pages = self.db[config['mongo-scrapy']['pageStoreCol']].find({'_job': jobid}).count()
            res = self.db[config['mongo-scrapy']['jobListCol']].find_and_modify({'_id': jobid}, update={'$inc': {'nb_pages': nb_pages, 'nb_links': nb_links}, '$set': {'nb_crawled_pages': tot_crawled_pages, 'indexing_status': indexing_statuses.BATCH_FINISHED}})
            if not res:
                print "ERROR updating job %s" % jobid
                returnD(False)
            jobslog(jobid, "INDEX_"+indexing_statuses.BATCH_FINISHED, self.db)

    @inlineCallbacks
    def index_batch_loop(self):
        if self.loop_running:
            returnD(False)
        self.loop_running = True
        if self.db[config['mongo-scrapy']['jobListCol']].find_one({'indexing_status': indexing_statuses.BATCH_RUNNING}):
            print "WARNING : indexing job declared as running but probably crashed."
            self.loop_running = False
            returnD(False)
        oldest_page_in_queue = self.db[config['mongo-scrapy']['queueCol']].find_one(sort=[('timestamp', pymongo.ASCENDING)], fields=['_job'], skip=random.randint(0, 2))
        # Run linking WebEntities on a regular basis when needed
        if self.recent_indexes > 100 or (self.recent_indexes and not oldest_page_in_queue) or (self.recent_indexes and time.time() - self.last_links_loop >= 1800):
            self.loop_running = "generating links"
            self.loop_running_since = time.time()
            s = time.time()
            print "Generating links between web entities..."
            jobslog("WE_LINKS", "Starting WebEntity links generation...", self.db)
            res = yield self.msclient_loop.generateWebEntityLinks()
            if is_error(res):
                print res['message']
                self.loop_running = False
                returnD(False)
            self.webentities_links = res
            s = str(time.time() -s)
            jobslog("WE_LINKS", "...finished WebEntity links generation (%ss)" %s, self.db)
            print "...processed WebEntity links in %ss..." % s
            self.recent_indexes = 0
            self.last_links_loop = time.time()
        elif oldest_page_in_queue:
            # find next job to be indexed and set its indexing status to batch_running
            job = self.db[config['mongo-scrapy']['jobListCol']].find_one({'_id': oldest_page_in_queue['_job'], 'crawling_status': {'$ne': crawling_statuses.PENDING}, 'indexing_status': {'$ne': indexing_statuses.BATCH_RUNNING}}, fields=['_id'], sort=[('timestamp', pymongo.ASCENDING)])
            if not job:
                self.loop_running = False
                returnD(False)
            jobid = job['_id']
            print "Indexing pages from job "+jobid
            page_items = self.db[config['mongo-scrapy']['queueCol']].find({'_job': jobid}, limit=config['memoryStructure']['max_simul_pages_indexing'], sort=[('timestamp', pymongo.ASCENDING)])
            if (page_items.count(with_limit_and_skip=True)) > 0:
                resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': jobid}, {'$set': {'indexing_status': indexing_statuses.BATCH_RUNNING}}, safe=True)
                if (resdb['err']):
                    print "ERROR updating job %s's indexing status" % jobid, resdb
                    self.loop_running = False
                    returnD(False)
                jobslog(jobid, "INDEX_"+indexing_statuses.BATCH_RUNNING, self.db)
                self.loop_running = "indexing"
                self.loop_running_since = time.time()
                res = yield self.index_batch(page_items, jobid)
                if is_error(res):
                    print res['message']
                    self.loop_running = False
                    returnD(False)
                self.recent_indexes += 1
                self.last_index_loop = time.time()
            else:
                print "WARNING: job %s found for index but no page corresponding found in queue." % jobid
        if self.loop_running != True:
            print "...loop run finished."
        self.loop_running = None

    def handle_index_error(self, failure):
        update_ids = [job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'])]
        if len(update_ids):
            self.db[config['mongo-scrapy']['jobListCol']].update({'_id' : {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}}, multi=True)
            jobslog(update_ids, "INDEX_"+indexing_statuses.BATCH_CRASHED, self.db)
        failure.trap(Exception)
        print failure
        return {'code': 'fail', 'message': failure}

    def jsonrpc_get_precision_exceptions(self, corpus=''):
        exceptions = self.msclient_sync.getPrecisionExceptions()
        if is_error(exceptions):
            return exceptions
        self.precision_exceptions = exceptions
        return format_result(exceptions)

    def jsonrpc_remove_precision_exceptions(self, list_exceptions, corpus=''):
        res = self.msclient_sync.removePrecisionExceptions(list_exceptions)
        if is_error(res):
            return res
        for e in list_exceptions:
            self.precision_exceptions.remove(e)
        return format_result("Precision Exceptions %s removed." % list_exceptions)

    @inlineCallbacks
    def ramcache_webentities(self):
        WEs = self.webentities
        if WEs == [] or self.recent_indexes or self.last_links_loop > self.last_WE_update:
            WEs = yield self.msclient_pool.getWebEntities()
            if is_error(WEs):
                returnD(WEs)
            self.last_WE_update = time.time()
            self.webentities = WEs
        self.total_webentities = len(WEs)
        returnD(WEs)

    @inlineCallbacks
    def jsonrpc_get_webentities(self, list_ids=None, light=False, semilight=False, corpus='', corelinks=False, light_for_csv=False):
        jobs = {}
        if isinstance(list_ids, unicode):
            list_ids = [list_ids]
        n_WEs = len(list_ids) if list_ids else 0
        if n_WEs:
            MAX_WE_AT_ONCE = 100
            WEs = []
            for sublist_ids in [list_ids[MAX_WE_AT_ONCE*i : MAX_WE_AT_ONCE*(i+1)] for i in range((n_WEs-1)/MAX_WE_AT_ONCE + 1)]:
                res = yield self.msclient_pool.getWebEntitiesByIDs(sublist_ids)
                if is_error(res):
                    returnD(res)
                WEs.extend(res)
            for job in self.db[config['mongo-scrapy']['jobListCol']].find({'webentity_id': {'$in': [WE.id for WE in WEs]}}, fields=['webentity_id', 'crawling_status', 'indexing_status'], sort=[('timestamp', pymongo.ASCENDING)]):
                jobs[job['webentity_id']] = job
        else:
            if test_bool_arg(corelinks):
                print "Collecting WebEntities..."
            WEs = yield self.ramcache_webentities()
            if is_error(WEs):
                returnD(WEs)
            jobs = None
        res = self.format_webentities(WEs, jobs, light, semilight, light_for_csv)
        if test_bool_arg(corelinks):
            print "...got WebEntities, collecting WebEntityLinks..."
            res = yield self.msclient_pool.getWebEntityLinks()
            if is_error(res):
                returnD(res)
            self.webentities_links = res
            print "...got WebEntityLinks."
            self.loop_running = False
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_advanced_search_webentities(self, allFieldsKeywords=[], fieldKeywords=[]):
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
        WEs = yield self.msclient_pool.searchWebEntities(afk, fk)
        if is_error(WEs):
            returnD(WEs)
        returnD(format_result(self.format_webentities(WEs, light=True)))

    def jsonrpc_escape_search_query(self, query):
        for char in ["\\", "+", "-", "!", "(", ")", ":", "^", "[", "]", "{", "}", "~", "*", "?"]:
            query = query.replace(char, "\\%s" % char)
        return query.replace(' ', '?')

    def _optionnal_field_search(self, query, field=None):
        if field:
            if not isinstance(field, unicode):
                field = unicode(field)
            return self.jsonrpc_advanced_search_webentities([], [[field, query]])
        return self.jsonrpc_advanced_search_webentities([query])

    def jsonrpc_exact_search_webentities(self, query, field=None):
        query = self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field)

    def jsonrpc_prefixed_search_webentities(self, query, field=None):
        query = "%s*" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field)

    def jsonrpc_postfixed_search_webentities(self, query, field=None):
        query = "*%s" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field)

    def jsonrpc_free_search_webentities(self, query, field=None):
        query = "*%s*" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field)

    def jsonrpc_get_webentities_by_status(self, status):
        status = status.lower()
        valid_statuses = ['in', 'out', 'undecided', 'discovered']
        if status not in valid_statuses:
            returnD(format_error("ERROR: status argument must be one of %s" % ",".join(valid_statuses)))
        return self.jsonrpc_exact_search_webentities(status, 'STATUS')

    def jsonrpc_get_webentities_by_name(self, name):
        return self.jsonrpc_exact_search_webentities(name, 'NAME')

    def jsonrpc_get_webentities_by_tag_value(self, value):
        return self.jsonrpc_exact_search_webentities(value, 'TAG_VALUE')

    def jsonrpc_get_webentities_by_tag_category(self, category):
        return self.jsonrpc_exact_search_webentities(category, 'TAG_CATEGORY')

    def jsonrpc_get_webentities_by_user_tag(self, category, value):
        return self.jsonrpc_exact_search_webentities("USER:%s=%s" % (category, value), 'TAG')

    @inlineCallbacks
    def ramcache_tags(self):
        tags = self.tags
        if tags == {} or self.recent_tagging:
            tags = yield self.msclient_pool.getTags()
            if is_error(tags):
                returnD(tags)
            self.recent_tagging = False
            self.tags = tags
        returnD(tags)

    @inlineCallbacks
    def jsonrpc_get_tags(self):
        tags = yield self.ramcache_tags()
        returnD(format_result(tags))

    @inlineCallbacks
    def jsonrpc_get_tag_namespaces(self):
        tags = yield self.ramcache_tags()
        returnD(format_result(tags.keys()))

    @inlineCallbacks
    def jsonrpc_get_tag_categories(self, namespace=None):
        tags = yield self.ramcache_tags()
        categories = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                categories |= set(tags[ns].keys())
        returnD(format_result(list(categories)))

    @inlineCallbacks
    def jsonrpc_get_tag_values(self, namespace=None, category=None):
        tags = yield self.ramcache_tags()
        values = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                for cat in tags[ns].keys():
                    if not category or (cat == category):
                        values |= set(tags[ns][cat])
        returnD(format_result(list(values)))

    @inlineCallbacks
    def jsonrpc_get_webentity_pages(self, webentity_id, corpus=''):
        pages = yield self.msclient_pool.getPagesFromWebEntity(webentity_id)
        if is_error(pages):
            returnD(pages)
        formatted_pages = [{'lru': p.lru, 'sources': list(p.sourceSet), 'crawl_timestamp': p.crawlerTimestamp, 'url': p.url, 'depth': p.depth, 'error': p.errorCode, 'http_status': p.httpStatusCode, 'is_node': p.isNode, 'is_full_precision': p.isFullPrecision, 'creation_date': p.creationDate, 'last_modification_date': p.lastModificationDate} for p in pages]
        returnD(format_result(formatted_pages))

    @inlineCallbacks
    def jsonrpc_get_webentity_by_url(self, url):
        try:
            lru = urllru.url_to_lru_clean(url)
        except ValueError as e:
            returnD(format_error(e))
        WE = yield self.msclient_pool.findWebEntityMatchingLRU(lru)
        if is_error(WE):
            returnD(WE)
        if WE.name == "OUTSIDE WEB":
            returnD(format_error("No matching WebEntity found for url %s" % url))
        returnD(format_result(self.format_webentity(WE)))

    @inlineCallbacks
    def jsonrpc_get_webentity_subwebentities(self, webentity_id):
        res = yield self.get_webentity_relative_webentities(webentity_id, "children")
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentity_parentwebentities(self, webentity_id):
        res = yield self.get_webentity_relative_webentities(webentity_id, "parents")
        returnD(res)

    @inlineCallbacks
    def get_webentity_relative_webentities(self, webentity_id, relative_type="children"):
        if relative_type != "children" and relative_type != "parents":
            returnD(format_error("ERROR: must set relative type as children or parents"))
        jobs = {}
        if relative_type == "children":
            WEs = yield self.msclient_pool.getSubWebEntities(webentity_id)
        else:
            WEs = yield self.msclient_pool.getParentWebEntities(webentity_id)
        if is_error(WEs):
            returnD(WEs)
        for job in self.db[config['mongo-scrapy']['jobListCol']].find({'webentity_id': {'$in': [WE.id for WE in WEs]}}, fields=['webentity_id', 'crawling_status', 'indexing_status'], sort=[('timestamp', pymongo.ASCENDING)]):
            jobs[job['webentity_id']] = job
        res = self.format_webentities(WEs, jobs)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_webentities_network_json(self):
        res = yield self.generate_network_WEs("json")
        returnD(handle_standard_results(res))

    @inlineCallbacks
    def jsonrpc_generate_webentities_network_gexf(self):
        res = yield self.generate_network_WEs("gexf")
        if "code" in res:
            returnD(res)
        returnD(format_result('GEXF graph generation started...'))

    @inlineCallbacks
    def jsonrpc_get_webentity_nodelinks_network_json(self, webentity_id=None, outformat="json", include_external_links=False):
        if outformat == "gexf":
            returnD(format_error("...GEXF NodeLinks network not implemented yet."))
        s = time.time()
        print "Generating %s NodeLinks network for WebEntity %s..." % (outformat, webentity_id)
        links = yield self.msclient_pool.getWebentityNodeLinks(webentity_id, test_bool_arg(include_external_links))
        if is_error(links):
            returnD(format_error(links))
        res = [[l.sourceLRU, l.targetLRU, l.weight] for l in links]
        print "...JSON network generated in "+str(time.time()-s)
        returnD(format_result(res))

    @inlineCallbacks
    def get_webentity_with_pages_and_subWEs(self, webentity_id, all_pages_as_startpoints=False):
        WE = yield self.msclient_pool.getWebEntity(webentity_id)
        if is_error(WE):
            returnD(format_error("No WebEntity with id %s found" % webentity_id))
        res = {'status': WE.status, 'lrus': list(WE.LRUSet), 'pages': [urllru.lru_to_url(lr) for lr in WE.LRUSet], 'subWEs': []}
        if test_bool_arg(all_pages_as_startpoints):
            pages = yield self.msclient_pool.getPagesFromWebEntity(WE.id)
            if is_error(pages):
                returnD(pages)
            if pages:
                res['pages'] = [p.url for p in pages]
        else:
            res['pages'] = list(WE.startpages)
        subs = yield self.msclient_pool.getSubWebEntities(WE.id)
        if is_error(subs):
            returnD(subs)
        if subs:
            res['subWEs'] = [lr for subwe in subs for lr in subwe.LRUSet]
        returnD(res)

    @inlineCallbacks
    def generate_network_WEs(self, outformat="json"):
        s = time.time()
        print "Generating %s WebEntities network..." % outformat
        if self.webentities_links == []:
            links = yield self.msclient_loop.getWebEntityLinks()
            if is_error(links):
                print links['message']
                returnD(False)
            self.webentities_links = links
        if outformat == "gexf":
            WEs = yield self.ramcache_webentities()
            if is_error(WEs):
                print WEs['message']
                returnD(False)
            WEs_metadata = {}
            for WE in WEs:
                date = ''
                if WE.lastModificationDate:
                    date = WE.lastModificationDate
                elif WE.creationDate:
                    date = WE.creationDate
                pages = yield self.msclient_pool.getPagesFromWebEntity(WE.id)
                if is_error(pages):
                    print pages['message']
                    returnD(False)
                WEs_metadata[WE.id] = {"name": WE.name, "date": date, "LRUSet": ",".join(WE.LRUSet), "nb_pages": len(pages), "nb_intern_links": 0}
                WE_links = yield self.msclient_pool.findWebEntityLinksBySource(WE.id)
                if is_error(WE_links):
                    print WE_links['message']
                    returnD(False)
                for link in WE_links:
                    if link.targetId == WE.id:
                        WEs_metadata[WE.id]['nb_intern_links'] = link.weight
            gexf.write_WEs_network_from_MS(self.webentities_links, WEs_metadata, 'test_welinks.gexf')
            print "...GEXF network generated in test_welinks.gexf in "+str(time.time()-s)
            returnD(None)
        elif outformat == "json":
            res = [[link.sourceId, link.targetId, link.weight] for link in self.webentities_links]
            print "...JSON network generated in "+str(time.time()-s)
            returnD(res)

def test_connexions():
# THRIFT
    try:
        transport = TSocket(config['memoryStructure']['thrift.host'], config['memoryStructure']['thrift.port'])
        transport.open()
        transport.close()
    except TException as x:
        print "ERROR: Cannot connect to lucene memory structure through thrift, please check your server and the configuration in config.json."
        if config['DEBUG']:
            print x
        return None
    try:
        run = Core()
        res = run.store.msclient_sync.ping()
        if is_error(res):
            raise Exception(res['message'])
    except:
        raise
# MONGO
    try:
        reactor.addSystemEventTrigger('before', 'shutdown', run.close)
        # clean possible previous crash
        update_ids = [job['_id'] for job in run.db[config['mongo-scrapy']['jobListCol']].find({'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'])]
        if len(update_ids):
            run.db[config['mongo-scrapy']['jobListCol']].update({'_id' : {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}}, multi=True)
            jobslog(update_ids, "INDEX_"+indexing_statuses.BATCH_CRASHED, run.db)
    except Exception as x:
        print "ERROR: Cannot connect to mongoDB, please check your server and the configuration in config.json."
        if config['DEBUG']:
            print x
        return None
# INIT DEFAULT CREATION RULE
    try:
        run.store.ensureDefaultCreationRuleExists()
    except Exception as x:
        print "ERROR: Cannot save default web entity into memory structure."
        if config['DEBUG']:
            print x
        return None
# SCRAPY
    res = run.crawler.send_scrapy_query('delproject', {'project': config['mongo-scrapy']['project']})
    if is_error(res):
        print "WARNING: Could not delete existing version of HCI's scrapy spider"
        print res['message']
        print "Trying to deploy anyway"
    try:
        import subprocess
        output = subprocess.Popen(['bash', 'bin/deploy_scrapy_spider.sh', '--noenv'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT).communicate()[0]
        res = run.crawler.send_scrapy_query('listprojects')
        if is_error(res) or "projects" not in res['result'] or config['mongo-scrapy']['project'] not in res['result']['projects']:
            raise Exception(output)
    except Exception as e:
        print "ERROR: Could not connect to scrapyd server to deploy spider, please check your server and the configuration in config.json."
        print e
        return None
    return run

core = test_connexions()
if not core:
    exit()

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

