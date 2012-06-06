#!/usr/bin/env python

#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements. See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership. The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied. See the License for the
# specific language governing permissions and limitations
# under the License.
#

# thrift -gen py:twisted filename.thrift

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



@inlineCallbacks
def test_memory_structure(client):
    """ 
    Test the Memory structure thrift connection
    """
    
    #pi = ms.PageItem("id","url", "lru", "time", 200, 1, "errorCode", True, True, {"key":"value"})
    #pi2 = ms.PageItem("id2","url2", "lru2", "time2", 400, 2, "errorCode2", False, False, {"key2":"value2"})
    print "### clearIndex"
    yield client.clearIndex()
    print True
    
    # ping function 
    print "### ping test"
    res = yield client.ping()
    print "ping 1" in res[0].ping and "pong 1" in res[0].pong and "ping 2" in res[1].ping and "pong 2" in res[1].pong
    
    # createWebEntity function 
    print "### createWebEntity"
    we = yield client.createWebEntity("hci wiki",["s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci"])
    print str(we.name=="hci wiki") + " webentity "+str(we.id)+" created"
    
#     print "### createWebEntity"
#     we = yield client.createWebEntity("jiminy",["s:http|h:fr|h:sciences-po|h:medialab|h:jiminy"])
#     print str(we.name=="hci wiki") + " webentity "+str(we.id)+" created"
#     print "### createWebEntity"
#     we = yield client.createWebEntity("medialab",["s:http|h:fr|h:sciences-po|h:medialab"])
#     print str(we.name=="hci wiki") + " webentity "+str(we.id)+" created"
    
    # add page with cache
    print "### createCache"
    page=ms.PageItem("id","http://jiminy.medialab.sciences-po.fr/hci/index.php", "s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php", "time", 200, 1, "errorCode", True, True, {"key":"value"})
    page1=ms.PageItem("id","http://jiminy.medialab.sciences-po.fr", "s:http|h:fr|h:sciences-po|h:medialab|h:jiminy", "time", 200, 1, "errorCode", True, True, {"key":"value"})
    page2=ms.PageItem("id","http://medialab.sciences-po.fr", "s:http|h:fr|h:sciences-po|h:medialab", "time", 200, 1, "errorCode", True, True, {"key":"value"})
    cache_id=yield client.createCache([page,page1,page2])
    print "page cache created  : "+str(cache_id)
    
    # index cache
    print "### indexCache"
    nb_pages=yield client.indexCache(cache_id)
    print str(nb_pages)+" pages indexed"
    
    # add web entity creation rule by default
    print "### saveWebEntityCreationRule default"
    yield client.saveWebEntityCreationRule(WebEntityCreationRule("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)",""))
    wecrs=yield client.getWebEntityCreationRules()
    print "result : "+str(len(wecrs)==1 and wecrs[0].regExp=="(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)")
    
    # create web entities from cache
    print "### createWebEntities from cache"
    yield client.createWebEntities(cache_id)
    
    
    print "### getWebEntities + getPagesFromWebEntities"
    wes=yield client.getWebEntities()
    for we in wes : 
        print we.name+" "+ ",".join(we.LRUSet)
        pages = yield client.getPagesFromWebEntity(we.id)
        for page in pages :
            print "\t"+page.lru#+" "+str(page.id)   
    print "### getWebEntities + getPagesFromWebEntities"
      
    wes=yield client.getWebEntities()
    with open("webentities_pages.csv","w") as we_pages_file :
        we_pages_file.write("web entity name, page lru,web entity aliases\n")
        for we in wes : 
            pages = yield client.getPagesFromWebEntity(we.id)
            for page in pages :
                 we_pages_file.write(we.name+","+page.lru+","+",".join(we.LRUSet)+"\n")
        we_pages_file.close()
    print "export done in "
        
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

    client = ClientCreator(reactor,
                      TTwisted.ThriftClientProtocol,
                      ms.Client,
                      TBinaryProtocol.TBinaryProtocolFactory(),
                      ).connectTCP("10.35.1.152", 9090)
    client.addCallback(lambda conn: conn.client)
    client.addCallback(test_memory_structure)
    
    
    reactor.run()
