#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, os, re
import pymongo
import jsonrpclib
from md5 import md5
from html2text import textify
from elasticsearch import Elasticsearch
from elasticsearch import helpers
import time
from dragnet import extract_content, extract_content_and_comments

BATCH_SIZE = 1000


def ensure_index_on_pages(mongo_pages_coll):
    print("building mongo index")
    mongo_pages_coll.create_index([('indexed', pymongo.ASCENDING), ("content_type", pymongo.ASCENDING), ("status", pymongo.ASCENDING)])
    print("index done")


def index_text_page(hyphe_core, mongo_pages_coll, es, corpus, content_types=["text/plain", "text/html"]):
    throttle = 0.5
    while True:
        # boucle infinie
        query = {
            "status": 200,
            "content_type": {"$in": content_types},
            "body" : {"$exists": True},
            "indexed" : False
        }
        total = 0
        pages = []
        for page in mongo_pages_coll.find(query).sort('timestamp').limit(BATCH_SIZE):

            page_to_index = {
                'url': page['url'],
                'lru': page['lru']
            }
            total += 1

            body = page["body"].decode('zip')
            
            encoding = page.get("encoding", "")
            try:
                body = body.decode(encoding)
            except Exception :
                body = body.decode("UTF8", "replace")
                encoding = "UTF8-replace"
            # We shouldn't do that, prefix tree in memory... 
            we = hyphe_core.store.get_webentity_for_url_as_lru(page["lru"], corpus)
            try:
                assert we["code"] == "success"
                page_to_index["webentity_id"] = we["result"]["id"]
                page_to_index["webentity_name"] = we["result"]["name"]
            except:
                print("WARNING! Could not resolve WebEntity for url %s" % page["url"])

            #page["html"] = body
            page_to_index["text"] = textify(body, encoding=encoding)
            page_to_index["dragnet"] = extract_content(body, encoding=encoding)
            pages.append(page_to_index)
        # index batch to ES
        index_result = helpers.bulk(es, [{'_source':p} for p in pages], index='hyphe.%s.txt' % corpus, doc_type='webpage')
        print index_result
        # update status in mongo
        mongo_update = mongo_pages_coll.update({'url' : {'$in' : [p['url'] for p in pages]}}, {'$set': {'indexed': True}}, multi=True, upsert=False)
        print mongo_update
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
    # - corpus
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
    corpus = "fosdem"
    password = ""

    # Initiate Hyphe API connection and ensure corpus started
    try:
        hyphe = jsonrpclib.Server(api, version=1)
    except Exception as e:
        exit('Could not initiate connection to hyphe core')
    start = hyphe.start_corpus(corpus, password)
    if start['code'] == 'fail' :
        exit(start['message'])

    # Initiate MongoDB connection and build index on pages
    try:
        db = pymongo.MongoClient(mongohost, mongoport)
        dbpages = db["hyphe_%s" % corpus]["pages"]
    except Exception as e:
        exit('Could not initiate connection to MongoDB')
    ensure_index_on_pages(dbpages)
    
    # connect to ES
    es = Elasticsearch('localhost:9200')

    if DELETE_INDEX:
        es.indices.delete(index='hyphe.%s.txt' % corpus)
    if not es.indices.exists(index='hyphe.%s.txt' % corpus):
        if RESET_MONGO:
            mongo_update = dbpages.update({}, {'$set': {'indexed': False}}, multi=True, upsert=False)
        es.indices.create(index='hyphe.%s.txt' % corpus, body = {
            "mappings": {
                "webpage":{
                    "properties":{
                        "lru": {
                            "type": "keyword"
                        }
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
    index_text_page(hyphe, dbpages, es, corpus)

    # example of an update_by_query on a prefix lru search to update webentity
    # will never be executed unless index_text_page() is documented
    body = {
        "script": {
            "source": "ctx._source.webentity_id=params.new_we_id",
            "lang": "painless",
            "params":{
                "new_we_id": 999
            }
        },
        "query": {
            "prefix" : { "lru" : "s:https|h:org|h:fosdem|p:2019|p:schedule|" }
        }
    }
    es.update_by_query(index='hyphe.%s.txt' % corpus, body = body, conflicts="proceed")