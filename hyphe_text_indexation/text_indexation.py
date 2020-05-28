import pymongo
from config import *
import json
import time
import zlib
import signal
import os
# utils
from collections import Counter
import datetime
from hashlib import md5
# elasticsearch deps
from elasticsearch import helpers
from elasticsearch_utils import connect_to_es, index_name
# multiprocessing
from multiprocessing import Process, Queue
import logging
import logging.handlers


# html to text methods
from html2text import textify
import dragnet
import trafilatura
# for page title extraction
from lxml.html import fromstring
        







def indexation_task(corpus, batch_uuid, extraction_methods, es, mongo):
    logg = logging.getLogger()
    total = 0

    pages = []
    mongo_pages_coll = mongo["hyphe_%s" % corpus]["pages"]
    # get the prepared batch
    query = {
        "text_indexation_status": "IN_BATCH_%s"%batch_uuid
    }
    for page in mongo_pages_coll.find(query):
        
        stems = page['lru'].rstrip('|').split('|')
        page_to_index = {
            '_id': md5(page['url'].encode('UTF8')).hexdigest(),
            'url': page['url'],
            'lru': page['lru'],
            'prefixes': ['|'.join(stems[0:i + 1])+'|' for i in range(len(stems))],
            'HTTP_status': page['status'],
            'crawlDate': datetime.datetime.fromtimestamp(page['timestamp']/1000)
        }
        total += 1

        html = zlib.decompress(page["body"])

        encoding = page.get("encoding", "")
        try:
            html = html.decode(encoding)
        except Exception :
            html = html.decode("UTF8", "replace")
            encoding = "UTF8-replace"

        page_to_index["webentity_id"] = page['webentity_when_crawled']

        page["html"] = html
        if 'textify' in extraction_methods:
            page_to_index["textify"] = textify(html, encoding=encoding)
        if 'dragnet' in extraction_methods:
            try:
                page_to_index["dragnet"] = dragnet.extract_content(html, encoding=encoding)
            except Exception as e:
                # TODO : add page id or something
                logg.exception("Dragnet error")
                page_to_index["dragnet"] = None
        if 'trafilatura' in extraction_methods:
            try:
                page_to_index["trafilatura"] = trafilatura.extract(html)
            except Exception:
                logg.exception("Trafilatura error")
                page_to_index["trafilatura"] = None    
        # extract title
        try:
            page_tree = fromstring(html)
            page_to_index['title'] = page_tree.findtext('.//title')
        except Exception:
            page_to_index['title'] = None
        
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
            index=index_name(corpus),
            raise_on_error=False)
        if nb_indexed_docs > 0:
            logg.info("%s: %s pages indexed in batch %s"%(corpus, nb_indexed_docs, batch_uuid))
        # deal with indexing errors
        if len(errors)>0:
            logg.warning("%s doc were not indexed in the batch %s"%(len(errors), batch_uuid))
            logg.error(errors)
            not_indexed_doc_ids = set(e["update"]["_id"] for e in errors)
            error_messages = {e["update"]["_id"]: "%s : %s"%(e["update"]["error"]["type"], e["update"]["error"]["reason"]) for e in errors}
        else:
            not_indexed_doc_ids = []
        # removing errornous doc from list 
        indexed_page_urls = []
        not_indexed_page = []
        for p in pages:
            if p["_id"] not in not_indexed_doc_ids:
                indexed_page_urls.append(p['url'])
            else:
                not_indexed_page.append({'url':p['url'], 'error_message': error_messages[p['_id']]})

        # update status in mongo
        # TODO : add to_index batch in query ?
        mongo_pages_coll.update_many({'text_indexation_status': "IN_BATCH_%s"%batch_uuid, 'url': {'$in' : indexed_page_urls}}, {'$set': {'text_indexation_status': 'INDEXED'}}, upsert=False)
        # not indexed page beacause of errors are discarded 
        if len(not_indexed_page)>0:
            for p in not_indexed_page:
                mongo_pages_coll.update_one({'url' : p['url'], 'text_indexation_status': "IN_BATCH_%s"%batch_uuid}, {'$set': {'text_indexation_status': "ERROR_IN_INDEXATION", 'text_indexation_error': p['error_message']}}, upsert=False)        

    except Exception as e:
        # we use raise_on_error=False so we consider an exception to discard the complete batch
        pages = []
        logg.exception("%s: error in index bulk"%corpus)
        logg.debug(e)
        return 1
    return 0     
   
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
                    "source": "ctx._source.webentity_id = params.new_webentity_id; ctx._source.WEUpdateDate=params.updateDate",
                    "params": {
                        "new_webentity_id": weupdate['new_webentity'],
                        "updateDate": datetime.datetime.now()
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
                        "source": "ctx._source.webentity_id = params.new_webentity_id; ctx._source.WEUpdateDate=params.updateDate",
                        "params": {
                            "new_webentity_id": weupdate['new_webentity'],
                            "updateDate": datetime.datetime.now()
                        }
                    },
                    "query": {
                        "term": {
                            "webentity_id": weupdate['old_webentity']
                        }
                    }
                }
            try:
                index_result = es.update_by_query(index=index_name(corpus), body = updateQuery, conflicts="proceed")
            except Exception:
                logg.exception('update WE %s=>%s failed'%(weupdate['old_webentity'], weupdate['new_webentity']))
            else:
                logg.info("%s: %s pages updated in %sms update %s"%(corpus, index_result['updated'], index_result['took'], weupdate['_id']))
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
                indexation_task(task['corpus'], task['batch_uuid'], task['extraction_methods'], es, mongo)
            if task['type'] == "updateWE":
                updateWE_task(task['corpus'], es, mongo)
        except Exception:
            logg.exception("ERROR in task %s for corpus %s"%(task['type'],task['corpus']))       
    logg.info('stopping')
    input.close()
    logging_queue.close()
    exit


# init
parser = ArgumentParser()
parser.add_argument('--batch-size', type=int)
parser.add_argument('--nb-indexation-workers', type=int)
args = parser.parse_args()
# priority to args on config
if args.batch_size:
    BATCH_SIZE = args.batch_size
if args.nb_indexation_workers:
    NB_INDEXATION_WORKERS = args.nb_indexation_workers


# set logging
if not os.path.exists('./log'):
    os.makedirs('./log')

# logging queue
logging_queue = Queue(-1)  # no limit on size

# The log output will display the thread which generated
# the event (the main thread) rather than the internal
# thread which monitors the internal queue. This is what
# you want to happen.
queue_handler = logging.handlers.QueueHandler(logging_queue)
logg = logging.getLogger()
logg.setLevel(logging.INFO)
# make libraries log less
logging.getLogger(name='elasticsearch').setLevel(logging.WARNING)
logging.getLogger(name='readability.readability').propagate = False
logging.getLogger(name='trafilatura.core').setLevel(logging.WARNING)
logg.addHandler(queue_handler)
file_handler = logging.handlers.RotatingFileHandler('./log/hyphe_text_indexation.log', 'a', 5242880, 4)
console_handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s %(processName)s %(levelname)s %(message)s')
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.DEBUG)
logging_listener = logging.handlers.QueueListener(logging_queue, file_handler, console_handler)
logging_listener.start()

try: 
    # Initiate MongoDB connection and build index on pages
    try:
        print("connecting to mongo...")
        mongo = pymongo.MongoClient(MONGO_HOST, MONGO_PORT)
    except Exception as e:
        logg.exception("can't connect to mongo")
        exit('Could not initiate connection to MongoDB')


    # initiate elasticsearch connection
    # connect to ES
    # Wait for Elasticsearch to come up.
    es = connect_to_es(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT, ELASTICSEARCH_TIMEOUT_SEC)
    print('Elasticsearch started!')

    with open('index_mappings.json', 'r', encoding='utf8') as f:
        index_mappings = json.load(f)
    
    

    # Create queues
    task_queue = Queue(NB_INDEXATION_WORKERS)
    
    # start workers
    workers = []
    logg.info("starting %s workers"%NB_INDEXATION_WORKERS)
    for i in range(NB_INDEXATION_WORKERS):
        # create a dedicated connections to db
    
        p = Process(target=indexation_worker, args=(task_queue, logging_queue), daemon=True, name="worker-%s"%i)
        p.start()
        workers.append(p)

    first_run = True
    UPDATE_WE_FREQ = 5 # unit is the number of indexation batches 
    nb_index_batches_since_last_update = Counter()
    throttle = 0.5
    hyphe_corpus_coll = mongo["hyphe"]["corpus"]
    extraction_methods_by_corpus = {}
    while True:
        # get and init corpus index
        corpora = []
        nb_pages_to_index = {}
        nb_we_updates = {}
        # retrive existing indices in ES
        existing_es_indices = es.indices.get(index_name('*'))
        index_to_keep = set()
        for c in hyphe_corpus_coll.find({"options.indexTextContent": True}, projection={
                "options.text_indexation_extraction_methods":1, 
                "options.text_indexation_default_method":1}):
            corpus = c["_id"]
            mongo_pages_coll = mongo["hyphe_%s" % corpus]["pages"]
            
            
            nb_pages_to_index[corpus] = mongo_pages_coll.count_documents({
                "text_indexation_status": "TO_INDEX",
                "forgotten": False
            })
            nb_we_updates[corpus] = mongo["hyphe_%s" % corpus]["WEupdates"].count_documents({"index_status": "PENDING"})
            corpora.append(corpus)
            # check index exists in elasticsearch
            index_exists =  index_name(corpus) in existing_es_indices

            if not index_exists or first_run:
                # check extraction methods and adapt mapping with alias
                if 'options' in c and 'text_indexation_default_extraction_method' in c['options']:
                    default_extraction_method = c['options']['text_indexation_default_extraction_method']
                else:
                    default_extraction_method = DEFAULT_EXTRACTION_METHOD
                if 'options' in c and 'text_indexation_extraction_methods' in c['options']:
                    extraction_methods = c['options']['text_indexation_extraction_methods']
                else: 
                    extraction_methods = EXTRACTION_METHODS
                # adapt mappings with default extraction methods
                if not default_extraction_method in ['textify', 'dragnet', 'trafilatura']:
                    logg.warning("unknown DEFAULT_EXTRACTION_METHOD %s"%default_extraction_method)
                    if len(extraction_methods)>0:
                        logg.info("using first method instead %s"%extraction_methods[0])
                        default_extraction_method = extraction_methods[0]
                else:
                    if not default_extraction_method in extraction_methods:
                        logg.warning("Default extraction method %s was not in extraction methods in config. Adding it.")
                        extraction_methods.append(default_extraction_method)
                index_mappings["mappings"]["properties"]["text"]["path"] = default_extraction_method
                extraction_methods_by_corpus[corpus] = extraction_methods
                if not index_exists:
                    # create ES index
                    es.indices.create(index=index_name(corpus), body = index_mappings)
                    logg.info("index %s created"%corpus)
                else:
                    es.indices.put_mapping(index=index_name(corpus), body=index_mappings['mappings'])
            index_to_keep.add(index_name(corpus))
        # checking if some corpus has been deleted
        index_to_delete = existing_es_indices.keys() - index_to_keep
        if len(index_to_delete) > 0:
            # cleaning ES after corpus been deleted in mongo
            logg.info('deleting %s indices'%index_to_delete)
            es.indices.delete(index=','.join(index_to_delete))
            del extraction_methods_by_corpus[corpus]
            del nb_index_batches_since_last_update[corpus]
        # order corpus by last inserts
        if len(index_to_keep)>0:
            last_index_dates = {r['key']:r['maxIndexDate']['value'] for r in es.search(body={
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
        else:
            last_index_dates = {}

        corpora = sorted(corpora, key=lambda c : last_index_dates[index_name(c)] if index_name(c) in last_index_dates else 0)
        
        # add tasks in queue
        for c in corpora:
            if nb_pages_to_index[c] > 0:
                # create a batch
                batch_ids = [d['_id'] for d in mongo["hyphe_%s" % c]["pages"].find({
                    "text_indexation_status": "TO_INDEX",
                    "forgotten": False,
                }, projection=["_id"]).sort('timestamp').limit(BATCH_SIZE)]
                batch_uuid = md5("|".join(batch_ids).encode('UTF8')).hexdigest()
                # change index status to "in batch"
                logg.debug("added %s pages in new batch %s"%(len(batch_ids), batch_uuid))
                mongo["hyphe_%s" % c]["pages"].update_many({'_id': {'$in': batch_ids}}, {'$set': {'text_indexation_status': 'IN_BATCH_%s'%batch_uuid}})
                # create task with corpus and batch uuid
                task_queue.put({"type": "indexation", "corpus": c, "batch_uuid": batch_uuid, "extraction_methods": extraction_methods_by_corpus[c]})
            nb_index_batches_since_last_update[c]+=1

        # checking job completion 
        for c in corpora:
            mongo_jobs_coll = mongo["hyphe_%s" % c]["jobs"]
            mongo_pages_coll = mongo["hyphe_%s" % c]["pages"]
            # look for unindexed but finished jobs
            pending_jobs_ids = set([j['crawljob_id'] for j in mongo_jobs_coll.find({
                'crawling_status': {"$in":['FINISHED', 'CANCELED', 'RETRIED']},
                'text_indexed': {'$ne': True}
            }, projection=('_id','crawljob_id'))])
            
            # tag jobs when completed
            not_completed_jobs_pipeline = [
                {
                    "$match": {
                        "_job" : {"$in": list(pending_jobs_ids)},
                        "text_indexation_status": "TO_INDEX",
                        "forgotten": False
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
            completed_jobs = pending_jobs_ids - not_completed_jobs
            
            if len(completed_jobs) > 0:
                r = mongo_jobs_coll.update_many({'crawljob_id': {"$in": list(completed_jobs)}}, {'$set': {'text_indexed': True}})
                if r.modified_count != len(completed_jobs):
                    logg.warning('only %s jobs were modified on %s completed ?'%(r.modified_count, len(completed_jobs)))
                logg.info("%s: %s jobs were fully indexed. %s pending."%(c, len(completed_jobs), len(not_completed_jobs)))



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
            
except KeyboardInterrupt:
    # do not raise, closing nicely done in finally clause
    pass
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
        w.join(timeout=3000)
    # TODO : remove in_batch status from page in mongo ?
    task_queue.close()
    logg.info('workers died, killing myself')
    logging_listener.stop()
