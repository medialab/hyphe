from elasticsearch import Elasticsearch

ELASTICSEARCH_HOST = 'localhost'
ELASTICSEARCH_PORT = 9200

def list_we_nb_pages(es):
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



es = Elasticsearch('%s:%s'%(ELASTICSEARCH_HOST, ELASTICSEARCH_PORT))
list_we_nb_pages(es)