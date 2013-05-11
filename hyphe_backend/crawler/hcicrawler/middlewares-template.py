
class ProxyMiddleware(object):
    # overwrite process request
    def process_request(self, request, spider):
        if "{{host}}" != "":
            request.meta['proxy'] = "http://{{host}}:{{port}}/"
