import time

from scrapy.spider import BaseSpider
from scrapy.http import Request, HtmlResponse
from scrapy.linkextractor import IGNORED_EXTENSIONS
from scrapy.utils.url import url_has_any_extension
from scrapy.contrib.linkextractors.sgml import SgmlLinkExtractor
from scrapy import log

from hcicrawler.lru import url_to_lru
from hcicrawler.items import Page
from hcicrawler.samples import MONGODB_INPUT
from hcicrawler.errors import error_name

class PagesCrawler(BaseSpider):

    name = 'pages'

    def __init__(self, **kw):
        # TODO: use spider arguments
        super(PagesCrawler, self).__init__(**MONGODB_INPUT)
        self.link_extractor = SgmlLinkExtractor(deny_extensions=[])
        self.ignored_exts = set(['.' + e for e in IGNORED_EXTENSIONS])

    def start_requests(self):
        self.log("Starting crawl task - jobid: %s" % self.crawler.settings['JOBID'])
        for url in self.start_urls:
            yield self._request(url)

    def handle_response(self, response):
        lru = url_to_lru(response.url)
        if isinstance(response, HtmlResponse):
            return self.parse_html(response, lru)
        else:
            return self._make_raw_page(response, lru)

    def handle_error(self, failure):
        p = self._new_page(failure.request.url)
        p['error'] = error_name(failure.value)
        return p

    def parse_html(self, response, lru):
        depth = response.meta['depth']
        lrulinks = []
        for link in self.link_extractor.extract_links(response):
            try:
                lrulink = url_to_lru(link.url)
            except ValueError, e:
                self.log("Error converting URL to LRU: %s" % e, log.ERROR)
                continue
            lrulinks.append(lrulink)
            if self._should_follow(depth, lru, lrulink) and \
                    not url_has_any_extension(link.url, self.ignored_exts):
                yield self._request(link.url)
        yield self._make_html_page(response, lru, lrulinks)

    def _make_html_page(self, response, lru, lrulinks):
        p = self._make_raw_page(response, lru)
        p['body'] = response.body_as_unicode()
        p['lrulinks'] = lrulinks
        return p

    def _make_raw_page(self, response, lru):
        p = self._new_page(response.url, lru)
        p['status'] = response.status
        p['size'] = len(response.body)
        p['encoding'] = response.encoding
        p['depth'] = response.meta['depth']
        p['content_type'] = response.headers.get('content-type').partition(';')[0]
        return p

    def _new_page(self, url, lru=None):
        if lru is None:
            lru = url_to_lru(url)
        p = Page()
        p['url'] = url
        p['lru'] = lru
        p['timestamp'] = int(time.time())
        return p

    def _should_follow(self, depth, lru, lrulink):
        return depth < self.maxdepth \
            and not any((lru.startswith(p) for p in self.discover_prefixes)) \
            and any((lrulink.startswith(p) for p in self.follow_prefixes)) \
            and not any((lrulink.startswith(p) for p in self.discover_prefixes))

    def _request(self, url, **kw):
        kw['meta'] = {'handle_httpstatus_all': True}
        kw['callback'] = self.handle_response
        kw['errback'] = self.handle_error
        return Request(url, **kw)
