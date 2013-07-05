#actual thrift client module
from hyphe_backend.memorystructure import MemoryStructure as ms
import time
from hyphe_backend.lib.thriftpool import ThriftPooledClient, ThriftSyncClient

from twisted.internet import reactor, threads

cl1=ThriftSyncClient(iface_cls=ms.Client, host='localhost', port=9090, retries=3, framed_transport=True, compact_protocol=False)
cl2=ThriftPooledClient(iface_cls=ms.Client, host='localhost', port=9090, pool_size=5, retries=3, framed_transport=True, compact_protocol=False)
cl3=ThriftPooledClient(iface_cls=ms.Client, host='localhost', port=9090, pool_size=3, retries=3, framed_transport=True, compact_protocol=False)
cl4=ThriftPooledClient(iface_cls=ms.Client, host='localhost', port=9090, pool_size=3, retries=3, framed_transport=True, compact_protocol=False)
T0 = time.time()
def run(cl, i):
    try:
        return cl.getWebEntities()
    except Exception as e:
        print "ERROR with %s" % i
        print e

def print_result(data, _id, i, T):
    print "%s done %s : at %s (%s)" % (_id, i, (time.time()-T0), len(data))

def run_sync(cl, n,_id):
  for j in range(n):
    i = j+1
    print "%s asked to run %s" % (_id, i)
    res = run(cl, i)
    print_result(res, _id, i, time.time())

def run_async(cl, n,_id):
  for j in range(n):
    i = j+1
    print "%s asked to run %s" % (_id, i)
    res = run(cl, i)
    res.addCallback(print_result, _id, i, time.time())

threads.deferToThread(run_sync, cl1, 5, "II")
threads.deferToThread(run_async, cl2, 10, "III")
threads.deferToThread(run_async, cl3, 5, "I")
reactor.callLater(15, run_async, cl4, 5, "IV")
reactor.callLater(35, run_async, cl2, 5, "V")
reactor.callLater(35, run_async, cl4, 5, "VI")

reactor.run()

