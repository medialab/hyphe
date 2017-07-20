import os, sys, json
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
        print res
        if isinstance(res, TraphWriteReport):
            res = res.__dict__()
        self.transport.writeSequence(json.dumps({
          "status": "OK",
          "result": res,
          "query": query
        }))

    def returnError(self, msg, err, query):
        self.transport.writeSequence(json.dumps({
          "status": "fail",
          "message": msg,
          "error": str(err),
          "query": query
        }))

    def dataReceived(self, query):
        query = query.strip()
        try:
            data = json.loads(query)
        except ValueError as e:
            return self.returnError("Query is not a valid JSON object", e, query)
        try:
            method = data["method"]
            args = data["args"]
            kwargs = data["kwargs"]
        except KeyError as e:
            return self.returnError("Argument missing from JSON query", e, data)
        try:
            fct = getattr(Traph, method)
        except AttributeError as e:
            return self.returnError("Called non existing Traph method %s" % method, e, data)
        try:
            res = fct(self.traph, *args, **kwargs)
        except AttributeError as e:
            return self.returnError("Badly called Traph method %s" % method, e, data)
        return self.returnResult(res, query)


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
          folder=os.path.join(self.traph_dir, corpus),
          default_webentity_creation_rule=default_WECR or self.default_WECR,
          webentity_creation_rules=WECRs or self.WECRs,
          # TODO remove for prod when clear functional
          overwrite=True
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
        options = json.loads(sys.argv[3])
    except:
        options = {}
        pass
    traph = TraphFactory(corpus, **options)
    endpoint = UNIXServerEndpoint(reactor, sock)
    endpoint.listen(traph)
    reactor.run()
