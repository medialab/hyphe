#!/bin/python

import subprocess, json, sys
sys.path.append('../lib')
import config_hci

config = config_hci.load_config()
if not config:
    exit()

# Deploy the egg
print "Sending HCI's scrapy egg to scrapyd server..."
p = subprocess.Popen(['scrapy', 'deploy'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
output, errors = p.communicate()
print output, errors
try :
    output = json.loads(output)
    if output['status'] != "ok" :
        print "There was a problem sending the scrapy egg."
        print output, errors
        exit()
except ValueError:
    print "There was a problem sending the scrapy egg."
    print output, errors
    exit()
print "The egg was successfully sent to scrapyd server", config['scrapyd']['host'], "on port", config['scrapyd']['port']
 
