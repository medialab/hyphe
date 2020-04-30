#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import sys
import time
import zlib
import json
import requests
from hashlib import md5
import pymongo
from dragnet import extract_content, extract_content_and_comments
from elasticsearch import Elasticsearch, helpers
from html2text import textify
# load config variables
from config import *
import datetime
import traceback

def ensure_index_on_pages(mongo_pages_coll):
    print("building mongo index")
    mongo_pages_coll.create_index([('to_index', pymongo.ASCENDING), ("content_type", pymongo.ASCENDING), ("status", pymongo.ASCENDING)])
    print("index done")

def index_text_page(mongo, es, CORPUS, content_types=["text/plain", "text/html"]):
    mongo_pages_coll = mongo["hyphe_%s" % CORPUS]["pages"]
    mongo_jobs_coll =  mongo["hyphe_%s" % CORPUS]["jobs"]
    throttle = 0.5
    while True:
        # boucle infinie

        # take XXX pages sorted by timestamp if index = false
        query = {
            "to_index": True,
            "forgotten": False
        }
        total = 0
        jobs = set()
        pages = []
        for page in mongo_pages_coll.find(query).sort('timestamp').limit(BATCH_SIZE):
            jobs.add(page['_job'])
            stems = page['lru'].rstrip('|').split('|')
            page_to_index = {
                'url': page['url'],
                'lru': page['lru'],
                'prefixes': ['|'.join(stems[0:i + 1])+'|' for i in range(len(stems))]
            }
            total += 1

            body = zlib.decompress(page["body"])

            encoding = page.get("encoding", "")
            try:
                body = body.decode(encoding)
            except Exception :
                body = body.decode("UTF8", "replace")
                encoding = "UTF8-replace"

            page_to_index["webentity_id"] = page['webentity_when_crawled']

            page["html"] = body
            page_to_index["textify"] = textify(body, encoding=encoding)
            # try:
            #     page_to_index["dragnet"] = extract_content(body, encoding=encoding)
            # except Exception as e:
                # print("DRAGNET ERROR")
            page_to_index["dragnet"] = None
            page_to_index["indexDate"] = datetime.datetime.now()
            pages.append(page_to_index)
        # index batch to ES
        try:
            index_result, _ = helpers.bulk(es, [{
                "_op_type": "update",
                "doc_as_upsert": True,
                "_id": md5(p['url'].encode('UTF8')).hexdigest(),
                'doc':p}
                    for p in pages],
                index='hyphe_%s' % CORPUS)
        except Exception as e:
            print("error in index bulk")
            traceback.print_stack()
            exit(1)
        if index_result > 0:
            print("%s pages inserted"%(index_result))
        # update status in mongo
        mongo_update = mongo_pages_coll.update({'url' : {'$in' : [p['url'] for p in pages]}}, {'$set': {'to_index': False}}, multi=True, upsert=False)
        print(mongo_update)

        # tag jobs when completed
        not_completed_jobs_pipeline = [
            {
            "$match": {
            "_job" : {"$in": list(jobs)},
            "to_index": True
            }},{
            "$group": {
                "_id": "$_job"
            }}
        ]
        # counting completed jobs
        not_completed_jobs = set(o['_id'] for o in mongo_pages_coll.aggregate(not_completed_jobs_pipeline))
        print(not_completed_jobs)
        completed_jobs = jobs - not_completed_jobs
        if len(completed_jobs) > 0:
            r = mongo_jobs_coll.update_many({'crawljob_id': {"$in": list(completed_jobs)}, 'crawling_status': {"$in":['FINISHED', 'CANCELED', 'RETRIED']}}, {'$set': {'text_indexed': True}})
            if r.matched_count > 0:
                print("%s of %s were fully indexed"%(r.matched_count, completed_jobs))
       
       
        # update web entity - page structure
        mongo_webupdates_coll =  mongo["hyphe_%s" % CORPUS]["WEupdates"]
        weupdates = mongo_webupdates_coll.find({"index_status": "PENDING"}).sort('timestamp')
        print("WE updates to process: %s"%weupdates.count())
        for weupdate in weupdates:
            unindexed_jobs = mongo_jobs_coll.find({"webentity_id": weupdate['old_webentity'], "text_indexed": {"$exists": False}, "started_at":{"$lt":weupdate['timestamp']}})
            # don't update WE structure in text index if there is one crawling job
            print('checking number of unindexed jobs %s'%unindexed_jobs.count())
            if unindexed_jobs.count() == 0:
                print('updating index')
                print(weupdate)
                # two cases , trivial if no prefixes, complexe otherwiase
                if weupdate['prefixes'] and len(weupdate['prefixes']) > 0:
                    updateQuery = {
                        "script": {
                        "lang": "painless",
                        "source": "ctx._source.webentity_id = params.new_webentity_id",
                        "params": {
                            "new_webentity_id": weupdate['new_webentity']
                        }
                        },
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "term": {
                                            "webentity_id": weupdate['old_webentity']
                                        }
                                    },
                                    {
                                        "terms": {
                                            "prefixes": weupdate['prefixes']
                                        }
                                    }
                                ]
                            }
                        }
                    }
                else:
                    updateQuery = {
                        "script": {
                            "lang": "painless",
                            "source": "ctx._source.webentity_id = params.new_webentity_id",
                            "params": {
                                "new_webentity_id": weupdate['new_webentity']
                            }
                        },
                        "query": {
                            "term": {
                                "webentity_id": weupdate['old_webentity']
                            }
                        }
                    }
                print(updateQuery)
                index_result = es.update_by_query(index='hyphe_%s' % CORPUS, body = updateQuery, conflicts="proceed")
                print(index_result)
                weupdates = mongo_webupdates_coll.update({"_id": weupdate['_id']}, {'$set': {'index_status': 'FINISHED'}})

        # throttle if batch empty
        if len(pages) == 0:
            time.sleep(throttle)
            if throttle < 5:
                throttle += 0.5
        else :
            throttle = 0.5

if __name__ == '__main__':

    print("starting text indexation")

    # Initiate MongoDB connection and build index on pages
    try:
        print("connecting to mongo...")
        db = pymongo.MongoClient(MONGO_HOST, MONGO_PORT)
        dbpages = db["hyphe_%s" % CORPUS]["pages"]
    except Exception as e:
        print("can't connect to mongo")
        exit('Could not initiate connection to MongoDB')
    ensure_index_on_pages(dbpages)

    # connect to ES

    # Wait for Elasticsearch to come up.
    # Don't print NewConnectionError's while we're waiting for Elasticsearch
    # to come up.
    print('request to %s:%s...'%(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT))
    port_opened = False
    while not port_opened:
        try:
            r = requests.get('http://%s:%s'%(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT))
            print(r.status_code)
            port_opened = r.status_code == 200
        except Exception as e:
            print(e)
            print("Exception in requests")
        finally:
            if not port_opened:
                print("ES replied with a bad HTTP code, retry in 1s")
                time.sleep(1)
            else:
                print('Elasticsearch is responding')
    es = Elasticsearch('%s:%s'%(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT))
    start = time.time()
    for _ in range(0, ELASTICSEARCH_TIMEOUT_SEC):
        try:
            es.cluster.health(wait_for_status='yellow')
            print('Elasticsearch took %d seconds to come up.' % (time.time()-start))
            break
        except ConnectionError:
            print('Elasticsearch not up yet, will try again.')
            time.sleep(1)
    else:
        raise EnvironmentError("Elasticsearch failed to start.")
    print('Elasticsearch started!')
    if es.indices.exists(index='hyphe_%s' % CORPUS) and DELETE_INDEX:
        print('index deleted')
        es.indices.delete(index='hyphe_%s' % CORPUS)

    if not es.indices.exists(index='hyphe_%s' % CORPUS):
        if RESET_MONGO:
            dbpages.update({}, {'$set': {'to_index': True}}, multi=True, upsert=False)
            print('mongo index created')
            dbpages.update({'$or': [
                {'content_type': {"$not": {"$in": ["text/plain", "text/html"]}}},
                {'body': {'$exists': False}},
                {'status': {"$ne": 200}},
                {'size': 0}]},
                {'$set': {'to_index': False}}, multi=True, upsert=False)
            db["hyphe_%s" % CORPUS]["WEupdates"].update_many({},{'$set':{'index_status': 'PENDING'}})
            db["hyphe_%s" % CORPUS]["jobs"].update_many({},{'$unset':{'text_indexed':True}})
            
            print('set non-content page to not to_index')
        es.indices.create(index='hyphe_%s' % CORPUS, body = {
            "mappings": {
                "properties": {
                    "lru": {
                        "type": "keyword"
                    },
                    "url": {
                        "type": "keyword"
                    },
                    "prefixes": {
                        "type": "keyword"
                    },
                    "webentity_id": {
                        "type": "keyword"
                    },
                    "textify": {
                        "type": "text"
                    },
                    "dragnet": {
                        "type": "text"
                    },
                    "html": {
                        "type": "text"
                    },
                    "indexDate": {
                        "type": "date"
                    },
                    "WEUpdateDate": {
                        "type": "date"
                    }
                }
            }
        })

    # Run!
    index_text_page(db, es, CORPUS)
