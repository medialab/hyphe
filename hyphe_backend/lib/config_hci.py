#!/usr/bin/env python
# -*- coding: utf-8 -*-

import simplejson as json
import os

def load_config(filename = os.path.join(os.path.dirname(__file__),'../../config/config.json')):
    try:
        with open(filename, 'r') as config_file:
            return json.load(config_file)
    except IOError as e:
        print 'ERROR: Could not open config/config.json file : ', e
        return False
    except ValueError as e:
        print 'ERROR: Config file is not valid JSON', e
        return False
