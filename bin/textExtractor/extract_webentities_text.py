#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, os
import pymongo
import jsonrpclib
from md5 import md5
#from argparse import ArgumentParser
from html2text import textify

def mkdir(dirname, root="outputs"):
    curdir = root
    if curdir and not os.path.exists(curdir):
        os.makedirs(curdir)

    for piece in dirname.split(os.path.sep):
        curdir = os.path.join(curdir, piece)
        if not os.path.exists(curdir):
            os.makedirs(curdir)

def ensure_index_on_pages(mongo_pages_coll):
    print("building mongo index")
    mongo_pages_coll.create_index([('url', pymongo.ASCENDING), \
        ("content_type", pymongo.ASCENDING), ("status", pymongo.ASCENDING)])
    print("index done")

def process_all(hyphe_core, mongo_pages_coll, corpus, status_to_extract=["IN"]):
    total_pages = 0
    total_wes = 0
    for status in status_to_extract:
        wes = get_status_webentities(hyphe, status, corpus)
        total_wes += len(wes)
        total_pages += process_webentities(hyphe, dbpages, wes, corpus)
    print("collected a total of %s pages for %s webentities" % \
        (total_pages, total_wes))

def get_status_webentities(hyphe_core, status, corpus):
    print("Retrieving %s web entities" % status)
    res = hyphe_core.store.get_webentities_by_status(status, None, \
        1000, 0, corpus)["result"]
    wes = res["webentities"]
    while res["next_page"]:
        res = hyphe_core.store.get_webentities_page(res["token"], \
            res["next_page"], corpus)["result"]
        wes += res["webentities"]
    print("Got %s webentities" % len(wes))
    return wes

def process_webentities(hyphe_core, mongo_pages_coll, wes, corpus):
    wes_done_path = os.path.join("outputs", corpus, "done.txt")
    try:
        with open(wes_done_path) as f:
            wes_done = f.read().split("\n")
    except:
        wes_done = []

    n_pages = 0
    for we in wes:
        n_pages += process_we(hyphe_core, mongo_pages_coll, we, corpus, \
            wes_done=wes_done)
        with open(wes_done_path, "a") as f:
            f.write("%s\n" % we["id"])
    return n_pages

def process_we(hyphe_core, mongo_pages_coll, we, corpus, len_slice=500, \
        wes_done=[], content_types=["text/plain", "text/html"], \
        extractors=["Article", "ArticleSentences", "Default", "Canola"]):

    pages_done_path = os.path.join("outputs", corpus, we["id"], "done.txt")
    try:
        with open(pages_done_path) as f:
            done = f.read().split("\n")
    except:
        done = []
    n_pages = len(done)

    if we["id"] in wes_done:
        return n_pages

    mkdir(os.path.join(corpus, we["id"], "html"))
    mkdir(os.path.join(corpus, we["id"], "text"))
    for method in extractors:
        mkdir(os.path.join(corpus, we["id"], "text%s" % method))

    pages = hyphe_core.store.get_webentity_pages(we["id"], True, corpus)
    if (pages['code'] == 'fail'):
        print("ERROR with pages for WE %s: %s" % (we["id"], pages['message']))
        return n_pages
    urls = [page["url"] for page in pages["result"] if page["url"] not in done]
    nb_urls = len(urls)
    i = 0
    n_done = 0
    while i < nb_urls:
        pages_slice = list(mongo_pages_coll.find({
            "url": {"$in": urls[i:i+len_slice]},
            "status": 200,
            "content_type": {"$in": content_types},
            "body" : {"$exists": True}
          }, projection=["_id", "encoding", "url", "body"]))
        for page in pages_slice:
            process_page(page, we["id"], corpus, extractors)
            with open(pages_done_path, "a") as f:
                f.write("%s\n" % page["url"])
            n_done += 1
        i += len_slice
    print("retrieved %s pages out of %s for webentity %s" % \
        (n_done, nb_urls, we["id"]))
    return n_pages + n_done

def process_page(page, wename, corpus, \
        extractors=["Article", "ArticleSentences", "Default", "Canola"]):

    urlmd5 = md5(page["url"]).hexdigest()
    body = page["body"].decode('zip')
    encoding = page.get("encoding", "")

    try:
        body = body.decode(encoding)
    except Exception :
        body = body.decode("UTF8", "replace")
        encoding = "UTF8-replace"

    html = os.path.join("outputs", corpus, wename, "html", urlmd5)
    with open(html, "w") as f:
        f.write(body.encode("utf-8"))

    text = os.path.join("outputs", corpus, wename, "text", urlmd5)
    with open(text, "w") as f:
        f.write(textify(body, encoding=encoding).encode("utf-8"))

    for method in extractors:
        cleantext = os.path.join("outputs", corpus, wename, \
            "text%s" % method, urlmd5)
        with open(cleantext, "w") as f:
            f.write(textify(body, extractor="%sExtractor" % method, \
                encoding=encoding).encode("utf-8"))


if __name__ == '__main__':

    # TODO: add arguments for
    # - apiurl
    # - mongoconn + db
    # - corpus
    # - output formats
    # - output dir
    # - boilerpipe extractors
    # - status to process
    # - contenttypes pages

    #parser = ArgumentParser()
    #parser.add_argument("-o", "--output", action='store_true', help="")
    #args = parser.parse_args()

    api = ""
    mongohost = ""
    mongoport = 27017
    mongodb = ""
    corpus = ""

    # Initiate Hyphe API connection and ensure corpus started
    try:
        hyphe = jsonrpclib.Server(api, version=1)
    except Exception as e:
        exit('Could not initiate connection to hyphe core')
	start = hyphe.start_corpus(corpus, password)
	if result['code'] == 'fail' :
		exit(start['message'])

    # Initiate MongoDB connection and build index on pages
    try:
        db = pymongo.MongoClient(mongohost, mongoport)
        dbpages = db[mongodb]["%s.pages" % corpus]
    except Exception as e:
        exit('Could not initiate connection to MongoDB')
    ensure_index_on_pages(dbpages)

    # Run!
    process_all(hyphe, dbpages, corpus)
