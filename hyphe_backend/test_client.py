#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Simple script to test the API in command line
Examples from HCI root:
./hyphe_backend/test_client.py get_status
./hyphe_backend/test_client.py declare_page http://medialab.sciences-po.fr
./hyphe_backend/test_client.py declare_pages array http://medialab.sciences-po.fr http://www.sciences-po.fr

"""

from twisted.internet import reactor, defer
from txjsonrpc.web.jsonrpc import Proxy
import pprint, sys
from hyphe_backend.lib import config_hci

config = config_hci.load_config()
if not config:
    exit()

def printValue(value):
    pprint.pprint(value)

def printError(error):
    print ' !! ERROR: ', error

def shutdown(data):
    reactor.stop()

proxy = Proxy('http://127.0.0.1:%d' % config['twisted']['port'])
if len(sys.argv) > 2 and sys.argv[2] == "array":
    print sys.argv[1], [a for a in sys.argv[3:]]
    d = proxy.callRemote(sys.argv[1], [a for a in sys.argv[3:]])
else:
    print sys.argv[1], sys.argv[2:]
    d = proxy.callRemote(sys.argv[1], *sys.argv[2:])
d.addCallback(printValue).addErrback(printError)
d.addCallback(shutdown)
reactor.run()

