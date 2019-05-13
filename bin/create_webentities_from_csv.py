#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
import sys
import csv
import json
from time import sleep
from getpass import getpass

import click
import jsonrpclib
from progressbar import ProgressBar


@click.command()
@click.argument('csv_file')
@click.argument('corpus_id')
@click.argument('api_url')
@click.option('-n', '--name', default="Nom", type=str, show_default=True, help="CSV field for names")
@click.option('-e', '--extra_name', default=None, type=str, show_default=True, help="CSV field for extra name information")
@click.option('-u', '--urls', default="Url", type=str, show_default=True, help="CSV fields containing urls to use as prefixes/startpages, separated by commas (the first one found will be used as homepage)")
@click.option('-t', '--tags', default=None, type=str, show_default=True, help="CSV fields containing values desired as tags, separated by commas")
def cli(csv_file, corpus_id, api_url, name, extra_name, urls, tags):
    try:
        hyphe_api = jsonrpclib.Server(api_url, version=1)
        print 'INFO: Connected to API at', api_url
    except Exception as e:
        print >> sys.stderr, 'ERROR: Could not initiate connection to hyphe core', type(e), e
        return

    # Read CSV file
    try:
        with open(csv_file) as f:
            list_wes = list(csv.DictReader(f))
    except Exception as e:
        print >> sys.stderr, 'ERROR: Could not read CSV file %s' % csv_file, type(e), e
        return

    # Test CSV fields
    name = name.encode('utf-8')
    if extra_name:
        extra_name = extra_name.encode('utf-8')
    urls = urls.encode('utf-8').split(',')
    if tags:
        tags = tags.encode('utf-8').split(',')
    else:
        tags = []

    try:
        first = list_wes[0]
        first[name]
        if extra_name:
            first[extra_name]
        for u in urls:
            first[u]
        for t in tags:
            first[t]
    except Exception as e:
        print >> sys.stderr, 'ERROR: some requested fields are missing in CSV file %s' % csv_file, type(e), e
        print >> sys.stderr, 'Requested fields:', name, extra_name, urls, tags
        print >> sys.stderr, 'Available fields:', first.keys()
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

    # CREATE ENTITIES
    bar = ProgressBar(max_value=len(list_wes))
    for we in bar(list_wes):
        wename = we[name]
        if extra_name and we[extra_name]:
            wename += " (%s)" % we[extra_name]
        startpages = set([])
        for f in urls:
            we[f] = we[f].strip()
            if we[f] and we[f].lower().startswith("http"):
                startpages |= set(re.split('[ \n]+', we[f]))
        startpages = list(startpages)
        if not startpages:
            print >> sys.stderr, "WARNING: no url, skipping WebEntity", wename
            continue

        res = hyphe_api.store.declare_webentity_by_lrus_as_urls(startpages, wename, "IN", startpages, True, cid)
        if 'code' not in res or res['code'] == 'fail':
            print >> sys.stderr, 'ERROR: Could not declare WebEntity', wename, startpages, res
            continue
        weid = res['result']['id']

        res = hyphe_api.store.set_webentity_homepage(weid, startpages[0], cid)
        if 'code' not in res or res['code'] == 'fail':
            print >> sys.stderr, "WARNING: Could not set WebEntity's homepage", weid, wename, startpages[0], res

        for t in tags:
            if we[t]:
                res = hyphe_api.store.add_webentity_tag_value(weid, 'USER', t, we[t].strip(), cid)
                if 'code' not in res or res['code'] == 'fail':
                    print >> sys.stderr, "WARNING: Could not add WebEntity's tag", weid, wename, t, we[t], res


if __name__ == '__main__':
    cli()
