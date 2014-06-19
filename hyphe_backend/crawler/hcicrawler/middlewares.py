from hcicrawler.settings import PROXY

class ProxyMiddleware(object):
    # overwrite process request
    def process_request(self, request, spider):
        if PROXY != "":
            request.meta['proxy'] = "http://%s/" % PROXY
