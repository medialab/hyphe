#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, types
import simplejson as json
from pymongo import Connection
from twisted.internet import defer
DEFAULT_CORPUS = "--hyphe--"
CONFIG_FILE = os.path.join('config', 'config.json')
from hyphe_backend.lib import creationrules

def load_config():

  # Open config file
    try:
        with open(CONFIG_FILE, 'r') as config_file:
            conf = json.load(config_file)
    except IOError as e:
        print 'ERROR: Could not open %s file : ' % CONFIG_FILE, e
        return False
    except ValueError as e:
        print 'ERROR: Config file is not valid JSON', e
        return False


  # Set Monocorpus if old conf type
    if "MULTICORPUS" not in conf or not conf["MULTICORPUS"]:
        conf["MULTICORPUS"] = False

  # Set Twisted port from old configs format
    if "twisted.port" not in conf and "twisted" in conf and "port" in conf["twisted"]:
        conf["twisted.port"] = conf["twisted"]["port"]

  # Set default noproxy setting if missing
    if "mongo-scrapy" in conf:
        if 'proxy_host' not in conf['mongo-scrapy']:
            conf['mongo-scrapy']['proxy_host'] = ''
        if 'proxy_port' not in conf['mongo-scrapy']:
            conf['mongo-scrapy']['proxy_port'] = 3128

  # Set default creation rules if missing
    if "defaultCreationRule" not in conf:
        conf["defaultCreationRule"] = "domain"
    if "creationRules" not in conf:
        conf["creationRules"] = {}

  # Auto unset phantomJs autoretry if missing
    if "phantom" in conf and "autoretry" not in conf["phantom"]:
        conf["phantom"]["autoretry"] = False

  # Check sanity
    try:
        check_conf_sanity(conf, GLOBAL_CONF_SCHEMA)
    except Exception as e:
        print e
        return False


  # Test MongoDB server
    mongoconf = conf['mongo-scrapy']
    db = Connection(mongoconf['host'], mongoconf['mongo_port'])[mongoconf.get('db_name', mongoconf.get('project'))]
    try:
        test = list(db['%s.logs' % DEFAULT_CORPUS].find())
    except Exception as x:
        print "ERROR: Cannot connect to mongoDB, please check your server and the configuration in %s" % CONFIG_FILE
        if config['DEBUG']:
            print x
        return None


  # Handle old non multicorpus conf
    if not conf["MULTICORPUS"]:

      # Set default single port and ram
        if "thrift.portrange" not in conf["memoryStructure"]:
            conf["memoryStructure"]["thrift.portrange"] = [conf["memoryStructure"]["thrift.port"], conf["memoryStructure"]["thrift.port"]]
        if "thrift.max_ram" not in conf["memoryStructure"]:
            conf["memoryStructure"]["thrift.max_ram"] = 1024

      # Migrate old lucene corpus into default corpus if not existing yet
        oldpath = conf["memoryStructure"]["lucene.path"]
        if "lucene.rootpath" not in conf["memoryStructure"]:
            conf["memoryStructure"]["lucene.rootpath"] = oldpath
        newpath = os.path.join(oldpath, DEFAULT_CORPUS)
        if not os.path.isdir(newpath):
            print("Migrate old lucene corpus files from %s into dedicated dir %s as default corpus" % (oldpath, DEFAULT_CORPUS))
            old_lucene_files = os.listdir(oldpath)
            try:
                test_and_make_dir(newpath)
                for f in old_lucene_files:
                    os.rename(os.path.join(oldpath, f), os.path.join(newpath, f))
            except:
                print "ERROR migrating %s lucene files from old corpus into new directory" % len(old_lucene_files)
                return False

      # Migrate old corpus' mongodb collections into default corpus ones
        if "db_name" not in mongoconf:
            conf["mongo-scrapy"]["db_name"] = mongoconf["project"]
        migratedb = {
          "queue": "queue",
          "pages": "pageStore",
          "jobs": "jobList",
          "logs": "jobLogs"
        }
        try:
            for key, coll in migratedb.iteritems():
                oldname = mongoconf["%sCol" % coll]
                newname = "%s.%s" % (DEFAULT_CORPUS, key)
                if db[oldname].count():
                    print "INFO: migratingold corpus mongodb collection %s into default corpus %s" % (oldname, newname)
                    db[oldname].rename(newname)
        except Exception as e:
            print type(e), e
            print "ERROR migrating mongodb from old corpus into new collections"
            return False

  # Turn portrange into list of ports
    conf['memoryStructure']['thrift.portrange'] = range(conf['memoryStructure']['thrift.portrange'][0], conf['memoryStructure']['thrift.portrange'][1]+1)

  # Turn on Twisted debugging
    if conf['DEBUG']:
        defer.setDebugging(True)

    return conf


GLOBAL_CONF_SCHEMA = {
  "mongo-scrapy": {
    "type": dict,
    "int_fields": ["mongo_port", "proxy_port", "scrapy_port", "maxdepth", "max_simul_requests", "max_simul_requests_per_host"],
    "str_fields": ["host", "proxy_host"],
    "extra_fields": {
      "download_delay": float
    },
    "multicorpus": {
      "db_name": str
    },
    "monocorpus": {
      "project": str,
      "queueCol": str,
      "pageStoreCol": str,
      "jobListCol": str,
      "jobLogsCol": str
    }
  }, "memoryStructure": {
    "type": dict,
    "int_fields": ["max_simul_pages_indexing", "max_simul_links_indexing"],
    "extra_fields": {
      "log.level": ["INFO", "DEBUG", "WARN", "ERROR", "TRACE"]
    },
    "multicorpus": {
      "thrift.portrange": "range",
      "thrift.max_ram": int,
      "lucene.rootpath": "path"
    },
    "monocorpus": {
      "thrift.port": int,
      "lucene.path": "path"
    }
  }, "twisted.port": {
    "type": int
  }, "defaultCreationRule": {
    "type": creationrules.testPreset,
  }, "creationRules": {
    "type": dict,
    "keys": str,
    "values": creationrules.testPreset
  }, "precisionLimit": {
    "type": int
  }, "discoverPrefixes": {
    "type": list
  }, "phantom": {
    "type": dict,
    "int_fields": ["timeout", "idle_timeout", "ajax_timeout"],
    "extra_fields": {
      "whitelist_domains": list,
      "autoretry": bool
    }
  }, "DEBUG": {
    "type": int
  }
}

CORPUS_CONF_SCHEMA = {
  "ram":              {"type": int},
  "max_depth":        {"type": int},
  "precision_limit":  {"type": int},
  "defaultCreationRule": {"type": creationrules.testPreset},
  "follow_redirects": {"type": list},
  "proxy": {
    "type": dict,
    "str_fields": ["host"],
    "int_fields": ["port"]
  },
  "phantom": {
    "type": dict,
    "int_fields": ["timeout", "idle_timeout", "ajax_timeout"],
    "extra_fields": {
      "whitelist_domains": list,
      "autoretry": bool
    }
  }
}


error_config = lambda x, ns, nm: Exception("ERROR in %s while reading %s:\n%s" % (nm, "field %s" % ns if ns else "", x))

def check_conf_sanity(conf, schema, name=CONFIG_FILE, soft=False):
    for ns, rules in schema.iteritems():
        if ns not in conf:
            if soft:
                continue
            raise(error_config("field %s missing" % ns, "", name))
        test_type(conf[ns], rules["type"], ns, name=name)
        if rules["type"] == dict:
            for f in rules.get("int_fields", []):
                if f not in conf[ns]:
                    if soft:
                        continue
                    raise(error_config("int field %s missing" % f, ns, name))
                test_type(conf[ns][f], int, f, ns, name=name)
            for f in rules.get("str_fields", []):
                if f not in conf[ns]:
                    if soft:
                        continue
                    raise(error_config("string field %s missing" % f, ns, name))
                test_type(conf[ns][f], str, f, ns, name=name)
            for f, otyp in rules.get("extra_fields", {}).iteritems():
                if f not in conf[ns]:
                    if soft:
                        continue
                    raise(error_config("%s field %s missing" % (otyp, f), ns, name))
                test_type(conf[ns][f], otyp, f, ns, name=name)
            if 'keys' in rules:
                for k in conf[ns]:
                    test_type(k, rules["keys"], k, ns, name=name)
            if 'values' in rules:
                for k in conf[ns]:
                    test_type(conf[ns][k], rules["values"], k, ns, name=name)
            if "MULTICORPUS" not in conf:
                continue
            corpustype = "%scorpus" % ("multi" if conf["MULTICORPUS"] else "mono")
            for f, otyp in rules.get(corpustype, {}).iteritems():
                if f not in conf[ns]:
                    if soft:
                        continue
                    raise(error_config("%s field %s missing for mode %s" % (otyp, f, corpustype.upper()), ns, name))
                test_type(conf[ns][f], otyp, f, ns, name=name)

def test_type(obj, otype, ns, ns2="", name=CONFIG_FILE):
    if type(otype) == types.FunctionType:
        if not otype(obj):
            raise(error_config("field %s should respect function %s.%s" % (ns, otype.__module__, otype.__name__), ns2, name))
    elif type(otype) == list:
        if obj not in otype:
            raise(error_config("field %s should be one of %s" % (ns, ", ".join(otype)), ns2, name))
    elif otype == str or otype == "path":
        if type(obj) not in [str, bytes, unicode]:
            raise(error_config("field %s should be a string" % ns, ns2, name))
        if otype == "path":
            try:
                test_and_make_dir(obj)
            except:
                raise(error_config("field %s should be a writable directory path" % ns, ns2, name))
    elif otype == "range":
        if not (type(obj) in (list, tuple) and len(obj) == 2 and type(obj[0]) == int and type(obj[1]) == int):
            raise(error_config("field %s should be a list of two int values" % ns, ns2, name))
    elif otype == float:
        if type(obj) not in [float, int]:
            raise(error_config("field %s should a number" % ns, ns2, name))
    elif otype != bool and type(obj) != otype:
        raise(error_config("field %s should be of type %s" % (ns, str(otype)), ns2, name))
    if otype == list:
        for e in obj:
            if type(e) not in [str, bytes, unicode]:
                raise(error_config("%s should be a list of strings" % ns, ns2, name))

def test_and_make_dir(path):
    try:
        os.makedirs(path)
    except OSError:
        if not os.path.isdir(path):
            raise
