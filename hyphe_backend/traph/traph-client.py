import os, json
from twisted.internet import reactor
from twisted.internet.protocol import Protocol, ProcessProtocol
from twisted.internet.endpoints import UNIXClientEndpoint, connectProtocol


class TraphCorpus():

    sockets_dir = "sockets"
    exec_path = os.path.join("hyphe_backend", "traph", "traph-server.py")

    def __init__(self, corpus):
        self.corpus = corpus
        self.socket = os.path.join(self.sockets_dir, corpus)
        self.transport = None
        self.protocol = None
        self.client = None
        reactor.addSystemEventTrigger('before', 'shutdown', self.stop)

    def start(self):
        cmd = ["python", "-u", self.exec_path, self.socket, self.corpus]
        print "STARTING traph:", " ".join(cmd)
        self.protocol = TraphProcessProtocol(self.socket)
        self.transport = reactor.spawnProcess(self.protocol, cmd[0], cmd,
                                               env=os.environ)
        self.client = self.protocol.client

    def stop(self):
        if self.transport:
            self.protocol.stop()
            self.transport = None

    def call(self, method, *args, **kwargs):
        self.client.sendMessage(method, *args, **kwargs)


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
            connectProtocol(UNIXClientEndpoint(reactor, self.socket), self.client)

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


class TraphClientProtocol(Protocol):

    def __init__(self):
        self.ready = False

    def connectionMade(self):
        print "Connection established with traph"
        self.ready = True

    def sendMessage(self, method, *args, **kwargs):
        print "CLIENT SENDING:", method, args, kwargs
        self.transport.write(json.dumps({"method": method, "args": args, "kwargs": kwargs}))

    def dataReceived(self, data):
        print "CLIENT RECEIVED:", data

    def testClient(self):
        self.sendMessage("Hello")
        reactor.callLater(1, self.sendMessage, "This is sent in a second")


if __name__ == "__main__":
    import sys

    corpus = TraphCorpus(sys.argv[1])
    corpus.start()

    reactor.callLater(5, corpus.client.testClient)
    reactor.run()
