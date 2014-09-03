#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, time, inspect
import subprocess
from sys import stdout
from socket import socket
from threading import Thread
from random import shuffle
from twisted.python import log
from twisted.internet import reactor, defer
from twisted.internet.task import LoopingCall
from twisted.internet.threads import deferToThreadPool
from hyphe_backend.lib.thriftpool import ThriftPooledClient
from hyphe_backend.memorystructure import MemoryStructure as ms
from hyphe_backend.lib.utils import format_error


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

    def __init__(self, factory, name, host="localhost", ram=256, timeout=3600, loglevel="INFO", quiet=False):
        Thread.__init__(self)
        self.factory = factory
        self.status = "init"
        self.name = name
        self.host = host
        self.ram = ram
        self.port = 0
        self.loglevel = loglevel
        self.quiet = quiet
        self.command = ""
        self.error = None
        self.processus = None
        self.client_sync = None
        self.client_pool = None
        self.client_loop = None
        self.lastcall = time.time()
        self.timeout = timeout
        self.monitor = LoopingCall(self.__check_timeout__)

    def restart_thrift_clients(self, restart=True):
        if self.client_sync and restart:
            self.client_sync.close()
        self.client_sync = ThriftPooledClient(ms.Client, host=self.host,
          port=self.port, pool_size=1, async=False)
        if self.client_pool and restart:
            self.client_pool.close()
        self.client_pool = ThriftPooledClient(ms.Client, host=self.host,
          port=self.port, pool_size=5)
        if self.client_loop and restart:
            self.client_loop.close()
        self.client_loop = ThriftPooledClient(ms.Client, host=self.host,
          port=self.port, pool_size=1, async=True, network_timeout=7200000)

    def __check_timeout__(self):
        delay = time.time() - self.lastcall
        if self.status == "ready" and self.timeout < delay:
            self.log("Stopping after %ss of inactivity" % int(delay))
            self.stop()

    def log(self, msg, error=False):
        self.factory.log(self.name, msg, error, quiet=self.quiet)

    def stopping(self):
        return self.status in ["stopping", "stopped", "error"]

    def stop(self):
        if self.monitor.running:
            self.monitor.stop()
        if self.stopping():
            return
        self.status = "error" if self.error else "stopping"
        if self.client_loop:
            self.client_loop.close()
        if self.client_sync:
            self.client_sync.close()
        if self.client_pool:
            self.client_pool.close()
        if self.processus and not self.processus.poll():
            self.processus.terminate()
        if self.port and self.port not in self.factory.ports_free:
            self.factory.ports_free.append(self.port)
            self.factory.ram_free += self.ram
        self.log("MemoryStructure stopped")
        if not self.error:
            self.status = "stopped"

    def hard_restart(self):
        self.status = "restarting"
        pscommand = lambda x: ['p%s' % x, '-f', ' corpus=%s ' % self.name]
        subprocess.call(pscommand("kill"))
        stoptime = time.time() + 30
        with open(os.devnull, "w") as fnull:
            while not subprocess.call(pscommand("grep"), stdout=fnull):
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
        self.error = None
        self.choose_port()
        if not self.port:
            time.sleep(1)
            self.choose_port()
        if not self.port:
            self.log("Couldn't find a port to attach MemoryStructure to", True)
            return
        self.factory.ram_free -= self.ram
        if self.factory.ram_free < 0:
            self.log("Couldn't find enough ram to start MemoryStructure", True)
            return
        self.status = "started"
        size = min(128, max(32, int(self.ram/4)))
        java_options = "-Xms%dm -Xmx%dm " % (self.ram, self.ram)
        java_options += "-XX:NewSize=%sm -XX:MaxNewSize=%sm " % (size, size)
        java_options += "-XX:NewRatio=3 -XX:SurvivorRatio=6 "
        java_options += "-XX:PermSize=%sm -XX:MaxPermSize=%sm " % (size, size)
        java_options += "-XX:+UseParallelGC -XX:ParallelGCThreads=2"
        self.command = "java -server %s -jar %s " % (java_options, HYPHE_MS_JAR)
        self.command += "corpus=%s thrift.port=%d log.level=%s" % \
          (self.name, self.port, self.loglevel)
        self.log("Starting MemoryStructure on port " + \
          "%s with %sMo ram for at least %ss (%sMo ram and %s ports left)" % \
          (self.port, self.ram, self.timeout,
           self.factory.ram_free, len(self.factory.ports_free)))
        self.processus = subprocess.Popen(self.command.split(), stdout=subprocess.PIPE,
          stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True)
        self.restart_thrift_clients()
        while self.processus.poll() is None:
            line = self.processus.stdout.readline().strip('\n')
            if not line.strip():
                continue
            try:
                lts, ltype, lclass, lthread, msg = parse_log(line)
            except:
                if "java.lang.OutOfMemoryError" in line:
                    if self.factory.ram_free >= 256:
                        self.log("Java heap space, trying to restart " + \
                          "with 256Mo more ram", True)
                        self.ram += 256
                    else:
                        self.log("Not enough ram to increase corpus size, " + \
                          "trying to restart anyway", True)
                    self.status = "restarting"
                    self.factory.start_corpus(self.name)
                    break
            # skip tracebacks
                elif line.startswith('\tat '):
                    continue
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
        # skip these errors as they are followed by a more explicit stacktrace
                    elif "Unexpected throwable while invoking!" in msg:
                        pass
                    else:
                        self.log(msg, True)
                elif msg == "shutting down":
                    if not self.stopping():
                        self.status = "stopping"
                        self.log(msg)
        if not self.stopping():
            self.log("MemoryStructure crashed", True)

class CorpusClient(object):

    def __init__(self, factory, type_client):
        self.factory = factory
        for m in inspect.getmembers(ms.Client, predicate=inspect.ismethod):
            setattr(self, m[0], self.__safe_call__(m[0], type_client))

    def __safe_call__(self, call, type_client):
        def __safe_call(*args, **kwargs):
            client = None
            try:
                corpus = kwargs.pop("corpus")
            except:
                corpus = ""
                fail = format_error("corpus argument missing")
            else:
                fail = format_error({"corpus_id": corpus,
                  "ready": self.factory.test_corpus(corpus),
                  "status": self.factory.status_corpus(corpus),
                  "message": "Corpus is not started"})
                if corpus in self.factory.corpora:
                    self.factory.corpora[corpus].lastcall = time.time()
                    client = getattr(self.factory.corpora[corpus],
                      "client_%s" % type_client)
                    if fail["message"]["status"] == "error":
                        fail["message"]["message"] = self.factory.corpora[corpus].error
            if hasattr(client, 'threadpool'):
                if self.factory.test_corpus(corpus):
                    return deferToThreadPool(reactor, client.threadpool,
                      client.__thrift_call__, call, *args, **kwargs)
                return defer.succeed(fail)
            if self.factory.test_corpus(corpus):
                return client.__thrift_call__(call, *args, **kwargs)
            return fail
        return __safe_call

class CorpusFactory(object):

    def __init__(self, host="localhost", loglevel="INFO",
      port_range=[13500,13550], max_ram=2048):
        self.corpora = {}
        self.host = host
        self.loglevel = loglevel
        self.ports_free = port_range
        self.ram_free = max_ram
        for typ in ["sync", "pool", "loop"]:
            setattr(self, typ, CorpusClient(self, typ))

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
            self.corpora[name].stop()

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

    def stopped_corpus(self, name):
        return name not in self.corpora or self.corpora[name].stopping()

    def total_running(self):
        return len([0 for a in self.corpora if not self.stopped_corpus(a)])

    def start_corpus(self, name, quiet=False, **kwargs):
        if self.test_corpus(name) or self.status_corpus(name) == "started":
            self.log(name, "MemoryStructure already started", quiet=quiet)
            return True
        if name in self.corpora:
            self.corpora[name].stop()
            for arg in ["ram", "timeout"]:
                if arg not in kwargs:
                    kwargs[arg] = getattr(self.corpora[name], arg)
            del(self.corpora[name])
        kwargs["loglevel"] = self.loglevel
        self.corpora[name] = LuceneCorpus(self, name, self.host, quiet=quiet, **kwargs)
        if not self.ports_free:
            self.log(name, "Not enough available ports to start corpus", True)
            return False
        while self.ram_free < self.corpora[name].ram and \
          self.corpora[name].ram > 256:
            self.corpora[name].ram -= 256
        if self.ram_free < self.corpora[name].ram:
            self.log(name, "Not enough available ram to start corpus", True)
            return False
        self.corpora[name].start()
        return True

    def stop_corpus(self, name, quiet=False):
        if self.stopped_corpus(name):
            self.log(name, "MemoryStructure already stopped", quiet=quiet)
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
    portrange = config['memoryStructure']['thrift.portrange']
    loglevel = config['memoryStructure']['log.level']
    factory = CorpusFactory(host=ad, port_range=portrange, max_ram=1000, loglevel=loglevel)
    assert(factory.start_corpus("test", timeout=10))
    assert(factory.sync.ping(corpus="test")['code'] == 'fail')
    time.sleep(2)
    assert(factory.corpora["test"].status == "ready")
    assert(len(factory.sync.ping(corpus="test")) == 2)
    assert(factory.loop.ping(corpus="test").__class__ == defer.Deferred)
    assert(factory.start_corpus("test-more-ram", ram=512))
    time.sleep(1)
    assert(not factory.start_corpus("test-not-enough-ram"))
    time.sleep(1)
    assert(factory.corpora["test-more-ram"].status == "ready")
    assert(len(factory.sync.ping(corpus="test-more-ram")) == 2)
    assert(factory.loop.ping(corpus="test-more-ram").__class__ == defer.Deferred)
    assert(factory.corpora["test-not-enough-ram"].error != None)
    assert(factory.sync.ping(corpus="test-not-enough-ram")["code"] == "fail")
    assert(factory.loop.ping(corpus="test-not-enough-ram").__class__ == defer.Deferred)
    assert(factory.sync.ping(corpus="test-not-created")["code"] == "fail")
    assert(factory.loop.ping(corpus="test-not-created")["code"] == "fail")
    def ping(f, name, false=False):
        res = f.sync.ping(corpus=name)
        test_ping(res, f, name, false)
    def test_ping(res, f, name, false):
        try:
            assert((len(res) == 2) != false)
        except:
            print "PING %s %s FAIL: %s" % (name, "DID NOT" if false else "", res)
            stop(f)
    def ping2(f, name, false=False):
        res = f.pool.ping(corpus=name)
        if type(res) == dict:
            test_ping(res, f, name, false)
        else:
            res.addCallback(test_ping, f, name, false)
    def ping3(f, name, false=False):
        res = f.loop.ping(corpus=name)
        if type(res) == dict:
            test_ping(res, f, name, false)
        else:
            res.addCallback(test_ping, f, name, false)
    def teststop(f, name, false=False):
        try:
            assert(f.stop_corpus(name) != false)
        except:
            print "STOP %s %s FAIL" % (name, "DID NOT" if false else "")
            stop(f)
    def success(f):
        print "ALL TESTS SUCCESSFULL!"
        stop(f)
    def stop(f):
        f.stop()
        try:
            reactor.stop()
        except:
            pass
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
    reactor.callLater(27, ping, factory, "test-not-created", false=True)
    reactor.callLater(27, ping2, factory, "test-not-created", false=True)
    reactor.callLater(27, ping3, factory, "test-not-created", false=True)
    reactor.callLater(30, teststop, factory, "test-more-ram")
    reactor.callLater(30, teststop, factory, "test", false=True)
    reactor.callLater(35, success, factory)
    reactor.run()
