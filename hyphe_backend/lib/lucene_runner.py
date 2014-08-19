#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, time
import threading
import subprocess
import socket
from datetime import datetime
from hyphe_backend.lib import config_hci

config = config_hci.load_config()
if not config:
    exit()

HYPHE_MS_JAR = os.path.join(os.getcwd(), "hyphe_backend", "memorystructure",
    "MemoryStructureExecutable.jar")

def parse_log(line):
    line = line.strip("\n")
    linesplit = line.split(",")
    if len(linesplit) < 5:
        raise Exception(
            "Log from MemoryStructure seems wrongly formatted: %s" % line)
    lineparsed = linesplit[:4]
    lineparsed.append(",".join(linesplit[4:]))
    return lineparsed

class LuceneRunner(threading.Thread):

    daemon = True

    def __init__(self, corpus="test", maxram=512):
        self.corpus = corpus
        self.status = "init"
        self.ram = maxram
        self.port = 0
        self.proc = None
        threading.Thread.__init__(self)

    def log(self, msg, error=False):
        logtype = "ERROR" if error else "INFO"
        logmetas = "%s - %s" % (self.corpus, logtype)
        print("[%s] %s" % (logmetas, msg))
        if error:
            self.stop()

    def stop(self):
        self.status = "closing"
        if not self.proc.poll():
            try:
                self.proc.terminate()
                self.monitor()
            except:
                pass
        else:
            self.log("self.proc.poll != none: %s" % self.proc.poll(), True)
        self.log("Stopped running")
        self.status = "closed"

    def choose_port(self):
        address = config['memoryStructure']['thrift.host']
        address = address.replace('localhost', '')
        for port in range(*config['memoryStructure']['thrift.portrange']):
            try:
                s = socket.socket()
                s.bind((address, port))
                s.close()
                return port
            except Exception as e:
                next
        return False

    def run(self):
        self.port = self.choose_port()
        if not self.port:
            self.log("Couldn't find a port to attach MemoryStructure to", True)
            return
        java_options = "-Xms%dm -Xmx%dm " % (max(256, self.ram/4), self.ram)
        java_options += "-Xmn224m -XX:NewSize=224m -XX:MaxNewSize=224m " + \
            "-XX:NewRatio=3 -XX:SurvivorRatio=6 -XX:PermSize=128m " + \
            "-XX:MaxPermSize=128m -XX:+UseParallelGC -XX:ParallelGCThreads=2"
        command = "java -server %s -jar %s corpus=%s thrift.port=%d" % \
            (java_options, HYPHE_MS_JAR, self.corpus, self.port)
        self.log("Starting MemoryStructure on port %s with %sMo ram" % \
            (self.port, self.ram))
        self.proc = subprocess.Popen(command.split(), stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True)
        self.status = "started"
        self.monitor()

    def monitor(self):
        while self.proc.poll() is None:
            line = self.proc.stdout.readline()
            if not line.strip():
                continue
            try:
                lts, ltype, lclass, lthread, msg = parse_log(line)
            except:
                self.log("Internal Error", True)
            if ltype == "ERROR":
                self.log(msg, True)
            elif msg == "shutting down":
                self.status = "closing"
                self.log(msg)
            elif lclass=="LRUIndex" and msg.startswith("starting Thrift server"):
                self.status = "ready"
                self.log("MemoryStructure ready")
        self.status = "stopped"

# TESTING
if __name__ == '__main__':
    myclass = LuceneRunner()
    myclass.start()
    time.sleep(5)
    myclass2 = LuceneRunner("test-more-ram", 1024)
    myclass2.start()
    time.sleep(10)
    myclass.stop()
    myclass2.stop()
