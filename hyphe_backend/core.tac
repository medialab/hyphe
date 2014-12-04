#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time, random, json
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
from twisted.internet.defer import DeferredList, inlineCallbacks, returnValue as returnD
from twisted.internet.endpoints import TCP4ClientEndpoint
from twisted.internet.error import DNSLookupError, ConnectionRefusedError
from twisted.application.internet import TCPServer
from twisted.application.service import Application
from twisted.web.http_headers import Headers
from twisted.web.client import getPage, Agent, ProxyAgent, HTTPClientFactory, _HTTP11ClientFactory
HTTPClientFactory.noisy = False
_HTTP11ClientFactory.noisy = False
from hyphe_backend import processor
from hyphe_backend.lib import config_hci, urllru, gexf, user_agents, creationrules
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
        yield DeferredList([self.stop_corpus(corpus, quiet=True) for corpus in self.corpora.keys()], consumeErrors=True)
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
            del(corpus["options"])
            corpus.update(self.jsonrpc_test_corpus(corpus.pop('_id'))["result"])
            res[corpus["corpus_id"]] = corpus
        returnD(format_result(res))

    def jsonrpc_get_corpus_options(self, corpus=DEFAULT_CORPUS):
        if not self.corpus_ready(corpus):
            return self.corpus_error(corpus)
        return format_result(self.corpora[corpus]["options"])

    @inlineCallbacks
    def jsonrpc_set_corpus_options(self, corpus=DEFAULT_CORPUS, options=None):
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        try:
            config_hci.check_conf_sanity(options, config_hci.CORPUS_CONF_SCHEMA, name="%s options" % corpus, soft=True)
        except Exception as e:
            returnD(format_error(e))
        redeploy = False
        if "precision_limit" in options:
            returnD(format_error("Precision limit of a corpus can only be set when the corpus is created"))
        if "proxy" in options or ("phantom" in options and (\
          "timeout" in options["phantom"] or \
          "ajax_timeout" in options["phantom"] or \
          "idle_timeout" in options["phantom"])):
            if self.corpora[corpus]['crawls_running']:
                returnD(format_error("Please stop currently running crawls before modifiying the crawler's settings"))
            else:
                redeploy = True
        oldram = self.corpora[corpus]["options"]["ram"]
        if "phantom" in options:
            self.corpora[corpus]["options"]["phantom"].update(options.pop("phantom"))
        self.corpora[corpus]["options"].update(options)
        yield self.update_corpus(corpus, force_ram=True)
        if redeploy:
            res = yield self.crawler.deploy_crawler(corpus)
            if is_error(res):
                returnD(res)
        if "ram" in options and options["ram"] != oldram:
            res = yield self.stop_corpus(corpus, quiet=True)
            if is_error(res):
                returnD(res)
            corpus_conf = yield self.db.get_corpus(corpus)
            res = yield self.start_corpus(corpus, password=corpus_conf["password"])
            if is_error(res):
                returnD(res)
        returnD(format_result(self.corpora[corpus]["options"]))

    def corpus_ready(self, corpus):
        if not self.msclients.test_corpus(corpus):
            return False
        if corpus not in self.corpora:
            self.prepare_corpus(corpus)
        return True

    def corpus_error(self, corpus=None):
        if not corpus:
            return format_error("Too many instances running already, please try again later")
        if corpus in self.corpora and not self.msclients.starting_corpus(corpus) and not self.msclients.stopped_corpus(corpus):
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

        self.corpora[corpus] = {
          "name": name,
          "options": {
            "ram": 256,
            "max_depth": config["mongo-scrapy"]["maxdepth"],
            "precision_limit": config["precisionLimit"],
            "follow_redirects": config["discoverPrefixes"],
            "proxy": {
              "host": config["mongo-scrapy"]["proxy_host"],
              "port": config["mongo-scrapy"]["proxy_port"]
            },
            "phantom": {
              "timeout": config["phantom"]["timeout"],
              "idle_timeout": config["phantom"]["idle_timeout"],
              "ajax_timeout": config["phantom"]["ajax_timeout"],
              "whitelist_domains": config["phantom"]["whitelist_domains"]
            }
          }
        }
        if options:
            try:
                config_hci.check_conf_sanity(options, config_hci.CORPUS_CONF_SCHEMA, name="%s options" % corpus, soft=True)
                if "phantom" in options:
                    self.corpora[corpus]["options"]["phantom"].update(options.pop("phantom"))
                self.corpora[corpus]["options"].update(options)
            except Exception as e:
                returnD(format_error(e))
        if not quiet:
            logger.msg("New corpus created", system="INFO - %s" % corpus)
        yield self.db.add_corpus(corpus, name, password, self.corpora[corpus]["options"])
        try:
            res = yield self.crawler.deploy_crawler(corpus, quiet=quiet)
        except Exception as e:
            logger.msg("Could not deploy crawler for new corpus: %s %s" % (type(e), e), system="ERROR - %s" % corpus)
            returnD(format_error("Could not deploy crawler for corpus"))
        if not res:
            logger.msg("Could not deploy crawler for new corpus", system="ERROR - %s" % corpus)
            returnD(res)
        res = yield self.start_corpus(corpus, password=password, noloop=noloop, quiet=quiet)
        returnD(res)

    def jsonrpc_start_corpus(self, corpus=DEFAULT_CORPUS, password=""):
        return self.start_corpus(corpus, password)

    def init_corpus(self, corpus):
        if corpus not in self.corpora:
            self.corpora[corpus] = {}
        now = now_ts()
        self.corpora[corpus]["webentities"] = []
        self.corpora[corpus]["total_webentities"] = 0
        self.corpora[corpus]["webentities_in"] = 0
        self.corpora[corpus]["webentities_out"] = 0
        self.corpora[corpus]["webentities_undecided"] = 0
        self.corpora[corpus]["webentities_discovered"] = 0
        self.corpora[corpus]["tags"] = {}
        self.corpora[corpus]["webentities_links"] = None
        self.corpora[corpus]["webentities_ranks"] = {}
        self.corpora[corpus]["precision_exceptions"] = []
        self.corpora[corpus]["crawls"] = 0
        self.corpora[corpus]["crawls_running"] = 0
        self.corpora[corpus]["crawls_pending"] = 0
        self.corpora[corpus]["pages_found"] = 0
        self.corpora[corpus]["pages_crawled"] = 0
        self.corpora[corpus]["pages_queued"] = 0
        self.corpora[corpus]["links_found"] = 0
        self.corpora[corpus]["last_WE_update"] = now
        self.corpora[corpus]["last_index_loop"] = now
        self.corpora[corpus]["last_links_loop"] = 0
        self.corpora[corpus]["stats_loop"] = LoopingCall(self.store.save_webentities_stats, corpus)
        self.corpora[corpus]["index_loop"] = LoopingCall(self.store.index_batch_loop, corpus)
        self.corpora[corpus]["jobs_loop"] = LoopingCall(self.refresh_jobs, corpus)

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
            if not quiet:
                logger.msg("Could not start extra corpus, all slots busy", system="WARNING - %s" % corpus)
            returnD(self.corpus_error())

        if not quiet:
            logger.msg("Starting corpus...", system="INFO - %s" % corpus)
        yield self.db.init_corpus_indexes(corpus)
        res = self.msclients.start_corpus(corpus, quiet, ram=corpus_conf['options']['ram'])
        if not res:
            returnD(format_error(self.jsonrpc_test_corpus(corpus)["result"]))
        yield self.prepare_corpus(corpus, corpus_conf, noloop)
        returnD(self.jsonrpc_test_corpus(corpus))

    @inlineCallbacks
    def prepare_corpus(self, corpus=DEFAULT_CORPUS, corpus_conf=None, noloop=False):
        self.init_corpus(corpus)
        if not corpus_conf:
            corpus_conf = yield self.db.get_corpus(corpus)
        self.corpora[corpus]["name"] = corpus_conf["name"]
        self.corpora[corpus]["options"] = corpus_conf["options"]
        self.corpora[corpus]["total_webentities"] = corpus_conf['total_webentities']
        self.corpora[corpus]["webentities_in"] = corpus_conf['webentities_in']
        self.corpora[corpus]["webentities_out"] = corpus_conf['webentities_out']
        self.corpora[corpus]["webentities_undecided"] = corpus_conf['webentities_undecided']
        self.corpora[corpus]["webentities_discovered"] = corpus_conf['webentities_discovered']
        self.corpora[corpus]["crawls"] = corpus_conf['total_crawls']
        self.corpora[corpus]["pages_found"] = corpus_conf['total_pages']
        self.corpora[corpus]["pages_crawled"] = corpus_conf['total_pages_crawled']
        self.corpora[corpus]["last_index_loop"] = corpus_conf['last_index_loop']
        self.corpora[corpus]["last_links_loop"] = corpus_conf['last_links_loop']
        if not noloop:
            reactor.callLater(5, self.corpora[corpus]['jobs_loop'].start, 1, False)
        yield self.store._init_loop(corpus, noloop=noloop)
        yield self.update_corpus(corpus)

    @inlineCallbacks
    def update_corpus(self, corpus=DEFAULT_CORPUS, force_ram=False):
        if not force_ram:
            self.corpora[corpus]["options"]["ram"] = self.msclients.corpora[corpus].ram
        yield self.db.update_corpus(corpus, {
          "options": self.corpora[corpus]["options"],
          "total_webentities": self.corpora[corpus]['total_webentities'],
          "webentities_in": self.corpora[corpus]['webentities_in'],
          "webentities_out": self.corpora[corpus]['webentities_out'],
          "webentities_undecided": self.corpora[corpus]['webentities_undecided'],
          "webentities_discovered": self.corpora[corpus]['webentities_discovered'],
          "total_crawls": self.corpora[corpus]['crawls'],
          "total_pages": self.corpora[corpus]['pages_found'],
          "total_pages_crawled": self.corpora[corpus]['pages_crawled'],
          "last_index_loop": self.corpora[corpus]['last_index_loop'],
          "last_links_loop": self.corpora[corpus]['last_links_loop'],
          "last_activity": now_ts()
        })

    def jsonrpc_stop_corpus(self, corpus=DEFAULT_CORPUS):
        return self.stop_corpus(corpus)

    @inlineCallbacks
    def stop_corpus(self, corpus=DEFAULT_CORPUS, quiet=False):
        if corpus in self.corpora:
            for f in ["jobs_loop", "index_loop", "stats_loop"]:
                if f in self.corpora[corpus] and self.corpora[corpus][f].running:
                    self.corpora[corpus][f].stop()
            if corpus in self.msclients.corpora:
                yield self.update_corpus(corpus)
                self.msclients.stop_corpus(corpus, quiet)
            for f in ["tags", "webentities", "webentities_links", "webentities_ranks", "precision_exceptions"]:
                if f in self.corpora[corpus]:
                    del(self.corpora[corpus][f])
        yield self.db.clean_WEs_query(corpus)
        res = self.jsonrpc_test_corpus(corpus)
        if "message" in res["result"]:
            res["result"]["message"] = "Corpus stopped"
        if is_error(res):
            logger.msg("Could not stop corpus: %s" % res, system="ERROR - %s" % corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_ping(self, corpus=None, timeout=3):
        if not corpus:
            returnD(format_result('pong'))
        if not self.corpus_ready(corpus) and self.msclients.status_corpus(corpus, simplify=True) != "starting":
            returnD(self.corpus_error(corpus))

        st = time.time()
        res = self.msclients.sync.ping(corpus=corpus)
        while is_error(res) and time.time() < st + timeout:
            yield deferredSleep(0.5)
            res = self.msclients.sync.ping(corpus=corpus)
        if is_error(res):
            returnD(res)
        returnD(format_result('pong'))

    def jsonrpc_reinitialize(self, corpus=DEFAULT_CORPUS):
        return self.reinitialize(corpus)

    @inlineCallbacks
    def reinitialize(self, corpus=DEFAULT_CORPUS, noloop=False, quiet=False):
        """Reinitializes both crawl jobs and memory structure."""
        if not quiet:
            logger.msg("Resetting corpus...", system="INFO - %s" % corpus)
        if corpus in self.corpora:
            if self.corpora[corpus]["stats_loop"].running:
                self.corpora[corpus]["stats_loop"].stop()
            if self.corpora[corpus]["index_loop"].running:
                self.corpora[corpus]["index_loop"].stop()
            if self.corpora[corpus]["jobs_loop"].running:
                self.corpora[corpus]["jobs_loop"].stop()
        self.init_corpus(corpus)
        yield self.db.queue(corpus).drop(safe=True)
        res = yield self.crawler.reinitialize(corpus, recreate=(not noloop), quiet=quiet)
        if is_error(res):
            logger.msg("Problem while reinitializing crawler... %s" % res, system="ERROR - %s" % corpus)
            returnD(res)
        self.init_corpus(corpus)
        yield self.db.queue(corpus).drop(safe=True)
        res = yield self.store.reinitialize(corpus, noloop=noloop, quiet=quiet)
        if is_error(res):
            logger.msg("Problem while reinitializing memory structure... %s" % res, system="ERROR - %s" % corpus)
            returnD(res)
        returnD(format_result('Memory structure and crawling database contents emptied.'))

    def jsonrpc_destroy_corpus(self, corpus=DEFAULT_CORPUS):
        return self.destroy_corpus(corpus)

    @inlineCallbacks
    def destroy_corpus(self, corpus=DEFAULT_CORPUS, quiet=False):
        if not quiet:
            logger.msg("Destroying corpus...", system="INFO - %s" % corpus)
        res = yield self.reinitialize(corpus, noloop=True, quiet=quiet)
        if is_error(res):
            returnD(res)
        res = yield self.stop_corpus(corpus, quiet)
        if is_error(res):
            returnD(res)
        res = yield self.crawler.delete_crawler(corpus, quiet)
        if is_error(res):
            returnD(res)
        yield self.db.delete_corpus(corpus)
        returnD(format_result("Corpus %s destroyed successfully" % corpus))

    @inlineCallbacks
    def jsonrpc_clear_all(self):
        logger.msg("CLEAR_ALL: destroying all corpora...", system="INFO")
        corpora = yield self.db.list_corpus(fields=['_id', 'password'])
        for corpus in corpora:
            res = yield self.delete_corpus(corpus)
            if is_error(res):
                returnD(res)
        returnD(format_result("All corpora and databases cleaned up"))

    @inlineCallbacks
    def delete_corpus(self, corpus_metas):
        res = yield self.start_corpus(corpus_metas['_id'], password=corpus_metas['password'], noloop=True, quiet=not config['DEBUG'])
        if is_error(res):
            returnD(res)
        res = yield self.jsonrpc_ping(corpus_metas['_id'], timeout=10)
        if is_error(res):
            returnD(res)
        res = yield self.destroy_corpus(corpus_metas['_id'], quiet=not config['DEBUG'])
        if is_error(res):
            returnD(res)
        returnD("Corpus %s cleaned up" % corpus_metas['_id'])

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
        if not self.corpus_ready(corpus) or "webentities" not in self.corpora[corpus]:
            return format_result(status)
        if not self.corpora[corpus]['crawls']:
            self.corpora[corpus]['crawls_pending'] = 0
            self.corpora[corpus]['crawls_running'] = 0
        corpus_status = {
          'name': self.corpora[corpus]['name'],
          'options': self.corpora[corpus]['options'],
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
            'job_running_since': self.corpora[corpus]['loop_running_since'] if self.corpora[corpus]['loop_running'] else 0,
            'last_index': self.corpora[corpus]['last_index_loop'],
            'last_links_generation': self.corpora[corpus]['last_links_loop'],
            'pages_to_index': self.corpora[corpus]['pages_queued'],
            'webentities': {
              'total': self.corpora[corpus]['total_webentities'],
              'IN': self.corpora[corpus]['webentities_in'],
              'OUT': self.corpora[corpus]['webentities_out'],
              'UNDECIDED': self.corpora[corpus]['webentities_undecided'],
              'DISCOVERED': self.corpora[corpus]['webentities_discovered']
            }
          }
        }
        status['corpus'].update(corpus_status)
        return format_result(status)

  # CRAWL JOBS MONITORING

    @inlineCallbacks
    def jsonrpc_listjobs(self, list_ids=None, from_ts=None, to_ts=None, corpus=DEFAULT_CORPUS):
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        query = {}
        if list_ids:
            query = {'_id': {'$in': list_ids}}
        if from_ts or to_ts:
            query["created_at"] = {}
        if from_ts:
            query["created_at"]["$gte"] = from_ts
        if to_ts:
            query["created_at"]["$lte"] = to_ts
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
        results = yield DeferredList([
            self.db.queue(corpus).count(),
            self.db.pages(corpus).count(),
            self.db.list_jobs(corpus, fields=['nb_pages', 'nb_links'])
        ], consumeErrors=True)
        for bl, res in results:
            if not bl:
                logger.msg("Problem dialoguing with MongoDB: %s" % res, system="WARNING - %s" % corpus)
                returnD(None)
        self.corpora[corpus]['pages_queued'] = results[0][1]
        self.corpora[corpus]['pages_crawled'] = results[1][1]
        jobs = results[2][1]
        self.corpora[corpus]['crawls'] = len(jobs)
        self.corpora[corpus]['pages_found'] = sum([j['nb_pages'] for j in jobs])
        self.corpora[corpus]['links_found'] = sum([j['nb_links'] for j in jobs])
        yield self.update_corpus(corpus)
        # clean lost jobs
        if len(scrapyjobs['running']) + len(scrapyjobs['pending']) == 0:
            yield self.db.update_jobs(corpus, {'crawling_status': {'$in': [crawling_statuses.PENDING, crawling_statuses.RUNNING]}}, {'crawling_status': crawling_statuses.FINISHED, "finished_at": now_ts()})
        # clean canceled jobs
        yield self.db.update_jobs(corpus, {'crawling_status': crawling_statuses.CANCELED, 'indexing_status': {"$ne": indexing_statuses.CANCELED}}, {'indexing_status': indexing_statuses.CANCELED, 'finished_at': now_ts()})
        # update jobs crawling status accordingly to crawler's statuses
        running_ids = [job['id'] for job in scrapyjobs['running']]
        yield DeferredList([self.db.update_job_pages(corpus, job_id) for job_id in running_ids], consumeErrors=True)
        for bl, res in results:
            if not bl:
                logger.msg("Problem dialoguing with MongoDB: %s" % res, system="WARNING - %s" % corpus)
                returnD(None)
        res = yield self.db.list_jobs(corpus, {'_id': {'$in': running_ids}, 'crawling_status': crawling_statuses.PENDING}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'crawling_status': crawling_statuses.RUNNING, 'started_at': now_ts()})
            yield self.db.add_log(corpus, update_ids, "CRAWL_"+crawling_statuses.RUNNING)
        # update crawling status for finished jobs
        finished_ids = [job['id'] for job in scrapyjobs['finished']]
        res = yield self.db.list_jobs(corpus, {'_id': {'$in': finished_ids}, 'crawling_status': {'$nin': [crawling_statuses.RETRIED, crawling_statuses.CANCELED, crawling_statuses.FINISHED]}}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'crawling_status': crawling_statuses.FINISHED, 'crawled_at': now_ts()})
            yield self.db.add_log(corpus, update_ids, "CRAWL_"+crawling_statuses.FINISHED)
        # collect list of crawling jobs whose outputs is not fully indexed yet
        jobs_in_queue = yield self.db.queue(corpus).distinct('_job')
        # set index finished for jobs with crawling finished and no page left in queue
        res = yield self.db.list_jobs(corpus, {'crawling_status': crawling_statuses.FINISHED})
        finished_ids = set([job['_id'] for job in res] + finished_ids)
        res = yield self.db.list_jobs(corpus, {'_id': {'$in': list(finished_ids-set(jobs_in_queue))}, 'crawling_status': crawling_statuses.FINISHED, 'indexing_status': {'$nin': [indexing_statuses.BATCH_RUNNING, indexing_statuses.FINISHED]}}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'indexing_status': indexing_statuses.FINISHED, 'finished_at': now_ts()})
            yield self.db.add_log(corpus, update_ids, "INDEX_"+indexing_statuses.FINISHED)
            # Try to restart in phantom mode all regular crawls that seem to have failed (less than 3 pages found for a depth of at least 1)
            res = yield self.db.list_jobs(corpus, {'_id': {'$in': update_ids}, 'nb_crawled_pages': {'$lt': 3}, 'crawl_arguments.phantom': False, 'crawl_arguments.maxdepth': {'$gt': 0}})
            for job in res:
                logger.msg("Crawl job %s seems to have failed, trying to restart it in phantom mode" % job['_id'], system="INFO - %s" % corpus)
                yield self.jsonrpc_crawl_webentity(job['webentity_id'], job['crawl_arguments']['maxdepth'], True, corpus=corpus)
                yield self.db.add_log(corpus, job['_id'], "CRAWL_RETRIED_AS_PHANTOM")
                yield self.db.update_jobs(corpus, job['_id'], {'crawling_status': crawling_statuses.RETRIED})

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
        results = yield DeferredList([self.jsonrpc_declare_page(url, corpus=corpus) for url in list_urls], consumeErrors=True)
        for bl, WE in results:
            if not bl:
                errors.append(WE)
            elif is_error(WE):
                errors.append(WE["message"])
            else:
                res.append(WE['result'])
        if len(errors):
            returnD({'code': 'fail', 'message': '%d urls failed, see details in "errors" field and successes in "results" field.' % len(errors), 'errors': errors, 'results': res})
        returnD(format_result(res))

  # BASIC CRAWL METHODS

    @inlineCallbacks
    def jsonrpc_crawl_webentity(self, webentity_id, depth=None, phantom_crawl=False, status=ms.WebEntityStatus._VALUES_TO_NAMES[ms.WebEntityStatus.IN], startpages="default", phantom_timeouts={}, corpus=DEFAULT_CORPUS):
        """Tells scrapy to run crawl on a WebEntity defined by its id from memory structure."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        try:
            depth = int(depth)
        except:
            depth = self.corpora[corpus]["options"]['max_depth']
        if depth > self.corpora[corpus]["options"]['max_depth']:
            returnD(format_error('No crawl with a bigger depth than %d is allowed on this Hyphe instance.' % self.corpora[corpus]["options"]['max_depth']))
        phantom_timeouts.update(self.corpora[corpus]["options"]["phantom"])
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
        res = yield self.crawler.jsonrpc_start(webentity_id, WE['starts'], WE['lrus'], WE['subWEs'], self.corpora[corpus]["options"]["follow_redirects"], depth, phantom_crawl, phantom_timeouts, corpus=corpus)
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

    def jsonrpc_lookup_httpstatus(self, url, timeout=30, corpus=DEFAULT_CORPUS):
        return self.lookup_httpstatus(url, deadline=time.time()+timeout, corpus=corpus)

    @inlineCallbacks
    def lookup_httpstatus(self, url, timeout=5, deadline=0, tryout=0, noproxy=False, corpus=DEFAULT_CORPUS):
        res = format_result(0)
        timeout = int(timeout)
        use_proxy = self.corpora[corpus]["options"]['proxy']['host'] and not noproxy
        try:
            url = urllru.url_clean(str(url))
            if use_proxy:
                agent = ProxyAgent(TCP4ClientEndpoint(reactor, self.corpora[corpus]["options"]['proxy']['host'], self.corpora[corpus]["options"]['proxy']['port'], timeout=timeout))
            else:
                agent = Agent(reactor, connectTimeout=timeout)
            method = "HEAD"
            if tryout > 2:
                method = "GET"
            headers = {'Accept': ['*/*'],
                      'User-Agent': [user_agents.agents[random.randint(0, len(user_agents.agents) -1)]]}
            response = yield agent.request(method, url, Headers(headers), None)
        except DNSLookupError as e:
            if use_proxy and self.corpora[corpus]["options"]['proxy']['host'] in str(e):
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
    def jsonrpc_lookup(self, url, timeout=30, corpus=DEFAULT_CORPUS):
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

    def jsonrpc_deploy_crawler(self, corpus=DEFAULT_CORPUS):
        return self.deploy_crawler(corpus)

    @inlineCallbacks
    def deploy_crawler(self, corpus=DEFAULT_CORPUS, quiet=False):
        output = subprocess.Popen(['bash', 'bin/deploy_scrapy_spider.sh', corpus, '--noenv'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT).communicate()[0]
        res = yield self.send_scrapy_query("listprojects")
        if is_error(res) or "projects" not in res or corpus_project(corpus) not in res['projects']:
            logger.msg("Couldn't deploy crawler", system="ERROR - %s" % corpus)
            returnD(format_error(output))
        if not quiet:
            logger.msg("Successfully deployed crawler", system="INFO - %s" % corpus)
        returnD(format_result("Crawler %s deployed" % corpus_project(corpus)))

    @inlineCallbacks
    def delete_crawler(self, corpus=DEFAULT_CORPUS, quiet=False):
        proj = corpus_project(corpus)
        res = yield self.send_scrapy_query("delproject", {"project": proj})
        if is_error(res):
            logger.msg("Couldn't destroy scrapyd spider: %s" % res, system="ERROR - %s" % corpus)
            returnD(format_error(res))
        if not quiet:
            logger.msg("Successfully destroyed crawler", system="INFO - %s" % corpus)
        returnD(format_result("Crawler %s destroyed" % corpus_project(corpus)))

    @inlineCallbacks
    def jsonrpc_cancel_all(self, corpus=DEFAULT_CORPUS):
        """Stops all current crawls."""
        list_jobs = yield self.jsonrpc_list(corpus)
        if is_error(list_jobs):
            returnD('No crawler deployed, hence no job to cancel')
        list_jobs = list_jobs['result']
        while 'running' in list_jobs and (list_jobs['running'] + list_jobs['pending']):
            yield DeferredList([self.jsonrpc_cancel(item['id'], corpus=corpus) for item in list_jobs['running'] + list_jobs['pending']], consumeErrors=True)
            list_jobs = yield self.jsonrpc_list(corpus)
            if is_error(list_jobs):
                returnD(list_jobs)
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
        yield self.db.drop_corpus_collections(corpus)
        if recreate:
            self.corpora[corpus]['jobs_loop'].start(10, False)
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
    def jsonrpc_start(self, webentity_id, starts, follow_prefixes, nofollow_prefixes, follow_redirects=None, depth=None, phantom_crawl=False, phantom_timeouts={}, download_delay=config['mongo-scrapy']['download_delay'], corpus=DEFAULT_CORPUS):
        """Starts a crawl with scrapy from arguments using a list of urls and of lrus for prefixes."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not phantom_crawl and urls_match_domainlist(starts, self.corpora[corpus]["options"]['phantom']['whitelist_domains']):
            phantom_crawl = True
        if not follow_redirects:
            follow_redirects = self.corpora[corpus]["options"]["follow_redirects"]
        if depth is None:
            depth = self.corpora[corpus]["options"]["max_depth"]
        if depth > self.corpora[corpus]["options"]['max_depth']:
            returnD(format_error('No crawl with a bigger depth than %d is allowed on this Hyphe instance.' % self.corpora[corpus]["options"]['max_depth']))
        if not starts:
            returnD(format_error('No startpage defined for crawling WebEntity %s.' % webentity_id))
        # preparation of the request to scrapyd
        args = {
          'project': corpus_project(corpus),
          'spider': 'pages',
          'phantom': phantom_crawl,
          'setting': 'DOWNLOAD_DELAY=' + str(download_delay),
          'maxdepth': depth,
          'start_urls': list(starts),
          'follow_prefixes': list(follow_prefixes),
          'nofollow_prefixes': list(nofollow_prefixes),
          'discover_prefixes': list(follow_redirects),
          'user_agent': user_agents.agents[random.randint(0, len(user_agents.agents) - 1)]
        }
        if phantom_crawl:
            phantom_timeouts.update(self.corpora[corpus]["options"]["phantom"])
            for t in ["", "ajax_", "idle_"]:
                args['phantom_%stimeout' % t] = phantom_timeouts["%stimeout" % t]
        res = yield self.send_scrapy_query('schedule', args)
        if is_error(res):
            returnD(reformat_error(res))
        if 'jobid' in res:
            ts = now_ts()
            yield self.db.add_job(corpus, res['jobid'], webentity_id, args, ts)
            yield self.db.add_log(corpus, res['jobid'], "CRAWL_ADDED", ts)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_cancel(self, job_id, corpus=DEFAULT_CORPUS):
        """Cancels a scrapy job with id job_id."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        existing = yield self.db.list_jobs(corpus, {"_id": job_id})
        if not existing:
            returnD(format_error("No job found with id %s" % job_id))
        elif existing[0]["crawling_status"] in [crawling_statuses.FINISHED, crawling_statuses.CANCELED, crawling_statuses.RETRIED]:
            returnD(format_error("Job %s is already not running anymore" % job_id))
        logger.msg("Cancel crawl: %s" % job_id, system="INFO - %s" % corpus)
        args = {'project': corpus_project(corpus), 'job': job_id}
        res = yield self.send_scrapy_query('cancel', args)
        if is_error(res):
            returnD(reformat_error(res))
        if 'prevstate' in res:
            yield self.db.update_jobs(corpus, job_id, {'crawling_status': crawling_statuses.CANCELED})
            yield self.db.add_log(corpus, job_id, "CRAWL_"+crawling_statuses.CANCELED)
        res = yield self.send_scrapy_query('cancel', args)
        if is_error(res):
            returnD(reformat_error(res))
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
    def _init_loop(self, corpus=DEFAULT_CORPUS, noloop=False):
        now = now_ts()
        yield self.handle_index_error(corpus)
        self.corpora[corpus]['loop_running'] = None
        self.corpora[corpus]['loop_running_since'] = now
        self.corpora[corpus]['last_WE_update'] = now
        self.corpora[corpus]['recent_changes'] = 0
        self.corpora[corpus]['recent_tagging'] = True
        if not noloop:
            reactor.callLater(3, deferToThread, self.jsonrpc_get_precision_exceptions, corpus=corpus)
            reactor.callLater(10, self.corpora[corpus]['index_loop'].start, 1, True)
            reactor.callLater(30, self.corpora[corpus]['stats_loop'].start, 300, True)
        yield self.ensureDefaultCreationRuleExists(corpus, quiet=noloop)

    @inlineCallbacks
    def format_webentity(self, WE, jobs={}, light=False, semilight=False, light_for_csv=False, corpus=DEFAULT_CORPUS):
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
        if not jobs and not light_for_csv and WE.status != "DISCOVERED":
            job = yield self.db.list_jobs(corpus, {'webentity_id': WE.id}, fields=['crawling_status', 'indexing_status'], filter=sortdesc('created_at'), limit=1)
        elif WE.id in jobs:
            job = jobs[WE.id]
        if job:
            res['crawling_status'] = job['crawling_status']
            res['indexing_status'] = job['indexing_status']
        else:
            res['crawling_status'] = crawling_statuses.UNCRAWLED
            res['indexing_status'] = indexing_statuses.UNINDEXED
        res["indegree"] = self.corpora[corpus]["webentities_ranks"].get(WE.id, {"indegree": 0})["indegree"]
        returnD(res)

    @inlineCallbacks
    def format_webentities(self, WEs, light=False, semilight=False, light_for_csv=False, sort=None, corpus=DEFAULT_CORPUS):
        jobs = {}
        if not light_for_csv:
            res = yield self.db.list_jobs(corpus, {'webentity_id': {'$in': [WE.id for WE in WEs if WE.status != "DISCOVERED"]}}, fields=['webentity_id', 'crawling_status', 'indexing_status'])
            for job in res:
                jobs[job['webentity_id']] = job
        res = []
        results = yield DeferredList([self.format_webentity(WE, jobs, light, semilight, light_for_csv, corpus=corpus) for WE in WEs], consumeErrors=True)
        for bl, fWE in results:
            if not bl:
                logger.msg("Problem formatting WE: %s" % fWE, system="WARNING - %s" % corpus)
            else:
                res.append(fWE)
        if res and sort:
            if type(sort) != list:
                sort = [sort]
            for sortkey in reversed(sort):
                key = sortkey.lstrip("-")
                reverse = (key != sortkey)
                if key in res[0]:
                    res = sorted(res, key=lambda x: x[key], reverse=reverse)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_all_nodelinks(self, corpus=DEFAULT_CORPUS):
        res = yield self.msclients.pool.getNodeLinks(corpus=corpus)
        returnD(handle_standard_results(res))

    @inlineCallbacks
    def ensureDefaultCreationRuleExists(self, corpus=DEFAULT_CORPUS, quiet=False, retry=True):
        res = yield self.parent.jsonrpc_ping(corpus, timeout=15)
        if is_error(res):
            logger.msg("Could not start corpus fast enough to create WE creation rule...", system="ERROR - %s" % corpus)
            returnD(res)
        rules = yield self.msclients.pool.getWebEntityCreationRules(corpus=corpus)
        if self.msclients.test_corpus(corpus) and (is_error(rules) or len(rules) == 0):
            if corpus != DEFAULT_CORPUS and not quiet:
                logger.msg("Saves default WE creation rule", system="INFO - %s" % corpus)
            res = yield self.msclients.pool.addWebEntityCreationRule(ms.WebEntityCreationRule(creationrules.DEFAULT, ''), corpus=corpus)
            if is_error(res):
                logger.msg("Error creating WE creation rule...", system="ERROR - %s" % corpus)
                if retry:
                    logger.msg("Retrying WE creation rule creation...", system="ERROR - %s" % corpus)
                    returnD(ensureDefaultCreationRuleExists(corpus, quiet=quiet, retry=False))
                returnD(res)
            returnD(format_result('Default creation rule created'))
        returnD(format_result('Default creation rule was already created'))

    @inlineCallbacks
    def jsonrpc_define_webentity_creationrule(self, lru_prefix, regexp, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        try:
            _, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
        except ValueError as e:
            returnD(format_error(e))
        rules = yield self.msclients.pool.getWebEntityCreationRules(corpus=corpus)
        if lru_prefix in [a.LRU.decode("utf-8") for a in rules]:
            returnD("Error: a CreationRule was already defined for prefix %s" % lru_prefix)

        regexp = creationrules.getPreset(regexp)
        res = yield self.msclients.pool.addWebEntityCreationRule(ms.WebEntityCreationRule(regexp, lru_prefix), corpus=corpus)
        if is_error(res):
            returnD(format_error("Could not save CreationRule %s for prefix %s: %s" % (regexp, prefix, res)))
        returnD(format_result("Webentity creation rule added"))

    def jsonrpc_reinitialize(self, corpus=DEFAULT_CORPUS):
        return self.reinitialize(corpus)

    @inlineCallbacks
    def reinitialize(self, corpus=DEFAULT_CORPUS, noloop=False, quiet=False):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not quiet:
            logger.msg("Empty memory structure content", system="INFO - %s" % corpus)
        if self.corpora[corpus]['stats_loop'].running:
            self.corpora[corpus]['stats_loop'].stop()
        while self.corpora[corpus]['loop_running']:
            if self.corpora[corpus]['index_loop'].running:
                self.corpora[corpus]['index_loop'].stop()
        res = self.msclients.sync.clearIndex(corpus=corpus)
        if is_error(res):
            returnD(res)
        yield self._init_loop(corpus, noloop=noloop)
        returnD(format_result("MemoryStructure reinitialized"))

    @inlineCallbacks
    def return_new_webentity(self, lru_prefix, new=False, source=None, corpus=DEFAULT_CORPUS):
        WE = yield self.msclients.pool.findWebEntityMatchingLRUPrefix(lru_prefix, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        if test_bool_arg(new):
            self.corpora[corpus]['recent_changes'] += 1
            self.corpora[corpus]['total_webentities'] += 1
            if source:
                yield self.jsonrpc_add_webentity_tag_value(WE.id, 'CORE', 'user_created_via', source, corpus=corpus)
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
        if not urllru.lru_is_node(lru_prefix, self.corpora[corpus]["options"]["precision_limit"], lru_head=lru_head) and lru_prefix != lru_head:
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
        is_node = urllru.lru_is_node(lru, self.corpora[corpus]["options"]["precision_limit"], self.corpora[corpus]['precision_exceptions'])
        is_full_precision = urllru.lru_is_full_precision(lru, self.corpora[corpus]['precision_exceptions'])
        t = str(now_ts())
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
            existing = yield self.msclients.pool.getWebEntityByLRUPrefix(lru, corpus=corpus)
            if not is_error(existing):
                returnD(format_error('LRU prefix "%s" is already set to an existing WebEntity : %s' % (lru, existing)))
            if not name:
                name = urllru.name_url(url)
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
        res = yield self.msclients.pool.updateWebEntity(WE, corpus=corpus)
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

    @inlineCallbacks
    def update_webentity(self, webentity_id, field_name, value, array_behavior=None, array_key=None, array_namespace=None, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        WE = yield self.msclients.pool.getWebEntity(webentity_id, corpus=corpus)
        if is_error(WE):
            returnD(format_error("ERROR could not retrieve WebEntity with id %s" % webentity_id))
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
                            returnD(res)
                    elif field_name == 'startpages':
                        res = self.handle_url_precision_exceptions(value, corpus=corpus)
                        if is_error(res):
                            returnD(res)
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
                res = yield self.msclients.pool.updateWebEntity(WE, corpus=corpus)
                if is_error(res):
                    returnD(res)
                self.corpora[corpus]['recent_changes'] += 1
                returnD(format_result("%s field of WebEntity %s updated." % (field_name, res)))
            else:
                res = yield self.msclients.pool.deleteWebEntity(WE, corpus=corpus)
                if is_error(res):
                    returnD(res)
                self.corpora[corpus]['recent_changes'] += 1
                self.corpora[corpus]['total_webentities'] -= 1
                returnD(format_result("webentity %s had no LRUprefix left and was removed." % webentity_id))
        except Exception as x:
            returnD(format_error("ERROR while updating WebEntity : %s" % x))

    @inlineCallbacks
    def batch_webentities_edit(self, command, webentity_ids, corpus, *args, **kwargs):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if type(webentity_ids) != list or type(webentity_ids[0]) not in [str, unicode, bytes]:
            returnD(format_error("ERROR: webentity_ids must be a list of webentity ids"))
        try:
            func = getattr(self, "jsonrpc_%s" % command)
        except Exception as e:
            returnD(format_error("ERROR: %s is not a valid store command" % command))
        async = True
        if "async" in kwargs:
            async = test_bool_arg(kwargs.pop("async"))
        kwargs["corpus"] = corpus
        if async:
            results = yield DeferredList([func(webentity_id, *args, **kwargs) for webentity_id in webentity_ids], consumeErrors=True)
        else:
            results = []
            for webentity_id in webentity_ids:
                res = yield func(webentity_id, *args, **kwargs)
                results.append((True, res))
        res = []
        errors = []
        for bl, WE in results:
            if not bl:
                errors.append(WE)
            elif is_error(WE):
                errors.append(WE["message"])
            else:
                res.append(WE["result"])
        if len(errors):
            returnD({'code': 'fail', 'message': '%d webentities failed, see details in "errors" field and successes in "results" field.' % len(errors), 'errors': errors, 'results': res})
        returnD(format_result(res))

    def jsonrpc_rename_webentity(self, webentity_id, new_name, corpus=DEFAULT_CORPUS):
        if not new_name or new_name == "":
            return format_error("ERROR: please specify a value for the WebEntity's name")
        return self.update_webentity(webentity_id, "name", new_name, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_change_webentity_id(self, webentity_old_id, webentity_new_id, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        res = yield self.update_webentity(webentity_old_id, "id", webentity_new_id, corpus=corpus)
        if is_error(res):
            returnD(format_error('ERROR a WebEntity with id %s already seems to exist' % webentity_new_id))
        res = self.jsonrpc_delete_webentity(webentity_old_id, corpus=corpus)
        if is_error(res):
            returnD(format_error('ERROR a WebEntity with id %s already seems to exist' % webentity_new_id))
        self.corpora[corpus]['total_webentities'] += 1
        returnD(format_result("WebEntity %s was re-ided as %s" % (webentity_old_id, webentity_new_id)))

    def jsonrpc_set_webentity_status(self, webentity_id, status, corpus=DEFAULT_CORPUS):
        return self.update_webentity(webentity_id, "status", status, corpus=corpus)

    def jsonrpc_set_webentities_status(self, webentity_ids, status, corpus=DEFAULT_CORPUS):
        return self.batch_webentities_edit("set_webentity_status", webentity_ids, corpus, status)

    def jsonrpc_set_webentity_homepage(self, webentity_id, homepage, corpus=DEFAULT_CORPUS):
        try:
            homepage, _ = urllru.url_clean_and_convert(url)
        except ValueError as e:
            return format_error(e)
        return self.update_webentity(webentity_id, "homepage", homepage, corpus=corpus)

    @inlineCallbacks
    def add_backend_tags(self, webentity_id, key, value, corpus=DEFAULT_CORPUS):
        yield self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", key, value, corpus=corpus)
        yield self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", "recrawl_needed", "true", corpus=corpus)

    @inlineCallbacks
    def jsonrpc_add_webentity_lruprefix(self, webentity_id, lru_prefix, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        try:
            url, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
        except ValueError as e:
            returnD(format_error(e))
        old_WE = yield self.msclients.pool.getWebEntityByLRUPrefix(lru_prefix, corpus=corpus)
        if not is_error(old_WE):
            logger.msg("Removing LRUPrefix %s from WebEntity %s" % (lru_prefix, old_WE.name), system="INFO - %s" % corpus)
            res = yield self.jsonrpc_rm_webentity_lruprefix(old_WE.id, lru_prefix, corpus=corpus)
            if is_error(res):
                returnD(res)
        yield self.add_backend_tags(webentity_id, "lruprefixes_modified", "added %s" % lru_prefix, corpus=corpus)
        res = yield self.update_webentity(webentity_id, "LRUSet", lru_prefix, "push", corpus=corpus)
        self.corpora[corpus]['recent_changes'] += 1
        returnD(res)

    @inlineCallbacks
    def jsonrpc_rm_webentity_lruprefix(self, webentity_id, lru_prefix, corpus=DEFAULT_CORPUS):
        """ Will delete WebEntity if no LRUprefix left"""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        try:
            url, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
        except ValueError as e:
            returnD(format_error(e))
        yield self.add_backend_tags(webentity_id, "lruprefixes_modified", "removed %s" % lru_prefix, corpus=corpus)
        res = yield self.update_webentity(webentity_id, "LRUSet", lru_prefix, "pop", corpus=corpus)
        self.corpora[corpus]['recent_changes'] += 1
        returnD(res)

    @inlineCallbacks
    def jsonrpc_add_webentity_startpage(self, webentity_id, startpage_url, corpus=DEFAULT_CORPUS):
        try:
            startpage_url, _ = urllru.url_clean_and_convert(startpage_url)
        except ValueError as e:
            returnD(format_error(e))
        yield self.add_backend_tags(webentity_id, "startpages_modified", "added %s" % startpage_url, corpus=corpus)
        res = yield self.update_webentity(webentity_id, "startpages", startpage_url, "push", corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_rm_webentity_startpage(self, webentity_id, startpage_url, corpus=DEFAULT_CORPUS):
        try:
            startpage_url, _ = urllru.url_clean_and_convert(startpage_url)
        except ValueError as e:
            returnD(format_error(e))
        yield self.add_backend_tags(webentity_id, "startpages_modified", "removed %s" % startpage_url, corpus=corpus)
        res = yield self.update_webentity(webentity_id, "startpages", startpage_url, "pop", corpus=corpus)
        returnD(res)

    def jsonrpc_add_webentity_tag_value(self, webentity_id, tag_namespace, tag_key, tag_value, corpus=DEFAULT_CORPUS):
        return self.update_webentity(webentity_id, "metadataItems", tag_value, "push", tag_key, tag_namespace, corpus=corpus)

    def jsonrpc_add_webentities_tag_value(self, webentity_ids, tag_namespace, tag_key, tag_value, corpus=DEFAULT_CORPUS):
        return self.batch_webentities_edit("add_webentity_tag_value", webentity_ids, corpus, tag_namespace, tag_key, tag_value)

    def jsonrpc_rm_webentity_tag_key(self, webentity_id, tag_namespace, tag_key, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_set_webentity_tag_values(webentity_id, tag_namespace, tag_key, [], corpus=corpus)

    def jsonrpc_rm_webentity_tag_value(self, webentity_id, tag_namespace, tag_key, tag_value, corpus=DEFAULT_CORPUS):
        return self.update_webentity(webentity_id, "metadataItems", tag_value, "pop", tag_key, tag_namespace, corpus=corpus)

    def jsonrpc_set_webentity_tag_values(self, webentity_id, tag_namespace, tag_key, tag_values, corpus=DEFAULT_CORPUS):
        if not isinstance(tag_values, list):
            tag_values = list(tag_values)
        return self.update_webentity(webentity_id, "metadataItems", tag_values, "update", tag_key, tag_namespace, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_merge_webentity_into_another(self, old_webentity_id, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        old_WE = yield self.msclients.pool.getWebEntity(old_webentity_id, corpus=corpus)
        if is_error(old_WE):
            returnD(format_error('ERROR retrieving WebEntity with id %s' % old_webentity_id))
        if test_bool_arg(include_home_and_startpages_as_startpages):
            if old_WE.homepage:
                a = yield self.jsonrpc_add_webentity_startpage(good_webentity_id, old_WE.homepage, corpus=corpus)
                if is_error(a):
                    returnD(format_error('ERROR adding homepage %s from %s to %s' % (old_WE.homepage, old_webentity_id, good_webentity_id)))
            for page in old_WE.startpages:
                a = yield self.jsonrpc_add_webentity_startpage(good_webentity_id, page, corpus=corpus)
                if is_error(a):
                    returnD(format_error('ERROR adding startpage %s from %s to %s' % (old_WE.homepage, old_webentity_id, good_webentity_id)))
        if test_bool_arg(include_tags):
            for tag_namespace in old_WE.metadataItems.keys():
                for tag_key in old_WE.metadataItems[tag_namespace].keys():
                    for tag_val in old_WE.metadataItems[tag_namespace][tag_key]:
                        a = yield self.jsonrpc_add_webentity_tag_value(good_webentity_id, tag_namespace, tag_key, tag_val, corpus=corpus)
                        if is_error(a):
                            returnD(format_error('ERROR adding tag %s:%s=%s from %s to %s' % (tag_namespace, tag_key, tag_val, old_webentity_id, good_webentity_id)))
        for lru in old_WE.LRUSet:
            a = yield self.jsonrpc_add_webentity_lruprefix(good_webentity_id, lru, corpus=corpus)
            if is_error(a):
                returnD(format_error('ERROR adding LRU prefix %s from %s to %s' % (lru, old_webentity_id, good_webentity_id)))
        yield self.add_backend_tags(good_webentity_id, "alias_added", old_WE.name)
        self.corpora[corpus]['total_webentities'] -= 1
        self.corpora[corpus]['recent_changes'] += 1
        returnD(format_result("Merged %s into %s" % (old_webentity_id, good_webentity_id)))

    def jsonrpc_merge_webentities_into_another(self, old_webentity_ids, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False, corpus=DEFAULT_CORPUS):
        return self.batch_webentities_edit("merge_webentity_into_another", old_webentity_ids, corpus, good_webentity_id, include_tags=include_tags, include_home_and_startpages_as_startpages=include_home_and_startpages_as_startpages, async=False)

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
        self.corpora[corpus]['recent_changes'] += 1
        return format_result("WebEntity %s (%s) was removed" % (webentity_id, WE.name))

    @inlineCallbacks
    def index_batch(self, page_items, jobid, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(False)
        ids = [str(record['_id']) for record in page_items]
        nb_crawled_pages = len(ids)
        if not nb_crawled_pages:
            returnD(False)
        pages, links = yield deferToThread(processor.generate_cache_from_pages_list, page_items, self.corpora[corpus]["options"]["precision_limit"], self.corpora[corpus]['precision_exceptions'], config['DEBUG'] > 0)
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
        link_lists = [links[i:i+config['memoryStructure']['max_simul_links_indexing']] for i in range(0, nb_links, config['memoryStructure']['max_simul_links_indexing'])]
        results = yield DeferredList([self.msclients.loop.saveNodeLinks([ms.NodeLink(source.encode('utf-8'),target.encode('utf-8'),weight) for source,target,weight in link_list], corpus=corpus) for link_list in link_lists], consumeErrors=True)
        for bl, res in results:
            if not bl or is_error(res):
                logger.msg(res['message'], system="ERROR - %s" % corpus)
                returnD(False)
        logger.msg("..."+str(nb_links)+" links indexed in "+str(time.time()-s)+"s...", system="INFO - %s" % corpus)
        s=time.time()
        n_WE = yield self.msclients.loop.createWebEntitiesFromCache(cache_id, corpus=corpus)
        if is_error(n_WE):
            logger.msg(n_WE['message'], system="ERROR - %s" % corpus)
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

    def rank_webentities(self, corpus=DEFAULT_CORPUS):
        ranks = {}
        for link in self.corpora[corpus]['webentities_links']:
            if link.targetId not in ranks:
                ranks[link.targetId] = {"indegree": 0}
            ranks[link.targetId]["indegree"] += 1
        self.corpora[corpus]['webentities_ranks'] = ranks

    def jsonrpc_trigger_links_reset(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        self.corpora[corpus]['recent_changes'] += 1
        self.corpora[corpus]['last_links_loop'] = 0
        return format_result("Links global re-generation should start soon")

    @inlineCallbacks
    def index_batch_loop(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus) or self.corpora[corpus]['loop_running']:
            returnD(False)
        self.corpora[corpus]['loop_running'] = "Diagnosing"
        yield self.ramcache_webentities(corpus=corpus, corelinks=(self.corpora[corpus]['webentities_links'] == None))
        crashed = yield self.db.list_jobs(corpus, {'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'], limit=1)
        if crashed:
            self.corpora[corpus]['loop_running'] = "Cleaning up crashed indexing"
            logger.msg("Indexing job declared as running but probably crashed, trying to restart it.", system="WARNING - %s" % corpus)
            yield self.db.update_jobs(corpus, crashed['_id'], {'indexing_status': indexing_statuses.BATCH_CRASHED})
            yield self.db.add_log(corpus, crashed['_id'], "INDEX_"+indexing_statuses.BATCH_CRASHED)
            self.corpora[corpus]['loop_running'] = None
            returnD(False)
        oldest_page_in_queue = yield self.db.get_queue(corpus, limit=1, fields=["_job"], skip=random.randint(0, 2))
        if oldest_page_in_queue:
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
                self.corpora[corpus]['loop_running_since'] = now_ts()
                res = yield self.index_batch(page_items, jobid, corpus=corpus)
                if is_error(res):
                    logger.msg(res['message'], system="ERROR - %s" % corpus)
                    self.corpora[corpus]['loop_running'] = None
                    returnD(False)
                self.corpora[corpus]['recent_changes'] += 1
            else:
                logger.msg("job %s found for index but no page corresponding found in queue." % jobid, system="WARNING - %s" % corpus)
        # Run linking WebEntities on a regular basis when needed
        if self.corpora[corpus]['recent_changes']:
            s = time.time()
            self.corpora[corpus]['loop_running'] = "Computing links between WebEntities"
            self.corpora[corpus]['loop_running_since'] = now_ts()
            self.corpora[corpus]['last_index_loop'] = now_ts()
            self.corpora[corpus]['recent_changes'] = 0
            yield self.db.add_log(corpus, "WE_LINKS", "Starting WebEntity links generation...")
            res = yield self.msclients.loop.updateWebEntityLinks(self.corpora[corpus]['last_links_loop'], corpus=corpus)
            if is_error(res):
                logger.msg(res['message'], system="ERROR - %s" % corpus)
                self.corpora[corpus]['loop_running'] = None
                returnD(None)
            self.corpora[corpus]['last_links_loop'] = res
            logger.msg("...processed new WebEntity links in %ss..." % (time.time() - s), system="INFO - %s" % corpus)
            yield self.db.add_log(corpus, "WE_LINKS", "...finished WebEntity links generation (%ss)" % (time.time() - s))
            s = time.time()
            res = yield self.msclients.loop.getWebEntityLinks(corpus=corpus)
            if is_error(res):
                logger.msg(res['message'], system="ERROR - %s" % corpus)
                self.corpora[corpus]['loop_running'] = None
                returnD(None)
            self.corpora[corpus]['webentities_links'] = res
            self.rank_webentities(corpus)
            logger.msg("...loaded, ranked and updated WebEntity links in %ss..." % (time.time() - s), system="INFO - %s" % corpus)
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
    def ramcache_webentities(self, corelinks=False, corpus=DEFAULT_CORPUS):
        WEs = self.corpora[corpus]['webentities']
        deflist = []
        also_links = test_bool_arg(corelinks)
        if WEs == [] or self.corpora[corpus]['recent_changes'] or self.corpora[corpus]['last_links_loop']*1000 > self.corpora[corpus]['last_WE_update']:
            deflist.append(self.msclients.pool.getWebEntities(corpus=corpus, _nokeepalive=True))
            if also_links:
                logger.msg("Collecting WebEntities and WebEntityLinks...", system="INFO - %s" % corpus)
                deflist.append(self.msclients.pool.getWebEntityLinks(corpus=corpus))
        if deflist:
            results = yield DeferredList(deflist, consumeErrors=True)
            WEs = results[0][1]
            if not results[0][0] or is_error(WEs):
                returnD(WEs)
            self.corpora[corpus]['last_WE_update'] = now_ts()
            self.corpora[corpus]['webentities'] = WEs
            self.corpora[corpus]['total_webentities'] = len(WEs)
            self.corpora[corpus]['webentities_in'] = len([1 for w in self.corpora[corpus]['webentities'] if ms.WebEntityStatus._NAMES_TO_VALUES[w.status] == ms.WebEntityStatus.IN])
            self.corpora[corpus]['webentities_out'] = len([1 for w in self.corpora[corpus]['webentities'] if ms.WebEntityStatus._NAMES_TO_VALUES[w.status] == ms.WebEntityStatus.OUT])
            self.corpora[corpus]['webentities_undecided'] = len([1 for w in self.corpora[corpus]['webentities'] if ms.WebEntityStatus._NAMES_TO_VALUES[w.status] == ms.WebEntityStatus.UNDECIDED])
            self.corpora[corpus]['webentities_discovered'] = self.corpora[corpus]['total_webentities'] - self.corpora[corpus]['webentities_in'] - self.corpora[corpus]['webentities_out'] - self.corpora[corpus]['webentities_undecided']
        if len(deflist) > 1:
            WElinks = results[1][1]
            if not results[1][0] or is_error(WElinks):
                returnD(WElinks)
            self.corpora[corpus]['webentities_links'] = WElinks
            self.rank_webentities(corpus)
            self.corpora[corpus]['loop_running'] = False
            logger.msg("...ramcached.", system="INFO - %s" % corpus)
        returnD(WEs)

    @inlineCallbacks
    def save_webentities_stats(self, corpus=DEFAULT_CORPUS):
        yield self.db.save_stats(corpus, self.corpora[corpus])

    @inlineCallbacks
    def jsonrpc_get_webentities_stats(self, corpus=DEFAULT_CORPUS):
        res = yield self.db.get_stats(corpus)
        returnD(res)

    def jsonrpc_get_webentity(self, we_id, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_get_webentities([we_id], corpus=corpus)

    def format_WE_page(self, total, count, page, WEs, token=None):
        res = {
            "total_results": total,
            "count": count,
            "page": page,
            "webentities": WEs,
            "token": token,
            "last_page": (total+1)/count,
            "previous_page": None,
            "next_page": None
        }
        if page > 0:
            res["previous_page"] = min(res["last_page"], page - 1)
        if (page+1)*count < total:
            res["next_page"] = page + 1
        return format_result(res)

    @inlineCallbacks
    def paginate_webentities(self, WEs, count, page, light=False, semilight=False, sort=None, corpus=DEFAULT_CORPUS):
        subset = WEs[page*count:(page+1)*count]
        ids = [w["id"] for w in WEs]
        res = self.format_WE_page(len(ids), count, page, subset)
        query_args = {
          "count": count,
          "light": light,
          "semilight": semilight,
          "sort": sort
        }
        res["result"]["token"] = yield self.db.save_WEs_query(corpus, ids, query_args)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentities_page(self, token, page, corpus=DEFAULT_CORPUS):
        try:
            page = int(page)
        except:
            returnD(format_error("page argument must be an integer"))
        ids = yield self.db.get_WEs_query(corpus, token)
        if not ids:
            returnD(format_error("No previous query found for token %s on corpus %s" % (token, corpus)))
        count = ids["query"]["count"]
        query_ids = ids["webentities"][page*count:(page+1)*count]
        if not query_ids:
            returnD(self.format_WE_page(ids["total"], ids["query"]["count"], page, [], token=token))
        res = yield self.jsonrpc_get_webentities(query_ids, light=ids["query"]["light"], semilight=ids["query"]["semilight"], sort=ids["query"]["sort"], count=ids["query"]["count"], corpus=corpus)
        if is_error(res):
            returnD(res)
        returnD(self.format_WE_page(ids["total"], ids["query"]["count"], page, res["result"], token=token))

    @inlineCallbacks
    def jsonrpc_get_webentities_ranking_stats(self, pagination_token, ranking_field="indegree", corpus=DEFAULT_CORPUS):
        ranking_fields = ["indegree"]
        ranking_field = ranking_field.lower().strip()
        if ranking_field not in ranking_fields:
            returnD(format_error("ranking_field must be one of %s" % ", ".join(ranking_fields)))
        ids = yield self.db.get_WEs_query(corpus, pagination_token)
        if not ids:
            returnD(format_error("No previous query found for token %s on corpus %s" % (pagination_token, corpus)))
        histogram = {}
        for wid in ids["webentities"]:
            rank = self.corpora[corpus]["webentities_ranks"].get(wid, {ranking_field: 0})[ranking_field]
            if rank not in histogram:
                histogram[rank] = 0
            histogram[rank] += 1
        returnD(format_result(histogram))

    @inlineCallbacks
    def jsonrpc_get_webentities(self, list_ids=None, light=False, semilight=False, sort=None, count=100, page=0, light_for_csv=False, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        try:
            page = int(page)
            count = int(count)
        except:
            returnD(format_error("page and count arguments must be integers"))
        if isinstance(list_ids, unicode):
            list_ids = [list_ids] if list_ids else []
        n_WEs = len(list_ids) if list_ids else 0
        if n_WEs:
            MAX_WE_AT_ONCE = 100
            WEs = []
            sublists = [list_ids[MAX_WE_AT_ONCE*i : MAX_WE_AT_ONCE*(i+1)] for i in range((n_WEs-1)/MAX_WE_AT_ONCE + 1)]
            results = yield DeferredList([self.msclients.pool.getWebEntitiesByIDs(sublist_ids, corpus=corpus) for sublist_ids in sublists], consumeErrors=True)
            for bl, res in results:
                if not bl or is_error(res):
                    returnD(res)
                WEs.extend(res)
        else:
            WEs = yield self.ramcache_webentities(corpus=corpus)
            if is_error(WEs):
                returnD(WEs)
        res = yield self.format_webentities(WEs, light=light, semilight=semilight, light_for_csv=light_for_csv, sort=sort, corpus=corpus)
        if n_WEs:
            returnD(format_result(res))
        if len(WEs) > count and not light_for_csv:
            res = yield self.paginate_webentities(res, count, page, light=light, semilight=semilight, sort=sort, corpus=corpus)
            returnD(res)
        else:
            returnD(self.format_WE_page(len(res), count, page, res))

    @inlineCallbacks
    def jsonrpc_advanced_search_webentities(self, allFieldsKeywords=[], fieldKeywords=[], sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        indegree_filter = False
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        try:
            page = int(page)
            count = int(count)
        except:
            returnD(format_error("page and count arguments must be integers"))
        afk = []
        fk = []
        if type(allFieldsKeywords) is unicode:
            allFieldsKeywords = [allFieldsKeywords]
        if not (type(allFieldsKeywords) is list and type(fieldKeywords) is list):
            returnD(format_error("ERROR: Both arguments must be lists."))
        for k in allFieldsKeywords:
            if not (k and type(k) in [str, unicode]):
                returnD(format_error("ERROR: allFieldsKeywords must be a list of strings."))
            afk.append(k.encode('utf-8'))
        for kv in fieldKeywords:
            if type(kv) is list and len(kv) == 2 and kv[0] and kv[1] and type(kv[0]) in [str, unicode] and type(kv[1]) in [str, unicode]:
                fk.append([kv[0].encode('utf-8'), kv[1].encode('utf-8')])
            elif type(kv) is list and len(kv) == 2 and kv[0] and kv[1] and type(kv[0]) in [str, unicode] and type(kv[1]) is list and len(kv[1]) == 2 and type(kv[1][0]) in [int, float] and type(kv[1][1]) in [int, float]:
                indegree_filter = kv[1]
            else:
                returnD(format_error('ERROR: fieldKeywords must be a list of two-string-elements lists or ["indegree", [min_int, max_int]]. %s' % fieldKeywords))
        WEs = yield self.msclients.pool.searchWebEntities(afk, fk, corpus=corpus)
        if is_error(WEs):
            returnD(WEs)
        res = yield self.format_webentities(WEs, sort=sort, corpus=corpus)
        if indegree_filter:
            res = [w for w in res if w["indegree"] >= indegree_filter[0] and w["indegree"] <= indegree_filter[1]]
        res = yield self.paginate_webentities(res, count, page, sort=sort, corpus=corpus)
        returnD(res)

    def jsonrpc_escape_search_query(self, query, corpus=DEFAULT_CORPUS):
        for char in ["\\", "+", "-", "!", "(", ")", ":", "^", "[", "]", "{", "}", "~", "*", "?"]:
            query = query.replace(char, "\\%s" % char)
        return query.replace(' ', '?')

    def _optionnal_field_search(self, query, field=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        if field:
            if not isinstance(field, unicode):
                field = unicode(field)
            return self.jsonrpc_advanced_search_webentities([], [[field, query]], sort=sort, count=count, page=page, corpus=corpus)
        return self.jsonrpc_advanced_search_webentities([query], sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_exact_search_webentities(self, query, field=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        query = self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_prefixed_search_webentities(self, query, field=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        query = "%s*" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_postfixed_search_webentities(self, query, field=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        query = "*%s" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_free_search_webentities(self, query, field=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        query = "*%s*" % self.jsonrpc_escape_search_query(query)
        return self._optionnal_field_search(query, field, sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_status(self, status, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        status = status.lower()
        valid_statuses = [s.lower() for s in ms.WebEntityStatus._NAMES_TO_VALUES]
        if status not in valid_statuses:
            return format_error("ERROR: status argument must be one of %s" % ",".join(valid_statuses))
        return self.jsonrpc_exact_search_webentities(status, 'STATUS', sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_name(self, name, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_exact_search_webentities(name, 'NAME', sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_tag_value(self, value, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_exact_search_webentities(value, 'TAG_VALUE', sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_tag_category(self, category, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_exact_search_webentities(category, 'TAG_CATEGORY', sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_user_tag(self, category, value, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        return self.jsonrpc_exact_search_webentities("USER:%s=%s" % (category, value), 'TAG', sort=sort, count=count, page=page, corpus=corpus)

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
        if relative_type == "children":
            WEs = yield self.msclients.pool.getWebEntitySubWebEntities(webentity_id, corpus=corpus)
        else:
            WEs = yield self.msclients.pool.getWebEntityParentWebEntities(webentity_id, corpus=corpus)
        if is_error(WEs):
            returnD(WEs)
        res = yield self.format_webentities(WEs, corpus=corpus)
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
        if self.corpora[corpus]['webentities_links'] == None:
            links = yield self.msclients.loop.getWebEntityLinks(corpus=corpus)
            if is_error(links):
                logger.msg(links['message'], system="ERROR - %s" % corpus)
                returnD(False)
            self.corpora[corpus]['webentities_links'] = links
            deferToThread(self.rank_webentities, corpus)
        if outformat == "gexf":
            WEs = yield self.ramcache_webentities(corpus=corpus)
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

def test_start(cor, corpus):
    d = cor.start_corpus(corpus, quiet=True, noloop=True, create_if_missing=True)
    d.addCallback(test_ping, cor, corpus)
    d.addErrback(stop_tests, cor, corpus)
def test_ping(res, cor, corpus):
    if is_error(res):
        return stop_tests(res, cor, corpus, "Could not create corpus")
    d = cor.jsonrpc_ping(corpus, timeout=5)
    d.addCallback(test_destroy, cor, corpus)
    d.addErrback(stop_tests, cor, corpus)
def test_destroy(res, cor, corpus):
    if is_error(res):
        return stop_tests(res, cor, corpus, "Could not start corpus")
    d = cor.destroy_corpus(corpus, quiet=True)
    d.addCallback(test_scrapyd, cor, corpus)
    d.addErrback(stop_tests, cor, corpus)
def test_scrapyd(res, cor, corpus):
    if is_error(res):
        return stop_tests(res, cor, corpus, "Could not stop and destroy corpus")
    stop_tests(None, cor, corpus)
@inlineCallbacks
def stop_tests(res, cor, corpus, msg=None):
    if is_error(res) or str(type(res)) == "<type 'instance'>":
        if msg:
            print "ERROR %s: %s" % (corpus, msg)
        if type(res) == dict:
            print res["message"]
        else:
            print "ERROR", res
        yield cor.close()
        if reactor.running:
            reactor.stop()
    else:
        print "All tests passed. Ready!"

reactor.callLater(1, test_start, core, "--test-corpus--")

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
