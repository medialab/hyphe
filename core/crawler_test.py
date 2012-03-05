#!/usr/bin/env python


import sys
sys.path.append('gen-py.twisted')

# from filename.thrift import Service
from memorystructure import MemoryStructure as ms
from memorystructure.ttypes import *

from twisted.internet.defer import inlineCallbacks
from twisted.internet import reactor
from twisted.internet.protocol import ClientCreator

from thrift import Thrift
from thrift.transport import TTwisted
from thrift.protocol import TBinaryProtocol

import pymongo
import time

MONGO_HOST = 'localhost'
MONGO_DB = 'hci'
MONGO_QUEUE_COL = 'crawler.queue'
MONGO_PAGESTORE_COL = 'crawler.pages'

PRECISION_LIMIT=4


#  curl http://scrapyd.host:6800/schedule.json \
#   -d start_urls=http://www.mongodb.org/,http://blog.mongodb.org/ \
#   -d maxdepth=2 \
#   -d follow_prefixes=s:http|t:80|h:org|h:mongodb \
#   -d nofollow_prefixes=s:http|t:80|h:org|h:mongodb|p:support \
#   -d discover_prefixes=s:http|t:80|h:ly|h:bit,s:http|t:80|h:ly|h:bit \
#   -d "user_agent=Mozilla/5.0 (compatible; hcibot/0.1)"



@inlineCallbacks
def test_memory_structure(client,crawler_page_queue):
    """ 
    Test the Memory structure thrift connection
    """
    
    #pi = ms.PageItem("id","url", "lru", "time", 200, 1, "errorCode", True, True, {"key":"value"})
    #pi2 = ms.PageItem("id2","url2", "lru2", "time2", 400, 2, "errorCode2", False, False, {"key2":"value2"})
    print "### clearIndex"
    yield client.clearIndex()
    print True
    
    
    page_items=crawler_page_queue.find()
    
    # add page with cache
    print "### createCache"
    pages={}
    links={}
    original_link_number=0
    strip_lru_port = lambda lru : "|".join([stem for stem in lru.split("|") if stem!="t:80" ])
    lru_is_node = lambda lru : (len(lru.split("|"))<=PRECISION_LIMIT)
    # for get node, we should check exceptions
    get_node_lru = lambda lru : "|".join([stem for stem in lru.split("|")[:PRECISION_LIMIT] ])
    
    s=time.time()  
  
    for page_item in page_items : 
        # removing port if 80 :
        page_item["lru"]=strip_lru_port(page_item["lru"])
        is_node=lru_is_node(page_item["lru"])
        node_lru=page_item["lru"] if is_node else get_node_lru(page_item["lru"])
        
        if not page_item["lru"] in pages : 
            pages[page_item["lru"]]=ms.PageItem(str(page_item["_id"]),page_item["url"],page_item["lru"],str(page_item["timestamp"]),int(page_item["status"]),int(page_item["depth"]), "errorCode", False, is_node,{})

        if "lrulinks" in page_item :
            for index,lrulink in enumerate(page_item["lrulinks"]):
                lrulink=strip_lru_port(lrulink)
                target_node=lrulink if lru_is_node(lrulink) else get_node_lru(lrulink)
                original_link_number+=1
                if lrulink not in pages :
                    pages[lrulink]=ms.PageItem(str(page_item["_id"])+"_"+str(index),"",lrulink,str(page_item["timestamp"]),0,-1, "errorCode", False,lru_is_node(lrulink),{})
                
                links[(node_lru,target_node)]=links[(node_lru,target_node)]+1 if (node_lru,target_node) in links else 0
    
    print "processed "+str(len(pages))+" unique pages "+str(original_link_number)+" links "+str(len(links.values()))+" unique links in "+str(time.time()-s)
    
    
    s=time.time()
    cache_id=yield client.createCache(pages.values())
    print "page cache created  : "+str(cache_id)+ " containing "+str(len(pages))+" pages in "+str(time.time()-s)
        
    # index cache
    print "### indexCache"
    s=time.time()
    nb_pages=yield client.indexCache(cache_id)
    print str(nb_pages)+" pages indexed in "+str(time.time()-s)
    
    # add web entity creation rule by default
    print "### saveWebEntityCreationRule default"
    yield client.saveWebEntityCreationRule(WebEntityCreationRule("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)",""))
    wecrs=yield client.getWebEntityCreationRules()
    print "result : "+str(len(wecrs)==1 and wecrs[0].regExp=="(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)")
    
    # save node links
    print "### saveNodeLinks"
    s=time.time()
    yield client.saveNodeLinks([NodeLink("id",source,target,weight) for (source,target),weight in links.iteritems()])
    print "inserting NodeLinks in "+str(time.time()-s)
    
    # create web entities from cache
    print "### createWebEntities from cache"
    s=time.time()
    yield client.createWebEntities(cache_id)
    print "web entities created in "+str(time.time()-s)    
    
    print "### getWebEntities + getPagesFromWebEntities"
    s=time.time()    
    wes=yield client.getWebEntities()
    with open("webentities_pages.csv","w") as we_pages_file :
        we_pages_file.write("web entity name, page lru,web entity aliases"\n")
        for we in wes : 
            pages = yield client.getPagesFromWebEntity(we.id)
            for page in pages :
                 we_pages_file.write(we.name+","+page.lru+","+",".join(we.LRUSet)+"\n")
        we_pages_file.close()
    print "export done in "+str(time.time()-s)
    
    # generate Web Entity Links
    print "### generate Web Entity Links"
    s=time.time()
    yield client.generateWebEntityLinks()
    print "processed webentity links in "+str(time.time()-s) 
    
    # get webentitynetwork
    print "### getWebEntityNetwork gexf"
    s=time.time()
    network=yield client.getWebEntityNetwork("gexf")
    print "got the network in "+str(time.time()-s) 
    with open("hci_web_entities_network.gexf","w") as f : 
        f.write(network)
    
    
    # createWebEntity function 
#     print "### createWebEntity"
#     we = yield client.createWebEntity("hci wiki",["s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci"])
#     print str(we.name=="hci wiki") + " webentity "+str(we.id)+" created"
    
    
    # getWebEntity 
#     print "getWebEntity function"
#     we2 = yield client.getWebEntity(we.id)
#     print "result : " + str(we2.id==we.id and we2.name==we.name)
#     print "old : "+we.id +" new :"+we2.id
#     #print "old : "+we.name +" new :"+we2.name
#     print " new :"+we2.name
#     
#     
#     # update webentity
#     new_name="new WE"
#     we.name=new_name
#     we_id=yield client.updateWebEntity(we)
#     we2 = yield client.getWebEntity(we_id)
#     print "result :"+ str(we2.name==new_name)
    reactor.stop()
  

if __name__ == '__main__':

    crawler_queue = pymongo.Connection(MONGO_HOST)[MONGO_DB][MONGO_QUEUE_COL]

    client = ClientCreator(reactor,
                      TTwisted.ThriftClientProtocol,
                      ms.Client,
                      TBinaryProtocol.TBinaryProtocolFactory(),
                      ).connectTCP("10.35.1.152", 9090)
    client.addCallback(lambda conn: conn.client)
    client.addCallback(test_memory_structure,crawler_queue)
    
    
    reactor.run()
