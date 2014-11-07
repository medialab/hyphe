#!/usr/bin/env python
# -*- coding: utf-8 -*-

helpdoc="""
Simple script to test the API in command line
optionnal 1st arg : "inline" to get results as a single line
2nd arg           : method name
optionnal 3rd arg : "array" to mark following arguments are to be taken as elements of an array
following args    : method's arguments. To provide an array, write it as a string after "array", for instance : « array "['test','test2']" » or « array "[['test1','test2'],['test3','test4']]] ».
Examples from HCI root:
./hyphe_backend/test_client.py get_status
./hyphe_backend/test_client.py declare_page http://medialab.sciences-po.fr
./hyphe_backend/test_client.py declare_pages array "['http://medialab.sciences-po.fr','http://www.sciences-po.fr']"
./hyphe_backend/test_client.py inline store.get_webentities
"""

from twisted.internet import reactor, defer
from txjsonrpc.web.jsonrpc import Proxy
import sys, re
from hyphe_backend.lib import config_hci

config = config_hci.load_config()
if not config:
    exit()

if len(sys.argv) == 1:
    print helpdoc
    exit()

if sys.argv[1] == "inline":
    inline = True
    startargs = 3
else:
    inline = False
    startargs = 2

def printValue(value):
    if inline:
        print repr(value).decode("unicode-escape").encode('utf-8')
    else:
        import pprint
        pprint.pprint(value)

def printError(error):
    print ' !! ERROR: ', error

def shutdown(data):
    reactor.stop()

proxy = Proxy('http://127.0.0.1:%d' % config['twisted']['port'])
command = sys.argv[startargs - 1]
args = []
is_array = False
for a in sys.argv[startargs:]:
    if a == "array":
        is_array = True
    else:
        if is_array:
            if a.startswith('[') and a.endswith(']'):
                args.append(eval(a))
            elif not len(a):
                args.append([])
            else:
                args.append([a])
        elif a == "False" or a == "True":
            args.append(eval(a))
        else:
            args.append(a)
        is_array = False

re_clean_args = re.compile(r"^\[(.*)\]$")
if not inline:
    print "CALL:", command, re_clean_args.sub(r"\1", str(args))
d = proxy.callRemote(command, *args)

d.addCallback(printValue).addErrback(printError)
d.addCallback(shutdown)
reactor.run()



