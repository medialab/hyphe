#!/usr/bin/env python
# -*- coding: utf-8 -*-

from json import loads as loadjson
from os import environ
from random import randint
from urllib import urlencode
from twisted.python import log as logger
from twisted.internet.task import LoopingCall
from twisted.internet.defer import DeferredList, inlineCallbacks, returnValue as returnD
from twisted.internet.error import ConnectionRefusedError, TimeoutError
from hyphe_backend.lib.mongo import MongoDB
from hyphe_backend.lib.utils import format_error, is_error, deferredSleep, now_ts, getPage

class JobsQueue(object):

    def __init__(self, config):
        self.db = MongoDB(config)
        self.scrapyd = 'http://%s:%s/' % (environ.get('HYPHE_CRAWLER_HOST', config['host']), int(environ.get('HYPHE_CRAWLER_PORT', config['scrapy_port'])))
        self.max_simul_crawls = config["max_simul_requests"]
        self.db_name = config["db_name"]
        self.queue = None
        self.depiler = LoopingCall(self.depile)
        self.depiler.start(0.2, True)

    @inlineCallbacks
    def init_queue(self):
        self.queue = {}
        corpora = yield self.db.list_corpus(projection=[])
        dl = [self.db.get_waiting_jobs(corpus["_id"]) for corpus in corpora]
        alljobs = yield DeferredList(dl, consumeErrors=True)
        for bl, res in alljobs:
            if not bl:
                print "ERROR collecting old crawljobs for a corpus", res
            corpus, jobs = res
            for job in jobs:
                self.queue[job["_id"]] = {
                  "corpus": corpus,
                  "timestamp": job["created_at"],
                  "crawl_arguments": job["crawl_arguments"]
                }

    def stop(self):
        if self.depiler.running:
            self.depiler.stop()

    # Let's scrape ScrapyD's internal jobs webpage since the API
    # does not provide global information on all spiders...
    @inlineCallbacks
    def get_scrapyd_status(self):
        url = "%sjobs" % self.scrapyd
        try:
            jobs = yield getPage(url)
        except TimeoutError:
            logger.msg("WARNING: ScrapyD's monitoring website seems like not answering")
            returnD(None)
        except Exception as e:
            logger.msg("WARNING: ScrapyD's monitoring website seems down: %s %s" % (type(e), e))
            returnD(None)
        status = {"pending": 0, "running": 0}
        read = None
        for line in jobs.split("><tr"):
            if ">Pending<" in line:
                read = "pending"
            elif ">Running<" in line:
                read = "running"
            elif ">Finished<" in line:
                read = None
            elif read == "running":
                pattern = ">" + self.db_name + "_"
                if pattern not in line:
                    continue
                corpus = line.split(pattern)[1].split("</td>")[0]
                if corpus not in status:
                    status[corpus] = 0
                status[corpus] += 1
                status[read] += 1
            elif read:
                status[read] += 1
        returnD(status)

    @inlineCallbacks
    def send_scrapy_query(self, action, arguments=None):
        url = "%s%s.json" % (self.scrapyd, action)
        method = "POST"
        headers = None
        if action.startswith('list'):
            method = "GET"
            if arguments:
                args = [str(k)+'='+str(v) for (k, v) in arguments.iteritems()]
                url += '?' + '&'.join(args)
                arguments = None
        elif arguments:
            arguments = urlencode(arguments)
            headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        try:
            res = yield getPage(url, method=method, postdata=arguments, \
              headers=headers, timeout=30)
            result = loadjson(res)
            returnD(result)
        except ConnectionRefusedError:
            returnD(format_error("Could not contact scrapyd server, " + \
              "maybe it's not started..."))
        except Exception as e:
            returnD(format_error(e))

    @inlineCallbacks
    def add_job(self, args, corpus, webentity_id):
        ts = now_ts()
        job_id = yield self.db.add_job(corpus, webentity_id, args, ts)
        self.queue[job_id] = {
          "corpus": corpus,
          "timestamp": ts,
          "crawl_arguments": args
        }
        yield self.db.add_log(corpus, job_id, "CRAWL_ADDED", ts)
        returnD(job_id)

    @inlineCallbacks
    def depile(self):
        if self.queue is None:
            yield self.init_queue()
        if not len(self.queue):
            returnD(None)

        status = yield self.get_scrapyd_status()
        if not status or status["pending"] > 0 or status["running"] >= self.max_simul_crawls:
            returnD(None)
        # Add some random wait to allow possible concurrent Hyphe instance
        # to compete for ScrapyD's empty slots
        yield deferredSleep(1./randint(4,20))

        # Order jobs by corpus with less currently running crawls then age
        ordered = sorted(self.queue.items(), key=lambda x: \
          float("%s.%s" % (status.get(x[1]["corpus"], 0), x[1]["timestamp"])))
        job_id, job = ordered[0]
        args = job["crawl_arguments"]
        res = yield self.send_scrapy_query('schedule', {"project": args["project"], "spider": args["spider"], "setting": args["setting"], "job_id": job_id})
        ts = now_ts()
        if is_error(res):
            logger.msg("WARNING: error sending job %s to ScrapyD: %s" % (job, res))
            if job_id in self.queue:
                self.queue[job_id]['timestamp'] = ts    # let it retry a bit later
        else:
            yield self.db.update_job(job["corpus"], job_id, res['jobid'], ts)
            yield self.db.add_log(job["corpus"], job_id, "CRAWL_SCHEDULED", ts)
            if job_id in self.queue:
                del(self.queue[job_id])

    def cancel_corpus_jobs(self, corpus):
        for _id, job in self.queue.items():
            if job["corpus"] == corpus:
                del(self.queue[_id])

    def count_waiting_jobs(self, corpus):
        return len([0 for j in self.queue.values() if j["corpus"] == corpus])

