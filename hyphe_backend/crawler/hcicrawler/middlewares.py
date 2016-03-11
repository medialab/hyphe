import os
from hcicrawler.settings import PROXY
try:
    from scrapy.dupefilters import BaseDupeFilter
except:
    from scrapy.dupefilter import BaseDupeFilter
from scrapy.utils.request import request_fingerprint
from scrapy.utils.job import job_dir
from scrapy import log

def use_proxy(request):
    return PROXY != "" and not PROXY.startswith(':') and not request.meta['noproxy']

class ProxyMiddleware(object):
    # overwrite process request
    def process_request(self, request, spider):
        if use_proxy(request):
            request.meta['proxy'] = "http://%s/" % PROXY

class CustomDupeFilter(BaseDupeFilter):
    """Request Fingerprint duplicates filter, handle duplicates only on same proxy"""

    def __init__(self, path=None):
        self.file = None
        self.fingerprints = set()
        self.logdupes = True
        if path:
            self.file = open(os.path.join(path, 'requests.seen'), 'a+')
            self.fingerprints.update(x.rstrip() for x in self.file)

    @classmethod
    def from_settings(cls, settings):
        return cls(job_dir(settings))

    def request_seen(self, request):
        fp = request_fingerprint(request)
        if use_proxy(request):
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
            fmt = "Filtered duplicate request: %(request)s - no more duplicates will be shown (see DUPEFILTER_CLASS)"
            log.msg(format=fmt, request=request, level=log.DEBUG, spider=spider)
            self.logdupes = False
