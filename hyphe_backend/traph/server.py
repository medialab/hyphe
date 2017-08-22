import os, sys, json, msgpack
from traph import Traph, TraphException, TraphWriteReport
from twisted.internet import reactor
from twisted.internet.protocol import Factory
from twisted.internet.endpoints import UNIXServerEndpoint
from twisted.protocols.basic import LineOnlyReceiver


class TraphProtocol(LineOnlyReceiver):

    delimiter = b"\r\n##TxHypheMsgPackDelimiter\r\n"
    MAX_LENGTH = 536870912

    def __init__(self, traph):
        self.traph = traph

    def connectionMade(self):
        pass

    def returnResult(self, res, query):
        if isinstance(res, TraphWriteReport):
            res = res.__dict__()
        self.sendLine(msgpack.packb({
          "code": "success",
          "result": res,
          "query": query
        }))

    def returnError(self, msg, query):
        self.sendLine(msgpack.packb({
          "code": "fail",
          "message": msg,
          "query": query
        }))

    def lineLengthExceeded(self, line):
        print >> sys.stderr, "WARNING line length exceeded server side %s (max %s)" % (len(line), self.MAX_LENGTH)

    def lineReceived(self, query):
        try:
            query = msgpack.unpackb(query)
        except (msgpack.exceptions.ExtraData, msgpack.exceptions.UnpackValueError) as e:
            return self.returnError("Query is not a valid JSON object: %s" % str(e), query)
        try:
            method = query["method"]
            args = query["args"]
            kwargs = query["kwargs"]
        except KeyError as e:
            return self.returnError("Argument missing from JSON query: %s" % str(e), query)
        try:
            fct = getattr(Traph, method)
        except AttributeError as e:
            return self.returnError("Called non existing Traph method: %s" % str(e), query)
        try:
            res = fct(self.traph, *args, **kwargs)
        except TraphException as e:
            return self.returnError("Traph raised: %s" % str(e), query)
        except Exception as e:
            return self.returnError(str(e), query)
        return self.returnResult(res, query)


    def connectionLost(self, reason):
        pass


class TraphServerFactory(Factory):

    default_WECR = '(s:[a-zA-Z]+\\|(t:[0-9]+\\|)?(h:[^\\|]+\\|(h:[^\\|]+\\|)|h:(localhost|(\\d{1,3}\\.){3}\\d{1,3}|\\[[\\da-f]*:[\\da-f:]*\\])\\|))'
    WECRs = {
      's:http|h:com|h:world|': '(s:[a-zA-Z]+\\|(t:[0-9]+\\|)?(h:[^\\|]+\\|(h:[^\\|]+\\|)+|h:(localhost|(\\d{1,3}\\.){3}\\d{1,3}|\\[[\\da-f]*:[\\da-f:]*\\])\\|)(p:[^\\|]+\\|){1})'
    }

    def __init__(self, corpus, traph_dir="traph-data", default_WECR=None, WECRs=None):
        self.traph_dir = traph_dir
        self.corpus = corpus
        if not os.path.isdir(self.traph_dir):
            os.makedirs(self.traph_dir)
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
