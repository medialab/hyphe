#!/usr/bin/env python
# -*- coding: utf-8 -*-

import re

from hyphe_backend.lib import config_hci, jsonrpc_utils
config = config_hci.load_config()
if not config:
    exit()

class Enum(set):
    def __getattr__(self, name):
        if name in self:
            return name
        raise AttributeError

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

def jobslog(jobid, msg, db, timestamp=None, corpus=""):
    if timestamp is None:
        timestamp = int(time.time()*1000)
    if isinstance(jobid, types.ListType):
        return db['%s.logs' % corpus].insert([{'_job': _id, 'timestamp': timestamp, 'log': msg} for _id in jobid])
    return db['%s.logs' % corpus].insert({'_job': jobid, 'timestamp': timestamp, 'log': msg})

def format_result(res, nolog=True):
    if not nolog and config['DEBUG'] and len(str(res)) < 1000:
        print res
    return jsonrpc_utils.format_success(res)

def handle_standard_results(res):
    if jsonrpc_utils.is_error(res):
        return res
    return jsonrpc_utils.format_success(res)

