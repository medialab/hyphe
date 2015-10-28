#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""

"""

from hyphe_backend.lib import urllru
from hyphe_backend.memorystructure import MemoryStructure as ms

# TODO:
# - handle errorcode
# - metadataItems -> parsing later ?
def generate_cache_from_pages_list(pageList, precision_limit=1, precision_exceptions=[], verbose=False, autostarts=[]):
    if verbose:
        print "### createCache"
    pages = {}
    links = {}
    goodautostarts = set()
    original_link_number = 0
    nodes = {}
    for page_item in pageList:
        if autostarts and page_item["depth"] == 0 and page_item["url"] in autostarts:
            autostarts.remove(page_item["url"])
            if page_item["status"] == 200:
                goodautostarts.add(page_item["url"])
            elif 300 <= page_item["status"] < 400:
                goodautostarts.add(urllru.lru_to_url(page_item["lrulinks"][0]))
        page_item["lru"] = urllru.lru_clean(page_item["lru"])
        is_full_precision = urllru.lru_is_full_precision(page_item["lru"], precision_exceptions)
        lru_head = urllru.lru_get_head(page_item["lru"], precision_exceptions)
        is_node = urllru.lru_is_node(page_item["lru"], precision_limit, lru_head=lru_head)
        node_lru = page_item["lru"] if is_node else urllru.lru_get_node(page_item["lru"], precision_limit, lru_head=lru_head)
        nodes[node_lru] = 1
        # Create index of crawled pages from queue
        if page_item["lru"] not in pages:
            pages[page_item["lru"]] = ms.PageItem(page_item["url"].encode('utf8'), page_item["lru"].encode('utf8'), str(page_item["timestamp"]), int(page_item["status"]), int(page_item["depth"]), str(page_item["error"]), ['CRAWL'], 0, is_full_precision, is_node, {})
        else:
            if 'CRAWL' not in pages[page_item["lru"]].sourceSet:
                pages[page_item["lru"]].sourceSet.append('CRAWL')
            pages[page_item["lru"]].depth = max(0, min(pages[page_item["lru"]].depth, int(page_item["depth"])))
        # Add to index linked pages and index all links between nodes
        if "lrulinks" in page_item:
            for lrulink in page_item["lrulinks"]:
                lrulink = urllru.lru_clean(lrulink)
                is_full_precision = urllru.lru_is_full_precision(lrulink, precision_exceptions)
                lru_head = urllru.lru_get_head(lrulink, precision_exceptions)
                is_node = urllru.lru_is_node(lrulink, precision_limit, lru_head=lru_head)
                target_node = lrulink if is_node else urllru.lru_get_node(lrulink, precision_limit, lru_head=lru_head)
                nodes[target_node] = 1
                original_link_number += 1
# check False {} errorcode
                if lrulink not in pages:
                    try:
                        pages[lrulink] = ms.PageItem(urllru.lru_to_url(lrulink), lrulink.encode('utf-8'), str(page_item["timestamp"]), None, int(page_item["depth"])+1, None, ['LINK'], 1, is_full_precision, is_node, {})
                    except ValueError as e:
                        print "Skipping link to misformatted URL : %s" % lrulink
                        if verbose:
                            print e
                elif 'LINK' not in pages[lrulink].sourceSet:
                    pages[lrulink].sourceSet.append('LINK')
                    pages[lrulink].linked += 1
                links[(node_lru,target_node)] = links[(node_lru,target_node)] + 1 if (node_lru,target_node) in links else 1
    if verbose:
        print str(len(pages))+" unique pages ; "+str(original_link_number)+" links ; "+str(len(links.values()))+" unique links / identified "+str(len(nodes))+" nodes"
    return (pages, [(source, target, weight) for (source,target),weight in links.iteritems()], goodautostarts)

