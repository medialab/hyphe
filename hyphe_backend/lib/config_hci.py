#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, re, types
import simplejson as json
from copy import deepcopy
from twisted.internet import defer
TEST_CORPUS = "--test-corpus--"
DEFAULT_CORPUS = "--hyphe--"
CONFIG_FILE = os.path.join('config', 'config.json')
from hyphe_backend.lib import creationrules
try:
    from pymongo import MongoClient
except:
    from pymongo import Connection as MongoClient

def load_config():

  # Open config file
    try:
        with open(CONFIG_FILE, 'r') as config_file:
            conf = json.load(config_file)
    except IOError as e:
        print 'ERROR: Could not open %s file : ' % CONFIG_FILE, e
        exit(1)
    except ValueError as e:
        print 'ERROR: Config file is not valid JSON', e
        exit(1)

  # Set Monocorpus if old conf type
    if "MULTICORPUS" not in conf or not conf["MULTICORPUS"]:
        conf["MULTICORPUS"] = False

  # Set Twisted port from old configs format
    if "twisted.port" not in conf and "twisted" in conf and "port" in conf["twisted"]:
        conf["twisted.port"] = conf["twisted"]["port"]

  # Set default corpus keepalive option for old configs
    if "memoryStructure" in conf:
        if "keepalive" not in conf["memoryStructure"]:
            conf["memoryStructure"]["keepalive"] = 1800

  # Set default noproxy setting if missing
    if "mongo-scrapy" in conf:
        if 'proxy_host' not in conf['mongo-scrapy']:
            conf['mongo-scrapy']['proxy_host'] = ''
        if 'proxy_port' not in conf['mongo-scrapy']:
            conf['mongo-scrapy']['proxy_port'] = 3128
        # Ensure retrocompat
        conf['mongo-scrapy']['proxy'] = {
          'host': conf['mongo-scrapy']['proxy_host'],
          'port': conf['mongo-scrapy']['proxy_port']
        }

  # Set default creation rules if missing
    if "defaultCreationRule" not in conf:
        conf["defaultCreationRule"] = "domain"
    if "creationRules" not in conf:
        conf["creationRules"] = {}

  # Set default startpages mode for old configs
    if "defaultStartpagesMode" not in conf:
        conf["defaultStartpagesMode"] = "prefixes"

  # Auto unset phantomJs autoretry if missing
    if "phantom" in conf and "autoretry" not in conf["phantom"]:
        conf["phantom"]["autoretry"] = False

  # Check sanity
    try:
        check_conf_sanity(conf, GLOBAL_CONF_SCHEMA)
    except Exception as e:
        print e
        exit(1)

  # Test MongoDB server
    mongoconf = conf['mongo-scrapy']
    db = MongoClient(os.environ.get('HYPHE_MONGODB_HOST', mongoconf['host']), int(os.environ.get('HYPHE_MONGODB_PORT', mongoconf['mongo_port'])))[mongoconf.get('db_name', mongoconf.get('project'))]
    try:
        test = list(db['%s.logs' % DEFAULT_CORPUS].find())
    except Exception as x:
        print "ERROR: Cannot connect to mongoDB, please check your server and the configuration in %s" % CONFIG_FILE
        if config['DEBUG']:
            print x
        exit(1)

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
                exit(1)

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
            exit(1)

  # Turn portrange into list of ports
    conf['memoryStructure']['thrift.portrange'] = range(conf['memoryStructure']['thrift.portrange'][0], conf['memoryStructure']['thrift.portrange'][1]+1)

  # Turn on Twisted debugging
    if conf['DEBUG']:
        defer.setDebugging(True)

    return conf

VALID_STARTPAGES_MODES = re.compile(r'(%s)$' % "|".join(['startpages', 'prefixes', 'pages-\d+'])) # 'homepage']
def validateStartpagesMode(modes):
    """be a string or an array of strings among "prefixes", "startpages" and "pages-<N>" where "<N>" is an int."""
    if type(modes) in [str, unicode, bytes]:
        modes = [modes]
    for m in modes:
        if type(m) not in [str, unicode, bytes]:
            return False
        m = m.lower()
        if not VALID_STARTPAGES_MODES.match(m):
            return False
    return True

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
    "int_fields": ["keepalive", "max_simul_pages_indexing", "max_simul_links_indexing"],
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
  }, "defaultStartpagesMode": {
    "type": validateStartpagesMode
  }, "defaultCreationRule": {
    "type": creationrules.testPreset
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
  "ram": {
    "type": int,
    "default": 256
  },
  "keepalive": {
    "type": int,
    "default": "global/memoryStructure/keepalive"
  },
  "max_depth": {
    "type": int,
    "default": "global/mongo-scrapy/maxdepth"
  },
  "precision_limit": {
    "type": int,
    "default": "global/precisionLimit"
  },
  "defaultStartpagesMode": {
    "type": validateStartpagesMode,
    "default": "global/defaultStartpagesMode"
  },
  "defaultCreationRule": {
    "type": creationrules.testPreset,
    "default": "global/defaultCreationRule"
  },
  "follow_redirects": {
    "type": list,
    "default": "global/discoverPrefixes"
  },
  "proxy": {
    "type": dict,
    "str_fields": ["host"],
    "int_fields": ["port"],
    "default": "global/mongo-scrapy/proxy"
  },
  "phantom": {
    "type": dict,
    "int_fields": ["timeout", "idle_timeout", "ajax_timeout"],
    "extra_fields": {
      "whitelist_domains": list,
      "autoretry": bool
    },
    "default": "global/phantom"
  }
}

def dict_accessor(access, dico):
    path = access.split('/')
    tmp = deepcopy(dico)
    while path:
        curp = path.pop(0)
        if curp not in tmp:
            raise(TypeError("Default path value missing from global config: %s" % access))
        tmp = deepcopy(tmp[curp])
    return tmp

def clean_missing_corpus_options(conf, globalconf):
    for opt, schema in CORPUS_CONF_SCHEMA.items():
        if opt not in conf:
            if type(schema["default"]) == str and schema["default"].startswith("global/"):
                conf[opt] = dict_accessor(schema["default"][7:], globalconf)
            else:
                conf[opt] = schema["default"]
        elif schema["type"] == dict:
            for f in schema.get("int_fields", []) + schema.get("str_fields", []) + schema.get("extra_fields", {}).keys():
                if f not in conf[opt]:
                    conf[opt][f] = dict_accessor(schema["default"][7:], globalconf)[f]
    return conf


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
            raise(error_config("field %s should %s" % (ns, otype.__doc__), ns2, name))
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
