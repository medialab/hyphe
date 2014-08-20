#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, time, inspect
import threading, subprocess, socket
from datetime import datetime
from twisted.internet import reactor
from twisted.internet.task import LoopingCall
from twisted.internet.defer import succeed
from twisted.internet.threads import deferToThreadPool
from hyphe_backend.lib.thriftpool import ThriftPooledClient
from hyphe_backend.memorystructure import MemoryStructure as ms

from hyphe_backend.lib import config_hci
config = config_hci.load_config()
if not config:
    exit()

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

    def __init__(self, name="test", maxram=512,
                 host="localhost", timeout=1800):
        threading.Thread.__init__(self)
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
        logtype = "ERROR" if error else "INFO"
        print("[%s - %s] %s" % (self.name, logtype, msg))
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
        address = self.host.replace('localhost', '')
        for port in range(*config['memoryStructure']['thrift.portrange']):
            try:
                s = socket.socket()
                s.bind((address, port))
                s.close()
                self.port = port
            except Exception as e:
                next

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

class LuceneFactory(object):

    def __init__(self):
        pass

# TESTING
if __name__ == '__main__':
    ad = config['memoryStructure']['thrift.host']
    myclass = LuceneCorpus(host=ad, timeout=10)
    myclass.start()
    myclass.log(myclass.client_sync.ping())
    time.sleep(1)
    myclass.log(myclass.client_sync.ping())
    myclass.log(myclass.client_loop.ping())
    myclass2 = LuceneCorpus("test-more-ram", 256, host=ad)
    myclass2.start()
    time.sleep(2)
    myclass2.log(myclass2.client_sync.ping())
    myclass2.log(myclass2.client_loop.ping())
    def printping(cl):
        cl.log(cl.client_sync.ping())
    def printping2(cl):
        res = cl.client_pool.ping()
        res.addCallback(cl.log)
    def printping3(cl):
        res = cl.client_loop.ping()
        res.addCallback(cl.log)
    reactor.callLater(1, printping3, myclass)
    reactor.callLater(2, printping, myclass)
    reactor.callLater(2, printping, myclass2)
    reactor.callLater(3, printping2, myclass)
    reactor.callLater(4, printping3, myclass2)
    reactor.callLater(13, printping2, myclass2)
    reactor.callLater(16, printping, myclass)
    reactor.callLater(16, printping, myclass2)
    reactor.callLater(22, myclass.stop)
    reactor.callLater(22, myclass2.stop)
    reactor.callLater(23, printping, myclass2)
    reactor.callLater(25, reactor.stop)
    reactor.run()
