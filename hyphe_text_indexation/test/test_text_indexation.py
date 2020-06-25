from elasticsearch import Elasticsearch
import pytest
import jsonrpclib
import pymongo
from time import sleep
import os

from reset_text_indexation_for_corpus import reset_text_index

ELASTICSEARCH_HOST = os.getenv('ELASTICSEARCH_HOST', default='localhost')
ELASTICSEARCH_PORT = os.getenv('ELASTICSEARCH_PORT', default='9200')

HYPHE_API_URL = os.getenv('HYPHE_API_URL', default='http://localhost:80/api/')
MONGO_HOST = os.getenv('MONGO_HOST', default='localhost')
MONGO_PORT = int(os.getenv('MONGO_PORT', default=27017))

PREFIX_TEST_CORPUS = 'tti_'
START_PAGES = {
    'medialab': [
        'https://medialab.sciencespo.fr/activites/',
        'https://medialab.sciencespo.fr/equipe/paul-girard/',
        'https://medialab.sciencespo.fr/equipe/tommaso-venturini/',
        'https://medialab.sciencespo.fr/productions/2020-01-the-eat-datascape-an-experiment-in-digital-social-history-of-art-christophe-leclercq/'
    ],
    'ietf': ['https://tools.ietf.org/html/rfc3986']
}

TEXT_EXTRACTION_METHODS = ['textify', 'dragnet', 'trafilatura']

def are_web_entity_pages_synced(hyphe_api, elasticsearch, corpus, crawl_finished=True):
    try:
        we_r = hyphe_api.store.get_webentities(list_ids=[], sort=None, count=500, page=0,  light=False,  semilight=False, light_for_csv=False, corpus=corpus)
        assert we_r['code'] == "success", we_r['message']
        wes_in_core = {}
        for we in we_r['result']['webentities']:
            pages = hyphe_api.store.paginate_webentity_pages(we['_id'],5000,None,True,True,False,corpus)
            assert pages['code'] == 'success', pages['message']
            nb_pages = 0
            nb_errors = 0
            for p in pages['result']['pages']:
                if p['text_indexation_status'] == 'INDEXED':
                    nb_pages += 1
                if p['text_indexation_status'] == 'ERROR':
                    nb_errors += 1
            if nb_pages > 0:
                wes_in_core[we['_id']] = nb_pages
            assert nb_errors == 0, "%s errors in indexation" % nb_errors
        # retrive existing indices in ES
        we_pages_es = elasticsearch.search(index='hyphe_%s'%corpus,body={
                    "size":0,
                    "aggs": {
                        "webentity": {
                                "terms" : { "field" : "webentity_id", "size":9999 } 
                            }
                        }  
                    })
        elastic_we_pages = {int(w['key']):w['doc_count'] for w in we_pages_es["aggregations"]["webentity"]["buckets"]}

        for we,nb_pages in wes_in_core.items():
            if crawl_finished and nb_pages > 0:
                assert  we in elastic_we_pages and elastic_we_pages[we] == nb_pages
            else:
                assert  we not in elastic_we_pages or elastic_we_pages[we] <= nb_pages
    except AssertionError:
        return False
    else:
        return True

@pytest.fixture(scope="session")
def elasticsearch():
    try:
        es = Elasticsearch('%s:%s'%(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT))
    except Exception as e:
        print(e)
        pytest.exit('can\"t connect to ES')
    else:
        return es

@pytest.fixture(scope="session")
def hyphe_api():
    try:
        config = jsonrpclib.config.Config(version=1.0)
        history = jsonrpclib.history.History()
        hyphe_api = jsonrpclib.ServerProxy(HYPHE_API_URL, config=config, history=history)
    except Exception as e:
        print(e)
        pytest.exit("can't connect to Hyphe API")
    else:
        return hyphe_api

@pytest.fixture(scope="session")
def mongodb():
    try:
        mongo = pymongo.MongoClient(MONGO_HOST, MONGO_PORT)
    except Exception as e:
        print(e)
        pytest.exit("can't connect to mongodb")
    else:
        return mongo

def waiting_for(test, ready_value, throttle=0.2, timeout=5):
    time = 0
    t = test()
    while t != ready_value and time < timeout:
        sleep(throttle)
        t = test()
        time += throttle
    return t

def test_docker_environment_ready(hyphe_api, elasticsearch, mongodb):
    
    pong = hyphe_api.ping()    
    assert pong['result'] == "pong"
    
    # test mongodb connection and check no corpus exists 
    corpus = mongodb['hyphe']['corpus'].find({}, projection={"_id":1})
    destroy = False
    for c in corpus:
        if c['_id'] != '--test-corpus--' and PREFIX_TEST_CORPUS not in c['_id']:
            raise AssertionError("MongoDB is not empty. There are existing hyphe corpus {}".format(corpus))
        elif  PREFIX_TEST_CORPUS in c['_id']:
            print("destroying corpus %s"%c['_id'])
            hyphe_api.start_corpus(corpus = c['_id'])
            sleep(2)
            destroy = hyphe_api.destroy_corpus(c['_id'], False)
            assert destroy['code'] == 'success', 'couldn\'t destroy a corpus in hyphe: {}'.format(destroy['message'])
            destroy = True
    if destroy:
        print("waiting for ES to sync after corpus deletion")

    # elasticsearch hyphe_* should not already exist 
    indices = waiting_for(lambda : list(elasticsearch.indices.get("hyphe_*").keys()), [])
    assert indices == [], "Elasticsearch is not empty. There are existing hyphe indices {}".format(indices)
    
   
def test_create_corpus_create_index(hyphe_api, elasticsearch):
    create_corpus = hyphe_api.create_corpus('%smedialab'%PREFIX_TEST_CORPUS, "", {"indexTextContent":True, "txt_indexation_extraction_methods": TEXT_EXTRACTION_METHODS, "txt_indexation_default_extraction_method":'trafilatura'})
    assert create_corpus['code'] == 'success', 'couldn\'t create a corpus in hyphe: {}'.format(create_corpus['message'])
    # max indexation throttle time
    index_exists = waiting_for(lambda: elasticsearch.indices.exists(index='hyphe_%smedialab'%PREFIX_TEST_CORPUS), True)
    assert index_exists == True, "newly created corpus not created in elasticsearch"

def is_crawl_pending(job_ids, corpus, hyphe_api):
    jobs = hyphe_api.listjobs(list_ids=job_ids, corpus=corpus)
    assert jobs['code'] == 'success', jobs['message']
    return 'text_indexed' not in jobs['result'][0] or jobs['result'][0]['text_indexed'] == False


def test_create_WE_crawl_WECR(hyphe_api, elasticsearch):
    we = hyphe_api.store.declare_webentity_by_lru('s:https|h:fr|h:sciencespo|h:medialab|', "médialab", "IN", START_PAGES['medialab'], True, "%smedialab"%PREFIX_TEST_CORPUS)
    assert we['code'] == 'success', 'couldn\'t create médialab WE in hyphe: {}'.format(we['message'])
    we = we['result']
    we_id = we['id']
    crawl_job = hyphe_api.crawl_webentity(we_id, 0, False, 'IN', {}, "%smedialab"%PREFIX_TEST_CORPUS)
    assert crawl_job['code'] == 'success', 'couldn\'t start crawl'
    sleep(0.5)
    r = hyphe_api.store.add_webentity_creationrule("s:https|h:fr|h:sciencespo|h:medialab|p:equipe|", "prefix+1", "%smedialab"%PREFIX_TEST_CORPUS)
    assert r['code'] == 'success'
    assert are_web_entity_pages_synced(hyphe_api, elasticsearch, '%smedialab'%PREFIX_TEST_CORPUS, crawl_finished=False) == True
    # wait for end of crawl
    crawl_pending = waiting_for(lambda:is_crawl_pending([crawl_job['result']],'%smedialab'%PREFIX_TEST_CORPUS, hyphe_api), False, throttle=1, timeout=340)
    assert crawl_pending == False, "crawl indexation still pending after 340s!"
    # check status of Weupdate tasks in mongo
    index_updated = waiting_for(lambda:are_web_entity_pages_synced(hyphe_api, elasticsearch, '%smedialab'%PREFIX_TEST_CORPUS), True, throttle=0.5, timeout=10)
    assert index_updated == True,'index not synced correctly'

def webentity_nb_pages_in_es(webentity_id, elasticsearch):
    nb_pages_q = elasticsearch.search(index="hyphe_%smedialab"%PREFIX_TEST_CORPUS, body={
        "query":{
                "match":{
                "webentity_id":webentity_id
            }
        },
        "size":0
	})
    return nb_pages_q["hits"]["total"]["value"]

def test_manual_child_WE_creation_then_merge(hyphe_api, elasticsearch):
    # get number of page of parent web entity
    nb_page_parent_before = webentity_nb_pages_in_es(1, elasticsearch)
    # create a sub webentity
    datascape_we = hyphe_api.store.declare_webentity_by_lruprefix_as_url('https://medialab.sciencespo.fr/productions/2020-01-the-eat-datascape-an-experiment-in-digital-social-history-of-art-christophe-leclercq/', "publi_datascape", "IN", [], True, "%smedialab"%PREFIX_TEST_CORPUS)
    assert datascape_we['code'] == 'success', datascape_we['message']
    print("datascape production WE created, waiting ES to sync")
    nb_page_new_we = waiting_for(lambda:webentity_nb_pages_in_es(datascape_we['result']['id'], elasticsearch), 1)
    nb_page_parent_after = waiting_for(lambda:webentity_nb_pages_in_es(1, elasticsearch), nb_page_parent_before - nb_page_new_we)
    assert nb_page_new_we == 1
    assert nb_page_parent_after == nb_page_parent_before - nb_page_new_we
    nb_page_parent_before = nb_page_parent_after
    merge = hyphe_api.store.merge_webentity_into_another(datascape_we['result']['id'], 1, False, False, False, "%smedialab"%PREFIX_TEST_CORPUS)
    assert merge['code'] == 'success', merge['message']
    print("datascape production WE merged into parent, waiting ES to sync") 
    # parent should have gotten page.s back
    nb_page_parent_after = waiting_for(lambda:webentity_nb_pages_in_es(1, elasticsearch), nb_page_parent_before + nb_page_new_we)
    assert nb_page_parent_after == nb_page_parent_before + nb_page_new_we
    # the child web entity should have disapeared
    nb_page_new_we = waiting_for(lambda:webentity_nb_pages_in_es(datascape_we['result']['id'], elasticsearch), 0)
    assert nb_page_new_we == 0

def test_text_query_and_extraction_methods(hyphe_api, elasticsearch):
    # find web entity Paul Girard
    we_r = hyphe_api.store.search_webentities(fieldKeywords=[("name","paul-girard")], count=-1,corpus='tti_medialab')
    assert we_r['code'] == "success", we_r['message']
    assert len(we_r['result']) == 1
    we_pgirard_id = we_r['result'][0]['id']
    # search ouestware
    query = {
        "query":{
                "match":{
                "text": "ouestware"
            }
        },
        "size": 5,
        "aggs": {
            "webentity":{
                "terms": { "field" : "webentity_id"}	
            }
        }
    }
    es_we_ouestware = elasticsearch.search(index='hyphe_%smedialab'%PREFIX_TEST_CORPUS, body=query)
    assert len(es_we_ouestware["aggregations"]['webentity']['buckets']) == 1
    assert int(es_we_ouestware["aggregations"]['webentity']['buckets'][0]['key']) == we_pgirard_id
    # check different text extraction methods are there and different
    extracted_texts = set()
    for method in TEXT_EXTRACTION_METHODS:
        # check method exist
        assert method in es_we_ouestware['hits']['hits'][0]['_source']
        # check contents are different (/!\ may be not true in case of extraction errors)
        assert  es_we_ouestware['hits']['hits'][0]['_source'][method] not in extracted_texts
        extracted_texts.add(es_we_ouestware['hits']['hits'][0]['_source'][method])

def test_change_prefix(hyphe_api, elasticsearch):
    # add a prefix to an existing WE
    lru_prefix = "s:https|h:fr|h:sciencespo|h:medialab|p:activites|"
    we_r = hyphe_api.store.search_webentities(fieldKeywords=[("name","tommaso-venturini")], count=-1,corpus='tti_medialab')
    assert we_r['code'] == "success", we_r['message']
    assert len(we_r['result']) == 1
    webentity_id = we_r['result'][0]['id']
    nb_pages_parent_before = webentity_nb_pages_in_es(1, elasticsearch)
    nb_pages_before = webentity_nb_pages_in_es(webentity_id, elasticsearch)
    add_prefix = hyphe_api.store.add_webentity_lruprefixes(webentity_id, [lru_prefix], '%smedialab'%PREFIX_TEST_CORPUS)
    assert add_prefix['code'] == 'success', add_prefix['message']
    print("added a prefix waiting ES to sync")
    sleep(5.1)
    nb_pages_after = waiting_for(lambda:webentity_nb_pages_in_es(webentity_id, elasticsearch), nb_pages_before + 1)
    # page.s retired from parent should be in the WE in which we added the prefix
    assert nb_pages_after > nb_pages_before
    nb_pages_parent_after = waiting_for(lambda:webentity_nb_pages_in_es(1, elasticsearch), nb_pages_parent_before - 1)
    assert nb_pages_parent_after < nb_pages_parent_before
    assert nb_pages_after == nb_pages_before + (nb_pages_parent_before - nb_pages_parent_after)
    
    # now the other way around
    nb_pages_before = nb_pages_after
    nb_pages_parent_before = nb_pages_parent_after
    we_r = hyphe_api.store.rm_webentity_lruprefix(webentity_id, lru_prefix, '%smedialab'%PREFIX_TEST_CORPUS)
    assert we_r['code'] == "success", we_r['message']
    print('removed prefix, wait for ES to sync')
    nb_pages_after = waiting_for(lambda:webentity_nb_pages_in_es(webentity_id, elasticsearch), nb_pages_before - 1)
    nb_pages_parent_after = waiting_for(lambda:webentity_nb_pages_in_es(1, elasticsearch), nb_pages_parent_before + 1)
    # page.s retired from parent should be in the WE in which we added the prefix
    assert nb_pages_after < nb_pages_before
    assert nb_pages_parent_after > nb_pages_parent_before
    assert nb_pages_parent_after == nb_pages_parent_before + (nb_pages_before - nb_pages_after)

def test_reset(hyphe_api, elasticsearch, mongodb):
    reset_text_index('%smedialab'%PREFIX_TEST_CORPUS, elasticsearch, mongodb)
    # test index has been deleted
    assert not elasticsearch.indices.exists('%smedialab'%PREFIX_TEST_CORPUS)
    index_exists = waiting_for(lambda:elasticsearch.indices.exists('hyphe_%smedialab'%PREFIX_TEST_CORPUS), True)
    # test it has been recreated
    assert index_exists == True
    crawl_pending = waiting_for(lambda:is_crawl_pending([], '%smedialab'%PREFIX_TEST_CORPUS, hyphe_api), False, 1, 340)
    assert crawl_pending == False
    index_synced = waiting_for(lambda:are_web_entity_pages_synced(hyphe_api, elasticsearch, '%smedialab'%PREFIX_TEST_CORPUS), True)
    assert index_synced == True

def test_multi_corpus(hyphe_api, elasticsearch, mongodb):
    create_corpus = hyphe_api.create_corpus('%sietf'%PREFIX_TEST_CORPUS, "", {"indexTextContent":True})
    print('waiting for corpus to start')
    sleep(2)
    assert create_corpus['code'] == 'success', 'couldn\'t create a corpus in hyphe: {}'.format(create_corpus['message'])
    we = hyphe_api.store.declare_webentity_by_lru('s:https|h:org|h:ietf|h:tools|p:html', "%sietf"%PREFIX_TEST_CORPUS, "IN", START_PAGES['ietf'], True, "%sietf"%PREFIX_TEST_CORPUS)
    assert we['code'] == 'success', 'couldn\'t create IETF WE in hyphe: {}'.format(we['message'])
    we = we['result']
    we_id = we['id']
    # resetting médialab corpus to test multicorpus indexing simultaneously
    reset_text_index('%smedialab'%PREFIX_TEST_CORPUS, elasticsearch, mongodb)
    crawl_job = hyphe_api.crawl_webentity(we_id, 1, False, 'IN', {}, "%sietf"%PREFIX_TEST_CORPUS)
    assert crawl_job['code'] == 'success', 'couldn\'t start crawl'
    sleep(0.5)
    r = hyphe_api.store.add_webentity_creationrule('s:https|h:org|h:ietf|h:tools|p:html', "prefix+1", "%sietf"%PREFIX_TEST_CORPUS)
    assert r['code'] == 'success'
    assert are_web_entity_pages_synced(hyphe_api, elasticsearch, '%sietf'%PREFIX_TEST_CORPUS, crawl_finished=False) == True
    # wait for end of crawl
    crawl_pending = waiting_for(lambda:is_crawl_pending([crawl_job['result']], '%sietf'%PREFIX_TEST_CORPUS, hyphe_api), False, 1, 340)
    assert crawl_pending == False
   
    # TODO: check status of Weupdate tasks in mongo
    assert are_web_entity_pages_synced(hyphe_api, elasticsearch, '%sietf'%PREFIX_TEST_CORPUS) == True
    crawl_pending = waiting_for(lambda:is_crawl_pending([], '%smedialab'%PREFIX_TEST_CORPUS, hyphe_api), False, 1, 340)
    assert crawl_pending == False

    assert waiting_for(lambda:are_web_entity_pages_synced(hyphe_api, elasticsearch, '%smedialab'%PREFIX_TEST_CORPUS), True) == True

def test_destroy_corpus_delete_index(hyphe_api, elasticsearch):
    for c in ['medialab', 'ietf']:
        destroy_corpus = hyphe_api.destroy_corpus('%s%s'%(PREFIX_TEST_CORPUS,c), False)
        assert destroy_corpus['code'] == 'success', 'couldn\'t destoy a corpus in hyphe: {}'.format(destroy_corpus['message'])
        index_exists = waiting_for(lambda: elasticsearch.indices.exists(index='hyphe_%s%s'%(PREFIX_TEST_CORPUS,c)), False)
        assert index_exists == False, "destroyed corpus not deleted in elasticsearch"