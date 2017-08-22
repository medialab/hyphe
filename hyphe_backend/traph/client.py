import os, sys
import json, msgpack
from time import time, sleep
from Queue import PriorityQueue
from twisted.python import log
from twisted.internet import reactor
from twisted.internet.task import LoopingCall
from twisted.internet.defer import Deferred
from twisted.internet.protocol import ProcessProtocol, Factory
from twisted.internet.endpoints import UNIXClientEndpoint
from twisted.protocols.basic import LineOnlyReceiver
from hyphe_backend.lib import config_hci
config = config_hci.load_config()

class TraphFactory(object):

    # TODO:
    # handle timedout queries
    # handle max started corpus ?
    # max ram ?

    sockets_dir = "traph-sockets"

    # TODO reset default chatty to False when fixed problem starting traph with it
    def __init__(self, data_dir="traph-data", max_corpus=0, chatty=True):
        self.data_dir = data_dir
        self.max_corpus = max_corpus
        self.chatty = chatty
        self.corpora = {}
        if not os.path.isdir(self.data_dir):
            os.makedirs(self.data_dir)
        if not os.path.isdir(self.sockets_dir):
            os.makedirs(self.sockets_dir)

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

    def is_full(self):
        return self.max_corpus and self.total_running() >= self.max_corpus

    def start_corpus(self, name, quiet=False, **kwargs):
        if self.test_corpus(name) or self.status_corpus(name) == "started":
            if config["DEBUG"]:
                self.log(name, "Traph already started", quiet=quiet)
            return True
        if name in self.corpora:
            self.corpora[name].stop()
            if "keepalive" not in kwargs:
                kwargs["keepalive"] = self.corpora[name].keepalive
            del(self.corpora[name])
        if self.is_full():
            self.log(name, "Too many Traphs already opened", True)
            return False
        self.corpora[name] = TraphCorpus(self, name, quiet=quiet, **kwargs)
        return self.corpora[name].start()

    def stop_corpus(self, name, quiet=False):
        if self.stopped_corpus(name):
            if config["DEBUG"]:
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

class TraphCorpus(object):

    exec_path = os.path.join("hyphe_backend", "traph", "server.py")
    #daemon = True

    def __init__(self, factory, name, default_WECR=None, WECRs=None, keepalive=1800, quiet=False, **kwargs):
        self.factory = factory
        self.status = "init"
        self.name = name
        self.socket = os.path.join(self.factory.sockets_dir, name)
        self.pidfile = self.socket + ".pid"
        self.options = {
          "traph_dir": self.factory.data_dir,
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

    def start(self):
        self.error = None
        self.status = "started"
        cmd = [
          sys.executable,
          "-u",
          self.exec_path,
          self.socket,
          self.name
        ]
        self.checkAndRemovePID(True)
        with open(self.socket+"-options.json", "w") as f:
            json.dump(self.options, f)
        self.log("Starting Traph for at least %ss: %s" % (self.keepalive, " ".join(cmd)))
        self.protocol = TraphProcessProtocol(self.socket, self)
        self.transport = reactor.spawnProcess(
          self.protocol,
          cmd[0],
          cmd,
          env=os.environ
        )
        with open(self.pidfile, "w") as f:
            f.write(str(self.transport.pid))
        self.client = self.protocol.client
        return True

    def call(self, method, *args, **kwargs):
        return self.client.sendMessage(method, *args, **kwargs)

    def __check_timeout__(self):
        delay = time() - self.lastcall
        if self.status == "ready" and self.keepalive < delay and not self.call_running:
            self.log("Stopping after %ss of inactivity" % int(delay))
            self.stop()

    def stopping(self):
        return self.status in ["stopping", "stopped", "error"]

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
        else:
            self.checkAndRemovePID()

    def checkAndRemovePID(self, warn=False):
        if os.path.exists(self.pidfile):
            if warn:
                self.log("WARNING: PID file already exists for %s, cleaning-up..." % self.socket)
            with open(self.pidfile) as f:
                pid = int(f.read())
            procpath = "/proc/%s" % pid
            tries = 0
            while tries < 3 and os.path.exists(procpath):
                os.kill(pid, 15)
                tries += 1
                sleep(1)
            if os.path.exists(procpath):
                self.log("WARNING: Force killing residual process %s" % pid)
                os.kill(pid, 9)
                sleep(1)
        if os.path.exists(self.pidfile):
            os.remove(self.pidfile)
        if os.path.exists(self.socket):
            if warn:
                self.log("Removing residual socket file %s" % self.socket)
            os.remove(self.socket)

    def log(self, msg, error=False):
        self.factory.log(self.name, msg, error, quiet=self.quiet)


class TraphProcessProtocol(ProcessProtocol):

    def __init__(self, socket, corpus):
        self.socket = socket
        self.corpus = corpus
        self.client = TraphClientProtocol(corpus)

    def connectionMade(self):
        self.corpus.status = "starting"

    def connectClient(self):
        class TraphClientFactory(Factory):
            def buildProtocol(this, addr):
                return self.client
        t = TraphClientFactory()
        if not self.corpus.factory.chatty:
            t.noisy = False
        UNIXClientEndpoint(reactor, self.socket).connect(t)

    def childDataReceived(self, childFD, data):
        data = data.strip()
        if childFD == 1 and data == "READY":
            self.connectClient()
        else:
            self.corpus.log('Traph process received "%s"' % data, childFD == 2)

    def childConnectionLost(self, childFD):
        pass

    def processExited(self, reason):
        self.corpus.status = "stopping"
        self.transport.loseConnection()
        rc = reason.value.exitCode
        if rc == 0:
            self.corpus.status = "stopped"
            self.corpus.log("Traph process exited cleanly")
        else:
            self.corpus.status = "error"
            self.corpus.error = reason
            self.corpus.log("Traph process crashed: %s" % reason, True)
        self.corpus.checkAndRemovePID()

    def stop(self):
        self.corpus.status = "stopping"
        if self.transport.pid:
            self.transport.signalProcess("TERM")


TraphMethodsPriorities = {
  "create_webentity": -5
}
TraphMethodPriority = lambda method: TraphMethodsPriorities.get(method, 0)

class TraphClientProtocol(LineOnlyReceiver):

    delimiter = b"\r\n##TxHypheMsgPackDelimiter\r\n"
    MAX_LENGTH = 16777216

    def __init__(self, corpus):
        self.corpus = corpus
        self.deferred = None
        self.queue = PriorityQueue()
        self.last_query = None

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
        if config["DEBUG"]:
            self.corpus.log("Traph client query: %s %s %s" % (method, args, kwargs))
        self.last_query = {
          "method": method,
          "args": args,
          "kwargs": kwargs
        }
        self.sendLine(msgpack.packb(self.last_query))

    def lineLengthExceeded(self, line):
        self.corpus.log("Line length (%s) exceeded limit (%s) on UNIX socket: %s %s" % (len(line), self.MAX_LENGTH, type(e), e), True)

    def lineReceived(self, data):
        self.corpus.lastcall = time()
        try:
            msg = msgpack.unpackb(data)
            self.deferred.callback(msg)
            if config["DEBUG"] == 2:
                self.corpus.log("Traph server answer: %s" % msg)
        except (msgpack.exceptions.ExtraData, msgpack.exceptions.UnpackValueError) as e:
            error = "%s: %s - Received badly formatted data of length %s in answer to %s" % (type(e), e, len(data), self.last_query)
            self.corpus.log(error, True)
            if self.deferred:
                self.deferred.errback(Exception(error))
        self.corpus.call_running = False
        self.deferred = None
        self._sendMessageNow()


if __name__ == "__main__":
    corpus = "test"

    log.startLogging(sys.stdout)
    factory = TraphFactory(chatty=True)
    factory.start_corpus(corpus, keepalive=2)

    reactor.callLater(2, factory.corpora[corpus].call, "TEST")
    reactor.callLater(2, factory.corpora[corpus].call, "clear")
    reactor.callLater(3, factory.corpora[corpus].call, "TEST")
    reactor.callLater(3, factory.corpora[corpus].call, "add_page", "s:http|h:fr|h:scpo|p:bib|")
    reactor.callLater(3, factory.corpora[corpus].call, "TEST")
    reactor.callLater(4, factory.corpora[corpus].call, "TEST 4")
    reactor.callLater(8, reactor.stop)

    reactor.run()
