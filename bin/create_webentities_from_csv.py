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
@click.option('-n', '--name', default="name", type=str, show_default=True, help="CSV field for names")
@click.option('-e', '--extra_name', default=None, type=str, show_default=True, help="CSV field for extra name information")
@click.option('-p', '--prefixes', default="prefixes", type=str, show_default=True, help="CSV field containing urls to use as prefixes, separated by pipes or spaces")
@click.option('-h', '--homepage', default="home_page", type=str, show_default=True, help="CSV field containing url to use as homepage")
@click.option('-s', '--startpages', default="start_pages", type=str, show_default=True, help="CSV field containing urls to use as startpages, separated by pipes or spaces")
@click.option('-t', '--tags', default=None, type=str, show_default=True, help="CSV fields containing values desired as tags, separated by commas")
def cli(csv_file, corpus_id, api_url, name, extra_name, prefixes, homepage, startpages, tags):
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
    prefixes = prefixes.encode('utf-8')
    homepage = homepage.encode('utf-8')
    startpages = startpages.encode('utf-8')
    if tags:
        tags = tags.encode('utf-8').split(',')
    else:
        tags = []

    try:
        first = list_wes[0]
        first[name]
        if extra_name:
            first[extra_name]
        first[prefixes]
        first[homepage]
        first[startpages]
        for t in tags:
            first[t]
    except Exception as e:
        print >> sys.stderr, 'ERROR: some requested fields are missing in CSV file %s' % csv_file, type(e), e
        print >> sys.stderr, 'Requested fields:', name, extra_name, prefixes, homepage, startpages, tags
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

        we[homepage] = we[homepage].strip()
        for f in [prefixes, startpages]:
            we[f] = list(set(re.split(r'[ \n|]+', we[f].strip())))
        if not we[prefixes]:
            print >> sys.stderr, "WARNING: no prefix, skipping WebEntity", wename, we
            continue

        wetags = {}
        for t in tags:
            wetags[t] = [we[t]]

        res = hyphe_api.store.declare_webentity_by_lrus_as_urls(we[prefixes], wename, "IN", we[startpages], False, {"USER": wetags}, cid)
        if 'code' not in res or res['code'] == 'fail':
            print >> sys.stderr, 'ERROR: Could not declare WebEntity', wename, startpages, res
            continue
        weid = res['result']['id']

        res = hyphe_api.store.set_webentity_homepage(weid, we[homepage], cid)
        if 'code' not in res or res['code'] == 'fail':
            print >> sys.stderr, "WARNING: Could not set WebEntity's homepage", weid, wename, startpages[0], res

        #for t in tags:
        #    if we[t]:
        #        res = hyphe_api.store.add_webentity_tag_value(weid, 'USER', t, we[t].strip(), cid)
        #        if 'code' not in res or res['code'] == 'fail':
        #            print >> sys.stderr, "WARNING: Could not add WebEntity's tag", weid, wename, t, we[t], res


if __name__ == '__main__':
    cli()
