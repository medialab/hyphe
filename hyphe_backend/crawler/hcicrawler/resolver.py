# -*- coding: utf-8 -*-

from twisted.internet import reactor, defer
from twisted.internet.endpoints import TCP4ClientEndpoint
from twisted.web.client import Agent, ProxyAgent, RedirectAgent, _HTTP11ClientFactory
_HTTP11ClientFactory.noisy = False

class ResolverAgent(RedirectAgent):

    def __init__(self, redirectLimit=5, connectTimeout=30, proxy=None):
        self.lastURI = None
        if proxy:
            try:
                endpoint = TCP4ClientEndpoint(reactor, proxy["host"], proxy["port"], timeout=connectTimeout)
            except:
                raise TypeError("ResolverAgent's proxy argument need to be a dict with fields host and port")
            agent = ProxyAgent(endpoint)
        else:
            agent = Agent(reactor, connectTimeout=connectTimeout)
        RedirectAgent.__init__(self, agent, redirectLimit=redirectLimit)

    @defer.inlineCallbacks
    def resolve(self, url):
        self.lastURI = url
        yield self.request('HEAD', url)
        defer.returnValue(self.lastURI)

    def _handleRedirect(self, response, method, uri, headers, redirectCount):

        if redirectCount >= self._redirectLimit:
            # Infinite redirection detected, keep lastURI
            return response

        locationHeaders = response.headers.getRawHeaders('location', [])
        if not locationHeaders:
            err = error.RedirectWithNoLocation(
                response.code, 'No location header field', uri)
            raise ResponseFailed([failure.Failure(err)], response)
        newURI = locationHeaders[0].lstrip('/')

        # Handle relative redirects
        urlstart = self.lastURI[:self.lastURI.rfind('/')]
        if newURI.startswith('./'):
            newURI = "%s/%s" % (urlstart, newURI[2:])
        elif newURI.startswith('../'):
            while newURI.startswith('../'):
                urlstart = urlstart[:urlstart.rfind('/')]
                newURI = newURI[3:]
            newURI = "%s/%s" % (urlstart, newURI)
        elif not newURI.startswith('http'):
            try:
                host = self.lastURI[:(self.lastURI+"/").index('/', 8)]
            except:
                host = "http:/"
            newURI = "%s/%s" % (host, newURI)
        self.lastURI = newURI
        deferred = self._agent.request(method, self.lastURI, headers)
        return deferred.addCallback(self._handleResponse, method, uri, headers, redirectCount + 1)

