/*
jsonrpcjs-0.1.7

http://github.com/gimmi/jsonrpcjs/

Copyright 2012 Gian Marco Gherardi

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
jsonrpc = {};
jsonrpc.CallStack = function (enterFn, enterScope, exitFn, exitScope) {
	this._counter = 0;
	this._enterFn = enterFn;
	this._exitFn = exitFn;
	this._enterScope = enterScope;
	this._exitScope = exitScope;
};

jsonrpc.CallStack.prototype = {
	enter: function () {
		this._counter = (this._counter < 0 ? 1 : this._counter + 1);
		if (this._counter === 1) {
			this._enterFn.apply(this._enterScope, arguments);
		}
	},

	exit: function (fn) {
		this._counter -= 1;
		if (this._counter === 0) {
			this._exitFn.apply(this._exitScope, arguments);
		}
	}
};

jsonrpc.DelayedTask = function (fn, scope, args) {
	this._fn = fn || function () {};
	this._scope = scope || undefined;
	this._args = args || [];
	this._id = null;
};

jsonrpc.DelayedTask.prototype = {
	delay: function (delay, fn, scope, args) {
		var me = this;

		this._fn = fn || this._fn;
		this._scope = scope || this._scope;
		this._args = args || this._args;
		this.cancel();
		this._id = window.setInterval(function () {
			window.clearInterval(me._id);
			me._id = null;
			me._fn.apply(me._scope, me._args);
		}, delay);
	},

	cancel: function () {
		if (this._id) {
			window.clearInterval(this._id);
			this._id = null;
		}
	}
};
jsonrpc.JsonRpc = function (url) {
	this._url = url;
	this.loading = new jsonrpc.Observable();
	this.loaded = new jsonrpc.Observable();
	this.unhandledFailure = new jsonrpc.Observable();
	this._loadingState = new jsonrpc.CallStack(this.loading.trigger, this.loading, this.loaded.trigger, this.loaded);
	this._requests = [];
	this._batchingMilliseconds = 10;
	this._delayedTask = new jsonrpc.DelayedTask();
};

jsonrpc.JsonRpc.prototype = {
	setBatchingMilliseconds: function (value) {
		this._batchingMilliseconds = value;
	},

	call: function () {
		var args = this._getParams.apply(this, arguments);

		this._loadingState.enter();
		this._requests.push(args);

		if (this._batchingMilliseconds) {
			this._delayedTask.delay(this._batchingMilliseconds, this._sendRequests, this);
		} else {
			this._sendRequests();
		}
	},

	_sendRequests: function () {
		var me = this,
			requests = this._requests,
			data = [],
			i;

		this._requests = [];

		for (i = 0; i < requests.length; i += 1) {
			requests[i].request.id = i;
			data.push(requests[i].request);
		}

		if (data.length === 1) {
			data = data[0];
		}

		me._doJsonPost(me._url, data, function (htmlSuccess, htmlResponse) {
			var responses;
			if (htmlSuccess) {
				responses = (me._isArray(htmlResponse) ? htmlResponse : [htmlResponse]);
			} else {
				responses = [];
				for (i = 0; i < requests.length; i += 1) {
					responses[i] = { id: i, error: { message: htmlResponse } };
				}
			}
			me._handleResponses(requests, responses);
		});
	},

	_handleResponses: function (requests, responses) {
		var i, response, request;
		for (i = 0; i < responses.length; i += 1) {
			response = responses[i];
			request = requests[response.id];
			this._handleResponse(request, response);
		}
	},

	_handleResponse: function (request, response) {
		var success = !response.error,
			ret = (success ? response.result : response.error.message);

		this._loadingState.exit();

		if (success) {
			request.success.call(request.scope, ret);
		} else {
			request.failure.call(request.scope, ret);
		}
		request.callback.call(request.scope, success, ret);
	},

	_getParams: function () {
		var me = this,
			args = Array.prototype.slice.call(arguments),
			ret = {
				request: {
					jsonrpc: '2.0',
					method: args.shift()
				}
			};

		ret.request.params = [];
		while (args.length > 1 && !this._isFunction(args[0])) {
			ret.request.params.push(args.shift());
		}

		if (this._isFunction(args[0])) {
			ret.success = args[0];
			ret.scope = args[1];
		} else {
			ret.success = args[0].success;
			ret.failure = args[0].failure;
			ret.callback = args[0].callback;
			ret.scope = args[0].scope;
		}
		ret.success = ret.success || function () { return; };
		ret.failure = ret.failure || function () { me.unhandledFailure.trigger.apply(me.unhandledFailure, arguments); };
		ret.callback = ret.callback || function () { return; };

		return ret;
	},

	_isArray: function (v) {
		return Object.prototype.toString.apply(v) === '[object Array]';
	},

	_isFunction: function (v) {
		return Object.prototype.toString.apply(v) === '[object Function]';
	},

	_doJsonPost: function (url, data, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.onreadystatechange = function () {
			if (xhr.readyState !== 4) {
				return;
			}

			var contentType = xhr.getResponseHeader('Content-Type');

			if (xhr.status !== 200) {
				callback(false, 'Expected HTTP response "200 OK", found "' + xhr.status + ' ' + xhr.statusText + '"');
			} else if (contentType.indexOf('application/json') !== 0) {
				callback(false, 'Expected JSON encoded response, found "' + contentType + '"');
			} else {
				callback(true, JSON.parse(this.responseText));
			}
		};
		xhr.send(JSON.stringify(data));
	}
};
jsonrpc.Observable = function () {
	this._listeners = [];
};

jsonrpc.Observable.prototype = {
	bind: function (fn, scope) {
		var token = { fn: fn, scope: scope || this };
		this._listeners.push(token);
		return token;
	},

	unbind: function (token) {
		var idx = this._listeners.indexOf(token);
		if (idx !== -1) {
			this._listeners.splice(idx, 1);
		}
	},

	trigger: function () {
		var i;
		for (i = 0; i < this._listeners.length; i += 1) {
			this._listeners[i].fn.apply(this._listeners[i].scope, arguments);
		}
	}
};