import os, sys, json, msgpack
from traph import Traph, TraphWriteReport
from twisted.internet.protocol import Factory, Protocol
from twisted.internet.endpoints import UNIXServerEndpoint
from twisted.internet import reactor

class TraphProtocol(Protocol):

    def __init__(self, traph):
        self.traph = traph

    def connectionMade(self):
        #print "Connection received from client"
        pass

    def returnResult(self, res, query):
        if isinstance(res, TraphWriteReport):
            res = res.__dict__()
        self.transport.writeSequence(msgpack.packb({
          "code": "success",
          "result": res,
          "query": query
        }))

    def returnError(self, msg, query):
        self.transport.writeSequence(msgpack.packb({
          "code": "fail",
          "message": msg,
          "query": query
        }))

    def dataReceived(self, query):
        query = query.strip()
        try:
            query = msgpack.unpackb(query)
        except ValueError as e:
            return self.returnError("Query is not a valid JSON object: %s" % e, query)
        try:
            method = query["method"]
            args = query["args"]
            kwargs = query["kwargs"]
        except KeyError as e:
            return self.returnError("Argument missing from JSON query: %s" % e, query)
        try:
            fct = getattr(Traph, method)
        except AttributeError as e:
            return self.returnError("Called non existing Traph method: %s" % e, query)
        try:
            res = fct(self.traph, *args, **kwargs)
        except AttributeError as e:
            return self.returnError("Traph raised: %s" % e, query)
        except Exception as e:
            return self.returnError(str(e), query)
        return self.returnResult(res, query)


    def connectionLost(self, reason):
        #print "SERVER CLOSED", reason
        pass


class TraphServerFactory(Factory):

    traph_dir = "traph-data"
    default_WECR = '(s:[a-zA-Z]+\\|(t:[0-9]+\\|)?(h:[^\\|]+\\|(h:[^\\|]+\\|)|h:(localhost|(\\d{1,3}\\.){3}\\d{1,3}|\\[[\\da-f]*:[\\da-f:]*\\])\\|))'
    WECRs = {
      's:http|h:com|h:world|': '(s:[a-zA-Z]+\\|(t:[0-9]+\\|)?(h:[^\\|]+\\|(h:[^\\|]+\\|)+|h:(localhost|(\\d{1,3}\\.){3}\\d{1,3}|\\[[\\da-f]*:[\\da-f:]*\\])\\|)(p:[^\\|]+\\|){1})'
    }

    def __init__(self, corpus, default_WECR=None, WECRs=None):
        self.corpus = corpus
        self.traph = Traph(
          folder=os.path.join(self.traph_dir, corpus),
          default_webentity_creation_rule=default_WECR or self.default_WECR,
          webentity_creation_rules=WECRs or self.WECRs
        )
        # stdin message received by childprocess to know when traph is ready
        print "READY"

    def buildProtocol(self, addr):
        return TraphProtocol(self.traph)

    def close(self):
        self.traph.close()

if __name__ == "__main__":
    sock = sys.argv[1]
    corpus = sys.argv[2]
    try:
        with open(sock+"-options.json") as f:
            options = json.load(f)
    except:
        options = {}
    traph = TraphServerFactory(corpus, **options)
    endpoint = UNIXServerEndpoint(reactor, sock)
    endpoint.listen(traph)
    reactor.run()
