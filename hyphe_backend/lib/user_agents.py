#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
from fake_useragent import UserAgent, FakeUserAgentError
import collections
import random

user_agents_client = None
user_agents_list = []

def init_client(): 
    """Instantiates the UserAgent object (if possible), otherwise instantiates the list from the user_agents.txt file"""
    global user_agents_client
    global user_agents_list
    directory = os.path.dirname(__file__)
    path_to_file = os.path.join(directory,"user_agents.txt")
    try:
        user_agents_client = UserAgent(cache=False) #Instantiation of the UserAgent object
    except FakeUserAgentError:
        print "Error when trying to instantiate a user-agent with FakeUserAgent. Switching to local list"
        with open(path_to_file) as f: #Transcription of the local user_agents.txt into the user_agents_list
            user_agents_list = f.read().splitlines()

init_client()

def generate_random_useragent():
    """Returns a random user agent"""
    global user_agents_list
    directory = os.path.dirname(__file__)
    path_to_file = os.path.join(directory,"user_agents.txt")

    if user_agents_client is None:
        random_user_agent = random.choice(user_agents_list)
    else:
        random_user_agent = user_agents_client.random
    return random_user_agent

def update_useragents_list():
    """Updates the local user_agents.txt file containing 100 user agents"""
    directory = os.path.dirname(__file__)
    path_to_file = os.path.join(directory,"user_agents.txt")
    if user_agents_client is None:
        print "Error when trying to update the user-agents list with FakeUserAgent"
        sys.exit(1)

    # Generating a new list of 100 user agents
    
    new_user_agents_set = set() # Using a set avoids duplicates
    while len(new_user_agents_set) < 100:
        new_user_agents_set.add(user_agents_client.random)
    new_user_agents_list = list(new_user_agents_set)
    new_user_agents_list.sort()

    print "List of user agents successfully generated"

    # Storing the list into user_agents.txt

    try:
        with open(path_to_file, "w") as user_agents_file:
            nb_lines = 0
            for user_agent in new_user_agents_list:
                print >> user_agents_file, user_agent
    except:
        print "Error writing in user_agents.txt"

if __name__ == '__main__':
    update_useragents_list()


