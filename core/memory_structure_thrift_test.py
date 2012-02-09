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
    print "clearing index"
    res = yield client.clearIndex()
    
    # ping function 
    print "ping test"
    res = yield client.ping()
    print "result  : " + str("ping" in res and "pong" in res)
    
    
    # createWebEntity function 
    print "createWebEntity function"
    we = yield client.createWebEntity("hci wiki",["s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci"])
    print "result we id  : " + str(we.id)
    print "result we name  : " + str(we.name)
    
    # add page with cache
    page=ms.PageItem("id","http://jiminy.medialab.sciences-po.fr/hci/index.php", "s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php", "time", 200, 1, "errorCode", True, True, {"key":"value"})
    page2=ms.PageItem("id","http://medialab.sciences-po.fr", "s:http|h:fr|h:sciences-po|h:medialab", "time", 200, 1, "errorCode", True, True, {"key":"value"})
    cache_id=yield client.createCache([page,page2])
    print "page cache created  : "+str(cache_id)
    
    # index cache
    nb_pages=yield client.indexCache(cache_id)
    print str(nb_pages)+" pages indexed"
    
    # add web entity creation rule by default 
    yield client.saveWebEntityCreationRule(WebEntityCreationRule("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)",""))
    wecrs=yield client.getWebEntityCreationRules()
    for wecr in wecrs :
        print wecr.regexp
    
    # create web entities from cache
    yield client.createWebEntities(cache_id)
    wes=yield client.getWebEntities()
    for we in wes : 
        print we.name+" "+ ",".join(we.LRUset)
    
#     try : 
#         # getPagesFromWebEntity(1:string id)
#         print "getPagesFromWebEntity function"
#         pages = yield client.getPagesFromWebEntity(we.id)
#         for page in pages :
#             print page.id+" "+page.lru
#         print we.LRUSet
#     except :
#       print "failed on getPagesFromWebEntity function"
#       
    
    # getWebEntity 
    print "getWebEntity function"
    we2 = yield client.getWebEntity(we.id)
    print "result : " + str(we2.id==we.id and we2.name==we.name)
    print "old : "+we.id +" new :"+we2.id
    #print "old : "+we.name +" new :"+we2.name
    print " new :"+we2.name
    
    
    # update webentity
    new_name="new WE"
    we.name=new_name
    we_id=yield client.updateWebEntity(we)
    we2 = yield client.getWebEntity(we_id)
    print "result :"+ str(we2.name==new_name)
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
