#!/usr/bin/env python
# -*- coding: utf-8 -*-

# REWRITE REGEXP LINK EXTRACTOR FROM SCRAPY FOR BETTER PERFS
# WAS CHANGED:
# - linkre regexp (more generic)
# - clean_link rule to include > in clean
# - urlstext + return (no need for links text in our case)

import re
from urlparse import urljoin
from w3lib.html import remove_entities

from scrapy.link import Link
from scrapy.utils.response import get_base_url
from scrapy.linkextractors import LinkExtractor

linkre = re.compile(r"<a[^>]*href\s*=\s*(\"[^\">]+[\">]|'[^'>]+['>]|[^\s>]+[\s>])", re.DOTALL | re.IGNORECASE)
re_clean_linkspaces = re.compile(r"^([a-z]+://)\s+")

SCHEME_FILTERS = [
    "javascript",
    "mailto",
    "tel"
]

def clean_link(link_text):
    """Remove leading and trailing whitespace and punctuation"""
    link_text = link_text.strip("\t\r\n '\">")
    return re_clean_linkspaces.sub(r"\1", link_text)

class RegexpLinkExtractor(LinkExtractor):

    def _extract_links(self, response_body, response_url, response_encoding, base_url=None):
        if base_url is None:
            base_url = urljoin(response_url, self.base_url) if self.base_url else response_url

        clean_url = lambda u: urljoin(base_url, remove_entities(clean_link(u.decode(response_encoding))))

        links_text = linkre.findall(response_body)
        urlstext = set([clean_url(url).encode('utf-8') for url in links_text])

        return [Link(url, "") for url in urlstext if url.split(":")[0].lower() not in SCHEME_FILTERS]

    def extract_links(self, response):
        base_url = get_base_url(response)
        return self._extract_links(response.body, response.url, response.encoding, base_url)
