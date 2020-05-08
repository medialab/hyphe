import pymongo
from config import *
import json
import time
import zlib
import signal
import traceback
import signal
# utils
from collections import Counter
import datetime
from hashlib import md5
# elasticsearch deps
from elasticsearch import Elasticsearch, helpers
from elasticsearch_utils import connect_to_es
# multiprocessing
from multiprocessing import Process, Queue
import logging
import logging.handlers
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




def indexation_task(corpus, batch_uuid, es, mongo):
    logg = logging.getLogger()
    total = 0
    jobs = set()
    pages = []
    mongo_pages_coll = mongo["hyphe_%s" % corpus]["pages"]
    # get the prepared batch
    query = {
        "to_index": "IN_BATCH_%s"%batch_uuid
    }
    for page in mongo_pages_coll.find(query):
        jobs.add(page['_job'])
        stems = page['lru'].rstrip('|').split('|')
        page_to_index = {
            '_id': md5(page['url'].encode('UTF8')).hexdigest(),
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
            # TODO : add page id or something
            logg.exception("DRAGNET ERROR")
            page_to_index["dragnet"] = None
        page_to_index["indexDate"] = datetime.datetime.now()
        pages.append(page_to_index)
    # index batch to ES
    try:
        nb_indexed_docs, errors = helpers.bulk(es, [{
                "_op_type": "update",
                "doc_as_upsert": True,
                "_id": p['_id'],
                # we don't index _id as a doc field...
                'doc':{k:v for k,v in p.items() if k !='_id'} 
            } for p in pages],
            index='hyphe_%s' % corpus,
            raise_on_error=False)
        if nb_indexed_docs > 0:
            logg.info("%s: %s pages indexed in batch %s"%(corpus, nb_indexed_docs, batch_uuid))
        # deal with indexing errors
        if len(errors)>0:
            logg.info("%s doc were not indexed in the batch"%len(errors))
            logg.debug(errors)
            not_indexed_doc_ids = set(e["update"]["_id"] for e in errors)
            #TODO: depending on error we might ignore some page so far we will retry in next batch
        else:
            not_indexed_doc_ids = []
        # removing errornous doc from list 
        indexed_page_urls = []
        not_indexed_page_urls = []
        for p in pages:
            if p["_id"] not in not_indexed_doc_ids:
                indexed_page_urls.append(p['url'])
            else:
                not_indexed_page_urls.append(p['url'])

        # update status in mongo
        mongo_pages_coll.update_many({'url' : {'$in' : indexed_page_urls}}, {'$set': {'to_index': False}}, upsert=False)
        # remove other pages from batch back to index = true (typically errors page)
        mongo_pages_coll.update_many({'to_index' : 'IN_BATCH_%s'%batch_uuid}, {'$set': {'to_index': True}}, upsert=False)
        

    except Exception as e:
        # we use raise_on_error=False so we consider an exception to discard the complete batch
        pages = []
        logg.exception("%s: error in index bulk"%corpus)
        logg.debug(e)
        return 1
        
    # tag jobs when completed
    not_completed_jobs_pipeline = [
        {
            "$match": {
            "_job" : {"$in": list(jobs)},
            "to_index": True
            }
        },
        {
            "$group": {
                "_id": "$_job"
            }
        }
    ]
    # counting completed jobs
    not_completed_jobs = set(o['_id'] for o in mongo_pages_coll.aggregate(not_completed_jobs_pipeline))
    completed_jobs = jobs - not_completed_jobs
    if len(completed_jobs) > 0:
        mongo_jobs_coll = mongo["hyphe_%s" % corpus]["jobs"]
        r = mongo_jobs_coll.update_many({'crawljob_id': {"$in": list(completed_jobs)}, 'crawling_status': {"$in":['FINISHED', 'CANCELED', 'RETRIED']}}, {'$set': {'text_indexed': True}})
        if r.matched_count > 0:
            logg.info("%s: %s of %s jobs were fully indexed"%(corpus, r.matched_count, completed_jobs))

def updateWE_task(corpus, es, mongo):
    logg = logging.getLogger()
    # update web entity - page structure
    mongo_webupdates_coll =  mongo["hyphe_%s" % corpus]["WEupdates"]
    mongo_jobs_coll =  mongo["hyphe_%s" % corpus]["jobs"]
    weupdates = list(mongo_webupdates_coll.find({"index_status": "PENDING"}).sort('timestamp'))
    logg.info("%s: %s WE updates waiting"%(corpus, len(weupdates)))
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
            logg.debug(index_result)
            logg.info("%s: %s pages updated in %sms"%(corpus, index_result['updated'], index_result['took']))
            weupdates = mongo_webupdates_coll.update_one({"_id": weupdate['_id']}, {'$set': {'index_status': 'FINISHED'}})

# worker
def indexation_worker(input, logging_queue):
    # leave sigint handling to the parent process 
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    es = connect_to_es(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT, ELASTICSEARCH_TIMEOUT_SEC)
    mongo = pymongo.MongoClient(MONGO_HOST, MONGO_PORT)
    #logging
    logging_handler = logging.handlers.QueueHandler(logging_queue)
    logg = logging.getLogger()
    logg.handlers = []
    logg.setLevel(logging.INFO)
    logg.addHandler(logging_handler)


    for task in iter(input.get, 'STOP'):
        try:
            if task['type'] == "indexation":
                indexation_task(task['corpus'], task['batch_uuid'], es, mongo)
            if task['type'] == "updateWE":
                updateWE_task(task['corpus'], es, mongo)
        except Exception:
            logg.exception("ERROR in task %s for corpus %s"%(task['type'],task['corpus']))       
    logg.info('stopping')
    input.close()
    logging_queue.close()
    exit


# Create queues
task_queue = Queue(NB_INDEXATION_WORKERS)
# logging queue
logging_queue = Queue(-1)  # no limit on size

# set logging
file_handler = logging.handlers.RotatingFileHandler('hyphe_text_indexation.log', 'a', 5242880, 4)
console_handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s %(processName)s %(levelname)s %(message)s')
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.DEBUG)
logging_listener = logging.handlers.QueueListener(logging_queue, file_handler, console_handler)

try: 

    logging_listener.start()
    # The log output will display the thread which generated
    # the event (the main thread) rather than the internal
    # thread which monitors the internal queue. This is what
    # you want to happen.
    queue_handler = logging.handlers.QueueHandler(logging_queue)
    logg = logging.getLogger()
    logg.setLevel(logging.INFO)
    logging.getLogger(name='elasticsearch').setLevel(logging.WARNING)
    logg.addHandler(queue_handler)


    # start workers
    workers = []
    logg.info("starting %s workers"%NB_INDEXATION_WORKERS)
    for i in range(NB_INDEXATION_WORKERS):
        # create a dedicated connections to db
    
        p = Process(target=indexation_worker, args=(task_queue, logging_queue), daemon=True, name="worder-%s"%i)
        p.start()
        workers.append(p)

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
                logg.info("resetting mongo")
                mongo_pages_coll = mongo["hyphe_%s" % corpus]["pages"]
                mongo_pages_coll.update_many({}, {'$set': {'to_index': True}}, upsert=False)
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
                    logg.info('index %s deleted'%corpus)
                # create ES index
                es.indices.create(index=index_name(corpus), body = index_mappings)        
                logg.info("index %s created"%corpus)
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
        for c in corpora:
            if nb_pages_to_index[c] > 0:
                # create a batch
                batch_ids = [d['_id'] for d in mongo["hyphe_%s" % c]["pages"].find({
                    "to_index": True,
                    "forgotten": False,
                }, projection=["_id"]).sort('timestamp').limit(BATCH_SIZE)]
                batch_uuid = md5("|".join(batch_ids).encode('UTF8')).hexdigest()
                # change index status to "in batch"
                logg.debug("added %s pages in new batch %s"%(len(batch_ids), batch_uuid))
                mongo["hyphe_%s" % c]["pages"].update_many({'_id': {'$in': batch_ids}}, {'$set': {'to_index': 'IN_BATCH_%s'%batch_uuid}})
                # create task with corpus and batch uuid
                task_queue.put({"type": "indexation", "corpus": c, "batch_uuid": batch_uuid})
            nb_index_batches_since_last_update[c]+=1
        # TODO: SET a different order for updateWE ? 
        for c in corpora:
            if nb_we_updates[c] > 0 and nb_index_batches_since_last_update[c] > UPDATE_WE_FREQ:
                task_queue.put({"type": "updateWE", "corpus": c})
                nb_index_batches_since_last_update[c]=0
        first_run = False

        # loop
        if sum(nb_pages_to_index.values()) == 0 and sum(nb_we_updates.values()) == 0: 
            # wait for more tasks to be created
            logg.info('waiting %s'%throttle)
            time.sleep(throttle)
            if throttle < 5:
                throttle += 0.5
        else:
            # next throttlet will be 
            throttle = 0.5
except Exception:
    logg.exception("in main")
finally:
    logg.info('waiting for workers to stop')
    # flush pending tasks
    while not task_queue.empty():
        task_queue.get_nowait()
    # stop workers
    for _ in range(NB_INDEXATION_WORKERS):
        task_queue.put('STOP')
    # wait for them to finish their current task
    for w in workers:
        w.join(timeout=1000)
    # TODO : remove in_batch status from page in mongo ?
    task_queue.close()
    logg.info('workers died, killing myself')
    logging_listener.stop()
