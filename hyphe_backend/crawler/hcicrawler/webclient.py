from scrapy.core.downloader.webclient import ScrapyHTTPClientFactory, ScrapyHTTPPageGetter

from hcicrawler.settings import MAX_RESPONSE_SIZE


class LimitSizePageGetter(ScrapyHTTPPageGetter):

    def handleHeader(self, key, value):
        ScrapyHTTPPageGetter.handleHeader(self, key, value)
        if self.factory.method.upper() == 'GET' and key.lower() == 'content-length' and int(value) > MAX_RESPONSE_SIZE:
            self.connectionLost('response_too_big: %s' % value)


class LimitSizeHTTPClientFactory(ScrapyHTTPClientFactory):

    protocol = LimitSizePageGetter

