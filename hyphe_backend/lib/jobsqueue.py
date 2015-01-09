#!/usr/bin/env python
# -*- coding: utf-8 -*-

from json import loads as loadjson
from random import randint
from urllib import urlencode
from twisted.python import log as logger
from twisted.web.client import getPage
from twisted.internet.task import LoopingCall
from twisted.internet.defer import DeferredList, inlineCallbacks, returnValue as returnD
from twisted.internet.error import ConnectionRefusedError
from hyphe_backend.lib.mongo import MongoDB
from hyphe_backend.lib.utils import format_error, is_error, deferredSleep, now_ts

class JobsQueue(object):

    def __init__(self, config):
        self.db = MongoDB(config)
        self.scrapyd = 'http://%s:%s/' % (config['host'], config['scrapy_port'])
        self.queue = None
        self.depiler = LoopingCall(self.depile)
        self.depiler.start(0.5, True)

    @inlineCallbacks
    def init_queue(self):
        self.queue = {}
        corpora = yield self.db.list_corpus(fields=[])
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
        jobs = yield getPage(url)
        status = {"pending": 0}
        read = None
        for line in jobs.split("><tr"):
            if ">Pending<" in line:
                read = "pending"
            elif ">Running<" in line:
                read = "running"
            elif ">Finished<" in line:
                read = None
            elif read == "running":
                corpus = line[line.find(".") + 1 : line.find("<", 2)]
                if corpus not in status:
                    status[corpus] = 0
                status[corpus] += 1
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
              headers=headers, timeout=10)
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

    # Order jobs by corpus with less currently running crawls then age
    sortjobs = lambda x: \
        float("%s.%s" % (status.get(x[1]["corpus"], 0), x[1]["timestamp"]))

    @inlineCallbacks
    def depile(self):
        if self.queue is None:
            yield self.init_queue()
        if not len(self.queue):
            returnD(None)

        # Add some random wait to allow possible concurrent Hyphe instance
        # to compete for ScrapyD's slots
        yield deferredSleep(1./randint(4,20))
        status = yield self.get_scrapyd_status()
        if status["pending"] > 0:
            returnD(None)

        job_id, job = sorted(self.queue.items(), key=self.sortjobs)[0]
        res = yield self.send_scrapy_query('schedule', job["crawl_arguments"])
        ts = now_ts()
        if is_error(res):
            logger("WARNING: error sending job %s to ScrapyD: %s" % (job, res))
            self.queue[job_id]['timestamp'] = ts    # let it retry a bit later
        else:
            yield self.db.update_job(job["corpus"], job_id, res['jobid'], ts)
            yield self.db.add_log(job["corpus"], job_id, "CRAWL_SCHEDULED", ts)
            del(self.queue[job_id])

    def cancel_corpus_jobs(self, corpus):
        for _id, job in self.queue.items():
            if job["corpus"] == corpus:
                del(self.queue[_id])

    def count_waiting_jobs(self, corpus):
        return len([0 for j in self.queue.values() if j["corpus"] == corpus])

