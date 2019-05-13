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
@click.argument('archive_dir')
@click.argument('corpus_name')
@click.argument('api_url')
@click.option('-f', '--filter_discovered', is_flag=True, show_default=True, help="Do not recreate Discovered entities (warning: will break IDs retrocompatibility")
@click.option('-d', '--destroy_existing', is_flag=True, show_default=True, help="First destroy existing corpus with the same name")
@click.option('-r', '--restart_after', default=0, type=int, show_default=True, help="Continue after a specific WebEntity's id")
def cli(archive_dir, corpus_name, api_url, filter_discovered, destroy_existing, restart_after):
    try:
        hyphe_api = jsonrpclib.Server(api_url, version=1)
        print 'INFO: Connected to API at', api_url
    except Exception as e:
        print >> sys.stderr, 'ERROR: Could not initiate connection to hyphe core', type(e), e
        return

    # Read old corpus data
    data = {}
    for (filename, key) in [
        ('corpus-config.json', 'config'),
        ('webentities.json', 'webentities'),
        ('crawls.json', 'crawls'),
    ]:
        try:
            with open(os.path.join(archive_dir, filename)) as f:
                data[key] = json.load(f)
        except Exception as e:
            print >> sys.stderr, 'ERROR: Could not read %s in json file %s/%s' % (key, archive_dir, filename), type(e), e
            return

    # Destroy existing corpus if option set
    if destroy_existing and not restart_after:
        print 'INFO: Checking whether corpus exists already...'

        # Get list of existing corpora
        corpora = hyphe_api.list_corpus()
        if 'code' not in corpora or corpora['code'] == 'fail':
            print >> sys.stderr, 'ERROR: Could not collect list of corpora', corpora
            return

        # Find corpus with same name in existing ones
        corpus = None
        for cid, c in corpora['result'].items():
            if c['name'] == corpus_name:
                corpus = c
                break

        # Start and destroy existing corpus
        if corpus:
            print 'INFO: Starting and destroying existing corpus %s...' % cid
            cid = corpus['corpus_id']
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

            res = hyphe_api.destroy_corpus(cid)
            if 'code' not in res or res['code'] == 'fail':
                print >> sys.stderr, 'ERROR: Could not destroy corpus', res
                return
            print 'INFO: %s destroyed' % cid
        else:
            print >> sys.stderr, 'WARNING: Could not find an existing corpus with the desired name', corpus_name

    # CREATE CORPUS
    if not restart_after:
        corpus = hyphe_api.create_corpus(corpus_name, data['config'][0]['password'], data['config'][0]['options'])
        if 'code' not in corpus or corpus['code'] == 'fail':
            print >> sys.stderr, 'ERROR: Corpus could not be created', corpus
            return
        cid = corpus['result']['corpus_id']
    else:
        corpora = hyphe_api.list_corpus()
        if 'code' not in corpora or corpora['code'] == 'fail':
            print >> sys.stderr, 'ERROR: Could not collect list of corpora', corpora
            return
        corpus = None
        for cid, c in corpora['result'].items():
            if c['name'] == corpus_name:
                corpus = c
                break
        if corpus:
            print 'INFO: Starting and destroying existing corpus %s...' % cid
            cid = corpus['corpus_id']
            password = ""
            if corpus['password']:
                password = getpass()

            res = hyphe_api.start_corpus(cid, password)
            if 'code' not in res or res['code'] == 'fail':
                print >> sys.stderr, 'ERROR: Could not start corpus', res
                return
        else:
            print >> sys.stderr, 'WARNING: Could not find an existing corpus with the desired name', corpus_name


    tries = 0
    while tries < 60:
        res = hyphe_api.test_corpus(cid)
        if 'code' in res and res['code'] == 'success' and res['result']['status'] == 'ready':
            break
        tries += 1
        sleep(1)
    print 'Corpus successfully created and ready:', cid

    # TODO : handle manually added creation rules

    # IDENTIFY WEIRD CASES OF PREFIXES SHARED
    bad_WEs = {}
    prefixes = {}
    for we in data['webentities']:
        for p in we['prefixes']:
            if p.startswith('s:http|') or 'h:www|' not in p:
                continue
            if p not in prefixes:
                prefixes[p] = []
            prefixes[p].append(we)
    for p, wes in prefixes.items():
        if len(wes) > 2:
            print >> sys.stderr, "ERROR: found a common prefix in more than 2 different webentities", p, wes
            return
        if len(wes) == 2:
            gd = None
            bad = None
            w1 = wes[0]
            w2 = wes[1]
            if w1["status"] == "IN":
                gd = w1
                bad = w2
            elif w2["status"] == "IN":
                gd = w2
                bad = w1
            elif w1["crawled"]:
                gd = w1
                bad = w2
            elif w2["crawled"]:
                gd = w2
                bad = w1
            elif w1["status"] == "OUT":
                gd = w2
                bad = w1
            elif w2["status"] == "OUT":
                gd = w1
                bad = w2
            else:
                print >> sys.stderr, "ERROR: found a common prefix in 2 different webentities with attributes case not handled", p, wes
                return
            print >> sys.stderr, "WARNING: skipping webentity with common prefixes", p, bad['name'], bad['_id'], bad['status'], gd['name'], gd['_id'], gd['status']
            bad_WEs[bad["_id"]] = gd["_id"]

    # LIST ENTITIES TO RECREATE
    print 'INFO: recreating WebEntities...'
    if filter_discovered:
        print "WARNING: skipping DISCOVERED ones, IDs won't be consistent with previous corpus"
        list_wes = [we for we in data['webentities'] if we['status'] != 'DISCOVERED']
        filtered_entities = {we['_id']: True for we in data['webentities'] if we['status'] == 'DISCOVERED'}
    else:
        list_wes = data['webentities']

    # CREATE ENTITIES FROM webentities.json
    bar = ProgressBar(max_value=len(list_wes))
    old_to_new = {}
    for we in bar(sorted(list_wes, key=lambda x: x["_id"])):
        if we['_id'] in bad_WEs:
            continue
        if restart_after and we['_id'] <= restart_after:
            continue
        res = hyphe_api.store.declare_webentity_by_lrus(we["prefixes"], we["name"], we["status"], we["startpages"], False, cid)
        if 'code' not in res or res['code'] == 'fail':
            print >> sys.stderr, 'ERROR: Could not declare WebEntity', res
            return
        weid = res['result']['id']
        old_to_new[we['_id']] = weid
        if we['homepage']:
            res = hyphe_api.store.set_webentity_homepage(weid, we['homepage'], cid)
            if 'code' not in res or res['code'] == 'fail':
                print >> sys.stderr, "WARNING: Could not set WebEntity's homepage", we['name'], weid, we['homepage'], res
        if 'USER' in we['tags']:
            for cat, vals in we['tags']['USER'].items():
                for val in vals:
                    res = hyphe_api.store.add_webentity_tag_value(weid, 'USER', cat, val, cid)
                    if 'code' not in res or res['code'] == 'fail':
                        print >> sys.stderr, "WARNING: Could not add WebEntity's tag", we['name'], weid, cat, val, res

#TODO : remove existing CORE tags and add old ones ?

    # START CRAWLS FROM crawls.json
    bar = ProgressBar(max_value=len(data['crawls']))
    for c in data['crawls']:
        if c['webentity_id'] not in old_to_new:
            if c['webentity_id'] in bad_WEs:
                old_to_new[c['webentity_id']] = bad_WEs[c[webentity_id]]
            else:
                if not (filter_discovered and c['webentity_id'] in filtered_entities):
                    print >> sys.stderr, "WARNING: skipping crawl on problematic entity not recreated", c
                continue
        args = c['crawl_arguments']
        res = hyphe_api.crawl.start(old_to_new[c['webentity_id']], args['start_urls'], args['follow_prefixes'], args['nofollow_prefixes'], args['discover_prefixes'], args['max_depth'], args['phantom'], {}, 1, args['cookies'], cid)
        if 'code' not in res or res['code'] == 'fail':
            print >> sys.stderr, 'WARNING: Could not start crawl', c, res


if __name__ == '__main__':
    cli()
