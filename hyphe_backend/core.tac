#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time, random, json, bson
from urllib import urlencode
import subprocess
from txjsonrpc import jsonrpclib
from txjsonrpc.jsonrpc import Introspection
from txjsonrpc.web import jsonrpc
from twisted.web import server
from twisted.python import log as logger
from twisted.internet import reactor, defer
from twisted.internet.task import LoopingCall
from twisted.internet.threads import deferToThread
from twisted.internet.defer import inlineCallbacks, returnValue as returnD
from twisted.internet.endpoints import TCP4ClientEndpoint
from twisted.internet.error import DNSLookupError, ConnectionRefusedError
from twisted.application.internet import TCPServer
from twisted.application.service import Application
from twisted.web.http_headers import Headers
from twisted.web.client import getPage, Agent, ProxyAgent, HTTPClientFactory, _HTTP11ClientFactory
HTTPClientFactory.noisy = False
_HTTP11ClientFactory.noisy = False
from hyphe_backend import processor
from hyphe_backend.lib import config_hci, urllru, gexf, user_agents
from hyphe_backend.lib.utils import *
from hyphe_backend.lib.mongo import MongoDB, sortdesc
from hyphe_backend.lib.corpus import CorpusFactory
from hyphe_backend.memorystructure import MemoryStructure as ms, constants as ms_const


# MAIN CORE API

class Core(jsonrpc.JSONRPC):

    addSlash = True

    def __init__(self):
        jsonrpc.JSONRPC.__init__(self)
        self.db = MongoDB(config['mongo-scrapy'])
        self.msclients = CorpusFactory(config['memoryStructure']['thrift.host'],
          port_range = config['memoryStructure']['thrift.portrange'],
          max_ram = config['memoryStructure']['thrift.max_ram'],
          loglevel = config['memoryStructure']['log.level'])
        self.corpora = {}
        self.crawler = Crawler(self)
        self.store = Memory_Structure(self)
        reactor.addSystemEventTrigger('before', 'shutdown', self.close)
        self.keepalive_default = None

    @inlineCallbacks
    def activate_monocorpus(self):
        yield self.start_corpus(create_if_missing=True)
        self.keepalive_default = LoopingCall(self.jsonrpc_ping, DEFAULT_CORPUS)
        self.keepalive_default.start(300, False)

    @inlineCallbacks
    def close(self):
        if not config["MULTICORPUS"] and self.keepalive_default and self.keepalive_default.running:
            self.keepalive_default.stop()
        for corpus in self.corpora.keys():
            yield self.stop_corpus(corpus, quiet=True)
        yield self.db.close()
        self.msclients.stop()

  # OVERWRITE JSONRPC REQUEST HANDLING

    def render(self, request):
        request.setHeader("Access-Control-Allow-Origin", "*")
        from_ip = ""
        if request.getHeader("x-forwarded-for"):
            from_ip = " from %s" % request.getHeader("x-forwarded-for")
        if config['DEBUG']:
            logger.msg(request.content.read(), system="DEBUG - QUERY%s" % from_ip)
# TODO   catch corpus arg here and return corpus_error if needed
        return jsonrpc.JSONRPC.render(self, request)

    def _cbRender(self, result, request, id, version):
        if config['DEBUG'] == 2:
            txt = jsonrpclib.dumps(result, id=id, version=2.0)
            logger.msg("%s%s" % (txt[:1000], " ... [%d cars truncated]" % (len(txt)-1000) if len(txt) > 1000 else ''), system="DEBUG - ANSWER")
        return jsonrpc.JSONRPC._cbRender(self, result, request, id, version)

  # CORPUS HANDLING

    def jsonrpc_test_corpus(self, corpus=DEFAULT_CORPUS, msg=None):
        res = {
          "corpus_id": corpus,
          "ready": False,
          "status": self.msclients.status_corpus(corpus, simplify=True),
        }
        if res["status"] == "ready":
            res["ready"] = True
        elif res["status"] == "error":
            res["message"] = self.msclients.corpora[corpus].error
        elif res["status"] == "stopped":
            res["message"] = "Corpus is not started"
        if res["status"] == "starting":
            res["message"] = "Corpus is starting, please retry in a bit"
        elif msg:
            res["message"] = msg
        return format_result(res)

    @inlineCallbacks
    def jsonrpc_list_corpus(self):
        res = {}
        corpora = yield self.db.list_corpus()
        for corpus in corpora:
            corpus["password"] = (corpus["password"] != "")
            corpus.update(self.jsonrpc_test_corpus(corpus.pop('_id'))["result"])
            res[corpus["corpus_id"]] = corpus
        returnD(format_result(res))

    def corpus_ready(self, corpus):
        return corpus in self.corpora and self.msclients.test_corpus(corpus)

    def corpus_error(self, corpus=None):
        if not corpus:
            return format_error("Too many instances running already, please try again later")
        reactor.callLater(0, self.stop_corpus, corpus, quiet=True)
        return format_error(self.jsonrpc_test_corpus(corpus)["result"])

    def factory_full(self):
        return self.msclients.ram_free < 256 or not self.msclients.ports_free

    def jsonrpc_create_corpus(self, name=DEFAULT_CORPUS, password="", options=None):
        return self.create_corpus(name, password, options=options)

    @inlineCallbacks
    def create_corpus(self, name=DEFAULT_CORPUS, password="", options=None, noloop=False, quiet=False):
        if self.factory_full():
            returnD(self.corpus_error())

        corpus = clean_corpus_id(name)
        corpus_idx = 1
        existing = yield self.db.get_corpus(corpus)
        while existing:
            corpus = "%s-%s" % (clean_corpus_id(name), corpus_idx)
            corpus_idx += 1
            existing = yield self.db.get_corpus(corpus)

        self.corpora[corpus] = {"name": name}

        yield self.db.add_corpus(corpus, name, password, options)
        try:
            res = yield self.crawler.deploy_spider(corpus)
        except:
            returnD(format_error("Could not deploy corpus' scrapyd spider"))
        if not res:
            returnD(res)
        res = self.store.ensureDefaultCreationRuleExists(corpus, quiet=quiet)
        if not res:
            returnD(res)
        res = yield self.start_corpus(corpus, password=password, noloop=noloop, quiet=quiet)
        returnD(handle_standard_results(res))

    def jsonrpc_start_corpus(self, corpus=DEFAULT_CORPUS, password=""):
        return self.start_corpus(corpus, password)

    @inlineCallbacks
    def start_corpus(self, corpus=DEFAULT_CORPUS, password="", noloop=False, quiet=False, create_if_missing=False):
        if self.corpus_ready(corpus) or self.msclients.status_corpus(corpus, simplify=True) == "starting":
            returnD(self.jsonrpc_test_corpus(corpus, msg="Corpus already ready"))

        corpus_conf = yield self.db.get_corpus(corpus)
        if not corpus_conf:
            if create_if_missing:
                res = yield self.create_corpus(corpus, password, noloop=noloop, quiet=quiet)
                returnD(res)
            returnD(format_error("No corpus existing with ID %s, please create it first!" % corpus))
        if corpus_conf['password'] and corpus_conf['password'] != salt(password):
            returnD(format_error("Wrong auth for password-protected corpus %s" % corpus))
        if self.factory_full():
            returnD(self.corpus_error())

        res = self.msclients.start_corpus(corpus, quiet, ram=corpus_conf['ram'])
        if not res:
            returnD(format_error(self.jsonrpc_test_corpus(corpus)["result"]))
        self.corpora[corpus] = {
          "name": corpus_conf["name"],
          "ram": corpus_conf["ram"],
          "total_webentities": corpus_conf['total_webentities'],
          "crawls": corpus_conf['total_crawls'],
          "crawls_running": 0,
          "crawls_pending": 0,
          "pages_found": corpus_conf['total_pages'],
          "pages_crawled": corpus_conf['total_pages_crawled'],
          "pages_queued": 0,
          "links_found": 0,
          "last_index_loop": corpus_conf['last_index_loop'],
          "last_links_loop": corpus_conf['last_links_loop'],
          "index_loop": LoopingCall(self.store.index_batch_loop, corpus),
          "jobs_loop": LoopingCall(self.refresh_jobs, corpus)
        }
        if not noloop:
            reactor.callLater(5, self.corpora[corpus]['jobs_loop'].start, 1, False)
        yield self.store._start_loop(corpus, noloop=noloop)
        yield self.update_corpus(corpus)
        returnD(self.jsonrpc_test_corpus(corpus))

    @inlineCallbacks
    def update_corpus(self, corpus=DEFAULT_CORPUS):
        yield self.db.update_corpus(corpus, {
          "ram": self.msclients.corpora[corpus].ram,
          "total_webentities": self.corpora[corpus]['total_webentities'],
          "total_crawls": self.corpora[corpus]['crawls'],
          "total_pages": self.corpora[corpus]['pages_found'],
          "total_pages_crawled": self.corpora[corpus]['pages_crawled'],
          "last_index_loop": self.corpora[corpus]['last_index_loop'],
          "last_links_loop": self.corpora[corpus]['last_links_loop'],
          "last_activity": time.time()
        })

    def jsonrpc_stop_corpus(self, corpus=DEFAULT_CORPUS):
        return self.stop_corpus(corpus)

    @inlineCallbacks
    def stop_corpus(self, corpus=DEFAULT_CORPUS, quiet=False):
        if corpus in self.corpora:
            for f in ["jobs_loop", "index_loop"]:
                if f in self.corpora[corpus] and self.corpora[corpus][f].running:
                    self.corpora[corpus][f].stop()
            yield self.update_corpus(corpus)
            self.msclients.stop_corpus(corpus, quiet)
            for f in ["tags", "webentities", "webentities_links", "precision_exceptions"]:
                if f in self.corpora[corpus]:
                    del(self.corpora[corpus][f])
        res = self.jsonrpc_test_corpus(corpus)
        if "message" in res["result"]:
            res["result"]["message"] = "Corpus stopped"
        returnD(res)

    def jsonrpc_ping(self, corpus=None, timeout=3):
        if not corpus:
            return format_result('pong')
        if not self.corpus_ready(corpus) and self.msclients.status_corpus(corpus, simplify=True) != "starting":
            return self.corpus_error(corpus)

        st = time.time()
        res = self.msclients.sync.ping(corpus=corpus)
        while is_error(res) and time.time() < st + timeout:
            time.sleep(0.1)
            res = self.msclients.sync.ping(corpus=corpus)
        if is_error(res):
            return res
        return format_result('pong')

    def jsonrpc_reinitialize(self, corpus=DEFAULT_CORPUS):
        return self.reinitialize(corpus)

    @inlineCallbacks
    def reinitialize(self, corpus=DEFAULT_CORPUS, noloop=False, quiet=False):
        """Reinitializes both crawl jobs and memory structure."""
        res = yield self.crawler.reinitialize(corpus, recreate=(not noloop), quiet=quiet)
        if is_error(res):
            returnD(res)
        res = yield self.store.reinitialize(corpus, noloop=noloop, quiet=quiet)
        if is_error(res):
            returnD(res)
        returnD(format_result('Memory structure and crawling database contents emptied.'))

    def jsonrpc_destroy_corpus(self, corpus=DEFAULT_CORPUS):
        return self.destroy_corpus(corpus)

    @inlineCallbacks
    def destroy_corpus(self, corpus=DEFAULT_CORPUS, quiet=False):
        res = yield self.reinitialize(corpus, noloop=True, quiet=quiet)
        if is_error(res):
            returnD(res)
        res = yield self.stop_corpus(corpus, quiet)
        if is_error(res):
            returnD(res)
        yield self.db.delete_corpus(corpus)
        returnD(format_result("Corpus %s destroyed successfully" % corpus))

    @inlineCallbacks
    def jsonrpc_reset_all(self):
        corpora = yield self.db.list_corpus(fields=['_id', 'password'])
        for corpus in corpora:
            res = yield self.start_corpus(corpus['_id'], password=corpus['password'], noloop=True, quiet=not config['DEBUG'])
            if is_error(res):
                returnD(res)
            res = self.jsonrpc_ping(corpus['_id'], timeout=10)
            if is_error(res):
                returnD(res)
            res = yield self.destroy_corpus(corpus['_id'], quiet=not config['DEBUG'])
            if is_error(res):
                returnD(res)
        returnD(format_result("All corpora and databases cleaned up"))

  # CORE & CORPUS STATUS

    def jsonrpc_get_status(self, corpus=DEFAULT_CORPUS):
        status = {
          'hyphe': {
            'corpus_running': self.msclients.total_running(),
            'crawls_running': sum([c['crawls_running'] for c in self.corpora.values()]),
            'crawls_pending': sum([c['crawls_pending'] for c in self.corpora.values()]),
            'ports_left': len(self.msclients.ports_free),
            'ram_left': self.msclients.ram_free
          },
          'corpus': {
          }
        }
        status['corpus'].update(self.jsonrpc_test_corpus(corpus)["result"])
        if not self.corpus_ready(corpus):
            return format_result(status)
        WEs_total = self.corpora[corpus]['total_webentities']
        WEs_IN = len([1 for w in self.corpora[corpus]['webentities'] if ms.WebEntityStatus._NAMES_TO_VALUES[w.status] == ms.WebEntityStatus.IN])
        WEs_OUT = len([1 for w in self.corpora[corpus]['webentities'] if ms.WebEntityStatus._NAMES_TO_VALUES[w.status] == ms.WebEntityStatus.OUT])
        WEs_UND = len([1 for w in self.corpora[corpus]['webentities'] if ms.WebEntityStatus._NAMES_TO_VALUES[w.status] == ms.WebEntityStatus.UNDECIDED])
        WEs_DISC = WEs_total - WEs_IN - WEs_OUT - WEs_UND
        corpus_status = {
          'name': self.corpora[corpus]['name'],
          'ram': self.msclients.corpora[corpus].ram,
          'crawler': {
            'jobs_finished': self.corpora[corpus]['crawls'] - self.corpora[corpus]['crawls_pending'] - self.corpora[corpus]['crawls_running'],
            'jobs_pending': self.corpora[corpus]['crawls_pending'],
            'jobs_running': self.corpora[corpus]['crawls_running'],
            'pages_crawled': self.corpora[corpus]['pages_crawled'],
            'pages_found': self.corpora[corpus]['pages_found'],
            'links_found': self.corpora[corpus]['links_found']
          },
          'memory_structure': {
            'job_running': self.corpora[corpus]['loop_running'],
            'job_running_since': self.corpora[corpus]['loop_running_since']*1000 if self.corpora[corpus]['loop_running'] else 0,
            'last_index': self.corpora[corpus]['last_index_loop']*1000,
            'last_links_generation': self.corpora[corpus]['last_links_loop']*1000,
            'pages_to_index': self.corpora[corpus]['pages_queued'],
            'webentities': {
              'total': WEs_total,
              'IN': WEs_IN,
              'OUT': WEs_OUT,
              'UNDECIDED': WEs_UND,
              'DISCOVERED': WEs_DISC
            }
          }
        }
        status['corpus'].update(corpus_status)
        return format_result(status)

  # CRAWL JOBS MONITORING

    @inlineCallbacks
    def jsonrpc_listjobs(self, list_ids=None, corpus=DEFAULT_CORPUS):
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        query = {}
        if list_ids:
            query = {'_id': {'$in': list_ids}}
        jobs = yield self.db.list_jobs(corpus, query)
        returnD(format_result(list(jobs)))

    @inlineCallbacks
    def refresh_jobs(self, corpus=DEFAULT_CORPUS):
        """Runs a monitoring task on the list of jobs in the database to update their status from scrapy API and indexing tasks."""
        scrapyjobs = yield self.crawler.jsonrpc_list(corpus)
        if is_error(scrapyjobs):
            if not (type(scrapyjobs["message"]) is dict and "status" in scrapyjobs["message"]):
                logger.msg("Problem dialoguing with scrapyd server: %s" % scrapyjobs, system="WARNING - %s" % corpus)
            returnD(None)
        scrapyjobs = scrapyjobs['result']
        self.corpora[corpus]['crawls_pending'] = len(scrapyjobs['pending'])
        self.corpora[corpus]['crawls_running'] = len(scrapyjobs['running'])
        self.corpora[corpus]['pages_queued'] = yield self.db.queue(corpus).count()
        self.corpora[corpus]['pages_crawled'] = yield self.db.pages(corpus).count()
        jobs = yield self.db.list_jobs(corpus, fields=['nb_pages', 'nb_links'])
        self.corpora[corpus]['crawls'] = len(jobs)
        self.corpora[corpus]['pages_found'] = sum([j['nb_pages'] for j in jobs])
        self.corpora[corpus]['links_found'] = sum([j['nb_links'] for j in jobs])
        yield self.update_corpus(corpus)
        # clean lost jobs
        if len(scrapyjobs['running']) + len(scrapyjobs['pending']) == 0:
            yield self.db.update_jobs(corpus, {'crawling_status': {'$in': [crawling_statuses.PENDING, crawling_statuses.RUNNING]}}, {'crawling_status': crawling_statuses.FINISHED})
        # clean canceled jobs
        yield self.db.update_jobs(corpus, {'crawling_status': crawling_statuses.CANCELED}, {'indexing_status': indexing_statuses.CANCELED})
        # update jobs crawling status accordingly to crawler's statuses
        running_ids = [job['id'] for job in scrapyjobs['running']]
        for job_id in running_ids:
            crawled_pages = yield self.db.count_pages(corpus, job_id)
            yield self.db.update_jobs(corpus, job_id, {'nb_crawled_pages': crawled_pages})
        res = yield self.db.list_jobs(corpus, {'_id': {'$in': running_ids}, 'crawling_status': crawling_statuses.PENDING}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'crawling_status': crawling_statuses.RUNNING})
            yield self.db.add_log(corpus, update_ids, "CRAWL_"+crawling_statuses.RUNNING)
        # update crawling status for finished jobs
        finished_ids = [job['id'] for job in scrapyjobs['finished']]
        res = yield self.db.list_jobs(corpus, {'_id': {'$in': finished_ids}, 'crawling_status': {'$nin': [crawling_statuses.RETRIED, crawling_statuses.CANCELED, crawling_statuses.FINISHED]}}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'crawling_status': crawling_statuses.FINISHED})
            yield self.db.add_log(corpus, update_ids, "CRAWL_"+crawling_statuses.FINISHED)
        # collect list of crawling jobs whose outputs is not fully indexed yet
        jobs_in_queue = yield self.db.queue(corpus).distinct('_job')
        # set index finished for jobs with crawling finished and no page left in queue
        res = yield self.db.list_jobs(corpus, {'crawling_status': crawling_statuses.FINISHED})
        finished_ids = set([job['_id'] for job in res] + finished_ids)
        res = yield self.db.list_jobs(corpus, {'_id': {'$in': list(finished_ids-set(jobs_in_queue))}, 'crawling_status': crawling_statuses.FINISHED, 'indexing_status': {'$nin': [indexing_statuses.BATCH_RUNNING, indexing_statuses.FINISHED]}}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'indexing_status': indexing_statuses.FINISHED})
            yield self.db.add_log(corpus, update_ids, "INDEX_"+indexing_statuses.FINISHED)
            # Try to restart in phantom mode all regular crawls that seem to have failed (less than 3 pages found for a depth of at least 1)
            res = yield self.db.list_jobs(corpus, {'_id': {'$in': update_ids}, 'nb_crawled_pages': {'$lt': 3}, 'crawl_arguments.phantom': False, 'crawl_arguments.maxdepth': {'$gt': 0}})
            for job in res:
                logger.msg("Crawl job %s seems to have failed, trying to restart it in phantom mode" % job['_id'], system="INFO - %s" % corpus)
                yield self.jsonrpc_crawl_webentity(job['webentity_id'], job['crawl_arguments']['maxdepth'], True, corpus=corpus)
                yield self.db.add_log(corpus, job['_id'], "CRAWL_RETRIED_AS_PHANTOM")
                yield self.db.update_jobs(corpus, job['_id'], {'crawling_status': crawling_statuses.RETRIED})
        res = yield self.jsonrpc_listjobs(corpus=corpus)
        returnD(res)

  # BASIC PAGE DECLARATION (AND WEBENTITY CREATION)

    @inlineCallbacks
    def jsonrpc_declare_page(self, url, corpus=DEFAULT_CORPUS):
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        res = yield self.store.declare_page(url, corpus=corpus)
        returnD(handle_standard_results(res))

    @inlineCallbacks
    def jsonrpc_declare_pages(self, list_urls, corpus=DEFAULT_CORPUS):
        res = []
        errors = []
        for url in list_urls:
            WE = yield self.jsonrpc_declare_page(url, corpus=corpus)
            if is_error(WE):
                errors.append({'url': url, 'error': WE['message']})
            else:
                res.append(WE['result'])
        if len(errors):
            returnD({'code': 'fail', 'message': '%d urls failed, see details in "errors" field and successes in "results" field.' % len(errors), 'errors': errors, 'results': res})
        returnD(format_result(res))

  # BASIC CRAWL METHODS

    @inlineCallbacks
    def jsonrpc_crawl_webentity(self, webentity_id, maxdepth=None, phantom_crawl=False, status=ms.WebEntityStatus._VALUES_TO_NAMES[ms.WebEntityStatus.IN], startpages="default", corpus=DEFAULT_CORPUS):
        """Tells scrapy to run crawl on a WebEntity defined by its id from memory structure."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        try:
            maxdepth = int(maxdepth)
        except:
            maxdepth = config['mongo-scrapy']['maxdepth']
        if maxdepth > config['mongo-scrapy']['maxdepth']:
            returnD(format_error('No crawl with a bigger depth than %d is allowed on this Hyphe instance.' % config['mongo-scrapy']['maxdepth']))
        if startpages not in ["default", "startpages", "pages", "prefixes"]:
            returnD(format_error('ERROR: startpages argument must be one of "startpages", "pages" or "prefixes"'))
        WE = yield self.store.get_webentity_with_pages_and_subWEs(webentity_id, startpages, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        statusval = -1
        for s in ms.WebEntityStatus._NAMES_TO_VALUES:
            if status.lower() == s.lower():
                statusval = s
                break
        if statusval == -1:
            returnD(format_error("ERROR: status argument must be one of '%s'" % "','".join([s.lower() for s in ms.WebEntityStatus._NAMES_TO_VALUES])))
        yield self.store.jsonrpc_set_webentity_status(webentity_id, statusval, corpus=corpus)
        yield self.store.jsonrpc_rm_webentity_tag_value(webentity_id, "CORE", "recrawl_needed", "true", corpus=corpus)
        res = yield self.crawler.jsonrpc_start(webentity_id, WE['starts'], WE['lrus'], WE['subWEs'], config['discoverPrefixes'], maxdepth, phantom_crawl, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentity_logs(self, webentity_id, corpus=DEFAULT_CORPUS):
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        jobs = yield self.db.list_jobs(corpus, {'webentity_id': webentity_id}, fields=['_id'])
        if not jobs:
            returnD(format_error('No job found for WebEntity %s.' % webentity_id))
        res = yield self.db.list_logs(corpus, [a['_id'] for a in list(jobs)])
        returnD(format_result([{'timestamp': log['timestamp'], 'job': log['_job'], 'log': log['log']} for log in list(res)]))

  # HTTP LOOKUP METHODS

    def jsonrpc_lookup_httpstatus(self, url, timeout=30, corpus=None):
        return self.lookup_httpstatus(url, deadline=time.time()+timeout, corpus=corpus)

    @inlineCallbacks
    def lookup_httpstatus(self, url, timeout=5, deadline=0, tryout=0, noproxy=False, corpus=None):
        res = format_result(0)
        timeout = int(timeout)
        use_proxy = config['proxy']['host'] and not noproxy
        try:
            url = urllru.url_clean(str(url))
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
            if use_proxy and config['proxy']['host'] in str(e):
                res['message'] = "Proxy not responding"
                res['result'] = -2
            else:
                res['message'] = "DNS not found for url %s : %s" % (url, e)
        except Exception as e:
            res['result'] = -1
            res['message'] = "Cannot process url %s : %s." % (url, e)
        if 'message' in res:
            returnD(res)
        try:
            assert(response.code == 200 or url in " ".join(response.headers._rawHeaders['location']))
            response.code = 200
        except:
            try:
                assert(url.startswith("http:") and tryout == 4 and response.code == 403 and "IIS" in response.headers._rawHeaders['server'][0])
                response.code = 301
            except:
                if not (deadline and deadline < time.time()) and \
                   not (url.startswith("https") and response.code/100 == 4) and \
                   (use_proxy or response.code in [403, 405, 500, 501, 503]):
                    if tryout == 5 and use_proxy:
                        noproxy = True
                        tryout = 3
                    if tryout < 5:
                        if config['DEBUG']:
                            logger.msg("Retry lookup %s %s %s %s" % (method, url, tryout, response.__dict__), system="DEBUG - %s" % corpus)
                        res = yield self.lookup_httpstatus(url, timeout=timeout+2, tryout=tryout+1, noproxy=noproxy, deadline=deadline, corpus=corpus)
                        returnD(res)
        returnD(format_result(response.code))

    @inlineCallbacks
    def jsonrpc_lookup(self, url, timeout=30, noproxy=False, corpus=None):
        res = yield self.jsonrpc_lookup_httpstatus(url, timeout=timeout, corpus=corpus)
        if res['code'] == 'success' and (res['result'] == 200 or 300 < res['result'] < 400):
            returnD(format_result("true"))
        returnD(format_result("false"))


# CRAWLER'S DEDICATED API
# accessible jsonrpc methods via "crawl."

class Crawler(jsonrpc.JSONRPC):

    scrapy_url = 'http://%s:%s/' % (config['mongo-scrapy']['host'], config['mongo-scrapy']['scrapy_port'])

    def __init__(self, parent=None):
        jsonrpc.JSONRPC.__init__(self)
        self.parent = parent
        self.db = self.parent.db
        self.corpora = self.parent.corpora

    @inlineCallbacks
    def deploy_spider(self, corpus=DEFAULT_CORPUS):
        output = subprocess.Popen(['bash', 'bin/deploy_scrapy_spider.sh', corpus, '--noenv'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT).communicate()[0]
        res = yield self.send_scrapy_query('listprojects')
        if is_error(res) or "projects" not in res or corpus_project(corpus) not in res['projects']:
            returnD(format_error(output))
        returnD(format_result('Spider %s deployed' % corpus_project(corpus)))

    @inlineCallbacks
    def jsonrpc_cancel_all(self, corpus=DEFAULT_CORPUS):
        """Stops all current crawls."""
        list_jobs = yield self.jsonrpc_list(corpus)
        if is_error(list_jobs):
            returnD(list_jobs)
        list_jobs = list_jobs['result']
        for item in list_jobs['running'] + list_jobs['pending']:
            res = yield self.jsonrpc_cancel(item['id'], corpus=corpus)
            if config['DEBUG']:
                logger.msg(res, system="DEBUG - %s" % corpus)
        while 'running' in list_jobs and len(list_jobs['running']):
            list_jobs = yield self.jsonrpc_list(corpus)
            if not is_error(list_jobs):
                list_jobs = list_jobs['result']
        returnD(format_result('All crawling jobs canceled.'))

    def jsonrpc_reinitialize(self, corpus=DEFAULT_CORPUS):
        return self.reinitialize(corpus)

    @inlineCallbacks
    def reinitialize(self, corpus=DEFAULT_CORPUS, recreate=True, quiet=False):
        """Cancels all current crawl jobs running or planned and empty mongodbs."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not quiet:
            logger.msg("Empty crawl list + mongodb queue", system="INFO - %s" % corpus)
        if self.corpora[corpus]['jobs_loop'].running:
            self.corpora[corpus]['jobs_loop'].stop()
        canceljobs = yield self.jsonrpc_cancel_all(corpus)
        if is_error(canceljobs):
            returnD(canceljobs)
        try:
            yield self.db.drop_corpus_collections(corpus)
            if recreate:
                yield self.db.init_corpus_indexes(corpus)
        except:
            returnD(format_error('Error while resetting mongoDB.'))
        if recreate:
            self.corpora[corpus]['jobs_loop'].start(1, False)
        returnD(format_result('Crawling database reset.'))

    @inlineCallbacks
    def send_scrapy_query(self, action, arguments=None, tryout=0):
        url = "%s%s.json" % (self.scrapy_url, action)
        method = "POST"
        headers = None
        if action.startswith('list'):
            method = "GET"
            if arguments:
                url += '?'+'&'.join([str(k)+'='+str(v) for (k, v) in arguments.iteritems()])
                arguments = None
        elif arguments:
            arguments = urlencode(arguments)
            headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        try:
            res = yield getPage(url, method=method, postdata=arguments, headers=headers, timeout=10)
            result = json.loads(res)
            returnD(result)
        except ConnectionRefusedError:
            returnD(format_error("Could not contact scrapyd server, maybe it's not started..."))
        except Exception as e:
            returnD(format_error(e))

    @inlineCallbacks
    def jsonrpc_start(self, webentity_id, starts, follow_prefixes, nofollow_prefixes, discover_prefixes=config['discoverPrefixes'], maxdepth=config['mongo-scrapy']['maxdepth'], phantom_crawl=False, download_delay=config['mongo-scrapy']['download_delay'], corpus=DEFAULT_CORPUS):
        """Starts a crawl with scrapy from arguments using a list of urls and of lrus for prefixes."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not phantom_crawl and urls_match_domainlist(starts, config['phantom']['whitelist_domains']):
            phantom_crawl = True
        if maxdepth > config['mongo-scrapy']['maxdepth']:
            returnD(format_error('No crawl with a bigger depth than %d is allowed on this Hyphe instance.' % config['mongo-scrapy']['maxdepth']))
        if not starts:
            returnD(format_error('No startpage defined for crawling WebEntity %s.' % webentity_id))
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
        res = yield self.send_scrapy_query('schedule', args)
        if is_error(res):
            returnD(reformat_error(res))
        if 'jobid' in res:
            ts = int(time.time()*1000)
            yield self.db.add_job(corpus, res['jobid'], webentity_id, args, ts)
            yield self.db.add_log(corpus, res['jobid'], "CRAWL_ADDED", ts)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_cancel(self, job_id, corpus=DEFAULT_CORPUS):
        """Cancels a scrapy job with id job_id."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        logger.msg("Cancel crawl: %s" % job_id, system="INFO - %s" % corpus)
        args = {'project': corpus_project(corpus),
                  'job': job_id}
        res = yield self.send_scrapy_query('cancel', args)
        if is_error(res):
            returnD(reformat_error(res))
        if 'prevstate' in res:
            yield self.db.update_jobs(corpus, job_id, {'crawling_status': crawling_statuses.CANCELED})
            yield self.db.add_log(corpus, job_id, "CRAWL_"+crawling_statuses.CANCELED)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_list(self, corpus=DEFAULT_CORPUS):
        """Calls Scrappy monitoring API, returns list of scrapy jobs."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        res = yield self.send_scrapy_query('listjobs', {'project': corpus_project(corpus)})
        if is_error(res):
            returnD(reformat_error(res))
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_job_logs(self, job_id, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        res = yield self.db.list_logs(corpus, job_id)
        if not res:
            returnD(format_error('No log found for job %s.' % job_id))
        returnD(format_result([{'timestamp': log['timestamp'], 'log': log['log']} for log in res]))


# MEMORYSTRUCTURE's DEDICATED API
# accessible jsonrpc methods via "store."

class Memory_Structure(jsonrpc.JSONRPC):

    def __init__(self, parent=None):
        jsonrpc.JSONRPC.__init__(self)
        self.parent = parent
        self.db = self.parent.db
        self.corpora = self.parent.corpora
        self.msclients = self.parent.msclients

    @inlineCallbacks
    def _start_loop(self, corpus=DEFAULT_CORPUS, noloop=False):
        now = time.time()
        yield self.handle_index_error(corpus)
        self.corpora[corpus]['loop_running'] = "Collecting WebEntities & WebEntityLinks"
        self.corpora[corpus]['loop_running_since'] = now
        self.corpora[corpus]['last_WE_update'] = now
        self.corpora[corpus]['recent_indexes'] = 0
        self.corpora[corpus]['recent_tagging'] = True
        self.corpora[corpus]['tags'] = {}
        self.corpora[corpus]['webentities'] = []
        self.corpora[corpus]['webentities_links'] = []
        self.corpora[corpus]['precision_exceptions'] = []
        if not noloop:
            reactor.callLater(3, deferToThread, self.jsonrpc_get_precision_exceptions, corpus=corpus)
            reactor.callLater(3, self.jsonrpc_get_webentities, light=True, corelinks=True, corpus=corpus)
            reactor.callLater(10, self.corpora[corpus]['index_loop'].start, 1, True)

    @inlineCallbacks
    def format_webentity(self, WE, jobs=None, light=False, semilight=False, light_for_csv=False, corpus=DEFAULT_CORPUS):
        if not WE:
            returnD(None)
        res = {'id': WE.id, 'name': WE.name}
        if test_bool_arg(light):
            returnD(res)
        res['lru_prefixes'] = list(WE.LRUSet)
        res['status'] = WE.status
        res['creation_date'] = WE.creationDate
        res['last_modification_date'] = WE.lastModificationDate
        if test_bool_arg(semilight):
            returnD(res)
        res['homepage'] = WE.homepage
        res['startpages'] = list(WE.startpages)
        res['tags'] = {}
        for tag, values in WE.metadataItems.iteritems():
            res['tags'][tag] = {}
            for key, val in values.iteritems():
                res['tags'][tag][key] = list(val)
        if test_bool_arg(light_for_csv):
            returnD({'id': WE.id, 'name': WE.name, 'status': WE.status,
                    'prefixes': "|".join([urllru.lru_to_url(lru, nocheck=True) for lru in WE.LRUSet]),
                    'tags': "|".join(["|".join(res['tags'][ns][key]) for ns in res['tags'] for key in res['tags'][ns] if ns != "CORE"])})
        # pages = yield self.msclients.pool.getWebEntityCrawledPages(WE.id, corpus=corpus)
        # nb_pages = len(pages)
        # nb_links
        job = None
        if not jobs:
            job = yield self.db.list_jobs(corpus, {'webentity_id': WE.id}, fields=['crawling_status', 'indexing_status'], filter=sortdesc('timestamp'), limit=1)
        elif WE.id in jobs:
            job = jobs[WE.id]
        if job:
            res['crawling_status'] = job['crawling_status']
            res['indexing_status'] = job['indexing_status']
        else:
            res['crawling_status'] = crawling_statuses.UNCRAWLED
            res['indexing_status'] = indexing_statuses.UNINDEXED
        returnD(res)

    @inlineCallbacks
    def format_webentities(self, WEs, jobs=None, light=False, semilight=False, light_for_csv=False, corpus=DEFAULT_CORPUS):
        res = []
        for WE in WEs:
            fWE = yield self.format_webentity(WE, jobs, light, semilight, light_for_csv, corpus=corpus)
            res.append(fWE)
        returnD(res)

    def reset(self, corpus=DEFAULT_CORPUS, quiet=False):
        if not quiet:
            logger.msg("Empty memory structure content", system="INFO - %s" % corpus)
        res = self.msclients.sync.clearIndex(corpus=corpus)
        if is_error(res):
            return res
        return self.ensureDefaultCreationRuleExists(corpus, quiet=quiet)

    @inlineCallbacks
    def jsonrpc_get_all_nodelinks(self, corpus=DEFAULT_CORPUS):
        res = yield self.msclients.pool.getNodeLinks(corpus=corpus)
        returnD(handle_standard_results(res))

    def jsonrpc_delete_all_nodelinks(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        self.corpora[corpus]['recent_indexes'] += 1
        return handle_standard_results(self.msclients.sync.deleteNodeLinks(corpus=corpus))

    def ensureDefaultCreationRuleExists(self, corpus=DEFAULT_CORPUS, quiet=False):
        rules = self.msclients.sync.getWebEntityCreationRules(corpus=corpus)
        if self.msclients.test_corpus(corpus) and (is_error(rules) or len(rules) == 0):
            default_regexp = "(s:[a-zA-Z]+\\|(t:[0-9]+\\|)?(h:[^\\|]+\\|)(h:[^\\|]+\\|)+)"
            if corpus != DEFAULT_CORPUS and not quiet:
                logger.msg("Saves default WE creation rule", system="INFO - %s" % corpus)
            res = self.msclients.sync.addWebEntityCreationRule(ms.WebEntityCreationRule(default_regexp, ''), corpus=corpus)
            if is_error(res):
                return res
            return format_result('Default creation rule created')
        return format_result('Default creation rule was already created')

    def jsonrpc_reinitialize(self, corpus=DEFAULT_CORPUS):
        return self.reinitialize(corpus)

    @inlineCallbacks
    def reinitialize(self, corpus=DEFAULT_CORPUS, noloop=False, quiet=False):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if self.corpora[corpus]['index_loop'].running:
            self.corpora[corpus]['index_loop'].stop()
        self.reset(corpus, quiet=quiet)
        yield self._start_loop(corpus, noloop=noloop)
        returnD(format_result("MemoryStructure reinitialized"))

    @inlineCallbacks
    def return_new_webentity(self, lru_prefix, new=False, source=None, corpus=DEFAULT_CORPUS):
        WE = self.msclients.sync.findWebEntityMatchingLRUPrefix(lru_prefix, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        if test_bool_arg(new):
            self.corpora[corpus]['recent_indexes'] += 1
            self.corpora[corpus]['total_webentities'] += 1
            if source:
                self.jsonrpc_add_webentity_tag_value(WE.id, 'CORE', 'user_created_via', source)
        WE = yield self.format_webentity(WE, corpus=corpus)
        WE['created'] = True if new else False
        returnD(WE)

    def handle_url_precision_exceptions(self, url, corpus=DEFAULT_CORPUS):
        lru = urllru.url_to_lru_clean(url, False)
        return self.handle_lru_precision_exceptions(lru, corpus=corpus)

    def handle_lru_precision_exceptions(self, lru_prefix, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        lru_head = urllru.lru_get_head(lru_prefix, self.corpora[corpus]['precision_exceptions'])
        if not urllru.lru_is_node(lru_prefix, config["precisionLimit"], lru_head=lru_head) and lru_prefix != lru_head:
            res = self.msclients.sync.addPrecisionExceptions([lru_prefix], corpus=corpus)
            if is_error(res):
                return res
            self.corpora[corpus]['precision_exceptions'].append(lru_prefix)
            return format_result("LRU Precision Exceptions handled")

    @inlineCallbacks
    def declare_page(self, url, corpus=DEFAULT_CORPUS):
        try:
            url, lru = urllru.url_clean_and_convert(url)
        except ValueError as e:
            returnD(format_error(e))
        res = self.handle_lru_precision_exceptions(lru, corpus=corpus)
        if is_error(res):
            returnD(res)
        is_node = urllru.lru_is_node(lru, config["precisionLimit"], self.corpora[corpus]['precision_exceptions'])
        is_full_precision = urllru.lru_is_full_precision(lru, self.corpora[corpus]['precision_exceptions'])
        t = str(int(time.time()*1000))
        page = ms.PageItem(url, lru, t, None, -1, None, ['USER'], is_full_precision, is_node, {})
        cache_id = self.msclients.sync.createCache([page], corpus=corpus)
        if is_error(cache_id):
            returnD(cache_id)
        res = self.msclients.sync.indexCache(cache_id, corpus=corpus)
        if is_error(res):
            returnD(res)
        new = self.msclients.sync.createWebEntitiesFromCache(cache_id, corpus=corpus)
        if is_error(new):
            returnD(new)
        res = yield self.return_new_webentity(lru, new, 'page', corpus=corpus)
        returnD(format_result(res))

    def jsonrpc_declare_webentity_by_lruprefix_as_url(self, url, name=None, status=None, startPages=[], corpus=DEFAULT_CORPUS):
        try:
            url, lru_prefix = urllru.url_clean_and_convert(url, False)
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_declare_webentity_by_lrus([lru_prefix], name, status, startPages, corpus=corpus)

    def jsonrpc_declare_webentity_by_lru(self, lru_prefix, name=None, status=None, startPages=[], corpus=DEFAULT_CORPUS):
        return self.jsonrpc_declare_webentity_by_lrus([lru_prefix], name, status, startPages, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_declare_webentity_by_lrus(self, list_lrus, name=None, status=None, startPages=[], corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
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
                returnD(format_error(e))
            existing = self.msclients.sync.getWebEntityByLRUPrefix(lru, corpus=corpus)
            if not is_error(existing):
                returnD(format_error('LRU prefix "%s" is already set to an existing WebEntity : %s' % (lru, existing)))
            if not name:
                name = urllru.url_shorten(url)
            lru_prefixes_list.append(lru)
        WE = ms.WebEntity(id=None, LRUSet=lru_prefixes_list, name=name)
        if startPages:
            if not isinstance(startPages, list):
                startPages = [startPages]
            WE.startpages = startPages
        if status:
            for s in ms.WebEntityStatus._NAMES_TO_VALUES:
                if status.lower() == s.lower():
                    WE.status = s
                    break
            if not WE.status:
                returnD(format_error('Status %s is not a valid WebEntity Status, please provide one of the following values: %s' % (status, ms.WebEntityStatus._NAMES_TO_VALUES.keys())))
        res = self.msclients.sync.updateWebEntity(WE, corpus=corpus)
        if is_error(res):
            returnD(res)
        new_WE = yield self.return_new_webentity(WE.LRUSet[0], True, 'lru', corpus=corpus)
        if is_error(new_WE):
            returnD(new_WE)
        for lru in new_WE['lru_prefixes']:
            res = self.handle_lru_precision_exceptions(lru, corpus=corpus)
            if is_error(res):
                returnD(res)
        returnD(format_result(new_WE))

    def update_webentity(self, webentity_id, field_name, value, array_behavior=None, array_key=None, array_namespace=None, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        WE = self.msclients.sync.getWebEntity(webentity_id, corpus=corpus)
        if is_error(WE):
           return format_error("ERROR could not retrieve WebEntity with id %s" % webentity_id)
        if field_name == "metadataItems":
            self.corpora[corpus]['recent_tagging'] = True
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

    def jsonrpc_rename_webentity(self, webentity_id, new_name, corpus=DEFAULT_CORPUS):
        if not new_name or new_name == "":
            return format_error("ERROR: please specify a value for the WebEntity's name")
        return self.update_webentity(webentity_id, "name", new_name, corpus=corpus)

    def jsonrpc_change_webentity_id(self, webentity_old_id, webentity_new_id, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        res = self.update_webentity(webentity_old_id, "id", webentity_new_id, corpus=corpus)
        if is_error(res):
            return format_error('ERROR a WebEntity with id %s already seems to exist' % webentity_new_id)
        res = self.jsonrpc_delete_webentity(webentity_old_id, corpus=corpus)
        if is_error(res):
            return format_error('ERROR a WebEntity with id %s already seems to exist' % webentity_new_id)
        self.corpora[corpus]['total_webentities'] += 1
        return format_result("WebEntity %s was re-ided as %s" % (webentity_old_id, webentity_new_id))

    def jsonrpc_set_webentity_status(self, webentity_id, status, corpus=DEFAULT_CORPUS):
        return self.update_webentity(webentity_id, "status", status, corpus=corpus)

    def jsonrpc_set_webentity_homepage(self, webentity_id, homepage, corpus=DEFAULT_CORPUS):
        try:
            homepage, _ = urllru.url_clean_and_convert(url)
        except ValueError as e:
            return format_error(e)
        return self.update_webentity(webentity_id, "homepage", homepage, corpus=corpus)

    def add_backend_tags(self, webentity_id, key, value, corpus=DEFAULT_CORPUS):
        self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", key, value, corpus=corpus)
        self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", "recrawl_needed", "true", corpus=corpus)

    def jsonrpc_add_webentity_lruprefix(self, webentity_id, lru_prefix, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
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

    def jsonrpc_rm_webentity_lruprefix(self, webentity_id, lru_prefix, corpus=DEFAULT_CORPUS):
        """ Will delete WebEntity if no LRUprefix left"""
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        try:
            url, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
        except ValueError as e:
            return format_error(e)
        self.add_backend_tags(webentity_id, "lruprefixes_modified", "removed %s" % lru_prefix, corpus=corpus)
        res = self.update_webentity(webentity_id, "LRUSet", lru_prefix, "pop", corpus=corpus)
        self.corpora[corpus]['recent_indexes'] += 1
        return res

    def jsonrpc_add_webentity_startpage(self, webentity_id, startpage_url, corpus=DEFAULT_CORPUS):
        try:
            startpage_url, _ = urllru.url_clean_and_convert(startpage_url)
        except ValueError as e:
            return format_error(e)
        self.add_backend_tags(webentity_id, "startpages_modified", "added %s" % startpage_url, corpus=corpus)
        return self.update_webentity(webentity_id, "startpages", startpage_url, "push", corpus=corpus)

    def jsonrpc_rm_webentity_startpage(self, webentity_id, startpage_url, corpus=DEFAULT_CORPUS):
        try:
            startpage_url, _ = urllru.url_clean_and_convert(startpage_url)
        except ValueError as e:
            return format_error(e)
        self.add_backend_tags(webentity_id, "startpages_modified", "removed %s" % startpage_url, corpus=corpus)
        return self.update_webentity(webentity_id, "startpages", startpage_url, "pop", corpus=corpus)

    def jsonrpc_add_webentity_tag_value(self, webentity_id, tag_namespace, tag_key, tag_value, corpus=DEFAULT_CORPUS):
        return self.update_webentity(webentity_id, "metadataItems", tag_value, "push", tag_key, tag_namespace, corpus=corpus)

    def jsonrpc_rm_webentity_tag_key(self, webentity_id, tag_namespace, tag_key, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_set_webentity_tag_values(webentity_id, tag_namespace, tag_key, [], corpus=corpus)

    def jsonrpc_rm_webentity_tag_value(self, webentity_id, tag_namespace, tag_key, tag_value, corpus=DEFAULT_CORPUS):
        return self.update_webentity(webentity_id, "metadataItems", tag_value, "pop", tag_key, tag_namespace, corpus=corpus)

    def jsonrpc_set_webentity_tag_values(self, webentity_id, tag_namespace, tag_key, tag_values, corpus=DEFAULT_CORPUS):
        if not isinstance(tag_values, list):
            tag_values = list(tag_values)
        return self.update_webentity(webentity_id, "metadataItems", tag_values, "update", tag_key, tag_namespace, corpus=corpus)

    def jsonrpc_merge_webentity_into_another(self, old_webentity_id, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
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

    def jsonrpc_delete_webentity(self, webentity_id, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
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
    def index_batch(self, page_items, jobid, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(False)
        ids = [bson.ObjectId(str(record['_id'])) for record in page_items]
        nb_crawled_pages = len(ids)
        if not nb_crawled_pages:
            returnD(False)
        pages, links = yield deferToThread(processor.generate_cache_from_pages_list, page_items, config["precisionLimit"], self.corpora[corpus]['precision_exceptions'], config['DEBUG'] > 0)
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
        yield self.db.clean_queue(corpus, ids)
        tot_crawled_pages = yield self.db.count_pages(corpus, jobid)
        yield self.db.update_jobs(corpus, jobid, {'nb_crawled_pages': tot_crawled_pages, 'indexing_status': indexing_statuses.BATCH_FINISHED}, inc={'nb_pages': nb_pages, 'nb_links': nb_links})
        yield self.db.add_log(corpus, jobid, "INDEX_"+indexing_statuses.BATCH_FINISHED)
        returnD(True)


    def jsonrpc_trigger_links(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        self.corpora[corpus]['recent_indexes'] += 105
        return format_result("Links generation should start soon")

    @inlineCallbacks
    def index_batch_loop(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus) or self.corpora[corpus]['loop_running']:
            returnD(False)
        self.corpora[corpus]['loop_running'] = "Diagnosing"
        crashed = yield self.db.list_jobs(corpus, {'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'], limit=1)
        if crashed:
            self.corpora[corpus]['loop_running'] = "Cleaning up crashed indexing"
            logger.msg("Indexing job declared as running but probably crashed ,trying to restart it.", system="WARNING - %s" % corpus)
            yield self.db.update_jobs(corpus, crashed['_id'], {'indexing_status': indexing_statuses.BATCH_CRASHED})
            yield self.db.add_log(corpus, crashed['_id'], "INDEX_"+indexing_statuses.BATCH_CRASHED)
            self.corpora[corpus]['loop_running'] = None
            returnD(False)
        oldest_page_in_queue = yield self.db.get_queue(corpus, limit=1, fields=["_job"], skip=random.randint(0, 2))
        # Run linking WebEntities on a regular basis when needed
        if self.corpora[corpus]['recent_indexes'] > 100 or (self.corpora[corpus]['recent_indexes'] and not oldest_page_in_queue) or (self.corpora[corpus]['recent_indexes'] and time.time() - self.corpora[corpus]['last_links_loop'] >= 3600):
            self.corpora[corpus]['loop_running'] = "Computing links between WebEntities"
            self.corpora[corpus]['loop_running_since'] = time.time()
            s = time.time()
            logger.msg("Generating links between web entities...", system="INFO - %s" % corpus)
            yield self.db.add_log(corpus, "WE_LINKS", "Starting WebEntity links generation...")
            res = yield self.msclients.loop.generateWebEntityLinks(corpus=corpus)
            if is_error(res):
                logger.msg(res['message'], system="ERROR - %s" % corpus)
                self.corpora[corpus]['loop_running'] = None
                returnD(False)
            self.corpora[corpus]['webentities_links'] = res
            s = str(time.time() -s)
            yield self.db.add_log(corpus, "WE_LINKS", "...finished WebEntity links generation (%ss)" %s)
            logger.msg("...processed WebEntity links in %ss..." % s, system="INFO - %s" % corpus)
            self.corpora[corpus]['recent_indexes'] = 0
            self.corpora[corpus]['last_links_loop'] = time.time()
        elif oldest_page_in_queue:
            # find next job to be indexed and set its indexing status to batch_running
            self.corpora[corpus]['loop_running'] = "Indexing crawled pages"
            job = yield self.db.list_jobs(corpus, {'_id': oldest_page_in_queue['_job'], 'crawling_status': {'$ne': crawling_statuses.PENDING}, 'indexing_status': {'$ne': indexing_statuses.BATCH_RUNNING}}, fields=['_id'], limit=1)
            if not job:
                self.corpora[corpus]['loop_running'] = None
                returnD(False)
            jobid = job['_id']
            logger.msg("Indexing pages from job %s" % jobid, system="INFO - %s" % corpus)
            page_items = yield self.db.get_queue(corpus, {'_job': jobid}, limit=config['memoryStructure']['max_simul_pages_indexing'])
            if page_items:
                yield self.db.update_jobs(corpus, jobid, {'indexing_status': indexing_statuses.BATCH_RUNNING})
                yield self.db.add_log(corpus, jobid, "INDEX_"+indexing_statuses.BATCH_RUNNING)
                self.corpora[corpus]['loop_running_since'] = time.time()
                res = yield self.index_batch(page_items, jobid, corpus=corpus)
                if is_error(res):
                    logger.msg(res['message'], system="ERROR - %s" % corpus)
                    self.corpora[corpus]['loop_running'] = None
                    returnD(False)
                self.corpora[corpus]['recent_indexes'] += 1
                self.corpora[corpus]['last_index_loop'] = time.time()
            else:
                logger.msg("job %s found for index but no page corresponding found in queue." % jobid, system="WARNING - %s" % corpus)
        else:
            self.corpora[corpus]['loop_running'] = None
            returnD(False)
        logger.msg("...loop run finished.", system="INFO - %s" % corpus)
        self.corpora[corpus]['loop_running'] = None

    @inlineCallbacks
    def handle_index_error(self, corpus=DEFAULT_CORPUS):
        # clean possible previous index crashes
        res = yield self.db.list_jobs(corpus, {'indexing_status': indexing_statuses.BATCH_CRASHED}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'indexing_status': indexing_statuses.PENDING})
            yield self.db.add_log(corpus, update_ids, "INDEX_"+indexing_statuses.PENDING)

    def jsonrpc_get_precision_exceptions(self, corpus=DEFAULT_CORPUS):
        exceptions = self.msclients.sync.getPrecisionExceptions(corpus=corpus)
        if is_error(exceptions):
            return exceptions
        self.corpora[corpus]['precision_exceptions'] = exceptions
        return format_result(exceptions)

    def jsonrpc_remove_precision_exceptions(self, list_exceptions, corpus=DEFAULT_CORPUS):
        res = self.msclients.sync.removePrecisionExceptions(list_exceptions, corpus=corpus)
        if is_error(res):
            return res
        for e in list_exceptions:
            self.corpora[corpus]['precision_exceptions'].remove(e)
        return format_result("Precision Exceptions %s removed." % list_exceptions)

    @inlineCallbacks
    def ramcache_webentities(self, corpus=DEFAULT_CORPUS):
        WEs = self.corpora[corpus]['webentities']
        if WEs == [] or self.corpora[corpus]['recent_indexes'] or self.corpora[corpus]['last_links_loop'] > self.corpora[corpus]['last_WE_update']:
            WEs = yield self.msclients.pool.getWebEntities(corpus=corpus)
            if is_error(WEs):
                returnD(WEs)
            self.corpora[corpus]['last_WE_update'] = time.time()
            self.corpora[corpus]['webentities'] = WEs
        self.corpora[corpus]['total_webentities'] = len(WEs)
        returnD(WEs)

    def jsonrpc_get_webentity(self, we_id, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_get_webentities([we_id], corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentities(self, list_ids=None, light=False, semilight=False, corelinks=False, light_for_csv=False, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
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
            res = yield self.db.list_jobs(corpus, {'webentity_id': {'$in': [WE.id for WE in WEs]}}, fields=['webentity_id', 'crawling_status', 'indexing_status'])
            for job in res:
                jobs[job['webentity_id']] = job
        else:
            if test_bool_arg(corelinks):
                logger.msg("Collecting WebEntities...", system="INFO - %s" % corpus)
            WEs = yield self.ramcache_webentities(corpus)
            if is_error(WEs):
                returnD(WEs)
            jobs = None
        res = yield self.format_webentities(WEs, jobs, light, semilight, light_for_csv, corpus=corpus)
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
    def jsonrpc_advanced_search_webentities(self, allFieldsKeywords=[], fieldKeywords=[], corpus=DEFAULT_CORPUS):
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
        WEs = yield self.msclients.pool.searchWebEntities(afk, fk, corpus=corpus)
        if is_error(WEs):
            returnD(WEs)
        res = yield self.format_webentities(WEs, light=True, corpus=corpus)
        returnD(format_result(res))

    def jsonrpc_escape_search_query(self, query, corpus=DEFAULT_CORPUS):
        for char in ["\\", "+", "-", "!", "(", ")", ":", "^", "[", "]", "{", "}", "~", "*", "?"]:
            query = query.replace(char, "\\%s" % char)
        return query.replace(' ', '?')

    def _optionnal_field_search(self, query, field=None, corpus=DEFAULT_CORPUS):
        if field:
            if not isinstance(field, unicode):
                field = unicode(field)
            return self.jsonrpc_advanced_search_webentities([], [[field, query]], corpus=corpus)
        return self.jsonrpc_advanced_search_webentities([query], corpus=corpus)

    def jsonrpc_exact_search_webentities(self, query, field=None, corpus=DEFAULT_CORPUS):
        query = self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, corpus=corpus)

    def jsonrpc_prefixed_search_webentities(self, query, field=None, corpus=DEFAULT_CORPUS):
        query = "%s*" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, corpus=corpus)

    def jsonrpc_postfixed_search_webentities(self, query, field=None, corpus=DEFAULT_CORPUS):
        query = "*%s" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, corpus=corpus)

    def jsonrpc_free_search_webentities(self, query, field=None, corpus=DEFAULT_CORPUS):
        query = "*%s*" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, corpus=corpus)

    def jsonrpc_get_webentities_by_status(self, status, corpus=DEFAULT_CORPUS):
        status = status.lower()
        valid_statuses = [s.lower() for s in ms.WebEntityStatus._NAMES_TO_VALUES]
        if status not in valid_statuses:
            returnD(format_error("ERROR: status argument must be one of %s" % ",".join(valid_statuses)))
        return self.jsonrpc_exact_search_webentities(status, 'STATUS', corpus=corpus)

    def jsonrpc_get_webentities_by_name(self, name, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_exact_search_webentities(name, 'NAME', corpus=corpus)

    def jsonrpc_get_webentities_by_tag_value(self, value, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_exact_search_webentities(value, 'TAG_VALUE', corpus=corpus)

    def jsonrpc_get_webentities_by_tag_category(self, category, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_exact_search_webentities(category, 'TAG_CATEGORY', corpus=corpus)

    def jsonrpc_get_webentities_by_user_tag(self, category, value, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_exact_search_webentities("USER:%s=%s" % (category, value), 'TAG', corpus=corpus)

    def jsonrpc_get_webentity_by_lruprefix_as_url(self, url, corpus=DEFAULT_CORPUS):
        try:
            _, lru = urllru.url_clean_and_convert(url)
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_get_webentity_by_lruprefix(lru, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentity_by_lruprefix(self, lru_prefix, corpus=DEFAULT_CORPUS):
        try:
            lru_prefix = urllru.lru_clean(lru_prefix)
        except ValueError as e:
            returnD(format_error(e))
        WE = yield self.msclients.pool.getWebEntityByLRUPrefix(lru_prefix, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        if WE.name == ms_const.DEFAULT_WEBENTITY:
            returnD(format_error("No matching WebEntity found for lruprefix %s" % lru_prefix))
        res = yield self.format_webentity(WE, corpus=corpus)
        returnD(format_result(res))

    def jsonrpc_get_webentity_for_url(self, url, corpus=DEFAULT_CORPUS):
        try:
            _, lru = urllru.url_clean_and_convert(url)
        except ValueError as e:
            returnD(format_error(e))
        returnD(self.jsonrpc_get_webentity_for_url_as_lru(lru, corpus=corpus))

    @inlineCallbacks
    def jsonrpc_get_webentity_for_url_as_lru(self, lru, corpus=DEFAULT_CORPUS):
        try:
            url, lru = urllru.lru_clean_and_convert(lru)
        except ValueError as e:
            returnD(format_error(e))
        WE = yield self.msclients.pool.findWebEntityMatchingLRUPrefix(lru, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        if WE.name == ms_const.DEFAULT_WEBENTITY:
            returnD(format_error("No matching WebEntity found for url %s" % url))
        res = yield self.format_webentity(WE, corpus=corpus)
        returnD(format_result(res))

    @inlineCallbacks
    def ramcache_tags(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        tags = self.corpora[corpus]['tags']
        if tags == {} or self.corpora[corpus]['recent_tagging']:
            tags = yield self.msclients.pool.getTags(corpus=corpus)
            if is_error(tags):
                returnD(tags)
            self.corpora[corpus]['recent_tagging'] = False
            self.corpora[corpus]['tags'] = tags
        returnD(tags)

    @inlineCallbacks
    def jsonrpc_get_tags(self, corpus=DEFAULT_CORPUS):
        tags = yield self.ramcache_tags(corpus)
        returnD(format_result(tags))

    @inlineCallbacks
    def jsonrpc_get_tag_namespaces(self, corpus=DEFAULT_CORPUS):
        tags = yield self.ramcache_tags(corpus)
        returnD(format_result(tags.keys()))

    @inlineCallbacks
    def jsonrpc_get_tag_categories(self, namespace=None, corpus=DEFAULT_CORPUS):
        tags = yield self.ramcache_tags(corpus)
        categories = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                categories |= set(tags[ns].keys())
        returnD(format_result(list(categories)))

    @inlineCallbacks
    def jsonrpc_get_tag_values(self, namespace=None, category=None, corpus=DEFAULT_CORPUS):
        tags = yield self.ramcache_tags(corpus)
        values = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                for cat in tags[ns].keys():
                    if not category or (cat == category):
                        values |= set(tags[ns][cat])
        returnD(format_result(list(values)))

    @inlineCallbacks
    def jsonrpc_get_webentity_pages(self, webentity_id, onlyCrawled=True, corpus=DEFAULT_CORPUS):
        if onlyCrawled:
            pages = yield self.msclients.pool.getWebEntityCrawledPages(webentity_id, corpus=corpus)
        else:
            pages = yield self.msclients.pool.getWebEntityPages(webentity_id, corpus=corpus)
        if is_error(pages):
            returnD(pages)
        formatted_pages = [{'lru': p.lru, 'sources': list(p.sourceSet), 'crawl_timestamp': p.crawlerTimestamp, 'url': p.url, 'depth': p.depth, 'error': p.errorCode, 'http_status': p.httpStatusCode, 'is_node': p.isNode, 'is_full_precision': p.isFullPrecision, 'creation_date': p.creationDate, 'last_modification_date': p.lastModificationDate} for p in pages]
        returnD(format_result(formatted_pages))

    def jsonrpc_get_webentity_subwebentities(self, webentity_id, corpus=DEFAULT_CORPUS):
        return self.get_webentity_relative_webentities(webentity_id, "children", corpus=corpus)

    def jsonrpc_get_webentity_parentwebentities(self, webentity_id, corpus=DEFAULT_CORPUS):
        return self.get_webentity_relative_webentities(webentity_id, "parents", corpus=corpus)

    @inlineCallbacks
    def get_webentity_relative_webentities(self, webentity_id, relative_type="children", corpus=DEFAULT_CORPUS):
        if relative_type != "children" and relative_type != "parents":
            returnD(format_error("ERROR: must set relative type as children or parents"))
        jobs = {}
        if relative_type == "children":
            WEs = yield self.msclients.pool.getWebEntitySubWebEntities(webentity_id, corpus=corpus)
        else:
            WEs = yield self.msclients.pool.getWebEntityParentWebEntities(webentity_id, corpus=corpus)
        if is_error(WEs):
            returnD(WEs)
        jobs = yield self.db.list_jobs(corpus, {'webentity_id': {'$in': [WE.id for WE in WEs]}}, fields=['webentity_id', 'crawling_status', 'indexing_status'])
        for job in jobs:
            jobs[job['webentity_id']] = job
        res = yield self.format_webentities(WEs, jobs, corpus=corpus)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_lru_definedprefixes(self, lru, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
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
    def jsonrpc_get_webentities_network_json(self, corpus=DEFAULT_CORPUS):
        res = yield self.generate_network_WEs("json", corpus=corpus)
        returnD(handle_standard_results(res))

    @inlineCallbacks
    def jsonrpc_generate_webentities_network_gexf(self, corpus=DEFAULT_CORPUS):
        res = yield self.generate_network_WEs("gexf", corpus=corpus)
        if "code" in res:
            returnD(res)
        returnD(format_result('GEXF graph generation started...'))

    @inlineCallbacks
    def jsonrpc_get_webentity_nodelinks_network_json(self, webentity_id=None, outformat="json", include_external_links=False, corpus=DEFAULT_CORPUS):
        if outformat == "gexf":
            returnD(format_error("...GEXF NodeLinks network not implemented yet."))
        s = time.time()
        logger.msg("Generating %s NodeLinks network for WebEntity %s..." % (outformat, webentity_id), system="INFO - %s" % corpus)
        links = yield self.msclients.pool.getWebentityNodeLinks(webentity_id, test_bool_arg(include_external_links), corpus=corpus)
        if is_error(links):
            returnD(links)
        res = [[l.sourceLRU, l.targetLRU, l.weight] for l in links]
        logger.msg("...JSON network generated in %ss" % str(time.time()-s), system="INFO - %s" % corpus)
        returnD(format_result(res))

    @inlineCallbacks
    def get_webentity_with_pages_and_subWEs(self, webentity_id, startpages="default", corpus=DEFAULT_CORPUS):
        WE = yield self.msclients.pool.getWebEntity(webentity_id, corpus=corpus)
        if is_error(WE):
            returnD(format_error("No WebEntity with id %s found" % webentity_id))
        res = {'status': WE.status, 'lrus': list(WE.LRUSet), 'subWEs': []}
        startpages = startpages.lower()
        if startpages == "pages":
            pages = yield self.msclients.pool.getWebEntityCrawledPages(WE.id, corpus=corpus)
            if is_error(pages):
                returnD(pages)
            if pages:
                res['starts'] = [p.url for p in pages]
        elif startpages == "prefixes":
            res['starts'] = [urllru.lru_to_url(lru) for lru in WE.LRUSet]
        else:
            res['starts'] = list(WE.startpages)
        subs = yield self.msclients.pool.getWebEntitySubWebEntities(WE.id, corpus=corpus)
        if is_error(subs):
            returnD(subs)
        if subs:
            res['subWEs'] = [lr for subwe in subs for lr in subwe.LRUSet]
        returnD(res)

    @inlineCallbacks
    def generate_network_WEs(self, outformat="json", corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
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


# TEST API
try:
    core = Core()
except Exception as x:
    print "ERROR: Cannot start API, something should probbaly not have been pushed..."
    if config['DEBUG']:
        print type(x), x
    exit(1)

def test_scrapyd(cor, corpus):
    d = cor.crawler.send_scrapy_query('delproject', {'project': corpus_project(corpus)})
    d.addCallback(test_deploy, cor, corpus)
def test_deploy(res, cor, corpus):
    if is_error(res):
        print "WARNING: Could not delete existing scrapy spider: %s" % res['message']
        print "Trying to deploy anyway"
    d = cor.crawler.deploy_spider(corpus)
    d.addCallback(test_start, cor, corpus)
def test_start(res, cor, corpus):
    if is_error(res):
        return stop_tests(res, cor, corpus, "Could not connect to scrapyd server to deploy spider, please check your server and the configuration in config.json.")
    d = cor.start_corpus(corpus, quiet=True, noloop=True, create_if_missing=True)
    d.addCallback(test_ping, cor, corpus)
def test_ping(res, cor, corpus):
    if is_error(res):
        return stop_tests(res, cor, corpus, "Could not create corpus")
    d = defer.succeed(cor.jsonrpc_ping(corpus, timeout=5))
    d.addCallback(test_destroy, cor, corpus)
def test_destroy(res, cor, corpus):
    if is_error(res):
        return stop_tests(res, cor, corpus, "Could not start corpus")
    d = cor.destroy_corpus(corpus, quiet=True)
    d.addCallback(stop_tests, cor, corpus)
@inlineCallbacks
def stop_tests(res, cor, corpus, msg=None):
    if is_error(res):
        if msg:
            print "ERROR %s: %s" % (corpus, msg)
        print res["message"]
        yield cor.close()
        if reactor.running:
            reactor.stop()
    else:
        print "All tests passed. Ready!"

reactor.callLater(1, test_scrapyd, core, "--test-corpus--")

# Activate default corpus automatically if in monocorpus
if not config["MULTICORPUS"]:
    reactor.callLater(10, core.activate_monocorpus)

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
    application = Application("Hyphe backend API Server")
    server = TCPServer(config['twisted']['port'], site)
    server.setServiceParent(application)
