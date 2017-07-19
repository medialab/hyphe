import os, sys, json
from traph import Traph
from twisted.internet.protocol import Factory, Protocol
from twisted.internet.endpoints import UNIXServerEndpoint
from twisted.internet import reactor

class TraphProtocol(Protocol):

    def __init__(self, traph):
        self.traph = traph

    def connectionMade(self):
        #print "Connection received from client"
        pass

    def dataReceived(self, data):
        data = data.strip()
        #print "SERVER RECEIVED:", data
        try:
            msg = json.loads(data)
            method = msg["method"]
            args = msg["args"]
            kwargs = msg["kwargs"]
            self.transport.writeSequence(json.dumps({
                "result": "OK",
                "query": msg
            }))
        except ValueError as e:
            #print >> sys.stderr, "ERROR received non json data", data
            self.transport.writeSequence(json.dumps({
                "result": "fail",
                "message": "Query is not a valid JSON object",
                "error": e,
                "query": data
            }))
            return

    def connectionLost(self, reason):
        #print "SERVER CLOSED", reason
        pass


class TraphFactory(Factory):

    traph_dir = "traph-data"
    default_WECR = '(s:[a-zA-Z]+\\|(t:[0-9]+\\|)?(h:[^\\|]+\\|(h:[^\\|]+\\|)|h:(localhost|(\\d{1,3}\\.){3}\\d{1,3}|\\[[\\da-f]*:[\\da-f:]*\\])\\|))'
    WECRs = {
      's:http|h:com|h:world|': '(s:[a-zA-Z]+\\|(t:[0-9]+\\|)?(h:[^\\|]+\\|(h:[^\\|]+\\|)+|h:(localhost|(\\d{1,3}\\.){3}\\d{1,3}|\\[[\\da-f]*:[\\da-f:]*\\])\\|)(p:[^\\|]+\\|){1})'
    }

    def __init__(self, corpus, default_WECR=None, WECRs=None):
        self.corpus = corpus
        self.traph = Traph(
            folder=os.path.join(self.traph_dir, corpus) + "/",
            default_webentity_creation_rule=default_WECR or self.default_WECR,
            webentity_creation_rules=WECRs or self.WECRs
        )
        print "READY"

    def buildProtocol(self, addr):
        return TraphProtocol(traph)

    def close(self):
        self.traph.close()

if __name__ == "__main__":
    sock = sys.argv[1]
    corpus = sys.argv[2]
    traph = TraphFactory(corpus)
    endpoint = UNIXServerEndpoint(reactor, sock)
    endpoint.listen(traph)
    reactor.run()
