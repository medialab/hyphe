#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Simple script to test the API in command line
optionnal 1st arg : "inline" to get results as a single line
2nd arg           : method name
optionnal 3rd arg : "array" to mark following arguments are to be taken as elements of an array
following args    : method's arguments
Examples from HCI root:
./hyphe_backend/test_client.py get_status
./hyphe_backend/test_client.py declare_page http://medialab.sciences-po.fr
./hyphe_backend/test_client.py declare_pages array http://medialab.sciences-po.fr http://www.sciences-po.fr
./hyphe_backend/test_client.py inline store.get_webentities
"""

from twisted.internet import reactor, defer
from txjsonrpc.web.jsonrpc import Proxy
import sys
from hyphe_backend.lib import config_hci

config = config_hci.load_config()
if not config:
    exit()

if sys.argv[1] == "inline":
    inline = True
    startargs = 3
else:
    inline = False
    startargs = 2

def printValue(value):
    if inline:
        print value
    else:
        import pprint
        pprint.pprint(value)

def printError(error):
    print ' !! ERROR: ', error

def shutdown(data):
    reactor.stop()

proxy = Proxy('http://127.0.0.1:%d' % config['twisted']['port'])
if len(sys.argv) > startargs and sys.argv[startargs] == "array":
    print sys.argv[startargs - 1], [a for a in sys.argv[startargs + 1:]]
    d = proxy.callRemote(sys.argv[startargs - 1], [a for a in sys.argv[startargs + 1:]])
else:
    print sys.argv[startargs - 1], sys.argv[startargs:]
    d = proxy.callRemote(sys.argv[startargs - 1], *sys.argv[startargs:])
d.addCallback(printValue).addErrback(printError)
d.addCallback(shutdown)
reactor.run()

