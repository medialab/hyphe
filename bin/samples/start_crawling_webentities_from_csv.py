# -*- coding: utf-8 -*-

#
# Libs
#
import jsonrpclib
import csv
import sys
import logging

#
# Config
#
corpus = 'corpus_name'
password = 'corpus_password'
log_file = 'start_crawling_webentities_from_csv.log'
log_level = logging.DEBUG
webentities_file = 'start_crawling_webentities_from_csv.csv'
depth_crawl = 1
phantom_crawl = False
# Should be of this format : 'http://hyphe.medialab.sciences-po.fr/INSTANCE-api/'
# if you usually access Hyphe from : 'http://hyphe.medialab.sciences-po.fr/INSTANCE/'
api_url = 'url_of_your_own_api'

#
# Programm
#
logging.basicConfig(filename = log_file, filemode = 'w', format = '%(asctime)s  |  %(levelname)s  |  %(message)s', datefmt = '%m/%d/%Y %I:%M:%S %p', level = log_level)
logging.info('start')

def main():
	# Connect to the Hyphe - API
	try :
		hyphe_core = jsonrpclib.Server(api_url, version = 1)
		logging.info('Connection success')
	except Exception as e :
		logging.error('Could not initiate connection to hyphe core')
		sys.exit(1)

	# Be sure that the corpus is started
	result = hyphe_core.start_corpus(corpus, password)
	if result['code'] == 'fail' :
		logging.error(result['message'])
		sys.exit(1)

	# Iterate over the web entities
	with open(webentities_file) as f :
		for webentity in csv.DictReader(f) :
			# For all web entities, reset the status to the one of the .csv file
			result = hyphe_core.store.set_webentity_status(webentity['ID'], webentity['STATUS'], corpus)
			if result['code'] == 'fail' :
				logging.error(result['message'])
			else :
				logging.info(result['result'])
			# Add the web entity to be crawled, if it STATUS is 'IN' and it has not been crawled before, ie. CRAWLING STATUS is 'UNCRAWLED'
			if webentity['STATUS'] == 'IN' and webentity['CRAWLING STATUS'] == 'UNCRAWLED' :
				result = hyphe_core.crawl_webentity(webentity['ID'], depth_crawl, phantom_crawl, webentity['STATUS'], 'prefixes', {}, corpus)
				if result['code'] == 'fail' :
					logging.error(result['message'])
				else :
					logging.info(result['result'])

if __name__ == '__main__':
	main()