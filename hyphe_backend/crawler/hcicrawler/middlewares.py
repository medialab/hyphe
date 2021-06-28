import os
import logging

from scrapy.dupefilters import BaseDupeFilter
from scrapy.utils.request import request_fingerprint
from scrapy.utils.job import job_dir

def use_proxy(request, proxy):
    return proxy and not proxy.startswith(':') and not request.meta['noproxy']

class ProxyMiddleware(object):

    def __init__(self, proxy=None):
        self.proxy = proxy

    @classmethod
    def from_crawler(cls, crawler):
        proxy = crawler.spider.proxy
        return cls(proxy)

    # overwrite process request
    def process_request(self, request, spider):
        if use_proxy(request, self.proxy):
            request.meta['proxy'] = "http://%s/" % self.proxy

class CustomDupeFilter(BaseDupeFilter):
    """Request Fingerprint duplicates filter, handle duplicates only on same proxy"""

    def __init__(self, path=None, proxy=None):
        self.file = None
        self.fingerprints = set()
        self.logdupes = True
        self.proxy = proxy
        if path:
            self.file = open(os.path.join(path, 'requests.seen'), 'a+')
            self.fingerprints.update(x.rstrip() for x in self.file)

    @classmethod
    def from_crawler(cls, crawler):
        settings = crawler.settings
        proxy = crawler.spider.proxy
        return cls(job_dir(settings), proxy)

    def request_seen(self, request):
        fp = request_fingerprint(request)
        if use_proxy(request, self.proxy):
             fp += "/P"
        if fp in self.fingerprints:
            return True
        self.fingerprints.add(fp)
        if self.file:
            self.file.write(fp + os.linesep)

    def close(self, reason):
        if self.file:
            self.file.close()

    def log(self, request, spider):
        if self.logdupes:
            spider.log("Filtered duplicate request: %s - no more duplicates will be shown (see DUPEFILTER_CLASS)" % request, logging.DEBUG)
            self.logdupes = False
