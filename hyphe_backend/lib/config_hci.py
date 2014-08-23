#!/usr/bin/env python
# -*- coding: utf-8 -*-

import simplejson as json
from twisted.internet import defer

def load_config(filename = 'config/config.json'):
    try:
        with open(filename, 'r') as config_file:
            conf = json.load(config_file)
        conf['proxy'] = {'host': '', 'port': 3128}
        if 'proxy_host' in conf['mongo-scrapy']:
            conf['proxy']['host'] = conf['mongo-scrapy']['proxy_host']
        if 'proxy_port' in conf['mongo-scrapy']:
            conf['proxy']['port'] = conf['mongo-scrapy']['proxy_port']
        if conf['DEBUG']:
            defer.setDebugging(True)
        return conf
    except IOError as e:
        print 'ERROR: Could not open config/config.json file : ', e
        return False
    except ValueError as e:
        print 'ERROR: Config file is not valid JSON', e
        return False

