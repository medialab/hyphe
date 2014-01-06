#!/usr/bin/env python
# -*- coding: utf-8 -*-

# twisted 
from twisted.internet import reactor, defer
from twisted.internet.defer import inlineCallbacks, returnValue as returnD
# hyphe
from txjsonrpc.web.jsonrpc import Proxy
from hyphe_backend.lib import config_hci
# mongodb
import pymongo
# solr
import sunburnt
# utils
from pprint import pprint
from time import time

config = config_hci.load_config()
if not config:
    print "error while loading config"
    exit()


def printValue(value):
    import pprint
    pprint.pprint(value)

def printError(error):
    print ' !! ERROR: ', error

def shutdown(data):
    reactor.stop()

class Logtime():
    def __init__(self):
        self.last_time=time()

    def log(self,message):
        elapsed = time()-self.last_time
        print "%s - %s"%(elapsed,message)
        self.last_time=time()
        return elapsed

@inlineCallbacks
def extract_text_from_webentities():
    #initialisation
    lt = Logtime()
    start_time=time()
    lt.log("starting initialisation")
    # API connection to Hyphe
    proxy = Proxy('http://127.0.0.1:%d' % config['twisted']['port'])
    # connection to Mongo
    db = pymongo.Connection(config['mongo-scrapy']['host'],config['mongo-scrapy']['mongo_port'])[config['mongo-scrapy']['project']]
    # solr
    solr = sunburnt.SolrInterface("http://%s:%s/%s" % (config["solr"]['host'], config["solr"]['port'], config["solr"]['path'].lstrip('/')))
    lt.log("initialisation done")
    
    # clear index
    solr.delete_all()
    solr.commit()
    lt.log("index erased")

    # control variables
    solr_json_docs=[]
    nb_web_entities=0
    index_avg_time=0.0
    total_pages=0
    total_nodes=0
    total_nodes_with_body=0

    # get IN web entities
    command = "store.get_webentities_by_status"
    args = ["IN"]
    web_entities = yield proxy.callRemote(command, *args).addErrback(printError)
    nb_web_entities=len(web_entities["result"])
    lt.log("%s web entities retrieved"%(len(web_entities["result"])))
    
    # process web entities
    for web_entity in web_entities["result"] :
        lt.log("processing web entity %s"%(web_entity["name"]))
       
        # get pages for this web entity
        command="store.get_webentity_pages"
        args=[web_entity["id"]]
        web_pages = yield proxy.callRemote(command, *args).addErrback(printError)
        lt.log("retrieved %s pages of web entity %s"%(len(web_pages),web_entity["name"]))
        total_pages+=len(web_pages["result"])

        # index pages
        nb_pages=0
        #for page in [page for page in web_pages["result"] if page["is_node"]]:
        # get web pages html code
        pages_mongo = db[config['mongo-scrapy']['pageStoreCol']].find({"url": {"$in": [page["url"] for page in web_pages["result"]]}})
        for page_mongo in pages_mongo:
            if "body" in page_mongo.keys():
                nb_pages+=1
                body = page_mongo["body"].decode('zip')
                try:
                    body = body.decode("UTF8")
                    charset = "UTF8"
                except UnicodeDecodeError :
                    body = body.decode("ISO-8859-1")
                    charset = "ISO-8859-1"
                except UnicodeDecodeError :
                    body = body.decode("UTF8","replace")
                    charset = "UTF8-replace"
                solr_document={
                    "id":page_mongo["_id"],
                    "web_entity":web_entity["name"],
                    "web_entity_id":web_entity["id"],
                    "html":body,
                    "charset":charset,
                    "url":page_mongo["url"],
                    "lru":page_mongo["lru"],
                    "depth":page_mongo["depth"]
                }
                solr_json_docs.append(solr_document)
                try:
                    solr.add(solr_document)
                except Exception :
                    print "Exception with document :"
                    pprint(solr_document)
                    solr_json_docs.pop()
        solr.commit()
        if nb_pages>0 :
            indexation_time = lt.log("commited %s pages to solr for web entity %s"%(nb_pages,web_entity["name"]))
            index_avg_time=(index_avg_time+indexation_time/nb_pages)/2
            total_nodes_with_body+=nb_pages
    lt.log("average indexation time for one page %s"%(index_avg_time))
    lt.log("processed in %.2fs %s web entities, %s pages, %s nodes (%.2s%%), %s nodes with body %.2s%%"%(time()-start_time,nb_web_entities,total_pages,total_nodes,float(total_nodes)/total_pages*100,total_nodes_with_body,float(total_nodes_with_body)/total_pages*100))
    #pprint(solr_json_docs)
    reactor.stop()

extract_text_from_webentities()
reactor.run()



