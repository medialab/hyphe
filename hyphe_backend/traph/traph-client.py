import os, json
from time import time
from Queue import PriorityQueue
from twisted.internet import reactor
from twisted.internet.defer import Deferred, inlineCallbacks, returnValue
from twisted.internet.protocol import Protocol, ProcessProtocol
from twisted.internet.endpoints import UNIXClientEndpoint, connectProtocol


class TraphCorpus():

    sockets_dir = "sockets"
    exec_path = os.path.join("hyphe_backend", "traph", "traph-server.py")

    def __init__(self, corpus, default_WECR=None, WECRs=None):
        self.corpus = corpus
        self.socket = os.path.join(self.sockets_dir, corpus)
        self.options = {
          "default_WECR": default_WECR,
          "WECRs": WECRs
        }
        self.transport = None
        self.protocol = None
        self.client = None
        reactor.addSystemEventTrigger('before', 'shutdown', self.stop)

    def start(self):
        cmd = [
          "python",
          "-u",
          self.exec_path,
          self.socket,
          self.corpus,
          json.dumps(self.options)
        ]
        print "STARTING traph:", " ".join(cmd)
        self.protocol = TraphProcessProtocol(self.socket)
        self.transport = reactor.spawnProcess(
          self.protocol,
          cmd[0],
          cmd,
          env=os.environ
        )
        self.client = self.protocol.client

    def stop(self):
        if self.transport:
            self.protocol.stop()
            self.transport = None

    def call(self, method, *args, **kwargs):
        return self.client.sendMessage(method, *args, **kwargs)


class TraphProcessProtocol(ProcessProtocol):

    def __init__(self, socket):
        self.socket = socket
        self.client = TraphClientProtocol()

    def connectionMade(self):
        print "Process started"

    def childDataReceived(self, childFD, data):
        data = data.strip()
        print "PROCESS CHILD %s RECEIVED: %s" % (childFD, data)
        if childFD == 1 and data == "READY":
            connectProtocol(
              UNIXClientEndpoint(reactor, self.socket),
              self.client
            )

    def childConnectionLost(self, childFD):
        print "PROCESS CHILD CONN LOST", childFD

    def processExited(self, reason):
        self.transport.loseConnection()
        rc = reason.value.exitCode
        if rc == 0:
            print "PROCESS CHILD ENDED CLEANLY", rc
        else:
            print "PROCESS CHILD ENDED BADLY:", reason

    def stop(self):
        if self.transport.pid:
            self.transport.signalProcess("TERM")


TraphMethodsPriorities = {
  "create_webentity": -5
}
TraphMethodPriority = lambda method: TraphMethodsPriorities.get(method, 0)

class TraphClientProtocol(Protocol):

    def __init__(self):
        self.ready = False
        self.deferred = None
        self.queue = PriorityQueue()

    def connectionMade(self):
        print "Connection established with traph"
        self.ready = True

    def sendMessage(self, method, *args, **kwargs):
        deferred = Deferred()
        priority = TraphMethodPriority(method)
        self.queue.put(
          (priority, time(), deferred, method, args, kwargs),
          False
        )
        if self.ready and not self.deferred:
            self._sendMessageNow()
        return deferred

    def _sendMessageNow(self):
        if self.queue.empty():
            return
        _, _, self.deferred, method, args, kwargs = self.queue.get(False)
        print "CLIENT QUERY :", method, args, kwargs
        self.transport.writeSequence(json.dumps({
          "method": method,
          "args": args,
          "kwargs": kwargs
        }))

    def dataReceived(self, data):
        data = data.strip()
        print "SERVER ANSWER:", data
        try:
            msg = json.loads(data)
            self.deferred.callback(data)
        except ValueError:
            print >> sys.stderr, "ERROR received non json data", data
            self.deferred.errback(Exception(data))
        self.deferred = None
        self._sendMessageNow()


@inlineCallbacks
def testClient(corpus, msg="TEST", *args, **kwargs):
    res = yield corpus.call(msg, *args, **kwargs)
    print "YEEEHA", res

if __name__ == "__main__":
    import sys

    corpus = TraphCorpus(sys.argv[1])
    corpus.start()

    reactor.callLater(1, testClient, corpus)
    reactor.callLater(1, testClient, corpus, "clear")
    reactor.callLater(2, testClient, corpus, "add_page", "s:http|h:fr|h:scpo|p:bib|")
    reactor.callLater(3, testClient, corpus, "TEST 4")
    reactor.run()
