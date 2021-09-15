#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, sys, time
from inspect import getsourcefile
import subprocess, json, pystache
from shutil import copyfile
from contextlib import nested

verbose = False
for arg in [a for a in sys.argv[1:] if a.strip()]:
    if len(sys.argv) > 2 and (arg == "-v" or arg == "--verbose"):
        verbose = True
    else:
        project = arg

# Copy config.json from root to scrapy deployment dir
if verbose:
    print "Copying config.json from root directory to hyphe_backend/crawler for scrapy deployment..."
try:
    if not os.path.exists("config"):
        os.makedirs("config")
    copyfile("../../config/config.json", "config/config.json")
except IOError as e:
    print "Could not open either source or destination config.json file"
    print "config.json", "crawler/config.json"
    print e
    exit()

from hyphe_backend.lib import config_hci
config = config_hci.load_config()
if not config:
    exit()

# Get corpus project's config in DB to replace default global conf
try:
    from pymongo import MongoClient
except:
    from pymongo import Connection as MongoClient
corpus_conf = MongoClient(os.environ.get('HYPHE_MONGODB_HOST', config["mongo-scrapy"]["host"]), int(os.environ.get('HYPHE_MONGODB_PORT', config["mongo-scrapy"]["mongo_port"])))[config["mongo-scrapy"]["db_name"]]["corpus"].find_one({"_id": project})
if corpus_conf:
    corpus_conf = corpus_conf["options"]
    config["phantom"].update(corpus_conf["phantom"])
    if "webarchives" in corpus_conf and corpus_conf["webarchives"].get("option", None):
        config["mongo-scrapy"]["max_simul_requests"] = 3
        config["mongo-scrapy"]["max_simul_requests_per_host"] = 1
else:
    print "WARNING: trying to deploy a crawler for a corpus project missing in DB"
# Copy Hyphe libraries from HCI lib/
for f in ["urllru", "webarchives", "tlds"]:
    if verbose:
        print "Importing %s.py library from HCI hyphe_backend/lib to hcicrawler..." % f
    try:
        copyfile("../lib/%s.py" % f, "hcicrawler/%s.py" % f)
    except IOError as e:
        print "Could not open either source or destination %s.py file" % f
        print "lib/%s.py", "crawler/hcicrawler/%s.py" % f
        print e
        exit()

# Render the settings py from template with mongo/scrapy config from config.json
if verbose:
    print "Rendering settings.py with mongo-scrapy config values from config.json..."
try:
    curpath = os.path.abspath(getsourcefile(lambda _: None))
    config['mongo-scrapy']['hyphePath'] = os.path.sep.join(curpath.split(os.path.sep)[:-3])
    config['mongo-scrapy']['db_name'] = config['mongo-scrapy']['db_name'].lower()
    config['mongo-scrapy']['project'] = project.lower()
    config['mongo-scrapy']['log_level'] = 'DEBUG' if config['DEBUG'] > 1 else 'INFO'
    config["mongo-scrapy"]["host"] = os.environ.get('HYPHE_MONGODB_HOST', config["mongo-scrapy"]["host"])
    for _to in ["", "idle_", "ajax_"]:
        config['mongo-scrapy']['phantom_%stimeout' % _to] = config['phantom']['%stimeout' % _to]
    with nested(open("hcicrawler/settings-template.py", "r"), open("hcicrawler/settings.py", "w")) as (template, generated):
        generated.write(pystache.render(template.read(), config['mongo-scrapy']))
except IOError as e:
    print "Could not open either crawler/hcicrawler/settings-template.py file or crawler/hcicrawler/settings.py"
    print e
    exit()

# Render the scrapy cfg from template with scrapy config from config.json
if verbose:
    print "Rendering scrapy.cfg with scrapy config values from config.json..."
try:
    with nested(open("scrapy-template.cfg", "r"), open("scrapy.cfg", "w")) as (template, generated):
        config["mongo-scrapy"]["host"] = os.environ.get('HYPHE_CRAWLER_HOST', config["mongo-scrapy"]["host"])
        generated.write(pystache.render(template.read(), config['mongo-scrapy']))
except IOError as e:
    print "Could not open either crawler/scrapy-template.cfg template file or crawler/scrapy.cfg"
    print e
    exit()

# Deploy the egg
if verbose:
    print "Sending HCI's scrapy egg to scrapyd server..."

p = subprocess.Popen(['scrapyd-deploy', '--version', time.strftime('%Y%m%d-%H%M%S', time.gmtime(time.time()))], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
output, errors = p.communicate()
try:
    output = json.loads(output)
    if output['status'] != "ok":
        print "There was a problem sending the scrapy egg."
        print output["message"].replace("\\n", "\n")
        print errors
        exit()
except ValueError:
    print "There was a problem sending the scrapy egg."
    print output
    print errors
    exit()
if verbose:
    print "The egg was successfully sent to scrapyd server", config['mongo-scrapy']['host'], "on port", config['mongo-scrapy']['scrapy_port']
