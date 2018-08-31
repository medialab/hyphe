#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
from fake_useragent import UserAgent, FakeUserAgentError
import collections
import random

user_agent_client = None
user_agents_list = []

def init_user_agent(): 
    global user_agent_client
    directory = os.path.dirname(__file__)
    path_to_file = os.path.join(directory,"user_agents.txt")
    try:
        user_agent_client = UserAgent(cache=False)
    except FakeUserAgentError:
        print "Error when trying to instanciate a user-agent with FakeUserAgent. Swintching to local list"

init_user_agent()

def generate_random_useragent():
    global user_agents_list
    directory = os.path.dirname(__file__)
    path_to_file = os.path.join(directory,"user_agents.txt")

    if user_agent_client is None:
        user_agents_list = open(path_to_file).read().splitlines()
        random_user_agent = random.choice(user_agents_list)
    else:
        random_user_agent = user_agent_client.random
    return random_user_agent

def update_useragent_list():
    directory = os.path.dirname(__file__)
    path_to_file = os.path.join(directory,"user_agents.txt")
    try:
        user_agent_client.update()
    except:
        print "Error when trying to update the user-agents list with FakeUserAgent"
        sys.exit(1)

    # Generating a new list of 100 user agents

    new_user_agents_list = []
    for x in range(100):
        useragent = user_agent_client.random
        while useragent in new_user_agents_list:
            useragent=user_agent_client.random
        new_user_agents_list.append(useragent)
    print "List of user agents successfully generated"

    # Storing the list into user_agents.txt

    with open(path_to_file, "w") as user_agents_file:
        nb_lines = 0
        for user_agent in new_user_agents_list:
            print >> user_agents_file, user_agent
            nb_lines += 1
        if nb_lines == 100:
            print "List of user agents successfully stored in user_agents.txt"
        else:
            print "Error storing the list in user_agents.txt"

if __name__ == '__main__':
    update_useragent_list()


