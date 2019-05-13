#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import json
from time import sleep
from getpass import getpass

import click
import jsonrpclib
from progressbar import ProgressBar


@click.command()
@click.argument('corpus_id')
@click.argument('api_url')
@click.option('-f', '--first', default=1, type=int, show_default=True, help="ID of the first WebEntity to crawl")
@click.option('-l', '--last', default=10000, type=int, show_default=True, help="ID of the last WebEntity to crawl")
@click.option('-d', '--depth', default=2, type=int, show_default=True, help="Depth for all crawls")
def cli(corpus_id, api_url, first, last, depth):
    try:
        hyphe_api = jsonrpclib.Server(api_url, version=1)
        print 'INFO: Connected to API at', api_url
    except Exception as e:
        print >> sys.stderr, 'ERROR: Could not initiate connection to hyphe core', type(e), e
        return

    # Find corpus
    corpora = hyphe_api.list_corpus()
    if 'code' not in corpora or corpora['code'] == 'fail':
        print >> sys.stderr, 'ERROR: Could not collect list of corpora', corpora
        return
    corpus = None
    for cid, c in corpora['result'].items():
        if c['corpus_id'] == corpus_id:
            corpus = c
            break
    if corpus:
        print 'INFO: Starting corpus %s...' % cid
        cid = corpus_id
        password = ""
        if corpus['password']:
            password = getpass()

        res = hyphe_api.start_corpus(cid, password)
        if 'code' not in res or res['code'] == 'fail':
            print >> sys.stderr, 'ERROR: Could not start corpus', res
            return
        tries = 0
        while tries < 60:
            res = hyphe_api.test_corpus(cid)
            if 'code' in res and res['code'] == 'success' and res['result']['status'] == 'ready':
                break
            tries += 1
            sleep(1)
        print 'Corpus successfully started and ready:', cid
    else:
        print >> sys.stderr, 'WARNING: Could not find an existing corpus with the desired name', corpus_name
        return

    # START CRAWLS
    bar = ProgressBar(max_value=last-first+1)
    curid = first
    while curid <= last:
        res = hyphe_api.crawl_webentity(curid, depth, False, "IN", {}, cid)
        if 'code' not in res or res['code'] == 'fail':
            print >> sys.stderr, 'WARNING: Could not start crawl', c, res
            return
        curid += 1

if __name__ == '__main__':
    cli()
