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
    create_corpus = hyphe_api.create_corpus('%smedialab'%PREFIX_TEST_CORPUS, "", {})
    assert create_corpus['code'] == 'success', 'couldn\'t create a corpus in hyphe: {}'.format(create_corpus['message'])
    # max indexation throttle time
    sleep(5.1)
    assert elasticsearch.indices.exists(index='hyphe_%smedialab'%PREFIX_TEST_CORPUS) == True, "newly created corpus not created in elasticsearch"

def test_create_WE_and_crawl(hyphe_api, elasticsearch):
    we = hyphe_api.store.declare_webentity_by_lru('s:https|h:fr|h:sciencespo|h:medialab|', "médialab", "IN", [], True, "%smedialab"%PREFIX_TEST_CORPUS)
    assert we['code'] == 'success', 'couldn\'t create médialab WE in hyphe: {}'.format(we['message'])
    we = we['result']
    we_id = we['id']
    crawl_job = hyphe_api.crawl_webentity(we_id, 1, False, 'IN', {}, "%smedialab"%PREFIX_TEST_CORPUS)
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
