#!/usr/bin/env python
# -*- coding: utf-8 -*-
# REWRITE REGEXP LINK EXTRACTOR FROM SCRAPY FOR BETTER PERFS
# WAS CHANGED:
# - linkre regexp (more generic)
# - clean_link rule to include > in clean
# - urlstext + return (no need for links text in our case)

import re
from urlparse import urljoin

from w3lib.html import remove_tags, remove_entities, replace_escape_chars

from scrapy.link import Link
from scrapy.contrib.linkextractors.sgml import SgmlLinkExtractor

linkre = re.compile(r"href=(\"[^\">]+[\">]|'[^'>]+['>]|[^\s>]+[\s>])", re.DOTALL | re.IGNORECASE)

def clean_link(link_text):
    """Remove leading and trailing whitespace and punctuation"""
    return link_text.strip("\t\r\n '\">")

class RegexpLinkExtractor(SgmlLinkExtractor):
    """High performant link extractor"""

    def _extract_links(self, response_text, response_url, response_encoding, base_url=None):
        if base_url is None:
            base_url = urljoin(response_url, self.base_url) if self.base_url else response_url

        clean_url = lambda u: urljoin(base_url, remove_entities(clean_link(u.decode(response_encoding))))
        clean_text = lambda t: replace_escape_chars(remove_tags(t.decode(response_encoding))).strip()

        links_text = linkre.findall(response_text)
        urlstext = set([clean_url(url) for url in links_text])

        return [Link(url, "") for url in urlstext]
