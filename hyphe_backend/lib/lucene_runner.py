#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, time
import subprocess
from sys import stdout
from socket import socket
from threading import Thread
from random import shuffle
from twisted.internet import reactor, defer
from twisted.internet.task import LoopingCall
from twisted.internet.defer import succeed
from twisted.internet.threads import deferToThreadPool
from hyphe_backend.lib.thriftpool import ThriftPooledClient
from hyphe_backend.memorystructure import MemoryStructure as ms


HYPHE_MS_JAR = os.path.join(os.getcwd(), "hyphe_backend", "memorystructure",
    "MemoryStructureExecutable.jar")

def parse_log(line):
    linesplit = line.split(",")
    if len(linesplit) < 5:
        raise Exception(
          "Log from MemoryStructure seems wrongly formatted: %s" % line)
    lineparsed = linesplit[:4]
    lineparsed.append(",".join(linesplit[4:]))
    return lineparsed

class LuceneCorpus(Thread):

    daemon = True

    def __init__(self, factory, name, host="localhost", ram=256, timeout=1800):
        Thread.__init__(self)
        self.factory = factory
        self.status = "init"
        self.name = name
        self.ram = ram
        self.port = 0
        self.host = host
        self.proc = None
        self.client_sync = None
        self.client_pool = None
        self.client_loop = None
        self.restart_thrift_clients()
        self.lastcall = time.time()
        self.timeout = timeout
        self.monitor = LoopingCall(self.__check_timeout__)

    def restart_thrift_clients(self):
        if self.client_sync:
            self.client_sync.close()
        self.client_sync = CorpusClient(self)
        if self.client_pool:
            self.client_pool.close()
        self.client_pool = CorpusClient(self, pool_size=5)
        if self.client_loop:
            self.client_loop.close()
        self.client_loop = CorpusClient(self, async=True, timeout=7200000)

    def __check_timeout__(self):
        delay = time.time() - self.lastcall
        if self.status == "ready" and self.timeout < delay:
            self.log("Stopping after %ss of inactivity" % int(delay))
            self.stop()

    def log(self, msg, error=False):
        self.factory.log(self.name, msg, error)
        if error:
            self.stop()
            self.status = "error"

    def stopping(self):
        return self.status in ["stopping", "stopped", "error"]

    def stop(self):
        if self.monitor.running:
            self.monitor.stop()
        if self.stopping():
            return
        self.status = "stopping"
        self.client_loop.close()
        self.client_sync.close()
        self.client_pool.close()
        if self.proc and not self.proc.poll():
            self.proc.terminate()
        if self.port not in self.factory.ports_free:
            self.factory.ports_free.append(self.port)
        self.factory.ram_free += self.ram
        self.log("MemoryStructure stopped")
        self.status = "stopped"

    def hard_restart(self):
        self.status = "restarting"
        command = lambda x: ['p%s' % x, '-f', ' corpus=%s ' % self.name]
        subprocess.call(command("kill"))
        stoptime = time.time() + 30
        with open(os.devnull, "w") as fnull:
            while not subprocess.call(command("grep"), stdout=fnull):
                if time.time() > stoptime:
                    self.log("Couldn't stop existing corpus", True)
                    return
        self.factory.start_corpus(self.name)

    def choose_port(self):
        self.port = 0
        address = self.host.replace('localhost', '')
        ports = list(self.factory.ports_free)
        shuffle(ports)
        for port in ports:
            try:
                s = socket()
                s.bind((address, port))
                s.close()
                self.port = port
                self.factory.ports_free.remove(port)
                break
            except:
                pass

    def run(self):
        self.choose_port()
        if not self.port:
            self.log("Couldn't find a port to attach MemoryStructure to", True)
            return
        if self.factory.ram_free < self.ram:
            self.log("Couldn't find enough ram to start MemoryStructure", True)
            return
        self.factory.ram_free -= self.ram
        self.status = "started"
        java_options = "-Xms%dm -Xmx%dm " % (max(256, self.ram/4), self.ram)
        java_options += "-Xmn224m -XX:NewSize=224m -XX:MaxNewSize=224m " + \
          "-XX:NewRatio=3 -XX:SurvivorRatio=6 -XX:PermSize=128m " + \
          "-XX:MaxPermSize=128m -XX:+UseParallelGC -XX:ParallelGCThreads=2"
        command = "java -server %s -jar %s corpus=%s thrift.port=%d" % \
          (java_options, HYPHE_MS_JAR, self.name, self.port)
        self.log("Starting MemoryStructure on port " + \
          "%s with %sMo ram for at least %ss (%sMo ram and %s ports left)" % \
          (self.port, self.ram, self.timeout,
           self.factory.ram_free, len(self.factory.ports_free)))
        self.proc = subprocess.Popen(command.split(), stdout=subprocess.PIPE,
          stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True)
        self.restart_thrift_clients()
        while self.proc.poll() is None:
            line = self.proc.stdout.readline().strip('\n')
            if not line.strip():
                continue
            try:
                lts, ltype, lclass, lthread, msg = parse_log(line)
            except:
                self.log(line, True)
            else:
                if lclass=="LRUIndex" and \
                  msg.startswith("starting Thrift server"):
                    self.status = "ready"
                    self.lastcall = time.time()
                    self.monitor.start(max(1,int(self.timeout/6)))
                    self.log("MemoryStructure ready")
                elif ltype == "ERROR":
                    if msg.startswith("Lock obtain timed out") or \
                      "Could not create ServerSocket" in msg:
                        self.log("WARNING: Corpus seems already running," + \
                          "trying to stop and restart it...")
                        self.hard_restart()
                        break
        # TODO TEST ACTUAL HEAP SPACE STACK
                    elif msg.startswith("JAVA HEAP SPACE"):
                        self.status = "restarting"
                        if self.factory.ram_free >= 256:
                            self.log("Java heap space, trying to restart " + \
                              "with 256Mo more ram", True)
                            self.ram += 256
                        else:
                            self.log("Not enough ram available, " + \
                              "trying to restart with 256Mo more", True)
                        self.factory.start_corpus(self.name)
                        break

                    self.log(msg, True)
                elif msg == "shutting down":
                    if not self.stopping():
                        self.status = "stopping"
                        self.log(msg)
        if not self.stopping():
            self.log("MemoryStructure crashed", True)

class CorpusClient(ThriftPooledClient):

    def __init__(self, corpus, async=False, pool_size=1,
                timeout=1800000):
        self.corpus = corpus
        ThriftPooledClient.__init__(self, iface_cls=ms.Client,
            host=corpus.host, port=corpus.port,
            pool_size=pool_size, async=async, network_timeout=timeout)

    # Override thrift calls function to catch corpus down
    def __create_thrift_proxy__(self, methodName):
        def __thrift_proxy(*args):
            self.corpus.lastcall = time.time()
            fail = {"code": "fail", "corpus": self.corpus.name,
                "corpus_status": self.corpus.status,
                "message": "Corpus is not ready, please start it first"}
            if hasattr(self, 'threadpool'):
                if self.corpus.status == "ready":
                    return deferToThreadPool(reactor, self.threadpool,
                      self.__thrift_call__, methodName, *args)
                return succeed(fail)
            if self.corpus.status == "ready":
                return self.__thrift_call__(methodName, *args)
            return fail
        return __thrift_proxy

class CorpusFactory(object):

    def __init__(self, host="localhost",
      port_range=[13500,13550], max_ram=2048):
        self.corpora = {}
        self.host = host
        self.ports_free = port_range
        self.ram_free = max_ram

    def log(self, name, msg, error=False):
        logtype = "ERROR" if error else "INFO"
        stdout.write("[%s - %s] %s\n" % (logtype, name, msg))

    def status_corpus(self, name):
        if name not in self.corpora:
            return None
        return self.corpora[name].status

    def test_corpus(self, name):
        return self.status_corpus(name) == "ready"

    def stopped_corpus(self, name):
        return name not in self.corpora or self.corpora[name].stopping()

    def start_corpus(self, name, **kwargs):
        if self.test_corpus(name) or self.status_corpus(name) == "started":
            self.log(name, "MemoryStructure already started")
            return True
        if not self.ports_free:
            self.log(name, "Not enough available ports to start corpus", True)
            self.corpora[name].status = "error"
            return False
        if name in self.corpora:
            self.corpora[name].stop()
            for arg in ["ram", "timeout"]:
                kwargs[arg] = getattr(self.corpora[name], arg)
            del(self.corpora[name])
        self.corpora[name] = LuceneCorpus(self, name, self.host, **kwargs)
        while self.ram_free < self.corpora[name].ram and \
          self.corpora[name].ram > 256:
            self.corpora[name].ram -= 256
        if self.ram_free < self.corpora[name].ram:
            self.log(name, "Not enough available ram to start corpus", True)
            self.corpora[name].status = "error"
            return False
        self.corpora[name].start()
        return True

    def stop_corpus(self, name, quiet=False):
        if self.stopped_corpus(name):
            if not quiet:
                self.log(name, "MemoryStructure already stopped")
            return False
        if name in self.corpora:
            self.corpora[name].stop()
        return True

    def stop(self):
        for corpus in self.corpora:
            self.stop_corpus(corpus, True)


# TESTING
if __name__ == '__main__':
    from hyphe_backend.lib import config_hci
    config = config_hci.load_config()
    if not config:
        exit()
    ad = config['memoryStructure']['thrift.host']
    portrange = range(*config['memoryStructure']['thrift.portrange'])
    factory = CorpusFactory(host=ad, port_range=portrange, max_ram=1000)
    assert(factory.start_corpus("test", timeout=10))
    assert(factory.corpora["test"].client_sync.ping()['code'] == 'fail')
    time.sleep(2)
    assert(factory.corpora["test"].status == "ready")
    assert(len(factory.corpora["test"].client_sync.ping()) == 2)
    assert(factory.corpora["test"].client_loop.ping().__class__ == defer.Deferred)
    assert(factory.start_corpus("test-more-ram", ram=512))
    time.sleep(1)
    assert(not factory.start_corpus("test-not-enough-ram"))
    time.sleep(1)
    assert(factory.corpora["test-more-ram"].status == "ready")
    assert(len(factory.corpora["test-more-ram"].client_sync.ping()) == 2)
    assert(factory.corpora["test-more-ram"].client_loop.ping().__class__ == defer.Deferred)
    assert(factory.corpora["test-not-enough-ram"].status == "error")
    assert(factory.corpora["test-not-enough-ram"].client_sync.ping()["code"] == "fail")
    assert(factory.corpora["test-not-enough-ram"].client_loop.ping().__class__ == defer.Deferred)
    def ping(f, name, false=False):
        cl = f.corpora[name]
        res = cl.client_sync.ping()
        test_ping(res, false)
    def test_ping(res, false):
        assert((len(res) == 2) != false)
    def ping2(f, name, false=False):
        cl = f.corpora[name]
        res = cl.client_pool.ping()
        res.addCallback(test_ping, false)
    def ping3(f, name, false=False):
        cl = f.corpora[name]
        res = cl.client_loop.ping()
        res.addCallback(test_ping, false)
    def teststop(f, name, false=False):
        assert(f.stop_corpus(name) != false)
    def success():
        print "ALL TESTS SUCCESSFULL!"
        reactor.stop()
    reactor.callLater(1, ping3, factory, "test")
    reactor.callLater(2, ping, factory, "test")
    reactor.callLater(2, ping, factory, "test-more-ram")
    reactor.callLater(3, ping2, factory, "test")
    reactor.callLater(4, ping3, factory, "test-more-ram")
    reactor.callLater(13, ping2, factory, "test-more-ram")
    reactor.callLater(16, ping, factory, "test", false=True)
    reactor.callLater(16, ping, factory, "test-more-ram")
    reactor.callLater(22, teststop, factory, "test", false=True)
    reactor.callLater(22, teststop, factory, "test-more-ram")
    reactor.callLater(23, ping, factory, "test-more-ram", false=True)
    reactor.callLater(24, teststop, factory, "test-more-ram", false=True)
    reactor.callLater(25, factory.start_corpus, "test-more-ram")
    reactor.callLater(26, ping2, factory, "test-more-ram")
    reactor.callLater(27, ping2, factory, "test", false=True)
    reactor.callLater(30, teststop, factory, "test-more-ram")
    reactor.callLater(30, teststop, factory, "test", false=True)
    reactor.callLater(32, factory.stop)
    reactor.callLater(35, success)
    reactor.run()
