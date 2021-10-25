#!/usr/bin/env python
# -*- coding: utf-8 -*-

# REWRITE REGEXP LINK EXTRACTOR FROM SCRAPY FOR BETTER PERFS
# WAS CHANGED:
# - linkre regexp (more generic)
# - clean_link rule to include > in clean
# - urlstext + return (no need for links text in our case)

import re
from six.moves.urllib.parse import urljoin
from w3lib.html import replace_entities, get_base_url

from scrapy.link import Link
from scrapy.utils.response import get_base_url as get_root_url
from scrapy.linkextractors import LinkExtractor

linkre = re.compile(r"<a[^>]*href\s*=\s*(?:&quot;)?(\"[^\">]+[\">]|'[^'>]+['>]|[^\s>]+[\s>])(?:&quot;)?", re.DOTALL | re.IGNORECASE)
re_clean_linkspaces = re.compile(r"^([a-z]+://)\s+")
re_clean_htmlquotes = re.compile(r"&quot;$")

SCHEME_FILTERS = [
    "javascript",
    "mailto",
    "tel",
    "smsto",
    "fb-messenger",
    "whatsapp"
]

def clean_link(link_text):
    """Remove leading and trailing whitespace and punctuation"""
    link_text = link_text.strip("\t\r\n '\">\x0c")
    link_text = re_clean_htmlquotes.sub("", link_text)
    return re_clean_linkspaces.sub(r"\1", link_text)

class RegexpLinkExtractor(LinkExtractor):

    def _extract_links(self, response_body, response_url, response_encoding, base_url=None):
        if base_url is None:
            base_url = get_base_url(response_text, response_url, response_encoding)

        def clean_url(url):
            try:
                return urljoin(base_url, replace_entities(clean_link(url.decode(response_encoding))))
            except ValueError:
                return url

        links_text = linkre.findall(response_body)
        urlstext = set([clean_url(url).encode('utf-8') for url in links_text])

        return [Link(url, "") for url in urlstext if url.split(":")[0].lower() not in SCHEME_FILTERS]

    def extract_links(self, response):
        base_url = get_root_url(response)
        return self._extract_links(response.body, response.url, response.encoding, base_url)
