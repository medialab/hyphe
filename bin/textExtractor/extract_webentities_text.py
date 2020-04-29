#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, os, re
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

def process_all(hyphe_core, mongo_pages_coll, corpus, status_to_extract=["IN"],
        content_types=["text/plain", "text/html"],
        extractors=["Article", "ArticleSentences", "Default", "Canola"],
        write_as_csv=False):

    total_pages = 0
    total_wes = 0
    for status in status_to_extract:
        wes = get_status_webentities(hyphe_core, status, corpus)
        total_wes += len(wes)
        total_pages += process_webentities(hyphe_core, mongo_pages_coll, wes, corpus, content_types=content_types, extractors=extractors, write_as_csv=write_as_csv)

    print("collected a total of %s pages for %s webentities" % \
        (total_pages, total_wes))

def process_pages_matching_keyword(hyphe_core, mongo_pages_coll, corpus, keyword, content_types=["text/plain", "text/html"]):
    query = {
        "status": 200,
        "content_type": {"$in": content_types},
        "body" : {"$exists": True}
    }
    print("TOTAL valid pages:", mongo_pages_coll.count(query))

    headers = ["url", "webentity_id", "webentity_name"]
    files = {}
    for typ in ["html", "text", "canola"]:
        files[typ] = open("%s-%s-%s.csv" % (corpus, keyword, typ), "w")
        print >> files[typ], ",".join([k.encode("utf-8") for k in headers + [typ]])
    match = 0
    total = 0
    for page in mongo_pages_coll.find(query):
        total += 1
        if not total % 100:
            print match, "/", total

        body = page["body"].decode('zip')
        if keyword not in body:
            continue
        match +=1

        encoding = page.get("encoding", "")
        try:
            body = body.decode(encoding)
        except Exception :
            body = body.decode("UTF8", "replace")
            encoding = "UTF8-replace"

        we = hyphe_core.store.get_webentity_for_url_as_lru(page["lru"], corpus)
        try:
            assert we["code"] == "success"
            page["webentity_id"] = we["result"]["id"]
            page["webentity_name"] = we["result"]["name"]
        except:
            print("WARNING! Could not resolve WebEntity for url %s" % page["url"])

        page["html"] = body
        page["text"] = textify(body, encoding=encoding)
        page["canola"] = textify(body, extractor="CanolaExtractor", encoding=encoding)

        for typ in ["html", "text", "canola"]:
            if keyword not in page[typ]:
                continue
            print >> files[typ], ",".join([format_for_csv(page.get(k, "")) for k in headers + [typ]])

    for typ in ["html", "text", "canola"]:
        files[typ].close()

    print('FOUND %s pages matching "%s"' % (match, keyword))

def format_for_csv(v):
    if not v:
        return ""
    if type(v) != unicode:
        v = unicode(v)
    v = re.sub(ur"\s*[\r\n]+\s*", u" ↲ ", v).strip(u" ↲")
    if "," in v:
        v = '"%s"' % v.replace('"', '""')
    return v.encode("utf-8")

def get_status_webentities(hyphe_core, status, corpus):
    print("Retrieving %s web entities" % status)
    res = hyphe_core.store.get_webentities_by_status(status, None, \
        1000, 0, False, True, corpus)["result"]
    wes = res["webentities"]
    while res["next_page"]:
        res = hyphe_core.store.get_webentities_page(res["token"], \
            res["next_page"], False, corpus)["result"]
        wes += res["webentities"]
    print("Got %s webentities" % len(wes))
    return wes

def process_webentities(hyphe_core, mongo_pages_coll, wes, corpus,
        content_types=["text/plain", "text/html"],
        extractors=["Article", "ArticleSentences", "Default", "Canola"],
        write_as_csv=False):

    mkdir(corpus)
    wes_done_path = os.path.join("outputs", corpus, "done.txt")
    try:
        with open(wes_done_path) as f:
            wes_done = f.read().split("\n")
    except:
        wes_done = []
        if write_as_csv:
            headers = ["url", "webentity_id", "webentity_name"]
            for typ in ["html", "text"] + extractors:
                with open(os.path.join("outputs", "%s-%s.csv" % (corpus, typ)), "w") as f:
                    print >> f, ",".join([k.encode("utf-8") for k in headers + [typ]])

    n_pages = 0
    for we in wes:
        we_pages = process_we(hyphe_core, mongo_pages_coll, we, corpus, \
            wes_done=wes_done, content_types=content_types, extractors=extractors, write_as_csv=write_as_csv)
        if we_pages:
            if str(we["id"]) not in wes_done:
                with open(wes_done_path, "a") as f:
                    f.write("%s\n" % we["id"])
            n_pages += we_pages
    return n_pages

def process_we(hyphe_core, mongo_pages_coll, we, corpus, len_slice=500, \
        wes_done=[], content_types=["text/plain", "text/html"], \
        extractors=["Article", "ArticleSentences", "Default", "Canola"],
        write_as_csv=False):

    pages_done_path = os.path.join("outputs", corpus, "pages_done-%s.txt" % we["id"])
    try:
        with open(pages_done_path) as f:
            done = f.read().split("\n")
    except:
        done = []
    n_pages = len(done)

    if str(we["id"]) in wes_done:
        print("WE %s already done, skipping" % we["id"])
        return n_pages

    if write_as_csv:
        headers = ["url", "webentity_id", "webentity_name"]
        csvfiles = {}
        for typ in ["html", "text"] + extractors:
            csvfiles[typ] = open(os.path.join("outputs", "%s-%s.csv" % (corpus, typ)), "a")
    else:
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
          }, projection=["_id", "encoding", "url", "body"], sort=[("timestamp", -1)]))
        for page in pages_slice:
            if page["url"] in done:
                continue
            result = process_page(page, we, corpus, extractors, write_as_csv=write_as_csv)
            if write_as_csv:
                for typ in csvfiles:
                    print >> csvfiles[typ], ",".join([format_for_csv(result.get(k, "")) for k in headers + [typ]])
            done.append(page["url"])
            with open(pages_done_path, "a") as f:
                f.write("%s\n" % page["url"])
            n_done += 1
        i += len_slice

    print("retrieved %s pages out of %s for webentity %s" % \
        (n_done, nb_urls, we["id"]))

    if write_as_csv:
        for typ in csvfiles:
            csvfiles[typ].close()

    return n_pages + n_done

def process_page(page, we, corpus,
        extractors=["Article", "ArticleSentences", "Default", "Canola"],
        write_as_csv=False):

    body = page["body"].decode('zip')
    encoding = page.get("encoding", "")

    try:
        body = body.decode(encoding)
    except Exception :
        body = body.decode("UTF8", "replace")
        encoding = "UTF8-replace"

    result = {
        "url": page["url"],
        "webentity_id": we["id"],
        "webentity_name": we["name"],
        "html": body,
        "text": textify(body, encoding=encoding)
    }
    for method in extractors:
        result[method] = textify(body, extractor="%sExtractor" % method, encoding=encoding)

    if not write_as_csv:
        urlmd5 = md5(page["url"]).hexdigest()
        html = os.path.join("outputs", corpus, we["id"], "html", urlmd5)
        with open(html, "w") as f:
            f.write(result["html"].encode("utf-8"))

        text = os.path.join("outputs", corpus, we["id"], "text", urlmd5)
        with open(text, "w") as f:
            f.write(result["text"].encode("utf-8"))

        for method in extractors:
            cleantext = os.path.join("outputs", corpus, we["id"], \
                "text%s" % method, urlmd5)
            with open(cleantext, "w") as f:
                f.write(result[method].encode("utf-8"))

    return result


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
    password = ""
    page_content types = ["text/plain", "text/html"]
    boilerpipe_extractors = ["Canola"]
    keyword = ""
    write_as_csv = True

    # Initiate Hyphe API connection and ensure corpus started
    try:
        hyphe = jsonrpclib.Server(api, version=1)
    except Exception as e:
        exit('Could not initiate connection to hyphe core')
    start = hyphe.start_corpus(corpus, password)
    if start['code'] == 'fail' :
        exit(start['message'])

    # Initiate MongoDB connection and build index on pages
    try:
        db = pymongo.MongoClient(mongohost, mongoport)
        dbpages = db["%s_%s" % (mongodb, corpus)]["pages"]
    except Exception as e:
        exit('Could not initiate connection to MongoDB')
    ensure_index_on_pages(dbpages)

    # Run!
    process_all(hyphe, dbpages, corpus, content_types=page_content_types, extractors=boilerpipe_extractors, write_as_csv=write_as_csv)
    #process_pages_matching_keyword(hyphe, dbpages, corpus, keyword)
