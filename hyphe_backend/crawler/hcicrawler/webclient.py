MAX_RESPONSE_SIZE = 1048576 # 1Mb

from OpenSSL import SSL
from twisted.internet.ssl import ClientContextFactory
from twisted.internet._sslverify import ClientTLSOptions
from scrapy.core.downloader.contextfactory import ScrapyClientContextFactory
from scrapy.core.downloader.webclient import ScrapyHTTPClientFactory, ScrapyHTTPPageGetter

class LimitSizePageGetter(ScrapyHTTPPageGetter):

    def handleHeader(self, key, value):
        ScrapyHTTPPageGetter.handleHeader(self, key, value)
        if self.factory.method.upper() == 'GET' and key.lower() == 'content-length' and int(value) > MAX_RESPONSE_SIZE:
            self.connectionLost('response_too_big: %s' % value)


class LimitSizeHTTPClientFactory(ScrapyHTTPClientFactory):

    protocol = LimitSizePageGetter


class CustomSSLContextFactory(ScrapyClientContextFactory):

    def getContext(self, hostname=None, port=None):
        ctx = ClientContextFactory.getContext(self)
        ctx.set_options(SSL.OP_ALL)
        if hostname:
            ClientTLSOptions(hostname, ctx)
        return ctx
