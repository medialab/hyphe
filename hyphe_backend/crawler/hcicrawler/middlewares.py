from hcicrawler.settings import PROXY

class ProxyMiddleware(object):
    # overwrite process request
    def process_request(self, request, spider):
        if PROXY != "" and not PROXY.startswith(':'):
            request.meta['proxy'] = "http://%s/" % PROXY
