#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, time
import subprocess
import base64
import msgpack
from copy import deepcopy
from ural import is_url
from bson.binary import Binary
from json import dump as jsondump
from random import randint
from datetime import datetime
from collections import defaultdict
from twisted.internet import reactor
from twisted.python import log as logger
from twisted.python.logfile import LogFile
from twisted.web import server
from twisted.application.internet import TCPServer
from twisted.application.service import Application
from twisted.internet.task import LoopingCall
from twisted.internet.defer import DeferredList, inlineCallbacks, returnValue as returnD
from twisted.internet.error import DNSLookupError, ConnectionRefusedError
from twisted.web.http_headers import Headers
from twisted.web.client import Agent, ProxyAgent, HTTPClientFactory, _HTTP11ClientFactory
HTTPClientFactory.noisy = False
_HTTP11ClientFactory.noisy = False
from twisted.internet.endpoints import TCP4ClientEndpoint
from hyphe_backend.traph.client import TraphFactory
from hyphe_backend.lib import urllru
from hyphe_backend.lib.utils import *
from hyphe_backend.lib.config_hci import test_and_make_dir, check_conf_sanity, clean_missing_corpus_options, CORPUS_CONF_SCHEMA, DEFAULT_CORPUS, TEST_CORPUS
from hyphe_backend.lib.creationrules import getPreset as getWECR
from hyphe_backend.lib.webarchives import ARCHIVES_OPTIONS
from hyphe_backend.lib.user_agents import get_random_user_agent
from hyphe_backend.lib.tlds import collect_tlds
from hyphe_backend.lib.jobsqueue import JobsQueue
from hyphe_backend.lib.mongo import MongoDB, sortasc, sortdesc
from hyphe_backend.lib.jsonrpc_custom import customJSONRPC
from txjsonrpc.jsonrpc import Introspection

INCLUDE_LINKS_FROM_OUT = False
INCLUDE_LINKS_FROM_DISCOVERED = False
WEBENTITIES_STATUSES = ["IN", "OUT", "UNDECIDED", "DISCOVERED"]

# MAIN CORE API

class Core(customJSONRPC):

    addSlash = True

    def __init__(self):
        customJSONRPC.__init__(self, config['OPEN_CORS_API'], config['DEBUG'])
        self.db = MongoDB(config['mongo-scrapy'])
        self.traphs = TraphFactory(data_dir=config["traph"]["data_path"])
        self.corpora = {}
        self.existing_corpora = set([])
        self.destroying = {}
        self.crawler = Crawler(self)
        self.store = Memory_Structure(self)
        reactor.callLater(0, self.jsonrpc_list_corpus)
        reactor.addSystemEventTrigger('before', 'shutdown', self.close)

    @inlineCallbacks
    def close(self):
        yield DeferredList([self.jsonrpc_stop_corpus(corpus, _quiet=True) for corpus in self.corpora.keys()], consumeErrors=True)
        yield self.traphs.stop()
        yield self.db.close()

  # CORPUS HANDLING

    def jsonrpc_test_corpus(self, corpus=DEFAULT_CORPUS, _msg=None):
        """Returns the current status of a `corpus`: "ready"/"starting"/"missing"/"stopped"/"error"."""
        res = {
          "corpus_id": corpus,
          "ready": False,
          "status": self.traphs.status_corpus(corpus, simplify=True),
        }
        if corpus not in self.existing_corpora:
            res["status"] = "missing"
            res["message"] = "Corpus does not exist"
        if res["status"] == "ready":
            res["ready"] = True
        elif res["status"] == "error":
            res["message"] = self.traphs.corpora[corpus].error
        elif res["status"] == "stopped":
            res["message"] = "Corpus is not started"
        if res["status"] == "starting":
            res["message"] = "Corpus is starting, please retry in a bit"
        elif _msg:
            res["message"] = _msg
        return format_result(res)

    @inlineCallbacks
    def jsonrpc_list_corpus(self, light=True):
        """Returns the list of all existing corpora with metas."""
        fields = [
          "name", "password",
          "total_crawls", "total_pages", "total_pages_crawled", "total_webentities",
          "webentities_in", "webentities_out", "webentities_undecided", "webentities_discovered",
          "created_at", "last_activity"
        ]
        if not light:
            fields += ["crawls_pending", "crawls_running", "total_pages_queued", "last_index_loop", "last_links_loop", "links_duration", "options"]
        res = {}
        corpora = yield self.db.list_corpus(projection=fields)
        for corpus in corpora:
            corpus["password"] = (corpus["password"] != "")
            corpus.update(self.jsonrpc_test_corpus(corpus.pop('_id'))["result"])
            res[corpus["corpus_id"]] = corpus
            self.existing_corpora.add(corpus["corpus_id"])
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
            check_conf_sanity(options, CORPUS_CONF_SCHEMA, name="%s options" % corpus, soft=True, globalconf=config)
        except Exception as e:
            returnD(format_error(e))
        if "max_depth" in options and options["max_depth"] > config["mongo-scrapy"]["max_depth"]:
            returnD(format_error("This Hyphe instance does not allow max_depth do be higher than %s" % config["mongo-scrapy"]["max_depth"]))
        redeploy = False
        if ("defaultCreationRule" in options or "defautStartpagesMode" in options) and \
          self.corpora[corpus]['crawls'] + self.corpora[corpus]['total_webentities'] > 0:
            returnD(format_error("defautStartpagesMode and default WE creation rule of a corpus can only be set when the corpus is created"))
        defaultCreationRule = yield self.db.get_default_WECR(corpus)
        if "defaultCreationRule" in options and options["defaultCreationRule"] != defaultCreationRule["name"]:
            yield self.traphs.stop_corpus(corpus)
            yield self.db.set_default_WECR(corpus, getWECR(options["defaultCreationRule"]))
            wecrs = dict((cr["prefix"], cr["regexp"]) for cr in self.corpora[corpus]["creation_rules"] if cr["prefix"] != "DEFAULT_WEBENTITY_CREATION_RULE")
            res = self.traphs.start_corpus(corpus, keepalive=self.corpora[corpus]['options']['keepalive'], default_WECR=getWECR(options["defaultCreationRule"]), WECRs=wecrs)

        if "follow_redirects" in options and options["follow_redirects"] != self.corpora[corpus]['options']['follow_redirects']:
            follow_redirects = []
            for d in options["follow_redirects"]:
                d = clean_host(d)
                if not is_url(d, tld_aware=True, require_protocol=False):
                    returnD(format_error('Redirection domain %s is not a valid hostname.' % d))
                follow_redirects.append(d)
            options["follow_redirects"] = follow_redirects

        if "proxy" in options or ("phantom" in options and (\
          "timeout" in options["phantom"] or \
          "ajax_timeout" in options["phantom"] or \
          "idle_timeout" in options["phantom"])):
            if self.corpora[corpus]['crawls_running']:
                returnD(format_error("Please stop currently running crawls before modifiying the crawler's settings"))
        if 'proxy' in options and options['proxy'] != self.corpora[corpus]['options']['proxy']:
            # Test proxy values & connectivity
            if options['proxy']['host']:
                try:
                    options['proxy']['port'] = int(options['proxy'].get('port', 0))
                except (ValueError, TypeError):
                    returnD(self.format_error("Proxy port must be an integer"))
                options['proxy']['host'] = clean_host(options['proxy']['host'])
                if '/' in options['proxy']['host'] or not is_url(options['proxy']['host'], tld_aware=True, require_protocol=False):
                    returnD(format_error("Proxy host is not a valid hostname"))
                test_proxy = yield self.lookup_httpstatus('https://www.wikipedia.org', corpus=corpus, _alternate_proxy=options['proxy'])
                if test_proxy['result'] < 0:
                    returnD(format_error("Proxy %s:%s does not seem like responding" % (options['proxy']['host'], options['proxy']['port'])))
            redeploy = True
            self.corpora[corpus]['options']['proxy'].update(options.pop("proxy"))
        if 'phantom' in options and options['phantom'] != self.corpora[corpus]['options']['phantom']:
            redeploy = True
            self.corpora[corpus]["options"]["phantom"].update(options.pop("phantom"))
      # TODO? Restrict setting archives only at start?
        for k in ["option", "date", "days_range"]:
            key = "webarchives_" + k
            if key in options and options[key] != self.corpora[corpus]['options'][key]:
                redeploy = True
                self.corpora[corpus]["options"][key] = options.pop(key)
        oldkeep = self.corpora[corpus]["options"]["keepalive"]
        self.corpora[corpus]["options"].update(options)
        yield self.update_corpus(corpus)
        if redeploy:
            res = yield self.crawler.jsonrpc_deploy_crawler(corpus)
            if is_error(res):
                returnD(res)
        if "keepalive" in options and options["keepalive"] != oldkeep:
            self.traphs.corpora[corpus].keepalive = options["keepalive"]
        returnD(format_result(self.corpora[corpus]["options"]))

    @inlineCallbacks
    def init_creationrules(self, corpus=DEFAULT_CORPUS):
        yield self.db.set_default_WECR(corpus, getWECR(self.corpora[corpus]["options"]["defaultCreationRule"]))
        for prf, regexp in config.get("creationRules", {}).items():
            prf = re.sub(r"^(https?://|www\.)+", "", prf).rstrip("/")
            variations = ["http://%s" % prf, "https://%s" % prf]
            if "/" in prf:
                variations += ["http://www.%s" % prf, "https://www.%s" % prf]
            for prefix in variations:
                lru = urllru.url_to_lru_clean(prefix, self.corpora[corpus]["tlds"])
                wecr = getWECR(regexp, lru)
                yield self.db.add_WECR(corpus, lru, wecr)

    def corpus_ready(self, corpus):
        if corpus not in self.existing_corpora:
            return False
        if not self.traphs.test_corpus(corpus):
            return False
        if corpus not in self.corpora:
            self.init_corpus(corpus)
            self.prepare_corpus(corpus)
        return True

    def corpus_error(self, corpus=None):
        if not corpus:
            return format_error("Too many instances running already, please try again later")
        if corpus in self.corpora and not self.traphs.starting_corpus(corpus) and not self.traphs.stopped_corpus(corpus):
            reactor.callInThread(self.jsonrpc_stop_corpus, corpus, True)
        return format_error(self.jsonrpc_test_corpus(corpus)["result"])

    @inlineCallbacks
    def jsonrpc_create_corpus(self, name=DEFAULT_CORPUS, password="", options={}, _noloop=False, _quiet=False):
        """Creates a corpus with the chosen `name` and optional `password` and `options` (as a json object see `set/get_corpus_options`). Returns the corpus generated id and status."""
        if self.traphs.is_full():
            returnD(self.corpus_error())

        # Forbid same corpus name as existing
        existing = yield self.db.get_corpus_by_name(name, projection=[])
        if existing:
            returnD(format_error('There already is a corpus named "%s".' % name))

        # Generate unique corpus id
        corpus = clean_corpus_id(name)
        corpus_idx = 1
        existing = yield self.db.get_corpus(corpus, projection=[])
        while existing:
            corpus = "%s-%s" % (clean_corpus_id(name), corpus_idx)
            corpus_idx += 1
            existing = yield self.db.get_corpus(corpus, projection=[])

        # Get TLDs for corpus
        tlds = yield collect_tlds()

        # Adjust corpus settings
        if options:
            try:
                check_conf_sanity(options, CORPUS_CONF_SCHEMA, name="%s options" % corpus, soft=True)
            except Exception as e:
                returnD(format_error(e))
        self.corpora[corpus] = {
          "name": name,
          "options": clean_missing_corpus_options(options, config),
          "tlds": tlds
        }

        # Save corpus in mongo
        yield self.db.add_corpus(corpus, name, password, self.corpora[corpus]["options"], tlds)
        self.existing_corpora.add(corpus)

        # Setup WebEntityCreationRules
        yield self.init_creationrules(corpus)

        # Deploy crawler
        try:
            res = yield self.crawler.jsonrpc_deploy_crawler(corpus, _quiet=_quiet, _tlds=tlds)
        except Exception as e:
            logger.msg("Could not deploy crawler for new corpus: %s %s" % (type(e), e), system="ERROR - %s" % corpus)
            returnD(format_error("Could not deploy crawler for corpus"))
        if not res or is_error(res):
            returnD(res)

        if not _quiet:
            logger.msg("New corpus created", system="INFO - %s" % corpus)
        # Start corpus
        res = yield self.jsonrpc_start_corpus(corpus, password=password, _noloop=_noloop, _quiet=_quiet)
        returnD(res)

    def init_corpus(self, corpus):
        if corpus not in self.corpora:
            self.corpora[corpus] = {}
        now = now_ts()
        self.corpora[corpus]["total_webentities"] = 0
        self.corpora[corpus]["webentities_in"] = 0
        self.corpora[corpus]["webentities_in_untagged"] = 0
        self.corpora[corpus]["webentities_in_uncrawled"] = 0
        self.corpora[corpus]["webentities_out"] = 0
        self.corpora[corpus]["webentities_undecided"] = 0
        self.corpora[corpus]["webentities_discovered"] = 0
        self.corpora[corpus]["tags"] = {}
        self.corpora[corpus]["webentities_links"] = {}
        self.corpora[corpus]["creation_rules"] = []
        self.corpora[corpus]["crawls"] = 0
        self.corpora[corpus]["crawls_running"] = 0
        self.corpora[corpus]["crawls_pending"] = 0
        self.corpora[corpus]["pages_found"] = 0
        self.corpora[corpus]["pages_crawled"] = 0
        self.corpora[corpus]["pages_queued"] = 0
        self.corpora[corpus]["links_found"] = 0
        self.corpora[corpus]["last_index_loop"] = now
        self.corpora[corpus]["last_links_loop"] = 0
        self.corpora[corpus]["stats_loop"] = LoopingCall(self.store.save_webentities_stats, corpus)
        self.corpora[corpus]["index_loop"] = LoopingCall(self.store.index_batch_loop, corpus)
        self.corpora[corpus]["jobs_loop"] = LoopingCall(self.refresh_jobs, corpus)

    @inlineCallbacks
    def jsonrpc_start_corpus(self, corpus=DEFAULT_CORPUS, password="", _noloop=False, _quiet=False, _create_if_missing=False):
        """Starts an existing `corpus` possibly `password`-protected. Returns the new corpus status."""
        # Entrypoint to just test the global password for admin page
        if not corpus:
            if not password or password != config.get("ADMIN_PASSWORD", None):
                returnD(format_error("Wrong password"))
            returnD(format_success(True))

        if self.corpus_ready(corpus) or self.traphs.status_corpus(corpus, simplify=True) == "starting":
            corpus_conf = yield self.db.get_corpus(corpus)
            if corpus_conf and corpus_conf['password'] and password != config.get("ADMIN_PASSWORD", None) and corpus_conf['password'] not in [password, salt(password)]:
                returnD(format_error("Wrong auth for password-protected corpus %s" % corpus))
            returnD(self.jsonrpc_test_corpus(corpus, _msg="Corpus already ready"))

        if corpus not in self.corpora:
            self.corpora[corpus] = {}
        if "starting" in self.corpora[corpus]:
            returnD(self.jsonrpc_test_corpus(corpus, _msg="Corpus already starting"))
        self.corpora[corpus]["starting"] = True

        corpus_conf = yield self.db.get_corpus(corpus)
        if not corpus_conf:
            if _create_if_missing:
                res = yield self.jsonrpc_create_corpus(corpus, password, _noloop=_noloop, _quiet=_quiet)
                if "starting" in self.corpora[corpus]:
                    del(self.corpora[corpus]["starting"])
                returnD(res)
            del(self.corpora[corpus])
            returnD(format_error("No corpus existing with ID %s, please create it first!" % corpus))
        if corpus_conf['password'] and password != config.get("ADMIN_PASSWORD", None) and corpus_conf['password'] not in [password, salt(password)]:
            del(self.corpora[corpus]["starting"])
            returnD(format_error("Wrong auth for password-protected corpus %s" % corpus))

        self.existing_corpora.add(corpus)

        res = yield self.crawler.crawlqueue.send_scrapy_query("listprojects")
        if is_error(res) or "projects" not in res or corpus_project(corpus) not in res['projects']:
            logger.msg("Couldn't find crawler, redeploying it...", system="ERROR - %s" % corpus)
            res = yield self.crawler.jsonrpc_deploy_crawler(corpus, _quiet=_quiet, _tlds=corpus_conf["tlds"])
            if is_error(res):
                del(self.corpora[corpus]["starting"])
                returnD(res)

        if self.traphs.is_full():
            if not _quiet:
                logger.msg("Could not start extra corpus, all slots busy", system="WARNING - %s" % corpus)
            del(self.corpora[corpus]["starting"])
            returnD(self.corpus_error())

        # Fix possibly old corpus confs
        clean_missing_corpus_options(corpus_conf['options'], config)

        if not _quiet:
            logger.msg("Starting corpus...", system="INFO - %s" % corpus)
        self.init_corpus(corpus)
        yield self.db.init_corpus_indexes(corpus)
        yield self.store.jsonrpc_get_webentity_creationrules(corpus=corpus)
        wecrs = dict((cr["prefix"], cr["regexp"]) for cr in self.corpora[corpus]["creation_rules"] if cr["prefix"] != "DEFAULT_WEBENTITY_CREATION_RULE")
        res = self.traphs.start_corpus(corpus, quiet=_quiet, keepalive=corpus_conf['options']['keepalive'], default_WECR=getWECR(corpus_conf['options']['defaultCreationRule']), WECRs=wecrs)
        if not res:
            del(self.corpora[corpus]["starting"])
            returnD(format_error(self.jsonrpc_test_corpus(corpus)["result"]))
        yield self.prepare_corpus(corpus, corpus_conf, _noloop)
        del(self.corpora[corpus]["starting"])
        returnD(self.jsonrpc_test_corpus(corpus))

    def build_tags_dictionary_from_msgpack(self, msgpack_tags):
        dico = {}
        tags = msgpack.unpackb(msgpack_tags)
        for ns, categories in tags.items():
            ns = ns.decode("utf-8")
            dico[ns] = {}
            for cat, values in categories.items():
                cat = cat.decode("utf-8")
                dico[ns][cat] = {}
                for val, count in values.items():
                    val = val.decode("utf-8")
                    dico[ns][cat][val] = count
        return dico

    @inlineCallbacks
    def prepare_corpus(self, corpus=DEFAULT_CORPUS, corpus_conf=None, _noloop=False):
        if not corpus_conf:
            corpus_conf = yield self.db.get_corpus(corpus)
        self.corpora[corpus]["name"] = corpus_conf["name"]
        self.corpora[corpus]["options"] = corpus_conf["options"]
        self.corpora[corpus]["tlds"] = corpus_conf["tlds"]
        self.corpora[corpus]["total_webentities"] = corpus_conf['total_webentities']
        self.corpora[corpus]["webentities_in"] = corpus_conf['webentities_in']
        self.corpora[corpus]["webentities_in_untagged"] = corpus_conf.get('webentities_in_untagged', 0)
        self.corpora[corpus]["webentities_in_uncrawled"] = corpus_conf.get('webentities_in_uncrawled', 0)
        self.corpora[corpus]["webentities_out"] = corpus_conf['webentities_out']
        self.corpora[corpus]["webentities_undecided"] = corpus_conf['webentities_undecided']
        self.corpora[corpus]["webentities_discovered"] = corpus_conf['webentities_discovered']
        self.corpora[corpus]["crawls"] = corpus_conf['total_crawls']
        self.corpora[corpus]["crawls_pending"] = corpus_conf.get("crawls_pending", 0)
        self.corpora[corpus]["crawls_running"] = corpus_conf.get("crawls_running", 0)
        self.corpora[corpus]["pages_found"] = corpus_conf['total_pages']
        self.corpora[corpus]["pages_crawled"] = corpus_conf['total_pages_crawled']
        self.corpora[corpus]["pages_queued"] = corpus_conf.get('total_pages_queued', 0)
        self.corpora[corpus]["links_found"] =  corpus_conf.get('total_links_found', 0)
        self.corpora[corpus]["recent_changes"] = int(corpus_conf.get('recent_changes', False))
        self.corpora[corpus]["last_index_loop"] = corpus_conf['last_index_loop']
        self.corpora[corpus]["links_duration"] = corpus_conf.get("links_duration", 1)
        self.corpora[corpus]["last_links_loop"] = corpus_conf['last_links_loop']
        try:
            self.corpora[corpus]["tags"] = self.build_tags_dictionary_from_msgpack(corpus_conf['tags'])
        except Exception as e:
            logger.msg("Could not unpack tags from Mongo: %s (%s), rebuilding dictionary..." % (e, type(e)), system="WARNING - %s" % corpus)
            self.corpora[corpus]["tags"] = {}
        if self.corpora[corpus]["total_webentities"] and not self.corpora[corpus]["tags"]:
            reactor.callLater(0, self.store.jsonrpc_rebuild_tags_dictionary, corpus)
        try:
            self.corpora[corpus]["webentities_links"] = msgpack.unpackb(corpus_conf['webentities_links'])
        except Exception as e:
            logger.msg("Could not unpack links from Mongo: %s (%s)" % (e, type(e)), system="WARNING - %s" % corpus)
            self.corpora[corpus]["webentities_links"] = {}
        self.corpora[corpus]["reset"] = False
        if not _noloop and not self.corpora[corpus]['jobs_loop'].running:
            self.corpora[corpus]['jobs_loop'].start(10, False)
        yield self.store._init_loop(corpus, _noloop=_noloop)
        yield self.update_corpus(corpus, True, True)

    @inlineCallbacks
    def update_corpus(self, corpus=DEFAULT_CORPUS, include_tags=False, include_links=False):
        if corpus not in self.corpora:
            returnD(None)
        conf = {
          "options": self.corpora[corpus]["options"],
          "total_webentities": self.corpora[corpus]['total_webentities'],
          "webentities_in": self.corpora[corpus]['webentities_in'],
          "webentities_in_untagged": self.corpora[corpus]['webentities_in_untagged'],
          "webentities_in_uncrawled": self.corpora[corpus]['webentities_in_uncrawled'],
          "webentities_out": self.corpora[corpus]['webentities_out'],
          "webentities_undecided": self.corpora[corpus]['webentities_undecided'],
          "webentities_discovered": self.corpora[corpus]['webentities_discovered'],
          "total_crawls": self.corpora[corpus]['crawls'],
          "crawls_pending": self.corpora[corpus]["crawls_pending"],
          "crawls_running": self.corpora[corpus]["crawls_running"],
          "total_pages": self.corpora[corpus]['pages_found'],
          "total_pages_crawled": self.corpora[corpus]['pages_crawled'],
          "total_pages_queued": self.corpora[corpus]['pages_queued'],
          "total_links_found": self.corpora[corpus]['links_found'],
          "recent_changes": self.corpora[corpus]['recent_changes'] > 0,
          "last_index_loop": self.corpora[corpus]['last_index_loop'],
          "links_duration": self.corpora[corpus]['links_duration'],
          "last_links_loop": self.corpora[corpus]['last_links_loop'],
          "last_activity": now_ts()
        }
        if include_tags:
          conf["tags"] = Binary(msgpack.packb(self.corpora[corpus]['tags']))
        if include_links:
          conf["webentities_links"] = Binary(msgpack.packb(self.corpora[corpus]['webentities_links']))
        yield self.db.update_corpus(corpus, conf)

    @inlineCallbacks
    def stop_loops(self, corpus=DEFAULT_CORPUS):
        for f in ["stats", "jobs", "index"]:
            fid = "%s_loop" % f
            if fid in self.corpora[corpus] and self.corpora[corpus][fid].running:
                yield self.corpora[corpus][fid].stop()
        while self.corpora[corpus]['loop_running']:
            yield deferredSleep(0.1)

    @inlineCallbacks
    def jsonrpc_stop_corpus(self, corpus=DEFAULT_CORPUS, _quiet=False):
        """Stops an existing and running `corpus`. Returns the new corpus status."""
        if corpus in self.corpora:
            yield self.stop_loops(corpus)
            if corpus in self.traphs.corpora:
                yield self.update_corpus(corpus, True, True)
                yield self.traphs.stop_corpus(corpus, _quiet)
            del(self.corpora[corpus])
        yield self.db.clean_WEs_query(corpus)
        res = self.jsonrpc_test_corpus(corpus)
        if "message" in res["result"]:
            res["result"]["message"] = "Corpus stopped"
        if is_error(res):
            logger.msg("Could not stop corpus: %s" % res, system="ERROR - %s" % corpus)
        returnD(res)

    def jsonrpc_get_corpus_tlds(self, corpus=DEFAULT_CORPUS):
        """Returns the tree of TLDs rules built from Mozilla's list at the creation of `corpus`."""
        if not self.corpus_ready(corpus):
            return self.corpus_error(corpus)
        return format_result(self.corpora[corpus]["tlds"])

    @inlineCallbacks
    def jsonrpc_backup_corpus(self, corpus=DEFAULT_CORPUS, _no_startup=False):
        """Saves locally on the server in the archive directory a timestamped backup of `corpus` including 4 json backup files of all webentities/links/crawls and corpus options."""
        ready = self.corpus_ready(corpus)
        if not ready and not _no_startup:
            returnD(self.corpus_error(corpus))
        now = datetime.today().isoformat()[:19]
        path = os.path.join("archives", corpus, now)
        test_and_make_dir(path)
        with open(os.path.join(path, "options.json"), "w") as f:
            options = yield self.db.get_corpus(corpus)
            if _no_startup and not ready:
                tags = self.build_tags_dictionary_from_msgpack(options["tags"])
            else:
                tags = self.corpora[corpus]["tags"]
            for key in ["tags", "webentities_links"]:
                del(options[key])
            jsondump(options, f)
        with open(os.path.join(path, "tags.json"), "w") as f:
            jsondump(tags, f)
        with open(os.path.join(path, "crawls.json"), "w") as f:
            crawls = yield self.jsonrpc_listjobs(corpus=corpus)
            if is_error(crawls):
                returnD(format_error("Error retrieving crawls: %s" % crawls["message"]))
            jsondump(crawls["result"], f)
        with open(os.path.join(path, "webentities.json"), "w") as f:
            WEs = yield self.store.jsonrpc_get_webentities(count=-1, sort=["status", "name"], semilight=True, corpus=corpus)
            if is_error(WEs):
                returnD(format_error("Error retrieving webentities: %s" % WEs["message"]))
            jsondump(WEs["result"], f)
        with open(os.path.join(path, "links.json"), "w") as f:
            links = yield self.store.jsonrpc_get_webentities_network(include_links_from_OUT=True, include_links_from_DISCOVERED=True, corpus=corpus)
            if is_error(links):
                returnD(format_error("Error retrieving links: %s" % links["message"]))
            jsondump(links["result"], f)
        returnD(format_result("Corpus crawls, webentities and links stored in %s" % path))

    @inlineCallbacks
    def jsonrpc_ping(self, corpus=None, timeout=3):
        """Tests during `timeout` seconds whether an existing `corpus` is started. Returns "pong" on success or the corpus status otherwise."""
        if not corpus:
            returnD(format_result('pong'))
        if not self.corpus_ready(corpus) and self.traphs.status_corpus(corpus, simplify=True) != "starting":
            returnD(self.corpus_error(corpus))

        st = time.time()
        res = self.traphs.test_corpus(corpus)
        while not res and time.time() < st + timeout:
            yield deferredSleep(0.5)
            res = self.traphs.test_corpus(corpus)
        if not res:
            returnD(format_error("Could not start traph"))
        returnD(format_result('pong'))

    @inlineCallbacks
    def jsonrpc_reinitialize(self, corpus=DEFAULT_CORPUS, _noloop=False, _quiet=False, _nobackup=False, _restart=False):
        """Resets completely a `corpus` by cancelling all crawls and emptying the Traph and Mongo data."""
        if not self.corpus_ready(corpus) and self.traphs.status_corpus(corpus, simplify=True) != "starting":
            returnD(self.corpus_error(corpus))
        if self.corpora[corpus]['reset']:
            returnD(format_result("Already resetting"))
        if not _quiet:
            logger.msg("Resetting corpus...", system="INFO - %s" % corpus)
        if corpus != TEST_CORPUS and not _nobackup:
            yield self.jsonrpc_backup_corpus(corpus)
        if corpus in self.corpora:
            yield self.stop_loops(corpus)
        self.init_corpus(corpus)
        self.corpora[corpus]['reset'] = True
        res = yield self.crawler.reinitialize(corpus, _recreate=(not _noloop), _quiet=_quiet)
        if is_error(res):
            logger.msg("Problem while reinitializing crawler... %s" % res, system="ERROR - %s" % corpus)
            returnD(res)
        self.init_corpus(corpus)
        yield self.db.init_corpus_indexes(corpus)
        yield self.init_creationrules(corpus)
        yield self.store.jsonrpc_get_webentity_creationrules(corpus=corpus)

        res = yield self.store.reinitialize(corpus, _noloop=_noloop, _quiet=_quiet, _restart=(not _noloop))
        if is_error(res):
            logger.msg("Problem while reinitializing Traph... %s" % res, system="ERROR - %s" % corpus)
            returnD(res)
        self.corpora[corpus]['reset'] = False
        returnD(format_result('Traph and Mongo databases emptied.'))

    @inlineCallbacks
    def jsonrpc_destroy_corpus(self, corpus=DEFAULT_CORPUS, _quiet=False):
        """Backups\, resets\, then definitely deletes a `corpus` and anything associated with it."""
        if corpus in self.destroying:
            returnD(format_result("Corpus already being destroyed, patience..."))
        self.destroying[corpus] = True
        if corpus != TEST_CORPUS:
            yield self.jsonrpc_backup_corpus(corpus)
        if not _quiet:
            logger.msg("Destroying corpus...", system="INFO - %s" % corpus)
        res = yield self.jsonrpc_reinitialize(corpus, _noloop=True, _quiet=_quiet, _nobackup=True, _restart=False)
        if is_error(res):
            del(self.destroying[corpus])
            returnD(res)
        if corpus in self.corpora:
            yield self.stop_loops(corpus)
        res = yield self.jsonrpc_stop_corpus(corpus, _quiet)
        if is_error(res):
            del(self.destroying[corpus])
            returnD(res)
        yield self.crawler.jsonrpc_delete_crawler(corpus, _quiet)
        yield self.db.delete_corpus(corpus)
        del(self.destroying[corpus])
        self.existing_corpora.remove(corpus)
        returnD(format_result("Corpus %s destroyed successfully" % corpus))

    @inlineCallbacks
    def jsonrpc_force_destroy_corpus(self, corpus=DEFAULT_CORPUS):
        """Deletes completely and definitely a `corpus` without restarting it (backup may be less complete)."""
        if corpus in self.destroying:
            # TODO: how to handle this
            returnD(format_result("Corpus already being destroyed, patience..."))
        if corpus not in self.existing_corpora:
            returnD(format_result("There is no corpus with the id '%s'." % corpus))
        if corpus != TEST_CORPUS:
            yield self.jsonrpc_backup_corpus(corpus, _no_startup=True)
        logger.msg("Destroying corpus...", system="INFO - %s" % corpus)
        self.destroying[corpus] = True
        if corpus in self.corpora:
            yield self.stop_loops(corpus)
        self.crawler.crawlqueue.cancel_corpus_jobs(corpus)
        list_jobs = yield self.crawler.list(corpus)
        if not is_error(list_jobs):
            list_jobs = list_jobs['result']
            for item in list_jobs['pending'] + list_jobs['running']:
                args = {'project': corpus_project(corpus), 'job': item['id']}
                yield self.crawler.crawlqueue.send_scrapy_query('cancel', args)
                yield self.crawler.crawlqueue.send_scrapy_query('cancel', args)
        yield self.crawler.jsonrpc_delete_crawler(corpus)
        yield self.db.clean_WEs_query(corpus)
        yield self.db.drop_corpus_collections(corpus)
        yield self.db.delete_corpus(corpus)
        if corpus not in self.traphs.corpora:
            yield self.traphs.start_corpus(corpus)
        yield self.store.clear_traph(corpus)
        yield self.traphs.stop_corpus(corpus)
        if corpus in self.corpora:
            del(self.corpora[corpus])
        del(self.destroying[corpus])
        self.existing_corpora.remove(corpus)
        returnD(format_result("Corpus %s destroyed successfully" % corpus))

    @inlineCallbacks
    def jsonrpc_clear_all(self, except_corpus_ids=[]):
        """Resets Hyphe completely: starts then resets and destroys all existing corpora one by one except for those whose ID is given in `except_corpus_ids`."""
        if type(except_corpus_ids) != list:
            except_corpus_ids = [except_corpus_ids]
        except_str = " except %s" % ", ".join(except_corpus_ids) if except_corpus_ids else ""
        logger.msg("CLEAR_ALL: destroying all corpora%s..." % except_str, system="INFO")
        corpora = yield self.db.list_corpus(projection=['password'])
        for corpus in corpora:
            if corpus["_id"] in except_corpus_ids:
                logger.msg("Skipping corpus %s" % corpus["_id"])
                continue
            res = yield self.delete_corpus(corpus)
            if is_error(res):
                returnD(res)
        returnD(format_result("All corpora and databases cleaned up%s" % except_str))

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

  # CORE AND CORPUS STATUS

    def jsonrpc_get_status(self, corpus=DEFAULT_CORPUS):
        """Returns global metadata on Hyphe's status and specific information on a `corpus`."""
        available_archives = [dict(v, id=k) for k, v in ARCHIVES_OPTIONS.items() if not k or k.lower() in [x.lower() for x in config["webarchives"]["options"]]]
        status = {
          'hyphe': {
            'corpus_running': self.traphs.total_running(),
            'crawls_running': sum([c['crawls_running'] for c in self.corpora.values() if "crawls_running" in c]),
            'crawls_pending': sum([c['crawls_pending'] for c in self.corpora.values() if "crawls_pending" in c]),
            'max_depth': config["mongo-scrapy"]["max_depth"],
            'available_archives': available_archives
          },
          'corpus': {
          }
        }
        status['corpus'].update(self.jsonrpc_test_corpus(corpus)["result"])
        if not self.corpus_ready(corpus):
            return format_result(status)
        if not self.corpora[corpus]['crawls']:
            self.corpora[corpus]['crawls_pending'] = 0
            self.corpora[corpus]['crawls_running'] = 0
        corpus_status = {
          'name': self.corpora[corpus]['name'],
          'idle': not (self.corpora[corpus]['crawls_pending'] + self.corpora[corpus]['crawls_running'] + self.corpora[corpus]['pages_queued'] + self.corpora[corpus]["recent_changes"]),
          'options': self.corpora[corpus]['options'],
          'crawler': {
            'jobs_finished': self.corpora[corpus]['crawls'] - self.corpora[corpus]['crawls_pending'] - self.corpora[corpus]['crawls_running'],
            'jobs_pending': self.corpora[corpus]['crawls_pending'],
            'jobs_running': self.corpora[corpus]['crawls_running'],
            'pages_crawled': self.corpora[corpus]['pages_crawled'],
            'pages_found': self.corpora[corpus]['pages_found'],
            'links_found': self.corpora[corpus]['links_found']
          },
          'traph': {
            'job_running': self.corpora[corpus]['loop_running'],
            'job_running_since': self.corpora[corpus]['loop_running_since'] if self.corpora[corpus]['loop_running'] else 0,
            'last_index': self.corpora[corpus]['last_index_loop'],
            'last_links': self.corpora[corpus]['last_links_loop']*1000,
            'links_duration': self.corpora[corpus]['links_duration'],
            'pages_to_index': self.corpora[corpus]['pages_queued'],
            'webentities': {
              'total': self.corpora[corpus]['total_webentities'],
              'IN': self.corpora[corpus]['webentities_in'],
              'IN_UNTAGGED': self.corpora[corpus]['webentities_in_untagged'],
              'IN_UNCRAWLED': self.corpora[corpus]['webentities_in_uncrawled'],
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
    def jsonrpc_listjobs(self, list_ids=None, from_ts=None, to_ts=None, light=False, corpus=DEFAULT_CORPUS):
        """Returns the list and details of all "finished"/"running"/"pending" crawl jobs of a `corpus`. Optionally returns only the jobs whose id is given in an array of `list_ids` and/or that was created after timestamp `from_ts` or before `to_ts`. Set `light` to true to get only essential metadata for heavy queries."""
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
              {"indexing_status": {"$ne": indexing_statuses.FINISHED}}
            ]
        kwargs = {}
        if light:
            kwargs["projection"] = [
              "webentity_id",
              "nb_crawled_pages",
              "nb_unindexed_pages",
              "nb_pages",
              "nb_links",
              "crawl_arguments.max_depth",
              "crawl_arguments.cookies",
              "crawl_arguments.webarchives",
              "crawling_status",
              "indexing_status",
              "created_at",
              "scheduled_at",
              "started_at",
              "crawled_at",
              "finished_at"
            ]
        jobs = yield self.db.list_jobs(corpus, query, **kwargs)
        returnD(format_result(list(jobs)))

    @inlineCallbacks
    def refresh_jobs(self, corpus=DEFAULT_CORPUS):
        # Runs a monitoring task on the list of jobs in the database to update their status from scrapy API and indexing tasks
        if corpus not in self.corpora:
            returnD(None)
        if self.corpora[corpus].get('reset', False):
            yield self.db.queue(corpus).drop()
            returnD(None)
        scrapyjobs = yield self.crawler.list(corpus)
        if is_error(scrapyjobs):
            if not (type(scrapyjobs["message"]) is dict and "status" in scrapyjobs["message"]):
                logger.msg("Problem dialoguing with scrapyd server: %s" % scrapyjobs, system="WARNING - %s" % corpus)
            returnD(None)
        scrapyjobs = scrapyjobs['result']
        if corpus not in self.corpora:
            returnD(None)
        self.corpora[corpus]['pages_queued'] = yield self.db.queue(corpus).count()
        self.corpora[corpus]['pages_crawled'] = yield self.db.pages(corpus).count()
        jobs = yield self.db.list_jobs(corpus, projection=['nb_pages', 'nb_links'])
        self.corpora[corpus]['crawls'] = len(jobs)
        self.corpora[corpus]['pages_found'] = sum([j['nb_pages'] for j in jobs])
        self.corpora[corpus]['links_found'] = sum([j['nb_links'] for j in jobs])
        self.corpora[corpus]['crawls_pending'] = len(scrapyjobs['pending']) + self.crawler.crawlqueue.count_waiting_jobs(corpus)
        self.corpora[corpus]['crawls_running'] = len(scrapyjobs['running'])
        yield self.update_corpus(corpus)
        # clean lost jobs
        yield self.db.update_jobs(corpus, {'crawling_status': crawling_statuses.PENDING, 'indexing_status': indexing_statuses.BATCH_FINISHED}, {'crawling_status': crawling_statuses.RUNNING, "started_at": now_ts()})
        if len(scrapyjobs['running']) + len(scrapyjobs['pending']) == 0:
            yield self.db.update_jobs(corpus, {'crawling_status': crawling_statuses.RUNNING}, {'crawling_status': crawling_statuses.FINISHED, "finished_at": now_ts()})

        # update jobs crawling status and pages counts accordingly to crawler's statuses
        running_ids = [job['id'] for job in scrapyjobs['running']]
        unfinished_indexes = yield self.db.list_jobs(corpus, {'indexing_status': {'$ne': indexing_statuses.FINISHED}}, projection=['crawljob_id'])
        for job_id in set(running_ids) | set([job['crawljob_id'] for job in unfinished_indexes]):
            yield self.db.update_job_pages(corpus, job_id)
        res = yield self.db.list_jobs(corpus, {'crawljob_id': {'$in': running_ids}, 'crawling_status': crawling_statuses.PENDING}, projection=[])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'crawling_status': crawling_statuses.RUNNING, 'started_at': now_ts()})
            yield self.db.add_log(corpus, update_ids, "CRAWL_"+crawling_statuses.RUNNING)
        # update crawling status for finished jobs
        finished_ids = [job['id'] for job in scrapyjobs['finished']]
        res = yield self.db.list_jobs(corpus, {'crawljob_id': {'$in': finished_ids}, 'crawling_status': {'$nin': [crawling_statuses.RETRIED, crawling_statuses.CANCELED, crawling_statuses.FINISHED]}}, projection=[])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'crawling_status': crawling_statuses.FINISHED, 'crawled_at': now_ts()})
            yield self.db.add_log(corpus, update_ids, "CRAWL_"+crawling_statuses.FINISHED)
        # collect list of crawling jobs whose outputs is not fully indexed yet
        jobs_in_queue = yield self.db.queue(corpus).distinct('_job')
        # set index finished for jobs with crawling finished and no page left in queue
        res = yield self.db.list_jobs(corpus, {'crawling_status': crawling_statuses.FINISHED, 'crawljob_id': {'$exists': True}})
        finished_ids = set([job['crawljob_id'] for job in res] + finished_ids)
        res = yield self.db.list_jobs(corpus, {'crawljob_id': {'$in': list(finished_ids-set(jobs_in_queue))}, 'crawling_status': crawling_statuses.FINISHED, 'indexing_status': {'$nin': [indexing_statuses.BATCH_RUNNING, indexing_statuses.FINISHED]}}, projection=[])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'indexing_status': indexing_statuses.FINISHED, 'finished_at': now_ts()})
            yield self.db.add_log(corpus, update_ids, "INDEX_"+indexing_statuses.FINISHED)
            if corpus in self.corpora and self.corpora[corpus]['options']['phantom'].get('autoretry', False):
                # Try to restart in phantom mode all regular crawls that seem to have failed (less than 3 pages found for a depth of at least 1)
                res = yield self.db.list_jobs(corpus, {'_id': {'$in': update_ids}, 'nb_crawled_pages': {'$lt': 3}, 'crawl_arguments.phantom': False, 'crawl_arguments.max_depth': {'$gt': 0}})
                for job in res:
                    logger.msg("Crawl job %s seems to have failed, trying to restart it in phantom mode" % job['_id'], system="INFO - %s" % corpus)
                    yield self.jsonrpc_crawl_webentity(job['webentity_id'], min(job['crawl_arguments']['max_depth'], 2), True, corpus=corpus)
                    yield self.db.add_log(corpus, job['_id'], "CRAWL_RETRIED_AS_PHANTOM")
                    yield self.db.update_jobs(corpus, job['_id'], {'crawling_status': crawling_statuses.RETRIED})

    re_linkedpages = re.compile(r'pages-(\d+)$')
    @inlineCallbacks
    def _get_suggested_startpages(self, WE, startmode, corpus, categories=False):
        if type(startmode) != list and startmode.lower() == "default":
            startmode = self.corpora[corpus]["options"]["defaultStartpagesMode"]
        if type(startmode) != list:
            startmode = [startmode]
        starts = {}
        for startrule in startmode:
            startrule = startrule.lower()
            nlinks = self.re_linkedpages.search(startrule)
            if nlinks:
                pages = yield self.store.traphs.call(corpus, "get_webentity_most_linked_pages", WE["_id"], WE["prefixes"], pages_count=int(nlinks.group(1)), max_depth=2)
                if is_error(pages):
                    returnD(pages)
                pages = pages["result"]
                starts[startrule] = urllru.safe_lrus_to_urls([p["lru"] for p in pages])
            elif startrule == "prefixes":
                starts[startrule] = urllru.safe_lrus_to_urls(WE["prefixes"])
            elif startrule == "startpages":
                starts[startrule] = WE["startpages"]
            elif startrule == "homepage":
                starts[startrule] = [WE["homepage"]]
            else:
                returnD(format_error('ERROR: startmode argument must be either "default" or one or many of "startpages", "pages-<N>" with <N> an int or "prefixes"'))
        if categories:
            returnD(starts)
        returnD(list(set(s for st in starts.values() for s in st if s)))

    @inlineCallbacks
    def jsonrpc_propose_webentity_startpages(self, webentity_id, startmode="default", categories=False, save_startpages=False, corpus=DEFAULT_CORPUS):
        """Returns a list of suggested startpages to crawl an existing WebEntity defined by its `webentity_id` using the "default" `startmode` defined for the `corpus` or one or an array of either the WebEntity's preset "startpages"\, "homepage" or "prefixes" or <N> most seen "pages-<N>". Returns them categorised by type of source if "categories" is set to True. Will save them into the webentity if `save_startpages` is True."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No WebEntity with id %s found" % webentity_id))
        startpages = yield self._get_suggested_startpages(WE, startmode, corpus, categories=categories)
        if save_startpages:
            sp_todo = list(set(s for st in startpages.values() for s in st)) if categories else startpages
            yield self.store.jsonrpc_add_webentity_startpages(webentity_id, sp_todo, corpus=corpus)
        returnD(handle_standard_results(startpages))

    @inlineCallbacks
    def jsonrpc_crawl_webentity(self, webentity_id, depth=0, phantom_crawl=False, status="IN", proxy=None, cookies_string=None, phantom_timeouts={}, webarchives={}, corpus=DEFAULT_CORPUS):
        """Schedules a crawl for a `corpus` for an existing WebEntity defined by its `webentity_id` with a specific crawl `depth [int]`.\nOptionally use PhantomJS by setting `phantom_crawl` to "true" and adjust specific `phantom_timeouts` as a json object with possible keys `timeout`/`ajax_timeout`/`idle_timeout`.\nSets simultaneously the WebEntity's status to "IN" or optionally to another valid `status` ("undecided"/"out"/"discovered").\nOptionally add a HTTP `proxy` specified as "domain_or_IP:port".\nAlso optionally add known `cookies_string` with auth rights to a protected website.\nOptionally use some `webarchives` by defining a json object with keys `date`/`days_range`/`option`\, the latter being one of ""/"web.archive.org"/"archivesinternet.bnf.fr".\nWill use the WebEntity's startpages if it has any or use otherwise the `corpus`' "default" `startmode` heuristic as defined in `propose_webentity_startpages` (use `crawl_webentity_with_startmode` to apply a different heuristic\, see details in `propose_webentity_startpages`)."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        try:
            webentity_id = int(webentity_id)
        except (ValueError, TypeError):
            returnD(self.format_error("WebEntity ID must be an integer"))
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No WebEntity with id %s found" % webentity_id))
        startmode = "startpages"
        if not WE["startpages"]:
            startmode = "default"
        res = yield self.jsonrpc_crawl_webentity_with_startmode(WE, depth=depth, phantom_crawl=phantom_crawl, status=status, startmode=startmode, proxy=proxy, cookies_string=cookies_string, phantom_timeouts=phantom_timeouts, webarchives=webarchives, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_crawl_webentity_with_startmode(self, webentity_id, depth=0, phantom_crawl=False, status="IN", startmode="default", proxy=None, cookies_string=None, phantom_timeouts={}, webarchives={}, corpus=DEFAULT_CORPUS):
        """Schedules a crawl for a `corpus` for an existing WebEntity defined by its `webentity_id` with a specific crawl `depth [int]`.\nOptionally use PhantomJS by setting `phantom_crawl` to "true" and adjust specific `phantom_timeouts` as a json object with possible keys `timeout`/`ajax_timeout`/`idle_timeout`.\nSets simultaneously the WebEntity's status to "IN" or optionally to another valid `status` ("undecided"/"out"/"discovered").\nOptionally add a HTTP `proxy` specified as "domain_or_IP:port".\nAlso optionally add known `cookies_string` with auth rights to a protected website.\nOptionally define the `startmode` strategy differently to the `corpus` "default one (see details in `propose_webentity_startpages`).\nOptionally use some `webarchives` by defining a json object with keys `date`/`days_range`/`option`\, the latter being one of ""/"web.archive.org"/"archivesinternet.bnf.fr"."""
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
        # Get WebEntity if webentity_id not already one from internal call
        try:
            tmpid = webentity_id["_id"]
            WE = webentity_id
            webentity_id = tmpid
        except TypeError:
            try:
                webentity_id = int(webentity_id)
            except (ValueError, TypeError):
                returnD(self.format_error("WebEntity ID must be an integer"))
            WE = yield self.db.get_WE(corpus, webentity_id)
            if not WE:
                returnD(format_error("No WebEntity with id %s found" % webentity_id))

        # Handle different startpages strategies
        starts = yield self._get_suggested_startpages(WE, startmode, corpus)
        if is_error(starts):
            returnD(starts)
        if not starts:
            returnD(format_error('ERROR: no startpage could be found for %s using %s' % (WE["_id"], startpages)))
        autostarts = [s for s in starts if s not in WE["startpages"]] if WE["startpages"] else starts

        status = status.upper()
        if status not in WEBENTITIES_STATUSES:
            returnD(format_error("ERROR: status argument must be one of '%s'" % "','".join(WEBENTITIES_STATUSES)))
        if status != WE["status"]:
            yield self.store.jsonrpc_set_webentity_status(WE, status, corpus=corpus)

        subs = yield self.store.traphs.call(corpus, "get_webentity_child_webentities", WE["_id"], WE["prefixes"])

        if is_error(subs):
            returnD(subs)

        if subs["result"]:
            # if there are no subEntities, sub['result'] is empty and get_WEs returns all WEs including the one to be crawled
            subs = yield self.db.get_WEs(corpus, subs["result"])
            nofollow = [p for subwe in subs for p in subwe["prefixes"]]
        else:
            nofollow = []

        if "CORE" in WE["tags"] and "recrawlNeeded" in WE["tags"]["CORE"]:
            yield self.store.jsonrpc_rm_webentity_tag_value(webentity_id, "CORE", "recrawlNeeded", "true", corpus=corpus)
        if WE["crawled"]:
            oldsources = WE.get("tags", {}).get("USER", {}).get("Crawl Source", [""])[0]
            sources = set((oldsources or "Live Web").split(" + "))
            sources.add(webarchives.get("option", "Live Web") or "Live Web")
            sources = " + ".join(sources)
            if not oldsources and sources != "Live Web":
                yield self.store.jsonrpc_add_webentity_tag_value(webentity_id, "USER", "Crawl Source", sources, corpus=corpus, _automatic=True)
            elif sources != oldsources:
                yield self.store.jsonrpc_edit_webentity_tag_value(webentity_id, "USER", "Crawl Source", oldsources, sources, corpus=corpus, _automatic=True)
        elif webarchives.get("option"):
            yield self.store.jsonrpc_add_webentity_tag_value(webentity_id, "USER", "Crawl Source", webarchives["option"], corpus=corpus, _automatic=True)

        res = yield self.crawler.jsonrpc_start(webentity_id, starts, WE["prefixes"], nofollow, self.corpora[corpus]["options"]["follow_redirects"], depth, phantom_crawl, phantom_timeouts, proxy=proxy, cookies_string=cookies_string, webarchives=webarchives, corpus=corpus, _autostarts=autostarts)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentity_jobs(self, webentity_id, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` crawl jobs that has run for a specific WebEntity defined by its `webentity_id`."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        jobs = yield self.db.list_jobs(corpus, {"$or": [{'webentity_id': webentity_id}, {'previous_webentity_id': webentity_id}]})
        returnD(handle_standard_results(jobs))

    @inlineCallbacks
    def jsonrpc_cancel_webentity_jobs(self, webentity_id, corpus=DEFAULT_CORPUS):
        """Cancels for a `corpus` all running or pending crawl jobs that were booked for a specific WebEntity defined by its `webentity_id`."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        jobs = yield self.db.list_jobs(corpus, {"$or": [{'webentity_id': webentity_id}, {'previous_webentity_id': webentity_id}]})
        res = yield DeferredList([self.crawler.jsonrpc_cancel(j['_id'], corpus=corpus) for j in jobs], consumeErrors=True)
        returnD(handle_standard_results(res))

    @inlineCallbacks
    def jsonrpc_get_webentity_logs(self, webentity_id, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` crawl activity logs on a specific WebEntity defined by its `webentity_id`."""
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        jobs = yield self.db.list_jobs(corpus, {'webentity_id': webentity_id}, projection=[])
        if not jobs:
            returnD(format_error('No job found for WebEntity %s.' % webentity_id))
        res = yield self.db.list_logs(corpus, [a['_id'] for a in list(jobs)])
        returnD(format_result([{'timestamp': log['timestamp'], 'job': log['_job'], 'log': log['log']} for log in list(res)]))

  # HTTP LOOKUP METHODS

    def jsonrpc_lookup_httpstatus(self, url, timeout=30, corpus=DEFAULT_CORPUS):
        """Tests a `url` for `timeout` seconds using a `corpus` specific connection (possible proxy for instance). Returns the url's HTTP code."""
        try:
            timeout = int(timeout)
        except:
            return self.format_error("Timeout argument must be an integer")
        return self.lookup_httpstatus(url, deadline=time.time()+timeout, corpus=corpus)

    @inlineCallbacks
    def lookup_httpstatus(self, url, timeout=5, deadline=0, tryout=0, noproxy=False, corpus=DEFAULT_CORPUS, _alternate_proxy=None):
        if not self.corpus_ready(corpus):
            returnD(self.corpus_error(corpus))
        res = format_result(0)
        timeout = int(timeout)
        use_proxy = (_alternate_proxy or self.corpora[corpus]["options"]['proxy']['host']) and not noproxy
        if use_proxy:
            proxy_host = _alternate_proxy["host"] if _alternate_proxy else self.corpora[corpus]["options"]['proxy']['host']
            proxy_port = _alternate_proxy["port"] if _alternate_proxy else self.corpora[corpus]["options"]['proxy']['port']
        try:
            url = urllru.url_clean(str(url))
            if use_proxy:
                agent = ProxyAgent(TCP4ClientEndpoint(reactor, proxy_host, proxy_port, timeout=timeout))
            else:
                agent = Agent(reactor, connectTimeout=timeout)
            method = "HEAD"
            if tryout > 3:
                method = "GET"
            headers = {'Accept': ['*/*'],
                      'User-Agent': [get_random_user_agent()]}
            response = yield agent.request(method, url, Headers(headers), None)
        except (DNSLookupError, ConnectionRefusedError) as e:
            if use_proxy and (proxy_host in str(e) or type(e) == ConnectionRefusedError):
                res['result'] = -2
                res['message'] = "Proxy not responding"
                if tryout == 3:
                    if _alternate_proxy:
                        returnD(res)
                    else:
                        noproxy = True
                        tryout = 1
                if tryout < 3:
                    if config['DEBUG'] == 2:
                        logger.msg("Retry lookup after proxy error %s %s %s (via %s:%s)" % (method, url, tryout, proxy_host, proxy_port), system="DEBUG - %s" % corpus)
                    res = yield self.lookup_httpstatus(url, timeout=timeout+2, tryout=tryout+1, noproxy=noproxy, deadline=deadline, corpus=corpus, _alternate_proxy=_alternate_proxy)
                    returnD(res)
            elif type(e) == DNSLookupError:
                res['message'] = "DNS not found for url %s : %s" % (url, e)
            else:
                res['result'] = -1
                res['message'] = "Cannot process url %s : %s %s." % (url, type(e), e)
        except Exception as e:
            res['result'] = -1
            res['message'] = "Cannot process url %s : %s %s." % (url, type(e), e)
        if 'message' in res:
            returnD(res)
        if response.code == 200 or url in " ".join(response.headers._rawHeaders.get('location', "")):
            response.code = 200
        elif url.startswith("http:") and tryout == 4 and response.code == 403 and "IIS" in response.headers._rawHeaders.get('server', [""])[0]:
            response.code = 301
        # BNF Archives return 301 when using HEAD queries so do not consider it as error
        elif use_proxy and not ("archivesinternet.bnf.fr" in proxy_host and 300 <= response.code < 400) and \
          not (deadline and deadline < time.time()) and \
          not (url.startswith("https") and response.code/100 == 4) and \
          (use_proxy or response.code in [403, 405, 500, 501, 503]) and \
          response.code not in [400, 404, 502]:
            if tryout == 3 and use_proxy:
                noproxy = True
                tryout = 1
            if tryout < 3:
                if config['DEBUG'] == 2:
                    logger.msg("Retry lookup %s %s %s %s" % (method, url, tryout, response.__dict__), system="DEBUG - %s" % corpus)
                res = yield self.lookup_httpstatus(url, timeout=timeout+2, tryout=tryout+1, noproxy=noproxy, deadline=deadline, corpus=corpus, _alternate_proxy=_alternate_proxy)
                returnD(res)
        result = format_result(response.code)
        if 300 <= response.code < 400 and response.headers._rawHeaders['location']:
            result['location'] = response.headers._rawHeaders['location'][0]
        returnD(result)

    @inlineCallbacks
    def jsonrpc_lookup(self, url, timeout=30, corpus=DEFAULT_CORPUS):
        """Tests a `url` for `timeout` seconds using a `corpus` specific connection (possible proxy for instance). Returns a boolean indicating whether `lookup_httpstatus` returned HTTP code 200 or a redirection code (301/302/...)."""
        res = yield self.jsonrpc_lookup_httpstatus(url, timeout=timeout, corpus=corpus)
        if res['code'] == 'success' and (res['result'] == 200 or 300 < res['result'] < 400):
            returnD(format_result(True))
        returnD(format_result(False))


# CRAWLER'S DEDICATED API
# accessible jsonrpc methods via "crawl."

class Crawler(customJSONRPC):

    def __init__(self, parent=None):
        customJSONRPC.__init__(self, config['OPEN_CORS_API'], config['DEBUG'])
        self.parent = parent
        self.db = self.parent.db
        self.corpora = self.parent.corpora
        self.crawlqueue = JobsQueue(config["mongo-scrapy"])

    @inlineCallbacks
    def jsonrpc_deploy_crawler(self, corpus=DEFAULT_CORPUS, _quiet=False, _tlds=None):
        """Prepares and deploys on the ScrapyD server a spider (crawler) for a `corpus`."""
        # Write corpus TLDs for use in scrapyd egg
        with open(os.path.join("hyphe_backend", "crawler", "hcicrawler", "tlds_tree.py"), "wb") as tlds_file:
            print >> tlds_file, "TLDS_TREE =", self.corpora[corpus].get("tlds", _tlds)
        output = subprocess.Popen([sys.executable, 'deploy.py', corpus], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, cwd='hyphe_backend/crawler', env=os.environ).communicate()[0]
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
            yield DeferredList([self.jsonrpc_cancel(item['id'], corpus=corpus) for item in list_jobs['pending'] + list_jobs['running']], consumeErrors=True)
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
        self.crawlqueue.cancel_corpus_jobs(corpus)
        list_jobs = yield self.list(corpus)
        if is_error(list_jobs):
            returnD('No crawler deployed, hence no job to cancel')
        list_jobs = list_jobs['result']
        for item in list_jobs['pending'] + list_jobs['running']:
            args = {'project': corpus_project(corpus), 'job': item['id']}
            yield self.crawlqueue.send_scrapy_query('cancel', args)
            yield self.crawlqueue.send_scrapy_query('cancel', args)
        yield self.db.drop_corpus_collections(corpus)
        res = yield self.jsonrpc_deploy_crawler(corpus)
        if is_error(res):
            returnD(res)
        if _recreate and not self.corpora[corpus]['jobs_loop'].running:
            self.corpora[corpus]['jobs_loop'].start(10, False)
        returnD(format_result('Crawling database reset.'))

    @inlineCallbacks
    def jsonrpc_start(self, webentity_id, starts, follow_prefixes, nofollow_prefixes, follow_redirects=None, depth=0, phantom_crawl=False, phantom_timeouts={}, download_delay=config['mongo-scrapy']['download_delay'], proxy=None, cookies_string=None, webarchives={}, corpus=DEFAULT_CORPUS, _autostarts=[]):
        """Starts a crawl for a `corpus` defining finely the crawl options (mainly for debug purposes):\n- a `webentity_id` associated with the crawl a list of `starts` urls to start from\n- a list of `follow_prefixes` to know which links to follow\n- a list of `nofollow_prefixes` to know which links to avoid\n- a `depth` corresponding to the maximum number of clicks done from the start pages\n- `phantom_crawl` set to "true" to use PhantomJS for this crawl and optional `phantom_timeouts` as an object with keys among `timeout`/`ajax_timeout`/`idle_timeout`\n- a `download_delay` corresponding to the time in seconds spent between two requests by the crawler.\n- an HTTP `proxy` specified as "domain_or_IP:port"\n- a known `cookies_string` with auth rights to a protected website.\nOptionally use some `webarchives` by defining a json object with keys `date`/`days_range`/`option`\, the latter being one of ""/"web.archive.org"/"archivesinternet.bnf.fr"."""
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

        if not proxy and self.corpora[corpus]["options"]["proxy"]["host"]:
            proxy = "%s:%s" % (self.corpora[corpus]["options"]["proxy"]["host"], self.corpora[corpus]["options"]["proxy"]["port"])

        if not webarchives and self.corpora[corpus]["options"]["webarchives_option"]:
            for key in ["option", "date", "days_range"]:
                webarchives[key] = self.corpora[corpus]["options"]["webarchives_%s" % key]

        # lighten queries on web archives since all crawls rely on the same server
        if "option" in webarchives and webarchives["option"]:
            download_delay = 2

        # preparation of the request to scrapyd
        args = {
          'project': corpus_project(corpus),
          'spider': 'pages',
          'phantom': phantom_crawl,
          'setting': 'DOWNLOAD_DELAY=' + str(download_delay),
          'max_depth': depth,
          'start_urls': list(starts),
          'start_urls_auto': list(_autostarts),
          'follow_prefixes': list(follow_prefixes),
          'nofollow_prefixes': list(nofollow_prefixes),
          'discover_prefixes': list(follow_redirects),
          'proxy': proxy,
          'user_agent': get_random_user_agent(),
          'cookies': cookies_string,
          'webarchives': webarchives
        }

        if phantom_crawl:
            phantom_timeouts.update(self.corpora[corpus]["options"]["phantom"])
            for t in ["", "ajax_", "idle_"]:
                args['phantom_%stimeout' % t] = phantom_timeouts["%stimeout" % t]
        res = yield self.crawlqueue.add_job(args, corpus, webentity_id)
        yield self.db.upsert_WE(corpus, webentity_id, {"crawled": True})
        self.corpora[corpus]["webentities_in_uncrawled"] -= 1
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_cancel(self, job_id, corpus=DEFAULT_CORPUS):
        """Cancels a crawl of id `job_id` for a `corpus`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        existing = yield self.db.list_jobs(corpus, {"$or": [{"crawljob_id": job_id}, {"_id": job_id}]})
        if not existing:
            returnD(format_error("No job found with id %s" % job_id))
        elif existing[0]["crawling_status"] in [crawling_statuses.CANCELED, crawling_statuses.RETRIED]:
            returnD(format_error("Job %s is already not running anymore" % job_id))
        if existing[0]["crawling_status"] != "FINISHED":
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
        elif existing[0]["indexing_status"] == "FINISHED":
            returnD(format_error("Job %s was already completed and indexed" % job_id))
        else:
            res = "stopping leftover indexation for job %s" % existing[0]["crawljob_id"]
        unindexed_pages = yield self.db.get_queue(corpus, {'_job': existing[0]["crawljob_id"]}, projection=["url"])
        yield self.db.update_jobs(corpus, job_id, {'crawling_status': crawling_statuses.CANCELED, 'indexing_status': indexing_statuses.FINISHED, 'finished_at': now_ts(), 'forgotten_pages': len(unindexed_pages)})
        yield self.db.clean_queue(corpus, {'_job': existing[0]["crawljob_id"]})
        yield self.db.forget_pages(corpus, existing[0]["crawljob_id"], [i["url"] for i in unindexed_pages])
        yield self.db.update_job_pages(corpus, existing[0]["crawljob_id"])
        yield self.db.add_log(corpus, job_id, "CRAWL_"+crawling_statuses.CANCELED)
        yield self.db.upsert_WE(corpus, existing[0]["webentity_id"], {"crawled": False})
        self.corpora[corpus]["webentities_in_uncrawled"] += 1
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

class Memory_Structure(customJSONRPC):

    def __init__(self, parent=None):
        customJSONRPC.__init__(self, config['OPEN_CORS_API'], config['DEBUG'])
        self.parent = parent
        self.db = self.parent.db
        self.corpora = self.parent.corpora
        self.traphs = self.parent.traphs

    @inlineCallbacks
    def _init_loop(self, corpus=DEFAULT_CORPUS, _noloop=False, _delay=False):
        if self.corpora[corpus]['reset']:
            yield self.db.queue(corpus).drop()

        now = now_ts()
        yield self.handle_index_error(corpus)
        self.corpora[corpus]['reset'] = False
        self.corpora[corpus]['loop_running'] = None
        self.corpora[corpus]['loop_running_since'] = now
        if not _noloop:
            yield self.rank_webentities(corpus)
            yield self.count_webentities(corpus)
            if not self.corpora[corpus]['index_loop'].running:
                self.corpora[corpus]['index_loop'].start(0.05, False)
            if not self.corpora[corpus]['stats_loop'].running:
                self.corpora[corpus]['stats_loop'].start(60, False)

    def format_webentity(self, WE, job={}, homepage=None, light=False, semilight=False, light_for_csv=False, weight=None, corpus=DEFAULT_CORPUS, _links=None):
        if not WE:
            return None
        res = {'_id': WE["_id"], 'id': WE["_id"], 'name': WE["name"], 'status': WE["status"], 'prefixes': WE["prefixes"]}
        if weight is not None:
            res['weight'] = weight
        links = _links or self.corpora[corpus]["webentities_links"]
        for key in ['undirected_', 'in', 'out']:
            res[key + 'degree'] = links.get(WE["_id"], {}).get(key + 'degree', 0)
        if test_bool_arg(light):
            return res
        res['creation_date'] = WE["creationDate"]
        res['last_modification_date'] = WE["lastModificationDate"]
        if job:
            res['crawling_status'] = job['crawling_status']
            res['indexing_status'] = job['indexing_status']
            res['crawled'] = job['crawling_status'] not in [crawling_statuses.CANCELED, crawling_statuses.UNCRAWLED]
        else:
            res['crawling_status'] = crawling_statuses.UNCRAWLED
            res['indexing_status'] = indexing_statuses.UNINDEXED
            res['crawled'] = False
        for key in ['total', 'crawled']:
            res['pages_' + key] = links.get(WE['_id'], {}).get('pages_' + key, 0)
        res['homepage'] = WE["homepage"] if WE["homepage"] else homepage if homepage else None
        res['tags'] = {}
        for tag, values in WE["tags"].iteritems():
            if test_bool_arg(semilight) and tag != 'USER':
                continue
            res['tags'][tag] = {}
            for key, val in values.iteritems():
                res['tags'][tag][key] = list(val)
        if test_bool_arg(semilight):
            return res
        if test_bool_arg(light_for_csv):
            return {'id': WE["_id"], 'name': WE["name"], 'status': WE["status"],
                    'prefixes': "|".join(urllru.safe_lrus_to_urls(WE["prefixes"])),
                    'tags': "|".join(["|".join(res['tags'][ns][key]) for ns in res['tags'] for key in res['tags'][ns] if ns.startswith("CORE")])}
        res['startpages'] = WE["startpages"]
        return res

    re_camelCase = re.compile(r'(.)_(.)')
    def sortargs_accessor(self, WE, field, jobs={}, weights=None, corpus=DEFAULT_CORPUS):
        if "_" in field and not field.startswith("pages_"):
            field = self.re_camelCase.sub(lambda x: x.group(1)+x.group(2).upper(), field)
        else: field = field.lower()
        if field in WE:
            return WE[field]
        if field == "crawled":
            job = jobs.get(WE["_id"], {})
            return job and job['crawling_status'] not in [crawling_statuses.CANCELED, crawling_statuses.UNCRAWLED]
        if field == "weight" and weights is not None:
            return weights.get(WE["_id"], 0)
        if field.startswith("pages") or field.endswith("degree"):
            return self.corpora[corpus]["webentities_links"].get(WE["_id"], {}).get(field, 0)
        return None

    @inlineCallbacks
    def get_webentities_jobs(self, WEs, corpus=DEFAULT_CORPUS):
        jobs = {}
        res = yield self.db.list_jobs(corpus, {'webentity_id': {'$in': [WE["_id"] for WE in WEs if WE["status"] != "DISCOVERED"]}}, projection=['webentity_id', 'crawling_status', 'indexing_status'])
        for job in res:
            jobs[job['webentity_id']] = job
        returnD(jobs)

    # Linkpage heuristic to be refined
    re_extract_url_ext = re.compile(r"\.([a-z\d]{2,4})([?#].*)?$", re.I)
    def validate_linkpage(self, page_url, WE_prefixes):
        # Filter arbitrarily too long links and bad WEs
        if not WE_prefixes or len(page_url) > max([len(p) for p in WE_prefixes if p]) + 50:
            return False
        # Filter links to files instead of webpages (formats stolen from scrapy/linkextractor.py)
        ext = self.re_extract_url_ext.search(page_url)
        if ext and ext.group(1).lower() in [
          # images
            'mng','pct','bmp','gif','jpg','jpeg','png','pst','psp','tif',
            'tiff','ai','drw','dxf','eps','ps','svg',
          # audio
            'mp3','wma','ogg','wav','ra','aac','mid','au','aiff',
          # video
            '3gp','asf','asx','avi','mov','mp4','mpg','qt','rm','swf','wmv','m4a',
          # office suites
            'xls','xlsx','ppt','pptx','doc','docx','odt','ods','odg','odp',
          # other
            'css','pdf','exe','bin','rss','zip','rar','js'
          ]:
            return False
        return True

    @inlineCallbacks
    def format_webentities(self, WEs, jobs=None, light=False, semilight=False, light_for_csv=False, weights=None, corpus=DEFAULT_CORPUS):
        if jobs == None:
            if not (test_bool_arg(light) or test_bool_arg(light_for_csv)):
                jobs = yield self.get_webentities_jobs(WEs, corpus=corpus)
            else: jobs = {}
        homepages = {}
        if not (test_bool_arg(light) or test_bool_arg(semilight) or test_bool_arg(light_for_csv)):
            homepages = yield self.get_webentities_missing_linkpages(WEs, corpus=corpus)
        links = None
        if not self.parent.corpus_ready(corpus):
            options = yield self.db.get_corpus(corpus)
            links = msgpack.unpackb(options["webentities_links"])
        returnD([self.format_webentity(WE, jobs.get(WE["_id"], {}), homepages.get(WE["_id"], None), light, semilight, light_for_csv, weight=(weights.get(WE["_id"], 0) if weights else None), corpus=corpus, _links=links) for WE in WEs])

    @inlineCallbacks
    def get_webentities_missing_linkpages(self, WEs, corpus=DEFAULT_CORPUS):
        homepages = {}
        homepWEs = [w for w in WEs if not w["homepage"]]
        results = yield DeferredList([self.traphs.call(corpus, "get_webentity_most_linked_pages", WE["_id"], WE["prefixes"], pages_count=50, max_depth=1) for WE in homepWEs], consumeErrors=True)
        res = []
        for i, (bl, pgs) in enumerate(results):
            WE = homepWEs[i]
            prefixes = []
            for l in WE["prefixes"]:
                try:
                    prefixes.append(urllru.lru_to_url(l))
                except:
                    logger.msg("A webentity (%s) has a badly defined prefix: %s" % (WE["_id"], l), system="WARNING - %s" % corpus)
            for pr in prefixes:
                if pr.startswith("http://www."):
                    homepages[WE["_id"]] = pr
                    break
            if not bl or is_error(pgs) or not len(pgs["result"]):
                continue
            for p in pgs["result"]:
                page_url = urllru.lru_to_url(p["lru"])
                if self.validate_linkpage(page_url, prefixes):
                    homepages[WE["_id"]] = page_url
                    if p["indegree"] > 2:
                        self.jsonrpc_set_webentity_homepage(WE["_id"], page_url, corpus=corpus, _declare_page=False, _automatic=True)
                        break
                else:
                    for pr in prefixes:
                        if page_url.startswith(pr):
                            homepages[WE["_id"]] = pr
                            break
        returnD(homepages)

    @inlineCallbacks
    def clear_traph(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        default_WECR = [cr["regexp"] for cr in self.corpora[corpus]["creation_rules"] if cr["prefix"] == "DEFAULT_WEBENTITY_CREATION_RULE"][0]
        WECRs = dict((cr["prefix"], cr["regexp"]) for cr in self.corpora[corpus]["creation_rules"] if cr["prefix"] != "DEFAULT_WEBENTITY_CREATION_RULE")
        res = yield self.traphs.call(corpus, "clear", default_WECR, WECRs)
        returnD(res)

    @inlineCallbacks
    def reinitialize(self, corpus=DEFAULT_CORPUS, _noloop=False, _quiet=False, _restart=True):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not _quiet:
            logger.msg("Empty Traph content", system="INFO - %s" % corpus)
        res = yield self.clear_traph(corpus)
        if is_error(res):
            returnD(res)
        if not _quiet:
            logger.msg("Traph emptied", system="INFO - %s" % corpus)
        if _restart:
            yield self._init_loop(corpus, _noloop=_noloop, _delay=True)
        returnD(format_result("Traph reinitialized"))

    @inlineCallbacks
    def return_new_webentity(self, lru_prefix, new=False, source=None, source_url=None, corpus=DEFAULT_CORPUS):
        weid = yield self.traphs.call(corpus, "retrieve_webentity", lru_prefix)
        if is_error(weid):
            returnD(weid)
        weid = weid["result"]
        WE = yield self.db.get_WE(corpus, weid)
        if not WE:
            returnD(format_error("Could not retrieve WE for prefix %s" % lru_prefix))
        if test_bool_arg(new):
            if source:
                yield self.jsonrpc_add_webentity_tag_value(weid, 'CORE', 'createdBy', "user via %s" % source, corpus=corpus, _automatic=True)
            self.corpora[corpus]['recent_changes'] += 1
            self.update_webentities_counts(WE, WE["status"], new=True, corpus=corpus)
        job = yield self.db.list_jobs(corpus, {'webentity_id': weid}, projection=['crawling_status', 'indexing_status'], sort=sortdesc('created_at'), limit=1)
        WE = self.format_webentity(WE, job, homepage=source_url, corpus=corpus)
        WE['created'] = True if new else False
        returnD(WE)

  # DEFINE WEBENTITIES

    @inlineCallbacks
    def declare_page(self, url, corpus=DEFAULT_CORPUS):
        try:
            url, lru = urllru.url_clean_and_convert(url, self.corpora[corpus]["tlds"])
        except ValueError as e:
            returnD(format_error(e))
        res = yield self.traphs.call(corpus, "add_page", lru)
        if is_error(res):
            returnD(res)
        new = False
        if res["result"]["created_webentities"]:
            new = True
            weid, prefixes = res["result"]["created_webentities"].items()[0]
            yield self.db.add_WE(corpus, weid, prefixes)
        res = yield self.return_new_webentity(lru, new, 'page', source_url=url, corpus=corpus)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_lru_definedprefixes(self, lru, corpus=DEFAULT_CORPUS, _include_homepages=False):
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
            weid = yield self.traphs.call(corpus, "get_webentity_by_prefix", prefix)
            if not is_error(weid):
                weid = weid["result"]
                WE = yield self.db.get_WE(corpus, weid)
                if not WE:
                    continue
                WEs.append({
                    "lru": prefix,
                    "stems_count": len(urllru.split_lru_in_stems(prefix, False)),
                    "id": weid,
                    "name": WE["name"]
                })
                if _include_homepages:
                    WEs[-1]["homepage"] = WE["homepage"]
        returnD(format_result(WEs))

    def jsonrpc_declare_webentity_by_lruprefix_as_url(self, url, name=None, status=None, startpages=[], lruVariations=True, tags={}, corpus=DEFAULT_CORPUS):
        """Creates for a `corpus` a WebEntity defined for the LRU prefix given as a `url` and optionnally for the corresponding http/https and www/no-www variations if `lruVariations` is true. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startpages`. Returns the newly created WebEntity."""
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        try:
            url, lru_prefix = urllru.url_clean_and_convert(url, self.corpora[corpus]["tlds"], False)
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_declare_webentity_by_lrus([lru_prefix], name, status, startpages, lruVariations, tags=tags, corpus=corpus)

    def jsonrpc_declare_webentity_by_lru(self, lru_prefix, name=None, status=None, startpages=[], lruVariations=True, tags={}, corpus=DEFAULT_CORPUS):
        """Creates for a `corpus` a WebEntity defined for a `lru_prefix` and optionnally for the corresponding http/https and www/no-www variations if `lruVariations` is true. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startpages`. Returns the newly created WebEntity."""
        return self.jsonrpc_declare_webentity_by_lrus([lru_prefix], name, status, startpages, lruVariations, tags=tags, corpus=corpus)

    def jsonrpc_declare_webentity_by_lrus_as_urls(self, list_urls, name=None, status=None, startpages=[], lruVariations=True, tags={}, corpus=DEFAULT_CORPUS):
        """Creates for a `corpus` a WebEntity defined for a set of LRU prefixes given as URLs under `list_urls` and optionnally for the corresponding http/https and www/no-www variations if `lruVariations` is true. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startpages`. Returns the newly created WebEntity."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not isinstance(list_urls, list):
            list_urls = [list_urls]
        list_lrus = []
        for url in list_urls:
            try:
                 _, lru = urllru.url_clean_and_convert(url, self.corpora[corpus]["tlds"], False)
                 list_lrus.append(lru)
            except ValueError as e:
                return format_error(e)
        return self.jsonrpc_declare_webentity_by_lrus(list_lrus, name, status, startpages, lruVariations, tags=tags, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_declare_webentity_by_lrus(self, list_lrus, name=None, status="", startpages=[], lruVariations=True, tags={}, corpus=DEFAULT_CORPUS):
        """Creates for a `corpus` a WebEntity defined for a set of LRU prefixes given as `list_lrus` and optionnally for the corresponding http/https and www/no-www variations if `lruVariations` is true. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startpages`. Returns the newly created WebEntity."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not isinstance(list_lrus, list):
            list_lrus = [list_lrus]
        lru_prefixes_set = set()
        for lru in list_lrus:
            for l in [lru] if not lruVariations else urllru.lru_variations(lru):
                lru_prefixes_set.add(l)
            if not name:
                try:
                    name = urllru.name_lru(l)
                except:
                    logger.msg("Could not extract name from LRU %s" % l, system="WARNING - %s" % corpus)
        lru_prefixes = list(lru_prefixes_set)
        weid = yield self.traphs.call(corpus, "create_webentity", lru_prefixes)
        if is_error(weid):
            returnD(weid)
        weid = weid["result"]["created_webentities"].keys()[0]
        if tags:
            for ns in tags:
                for cat in tags[ns]:
                    yield self.add_tags_to_dictionary(ns, cat, tags[ns][cat], corpus=corpus)
        if startpages:
            if not isinstance(startpages, list):
                startpages = [startpages]
            if "CORE-STARTPAGES" not in tags:
                tags["CORE-STARTPAGES"] = {"user": startpages}
            elif "user" not in tags["CORE-STARTPAGES"]:
                tags["CORE-STARTPAGES"]["user"] = startpages
            else:
                tags["CORE-STARTPAGES"]["user"] = list(set(tags["CORE-STARTPAGES"]["user"] + startpages))
            yield self.add_tags_to_dictionary("CORE-STARTPAGES", "user", startpages, corpus=corpus)
        WEstatus = "DISCOVERED"
        if status:
            WEstatus = status.upper()
            if WEstatus not in WEBENTITIES_STATUSES:
                returnD(format_error('Status %s is not a valid WebEntity Status, please provide one of the following values: %s' % (WEstatus, WEBENTITIES_STATUSES)))
        yield self.db.add_WE(corpus, weid, lru_prefixes, name, WEstatus, startpages, tags)
        new_WE = yield self.return_new_webentity(lru_prefixes[0], True, 'lru', corpus=corpus)
        if is_error(new_WE):
            returnD(new_WE)
        # Remove potential parent webentities homepages that would belong to the newly created WE
        parentWEs = yield self.traphs.call(corpus, "get_webentity_parent_webentities", new_WE["_id"], new_WE["prefixes"])
        if not is_error(parentWEs) and parentWEs["result"]:
            parentWEs = yield self.db.get_WEs(corpus, parentWEs["result"])
            for parent in parentWEs:
                if parent["homepage"] and urllru.has_prefix(urllru.url_to_lru_clean(parent["homepage"], self.corpora[corpus]["tlds"]), new_WE["prefixes"]):
                    if config['DEBUG']:
                        logger.msg("Removing homepage %s from parent WebEntity %s" % (parent["homepage"], parent["name"]), system="DEBUG - %s" % corpus)
                    self.jsonrpc_set_webentity_homepage(parent["_id"], "", corpus=corpus, _automatic=True)
        returnD(format_result(new_WE))


  # EDIT WEBENTITIES

    # TODO REWRITE AS MONGO DIRECT EDITS
    @inlineCallbacks
    def update_webentity(self, webentity_id, field_name, value, array_behavior=None, array_key=None, array_namespace=None, update_timestamp=True, corpus=DEFAULT_CORPUS, _commit=True):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        # Get WebEntity if webentity_id not already one from internal call
        try:
            tmpid = int(webentity_id["_id"])
            WE = webentity_id
            webentity_id = tmpid
        except:
            WE = yield self.db.get_WE(corpus, webentity_id)
            if not WE:
                returnD(format_error("ERROR could not retrieve WebEntity with id %s" % webentity_id))
        try:
            if array_behavior:
                if array_key:
                    tmparr = WE.get(field_name, {})
                    if array_namespace:
                        tmparr = tmparr[array_namespace] if array_namespace in tmparr else {}
                    arr = tmparr[array_key] if array_key in tmparr else []
                else:
                    arr = WE.get(field_name, [])
                values = value if isinstance(value, list) else [value]
                if array_behavior == "push":
                    for v in arr:
                        if not v:
                            arr.remove(v)
                    for v in values:
                        if v not in arr:
                            arr.append(v)
                elif array_behavior == "pop":
                    for v in values:
                        arr.remove(v)
                elif array_behavior == "update":
                    arr = values
                if array_key:
                    if not arr and array_key in tmparr:
                        del(tmparr[array_key])
                    else:
                        tmparr[array_key] = arr
                    if array_namespace:
                        tmparr2 = WE.get(field_name, {})
                        if not tmparr and array_namespace in tmparr2:
                            del(tmparr2[array_namespace])
                        else:
                            tmparr2[array_namespace] = tmparr
                        tmparr = tmparr2
                    arr = tmparr
                WE[field_name] = arr
            else:
                WE[field_name] = value
            if _commit:
                if len(WE["prefixes"]):
                    yield self.db.upsert_WE(corpus, webentity_id, WE, update_timestamp=update_timestamp)
                    if field_name == 'prefixes':
                        self.corpora[corpus]['recent_changes'] += 1
                    returnD(format_result("%s field of WebEntity %s updated." % (field_name, webentity_id)))
                else:
                    yield self.db.remove_WE(corpus, webentity_id)
                    yield self.db.update_jobs(corpus, {'webentity_id': WE["_id"]}, {'webentity_id': None, 'previous_webentity_id': WE["_id"], 'previous_webentity_name': WE["name"]})
                    self.corpora[corpus]['recent_changes'] += 1
                    self.update_webentities_counts(WE, WE["status"], deleted=True, corpus=corpus)
                    returnD(format_result("webentity %s had no LRUprefix left and was removed." % webentity_id))
            else:
                returnD(WE)
        except Exception as x:
            returnD(format_error("ERROR while updating field %s (%s %s) of WebEntity %s (%s: %s)" % (field_name, array_behavior, value, webentity_id, type(x), (x))))

    @inlineCallbacks
    def batch_webentities_edit(self, command, webentity_ids, corpus, *args, **kwargs):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not webentity_ids or type(webentity_ids) != list or type(webentity_ids[0]) != int:
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

    @inlineCallbacks
    def jsonrpc_basic_edit_webentity(self, webentity_id, name=None, status=None, homepage=None, corpus=DEFAULT_CORPUS):
        """Changes for a `corpus` at once the `name`\, `status` and `homepage` of a WebEntity defined by `webentity_id`."""
        res = {}
        WE = None
        if name:
            WE = yield self.jsonrpc_rename_webentity(webentity_id, name, corpus=corpus, _commit=(not homepage and not status))
            if is_error(WE):
                res['name'] = WE['message']
        if status:
            WE = yield self.jsonrpc_set_webentity_status(WE or webentity_id, status, corpus=corpus, _commit=(not homepage))
            if is_error(WE):
                res['status'] = WE['message']
        if homepage:
            WE = yield self.jsonrpc_set_webentity_homepage(WE or webentity_id, homepage, corpus=corpus)
            if is_error(WE):
                res['homepage'] = WE['message']
        if res:
            returnD(format_error(res))
        returnD(format_result("Webentity's basic metadata updated"))

    def jsonrpc_rename_webentity(self, webentity_id, new_name, corpus=DEFAULT_CORPUS, _commit=True):
        """Changes for a `corpus` the name of a WebEntity defined by `webentity_id` to `new_name`."""
        if not new_name or new_name == "":
            return format_error("ERROR: please specify a value for the WebEntity's name")
        return self.update_webentity(webentity_id, "name", new_name, corpus=corpus, _commit=_commit)

    @inlineCallbacks
    def jsonrpc_set_webentity_status(self, webentity_id, status, corpus=DEFAULT_CORPUS, _commit=True):
        """Changes for a `corpus` the status of a WebEntity defined by `webentity_id` to `status` (one of "in"/"out"/"undecided"/"discovered")."""
        status = status.upper()
        if status not in WEBENTITIES_STATUSES:
            returnD(format_error("ERROR: status argument must be one of '%s'" % "','".join(WEBENTITIES_STATUSES)))
        try:
            realid = webentity_id["_id"]
            oldWE = webentity_id
        except:
            realid = webentity_id
            oldWE = yield self.db.get_WE(corpus, webentity_id)
        res = yield self.update_webentity(oldWE, "status", status, corpus=corpus, _commit=_commit)
        if not is_error(res):
            self.update_webentities_counts(oldWE, status, corpus=corpus)
            if (not INCLUDE_LINKS_FROM_OUT and "OUT" in [status, oldWE["status"]]) or (not INCLUDE_LINKS_FROM_DISCOVERED and "DISCOVERED" in [status, oldWE["status"]]):
                reactor.callLater(0, self.rank_webentities, corpus)
        returnD(res)

    def update_webentities_counts(self, WE, newStatus, new=False, deleted=False, corpus=DEFAULT_CORPUS):
        oldStatus = WE["status"]
        if not new:
            if not deleted and oldStatus == newStatus:
                return
            self.corpora[corpus]["webentities_%s" % oldStatus.lower()] -= 1
        elif not deleted:
            self.corpora[corpus]["total_webentities"] += 1
        if not deleted:
            self.corpora[corpus]["webentities_%s" % newStatus.lower()] += 1
        elif not new:
            self.corpora[corpus]["total_webentities"] -= 1
        if "IN" in [oldStatus, newStatus]:
            categories = self.jsonrpc_get_tag_categories(namespace="USER", corpus=corpus).get("result", [])
        if oldStatus == "IN" and not new:
            if "USER" not in WE["tags"] or any([cat not in WE["tags"]["USER"] for cat in categories if cat != "FREETAGS"]):
                self.corpora[corpus]["webentities_in_untagged"] -= 1
            if not WE["crawled"]:
                self.corpora[corpus]["webentities_in_uncrawled"] -= 1
        if newStatus == "IN" and not deleted:
            if "USER" not in WE["tags"] or any([cat not in WE["tags"]["USER"] for cat in categories if cat != "FREETAGS"]):
                self.corpora[corpus]["webentities_in_untagged"] += 1
            if not WE["crawled"]:
                self.corpora[corpus]["webentities_in_uncrawled"] += 1

    def jsonrpc_set_webentities_status(self, webentity_ids, status, corpus=DEFAULT_CORPUS):
        """Changes for a `corpus` the status of a set of WebEntities defined by a list of `webentity_ids` to `status` (one of "in"/"out"/"undecided"/"discovered")."""
        return self.batch_webentities_edit("set_webentity_status", webentity_ids, corpus, status)

    @inlineCallbacks
    def jsonrpc_set_webentity_homepage(self, webentity_id, homepage="", corpus=DEFAULT_CORPUS, _declare_page=True, _automatic=False):
        """Changes for a `corpus` the homepage of a WebEntity defined by `webentity_id` to `homepage`."""
        homepage = (homepage or "").strip()
        try:
            realid = webentity_id["_id"]
        except:
            realid = webentity_id
        if homepage:
            try:
                homepage, _ = urllru.url_clean_and_convert(homepage, self.corpora[corpus]["tlds"])
            except ValueError as e:
                returnD(format_error(e))
            WE = yield self.jsonrpc_get_webentity_for_url(homepage, corpus)
            if is_error(WE) or WE["result"]["_id"] != realid:
                returnD(format_error("WARNING: this page does not belong to this WebEntity, you should either add the corresponding prefix or merge the other WebEntity."))
            if _declare_page:
                res = yield self.declare_page(homepage, corpus)
                if is_error(res):
                    logger.msg("ERROR while declaring homepage %s" % homepage, system="DEBUG - %s" % corpus)
                elif res["result"]["created"]:
                    returnD(format_error("WARNING: this page does not belong to this WebEntity, you should either add the corresponding prefix or merge the other WebEntity."))
        res = yield self.update_webentity(webentity_id, "homepage", homepage, update_timestamp=(not _automatic), corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_add_webentity_lruprefixes(self, webentity_id, lru_prefixes, corpus=DEFAULT_CORPUS):
        """Adds for a `corpus` a list of `lru_prefixes` (or a single one) to a WebEntity defined by `webentity_id`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if not isinstance(lru_prefixes, list):
            lru_prefixes = [lru_prefixes]
        clean_lrus = []
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("ERROR could not retrieve WebEntity with id %s" % webentity_id))
        for lru_prefix in lru_prefixes:
            try:
                url, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
            except ValueError as e:
                returnD(format_error(e))
            if lru_prefix in WE["prefixes"]:
                continue
            # Check if prefix is already attached to another WE
            old_WE = yield self.traphs.call(corpus, "get_webentity_by_prefix", lru_prefix)
            if not is_error(old_WE):
                old_WE = yield self.db.get_WE(corpus, old_WE["result"])
                # Remove potential homepage from old WE that would belong to the moved prefix
                if old_WE["homepage"] and urllru.has_prefix(urllru.url_to_lru_clean(old_WE["homepage"], self.corpora[corpus]["tlds"]), lru_prefixes):
                    if config['DEBUG']:
                        logger.msg("Removing homepage %s from parent WebEntity %s" % (old_WE["homepage"], old_WE["name"]), system="DEBUG - %s" % corpus)
                    yield self.jsonrpc_set_webentity_homepage(old_WE["_id"], "", corpus=corpus, _automatic=True)
                logger.msg("Removing LRUPrefix %s from WebEntity %s" % (lru_prefix, old_WE["name"]), system="INFO - %s" % corpus)
                res = yield self.jsonrpc_rm_webentity_lruprefix(old_WE["_id"], lru_prefix, corpus=corpus)
                if is_error(res):
                    returnD(res)
            # Otherwise check if new prefix is already contained by the WE: we might not need it
            elif urllru.has_prefix(lru_prefix, WE["prefixes"]):
                # Keep prefix if it triggers a CreationRule for a potential sub webentity
                CRprefix = yield self.traphs.call(corpus, "get_potential_prefix", lru_prefix)
                if not is_error(CRprefix) and CRprefix["result"] in WE["prefixes"]:
                    continue
            clean_lrus.append(lru_prefix)
            res = yield self.traphs.call(corpus, "add_prefix_to_webentity", lru_prefix, webentity_id)
            if is_error(res):
                returnD(res)
            WE = yield self.add_backend_tags(WE, "added", lru_prefix, namespace="PREFIXES", _commit=False, corpus=corpus)
            WE = yield self.jsonrpc_add_webentity_tag_value(WE, "CORE", "recrawlNeeded", "true", _commit=False, corpus=corpus)
            if "removed" in WE["tags"]["CORE-PREFIXES"] and lru_prefix in WE["tags"]["CORE-PREFIXES"]["removed"]:
                WE = yield self.jsonrpc_rm_webentity_tag_value(WE, "CORE-PREFIXES", "removed", lru_prefix, _commit=False, corpus=corpus)
        if not clean_lrus:
            returnD(format_success("No need to add these prefixes to this webentity"))
        res = yield self.update_webentity(WE, "prefixes", clean_lrus, "push", corpus=corpus)
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
        WE = yield self.add_backend_tags(webentity_id, "removed", lru_prefix, namespace="PREFIXES", _commit=False, corpus=corpus)
        WE = yield self.jsonrpc_add_webentity_tag_value(WE, "CORE", "recrawlNeeded", "true", _commit=False, corpus=corpus)
        if "added" in WE["tags"]["CORE-PREFIXES"] and lru_prefix in WE["tags"]["CORE-PREFIXES"]["added"]:
            WE = yield self.jsonrpc_rm_webentity_tag_value(WE, "CORE-PREFIXES", "added", lru_prefix,  _commit=False, corpus=corpus)
        res = yield self.traphs.call(corpus, "remove_prefix_from_webentity", lru_prefix, webentity_id)
        if is_error(res):
            returnD(res)
        res = yield self.update_webentity(WE, "prefixes", lru_prefix, "pop", corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_add_webentity_startpages(self, webentity_id, startpages_urls, corpus=DEFAULT_CORPUS, _automatic=False):
        """Adds for a `corpus` a list of `startpages_urls` to the list of startpages to use when crawling the WebEntity defined by `webentity_id`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        errors = []
        source = "auto" if _automatic else "user"
        WE = webentity_id
        if not isinstance(startpages_urls, list) and not isinstance(startpages_urls, set):
            startpages_urls = [startpages_urls]
        for startpage_url in startpages_urls:
            try:
                startpage_url, _ = urllru.url_clean_and_convert(startpage_url, self.corpora[corpus]["tlds"])
            except ValueError as e:
                errors.append('ERROR %s: %s' % (type(e), e))
                continue
            checkWE = yield self.jsonrpc_get_webentity_for_url(startpage_url, corpus)
            if is_error(checkWE) or checkWE["result"]["_id"] != webentity_id:
                errors.append('ERROR: %s does not belong to this WebEntity, you should either add the corresponding prefix or merge the other WebEntity.' % startpage_url)
                continue
            WE = yield self.add_backend_tags(WE, source, startpage_url, namespace="STARTPAGES", _commit=False, corpus=corpus)
            if "removed" in WE["tags"]["CORE-STARTPAGES"] and startpage_url in WE["tags"]["CORE-STARTPAGES"]["removed"]:
                WE = yield self.jsonrpc_rm_webentity_tag_value(WE, "CORE-STARTPAGES", "removed", startpage_url, _commit=False, corpus=corpus)
        if errors:
            if len(errors) == 1:
                errors = errors[0]
            returnD(format_error(errors))
        res = yield self.update_webentity(WE, "startpages", startpages_urls, "push", update_timestamp=(not _automatic), corpus=corpus)
        returnD(res)

    def jsonrpc_add_webentity_startpage(self, webentity_id, startpage_url, corpus=DEFAULT_CORPUS, _automatic=False):
        """Adds for a `corpus` a `startpage_url` to the list of startpages to use when crawling the WebEntity defined by `webentity_id`."""
        return self.jsonrpc_add_webentity_startpages(webentity_id, startpage_url, corpus=corpus, _automatic=False)

    @inlineCallbacks
    def jsonrpc_rm_webentity_startpages(self, webentity_id, startpages_urls, corpus=DEFAULT_CORPUS):
        """Removes for a `corpus` a list of `startpages_urls` from the list of startpages to use when crawling the WebEntity defined by `webentity_id."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        errors = []
        WE = webentity_id
        if not isinstance(startpages_urls, list):
            startpages_urls = [startpages_urls]
        for startpage_url in startpages_urls:
            try:
                startpage_url, _ = urllru.url_clean_and_convert(startpage_url, self.corpora[corpus]["tlds"])
            except ValueError as e:
                errors.append('ERROR %s: %s' % (type(e), e))
                continue
            WE = yield self.add_backend_tags(WE, "removed", startpage_url, namespace="STARTPAGES", _commit=False, corpus=corpus)
            if "user" in WE["tags"]["CORE-STARTPAGES"] and startpage_url in WE["tags"]["CORE-STARTPAGES"]["user"]:
                WE = yield self.jsonrpc_rm_webentity_tag_value(WE, "CORE-STARTPAGES", "user", startpage_url, _commit=False, corpus=corpus)
            if "auto" in WE["tags"]["CORE-STARTPAGES"] and startpage_url in WE["tags"]["CORE-STARTPAGES"]["auto"]:
                WE = yield self.jsonrpc_rm_webentity_tag_value(WE, "CORE-STARTPAGES", "auto", startpage_url, _commit=False, corpus=corpus)
        if errors:
            if len(errors) == 1:
                errors = errors[0]
            returnD(format_error(errors))
        res = yield self.update_webentity(WE, "startpages", startpages_urls, "pop", corpus=corpus)
        returnD(res)

    def jsonrpc_rm_webentity_startpage(self, webentity_id, startpage_url, corpus=DEFAULT_CORPUS):
        """Removes for a `corpus` a `startpage_url` from the list of startpages to use when crawling the WebEntity defined by `webentity_id."""
        return self.jsonrpc_rm_webentity_startpages(webentity_id, startpage_url, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_merge_webentity_into_another(self, old_webentity_id, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False, include_name_and_status=False, corpus=DEFAULT_CORPUS):
        """Assembles for a `corpus` 2 WebEntities by deleting WebEntity defined by `old_webentity_id` and adding all of its LRU prefixes to the one defined by `good_webentity_id`. Optionally set `include_tags` and/or `include_home_and_startpages_as_startpages` and/or `include_name_and_status` to "true" to also add the tags and/or startpages and/or name&status to the merged resulting WebEntity."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        old_webentity_id = int(old_webentity_id)
        good_webentity_id = int(good_webentity_id)
        if old_webentity_id == good_webentity_id:
            returnD(format_error('ERROR: old_webentity_id and good_webentity_id are identical: %s' % old_webentity_id))
        old_WE = yield self.db.get_WE(corpus, old_webentity_id)
        if not old_WE:
            returnD(format_error('ERROR retrieving WebEntity with id %s' % old_webentity_id))
        new_WE = yield self.db.get_WE(corpus, good_webentity_id)
        if not new_WE:
            returnD(format_error('ERROR retrieving WebEntity with id %s' % good_webentity_id))
        origLRUs = new_WE["prefixes"]
        yield self.db.remove_WE(corpus, old_WE["_id"])
        res = yield self.traphs.call(corpus, "delete_webentity", old_webentity_id, old_WE["prefixes"])
        if is_error(res):
            returnD(res)
        for lru in old_WE["prefixes"]:
            # check if new prefix is already contained by the WE: we might not need it
            if urllru.has_prefix(lru, origLRUs):
                # Keep prefix if it triggers a CreationRule for a potential sub webentity
                CRprefix = yield self.traphs.call(corpus, "get_potential_prefix", lru)
                if not is_error(CRprefix) and (CRprefix["result"] in origLRUs or not urllru.has_prefix(CRprefix["result"], origLRUs)):
                    continue
            new_WE["prefixes"].append(lru)
            res = yield self.traphs.call(corpus, "add_prefix_to_webentity", lru, good_webentity_id)
            if is_error(res):
                returnD(res)
            new_WE = yield self.add_backend_tags(new_WE, "added", lru, namespace="PREFIXES", _commit=False, corpus=corpus)
            if "removed" in new_WE["tags"]["CORE-PREFIXES"] and lru in new_WE["tags"]["CORE-PREFIXES"]["removed"]:
                new_WE = yield self.jsonrpc_rm_webentity_tag_value(new_WE, "CORE-PREFIXES", "removed", lru, _commit=False, corpus=corpus)
        if test_bool_arg(include_name_and_status):
            new_WE["name"] = old_WE["name"]
            new_WE["status"] = old_WE["status"]
        if test_bool_arg(include_home_and_startpages_as_startpages):
            if not old_WE["startpages"]:
                old_WE["startpages"] = []
            if old_WE["homepage"]:
                old_WE["startpages"].append(old_WE["homepage"])
            if not new_WE["startpages"]:
                new_WE["startpages"] = []
            for page in old_WE["startpages"]:
                new_WE["startpages"].append(page)
                if "CORE-STARTPAGES" in old_WE["tags"] and not include_tags:
                    if "CORE-STARTPAGES" not in new_WE["tags"]:
                        new_WE["tags"]["CORE-STARTPAGES"] = {}
                    for cat in "user", "auto", "removed":
                        if cat not in old_WE["tags"]["CORE-STARTPAGES"]:
                            continue
                        if cat not in new_WE["tags"]["CORE-STARTPAGES"]:
                            new_WE["tags"]["CORE-STARTPAGES"][cat] = []
                        new_WE["tags"]["CORE-STARTPAGES"][cat] = list(set(old_WE["tags"]["CORE-STARTPAGES"][cat] + new_WE["tags"]["CORE-STARTPAGES"][cat]))
        if test_bool_arg(include_tags):
            for tag_namespace in old_WE["tags"].keys():
                if tag_namespace == "CORE-STARTPAGES" and not include_home_and_startpages_as_startpages:
                    continue
                if tag_namespace not in new_WE["tags"]:
                    new_WE["tags"][tag_namespace] = {}
                for tag_key in old_WE["tags"][tag_namespace].keys():
                    if tag_key not in new_WE["tags"][tag_namespace]:
                        new_WE["tags"][tag_namespace][tag_key] = []
                    for tag_val in old_WE["tags"][tag_namespace][tag_key]:
                        if tag_val not in new_WE["tags"][tag_namespace][tag_key]:
                            new_WE["tags"][tag_namespace][tag_key].append(tag_val)
        yield self.db.update_jobs(corpus, {'webentity_id': old_WE["_id"]}, {'webentity_id': new_WE["_id"], 'previous_webentity_id': old_WE["_id"], 'previous_webentity_name': old_WE["name"]})
        new_WE = yield self.add_backend_tags(new_WE, "mergedWebEntities", "%s: %s (%s)" % (old_WE["_id"], old_WE["name"], old_WE["status"]), _commit=False, corpus=corpus)
        new_WE = yield self.jsonrpc_add_webentity_tag_value(new_WE, "CORE", "recrawlNeeded", "true", _commit=False, corpus=corpus)
        yield self.db.upsert_WE(corpus, good_webentity_id, new_WE)
        self.corpora[corpus]['recent_changes'] += 1
        self.update_webentities_counts(old_WE, new_WE["status"], deleted=True, corpus=corpus)
        returnD(format_result("Merged %s into %s" % (old_webentity_id, good_webentity_id)))

    def jsonrpc_merge_webentities_into_another(self, old_webentity_ids, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False, corpus=DEFAULT_CORPUS):
        """Assembles for a `corpus` a bunch of WebEntities by deleting WebEntities defined by a list of `old_webentity_ids` and adding all of their LRU prefixes to the one defined by `good_webentity_id`. Optionally set `include_tags` and/or `include_home_and_startpages_as_startpages` to "true" to also add the tags and/or startpages to the merged resulting WebEntity."""
        return self.batch_webentities_edit("merge_webentity_into_another", old_webentity_ids, corpus, good_webentity_id, include_tags=include_tags, include_home_and_startpages_as_startpages=include_home_and_startpages_as_startpages, async=False)

    @inlineCallbacks
    def jsonrpc_delete_webentity(self, webentity_id, corpus=DEFAULT_CORPUS):
        """Removes from a `corpus` a WebEntity defined by `webentity_id` (mainly for advanced debug use)."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error('ERROR retrieving WebEntity with id %s' % webentity_id))
        yield self.db.remove_WE(corpus, WE["_id"])
        res = yield self.traphs.call(corpus, "delete_webentity", WE["_id"], WE["prefixes"])
        if is_error(res):
            returnD(res)
        yield self.db.update_jobs(corpus, {'webentity_id': WE["_id"]}, {'webentity_id': None, 'previous_webentity_id': WE["_id"], 'previous_webentity_name': WE["name"]})
        self.corpora[corpus]['recent_changes'] += 1
        self.update_webentities_counts(WE, WE["status"], deleted=True, corpus=corpus)
        returnD(format_result("WebEntity %s (%s) was removed" % (webentity_id, WE["name"])))


    @inlineCallbacks
    def index_batch(self, page_items, job, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(False)
        if not page_items:
            returnD(False)

        page_queue_ids = [str(record['_id']) for record in page_items]

        # TODO handle here setting depth/error/timestamp on crawled pages?

        batchpages = {}
        n_batchlinks = 0
        autostarts = set(job.get('crawl_arguments', {}).get('start_urls_auto', []))
        goodautostarts = set()
        for p in page_items:
            links = p.get("lrulinks", [])
            n_batchlinks += len(links)
            batchpages[p["lru"]] = links
            if autostarts and p["depth"] == 0 and p["url"] in autostarts:
                autostarts.remove(p["url"])
                if p["status"] == 200:
                    goodautostarts.add(p["url"])
                elif 300 <= p["status"] < 400 and links:
                    goodautostarts.add(urllru.lru_to_url(links[0]))
        if job['webentity_id']:
            yield self.jsonrpc_add_webentity_startpages(job['webentity_id'], list(goodautostarts), corpus=corpus, _automatic=True)
        logger.msg("...batch of %s crawled pages with %s links prepared..." % (len(batchpages), n_batchlinks), system="INFO - %s" % corpus)
        s = time.time()

        res = yield self.traphs.call(corpus, "index_batch_crawl", batchpages)
        if is_error(res):
            logger.msg(res['message'], system="ERROR - %s" % corpus)
            returnD(res)
        res = res["result"]
        nb_pages = res["nb_created_pages"]
        logger.msg("...%s unique pages indexed in traph in %ss..." % (nb_pages, time.time()-s), system="INFO - %s" % corpus)
        s = time.time()

        # Create new webentities
        yield self.db.add_WEs(corpus, res["created_webentities"])
        new = len(res["created_webentities"])
        self.corpora[corpus]['total_webentities'] += new
        self.corpora[corpus]['webentities_discovered'] += new
        logger.msg("...%s new WEs created in traph in %ss" % (new, time.time()-s), system="INFO - %s" % corpus)

        yield self.db.clean_queue(corpus, page_queue_ids)

        crawled_pages_left = yield self.db.count_queue(corpus, job['crawljob_id'])
        tot_crawled_pages = yield self.db.count_pages(corpus, job['crawljob_id'])
        if job['_id'] != 'unknown':
            update = {
                'nb_crawled_pages': tot_crawled_pages,
                'nb_unindexed_pages': crawled_pages_left,
                'indexing_status': indexing_statuses.BATCH_FINISHED
            }
            if job['crawling_status'] == crawling_statuses.PENDING:
                update['crawling_status'] = crawling_statuses.RUNNING
                update["started_at"] = now_ts()
            yield self.db.update_jobs(corpus, job['_id'], update, inc={'nb_pages': nb_pages, 'nb_links': n_batchlinks})
            yield self.db.add_log(corpus, job['_id'], "INDEX_"+indexing_statuses.BATCH_FINISHED)

        returnD(True)

    @inlineCallbacks
    def rank_webentities(self, corpus=DEFAULT_CORPUS, include_links_from_OUT=INCLUDE_LINKS_FROM_OUT, include_links_from_DISCOVERED=INCLUDE_LINKS_FROM_DISCOVERED):
        if corpus not in self.corpora or not self.corpora[corpus]["webentities_links"]:
            returnD(None)
        inlinks = defaultdict(set)
        outlinks = defaultdict(set)
        alllinks = defaultdict(set)
        if not (include_links_from_OUT and include_links_from_DISCOVERED):
            statuses_to_keep = ["IN", "UNDECIDED"]
            if include_links_from_OUT:
                statuses_to_keep.append("OUT")
            if include_links_from_DISCOVERED:
                statuses_to_keep.append("DISCOVERED")
            WEs_to_keep = yield self.db.get_WEs(corpus, {"status": {"$in": statuses_to_keep}}, projection=["_id"])
            WEs_to_keep = set(we["_id"] for we in WEs_to_keep)
        for target, links in self.corpora[corpus]['webentities_links'].items():
            for key in ['crawled', 'uncrawled', 'total']:
                if 'pages_'+key not in links:
                    links['pages_'+key] = 0
            links['pages_total'] = links['pages_crawled'] + links['pages_uncrawled']
            for key in ['undirected_', 'in', 'out']:
                links[key + 'degree'] = links.get(key + 'degree', 0)
            for source in links:
                # Filter links coming from WEs OUT or DISCOVERED if undesired
                if not (include_links_from_OUT and include_links_from_DISCOVERED) and source not in WEs_to_keep:
                    continue
                if isinstance(source, int):
                    outlinks[source].add(target)
                    alllinks[source].add(target)
                    alllinks[target].add(source)
                    inlinks[target].add(source)
        for target, links in self.corpora[corpus]['webentities_links'].items():
            links["undirected_degree"] = len(alllinks[target])
            links["indegree"] = len(inlinks[target])
            links["outdegree"] = len(outlinks[target])
        yield self.parent.update_corpus(corpus, False, True)

    @inlineCallbacks
    def index_batch_loop(self, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus) or self.corpora[corpus]['loop_running']:
            returnD(False)
        if self.corpora[corpus]['reset']:
            yield self.db.queue(corpus).drop()
            yield self.clear_traph(corpus)
            returnD(None)
        self.corpora[corpus]['loop_running'] = "Diagnosing"
        yield self.count_webentities(corpus)
        crashed = yield self.db.list_jobs(corpus, {'indexing_status': indexing_statuses.BATCH_RUNNING}, projection=[], limit=1)
        if crashed:
            self.corpora[corpus]['loop_running'] = "Cleaning up index error"
            logger.msg("Indexing job declared as running but probably crashed, trying to restart it.", system="WARNING - %s" % corpus)
            yield self.db.update_jobs(corpus, crashed['_id'], {'indexing_status': indexing_statuses.BATCH_CRASHED})
            yield self.db.add_log(corpus, crashed['_id'], "INDEX_"+indexing_statuses.BATCH_CRASHED)
            self.corpora[corpus]['loop_running'] = None
            returnD(False)
        oldest_page_in_queue = yield self.db.get_queue(corpus, limit=1, projection=["_job"], skip=randint(0, 2))
        if oldest_page_in_queue:
            # find next job to be indexed and set its indexing status to batch_running
            self.corpora[corpus]['loop_running'] = "Indexing crawled pages"
            job = yield self.db.list_jobs(corpus, {'crawljob_id': oldest_page_in_queue['_job'], 'indexing_status': {'$ne': indexing_statuses.BATCH_RUNNING}}, projection=['crawljob_id', 'crawl_arguments', 'webentity_id', 'crawling_status'], limit=1)
            if not job:
                jobs = yield self.db.list_jobs(corpus)
                if not jobs:
                    self.corpora[corpus]['reset'] = True
                    yield self.db.queue(corpus).drop()
                    yield self.clear_traph(corpus)
                    self.corpora[corpus]['reset'] = False
                    returnD(None)
                logger.msg("Indexing job with pages in queue but not found in jobs: %s" % oldest_page_in_queue['_job'], system="WARNING - %s" % corpus)
                job = {
                  '_id': 'unknown',
                  'crawljob_id': oldest_page_in_queue['_job'],
                  'webentity_id': None,
                  'crawling_status': None
                }
            page_items = yield self.db.get_queue(corpus, {'_job': job['crawljob_id']}, limit=config['traph']['max_simul_pages_indexing'])
            if page_items:
                logger.msg("Indexing %s pages from job %s..." % (len(page_items), job['_id']), system="INFO - %s" % corpus)
                if job['_id'] != 'unknown':
                    yield self.db.update_jobs(corpus, job['_id'], {'indexing_status': indexing_statuses.BATCH_RUNNING})
                    yield self.db.add_log(corpus, job['_id'], "INDEX_"+indexing_statuses.BATCH_RUNNING)
                self.corpora[corpus]['loop_running_since'] = now_ts()
                res = yield self.index_batch(page_items, job, corpus=corpus)
                if is_error(res):
                    logger.msg(res['message'], system="ERROR - %s" % corpus)
                    self.corpora[corpus]['loop_running'] = None
                    returnD(False)
                self.corpora[corpus]['recent_changes'] += len(page_items)/float(config['traph']['max_simul_pages_indexing'])
            else:
                logger.msg("job %s found for index but no page corresponding found in queue." % job['_id'], system="WARNING - %s" % corpus)
            self.corpora[corpus]['last_index_loop'] = now_ts()

        # Run linking WebEntities on a regular basis when needed and not overloaded
        now = now_ts()
        s = time.time()
        # Build links after at least one index if no more than 25000 pages in queue and...
        pages_crawled = yield self.db.check_pages(corpus)
        if pages_crawled and corpus in self.corpora and self.corpora[corpus]['recent_changes'] and self.corpora[corpus]['pages_queued'] < 25000 and (
            # pagesqueue is empty
            not self.corpora[corpus]['pages_queued'] or
            # links were not built since more than 8 times the time it takes
            (s - self.corpora[corpus]['last_links_loop'] > 8 * self.corpora[corpus]['links_duration'])
          ):
            logger.msg("Processing new WebEntity links...", system="INFO - %s" % corpus)
            self.corpora[corpus]['loop_running'] = "Building webentities links"
            self.corpora[corpus]['loop_running_since'] = now_ts()
            yield self.db.add_log(corpus, "WE_LINKS", "Starting WebEntity links generation...")
            WElinks = yield self.traphs.call(corpus, "get_webentities_inlinks", include_auto=False)
            if is_error(WElinks):
                logger.msg(WElinks['message'], system="ERROR - %s" % corpus)
                self.corpora[corpus]['loop_running'] = None
                returnD(None)
            self.corpora[corpus]['webentities_links'] = WElinks["result"]
            self.corpora[corpus]['last_links_loop'] = time.time()
            yield self.rank_webentities(corpus)
            self.corpora[corpus]['recent_changes'] = 0
            s = time.time() - s
            self.corpora[corpus]['links_duration'] = max(s, self.corpora[corpus]['links_duration'])
            if self.corpora[corpus]['links_duration'] > self.corpora[corpus]['options']['keepalive']/2:
                yield self.parent.jsonrpc_set_corpus_options(corpus, {"keepalive": int(self.corpora[corpus]['links_duration'] * 2)})
            logger.msg("...got WebEntity links in %ss." % s, system="INFO - %s" % corpus)
        if self.corpora[corpus]['reset']:
            yield self.clear_traph(corpus)
        self.corpora[corpus]['loop_running'] = None

    @inlineCallbacks
    def handle_index_error(self, corpus=DEFAULT_CORPUS):
        # clean possible previous index crashes
        res = yield self.db.list_jobs(corpus, {'indexing_status': indexing_statuses.BATCH_CRASHED}, projection=[])
        update_ids = [job['_id'] for job in res]
        if len(update_ids):
            yield self.db.update_jobs(corpus, update_ids, {'indexing_status': indexing_statuses.PENDING})
            yield self.db.add_log(corpus, update_ids, "INDEX_"+indexing_statuses.PENDING)

  # RETRIEVE AND SEARCH WEBENTITIES

    @inlineCallbacks
    def count_webentities(self, corpus=DEFAULT_CORPUS):
        if corpus not in self.corpora:
            returnD(None)
        ins  = yield self.db.count_WEs(corpus, {"status": "IN"})
        nocr = yield self.db.count_WEs(corpus, {"status": "IN", "crawled": False})
        outs = yield self.db.count_WEs(corpus, {"status": "OUT"})
        unds = yield self.db.count_WEs(corpus, {"status": "UNDECIDED"})
        disc = yield self.db.count_WEs(corpus, {"status": "DISCOVERED"})
        query = {"status": "IN", "$or": [{"tags.USER": {"$exists": False}}]}
        for cat in self.jsonrpc_get_tag_categories(namespace="USER", corpus=corpus).get("result", []):
            if cat == "FREETAGS":
                continue
            query["$or"].append({"tags.USER.%s" % cat: {"$exists": False}})
        notg = yield self.db.count_WEs(corpus, query)
        if corpus not in self.corpora:
            returnD(None)
        self.corpora[corpus]['webentities_in'] = ins
        self.corpora[corpus]['webentities_in_untagged'] = notg
        self.corpora[corpus]['webentities_in_uncrawled'] = nocr
        self.corpora[corpus]['webentities_out'] = outs
        self.corpora[corpus]['webentities_undecided'] = unds
        self.corpora[corpus]['webentities_discovered'] = disc
        self.corpora[corpus]['total_webentities'] = ins + outs + unds + disc
        yield self.parent.update_corpus(corpus)

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
        weid = yield self.traphs.call(corpus, "get_webentity_by_prefix", lru_prefix)
        if is_error(weid):
            returnD(weid)
        weid = weid["result"]
        WE = yield self.db.get_WE(corpus, weid)
        job = yield self.db.list_jobs(corpus, {'webentity_id': WE}, projection=['crawling_status', 'indexing_status'], sort=sortdesc('created_at'), limit=1)
        returnD(format_result(self.format_webentity(WE, job, corpus=corpus)))

    def jsonrpc_get_webentity_by_lruprefix_as_url(self, url, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the WebEntity having one of its LRU prefixes corresponding to the LRU fiven under the form of a `url`."""
        try:
            _, lru = urllru.url_clean_and_convert(url, self.corpora[corpus]["tlds"])
        except ValueError as e:
            return format_error(e)
        return self.jsonrpc_get_webentity_by_lruprefix(lru, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentity_for_url(self, url, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the WebEntity to which a `url` belongs (meaning starting with one of the WebEntity's prefix and not another)."""
        try:
            _, lru = urllru.url_clean_and_convert(url, self.corpora[corpus]["tlds"])
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
        weid = yield self.traphs.call(corpus, "retrieve_webentity", lru)
        if is_error(weid):
            returnD(weid)
        weid = weid["result"]
        WE = yield self.db.get_WE(corpus, weid)
        if not WE:
            returnD(format_error("WebEntity %s could not be retrieved from mongo" % weid))
        job = yield self.db.list_jobs(corpus, {'webentity_id': WE["_id"]}, projection=['crawling_status', 'indexing_status'], sort=sortdesc('created_at'), limit=1)
        returnD(format_result(self.format_webentity(WE, job, corpus=corpus)))

    def _checkPageCount(self, page, count):
        try:
            page = int(page)
            count = int(count)
        except:
            return None, None
        return page, count

    @inlineCallbacks
    def format_WE_page(self, total, count, page, WEs, token=None, corpus=DEFAULT_CORPUS):
        jobs = {}
        res = yield self.db.list_jobs(corpus, {'webentity_id': {'$in': [WE["_id"] for WE in WEs]}}, projection=['webentity_id', 'crawling_status', 'indexing_status'])
        for job in res:
            jobs[job['webentity_id']] = job
        for WE in WEs:
            if WE["_id"] in jobs:
                WE['crawling_status'] = jobs[WE["_id"]]['crawling_status']
                WE['indexing_status'] = jobs[WE["_id"]]['indexing_status']
            else:
                WE['crawling_status'] = crawling_statuses.UNCRAWLED
                WE['indexing_status'] = indexing_statuses.UNINDEXED

        res = {
            "total_results": total,
            "count": count,
            "page": page,
            "webentities": WEs,
            "token": token,
            "last_page": int((total+1)/count) if total else 0,
            "previous_page": None,
            "next_page": None
        }
        if page > 0:
            res["previous_page"] = min(res["last_page"], page - 1)
        if (page+1)*count < total:
            res["next_page"] = page + 1
        returnD(format_result(res))

    format_field = lambda _,x: x.upper() if type(x) in [str, unicode] else x
    @inlineCallbacks
    def paginate_webentities(self, WEs, count, page, light=False, semilight=False, light_for_csv=False, sort=None, weights=None, corpus=DEFAULT_CORPUS):
        jobs = None
        if sort and WEs:
            if type(sort) != list:
                sort = [sort]
            if "crawled" in " ".join(sort).lower():
                jobs = yield self.get_webentities_jobs(WEs, corpus=corpus)
            for sortkey in reversed(sort):
                key = sortkey.lstrip("-")
                reverse = (key != sortkey)
                if self.sortargs_accessor(WEs[0], key, jobs=jobs, weights=weights, corpus=corpus) != None:
                    WEs = sorted(WEs, key=lambda x: self.format_field(self.sortargs_accessor(x, key, jobs=jobs, weights=weights, corpus=corpus)), reverse=reverse)

        if count == -1 or len(WEs) <= count or light_for_csv:
            res = yield self.format_webentities(WEs, jobs=jobs, light=light, semilight=semilight, light_for_csv=light_for_csv, weights=weights, corpus=corpus)
            if count == -1:
                returnD(format_result(res))
            respage = yield self.format_WE_page(len(res), count, page, res, corpus=corpus)
            returnD(respage)

        subset = WEs[page*count:(page+1)*count]
        subset = yield self.format_webentities(subset, jobs=jobs, light=light, semilight=semilight, light_for_csv=light_for_csv, corpus=corpus)
        if not weights:
            ids = [[w["_id"], w["name"]] for w in WEs]
        else:
            ids = [[w["_id"], w["name"], weights.get(w["_id"], 0)] for w in WEs]
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
    def jsonrpc_get_webentities(self, list_ids=[], sort=None, count=100, page=0, light=False, semilight=False, light_for_csv=False, corpus=DEFAULT_CORPUS, _weights=None):
        """Returns for a `corpus` all existing WebEntities or only the WebEntities whose id is among `list_ids`.\nResults will be paginated with a total number of returned results of `count` and `page` the number of the desired page of results. Returns all results at once if `list_ids` is provided or `count` == -1 ; otherwise results will include metadata on the request including the total number of results and a `token` to be reused to collect the other pages via `get_webentities_page`.\nOther possible options include:\n- order the results with `sort` by inputting a field or list of fields as named in the WebEntities returned objects; optionally prefix a sort field with a "-" to revert the sorting on it; for instance: `["-indegree"\, "name"]` will order by maximum indegree first then by alphabetic order of names\n- set `light` or `semilight` or `light_for_csv` to "true" to collect lighter data with less WebEntities fields."""
        page, count = self._checkPageCount(page, count)
        if page is None:
            returnD(format_error("page and count arguments must be integers"))
        if isinstance(list_ids, int):
            list_ids = [list_ids] if list_ids else []
        list_ids = [i for i in list_ids if i]
        n_WEs = len(list_ids) if list_ids else 0
        if n_WEs:
            WEs = yield self.db.get_WEs(corpus, list_ids)
            count = -1
        else:
            WEs = yield self.db.get_WEs(corpus)
            if is_error(WEs):
                returnD(WEs)
        res = yield self.paginate_webentities(WEs, count, page, light=light, semilight=semilight, light_for_csv=light_for_csv, sort=sort, weights=_weights, corpus=corpus)
        returnD(res)

    re_regexp_special_chars = re.compile(r"([.?+*^${}()[\]|\\])")
    def escape_regexp(self, query):
        query = self.re_regexp_special_chars.sub(r"\\\1", query)
        return re.compile(r"%s" % query, re.I)

    @inlineCallbacks
    def jsonrpc_search_webentities(self, allFieldsKeywords=[], fieldKeywords=[], sort=None, count=100, page=0, light=False, semilight=True, corpus=DEFAULT_CORPUS, _exactSearch=False):
        """Returns for a `corpus` all WebEntities matching a specific search using the `allFieldsKeywords` and `fieldKeywords` arguments.\nReturns all results at once if `count` == -1 ; otherwise results will be paginated with `count` results per page\, using `page` as index of the desired page. Results will include metadata on the request including the total number of results and a `token` to be reused to collect the other pages via `get_webentities_page`.\n- `allFieldsKeywords` should be a string or list of strings to search in all textual fields of the WebEntities ("name"\, "lru prefixes"\, "startpages" & "homepage"). For instance `["hyphe"\, "www"]`\n- `fieldKeywords` should be a list of 2-elements arrays giving first the field to search into then the searched value or optionally for the field "indegree" an array of a minimum and maximum values to search into (notes: this does not work with undirected_degree and outdegree ; only exact values will be matched when querying on field status field). For instance: `[["name"\, "hyphe"]\, ["indegree"\, [3\, 1000]]]`\n- see description of `sort`\, `light` and `semilight` in `get_webentities` above."""
        indegree_filter = False
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        page, count = self._checkPageCount(page, count)
        if page is None:
            returnD(format_error("page and count arguments must be integers"))
        query = {}
        if type(allFieldsKeywords) is unicode:
            allFieldsKeywords = [allFieldsKeywords]
        if not (type(allFieldsKeywords) is list and type(fieldKeywords) is list):
            returnD(format_error("ERROR: Both arguments must be lists."))
        for k in allFieldsKeywords:
            if not (k and type(k) in [str, unicode]):
                returnD(format_error("ERROR: allFieldsKeywords must be a list of strings."))
            if _exactSearch:
                if not "$text" in query:
                    query["$text"] = {"$search": k}
                else: query["$text"]["$seach"] += " %s" % k
            else:
                regexp = self.escape_regexp(k)
                if "$and" not in query:
                    query["$and"] = []
                query["$and"].append({"$or": [{f: regexp} for f in ["name", "prefixes", "startpages", "homepage"]]})
        for kv in fieldKeywords:
            if type(kv) is list and len(kv) == 2 and kv[0] and kv[1] and type(kv[0]) in [str, unicode] and type(kv[1]) in [str, unicode]:
                if "$and" not in query:
                    query["$and"] = []
                exactSearch = _exactSearch or kv[0] == "status"
                kv[1] = kv[1].strip()
                if kv[0] == "status":
                    kv[1] = kv[1].upper()
                if " " in kv[1]:
                    query["$and"].append({"$or": [{kv[0]: v if exactSearch else self.escape_regexp(v)} for v in kv[1].split(" ")]})
                else:
                    query["$and"].append({kv[0]: kv[1] if exactSearch else self.escape_regexp(kv[1])})
            elif type(kv) is list and len(kv) == 2 and kv[0] and kv[1] and type(kv[0]) in [str, unicode] and type(kv[1]) is list and len(kv[1]) == 2 and type(kv[1][0]) in [int, float] and type(kv[1][1]) in [int, float]:
                indegree_filter = kv[1]
            else:
                returnD(format_error('ERROR: fieldKeywords must be a list of two-string-elements lists or ["indegree", [min_int, max_int]]. %s' % fieldKeywords))
        WEs = yield self.db.get_WEs(corpus, query)
        if indegree_filter:
            WEs = [w for w in WEs if self.corpora[corpus]["webentities_links"].get(WE["_id"], {}).get('indegree', 0) >= indegree_filter[0] and self.corpora[corpus]["webentities_links"].get(WE["_id"], {}).get('indegree', 0) <= indegree_filter[1]]

        res = yield self.paginate_webentities(WEs, count, page, sort=sort, light=light, semilight=semilight, corpus=corpus)
        returnD(res)

    def jsonrpc_wordsearch_webentities(self, allFieldsKeywords=[], fieldKeywords=[], sort=None, count=100, page=0, light=False, semilight=True, corpus=DEFAULT_CORPUS):
        """Same as `search_webentities` except that search is only matching exact full words, and that `allFieldsKeywords` query also search into tags values."""
        return self.jsonrpc_search_webentities(allFieldsKeywords, fieldKeywords, sort, count, page, light, semilight, corpus, True)

    @inlineCallbacks
    def jsonrpc_get_webentities_by_status(self, status, sort=None, count=100, page=0, light=False, semilight=True, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having their status equal to `status` (one of "in"/"out"/"undecided"/"discovered").\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`."""
        status = status.upper()
        if status not in WEBENTITIES_STATUSES:
            returnD(format_error("status argument must be one of %s" % ",".join(valid_statuses)))
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        page, count = self._checkPageCount(page, count)
        if page is None:
            returnD(format_error("page and count arguments must be integers"))
        WEs = yield self.db.get_WEs(corpus, {"status": status})
        res = yield self.paginate_webentities(WEs, count, page, sort=sort, light=light, semilight=semilight, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentities_by_name(self, name, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having their name equal to `name`.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`."""
        page, count = self._checkPageCount(page, count)
        if page is None:
            returnD(format_error("page and count arguments must be integers"))
        WEs = yield self.db.get_WEs(corpus, {"name": name})
        res = yield self.paginate_webentities(WEs, count, page, sort=sort, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentities_by_tag_value(self, value, namespace=None, category=None, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having at least one tag in any namespace/category equal to `value`.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`."""
        namespace = self._cleanupTagsKey(namespace)
        category = self._cleanupTagsKey(category)
        value = value.strip()
        page, count = self._checkPageCount(page, count)
        if page is None:
            returnD(format_error("page and count arguments must be integers"))
        if namespace and category:
            query = {"tags.%s.%s": value}
        elif namespace:
            query = {"$where":
              """function() {
                if (!this.tags["%s"])
                  return false;
                for (var cat in this.tags["%s"])
                  if (!!~this.tags["%s"][cat].indexOf("%s"))
                    return true;
                return false;
              }""" % (namespace, namespace, value)
            }
        elif category:
            query = {"$where":
              """function() {
                for (var ns in this.tags)
                 if (this.tags[ns]["%s"] && !!~this.tags[ns]["%s"].indexOf("%s"))
                    return true;
                return false;
              }""" % (category, category, value)
            }
        else:
            query = {"$where":
              """function() {
                for (var ns in this.tags)
                  for (var cat in this.tags[ns])
                    if (!!~this.tags[ns][cat].indexOf("%s"))
                      return true;
                return false;
              }""" % value
            }
        WEs = yield self.db.get_WEs(corpus, query)
        res = yield self.paginate_webentities(WEs, count, page, sort=sort, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentities_by_tag_category(self, namespace, category, sort=None, count=100, page=0, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities having at least one tag in a specific `category` for a specific `namespace`.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`."""
        namespace = self._cleanupTagsKey(namespace)
        category = self._cleanupTagsKey(category)
        page, count = self._checkPageCount(page, count)
        if page is None:
            returnD(format_error("page and count arguments must be integers"))
        WEs = yield self.db.get_WEs(corpus, {"tags.%s.%s" % (namespace, category): {"$exists": True}})
        res = yield self.paginate_webentities(WEs, count, page, sort=sort, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentities_mistagged(self, status='IN', missing_a_category=False, multiple_values=False, sort=None, count=100, page=0, light=False, semilight=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities of status `status` with no tag of the namespace "USER" or multiple tags for some USER categories if `multiple_values` is true or no tag for at least one existing USER category if `missing_a_category` is true.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        page, count = self._checkPageCount(page, count)
        if page is None:
            returnD(format_error("page and count arguments must be integers"))
        status = status.upper()
        if status not in WEBENTITIES_STATUSES:
            returnD(format_error("status argument must be one of %s" % ",".join(WEBENTITIES_STATUSES)))
        query = {"status": status}
        if missing_a_category or multiple_values:
            checker = {"$exists": True, "$not": {"$size": 1}} if multiple_values else {"$exists": False}
            categories = self.jsonrpc_get_tag_categories(namespace="USER", corpus=corpus).get("result", [])
            if categories:
                query["$or"] = [{"tags.USER.%s" % cat: checker} for cat in categories]
        else:
            query["tags.USER"] = {"$exists": False}
        WEs = yield self.db.get_WEs(corpus, query)
        res = yield self.paginate_webentities(WEs, count=count, page=page, sort=sort, light=light, semilight=semilight, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentities_uncrawled(self, sort=None, count=100, page=0, light=False, semilight=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all IN WebEntities which have no crawljob associated with it.\nResults are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        page, count = self._checkPageCount(page, count)
        if page is None:
            returnD(format_error("page and count arguments must be integers"))
        WEs = yield self.db.get_WEs(corpus, {"status": "IN", "crawled": False})
        res = yield self.paginate_webentities(WEs, count=count, page=page, sort=sort, light=light, semilight=semilight, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def jsonrpc_get_webentities_page(self, pagination_token, n_page, idNamesOnly=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the page number `n_page` of WebEntities corresponding to the results of a previous query ran using any of the `get_webentities` or `search_webentities` methods using the returned `pagination_token`. Returns only an array of [id\, name] arrays if `idNamesOnly` is true."""
        try:
            page = int(n_page)
        except:
            returnD(format_error("page argument must be an integer"))
        WEs = yield self.db.get_WEs_query(corpus, pagination_token)
        if not WEs:
            returnD(format_error("No previous query found for token %s on corpus %s" % (pagination_token, corpus)))
        count = WEs["query"]["count"]
        WEsPage = WEs["webentities"][page*count:(page+1)*count]
        if not WEsPage:
            res = yield self.format_WE_page(WEs["total"], WEs["query"]["count"], page, [], token=pagination_token, corpus=corpus)
            returnD(res)
        if idNamesOnly:
            returnD(format_result(WEsPage))
        weights = None
        if len(WEsPage[0]) == 3:
            weights = {w[0]: w[2] for w in WEsPage}
        res = yield self.jsonrpc_get_webentities([w[0] for w in WEsPage], sort=WEs["query"]["sort"], count=WEs["query"]["count"], light=WEs["query"]["light"], semilight=WEs["query"]["semilight"], corpus=corpus, _weights=weights)

        if is_error(res):
            returnD(res)
        respage = yield self.format_WE_page(WEs["total"], WEs["query"]["count"], page, res["result"], token=pagination_token, corpus=corpus)
        returnD(respage)

    @inlineCallbacks
    def jsonrpc_get_webentities_ranking_stats(self, pagination_token, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` histogram data on the indegrees of all WebEntities matching a previous query ran using any of the `get_webentities` or `search_webentities` methods using the return `pagination_token`."""
        WEs = yield self.db.get_WEs_query(corpus, pagination_token)
        if not WEs:
            returnD(format_error("No previous query found for token %s on corpus %s" % (pagination_token, corpus)))
        histogram = {}
        for w in WEs["webentities"]:
            rank = self.corpora[corpus]["webentities_links"].get(w[0], {}).get('indegree', 0)
            if rank not in histogram:
                histogram[rank] = 0
            histogram[rank] += 1
        returnD(format_result(histogram))

  # TAGS

    def _cleanupTagsKey(self, key):
        # MongoDB considers dots as hierarchy separator in objects and refuses them in object's keys
        if key and "." in key:
            key = key.replace(".", "_")
        if key:
            key = key.strip()
        return key

    @inlineCallbacks
    def jsonrpc_rebuild_tags_dictionary(self, corpus=DEFAULT_CORPUS):
        """Administrative function to regenerate for a `corpus` the dictionnary of tag values used by autocompletion features, mostly a debug function which should not be used in most cases."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        WEs = yield self.db.get_WEs(corpus, {"tags.USER": {"$exists": True}}, projection=["tags"])
        self.corpora[corpus]["tags"] = {}
        for WE in WEs:
            for ns in WE["tags"]:
                for cat in WE["tags"][ns]:
                    yield self.add_tags_to_dictionary(ns, cat, WE["tags"][ns][cat], corpus, _commit=False)
        yield self.parent.update_corpus(corpus, True)
        returnD(format_result(self.corpora[corpus]["tags"]))

    @inlineCallbacks
    def add_tags_to_dictionary(self, namespace, category, values, corpus=DEFAULT_CORPUS, _commit=True):
        if not isinstance(values, list):
            values = [values]
        if namespace not in self.corpora[corpus]["tags"]:
            self.corpora[corpus]["tags"][namespace] = {}
        if category not in self.corpora[corpus]["tags"][namespace]:
            self.corpora[corpus]["tags"][namespace][category] = {}
            self.db.WEs(corpus).create_index(sortasc('tags.%s.%s' % (namespace, category)), background=True)
        for value in values:
            if value not in self.corpora[corpus]["tags"][namespace][category]:
                self.corpora[corpus]["tags"][namespace][category][value] = 0
            self.corpora[corpus]["tags"][namespace][category][value] += 1
        if _commit:
            yield self.parent.update_corpus(corpus, True)

    @inlineCallbacks
    def remove_tag_from_dictionary(self, namespace, category, value, corpus=DEFAULT_CORPUS):
        try:
            self.corpora[corpus]["tags"][namespace][category][value] -= 1
        except:
            returnD(None)
        if self.corpora[corpus]["tags"][namespace][category][value] <= 0:
            del(self.corpora[corpus]["tags"][namespace][category][value])
        if not self.corpora[corpus]["tags"][namespace][category]:
            del(self.corpora[corpus]["tags"][namespace][category])
        if not self.corpora[corpus]["tags"][namespace]:
            del(self.corpora[corpus]["tags"][namespace])
        yield self.parent.update_corpus(corpus, True)

    @inlineCallbacks
    def jsonrpc_add_webentity_tag_value(self, webentity_id, namespace, category, value, corpus=DEFAULT_CORPUS, _automatic=False, _commit=True):
        """Adds for a `corpus` a tag `namespace:category=value` to a WebEntity defined by `webentity_id`."""
        namespace = self._cleanupTagsKey(namespace)
        category = self._cleanupTagsKey(category)
        value = value.strip()
        res = yield self.update_webentity(webentity_id, "tags", value, "push", category, namespace, _commit=_commit, update_timestamp=(not _automatic), corpus=corpus)
        if not is_error(res):
            yield self.add_tags_to_dictionary(namespace, category, value, corpus=corpus)
        returnD(res)

    # TODO handle as single mongo query
    def jsonrpc_add_webentities_tag_value(self, webentity_ids, namespace, category, value, corpus=DEFAULT_CORPUS):
        """Adds for a `corpus` a tag `namespace:category=value` to a bunch of WebEntities defined by a list of `webentity_ids`."""
        return self.batch_webentities_edit("add_webentity_tag_value", webentity_ids, corpus, namespace, category, value)

    @inlineCallbacks
    def jsonrpc_rm_webentity_tag_value(self, webentity_id, namespace, category, value, corpus=DEFAULT_CORPUS, _commit=True):
        """Removes for a `corpus` a tag `namespace:category=value` associated with a WebEntity defined by `webentity_id` if it is set."""
        namespace = self._cleanupTagsKey(namespace)
        category = self._cleanupTagsKey(category)
        value = value.strip()
        res = yield self.update_webentity(webentity_id, "tags", value, "pop", category, namespace, _commit=_commit, corpus=corpus)
        if not is_error(res):
            yield self.remove_tag_from_dictionary(namespace, category, value, corpus=corpus)
        returnD(res)

    # TODO handle as single mongo query
    def jsonrpc_rm_webentities_tag_value(self, webentity_ids, namespace, category, value, corpus=DEFAULT_CORPUS):
        """Removes for a `corpus` a tag `namespace:category=value` to a bunch of WebEntities defined by a list of `webentity_ids`."""
        return self.batch_webentities_edit("rm_webentity_tag_value", webentity_ids, corpus, namespace, category, value)

    @inlineCallbacks
    def jsonrpc_edit_webentity_tag_value(self, webentity_id, namespace, category, old_value, new_value, corpus=DEFAULT_CORPUS, _automatic=False, _commit=True):
        """Replaces for a `corpus` a tag `namespace:category=old_value` into a tag `namespace:category=new_value` for the WebEntity defined by `webentity_id` if it is set."""
        namespace = self._cleanupTagsKey(namespace)
        category = self._cleanupTagsKey(category)
        old_value = old_value.strip()
        new_value = new_value.strip()
        WE = yield self.update_webentity(webentity_id, "tags", old_value, "pop", category, namespace, _commit=False, corpus=corpus)
        res = yield self.update_webentity(WE, "tags", new_value, "push", category, namespace, _commit=_commit, update_timestamp=(not _automatic), corpus=corpus)
        if not is_error(res):
            yield self.remove_tag_from_dictionary(namespace, category, old_value, corpus=corpus)
            yield self.add_tags_to_dictionary(namespace, category, new_value, corpus=corpus)
        returnD(res)

    @inlineCallbacks
    def add_backend_tags(self, webentity_id, key, value, namespace="", corpus=DEFAULT_CORPUS, _commit=True):
        if not namespace:
            namespace = "CORE"
        else: namespace = "CORE-%s" % namespace
        WE = yield self.jsonrpc_add_webentity_tag_value(webentity_id, namespace, key, value, corpus=corpus, _automatic=True, _commit=_commit)
        returnD(WE)

    def jsonrpc_get_tags(self, namespace=None, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a tree of all existing tags of the webentities hierarchised by namespaces and categories. Optionally limits to a specific `namespace`."""
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        namespace = self._cleanupTagsKey(namespace)
        tags = self.corpora[corpus]['tags']
        if namespace:
            if namespace not in tags.keys():
                return format_result({})
            return format_result(tags[namespace])
        return format_result(tags)

    def jsonrpc_get_tag_namespaces(self, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a list of all existing namespaces of the webentities tags."""
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        return format_result(self.corpora[corpus]['tags'].keys())

    def jsonrpc_get_tag_categories(self, namespace=None, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a list of all existing categories of the webentities tags. Optionally limits to a specific `namespace`."""
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        namespace = self._cleanupTagsKey(namespace)
        tags = self.corpora[corpus]['tags']
        categories = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                categories |= set(tags[ns].keys())
        if namespace == 'USER':
            usercat = set(categories)
            if "FREETAGS" in usercat:
                usercat.remove("FREETAGS")
        return format_result(list(categories))

    def jsonrpc_get_tag_values(self, namespace=None, category=None, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a list of all existing values in the webentities tags. Optionally limits to a specific `namespace` and/or `category`."""
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        namespace = self._cleanupTagsKey(namespace)
        category = self._cleanupTagsKey(category)
        tags = self.corpora[corpus]['tags']
        values = set()
        for ns in tags.keys():
            if not namespace or (ns == namespace):
                for cat in tags[ns].keys():
                    if not category or (cat == category):
                        values |= set(tags[ns][cat].keys())
        return format_result(list(values))

  # PAGES\, LINKS AND NETWORKS

    # TODO HANDLE PAGES EXTRA FIELDS
    def format_page(self, page, linked=False, data=None, include_metas=False, include_body=False, body_as_plain_text=False):
        res = {
            'lru': page['lru'],
            'crawled': page.get('crawled', None)
        }

        if linked:
            res['linked'] = page.get('indegree', None)

        if data is None:
            res['url'] = urllru.lru_to_url(page['lru'])
            return res

        res['url'] = data['url']

        if include_metas:
            res['status'] = data['status']
            res['crawl_timestamp'] = unicode(data['timestamp'])
            res['depth'] = data['depth']
            res['content_type'] = data.get('content_type')
            res['size'] = data['size']
            res['encoding'] = data.get('encoding')
            res['error'] = data.get('error')
            res['archive_url'] = data.get('archive_url')
            res['archive_date_requested'] = data.get('archive_date_requested')
            res['archive_date_obtained'] = data.get('archive_date_obtained')

        if include_body and 'body' in data:
            try:
                if body_as_plain_text:
                    res['body'] = data['body'].decode('zip')
                else:
                    res['body'] = unicode(base64.b64encode(data['body']))
            except:
                logger.msg("Could not decode/encode zipped body of page %s from mongo: %s" % (res['url'], data['body']), system="WARNING - %s" % corpus)
                res['body'] = ""

        return res

    def format_pages(self, pages, linked=False, data=None, include_metas=False, include_body=False, body_as_plain_text=False):
        index = None
        if data is not None:
            index = {}
            for p in data:
                index[p['lru']] = p

        if is_error(pages):
            return pages

        return [self.format_page(page, linked=linked, data=index.get(unicode(page['lru'])) if index is not None else None, include_metas=include_metas, include_body=include_body, body_as_plain_text=body_as_plain_text) for page in pages]

    @inlineCallbacks
    def jsonrpc_get_webentity_pages(self, webentity_id, onlyCrawled=True, corpus=DEFAULT_CORPUS):
        """Warning: this method can be very slow on webentities with many pages\, privilege paginate_webentity_pages whenever possible. Returns for a `corpus` all indexed Pages fitting within the WebEntity defined by `webentity_id`. Optionally limits the results to Pages which were actually crawled setting `onlyCrawled` to "true"."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        onlyCrawled = test_bool_arg(onlyCrawled)
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No webentity found for id %s" % webentity_id))
        if webentity_id not in self.corpora[corpus]['webentities_links']:
            self.corpora[corpus]['webentities_links'][webentity_id] = {}
        we_links = self.corpora[corpus]['webentities_links'][webentity_id]
        for key in ['crawled', 'uncrawled', 'total']:
            if key not in we_links:
                we_links['pages_' + key] = 0
        pages = yield self.traphs.call(corpus, "get_webentity_"+("crawled_" if onlyCrawled else "")+"pages", webentity_id, WE["prefixes"])
        if is_error(pages):
            returnD(pages)
        if onlyCrawled:
            we_links['pages_crawled'] = len(pages["result"])
            we_links['pages_total'] = we_links['pages_crawled'] + we_links['pages_uncrawled']
        else:
            we_links['pages_total'] = len(pages["result"])
            we_links['pages_uncrawled'] = we_links['pages_total'] - we_links['pages_crawled']
        yield self.parent.update_corpus(corpus, False, True)
        returnD(format_result(self.format_pages(pages["result"])))

    @inlineCallbacks
    def jsonrpc_paginate_webentity_pages(self, webentity_id, count=5000, pagination_token=None, onlyCrawled=False, include_page_metas=False, include_page_body=False, body_as_plain_text=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` `count` indexed Pages alphabetically ordered fitting within the WebEntity defined by `webentity_id` and returns a `pagination_token` to reuse to collect the following pages. Optionally limits the results to Pages which were actually crawled setting `onlyCrawled` to "true". Also optionally returns complete page metadata (http status\, body size\, content_type\, encoding\, crawl timestamp\ and crawl depth) when `include_page_metas` is set to "true". Additionally returns the page's zipped body encoded in base64 when `include_page_body` is "true" (only possible when Hyphe is configured with `store_crawled_html_content` to "true"); setting body_as_plain_text to "true" decodes and unzip these to return them as plain text."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if include_page_body and not config["mongo-scrapy"]["store_crawled_html_content"]:
            returnD(format_error("This Hyphe instance is not configured to collect crawled pages body content, so include_page_body cannot be set to true."))
        onlyCrawled = test_bool_arg(onlyCrawled)
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No webentity found for id %s" % webentity_id))
        try:
            count = int(count)
            if count < 1: raise ValueError()
        except (TypeError, ValueError):
            returnD(format_error("count should be a strictly positive integer"))
        if pagination_token:
            try:
                total, crawled, token = pagination_token.split('|')
                total = int(total)
                crawled = int(crawled)
            except:
                returnD(format_error("Pagination token '%s' seems wrong, it should look like <int>|<int>|<b64_string>" % pagination_token))
        else:
            total, crawled, token = (0, 0, None)
        pages = yield self.traphs.call(corpus, "paginate_webentity_pages", webentity_id, WE["prefixes"], page_count=count, pagination_token=token, crawled_only=onlyCrawled)
        if is_error(pages):
            returnD(pages)
        pages = pages['result']
        total += pages['count']
        crawled += pages['count_crawled']
        if pages.get('token'):
            token = '|'.join([str(total), str(crawled), pages['token']])
        else:
            token = None
            # Update totaux
            if webentity_id not in self.corpora[corpus]['webentities_links']:
                self.corpora[corpus]['webentities_links'][webentity_id] = {}
            we_links = self.corpora[corpus]['webentities_links'][webentity_id]
            for key in ['crawled', 'uncrawled', 'total']:
                if key not in we_links:
                    we_links['pages_' + key] = 0
            we_links['pages_crawled'] = crawled
            if onlyCrawled:
                we_links['pages_total'] = we_links['pages_uncrawled'] + crawled
            else:
                we_links['pages_total'] = total
                we_links['pages_uncrawled'] = total - crawled
            yield self.parent.update_corpus(corpus, False, True)

        page_data = None

        if pages['pages'] and include_page_metas or include_page_body:
            page_data = yield self.db.get_pages(corpus, [p['lru'] for p in pages['pages']], include_metas=include_page_metas, include_body=include_page_body)

        returnD(format_result({
            'token': token,
            'pages': self.format_pages(pages['pages'], data=page_data, include_metas=include_page_metas, include_body=include_page_body, body_as_plain_text=body_as_plain_text)
        }))

    @inlineCallbacks
    def jsonrpc_get_webentity_mostlinked_pages(self, webentity_id, npages=20, max_prefix_distance=None, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the `npages` (defaults to 20) most linked Pages indexed that fit within the WebEntity defined by `webentity_id` and optionnally at a maximum depth of `max_prefix_distance`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        try:
            npages = int(npages)
            if npages < 1: raise ValueError()
        except (TypeError, ValueError):
            returnD(format_error("ERROR: npages argument must be a stricly positive integer"))
        if max_prefix_distance != None:
            try:
                max_prefix_distance = int(max_prefix_distance)
                if max_prefix_distance < 0: raise ValueError()
            except (TypeError, ValueError):
                returnD(format_error("ERROR: max_prefix_distance argument must be null or a positive integer"))
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No webentity found for id %s" % webentity_id))
        pages = yield self.traphs.call(corpus, "get_webentity_most_linked_pages", webentity_id, WE["prefixes"], pages_count=npages, max_depth=max_prefix_distance)
        if is_error(pages):
            returnD(pages)
        returnD(format_result(self.format_pages(pages["result"], linked=True)))

    def jsonrpc_get_webentity_subwebentities(self, webentity_id, light=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all sub-webentities of a WebEntity defined by `webentity_id` (meaning webentities having at least one LRU prefix starting with one of the WebEntity's prefixes)."""
        return self.get_webentity_relative_webentities(webentity_id, "children", light=light, corpus=corpus)

    def jsonrpc_get_webentity_parentwebentities(self, webentity_id, light=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all parent-webentities of a WebEntity defined by `webentity_id` (meaning webentities having at least one LRU prefix starting like one of the WebEntity's prefixes)."""
        return self.get_webentity_relative_webentities(webentity_id, "parents", light=light, corpus=corpus)

    @inlineCallbacks
    def get_webentity_relative_webentities(self, webentity_id, relative_type="children", light=False, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        if relative_type != "children" and relative_type != "parents":
            returnD(format_error("ERROR: relative_type must be set to children or parents"))
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No webentity found for id %s" % webentity_id))
        if relative_type == "children":
            WEs = yield self.traphs.call(corpus, "get_webentity_child_webentities", webentity_id, WE["prefixes"])
        else:
            WEs = yield self.traphs.call(corpus, "get_webentity_parent_webentities", webentity_id, WE["prefixes"])
        if is_error(WEs):
            returnD(WEs)
        if len(WEs["result"]) > 0:
            WEs = yield self.db.get_WEs(corpus, WEs["result"])
        else:
            WEs = []
        res = yield self.format_webentities(WEs, corpus=corpus, light=light)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_webentity_pagelinks_network(self, webentity_id=None, include_external_links=False, corpus=DEFAULT_CORPUS):
        """Warning: this method can be very slow on webentities with many pages or links\, privilege paginate_webentity_pagelinks_network whenever possible. Returns for a `corpus` the list of all internal NodeLinks of a WebEntity defined by `webentity_id`. Optionally add external NodeLinks (the frontier) by setting `include_external_links` to "true"."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        s = time.time()
        logger.msg("Generating NodeLinks network for WebEntity %s..." % webentity_id, system="INFO - %s" % corpus)
        include_external = test_bool_arg(include_external_links)
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No webentity found for id %s" % webentity_id))
        links = yield self.traphs.call(corpus, "get_webentity_pagelinks", webentity_id, WE["prefixes"], include_inbound=include_external, include_outbound=include_external)
        if is_error(links):
            returnD(links)
        res = [list(l) for l in links["result"]]
        logger.msg("...JSON network generated in %ss" % str(time.time()-s), system="INFO - %s" % corpus)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_paginate_webentity_pagelinks_network(self, webentity_id=None, count=10, pagination_token=None, include_external_outlinks=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` internal page links for `count` source pages of a WebEntity defined by `webentity_id` and returns a `pagination_token` to reuse to collect the following links. Optionally add external NodeLinks (the frontier) by setting `include_external_outlinks` to "true"."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        include_external = test_bool_arg(include_external_outlinks)
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No webentity found for id %s" % webentity_id))
        try:
            count = int(count)
            if count < 1: raise
        except:
            returnD(format_error("count should be a positive integer"))
        if pagination_token:
            try:
                total, total_pages, token = pagination_token.split('|')
                total = int(total)
                total_pages = int(total_pages)
            except:
                returnD(format_error("Pagination token '%s' seems wrong, it should look like <int>|<b64_string>" % pagination_token))
        else:
            total, total_pages, token = (0, 0, None)
        links = yield self.traphs.call(corpus, "paginate_webentity_pagelinks", webentity_id, WE["prefixes"], source_page_count=count, pagination_token=token, include_outbound=include_external_outlinks)
        if is_error(links):
            returnD(links)
        links = links['result']
        total += links['count_pagelinks']
        total_pages += links['count_sourcepages']
        if links.get('token'):
            token = '|'.join([str(total), str(total_pages), links['token']])
        else:
            token = None
        returnD(format_result({
            'token': token,
            'links': [list(l) for l in links['pagelinks']]
        }))

    @inlineCallbacks
    def get_webentity_linked_entities(self, webentity_id=None, direction="in", count=100, page=0, light=True, semilight=False, corpus=DEFAULT_CORPUS):
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No webentity found for id %s" % webentity_id))
        if direction == "in":
            linked = deepcopy(self.corpora[corpus]["webentities_links"].get(webentity_id, {}))
            for key in ['pages_crawled', 'pages_uncrawled', 'pages_total', 'undirected_degree', 'indegree', 'outdegree']:
                if key in linked:
                    del linked[key]
        else:
            linked = {}
            for target, sources in self.corpora[corpus]["webentities_links"].items():
                if webentity_id in sources:
                    linked[target] = sources[webentity_id]
        WEs = yield self.db.get_WEs(corpus, {"_id": {"$in": linked.keys()}})
        res = yield self.paginate_webentities(WEs, count=count, page=page, sort=["-weight", "name"], light=light, semilight=semilight, weights=linked, corpus=corpus)
        returnD(res)

    def jsonrpc_get_webentity_referrers(self, webentity_id=None, count=100, page=0, light=True, semilight=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities with known links to `webentity_id` ordered by decreasing link weight.\nResults are paginated and will include a `token` to be reused to collect the other entities via `get_webentities_page`: see `search_webentities` for explanations on `count` and `page`."""
        return self.get_webentity_linked_entities(webentity_id, "in", count=count, page=page, light=light, semilight=semilight, corpus=corpus)

    def jsonrpc_get_webentity_referrals(self, webentity_id=None, count=100, page=0, light=True, semilight=False, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all WebEntities with known links from `webentity_id` ordered by decreasing link weight.\nResults are paginated and will include a `token` to be reused to collect the other entities via `get_webentities_page`: see `search_webentities` for explanations on `count` and `page`."""
        return self.get_webentity_linked_entities(webentity_id, "out", count=count, page=page, light=light, semilight=semilight, corpus=corpus)

    @inlineCallbacks
    def jsonrpc_get_webentity_ego_network(self, webentity_id=None, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` a list of all weighted links between webentities linked to `webentity_id`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        WE = yield self.db.get_WE(corpus, webentity_id)
        if not WE:
            returnD(format_error("No webentity found for id %s" % webentity_id))
        neighbors = set([webentity_id] + [k for k in self.corpora[corpus]["webentities_links"].get(webentity_id, {}).keys() if isinstance(k, int)])
        for target, sources in self.corpora[corpus]["webentities_links"].items():
            if webentity_id in sources:
                neighbors.add(target)
        res = []
        for target in neighbors:
            for source, weight in self.corpora[corpus]["webentities_links"].get(target, {}).items():
                if source in neighbors:
                    res.append([source, target, weight])
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_webentities_network(self, include_links_from_OUT=INCLUDE_LINKS_FROM_OUT, include_links_from_DISCOVERED=INCLUDE_LINKS_FROM_DISCOVERED, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the list of all agregated weighted links between WebEntities."""
        s = time.time()
        logger.msg("Generating WebEntities network...", system="INFO - %s" % corpus)
        if not (include_links_from_OUT and include_links_from_DISCOVERED):
            statuses_to_keep = ["IN", "UNDECIDED"]
            if include_links_from_OUT:
                statuses_to_keep.append("OUT")
            if include_links_from_DISCOVERED:
                statuses_to_keep.append("DISCOVERED")
            WEs_to_keep = yield self.db.get_WEs(corpus, {"status": {"$in": statuses_to_keep}}, projection=["_id"])
            WEs_to_keep = set(we["_id"] for we in WEs_to_keep)
        res = []
        if not self.parent.corpus_ready(corpus):
            options = yield self.db.get_corpus(corpus)
            links = msgpack.unpackb(options["webentities_links"])
        else:
            links = self.corpora[corpus]["webentities_links"]
        for target, sources in links.items():
            for source, weight in sources.items():
                if not isinstance(source, int):
                    continue
                # Filter links coming from WEs OUT or DISCOVERED if undesired
                if not (include_links_from_OUT and include_links_from_DISCOVERED) and source not in WEs_to_keep:
                    continue
                res.append([source, target, weight])
        logger.msg("...JSON network generated in %ss" % str(time.time()-s), system="INFO - %s" % corpus)
        returnD(handle_standard_results(res))

  # CREATION RULES

    @inlineCallbacks
    def jsonrpc_get_default_webentity_creationrule(self, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` the default WebEntityCreationRule."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        res = yield self.db.get_default_WECR(corpus)
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_get_webentity_creationrules(self, lru_prefix=None, corpus=DEFAULT_CORPUS):
        """Returns for a `corpus` all existing WebEntityCreationRules or only one set for a specific `lru_prefix`."""
        if corpus not in self.corpora:
            returnD(format_error("Corpus %sis not started" % corpus))
        if lru_prefix:
            res = yield self.db.find_WECR(corpus, lru_prefix)
        else:
            res = yield self.db.get_WECRs(corpus)
            self.corpora[corpus]["creation_rules"] = res
        returnD(format_result(res))

    @inlineCallbacks
    def jsonrpc_delete_webentity_creationrule(self, lru_prefix, corpus=DEFAULT_CORPUS):
        """Removes from a `corpus` an existing WebEntityCreationRule set for a specific `lru_prefix`."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        variations = urllru.lru_variations(lru_prefix)
        deleted = 0
        rules = yield self.db.find_WECRs(corpus, variations)
        for wecr in rules:
            yield self.db.remove_WECR(corpus, wecr["prefix"])
            yield self.traphs.call(corpus, "remove_webentity_creation_rule", wecr["prefix"])
            deleted += 1

        if deleted:
            yield self.jsonrpc_get_webentity_creationrules(corpus=corpus)
            returnD(format_result('WebEntityCreationRule for prefix %s deleted.' % lru_prefix))
        returnD(format_error("No existing WebEntityCreationRule found for prefix %s." % lru_prefix))

    @inlineCallbacks
    def jsonrpc_add_webentity_creationrule(self, lru_prefix, regexp, corpus=DEFAULT_CORPUS):
        """Adds to a `corpus` a new WebEntityCreationRule set for a `lru_prefix` to a specific `regexp` or one of "subdomain"/"subdomain-N"/"domain"/"path-N"/"prefix+N"/"page" N being an integer. It will immediately by applied to past crawls."""
        if not self.parent.corpus_ready(corpus):
            returnD(self.parent.corpus_error(corpus))
        try:
            _, lru_prefix = urllru.lru_clean_and_convert(lru_prefix)
        except ValueError as e:
            returnD(format_error(e))
        news = 0
        variations = urllru.lru_variations(lru_prefix)
        for variation in variations:
            yield self.db.add_WECR(corpus, variation, getWECR(regexp, variation))
            res = yield self.traphs.call(corpus, "add_webentity_creation_rule", variation, getWECR(regexp, variation))
            if is_error(res):
                returnD(res)
            res = res["result"]

            # Create new webentities
            yield self.db.add_WEs(corpus, res["created_webentities"])
            new = len(res["created_webentities"])
            self.corpora[corpus]['total_webentities'] += new
            self.corpora[corpus]['webentities_discovered'] += new
            news += new
        self.corpora[corpus]['recent_changes'] += news
        yield self.jsonrpc_get_webentity_creationrules(corpus=corpus)

        # Remove potential homepage from parent WE that would belong to the new WEs
        for variation in variations:
            res = yield self.jsonrpc_get_lru_definedprefixes(variation, corpus=corpus, _include_homepages=True)
            if not is_error(res):
                yield self.jsonrpc_add_webentities_tag_value([r["id"] for r in res["result"]], "CORE", "recrawlNeeded", "true", corpus=corpus)
                for parent in [p for p in res["result"] if p["homepage"]]:
                    parenthomelru = urllru.url_to_lru_clean(parent["homepage"], self.corpora[corpus]["tlds"])
                    if parenthomelru != variation and urllru.has_prefix(parenthomelru, variations):
                        if config['DEBUG']:
                            logger.msg("Removing homepage %s from parent WebEntity %s" % (parent["homepage"], parent["name"]), system="DEBUG - %s" % corpus)
                        yield self.jsonrpc_set_webentity_homepage(parent["id"], "", corpus=corpus, _automatic=True)
        returnD(format_result("Webentity creation rule added and applied: %s new webentities created" % news))

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
            _, pageLRU = urllru.url_clean_and_convert(url, self.corpora[corpus]["tlds"])
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
        prefix = yield self.traphs.call(corpus, "get_potential_prefix", lru)
        if is_error(prefix):
            returnD(prefix)
        returnD(format_result({pageLRU: prefix["result"]}))

  # VARIOUS

    def jsonrpc_trigger_links_build(self, corpus=DEFAULT_CORPUS):
        """Will initiate a links calculation update (useful especially when a corpus crashed during the links calculation and no more crawls is programmed)."""
        if not self.parent.corpus_ready(corpus):
            return self.parent.corpus_error(corpus)
        self.corpora[corpus]['recent_changes'] += 1
        return format_result("Links building should start soon")

    @inlineCallbacks
    def save_webentities_stats(self, corpus=DEFAULT_CORPUS):
        if self.parent.corpus_ready(corpus):
            yield self.db.save_stats(corpus, self.corpora[corpus])

    @inlineCallbacks
    def jsonrpc_get_webentities_stats(self, corpus=DEFAULT_CORPUS):
        """Returns for a corpus a set of statistics on the WebEntities status repartition of a `corpus` each 5 minutes."""
        res = yield self.db.get_stats(corpus)
        returnD(format_result(res))



# TEST API
try:
    core = Core()
except Exception as x:
    print "ERROR: Cannot start API, something should probably not have been pushed..."
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
    d.addCallback(test_destroyed, cor, corpus)
    d.addErrback(stop_tests, cor, corpus)
def test_destroyed(res, cor, corpus):
    if is_error(res):
        return stop_tests(res, cor, corpus, "Could not stop and destroy corpus")
    stop_tests(None, cor, corpus)
@inlineCallbacks
def stop_tests(res, cor, corpus, msg=None):
    if is_error(res) or str(type(res)) == "<type 'instance'>":
        if msg:
            logger.msg("%s: %s" % (corpus, msg), system="ERROR - tests")
        if type(res) == dict:
            logger.msg(res["message"], system="ERROR - tests")
        else:
            logger.msg(res, system="ERROR - tests")
        yield cor.close()
        if reactor.running:
            reactor.stop()
    else:
        logger.msg("All tests passed. Ready!", system="INFO - tests")

reactor.callLater(1, test_start, core, TEST_CORPUS)


# JSON-RPC interface
core.putSubHandler('crawl', core.crawler)
core.putSubHandler('store', core.store)
core.putSubHandler('system', Introspection(core))
site = server.Site(core)
site.noisy = False

# Run as 'python core.tac' ...
if __name__ == '__main__':
    reactor.listenTCP(config['core_api_port'], site)
    logger.startLogging(sys.stdout)
    reactor.run()
# ... or in the background when called with 'twistd -y core.tac'
elif __name__ == '__builtin__':
    application = Application("Hyphe backend API Server")
    filelog = logger.FileLogObserver(LogFile('hyphe-core.log', 'log', rotateLength=134217728))
    filelog.timeFormat = "%Y-%m-%d %H:%M:%S"
    application.setComponent(logger.ILogObserver, filelog.emit)
    server = TCPServer(config['core_api_port'], site)
    server.setServiceParent(application)
