"""

"""

import sys
sys.path.append('gen-py.twisted')
sys.path.append('../lib')
import lru
from memorystructure import MemoryStructure as ms

# TODO:
# - handle errorcode
# - isFUllPrecision always false at this level?
# - metadataItems -> parsing later ?
def generate_cache_from_pages_list(pageList, precisionLimit = 1, verbose = False) :
    if verbose :
        print "### createCache"
    pages = {}
    links = {}
    original_link_number = 0
    nodes = {}
    for page_item in pageList : 
        page_item["lru"] = lru.cleanLRU(page_item["lru"])
        is_node = lru.isLRUNode(page_item["lru"], precisionLimit)
        node_lru = page_item["lru"] if is_node else lru.getLRUNode(page_item["lru"], precisionLimit)
        nodes[node_lru] = 1
        # Create index of crawled pages from queue
        if page_item["lru"] not in pages:
            pages[page_item["lru"]] = ms.PageItem(str(page_item["_id"]), page_item["url"], page_item["lru"], str(page_item["timestamp"]), int(page_item["status"]), int(page_item["depth"]), str(page_item["error"]), ['CRAWL'], False, is_node, {})
        else:
            if 'CRAWL' not in pages[page_item["lru"]].SourceSet:
                pages[page_item["lru"]].SourceSet.append('CRAWL')
            pages[page_item["lru"]].depth = min(pages[page_item["lru"]].depth, int(page_item["depth"]))
        # Add to index linked pages and index all links between nodes
        if "lrulinks" in page_item:
            for index,lrulink in enumerate(page_item["lrulinks"]) :
                lrulink = lru.cleanLRU(lrulink)
                is_node = lru.isLRUNode(lrulink, precisionLimit)
                target_node = lrulink if is_node else lru.getLRUNode(lrulink, precisionLimit)
                nodes[target_node] = 1
                original_link_number += 1
# check False {} errorcode
                if lrulink not in pages:
                    pages[lrulink] = ms.PageItem(str(page_item["_id"])+"_"+str(index), lru.lru_to_url(lrulink), lrulink, str(page_item["timestamp"]), None, -1, None, ['LINK'], False, is_node, {})
                elif 'LINK' not in pages[lrulink].SourceSet:
                        pages[lrulink].SourceSet.append('LINK')
                links[(node_lru,target_node)] = links[(node_lru,target_node)] + 1 if (node_lru,target_node) in links else 1
    if verbose:
        print str(len(pages))+" unique pages ; "+str(original_link_number)+" links ; "+str(len(links.values()))+" unique links / identified "+str(len(nodes))+" nodes"
    return (pages, [(source, target, weight) for (source,target),weight in links.iteritems()])

