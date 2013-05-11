#!/usr/bin/env python
# -*- coding: utf-8 -*-

import simplejson as json

def load_config(filename = 'config.json'):
    try:
        with open(filename, 'r') as config_file:
            return json.load(config_file)
    except IOError as e:
        print 'ERROR: Could not open config.json file : ', e
        return False
    except ValueError as e:
        print 'ERROR: Config file is not valid JSON', e
        return False
