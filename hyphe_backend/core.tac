#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time, random
import subprocess
from json import loads as loadjson
from txjsonrpc import jsonrpclib
from txjsonrpc.jsonrpc import Introspection
from txjsonrpc.web import jsonrpc
from twisted.web import server
from twisted.python import log as logger
from twisted.internet import reactor
from twisted.internet.task import LoopingCall
from twisted.internet.threads import deferToThread
from twisted.internet.defer import DeferredList, inlineCallbacks, returnValue as returnD
from twisted.internet.endpoints import TCP4ClientEndpoint
from twisted.internet.error import DNSLookupError
from twisted.application.internet import TCPServer
from twisted.application.service import Application
from twisted.web.http_headers import Headers
from twisted.web.client import Agent, ProxyAgent, HTTPClientFactory, _HTTP11ClientFactory
HTTPClientFactory.noisy = False
_HTTP11ClientFactory.noisy = False
from hyphe_backend import processor
from hyphe_backend.lib import config_hci, urllru, user_agents, creationrules
from hyphe_backend.lib.utils import *
from hyphe_backend.lib.jobsqueue import JobsQueue
from hyphe_backend.lib.mongo import MongoDB, sortdesc
from hyphe_backend.lib.corpus import CorpusFactory
from hyphe_backend.memorystructure import MemoryStructure as ms, constants as ms_const


# MAIN CORE API

class Core(jsonrpc.JSONRPC):

    addSlash = True

    def __init__(self):
        jsonrpc.JSONRPC.__init__(self)
        self.db = MongoDB(config['mongo-scrapy'])
        self.msclients = CorpusFactory(
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
        yield self.jsonrpc_start_corpus(_create_if_missing=True)
        self.keepalive_default = LoopingCall(self.jsonrpc_ping, DEFAULT_CORPUS)
        self.keepalive_default.start(config['memoryStructure']['keepalive']/6, False)

    @inlineCallbacks
    def close(self):
        if not config["MULTICORPUS"] and self.keepalive_default and self.keepalive_default.running:
            self.keepalive_default.stop()
        yield DeferredList([self.jsonrpc_stop_corpus(corpus, _quiet=True) for corpus in self.corpora.keys()], consumeErrors=True)
        yield self.db.close()
        self.msclients.stop()

   # OVERWRITE JSONRPC REQUEST HANDLING

    def render(self, request):
        request.setHeader("Access-Control-Allow-Origin", "*")
        from_ip = ""
        if request.getHeader("x-forwarded-for"):
            from_ip = " from %s" % request.getHeader("x-forwarded-for")
        if config['DEBUG']:
            args = loadjson(request.content.read())
            if args["method"] in ["start_corpus", "create_corpus"] and len(args["params"]) > 1:
                args["params"][1] = "********"
            logger.msg(args, system="DEBUG - QUERY%s" % from_ip)
# TODO   catch corpus arg here and return corpus_error if needed
        return jsonrpc.JSONRPC.render(self, request)

    def _cbRender(self, result, request, id, version):
        if config['DEBUG'] == 2:
            txt = jsonrpclib.dumps(result, id=id, version=2.0)
            logger.msg("%s%s" % (txt[:1000], " ... [%d cars truncated]" % (len(txt)-1000) if len(txt) > 1000 else ''), system="DEBUG - ANSWER")
        return jsonrpc.JSONRPC._cbRender(self, result, request, id, version)

  # CORPUS HANDLING

    def jsonrpc_test_corpus(self, corpus=DEFAULT_CORPUS, _msg=None):
        """Returns the current status of a `corpus`: "ready"/"starting"/"stopped"/"error"."""
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
        elif _msg:
            res["message"] = _msg
        return format_result(res)

    @inlineCallbacks
    def jsonrpc_list_corpus(self):
        """Returns the list of all existing corpora with metas."""
        res = {}
        corpora = yield self.db.list_corpus()
        for corpus in corpora:
            corpus["password"] = (corpus["password"] != "")
            del(corpus["options"])
            corpus.update(self.jsonrpc_test_corpus(corpus.pop('_id'))["result"])
            res[corpus["corpus_id"]] = corpus
        returnD(format_result(res))

    def jsonrpc_get_corpus_options(self, corpus=DEFAULT_CORPUS):
        """Returns detailed settings of a `corpus`."""
        if not self.corpus_ready(corpus):
            return self.corpus_error(corpus)
        return format_result(self.corpora[corpus]["options"])

    @inlineCallbacks
    def jsonrpc_set_corpus_options(self, corpus=DEFAULT_CORPUS, options=None):
        """Updates the settings of a `corpus` according to the keys/values provided in `options` as a json object respecting the settings schema visible by querying `get_corpus_options`. Returns the detailed settings."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        try:
            config_hci.check_conf_sanity(options, config_hci.CORPUS_CONF_SCHEMA, name="%s options" % corpus, soft=True)
        except Exception as e:
            returnD(format_error(e))
        redeploy = False
        if "precision_limit" in options or "default_creation_rule" in options:
            returnD(format_error("Precision limit and default WE creation rules of a corpus can only be set when the corpus is created"))
        if "proxy" in options or ("phantom" in options and (\
          "timeout" in options["phantom"] or \
          "ajax_timeout" in options["phantom"] or \
          "idle_timeout" in options["phantom"])):
            if self.corpora[corpus]['crawls_running']:
                returnD(format_error("Please stop currently running crawls before modifiying the crawler's settings"))
            else:
                redeploy = True
        oldram = self.corpora[corpus]["options"]["ram"]
        oldkeep = self.corpora[corpus]["options"]["keepalive"]
        if "phantom" in options:
            redeploy = True
            self.corpora[corpus]["options"]["phantom"].update(options.pop("phantom"))
        self.corpora[corpus]["options"].update(options)
        yield self.update_corpus(corpus, force_ram=True)
        if redeploy:
            res = yield self.crawler.jsonrpc_deploy_crawler(corpus)
            if is_error(res):
                returnD(res)
        if ("ram" in options and options["ram"] != oldram) or \
           ("keepalive" in options and options["keepalive"] != oldkeep):
            res = yield self.jsonrpc_stop_corpus(corpus, _quiet=True)
            if is_error(res):
                returnD(res)
            corpus_conf = yield self.db.get_corpus(corpus)
            res = yield self.jsonrpc_start_corpus(corpus, password=corpus_conf["password"])
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
            reactor.callLater(0, self.jsonrpc_stop_corpus, corpus, _quiet=True)
        return format_error(self.jsonrpc_test_corpus(corpus)["result"])

    def factory_full(self):
        return self.msclients.ram_free < 256 or not self.msclients.ports_free

    @inlineCallbacks
    def jsonrpc_create_corpus(self, name=DEFAULT_CORPUS, password="", options={}, _noloop=False, _quiet=False):
        """Creates a corpus with the chosen `name` and optional `password` and `options` (as a json object see `set/get_corpus_options`). Returns the corpus generated id and status."""
        if self.factory_full():
            returnD(self.corpus_error())

        corpus = clean_corpus_id(name)
        corpus_idx = 1
        existing = yield self.db.get_corpus(corpus)
        while existing:
            corpus = "%s-%s" % (clean_corpus_id(name), corpus_idx)
            corpus_idx += 1
            existing = yield self.db.get_corpus(corpus)

        if options:
            try:
                config_hci.check_conf_sanity(options, config_hci.CORPUS_CONF_SCHEMA, name="%s options" % corpus, soft=True)
            except Exception as e:
                returnD(format_error(e))
        self.corpora[corpus] = {
          "name": name,
          "options": config_hci.clean_missing_corpus_options({}, config)
        }
        if not _quiet:
            logger.msg("New corpus created", system="INFO - %s" % corpus)
        yield self.db.add_corpus(corpus, name, password, self.corpora[corpus]["options"])
        try:
            res = yield self.crawler.jsonrpc_deploy_crawler(corpus, _quiet=_quiet)
        except Exception as e:
            logger.msg("Could not deploy crawler for new corpus: %s %s" % (type(e), e), system="ERROR - %s" % corpus)
            returnD(format_error("Could not deploy crawler for corpus"))
        if not res:
            logger.msg("Could not deploy crawler for new corpus", system="ERROR - %s" % corpus)
            returnD(res)
        res = yield self.jsonrpc_start_corpus(corpus, password=password, _noloop=_noloop, _quiet=_quiet)
        returnD(res)

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
        self.corpora[corpus]["creation_rules"] = []
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
    def jsonrpc_start_corpus(self, corpus=DEFAULT_CORPUS, password="", _noloop=False, _quiet=False, _create_if_missing=False):
        """Starts an existing `corpus` possibly `password`-protected. Returns the new corpus status."""
        corpus_conf = yield self.db.get_corpus(corpus)
        if not corpus_conf:
            if _create_if_missing:
                res = yield self.jsonrpc_create_corpus(corpus, password, _noloop=_noloop, _quiet=_quiet)
                returnD(res)
            returnD(format_error("No corpus existing with ID %s, please create it first!" % corpus))
        if corpus_conf['password'] and password != config.get("ADMIN_PASSWORD", None) and corpus_conf['password'] not in [password, salt(password)]:
            returnD(format_error("Wrong auth for password-protected corpus %s" % corpus))

        if self.corpus_ready(corpus) or self.msclients.status_corpus(corpus, simplify=True) == "starting":
            returnD(self.jsonrpc_test_corpus(corpus, _msg="Corpus already ready"))

        if self.factory_full():
            if not _quiet:
                logger.msg("Could not start extra corpus, all slots busy", system="WARNING - %s" % corpus)
            returnD(self.corpus_error())

        # Fix possibly old corpus confs
        config_hci.clean_missing_corpus_options(corpus_conf['options'],config)

        if not _quiet:
            logger.msg("Starting corpus...", system="INFO - %s" % corpus)
        yield self.db.init_corpus_indexes(corpus)
        res = self.msclients.start_corpus(corpus, _quiet, ram=corpus_conf['options']['ram'], keepalive=corpus_conf['options']['keepalive'])
        if not res:
            returnD(format_error(self.jsonrpc_test_corpus(corpus)["result"]))
        yield self.prepare_corpus(corpus, corpus_conf, _noloop)
        returnD(self.jsonrpc_test_corpus(corpus))

    @inlineCallbacks
    def prepare_corpus(self, corpus=DEFAULT_CORPUS, corpus_conf=None, _noloop=False):
        self.init_corpus(corpus)
        if not corpus_conf:
            corpus_conf = yield self.db.get_corpus(corpus)
        self.corpora[corpus]["name"] = corpus_conf["name"]
        self.corpora[corpus]["options"] = corpus_conf["options"]
        self.corpora[corpus]["links_duration"] = corpus_conf.get("links_duration", 60)
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
        self.corpora[corpus]["reset"] = False
        if not _noloop:
            reactor.callLater(5, self.corpora[corpus]['jobs_loop'].start, 1, False)
        yield self.store._init_loop(corpus, _noloop=_noloop)
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
          "links_duration": self.corpora[corpus]['links_duration'],
          "last_activity": now_ts()
        })

    def stop_loops(self, corpus=DEFAULT_CORPUS):
        for f in ["stats", "jobs", "index"]:
            fid = "%s_loop" % f
            if fid in self.corpora[corpus] and self.corpora[corpus][fid].running:
                self.corpora[corpus][fid].stop()

    @inlineCallbacks
    def jsonrpc_stop_corpus(self, corpus=DEFAULT_CORPUS, _quiet=False):
        """Stops an existing and running `corpus`. Returns the new corpus status."""
        if corpus in self.corpora:
            self.stop_loops(corpus)
            if corpus in self.msclients.corpora:
                yield self.update_corpus(corpus)
                self.msclients.stop_corpus(corpus, _quiet)
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
        """Tests during `timeout` seconds whether an existing `corpus` is started. Returns "pong" on success or the corpus status otherwise."""
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

    @inlineCallbacks
    def jsonrpc_reinitialize(self, corpus=DEFAULT_CORPUS, _noloop=False, _quiet=False):
        """Resets completely a `corpus` by cancelling all crawls and emptying the MemoryStructure and Mongo data."""
        if self.corpora[corpus]['reset']:
            returnD(format_result("Already resetting"))
        if not _quiet:
            logger.msg("Resetting corpus...", system="INFO - %s" % corpus)
        if corpus in self.corpora:
            self.stop_loops(corpus)
        self.init_corpus(corpus)
        self.corpora[corpus]['reset'] = True
        res = yield self.crawler.reinitialize(corpus, _recreate=(not _noloop), _quiet=_quiet)
        if is_error(res):
            logger.msg("Problem while reinitializing crawler... %s" % res, system="ERROR - %s" % corpus)
            returnD(res)
        self.init_corpus(corpus)

        res = yield self.store.reinitialize(corpus, _noloop=_noloop, _quiet=_quiet)
        if is_error(res):
            logger.msg("Problem while reinitializing MemoryStructure... %s" % res, system="ERROR - %s" % corpus)
            returnD(res)
        returnD(format_result('Memory structure and crawling database contents emptied.'))

    @inlineCallbacks
    def jsonrpc_destroy_corpus(self, corpus=DEFAULT_CORPUS, _quiet=False):
        """Resets a `corpus` then definitely deletes anything associated with it."""
        if not _quiet:
            logger.msg("Destroying corpus...", system="INFO - %s" % corpus)
        res = yield self.jsonrpc_reinitialize(corpus, _noloop=True, _quiet=_quiet)
        if is_error(res):
            returnD(res)
        res = yield self.jsonrpc_stop_corpus(corpus, _quiet=_quiet)
        if is_error(res):
            returnD(res)
        res = yield self.crawler.jsonrpc_delete_crawler(corpus, _quiet)
        yield self.db.delete_corpus(corpus)
        returnD(format_result("Corpus %s destroyed successfully" % corpus))

    @inlineCallbacks
    def jsonrpc_clear_all(self):
        """Resets Hyphe completely: starts then resets and destroys all existing corpora one by one."""
        logger.msg("CLEAR_ALL: destroying all corpora...", system="INFO")
        corpora = yield self.db.list_corpus(fields=['_id', 'password'])
        for corpus in corpora:
            res = yield self.delete_corpus(corpus)
            if is_error(res):
                returnD(res)
        returnD(format_result("All corpora and databases cleaned up"))

    @inlineCallbacks
    def delete_corpus(self, corpus_metas):
        res = yield self.jsonrpc_start_corpus(corpus_metas['_id'], password=corpus_metas['password'], _noloop=True, _quiet=not config['DEBUG'])
        if is_error(res):
            returnD(res)
        res = yield self.jsonrpc_ping(corpus_metas['_id'], timeout=10)
        if is_error(res):
            returnD(res)
        res = yield self.jsonrpc_destroy_corpus(corpus_metas['_id'], _quiet=not config['DEBUG'])
        if is_error(res):
            returnD(res)
        returnD("Corpus %s cleaned up" % corpus_metas['_id'])

  # CORE & CORPUS STATUS

    def jsonrpc_get_status(self, corpus=DEFAULT_CORPUS):
        """Returns global metadata on Hyphe's status and specific information on a `corpus`."""
        status = {
          'hyphe': {
            'corpus_running': self.msclients.total_running(),
            'crawls_running': sum([c['crawls_running'] for c in self.corpora.values() if "crawls_running" in c]),
            'crawls_pending': sum([c['crawls_pending'] for c in self.corpora.values() if "crawls_pending" in c]),
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
            'pages_to_index': self.corpora[corpus]['pages_queued'],
            'webentities': {
              'total': self.corpora[corpus]['total_webentities'],
              'IN': self.corpora[corpus]['webentities_in'],
              'OUT': self.corpora[corpus]['webentities_out'],
              'UNDECIDED': self.corpora[corpus]['webentities_undecided'],
              'DISCOVERED': self.corpora[corpus]['webentities_discovered']
            }
          },
          'creation_rules': sorted(self.corpora[corpus]['creation_rules'],
            key=lambda x: x['prefix'][x['prefix'].find("h:"):]+x['prefix'][:x['prefix'].find('|')])
        }
        status['corpus'].update(corpus_status)
        return format_result(status)

  # BASIC PAGE DECLARATION (AND WEBENTITY CREATION)

    @inlineCallbacks
    def jsonrpc_declare_page(self, url, corpus=DEFAULT_CORPUS):
        """Indexes a `url` into a `corpus`. Returns the (newly created or not) associated WebEntity."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        res = yield self.store.declare_page(url, corpus=corpus)
        returnD(handle_standard_results(res))

    @inlineCallbacks
    def jsonrpc_declare_pages(self, list_urls, corpus=DEFAULT_CORPUS):
        """Indexes a bunch of urls given as an array in `list_urls` into a `corpus`. Returns the (newly created or not) associated WebEntities."""
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
    def jsonrpc_listjobs(self, list_ids=None, from_ts=None, to_ts=None, corpus=DEFAULT_CORPUS):
        """Returns the list and details of all "finished"/"running"/"pending" crawl jobs of a `corpus`. Optionally returns only the jobs whose id is given in an array of `list_ids` and/or that was created after timestamp `from_ts` or before `to_ts`."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        query = {}
        if list_ids:
            query = {'_id': {'$in': list_ids}}
        if to_ts:
            query["created_at"] = {}
            query["created_at"]["$lte"] = to_ts
            if from_ts:
                query["created_at"]["$gte"] = from_ts
        elif from_ts:
            query["$or"] = [
              {"created_at": {"$gte": from_ts}},
              {"indexing_status": {"$nin": [
                indexing_statuses.CANCELED, indexing_statuses.FINISHED
              ]}}
            ]
        jobs = yield self.db.list_jobs(corpus, query)
        returnD(format_result(list(jobs)))

    @inlineCallbacks
    def refresh_jobs(self, corpus=DEFAULT_CORPUS):
        # Runs a monitoring task on the list of jobs in the database to update their status from scrapy API and indexing tasks
        if self.corpora[corpus]['reset']:
            yield self.db.queue(corpus).drop(safe=True)
            returnD(None)
        scrapyjobs = yield self.crawler.list(corpus)
        if is_error(scrapyjobs):
            if not (type(scrapyjobs["message"]) is dict and "status" in scrapyjobs["message"]):
                logger.msg("Problem dialoguing with scrapyd server: %s" % scrapyjobs, system="WARNING - %s" % corpus)
            returnD(None)
        scrapyjobs = scrapyjobs['result']
        self.corpora[corpus]['crawls_pending'] = len(scrapyjobs['pending']) + self.crawler.crawlqueue.count_waiting_jobs(corpus)
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
            yield self.db.update_jobs(corpus, {'crawling_status': {'$in': [crawling_statuses.RUNNING]}}, {'crawling_status': crawling_statuses.FINISHED, "finished_at": now_ts()})
        # clean canceled jobs
        yield self.db.update_jobs(corpus, {'crawling_status': crawling_statuses.CANCELED, 'indexing_status': {"$ne": indexing_statuses.CANCELED}}, {'indexing_status': indexing_statuses.CANCELED, 'finished_at': now_ts()})
        # update jobs crawling status accordingly to crawler's statuses
        running_ids = [job['id'] for job in scrapyjobs['running']]
        yield DeferredList([self.db.update_job_pages(corpus, job_id) for job_id in running_ids], consumeErrors=True)
        for bl, res in results:
            if not bl:
                logger.msg("Problem dialoguing with MongoDB: %s" % res, system="WARNING - %s" % corpus)
                returnD(None)
        res = yield self.db.list_jobs(corpus, {'crawljob_id': {'$in': running_ids}, 'crawling_status': crawling_statuses.PENDING}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'crawling_status': crawling_statuses.RUNNING, 'started_at': now_ts()})
            yield self.db.add_log(corpus, update_ids, "CRAWL_"+crawling_statuses.RUNNING)
        # update crawling status for finished jobs
        finished_ids = [job['id'] for job in scrapyjobs['finished']]
        res = yield self.db.list_jobs(corpus, {'crawljob_id': {'$in': finished_ids}, 'crawling_status': {'$nin': [crawling_statuses.RETRIED, crawling_statuses.CANCELED, crawling_statuses.FINISHED]}}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'crawling_status': crawling_statuses.FINISHED, 'crawled_at': now_ts()})
            yield self.db.add_log(corpus, update_ids, "CRAWL_"+crawling_statuses.FINISHED)
        # collect list of crawling jobs whose outputs is not fully indexed yet
        jobs_in_queue = yield self.db.queue(corpus).distinct('_job')
        # set index finished for jobs with crawling finished and no page left in queue
        res = yield self.db.list_jobs(corpus, {'crawling_status': crawling_statuses.FINISHED, 'crawljob_id': {'$exists': True}})
        finished_ids = set([job['crawljob_id'] for job in res] + finished_ids)
        res = yield self.db.list_jobs(corpus, {'crawljob_id': {'$in': list(finished_ids-set(jobs_in_queue))}, 'crawling_status': crawling_statuses.FINISHED, 'indexing_status': {'$nin': [indexing_statuses.BATCH_RUNNING, indexing_statuses.FINISHED]}}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'indexing_status': indexing_statuses.FINISHED, 'finished_at': now_ts()})
            yield self.db.add_log(corpus, update_ids, "INDEX_"+indexing_statuses.FINISHED)
            if self.corpora[corpus]['options']['phantom'].get('autoretry', False):
                # Try to restart in phantom mode all regular crawls that seem to have failed (less than 3 pages found for a depth of at least 1)
                res = yield self.db.list_jobs(corpus, {'_id': {'$in': update_ids}, 'nb_crawled_pages': {'$lt': 3}, 'crawl_arguments.phantom': False, 'crawl_arguments.maxdepth': {'$gt': 0}})
                for job in res:
                    logger.msg("Crawl job %s seems to have failed, trying to restart it in phantom mode" % job['_id'], system="INFO - %s" % corpus)
                    yield self.jsonrpc_crawl_webentity(job['webentity_id'], max(job['crawl_arguments']['maxdepth'], 2), True, corpus=corpus)
                    yield self.db.add_log(corpus, job['_id'], "CRAWL_RETRIED_AS_PHANTOM")
                    yield self.db.update_jobs(corpus, job['_id'], {'crawling_status': crawling_statuses.RETRIED})

    @inlineCallbacks
    def jsonrpc_crawl_webentity(self, webentity_id, depth=0, phantom_crawl=False, status=ms.WebEntityStatus._VALUES_TO_NAMES[ms.WebEntityStatus.IN], startpages="startpages", phantom_timeouts={}, corpus=DEFAULT_CORPUS):
        """Schedules a crawl for a `corpus` for an existing WebEntity defined by its `webentity_id` with a specific crawl `depth [int]`. Optionally use PhantomJS by setting `phantom_crawl` to "true" and adjust specific `phantom_timeouts` as a json object with possible keys `timeout`/`ajax_timeout`/`idle_timeout`. Sets simultaneously the WebEntity's status to "IN" or optionally to another valid `status` ("undecided"/"out"/"discovered"). Optionally defines the `startpages` strategy by starting the crawl either from the WebEntity's preset "startpages" or "prefixes" or already seen "pages"."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))

        # Adjust settings
        try:
            depth = int(depth)
        except:
            depth = self.corpora[corpus]["options"]['max_depth']
        if depth > self.corpora[corpus]["options"]['max_depth']:
            returnD(format_error('No crawl with a bigger depth than %d is allowed on this Hyphe instance.' % self.corpora[corpus]["options"]['max_depth']))
        phantom_timeouts.update(self.corpora[corpus]["options"]["phantom"])
        statusval = -1
        for s in ms.WebEntityStatus._NAMES_TO_VALUES:
            if status.lower() == s.lower():
                statusval = s
                break
        if statusval == -1:
            returnD(format_error("ERROR: status argument must be one of '%s'" % "','".join([s.lower() for s in ms.WebEntityStatus._NAMES_TO_VALUES])))
        WE = yield self.store.msclients.pool.getWebEntity(webentity_id, corpus=corpus)
        if is_error(WE):
            returnD(format_error("No WebEntity with id %s found" % webentity_id))

        # Handle different startpages strategies
        startpages = startpages.lower()
        if startpages == "pages":
            pages = yield self.store.msclients.pool.getWebEntityCrawledPages(WE.id, corpus=corpus)
            if is_error(pages):
                returnD(pages)
            starts = [p.url for p in pages]
        elif startpages == "prefixes":
            starts = [urllru.lru_to_url(lru) for lru in WE.LRUSet]
        elif startpages == "startpages":
            starts = list(WE.startpages)
        else:
            returnD(format_error('ERROR: startpages argument must be one of "startpages", "pages" or "prefixes"'))

        yield self.store.jsonrpc_set_webentity_status(webentity_id, statusval, corpus=corpus)

        subs = yield self.store.msclients.pool.getWebEntitySubWebEntities(WE.id, corpus=corpus)
        if is_error(subs):
            returnD(subs)
        nofollow = [lr for subwe in subs for lr in subwe.LRUSet]

        yield self.store.jsonrpc_rm_webentity_tag_value(webentity_id, "CORE", "recrawl_needed", "true", corpus=corpus)
        res = yield self.crawler.jsonrpc_start(webentity_id, starts, WE.LRUSet, nofollow, self.corpora[corpus]["options"]["follow_redirects"], depth, phantom_crawl, phantom_timeouts, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentity_logs(self, webentity_id, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` crawl activity logs on a specific WebEntity defined by its `webentity_id`."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        jobs = yield self.db.list_jobs(corpus, {'webentity_id': webentity_id}, fields=['_id'])
        if not jobs:
            returnD(format_error('No job found for WebEntity %s.' % webentity_id))
        res = yield self.db.list_logs(corpus, [a['_id'] for a in list(jobs)])
        returnD(format_result([{'timestamp': log['timestamp'], 'job': log['_job'], 'log': log['log']} for log in list(res)]))

  # HTTP LOOKUP METHODS

    def jsonrpc_lookup_httpstatus(self, url, timeout=30, corpus=DEFAULT_CORPUS):
        """Tests a `url` for `timeout` seconds using a `corpus` specific connection (possible proxy for instance). Returns the url's HTTP code."""
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
                        if config['DEBUG'] == 2:
                            logger.msg("Retry lookup %s %s %s %s" % (method, url, tryout, response.__dict__), system="DEBUG - %s" % corpus)
                        res = yield self.lookup_httpstatus(url, timeout=timeout+2, tryout=tryout+1, noproxy=noproxy, deadline=deadline, corpus=corpus)
                        returnD(res)
        returnD(format_result(response.code))

    @inlineCallbacks
    def jsonrpc_lookup(self, url, timeout=30, corpus=DEFAULT_CORPUS):
        """Tests a `url` for `timeout` seconds using a `corpus` specific connection (possible proxy for instance). Returns a boolean indicating whether `lookup_httpstatus` returned HTTP code 200 or a redirection code (301/302/...)."""
        res = yield self.jsonrpc_lookup_httpstatus(url, timeout=timeout, corpus=corpus)
        if res['code'] == 'success' and (res['result'] == 200 or 300 < res['result'] < 400):
            returnD(format_result(True))
        returnD(format_result(False))


# CRAWLER'S DEDICATED API
# accessible jsonrpc methods via "crawl."

class Crawler(jsonrpc.JSONRPC):

    def __init__(self, parent=None):
        jsonrpc.JSONRPC.__init__(self)
        self.parent = parent
        self.db = self.parent.db
        self.corpora = self.parent.corpora
        self.crawlqueue = JobsQueue(config["mongo-scrapy"])

    @inlineCallbacks
    def jsonrpc_deploy_crawler(self, corpus=DEFAULT_CORPUS, _quiet=False):
        """Prepares and deploys on the ScrapyD server a spider (crawler) for a `corpus`."""
        output = subprocess.Popen(['bash', 'bin/deploy_scrapy_spider.sh', corpus, '--noenv'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT).communicate()[0]
        res = yield self.crawlqueue.send_scrapy_query("listprojects")
        if is_error(res) or "projects" not in res or corpus_project(corpus) not in res['projects']:
            logger.msg("Couldn't deploy crawler", system="ERROR - %s" % corpus)
            returnD(format_error(output))
        if not _quiet:
            logger.msg("Successfully deployed crawler", system="INFO - %s" % corpus)
        returnD(format_result("Crawler %s deployed" % corpus_project(corpus)))

    @inlineCallbacks
    def jsonrpc_delete_crawler(self, corpus=DEFAULT_CORPUS, _quiet=False):
        """Removes from the ScrapyD server an existing spider (crawler) for a `corpus`."""
        proj = corpus_project(corpus)
        res = yield self.crawlqueue.send_scrapy_query("delproject", {"project": proj})
        if is_error(res):
            logger.msg("Couldn't destroy scrapyd spider: %s" % res, system="ERROR - %s" % corpus)
        elif not _quiet:
            logger.msg("Successfully destroyed crawler", system="INFO - %s" % corpus)

    @inlineCallbacks
    def jsonrpc_cancel_all(self, corpus=DEFAULT_CORPUS):
        """Stops all "running" and "pending" crawl jobs for a `corpus`."""
        self.crawlqueue.cancel_corpus_jobs(corpus)
        list_jobs = yield self.list(corpus)
        if is_error(list_jobs):
            returnD('No crawler deployed, hence no job to cancel')
        list_jobs = list_jobs['result']
        while 'running' in list_jobs and (list_jobs['running'] + list_jobs['pending']):
            yield DeferredList([self.jsonrpc_cancel(item['id'], corpus=corpus) for item in list_jobs['running'] + list_jobs['pending']], consumeErrors=True)
            list_jobs = yield self.list(corpus)
            if is_error(list_jobs):
                returnD(list_jobs)
            list_jobs = list_jobs['result']
        returnD(format_result('All crawling jobs canceled.'))

    @inlineCallbacks
    def reinitialize(self, corpus=DEFAULT_CORPUS, _recreate=True, _quiet=False):
        """Cancels all current crawl jobs running or planned for a `corpus` and empty related mongo data."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not _quiet:
            logger.msg("Empty crawl list + mongodb queue", system="INFO - %s" % corpus)
        if self.corpora[corpus]['jobs_loop'].running:
            self.corpora[corpus]['jobs_loop'].stop()
        canceljobs = yield self.jsonrpc_cancel_all(corpus)
        if is_error(canceljobs):
            returnD(canceljobs)
        yield self.db.drop_corpus_collections(corpus)
        if _recreate:
            self.corpora[corpus]['jobs_loop'].start(10, False)
        returnD(format_result('Crawling database reset.'))

    @inlineCallbacks
    def jsonrpc_start(self, webentity_id, starts, follow_prefixes, nofollow_prefixes, follow_redirects=None, depth=0, phantom_crawl=False, phantom_timeouts={}, download_delay=config['mongo-scrapy']['download_delay'], corpus=DEFAULT_CORPUS):
        """Starts a crawl for a `corpus` defining finely the crawl options (mainly for debug purposes):\n- a `webentity_id` associated with the crawl a list of `starts` urls to start from\n- a list of `follow_prefixes` to know which links to follow\n- a list of `nofollow_prefixes` to know which links to avoid\n- a `depth` corresponding to the maximum number of clicks done from the start pages\n- `phantom_crawl` set to "true" to use PhantomJS for this crawl and optional `phantom_timeouts` as an object with keys among `timeout`/`ajax_timeout`/`idle_timeout`\n- a `download_delay` corresponding to the time in seconds spent between two requests by the crawler."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not phantom_crawl and urls_match_domainlist(starts, self.corpora[corpus]["options"]['phantom']['whitelist_domains']):
            phantom_crawl = True
        if not follow_redirects:
            follow_redirects = self.corpora[corpus]["options"]["follow_redirects"]
        try:
            depth = int(depth)
        except:
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
        res = yield self.crawlqueue.add_job(args, corpus, webentity_id)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_cancel(self, job_id, corpus=DEFAULT_CORPUS):
        """Cancels a crawl of id `job_id` for a `corpus`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        existing = yield self.db.list_jobs(corpus, {"$or": [{"crawljob_id": job_id}, {"_id": job_id}]})
        if not existing:
            returnD(format_error("No job found with id %s" % job_id))
        elif existing[0]["crawling_status"] in [crawling_statuses.FINISHED, crawling_statuses.CANCELED, crawling_statuses.RETRIED]:
            returnD(format_error("Job %s is already not running anymore" % job_id))
        logger.msg("Cancel crawl: %s" % job_id, system="INFO - %s" % corpus)
        if job_id in self.crawlqueue.queue:
            del(self.crawlqueue.queue[job_id])
            res = "pending job %s removed from queue" % job_id
        else:
            args = {'project': corpus_project(corpus), 'job': existing[0]["crawljob_id"]}
            res = yield self.crawlqueue.send_scrapy_query('cancel', args)
            if is_error(res):
                returnD(reformat_error(res))
            yield self.crawlqueue.send_scrapy_query('cancel', args)
        yield self.db.update_jobs(corpus, job_id, {'crawling_status': crawling_statuses.CANCELED})
        yield self.db.add_log(corpus, job_id, "CRAWL_"+crawling_statuses.CANCELED)
        returnD(format_result(res))

    @inlineCallbacks
    def list(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        res = yield self.crawlqueue.send_scrapy_query('listjobs', {'project': corpus_project(corpus)})
        if is_error(res):
            returnD(reformat_error(res))
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_job_logs(self, job_id, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` activity logs of a specific crawl with id `job_id`."""
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
    def _init_loop(self, corpus=DEFAULT_CORPUS, _noloop=False):
        if self.corpora[corpus]['reset']:
            yield self.db.queue(corpus).drop(safe=True)

        now = now_ts()
        yield self.handle_index_error(corpus)
        self.corpora[corpus]['reset'] = False
        self.corpora[corpus]['loop_running'] = None
        self.corpora[corpus]['loop_running_since'] = now
        self.corpora[corpus]['last_WE_update'] = now
        self.corpora[corpus]['recent_changes'] = 0
        self.corpora[corpus]['recent_tagging'] = True
        if not _noloop:
            reactor.callLater(3, deferToThread, self.jsonrpc_get_precision_exceptions, corpus=corpus)
            reactor.callLater(10, self.corpora[corpus]['index_loop'].start, 1, True)
            reactor.callLater(60, self.corpora[corpus]['stats_loop'].start, 300, False)
        yield self.ensureDefaultCreationRuleExists(corpus, _quiet=_noloop)

    def format_webentity(self, WE, job={}, light=False, semilight=False, light_for_csv=False, corpus=DEFAULT_CORPUS):
        if not WE:
            return None
        res = {'id': WE.id, 'name': WE.name, 'status': WE.status, 'lru_prefixes': list(WE.LRUSet)}
        res['indegree'] = self.corpora[corpus]["webentities_ranks"].get(WE.id, 0)
        if test_bool_arg(light):
            return res
        res['creation_date'] = WE.creationDate
        res['last_modification_date'] = WE.lastModificationDate
        if job:
            res['crawling_status'] = job['crawling_status']
            res['indexing_status'] = job['indexing_status']
        else:
            res['crawling_status'] = crawling_statuses.UNCRAWLED
            res['indexing_status'] = indexing_statuses.UNINDEXED
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
        return res

    @inlineCallbacks
    def format_webentities(self, WEs, light=False, semilight=False, light_for_csv=False, sort=None, corpus=DEFAULT_CORPUS):
        jobs = {}
        if not (test_bool_arg(light) or test_bool_arg(light_for_csv)):
            res = yield self.db.list_jobs(corpus, {'webentity_id': {'$in': [WE.id for WE in WEs if WE.status != "DISCOVERED"]}}, fields=['webentity_id', 'crawling_status', 'indexing_status'])
            for job in res:
                jobs[job['webentity_id']] = job
        res = [self.format_webentity(WE, jobs.get(WE.id, {}), light, semilight, light_for_csv, corpus=corpus) for WE in WEs]
        if res and sort:
            if type(sort) != list:
                sort = [sort]
            for sortkey in reversed(sort):
                key = sortkey.lstrip("-")
                reverse = (key != sortkey)
                if key in res[0]:
                    res = sorted(res, key=lambda x: x[key].upper() if type(x[key]) in [str, unicode] else x[key], reverse=reverse)
        returnD(res)

    @inlineCallbacks
    def reinitialize(self, corpus=DEFAULT_CORPUS, _noloop=False, _quiet=False):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not _quiet:
            logger.msg("Empty MemoryStructure content", system="INFO - %s" % corpus)
        res = self.msclients.sync.clearIndex(corpus=corpus)
        if is_error(res):
            returnD(res)
        yield self._init_loop(corpus, _noloop=_noloop)
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
        job = yield self.db.list_jobs(corpus, {'webentity_id': WE.id}, fields=['crawling_status', 'indexing_status'], filter=sortdesc('created_at'), limit=1)
        WE = self.format_webentity(WE, job, corpus=corpus)
        WE['created'] = True if new else False
        returnD(WE)

  # DEFINE WEBENTITIES

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

    @inlineCallbacks
    def jsonrpc_get_lru_definedprefixes(self, lru, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a list of all possible LRU prefixes shorter than `lru` and already attached to WebEntities."""
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
                    "stems_count": len(urllru.split_lru_in_stems(prefix, False)),
                    "id": WE.id,
                    "name": WE.name
                })
        returnD(format_result(WEs))

    def jsonrpc_declare_webentity_by_lruprefix_as_url(self, url, name=None, status=None, startPages=[], corpus=DEFAULT_CORPUS):
        """Creates for a `corpus` a WebEntity defined for the LRU prefix given as a `url`. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startPages`. Returns the newly created WebEntity."""
        try:
            url, lru_prefix = urllru.url_clean_and_convert(url, False)
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_declare_webentity_by_lrus([lru_prefix], name, status, startPages, corpus=corpus)

    def jsonrpc_declare_webentity_by_lru(self, lru_prefix, name=None, status=None, startPages=[], corpus=DEFAULT_CORPUS):
        """Creates for a `corpus` a WebEntity defined for a `lru_prefix`. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startPages`. Returns the newly created WebEntity."""
        return self.jsonrpc_declare_webentity_by_lrus([lru_prefix], name, status, startPages, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_declare_webentity_by_lrus(self, list_lrus, name=None, status=None, startPages=[], corpus=DEFAULT_CORPUS):
        """Creates for a `corpus` a WebEntity defined for a set of LRU prefixes given as `list_lrus`. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startPages`. Returns the newly created WebEntity."""
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

  # EDIT WEBENTITIES

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
                values = value if isinstance(value, list) else [value]
                if array_behavior == "push":
                    if isinstance(arr, list):
                        arr += values
                    elif isinstance(arr, set):
                        arr |= set(values)
                    for v in values:
                        if field_name == 'LRUSet':
                            res = self.handle_lru_precision_exceptions(v, corpus=corpus)
                            if is_error(res):
                                returnD(res)
                        elif field_name == 'startpages':
                            res = self.handle_url_precision_exceptions(v, corpus=corpus)
                            if is_error(res):
                                returnD(res)
                elif array_behavior == "pop":
                    for v in values:
                        arr.remove(v)
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
                if field_name == 'LRUSet':
                    self.corpora[corpus]['recent_changes'] += 1
                returnD(format_result("%s field of WebEntity %s updated." % (field_name, res)))
            else:
                res = yield self.msclients.pool.deleteWebEntity(WE, corpus=corpus)
                if is_error(res):
                    returnD(res)
                yield self.db.update_jobs(corpus, {'webentity_id': WE.id}, {'webentity_id': None, 'previous_webentity_id': WE.id, 'previous_webentity_name': WE.name})
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
        """Changes for a `corpus` the name of a WebEntity defined by `webentity_id` to `new_name`."""
        if not new_name or new_name == "":
            return format_error("ERROR: please specify a value for the WebEntity's name")
        return self.update_webentity(webentity_id, "name", new_name, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_change_webentity_id(self, webentity_old_id, webentity_new_id, corpus=DEFAULT_CORPUS):
        """Changes for a `corpus` the id of a WebEntity defined by `webentity_old_id` to `webentity_new_id` (mainly for advanced debug use)."""
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
        """Changes for a `corpus` the status of a WebEntity defined by `webentity_id` to `status` (one of "in"/"out"/"undecided"/"discovered")."""
        return self.update_webentity(webentity_id, "status", status, corpus=corpus)

    def jsonrpc_set_webentities_status(self, webentity_ids, status, corpus=DEFAULT_CORPUS):
        """Changes for a `corpus` the status of a set of WebEntities defined by a list of `webentity_ids` to `status` (one of "in"/"out"/"undecided"/"discovered")."""
        return self.batch_webentities_edit("set_webentity_status", webentity_ids, corpus, status)

    def jsonrpc_set_webentity_homepage(self, webentity_id, homepage, corpus=DEFAULT_CORPUS):
        """Changes for a `corpus` the homepage of a WebEntity defined by `webentity_id` to `homepage`."""
        try:
            homepage, _ = urllru.url_clean_and_convert(url)
        except ValueError as e:
            return format_error(e)
        return self.update_webentity(webentity_id, "homepage", homepage, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_add_webentity_lruprefixes(self, webentity_id, lru_prefixes, corpus=DEFAULT_CORPUS):
        """Adds for a `corpus` a list of `lru_prefixes` (or a single one) to a WebEntity defined by `webentity_id`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not isinstance(lru_prefixes, list):
            lru_prefixes = [lru_prefixes]
        clean_lrus = []
        for lru_prefix in lru_prefixes:
            print lru_prefix
            try:
                url, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
            except ValueError as e:
                returnD(format_error(e))
            old_WE = yield self.msclients.pool.getWebEntityByLRUPrefix(lru_prefix, corpus=corpus)
            if not is_error(old_WE) and old_WE.id != webentity_id:
                logger.msg("Removing LRUPrefix %s from WebEntity %s" % (lru_prefix, old_WE.name), system="INFO - %s" % corpus)
                res = yield self.jsonrpc_rm_webentity_lruprefix(old_WE.id, lru_prefix, corpus=corpus)
                if is_error(res):
                    returnD(res)
            clean_lrus.append(lru_prefix)
        res = yield self.update_webentity(webentity_id, "LRUSet", clean_lrus, "push", corpus=corpus)
        yield self.add_backend_tags(webentity_id, "lruprefixes_modified", "added %s" % ' & '.join(lru_prefixes), corpus=corpus)
        self.corpora[corpus]['recent_changes'] += 1
        returnD(res)

    @inlineCallbacks
    def jsonrpc_rm_webentity_lruprefix(self, webentity_id, lru_prefix, corpus=DEFAULT_CORPUS):
        """Removes for a `corpus` a `lru_prefix` from the list of prefixes of a WebEntity defined by `webentity_id. Will delete the WebEntity if it ends up with no LRU prefix left."""
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
        """Adds for a `corpus` a list of `lru_prefixes` to a WebEntity defined by `webentity_id`."""
        try:
            startpage_url, _ = urllru.url_clean_and_convert(startpage_url)
        except ValueError as e:
            returnD(format_error(e))
        yield self.add_backend_tags(webentity_id, "startpages_modified", "added %s" % startpage_url, corpus=corpus)
        res = yield self.update_webentity(webentity_id, "startpages", startpage_url, "push", corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_rm_webentity_startpage(self, webentity_id, startpage_url, corpus=DEFAULT_CORPUS):
        """Removes for a `corpus` a `startpage_url` from the list of startpages of a WebEntity defined by `webentity_id."""
        try:
            startpage_url, _ = urllru.url_clean_and_convert(startpage_url)
        except ValueError as e:
            returnD(format_error(e))
        yield self.add_backend_tags(webentity_id, "startpages_modified", "removed %s" % startpage_url, corpus=corpus)
        res = yield self.update_webentity(webentity_id, "startpages", startpage_url, "pop", corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_merge_webentity_into_another(self, old_webentity_id, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False, corpus=DEFAULT_CORPUS):
        """Assembles for a `corpus` 2 WebEntities by deleting WebEntity defined by `old_webentity_id` and adding all of its LRU prefixes to the one defined by `good_webentity_id`. Optionally set `include_tags` and/or `include_home_and_startpages_as_startpages` to "true" to also add the tags and/or startpages to the merged resulting WebEntity."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        old_WE = yield self.msclients.pool.getWebEntity(old_webentity_id, corpus=corpus)
        if is_error(old_WE):
            returnD(format_error('ERROR retrieving WebEntity with id %s' % old_webentity_id))
        yield self.add_backend_tags(good_webentity_id, "alias_added", old_WE.name)
        new_WE = yield self.msclients.pool.getWebEntity(good_webentity_id, corpus=corpus)
        if is_error(new_WE):
            returnD(format_error('ERROR retrieving WebEntity with id %s' % good_webentity_id))
        for lru in old_WE.LRUSet:
            new_WE.LRUSet.add(lru)
        if test_bool_arg(include_home_and_startpages_as_startpages):
            if old_WE.homepage:
                new_WE.homepage = old_WE.homepage
            for page in old_WE.startpages:
                new_WE.startpages.add(page)
        if test_bool_arg(include_tags):
            for tag_namespace in old_WE.metadataItems.keys():
                if tag_namespace not in new_WE.metadataItems:
                    new_WE.metadataItems[tag_namespace] = {}
                for tag_key in old_WE.metadataItems[tag_namespace].keys():
                    if tag_key not in new_WE.metadataItems[tag_namespace]:
                        new_WE.metadataItems[tag_namespace][tag_key] = []
                    for tag_val in old_WE.metadataItems[tag_namespace][tag_key]:
                        if tag_val not in new_WE.metadataItems[tag_namespace][tag_key]:
                            new_WE.metadataItems[tag_namespace][tag_key].append(tag_val)
        res = self.msclients.sync.deleteWebEntity(old_WE, corpus=corpus)
        if is_error(res):
            returnD(res)
        yield self.db.update_jobs(corpus, {'webentity_id': old_WE.id}, {'webentity_id': new_WE.id, 'previous_webentity_id': old_WE.id, 'previous_webentity_name': old_WE.name})
        res = self.msclients.sync.updateWebEntity(new_WE, corpus=corpus)
        if is_error(res):
            returnD(res)
        self.corpora[corpus]['total_webentities'] -= 1
        self.corpora[corpus]['recent_changes'] += 1
        returnD(format_result("Merged %s into %s" % (old_webentity_id, good_webentity_id)))

    def jsonrpc_merge_webentities_into_another(self, old_webentity_ids, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False, corpus=DEFAULT_CORPUS):
        """Assembles for a `corpus` a bunch of WebEntities by deleting WebEntities defined by a list of `old_webentity_ids` and adding all of their LRU prefixes to the one defined by `good_webentity_id`. Optionally set `include_tags` and/or `include_home_and_startpages_as_startpages` to "true" to also add the tags and/or startpages to the merged resulting WebEntity."""
        return self.batch_webentities_edit("merge_webentity_into_another", old_webentity_ids, corpus, good_webentity_id, include_tags=include_tags, include_home_and_startpages_as_startpages=include_home_and_startpages_as_startpages, async=False)

    @inlineCallbacks
    def jsonrpc_delete_webentity(self, webentity_id, corpus=DEFAULT_CORPUS):
        """Removes from a `corpus` a WebEntity defined by `webentity_id` (mainly for advanced debug use)."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        WE = self.msclients.sync.getWebEntity(webentity_id, corpus=corpus)
        if is_error(WE):
            returnD(format_error('ERROR retrieving WebEntity with id %s' % old_webentity_id))
        res = self.msclients.sync.deleteWebEntity(WE, corpus=corpus)
        if is_error(res):
            returnD(res)
        yield self.db.update_jobs(corpus, {'webentity_id': WE.id}, {'webentity_id': None, 'previous_webentity_id': WE.id, 'previous_webentity_name': WE.name})
        self.corpora[corpus]['total_webentities'] -= 1
        self.corpora[corpus]['recent_changes'] += 1
        returnD(format_result("WebEntity %s (%s) was removed" % (webentity_id, WE.name)))

    @inlineCallbacks
    def index_batch(self, page_items, job, corpus=DEFAULT_CORPUS):
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
        tot_crawled_pages = yield self.db.count_pages(corpus, job['crawljob_id'])
        yield self.db.update_jobs(corpus, job['_id'], {'nb_crawled_pages': tot_crawled_pages, 'indexing_status': indexing_statuses.BATCH_FINISHED}, inc={'nb_pages': nb_pages, 'nb_links': nb_links})
        yield self.db.add_log(corpus, job['_id'], "INDEX_"+indexing_statuses.BATCH_FINISHED)
        returnD(True)

    def rank_webentities(self, corpus=DEFAULT_CORPUS):
        ranks = {}
        for link in self.corpora[corpus]['webentities_links']:
            if link.targetId not in ranks:
                ranks[link.targetId] = 0
            ranks[link.targetId] += 1
        self.corpora[corpus]['webentities_ranks'] = ranks

    @inlineCallbacks
    def index_batch_loop(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus) or self.corpora[corpus]['loop_running']:
            returnD(False)
        if self.corpora[corpus]['reset']:
            yield self.db.queue(corpus).drop(safe=True)
            self.msclients.sync.clearIndex(corpus=corpus)
            returnD(None)
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
            job = yield self.db.list_jobs(corpus, {'crawljob_id': oldest_page_in_queue['_job'], 'crawling_status': {'$ne': crawling_statuses.PENDING}, 'indexing_status': {'$ne': indexing_statuses.BATCH_RUNNING}}, fields=['_id', 'crawljob_id'], limit=1)
            if not job:
                self.corpora[corpus]['loop_running'] = None
                returnD(False)
            logger.msg("Indexing pages from job %s" % job['_id'], system="INFO - %s" % corpus)
            page_items = yield self.db.get_queue(corpus, {'_job': job['crawljob_id']}, limit=config['memoryStructure']['max_simul_pages_indexing'])
            if page_items:
                yield self.db.update_jobs(corpus, job['_id'], {'indexing_status': indexing_statuses.BATCH_RUNNING})
                yield self.db.add_log(corpus, job['_id'], "INDEX_"+indexing_statuses.BATCH_RUNNING)
                self.corpora[corpus]['loop_running_since'] = now_ts()
                res = yield self.index_batch(page_items, job, corpus=corpus)
                if is_error(res):
                    logger.msg(res['message'], system="ERROR - %s" % corpus)
                    self.corpora[corpus]['loop_running'] = None
                    returnD(False)
                self.corpora[corpus]['recent_changes'] += 5 * len(page_items)/float(config['memoryStructure']['max_simul_pages_indexing'])
            else:
                logger.msg("job %s found for index but no page corresponding found in queue." % job['_id'], system="WARNING - %s" % corpus)
            self.corpora[corpus]['last_index_loop'] = now_ts()
        # Run linking WebEntities on a regular basis when needed and not overloaded
        s = time.time()
        max_linking_pause = min(self.corpora[corpus]['links_duration'], max(5, self.corpora[corpus]['links_duration'] * self.corpora[corpus]['pages_queued'] / config['memoryStructure']['max_simul_pages_indexing'] / 50))
        if self.corpora[corpus]['recent_changes'] >= 100 or (self.corpora[corpus]['recent_changes'] and (self.corpora[corpus]['last_links_loop'] + max_linking_pause < s or not self.corpora[corpus]['pages_queued'])):
            self.msclients.corpora[corpus].loop_running = True
            self.corpora[corpus]['loop_running'] = "Computing links between WebEntities"
            self.corpora[corpus]['loop_running_since'] = now_ts()
            yield self.db.add_log(corpus, "WE_LINKS", "Starting WebEntity links generation...")
            res = yield self.msclients.loop.updateWebEntityLinks(self.corpora[corpus]['last_links_loop'], corpus=corpus)
            if is_error(res):
                logger.msg(res['message'], system="ERROR - %s" % corpus)
                self.corpora[corpus]['loop_running'] = None
                returnD(None)
            self.corpora[corpus]['last_links_loop'] = res
            self.corpora[corpus]['links_duration'] = max(3 * (time.time() - s), self.corpora[corpus]['links_duration'])
            yield self.db.add_log(corpus, "WE_LINKS", "...finished WebEntity links generation (%ss)" % (time.time() - s))
            res = yield self.msclients.loop.getWebEntityLinks(corpus=corpus)
            if is_error(res):
                logger.msg(res['message'], system="ERROR - %s" % corpus)
                self.corpora[corpus]['loop_running'] = None
                returnD(None)
            self.msclients.corpora[corpus].loop_running = False
            self.corpora[corpus]['webentities_links'] = res
            deferToThread(self.rank_webentities, corpus)
            self.corpora[corpus]['recent_changes'] = 0
            logger.msg("...processed new WebEntity links in %ss." % (time.time() - s), system="INFO - %s" % corpus)
        if self.corpora[corpus]['reset']:
            res = self.msclients.sync.clearIndex(corpus=corpus)
        self.corpora[corpus]['loop_running'] = None

    @inlineCallbacks
    def handle_index_error(self, corpus=DEFAULT_CORPUS):
        # clean possible previous index crashes
        res = yield self.db.list_jobs(corpus, {'indexing_status': indexing_statuses.BATCH_CRASHED}, fields=['_id'])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'indexing_status': indexing_statuses.PENDING})
            yield self.db.add_log(corpus, update_ids, "INDEX_"+indexing_statuses.PENDING)

  # RETRIEVE & SEARCH WEBENTITIES

    @inlineCallbacks
    def ramcache_webentities(self, corelinks=False, corpus=DEFAULT_CORPUS):
        WEs = self.corpora[corpus]['webentities']
        deflist = []
        also_links = test_bool_arg(corelinks)
        if WEs == [] or self.corpora[corpus]['recent_changes'] or (self.corpora[corpus]['last_links_loop'])*1000 > self.corpora[corpus]['last_WE_update']:
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
            deferToThread(self.rank_webentities, corpus)
            self.corpora[corpus]['loop_running'] = False
            logger.msg("...ramcached.", system="INFO - %s" % corpus)
        returnD(WEs)

    def jsonrpc_get_webentity(self, webentity_id, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a WebEntity defined by its `webentity_id`."""
        return self.jsonrpc_get_webentities([webentity_id], corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentity_by_lruprefix(self, lru_prefix, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the WebEntity having `lru_prefix` as one of its LRU prefixes."""
        try:
            lru_prefix = urllru.lru_clean(lru_prefix)
        except ValueError as e:
            returnD(format_error(e))
        WE = yield self.msclients.pool.getWebEntityByLRUPrefix(lru_prefix, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        if WE.name == ms_const.DEFAULT_WEBENTITY:
            returnD(format_error("No matching WebEntity found for lruprefix %s" % lru_prefix))
        job = yield self.db.list_jobs(corpus, {'webentity_id': WE.id}, fields=['crawling_status', 'indexing_status'], filter=sortdesc('created_at'), limit=1)
        returnD(format_result(self.format_webentity(WE, job, corpus=corpus)))

    def jsonrpc_get_webentity_by_lruprefix_as_url(self, url, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the WebEntity having one of its LRU prefixes corresponding to the LRU fiven under the form of a `url`."""
        try:
            _, lru = urllru.url_clean_and_convert(url)
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_get_webentity_by_lruprefix(lru, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentity_for_url(self, url, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the WebEntity to which a `url` belongs (meaning starting with one of the WebEntity's prefix and not another)."""
        try:
            _, lru = urllru.url_clean_and_convert(url)
        except ValueError as e:
            returnD(format_error(e))
        res = yield self.jsonrpc_get_webentity_for_url_as_lru(lru, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentity_for_url_as_lru(self, lru, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the WebEntity to which a url given under the form of a `lru` belongs (meaning starting with one of the WebEntity's prefix and not another)."""
        try:
            url, lru = urllru.lru_clean_and_convert(lru)
        except ValueError as e:
            returnD(format_error(e))
        WE = yield self.msclients.pool.findWebEntityMatchingLRUPrefix(lru, corpus=corpus)
        if is_error(WE):
            returnD(WE)
        if WE.name == ms_const.DEFAULT_WEBENTITY:
            returnD(format_error("No matching WebEntity found for url %s" % url))
        job = yield self.db.list_jobs(corpus, {'webentity_id': WE.id}, fields=['crawling_status', 'indexing_status'], filter=sortdesc('created_at'), limit=1)
        returnD(format_result(self.format_webentity(WE, job, corpus=corpus)))

    @inlineCallbacks
    def format_WE_page(self, total, count, page, WEs, token=None, corpus=DEFAULT_CORPUS):
        jobs = {}
        res = yield self.db.list_jobs(corpus, {'webentity_id': {'$in': [WE["id"] for WE in WEs]}}, fields=['webentity_id', 'crawling_status', 'indexing_status'])
        for job in res:
            jobs[job['webentity_id']] = job
        for WE in WEs:
            if WE["id"] in jobs:
                WE['crawling_status'] = jobs[WE["id"]]['crawling_status']
                WE['indexing_status'] = jobs[WE["id"]]['indexing_status']
            else:
                WE['crawling_status'] = crawling_statuses.UNCRAWLED
                WE['indexing_status'] = indexing_statuses.UNINDEXED

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
        returnD(format_result(res))

    @inlineCallbacks
    def paginate_webentities(self, WEs, count, page, light=False, semilight=False, sort=None, corpus=DEFAULT_CORPUS):
        subset = WEs[page*count:(page+1)*count]
        ids = [w["id"] for w in WEs]
        res = yield self.format_WE_page(len(ids), count, page, subset, corpus=corpus)
        query_args = {
          "count": count,
          "light": light,
          "semilight": semilight,
          "sort": sort
        }
        res["result"]["token"] = yield self.db.save_WEs_query(corpus, ids, query_args)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentities(self, list_ids=None, sort=None, count=100, page=0, light=False, semilight=False, light_for_csv=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all existing WebEntities or only the WebEntities whose id is among `list_ids.\nResults will be paginated with a total number of returned results of `count` and `page` the number of the desired page of results. Results will include metadata on the request including the total number of results and a `token` to be reused to collect the other pages via `get_webentities_page`.\nOther possible options include:\n- order the results with `sort` by inputting a field or list of fields as named in the WebEntities returned objects; optionally prefix a sort field with a "-" to revert the sorting on it; for instance: `["-indegree"\, "name"]` will order by maximum indegree first then by alphabetic order of names\n- set `light` or `semilight` or `light_for_csv` to "true" to collect lighter data with less WebEntities fields."""
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
            respage = yield self.format_WE_page(len(res), count, page, res, corpus=corpus)
            returnD(respage)

    @inlineCallbacks
    def jsonrpc_advanced_search_webentities(self, allFieldsKeywords=[], fieldKeywords=[], sort=None, count=100, page=0, autoescape_query=True, light=False, semilight=True, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities matching a specific search using the `allFieldsKeywords` and `fieldKeywords` arguments. Searched keywords will automatically be escaped: set `autoescape_query` to "false" to allow input of special Lucene queries.\nResults will be paginated with a total number of returned results of `count` and `page` the number of the desired page of results. Results will include metadata on the request including the total number of results and a `token` to be reused to collect the other pages via `get_webentities_page`.\n- `allFieldsKeywords` should be a string or list of strings to search in all textual fields of the WebEntities ("name"/"status"/"lruset"/"startpages"/...). For instance `["hyphe"\, "www"]`\n- `fieldKeywords` should be a list of 2-elements arrays giving first the field to search into then the searched value or optionally for the field "indegree" an array of a minimum and maximum values to search into. For instance: `[["name"\, "hyphe"]\, ["indegree"\, [3\, 1000]]]`\n- see description of `sort` `light` and `semilight` in `get_webentities` above."""
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
            if autoescape_query:
                k = self.escape_search_query(k)
            afk.append(k.encode('utf-8'))
        for kv in fieldKeywords:
            if type(kv) is list and len(kv) == 2 and kv[0] and kv[1] and type(kv[0]) in [str, unicode] and type(kv[1]) in [str, unicode]:
                if autoescape_query:
                    kv[1] = self.escape_search_query(kv[1])
                fk.append([kv[0].encode('utf-8'), kv[1].encode('utf-8')])
            elif type(kv) is list and len(kv) == 2 and kv[0] and kv[1] and type(kv[0]) in [str, unicode] and type(kv[1]) is list and len(kv[1]) == 2 and type(kv[1][0]) in [int, float] and type(kv[1][1]) in [int, float]:
                indegree_filter = kv[1]
            else:
                returnD(format_error('ERROR: fieldKeywords must be a list of two-string-elements lists or ["indegree", [min_int, max_int]]. %s' % fieldKeywords))
        WEs = yield self.msclients.pool.searchWebEntities(afk, fk, corpus=corpus)
        if is_error(WEs):
            returnD(WEs)
        res = yield self.format_webentities(WEs, sort=sort, light=light, semilight=semilight, corpus=corpus)
        if indegree_filter:
            res = [w for w in res if w["indegree"] >= indegree_filter[0] and w["indegree"] <= indegree_filter[1]]
        res = yield self.paginate_webentities(res, count, page, sort=sort, corpus=corpus)
        returnD(res)

    def escape_search_query(self, query, corpus=DEFAULT_CORPUS):
        for char in ["\\", "+", "-", "!", "(", ")", ":", "^", "[", "]", "{", "}", "~", "*", "?"]:
            query = query.replace(char, "\\%s" % char)
        return query.replace(' ', '?')

    def _optional_field_search(self, query, field=None, sort=None, count=100, page=0, light=False, semilight=False, corpus=DEFAULT_CORPUS):
        if field:
            if not isinstance(field, unicode):
                field = unicode(field)
            return self.jsonrpc_advanced_search_webentities([], [[field, query]], sort=sort, count=count, page=page, autoescape_query=False, light=light, semilight=semilight, corpus=corpus)
        return self.jsonrpc_advanced_search_webentities([query], sort=sort, count=count, page=page, autoescape_query=False, light=light, semilight=semilight, corpus=corpus)

    def jsonrpc_exact_search_webentities(self, query, field=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having one textual field or optional specific `field` exactly equal to the value given as `query`. Searched query will automatically be escaped of Lucene special characters.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `advanced_search_webentities` for explanations on `sort` `count` and `page`."""
        query = self.escape_search_query(query)
        return self._optional_field_search(query, field, sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_prefixed_search_webentities(self, query, field=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having one textual field or optional specific `field` beginning with the value given as `query`. Searched query will automatically be escaped of Lucene special characters.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `advanced_search_webentities` for explanations on `sort` `count` and `page`."""
        query = "%s*" % self.escape_search_query(query)
        return self._optional_field_search(query, field, sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_postfixed_search_webentities(self, query, field=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having one textual field or optional specific `field` finishing with the value given as `query`. Searched query will automatically be escaped of Lucene special characters.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `advanced_search_webentities` for explanations on `sort` `count` and `page`."""
        query = "*%s" % self.escape_search_query(query)
        return self._optional_field_search(query, field, sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_free_search_webentities(self, query, field=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having one textual field or optional specific `field` containing the value given as `query`. Searched query will automatically be escaped of Lucene special characters.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `advanced_search_webentities` for explanations on `sort` `count` and `page`."""
        query = "*%s*" % self.escape_search_query(query)
        return self._optional_field_search(query, field, sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_status(self, status, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having their status equal to `status` (one of "in"/"out"/"undecided"/"discovered").\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `advanced_search_webentities` for explanations on `sort` `count` and `page`."""
        status = status.lower()
        valid_statuses = [s.lower() for s in ms.WebEntityStatus._NAMES_TO_VALUES]
        if status not in valid_statuses:
            return format_error("ERROR: status argument must be one of %s" % ",".join(valid_statuses))
        return self.jsonrpc_exact_search_webentities(status, 'STATUS', sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_name(self, name, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having their name equal to `name`.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `advanced_search_webentities` for explanations on `sort` `count` and `page`."""
        return self.jsonrpc_exact_search_webentities(name, 'NAME', sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_tag_value(self, value, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having at least one tag in any namespace/category equal to `value`.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `advanced_search_webentities` for explanations on `sort` `count` and `page`."""
        return self.jsonrpc_exact_search_webentities(value, 'TAG_VALUE', sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_tag_category(self, category, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having at least one tag in a specific `category`.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `advanced_search_webentities` for explanations on `sort` `count` and `page`."""
        return self.jsonrpc_exact_search_webentities(category, 'TAG_CATEGORY', sort=sort, count=count, page=page, corpus=corpus)

    def jsonrpc_get_webentities_by_user_tag(self, category, value, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having at least one tag in any category of the namespace "USER" equal to `value`.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `advanced_search_webentities` for explanations on `sort` `count` and `page`."""
        return self.jsonrpc_exact_search_webentities("USER:%s=%s" % (category, value), 'TAG', sort=sort, count=count, page=page, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentities_page(self, pagination_token, n_page, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the page number `n_page` of WebEntities corresponding to the results of a previous query ran using any of the `get_webentities` or `search_webentities` methods using the returned `pagination_token`."""
        try:
            page = int(n_page)
        except:
            returnD(format_error("page argument must be an integer"))
        ids = yield self.db.get_WEs_query(corpus, pagination_token)
        if not ids:
            returnD(format_error("No previous query found for token %s on corpus %s" % (pagination_token, corpus)))
        count = ids["query"]["count"]
        query_ids = ids["webentities"][page*count:(page+1)*count]
        if not query_ids:
            res = yield self.format_WE_page(ids["total"], ids["query"]["count"], page, [], token=pagination_token, corpus=corpus)
            returnD(res)
        res = yield self.jsonrpc_get_webentities(query_ids, sort=ids["query"]["sort"], count=ids["query"]["count"], light=ids["query"]["light"], semilight=ids["query"]["semilight"], corpus=corpus)

        if is_error(res):
            returnD(res)
        respage = yield self.format_WE_page(ids["total"], ids["query"]["count"], page, res["result"], token=pagination_token, corpus=corpus)
        returnD(respage)

    @inlineCallbacks
    def jsonrpc_get_webentities_ranking_stats(self, pagination_token, corpus=DEFAULT_CORPUS, _ranking_field="indegree"):
        """Returns for a `corpus` histogram data on the indegrees of all WebEntities matching a previous query ran using any of the `get_webentities` or `search_webentities` methods using the return `pagination_token`."""
        ranking_fields = ["indegree"]
        ranking_field = _ranking_field.lower().strip()
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

  # TAGS

    def jsonrpc_add_webentity_tag_value(self, webentity_id, namespace, category, value, corpus=DEFAULT_CORPUS):
        """Adds for a `corpus` a tag `namespace:category=value` to a WebEntity defined by `webentity_id`."""
        return self.update_webentity(webentity_id, "metadataItems", value, "push", category, namespace, corpus=corpus)

    def jsonrpc_add_webentities_tag_value(self, webentity_ids, namespace, category, value, corpus=DEFAULT_CORPUS):
        """Adds for a `corpus` a tag `namespace:category=value` to a bunch of WebEntities defined by a list of `webentity_ids`."""
        return self.batch_webentities_edit("add_webentity_tag_value", webentity_ids, corpus, namespace, category, value)

    def jsonrpc_rm_webentity_tag_key(self, webentity_id, namespace, category, corpus=DEFAULT_CORPUS):
        """Removes for a `corpus` all tags within `namespace:category` associated with a WebEntity defined by `webentity_id` if it is set."""
        return self.jsonrpc_set_webentity_tag_values(webentity_id, namespace, category, [], corpus=corpus)

    def jsonrpc_rm_webentity_tag_value(self, webentity_id, namespace, category, value, corpus=DEFAULT_CORPUS):
        """Removes for a `corpus` a tag `namespace:category=value` associated with a WebEntity defined by `webentity_id` if it is set."""
        return self.update_webentity(webentity_id, "metadataItems", value, "pop", category, namespace, corpus=corpus)

    def jsonrpc_set_webentity_tag_values(self, webentity_id, namespace, category, values, corpus=DEFAULT_CORPUS):
        """Replaces for a `corpus` all existing tags of a WebEntity defined by `webentity_id` for a specific `namespace` and `category` by a list of `values` or a single tag."""
        if not isinstance(values, list):
            values = [values]
        return self.update_webentity(webentity_id, "metadataItems", values, "update", category, namespace, corpus=corpus)

    @inlineCallbacks
    def add_backend_tags(self, webentity_id, key, value, corpus=DEFAULT_CORPUS):
        yield self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", key, value, corpus=corpus)
        yield self.jsonrpc_add_webentity_tag_value(webentity_id, "CORE", "recrawl_needed", "true", corpus=corpus)

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
        """Returns for a `corpus` a tree of all existing tags of the webentities hierarchised by namespaces and categories."""
        tags = yield self.ramcache_tags(corpus)
        returnD(format_result(tags))

    @inlineCallbacks
    def jsonrpc_get_tag_namespaces(self, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a list of all existing namespaces of the webentities tags."""
        tags = yield self.ramcache_tags(corpus)
        returnD(format_result(tags.keys()))

    @inlineCallbacks
    def jsonrpc_get_tag_categories(self, namespace=None, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a list of all existing categories of the webentities tags. Optionally limits to a specific `namespace`."""
        tags = yield self.ramcache_tags(corpus)
        categories = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                categories |= set(tags[ns].keys())
        returnD(format_result(list(categories)))

    @inlineCallbacks
    def jsonrpc_get_tag_values(self, namespace=None, category=None, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a list of all existing values in the webentities tags. Optionally limits to a specific `namespace` and/or `category`."""
        tags = yield self.ramcache_tags(corpus)
        values = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                for cat in tags[ns].keys():
                    if not category or (cat == category):
                        values |= set(tags[ns][cat])
        returnD(format_result(list(values)))

  # PAGES, LINKS & NETWORKS

    @inlineCallbacks
    def jsonrpc_get_webentity_pages(self, webentity_id, onlyCrawled=True, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all indexed Pages fitting within the WebEntity defined by `webentity_id`. Optionally limits the results to Pages which were actually crawled setting `onlyCrawled` to "true"."""
        if onlyCrawled:
            pages = yield self.msclients.pool.getWebEntityCrawledPages(webentity_id, corpus=corpus)
        else:
            pages = yield self.msclients.pool.getWebEntityPages(webentity_id, corpus=corpus)
        if is_error(pages):
            returnD(pages)
        formatted_pages = [{'lru': p.lru, 'sources': list(p.sourceSet), 'crawl_timestamp': p.crawlerTimestamp, 'url': p.url, 'depth': p.depth, 'error': p.errorCode, 'http_status': p.httpStatusCode, 'is_node': p.isNode, 'is_full_precision': p.isFullPrecision, 'creation_date': p.creationDate, 'last_modification_date': p.lastModificationDate} for p in pages]
        returnD(format_result(formatted_pages))

    def jsonrpc_get_webentity_subwebentities(self, webentity_id, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all sub-webentities of a WebEntity defined by `webentity_id` (meaning webentities having at least one LRU prefix starting with one of the WebEntity's prefixes)."""
        return self.get_webentity_relative_webentities(webentity_id, "children", corpus=corpus)

    def jsonrpc_get_webentity_parentwebentities(self, webentity_id, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all parent-webentities of a WebEntity defined by `webentity_id` (meaning webentities having at least one LRU prefix starting like one of the WebEntity's prefixes)."""
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
    def jsonrpc_get_webentity_nodelinks_network(self, webentity_id=None, include_external_links=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the list of all internal NodeLinks of a WebEntity defined by `webentity_id`. Optionally add external NodeLinks (the frontier) by setting `include_external_links` to "true"."""
        s = time.time()
        logger.msg("Generating NodeLinks network for WebEntity %s..." % webentity_id, system="INFO - %s" % corpus)
        links = yield self.msclients.pool.getWebentityNodeLinks(webentity_id, test_bool_arg(include_external_links), corpus=corpus)
        if is_error(links):
            returnD(links)
        res = [[l.sourceLRU, l.targetLRU, l.weight] for l in links]
        logger.msg("...JSON network generated in %ss" % str(time.time()-s), system="INFO - %s" % corpus)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_webentities_network(self, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the list of all agregated weighted links between WebEntities."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        s = time.time()
        logger.msg("Generating WebEntities network...", system="INFO - %s" % corpus)
        if self.corpora[corpus]['webentities_links'] == None:
            links = yield self.msclients.loop.getWebEntityLinks(corpus=corpus)
            if is_error(links):
                logger.msg(links['message'], system="ERROR - %s" % corpus)
                returnD(False)
            self.corpora[corpus]['webentities_links'] = links
            deferToThread(self.rank_webentities, corpus)
        res = [[link.sourceId, link.targetId, link.weight] for link in self.corpora[corpus]['webentities_links']]
        logger.msg("...JSON network generated in %ss" % str(time.time()-s), system="INFO - %s" % corpus)
        returnD(handle_standard_results(res))

  # CREATION RULES

    @inlineCallbacks
    def ensureDefaultCreationRuleExists(self, corpus=DEFAULT_CORPUS, _quiet=False, _retry=True):
        res = yield self.parent.jsonrpc_ping(corpus, timeout=15)
        if is_error(res):
            logger.msg("Could not start corpus fast enough to create WE creation rule...", system="ERROR - %s" % corpus)
            returnD(res)
        rules = yield self.jsonrpc_get_webentity_creationrules(corpus=corpus)
        if self.msclients.test_corpus(corpus) and (is_error(rules) or len(rules['result']) == 0):
            if corpus != DEFAULT_CORPUS and not _quiet:
                logger.msg("Saves default WE creation rule", system="INFO - %s" % corpus)
            res = yield self.msclients.pool.addWebEntityCreationRule(ms.WebEntityCreationRule(creationrules.getPreset(self.corpora[corpus]["options"].get("default_creation_rule", "domain")), ''), corpus=corpus)
            if is_error(res):
                logger.msg("Error creating WE creation rule...", system="ERROR - %s" % corpus)
                if _retry:
                    logger.msg("Retrying WE creation rule creation...", system="ERROR - %s" % corpus)
                    returnD(ensureDefaultCreationRuleExists(corpus, _quiet=_quiet, _retry=False))
                returnD(res)
            actions = []
            for prf, regexp in config.get("creationRules", {}).items():
                for prefix in ["http://%s" % prf, "https://%s" % prf]:
                    lru = urllru.url_to_lru_clean(prefix)
                    actions.append(self.jsonrpc_add_webentity_creationrule(lru, creationrules.getPreset(regexp, lru), corpus=corpus))
            results = yield DeferredList(actions, consumeErrors=True)
            for bl, res in results:
                if not bl:
                    returnD(res)
            returnD(format_result('Default creation rule created'))
        returnD(format_result('Default creation rule was already created'))

    @inlineCallbacks
    def jsonrpc_get_webentity_creationrules(self, lru_prefix=None, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all existing WebEntityCreationRules or only one set for a specific `lru_prefix`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        rules = yield self.msclients.pool.getWebEntityCreationRules(corpus=corpus)
        if is_error(rules):
            returnD(format_error(rules))
        results = [{"prefix": r.LRU, "regexp": r.regExp, "name": creationrules.getName(r.regExp, r.LRU)} for r in rules if not lru_prefix or r.LRU == lru_prefix]
        if lru_prefix:
            if results:
                results = results[0]
            else:
                results = None
        else:
            self.corpora[corpus]["creation_rules"] = results
        returnD(format_result(results))

    @inlineCallbacks
    def jsonrpc_delete_webentity_creationrule(self, lru_prefix, corpus=DEFAULT_CORPUS):
        """Removes from a `corpus` an existing WebEntityCreationRule set for a specific `lru_prefix`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        rules = yield self.msclients.pool.getWebEntityCreationRules(corpus=corpus)
        for wecr in rules:
            if lru_prefix == wecr.LRU:
                res = yield self.msclients.pool.removeWebEntityCreationRule(wecr, corpus=corpus)
                if is_error(res):
                    returnD(format_error(res))
                returnD(format_result('WebEntityCreationRule for prefix %s deleted.' % lru_prefix))
        self.jsonrpc_get_webentity_creationrules(corpus=corpus)
        returnD(format_error("No existing WebEntityCreationRule found for prefix %s." % lru_prefix))

    @inlineCallbacks
    def jsonrpc_add_webentity_creationrule(self, lru_prefix, regexp, apply_to_existing_pages=False, corpus=DEFAULT_CORPUS):
        """Adds to a `corpus` a new WebEntityCreationRule set for a `lru_prefix` to a specific `regexp` or one of "subdomain"/"subdomain-N"/"domain"/"path-N"/"prefix+N"/"page" N being an integer. Optionally set `apply_to_existing_pages` to "true" to apply it immediately to past crawls."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        try:
            _, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
        except ValueError as e:
            returnD(format_error(e))
        regexp = creationrules.getPreset(regexp, lru_prefix)
        res = yield self.msclients.pool.addWebEntityCreationRule(ms.WebEntityCreationRule(regexp, lru_prefix), corpus=corpus)
        if is_error(res):
            returnD(format_error("Could not save CreationRule %s for prefix %s: %s" % (regexp, prefix, res)))
        self.jsonrpc_get_webentity_creationrules(corpus=corpus)
        if apply_to_existing_pages:
            news = yield self.msclients.pool.reindexPageItemsMatchingLRUPrefix(lru_prefix, corpus=corpus)
            res = yield self.jsonrpc_get_lru_definedprefixes(lru_prefix, corpus=corpus)
            if not is_error(res):
                for we in res["result"]:
                    yield self.jsonrpc_add_webentity_tag_value(we["id"], "CORE", "recrawl_needed", "true", corpus=corpus)
            self.corpora[corpus]['recent_changes'] += 1
            returnD(format_result("Webentity creation rule added and applied: %s new webentities created" % news))
        returnD(format_result("Webentity creation rule added"))

    @inlineCallbacks
    def jsonrpc_simulate_creationrules_for_urls(self, pageURLs, corpus=DEFAULT_CORPUS):
        """Returns an object giving for each URL of `pageURLs` (single string or array) the prefix of the theoretical WebEntity the URL would be attached to within a `corpus` following its specific WebEntityCreationRules."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if isinstance(pageURLs, list):
            results = yield DeferredList([self.jsonrpc_simulate_creationrules_for_urls(pageURL, corpus) for pageURL in pageURLs], consumeErrors=True)
            res = {}
            errors = []
            for bl, val in results:
                if not bl:
                    errors.append(val)
                elif is_error(val):
                    errors.append(val["message"])
                else:
                    res.update(val["result"])
            if len(errors):
                returnD({'code': 'fail', 'message': '%d webentities failed, see details in "errors" field and successes in "results" field.' % len(errors), 'errors': errors, 'results': res})
            returnD(format_result(res))
        url = pageURLs
        try:
            _, pageLRU = urllru.url_clean_and_convert(url)
        except ValueError as e:
            returnD(format_error(e))
        res = yield self.jsonrpc_simulate_creationrules_for_lrus(pageLRU, corpus)
        if is_error(res):
            returnD(res)
        returnD(format_result({url: res['result'].values()[0]}))

    @inlineCallbacks
    def jsonrpc_simulate_creationrules_for_lrus(self, pageLRUs, corpus=DEFAULT_CORPUS):
        """Returns an object giving for each LRU of `pageLRUs` (single string or array) the prefix of the theoretical WebEntity the LRU would be attached to within a `corpus` following its specific WebEntityCreationRules."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if isinstance(pageLRUs, list):
            results = yield DeferredList([self.jsonrpc_simulate_creationrules_for_lrus(pageLRU, corpus) for pageLRU in pageLRUs], consumeErrors=True)
            res = {}
            errors = []
            for bl, val in results:
                if not bl:
                    errors.append(val)
                elif is_error(val):
                    errors.append(val["message"])
                else:
                    res.update(val["result"])
            if len(errors):
                returnD({'code': 'fail', 'message': '%d webentities failed, see details in "errors" field and successes in "results" field.' % len(errors), 'errors': errors, 'results': res})
            returnD(format_result(res))
        pageLRU = pageLRUs
        try:
            _, lru = urllru.lru_clean_and_convert(pageLRU)
        except ValueError as e:
            returnD(format_error(e))
        prefix = yield self.msclients.pool.getPrefixForLRU(lru, corpus=corpus)
        if is_error(prefix):
            returnD(prefix)
        returnD(format_result({pageLRU: prefix}))

  # PRECISION EXCEPTIONS

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

    def jsonrpc_get_precision_exceptions(self, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the list of all existing PrecisionExceptions."""
        exceptions = self.msclients.sync.getPrecisionExceptions(corpus=corpus)
        if is_error(exceptions):
            return exceptions
        self.corpora[corpus]['precision_exceptions'] = exceptions
        return format_result(exceptions)

    def jsonrpc_delete_precision_exceptions(self, list_lru_exceptions, corpus=DEFAULT_CORPUS):
        """Removes from a `corpus` a set of existing PrecisionExceptions listed as `list_lru_exceptions`."""
        res = self.msclients.sync.removePrecisionExceptions(list_lru_exceptions, corpus=corpus)
        if is_error(res):
            return res
        for e in list_lru_exceptions:
            self.corpora[corpus]['precision_exceptions'].remove(e)
        return format_result("Precision Exceptions %s removed." % list_lru_exceptions)

    def jsonrpc_add_precision_exception(self, lru_prefix, corpus=DEFAULT_CORPUS):
        """Adds to a `corpus` a new PrecisionException for `lru_prefix`."""
        return self.handle_lru_precision_exceptions(lru_prefix, corpus)

  # VARIOUS

    def jsonrpc_trigger_links_reset(self, corpus=DEFAULT_CORPUS):
        """Will initiate a whole reset and regeneration of all WebEntityLinks of a `corpus`. Can take a while."""
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        self.corpora[corpus]['recent_changes'] += 1
        self.corpora[corpus]['last_links_loop'] = 0
        return format_result("Links global re-generation should start soon")

    @inlineCallbacks
    def save_webentities_stats(self, corpus=DEFAULT_CORPUS):
        yield self.db.save_stats(corpus, self.corpora[corpus])

    @inlineCallbacks
    def jsonrpc_get_webentities_stats(self, corpus=DEFAULT_CORPUS):
        """Returns for a corpus a set of statistics on the WebEntities status repartition of a `corpus` each 5 minutes."""
        res = yield self.db.get_stats(corpus)
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
    d = cor.jsonrpc_start_corpus(corpus, _quiet=True, _noloop=True, _create_if_missing=True)
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
    d = cor.jsonrpc_destroy_corpus(corpus, _quiet=True)
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
    reactor.callLater(15, core.activate_monocorpus)

# JSON-RPC interface
core.putSubHandler('crawl', core.crawler)
core.putSubHandler('store', core.store)
core.putSubHandler('system', Introspection(core))
site = server.Site(core)

# Run as 'python core.tac' ...
if __name__ == '__main__':
    reactor.listenTCP(config['twisted.port'], site)
    reactor.run()
# ... or in the background when called with 'twistd -noy core.tac'
elif __name__ == '__builtin__':
    application = Application("Hyphe backend API Server")
    server = TCPServer(config['twisted.port'], site)
    server.setServiceParent(application)
