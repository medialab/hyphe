#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
from fake_useragent import UserAgent, FakeUserAgentError
import collections
import os

def generate_random_useragent():
	directory = os.path.dirname(__file__)
	path_to_file = os.path.join(directory,"user_agents.txt")

	try:
		ua = UserAgent(cache=False)
	except FakeUserAgentError:
		print "Error when trying to instanciate a user-agent with FakeUserAgent. Swintching to local list"
	return ua.random

if __name__ == '__main__':
	directory = os.path.dirname(__file__)
	path_to_file = os.path.join(directory,"user_agents.txt")
	try:
		ua = UserAgent(cache=False)
		ua.update()
	except FakeUserAgentError:
		print "Error when trying to update the user-agents list with FakeUserAgent"
		sys.exit(1)

	# Generating a new list of 100 user agents

	user_agents_list = []
	for x in range(100):
		ua = UserAgent()
		useragent = ua.random
		while useragent in user_agents_list:
			useragent=ua.random
		user_agents_list.append(useragent)
	print "List of user agents successfully generated"

	# Storing the list into user_agents.txt

	user_agents_file = open(path_to_file, "w")
	nb_lines = 0
	for user_agent in user_agents_list:
		user_agents_file.write(user_agent)
		nb_lines += 1
	if nb_lines == 100:
		print "List of user agents successfully stored in user_agents.txt"
	else:
		print "Error storing the list in user_agents.txt"

