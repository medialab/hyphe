#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import random
from fake_useragent import UserAgent, FakeUserAgentError

USER_AGENTS_CLIENT = None
user_agents_list = []

# Initializing the UserAgent object if possible, otherwise the user_agets_list from the user_agents.txt file

directory = os.path.dirname(__file__)
path_to_file = os.path.join(directory,"user_agents.txt")

try:
    USER_AGENTS_CLIENT = UserAgent(cache=False) #Instantiation of the UserAgent object
except FakeUserAgentError:
    print "Error when trying to instantiate a user-agent with FakeUserAgent. Switching to local list"
    with open(path_to_file) as f: #Transcription of the local user_agents.txt into the user_agents_list
        user_agents_list = f.read().splitlines()

def get_random_user_agent():
    """Returns a random user agent"""

    if USER_AGENTS_CLIENT is None:
        random_user_agent = random.choice(user_agents_list)
    else:
        random_user_agent = USER_AGENTS_CLIENT.random
    return random_user_agent

def update_user_agents_list():
    """Updates the local user_agents.txt file containing 100 user agents"""

    directory = os.path.dirname(__file__)
    path_to_file = os.path.join(directory,"user_agents.txt")

    if USER_AGENTS_CLIENT is None:
        print "Error when trying to update the user-agents list with FakeUserAgent"
        sys.exit(1)

    # Generating a new list of 100 user agents
    
    new_user_agents_set = set() # Using a set avoids duplicates
    while len(new_user_agents_set) < 100:
        new_user_agents_set.add(USER_AGENTS_CLIENT.random)
    sorted(new_user_agents_set)

    print "List of user agents successfully generated"

    # Storing the list into user_agents.txt

    try:
        with open(path_to_file, "w") as user_agents_file:
            for user_agent in new_user_agents_set:
                print >> user_agents_file, user_agent
    except:
        print "Error writing in user_agents.txt"

if __name__ == "__main__":
    update_user_agents_list()
