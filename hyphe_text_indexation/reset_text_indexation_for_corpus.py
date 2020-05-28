from argparse import ArgumentParser
from config import *
from elasticsearch import Elasticsearch
import pymongo
from elasticsearch_utils import index_name

parser = ArgumentParser()
parser.add_argument('corpus', nargs='+')
args = parser.parse_args()

# init ES
try:
    es = Elasticsearch('%s:%s'%(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT))
except:
    logg.exception("can't connect to elasticsearch %s:%s"%(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT))
    exit('Could not initiate connection to Elasticsearch')
# retrive existing indices in ES
existing_es_indices = es.indices.get(index_name('*'))


# Initiate MongoDB connection and build index on pages
try:
    print("connecting to mongo...")
    mongo = pymongo.MongoClient(MONGO_HOST, MONGO_PORT)
except Exception as e:
    logg.exception("can't connect to mongo %s:%s"%(MONGO_HOST, MONGO_PORT))
    exit('Could not initiate connection to MongoDB')


for corpus in args.corpus:
    confirm = input("Confirm resetting %s? (Y/n)"%corpus)
    if confirm in ["yes", "Y", "y", ""]:
        print("resetting %s"%corpus)
        # reset mongo
        try:
            mongo_pages_coll = mongo["hyphe_%s" % corpus]["pages"]
            mongo_pages_coll.update_many({'text_indexation_status': {'$ne': 'DONT_INDEX'}}, {'$set': {'text_indexation_status': 'TO_INDEX'}}, upsert=False)
            mongo_pages_coll.update_many({'$or': [
                {'content_type': {"$not": {"$in": ["text/plain", "text/html"]}}},
                {'body': {'$exists': False}},
                {'status': {"$ne": 200}},
                {'size': 0}]},
                {'$set': {'text_indexation_status': 'DONT_INDEX'}},  upsert=False)
            mongo["hyphe_%s" % corpus]["WEupdates"].update_many({},{'$set':{'index_status': 'PENDING'}})
            mongo["hyphe_%s" % corpus]["jobs"].update_many({},{'$unset':{'text_indexed':True}})
            print("mongo database hyphe_%s reset" % corpus)
        except pymongo.errors.InvalidName:
            print("Could not find the mongo database %s"%"hyphe_%s" % corpus)
        if index_name(corpus) in existing_es_indices:
            es.indices.delete(index=index_name(corpus))
            print('elasticsearch index %s deleted'%index_name(corpus))
        else:
            print("no elasticseach index found with name %s"%index_name(corpus))
    else:
        print("you're the boss, skipping %s"% corpus)