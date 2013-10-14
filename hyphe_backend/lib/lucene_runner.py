#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, time
import threading
import subprocess
import socket
from hyphe_backend.lib import config_hci

config = config_hci.load_config()
if not config:
    exit()

HYPHE_MS_JAR = "%s/hyphe_backend/memorystructure/MemoryStructureExecutable.jar" % os.getcwd()

class LuceneRunner(threading.Thread):

    daemon = True

    def __init__(self, corpus="test", maxram=512):
        self.corpus = corpus
        self.ram_options = "-Xms%dm -Xmx%dm" % (max(256, maxram/4), maxram)
        self.java_options = "-server %s -Xmn224m -XX:NewSize=224m -XX:MaxNewSize=224m -XX:NewRatio=3 -XX:SurvivorRatio=6 -XX:PermSize=128m -XX:MaxPermSize=128m -XX:+UseParallelGC -XX:ParallelGCThreads=2" % self.ram_options
        self.command = "java %s -jar %s corpus=%s" % (self.java_options, HYPHE_MS_JAR, self.corpus)
        self.proc = None
        threading.Thread.__init__(self)
        self.port = 0

    def choose_port(self):
        address = config['memoryStructure']['thrift.host'].replace('localhost', '')
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
            return
        command = "%s thrift.port=%d" % (self.command, self.port)
        print command
        self.proc = subprocess.Popen(command.split(), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True)
        self.monitor()

    def monitor(self):
        while self.proc.poll() is None:
            line = self.proc.stdout.readline().replace("\n", "")
            if line and "ERROR" in line:
                print "[%s] %s" % (self.corpus, line)
        print "DONE"

    def stop(self):
        if not myclass.proc.poll():
            try:
                self.proc.terminate()
                self.monitor()
            except:
                pass

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
