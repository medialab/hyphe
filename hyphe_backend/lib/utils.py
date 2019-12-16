#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, re, types, time, json, hashlib
from twisted.web.client import getPage as getPageOrig
from twisted.internet.task import deferLater
from twisted.internet import reactor
from hyphe_backend.lib.config_hci import load_config, DEFAULT_CORPUS
config = load_config()
if not config:
    exit()

# Handle Twisted 16+ now refusing unicode urls
def getPage(url, *args, **kwargs):
    try:
        url = str(url)
    except:
        pass
    return getPageOrig(url, *args, **kwargs)

class Enum(set):
    def __getattr__(self, name):
        if name in self:
            return name
        raise AttributeError

crawling_statuses = Enum(['UNCRAWLED', 'PENDING', 'RUNNING', 'FINISHED', 'CANCELED', 'RETRIED'])
indexing_statuses = Enum(['UNINDEXED', 'PENDING', 'BATCH_RUNNING', 'BATCH_FINISHED', 'BATCH_CRASHED', 'FINISHED'])

def now_ts():
    return int(time.time()*1000)

def urls_match_domainlist(urls, domlist):
    for url in urls:
        url = url.lower()
        if url.find('/', 8) > -1:
            dom = url[:url.find('/', 8)]
        else: dom = url
        for d in domlist:
            if dom.endswith(d.lower()):
                return True
    return False

re_clean_host = re.compile(r'^[a-z]+://', re.I)
def clean_host(host):
    host = re_clean_host.sub('', host)
    return host.rstrip('/')

def deferredSleep(sleep=5):
    return deferLater(reactor, sleep, lambda : None)

re_clean_corpus = re.compile(r'[^a-z0-9_\-]+',)
def clean_corpus_id(name):
    return re_clean_corpus.sub('-', name.lower().strip("\n\r\t").strip())[:16]

corpus_project = lambda x: ("%s_%s" % (config['mongo-scrapy']['db_name'], x)).lower()


def format_success(res):
    return {'code': 'success', 'result': res}

def format_result(res, nolog=True):
    if not nolog and config['DEBUG'] and len(str(res)) < 1000:
        print res
    return format_success(res)

def format_error(error):
    if type(error) in [dict, list]:
        msg = error
    else:
        try:
            msg = error.msg
        except:
            try:
                msg = error.getErrorMessage()
            except:
                msg = error
        msg = str(msg)
    return {'code': 'fail', 'message': msg}

def is_error(res):
    if (isinstance(res, dict) and (("code" in res and res['code'] == 'fail') or ("status" in res and res["status"] == "error"))) or isinstance(res, Exception):
        return True
    return False

def reformat_error(error):
    error["code"] = "fail"
    if "status" in error:
        del(error["status"])
    return error

def handle_standard_results(res):
    if is_error(res):
        return res
    if isinstance(res, dict) and "code" in res:
        return res
    return format_result(res)


def lightLogVar(v, l=500):
    try:
        v = json.dumps(v)
    except:
        pass
    if len(v) > l:
        return v[:l] + " ... [%d cars truncated]" % (len(v) - l)
    return v


def test_bool_arg(boolean):
    return (isinstance(boolean, bool) and boolean) or (isinstance(boolean, unicode) and str(boolean).lower() == 'true') or (isinstance(boolean, int) and boolean != 0)


saltfile = os.path.join("config", "salt")
try:
    with open(saltfile) as f:
        SALT = f.read()
except:
    with open(os.path.join("config", "salt"), "w") as f:
        SALT = hashlib.sha256(config["mongo-scrapy"]["db_name"] + config['traph']['data_path'] + str(config['core_api_port']) + str(now_ts())).hexdigest()
        f.write(SALT)
def salt(passwd):
    if not passwd or not passwd.strip().lower():
        return ""
    passwd = passwd.strip().lower().encode('utf-8')
    return hashlib.sha256(passwd + SALT).hexdigest()

