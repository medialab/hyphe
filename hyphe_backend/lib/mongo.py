#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
from twisted.internet.defer import inlineCallbacks, returnValue as returnD
from txmongo import MongoConnection, connection as mongo_connection
mongo_connection._Connection.noisy = False
from txmongo.filter import sort as mongosort, ASCENDING, DESCENDING
from hyphe_backend.lib.utils import crawling_statuses, indexing_statuses, salt

def sortasc(field):
    return mongosort(ASCENDING(field))

def sortdesc(field):
    return mongosort(DESCENDING(field))

class MongoDB(object):

    def __init__(self, conf, pool=10):
        self.host = conf.get("host", conf.get("mongo_host", "localhost"))
        self.port = conf.get("port", conf.get("mongo_port", 27017))
        self.dbname = conf.get("db_name", conf.get("project", "hyphe"))
        self.conn = MongoConnection(self.host, self.port, pool_size=pool)
        self.db = self.conn[self.dbname]

    @inlineCallbacks
    def close(self):
        try:
            yield self.conn.disconnect()
        except:
            pass

    @inlineCallbacks
    def list_corpus(self, *args, **kwargs):
        kwargs["safe"] = True
        if "filter" not in kwargs:
            kwargs["filter"] = sortdesc("last_activity")
        res = yield self.db['corpus'].find(*args, **kwargs)
        returnD(res)

    @inlineCallbacks
    def add_corpus(self, corpus, name, password, options):
        now = time.time()
        yield self.db["corpus"].insert({
          "_id": corpus,
          "name": name,
          "password": salt(password),
          "ram": 256,
          "options": options,
          "total_webentities": 0,
          "total_crawls": 0,
          "total_pages": 0,
          "total_pages_crawled": 0,
          "created_at": now,
          "last_activity": now,
          "last_index_loop": now,
          "last_links_loop": now
        })
        yield self.init_corpus_indexes(corpus)


    @inlineCallbacks
    def get_corpus(self, corpus):
        res = yield self.db["corpus"].find_one({"_id": corpus}, safe=True)
        returnD(res)

    @inlineCallbacks
    def update_corpus(self, corpus, modifs):
        yield self.db["corpus"].update({"_id": corpus}, {"$set": modifs}, safe=True)

    @inlineCallbacks
    def delete_corpus(self, corpus):
        yield self.db["corpus"].remove({'_id': corpus}, safe=True)

    @inlineCallbacks
    def init_corpus_indexes(self, corpus):
        yield self.pages(corpus).ensure_index(sortasc('timestamp'), background=True, safe=True)
        yield self.pages(corpus).ensure_index(sortasc('_job'), background=True, safe=True)
        yield self.pages(corpus).ensure_index(sortasc('url'), background=True, safe=True)
        yield self.queue(corpus).ensure_index(sortasc('timestamp'), background=True, safe=True)
        yield self.queue(corpus).ensure_index(sortasc('_job') + sortdesc('timestamp'), background=True, safe=True)
        yield self.logs(corpus).ensure_index(sortasc('timestamp'), background=True, safe=True)
        yield self.jobs(corpus).ensure_index(sortasc('crawling_status'), background=True, safe=True)
        yield self.jobs(corpus).ensure_index(sortasc('indexing_status'), background=True, safe=True)
        yield self.jobs(corpus).ensure_index(sortasc('webentity_id') + sortasc('timestamp'), background=True, safe=True)
        yield self.jobs(corpus).ensure_index(sortasc('crawling_status') + sortasc('indexing_status') + sortasc('timestamp'), background=True, safe=True)

    def _get_coll(self, corpus, name):
        return self.db["%s.%s" % (corpus, name)]

    def queue(self, corpus):
        return self._get_coll(corpus, "queue")
    def pages(self, corpus):
        return self._get_coll(corpus, "pages")
    def jobs(self, corpus):
        return self._get_coll(corpus, "jobs")
    def logs(self, corpus):
        return self._get_coll(corpus, "logs")

    @inlineCallbacks
    def drop_corpus_collections(self, corpus):
        yield self.queue(corpus).drop(safe=True)
        yield self.pages(corpus).drop(safe=True)
        yield self.jobs(corpus).drop(safe=True)
        yield self.logs(corpus).drop(safe=True)

    @inlineCallbacks
    def list_logs(self, corpus, job, **kwargs):
        if "filter" not in kwargs:
            kwargs["filter"] = sortasc('timestamp')
        if "fields" not in kwargs:
            kwargs["fields"] = ['timestamp', 'log']
        kwargs["safe"] = True
        if type(job) == list:
            job = {"$in": job}
        res = yield self.logs(corpus).find({"_job": job}, **kwargs)
        returnD(res)

    @inlineCallbacks
    def add_log(self, corpus, job, msg, timestamp=None):
        if not timestamp:
            timestamp = int(time.time()*1000)
        if type(job) != list:
            job = [job]
        yield self.logs(corpus).insert([{'_job': _id, 'timestamp': timestamp, 'log': msg} for _id in job], multi=True, safe=True)

    @inlineCallbacks
    def list_jobs(self, corpus, *args, **kwargs):
        kwargs["safe"] = True
        if "filter" not in kwargs:
            kwargs["filter"] = sortasc("crawling_status") + sortasc("indexing_status") + sortasc("timestamp")
        jobs = yield self.jobs(corpus).find(*args, **kwargs)
        if jobs and "limit" in kwargs and kwargs["limit"] == 1:
            jobs = jobs[0]
        returnD(jobs)

    @inlineCallbacks
    def add_job(self, corpus, job_id, webentity_id, args, timestamp=None):
        if not timestamp:
            timestamp = int(time.time()*1000)
        yield self.jobs(corpus).insert({
          "_id": job_id,
          "webentity_id": webentity_id,
          "nb_crawled_pages": 0,
          "nb_pages": 0,
          "nb_links": 0,
          "crawl_arguments": args,
          "crawling_status": crawling_statuses.PENDING,
          "indexing_status": indexing_statuses.PENDING,
          "timestamp": timestamp
        }, safe=True)

    @inlineCallbacks
    def update_jobs(self, corpus, specs, modifs, **kwargs):
        if type(specs) == list:
            specs = {"_id": {"$in": specs}}
        elif type(specs) in [str, unicode, bytes]:
            specs = {"_id": specs}
        update = {"$set": modifs}
        if "inc" in kwargs:
            update["$inc"] = kwargs.pop("inc")
        kwargs["safe"] = True
        kwargs["multi"] = True
        yield self.jobs(corpus).update(specs, update, **kwargs)

    @inlineCallbacks
    def count_pages(self, corpus, job, **kwargs):
        tot = yield self.pages(corpus).count({"_job": job}, **kwargs)
        returnD(tot)

    @inlineCallbacks
    def get_queue(self, corpus, specs={}, **kwargs):
        if "filter" not in kwargs:
            kwargs["filter"] = sortasc('timestamp')
        kwargs["safe"] = True
        res = yield self.queue(corpus).find(specs, **kwargs)
        if res and "limit" in kwargs and kwargs["limit"] == 1:
            res = res[0]
        returnD(res)

    @inlineCallbacks
    def clean_queue(self, corpus, specs, **kwargs):
        if type(specs) == list:
            specs = {"_id": {"$in": specs}}
        elif type(specs) in [str, unicode, bytes]:
            specs = {"_id": specs}
        kwargs["safe"] = True
        yield self.queue(corpus).remove(specs, **kwargs)

