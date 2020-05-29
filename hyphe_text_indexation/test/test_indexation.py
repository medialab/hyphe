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

def list_we_nb_pages():
    es = Elasticsearch('%s:%s'%(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT))
    list_we_nb_pages(es)
    # retrive existing indices in ES
    indices = es.indices.get("hyphe_*")
    print(indices)
    print(es.search(body={
                "size":0,
                "aggs": {
                    "corpus": {
                        "terms": {
                            "field": "_index"   
                        },
                        "aggs":{
                            "webentity": {
                                "terms" : { "field" : "webentity_id" } 
                            }
                        }  
                    }
                }
    })) #["aggregations"]["corpus"]["buckets"])

# utiliser le traph pour comparer 




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
    
    # elasticsearch hyphe_* should not already exist
    indices = list(elasticsearch.indices.get("hyphe_*").keys())
    assert indices == [], "Elasticsearch is not empty. There are existing hyphe indices {}".format(indices)
    
    # test mongodb connection and check no corpus exists 
    corpus = mongodb['hyphe']['corpus'].find({}, projection={"_id":1})  
    corpus = [c['_id'] for c in corpus if c['_id']!='--test-corpus--']
    assert len(corpus) == 0, "MongoDB is not empty. There are existing hyphe corpus {}".format(corpus)

def test_create_corpus_create_index(hyphe_api, elasticsearch):
    config = jsonrpclib.config.Config(version=1.0)
    api_url = "http://localhost:90/api/"
    history = jsonrpclib.history.History()
    hyphe_api = jsonrpclib.ServerProxy(api_url, config=config, history=history)
    create_corpus = hyphe_api.create_corpus('medialab', "", {})
   
    print(history.request)
    assert create_corpus['code'] == 'success', 'couldn\'t create a corpus in hyphe: {}'.format(create_corpus['message'])
    # max indexation throttle time
    sleep(5.1)
    assert elasticsearch.indices.exists(index='hyphe_medialab') == True, "newly created corpus not created in elasticsearch"