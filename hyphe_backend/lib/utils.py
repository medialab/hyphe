#!/usr/bin/env python
# -*- coding: utf-8 -*-

import re, types, time, hashlib

from hyphe_backend.lib.config_hci import load_config, DEFAULT_CORPUS
config = load_config()
if not config:
    exit()


class Enum(set):
    def __getattr__(self, name):
        if name in self:
            return name
        raise AttributeError

crawling_statuses = Enum(['UNCRAWLED', 'PENDING', 'RUNNING', 'FINISHED', 'CANCELED', 'RETRIED'])
indexing_statuses = Enum(['UNINDEXED', 'PENDING', 'BATCH_RUNNING', 'BATCH_FINISHED', 'BATCH_CRASHED', 'FINISHED', 'CANCELED'])


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


re_clean_corpus = re.compile(r'[^a-z0-9_\-]+',)
def clean_corpus_id(name):
    return re_clean_corpus.sub('-', name.lower().strip("\s\n\r\t"))[:16]

corpus_project = lambda x: ("%s.%s" % (config['mongo-scrapy']['db_name'], x)).lower()


def jobslog(jobid, msg, db, timestamp=None, corpus=""):
    if timestamp is None:
        timestamp = int(time.time()*1000)
    if isinstance(jobid, types.ListType):
        return db['%s.logs' % corpus].insert([{'_job': _id, 'timestamp': timestamp, 'log': msg} for _id in jobid])
    return db['%s.logs' % corpus].insert({'_job': jobid, 'timestamp': timestamp, 'log': msg})


def format_success(res):
    return {'code': 'success', 'result': res}

def format_result(res, nolog=True):
    if not nolog and config['DEBUG'] and len(str(res)) < 1000:
        print res
    return format_success(res)

def format_error(error):
    if type(error) is dict:
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

def handle_standard_results(res):
    if is_error(res):
        return res
    return format_result(res)


def test_bool_arg(boolean):
    return (isinstance(boolean, bool) and boolean) or (isinstance(boolean, unicode) and str(boolean).lower() == 'true') or (isinstance(boolean, int) and boolean != 0)


SALT = hashlib.sha256(config['memoryStructure']['lucene.rootpath'] + \
 str(config['memoryStructure']['thrift.max_ram'] * config["twisted"]["port"] * \
     config['memoryStructure']['thrift.portrange'][-1])
).hexdigest()

def salt(passwd):
    passwd = passwd.strip().lower()
    if not passwd:
        return ""
    return hashlib.sha256(passwd + SALT).hexdigest()

