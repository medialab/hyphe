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
@click.argument('webentities_json_export')
@click.argument('corpus_id')
@click.argument('api_url')
#@click.option('-r', '--restart_after', default=0, type=int, show_default=True, help="Continue after a specific WebEntity's id")
def cli(webentities_json_export, corpus_id, api_url): #, restart_after):
    try:
        hyphe_api = jsonrpclib.Server(api_url, version=1)
        print 'INFO: Connected to API at', api_url
    except Exception as e:
        print >> sys.stderr, 'ERROR: Could not initiate connection to hyphe core', type(e), e
        return

    # Read old corpus data
    try:
        with open(webentities_json_export) as f:
            list_wes = json.load(f)["webentities"]
    except Exception as e:
        print >> sys.stderr, 'ERROR: Could not read json file %s' % webentities_json_export, type(e), e
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

    # LIST ENTITIES TO RECREATE
    print 'INFO: recreating WebEntities...'

    # CREATE ENTITIES FROM webentities.json
    tocrawl = []
    bar = ProgressBar(max_value=len(list_wes))
    for we in bar(sorted(list_wes, key=lambda x: x["ID"])):
        startpages = list(set(we["START PAGES"] + we["PREFIXES AS URL"]))
        if we["HOME PAGE"] and we["HOME PAGE"] not in startpages:
            startpages.append(we["HOME PAGE"])
        res = hyphe_api.store.declare_webentity_by_lrus(we["PREFIXES AS LRU"], we["NAME"], we["STATUS"], startpages, False, cid)
        if 'code' not in res or res['code'] == 'fail':
            print >> sys.stderr, 'ERROR: Could not declare WebEntity', res
            return
        weid = res['result']['id']
        if we['HOME PAGE']:
            res = hyphe_api.store.set_webentity_homepage(weid, we['HOME PAGE'], cid)
            if 'code' not in res or res['code'] == 'fail':
                print >> sys.stderr, "WARNING: Could not set WebEntity's homepage", we['NAME'], weid, we['HOME PAGE'], res
        if we["TAGS"]:
            for cat, vals in we['TAGS'].items():
                for val in vals:
                    res = hyphe_api.store.add_webentity_tag_value(weid, 'USER', cat, val, cid)
                    if 'code' not in res or res['code'] == 'fail':
                        print >> sys.stderr, "WARNING: Could not add WebEntity's tag", we['NAME'], weid, cat, val, res
        tocrawl.append(weid)

if __name__ == '__main__':
    cli()
