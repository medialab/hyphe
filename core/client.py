from twisted.internet import reactor, defer
from txjsonrpc.netstring.jsonrpc import Proxy
import sys
sys.path.append('../lib')
import config_hci, lru 
                                
config = config_hci.load_config()
if not config:
    exit()

def printValue(value):
    print " -> Result: %s" % str(value)

def printError(error):
    print ' !! ERROR: ', error

def shutDown(data):
    print " -> Shutting down reactor..."
    reactor.stop()

dl = []

def getWE(dl) :
    d = proxy.callRemote('store.get_webentities')
    d.addCallbacks(printValue, printError)
    dl.append(d)
    d = proxy.callRemote('crawl.monitor')
    d.addCallbacks(printValue, printError)
    dl.append(d)
    watchWE(dl)
       
def watchWE(dl) :
    d=reactor.callLater(1,getWE,dl)
    d.addCallbacks(printValue, printError)
    dl.append(d)


proxy = Proxy('127.0.0.1', config['twisted']['port'])

#watchWE(dl)

d = proxy.callRemote('system.listMethods')
d.addCallbacks(printValue, printError)
dl.append(d)
d = proxy.callRemote('crawl.list')
d.addCallback(printValue).addErrback(printError)
dl.append(d)
#d = proxy.callRemote('reinitialize')
#d.addCallback(printValue).addErrback(printError)
#dl.append(d)
d = proxy.callRemote('crawl.start', ['http://www.mongodb.org/','http://blog.mongodb.org/'], [lru.url_to_lru("http://www.mongodb.org")], [lru.url_to_lru("http://mongodb.org/support")], [lru.url_to_lru("http://bit.ly"), lru.url_to_lru("http://tinyurl.com")], 2)
d.addCallback(printValue).addErrback(printError)
dl.append(d)
#d = proxy.callRemote('cancel_crawl', '3072c0b0ccf511e1aeac00163e03463e')
#d.addCallback(printValue).addErrback(printError).addBoth(shutDown)
#dl.append(d)
d = proxy.callRemote('crawl.monitor')
d.addCallback(printValue).addErrback(printError)
dl.append(d)
d = proxy.callRemote('store.get_webentities')
d.addCallback(printValue).addErrback(printError)
dl.append(d)
#d = proxy.callRemote('store.index')
#d.addCallback(printValue).addErrback(printError)
#dl.append(d)
#d2 = proxy.callRemote('store.get_webentities')
#d2.addCallback(printValue).addErrback(printError)
#dl.append(d2)
#d2 = proxy.callRemote('store.get_webentity_network')
#d2.addCallback(printValue).addErrback(printError)
#dl.append(d2)

dl = defer.DeferredList(dl)
dl.addCallback(shutDown)
reactor.run()

