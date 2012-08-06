from twisted.internet import reactor, defer
from txjsonrpc.netstring.jsonrpc import Proxy
import sys, pprint
sys.path.append('../lib')
import config_hci, lru
 
config = config_hci.load_config()
if not config:
    exit()
 
def printValue(value):
    print pprint.pprint(value)

def printError(error):
    print ' !! ERROR: ', error
 
def shutDown(data):
    print " -> Shutting down reactor..."
    reactor.stop()

command = sys.argv[1]
proxy = Proxy('127.0.0.1', config['twisted']['port'])
dl = []
if len(sys.argv) == 3 :
    d = proxy.callRemote(command, sys.argv[2])
elif len(sys.argv) == 7 :
    d = proxy.callRemote(command, sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])
else :
    d = proxy.callRemote(command)
d.addCallback(printValue).addErrback(printError)
dl.append(d)
 
dl = defer.DeferredList(dl)
dl.addCallback(shutDown)
reactor.run()

