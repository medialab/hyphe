MAX_RESPONSE_SIZE = 1048576 # 1Mb

from scrapy.core.downloader.webclient import ScrapyHTTPClientFactory, ScrapyHTTPPageGetter

class LimitSizePageGetter(ScrapyHTTPPageGetter):

    def handleHeader(self, key, value):
        ScrapyHTTPPageGetter.handleHeader(self, key, value)
        if self.factory.method.upper() == 'GET' and key.lower() == 'content-length' and int(value) > MAX_RESPONSE_SIZE:
            self.connectionLost('RESPONSE_TOO_LARGE')


class LimitSizeHTTPClientFactory(ScrapyHTTPClientFactory):

    protocol = LimitSizePageGetter   
