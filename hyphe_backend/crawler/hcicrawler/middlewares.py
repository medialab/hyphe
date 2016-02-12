from hcicrawler.settings import PROXY
from scrapy.dupefilter import BaseDupeFilter

def use_proxy(request):
    return PROXY != "" and not PROXY.startswith(':') and not request.meta['noproxy']

class ProxyMiddleware(object):
    # overwrite process request
    def process_request(self, request, spider):
        if use_proxy(request):
            request.meta['proxy'] = "http://%s/" % PROXY

class CustomDupeFilter(BaseDupeFilter):
    """Handle duplicates only on same proxy"""

    def request_fingerprint(self, request):
        fp = request_fingerprint(request)
        if use_proxy():
             fp += "/P"
        return fp
