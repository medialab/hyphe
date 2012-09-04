#!/usr/bin/env python

from twisted.internet import reactor, defer
from txjsonrpc.netstring.jsonrpc import Proxy
import sys, pprint
sys.path.append('../lib')
import config_hci, lru
 
config = config_hci.load_config()
if not config:
    exit()
 
def printValue(value):
    pprint.pprint(value)

def printError(error):
    print ' !! ERROR: ', error
 
def shutDown(data):
#    print " -> Shutting down reactor..."
    reactor.stop()

proxy = Proxy('127.0.0.1', config['twisted']['port'])
d = proxy.callRemote(sys.argv[1], *sys.argv[2:])
d.addCallback(printValue).addErrback(printError)
d.addCallback(shutDown)
reactor.run()

