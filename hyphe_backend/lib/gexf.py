#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Library to write graph data into JSON or GEXF (Gephi Network files)
"""

import urllru
import simplejson as json
import networkx as nx
from networkx.readwrite import json_graph

def write_graph_in_format(graph, filename, fileformat='gexf') :
    if fileformat.lower() == 'json':
        return json.dump(json_graph.node_link_data(graph), open(filename,'w'))
    return nx.write_gexf(graph, filename)

def write_pages_network_from_mongo(pages, filename, fileformat='gexf') :
    G = nx.DiGraph()
    for page in pages :
        if "lrulinks" in page :
            G.add_node(page['lru'], label=page['url'])
            for index,lrulink in enumerate(page["lrulinks"]) :
                G.add_node(lrulink, label=lru.lru_to_url(lrulink))
                G.add_edge(page['lru'], lrulink)
    write_graph_in_format(G, filename, fileformat)

def write_nodelinks_network_from_MS(nodes_links, filename, fileformat='gexf') :
    G = nx.DiGraph()
    for link in nodes_links :
        G.add_node(link.targetLRU, label=lru.lru_to_url(link.targetLRU))
        G.add_node(link.sourceLRU, label=lru.lru_to_url(link.sourceLRU))
        G.add_edge(link.sourceLRU, link.targetLRU, weight=link.weight)
    write_graph_in_format(G, filename, fileformat)

def write_WEs_network_from_MS(WEs_links, WEs_metadata, filename, fileformat='gexf') :
    G = nx.DiGraph()
    for link in WEs_links :
        a = WEs_metadata[link.targetId]
        b = WEs_metadata[link.sourceId]
        G.add_node(link.targetId, label=a['name'], nb_pages=a['nb_pages'], nb_intern_links=a['nb_intern_links'], date=a['date'])
        G.add_node(link.sourceId, label=b['name'], nb_pages=b['nb_pages'], nb_intern_links=b['nb_intern_links'], date=b['date'])
        if link.sourceId != link.targetId :
            G.add_edge(link.sourceId, link.targetId, weight=link.weight)
    write_graph_in_format(G, filename, fileformat)

