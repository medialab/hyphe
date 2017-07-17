#!/usr/bin/env python
# -*- coding: utf-8 -*-

from os import environ
from uuid import uuid1 as uuid
from twisted.internet.defer import inlineCallbacks, returnValue as returnD
from txmongo import MongoConnection, connection as mongo_connection
mongo_connection._Connection.noisy = False
from txmongo.filter import sort as mongosort, ASCENDING, DESCENDING
from pymongo.errors import OperationFailure
from bson import ObjectId
from hyphe_backend.lib.utils import crawling_statuses, indexing_statuses, salt, now_ts
from hyphe_backend.lib.creationrules import getName as name_creationrule

def sortasc(field):
    return mongosort(ASCENDING(field))

def sortdesc(field):
    return mongosort(DESCENDING(field))

class MongoDB(object):

    def __init__(self, conf, pool=10):
        self.host = environ.get('HYPHE_MONGODB_HOST', conf.get("host", conf.get("mongo_host", "localhost")))
        self.port = int(environ.get('HYPHE_MONGODB_PORT', conf.get("port", conf.get("mongo_port", 27017))))
        self.dbname = conf.get("db_name", conf.get("project", "hyphe"))
        self.conn = MongoConnection(self.host, self.port, pool_size=pool)

    def db(self, corpus=None):
        if not corpus:
            return self.conn[self.dbname]
        return self.conn["%s_%s" % (self.dbname, corpus)]

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
        res = yield self.db()['corpus'].find(*args, **kwargs)
        returnD(res)

    @inlineCallbacks
    def add_corpus(self, corpus, name, password, options, tlds=None):
        now = now_ts()
        yield self.db()["corpus"].insert({
          "_id": corpus,
          "name": name,
          "password": salt(password),
          "options": options,
          "total_webentities": 0,
          "webentities_in": 0,
          "webentities_in_untagged": 0,
          "webentities_in_uncrawled": 0,
          "webentities_out": 0,
          "webentities_undecided": 0,
          "webentities_discovered": 0,
          "total_crawls": 0,
          "total_pages": 0,
          "total_pages_crawled": 0,
          "created_at": now,
          "last_activity": now,
          "recent_changes": False,
          "last_index_loop": now,
          "links_duration": 1,
          "last_links_loop": 0,
          "tlds": tlds
        }, safe=True)
        yield self.init_corpus_indexes(corpus)


    @inlineCallbacks
    def get_corpus(self, corpus):
        res = yield self.db()["corpus"].find_one({"_id": corpus}, safe=True)
        returnD(res)

    @inlineCallbacks
    def get_corpus_by_name(self, corpus):
        res = yield self.db()["corpus"].find_one({"name": corpus}, safe=True)
        returnD(res)

    @inlineCallbacks
    def update_corpus(self, corpus, modifs):
        yield self.db()["corpus"].update({"_id": corpus}, {"$set": modifs}, safe=True)

    @inlineCallbacks
    def delete_corpus(self, corpus):
        yield self.db()["corpus"].remove({'_id': corpus}, safe=True)
        yield self.drop_corpus_collections(corpus)

    @inlineCallbacks
    def init_corpus_indexes(self, corpus, retry=True):
        try:
            yield self.db()['corpus'].create_index(sortdesc('last_activity'), background=True)
            # TODO prepare indexes for WEs
            #yield self.WEs(corpus).create_index(sortasc('timestamp'), background=True)
            yield self.WECRs(corpus).create_index(sortasc('prefix'), background=True)
            yield self.pages(corpus).create_index(sortasc('timestamp'), background=True)
            yield self.pages(corpus).create_index(sortasc('_job'), background=True)
            yield self.pages(corpus).create_index(sortasc('_job') + sortasc('forgotten'), background=True)
            yield self.pages(corpus).create_index(sortasc('url'), background=True)
            yield self.queue(corpus).create_index(sortasc('timestamp'), background=True)
            yield self.queue(corpus).create_index(sortasc('_job') + sortdesc('timestamp'), background=True)
            yield self.logs(corpus).create_index(sortasc('timestamp'), background=True)
            yield self.jobs(corpus).create_index(sortasc('crawling_status'), background=True)
            yield self.jobs(corpus).create_index(sortasc('indexing_status'), background=True)
            yield self.jobs(corpus).create_index(sortasc('webentity_id'), background=True)
            yield self.jobs(corpus).create_index(sortasc('webentity_id') + sortasc('created_at'), background=True)
            yield self.jobs(corpus).create_index(sortasc('webentity_id') + sortdesc('created_at'), background=True)
            yield self.jobs(corpus).create_index(sortasc('webentity_id') + sortasc("crawling_status") + sortasc("indexing_status") + sortasc('created_at'), background=True)
            yield self.jobs(corpus).create_index(sortasc('crawling_status') + sortasc('indexing_status') + sortasc('created_at'), background=True)
            yield self.stats(corpus).create_index(sortasc('timestamp'), background=True)
        except OperationFailure as e:
            # catch and destroy old indices built with older pymongo versions
            if retry:
                yield self.db()['corpus'].drop_indexes()
                for coll in ["pages", "queue", "logs", "jobs", "stats"]:
                    yield self._get_coll(corpus, coll).drop_indexes()
                yield self.init_corpus_indexes(corpus, retry=False)
            else:
                raise e

    def _get_coll(self, corpus, name):
        return self.db(corpus)[name]

    def WECRs(self, corpus):
        return self._get_coll(corpus, "creationrules")
    def queue(self, corpus):
        return self._get_coll(corpus, "queue")
    def pages(self, corpus):
        return self._get_coll(corpus, "pages")
    def jobs(self, corpus):
        return self._get_coll(corpus, "jobs")
    def logs(self, corpus):
        return self._get_coll(corpus, "logs")
    def queries(self, corpus):
        return self._get_coll(corpus, "queries")
    def stats(self, corpus):
        return self._get_coll(corpus, "stats")

    @inlineCallbacks
    def drop_corpus_collections(self, corpus):
        yield self.WECRs(corpus).drop(safe=True)
        yield self.queue(corpus).drop(safe=True)
        yield self.pages(corpus).drop(safe=True)
        yield self.jobs(corpus).drop(safe=True)
        yield self.logs(corpus).drop(safe=True)
        yield self.queries(corpus).drop(safe=True)
        yield self.stats(corpus).drop(safe=True)

    @inlineCallbacks
    def get_WECRs(self, corpus):
        res = yield self.WECRs(corpus).find()
        returnD(res)

    @inlineCallbacks
    def find_WECR(self, corpus, prefix):
        res = yield self.WECRs(corpus).find_one({"prefix": prefix})
        returnD(res or None)

    @inlineCallbacks
    def find_WECRs(self, corpus, prefixes):
        res = yield self.WECRs(corpus).find({"prefix": {"$in": prefixes}})
        returnD(res)

    @inlineCallbacks
    def add_WECR(self, corpus, prefix, regexp):
        yield self.WECRs(corpus).update({"prefix": prefix}, {"$set": {"regexp": regexp, "name": name_creationrule(regexp, prefix)}}, upsert=True)

    @inlineCallbacks
    def remove_WECR(self, corpus, prefix):
        yield self.WECRs(corpus).remove({"prefix": prefix}, safe=True)

    @inlineCallbacks
    def get_default_WECR(self, corpus):
        res = yield self.find_WECR(corpus, "DEFAULT_WEBENTITY_CREATION_RULE")
        returnD(res)

    @inlineCallbacks
    def set_default_WECR(self, corpus, regexp):
        yield self.add_WECR(corpus, "DEFAULT_WEBENTITY_CREATION_RULE", regexp)


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
            timestamp = now_ts()
        if type(job) != list:
            job = [job]
        yield self.logs(corpus).insert([{'_job': _id, 'timestamp': timestamp, 'log': msg} for _id in job], multi=True, safe=True)

    @inlineCallbacks
    def list_jobs(self, corpus, *args, **kwargs):
        kwargs["safe"] = True
        if "filter" not in kwargs:
            kwargs["filter"] = sortasc("crawling_status") + sortasc("indexing_status") + sortasc("created_at")
        jobs = yield self.jobs(corpus).find(*args, **kwargs)
        for j in jobs:
            if "created_at" not in j and "timestamp" in j:
                j["created_at"] = j["timestamp"]
                for k in ['start', 'crawl', 'finish']:
                    j["%sed_at" % k] = None
        if jobs and "limit" in kwargs and kwargs["limit"] == 1:
            jobs = jobs[0]
        returnD(jobs)

    @inlineCallbacks
    def add_job(self, corpus, webentity_id, args, timestamp=None):
        if not timestamp:
            timestamp = now_ts()
        _id = str(uuid())
        yield self.jobs(corpus).insert({
          "_id": _id,
          "crawljob_id": None,
          "webentity_id": webentity_id,
          "nb_crawled_pages": 0,
          "nb_unindexed_pages": 0,
          "nb_pages": 0,
          "nb_links": 0,
          "crawl_arguments": args,
          "crawling_status": crawling_statuses.PENDING,
          "indexing_status": indexing_statuses.PENDING,
          "created_at": timestamp,
          "scheduled_at": None,
          "started_at": None,
          "crawled_at": None,
          "finished_at": None
        }, safe=True)
        returnD(_id)

    @inlineCallbacks
    def update_job(self, corpus, job_id, crawl_id, timestamp=None):
        if not timestamp:
            timestamp = now_ts()
        yield self.jobs(corpus).update({"_id": job_id}, {"$set": {"crawljob_id": crawl_id, "scheduled_at": timestamp}}, safe=True)

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
    def get_waiting_jobs(self, corpus):
        jobs = yield self.jobs(corpus).find({"crawljob_id": None}, fields=["created_at", "crawl_arguments"])
        returnD((corpus, jobs))

    @inlineCallbacks
    def forget_pages(self, corpus, job, urls, **kwargs):
        kwargs["safe"] = True
        kwargs["multi"] = True
        yield self.pages(corpus).update({"_job": job, "url": {"$in": urls}}, {"$set": {"forgotten": True}}, **kwargs)

    @inlineCallbacks
    def count_pages(self, corpus, job, **kwargs):
        tot = yield self.pages(corpus).count({"_job": job, "forgotten": {"$ne": True}}, **kwargs)
        returnD(tot)

    @inlineCallbacks
    def update_job_pages(self, corpus, job_id):
        crawled_pages = yield self.count_pages(corpus, job_id)
        unindexed_pages = yield self.count_queue(corpus, job_id)
        yield self.update_jobs(corpus, {"crawljob_id": job_id}, {'nb_crawled_pages': crawled_pages, 'nb_unindexed_pages': unindexed_pages})

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
    def count_queue(self, corpus, job, **kwargs):
        tot = yield self.queue(corpus).count({"_job": job}, **kwargs)
        returnD(tot)

    @inlineCallbacks
    def clean_queue(self, corpus, specs, **kwargs):
        if type(specs) == list:
            specs = {"_id": {"$in": [ObjectId(_i) for _i in specs]}}
        elif type(specs) in [str, unicode, bytes]:
            specs = {"_id": ObjectId(specs)}
        kwargs["safe"] = True
        yield self.queue(corpus).remove(specs, **kwargs)

    @inlineCallbacks
    def save_WEs_query(self, corpus, ids, query_options):
        res = yield self.queries(corpus).insert({
          "webentities": ids,
          "total": len(ids),
          "query": query_options
        }, safe=True)
        returnD(str(res))

    @inlineCallbacks
    def get_WEs_query(self, corpus, token):
        res = yield self.queries(corpus).find_one({"_id": ObjectId(token)}, safe=True)
        returnD(res)

    @inlineCallbacks
    def clean_WEs_query(self, corpus):
        yield self.queries(corpus).remove({}, safe=True)

    @inlineCallbacks
    def save_stats(self, corpus, corpus_metas):
        yield self.stats(corpus).insert({
          "timestamp": now_ts(),
          "total": corpus_metas["total_webentities"],
          "in": corpus_metas['webentities_in'],
          "in_untagged": corpus_metas['webentities_in_untagged'],
          "in_uncrawled": corpus_metas['webentities_in_uncrawled'],
          "out": corpus_metas['webentities_out'],
          "discovered": corpus_metas['webentities_discovered'],
          "undecided": corpus_metas['webentities_undecided']
        }, safe=True)

    @inlineCallbacks
    def get_stats(self, corpus):
        res = yield self.stats(corpus).find(filter=sortasc("timestamp"))
        returnD(res)
