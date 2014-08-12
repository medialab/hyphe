#!/usr/bin/env python
# -*- coding: utf-8 -*-

def urls_match_domainlist(urls, domlist):
    for url in urls:
        url = url.lower()
        if url.find('/', 8) > -1:
            dom = url[:url.find('/', 8)]
        else: dom = url
        for d in domlist:
            if dom.endswith(d.lower()):
                return True
    return False
