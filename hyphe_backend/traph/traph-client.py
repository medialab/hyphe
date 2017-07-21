import os, json
from time import time
from Queue import PriorityQueue
#from threading import Thread
from twisted.python import log
from twisted.internet import reactor
from twisted.internet.task import LoopingCall
from twisted.internet.defer import Deferred, inlineCallbacks, returnValue
from twisted.internet.protocol import Protocol, ProcessProtocol
from twisted.internet.endpoints import UNIXClientEndpoint, connectProtocol


class TraphFactory(object):

    # TODO:
    # handle max started corpus ?
    # max ram ?
    # loglevel ?
    # remove ports from config
    # change in core all calls to msclients


    def __init__(self, max_corpus=0):
        self.corpora = {}
        self.max_corpus = max_corpus

    def is_full(self):
        return self.max_corpus and len(self.corpora) >= self.max_corpus

    def log(self, name, msg, error=False, quiet=False):
        if quiet and not error:
            return
        logtype = "ERROR" if error else "INFO"
        if reactor.running:
            log.msg(msg, system="%s - %s" % (logtype, name))
        else:
            print("[%s - %s] %s" % (logtype, name, msg))
        if error and name in self.corpora:
            self.corpora[name].status = "error"
            self.corpora[name].error = msg

    def status_corpus(self, name, simplify=False):
        if name not in self.corpora:
            return "stopped"
        if not simplify:
            return self.corpora[name].status
        if self.test_corpus(name):
            return "ready"
        if self.corpora[name].status == "error":
            return "error"
        if self.corpora[name].stopping():
            return "stopped"
        return "starting"

    def test_corpus(self, name):
        return name and self.status_corpus(name) == "ready"

    def starting_corpus(self, name):
        return name and self.status_corpus(name, True) == "starting"

    def stopped_corpus(self, name):
        return name not in self.corpora or self.corpora[name].stopping()

    def total_running(self):
        return len([0 for a in self.corpora if not self.stopped_corpus(a)])

    def start_corpus(self, name, quiet=False, **kwargs):
        if self.test_corpus(name) or self.status_corpus(name) == "started":
            self.log(name, "Traph already started", quiet=quiet)
            return True
        if name in self.corpora:
            self.corpora[name].stop()
            if "keepalive" not in kwargs:
                kwargs["keepalive"] = self.corpora[name].keepalive
            del(self.corpora[name])
        self.corpora[name] = TraphCorpus(self, name, quiet=quiet, **kwargs)
        if self.is_full():
            self.log(name, "Too many Traphs already opened", True)
            return False
        self.corpora[name].start()
        return True

    def stop_corpus(self, name, quiet=False):
        if self.stopped_corpus(name):
            self.log(name, "Traph already stopped", quiet=quiet)
            return False
        if name in self.corpora:
            self.corpora[name].stop()
        return True

    def stop(self):
        for corpus in self.corpora:
            self.stop_corpus(corpus, True)

    def call(self, corpus, method, *args, **kwargs):
        if not self.test_corpus(corpus):
            return {"code": "fail", "message": "Corpus traph not ready"}
        return self.corpora[corpus].call(method, *args, **kwargs)

class TraphCorpus(object): # Thread ?

    sockets_dir = "sockets"
    exec_path = os.path.join("hyphe_backend", "traph", "traph-server.py")
    #daemon = True

    def __init__(self, factory, name, default_WECR=None, WECRs=None, keepalive=1800, quiet=False, **kwargs):
        #Thread.__init__(self)
        # TODO check and make socketdirs
        self.factory = factory
        self.status = "init"
        self.name = name
        self.socket = os.path.join(self.sockets_dir, name)
        self.options = {
          "default_WECR": default_WECR,
          "WECRs": WECRs
        }
        self.quiet = quiet
        self.keepalive = keepalive
        self.lastcall = time()
        self.call_running = False
        self.monitor = LoopingCall(self.__check_timeout__)
        self.error = None
        self.transport = None
        self.protocol = None
        self.client = None
        reactor.addSystemEventTrigger('before', 'shutdown', self.stop)

    #def run(self):
    def start(self):
        self.error = None
        self.status = "started"
        self.log("Starting Traph for at least %ss" % self.keepalive)
        cmd = [
          "python",
          "-u",
          self.exec_path,
          self.socket,
          self.name
        ]
        with open(self.socket+"-options.json", "w") as f:
            json.dump(self.options, f)
        self.log("Starting Traph: %s" % " ".join(cmd))
        self.protocol = TraphProcessProtocol(self.socket, self)
        self.transport = reactor.spawnProcess(
          self.protocol,
          cmd[0],
          cmd,
          env=os.environ
        )
        self.client = self.protocol.client

    def call(self, method, *args, **kwargs):
        return self.client.sendMessage(method, *args, **kwargs)

    def __check_timeout__(self):
        delay = time() - self.lastcall
        if self.status == "ready" and self.keepalive < delay and not self.call_running:
            self.log("Stopping after %ss of inactivity" % int(delay))
            self.stop()

    def stop(self):
        if self.monitor.running:
            self.monitor.stop()
        if self.stopping():
            return
        self.status = "error" if self.error else "stopping"
        if self.transport:
            self.protocol.stop()
            self.transport = None
        self.log("Traph stopped")
        if not self.error:
            self.status = "stopped"

    def stopping(self):
        return self.status in ["stopping", "stopped", "error"]

    def log(self, msg, error=False):
        self.factory.log(self.name, msg, error, quiet=self.quiet)


class TraphProcessProtocol(ProcessProtocol):

    def __init__(self, socket, corpus):
        self.socket = socket
        self.corpus = corpus
        self.client = TraphClientProtocol(corpus)

    def connectionMade(self):
        self.corpus.status = "starting"
        print "Traph Process started"

    def connectClient(self):
        connectProtocol(
          UNIXClientEndpoint(reactor, self.socket),
          self.client
        )

    # TODO handle stack from process
    # TODO handle traph process cannot start (sock existing for example) -> then hard_restart ?
    def childDataReceived(self, childFD, data):
        data = data.strip()
        print "Traph process received \"%s\" on buffer %s" % (data, childFD)
        if childFD == 1 and data == "READY":
            self.connectClient()

    def childConnectionLost(self, childFD):
        print "Traph process lost connection to buffer", childFD

    # TODO handle auto hard restart ?
    def processExited(self, reason):
        self.corpus.status = "stopping"
        self.transport.loseConnection()
        rc = reason.value.exitCode
        if rc == 0:
            self.corpus.status = "stopped"
            print "Traph process exited cleanly"
        else:
            self.corpus.status = "error"
            self.corpus.error = reason
            print "Traph process crashed:", reason

    def stop(self):
        self.corpus.status = "stopping"
        if self.transport.pid:
            self.transport.signalProcess("TERM")


TraphMethodsPriorities = {
  "create_webentity": -5
}
TraphMethodPriority = lambda method: TraphMethodsPriorities.get(method, 0)

class TraphClientProtocol(Protocol):

    def __init__(self, corpus):
        self.corpus = corpus
        self.deferred = None
        self.queue = PriorityQueue()

    def connectionMade(self):
        self.corpus.log("Traph ready")
        self.corpus.status = "ready"
        self.corpus.monitor.start(max(1, int(self.corpus.keepalive/6)))

    def sendMessage(self, method, *args, **kwargs):
        deferred = Deferred()
        priority = TraphMethodPriority(method)
        self.corpus.lastcall = time()
        self.queue.put(
          (priority, time(), deferred, method, args, kwargs),
          False
        )
        if self.corpus.status == "ready" and not self.deferred:
            self._sendMessageNow()
        return deferred

    def _sendMessageNow(self):
        if self.queue.empty():
            return
        self.corpus.call_running = True
        _, _, self.deferred, method, args, kwargs = self.queue.get(False)
        self.corpus.log("Traph client query: %s %s %s" % (method, args, kwargs))
        self.transport.writeSequence(json.dumps({
          "method": method,
          "args": args,
          "kwargs": kwargs
        }))

    def dataReceived(self, data):
        data = data.strip()
        self.corpus.log("Traph server answer: %s" % data)
        self.corpus.lastcall = time()
        try:
            msg = json.loads(data)
            self.deferred.callback(data)
        except ValueError:
            self.corpus.log("Received non json data %s" % data, True)
            self.deferred.errback(Exception(data))
        self.corpus.call_running = False
        self.deferred = None
        self._sendMessageNow()


if __name__ == "__main__":
    import sys

    corpus = "test"
    if len(sys.argv):
        corpus = sys.argv[1]
    factory = TraphFactory()
    factory.start_corpus(corpus, keepalive=10)

    reactor.callLater(2, factory.corpora[corpus].call, "TEST")
    reactor.callLater(2, factory.corpora[corpus].call, "clear")
    reactor.callLater(3, factory.corpora[corpus].call, "TEST")
    reactor.callLater(3, factory.corpora[corpus].call, "add_page", "s:http|h:fr|h:scpo|p:bib|")
    reactor.callLater(3, factory.corpora[corpus].call, "TEST")
    reactor.callLater(4, factory.corpora[corpus].call, "TEST 4")
    reactor.run()
