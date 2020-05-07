import pymongo
from config import *
import json
import time
import zlib
import signal
import traceback
# utils
from collections import Counter
import datetime
from hashlib import md5
# elasticsearch deps
from elasticsearch import Elasticsearch, helpers
from elasticsearch_utils import connect_to_es
# multiprocessing
from multiprocessing import Process, Queue

# html to text methods
from html2text import textify
# TODO: import only if needed by conf to avoid installing deps ? 
from dragnet import extract_content, extract_content_and_comments






# init
# Initiate MongoDB connection and build index on pages
try:
    print("connecting to mongo...")
    mongo = pymongo.MongoClient(MONGO_HOST, MONGO_PORT)
except Exception as e:
    print("can't connect to mongo")
    exit('Could not initiate connection to MongoDB')


# initiate elasticsearch connection
# connect to ES
# Wait for Elasticsearch to come up.
es = connect_to_es(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT, ELASTICSEARCH_TIMEOUT_SEC)
print('Elasticsearch started!')

with open('index_mappings.json', 'r', encoding='utf8') as f:
    index_mappings = json.load(f)


def index_name(c) :
    return "hyphe_%s"%c
hyphe_corpus_coll = mongo["hyphe"]["corpus"]




def indexation_task(corpus, es, mongo):
    total = 0
    jobs = set()
    pages = []
    mongo_pages_coll = mongo["hyphe_%s" % corpus]["pages"]
    # take XXX pages sorted by timestamp if index = false
    query = {
        "to_index": True,
        "forgotten": False
    }
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
        # TODO : use config to know which method.s to use ?
        page_to_index["textify"] = textify(body, encoding=encoding)
        try:
            page_to_index["dragnet"] = extract_content(body, encoding=encoding)
        except Exception as e:
            print("DRAGNET ERROR")
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
            index='hyphe_%s' % corpus)
        if index_result > 0:
            print("%s: %s pages indexed"%(corpus, index_result))
        # update status in mongo
        mongo_update = mongo_pages_coll.update_many({'url' : {'$in' : [p['url'] for p in pages]}}, {'$set': {'to_index': False}}, upsert=False)
    except Exception as e:
        print("%s: error in index bulk"%corpus)
        raise e
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
    completed_jobs = jobs - not_completed_jobs
    if len(completed_jobs) > 0:
        mongo_jobs_coll = mongo["hyphe_%s" % corpus]["jobs"]
        r = mongo_jobs_coll.update_many({'crawljob_id': {"$in": list(completed_jobs)}, 'crawling_status': {"$in":['FINISHED', 'CANCELED', 'RETRIED']}}, {'$set': {'text_indexed': True}})
        if r.matched_count > 0:
            print("%s: %s of %s jobs were fully indexed"%(corpus, r.matched_count, completed_jobs))

def updateWE_task(corpus, es, mongo):
    # update web entity - page structure
    mongo_webupdates_coll =  mongo["hyphe_%s" % corpus]["WEupdates"]
    mongo_jobs_coll =  mongo["hyphe_%s" % corpus]["jobs"]
    weupdates = list(mongo_webupdates_coll.find({"index_status": "PENDING"}).sort('timestamp'))
    print("%s: %s WE updates waiting"%(corpus, len(weupdates)))
    for weupdate in weupdates:
        nb_unindexed_jobs = mongo_jobs_coll.count_documents({"webentity_id": weupdate['old_webentity'], "text_indexed": {"$exists": False}, "started_at":{"$lt":weupdate['timestamp']}})
        # don't update WE structure in text index if there is one crawling job
        if nb_unindexed_jobs == 0:
            print('%s: updating index WE_is %s => %s'%(corpus, weupdate['old_webentity'], weupdate['new_webentity']))
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
            index_result = es.update_by_query(index='hyphe_%s' % corpus, body = updateQuery, conflicts="proceed")
            print("%s: %s pages updates"%(corpus, index_result['updated']))
            weupdates = mongo_webupdates_coll.update_one({"_id": weupdate['_id']}, {'$set': {'index_status': 'FINISHED'}})

# worker
def indexation_worker(worker_id, input):
    es = connect_to_es(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT, ELASTICSEARCH_TIMEOUT_SEC)
    mongo = pymongo.MongoClient(MONGO_HOST, MONGO_PORT)
    # avoid waiting for the queue to be flushed
    input.cancel_join_thread()
    for task in iter(input.get, 'STOP'):
        if task['type'] == "indexation":
            indexation_task(task['corpus'] , es, mongo)
            
        if task['type'] == "updateWE":
            updateWE_task(task['corpus'], es, mongo)
            
    print('worker %s stopping'%worker_id)
    exit(0)



# Create queues
task_queue = Queue(NB_INDEXATION_WORKERS)

# start workers
workers = []
print("starting %s workers"%NB_INDEXATION_WORKERS)
for i in range(NB_INDEXATION_WORKERS):
    # create a dedicated connections to db
   
    p = Process(target=indexation_worker, args=(i, task_queue), daemon=True)
    p.start()
    workers.append(p)

# TODO: INTERRUPTION HANDLING
first_run = True
UPDATE_WE_FREQ = 5 # unit is the number of indexation batches 
nb_index_batches_since_last_update = Counter()
throttle = 0.5
while True:
    # get and init corpus index
    corpora = []
    nb_pages_to_index = {}
    nb_we_updates = {}
    for c in hyphe_corpus_coll.find({"options.indexTextContent": True}, projection=["_id"]):
        corpus = c["_id"]
        mongo_pages_coll = mongo["hyphe_%s" % corpus]["pages"]
        if first_run and RESET_MONGO:
            mongo_pages_coll = mongo["hyphe_%s" % corpus]["pages"]
            mongo_pages_coll.update_many({}, {'$set': {'to_index': True}}, upsert=False)
            print('mongo index created')
            mongo_pages_coll.update_many({'$or': [
                {'content_type': {"$not": {"$in": ["text/plain", "text/html"]}}},
                {'body': {'$exists': False}},
                {'status': {"$ne": 200}},
                {'size': 0}]},
                {'$set': {'to_index': False}},  upsert=False)
            mongo["hyphe_%s" % corpus]["WEupdates"].update_many({},{'$set':{'index_status': 'PENDING'}})
            mongo["hyphe_%s" % corpus]["jobs"].update_many({},{'$unset':{'text_indexed':True}})
        
        nb_pages_to_index[corpus] = mongo_pages_coll.count_documents({
            "to_index": True,
            "forgotten": False
        })
        nb_we_updates[corpus] = mongo["hyphe_%s" % corpus]["WEupdates"].count_documents({"index_status": "PENDING"})
        corpora.append(corpus)
        # check index exists in elasticsearch
        index_exists =  es.indices.exists(index=index_name(corpus))
        if not index_exists or (first_run and index_exists and DELETE_INDEX):
            if (first_run and  index_exists and DELETE_INDEX):
                es.indices.delete(index=index_name(corpus))
                print('index %s deleted'%corpus)
            # create ES index
            es.indices.create(index=index_name(corpus), body = index_mappings)        
            print("index %s created"%corpus)
    # order corpus by last inserts
    lastIndexDates = {r['key']:r['maxIndexDate']['value'] for r in es.search(body={
        "size":0,
        "aggs": {
            "indices": {
            "terms": {
                "field": "_index"   
            },
            "aggs":{
                "maxIndexDate": { "max" : { "field" : "indexDate" } }
                }
            }  
        }
    })["aggregations"]["indices"]["buckets"]}
    corpora = sorted(corpora, key=lambda c : lastIndexDates[index_name(c)] if index_name(c) in lastIndexDates else 0)
    
    # add tasks in queue
    # TODO: check there are pages to index
   
   
    for c in corpora:
        if nb_pages_to_index[c] > 0:
            task_queue.put({"type": "indexation", "corpus": c})
        nb_index_batches_since_last_update[c]+=1
    # TODO: SET a different order for updateWE ? 
    for c in corpora:
        if nb_we_updates[c] > 0 and nb_index_batches_since_last_update[c] > UPDATE_WE_FREQ:
            task_queue.put({"type": "updateWE", "corpus": c})
            nb_index_batches_since_last_update[c]=0
    first_run = False

    # loop
    #TODO: throttle if batch empty
    if sum(nb_pages_to_index.values()) == 0 and sum(nb_we_updates.values()) == 0: 
        # wait for more tasks to be created
        print('waiting %s'%throttle)
        time.sleep(throttle)
        if throttle < 5:
            throttle += 0.5
    else:
        # next throttlet will be 
        throttle = 0.5
 
    # # Tell child processes to stop
    # for i in range(NB_PROCESS):
    #     task_queue.put('STOP')
