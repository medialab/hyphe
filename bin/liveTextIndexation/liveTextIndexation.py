#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
import sys
import time
from md5 import md5

import jsonrpclib
import pymongo
from dragnet import extract_content, extract_content_and_comments
from elasticsearch import Elasticsearch, helpers
from html2text import textify

BATCH_SIZE = 1000
DELETE_INDEX = True
RESET_MONGO = True
CORPUS = "wikipedia"


def ensure_index_on_pages(mongo_pages_coll):
    print("building mongo index")
    mongo_pages_coll.create_index([('indexed', pymongo.ASCENDING), ("content_type", pymongo.ASCENDING), ("status", pymongo.ASCENDING)])
    print("index done")


def index_text_page(hyphe_core, mongo, es, CORPUS, content_types=["text/plain", "text/html"]):
    mongo_pages_coll = mongo["hyphe_%s" % CORPUS]["pages"]
    mongo_jobs_coll =  mongo["hyphe_%s" % CORPUS]["jobs"]
    throttle = 0.5
    while True:
        # boucle infinie

        # take XXX pages sorted by timestamp if index = false
        query = {
            "status": 200,
            "content_type": {"$in": content_types},
            "body" : {"$exists": True},
            "indexed" : False,
            "forgotten" : False
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

            body = page["body"].decode('zip')

            encoding = page.get("encoding", "")
            try:
                body = body.decode(encoding)
            except Exception :
                body = body.decode("UTF8", "replace")
                encoding = "UTF8-replace"

            page_to_index["webentity_id"] = page['webentity_when_crawled']

            page["html"] = body
            page_to_index["textify"] = textify(body, encoding=encoding)
            try:
                page_to_index["dragnet"] = extract_content(body, encoding=encoding)
            except Exception as e:
                print("DRAGNET ERROR:", str(e))
                page_to_index["dragnet"] = None
            pages.append(page_to_index)
        # index batch to ES
        index_result = helpers.bulk(es, [{'_op_type': 'update', "doc_as_upsert" : True, "_id":md5(page['url']).hexdigest(), 'doc':p} for p in pages], index='hyphe.%s.txt' % CORPUS)
        #print index_result
        # update status in mongo
        mongo_update = mongo_pages_coll.update({'url' : {'$in' : [p['url'] for p in pages]}}, {'$set': {'indexed': True}}, multi=True, upsert=False)
        print(mongo_update)
        not_completed_jobs_pipeline = [
            {
            "$match": {
            "_job" : {"$in": list(jobs)},
            "indexed": False
            }},{
            "$group": {
                "_id": "$_job"
            }}
        ]
        not_completed_jobs = set(o['_id'] for o in mongo_pages_coll.aggregate(not_completed_jobs_pipeline))
        print(not_completed_jobs)
        completed_jobs = jobs - not_completed_jobs
        if len(completed_jobs) > 0:
            print(completed_jobs)
            mongo_jobs_coll.update({'_id':{"$in": list(completed_jobs)}}, {'$set': {'text_indexing_status': 'finished'}}, multi=True)
        
        # throttle if batch empty
        if len(pages) == 0:
            time.sleep(throttle)
            if throttle < 2:
                throttle += 0.5
        else :
            throttle = 0.5

if __name__ == '__main__':

    # TODO: add arguments for
    # - apiurl
    # - mongoconn + db
    # - CORPUS
    # - output formats
    # - output dir
    # - boilerpipe extractors
    # - status to process
    # - contenttypes pages

    #parser = ArgumentParser()
    #parser.add_argument("-o", "--output", action='store_true', help="")
    #args = parser.parse_args()

    api = "http://localhost:90/api/"
    mongohost = "localhost"
    mongoport = 27017
    password = ""

    # Initiate Hyphe API connection and ensure CORPUS started
    try:
        hyphe = jsonrpclib.Server(api, version=1)
    except Exception as e:
        exit('Could not initiate connection to hyphe core')
    start = hyphe.start_corpus(CORPUS, password)
    if start['code'] == 'fail' :
        exit(start['message'])

    # Initiate MongoDB connection and build index on pages
    try:
        db = pymongo.MongoClient(mongohost, mongoport)
        dbpages = db["hyphe_%s" % CORPUS]["pages"]
    except Exception as e:
        exit('Could not initiate connection to MongoDB')
    ensure_index_on_pages(dbpages)

    # connect to ES
    es = Elasticsearch('localhost:9200')

    if es.indices.exists(index='hyphe.%s.txt' % CORPUS) and DELETE_INDEX:
        print 'index deleted'
        es.indices.delete(index='hyphe.%s.txt' % CORPUS)
    if not es.indices.exists(index='hyphe.%s.txt' % CORPUS):
        if RESET_MONGO:
            dbpages.update({}, {'$set': {'indexed': False}}, multi=True, upsert=False)
            print('mongo index created')
            dbpages.update({'$or': [{'content_type': {"$in": ["text/plain", "text/html"]}}, {'body': {'$exists': False}}]}, {'$set': {'indexed': True}})
            print('set non-content page to indexed true')
        es.indices.create(index='hyphe.%s.txt' % CORPUS, body = {
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
                    }
                }
            }
        })
        # try:
        #     with open(os.path.dirname(os.path.realpath(__file__)) + '/database/elasticsearch_mapping.json') as mappingfile:
        #         mapping = json.loads(mappingfile.read())
        #         es.indices.create(index=esconf['index'], body=mapping)
        # except Exception as e:
        #     log('ERROR', 'Could not open elasticsearch_mapping.json: %s %s' % (type(e), e))
        #     sys.exit(1)

    # Run!
    index_text_page(hyphe, db, es, CORPUS)
