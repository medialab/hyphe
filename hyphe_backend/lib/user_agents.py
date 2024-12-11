#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Cached list of recent user-agents grabbed from https://www.useragents.me
# Update the fallback cache by running python hyphe_backend/lib/user_agents.py

import os
import sys
import random
import requests

class UserAgentsList(object):

    def __init__(self, agents_list=[], cache_file=None, read_cache=True):
        self.list = agents_list
        self.cache = cache_file or os.path.join(os.path.dirname(__file__), "user_agents.txt")

        # Initiate with latest list of UserAgents or fallback with local list
        if not self.list:
            self.download_latest()
        if not self.list:
            self.read_cache()

    def download_latest(self):
        try:
            json_list = requests.get("https://www.useragents.me/api").json()
            self.list = [
                ua["ua"]
                for ua in json_list.get("data")
                if not "Trident" in ua["ua"] or "MSIE " in ua["ua"]
            ]
        except Exception as e:
            print("WARNING: could not download latest UserAgents list from https://www.useragents.me ; will use a local cached list: %s - %s" % (type(e), e))

    def read_cache(self):
        try:
            with open(self.cache) as f:
                self.list = f.read().splitlines()
        except Exception as e:
            print("ERROR: could not read cached list of user agents in file %s: %s - %s" % (self.cache, type(e), e))

    def write_cache(self):
        try:
            with open(self.cache, "w") as user_agents_file:
                for user_agent in self.list:
                    print(user_agent, file=user_agents_file)
        except Exception as e:
            print("ERROR: could not write list of user agents in cache file %s: %s - %s" % (self.cache, type(e), e))

    def get_random(self):
        """Returns a random user agent not including IE or Trident ones"""
        return random.choice(self.list)


if __name__ == "__main__":
    # Updates the local user_agents.txt backup file
    ua_list = UserAgentsList(read_cache=False)
    ua_list.write_cache()
