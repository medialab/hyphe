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
      #res = yield client.createCache([pi])
      
      # ping function 
      print "ping test"
      res = yield client.ping()
      print "result  : " + str(res == "pong")
 
      # createWebEntity function 
      print "createWebEntity function"
      we = yield client.createWebEntity("test WE",["lru1","lru2"])
      print "result we id  : " + str(we.id)

      # getWebEntity 
      print "getWebEntity function"
      we2 = yield client.getWebEntity(we.id)
      print "result : " +str(we2.id==we.id and we2.name==we.name)

      # update webentity
      new_name="new WE"
      we.name=new_name
      we2=yield client.updateWebEntity(we)
      print "result :"+ str(we2.name==new_name)


  #reactor.stop()

if __name__ == '__main__':

    client = ClientCreator(reactor,
                      TTwisted.ThriftClientProtocol,
                      ms.Client,
                      TBinaryProtocol.TBinaryProtocolFactory(),
                      ).connectTCP("10.35.1.152", 9090)
    client.addCallback(lambda conn: conn.client)
    client.addCallback(main)
    
    
    reactor.run()
