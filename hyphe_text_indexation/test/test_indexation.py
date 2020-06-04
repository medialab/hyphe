from elasticsearch import Elasticsearch
import pytest
import jsonrpclib
import pymongo
from time import sleep

from requests.exceptions import ConnectionError

ELASTICSEARCH_HOST = 'localhost'
ELASTICSEARCH_PORT = 9200
MONGO_HOST = 'localhost'
MONGO_PORT = 27017
PREFIX_TEST_CORPUS = 'tti_'
START_PAGES = [
    'https://medialab.sciencespo.fr/activites/',
    'https://medialab.sciencespo.fr/equipe/paul-girard/',
    'https://medialab.sciencespo.fr/equipe/tommaso-venturini/',
    'https://medialab.sciencespo.fr/productions/2020-01-the-eat-datascape-an-experiment-in-digital-social-history-of-art-christophe-leclercq/'
]
TEXT_EXTRACTION_METHODS = ['textify', 'dragnet', 'trafilatura']

def compare_web_entity_pages_core_es(hyphe_api, elasticsearch, corpus, crawl_finished=True):
    we_r = hyphe_api.store.get_webentities(list_ids=[], sort=None, count=500, page=0,  light=False,  semilight=False, light_for_csv=False, corpus=corpus)
    assert we_r['code'] == "success", we_r['message']
    wes_in_core = {we['_id']: we['pages_crawled'] for we in we_r['result']['webentities'] if we['pages_crawled'] > 0}
    # retrive existing indices in ES
    we_pages_es = elasticsearch.search(index='hyphe_tti_medialab',body={
                "size":0,
                "aggs": {
                    "webentity": {
                            "terms" : { "field" : "webentity_id" } 
                        }
                    }  
                })
    elastic_we_pages = {int(w['key']):w['doc_count'] for w in we_pages_es["aggregations"]["webentity"]["buckets"]}

    for we,pages in wes_in_core.items():
        print(we,pages)
        if crawl_finished:
            assert  we in elastic_we_pages and elastic_we_pages[we]>=pages/2
        else:
            assert  we not in elastic_we_pages or elastic_we_pages[we] < pages/2


def is_responsive(url):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return True
    except ConnectionError:
        print("connection error")
        return False

@pytest.fixture(scope="session")
def elasticsearch():
    try:
        es = Elasticsearch('%s:%s'%(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT))
    except:
        pytest.exit('can\"t connect to ES')
    else:
        return es

@pytest.fixture(scope="session")
def hyphe_api():
    api_url = "http://localhost:90/api/"
    try:
        config = jsonrpclib.config.Config(version=1.0)
        history = jsonrpclib.history.History()
        hyphe_api = jsonrpclib.ServerProxy(api_url, config=config, history=history)
    except :
        pytest.exit("can't connect to Hyphe API")
    else:
        return hyphe_api

@pytest.fixture(scope="session")
def mongodb():
    try:
        mongo = pymongo.MongoClient(MONGO_HOST, MONGO_PORT)
    except :
        pytest.exit("can't connect to mongodb")
    else:
        return mongo

def test_docker_environnement_ready(hyphe_api, elasticsearch, mongodb):
    
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
        sleep(5.1)
    # elasticsearch hyphe_* should not already exist 
    indices = list(elasticsearch.indices.get("hyphe_*").keys())
    assert indices == [], "Elasticsearch is not empty. There are existing hyphe indices {}".format(indices)
    
   
def test_create_corpus_create_index(hyphe_api, elasticsearch):
    create_corpus = hyphe_api.create_corpus('%smedialab'%PREFIX_TEST_CORPUS, "", {"txt_indexation_extraction_methods": TEXT_EXTRACTION_METHODS, "txt_indexation_default_extraction_method":'trafilatura'})
    assert create_corpus['code'] == 'success', 'couldn\'t create a corpus in hyphe: {}'.format(create_corpus['message'])
    # max indexation throttle time
    sleep(5.1)
    assert elasticsearch.indices.exists(index='hyphe_%smedialab'%PREFIX_TEST_CORPUS) == True, "newly created corpus not created in elasticsearch"

def test_create_WE_crawl_WECR(hyphe_api, elasticsearch):
    we = hyphe_api.store.declare_webentity_by_lru('s:https|h:fr|h:sciencespo|h:medialab|', "médialab", "IN", START_PAGES, True, "%smedialab"%PREFIX_TEST_CORPUS)
    assert we['code'] == 'success', 'couldn\'t create médialab WE in hyphe: {}'.format(we['message'])
    we = we['result']
    we_id = we['id']
    crawl_job = hyphe_api.crawl_webentity(we_id, 0, False, 'IN', {}, "%smedialab"%PREFIX_TEST_CORPUS)
    assert crawl_job['code'] == 'success', 'couldn\'t start crawl'
    sleep(0.5)
    r = hyphe_api.store.add_webentity_creationrule("s:https|h:fr|h:sciencespo|h:medialab|p:equipe|", "prefix+1", "%smedialab"%PREFIX_TEST_CORPUS)
    assert r['code'] == 'success'
    compare_web_entity_pages_core_es(hyphe_api, elasticsearch, '%smedialab'%PREFIX_TEST_CORPUS, crawl_finished=False)
    # wait for end of crawl
    crawl_pending = True
    limit_attemps = 340
    while crawl_pending and limit_attemps > 0:
        jobs = hyphe_api.listjobs(list_ids=[crawl_job['result']], corpus='%smedialab'%PREFIX_TEST_CORPUS)
        assert jobs['code'] == 'success', j['message']
        crawl_pending = jobs['result'][0]['crawling_status'] in ['PENDING', 'RUNNING']
        limit_attemps -= 1
        sleep(1)
    sleep(10)
    # check status of Weupdate tasks in mongo
    compare_web_entity_pages_core_es(hyphe_api, elasticsearch, '%smedialab'%PREFIX_TEST_CORPUS)

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
    sleep(5.1)
    nb_page_parent_after = webentity_nb_pages_in_es(1, elasticsearch)
    nb_page_new_we = webentity_nb_pages_in_es(datascape_we['result']['id'], elasticsearch)
    assert nb_page_new_we == 1
    assert nb_page_parent_after == nb_page_parent_before - nb_page_new_we
    nb_page_parent_before = nb_page_parent_after
    merge = hyphe_api.store.merge_webentity_into_another(datascape_we['result']['id'], 1, False, False, False, "%smedialab"%PREFIX_TEST_CORPUS)
    assert merge['code'] == 'success', merge['message']
    print("datascape production WE merged into parent, waiting ES to sync") 
    sleep(5.1)
    # parent should have gotten page.s back
    nb_page_parent_after = webentity_nb_pages_in_es(1, elasticsearch)
    assert nb_page_parent_after == nb_page_parent_before + nb_page_new_we
    # the child web entity should have disapeared
    nb_page_new_we = webentity_nb_pages_in_es(datascape_we['result']['id'], elasticsearch)
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
    nb_pages_parent_after = webentity_nb_pages_in_es(1, elasticsearch)
    nb_pages_after = webentity_nb_pages_in_es(webentity_id, elasticsearch)
    # page.s retired from parent should be in the WE in which we added the prefix
    assert nb_pages_after > nb_pages_before
    assert nb_pages_parent_after < nb_pages_parent_before
    assert nb_pages_after == nb_pages_before + (nb_pages_parent_before - nb_pages_parent_after)
    
    # now the other way around
    nb_pages_before = nb_pages_after
    nb_pages_parent_before = nb_pages_parent_after
    we_r = hyphe_api.store.rm_webentity_lruprefix(webentity_id, lru_prefix, '%smedialab'%PREFIX_TEST_CORPUS)
    assert we_r['code'] == "success", we_r['message']
    print('removed prefix, wait for ES to sync')
    sleep(5.1)
    nb_pages_parent_after = webentity_nb_pages_in_es(1, elasticsearch)
    nb_pages_after = webentity_nb_pages_in_es(webentity_id, elasticsearch)
    # page.s retired from parent should be in the WE in which we added the prefix
    assert nb_pages_after < nb_pages_before
    assert nb_pages_parent_after > nb_pages_parent_before
    assert nb_pages_parent_after == nb_pages_parent_before + (nb_pages_before - nb_pages_after)

