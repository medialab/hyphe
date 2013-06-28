#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""

"""

from hyphe_backend.lib import urllru
from hyphe_backend.memorystructure import MemoryStructure as ms

# TODO:
# - handle errorcode
# - metadataItems -> parsing later ?
def generate_cache_from_pages_list(pageList, precision_limit = 1, precision_exceptions = [], verbose = False) :
    if verbose :
        print "### createCache"
    pages = {}
    links = {}
    original_link_number = 0
    nodes = {}
    for page_item in pageList : 
        page_item["lru"] = urllru.cleanLRU(page_item["lru"])
        is_full_precision = urllru.isFullPrecision(page_item["lru"], precision_exceptions)
        lru_head = urllru.getLRUHead(page_item["lru"], precision_exceptions)
        is_node = urllru.isLRUNode(page_item["lru"], precision_limit, lru_head=lru_head)
        node_lru = page_item["lru"] if is_node else urllru.getLRUNode(page_item["lru"], precision_limit, lru_head=lru_head)
        nodes[node_lru] = 1
        # Create index of crawled pages from queue
        if page_item["lru"] not in pages:
            pages[page_item["lru"]] = ms.PageItem(str(page_item["_id"]), page_item["url"].encode('utf8'), page_item["lru"].encode('utf8'), str(page_item["timestamp"]), int(page_item["status"]), int(page_item["depth"]), str(page_item["error"]), ['CRAWL'], is_full_precision, is_node, {})
        else:
            if 'CRAWL' not in pages[page_item["lru"]].sourceSet:
                pages[page_item["lru"]].sourceSet.append('CRAWL')
            pages[page_item["lru"]].depth = max(0, min(pages[page_item["lru"]].depth, int(page_item["depth"])))
        # Add to index linked pages and index all links between nodes
        if "lrulinks" in page_item:
            for index,lrulink in enumerate(page_item["lrulinks"]) :
                lrulink = urllru.cleanLRU(lrulink)
                is_full_precision = urllru.isFullPrecision(lrulink, precision_exceptions)
                lru_head = urllru.getLRUHead(lrulink, precision_exceptions)
                is_node = urllru.isLRUNode(lrulink, precision_limit, lru_head=lru_head)
                target_node = lrulink if is_node else urllru.getLRUNode(lrulink, precision_limit, lru_head=lru_head)
                nodes[target_node] = 1
                original_link_number += 1
# check False {} errorcode
                if lrulink not in pages:
                    try:
                        pages[lrulink] = ms.PageItem(str(page_item["_id"])+"_"+str(index), urllru.lru_to_url(lrulink).encode('utf8'), lrulink.encode('utf8'), str(page_item["timestamp"]), None, int(page_item["depth"])+1, None, ['LINK'], is_full_precision, is_node, {})
                    except ValueError as e:
                        print "Skipping link to misformatted URL : %s" % lrulink
                elif 'LINK' not in pages[lrulink].sourceSet:
                    pages[lrulink].sourceSet.append('LINK')
                links[(node_lru,target_node)] = links[(node_lru,target_node)] + 1 if (node_lru,target_node) in links else 1
    if verbose:
        print str(len(pages))+" unique pages ; "+str(original_link_number)+" links ; "+str(len(links.values()))+" unique links / identified "+str(len(nodes))+" nodes"
    return (pages, [(source, target, weight) for (source,target),weight in links.iteritems()])

