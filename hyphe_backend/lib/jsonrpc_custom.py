# -*- coding: utf-8 -*-

from copy import deepcopy
from json import loads as loadjson
from txjsonrpc import jsonrpclib
from txjsonrpc.web.jsonrpc import *
from twisted.web import server
from twisted.python import log, context
from twisted.internet.defer import maybeDeferred
from hyphe_backend.lib.utils import format_error, lightLogVar

log.discardLogs()

"""
Rewrite JSONRPC class from txjsonrpc/web/jsonrpc.py to add custom logs
and avoid crashes on logging encoded strings

"""

class customJSONRPC(JSONRPC):
    def __init__(self, open_cors=False, debug=0):
        self.open_cors = open_cors
        self.debug = debug
        JSONRPC.__init__(self)

    def safe_log(self, msg, system):
        try:
            log.msg(msg, system=system)
        except:
            try:
                log.msg(msg.decode('utf-8'), system=system)
            except:
                log.msg("Encoding error while logging", system=system)

    def render(self, request):
        if self.open_cors:
            request.setHeader("Access-Control-Allow-Origin", "*")
        from_ip = ""
        if request.getHeader("x-forwarded-for"):
            from_ip = " from %s" % request.getHeader("x-forwarded-for")
        # Unmarshal the JSON-RPC data.
        request.content.seek(0, 0)
        content = request.content.read()
        if not content and request.method == 'GET' and 'request' in request.args:
            content = request.args['request'][0]
        self.callback = request.args['callback'][0] if 'callback' in request.args else None
        self.is_jsonp = True if self.callback else False
        try:
            parsed = jsonrpclib.loads(content)
        except ValueError:
            parsed = {"content": content, "method": None, "params": {}}
        functionPath = parsed.get("method")

        if self.debug:
            parsedcopy = deepcopy(parsed)
            if functionPath in ["start_corpus", "create_corpus"] and len(parsedcopy["params"]) > 1:
                parsedcopy["params"][1] = "********"
            self.safe_log(parsedcopy, "DEBUG - QUERY%s" % from_ip)

        params = parsed.get('params', {})
        args, kwargs = [], {}
        if params.__class__ == list:
            args = params
        else:
            kwargs = params
        id = parsed.get('id')
        token = None
        #if request.requestHeaders.hasHeader(self.auth_token):
        #    token = request.requestHeaders.getRawHeaders(self.auth_token)[0]
        version = parsed.get('jsonrpc')
        if version:
            version = int(float(version))
        elif id and not version:
            version = jsonrpclib.VERSION_1
        else:
            version = jsonrpclib.VERSION_PRE1
        if not functionPath:
            self._cbRender({}, request, id, version)
            return server.NOT_DONE_YET
        try:
            function = self._getFunction(functionPath)
            d = None
            #if hasattr(function, 'requires_auth'):
            #    d = maybeDeferred(self.auth, token, functionPath)
        except (jsonrpclib.Fault, AttributeError) as f:
            self._cbRender(f, request, id, version)
        else:
            if not self.is_jsonp:
                request.setHeader("content-type", "application/json")
            else:
                request.setHeader("content-type", "text/javascript")

            if hasattr(function, 'with_request'):
                args = [request] + args
            elif d:
                d.addCallback(context.call, function, *args, **kwargs)
            else:
                d = maybeDeferred(function, *args, **kwargs)
            d.addErrback(self._ebRender, id)
            d.addCallback(self._cbRender, request, id, version)

            def _responseFailed(err, call):
                call.cancel()
            request.notifyFinish().addErrback(_responseFailed, d)
        return server.NOT_DONE_YET

    def _cbRender(self, result, request, id, version):
        if self.debug == 2:
            request.content.seek(0, 0)
            content = request.content.read()
            if not content and request.method == 'GET' and 'request' in request.args:
                content = request.args['request'][0]
            try:
                parsed = jsonrpclib.loads(content)
                functionPath = parsed.get("method")
            except ValueError:
                functionPath = ""
            try:
                txt = jsonrpclib.dumps(result, id=id, version=2.0)
            except TypeError:
                txt = result
            except AttributeError:
                txt = result.message
            self.safe_log("%s: %s" % (functionPath, lightLogVar(txt, 1000)), "DEBUG - ANSWER")
        return JSONRPC._cbRender(self, result, request, id, version)

