#!/bin/python

import subprocess, json, sys, pystache
sys.path.append('../lib')
import config_hci
from shutil import copyfile
from contextlib import nested

config = config_hci.load_config()
if not config:
    exit()

# Copy LRU library from HCI lib/
print "Importing lru.py library from HCI /lib to hcicrawler..."
try :
    copyfile("../lib/lru.py", "hcicrawler/lru.py")
except IOError as e:
    print "Could not open either source or destination lru.py file"
    print "lib/lru.py", "crawler/hcicrawler/lru.py"
    print e
    exit()
 
# Render the settings py from template with mongo config from config.json
print "Rendering settings.py with mongo config values from config.json..."
try :
    with nested(open("hcicrawler/settings.py.template", "r"), open("hcicrawler/settings.py", "w")) as (template, generated):
        generated.write(pystache.render(template.read(), config['mongoDB']))
except IOError as e:
    print "Could not open either hcicrawler/settings.py template file or hcicrawler/settings.py"
    print "crawler/hcicrawler/settings.py.template", "crawler/hcicrawler/settings.py"
    print e
    exit()

# Render the scrapy cfg from template with  scrapy config from config.json
print "Rendering scrapy.cfg with scrapy config values from config.json..."
try :
    with nested(open("scrapy-template.cfg", "r"), open("scrapy.cfg", "w")) as (template, generated):
        generated.write(pystache.render(template.read(), config['scrapyd']))
except IOError as e:
    print "Could not open either scrapy.cfg template file or scrapy.cfg"
    print "crawler/scrapy-template.cfg", "crawler/scrapy.cfg"
    print e
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
 
