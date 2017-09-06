import os, sys, json, msgpack
from time import time
from types import GeneratorType
from traph import Traph, TraphException, TraphWriteReport, TraphIteratorState
from twisted.internet import reactor
from twisted.internet.protocol import Factory
from twisted.internet.endpoints import UNIXServerEndpoint
from twisted.protocols.basic import LineOnlyReceiver

class TraphIterator(object):

    def __init__(self, iteratorId, iterator, query):
        self.id = iteratorId
        self.iter = iterator
        self.query = query
        self.n_iterations = 0
        self.iteration_time = 0
        self.total_time = 0

class TraphProtocol(LineOnlyReceiver):

    delimiter = b"\r\n##TxHypheMsgPackDelimiter\r\n"
    MAX_LENGTH = 536870912

    def __init__(self, traph):
        self.traph = traph
        self.iterators = {}

    def connectionMade(self):
        pass

    def connectionLost(self, reason):
        pass

    def returnResult(self, res, query):
        if isinstance(res, TraphWriteReport):
            res = res.__dict__()
        self.sendLine(msgpack.packb({
          "code": "success",
          "result": res,
          "query": query
        }))

    def returnIterator(self, iterator, iteratorState):
        self.sendLine(msgpack.packb({
          "code": "success",
          "iterator": iterator.id,
          "iterations": iterator.n_iterations,
          "atomic_iterations": iteratorState.n_iterations,
          "iteration_time": iterator.iteration_time,
          "query": iterator.query
        }))

    def returnError(self, msg, query):
        self.sendLine(msgpack.packb({
          "code": "fail",
          "message": msg,
          "query": query
        }))

    def iterate(self, iteratorId):
        iterator = self.iterators[iteratorId]
        try:
            start_time = time()
            state = next(iterator.iter)
            iterator.iteration_time = time() - start_time
            iterator.total_time += iterator.iteration_time
            iterator.n_iterations += 1
        except StopIteration:
            del(self.iterators[iteratorId])
            return self.returnError("Tried to iterate on already closed iterative query!", iterator.query)
        if not state.done:
            return self.returnIterator(iterator, state)
        del(self.iterators[iteratorId])
        return self.returnResult(state.result, {"method": iterator.query, "total_time": iterator.total_time})

    def lineReceived(self, query):
        try:
            query = msgpack.unpackb(query)
        except (msgpack.exceptions.ExtraData, msgpack.exceptions.UnpackValueError) as e:
            return self.returnError("Query is not a valid JSON object: %s" % str(e), query)
        try:
            method = query["method"]
            iter_method = "%s_iter" % method
            if hasattr(Traph, iter_method):
                method = iter_method
            args = query["args"]
            kwargs = query["kwargs"]
        except KeyError as e:
            return self.returnError("Argument missing from JSON query: %s" % str(e), query)
        if method == "iterate_previous_query":
            if not args:
                return self.returnError("No iterator id given.", query)
            if args[0] not in self.iterators:
                return self.returnError("No iterator pending with id %s." % args[0], query)
            return self.iterate(args[0])
        try:
            fct = getattr(Traph, method)
        except AttributeError as e:
            return self.returnError("Called non existing Traph method: %s" % str(e), query)
        try:
            res = fct(self.traph, *args, **kwargs)
            if type(res) == GeneratorType:
                iteratorId = id(res)
                self.iterators[iteratorId] = TraphIterator(iteratorId, res, query["method"])
                return self.iterate(iteratorId)
        except TraphException as e:
            return self.returnError("Traph raised: %s" % str(e), query)
        except Exception as e:
            return self.returnError(str(e), query)
        return self.returnResult(res, query["method"])

    def lineLengthExceeded(self, line):
        print >> sys.stderr, "WARNING line length exceeded server side %s (max %s)" % (len(line), self.MAX_LENGTH)


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

    def ready(self):
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
    server_listening_deferred = endpoint.listen(traph)

    @server_listening_deferred.addErrback
    def server_listening_failed(failure):
        print failure.value
        reactor.stop()

    @server_listening_deferred.addCallback
    def server_listen_callback(twisted_port):
        traph.ready()

    reactor.run()
