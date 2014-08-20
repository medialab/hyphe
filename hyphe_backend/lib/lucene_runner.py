#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, time, inspect
import threading, subprocess, socket
from random import shuffle
from datetime import datetime
from twisted.internet import reactor
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

class LuceneCorpus(threading.Thread):

    daemon = True

    def __init__(self, factory, name, host="localhost",
      maxram=256, timeout=1800):
        threading.Thread.__init__(self)
        self.factory = factory
        self.status = "init"
        self.name = name
        self.ram = maxram
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
        self.log("Stopped running")
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
        self.status = "init"
        self.run()

    def choose_port(self):
        self.port = 0
        address = self.host.replace('localhost', '')
        ports = list(self.factory.ports_free)
        shuffle(ports)
        for port in ports:
            try:
                s = socket.socket()
                s.bind((address, port))
                s.close()
                self.port = port
                self.factory.ports_free.remove(port)
                break
            except Exception as e:
                pass

    def run(self):
        self.choose_port()
        if not self.port:
            self.log("Couldn't find a port to attach MemoryStructure to", True)
            return
        java_options = "-Xms%dm -Xmx%dm " % (max(256, self.ram/4), self.ram)
        java_options += "-Xmn224m -XX:NewSize=224m -XX:MaxNewSize=224m " + \
            "-XX:NewRatio=3 -XX:SurvivorRatio=6 -XX:PermSize=128m " + \
            "-XX:MaxPermSize=128m -XX:+UseParallelGC -XX:ParallelGCThreads=2"
        command = "java -server %s -jar %s corpus=%s thrift.port=%d" % \
            (java_options, HYPHE_MS_JAR, self.name, self.port)
        self.log("Starting MemoryStructure on port %s with %sMo ram" % \
            (self.port, self.ram))
        self.proc = subprocess.Popen(command.split(), stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True)
        self.restart_thrift_clients()
        self.factory.ram_free -= self.ram
        self.status = "started"
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
                    self.monitor.start(300)
                    self.log("MemoryStructure ready")
                elif ltype == "ERROR":
                    if msg.startswith("Lock obtain timed out") or \
                      "Could not create ServerSocket" in msg:
                        self.log("Corpus seems like already running," + \
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
                        self.run()
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

    def __init__(self, host="localhost", port_range=[13500,13550], max_ram=2048):
        self.corpora = {}
        self.host = host
        self.ports_free = port_range
        self.ram_free = max_ram

    def log(self, name, msg, error=False):
        logtype = "ERROR" if error else "INFO"
        print("[%s - %s] %s" % (name, logtype, msg))

    def status_corpus(self, name):
        if name not in self.corpora:
            return None
        return self.corpora[name].status

    def test_corpus(self, name):
        return self.status_corpus(name) == "ready"

    def start_corpus(self, name, **kwargs):
        if self.test_corpus(name):
            self.log(name, "Already started")
            return True
        if not self.ports_free:
            self.log(name, "Not enough free ports", True)
            return False
        if name not in self.corpora:
            self.corpora[name] = LuceneCorpus(self, name, self.host, **kwargs)
            self.corpora[name].start()
        else:
            while self.ram_free < self.corpora[name].ram and \
              self.corpora[name].ram > 256:
                self.corpora[name].ram -= 256
            if self.ram_free < self.corpora[name].ram:
                self.log(name, "Not enough free ram", True)
                return False
            self.corpora[name].run()
        return True

    def stop_corpus(self, name):
        if not self.test_corpus(name):
            self.log(name, "Already stopped")
            return True
        if name in self.corpora:
            self.corpora[name].stop()
        return True

# TESTING
if __name__ == '__main__':
    from hyphe_backend.lib import config_hci
    config = config_hci.load_config()
    if not config:
        exit()
    ad = config['memoryStructure']['thrift.host']
    portrange = range(*config['memoryStructure']['thrift.portrange'])
    factory = CorpusFactory(host=ad, port_range=portrange)
    factory.start_corpus("test", timeout=10)
    factory.log("test", factory.corpora["test"].client_sync.ping())
    time.sleep(1)
    factory.log("test", factory.corpora["test"].client_sync.ping())
    factory.log("test", factory.corpora["test"].client_loop.ping())
    factory.start_corpus("test-more-ram", maxram=512)
    time.sleep(2)
    factory.log("test-more-ram", factory.corpora["test-more-ram"].client_sync.ping())
    factory.log("test-more-ram", factory.corpora["test-more-ram"].client_loop.ping())
    def printping(cl):
        cl.log(cl.client_sync.ping())
    def printping2(cl):
        res = cl.client_pool.ping()
        res.addCallback(cl.log)
    def printping3(cl):
        res = cl.client_loop.ping()
        res.addCallback(cl.log)
    reactor.callLater(1, printping3, factory.corpora["test"])
    reactor.callLater(2, printping, factory.corpora["test"])
    reactor.callLater(2, printping, factory.corpora["test-more-ram"])
    reactor.callLater(3, printping2, factory.corpora["test"])
    reactor.callLater(4, printping3, factory.corpora["test-more-ram"])
    reactor.callLater(13, printping2, factory.corpora["test-more-ram"])
    reactor.callLater(16, printping, factory.corpora["test"])
    reactor.callLater(16, printping, factory.corpora["test-more-ram"])
    reactor.callLater(22, factory.stop_corpus, "test")
    reactor.callLater(22, factory.stop_corpus, "test-more-ram")
    reactor.callLater(23, printping, factory.corpora["test-more-ram"])
    reactor.callLater(25, reactor.stop)
    reactor.run()
