#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""

"""

from hyphe_backend.lib import urllru
from hyphe_backend.memorystructure import MemoryStructure as ms

# TODO:
# - handle errorcode
# - metadataItems -> parsing later ?
def generate_cache_from_pages_list(pageList, verbose=False, autostarts=[]):
    if verbose:
        print "### createCache"
    pages = {}
    links = {}
    goodautostarts = set()
    original_link_number = 0
    for page_item in pageList:
        if autostarts and page_item["depth"] == 0 and page_item["url"] in autostarts:
            autostarts.remove(page_item["url"])
            if page_item["status"] == 200:
                goodautostarts.add(page_item["url"])
            elif 300 <= page_item["status"] < 400 and page_item["lrulinks"]:
                goodautostarts.add(urllru.lru_to_url(page_item["lrulinks"][0]))
        page_item["lru"] = urllru.lru_clean(page_item["lru"])
        # Create index of crawled pages from queue
        if page_item["lru"] not in pages:
            pages[page_item["lru"]] = ms.PageItem(page_item["url"].encode('utf8'), page_item["lru"].encode('utf8'), str(page_item["timestamp"]), int(page_item["status"]), int(page_item["depth"]), str(page_item["error"]), ['CRAWL'], 0, True, True, {})
        else:
            if 'CRAWL' not in pages[page_item["lru"]].sourceSet:
                pages[page_item["lru"]].sourceSet.append('CRAWL')
            pages[page_item["lru"]].depth = max(0, min(pages[page_item["lru"]].depth, int(page_item["depth"])))
        # Add to index linked pages and index all links between pages
        if "lrulinks" in page_item:
            for lrulink in page_item["lrulinks"]:
                lrulink = urllru.lru_clean(lrulink)
                original_link_number += 1
# check False {} errorcode
                if lrulink not in pages:
                    try:
                        pages[lrulink] = ms.PageItem(urllru.lru_to_url(lrulink), lrulink.encode('utf-8'), str(page_item["timestamp"]), None, int(page_item["depth"])+1, None, ['LINK'], 1, True, True, {})
                    except ValueError as e:
                        print "Skipping link to misformatted URL : %s" % lrulink
                        if verbose:
                            print e
                elif 'LINK' not in pages[lrulink].sourceSet:
                    pages[lrulink].sourceSet.append('LINK')
                    pages[lrulink].linked += 1
                if (page_item[lru],lrulink) not in links:
                    links[(page_item[lru],lrulink)] = 0
                links[(page_item[lru],lrulink)] += 1
    if verbose:
        print str(len(pages))+" unique pages ; "+str(original_link_number)+" links ; "+str(len(links.values()))+" unique links / identified"
    return (pages, [(source, target, weight) for (source,target),weight in links.iteritems()], goodautostarts)

