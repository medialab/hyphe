#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
from time import time
from warnings import filterwarnings
filterwarnings(action='ignore', category=DeprecationWarning, message="Python 2.6 is no longer supported by the Python core team")
from pymongo import MongoClient
from twisted.internet import reactor, defer
from txjsonrpc.web.jsonrpc import Proxy
from hyphe_backend.lib import config_hci

config = config_hci.load_config()
if not config:
    exit()

daysback = 7
if len(sys.argv) > 1:
    try:
        daysback = int(sys.argv[1])
    except:
        print >> sys.stderr, "ERROR: argument must be an integer (number of days back)"
        exit(1)
dayms = 1000 * 60 * 60 * 24
delay = dayms * daysback

proxy = Proxy('http://127.0.0.1:%d' % config['core_api_port'])

@defer.inlineCallbacks
def handleList(res):
    if res['code'] == 'fail':
        defer.returnValue(printError(res['message']))
    destroyed = []
    for cid, corpus in res['result'].items():
        since = time() * 1000 - corpus['last_activity']
        if since > delay:
            print "REMOVING old corpus:", cid, corpus['last_activity'], int(since/dayms), "days old"
            res = yield proxy.callRemote('start_corpus', cid, config['ADMIN_PASSWORD'] if corpus['password'] else '')
            if res['code'] == 'fail':
                print >> sys.stderr, "WARNING: could not start old corpus %s: %s" % (cid, res['message'])
                continue
            res = yield proxy.callRemote('ping', cid, 30)
            if res['code'] == 'fail':
                print >> sys.stderr, "WARNING: could not ping old corpus %s: %s" % (cid, res['message'])
                continue
            res = yield proxy.callRemote('destroy_corpus', cid)
            if res['code'] == 'fail':
                print sys.stderr, "WARNING: could not destroy old corpus %s: %s" % (cid, res['message'])
            else:
                destroyed.append(cid)

    c = MongoClient(config["mongo-scrapy"]["host"], config["mongo-scrapy"]["mongo_port"])
    for d in destroyed:
        c.drop_database('%s_%s' % (config["mongo-scrapy"]["db_name"], d))


def printError(error):
    print >> sys.stderr, "ERROR: Cannot get list of corpora", error

def shutdown(data):
    reactor.stop()

d = proxy.callRemote('list_corpus')
d.addCallback(handleList).addErrback(printError)
d.addCallback(shutdown)
reactor.run()
