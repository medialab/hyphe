from twisted.internet import reactor, defer
from urllru import urlTokenizer,lruRebuild

from txjsonrpc.web.jsonrpc import Proxy


def printValue(value):
    print "Result: %s" % str(value)


def printError(error):
    print 'error', error


def shutDown(data):
    print "Shutting down reactor..."
    reactor.stop()


def getWE(dl) :
	d = proxy.callRemote('getWebEntities')
	d.addCallbacks(printValue, printError)
	dl.append(d)
	d = proxy.callRemote('monitorCrawl')
	d.addCallbacks(printValue, printError)
	dl.append(d)
	watchWE(dl)

def watchWE(dl) :
	d=reactor.callLater(1,getWE,dl)
	dl.append(d)

proxy = Proxy('http://127.0.0.1:8080/')
dl = []


watchWE(dl)



d = proxy.callRemote('crawl',[urlTokenizer("http://www.sciencespo.fr"),urlTokenizer("http://medialab.sciences-po.fr")])
d.addCallbacks(printValue, printError)
dl.append(d)



reactor.run()
