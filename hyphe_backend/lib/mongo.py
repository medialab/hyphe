#!/usr/bin/env python
# -*- coding: utf-8 -*-

from os import environ
import msgpack
from bson.binary import Binary
from uuid import uuid1 as uuid
from twisted.internet.defer import inlineCallbacks, returnValue as returnD
from txmongo import MongoConnection, connection as mongo_connection
mongo_connection._Pinger.noisy = False
mongo_connection._Connection.noisy = False
from txmongo.filter import TEXT as textIndex, sort as mongosort, ASCENDING, DESCENDING
from pymongo.errors import OperationFailure
from bson import ObjectId
from hyphe_backend.lib.urllru import name_lru
from hyphe_backend.lib.utils import crawling_statuses, indexing_statuses, salt, now_ts
from hyphe_backend.lib.creationrules import getName as name_creationrule

def sortasc(field):
    return mongosort(ASCENDING(field))

def sortdesc(field):
    return mongosort(DESCENDING(field))

class MongoDB(object):

    def __init__(self, conf, pool=25):
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
    def list_corpus(self, **kwargs):
        if "sort" not in kwargs:
            kwargs["sort"] = sortdesc("last_activity")
        res = yield self.db()['corpus'].find(**kwargs)
        returnD(res)

    @inlineCallbacks
    def add_corpus(self, corpus, name, password, options, tlds=None):
        now = now_ts()
        yield self.db()["corpus"].insert_one({
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
          "crawls_pending": 0,
          "crawls_running": 0,
          "total_pages": 0,
          "total_pages_crawled": 0,
          "total_pages_queued": 0,
          "total_links_found": 0,
          "recent_changes": False,
          "last_index_loop": now,
          "links_duration": 1,
          "last_links_loop": 0,
          "tags": Binary(msgpack.packb({})),
          "webentities_links": Binary(msgpack.packb({})),
          "created_at": now,
          "last_activity": now,
          "tlds": tlds
        })
        yield self.init_corpus_indexes(corpus)

    @inlineCallbacks
    def get_corpus(self, corpus, **kwargs):
        if "limit" not in kwargs:
            kwargs["limit"] = 1
        res = yield self.db()["corpus"].find({"_id": corpus}, **kwargs)
        returnD(res[0] if res else None)

    @inlineCallbacks
    def get_corpus_by_name(self, corpus, **kwargs):
        if "limit" not in kwargs:
            kwargs["limit"] = 1
        res = yield self.db()["corpus"].find({"name": corpus}, **kwargs)
        returnD(res[0] if res else None)

    @inlineCallbacks
    def update_corpus(self, corpus, modifs):
        yield self.db()["corpus"].update_one({"_id": corpus}, {"$set": modifs})

    @inlineCallbacks
    def delete_corpus(self, corpus):
        yield self.db()["corpus"].delete_one({'_id': corpus})
        yield self.drop_corpus_collections(corpus)
        yield self.conn.drop_database(corpus)

    @inlineCallbacks
    def init_corpus_indexes(self, corpus, retry=True):
        try:
            yield self.db()['corpus'].create_index(sortdesc('last_activity'), background=True)
            yield self.WEs(corpus).create_index(sortasc('name'), background=True)
            yield self.WEs(corpus).create_index(sortasc('status'), background=True)
            yield self.WEs(corpus).create_index(sortasc('crawled'), background=True)
            yield self.WEs(corpus).create_index(mongosort(textIndex("$**")), language_override="HYPHE_MONGODB_LANGUAGE_INDEX_FIELD_NAME", background=True)
            yield self.WECRs(corpus).create_index(sortasc('prefix'), background=True)
            yield self.pages(corpus).create_index(sortasc('timestamp'), background=True)
            yield self.pages(corpus).create_index(sortasc('_job'), background=True)
            yield self.pages(corpus).create_index(sortasc('_job') + sortasc('forgotten'), background=True)
            yield self.pages(corpus).create_index(sortasc('url'), background=True)
            yield self.queue(corpus).create_index(sortasc('timestamp'), background=True)
            yield self.queue(corpus).create_index(sortasc('_job'), background=True)
            yield self.queue(corpus).create_index(sortasc('_job') + sortdesc('timestamp'), background=True)
            yield self.logs(corpus).create_index(sortasc('timestamp'), background=True)
            yield self.jobs(corpus).create_index(sortasc('created_at'), background=True)
            yield self.jobs(corpus).create_index(sortasc('webentity_id'), background=True)
            yield self.jobs(corpus).create_index(sortasc('webentity_id') + sortasc('created_at'), background=True)
            yield self.jobs(corpus).create_index(sortasc('webentity_id') + sortdesc('created_at'), background=True)
            yield self.jobs(corpus).create_index(sortasc('webentity_id') + sortasc("crawling_status") + sortasc("indexing_status") + sortasc('created_at'), background=True)
            yield self.jobs(corpus).create_index(sortasc('previous_webentity_id'), background=True)
            yield self.jobs(corpus).create_index(sortasc('crawljob_id'), background=True)
            yield self.jobs(corpus).create_index(sortasc('crawljob_id') + sortasc('crawling_status'), background=True)
            yield self.jobs(corpus).create_index(sortasc('crawljob_id') + sortasc('indexing_status'), background=True)
            yield self.jobs(corpus).create_index(sortasc('crawljob_id') + sortasc('crawling_status') + sortasc('indexing_status'), background=True)
            yield self.jobs(corpus).create_index(sortasc('crawling_status'), background=True)
            yield self.jobs(corpus).create_index(sortasc('indexing_status'), background=True)
            yield self.jobs(corpus).create_index(sortasc('crawling_status') + sortasc('indexing_status'), background=True)
            yield self.jobs(corpus).create_index(sortasc('crawling_status') + sortasc('indexing_status') + sortasc('created_at'), background=True)
            yield self.stats(corpus).create_index(sortasc('timestamp'), background=True)
            yield self.stats(corpus).create_index(sortdesc('timestamp'), background=True)
        except OperationFailure as e:
            # catch and destroy old indices built with older pymongo versions
            if retry:
                yield self.db()['corpus'].drop_indexes()
                for coll in ["webentities", "pages", "queue", "logs", "jobs", "stats"]:
                    yield self._get_coll(corpus, coll).drop_indexes()
                yield self.init_corpus_indexes(corpus, retry=False)
            else:
                raise e

    def _get_coll(self, corpus, name):
        return self.db(corpus)[name]

    def WEs(self, corpus):
        return self._get_coll(corpus, "webentities")
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
        yield self.WEs(corpus).drop()
        yield self.WECRs(corpus).drop()
        yield self.queue(corpus).drop()
        yield self.pages(corpus).drop()
        yield self.jobs(corpus).drop()
        yield self.logs(corpus).drop()
        yield self.queries(corpus).drop()
        yield self.stats(corpus).drop()

    @inlineCallbacks
    def count_WEs(self, corpus, query):
        res = yield self.WEs(corpus).count(query)
        returnD(res)

    @inlineCallbacks
    def get_WEs(self, corpus, query=None, **kwargs):
        if not query and query != []:
            res = yield self.WEs(corpus).find({}, **kwargs)
        else:
            if isinstance(query, list) and isinstance(query[0], int):
                query = {"_id": {"$in": query}}
            res = yield self.WEs(corpus).find(query, **kwargs)
        returnD(res)

    @inlineCallbacks
    def get_WE(self, corpus, weid):
        res = yield self.WEs(corpus).find({"_id": weid}, limit=1)
        returnD(res[0] if res else None)

    def new_WE(self, weid, prefixes, name=None, status="DISCOVERED", startpages=[], tags={}):
        timestamp = now_ts()
        if not name:
            for p in prefixes:
                try:
                    name = name_lru(prefixes[0])
                    break
                except ValueError:
                    pass
            else:
                name = prefixes[0]
        return {
          "_id": weid,
          "prefixes": prefixes,
          "name": name,
          "status": status,
          "tags": tags,
          "homepage": None,
          "startpages": startpages,
          "crawled": False,
          "creationDate": timestamp,
          "lastModificationDate": timestamp
        }

    @inlineCallbacks
    def add_WE(self, corpus, weid, prefixes, name=None, status="DISCOVERED", startpages=[], tags={}):
        yield self.upsert_WE(corpus, weid, self.new_WE(weid, prefixes, name, status, startpages, tags), update_timestamp=False)

    @inlineCallbacks
    def add_WEs(self, corpus, new_WEs):
        if not new_WEs:
            returnD(None)
        yield self.WEs(corpus).insert_many([self.new_WE(weid, prefixes) for weid, prefixes in new_WEs.items()])

    @inlineCallbacks
    def upsert_WE(self, corpus, weid, metas, update_timestamp=True):
        if update_timestamp:
            metas["lastModificationDate"] = now_ts()
        yield self.WEs(corpus).update_one({"_id": weid}, {"$set": metas}, upsert=True)

    @inlineCallbacks
    def remove_WE(self, corpus, weid):
        yield self.WEs(corpus).delete_one({"_id": weid})

    @inlineCallbacks
    def get_WECRs(self, corpus):
        res = yield self.WECRs(corpus).find(projection={'_id': False})
        returnD(res)

    @inlineCallbacks
    def find_WECR(self, corpus, prefix):
        res = yield self.WECRs(corpus).find({"prefix": prefix}, projection={'_id': False}, limit=1)
        returnD(res[0] if res else None)

    @inlineCallbacks
    def find_WECRs(self, corpus, prefixes):
        res = yield self.WECRs(corpus).find({"prefix": {"$in": prefixes}}, projection={'_id': False})
        returnD(res)

    @inlineCallbacks
    def add_WECR(self, corpus, prefix, regexp):
        yield self.WECRs(corpus).update_one({"prefix": prefix}, {"$set": {"regexp": regexp, "name": name_creationrule(regexp, prefix)}}, upsert=True)

    @inlineCallbacks
    def remove_WECR(self, corpus, prefix):
        yield self.WECRs(corpus).delete_one({"prefix": prefix})

    @inlineCallbacks
    def get_default_WECR(self, corpus):
        res = yield self.find_WECR(corpus, "DEFAULT_WEBENTITY_CREATION_RULE")
        returnD(res)

    @inlineCallbacks
    def set_default_WECR(self, corpus, regexp):
        yield self.add_WECR(corpus, "DEFAULT_WEBENTITY_CREATION_RULE", regexp)

    @inlineCallbacks
    def list_logs(self, corpus, job, **kwargs):
        if "sort" not in kwargs:
            kwargs["sort"] = sortasc('timestamp')
        if "projection" not in kwargs:
            kwargs["projection"] = ['timestamp', 'log']
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
        yield self.logs(corpus).insert_many([{'_job': _id, 'timestamp': timestamp, 'log': msg} for _id in job])

    @inlineCallbacks
    def list_jobs(self, corpus, specs={}, **kwargs):
        if "sort" not in kwargs:
            kwargs["sort"] = sortasc("crawling_status") + sortasc("indexing_status") + sortasc("created_at")
        jobs = yield self.jobs(corpus).find(specs, **kwargs)
        if jobs and "limit" in kwargs and kwargs["limit"] == 1:
            jobs = jobs[0]
        returnD(jobs)

    @inlineCallbacks
    def add_job(self, corpus, webentity_id, args, timestamp=None):
        if not timestamp:
            timestamp = now_ts()
        _id = str(uuid())
        yield self.jobs(corpus).insert_one({
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
        })
        returnD(_id)

    @inlineCallbacks
    def update_job(self, corpus, job_id, crawl_id, timestamp=None):
        if not timestamp:
            timestamp = now_ts()
        yield self.jobs(corpus).update_one({"_id": job_id}, {"$set": {"crawljob_id": crawl_id, "scheduled_at": timestamp}})

    @inlineCallbacks
    def update_jobs(self, corpus, specs, modifs, **kwargs):
        if type(specs) == list:
            specs = {"_id": {"$in": specs}}
        elif type(specs) in [str, unicode, bytes]:
            specs = {"_id": specs}
        update = {"$set": modifs}
        if "inc" in kwargs:
            update["$inc"] = kwargs.pop("inc")
        yield self.jobs(corpus).update_many(specs, update, **kwargs)

    @inlineCallbacks
    def get_waiting_jobs(self, corpus):
        jobs = yield self.jobs(corpus).find({"crawljob_id": None}, projection=["created_at", "crawl_arguments"])
        returnD((corpus, jobs))

    @inlineCallbacks
    def check_pages(self, corpus):
        res = yield self.pages(corpus).find_one()
        returnD(res is not None)

    @inlineCallbacks
    def forget_pages(self, corpus, job, urls, **kwargs):
        yield self.pages(corpus).update_many({"_job": job, "url": {"$in": urls}}, {"$set": {"forgotten": True}}, **kwargs)

    @inlineCallbacks
    def count_pages(self, corpus, job, **kwargs):
        tot = yield self.pages(corpus).count({"_job": job, "forgotten": False}, **kwargs)
        returnD(tot)

    @inlineCallbacks
    def get_pages(self, corpus, urls_or_lrus, include_metas=False, include_body=False, include_links=False):
        projection = {}

        if not include_links:
            projection['lrulinks'] = 0

        if not include_metas:
            projection['status'] = 0
            projection['timestamp'] = 0
            projection['depth'] = 0
            projection['content_type'] = 0
            projection['size'] = 0
            projection['encoding'] = 0

        if not include_body:
            projection['body'] = 0

        kwargs = {}
        if projection:
            kwargs["projection"] = projection

        if urls_or_lrus[0].startswith("s:"):
            result = yield self.pages(corpus).find({"lru": {"$in": urls_or_lrus}}, **kwargs)
        else:
            result = yield self.pages(corpus).find({"url": {"$in": urls_or_lrus}}, **kwargs)
        returnD(result)

    @inlineCallbacks
    def update_job_pages(self, corpus, job_id):
        crawled_pages = yield self.count_pages(corpus, job_id)
        unindexed_pages = yield self.count_queue(corpus, job_id)
        yield self.update_jobs(corpus, {"crawljob_id": job_id}, {'nb_crawled_pages': crawled_pages, 'nb_unindexed_pages': unindexed_pages})

    @inlineCallbacks
    def get_queue(self, corpus, specs={}, **kwargs):
        if "sort" not in kwargs:
            kwargs["sort"] = sortasc('timestamp')
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
        yield self.queue(corpus).delete_many(specs, **kwargs)

    @inlineCallbacks
    def save_WEs_query(self, corpus, ids, query_options):
        res = yield self.queries(corpus).insert_one({
          "webentities": ids,
          "total": len(ids),
          "query": query_options
        })
        returnD(str(res.inserted_id))

    @inlineCallbacks
    def get_WEs_query(self, corpus, token):
        res = yield self.queries(corpus).find({"_id": ObjectId(token)}, limit=1)
        returnD(res[0] if res else None)

    @inlineCallbacks
    def clean_WEs_query(self, corpus):
        yield self.queries(corpus).delete_many({})

    @inlineCallbacks
    def save_stats(self, corpus, corpus_metas):
        new = {
          "total": corpus_metas["total_webentities"],
          "in": corpus_metas['webentities_in'],
          "in_untagged": corpus_metas['webentities_in_untagged'],
          "in_uncrawled": corpus_metas['webentities_in_uncrawled'],
          "out": corpus_metas['webentities_out'],
          "discovered": corpus_metas['webentities_discovered'],
          "undecided": corpus_metas['webentities_undecided']
        }
        old = yield self.get_last_stats(corpus)
        if old:
            del(old["timestamp"], old["_id"])
        if not old or old != new:
            new["timestamp"] = now_ts()
            yield self.stats(corpus).insert_one(new)

    @inlineCallbacks
    def get_last_stats(self, corpus):
        res = yield self.stats(corpus).find(sort=sortdesc("timestamp"), limit=1)
        returnD(res[0] if res else None)

    @inlineCallbacks
    def get_stats(self, corpus):
        res = yield self.stats(corpus).find(projection={'_id': False}, sort=sortasc("timestamp"))
        returnD(res)
