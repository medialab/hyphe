#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import sys
import time
import zlib
import json
from hashlib import md5
from argparse import ArgumentParser


import pymongo
from dragnet import extract_content, extract_content_and_comments
from elasticsearch import Elasticsearch, helpers
from html2text import textify

# default configuration
BATCH_SIZE = 1000
DELETE_INDEX = True
RESET_MONGO = True
CORPUS = "wikipedia"
MONGOHOST = "localhost"
MONGOPORT = 27017
ESHOST = "localhost"
ESPORT = 9200


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
            "status": 200,
            "content_type": {"$in": content_types},
            "body" : {"$exists": True},
            "to_index" : True,
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
            try:
                page_to_index["dragnet"] = extract_content(body, encoding=encoding)
            except Exception as e:
                print("DRAGNET ERROR:", str(e))
                page_to_index["dragnet"] = None
            pages.append(page_to_index)
        # index batch to ES
        index_result = helpers.bulk(es, [{'_op_type': 'update', "doc_as_upsert" : True, "_id": md5(page['url'].encode('UTF8')).hexdigest(), 'doc':p} for p in pages], index='hyphe.%s.txt' % CORPUS)
        #print index_result
        # update status in mongo
        mongo_update = mongo_pages_coll.update({'url' : {'$in' : [p['url'] for p in pages]}}, {'$set': {'to_index': False}}, multi=True, upsert=False)
        print(mongo_update)
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
        not_completed_jobs = set(o['_id'] for o in mongo_pages_coll.aggregate(not_completed_jobs_pipeline))
        print(not_completed_jobs)
        completed_jobs = jobs - not_completed_jobs
        if len(completed_jobs) > 0:
            print(completed_jobs)
            mongo_jobs_coll.update({'_id':{"$in": list(completed_jobs)}}, {'$set': {'text_indexing_status': 'finished'}}, multi=True)

        # update web entity - page structure

        # throttle if batch empty
        if len(pages) == 0:
            time.sleep(throttle)
            if throttle < 2:
                throttle += 0.5
        else :
            throttle = 0.5

if __name__ == '__main__':

    #load conf
    with open('config.json', 'r', encoding='utf8') as f:
        conf = json.load(f)
        BATCH_SIZE = conf['batch_size']
        DELETE_INDEX = conf['DELETE_INDEX']
        RESET_MONGO = conf['RESET_MONGO']
        CORPUS = conf['corpus']
        MONGOHOST = conf['mongo']['host']
        MONGOPORT = int(conf['mongo']['port'])
        ESHOST = conf['elasticsearch']['host']
        ESPORT = conf['elasticsearch']['port']

    parser = ArgumentParser()
    parser.add_argument('corpus')
    parser.add_argument('--batch-size', type=int, default=1000)
    parser.add_argument('--delete-index', action='store_true')
    parser.add_argument('--reset-mongo', action='store_true')
    args = parser.parse_args()
    if args.corpus:
        CORPUS = args.corpus
    if args.batch_size:
        BATCH_SIZE = args.batch_size
    if args.delete_index:
        DELETE_INDEX = args.delete_index
    if args.reset_mongo:
        RESET_MONGO = args.reset_mongo

    # Initiate MongoDB connection and build index on pages
    try:
        db = pymongo.MongoClient(MONGOHOST, MONGOPORT)
        dbpages = db["hyphe_%s" % CORPUS]["pages"]
    except Exception as e:
        exit('Could not initiate connection to MongoDB')
    ensure_index_on_pages(dbpages)

    # connect to ES
    es = Elasticsearch('%s:%s'%(ESHOST, ESPORT))

    if es.indices.exists(index='hyphe.%s.txt' % CORPUS) and DELETE_INDEX:
        print('index deleted')
        es.indices.delete(index='hyphe.%s.txt' % CORPUS)
    if not es.indices.exists(index='hyphe.%s.txt' % CORPUS):
        if RESET_MONGO:
            dbpages.update({}, {'$set': {'to_index': True}}, multi=True, upsert=False)
            print('mongo index created')
            dbpages.update({'$or': [{'content_type': {"$not": {"$in": ["text/plain", "text/html"]}}}, {'body': {'$exists': False}}]}, {'$set': {'to_index': False}})
            print('set non-content page to not to_index')
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

    # Run!
    index_text_page(db, es, CORPUS)
