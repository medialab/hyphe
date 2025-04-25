#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Cached list of recent user-agents grabbed from https://www.useragents.me
# Update the fallback cache by running python hyphe_backend/lib/user_agents.py

import os
import sys
import random
import requests

#SOURCE_URL = "https://www.useragents.me/api"
SOURCE_URL = "https://raw.githubusercontent.com/CallocGD/user-agents-list/refs/heads/main/user-agents/user-agents.json"

class UserAgentsList(object):

    def __init__(self, config={}, agents_list=[], cache_file=None, read_cache=True):
        self.list = agents_list
        self.cache = cache_file or os.path.join(os.path.dirname(__file__), "user_agents.txt")

        proxies = {}
        if config and "mongo-scrapy" in config:
            proxy = config["mongo-scrapy"].get("proxy_host", "")
            port = config["mongo-scrapy"].get("proxy_port", "")
            if proxy and port:
                proxy = "%s:%s" % (proxy.rstrip("/"), port)
            if proxy:
                proxies = {
                    "http": proxy,
                    "https": proxy
                }

        # Initiate with latest list of UserAgents or fallback with local list
        if not self.list:
            self.download_latest(proxies=proxies)
        if not self.list:
            self.read_cache()

    def download_latest(self, proxies={}):
        try:
            json_list = requests.get(SOURCE_URL, proxies=proxies, timeout=(5, 15)).json()
            self.list = [
                ua
                for ua in json_list.get("desktop")
                if not "Trident" in ua or "MSIE " in ua
            ]
        except requests.exceptions.ConnectTimeout as e:
            if proxies:
                print "WARNING: could not connect to proxy %s to download latest UserAgents list; will retry without proxy" % (proxies["http"])
                self.download_latest()
            else:
                print "WARNING: could not download latest UserAgents list from %s ; will use a local cached list: %s - %s" % (SOURCE_URL, type(e), e)
        except Exception as e:
            print "WARNING: could not download latest UserAgents list from %s ; will use a local cached list: %s - %s" % (SOURCE_URL, type(e), e)

    def read_cache(self):
        try:
            with open(self.cache) as f:
                self.list = f.read().splitlines()
        except Exception as e:
            print "ERROR: could not read cached list of user agents in file %s: %s - %s" % (self.cache, type(e), e)

    def write_cache(self):
        try:
            with open(self.cache, "w") as user_agents_file:
                for user_agent in self.list:
                    print >> user_agents_file, user_agent
        except Exception as e:
            print "ERROR: could not write list of user agents in cache file %s: %s - %s" % (self.cache, type(e), e)

    def get_random(self):
        """Returns a random user agent not including IE or Trident ones"""
        return random.choice(self.list)


if __name__ == "__main__":
    # Updates the local user_agents.txt backup file
    ua_list = UserAgentsList(read_cache=False)
    ua_list.write_cache()
