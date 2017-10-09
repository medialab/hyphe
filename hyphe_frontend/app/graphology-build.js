/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 38);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var freeGlobal = __webpack_require__(23);

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Graphology Custom Errors
 * =========================
 *
 * Defining custom errors for ease of use & easy unit tests across
 * implementations (normalized typology rather than relying on error
 * messages to check whether the correct error was found).
 */
var GraphError = exports.GraphError = function (_Error) {
  _inherits(GraphError, _Error);

  function GraphError(message, data) {
    _classCallCheck(this, GraphError);

    var _this = _possibleConstructorReturn(this, _Error.call(this));

    _this.name = 'GraphError';
    _this.message = message || '';
    _this.data = data || {};
    return _this;
  }

  return GraphError;
}(Error);

var InvalidArgumentsGraphError = exports.InvalidArgumentsGraphError = function (_GraphError) {
  _inherits(InvalidArgumentsGraphError, _GraphError);

  function InvalidArgumentsGraphError(message, data) {
    _classCallCheck(this, InvalidArgumentsGraphError);

    var _this2 = _possibleConstructorReturn(this, _GraphError.call(this, message, data));

    _this2.name = 'InvalidArgumentsGraphError';

    // This is V8 specific to enhance stack readability
    if (typeof Error.captureStackTrace === 'function') Error.captureStackTrace(_this2, InvalidArgumentsGraphError.prototype.constructor);
    return _this2;
  }

  return InvalidArgumentsGraphError;
}(GraphError);

var NotFoundGraphError = exports.NotFoundGraphError = function (_GraphError2) {
  _inherits(NotFoundGraphError, _GraphError2);

  function NotFoundGraphError(message, data) {
    _classCallCheck(this, NotFoundGraphError);

    var _this3 = _possibleConstructorReturn(this, _GraphError2.call(this, message, data));

    _this3.name = 'NotFoundGraphError';

    // This is V8 specific to enhance stack readability
    if (typeof Error.captureStackTrace === 'function') Error.captureStackTrace(_this3, NotFoundGraphError.prototype.constructor);
    return _this3;
  }

  return NotFoundGraphError;
}(GraphError);

var UsageGraphError = exports.UsageGraphError = function (_GraphError3) {
  _inherits(UsageGraphError, _GraphError3);

  function UsageGraphError(message, data) {
    _classCallCheck(this, UsageGraphError);

    var _this4 = _possibleConstructorReturn(this, _GraphError3.call(this, message, data));

    _this4.name = 'UsageGraphError';

    // This is V8 specific to enhance stack readability
    if (typeof Error.captureStackTrace === 'function') Error.captureStackTrace(_this4, UsageGraphError.prototype.constructor);
    return _this4;
  }

  return UsageGraphError;
}(GraphError);

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

var Symbol = __webpack_require__(22),
    getRawTag = __webpack_require__(47),
    objectToString = __webpack_require__(48);

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var listCacheClear = __webpack_require__(56),
    listCacheDelete = __webpack_require__(57),
    listCacheGet = __webpack_require__(58),
    listCacheHas = __webpack_require__(59),
    listCacheSet = __webpack_require__(60);

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

module.exports = ListCache;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var eq = __webpack_require__(7);

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

module.exports = assocIndexOf;


/***/ }),
/* 7 */
/***/ (function(module, exports) {

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

module.exports = eq;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var getNative = __webpack_require__(11);

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var isKeyable = __webpack_require__(75);

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

module.exports = getMapData;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.assign = assign;
exports.getMatchingEdge = getMatchingEdge;
exports.isBunch = isBunch;
exports.isGraph = isGraph;
exports.isPlainObject = isPlainObject;
exports.overBunch = overBunch;
exports.prettyPrint = prettyPrint;
exports.privateProperty = privateProperty;
exports.readOnlyProperty = readOnlyProperty;
exports.incrementalId = incrementalId;
/**
 * Graphology Utilities
 * =====================
 *
 * Collection of helpful functions used by the implementation.
 */

/**
 * Very simple Object.assign-like function.
 *
 * @param  {object} target       - First object.
 * @param  {object} [...objects] - Objects to merge.
 * @return {object}
 */
function assign() {
  var target = arguments[0] || {};

  for (var i = 1, l = arguments.length; i < l; i++) {
    if (!arguments[i]) continue;

    for (var k in arguments[i]) {
      target[k] = arguments[i][k];
    }
  }

  return target;
}

/**
 * Function returning the first matching edge for given path.
 * Note: this function does not check the existence of source & target. This
 * must be performed by the caller.
 *
 * @param  {Graph}  graph  - Target graph.
 * @param  {any}    source - Source node.
 * @param  {any}    target - Target node.
 * @param  {string} type   - Type of the edge (mixed, directed or undirected).
 * @return {string|null}
 */
function getMatchingEdge(graph, source, target, type) {
  var sourceData = graph._nodes.get(source);

  var edge = null;

  if (type === 'mixed') {
    edge = sourceData.out && sourceData.out[target] || sourceData.undirected && sourceData.undirected[target];
  } else if (type === 'directed') {
    edge = sourceData.out && sourceData.out[target];
  } else {
    edge = sourceData.undirected && sourceData.undirected[target];
  }

  return edge;
}

/**
 * Checks whether the given value is a potential bunch.
 *
 * @param  {mixed}   value - Target value.
 * @return {boolean}
 */
function isBunch(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && (Array.isArray(value) || typeof Map === 'function' && value instanceof Map || typeof Set === 'function' && value instanceof Set || !(value instanceof Date) && !(value instanceof RegExp));
}

/**
 * Checks whether the given value is a Graph implementation instance.
 *
 * @param  {mixed}   value - Target value.
 * @return {boolean}
 */
function isGraph(value) {
  return value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && typeof value.addUndirectedEdgeWithKey === 'function' && typeof value.dropNode === 'function';
}

/**
 * Checks whether the given value is a plain object.
 *
 * @param  {mixed}   value - Target value.
 * @return {boolean}
 */
function isPlainObject(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value !== null && value.constructor === Object;
}

/**
 * Iterates over the provided bunch.
 *
 * @param {object}   bunch    - Target bunch.
 * @param {function} callback - Function to call.
 */
function overBunch(bunch, callback) {

  // Array iteration
  if (Array.isArray(bunch)) {
    for (var i = 0, l = bunch.length; i < l; i++) {
      callback(bunch[i], null);
    }
  }

  // Map & Set iteration
  else if (typeof bunch.forEach === 'function') {
      var iterator = bunch.entries();

      var step = void 0;

      while (step = iterator.next()) {
        var _step = step,
            value = _step.value,
            done = _step.done;


        if (done) break;

        var k = value[0],
            v = value[1];


        if (v === k) callback(v, null);else callback(k, v);
      }
    }

    // Plain object iteration
    else {
        for (var key in bunch) {
          var attributes = bunch[key];

          callback(key, attributes);
        }
      }
}

/**
 * Pretty prints the given integer.
 *
 * @param  {number}  integer - Target integer.
 * @return {string}          - The pretty string.
 */
function prettyPrint(integer) {
  var string = '' + integer;

  var prettyString = '';

  for (var i = 0, l = string.length; i < l; i++) {
    var j = l - i - 1;

    prettyString = string[j] + prettyString;

    if (!((i - 2) % 3) && i !== l - 1) prettyString = ',' + prettyString;
  }

  return prettyString;
}

/**
 * Creates a "private" property for the given member name by concealing it
 * using the `enumerable` option.
 *
 * @param {object} target - Target object.
 * @param {string} name   - Member name.
 */
function privateProperty(target, name, value) {
  Object.defineProperty(target, name, {
    enumerable: false,
    configurable: false,
    writable: true,
    value: value
  });
}

/**
 * Creates a read-only property for the given member name & the given getter.
 *
 * @param {object}   target - Target object.
 * @param {string}   name   - Member name.
 * @param {mixed}    value  - The attached getter or fixed value.
 */
function readOnlyProperty(target, name, value) {
  var descriptor = {
    enumerable: true,
    configurable: true
  };

  if (typeof value === 'function') {
    descriptor.get = value;
  } else {
    descriptor.value = value;
    descriptor.writable = false;
  }

  Object.defineProperty(target, name, descriptor);
}

/**
 * Creates a function generating incremental ids for edges.
 *
 * @return {function}
 */
function incrementalId() {
  var i = 0;

  return function () {
    return '_geid' + i++ + '_';
  };
}

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

var baseIsNative = __webpack_require__(45),
    getValue = __webpack_require__(52);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

var baseGetTag = __webpack_require__(4),
    isObject = __webpack_require__(0);

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

var defineProperty = __webpack_require__(21);

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

module.exports = baseAssignValue;


/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

var isFunction = __webpack_require__(12),
    isLength = __webpack_require__(31);

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

module.exports = isArrayLike;


/***/ }),
/* 16 */
/***/ (function(module, exports) {

/**
 * Obliterator Consume Function
 * =============================
 *
 * Function consuming the given iterator into an array.
 */

/**
 * Consume.
 *
 * @param  {Iterator} iterator - Target iterator.
 * @param  {number}   [size]   - Optional size.
 * @return {array}
 */
module.exports = function consume(iterator, size) {
  var array = arguments.length > 1 ? new Array(size) : [],
      step,
      i = 0;

  while ((step = iterator.next(), !step.done))
    array[i++] = step.value;

  return array;
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MixedNodeData = MixedNodeData;
exports.DirectedNodeData = DirectedNodeData;
exports.UndirectedNodeData = UndirectedNodeData;
exports.DirectedEdgeData = DirectedEdgeData;
exports.UndirectedEdgeData = UndirectedEdgeData;
/**
 * Graphology Internal Data Classes
 * =================================
 *
 * Internal classes hopefully reduced to structs by engines & storing
 * necessary information for nodes & edges.
 *
 * Note that those classes don't rely on the `class` keyword to avoid some
 * cruft introduced by most of ES2015 transpilers.
 */

/**
 * MixedNodeData class.
 *
 * @constructor
 * @param {object} attributes - Node's attributes.
 */
function MixedNodeData(attributes) {

  // Attributes
  this.attributes = attributes;

  // Degrees
  this.inDegree = 0;
  this.outDegree = 0;
  this.undirectedDegree = 0;
  this.directedSelfLoops = 0;
  this.undirectedSelfLoops = 0;

  // Indices
  this.in = {};
  this.out = {};
  this.undirected = {};
}

/**
 * DirectedNodeData class.
 *
 * @constructor
 * @param {object} attributes - Node's attributes.
 */
function DirectedNodeData(attributes) {

  // Attributes
  this.attributes = attributes || {};

  // Degrees
  this.inDegree = 0;
  this.outDegree = 0;
  this.directedSelfLoops = 0;

  // Indices
  this.in = {};
  this.out = {};
}

DirectedNodeData.prototype.upgradeToMixed = function () {

  // Degrees
  this.undirectedDegree = 0;
  this.undirectedSelfLoops = 0;

  // Indices
  this.undirected = {};
};

/**
 * UndirectedNodeData class.
 *
 * @constructor
 * @param {object} attributes - Node's attributes.
 */
function UndirectedNodeData(attributes) {

  // Attributes
  this.attributes = attributes || {};

  // Degrees
  this.undirectedDegree = 0;
  this.undirectedSelfLoops = 0;

  // Indices
  this.undirected = {};
}

UndirectedNodeData.prototype.upgradeToMixed = function () {

  // Degrees
  this.inDegree = 0;
  this.outDegree = 0;
  this.directedSelfLoops = 0;

  // Indices
  this.in = {};
  this.out = {};
};

/**
 * DirectedEdgeData class.
 *
 * @constructor
 * @param {boolean} generatedKey - Was its key generated?
 * @param {string}  source       - Source of the edge.
 * @param {string}  target       - Target of the edge.
 * @param {object}  attributes   - Edge's attributes.
 */
function DirectedEdgeData(generatedKey, source, target, attributes) {

  // Attributes
  this.attributes = attributes;

  // Extremities
  this.source = source;
  this.target = target;

  // Was its key generated?
  this.generatedKey = generatedKey;
}

/**
 * UndirectedEdgeData class.
 *
 * @constructor
 * @param {boolean} generatedKey - Was its key generated?
 * @param {string}  source       - Source of the edge.
 * @param {string}  target       - Target of the edge.
 * @param {object}  attributes   - Edge's attributes.
 */
function UndirectedEdgeData(generatedKey, source, target, attributes) {

  // Attributes
  this.attributes = attributes;

  // Extremities
  this.source = source;
  this.target = target;

  // Was its key generated?
  this.generatedKey = generatedKey;
}

/***/ }),
/* 18 */
/***/ (function(module, exports) {

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

module.exports = apply;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

var identity = __webpack_require__(20),
    overRest = __webpack_require__(41),
    setToString = __webpack_require__(42);

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return setToString(overRest(func, start, identity), func + '');
}

module.exports = baseRest;


/***/ }),
/* 20 */
/***/ (function(module, exports) {

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

var getNative = __webpack_require__(11);

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

module.exports = defineProperty;


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

var root = __webpack_require__(1);

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(46)))

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

var Stack = __webpack_require__(55),
    assignMergeValue = __webpack_require__(26),
    baseFor = __webpack_require__(79),
    baseMergeDeep = __webpack_require__(81),
    isObject = __webpack_require__(0),
    keysIn = __webpack_require__(34);

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  baseFor(source, function(srcValue, key) {
    if (isObject(srcValue)) {
      stack || (stack = new Stack);
      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    }
    else {
      var newValue = customizer
        ? customizer(object[key], srcValue, (key + ''), object, source, stack)
        : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      assignMergeValue(object, key, newValue);
    }
  }, keysIn);
}

module.exports = baseMerge;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var getNative = __webpack_require__(11),
    root = __webpack_require__(1);

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var baseAssignValue = __webpack_require__(13),
    eq = __webpack_require__(7);

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if ((value !== undefined && !eq(object[key], value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

module.exports = assignMergeValue;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

var overArg = __webpack_require__(89);

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;


/***/ }),
/* 28 */
/***/ (function(module, exports) {

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

module.exports = isPrototype;


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

var baseIsArguments = __webpack_require__(90),
    isObjectLike = __webpack_require__(2);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

module.exports = isArguments;


/***/ }),
/* 30 */
/***/ (function(module, exports) {

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;


/***/ }),
/* 31 */
/***/ (function(module, exports) {

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {var root = __webpack_require__(1),
    stubFalse = __webpack_require__(92);

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

module.exports = isBuffer;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

var baseIsTypedArray = __webpack_require__(94),
    baseUnary = __webpack_require__(95),
    nodeUtil = __webpack_require__(96);

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

module.exports = isTypedArray;


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

var arrayLikeKeys = __webpack_require__(100),
    baseKeysIn = __webpack_require__(102),
    isArrayLike = __webpack_require__(15);

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

module.exports = keysIn;


/***/ }),
/* 35 */
/***/ (function(module, exports) {

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

module.exports = isIndex;


/***/ }),
/* 36 */
/***/ (function(module, exports) {

/**
 * Graphology isGraph
 * ===================
 *
 * Very simple function aiming at ensuring the given variable is a
 * graphology instance.
 */

/**
 * Checking the value is a graphology instance.
 *
 * @param  {any}     value - Target value.
 * @return {boolean}
 */
module.exports = function isGraph(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.addUndirectedEdgeWithKey === 'function' &&
    typeof value.dropNodes === 'function' &&
    typeof value.multi === 'boolean'
  );
};


/***/ }),
/* 37 */
/***/ (function(module, exports) {

/**
 * Obliterator Iterator Class
 * ===========================
 *
 * Simple class representing the library's iterators.
 */

/**
 * Iterator class.
 *
 * @constructor
 * @param {function} next - Next function.
 */
function Iterator(next) {

  // Hiding the given function
  Object.defineProperty(this, '_next', {
    writable: false,
    enumerable: false,
    value: next
  });

  // Is the iterator complete?
  this.done = false;
}

/**
 * Next function.
 *
 * @return {object}
 */
Iterator.prototype.next = function() {
  if (this.done)
    return {done: true};

  var step = this._next();

  if (step.done)
    this.done = true;

  return step;
};

/**
 * If symbols are supported, we add `next` to `Symbol.iterator`.
 */
if (typeof Symbol !== 'undefined')
  Iterator.prototype[Symbol.iterator] = function() {
    return this;
  };

/**
 * Returning an iterator of the given value.
 *
 * @param  {any} value - Value.
 * @return {Iterator}
 */
Iterator.of = function(value) {
  var consumed = false;

  return new Iterator(function() {
    if (consumed)
      return {done: true};

    consumed = true;
    return {value: value};
  });
};

/**
 * Returning an empty iterator.
 *
 * @return {Iterator}
 */
Iterator.empty = function() {
  var iterator = new Iterator(null);
  iterator.done = true;

  return iterator;
};

/**
 * Returning whether the given value is an iterator.
 *
 * @param  {any} value - Value.
 * @return {boolean}
 */
Iterator.is = function(value) {
  if (value instanceof Iterator)
    return true;

  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.next === 'function'
  );
};

/**
 * Exporting.
 */
module.exports = Iterator;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Requiring some graphology libraries we are going to make global for the user
var randomLayout = __webpack_require__(39);
window.graphlayout = {
  random: randomLayout
};
window.ForceAtlas2Layout = __webpack_require__(107);
window.Graph = __webpack_require__(108);
window.gexf = __webpack_require__(116);
window.Sigma = __webpack_require__(121)


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Graphology Random Layout
 * =========================
 *
 * Simple layout giving uniform random positions to the nodes.
 */
var defaults = __webpack_require__(40),
    isGraph = __webpack_require__(36);

/**
 * Default options.
 */
var DEFAULTS = {
  attributes: {
    x: 'x',
    y: 'y'
  },
  center: 0.5,
  rng: Math.random,
  scale: 1
};

/**
 * Abstract function running the layout.
 *
 * @param  {Graph}    graph          - Target  graph.
 * @param  {object}   [options]      - Options:
 * @param  {object}     [attributes] - Attributes names to map.
 * @param  {number}     [center]     - Center of the layout.
 * @param  {function}   [rng]        - Custom RNG function to be used.
 * @param  {number}     [scale]      - Scale of the layout.
 * @return {object}                  - The positions by node.
 */
function genericRandomLayout(assign, graph, options) {
  if (!isGraph(graph))
    throw new Error('graphology-layout/random: the given graph is not a valid graphology instance.');

  options = defaults(options, DEFAULTS);

  var positions = {},
      nodes = graph.nodes(),
      center = options.center,
      rng = options.rng,
      scale = options.scale;

  var l = nodes.length,
      node,
      x,
      y,
      i;

  for (i = 0; i < l; i++) {
    node = nodes[i];

    x = rng() * scale;
    y = rng() * scale;

    if (center !== 0.5) {
      x += center - 0.5 * scale;
      y += center - 0.5 * scale;
    }

    positions[node] = {
      x: x,
      y: y
    };

    if (assign) {
      graph.setNodeAttribute(node, options.attributes.x, x);
      graph.setNodeAttribute(node, options.attributes.y, y);
    }
  }

  return positions;
}

var randomLayout = genericRandomLayout.bind(null, false);
randomLayout.assign = genericRandomLayout.bind(null, true);

module.exports = randomLayout;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

var apply = __webpack_require__(18),
    baseRest = __webpack_require__(19),
    customDefaultsMerge = __webpack_require__(54),
    mergeWith = __webpack_require__(104);

/**
 * This method is like `_.defaults` except that it recursively assigns
 * default properties.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 3.10.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.defaults
 * @example
 *
 * _.defaultsDeep({ 'a': { 'b': 2 } }, { 'a': { 'b': 1, 'c': 3 } });
 * // => { 'a': { 'b': 2, 'c': 3 } }
 */
var defaultsDeep = baseRest(function(args) {
  args.push(undefined, customDefaultsMerge);
  return apply(mergeWith, undefined, args);
});

module.exports = defaultsDeep;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

var apply = __webpack_require__(18);

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}

module.exports = overRest;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

var baseSetToString = __webpack_require__(43),
    shortOut = __webpack_require__(53);

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString);

module.exports = setToString;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

var constant = __webpack_require__(44),
    defineProperty = __webpack_require__(21),
    identity = __webpack_require__(20);

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty ? identity : function(func, string) {
  return defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(string),
    'writable': true
  });
};

module.exports = baseSetToString;


/***/ }),
/* 44 */
/***/ (function(module, exports) {

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

module.exports = constant;


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

var isFunction = __webpack_require__(12),
    isMasked = __webpack_require__(49),
    isObject = __webpack_require__(0),
    toSource = __webpack_require__(51);

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;


/***/ }),
/* 46 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

var Symbol = __webpack_require__(22);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;


/***/ }),
/* 48 */
/***/ (function(module, exports) {

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

var coreJsData = __webpack_require__(50);

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

module.exports = isMasked;


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

var root = __webpack_require__(1);

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;


/***/ }),
/* 51 */
/***/ (function(module, exports) {

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

module.exports = toSource;


/***/ }),
/* 52 */
/***/ (function(module, exports) {

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;


/***/ }),
/* 53 */
/***/ (function(module, exports) {

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

module.exports = shortOut;


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

var baseMerge = __webpack_require__(24),
    isObject = __webpack_require__(0);

/**
 * Used by `_.defaultsDeep` to customize its `_.merge` use to merge source
 * objects into destination objects that are passed thru.
 *
 * @private
 * @param {*} objValue The destination value.
 * @param {*} srcValue The source value.
 * @param {string} key The key of the property to merge.
 * @param {Object} object The parent object of `objValue`.
 * @param {Object} source The parent object of `srcValue`.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 * @returns {*} Returns the value to assign.
 */
function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
  if (isObject(objValue) && isObject(srcValue)) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, objValue);
    baseMerge(objValue, srcValue, undefined, customDefaultsMerge, stack);
    stack['delete'](srcValue);
  }
  return objValue;
}

module.exports = customDefaultsMerge;


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

var ListCache = __webpack_require__(5),
    stackClear = __webpack_require__(61),
    stackDelete = __webpack_require__(62),
    stackGet = __webpack_require__(63),
    stackHas = __webpack_require__(64),
    stackSet = __webpack_require__(65);

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

module.exports = Stack;


/***/ }),
/* 56 */
/***/ (function(module, exports) {

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

module.exports = listCacheClear;


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

var assocIndexOf = __webpack_require__(6);

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

module.exports = listCacheDelete;


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

var assocIndexOf = __webpack_require__(6);

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

var assocIndexOf = __webpack_require__(6);

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

var assocIndexOf = __webpack_require__(6);

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

var ListCache = __webpack_require__(5);

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

module.exports = stackClear;


/***/ }),
/* 62 */
/***/ (function(module, exports) {

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

module.exports = stackDelete;


/***/ }),
/* 63 */
/***/ (function(module, exports) {

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

module.exports = stackGet;


/***/ }),
/* 64 */
/***/ (function(module, exports) {

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

module.exports = stackHas;


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

var ListCache = __webpack_require__(5),
    Map = __webpack_require__(25),
    MapCache = __webpack_require__(66);

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

module.exports = stackSet;


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

var mapCacheClear = __webpack_require__(67),
    mapCacheDelete = __webpack_require__(74),
    mapCacheGet = __webpack_require__(76),
    mapCacheHas = __webpack_require__(77),
    mapCacheSet = __webpack_require__(78);

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

module.exports = MapCache;


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

var Hash = __webpack_require__(68),
    ListCache = __webpack_require__(5),
    Map = __webpack_require__(25);

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

module.exports = mapCacheClear;


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

var hashClear = __webpack_require__(69),
    hashDelete = __webpack_require__(70),
    hashGet = __webpack_require__(71),
    hashHas = __webpack_require__(72),
    hashSet = __webpack_require__(73);

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

module.exports = Hash;


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

var nativeCreate = __webpack_require__(8);

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

module.exports = hashClear;


/***/ }),
/* 70 */
/***/ (function(module, exports) {

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = hashDelete;


/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

var nativeCreate = __webpack_require__(8);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;


/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

var nativeCreate = __webpack_require__(8);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

module.exports = hashHas;


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

var nativeCreate = __webpack_require__(8);

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;


/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

var getMapData = __webpack_require__(9);

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = mapCacheDelete;


/***/ }),
/* 75 */
/***/ (function(module, exports) {

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

module.exports = isKeyable;


/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

var getMapData = __webpack_require__(9);

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;


/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

var getMapData = __webpack_require__(9);

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

var getMapData = __webpack_require__(9);

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

module.exports = mapCacheSet;


/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

var createBaseFor = __webpack_require__(80);

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;


/***/ }),
/* 80 */
/***/ (function(module, exports) {

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;


/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

var assignMergeValue = __webpack_require__(26),
    cloneBuffer = __webpack_require__(82),
    cloneTypedArray = __webpack_require__(83),
    copyArray = __webpack_require__(86),
    initCloneObject = __webpack_require__(87),
    isArguments = __webpack_require__(29),
    isArray = __webpack_require__(30),
    isArrayLikeObject = __webpack_require__(91),
    isBuffer = __webpack_require__(32),
    isFunction = __webpack_require__(12),
    isObject = __webpack_require__(0),
    isPlainObject = __webpack_require__(93),
    isTypedArray = __webpack_require__(33),
    toPlainObject = __webpack_require__(97);

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = object[key],
      srcValue = source[key],
      stacked = stack.get(srcValue);

  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
    : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    var isArr = isArray(srcValue),
        isBuff = !isArr && isBuffer(srcValue),
        isTyped = !isArr && !isBuff && isTypedArray(srcValue);

    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      }
      else if (isBuff) {
        isCommon = false;
        newValue = cloneBuffer(srcValue, true);
      }
      else if (isTyped) {
        isCommon = false;
        newValue = cloneTypedArray(srcValue, true);
      }
      else {
        newValue = [];
      }
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      newValue = objValue;
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      }
      else if (!isObject(objValue) || (srcIndex && isFunction(objValue))) {
        newValue = initCloneObject(srcValue);
      }
    }
    else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  assignMergeValue(object, key, newValue);
}

module.exports = baseMergeDeep;


/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {var root = __webpack_require__(1);

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

module.exports = cloneBuffer;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

var cloneArrayBuffer = __webpack_require__(84);

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

module.exports = cloneTypedArray;


/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

var Uint8Array = __webpack_require__(85);

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

module.exports = cloneArrayBuffer;


/***/ }),
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

var root = __webpack_require__(1);

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

module.exports = Uint8Array;


/***/ }),
/* 86 */
/***/ (function(module, exports) {

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = copyArray;


/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

var baseCreate = __webpack_require__(88),
    getPrototype = __webpack_require__(27),
    isPrototype = __webpack_require__(28);

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

module.exports = initCloneObject;


/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(0);

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

module.exports = baseCreate;


/***/ }),
/* 89 */
/***/ (function(module, exports) {

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

module.exports = overArg;


/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

var baseGetTag = __webpack_require__(4),
    isObjectLike = __webpack_require__(2);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

module.exports = baseIsArguments;


/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

var isArrayLike = __webpack_require__(15),
    isObjectLike = __webpack_require__(2);

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

module.exports = isArrayLikeObject;


/***/ }),
/* 92 */
/***/ (function(module, exports) {

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = stubFalse;


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

var baseGetTag = __webpack_require__(4),
    getPrototype = __webpack_require__(27),
    isObjectLike = __webpack_require__(2);

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

module.exports = isPlainObject;


/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

var baseGetTag = __webpack_require__(4),
    isLength = __webpack_require__(31),
    isObjectLike = __webpack_require__(2);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

module.exports = baseIsTypedArray;


/***/ }),
/* 95 */
/***/ (function(module, exports) {

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

module.exports = baseUnary;


/***/ }),
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {var freeGlobal = __webpack_require__(23);

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

var copyObject = __webpack_require__(98),
    keysIn = __webpack_require__(34);

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}

module.exports = toPlainObject;


/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

var assignValue = __webpack_require__(99),
    baseAssignValue = __webpack_require__(13);

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

module.exports = copyObject;


/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

var baseAssignValue = __webpack_require__(13),
    eq = __webpack_require__(7);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

module.exports = assignValue;


/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

var baseTimes = __webpack_require__(101),
    isArguments = __webpack_require__(29),
    isArray = __webpack_require__(30),
    isBuffer = __webpack_require__(32),
    isIndex = __webpack_require__(35),
    isTypedArray = __webpack_require__(33);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = arrayLikeKeys;


/***/ }),
/* 101 */
/***/ (function(module, exports) {

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

module.exports = baseTimes;


/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(0),
    isPrototype = __webpack_require__(28),
    nativeKeysIn = __webpack_require__(103);

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeysIn;


/***/ }),
/* 103 */
/***/ (function(module, exports) {

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = nativeKeysIn;


/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

var baseMerge = __webpack_require__(24),
    createAssigner = __webpack_require__(105);

/**
 * This method is like `_.merge` except that it accepts `customizer` which
 * is invoked to produce the merged values of the destination and source
 * properties. If `customizer` returns `undefined`, merging is handled by the
 * method instead. The `customizer` is invoked with six arguments:
 * (objValue, srcValue, key, object, source, stack).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} sources The source objects.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 * @example
 *
 * function customizer(objValue, srcValue) {
 *   if (_.isArray(objValue)) {
 *     return objValue.concat(srcValue);
 *   }
 * }
 *
 * var object = { 'a': [1], 'b': [2] };
 * var other = { 'a': [3], 'b': [4] };
 *
 * _.mergeWith(object, other, customizer);
 * // => { 'a': [1, 3], 'b': [2, 4] }
 */
var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
  baseMerge(object, source, srcIndex, customizer);
});

module.exports = mergeWith;


/***/ }),
/* 105 */
/***/ (function(module, exports, __webpack_require__) {

var baseRest = __webpack_require__(19),
    isIterateeCall = __webpack_require__(106);

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;


/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

var eq = __webpack_require__(7),
    isArrayLike = __webpack_require__(15),
    isIndex = __webpack_require__(35),
    isObject = __webpack_require__(0);

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
}

module.exports = isIterateeCall;


/***/ }),
/* 107 */
/***/ (function(module, exports, __webpack_require__) {

(function webpackUniversalModuleDefinition(root, factory) {
	if(true)
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["FA2LayoutSupervisor"] = factory();
	else
		root["FA2LayoutSupervisor"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Graphology ForceAtlas2 Layout Supervisor
 * =========================================
 *
 * Supervisor class able to spawn a web worker to run the FA2 layout in a
 * separate thread not to block UI with heavy synchronous computations.
 */
var Worker = __webpack_require__(1),
    isGraph = __webpack_require__(3),
    helpers = __webpack_require__(4);

var DEFAULT_SETTINGS = __webpack_require__(5);

/**
 * Class representing a FA2 layout run by a webworker.
 *
 * @constructor
 * @param  {Graph}         graph        - Target graph.
 * @param  {object|number} params       - Parameters:
 * @param  {object}          [settings] - Settings.
 */
function FA2LayoutSupervisor(graph, params) {
  params = params || {};

  // Validation
  if (!isGraph(graph))
    throw new Error('graphology-layout-forceatlas2/worker: the given graph is not a valid graphology instance.');

  // Validating settings
  var settings = helpers.assign({}, DEFAULT_SETTINGS, params.settings),
      validationError = helpers.validateSettings(settings);

  if (validationError)
    throw new Error('graphology-layout-forceatlas2/worker: ' + validationError.message);

  // Properties
  this.worker = new Worker();
  this.graph = graph;
  this.settings = settings;
  this.matrices = null;
  this.running = false;
  this.killed = false;

  // Binding listeners
  this.handleMessage = this.handleMessage.bind(this);

  this.worker.addEventListener('message', this.handleMessage.bind(this));
}

/**
 * Internal method used to handle the worker's messages.
 *
 * @param {object} event - Event to handle.
 */
FA2LayoutSupervisor.prototype.handleMessage = function(event) {
  if (!this.running)
    return;

  var matrix = new Float32Array(event.data.nodes);

  helpers.applyLayoutChanges(this.graph, matrix);
  this.matrices.nodes = matrix;

  // Looping
  this.askForIterations();
};

/**
 * Internal method used to ask for iterations from the worker.
 *
 * @param  {boolean} withEdges - Should we send edges along?
 * @return {FA2LayoutSupervisor}
 */
FA2LayoutSupervisor.prototype.askForIterations = function(withEdges) {
  var matrices = this.matrices;

  var payload = {
    settings: this.settings,
    nodes: matrices.nodes.buffer
  };

  var buffers = [matrices.nodes.buffer];

  if (withEdges) {
    payload.edges = matrices.edges.buffer;
    buffers.push(matrices.edges.buffer);
  }

  this.worker.postMessage(payload, buffers);

  return this;
};

/**
 * Method used to start the layout.
 *
 * @return {FA2LayoutSupervisor}
 */
FA2LayoutSupervisor.prototype.start = function() {
  if (this.killed)
    throw new Error('graphology-layout-forceatlas2/worker.start: layout was killed.');

  if (this.running)
    return this;

  // Building matrices
  this.matrices = helpers.graphToByteArrays(this.graph);

  this.running = true;
  this.askForIterations(true);

  return this;
};

/**
 * Method used to stop the layout.
 *
 * @return {FA2LayoutSupervisor}
 */
FA2LayoutSupervisor.prototype.stop = function() {
  this.running = false;

  return this;
};

/**
 * Method used to kill the layout.
 *
 * @return {FA2LayoutSupervisor}
 */
FA2LayoutSupervisor.prototype.kill = function() {
  if (this.killed)
    return this;

  this.running = false;
  this.killed = true;

  // Clearing memory
  this.matrices = null;

  // Terminating worker
  this.worker.terminate();

  // Unbinding listeners
  // TODO: for graph listeners
};

/**
 * Exporting.
 */
module.exports = FA2LayoutSupervisor;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = function() {
	return __webpack_require__(2)("/******/ (function(modules) { // webpackBootstrap\n/******/ \t// The module cache\n/******/ \tvar installedModules = {};\n/******/\n/******/ \t// The require function\n/******/ \tfunction __webpack_require__(moduleId) {\n/******/\n/******/ \t\t// Check if module is in cache\n/******/ \t\tif(installedModules[moduleId]) {\n/******/ \t\t\treturn installedModules[moduleId].exports;\n/******/ \t\t}\n/******/ \t\t// Create a new module (and put it into the cache)\n/******/ \t\tvar module = installedModules[moduleId] = {\n/******/ \t\t\ti: moduleId,\n/******/ \t\t\tl: false,\n/******/ \t\t\texports: {}\n/******/ \t\t};\n/******/\n/******/ \t\t// Execute the module function\n/******/ \t\tmodules[moduleId].call(module.exports, module, module.exports, __webpack_require__);\n/******/\n/******/ \t\t// Flag the module as loaded\n/******/ \t\tmodule.l = true;\n/******/\n/******/ \t\t// Return the exports of the module\n/******/ \t\treturn module.exports;\n/******/ \t}\n/******/\n/******/\n/******/ \t// expose the modules object (__webpack_modules__)\n/******/ \t__webpack_require__.m = modules;\n/******/\n/******/ \t// expose the module cache\n/******/ \t__webpack_require__.c = installedModules;\n/******/\n/******/ \t// define getter function for harmony exports\n/******/ \t__webpack_require__.d = function(exports, name, getter) {\n/******/ \t\tif(!__webpack_require__.o(exports, name)) {\n/******/ \t\t\tObject.defineProperty(exports, name, {\n/******/ \t\t\t\tconfigurable: false,\n/******/ \t\t\t\tenumerable: true,\n/******/ \t\t\t\tget: getter\n/******/ \t\t\t});\n/******/ \t\t}\n/******/ \t};\n/******/\n/******/ \t// getDefaultExport function for compatibility with non-harmony modules\n/******/ \t__webpack_require__.n = function(module) {\n/******/ \t\tvar getter = module && module.__esModule ?\n/******/ \t\t\tfunction getDefault() { return module['default']; } :\n/******/ \t\t\tfunction getModuleExports() { return module; };\n/******/ \t\t__webpack_require__.d(getter, 'a', getter);\n/******/ \t\treturn getter;\n/******/ \t};\n/******/\n/******/ \t// Object.prototype.hasOwnProperty.call\n/******/ \t__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };\n/******/\n/******/ \t// __webpack_public_path__\n/******/ \t__webpack_require__.p = \"\";\n/******/\n/******/ \t// Load entry module and return exports\n/******/ \treturn __webpack_require__(__webpack_require__.s = 0);\n/******/ })\n/************************************************************************/\n/******/ ([\n/* 0 */\n/***/ (function(module, exports, __webpack_require__) {\n\n/**\n * Graphology ForceAtlas2 Layout Webworker\n * ========================================\n *\n * Web worker able to run the layout in a separate thread.\n */\nvar iterate = __webpack_require__(1);\n\nvar NODES,\n    EDGES;\n\nself.addEventListener('message', function(event) {\n  var data = event.data;\n\n  NODES = new Float32Array(data.nodes);\n\n  if (data.edges)\n    EDGES = new Float32Array(data.edges);\n\n  // Running the iteration\n  iterate(\n    data.settings,\n    NODES,\n    EDGES\n  );\n\n  // Sending result to supervisor\n  self.postMessage({\n    nodes: NODES.buffer\n  }, [NODES.buffer]);\n});\n\n\n/***/ }),\n/* 1 */\n/***/ (function(module, exports) {\n\n/* eslint no-constant-condition: 0 */\n/**\n * Graphology ForceAtlas2 Iteration\n * =================================\n *\n * Function used to perform a single iteration of the algorithm.\n */\n\n/**\n * Matrices properties accessors.\n */\nvar NODE_X = 0,\n    NODE_Y = 1,\n    NODE_DX = 2,\n    NODE_DY = 3,\n    NODE_OLD_DX = 4,\n    NODE_OLD_DY = 5,\n    NODE_MASS = 6,\n    NODE_CONVERGENCE = 7,\n    NODE_SIZE = 8,\n    NODE_FIXED = 9;\n\nvar EDGE_SOURCE = 0,\n    EDGE_TARGET = 1,\n    EDGE_WEIGHT = 2;\n\nvar REGION_NODE = 0,\n    REGION_CENTER_X = 1,\n    REGION_CENTER_Y = 2,\n    REGION_SIZE = 3,\n    REGION_NEXT_SIBLING = 4,\n    REGION_FIRST_CHILD = 5,\n    REGION_MASS = 6,\n    REGION_MASS_CENTER_X = 7,\n    REGION_MASS_CENTER_Y = 8;\n\nvar SUBDIVISION_ATTEMPTS = 3;\n\n/**\n * Constants.\n */\nvar PPN = 10,\n    PPE = 3,\n    PPR = 9;\n\nvar MAX_FORCE = 10;\n\n/**\n * Function used to perform a single interation of the algorithm.\n *\n * @param  {object}       options    - Layout options.\n * @param  {Float32Array} NodeMatrix - Node data.\n * @param  {Float32Array} EdgeMatrix - Edge data.\n * @return {object}                  - Some metadata.\n */\nmodule.exports = function iterate(options, NodeMatrix, EdgeMatrix) {\n\n  // Initializing variables\n  var l, r, n, n1, n2, e, w, g;\n\n  var order = NodeMatrix.length,\n      size = EdgeMatrix.length;\n\n  var outboundAttCompensation,\n      coefficient,\n      xDist,\n      yDist,\n      ewc,\n      distance,\n      factor;\n\n  var RegionMatrix = [];\n\n  // 1) Initializing layout data\n  //-----------------------------\n\n  // Resetting positions & computing max values\n  for (n = 0; n < order; n += PPN) {\n    NodeMatrix[n + NODE_OLD_DX] = NodeMatrix[n + NODE_DX];\n    NodeMatrix[n + NODE_OLD_DY] = NodeMatrix[n + NODE_DY];\n    NodeMatrix[n + NODE_DX] = 0;\n    NodeMatrix[n + NODE_DY] = 0;\n  }\n\n  // If outbound attraction distribution, compensate\n  if (options.outboundAttractionDistribution) {\n    outboundAttCompensation = 0;\n    for (n = 0; n < order; n += PPN) {\n      outboundAttCompensation += NodeMatrix[n + NODE_MASS];\n    }\n\n    outboundAttCompensation /= order;\n  }\n\n\n  // 1.bis) Barnes-Hut computation\n  //------------------------------\n\n  if (options.barnesHutOptimize) {\n\n    // Setting up\n    var minX = Infinity,\n        maxX = -Infinity,\n        minY = Infinity,\n        maxY = -Infinity,\n        q, q2, subdivisionAttempts;\n\n    // Computing min and max values\n    for (n = 0; n < order; n += PPN) {\n      minX = Math.min(minX, NodeMatrix[n + NODE_X]);\n      maxX = Math.max(maxX, NodeMatrix[n + NODE_X]);\n      minY = Math.min(minY, NodeMatrix[n + NODE_Y]);\n      maxY = Math.max(maxY, NodeMatrix[n + NODE_Y]);\n    }\n\n    // squarify bounds, it's a quadtree\n    var dx = maxX - minX, dy = maxY - minY;\n    if (dx > dy) {\n      minY -= (dx - dy) / 2;\n      maxY = minY + dx;\n    }\n    else {\n      minX -= (dy - dx) / 2;\n      maxX = minX + dy;\n    }\n\n    // Build the Barnes Hut root region\n    RegionMatrix[0 + REGION_NODE] = -1;\n    RegionMatrix[0 + REGION_CENTER_X] = (minX + maxX) / 2;\n    RegionMatrix[0 + REGION_CENTER_Y] = (minY + maxY) / 2;\n    RegionMatrix[0 + REGION_SIZE] = Math.max(maxX - minX, maxY - minY);\n    RegionMatrix[0 + REGION_NEXT_SIBLING] = -1;\n    RegionMatrix[0 + REGION_FIRST_CHILD] = -1;\n    RegionMatrix[0 + REGION_MASS] = 0;\n    RegionMatrix[0 + REGION_MASS_CENTER_X] = 0;\n    RegionMatrix[0 + REGION_MASS_CENTER_Y] = 0;\n\n    // Add each node in the tree\n    l = 1;\n    for (n = 0; n < order; n += PPN) {\n\n      // Current region, starting with root\n      r = 0;\n      subdivisionAttempts = SUBDIVISION_ATTEMPTS;\n\n      while (true) {\n        // Are there sub-regions?\n\n        // We look at first child index\n        if (RegionMatrix[r + REGION_FIRST_CHILD] >= 0) {\n\n          // There are sub-regions\n\n          // We just iterate to find a \"leaf\" of the tree\n          // that is an empty region or a region with a single node\n          // (see next case)\n\n          // Find the quadrant of n\n          if (NodeMatrix[n + NODE_X] < RegionMatrix[r + REGION_CENTER_X]) {\n\n            if (NodeMatrix[n + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {\n\n              // Top Left quarter\n              q = RegionMatrix[r + REGION_FIRST_CHILD];\n            }\n            else {\n\n              // Bottom Left quarter\n              q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR;\n            }\n          }\n          else {\n            if (NodeMatrix[n + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {\n\n              // Top Right quarter\n              q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 2;\n            }\n            else {\n\n              // Bottom Right quarter\n              q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 3;\n            }\n          }\n\n          // Update center of mass and mass (we only do it for non-leave regions)\n          RegionMatrix[r + REGION_MASS_CENTER_X] =\n            (RegionMatrix[r + REGION_MASS_CENTER_X] * RegionMatrix[r + REGION_MASS] +\n             NodeMatrix[n + NODE_X] * NodeMatrix[n + NODE_MASS]) /\n            (RegionMatrix[r + REGION_MASS] + NodeMatrix[n + NODE_MASS]);\n\n          RegionMatrix[r + REGION_MASS_CENTER_Y] =\n            (RegionMatrix[r + REGION_MASS_CENTER_Y] * RegionMatrix[r + REGION_MASS] +\n             NodeMatrix[n + NODE_Y] * NodeMatrix[n + NODE_MASS]) /\n            (RegionMatrix[r + REGION_MASS] + NodeMatrix[n + NODE_MASS]);\n\n          RegionMatrix[r + REGION_MASS] += NodeMatrix[n + NODE_MASS];\n\n          // Iterate on the right quadrant\n          r = q;\n          continue;\n        }\n        else {\n\n          // There are no sub-regions: we are in a \"leaf\"\n\n          // Is there a node in this leave?\n          if (RegionMatrix[r + REGION_NODE] < 0) {\n\n            // There is no node in region:\n            // we record node n and go on\n            RegionMatrix[r + REGION_NODE] = n;\n            break;\n          }\n          else {\n\n            // There is a node in this region\n\n            // We will need to create sub-regions, stick the two\n            // nodes (the old one r[0] and the new one n) in two\n            // subregions. If they fall in the same quadrant,\n            // we will iterate.\n\n            // Create sub-regions\n            RegionMatrix[r + REGION_FIRST_CHILD] = l * PPR;\n            w = RegionMatrix[r + REGION_SIZE] / 2; // new size (half)\n\n            // NOTE: we use screen coordinates\n            // from Top Left to Bottom Right\n\n            // Top Left sub-region\n            g = RegionMatrix[r + REGION_FIRST_CHILD];\n\n            RegionMatrix[g + REGION_NODE] = -1;\n            RegionMatrix[g + REGION_CENTER_X] = RegionMatrix[r + REGION_CENTER_X] - w;\n            RegionMatrix[g + REGION_CENTER_Y] = RegionMatrix[r + REGION_CENTER_Y] - w;\n            RegionMatrix[g + REGION_SIZE] = w;\n            RegionMatrix[g + REGION_NEXT_SIBLING] = g + PPR;\n            RegionMatrix[g + REGION_FIRST_CHILD] = -1;\n            RegionMatrix[g + REGION_MASS] = 0;\n            RegionMatrix[g + REGION_MASS_CENTER_X] = 0;\n            RegionMatrix[g + REGION_MASS_CENTER_Y] = 0;\n\n            // Bottom Left sub-region\n            g += PPR;\n            RegionMatrix[g + REGION_NODE] = -1;\n            RegionMatrix[g + REGION_CENTER_X] = RegionMatrix[r + REGION_CENTER_X] - w;\n            RegionMatrix[g + REGION_CENTER_Y] = RegionMatrix[r + REGION_CENTER_Y] + w;\n            RegionMatrix[g + REGION_SIZE] = w;\n            RegionMatrix[g + REGION_NEXT_SIBLING] = g + PPR;\n            RegionMatrix[g + REGION_FIRST_CHILD] = -1;\n            RegionMatrix[g + REGION_MASS] = 0;\n            RegionMatrix[g + REGION_MASS_CENTER_X] = 0;\n            RegionMatrix[g + REGION_MASS_CENTER_Y] = 0;\n\n            // Top Right sub-region\n            g += PPR;\n            RegionMatrix[g + REGION_NODE] = -1;\n            RegionMatrix[g + REGION_CENTER_X] = RegionMatrix[r + REGION_CENTER_X] + w;\n            RegionMatrix[g + REGION_CENTER_Y] = RegionMatrix[r + REGION_CENTER_Y] - w;\n            RegionMatrix[g + REGION_SIZE] = w;\n            RegionMatrix[g + REGION_NEXT_SIBLING] = g + PPR;\n            RegionMatrix[g + REGION_FIRST_CHILD] = -1;\n            RegionMatrix[g + REGION_MASS] = 0;\n            RegionMatrix[g + REGION_MASS_CENTER_X] = 0;\n            RegionMatrix[g + REGION_MASS_CENTER_Y] = 0;\n\n            // Bottom Right sub-region\n            g += PPR;\n            RegionMatrix[g + REGION_NODE] = -1;\n            RegionMatrix[g + REGION_CENTER_X] = RegionMatrix[r + REGION_CENTER_X] + w;\n            RegionMatrix[g + REGION_CENTER_Y] = RegionMatrix[r + REGION_CENTER_Y] + w;\n            RegionMatrix[g + REGION_SIZE] = w;\n            RegionMatrix[g + REGION_NEXT_SIBLING] = RegionMatrix[r + REGION_NEXT_SIBLING];\n            RegionMatrix[g + REGION_FIRST_CHILD] = -1;\n            RegionMatrix[g + REGION_MASS] = 0;\n            RegionMatrix[g + REGION_MASS_CENTER_X] = 0;\n            RegionMatrix[g + REGION_MASS_CENTER_Y] = 0;\n\n            l += 4;\n\n            // Now the goal is to find two different sub-regions\n            // for the two nodes: the one previously recorded (r[0])\n            // and the one we want to add (n)\n\n            // Find the quadrant of the old node\n            if (NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_X] < RegionMatrix[r + REGION_CENTER_X]) {\n              if (NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {\n\n                // Top Left quarter\n                q = RegionMatrix[r + REGION_FIRST_CHILD];\n              }\n              else {\n\n                // Bottom Left quarter\n                q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR;\n              }\n            }\n            else {\n              if (NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {\n\n                // Top Right quarter\n                q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 2;\n              }\n              else {\n\n                // Bottom Right quarter\n                q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 3;\n              }\n            }\n\n            // We remove r[0] from the region r, add its mass to r and record it in q\n            RegionMatrix[r + REGION_MASS] = NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_MASS];\n            RegionMatrix[r + REGION_MASS_CENTER_X] = NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_X];\n            RegionMatrix[r + REGION_MASS_CENTER_Y] = NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_Y];\n\n            RegionMatrix[q + REGION_NODE] = RegionMatrix[r + REGION_NODE];\n            RegionMatrix[r + REGION_NODE] = -1;\n\n            // Find the quadrant of n\n            if (NodeMatrix[n + NODE_X] < RegionMatrix[r + REGION_CENTER_X]) {\n              if (NodeMatrix[n + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {\n\n                // Top Left quarter\n                q2 = RegionMatrix[r + REGION_FIRST_CHILD];\n              }\n              else {\n                // Bottom Left quarter\n                q2 = RegionMatrix[r + REGION_FIRST_CHILD] + PPR;\n              }\n            }\n            else {\n              if (NodeMatrix[n + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {\n\n                // Top Right quarter\n                q2 = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 2;\n              }\n              else {\n\n                // Bottom Right quarter\n                q2 = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 3;\n              }\n            }\n\n            if (q === q2) {\n\n              // If both nodes are in the same quadrant,\n              // we have to try it again on this quadrant\n              if (subdivisionAttempts--) {\n                r = q;\n                continue; // while\n              }\n              else {\n                // we are out of precision here, and we cannot subdivide anymore\n                // but we have to break the loop anyway\n                subdivisionAttempts = SUBDIVISION_ATTEMPTS;\n                break; // while\n              }\n\n            }\n\n            // If both quadrants are different, we record n\n            // in its quadrant\n            RegionMatrix[q2 + REGION_NODE] = n;\n            break;\n          }\n        }\n      }\n    }\n  }\n\n\n  // 2) Repulsion\n  //--------------\n  // NOTES: adjustSizes = antiCollision & scalingRatio = coefficient\n\n  if (options.barnesHutOptimize) {\n    coefficient = options.scalingRatio;\n\n    // Applying repulsion through regions\n    for (n = 0; n < order; n += PPN) {\n\n      // Computing leaf quad nodes iteration\n\n      r = 0; // Starting with root region\n      while (true) {\n\n        if (RegionMatrix[r + REGION_FIRST_CHILD] >= 0) {\n\n          // The region has sub-regions\n\n          // We run the Barnes Hut test to see if we are at the right distance\n          distance = Math.sqrt(\n            (Math.pow(NodeMatrix[n + NODE_X] - RegionMatrix[r + REGION_MASS_CENTER_X], 2)) +\n            (Math.pow(NodeMatrix[n + NODE_Y] - RegionMatrix[r + REGION_MASS_CENTER_Y], 2))\n          );\n\n          if (2 * RegionMatrix[r + REGION_SIZE] / distance < options.barnesHutTheta) {\n\n            // We treat the region as a single body, and we repulse\n\n            xDist = NodeMatrix[n + NODE_X] - RegionMatrix[r + REGION_MASS_CENTER_X];\n            yDist = NodeMatrix[n + NODE_Y] - RegionMatrix[r + REGION_MASS_CENTER_Y];\n\n            if (options.adjustSizes) {\n\n              //-- Linear Anti-collision Repulsion\n              if (distance > 0) {\n                factor = coefficient * NodeMatrix[n + NODE_MASS] *\n                  RegionMatrix[r + REGION_MASS] / distance / distance;\n\n                NodeMatrix[n + NODE_DX] += xDist * factor;\n                NodeMatrix[n + NODE_DY] += yDist * factor;\n              }\n              else if (distance < 0) {\n                factor = -coefficient * NodeMatrix[n + NODE_MASS] *\n                  RegionMatrix[r + REGION_MASS] / distance;\n\n                NodeMatrix[n + NODE_DX] += xDist * factor;\n                NodeMatrix[n + NODE_DY] += yDist * factor;\n              }\n            }\n            else {\n\n              //-- Linear Repulsion\n              if (distance > 0) {\n                factor = coefficient * NodeMatrix[n + NODE_MASS] *\n                  RegionMatrix[r + REGION_MASS] / distance / distance;\n\n                NodeMatrix[n + NODE_DX] += xDist * factor;\n                NodeMatrix[n + NODE_DY] += yDist * factor;\n              }\n            }\n\n            // When this is done, we iterate. We have to look at the next sibling.\n            if (RegionMatrix[r + REGION_NEXT_SIBLING] < 0)\n              break; // No next sibling: we have finished the tree\n            r = RegionMatrix[r + REGION_NEXT_SIBLING];\n            continue;\n\n          }\n          else {\n\n            // The region is too close and we have to look at sub-regions\n            r = RegionMatrix[r + REGION_FIRST_CHILD];\n            continue;\n          }\n\n        }\n        else {\n\n          // The region has no sub-region\n          // If there is a node r[0] and it is not n, then repulse\n\n          if (RegionMatrix[r + REGION_NODE] >= 0 && RegionMatrix[r + REGION_NODE] !== n) {\n            xDist = NodeMatrix[n + NODE_X] - NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_X];\n            yDist = NodeMatrix[n + NODE_Y] - NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_Y];\n\n            distance = Math.sqrt(xDist * xDist + yDist * yDist);\n\n            if (options.adjustSizes) {\n\n              //-- Linear Anti-collision Repulsion\n              if (distance > 0) {\n                factor = coefficient * NodeMatrix[n + NODE_MASS] *\n                  NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_MASS] / distance / distance;\n\n                NodeMatrix[n + NODE_DX] += xDist * factor;\n                NodeMatrix[n + NODE_DY] += yDist * factor;\n              }\n              else if (distance < 0) {\n                factor = -coefficient * NodeMatrix[n + NODE_MASS] *\n                  NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_MASS] / distance;\n\n                NodeMatrix[n + NODE_DX] += xDist * factor;\n                NodeMatrix[n + NODE_DY] += yDist * factor;\n              }\n            }\n            else {\n\n              //-- Linear Repulsion\n              if (distance > 0) {\n                factor = coefficient * NodeMatrix[n + NODE_MASS] *\n                  NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_MASS] / distance / distance;\n\n                NodeMatrix[n + NODE_DX] += xDist * factor;\n                NodeMatrix[n + NODE_DY] += yDist * factor;\n              }\n            }\n\n          }\n\n          // When this is done, we iterate. We have to look at the next sibling.\n          if (RegionMatrix[r + REGION_NEXT_SIBLING] < 0)\n            break; // No next sibling: we have finished the tree\n          r = RegionMatrix[r + REGION_NEXT_SIBLING];\n          continue;\n        }\n      }\n    }\n  }\n  else {\n    coefficient = options.scalingRatio;\n\n    // Square iteration\n    for (n1 = 0; n1 < order; n1 += PPN) {\n      for (n2 = 0; n2 < n1; n2 += PPN) {\n\n        // Common to both methods\n        xDist = NodeMatrix[n1 + NODE_X] - NodeMatrix[n2 + NODE_X];\n        yDist = NodeMatrix[n1 + NODE_Y] - NodeMatrix[n2 + NODE_Y];\n\n        if (options.adjustSizes) {\n\n          //-- Anticollision Linear Repulsion\n          distance = Math.sqrt(xDist * xDist + yDist * yDist) -\n            NodeMatrix[n1 + NODE_SIZE] -\n            NodeMatrix[n2 + NODE_SIZE];\n\n          if (distance > 0) {\n            factor = coefficient *\n              NodeMatrix[n1 + NODE_MASS] *\n              NodeMatrix[n2 + NODE_MASS] /\n              distance / distance;\n\n            // Updating nodes' dx and dy\n            NodeMatrix[n1 + NODE_DX] += xDist * factor;\n            NodeMatrix[n1 + NODE_DY] += yDist * factor;\n\n            NodeMatrix[n2 + NODE_DX] += xDist * factor;\n            NodeMatrix[n2 + NODE_DY] += yDist * factor;\n          }\n          else if (distance < 0) {\n            factor = 100 * coefficient *\n              NodeMatrix[n1 + NODE_MASS] *\n              NodeMatrix[n2 + NODE_MASS];\n\n            // Updating nodes' dx and dy\n            NodeMatrix[n1 + NODE_DX] += xDist * factor;\n            NodeMatrix[n1 + NODE_DY] += yDist * factor;\n\n            NodeMatrix[n2 + NODE_DX] -= xDist * factor;\n            NodeMatrix[n2 + NODE_DY] -= yDist * factor;\n          }\n        }\n        else {\n\n          //-- Linear Repulsion\n          distance = Math.sqrt(xDist * xDist + yDist * yDist);\n\n          if (distance > 0) {\n            factor = coefficient *\n              NodeMatrix[n1 + NODE_MASS] *\n              NodeMatrix[n2 + NODE_MASS] /\n              distance / distance;\n\n            // Updating nodes' dx and dy\n            NodeMatrix[n1 + NODE_DX] += xDist * factor;\n            NodeMatrix[n1 + NODE_DY] += yDist * factor;\n\n            NodeMatrix[n2 + NODE_DX] -= xDist * factor;\n            NodeMatrix[n2 + NODE_DY] -= yDist * factor;\n          }\n        }\n      }\n    }\n  }\n\n\n  // 3) Gravity\n  //------------\n  g = options.gravity / options.scalingRatio;\n  coefficient = options.scalingRatio;\n  for (n = 0; n < order; n += PPN) {\n    factor = 0;\n\n    // Common to both methods\n    xDist = NodeMatrix[n + NODE_X];\n    yDist = NodeMatrix[n + NODE_Y];\n    distance = Math.sqrt(\n      Math.pow(xDist, 2) + Math.pow(yDist, 2)\n    );\n\n    if (options.strongGravityMode) {\n\n      //-- Strong gravity\n      if (distance > 0)\n        factor = coefficient * NodeMatrix[n + NODE_MASS] * g;\n    }\n    else {\n\n      //-- Linear Anti-collision Repulsion n\n      if (distance > 0)\n        factor = coefficient * NodeMatrix[n + NODE_MASS] * g / distance;\n    }\n\n    // Updating node's dx and dy\n    NodeMatrix[n + NODE_DX] -= xDist * factor;\n    NodeMatrix[n + NODE_DY] -= yDist * factor;\n  }\n\n  // 4) Attraction\n  //---------------\n  coefficient = 1 *\n    (options.outboundAttractionDistribution ?\n      outboundAttCompensation :\n      1);\n\n  // TODO: simplify distance\n  // TODO: coefficient is always used as -c --> optimize?\n  for (e = 0; e < size; e += PPE) {\n    n1 = EdgeMatrix[e + EDGE_SOURCE];\n    n2 = EdgeMatrix[e + EDGE_TARGET];\n    w = EdgeMatrix[e + EDGE_WEIGHT];\n\n    // Edge weight influence\n    ewc = Math.pow(w, options.edgeWeightInfluence);\n\n    // Common measures\n    xDist = NodeMatrix[n1 + NODE_X] - NodeMatrix[n2 + NODE_X];\n    yDist = NodeMatrix[n1 + NODE_Y] - NodeMatrix[n2 + NODE_Y];\n\n    // Applying attraction to nodes\n    if (options.adjustSizes) {\n\n      distance = Math.sqrt(\n        (Math.pow(xDist, 2) + Math.pow(yDist, 2)) -\n        NodeMatrix[n1 + NODE_SIZE] -\n        NodeMatrix[n2 + NODE_SIZE]\n      );\n\n      if (options.linLogMode) {\n        if (options.outboundAttractionDistribution) {\n\n          //-- LinLog Degree Distributed Anti-collision Attraction\n          if (distance > 0) {\n            factor = -coefficient * ewc * Math.log(1 + distance) /\n            distance /\n            NodeMatrix[n1 + NODE_MASS];\n          }\n        }\n        else {\n\n          //-- LinLog Anti-collision Attraction\n          if (distance > 0) {\n            factor = -coefficient * ewc * Math.log(1 + distance) / distance;\n          }\n        }\n      }\n      else {\n        if (options.outboundAttractionDistribution) {\n\n          //-- Linear Degree Distributed Anti-collision Attraction\n          if (distance > 0) {\n            factor = -coefficient * ewc / NodeMatrix[n1 + NODE_MASS];\n          }\n        }\n        else {\n\n          //-- Linear Anti-collision Attraction\n          if (distance > 0) {\n            factor = -coefficient * ewc;\n          }\n        }\n      }\n    }\n    else {\n\n      distance = Math.sqrt(\n        Math.pow(xDist, 2) + Math.pow(yDist, 2)\n      );\n\n      if (options.linLogMode) {\n        if (options.outboundAttractionDistribution) {\n\n          //-- LinLog Degree Distributed Attraction\n          if (distance > 0) {\n            factor = -coefficient * ewc * Math.log(1 + distance) /\n              distance /\n              NodeMatrix[n1 + NODE_MASS];\n          }\n        }\n        else {\n\n          //-- LinLog Attraction\n          if (distance > 0)\n            factor = -coefficient * ewc * Math.log(1 + distance) / distance;\n        }\n      }\n      else {\n        if (options.outboundAttractionDistribution) {\n\n          //-- Linear Attraction Mass Distributed\n          // NOTE: Distance is set to 1 to override next condition\n          distance = 1;\n          factor = -coefficient * ewc / NodeMatrix[n1 + NODE_MASS];\n        }\n        else {\n\n          //-- Linear Attraction\n          // NOTE: Distance is set to 1 to override next condition\n          distance = 1;\n          factor = -coefficient * ewc;\n        }\n      }\n    }\n\n    // Updating nodes' dx and dy\n    // TODO: if condition or factor = 1?\n    if (distance > 0) {\n\n      // Updating nodes' dx and dy\n      NodeMatrix[n1 + NODE_DX] += xDist * factor;\n      NodeMatrix[n1 + NODE_DY] += yDist * factor;\n\n      NodeMatrix[n2 + NODE_DX] -= xDist * factor;\n      NodeMatrix[n2 + NODE_DY] -= yDist * factor;\n    }\n  }\n\n\n  // 5) Apply Forces\n  //-----------------\n  var force,\n      swinging,\n      traction,\n      nodespeed;\n\n  // MATH: sqrt and square distances\n  if (options.adjustSizes) {\n\n    for (n = 0; n < order; n += PPN) {\n      if (!NodeMatrix[n + NODE_FIXED]) {\n        force = Math.sqrt(\n          Math.pow(NodeMatrix[n + NODE_DX], 2) +\n          Math.pow(NodeMatrix[n + NODE_DY], 2)\n        );\n\n        if (force > MAX_FORCE) {\n          NodeMatrix[n + NODE_DX] =\n            NodeMatrix[n + NODE_DX] * MAX_FORCE / force;\n          NodeMatrix[n + NODE_DY] =\n            NodeMatrix[n + NODE_DY] * MAX_FORCE / force;\n        }\n\n        swinging = NodeMatrix[n + NODE_MASS] *\n          Math.sqrt(\n            (NodeMatrix[n + NODE_OLD_DX] - NodeMatrix[n + NODE_DX]) *\n            (NodeMatrix[n + NODE_OLD_DX] - NodeMatrix[n + NODE_DX]) +\n            (NodeMatrix[n + NODE_OLD_DY] - NodeMatrix[n + NODE_DY]) *\n            (NodeMatrix[n + NODE_OLD_DY] - NodeMatrix[n + NODE_DY])\n          );\n\n        traction = Math.sqrt(\n          (NodeMatrix[n + NODE_OLD_DX] + NodeMatrix[n + NODE_DX]) *\n          (NodeMatrix[n + NODE_OLD_DX] + NodeMatrix[n + NODE_DX]) +\n          (NodeMatrix[n + NODE_OLD_DY] + NodeMatrix[n + NODE_DY]) *\n          (NodeMatrix[n + NODE_OLD_DY] + NodeMatrix[n + NODE_DY])\n        ) / 2;\n\n        nodespeed =\n          0.1 * Math.log(1 + traction) / (1 + Math.sqrt(swinging));\n\n        // Updating node's positon\n        NodeMatrix[n + NODE_X] =\n          NodeMatrix[n + NODE_X] + NodeMatrix[n + NODE_DX] *\n          (nodespeed / options.slowDown);\n        NodeMatrix[n + NODE_Y] =\n          NodeMatrix[n + NODE_Y] + NodeMatrix[n + NODE_DY] *\n          (nodespeed / options.slowDown);\n      }\n    }\n  }\n  else {\n\n    for (n = 0; n < order; n += PPN) {\n      if (!NodeMatrix[n + NODE_FIXED]) {\n\n        swinging = NodeMatrix[n + NODE_MASS] *\n          Math.sqrt(\n            (NodeMatrix[n + NODE_OLD_DX] - NodeMatrix[n + NODE_DX]) *\n            (NodeMatrix[n + NODE_OLD_DX] - NodeMatrix[n + NODE_DX]) +\n            (NodeMatrix[n + NODE_OLD_DY] - NodeMatrix[n + NODE_DY]) *\n            (NodeMatrix[n + NODE_OLD_DY] - NodeMatrix[n + NODE_DY])\n          );\n\n        traction = Math.sqrt(\n          (NodeMatrix[n + NODE_OLD_DX] + NodeMatrix[n + NODE_DX]) *\n          (NodeMatrix[n + NODE_OLD_DX] + NodeMatrix[n + NODE_DX]) +\n          (NodeMatrix[n + NODE_OLD_DY] + NodeMatrix[n + NODE_DY]) *\n          (NodeMatrix[n + NODE_OLD_DY] + NodeMatrix[n + NODE_DY])\n        ) / 2;\n\n        nodespeed = NodeMatrix[n + NODE_CONVERGENCE] *\n          Math.log(1 + traction) / (1 + Math.sqrt(swinging));\n\n        // Updating node convergence\n        NodeMatrix[n + NODE_CONVERGENCE] =\n          Math.min(1, Math.sqrt(\n            nodespeed *\n            (Math.pow(NodeMatrix[n + NODE_DX], 2) +\n             Math.pow(NodeMatrix[n + NODE_DY], 2)) /\n            (1 + Math.sqrt(swinging))\n          ));\n\n        // Updating node's positon\n        NodeMatrix[n + NODE_X] =\n          NodeMatrix[n + NODE_X] + NodeMatrix[n + NODE_DX] *\n          (nodespeed / options.slowDown);\n        NodeMatrix[n + NODE_Y] =\n          NodeMatrix[n + NODE_Y] + NodeMatrix[n + NODE_DY] *\n          (nodespeed / options.slowDown);\n      }\n    }\n  }\n\n  // We return the information about the layout (no need to return the matrices)\n  return {};\n};\n\n\n/***/ })\n/******/ ]);", null);
};

/***/ }),
/* 2 */
/***/ (function(module, exports) {

// http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string

var URL = window.URL || window.webkitURL;
module.exports = function(content, url) {
  try {
    try {
      var blob;
      try { // BlobBuilder = Deprecated, but widely implemented
        var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
        blob = new BlobBuilder();
        blob.append(content);
        blob = blob.getBlob();
      } catch(e) { // The proposed API
        blob = new Blob([content]);
      }
      return new Worker(URL.createObjectURL(blob));
    } catch(e) {
      return new Worker('data:application/javascript,' + encodeURIComponent(content));
    }
  } catch(e) {
    if (!url) {
      throw Error('Inline worker is not supported');
    }
    return new Worker(url);
  }
}


/***/ }),
/* 3 */
/***/ (function(module, exports) {

/**
 * Graphology isGraph
 * ===================
 *
 * Very simple function aiming at ensuring the given variable is a
 * graphology instance.
 */

/**
 * Checking the value is a graphology instance.
 *
 * @param  {any}     value - Target value.
 * @return {boolean}
 */
module.exports = function isGraph(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.addUndirectedEdgeWithKey === 'function' &&
    typeof value.dropNodes === 'function' &&
    typeof value.multi === 'boolean'
  );
};


/***/ }),
/* 4 */
/***/ (function(module, exports) {

/**
 * Graphology ForceAtlas2 Helpers
 * ===============================
 *
 * Miscellaneous helper functions.
 */

/**
 * Constants.
 */
var PPN = 10,
    PPE = 3;

/**
 * Very simple Object.assign-like function.
 *
 * @param  {object} target       - First object.
 * @param  {object} [...objects] - Objects to merge.
 * @return {object}
 */
exports.assign = function(target) {
  target = target || {};

  var objects = Array.prototype.slice.call(arguments).slice(1),
      i,
      k,
      l;

  for (i = 0, l = objects.length; i < l; i++) {
    if (!objects[i])
      continue;

    for (k in objects[i])
      target[k] = objects[i][k];
  }

  return target;
};

/**
 * Function used to validate the given settings.
 *
 * @param  {object}      settings - Settings to validate.
 * @return {object|null}
 */
exports.validateSettings = function(settings) {

  if ('linLogMode' in settings &&
      typeof settings.linLogMode !== 'boolean')
    return {message: 'the `linLogMode` setting should be a boolean.'};

  if ('outboundAttractionDistribution' in settings &&
      typeof settings.outboundAttractionDistribution !== 'boolean')
    return {message: 'the `outboundAttractionDistribution` setting should be a boolean.'};

  if ('adjustSizes' in settings &&
      typeof settings.adjustSizes !== 'boolean')
    return {message: 'the `adjustSizes` setting should be a boolean.'};

  if ('edgeWeightInfluence' in settings &&
      typeof settings.edgeWeightInfluence !== 'number' &&
      settings.edgeWeightInfluence < 0)
    return {message: 'the `edgeWeightInfluence` setting should be a number >= 0.'};

  if ('scalingRatio' in settings &&
      typeof settings.scalingRatio !== 'number' &&
      settings.scalingRatio < 0)
    return {message: 'the `scalingRatio` setting should be a number >= 0.'};

  if ('strongGravityMode' in settings &&
      typeof settings.strongGravityMode !== 'boolean')
    return {message: 'the `strongGravityMode` setting should be a boolean.'};

  if ('gravity' in settings &&
      typeof settings.gravity !== 'number' &&
      settings.gravity < 0)
    return {message: 'the `gravity` setting should be a number >= 0.'};

  if ('slowDown' in settings &&
      typeof settings.slowDown !== 'number' &&
      settings.slowDown < 0)
    return {message: 'the `slowDown` setting should be a number >= 0.'};

  if ('barnesHutOptimize' in settings &&
      typeof settings.barnesHutOptimize !== 'boolean')
    return {message: 'the `barnesHutOptimize` setting should be a boolean.'};

  if ('barnesHutTheta' in settings &&
      typeof settings.barnesHutTheta !== 'number' &&
      settings.barnesHutTheta < 0)
    return {message: 'the `barnesHutTheta` setting should be a number >= 0.'};

  return null;
};

/**
 * Function generating a flat matrix for both nodes & edges of the given graph.
 *
 * @param  {Graph}  graph - Target graph.
 * @return {object}       - Both matrices.
 */
exports.graphToByteArrays = function(graph) {
  var nodes = graph.nodes(),
      edges = graph.edges(),
      order = nodes.length,
      size = edges.length,
      index = {},
      i,
      j;

  var NodeMatrix = new Float32Array(order * PPN),
      EdgeMatrix = new Float32Array(size * PPE);

  // Iterate through nodes
  for (i = j = 0; i < order; i++) {

    // Node index
    index[nodes[i]] = j;

    // Populating byte array
    NodeMatrix[j] = graph.getNodeAttribute(nodes[i], 'x');
    NodeMatrix[j + 1] = graph.getNodeAttribute(nodes[i], 'y');
    NodeMatrix[j + 2] = 0;
    NodeMatrix[j + 3] = 0;
    NodeMatrix[j + 4] = 0;
    NodeMatrix[j + 5] = 0;
    NodeMatrix[j + 6] = 1 + graph.degree(nodes[i]);
    NodeMatrix[j + 7] = 1;
    NodeMatrix[j + 8] = graph.getNodeAttribute(nodes[i], 'size') || 1;
    NodeMatrix[j + 9] = 0;
    j += PPN;
  }

  // Iterate through edges
  for (i = j = 0; i < size; i++) {

    // Populating byte array
    EdgeMatrix[j] = index[graph.source(edges[i])];
    EdgeMatrix[j + 1] = index[graph.target(edges[i])];
    EdgeMatrix[j + 2] = graph.getEdgeAttribute(edges[i], 'weight') || 0;
    j += PPE;
  }

  return {
    nodes: NodeMatrix,
    edges: EdgeMatrix
  };
};

/**
 * Function applying the layout back to the graph.
 *
 * @param {Graph}        graph      - Target graph.
 * @param {Float32Array} NodeMatrix - Node matrix.
 */
exports.applyLayoutChanges = function(graph, NodeMatrix) {
  var nodes = graph.nodes();

  for (var i = 0, j = 0, l = NodeMatrix.length; i < l; i += PPN) {
    graph.setNodeAttribute(nodes[j], 'x', NodeMatrix[i]);
    graph.setNodeAttribute(nodes[j], 'y', NodeMatrix[i + 1]);
    j++;
  }
};

/**
 * Function collecting the layout positions.
 *
 * @param  {Graph}        graph      - Target graph.
 * @param  {Float32Array} NodeMatrix - Node matrix.
 * @return {object}                  - Map to node positions.
 */
exports.collectLayoutChanges = function(graph, NodeMatrix) {
  var nodes = graph.nodes(),
      positions = Object.create(null);

  for (var i = 0, j = 0, l = NodeMatrix.length; i < l; i += PPN) {
    positions[nodes[j]] = {
      x: NodeMatrix[i],
      y: NodeMatrix[i + 1]
    };

    j++;
  }

  return positions;
};


/***/ }),
/* 5 */
/***/ (function(module, exports) {

/**
 * Graphology ForceAtlas2 Layout Default Settings
 * ===============================================
 */
module.exports = {
  linLogMode: false,
  outboundAttractionDistribution: false,
  adjustSizes: false,
  edgeWeightInfluence: 0,
  scalingRatio: 1,
  strongGravityMode: false,
  gravity: 1,
  slowDown: 1,
  barnesHutOptimize: false,
  barnesHutTheta: 0.5
};


/***/ })
/******/ ]);
});

/***/ }),
/* 108 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _utils = __webpack_require__(10);

var _graph = __webpack_require__(109);

var _graph2 = _interopRequireDefault(_graph);

var _errors = __webpack_require__(3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Graphology Reference Implementation Endoint
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * ============================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Importing the Graph object & creating typed constructors.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Alternative constructors.
 */
var DirectedGraph = function (_Graph) {
  _inherits(DirectedGraph, _Graph);

  function DirectedGraph(options) {
    _classCallCheck(this, DirectedGraph);

    return _possibleConstructorReturn(this, _Graph.call(this, (0, _utils.assign)({ type: 'directed' }, options)));
  }

  return DirectedGraph;
}(_graph2.default);

var UndirectedGraph = function (_Graph2) {
  _inherits(UndirectedGraph, _Graph2);

  function UndirectedGraph(options) {
    _classCallCheck(this, UndirectedGraph);

    return _possibleConstructorReturn(this, _Graph2.call(this, (0, _utils.assign)({ type: 'undirected' }, options)));
  }

  return UndirectedGraph;
}(_graph2.default);

var MultiDirectedGraph = function (_Graph3) {
  _inherits(MultiDirectedGraph, _Graph3);

  function MultiDirectedGraph(options) {
    _classCallCheck(this, MultiDirectedGraph);

    return _possibleConstructorReturn(this, _Graph3.call(this, (0, _utils.assign)({ multi: true, type: 'directed' }, options)));
  }

  return MultiDirectedGraph;
}(_graph2.default);

var MultiUndirectedGraph = function (_Graph4) {
  _inherits(MultiUndirectedGraph, _Graph4);

  function MultiUndirectedGraph(options) {
    _classCallCheck(this, MultiUndirectedGraph);

    return _possibleConstructorReturn(this, _Graph4.call(this, (0, _utils.assign)({ multi: true, type: 'undirected' }, options)));
  }

  return MultiUndirectedGraph;
}(_graph2.default);

/**
 * Attaching static #.from method to each of the constructors.
 */


function attachStaticFromMethod(Class) {

  /**
   * Builds a graph from serialized data or another graph's data.
   *
   * @param  {Graph|SerializedGraph} data      - Hydratation data.
   * @param  {object}                [options] - Options.
   * @return {Class}
   */
  Class.from = function (data, options) {
    var instance = new Class(options);
    instance.import(data);

    return instance;
  };
}

attachStaticFromMethod(_graph2.default);
attachStaticFromMethod(DirectedGraph);
attachStaticFromMethod(UndirectedGraph);
attachStaticFromMethod(MultiDirectedGraph);
attachStaticFromMethod(MultiUndirectedGraph);

/**
 * Attaching the various constructors to the Graph class itself so we can
 * keep CommonJS semantics so everyone can consume the library easily.
 */
_graph2.default.Graph = _graph2.default;
_graph2.default.DirectedGraph = DirectedGraph;
_graph2.default.UndirectedGraph = UndirectedGraph;
_graph2.default.MultiDirectedGraph = MultiDirectedGraph;
_graph2.default.MultiUndirectedGraph = MultiUndirectedGraph;

_graph2.default.InvalidArgumentsGraphError = _errors.InvalidArgumentsGraphError;
_graph2.default.NotFoundGraphError = _errors.NotFoundGraphError;
_graph2.default.UsageGraphError = _errors.UsageGraphError;

module.exports = _graph2.default;

/***/ }),
/* 109 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = __webpack_require__(110);

var _iterator = __webpack_require__(37);

var _iterator2 = _interopRequireDefault(_iterator);

var _consume = __webpack_require__(16);

var _consume2 = _interopRequireDefault(_consume);

var _errors = __webpack_require__(3);

var _data = __webpack_require__(17);

var _indices = __webpack_require__(111);

var _attributes = __webpack_require__(112);

var _edges = __webpack_require__(113);

var _neighbors = __webpack_require__(114);

var _serialization = __webpack_require__(115);

var _utils = __webpack_require__(10);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint no-nested-ternary: 0 */
/**
 * Graphology Reference Implementation
 * ====================================
 *
 * Reference implementation of the graphology specs.
 */


/**
 * Enums.
 */
var TYPES = new Set(['directed', 'undirected', 'mixed']);

var EMITTER_PROPS = new Set(['domain', '_events', '_eventsCount', '_maxListeners']);

var EDGE_ADD_METHODS = [{
  name: function name(verb) {
    return verb + 'Edge';
  },
  generateKey: true
}, {
  name: function name(verb) {
    return verb + 'DirectedEdge';
  },
  generateKey: true,
  type: 'directed'
}, {
  name: function name(verb) {
    return verb + 'UndirectedEdge';
  },
  generateKey: true,
  type: 'undirected'
}, {
  name: function name(verb) {
    return verb + 'EdgeWithKey';
  }
}, {
  name: function name(verb) {
    return verb + 'DirectedEdgeWithKey';
  },
  type: 'directed'
}, {
  name: function name(verb) {
    return verb + 'UndirectedEdgeWithKey';
  },
  type: 'undirected'
}];

/**
 * Default options.
 */
var DEFAULTS = {
  allowSelfLoops: true,
  defaultEdgeAttributes: {},
  defaultNodeAttributes: {},
  edgeKeyGenerator: null,
  multi: false,
  type: 'mixed'
};

/**
 * Helper classes.
 */

var NodesIterator = function (_Iterator) {
  _inherits(NodesIterator, _Iterator);

  function NodesIterator() {
    _classCallCheck(this, NodesIterator);

    return _possibleConstructorReturn(this, _Iterator.apply(this, arguments));
  }

  return NodesIterator;
}(_iterator2.default);

/**
 * Abstract functions used by the Graph class for various methods.
 */

/**
 * Internal method used to add an arbitrary edge to the given graph.
 *
 * @param  {Graph}   graph           - Target graph.
 * @param  {string}  name            - Name of the child method for errors.
 * @param  {boolean} mustGenerateKey - Should the graph generate an id?
 * @param  {boolean} undirected      - Whether the edge is undirected.
 * @param  {any}     edge            - The edge's key.
 * @param  {any}     source          - The source node.
 * @param  {any}     target          - The target node.
 * @param  {object}  [attributes]    - Optional attributes.
 * @return {any}                     - The edge.
 *
 * @throws {Error} - Will throw if the graph is of the wrong type.
 * @throws {Error} - Will throw if the given attributes are not an object.
 * @throws {Error} - Will throw if source or target doesn't exist.
 * @throws {Error} - Will throw if the edge already exist.
 */


function addEdge(graph, name, mustGenerateKey, undirected, edge, source, target, attributes) {

  // Checking validity of operation
  if (!undirected && graph.type === 'undirected') throw new _errors.UsageGraphError('Graph.' + name + ': you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead.');

  if (undirected && graph.type === 'directed') throw new _errors.UsageGraphError('Graph.' + name + ': you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead.');

  if (attributes && !(0, _utils.isPlainObject)(attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.' + name + ': invalid attributes. Expecting an object but got "' + attributes + '"');

  // Coercion of source & target:
  source = '' + source;
  target = '' + target;

  if (!graph.allowSelfLoops && source === target) throw new _errors.UsageGraphError('Graph.' + name + ': source & target are the same ("' + source + '"), thus creating a loop explicitly forbidden by this graph \'allowSelfLoops\' option set to false.');

  var sourceData = graph._nodes.get(source),
      targetData = graph._nodes.get(target);

  if (!sourceData) throw new _errors.NotFoundGraphError('Graph.' + name + ': source node "' + source + '" not found.');

  if (!targetData) throw new _errors.NotFoundGraphError('Graph.' + name + ': target node "' + target + '" not found.');

  // Protecting the attributes
  attributes = (0, _utils.assign)({}, graph._options.defaultEdgeAttributes, attributes);

  // Must the graph generate an id for this edge?
  var eventData = {
    key: null,
    undirected: undirected,
    source: source,
    target: target,
    attributes: attributes
  };

  if (mustGenerateKey) edge = graph._edgeKeyGenerator(eventData);

  // Coercion of edge key
  edge = '' + edge;

  // Here, we have a key collision
  if (graph._edges.has(edge)) throw new _errors.UsageGraphError('Graph.' + name + ': the "' + edge + '" edge already exists in the graph.');

  // Here, we might have a source / target collision
  if (!graph.multi && (undirected ? typeof sourceData.undirected[target] !== 'undefined' : typeof sourceData.out[target] !== 'undefined')) {
    throw new _errors.UsageGraphError('Graph.' + name + ': an edge linking "' + source + '" to "' + target + '" already exists. If you really want to add multiple edges linking those nodes, you should create a multi graph by using the \'multi\' option.');
  }

  // Storing some data
  var DataClass = undirected ? _data.UndirectedEdgeData : _data.DirectedEdgeData;

  var data = new DataClass(mustGenerateKey, source, target, attributes);

  // Adding the edge to the internal register
  graph._edges.set(edge, data);

  // Incrementing node degree counters
  if (source === target) {
    if (undirected) sourceData.undirectedSelfLoops++;else sourceData.directedSelfLoops++;
  } else {
    if (undirected) {
      sourceData.undirectedDegree++;
      targetData.undirectedDegree++;
    } else {
      sourceData.outDegree++;
      targetData.inDegree++;
    }
  }

  // Updating relevant index
  (0, _indices.updateStructureIndex)(graph, undirected, edge, source, target, sourceData, targetData);

  // Emitting
  eventData.key = edge;

  graph.emit('edgeAdded', eventData);

  return edge;
}

/**
 * Internal method used to add an arbitrary edge to the given graph.
 *
 * @param  {Graph}   graph           - Target graph.
 * @param  {string}  name            - Name of the child method for errors.
 * @param  {boolean} mustGenerateKey - Should the graph generate an id?
 * @param  {boolean} undirected      - Whether the edge is undirected.
 * @param  {any}     edge            - The edge's key.
 * @param  {any}     source          - The source node.
 * @param  {any}     target          - The target node.
 * @param  {object}  [attributes]    - Optional attributes.
 * @return {any}                     - The edge.
 *
 * @throws {Error} - Will throw if the graph is of the wrong type.
 * @throws {Error} - Will throw if the given attributes are not an object.
 * @throws {Error} - Will throw if source or target doesn't exist.
 * @throws {Error} - Will throw if the edge already exist.
 */
function mergeEdge(graph, name, mustGenerateKey, undirected, edge, source, target, attributes) {

  // Checking validity of operation
  if (!undirected && graph.type === 'undirected') throw new _errors.UsageGraphError('Graph.' + name + ': you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead.');

  if (undirected && graph.type === 'directed') throw new _errors.UsageGraphError('Graph.' + name + ': you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead.');

  if (attributes && !(0, _utils.isPlainObject)(attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.' + name + ': invalid attributes. Expecting an object but got "' + attributes + '"');

  // Coercion of source & target:
  source = '' + source;
  target = '' + target;

  if (!graph.allowSelfLoops && source === target) throw new _errors.UsageGraphError('Graph.' + name + ': source & target are the same ("' + source + '"), thus creating a loop explicitly forbidden by this graph \'allowSelfLoops\' option set to false.');

  var sourceData = graph._nodes.get(source),
      targetData = graph._nodes.get(target),
      edgeData = void 0;

  // Do we need to handle duplicate?
  var alreadyExistingEdge = null;

  if (!mustGenerateKey) {
    edgeData = graph._edges.get(edge);

    if (edgeData) {

      // Here, we need to ensure, if the user gave a key, that source & target
      // are coherent
      if (edgeData.source !== source || edgeData.target !== target || undirected && (edgeData.source !== target || edgeData.target !== source)) {
        throw new _errors.UsageGraphError('Graph.' + name + ': inconsistency detected when attempting to merge the "' + edge + '" edge with "' + source + '" source & "' + target + '" target vs. (' + edgeData.source + ', ' + edgeData.target + ').');
      }

      alreadyExistingEdge = edge;
    }
  }

  // Here, we might have a source / target collision
  if (!alreadyExistingEdge && !graph.multi && sourceData && (undirected ? typeof sourceData.undirected[target] !== 'undefined' : typeof sourceData.out[target] !== 'undefined')) {
    alreadyExistingEdge = (0, _utils.getMatchingEdge)(graph, source, target, undirected ? 'undirected' : 'directed');
  }

  // Handling duplicates
  if (alreadyExistingEdge) {

    // We can skip the attribute merging part if the user did not provide them
    if (!attributes) return alreadyExistingEdge;

    if (!edgeData) edgeData = graph._edges.get(alreadyExistingEdge);

    // Merging the attributes
    (0, _utils.assign)(edgeData.attributes, attributes);
    return alreadyExistingEdge;
  }

  // Protecting the attributes
  attributes = (0, _utils.assign)({}, graph._options.defaultEdgeAttributes, attributes);

  // Must the graph generate an id for this edge?
  var eventData = {
    key: null,
    undirected: undirected,
    source: source,
    target: target,
    attributes: attributes
  };

  if (mustGenerateKey) edge = graph._edgeKeyGenerator(eventData);

  // Coercion of edge key
  edge = '' + edge;

  // Here, we have a key collision
  if (graph._edges.has(edge)) throw new _errors.UsageGraphError('Graph.' + name + ': the "' + edge + '" edge already exists in the graph.');

  if (!sourceData) {
    graph.addNode(source);
    sourceData = graph._nodes.get(source);
  }
  if (!targetData) {
    graph.addNode(target);
    targetData = graph._nodes.get(target);
  }

  // Storing some data
  var DataClass = undirected ? _data.UndirectedEdgeData : _data.DirectedEdgeData;

  var data = new DataClass(mustGenerateKey, source, target, attributes);

  // Adding the edge to the internal register
  graph._edges.set(edge, data);

  // Incrementing node degree counters
  if (source === target) {
    if (undirected) sourceData.undirectedSelfLoops++;else sourceData.directedSelfLoops++;
  } else {
    if (undirected) {
      sourceData.undirectedDegree++;
      targetData.undirectedDegree++;
    } else {
      sourceData.outDegree++;
      targetData.inDegree++;
    }
  }

  // Updating relevant index
  (0, _indices.updateStructureIndex)(graph, undirected, edge, source, target, sourceData, targetData);

  // Emitting
  eventData.key = edge;

  graph.emit('edgeAdded', eventData);

  return edge;
}

/**
 * Internal method abstracting edges export.
 *
 * @param  {Graph}    graph     - Target graph.
 * @param  {string}   name      - Child method name.
 * @param  {function} predicate - Predicate to filter the bunch's edges.
 * @param  {mixed}    [bunch]   - Target edges.
 * @return {array[]}            - The serialized edges.
 *
 * @throws {Error} - Will throw if any of the edges is not found.
 */
function _exportEdges(graph, name, predicate, bunch) {
  var edges = [];

  if (!bunch) {

    // Exporting every edges of the given type
    if (name === 'exportEdges') edges = graph.edges();else if (name === 'exportDirectedEdges') edges = graph.directedEdges();else edges = graph.undirectedEdges();
  } else {

    // Exporting the bunch
    if (!(0, _utils.isBunch)(bunch)) throw new _errors.InvalidArgumentsGraphError('Graph.' + name + ': invalid bunch.');

    (0, _utils.overBunch)(bunch, function (edge) {
      if (!graph.hasEdge(edge)) throw new _errors.NotFoundGraphError('Graph.' + name + ': could not find the "' + edge + '" edge from the bunch in the graph.');

      if (!predicate || predicate(edge)) edges.push(edge);
    });
  }

  var serializedEdges = new Array(edges.length);

  for (var i = 0, l = edges.length; i < l; i++) {
    serializedEdges[i] = graph.exportEdge(edges[i]);
  }return serializedEdges;
}

/**
 * Graph class
 *
 * @constructor
 * @param  {object}  [options] - Options:
 * @param  {boolean}   [allowSelfLoops] - Allow self loops?
 * @param  {string}    [type]           - Type of the graph.
 * @param  {boolean}   [map]            - Allow references as keys?
 * @param  {boolean}   [multi]          - Allow parallel edges?
 *
 * @throws {Error} - Will throw if the arguments are not valid.
 */

var Graph = function (_EventEmitter) {
  _inherits(Graph, _EventEmitter);

  function Graph(options) {
    _classCallCheck(this, Graph);

    //-- Solving options
    var _this2 = _possibleConstructorReturn(this, _EventEmitter.call(this));

    options = (0, _utils.assign)({}, DEFAULTS, options);

    // Enforcing options validity
    if (options.edgeKeyGenerator && typeof options.edgeKeyGenerator !== 'function') throw new _errors.InvalidArgumentsGraphError('Graph.constructor: invalid \'edgeKeyGenerator\' option. Expecting a function but got "' + options.edgeKeyGenerator + '".');

    if (typeof options.multi !== 'boolean') throw new _errors.InvalidArgumentsGraphError('Graph.constructor: invalid \'multi\' option. Expecting a boolean but got "' + options.multi + '".');

    if (!TYPES.has(options.type)) throw new _errors.InvalidArgumentsGraphError('Graph.constructor: invalid \'type\' option. Should be one of "mixed", "directed" or "undirected" but got "' + options.type + '".');

    if (typeof options.allowSelfLoops !== 'boolean') throw new _errors.InvalidArgumentsGraphError('Graph.constructor: invalid \'allowSelfLoops\' option. Expecting a boolean but got "' + options.allowSelfLoops + '".');

    if (!(0, _utils.isPlainObject)(options.defaultEdgeAttributes)) throw new _errors.InvalidArgumentsGraphError('Graph.constructor: invalid \'defaultEdgeAttributes\' option. Expecting a plain object but got "' + options.defaultEdgeAttributes + '".');

    if (!(0, _utils.isPlainObject)(options.defaultNodeAttributes)) throw new _errors.InvalidArgumentsGraphError('Graph.constructor: invalid \'defaultNodeAttributes\' option. Expecting a plain object but got "' + options.defaultNodeAttributes + '".');

    //-- Private properties

    // Indexes
    (0, _utils.privateProperty)(_this2, '_attributes', {});
    (0, _utils.privateProperty)(_this2, '_nodes', new Map());
    (0, _utils.privateProperty)(_this2, '_edges', new Map());
    (0, _utils.privateProperty)(_this2, '_edgeKeyGenerator', options.edgeKeyGenerator || (0, _utils.incrementalId)());

    // Options
    (0, _utils.privateProperty)(_this2, '_options', options);

    // Emitter properties
    EMITTER_PROPS.forEach(function (prop) {
      return (0, _utils.privateProperty)(_this2, prop, _this2[prop]);
    });

    //-- Properties readers
    (0, _utils.readOnlyProperty)(_this2, 'order', function () {
      return _this2._nodes.size;
    });
    (0, _utils.readOnlyProperty)(_this2, 'size', function () {
      return _this2._edges.size;
    });
    (0, _utils.readOnlyProperty)(_this2, 'multi', _this2._options.multi);
    (0, _utils.readOnlyProperty)(_this2, 'type', _this2._options.type);
    (0, _utils.readOnlyProperty)(_this2, 'allowSelfLoops', _this2._options.allowSelfLoops);
    return _this2;
  }

  /**---------------------------------------------------------------------------
   * Read
   **---------------------------------------------------------------------------
   */

  /**
   * Method returning whether the given node is found in the graph.
   *
   * @param  {any}     node - The node.
   * @return {boolean}
   */


  Graph.prototype.hasNode = function hasNode(node) {
    return this._nodes.has('' + node);
  };

  /**
   * Method returning whether the given directed edge is found in the graph.
   *
   * Arity 1:
   * @param  {any}     edge - The edge's key.
   *
   * Arity 2:
   * @param  {any}     source - The edge's source.
   * @param  {any}     target - The edge's target.
   *
   * @return {boolean}
   *
   * @throws {Error} - Will throw if the arguments are invalid.
   */


  Graph.prototype.hasDirectedEdge = function hasDirectedEdge(source, target) {

    // Early termination
    if (this.type === 'undirected') return false;

    if (arguments.length === 1) {
      var edge = '' + source;

      var edgeData = this._edges.get(edge);

      return !!edgeData && edgeData instanceof _data.DirectedEdgeData;
    } else if (arguments.length === 2) {

      source = '' + source;
      target = '' + target;

      // If the node source or the target is not in the graph we break
      var nodeData = this._nodes.get(source);

      if (!nodeData) return false;

      // Is there a directed edge pointing toward target?
      var edges = nodeData.out[target];

      if (!edges) return false;

      return this.multi ? !!edges.size : true;
    }

    throw new _errors.InvalidArgumentsGraphError('Graph.hasDirectedEdge: invalid arity (' + arguments.length + ', instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.');
  };

  /**
   * Method returning whether the given undirected edge is found in the graph.
   *
   * Arity 1:
   * @param  {any}     edge - The edge's key.
   *
   * Arity 2:
   * @param  {any}     source - The edge's source.
   * @param  {any}     target - The edge's target.
   *
   * @return {boolean}
   *
   * @throws {Error} - Will throw if the arguments are invalid.
   */


  Graph.prototype.hasUndirectedEdge = function hasUndirectedEdge(source, target) {

    // Early termination
    if (this.type === 'directed') return false;

    if (arguments.length === 1) {
      var edge = '' + source;

      var edgeData = this._edges.get(edge);

      return !!edgeData && edgeData instanceof _data.UndirectedEdgeData;
    } else if (arguments.length === 2) {

      source = '' + source;
      target = '' + target;

      // If the node source or the target is not in the graph we break
      var nodeData = this._nodes.get(source);

      if (!nodeData) return false;

      // Is there a directed edge pointing toward target?
      var edges = nodeData.undirected[target];

      if (!edges) return false;

      return this.multi ? !!edges.size : true;
    }

    throw new _errors.InvalidArgumentsGraphError('Graph.hasDirectedEdge: invalid arity (' + arguments.length + ', instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.');
  };

  /**
   * Method returning whether the given edge is found in the graph.
   *
   * Arity 1:
   * @param  {any}     edge - The edge's key.
   *
   * Arity 2:
   * @param  {any}     source - The edge's source.
   * @param  {any}     target - The edge's target.
   *
   * @return {boolean}
   *
   * @throws {Error} - Will throw if the arguments are invalid.
   */


  Graph.prototype.hasEdge = function hasEdge(source, target) {

    if (arguments.length === 1) {
      var edge = '' + source;

      return this._edges.has(edge);
    } else if (arguments.length === 2) {

      source = '' + source;
      target = '' + target;

      // If the node source or the target is not in the graph we break
      var nodeData = this._nodes.get(source);

      if (!nodeData) return false;

      // Is there a directed edge pointing toward target?
      var edges = typeof nodeData.out !== 'undefined' && nodeData.out[target];

      if (!edges) edges = typeof nodeData.undirected !== 'undefined' && nodeData.undirected[target];

      if (!edges) return false;

      return this.multi ? !!edges.size : true;
    }

    throw new _errors.InvalidArgumentsGraphError('Graph.hasEdge: invalid arity (' + arguments.length + ', instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.');
  };

  /**
   * Method returning the edge matching source & target in a directed fashion.
   *
   * @param  {any} source - The edge's source.
   * @param  {any} target - The edge's target.
   *
   * @return {any|undefined}
   *
   * @throws {Error} - Will throw if the graph is multi.
   * @throws {Error} - Will throw if source or target doesn't exist.
   */


  Graph.prototype.directedEdge = function directedEdge(source, target) {

    if (this.type === 'undirected') return;

    source = '' + source;
    target = '' + target;

    if (this.multi) throw new _errors.UsageGraphError('Graph.directedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.directedEdges instead.');

    var sourceData = this._nodes.get(source);

    if (!sourceData) throw new _errors.NotFoundGraphError('Graph.directedEdge: could not find the "' + source + '" source node in the graph.');

    if (!this._nodes.has(target)) throw new _errors.NotFoundGraphError('Graph.directedEdge: could not find the "' + target + '" target node in the graph.');

    return sourceData.out && sourceData.out[target] || undefined;
  };

  /**
   * Method returning the edge matching source & target in a undirected fashion.
   *
   * @param  {any} source - The edge's source.
   * @param  {any} target - The edge's target.
   *
   * @return {any|undefined}
   *
   * @throws {Error} - Will throw if the graph is multi.
   * @throws {Error} - Will throw if source or target doesn't exist.
   */


  Graph.prototype.undirectedEdge = function undirectedEdge(source, target) {

    if (this.type === 'directed') return;

    source = '' + source;
    target = '' + target;

    if (this.multi) throw new _errors.UsageGraphError('Graph.undirectedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.undirectedEdges instead.');

    var sourceData = this._nodes.get(source);

    if (!sourceData) throw new _errors.NotFoundGraphError('Graph.undirectedEdge: could not find the "' + source + '" source node in the graph.');

    if (!this._nodes.has(target)) throw new _errors.NotFoundGraphError('Graph.undirectedEdge: could not find the "' + target + '" target node in the graph.');

    return sourceData.undirected && sourceData.undirected[target] || undefined;
  };

  /**
   * Method returning the edge matching source & target in a mixed fashion.
   *
   * @param  {any} source - The edge's source.
   * @param  {any} target - The edge's target.
   *
   * @return {any|undefined}
   *
   * @throws {Error} - Will throw if the graph is multi.
   * @throws {Error} - Will throw if source or target doesn't exist.
   */


  Graph.prototype.edge = function edge(source, target) {
    if (this.multi) throw new _errors.UsageGraphError('Graph.edge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.edges instead.');

    source = '' + source;
    target = '' + target;

    var sourceData = this._nodes.get(source);

    if (!sourceData) throw new _errors.NotFoundGraphError('Graph.edge: could not find the "' + source + '" source node in the graph.');

    if (!this._nodes.has(target)) throw new _errors.NotFoundGraphError('Graph.edge: could not find the "' + target + '" target node in the graph.');

    return sourceData.out && sourceData.out[target] || sourceData.undirected && sourceData.undirected[target] || undefined;
  };

  /**
   * Method returning the given node's in degree.
   *
   * @param  {any}     node      - The node's key.
   * @param  {boolean} allowSelfLoops - Count self-loops?
   * @return {number}            - The node's in degree.
   *
   * @throws {Error} - Will throw if the selfLoops arg is not boolean.
   * @throws {Error} - Will throw if the node isn't in the graph.
   */


  Graph.prototype.inDegree = function inDegree(node) {
    var selfLoops = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (typeof selfLoops !== 'boolean') throw new _errors.InvalidArgumentsGraphError('Graph.inDegree: Expecting a boolean but got "' + selfLoops + '" for the second parameter (allowing self-loops to be counted).');

    node = '' + node;

    var nodeData = this._nodes.get(node);

    if (!nodeData) throw new _errors.NotFoundGraphError('Graph.inDegree: could not find the "' + node + '" node in the graph.');

    if (this.type === 'undirected') return 0;

    var loops = selfLoops ? nodeData.directedSelfLoops : 0;

    return nodeData.inDegree + loops;
  };

  /**
   * Method returning the given node's out degree.
   *
   * @param  {any}     node      - The node's key.
   * @param  {boolean} selfLoops - Count self-loops?
   * @return {number}            - The node's out degree.
   *
   * @throws {Error} - Will throw if the selfLoops arg is not boolean.
   * @throws {Error} - Will throw if the node isn't in the graph.
   */


  Graph.prototype.outDegree = function outDegree(node) {
    var selfLoops = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (typeof selfLoops !== 'boolean') throw new _errors.InvalidArgumentsGraphError('Graph.outDegree: Expecting a boolean but got "' + selfLoops + '" for the second parameter (allowing self-loops to be counted).');

    node = '' + node;

    var nodeData = this._nodes.get(node);

    if (!nodeData) throw new _errors.NotFoundGraphError('Graph.outDegree: could not find the "' + node + '" node in the graph.');

    if (this.type === 'undirected') return 0;

    var loops = selfLoops ? nodeData.directedSelfLoops : 0;

    return nodeData.outDegree + loops;
  };

  /**
   * Method returning the given node's directed degree.
   *
   * @param  {any}     node      - The node's key.
   * @param  {boolean} selfLoops - Count self-loops?
   * @return {number}            - The node's directed degree.
   *
   * @throws {Error} - Will throw if the selfLoops arg is not boolean.
   * @throws {Error} - Will throw if the node isn't in the graph.
   */


  Graph.prototype.directedDegree = function directedDegree(node) {
    var selfLoops = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (typeof selfLoops !== 'boolean') throw new _errors.InvalidArgumentsGraphError('Graph.directedDegree: Expecting a boolean but got "' + selfLoops + '" for the second parameter (allowing self-loops to be counted).');

    node = '' + node;

    if (!this.hasNode(node)) throw new _errors.NotFoundGraphError('Graph.directedDegree: could not find the "' + node + '" node in the graph.');

    if (this.type === 'undirected') return 0;

    return this.inDegree(node, selfLoops) + this.outDegree(node, selfLoops);
  };

  /**
   * Method returning the given node's undirected degree.
   *
   * @param  {any}     node      - The node's key.
   * @param  {boolean} selfLoops - Count self-loops?
   * @return {number}            - The node's undirected degree.
   *
   * @throws {Error} - Will throw if the selfLoops arg is not boolean.
   * @throws {Error} - Will throw if the node isn't in the graph.
   */


  Graph.prototype.undirectedDegree = function undirectedDegree(node) {
    var selfLoops = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (typeof selfLoops !== 'boolean') throw new _errors.InvalidArgumentsGraphError('Graph.undirectedDegree: Expecting a boolean but got "' + selfLoops + '" for the second parameter (allowing self-loops to be counted).');

    node = '' + node;

    if (!this.hasNode(node)) throw new _errors.NotFoundGraphError('Graph.undirectedDegree: could not find the "' + node + '" node in the graph.');

    if (this.type === 'directed') return 0;

    var data = this._nodes.get(node),
        loops = selfLoops ? data.undirectedSelfLoops * 2 : 0;

    return data.undirectedDegree + loops;
  };

  /**
   * Method returning the given node's degree.
   *
   * @param  {any}     node      - The node's key.
   * @param  {boolean} selfLoops - Count self-loops?
   * @return {number}            - The node's degree.
   *
   * @throws {Error} - Will throw if the selfLoops arg is not boolean.
   * @throws {Error} - Will throw if the node isn't in the graph.
   */


  Graph.prototype.degree = function degree(node) {
    var selfLoops = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (typeof selfLoops !== 'boolean') throw new _errors.InvalidArgumentsGraphError('Graph.degree: Expecting a boolean but got "' + selfLoops + '" for the second parameter (allowing self-loops to be counted).');

    node = '' + node;

    if (!this.hasNode(node)) throw new _errors.NotFoundGraphError('Graph.degree: could not find the "' + node + '" node in the graph.');

    var degree = 0;

    if (this.type !== 'undirected') degree += this.directedDegree(node, selfLoops);

    if (this.type !== 'directed') degree += this.undirectedDegree(node, selfLoops);

    return degree;
  };

  /**
   * Method returning the given edge's source.
   *
   * @param  {any} edge - The edge's key.
   * @return {any}      - The edge's source.
   *
   * @throws {Error} - Will throw if the edge isn't in the graph.
   */


  Graph.prototype.source = function source(edge) {
    edge = '' + edge;

    var data = this._edges.get(edge);

    if (!data) throw new _errors.NotFoundGraphError('Graph.source: could not find the "' + edge + '" edge in the graph.');

    return data.source;
  };

  /**
   * Method returning the given edge's target.
   *
   * @param  {any} edge - The edge's key.
   * @return {any}      - The edge's target.
   *
   * @throws {Error} - Will throw if the edge isn't in the graph.
   */


  Graph.prototype.target = function target(edge) {
    edge = '' + edge;

    var data = this._edges.get(edge);

    if (!data) throw new _errors.NotFoundGraphError('Graph.target: could not find the "' + edge + '" edge in the graph.');

    return data.target;
  };

  /**
   * Method returning the given edge's extremities.
   *
   * @param  {any}   edge - The edge's key.
   * @return {array}      - The edge's extremities.
   *
   * @throws {Error} - Will throw if the edge isn't in the graph.
   */


  Graph.prototype.extremities = function extremities(edge) {
    edge = '' + edge;

    var edgeData = this._edges.get(edge);

    if (!edgeData) throw new _errors.NotFoundGraphError('Graph.extremities: could not find the "' + edge + '" edge in the graph.');

    return [edgeData.source, edgeData.target];
  };

  /**
   * Given a node & an edge, returns the other extremity of the edge.
   *
   * @param  {any}   node - The node's key.
   * @param  {any}   edge - The edge's key.
   * @return {any}        - The related node.
   *
   * @throws {Error} - Will throw if either the node or the edge isn't in the graph.
   */


  Graph.prototype.opposite = function opposite(node, edge) {
    node = '' + node;
    edge = '' + edge;

    if (!this._nodes.has(node)) throw new _errors.NotFoundGraphError('Graph.opposite: could not find the "' + node + '" node in the graph.');

    var data = this._edges.get(edge);

    if (!data) throw new _errors.NotFoundGraphError('Graph.opposite: could not find the "' + edge + '" edge in the graph.');

    var source = data.source,
        target = data.target;


    if (node !== source && node !== target) throw new _errors.NotFoundGraphError('Graph.opposite: the "' + node + '" node is not attached to the "' + edge + '" edge (' + source + ', ' + target + ').');

    return node === source ? target : source;
  };

  /**
   * Method returning whether the given edge is undirected.
   *
   * @param  {any}     edge - The edge's key.
   * @return {boolean}
   *
   * @throws {Error} - Will throw if the edge isn't in the graph.
   */


  Graph.prototype.undirected = function undirected(edge) {
    edge = '' + edge;

    var data = this._edges.get(edge);

    if (!data) throw new _errors.NotFoundGraphError('Graph.undirected: could not find the "' + edge + '" edge in the graph.');

    return data instanceof _data.UndirectedEdgeData;
  };

  /**
   * Method returning whether the given edge is directed.
   *
   * @param  {any}     edge - The edge's key.
   * @return {boolean}
   *
   * @throws {Error} - Will throw if the edge isn't in the graph.
   */


  Graph.prototype.directed = function directed(edge) {
    edge = '' + edge;

    var data = this._edges.get(edge);

    if (!data) throw new _errors.NotFoundGraphError('Graph.directed: could not find the "' + edge + '" edge in the graph.');

    return data instanceof _data.DirectedEdgeData;
  };

  /**
   * Method returning whether the given edge is a self loop.
   *
   * @param  {any}     edge - The edge's key.
   * @return {boolean}
   *
   * @throws {Error} - Will throw if the edge isn't in the graph.
   */


  Graph.prototype.selfLoop = function selfLoop(edge) {
    edge = '' + edge;

    var data = this._edges.get(edge);

    if (!data) throw new _errors.NotFoundGraphError('Graph.selfLoop: could not find the "' + edge + '" edge in the graph.');

    return data.source === data.target;
  };

  /**---------------------------------------------------------------------------
   * Mutation
   **---------------------------------------------------------------------------
   */

  /**
   * Method used to add a node to the graph.
   *
   * @param  {any}    node         - The node.
   * @param  {object} [attributes] - Optional attributes.
   * @return {any}                 - The node.
   *
   * @throws {Error} - Will throw if the given node already exist.
   * @throws {Error} - Will throw if the given attributes are not an object.
   */


  Graph.prototype.addNode = function addNode(node, attributes) {
    if (attributes && !(0, _utils.isPlainObject)(attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.addNode: invalid attributes. Expecting an object but got "' + attributes + '"');

    // String coercion
    node = '' + node;

    if (this._nodes.has(node)) throw new _errors.UsageGraphError('Graph.addNode: the "' + node + '" node already exist in the graph.');

    // Protecting the attributes
    attributes = (0, _utils.assign)({}, this._options.defaultNodeAttributes, attributes);

    var DataClass = this.type === 'mixed' ? _data.MixedNodeData : this.type === 'directed' ? _data.DirectedNodeData : _data.UndirectedNodeData;

    var data = new DataClass(attributes);

    // Adding the node to internal register
    this._nodes.set(node, data);

    // Emitting
    this.emit('nodeAdded', {
      key: node,
      attributes: attributes
    });

    return node;
  };

  /**
   * Method used to merge a node into the graph.
   *
   * @param  {any}    node         - The node.
   * @param  {object} [attributes] - Optional attributes.
   * @return {any}                 - The node.
   */


  Graph.prototype.mergeNode = function mergeNode(node, attributes) {

    // If the node already exists, we merge the attributes
    var data = this._nodes.get(node);

    if (data) {
      if (attributes) (0, _utils.assign)(data.attributes, attributes);
      return node;
    }

    // Else, we create it
    return this.addNode(node, attributes);
  };

  /**
   * Method used to add a nodes from a bunch.
   *
   * @param  {bunch}  bunch - The node.
   * @return {Graph}        - Returns itself for chaining.
   *
   * @throws {Error} - Will throw if the given bunch is not valid.
   */


  Graph.prototype.addNodesFrom = function addNodesFrom(bunch) {
    var _this3 = this;

    if (!(0, _utils.isBunch)(bunch)) throw new _errors.InvalidArgumentsGraphError('Graph.addNodesFrom: invalid bunch provided ("' + bunch + '").');

    (0, _utils.overBunch)(bunch, function (node, attributes) {
      _this3.addNode(node, attributes);
    });

    return this;
  };

  /**
   * Method used to drop a single node & all its attached edges from the graph.
   *
   * @param  {any}    node - The node.
   * @return {Graph}
   *
   * @throws {Error} - Will throw if the node doesn't exist.
   */


  Graph.prototype.dropNode = function dropNode(node) {
    node = '' + node;

    if (!this.hasNode(node)) throw new _errors.NotFoundGraphError('Graph.dropNode: could not find the "' + node + '" node in the graph.');

    // Removing attached edges
    var edges = this.edges(node);

    // NOTE: we could go faster here
    for (var i = 0, l = edges.length; i < l; i++) {
      this.dropEdge(edges[i]);
    }var data = this._nodes.get(node);

    // Dropping the node from the register
    this._nodes.delete(node);

    // Emitting
    this.emit('nodeDropped', {
      key: node,
      attributes: data.attributes
    });
  };

  /**
   * Method used to drop a single edge from the graph.
   *
   * Arity 1:
   * @param  {any}    edge - The edge.
   *
   * Arity 2:
   * @param  {any}    source - Source node.
   * @param  {any}    target - Target node.
   *
   * @return {Graph}
   *
   * @throws {Error} - Will throw if the edge doesn't exist.
   */


  Graph.prototype.dropEdge = function dropEdge(edge) {
    if (arguments.length > 1) {
      var _source = '' + arguments[0],
          _target = '' + arguments[1];

      if (!this.hasNode(_source)) throw new _errors.NotFoundGraphError('Graph.dropEdge: could not find the "' + _source + '" source node in the graph.');

      if (!this.hasNode(_target)) throw new _errors.NotFoundGraphError('Graph.dropEdge: could not find the "' + _target + '" target node in the graph.');

      if (!this.hasEdge(_source, _target)) throw new _errors.NotFoundGraphError('Graph.dropEdge: could not find the "' + _source + '" -> "' + _target + '" edge in the graph.');

      edge = (0, _utils.getMatchingEdge)(this, _source, _target, this.type);
    } else {
      edge = '' + edge;

      if (!this.hasEdge(edge)) throw new _errors.NotFoundGraphError('Graph.dropEdge: could not find the "' + edge + '" edge in the graph.');
    }

    var data = this._edges.get(edge);

    // Dropping the edge from the register
    this._edges.delete(edge);

    // Updating related degrees
    var source = data.source,
        target = data.target,
        attributes = data.attributes;


    var undirected = data instanceof _data.UndirectedEdgeData;

    var sourceData = this._nodes.get(source),
        targetData = this._nodes.get(target);

    if (source === target) {
      sourceData.selfLoops--;
    } else {
      if (undirected) {
        sourceData.undirectedDegree--;
        targetData.undirectedDegree--;
      } else {
        sourceData.outDegree--;
        targetData.inDegree--;
      }
    }

    // Clearing index
    (0, _indices.clearEdgeFromStructureIndex)(this, undirected, edge, data);

    // Emitting
    this.emit('edgeDropped', {
      key: edge,
      attributes: attributes,
      source: source,
      target: target,
      undirected: undirected
    });

    return this;
  };

  /**
   * Method used to drop a bunch of nodes or every node from the graph.
   *
   * @param  {bunch} nodes - Bunch of nodes.
   * @return {Graph}
   *
   * @throws {Error} - Will throw if an invalid bunch is provided.
   * @throws {Error} - Will throw if any of the nodes doesn't exist.
   */


  Graph.prototype.dropNodes = function dropNodes(nodes) {
    var _this4 = this;

    if (!arguments.length) return this.clear();

    if (!(0, _utils.isBunch)(nodes)) throw new _errors.InvalidArgumentsGraphError('Graph.dropNodes: invalid bunch.');

    (0, _utils.overBunch)(nodes, function (node) {
      _this4.dropNode(node);
    });

    return this;
  };

  /**
   * Method used to drop a bunch of edges or every edges from the graph.
   *
   * Arity 1:
   * @param  {bunch} edges - Bunch of edges.
   *
   * Arity 2:
   * @param  {any}    source - Source node.
   * @param  {any}    target - Target node.
   *
   * @return {Graph}
   *
   * @throws {Error} - Will throw if an invalid bunch is provided.
   * @throws {Error} - Will throw if any of the edges doesn't exist.
   */


  Graph.prototype.dropEdges = function dropEdges(edges) {
    var _this5 = this;

    if (!arguments.length) {

      // Dropping every edge from the graph
      this._edges.clear();

      // Without edges, we've got no 'structure'
      this.clearIndex();

      return this;
    }

    if (arguments.length === 2) {
      var source = arguments[0],
          target = arguments[1];

      edges = this.edges(source, target);
    }

    if (!(0, _utils.isBunch)(edges)) throw new _errors.InvalidArgumentsGraphError('Graph.dropEdges: invalid bunch.');

    (0, _utils.overBunch)(edges, function (edge) {
      _this5.dropEdge(edge);
    });

    return this;
  };

  /**
   * Method used to remove every edge & every node from the graph.
   *
   * @return {Graph}
   */


  Graph.prototype.clear = function clear() {

    // Dropping edges
    this._edges.clear();

    // Dropping nodes
    this._nodes.clear();

    // Handling indices
    for (var name in this._indices) {
      var index = this._indices[name];

      if (index.lazy) index.computed = false;
    }

    // Emitting
    this.emit('cleared');
  };

  /**---------------------------------------------------------------------------
   * Attributes-related methods
   **---------------------------------------------------------------------------
   */

  /**
   * Method returning the desired graph's attribute.
   *
   * @param  {string} name - Name of the attribute.
   * @return {any}
   */


  Graph.prototype.getAttribute = function getAttribute(name) {
    return this._attributes[name];
  };

  /**
   * Method returning the graph's attributes.
   *
   * @return {object}
   */


  Graph.prototype.getAttributes = function getAttributes() {
    return this._attributes;
  };

  /**
   * Method returning whether the graph has the desired attribute.
   *
   * @param  {string}  name - Name of the attribute.
   * @return {boolean}
   */


  Graph.prototype.hasAttribute = function hasAttribute(name) {
    return this._attributes.hasOwnProperty(name);
  };

  /**
   * Method setting a value for the desired graph's attribute.
   *
   * @param  {string}  name  - Name of the attribute.
   * @param  {any}     value - Value for the attribute.
   * @return {Graph}
   */


  Graph.prototype.setAttribute = function setAttribute(name, value) {
    this._attributes[name] = value;

    // Emitting
    this.emit('attributesUpdated', {
      type: 'set',
      meta: {
        name: name,
        value: value
      }
    });

    return this;
  };

  /**
   * Method using a function to update the desired graph's attribute's value.
   *
   * @param  {string}   name    - Name of the attribute.
   * @param  {function} updater - Function use to update the attribute's value.
   * @return {Graph}
   */


  Graph.prototype.updateAttribute = function updateAttribute(name, updater) {
    if (typeof updater !== 'function') throw new _errors.InvalidArgumentsGraphError('Graph.updateAttribute: updater should be a function.');

    this._attributes[name] = updater(this._attributes[name]);

    // Emitting
    this.emit('attributesUpdated', {
      type: 'set',
      meta: {
        name: name,
        value: this._attributes[name]
      }
    });

    return this;
  };

  /**
   * Method removing the desired graph's attribute.
   *
   * @param  {string} name  - Name of the attribute.
   * @return {Graph}
   */


  Graph.prototype.removeAttribute = function removeAttribute(name) {
    delete this._attributes[name];

    // Emitting
    this.emit('attributesUpdated', {
      type: 'remove',
      meta: {
        name: name
      }
    });

    return this;
  };

  /**
   * Method replacing the graph's attributes.
   *
   * @param  {object} attributes - New attributes.
   * @return {Graph}
   *
   * @throws {Error} - Will throw if given attributes are not a plain object.
   */


  Graph.prototype.replaceAttributes = function replaceAttributes(attributes) {
    if (!(0, _utils.isPlainObject)(attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.replaceAttributes: provided attributes are not a plain object.');

    var before = this._attributes;

    this._attributes = attributes;

    // Emitting
    this.emit('attributesUpdated', {
      type: 'replace',
      meta: {
        before: before,
        after: attributes
      }
    });

    return this;
  };

  /**
   * Method merging the graph's attributes.
   *
   * @param  {object} attributes - Attributes to merge.
   * @return {Graph}
   *
   * @throws {Error} - Will throw if given attributes are not a plain object.
   */


  Graph.prototype.mergeAttributes = function mergeAttributes(attributes) {
    if (!(0, _utils.isPlainObject)(attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.mergeAttributes: provided attributes are not a plain object.');

    this._attributes = (0, _utils.assign)(this._attributes, attributes);

    // Emitting
    this.emit('attributesUpdated', {
      type: 'merge',
      meta: {
        data: this._attributes
      }
    });

    return this;
  };

  /**
   * Method returning the desired attribute for the given node.
   *
   * @param  {any}    node - Target node.
   * @param  {string} name - Name of the attribute to get.
   * @return {any}
   *
   * @throws {Error} - Will throw if the node is not found.
   */


  Graph.prototype.getNodeAttribute = function getNodeAttribute(node, name) {
    node = '' + node;

    var data = this._nodes.get(node);

    if (!data) throw new _errors.NotFoundGraphError('Graph.getNodeAttribute: could not find the "' + node + '" node in the graph.');

    return data.attributes[name];
  };

  /**
   * Method returning the attributes for the given node.
   *
   * @param  {any}    node - Target node.
   * @return {object}
   *
   * @throws {Error} - Will throw if the node is not found.
   */


  Graph.prototype.getNodeAttributes = function getNodeAttributes(node) {
    node = '' + node;

    var data = this._nodes.get(node);

    if (!data) throw new _errors.NotFoundGraphError('Graph.getNodeAttributes: could not find the "' + node + '" node in the graph.');

    return data.attributes;
  };

  /**
   * Method checking whether the given attribute exists for the given node.
   *
   * @param  {any}    node - Target node.
   * @param  {string} name - Name of the attribute to check.
   * @return {boolean}
   *
   * @throws {Error} - Will throw if the node is not found.
   */


  Graph.prototype.hasNodeAttribute = function hasNodeAttribute(node, name) {
    node = '' + node;

    var data = this._nodes.get(node);

    if (!data) throw new _errors.NotFoundGraphError('Graph.hasNodeAttribute: could not find the "' + node + '" node in the graph.');

    return data.attributes.hasOwnProperty(name);
  };

  /**
   * Method checking setting the desired attribute for the given node.
   *
   * @param  {any}    node  - Target node.
   * @param  {string} name  - Name of the attribute to set.
   * @param  {any}    value - Value for the attribute.
   * @return {Graph}
   *
   * @throws {Error} - Will throw if less than 3 arguments are passed.
   * @throws {Error} - Will throw if the node is not found.
   */


  Graph.prototype.setNodeAttribute = function setNodeAttribute(node, name, value) {
    node = '' + node;

    var data = this._nodes.get(node);

    if (!data) throw new _errors.NotFoundGraphError('Graph.setNodeAttribute: could not find the "' + node + '" node in the graph.');

    if (arguments.length < 3) throw new _errors.InvalidArgumentsGraphError('Graph.setNodeAttribute: not enough arguments. Either you forgot to pass the attribute\'s name or value, or you meant to use #.replaceNodeAttributes / #.mergeNodeAttributes instead.');

    data.attributes[name] = value;

    // Emitting
    this.emit('nodeAttributesUpdated', {
      key: node,
      type: 'set',
      meta: {
        name: name,
        value: value
      }
    });

    return this;
  };

  /**
   * Method checking setting the desired attribute for the given node.
   *
   * @param  {any}      node    - Target node.
   * @param  {string}   name    - Name of the attribute to set.
   * @param  {function} updater - Function that will update the attribute.
   * @return {Graph}
   *
   * @throws {Error} - Will throw if less than 3 arguments are passed.
   * @throws {Error} - Will throw if updater is not a function.
   * @throws {Error} - Will throw if the node is not found.
   */


  Graph.prototype.updateNodeAttribute = function updateNodeAttribute(node, name, updater) {
    node = '' + node;

    var data = this._nodes.get(node);

    if (!data) throw new _errors.NotFoundGraphError('Graph.updateNodeAttribute: could not find the "' + node + '" node in the graph.');

    if (arguments.length < 3) throw new _errors.InvalidArgumentsGraphError('Graph.updateNodeAttribute: not enough arguments. Either you forgot to pass the attribute\'s name or updater, or you meant to use #.replaceNodeAttributes / #.mergeNodeAttributes instead.');

    if (typeof updater !== 'function') throw new _errors.InvalidArgumentsGraphError('Graph.updateAttribute: updater should be a function.');

    var attributes = data.attributes;

    attributes[name] = updater(attributes[name]);

    // Emitting
    this.emit('nodeAttributesUpdated', {
      key: node,
      type: 'set',
      meta: {
        name: name,
        value: attributes[name]
      }
    });

    return this;
  };

  /**
   * Method removing the desired attribute for the given node.
   *
   * @param  {any}    node  - Target node.
   * @param  {string} name  - Name of the attribute to remove.
   * @return {Graph}
   *
   * @throws {Error} - Will throw if the node is not found.
   */


  Graph.prototype.removeNodeAttribute = function removeNodeAttribute(node, name) {
    node = '' + node;

    var data = this._nodes.get(node);

    if (!data) throw new _errors.NotFoundGraphError('Graph.hasNodeAttribute: could not find the "' + node + '" node in the graph.');

    delete data.attributes[name];

    // Emitting
    this.emit('nodeAttributesUpdated', {
      key: node,
      type: 'remove',
      meta: {
        name: name
      }
    });

    return this;
  };

  /**
   * Method completely replacing the attributes of the given node.
   *
   * @param  {any}    node       - Target node.
   * @param  {object} attributes - New attributes.
   * @return {Graph}
   *
   * @throws {Error} - Will throw if the node is not found.
   * @throws {Error} - Will throw if the given attributes is not a plain object.
   */


  Graph.prototype.replaceNodeAttributes = function replaceNodeAttributes(node, attributes) {
    node = '' + node;

    var data = this._nodes.get(node);

    if (!data) throw new _errors.NotFoundGraphError('Graph.replaceNodeAttributes: could not find the "' + node + '" node in the graph.');

    if (!(0, _utils.isPlainObject)(attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.replaceNodeAttributes: provided attributes are not a plain object.');

    var oldAttributes = data.attributes;

    data.attributes = attributes;

    // Emitting
    this.emit('nodeAttributesUpdated', {
      key: node,
      type: 'replace',
      meta: {
        before: oldAttributes,
        after: attributes
      }
    });

    return this;
  };

  /**
   * Method merging the attributes of the given node with the provided ones.
   *
   * @param  {any}    node       - Target node.
   * @param  {object} attributes - Attributes to merge.
   * @return {Graph}
   *
   * @throws {Error} - Will throw if the node is not found.
   * @throws {Error} - Will throw if the given attributes is not a plain object.
   */


  Graph.prototype.mergeNodeAttributes = function mergeNodeAttributes(node, attributes) {
    node = '' + node;

    var data = this._nodes.get(node);

    if (!data) throw new _errors.NotFoundGraphError('Graph.mergeNodeAttributes: could not find the "' + node + '" node in the graph.');

    if (!(0, _utils.isPlainObject)(attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.mergeNodeAttributes: provided attributes are not a plain object.');

    (0, _utils.assign)(data.attributes, attributes);

    // Emitting
    this.emit('nodeAttributesUpdated', {
      key: node,
      type: 'merge',
      meta: {
        data: attributes
      }
    });

    return this;
  };

  /**---------------------------------------------------------------------------
   * Iteration-related methods
   **---------------------------------------------------------------------------
   */

  /**
   * Method returning the list of the graph's nodes.
   *
   * @return {array} - The nodes.
   */


  Graph.prototype.nodes = function nodes() {
    return (0, _consume2.default)(this._nodes.keys(), this._nodes.size);
  };

  /**
   * Method returning an iterator over the graph's nodes.
   *
   * @return {Iterator}
   */


  Graph.prototype.nodesIterator = function nodesIterator() {
    var iterator = this._nodes.keys();

    return new NodesIterator(iterator.next.bind(iterator));
  };

  /**---------------------------------------------------------------------------
   * Serialization
   **---------------------------------------------------------------------------
   */

  /**
   * Method exporting the target node.
   *
   * @param  {any}   node - Target node.
   * @return {array}      - The serialized node.
   *
   * @throws {Error} - Will throw if the node is not found.
   */


  Graph.prototype.exportNode = function exportNode(node) {
    node = '' + node;

    var data = this._nodes.get(node);

    if (!data) throw new _errors.NotFoundGraphError('Graph.exportNode: could not find the "' + node + '" node in the graph.');

    return (0, _serialization.serializeNode)(node, data);
  };

  /**
   * Method exporting the target edge.
   *
   * @param  {any}   edge - Target edge.
   * @return {array}      - The serialized edge.
   *
   * @throws {Error} - Will throw if the edge is not found.
   */


  Graph.prototype.exportEdge = function exportEdge(edge) {
    edge = '' + edge;

    var data = this._edges.get(edge);

    if (!data) throw new _errors.NotFoundGraphError('Graph.exportEdge: could not find the "' + edge + '" edge in the graph.');

    return (0, _serialization.serializeEdge)(edge, data);
  };

  /**
   * Method exporting every nodes or the bunch ones.
   *
   * @param  {mixed}   [bunch] - Target nodes.
   * @return {array[]}         - The serialized nodes.
   *
   * @throws {Error} - Will throw if any of the nodes is not found.
   */


  Graph.prototype.exportNodes = function exportNodes(bunch) {
    var _this6 = this;

    var nodes = [];

    if (!arguments.length) {

      // Exporting every node
      nodes = this.nodes();
    } else {

      // Exporting the bunch
      if (!(0, _utils.isBunch)(bunch)) throw new _errors.InvalidArgumentsGraphError('Graph.exportNodes: invalid bunch.');

      (0, _utils.overBunch)(bunch, function (node) {
        if (!_this6.hasNode(node)) throw new _errors.NotFoundGraphError('Graph.exportNodes: could not find the "' + node + '" node from the bunch in the graph.');
        nodes.push(node);
      });
    }

    var serializedNodes = new Array(nodes.length);

    for (var i = 0, l = nodes.length; i < l; i++) {
      serializedNodes[i] = this.exportNode(nodes[i]);
    }return serializedNodes;
  };

  /**
   * Method exporting every edges or the bunch ones.
   *
   * @param  {mixed}   [bunch] - Target edges.
   * @return {array[]}         - The serialized edges.
   *
   * @throws {Error} - Will throw if any of the edges is not found.
   */


  Graph.prototype.exportEdges = function exportEdges(bunch) {
    return _exportEdges(this, 'exportEdges', null, bunch);
  };

  /**
   * Method exporting every directed edges or the bunch ones which are directed.
   *
   * @param  {mixed}   [bunch] - Target edges.
   * @return {array[]}         - The serialized edges.
   *
   * @throws {Error} - Will throw if any of the edges is not found.
   */


  Graph.prototype.exportDirectedEdges = function exportDirectedEdges(bunch) {
    var _this7 = this;

    return _exportEdges(this, 'exportDirectedEdges', function (edge) {
      return _this7.directed(edge);
    }, bunch);
  };

  /**
   * Method exporting every undirected edges or the bunch ones which are
   * undirected
   *
   * @param  {mixed}   [bunch] - Target edges.
   * @return {array[]}         - The serialized edges.
   *
   * @throws {Error} - Will throw if any of the edges is not found.
   */


  Graph.prototype.exportUndirectedEdges = function exportUndirectedEdges(bunch) {
    var _this8 = this;

    return _exportEdges(this, 'exportUndirectedEdges', function (edge) {
      return _this8.undirected(edge);
    }, bunch);
  };

  /**
   * Method used to export the whole graph.
   *
   * @return {object} - The serialized graph.
   */


  Graph.prototype.export = function _export() {
    return {
      attributes: this.getAttributes(),
      nodes: this.exportNodes(),
      edges: this.exportEdges()
    };
  };

  /**
   * Method used to import a serialized node.
   *
   * @param  {object} data   - The serialized node.
   * @param  {boolean} merge - Whether to merge the given node.
   * @return {Graph}         - Returns itself for chaining.
   */


  Graph.prototype.importNode = function importNode(data) {
    var merge = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


    // Validating
    var error = (0, _serialization.validateSerializedNode)(data);

    if (error) {

      if (error === 'not-object') throw new _errors.InvalidArgumentsGraphError('Graph.importNode: invalid serialized node. A serialized node should be a plain object with at least a "key" property.');
      if (error === 'no-key') throw new _errors.InvalidArgumentsGraphError('Graph.importNode: no key provided.');
      if (error === 'invalid-attributes') throw new _errors.InvalidArgumentsGraphError('Graph.importNode: invalid attributes. Attributes should be a plain object, null or omitted.');
    }

    // Adding the node
    var key = data.key,
        _data$attributes = data.attributes,
        attributes = _data$attributes === undefined ? {} : _data$attributes;


    if (merge) this.mergeNode(key, attributes);else this.addNode(key, attributes);

    return this;
  };

  /**
   * Method used to import a serialized edge.
   *
   * @param  {object}  data  - The serialized edge.
   * @param  {boolean} merge - Whether to merge the given edge.
   * @return {Graph}         - Returns itself for chaining.
   */


  Graph.prototype.importEdge = function importEdge(data) {
    var merge = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


    // Validating
    var error = (0, _serialization.validateSerializedEdge)(data);

    if (error) {

      if (error === 'not-object') throw new _errors.InvalidArgumentsGraphError('Graph.importEdge: invalid serialized edge. A serialized edge should be a plain object with at least a "source" & "target" property.');
      if (error === 'no-source') throw new _errors.InvalidArgumentsGraphError('Graph.importEdge: missing souce.');
      if (error === 'no-target') throw new _errors.InvalidArgumentsGraphError('Graph.importEdge: missing target.');
      if (error === 'invalid-attributes') throw new _errors.InvalidArgumentsGraphError('Graph.importEdge: invalid attributes. Attributes should be a plain object, null or omitted.');
      if (error === 'invalid-undirected') throw new _errors.InvalidArgumentsGraphError('Graph.importEdge: invalid undirected. Undirected should be boolean or omitted.');
    }

    // Adding the edge
    var source = data.source,
        target = data.target,
        _data$attributes2 = data.attributes,
        attributes = _data$attributes2 === undefined ? {} : _data$attributes2,
        _data$undirected = data.undirected,
        undirected = _data$undirected === undefined ? false : _data$undirected;


    var method = void 0;

    if ('key' in data) {
      method = merge ? undirected ? this.mergeUndirectedEdgeWithKey : this.mergeDirectedEdgeWithKey : undirected ? this.addUndirectedEdgeWithKey : this.addDirectedEdgeWithKey;

      method.call(this, data.key, source, target, attributes);
    } else {
      method = merge ? undirected ? this.mergeUndirectedEdge : this.mergeDirectedEdge : undirected ? this.addUndirectedEdge : this.addDirectedEdge;

      method.call(this, source, target, attributes);
    }

    return this;
  };

  /**
   * Method used to import serialized nodes.
   *
   * @param  {array}   nodes - The serialized nodes.
   * @param  {boolean} merge - Whether to merge the given nodes.
   * @return {Graph}         - Returns itself for chaining.
   */


  Graph.prototype.importNodes = function importNodes(nodes) {
    var merge = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (!Array.isArray(nodes)) throw new _errors.InvalidArgumentsGraphError('Graph.importNodes: invalid argument. Expecting an array.');

    for (var i = 0, l = nodes.length; i < l; i++) {
      this.importNode(nodes[i], merge);
    }return this;
  };

  /**
   * Method used to import serialized edges.
   *
   * @param  {array}   edges - The serialized edges.
   * @param  {boolean} merge - Whether to merge the given edges.
   * @return {Graph}         - Returns itself for chaining.
   */


  Graph.prototype.importEdges = function importEdges(edges) {
    var merge = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (!Array.isArray(edges)) throw new _errors.InvalidArgumentsGraphError('Graph.importEdges: invalid argument. Expecting an array.');

    for (var i = 0, l = edges.length; i < l; i++) {
      this.importEdge(edges[i], merge);
    }return this;
  };

  /**
   * Method used to import a serialized graph.
   *
   * @param  {object|Graph} data  - The serialized graph.
   * @param  {boolean}      merge - Whether to merge data.
   * @return {Graph}              - Returns itself for chaining.
   */


  Graph.prototype.import = function _import(data) {
    var merge = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


    // Importing a Graph instance
    if ((0, _utils.isGraph)(data)) {

      this.import(data.export(), merge);
      return this;
    }

    // Importing a serialized graph
    if (!(0, _utils.isPlainObject)(data)) throw new _errors.InvalidArgumentsGraphError('Graph.import: invalid argument. Expecting a serialized graph or, alternatively, a Graph instance.');

    if (data.attributes) {
      if (!(0, _utils.isPlainObject)(data.attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.import: invalid attributes. Expecting a plain object.');

      if (merge) this.mergeAttributes(data.attributes);else this.replaceAttributes(data.attributes);
    }

    if (data.nodes) this.importNodes(data.nodes, merge);

    if (data.edges) this.importEdges(data.edges, merge);

    return this;
  };

  /**---------------------------------------------------------------------------
   * Utils
   **---------------------------------------------------------------------------
   */

  /**
   * Method returning an empty copy of the graph, i.e. a graph without nodes
   * & edges but with the exact same options.
   *
   * @return {Graph} - The empty copy.
   */


  Graph.prototype.emptyCopy = function emptyCopy() {
    return new Graph(this._options);
  };

  /**
   * Method returning an exact copy of the graph.
   *
   * @return {Graph} - The copy.
   */


  Graph.prototype.copy = function copy() {
    var graph = new Graph(this._options);
    graph.import(this);

    return graph;
  };

  /**
   * Method upgrading the graph to a mixed one.
   *
   * @return {Graph} - The copy.
   */


  Graph.prototype.upgradeToMixed = function upgradeToMixed() {
    if (this.type === 'mixed') return this;

    // Upgrading node data:
    // NOTE: maybe this could lead to some de-optimization by usual
    // JavaScript engines but I cannot be sure of it. Another solution
    // would be to reinstantiate the classes but this surely has a performance
    // and memory impact.
    this._nodes.forEach(function (data) {
      return data.upgradeToMixed();
    });

    // Mutating the options & the instance
    this._options.type = 'mixed';
    (0, _utils.readOnlyProperty)(this, 'type', this._options.type);

    return this;
  };

  /**
   * Method upgrading the graph to a multi one.
   *
   * @return {Graph} - The copy.
   */


  Graph.prototype.upgradeToMulti = function upgradeToMulti() {
    if (this.multi) return this;

    // Mutating the options & the instance
    this._options.multi = true;
    (0, _utils.readOnlyProperty)(this, 'multi', true);

    // Upgrading indices
    (0, _indices.upgradeStructureIndexToMulti)(this);

    return this;
  };

  /**---------------------------------------------------------------------------
   * Indexes-related methods
   **---------------------------------------------------------------------------
   */

  /**
   * Method used to clear the desired index to clear memory.
   *
   * @return {Graph}       - Returns itself for chaining.
   */


  Graph.prototype.clearIndex = function clearIndex() {
    (0, _indices.clearStructureIndex)(this);
    return this;
  };

  /**---------------------------------------------------------------------------
   * Known methods
   **---------------------------------------------------------------------------
   */

  /**
   * Method used by JavaScript to perform JSON serialization.
   *
   * @return {object} - The serialized graph.
   */


  Graph.prototype.toJSON = function toJSON() {
    return this.export();
  };

  /**
   * Method used to perform string coercion and returning useful information
   * about the Graph instance.
   *
   * @return {string} - String representation of the graph.
   */


  Graph.prototype.toString = function toString() {
    var pluralOrder = this.order > 1 || this.order === 0,
        pluralSize = this.size > 1 || this.size === 0;

    return 'Graph<' + (0, _utils.prettyPrint)(this.order) + ' node' + (pluralOrder ? 's' : '') + ', ' + (0, _utils.prettyPrint)(this.size) + ' edge' + (pluralSize ? 's' : '') + '>';
  };

  /**
   * Method used internally by node's console to display a custom object.
   *
   * @return {object} - Formatted object representation of the graph.
   */


  Graph.prototype.inspect = function inspect() {
    var nodes = {};
    this._nodes.forEach(function (data, key) {
      nodes[key] = data.attributes;
    });

    var edges = {};
    this._edges.forEach(function (data, key) {
      var direction = data instanceof _data.UndirectedEdgeData ? '--' : '->';

      var label = '';

      if (!data.generatedKey) label += '[' + key + ']: ';

      label += '(' + data.source + ')' + direction + '(' + data.target + ')';

      edges[label] = data.attributes;
    });

    var dummy = {};

    for (var k in this) {
      if (this.hasOwnProperty(k) && !EMITTER_PROPS.has(k) && typeof this[k] !== 'function') dummy[k] = this[k];
    }

    dummy.attributes = this._attributes;
    dummy.nodes = nodes;
    dummy.edges = edges;

    (0, _utils.privateProperty)(dummy, 'constructor', this.constructor);

    return dummy;
  };

  return Graph;
}(_events.EventEmitter);

/**
 * Attaching methods to the prototype.
 *
 * Here, we are attaching a wide variety of methods to the Graph class'
 * prototype when those are very numerous and when their creation is
 * abstracted.
 */

/**
 * Related to edge addition.
 */


exports.default = Graph;
EDGE_ADD_METHODS.forEach(function (method) {
  ['add', 'merge'].forEach(function (verb) {
    var name = method.name(verb),
        fn = verb === 'add' ? addEdge : mergeEdge;

    if (method.generateKey) {
      Graph.prototype[name] = function (source, target, attributes) {
        return fn(this, name, true, (method.type || this.type) === 'undirected', null, source, target, attributes);
      };
    } else {
      Graph.prototype[name] = function (edge, source, target, attributes) {
        return fn(this, name, false, (method.type || this.type) === 'undirected', edge, source, target, attributes);
      };
    }
  });
});

/**
 * Attributes-related.
 */
(0, _attributes.attachAttributesMethods)(Graph);

/**
 * Edge iteration-related.
 */
(0, _edges.attachEdgeIterationMethods)(Graph);

/**
 * Neighbor iteration-related.
 */
(0, _neighbors.attachNeighborIterationMethods)(Graph);

/***/ }),
/* 110 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 111 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateStructureIndex = updateStructureIndex;
exports.clearEdgeFromStructureIndex = clearEdgeFromStructureIndex;
exports.clearStructureIndex = clearStructureIndex;
exports.upgradeStructureIndexToMulti = upgradeStructureIndexToMulti;
/**
 * Graphology Indexes Functions
 * =============================
 *
 * Bunch of functions used to compute or clear indexes.
 */

/**
 * Function updating the 'structure' index with the given edge's data.
 * Note that in the case of the multi graph, related edges are stored in a
 * set that is the same for A -> B & B <- A.
 *
 * @param {Graph}    graph      - Target Graph instance.
 * @param {any}      edge       - Added edge.
 * @param {NodeData} sourceData - Source node's data.
 * @param {NodeData} targetData - Target node's data.
 */
function updateStructureIndex(graph, undirected, edge, source, target, sourceData, targetData) {
  var multi = graph.multi;

  var outKey = undirected ? 'undirected' : 'out',
      inKey = undirected ? 'undirected' : 'in';

  // Handling source
  if (typeof sourceData[outKey][target] === 'undefined') sourceData[outKey][target] = multi ? new Set() : edge;

  if (multi) sourceData[outKey][target].add(edge);

  // If selfLoop, we break here
  if (source === target) return;

  // Handling target (we won't add the edge because it was already taken
  // care of with source above)
  if (typeof targetData[inKey][source] === 'undefined') targetData[inKey][source] = sourceData[outKey][target];
}

/**
 * Function clearing the 'structure' index data related to the given edge.
 *
 * @param {Graph}  graph - Target Graph instance.
 * @param {any}    edge  - Dropped edge.
 * @param {object} data  - Attached data.
 */
function clearEdgeFromStructureIndex(graph, undirected, edge, data) {
  var multi = graph.multi;

  var source = data.source,
      target = data.target;

  // NOTE: since the edge set is the same for source & target, we can only
  // affect source

  var sourceData = graph._nodes.get(source),
      outKey = undirected ? 'undirected' : 'out',
      sourceIndex = sourceData[outKey];

  // NOTE: possible to clear empty sets from memory altogether
  if (target in sourceIndex) {

    if (multi) sourceIndex[target].delete(edge);else delete sourceIndex[target];
  }

  if (multi) return;

  var targetData = graph._nodes.get(target),
      inKey = undirected ? 'undirected' : 'in',
      targetIndex = targetData[inKey];

  delete targetIndex[source];
}

/**
 * Function clearing the whole 'structure' index.
 *
 * @param {Graph} graph - Target Graph instance.
 */
function clearStructureIndex(graph) {
  graph._nodes.forEach(function (data) {

    // Clearing now useless properties
    data.in = {};
    data.out = {};
    data.undirected = {};
  });
}

/**
 * Function used to upgrade a simple `structure` index to a multi on.
 *
 * @param {Graph}  graph - Target Graph instance.
 */
function upgradeStructureIndexToMulti(graph) {
  graph._nodes.forEach(function (data, node) {

    // Directed
    if (data.out) {

      for (var neighbor in data.out) {
        var edges = new Set();
        edges.add(data.out[neighbor]);
        data.out[neighbor] = edges;
        graph._nodes.get(neighbor).in[node] = edges;
      }
    }

    // Undirected
    if (data.undirected) {
      for (var _neighbor in data.undirected) {
        if (_neighbor > node) continue;

        var _edges = new Set();
        _edges.add(data.undirected[_neighbor]);
        data.undirected[_neighbor] = _edges;
        graph._nodes.get(_neighbor).undirected[node] = _edges;
      }
    }
  });
}

/***/ }),
/* 112 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attachAttributesMethods = attachAttributesMethods;

var _utils = __webpack_require__(10);

var _errors = __webpack_require__(3);

/**
 * Attach an attribute getter method onto the provided class.
 *
 * @param {function} Class       - Target class.
 * @param {string}   method      - Method name.
 * @param {string}   type        - Type of the edge to find.
 */
/**
 * Graphology Attributes methods
 * ==============================
 *
 * Attributes-related methods being exactly the same for nodes & edges,
 * we abstract them here for factorization reasons.
 */
function attachAttributeGetter(Class, method, checker, type) {

  /**
   * Get the desired attribute for the given element (node or edge).
   *
   * Arity 2:
   * @param  {any}    element - Target element.
   * @param  {string} name    - Attribute's name.
   *
   * Arity 3 (only for edges):
   * @param  {any}     source - Source element.
   * @param  {any}     target - Target element.
   * @param  {string}  name   - Attribute's name.
   *
   * @return {mixed}          - The attribute's value.
   *
   * @throws {Error} - Will throw if too many arguments are provided.
   * @throws {Error} - Will throw if any of the elements is not found.
   */
  Class.prototype[method] = function (element, name) {
    if (arguments.length > 2) {

      if (this.multi) throw new _errors.UsageGraphError('Graph.' + method + ': cannot use a {source,target} combo when asking about an edge\'s attributes in a MultiGraph since we cannot infer the one you want information about.');

      var source = '' + element,
          target = '' + name;

      name = arguments[2];

      if (!this[checker](source, target)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find an edge for the given path ("' + source + '" - "' + target + '").');

      element = (0, _utils.getMatchingEdge)(this, source, target, type);
    } else {
      element = '' + element;
    }

    if (!this[checker](element)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find the "' + element + '" edge in the graph.');

    var data = this._edges.get(element);

    return data.attributes[name];
  };
}

/**
 * Attach an attributes getter method onto the provided class.
 *
 * @param {function} Class       - Target class.
 * @param {string}   method      - Method name.
 * @param {string}   checker     - Name of the checker method to use.
 * @param {string}   type        - Type of the edge to find.
 */
function attachAttributesGetter(Class, method, checker, type) {

  /**
   * Retrieves all the target element's attributes.
   *
   * Arity 2:
   * @param  {any}    element - Target element.
   *
   * Arity 3 (only for edges):
   * @param  {any}     source - Source element.
   * @param  {any}     target - Target element.
   *
   * @return {object}          - The element's attributes.
   *
   * @throws {Error} - Will throw if too many arguments are provided.
   * @throws {Error} - Will throw if any of the elements is not found.
   */
  Class.prototype[method] = function (element) {
    if (arguments.length > 1) {

      if (this.multi) throw new _errors.UsageGraphError('Graph.' + method + ': cannot use a {source,target} combo when asking about an edge\'s attributes in a MultiGraph since we cannot infer the one you want information about.');

      var source = '' + element,
          target = '' + arguments[1];

      if (!this[checker](source, target)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find an edge for the given path ("' + source + '" - "' + target + '").');

      element = (0, _utils.getMatchingEdge)(this, source, target, type);
    } else {
      element = '' + element;
    }

    if (!this[checker](element)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find the "' + element + '" edge in the graph.');

    var data = this._edges.get(element);

    return data.attributes;
  };
}

/**
 * Attach an attribute checker method onto the provided class.
 *
 * @param {function} Class       - Target class.
 * @param {string}   method      - Method name.
 * @param {string}   checker     - Name of the checker method to use.
 * @param {string}   type        - Type of the edge to find.
 */
function attachAttributeChecker(Class, method, checker, type) {

  /**
   * Checks whether the desired attribute is set for the given element (node or edge).
   *
   * Arity 2:
   * @param  {any}    element - Target element.
   * @param  {string} name    - Attribute's name.
   *
   * Arity 3 (only for edges):
   * @param  {any}     source - Source element.
   * @param  {any}     target - Target element.
   * @param  {string}  name   - Attribute's name.
   *
   * @return {boolean}
   *
   * @throws {Error} - Will throw if too many arguments are provided.
   * @throws {Error} - Will throw if any of the elements is not found.
   */
  Class.prototype[method] = function (element, name) {
    if (arguments.length > 2) {

      if (this.multi) throw new _errors.UsageGraphError('Graph.' + method + ': cannot use a {source,target} combo when asking about an edge\'s attributes in a MultiGraph since we cannot infer the one you want information about.');

      var source = '' + element,
          target = '' + name;

      name = arguments[2];

      if (!this[checker](source, target)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find an edge for the given path ("' + source + '" - "' + target + '").');

      element = (0, _utils.getMatchingEdge)(this, source, target, type);
    } else {
      element = '' + element;
    }

    if (!this[checker](element)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find the "' + element + '" edge in the graph.');

    var data = this._edges.get(element);

    return data.attributes.hasOwnProperty(name);
  };
}

/**
 * Attach an attribute setter method onto the provided class.
 *
 * @param {function} Class       - Target class.
 * @param {string}   method      - Method name.
 * @param {string}   checker     - Name of the checker method to use.
 * @param {string}   type        - Type of the edge to find.
 */
function attachAttributeSetter(Class, method, checker, type) {

  /**
   * Set the desired attribute for the given element (node or edge).
   *
   * Arity 2:
   * @param  {any}    element - Target element.
   * @param  {string} name    - Attribute's name.
   * @param  {mixed}  value   - New attribute value.
   *
   * Arity 3 (only for edges):
   * @param  {any}     source - Source element.
   * @param  {any}     target - Target element.
   * @param  {string}  name   - Attribute's name.
   * @param  {mixed}  value   - New attribute value.
   *
   * @return {Graph}          - Returns itself for chaining.
   *
   * @throws {Error} - Will throw if too many arguments are provided.
   * @throws {Error} - Will throw if any of the elements is not found.
   */
  Class.prototype[method] = function (element, name, value) {
    if (arguments.length > 3) {

      if (this.multi) throw new _errors.UsageGraphError('Graph.' + method + ': cannot use a {source,target} combo when asking about an edge\'s attributes in a MultiGraph since we cannot infer the one you want information about.');

      var source = '' + element,
          target = '' + name;

      name = arguments[2];
      value = arguments[3];

      if (!this[checker](source, target)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find an edge for the given path ("' + source + '" - "' + target + '").');

      element = (0, _utils.getMatchingEdge)(this, source, target, type);
    } else {
      element = '' + element;
    }

    if (!this[checker](element)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find the "' + element + '" edge in the graph.');

    var data = this._edges.get(element);

    data.attributes[name] = value;

    // Emitting
    this.emit('edgeAttributesUpdated', {
      key: element,
      type: 'set',
      meta: {
        name: name,
        value: value
      }
    });

    return this;
  };
}

/**
 * Attach an attribute updater method onto the provided class.
 *
 * @param {function} Class       - Target class.
 * @param {string}   method      - Method name.
 * @param {string}   checker     - Name of the checker method to use.
 * @param {string}   type        - Type of the edge to find.
 */
function attachAttributeUpdater(Class, method, checker, type) {

  /**
   * Update the desired attribute for the given element (node or edge) using
   * the provided function.
   *
   * Arity 2:
   * @param  {any}      element - Target element.
   * @param  {string}   name    - Attribute's name.
   * @param  {function} updater - Updater function.
   *
   * Arity 3 (only for edges):
   * @param  {any}      source  - Source element.
   * @param  {any}      target  - Target element.
   * @param  {string}   name    - Attribute's name.
   * @param  {function} updater - Updater function.
   *
   * @return {Graph}            - Returns itself for chaining.
   *
   * @throws {Error} - Will throw if too many arguments are provided.
   * @throws {Error} - Will throw if any of the elements is not found.
   */
  Class.prototype[method] = function (element, name, updater) {
    if (arguments.length > 3) {

      if (this.multi) throw new _errors.UsageGraphError('Graph.' + method + ': cannot use a {source,target} combo when asking about an edge\'s attributes in a MultiGraph since we cannot infer the one you want information about.');

      var source = '' + element,
          target = '' + name;

      name = arguments[2];
      updater = arguments[3];

      if (!this[checker](source, target)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find an edge for the given path ("' + source + '" - "' + target + '").');

      element = (0, _utils.getMatchingEdge)(this, source, target, type);
    } else {
      element = '' + element;
    }

    if (!this[checker](element)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find the "' + element + '" edge in the graph.');

    if (typeof updater !== 'function') throw new _errors.InvalidArgumentsGraphError('Graph.' + method + ': updater should be a function.');

    var data = this._edges.get(element);

    data.attributes[name] = updater(data.attributes[name]);

    // Emitting
    this.emit('edgeAttributesUpdated', {
      key: element,
      type: 'set',
      meta: {
        name: name,
        value: data.attributes[name]
      }
    });

    return this;
  };
}

/**
 * Attach an attribute remover method onto the provided class.
 *
 * @param {function} Class       - Target class.
 * @param {string}   method      - Method name.
 * @param {string}   checker     - Name of the checker method to use.
 * @param {string}   type        - Type of the edge to find.
 */
function attachAttributeRemover(Class, method, checker, type) {

  /**
   * Remove the desired attribute for the given element (node or edge).
   *
   * Arity 2:
   * @param  {any}    element - Target element.
   * @param  {string} name    - Attribute's name.
   *
   * Arity 3 (only for edges):
   * @param  {any}     source - Source element.
   * @param  {any}     target - Target element.
   * @param  {string}  name   - Attribute's name.
   *
   * @return {Graph}          - Returns itself for chaining.
   *
   * @throws {Error} - Will throw if too many arguments are provided.
   * @throws {Error} - Will throw if any of the elements is not found.
   */
  Class.prototype[method] = function (element, name) {
    if (arguments.length > 2) {

      if (this.multi) throw new _errors.UsageGraphError('Graph.' + method + ': cannot use a {source,target} combo when asking about an edge\'s attributes in a MultiGraph since we cannot infer the one you want information about.');

      var source = '' + element,
          target = '' + name;

      name = arguments[2];

      if (!this[checker](source, target)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find an edge for the given path ("' + source + '" - "' + target + '").');

      element = (0, _utils.getMatchingEdge)(this, source, target, type);
    } else {
      element = '' + element;
    }

    if (!this[checker](element)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find the "' + element + '" edge in the graph.');

    var data = this._edges.get(element);

    delete data.attributes[name];

    // Emitting
    this.emit('edgeAttributesUpdated', {
      key: element,
      type: 'remove',
      meta: {
        name: name
      }
    });

    return this;
  };
}

/**
 * Attach an attribute replacer method onto the provided class.
 *
 * @param {function} Class       - Target class.
 * @param {string}   method      - Method name.
 * @param {string}   checker     - Name of the checker method to use.
 * @param {string}   type        - Type of the edge to find.
 */
function attachAttributesReplacer(Class, method, checker, type) {

  /**
   * Replace the attributes for the given element (node or edge).
   *
   * Arity 2:
   * @param  {any}    element    - Target element.
   * @param  {object} attributes - New attributes.
   *
   * Arity 3 (only for edges):
   * @param  {any}     source     - Source element.
   * @param  {any}     target     - Target element.
   * @param  {object}  attributes - New attributes.
   *
   * @return {Graph}              - Returns itself for chaining.
   *
   * @throws {Error} - Will throw if too many arguments are provided.
   * @throws {Error} - Will throw if any of the elements is not found.
   */
  Class.prototype[method] = function (element, attributes) {
    if (arguments.length > 2) {

      if (this.multi) throw new _errors.UsageGraphError('Graph.' + method + ': cannot use a {source,target} combo when asking about an edge\'s attributes in a MultiGraph since we cannot infer the one you want information about.');

      var source = '' + element,
          target = '' + attributes;

      attributes = arguments[2];

      if (!this[checker](source, target)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find an edge for the given path ("' + source + '" - "' + target + '").');

      element = (0, _utils.getMatchingEdge)(this, source, target, type);
    } else {
      element = '' + element;
    }

    if (!this[checker](element)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find the "' + element + '" edge in the graph.');

    if (!(0, _utils.isPlainObject)(attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.' + method + ': provided attributes are not a plain object.');

    var data = this._edges.get(element);

    var oldAttributes = data.attributes;

    data.attributes = attributes;

    // Emitting
    this.emit('edgeAttributesUpdated', {
      key: element,
      type: 'replace',
      meta: {
        before: oldAttributes,
        after: attributes
      }
    });

    return this;
  };
}

/**
 * Attach an attribute merger method onto the provided class.
 *
 * @param {function} Class       - Target class.
 * @param {string}   method      - Method name.
 * @param {string}   checker     - Name of the checker method to use.
 * @param {string}   type        - Type of the edge to find.
 */
function attachAttributesMerger(Class, method, checker, type) {

  /**
   * Replace the attributes for the given element (node or edge).
   *
   * Arity 2:
   * @param  {any}    element    - Target element.
   * @param  {object} attributes - Attributes to merge.
   *
   * Arity 3 (only for edges):
   * @param  {any}     source     - Source element.
   * @param  {any}     target     - Target element.
   * @param  {object}  attributes - Attributes to merge.
   *
   * @return {Graph}              - Returns itself for chaining.
   *
   * @throws {Error} - Will throw if too many arguments are provided.
   * @throws {Error} - Will throw if any of the elements is not found.
   */
  Class.prototype[method] = function (element, attributes) {
    if (arguments.length > 2) {

      if (this.multi) throw new _errors.UsageGraphError('Graph.' + method + ': cannot use a {source,target} combo when asking about an edge\'s attributes in a MultiGraph since we cannot infer the one you want information about.');

      var source = '' + element,
          target = '' + attributes;

      attributes = arguments[2];

      if (!this[checker](source, target)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find an edge for the given path ("' + source + '" - "' + target + '").');

      element = (0, _utils.getMatchingEdge)(this, source, target, type);
    } else {
      element = '' + element;
    }

    if (!this[checker](element)) throw new _errors.NotFoundGraphError('Graph.' + method + ': could not find the "' + element + '" edge in the graph.');

    if (!(0, _utils.isPlainObject)(attributes)) throw new _errors.InvalidArgumentsGraphError('Graph.' + method + ': provided attributes are not a plain object.');

    var data = this._edges.get(element);

    (0, _utils.assign)(data.attributes, attributes);

    // Emitting
    this.emit('edgeAttributesUpdated', {
      key: element,
      type: 'merge',
      meta: {
        data: attributes
      }
    });

    return this;
  };
}

/**
 * List of methods to attach.
 */
var ATTRIBUTES_METHODS = [{
  name: function name(element) {
    return 'get' + element + 'Attribute';
  },
  attacher: attachAttributeGetter
}, {
  name: function name(element) {
    return 'get' + element + 'Attributes';
  },
  attacher: attachAttributesGetter
}, {
  name: function name(element) {
    return 'has' + element + 'Attribute';
  },
  attacher: attachAttributeChecker
}, {
  name: function name(element) {
    return 'set' + element + 'Attribute';
  },
  attacher: attachAttributeSetter
}, {
  name: function name(element) {
    return 'update' + element + 'Attribute';
  },
  attacher: attachAttributeUpdater
}, {
  name: function name(element) {
    return 'remove' + element + 'Attribute';
  },
  attacher: attachAttributeRemover
}, {
  name: function name(element) {
    return 'replace' + element + 'Attributes';
  },
  attacher: attachAttributesReplacer
}, {
  name: function name(element) {
    return 'merge' + element + 'Attributes';
  },
  attacher: attachAttributesMerger
}];

/**
 * Attach every attributes-related methods to a Graph class.
 *
 * @param {function} Graph - Target class.
 */
function attachAttributesMethods(Graph) {
  ATTRIBUTES_METHODS.forEach(function (_ref) {
    var name = _ref.name,
        attacher = _ref.attacher;


    // For edges
    attacher(Graph, name('Edge'), 'hasEdge', 'mixed');

    // For directed edges
    attacher(Graph, name('DirectedEdge'), 'hasDirectedEdge', 'directed');

    // For undirected edges
    attacher(Graph, name('UndirectedEdge'), 'hasUndirectedEdge', 'undirected');
  });
}

/***/ }),
/* 113 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attachEdgeIteratorCreator = attachEdgeIteratorCreator;
exports.attachEdgeIterationMethods = attachEdgeIterationMethods;

var _iterator = __webpack_require__(37);

var _iterator2 = _interopRequireDefault(_iterator);

var _consume = __webpack_require__(16);

var _consume2 = _interopRequireDefault(_consume);

var _errors = __webpack_require__(3);

var _data = __webpack_require__(17);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Graphology Edge Iteration
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * ==========================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Attaching some methods to the Graph class to be able to iterate over a
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * graph's edges.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Definitions.
 */
var EDGES_ITERATION = [{
  name: 'edges',
  type: 'mixed'
}, {
  name: 'inEdges',
  type: 'directed',
  direction: 'in'
}, {
  name: 'outEdges',
  type: 'directed',
  direction: 'out'
}, {
  name: 'directedEdges',
  type: 'directed'
}, {
  name: 'undirectedEdges',
  type: 'undirected'
}];

/**
 * Helper classes.
 */

var EdgesIterator = function (_Iterator) {
  _inherits(EdgesIterator, _Iterator);

  function EdgesIterator() {
    _classCallCheck(this, EdgesIterator);

    return _possibleConstructorReturn(this, _Iterator.apply(this, arguments));
  }

  return EdgesIterator;
}(_iterator2.default);

/**
 * Function collecting edges from the given object.
 *
 * @param  {array}            edges  - Edges array to populate.
 * @param  {object|undefined} object - Target object.
 * @return {array}                   - The found edges.
 */


function collect(edges, object) {
  for (var k in object) {
    if (object[k] instanceof Set) edges.push.apply(edges, (0, _consume2.default)(object[k].values(), object[k].size));else edges.push(object[k]);
  }
}

/**
 * Function collecting edges from the given object at given key.
 *
 * @param  {array}            edges  - Edges array to populate.
 * @param  {object|undefined} object - Target object.
 * @param  {mixed}            key    - Neighbor key.
 * @return {array}                   - The found edges.
 */
function collectForKey(edges, object, key) {

  if (!(key in object)) return;

  if (object[key] instanceof Set) edges.push.apply(edges, (0, _consume2.default)(object[key].values(), object[key].size));else edges.push(object[key]);

  return;
}

/**
 * Function creating an array of edges for the given type.
 *
 * @param  {Graph}   graph - Target Graph instance.
 * @param  {string}  type  - Type of edges to retrieve.
 * @return {array}         - Array of edges.
 */
function createEdgeArray(graph, type) {
  if (graph.size === 0) return [];

  if (type === 'mixed') return (0, _consume2.default)(graph._edges.keys(), graph._edges.size);

  var list = [];

  graph._edges.forEach(function (data, edge) {

    if (data instanceof _data.UndirectedEdgeData === (type === 'undirected')) list.push(edge);
  });

  return list;
}

/**
 * Function creating an iterator of edges for the given type.
 *
 * @param  {Graph}    graph - Target Graph instance.
 * @param  {string}   type  - Type of edges to retrieve.
 * @return {Iterator}       - Edge iterator.
 */
function createEdgeIterator(graph, type) {
  if (graph.size === 0) return EdgesIterator.empty();

  var inner = void 0;

  if (type === 'mixed') {
    inner = graph._edges.keys();
    return new EdgesIterator(inner.next.bind(inner));
  }

  inner = graph._edges.entries();

  return new EdgesIterator(function next() {
    var step = inner.next();

    if (step.done) return step;

    var data = step.value[1];

    if (data instanceof _data.UndirectedEdgeData === (type === 'undirected')) return { value: step.value[0] };

    return next();
  });
}

/**
 * Function creating an array of edges for the given type & the given node.
 *
 * @param  {Graph}   graph     - Target Graph instance.
 * @param  {string}  type      - Type of edges to retrieve.
 * @param  {string}  direction - In or out?
 * @param  {any}     node      - Target node.
 * @return {array}             - Array of edges.
 */
function createEdgeArrayForNode(graph, type, direction, node) {
  var edges = [];

  var nodeData = graph._nodes.get(node);

  if (type !== 'undirected') {

    if (direction !== 'out') collect(edges, nodeData.in);
    if (direction !== 'in') collect(edges, nodeData.out);
  }

  if (type !== 'directed') {
    collect(edges, nodeData.undirected);
  }

  return edges;
}

/**
 * Function creating an array of edges for the given path.
 *
 * @param  {Graph}   graph  - Target Graph instance.
 * @param  {string}  type   - Type of edges to retrieve.
 * @param  {any}     source - Source node.
 * @param  {any}     target - Target node.
 * @return {array}          - Array of edges.
 */
function createEdgeArrayForPath(graph, type, source, target) {
  var edges = [];

  var sourceData = graph._nodes.get(source);

  if (type !== 'undirected') {
    collectForKey(edges, sourceData.in, target);
    collectForKey(edges, sourceData.out, target);
  }

  if (type !== 'directed') {
    collectForKey(edges, sourceData.undirected, target);
  }

  return edges;
}

/**
 * Function attaching an edge array creator method to the Graph prototype.
 *
 * @param {function} Class       - Target class.
 * @param {object}   description - Method description.
 */
function attachEdgeArrayCreator(Class, description) {
  var name = description.name,
      type = description.type,
      direction = description.direction;

  /**
   * Function returning an array of certain edges.
   *
   * Arity 0: Return all the relevant edges.
   *
   * Arity 1a: Return all of a node's relevant edges.
   * @param  {any}   node   - Target node.
   *
   * Arity 1b: Return the union of the relevant edges of the given bunch of nodes.
   * @param  {bunch} bunch  - Bunch of nodes.
   *
   * Arity 2: Return the relevant edges across the given path.
   * @param  {any}   source - Source node.
   * @param  {any}   target - Target node.
   *
   * @return {array|number} - The edges or the number of edges.
   *
   * @throws {Error} - Will throw if there are too many arguments.
   */

  Class.prototype[name] = function (source, target) {

    // Early termination
    if (type !== 'mixed' && this.type !== 'mixed' && type !== this.type) return [];

    if (!arguments.length) return createEdgeArray(this, type);

    if (arguments.length === 1) {
      source = '' + source;

      if (!this._nodes.has(source)) throw new _errors.NotFoundGraphError('Graph.' + name + ': could not find the "' + source + '" node in the graph.');

      // Iterating over a node's edges
      return createEdgeArrayForNode(this, type, direction, source);
    }

    if (arguments.length === 2) {
      source = '' + source;
      target = '' + target;

      if (!this._nodes.has(source)) throw new _errors.NotFoundGraphError('Graph.' + name + ':  could not find the "' + source + '" source node in the graph.');

      if (!this._nodes.has(target)) throw new _errors.NotFoundGraphError('Graph.' + name + ':  could not find the "' + target + '" target node in the graph.');

      // Iterating over the edges between source & target
      var hasEdge = void 0;

      if (type !== 'undirected') hasEdge = this.hasDirectedEdge(source, target);else hasEdge = this.hasUndirectedEdge(source, target);

      // If no such edge exist, we'll stop right there.
      if (!hasEdge) return [];

      return createEdgeArrayForPath(this, type, source, target);
    }

    throw new _errors.InvalidArgumentsGraphError('Graph.' + name + ': too many arguments (expecting 0, 1 or 2 and got ' + arguments.length + ').');
  };
}

/**
 * Function attaching an edge array iterator method to the Graph prototype.
 *
 * @param {function} Class       - Target class.
 * @param {object}   description - Method description.
 */
function attachEdgeIteratorCreator(Class, description) {
  var originalName = description.name,
      type = description.type;


  var name = originalName + 'Iterator';

  /**
   * Function returning an iterator over the graph's edges.
   *
   * Arity 0: Return all the relevant edges.
   *
   * Arity 1a: Return all of a node's relevant edges.
   * @param  {any}   node   - Target node.
   *
   * Arity 1b: Return the union of the relevant edges of the given bunch of nodes.
   * @param  {bunch} bunch  - Bunch of nodes.
   *
   * Arity 2: Return the relevant edges across the given path.
   * @param  {any}   source - Source node.
   * @param  {any}   target - Target node.
   *
   * @return {array|number} - The edges or the number of edges.
   *
   * @throws {Error} - Will throw if there are too many arguments.
   */
  Class.prototype[name] = function () {

    // Early termination
    if (type !== 'mixed' && this.type !== 'mixed' && type !== this.type) return _iterator2.default.empty();

    if (!arguments.length) return createEdgeIterator(this, type);

    // TODO: complete here...
    // if (arguments.length === 1) {
    //   source = '' + source;

    //   if (!this._nodes.has(source))
    //     throw new NotFoundGraphError(`Graph.${name}: could not find the "${source}" node in the graph.`);

    //   // Iterating over a node's edges
    //   return createEdgeArrayForNode(this, type, direction, source);
    // }

    // if (arguments.length === 2) {
    //   source = '' + source;
    //   target = '' + target;

    //   if (!this._nodes.has(source))
    //     throw new NotFoundGraphError(`Graph.${name}:  could not find the "${source}" source node in the graph.`);

    //   if (!this._nodes.has(target))
    //     throw new NotFoundGraphError(`Graph.${name}:  could not find the "${target}" target node in the graph.`);

    //   // Iterating over the edges between source & target
    //   let hasEdge;

    //   if (type !== 'undirected')
    //     hasEdge = this.hasDirectedEdge(source, target);
    //   else
    //     hasEdge = this.hasUndirectedEdge(source, target);

    //   // If no such edge exist, we'll stop right there.
    //   if (!hasEdge)
    //     return [];

    //   return createEdgeArrayForPath(this, type, source, target);
    // }

    // throw new InvalidArgumentsGraphError(`Graph.${name}: too many arguments (expecting 0, 1 or 2 and got ${arguments.length}).`);
  };
}

/**
 * Function attaching every edge iteration method to the Graph class.
 *
 * @param {function} Graph - Graph class.
 */
function attachEdgeIterationMethods(Graph) {
  EDGES_ITERATION.forEach(function (description) {
    attachEdgeArrayCreator(Graph, description);
    attachEdgeIteratorCreator(Graph, description);
  });
}

/***/ }),
/* 114 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attachNeighborIterationMethods = attachNeighborIterationMethods;

var _consume = __webpack_require__(16);

var _consume2 = _interopRequireDefault(_consume);

var _errors = __webpack_require__(3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Definitions.
 */
/**
 * Graphology Neighbor Iteration
 * ==============================
 *
 * Attaching some methods to the Graph class to be able to iterate over
 * neighbors.
 */
var NEIGHBORS_ITERATION = [{
  name: 'neighbors',
  type: 'mixed'
}, {
  name: 'inNeighbors',
  type: 'directed',
  direction: 'in'
}, {
  name: 'outNeighbors',
  type: 'directed',
  direction: 'out'
}, {
  name: 'directedNeighbors',
  type: 'directed'
}, {
  name: 'undirectedNeighbors',
  type: 'undirected'
}];

/**
 * Function merging neighbors into the given set iterating over the given object.
 *
 * @param {BasicSet} neighbors - Neighbors set.
 * @param {object}   object    - Target object.
 */
function merge(neighbors, object) {
  if (!object) return;

  for (var neighbor in object) {
    neighbors.add(neighbor);
  }
}

/**
 * Function creating a set of relevant neighbors for the given node.
 *
 * @param  {Graph}        graph     - Target graph.
 * @param  {string}       type      - Type of neighbors.
 * @param  {string}       direction - Direction.
 * @param  {any}          node      - Target node.
 * @return {Set|BasicSet}           - The neighbors set.
 */
function createNeighborSetForNode(graph, type, direction, node) {
  var neighbors = new Set();

  var nodeData = graph._nodes.get(node);

  if (type !== 'undirected') {

    if (direction !== 'out') {
      merge(neighbors, nodeData.in);
    }
    if (direction !== 'in') {
      merge(neighbors, nodeData.out);
    }
  }

  if (type !== 'directed') {
    merge(neighbors, nodeData.undirected);
  }

  return neighbors;
}

/**
 * Function attaching a neighbors array creator method to the Graph prototype.
 *
 * @param {function} Class       - Target class.
 * @param {object}   description - Method description.
 */
function attachNeighborArrayCreator(Class, description) {
  var name = description.name,
      type = description.type,
      direction = description.direction;

  /**
   * Function returning an array or the count of certain neighbors.
   *
   * Arity 1a: Return all of a node's relevant neighbors.
   * @param  {any}   node   - Target node.
   *
   * Arity 1b: Return the union of the relevant neighbors of the given bunch of nodes.
   * @param  {bunch} bunch  - Bunch of nodes.
   *
   * Arity 2: Return whether the two nodes are indeed neighbors.
   * @param  {any}   source - Source node.
   * @param  {any}   target - Target node.
   *
   * @return {array|number} - The neighbors or the number of neighbors.
   *
   * @throws {Error} - Will throw if there are too many arguments.
   */

  Class.prototype[name] = function (node) {

    // Early termination
    if (type !== 'mixed' && this.type !== 'mixed' && type !== this.type) return [];

    if (arguments.length === 2) {
      var node1 = '' + arguments[0],
          node2 = '' + arguments[1];

      if (!this._nodes.has(node1)) throw new _errors.NotFoundGraphError('Graph.' + name + ': could not find the "' + node1 + '" node in the graph.');

      if (!this._nodes.has(node2)) throw new _errors.NotFoundGraphError('Graph.' + name + ': could not find the "' + node2 + '" node in the graph.');

      // Here, we want to assess whether the two given nodes are neighbors
      var neighbors = createNeighborSetForNode(this, type, direction, node1);

      return neighbors.has(node2);
    } else if (arguments.length === 1) {
      node = '' + node;

      if (!this._nodes.has(node)) throw new _errors.NotFoundGraphError('Graph.' + name + ': could not find the "' + node + '" node in the graph.');

      // Here, we want to iterate over a node's relevant neighbors
      var _neighbors = createNeighborSetForNode(this, type, direction, node);

      return (0, _consume2.default)(_neighbors.values(), _neighbors.size);
    }

    throw new _errors.InvalidArgumentsGraphError('Graph.' + name + ': invalid number of arguments (expecting 1 or 2 and got ' + arguments.length + ').');
  };
}

/**
 * Function attaching every neighbor iteration method to the Graph class.
 *
 * @param {function} Graph - Graph class.
 */
function attachNeighborIterationMethods(Graph) {
  NEIGHBORS_ITERATION.forEach(function (description) {
    attachNeighborArrayCreator(Graph, description);
  });
}

/***/ }),
/* 115 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.serializeNode = serializeNode;
exports.serializeEdge = serializeEdge;
exports.validateSerializedNode = validateSerializedNode;
exports.validateSerializedEdge = validateSerializedEdge;

var _data = __webpack_require__(17);

var _utils = __webpack_require__(10);

/**
 * Formats internal node data into a serialized node.
 *
 * @param  {any}    key  - The node's key.
 * @param  {object} data - Internal node's data.
 * @return {array}       - The serialized node.
 */
/**
 * Graphology Serialization Utilities
 * ===================================
 *
 * Collection of functions used to validate import-export formats & to ouput
 * them from internal graph data.
 *
 * Serialized Node:
 * {key, ?attributes}
 *
 * Serialized Edge:
 * {key?, source, target, attributes?, undirected?}
 *
 * Serialized Graph:
 * {nodes[], edges?[]}
 */
function serializeNode(key, data) {
  var serialized = { key: key };

  if (Object.keys(data.attributes).length) serialized.attributes = data.attributes;

  return serialized;
}

/**
 * Formats internal edge data into a serialized edge.
 *
 * @param  {any}    key  - The edge's key.
 * @param  {object} data - Internal edge's data.
 * @return {array}       - The serialized edge.
 */
function serializeEdge(key, data) {
  var serialized = {
    source: data.source,
    target: data.target
  };

  // We export the key unless if it was provided by the user
  if (!data.generatedKey) serialized.key = key;

  if (Object.keys(data.attributes).length) serialized.attributes = data.attributes;

  if (data instanceof _data.UndirectedEdgeData) serialized.undirected = true;

  return serialized;
}

/**
 * Checks whether the given value is a serialized node.
 *
 * @param  {mixed} value - Target value.
 * @return {string|null}
 */
function validateSerializedNode(value) {
  if (!(0, _utils.isPlainObject)(value)) return 'not-object';

  if (!('key' in value)) return 'no-key';

  if ('attributes' in value && (!(0, _utils.isPlainObject)(value.attributes) || value.attributes === null)) return 'invalid-attributes';

  return null;
}

/**
 * Checks whether the given value is a serialized edge.
 *
 * @param  {mixed} value - Target value.
 * @return {string|null}
 */
function validateSerializedEdge(value) {
  if (!(0, _utils.isPlainObject)(value)) return 'not-object';

  if (!('source' in value)) return 'no-source';

  if (!('target' in value)) return 'no-target';

  if ('attributes' in value && (!(0, _utils.isPlainObject)(value.attributes) || value.attributes === null)) return 'invalid-attributes';

  if ('undirected' in value && typeof value.undirected !== 'boolean') return 'invalid-undirected';

  return null;
}

/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Graphology GEXF
 * ================
 *
 * Library endpoint.
 */
module.exports = __webpack_require__(117);


/***/ }),
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Graphology Node GEXF Endpoint
 * ==============================
 *
 * Endpoint gathering both parser & writer for Node.js.
 */
exports.write = __webpack_require__(118);


/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Graphology Common GEXF Writer
 * ==============================
 *
 * GEXF writer working for both node.js & the browser.
 */
var isGraph = __webpack_require__(36),
    XMLWriter = __webpack_require__(119);

// TODO: options => prettyPrint, nodeModel, edgeModel
// TODO: handle object in color, position with object for viz

/**
 * Constants.
 */
var GEXF_NAMESPACE = 'http://www.gexf.net/1.2draft',
    GEXF_VIZ_NAMESPACE = 'http:///www.gexf.net/1.1draft/viz';

var DEFAULTS = {
  encoding: 'UTF-8',
  pretty: true
};

// var VALID_GEXF_TYPES = new Set([
//   'integer',
//   'long',
//   'double',
//   'float',
//   'boolean',
//   'liststring',
//   'string',
//   'anyURI'
// ]);

var VIZ_RESERVED_NAMES = new Set([
  'color',
  'size',
  'x',
  'y',
  'z',
  'shape',
  'thickness'
]);

var RGBA_TEST = /^\s*rgba?\s*\(/i,
    RGBA_MATCH = /^\s*rgba?\s*\(\s*([0-9]*)\s*,\s*([0-9]*)\s*,\s*([0-9]*)\s*(?:,\s*([.0-9]*))?\)\s*$/;

/**
 * Function used to transform a CSS color into a RGBA object.
 *
 * @param  {string} value - Target value.
 * @return {object}
 */
function CSSColorToRGBA(value) {
  if (!value || typeof value !== 'string')
    return {};

  if (value[0] === '#') {
    value = value.slice(1);

    return (value.length === 3) ?
      {
        r: parseInt(value[0] + value[0], 16),
        g: parseInt(value[1] + value[1], 16),
        b: parseInt(value[2] + value[2], 16)
      } :
      {
        r: parseInt(value[0] + value[1], 16),
        g: parseInt(value[2] + value[3], 16),
        b: parseInt(value[4] + value[5], 16)
      };
  }
  else if (RGBA_TEST.test(value)) {
    var result = {};

    value = value.match(RGBA_MATCH);
    result.r = +value[1];
    result.g = +value[2];
    result.b = +value[3];

    if (value[4])
      result.a = +value[4];

    return result;
  }

  return {};
}

/**
 * Function used to map an element's attributes to a standardized map of
 * GEXF expected properties (label, viz, attributes).
 *
 * @param  {string} type       - The element's type
 * @param  {object} attributes - The element's attributes.
 * @return {object}
 */
function DEFAULT_ELEMENT_REDUCER(type, attributes) {
  var output = {},
      name;

  for (name in attributes) {
    if (name === 'label') {
      output.label = attributes.label;
    }
    else if (type === 'edge' && name === 'weight') {
      output.weight = attributes.weight;
    }
    else if (VIZ_RESERVED_NAMES.has(name)) {
      output.viz = output.viz || {};
      output.viz[name] = attributes[name];
    }
    else {
      output.attributes = output.attributes || {};
      output.attributes[name] = attributes[name];
    }
  }

  return output;
}

var DEFAULT_NODE_REDUCER = DEFAULT_ELEMENT_REDUCER.bind(null, 'node'),
    DEFAULT_EDGE_REDUCER = DEFAULT_ELEMENT_REDUCER.bind(null, 'edge');

/**
 * Function used to check whether the given integer is 32 bits or not.
 *
 * @param  {number} number - Target number.
 * @return {boolean}
 */
function is32BitInteger(number) {
  return number <= 0x7FFFFFFF && number >= -0x7FFFFFFF;
}

/**
 * Function used to detect a JavaScript's value type in the GEXF model.
 *
 * @param  {any}    value - Target value.
 * @return {string}
 */
function detectValueType(value) {
  if (Array.isArray(value))
    return 'liststring';
  if (typeof value === 'boolean')
    return 'boolean';
  if (typeof value === 'object')
    return 'string';

  // Numbers
  if (typeof value === 'number') {

    // Integer
    if (value === (value | 0)) {

      // Long (JavaScript integer can go up to 53 bit)?
      return is32BitInteger(value) ? 'integer' : 'long';
    }

    // JavaScript numbers are 64 bit float, hence the double
    return 'double';
  }

  return 'string';
}

/**
 * Function used to cast the given value into the given type.
 *
 * @param  {string} type  - Target type.
 * @param  {any}    value - Value to cast.
 * @return {string}
 */
function cast(type, value) {
  if (type === 'liststring' && Array.isArray(value))
    return value.join('|');
  return '' + value;
}

/**
 * Function used to collect data from a graph's nodes.
 *
 * @param  {Graph}    graph   - Target graph.
 * @param  {function} reducer - Function reducing the nodes attributes.
 * @return {array}
 */
function collectNodeData(graph, reducer) {
  var nodes = graph.nodes(),
      data;

  for (var i = 0, l = nodes.length; i < l; i++) {
    data = reducer(graph.getNodeAttributes(nodes[i]));
    data.key = nodes[i];
    nodes[i] = data;
  }

  return nodes;
}

/**
 * Function used to collect data from a graph's edges.
 *
 * @param  {Graph}    graph   - Target graph.
 * @param  {function} reducer - Function reducing the edges attributes.
 * @return {array}
 */
function collectEdgeData(graph, reducer) {
  var edges = graph.edges(),
      data;

  for (var i = 0, l = edges.length; i < l; i++) {
    data = reducer(graph.getEdgeAttributes(edges[i]));
    data.key = edges[i];
    data.source = graph.source(edges[i]);
    data.target = graph.target(edges[i]);
    data.undirected = graph.undirected(edges[i]);
    edges[i] = data;
  }

  return edges;
}

/**
 * Function used to infer the model of the graph's nodes or edges.
 *
 * @param  {array} elements - The graph's relevant elements.
 * @return {array}
 */
function inferModel(elements) {
  var model = {},
      attributes,
      type,
      k;

  // Testing every attributes
  for (var i = 0, l = elements.length; i < l; i++) {
    attributes = elements[i].attributes;

    if (!attributes)
      continue;

    for (k in attributes) {
      type = detectValueType(attributes[k]);

      if (!model[k])
        model[k] = type;
      else {
        if (model[k] === 'integer' && type === 'long')
          model[k] = type;
        else if (model[k] !== type)
          model[k] = 'string';
      }
    }
  }

  // TODO: check default values
  return model;
}

/**
 * Function used to write a model.
 *
 * @param {XMLWriter} writer     - The writer to use.
 * @param {object}    model      - Model to write.
 * @param {string}    modelClass - Class of the model.
 */
function writeModel(writer, model, modelClass) {
  var name;

  if (!Object.keys(model).length)
    return;

  writer.startElement('attributes');
  writer.writeAttribute('class', modelClass);

  for (name in model) {
    writer.startElement('attribute');
    writer.writeAttribute('id', name);
    writer.writeAttribute('title', name);
    writer.writeAttribute('type', model[name]);
    writer.endElement();
  }

  writer.endElement();
}

function writeElements(writer, type, model, elements) {
  var emptyModel = !Object.keys(model).length,
      element,
      name,
      color,
      edgeType,
      attributes,
      viz,
      k,
      i,
      l;

  writer.startElement(type + 's');

  for (i = 0, l = elements.length; i < l; i++) {
    element = elements[i];
    attributes = element.attributes;
    viz = element.viz;

    writer.startElement(type);
    writer.writeAttribute('id', element.key);

    if (type === 'edge') {
      edgeType = element.undirected ? 'undirected' : 'directed';

      if (edgeType !== writer.defaultEdgeType)
        writer.writeAttribute('type', edgeType);

      writer.writeAttribute('source', element.source);
      writer.writeAttribute('target', element.target);

      if ('weight' in element)
        writer.writeAttribute('weight', element.weight);
    }

    if (element.label)
      writer.writeAttribute('label', element.label);

    if (!emptyModel && attributes) {
      writer.startElement('attvalues');

      for (name in model) {
        if (name in attributes) {
          writer.startElement('attvalue');
          writer.writeAttribute('for', name);
          writer.writeAttribute('value', cast(model[name], attributes[name]));
          writer.endElement();
        }
      }

      writer.endElement();
    }

    if (viz) {

      //-- 1) Color
      if (viz.color) {
        color = CSSColorToRGBA(viz.color);

        writer.startElementNS('viz', 'color');

        for (k in color)
          writer.writeAttribute(k, color[k]);

        writer.endElement();
      }

      //-- 2) Size
      if ('size' in viz) {
        writer.startElementNS('viz', 'size');
        writer.writeAttribute('value', viz.size);
        writer.endElement();
      }

      //-- 3) Position
      if ('x' in viz || 'y' in viz || 'z' in viz) {
        writer.startElementNS('viz', 'position');

        if ('x' in viz)
          writer.writeAttribute('x', viz.x);

        if ('y' in viz)
          writer.writeAttribute('y', viz.y);

        if ('z' in viz)
          writer.writeAttribute('z', viz.z);

        writer.endElement();
      }

      //-- 4) Shape
      if (viz.shape) {
        writer.startElementNS('viz', 'shape');
        writer.writeAttribute('value', viz.shape);
        writer.endElement();
      }

      //-- 5) Thickness
      if ('thickness' in viz) {
        writer.startElementNS('viz', 'thickness');
        writer.writeAttribute('value', viz.thickness);
        writer.endElement();
      }
    }

    writer.endElement();
  }

  writer.endElement();
}

/**
 * Function taking a graphology instance & outputting a gexf string.
 *
 * @param  {Graph}  graph        - Target graphology instance.
 * @param  {object} options      - Options:
 * @param  {string}   [encoding]   - Character encoding.
 * @paral  {boolean}  [pretty]     - Whether to pretty print output.
 * @return {string}              - GEXF string.
 */
module.exports = function write(graph, options) {
  if (!isGraph(graph))
    throw new Error('graphology-gexf/writer: invalid graphology instance.');

  options = options || {};

  var indent = options.pretty === false ? false : '  ';

  var writer = new XMLWriter(indent);

  writer.startDocument('1.0', options.encoding || DEFAULTS.encoding);

  // Starting gexf
  writer.startElement('gexf');
  writer.writeAttribute('version', '1.2');
  writer.writeAttribute('xmlns', GEXF_NAMESPACE);
  writer.writeAttribute('xmlns:viz', GEXF_VIZ_NAMESPACE);

  // Processing meta
  writer.startElement('meta');
  var graphAttributes = graph.getAttributes();

  if (graphAttributes.lastModifiedDate)
    writer.writeAttribute('lastmodifieddate', graphAttributes.lastModifiedDate);

  for (var k in graphAttributes) {
    if (k !== 'lastModifiedDate')
      writer.writeElement(k, graphAttributes[k]);
  }

  writer.endElement();
  writer.startElement('graph');
  writer.defaultEdgeType = graph.type === 'mixed' ?
    'directed' :
    graph.type;

  writer.writeAttribute(
    'defaultedgetype',
    writer.defaultEdgeType
  );

  // Processing model
  var nodes = collectNodeData(graph, DEFAULT_NODE_REDUCER),
      edges = collectEdgeData(graph, DEFAULT_EDGE_REDUCER);

  var nodeModel = inferModel(nodes);

  writeModel(writer, nodeModel, 'node');

  var edgeModel = inferModel(edges);

  writeModel(writer, edgeModel, 'edge');

  // Processing nodes
  writeElements(writer, 'node', nodeModel, nodes);

  // Processing edges
  writeElements(writer, 'edge', edgeModel, edges);

  return writer.toString();
};


/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(120);


/***/ }),
/* 120 */
/***/ (function(module, exports) {


function isFalse(s) {
  return typeof s !== 'number' && !s;
}

function strval(s) {
  if (typeof s == 'string') {
    return s;
  }
  else if (typeof s == 'number') {
    return s+'';
  }
  else if (typeof s == 'function') {
    return s();
  }
  else if (s instanceof XMLWriter) {
    return s.toString();
  }
  else throw Error('Bad Parameter');
}

function XMLWriter(indent, callback) {

    if (!(this instanceof XMLWriter)) {
        return new XMLWriter();
    }

    this.name_regex = /[_:A-Za-z][-._:A-Za-z0-9]*/;
    this.indent = indent ? true : false;
    this.indentString = this.indent && typeof indent === 'string' ? indent : '    ';
    this.output = '';
    this.stack = [];
    this.tags = 0;
    this.attributes = 0;
    this.attribute = 0;
    this.texts = 0;
    this.comment = 0;
    this.dtd = 0;
    this.root = '';
    this.pi = 0;
    this.cdata = 0;
    this.started_write = false;
    this.writer;
    this.writer_encoding = 'UTF-8';

    if (typeof callback == 'function') {
        this.writer = callback;
    } else {
        this.writer = function (s, e) {
            this.output += s;
        }
    }
}

XMLWriter.prototype = {
    toString : function () {
        this.flush();
        return this.output;
    },

    indenter : function () {
      if (this.indent) {
        this.write('\n');
        for (var i = 1; i < this.tags; i++) {
          this.write(this.indentString);
        }
      }
    },

    write : function () {
        for (var i = 0; i < arguments.length; i++) {
            this.writer(arguments[i], this.writer_encoding);
        }
    },


    flush : function () {
        for (var i = this.tags; i > 0; i--) {
            this.endElement();
        }
        this.tags = 0;
    },

    startDocument : function (version, encoding, standalone) {
        if (this.tags || this.attributes) return this;

        this.startPI('xml');
        this.startAttribute('version');
        this.text(typeof version == "string" ? version : "1.0");
        this.endAttribute();
        if (typeof encoding == "string") {
            this.startAttribute('encoding');
            this.text(encoding);
            this.endAttribute();
            this.writer_encoding = encoding;
        }
        if (standalone) {
            this.startAttribute('standalone');
            this.text("yes");
            this.endAttribute();
        }
        this.endPI();
        if (!this.indent) {
          this.write('\n');
        }
        return this;
    },

    endDocument : function () {
        if (this.attributes) this.endAttributes();
        return this;
    },

    writeElement : function (name, content) {
        return this.startElement(name).text(content).endElement();
    },

    writeElementNS : function (prefix, name, uri, content) {
        if (!content) {
            content = uri;
        }
        return this.startElementNS(prefix, name, uri).text(content).endElement();
    },

    startElement : function (name) {
        name = strval(name);
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (this.tags === 0 && this.root && this.root !== name) throw Error('Invalid Parameter');
        if (this.attributes) this.endAttributes();
        ++this.tags;
        this.texts = 0;
        if (this.stack.length > 0)
          this.stack[this.stack.length-1].containsTag = true;

        this.stack.push({
            name: name,
            tags: this.tags
        });
        if (this.started_write) this.indenter();
        this.write('<', name);
        this.startAttributes();
        this.started_write = true;
        return this;
    },
    startElementNS : function (prefix, name, uri) {
        prefix = strval(prefix);
        name = strval(name);

        if (!prefix.match(this.name_regex)) throw Error('Invalid Parameter');
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (this.attributes) this.endAttributes();
        ++this.tags;
        this.texts = 0;
        if (this.stack.length > 0)
          this.stack[this.stack.length-1].containsTag = true;

        this.stack.push({
            name: prefix + ':' + name,
            tags: this.tags
        });
        if (this.started_write) this.indenter();
        this.write('<', prefix + ':' + name);
        this.startAttributes();
        this.started_write = true;
        return this;
    },

    endElement : function () {
        if (!this.tags) return this;
        var t = this.stack.pop();
        if (this.attributes > 0) {
            if (this.attribute) {
                if (this.texts) this.endAttribute();
                this.endAttribute();
            }
            this.write('/');
            this.endAttributes();
        } else {
            if (t.containsTag) this.indenter();
            this.write('</', t.name, '>');
        }
        --this.tags;
        this.texts = 0;
        return this;
    },

    writeAttribute : function (name, content) {
        if (typeof content == 'function') {
          content = content();
        }
        if (isFalse(content)) {
           return this;
        }
        return this.startAttribute(name).text(content).endAttribute();
    },
    writeAttributeNS : function (prefix, name, uri, content) {
        if (!content) {
            content = uri;
        }
        if (typeof content == 'function') {
          content = content();
        }
        if (isFalse(content)) {
          return this;
        }
        return this.startAttributeNS(prefix, name, uri).text(content).endAttribute();
    },

    startAttributes : function () {
        this.attributes = 1;
        return this;
    },

    endAttributes : function () {
        if (!this.attributes) return this;
        if (this.attribute) this.endAttribute();
        this.attributes = 0;
        this.attribute = 0;
        this.texts = 0;
        this.write('>');
        return this;
    },

    startAttribute : function (name) {
        name = strval(name);
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (!this.attributes && !this.pi) return this;
        if (this.attribute) return this;
        this.attribute = 1;
        this.write(' ', name, '="');
        return this;
    },
    startAttributeNS : function (prefix, name, uri) {
        prefix = strval(prefix);
        name = strval(name);

        if (!prefix.match(this.name_regex)) throw Error('Invalid Parameter');
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (!this.attributes && !this.pi) return this;
        if (this.attribute) return this;
        this.attribute = 1;
        this.write(' ', prefix + ':' + name, '="');
        return this;
    },
    endAttribute : function () {
        if (!this.attribute) return this;
        this.attribute = 0;
        this.texts = 0;
        this.write('"');
        return this;
    },

    text : function (content) {
        content = strval(content);
        if (!this.tags && !this.comment && !this.pi && !this.cdata) return this;
        if (this.attributes && this.attribute) {
            ++this.texts;
            this.write(content
                       .replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/"/g, '&quot;')
                       .replace(/\t/g, '&#x9;')
                       .replace(/\n/g, '&#xA;')
                       .replace(/\r/g, '&#xD;')
                      );
            return this;
        } else if (this.attributes && !this.attribute) {
            this.endAttributes();
        }
        if (this.comment || this.cdata) {
            this.write(content);
        }
        else {
          this.write(content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        }
        ++this.texts;
        this.started_write = true;
        return this;
    },

    writeComment : function (content) {
        return this.startComment().text(content).endComment();
    },

    startComment : function () {
        if (this.comment) return this;
        if (this.attributes) this.endAttributes();
        this.indenter();
        this.write('<!--');
        this.comment = 1;
        this.started_write = true;
        return this;
    },

    endComment : function () {
        if (!this.comment) return this;
        this.write('-->');
        this.comment = 0;
        return this;
    },

    writeDocType : function (name, pubid, sysid, subset) {
        return this.startDocType(name, pubid, sysid, subset).endDocType()
    },

    startDocType : function (name, pubid, sysid, subset) {
        if (this.dtd || this.tags) return this;

        name = strval(name);
        pubid = pubid ? strval(pubid) : pubid;
        sysid = sysid ? strval(sysid) : sysid;
        subset = subset ? strval(subset) : subset;

        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (pubid && !pubid.match(/^[\w\-][\w\s\-\/\+\:\.]*/)) throw Error('Invalid Parameter');
        if (sysid && !sysid.match(/^[\w\.][\w\-\/\\\:\.]*/)) throw Error('Invalid Parameter');
        if (subset && !subset.match(/[\w\s\<\>\+\.\!\#\-\?\*\,\(\)\|]*/)) throw Error('Invalid Parameter');

        pubid = pubid ? ' PUBLIC "' + pubid + '"' : (sysid) ? ' SYSTEM' : '';
        sysid = sysid ? ' "' + sysid + '"' : '';
        subset = subset ? ' [' + subset + ']': '';

        if (this.started_write) this.indenter();
        this.write('<!DOCTYPE ', name, pubid, sysid, subset);
        this.root = name;
        this.dtd = 1;
        this.started_write = true;
        return this;
    },

    endDocType : function () {
        if (!this.dtd) return this;
        this.write('>');
        return this;
    },

    writePI : function (name, content) {
        return this.startPI(name).text(content).endPI()
    },

    startPI : function (name) {
        name = strval(name);
        if (!name.match(this.name_regex)) throw Error('Invalid Parameter');
        if (this.pi) return this;
        if (this.attributes) this.endAttributes();
        if (this.started_write) this.indenter();
        this.write('<?', name);
        this.pi = 1;
        this.started_write = true;
        return this;
    },

    endPI : function () {
        if (!this.pi) return this;
        this.write('?>');
        this.pi = 0;
        return this;
    },

    writeCData : function (content) {
        return this.startCData().text(content).endCData();
    },

    startCData : function () {
        if (this.cdata) return this;
        if (this.attributes) this.endAttributes();
        this.indenter();
        this.write('<![CDATA[');
        this.cdata = 1;
        this.started_write = true;
        return this;
    },

    endCData : function () {
        if (!this.cdata) return this;
        this.write(']]>');
        this.cdata = 0;
        return this;
    },

    writeRaw : function(content) {
        content = strval(content);
        if (!this.tags && !this.comment && !this.pi && !this.cdata) return this;
        if (this.attributes && this.attribute) {
            ++this.texts;
            this.write(content.replace('&', '&amp;').replace('"', '&quot;'));
            return this;
        } else if (this.attributes && !this.attribute) {
            this.endAttributes();
        }
        ++this.texts;
        this.write(content);
        this.started_write = true;
        return this;
    }

}

module.exports = XMLWriter;


/***/ }),
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

(function webpackUniversalModuleDefinition(root, factory) {
	if(true)
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Sigma"] = factory();
	else
		root["Sigma"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 25);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setMatrixArrayType = setMatrixArrayType;
exports.toRadian = toRadian;
exports.equals = equals;
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

/**
 * Common utilities
 * @module glMatrix
 */

// Configuration Constants
var EPSILON = exports.EPSILON = 0.000001;
var ARRAY_TYPE = exports.ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
var RANDOM = exports.RANDOM = Math.random;

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
function setMatrixArrayType(type) {
  exports.ARRAY_TYPE = ARRAY_TYPE = type;
}

var degree = Math.PI / 180;

/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */
function toRadian(a) {
  return a * degree;
}

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
function equals(a, b) {
  return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = __webpack_require__(3);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Sigma.js Renderer Class
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * ========================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Abstract classes extended by all of sigma's renderers.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Renderer class.
 *
 * @constructor
 */
var Renderer = function (_EventEmitter) {
  _inherits(Renderer, _EventEmitter);

  function Renderer() {
    _classCallCheck(this, Renderer);

    return _possibleConstructorReturn(this, (Renderer.__proto__ || Object.getPrototypeOf(Renderer)).apply(this, arguments));
  }

  return Renderer;
}(_events.EventEmitter);

exports.default = Renderer;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.floatColor = floatColor;
exports.matrixFromCamera = matrixFromCamera;
exports.extractPixel = extractPixel;

var _glMatrix = __webpack_require__(7);

/**
 * Memoized function returning a float-encoded color from various string
 * formats describing colors.
 */
var FLOAT_COLOR_CACHE = {}; /**
                             * Sigma.js WebGL Renderer Utils
                             * ==============================
                             *
                             * Miscelleanous helper functions used by sigma's WebGL renderer.
                             */

// TODO: this is heavy for what we do with it


var RGBA_TEST_REGEX = /^\s*rgba?\s*\(/;
var RGBA_EXTRACT_REGEX = /^\s*rgba?\s*\(\s*([0-9]*)\s*,\s*([0-9]*)\s*,\s*([0-9]*)\s*(,.*)?\)\s*$/;

function floatColor(val) {

  // If the color is already computed, we yield it
  if (typeof FLOAT_COLOR_CACHE[val] !== 'undefined') return FLOAT_COLOR_CACHE[val];

  var r = 0,
      g = 0,
      b = 0;

  // Handling hexadecimal notation
  if (val[0] === '#') {
    if (val.length === 4) {
      r = parseInt(val.charAt(1) + val.charAt(1), 16);
      g = parseInt(val.charAt(2) + val.charAt(2), 16);
      b = parseInt(val.charAt(3) + val.charAt(3), 16);
    } else {
      r = parseInt(val.charAt(1) + val.charAt(2), 16);
      g = parseInt(val.charAt(3) + val.charAt(4), 16);
      b = parseInt(val.charAt(5) + val.charAt(6), 16);
    }
  }

  // Handling rgb notation
  else if (RGBA_TEST_REGEX.test(val)) {
      var match = val.match(RGBA_EXTRACT_REGEX);

      r = +match[1];
      g = +match[2];
      b = +match[3];
    }

  var color = r * 256 * 256 + g * 256 + b;

  FLOAT_COLOR_CACHE[val] = color;

  return color;
}

/**
 * Function returning a matrix from the current state of the camera.
 */

// TODO: it's possible to optimize this drastically!
function matrixFromCamera(state) {
  var angle = state.angle,
      ratio = state.ratio,
      x = state.x,
      y = state.y;


  var matrix = _glMatrix.mat3.create(),
      scale = _glMatrix.mat3.fromScaling(_glMatrix.mat3.create(), [1 / ratio, 1 / ratio]),
      rotation = _glMatrix.mat3.fromRotation(_glMatrix.mat3.create(), -angle),
      translation = _glMatrix.mat3.fromTranslation(_glMatrix.mat3.create(), [-x, -y]);

  _glMatrix.mat3.multiply(matrix, scale, rotation);
  _glMatrix.mat3.multiply(matrix, matrix, translation);

  return matrix;
}

/**
 * Function extracting the color at the given pixel.
 */
function extractPixel(gl, x, y, array) {
  var data = array || new Uint8Array(4);

  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

  return data;
}

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = __webpack_require__(3);

var _easings = __webpack_require__(24);

var easings = _interopRequireWildcard(_easings);

var _utils = __webpack_require__(14);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Sigma.js Camera Class
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * ======================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Class designed to store camera information & used to update it.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Defaults.
 */
var ANIMATE_DEFAULTS = {
  easing: 'quadraticInOut',
  duration: 150
};

var DEFAULT_ZOOMING_RATIO = 1.5;

// TODO: animate options = number polymorphism?
// TODO: pan, zoom, unzoom, reset, rotate, zoomTo
// TODO: add width / height to camera and add #.resize
// TODO: bind camera to renderer rather than sigma
// TODO: add #.graphToDisplay, #.displayToGraph, batch methods later

/**
 * Camera class
 *
 * @constructor
 */

var Camera = function (_EventEmitter) {
  _inherits(Camera, _EventEmitter);

  function Camera(dimensions) {
    _classCallCheck(this, Camera);

    dimensions = dimensions || {};

    // Properties
    var _this = _possibleConstructorReturn(this, (Camera.__proto__ || Object.getPrototypeOf(Camera)).call(this));

    _this.x = 0;
    _this.y = 0;
    _this.angle = 0;
    _this.ratio = 1;
    _this.width = dimensions.width || 0;
    _this.height = dimensions.height || 0;

    // State
    _this.nextFrame = null;
    _this.enabled = true;
    return _this;
  }

  /**
   * Method used to enable the camera.
   *
   * @return {Camera}
   */


  _createClass(Camera, [{
    key: 'enable',
    value: function enable() {
      this.enabled = true;
      return this;
    }

    /**
     * Method used to disable the camera.
     *
     * @return {Camera}
     */

  }, {
    key: 'disable',
    value: function disable() {
      this.enabled = false;
      return this;
    }

    /**
     * Method used to retrieve the camera's current state.
     *
     * @return {object}
     */

  }, {
    key: 'getState',
    value: function getState() {
      return {
        x: this.x,
        y: this.y,
        angle: this.angle,
        ratio: this.ratio
      };
    }

    /**
     * Method used to retrieve the camera's dimensions.
     *
     * @return {object}
     */

  }, {
    key: 'getDimensions',
    value: function getDimensions() {
      return {
        width: this.width,
        height: this.height
      };
    }

    /**
     * Method used to check whether the camera is currently being animated.
     *
     * @return {boolean}
     */

  }, {
    key: 'isAnimated',
    value: function isAnimated() {
      return !!this.nextFrame;
    }

    /**
     * Method returning the coordinates of a point from the display frame to the
     * graph one but ignores the offset and dimensions of the container.
     *
     * @param  {number} x The X coordinate.
     * @param  {number} y The Y coordinate.
     * @return {object}   The point coordinates in the frame of the graph.
     */

  }, {
    key: 'abstractDisplayToGraph',
    value: function abstractDisplayToGraph(x, y) {
      var cos = Math.cos(this.angle),
          sin = Math.sin(this.angle);

      return {
        x: (x * cos - y * sin) * this.ratio,
        y: (y * cos + x * sin) * this.ratio
      };
    }

    /**
     * Method returning the coordinates of a point from the display frame to the
     * graph one.
     *
     * @param  {number} x The X coordinate.
     * @param  {number} y The Y coordinate.
     * @return {object}   The point coordinates in the frame of the graph.
     */

  }, {
    key: 'displayToGraph',
    value: function displayToGraph(x, y) {
      var cos = Math.cos(this.angle),
          sin = Math.sin(this.angle);

      var xOffset = this.width / 2 - (this.x * cos + this.y * sin) / this.ratio,
          yOffset = this.height / 2 - (this.y * cos - this.x * sin) / this.ratio;

      var X = x - xOffset,
          Y = y - yOffset;

      return {
        x: (X * cos - Y * sin) * this.ratio,
        y: (Y * cos + X * sin) * this.ratio
      };
    }

    /**
     * Method returning the coordinates of a point from the graph frame to the
     * display one.
     *
     * @param  {number} x The X coordinate.
     * @param  {number} y The Y coordinate.
     * @return {object}   The point coordinates in the frame of the display.
     */

  }, {
    key: 'graphToDisplay',
    value: function graphToDisplay(x, y) {
      var relCos = Math.cos(this.angle) / this.ratio,
          relSin = Math.sin(this.angle) / this.ratio,
          xOffset = this.width / 2 - this.x * relCos - this.y * relSin,
          yOffset = this.height / 2 - this.y * relCos + this.x * relSin;

      return {
        x: x * relCos + y * relSin + xOffset,
        y: y * relCos - x * relSin + yOffset
      };
    }

    /**
     * Method used to set the camera's state.
     *
     * @param  {object} state - New state.
     * @return {Camera}
     */

  }, {
    key: 'setState',
    value: function setState(state) {

      if (!this.enabled) return this;

      // TODO: validations
      // TODO: update by function

      if ('x' in state) this.x = state.x;

      if ('y' in state) this.y = state.y;

      if ('angle' in state) this.angle = state.angle;

      if ('ratio' in state) this.ratio = state.ratio;

      // Emitting
      // TODO: don't emit if nothing changed?
      this.emit('updated', this.getState());

      return this;
    }

    /**
     * Method used to resize the camera's dimensions.
     *
     * @param  {object} dimensions - New dimensions.
     * @return {Camera}
     */

  }, {
    key: 'resize',
    value: function resize(dimensions) {

      if (!this.enabled) return this;

      if ('width' in dimensions) this.width = dimensions.width;

      if ('height' in dimensions) this.height = dimensions.height;

      this.emit('resized', this.getDimensions());

      return this;
    }

    /**
     * Method used to animate the camera.
     *
     * @param  {object}   state      - State to reach eventually.
     * @param  {object}   options    - Options:
     * @param  {number}     duration - Duration of the animation.
     * @param  {function} callback   - Callback
     * @return {function}            - Return a function to cancel the animation.
     */

  }, {
    key: 'animate',
    value: function animate(state, options /*, callback */) {
      var _this2 = this;

      if (!this.enabled) return this;

      // TODO: validation

      options = (0, _utils.assign)({}, ANIMATE_DEFAULTS, options);

      var easing = typeof options.easing === 'function' ? options.easing : easings[options.easing];

      // Canceling previous animation if needed
      if (this.nextFrame) cancelAnimationFrame(this.nextFrame);

      // State
      var start = Date.now(),
          initialState = this.getState();

      // Function performing the animation
      var fn = function fn() {
        var t = (Date.now() - start) / options.duration;

        // The animation is over:
        if (t >= 1) {
          _this2.nextFrame = null;
          _this2.setState(state);

          return;
        }

        var coefficient = easing(t);

        var newState = {};

        if ('x' in state) newState.x = initialState.x + (state.x - initialState.x) * coefficient;
        if ('y' in state) newState.y = initialState.y + (state.y - initialState.y) * coefficient;
        if ('angle' in state) newState.angle = initialState.angle + (state.angle - initialState.angle) * coefficient;
        if ('ratio' in state) newState.ratio = initialState.ratio + (state.ratio - initialState.ratio) * coefficient;

        _this2.setState(newState);

        _this2.nextFrame = requestAnimationFrame(fn);
      };

      if (this.nextFrame) {
        cancelAnimationFrame(this.nextFrame);
        this.nextFrame = requestAnimationFrame(fn);
      } else {
        fn();
      }
    }

    /**
     * Method used to zoom the camera.
     *
     * @param  {number|object} factorOrOptions - Factor or options.
     * @return {function}
     */

  }, {
    key: 'animatedZoom',
    value: function animatedZoom(factorOrOptions) {

      if (!factorOrOptions) {
        return this.animate({ ratio: this.ratio / DEFAULT_ZOOMING_RATIO });
      } else {
        if (typeof factorOrOptions === 'number') return this.animate({ ratio: this.ratio / factorOrOptions });else return this.animate({ ratio: this.ratio / (factorOrOptions.factor || DEFAULT_ZOOMING_RATIO) }, factorOrOptions);
      }
    }

    /**
     * Method used to unzoom the camera.
     *
     * @param  {number|object} factorOrOptions - Factor or options.
     * @return {function}
     */

  }, {
    key: 'animatedUnzoom',
    value: function animatedUnzoom(factorOrOptions) {

      if (!factorOrOptions) {
        return this.animate({ ratio: this.ratio * DEFAULT_ZOOMING_RATIO });
      } else {
        if (typeof factorOrOptions === 'number') return this.animate({ ratio: this.ratio * factorOrOptions });else return this.animate({ ratio: this.ratio * (factorOrOptions.factor || DEFAULT_ZOOMING_RATIO) }, factorOrOptions);
      }
    }

    /**
     * Method used to reset the camera.
     *
     * @param  {object} options - Options.
     * @return {function}
     */

  }, {
    key: 'animatedReset',
    value: function animatedReset(options) {
      return this.animate({
        x: 0,
        y: 0,
        ratio: 1,
        angle: 0
      }, options);
    }
  }]);

  return Camera;
}(_events.EventEmitter);

exports.default = Camera;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _captor = __webpack_require__(22);

var _captor2 = _interopRequireDefault(_captor);

var _utils = __webpack_require__(23);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Sigma.js Mouse Captor
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * ======================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Sigma's captor dealing with the user's mouse.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Constants.
 */
var DRAG_TIMEOUT = 200,
    MOUSE_INERTIA_DURATION = 200,
    MOUSE_INERTIA_RATIO = 3,
    MOUSE_ZOOM_DURATION = 200,
    ZOOMING_RATIO = 1.7,
    DOUBLE_CLICK_TIMEOUT = 300,
    DOUBLE_CLICK_ZOOMING_RATIO = 2.2,
    DOUBLE_CLICK_ZOOMING_DURATION = 200;

/**
 * Mouse captor class.
 *
 * @constructor
 */

var MouseCaptor = function (_Captor) {
  _inherits(MouseCaptor, _Captor);

  function MouseCaptor(container, camera) {
    _classCallCheck(this, MouseCaptor);

    // Properties
    var _this = _possibleConstructorReturn(this, (MouseCaptor.__proto__ || Object.getPrototypeOf(MouseCaptor)).call(this, container, camera));

    _this.container = container;
    _this.camera = camera;

    // State
    _this.enabled = true;
    _this.hasDragged = false;
    _this.downStartTime = null;
    _this.startMouseX = null;
    _this.startMouseY = null;
    _this.isMouseDown = false;
    _this.isMoving = true;
    _this.movingTimeout = null;
    _this.startCameraState = null;
    _this.lastCameraState = null;
    _this.clicks = 0;
    _this.doubleClickTimeout = null;
    _this.wheelLock = false;

    // Binding methods
    _this.handleClick = _this.handleClick.bind(_this);
    _this.handleDown = _this.handleDown.bind(_this);
    _this.handleUp = _this.handleUp.bind(_this);
    _this.handleMove = _this.handleMove.bind(_this);
    _this.handleWheel = _this.handleWheel.bind(_this);
    _this.handleOut = _this.handleOut.bind(_this);

    // Binding events
    container.addEventListener('click', _this.handleClick, false);
    container.addEventListener('mousedown', _this.handleDown, false);
    container.addEventListener('mousemove', _this.handleMove, false);
    container.addEventListener('DOMMouseScroll', _this.handleWheel, false);
    container.addEventListener('mousewheel', _this.handleWheel, false);
    container.addEventListener('mouseout', _this.handleOut, false);

    document.addEventListener('mouseup', _this.handleUp, false);
    return _this;
  }

  _createClass(MouseCaptor, [{
    key: 'handleClick',
    value: function handleClick(e) {
      var _this2 = this;

      if (!this.enabled) return;

      this.clicks++;

      if (this.clicks === 2) {
        this.clicks = 0;

        clearTimeout(this.doubleClickTimeout);
        this.doubleClickTimeout = null;

        return this.handleDoubleClick(e);
      }

      setTimeout(function () {
        _this2.clicks = 0;
        _this2.doubleClickTimeout = null;
      }, DOUBLE_CLICK_TIMEOUT);

      this.emit('click', (0, _utils.getMouseCoords)(e));
    }
  }, {
    key: 'handleDoubleClick',
    value: function handleDoubleClick(e) {
      if (!this.enabled) return;

      var ratio = 1 / DOUBLE_CLICK_ZOOMING_RATIO;

      var center = (0, _utils.getCenter)(e);

      var cameraState = this.camera.getState();

      var position = this.camera.abstractDisplayToGraph((0, _utils.getX)(e) - center.x, (0, _utils.getY)(e) - center.y);

      this.camera.animate({
        x: position.x * (1 - ratio) + cameraState.x,
        y: position.y * (1 - ratio) + cameraState.y,
        ratio: ratio * cameraState.ratio
      }, {
        easing: 'quadraticInOut',
        duration: DOUBLE_CLICK_ZOOMING_DURATION
      });

      if (e.preventDefault) e.preventDefault();else e.returnValue = false;

      e.stopPropagation();

      return false;
    }
  }, {
    key: 'handleDown',
    value: function handleDown(e) {
      if (!this.enabled) return;

      this.startCameraState = this.camera.getState();
      this.lastCameraState = this.startCameraState;

      this.startMouseX = (0, _utils.getX)(e);
      this.startMouseY = (0, _utils.getY)(e);

      this.hasDragged = false;

      this.downStartTime = Date.now();

      // TODO: dispatch events
      switch (e.which) {
        default:

          // Left button pressed
          this.isMouseDown = true;
          this.emit('mousedown', (0, _utils.getMouseCoords)(e));
      }
    }
  }, {
    key: 'handleUp',
    value: function handleUp(e) {
      if (!this.enabled || !this.isMouseDown) return;

      this.isMouseDown = false;

      if (this.movingTimeout) {
        this.movingTimeout = null;
        clearTimeout(this.movingTimeout);
      }

      var x = (0, _utils.getX)(e),
          y = (0, _utils.getY)(e);

      var cameraState = this.camera.getState();

      if (this.isMoving) {
        this.camera.animate({
          x: cameraState.x + MOUSE_INERTIA_RATIO * (cameraState.x - this.lastCameraState.x),
          y: cameraState.y + MOUSE_INERTIA_RATIO * (cameraState.y - this.lastCameraState.y)
        }, {
          duration: MOUSE_INERTIA_DURATION,
          easing: 'quadraticOut'
        });
      } else if (this.startMouseX !== x || this.startMouseY !== y) {
        this.camera.setState({
          x: cameraState.x,
          y: cameraState.y
        });
      }

      this.emit('mouseup', (0, _utils.getMouseCoords)(e));
      this.isMoving = false;
    }
  }, {
    key: 'handleMove',
    value: function handleMove(e) {
      var _this3 = this;

      if (!this.enabled) return;

      this.emit('mousemove', (0, _utils.getMouseCoords)(e));

      if (this.isMouseDown) {

        // TODO: dispatch events
        this.isMoving = true;
        this.hasDragged = true;

        if (this.movingTimeout) clearTimeout(this.movingTimeout);

        this.movingTimeout = setTimeout(function () {
          _this3.movingTimeout = null;
          _this3.isMoving = false;
        }, DRAG_TIMEOUT);

        var position = this.camera.abstractDisplayToGraph((0, _utils.getX)(e) - this.startMouseX, (0, _utils.getY)(e) - this.startMouseY);

        var x = this.startCameraState.x - position.x,
            y = this.startCameraState.y - position.y;

        var cameraState = this.camera.getState();

        if (cameraState.x !== x || cameraState.y !== y) {

          this.lastCameraState = cameraState;

          this.camera.setState({
            x: x,
            y: y
          });
        }
      }

      if (e.preventDefault) e.preventDefault();else e.returnValue = false;

      e.stopPropagation();

      return false;
    }
  }, {
    key: 'handleWheel',
    value: function handleWheel(e) {
      var _this4 = this;

      if (!this.enabled) return false;

      var delta = (0, _utils.getWheelDelta)(e);

      if (!delta) return false;

      if (this.wheelLock) return false;

      this.wheelLock = true;
      setTimeout(function () {
        return _this4.wheelLock = false;
      }, 30);

      // TODO: handle max zoom
      var ratio = delta > 0 ? 1 / ZOOMING_RATIO : ZOOMING_RATIO;

      var cameraState = this.camera.getState();

      var newRatio = ratio * cameraState.ratio;

      var center = (0, _utils.getCenter)(e);

      var position = this.camera.abstractDisplayToGraph((0, _utils.getX)(e) - center.x, (0, _utils.getY)(e) - center.y);

      this.camera.animate({
        x: position.x * (1 - ratio) + cameraState.x,
        y: position.y * (1 - ratio) + cameraState.y,
        ratio: newRatio
      }, {
        easing: this.camera.isAnimated() ? 'quadraticOut' : 'quadraticInOut',
        duration: MOUSE_ZOOM_DURATION
      });

      if (e.preventDefault) e.preventDefault();else e.returnValue = false;

      e.stopPropagation();

      return false;
    }
  }, {
    key: 'handleOut',
    value: function handleOut() {
      // TODO: dispatch event
    }
  }]);

  return MouseCaptor;
}(_captor2.default);

exports.default = MouseCaptor;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint no-nested-ternary: 0 */
/**
 * Sigma.js Quad Tree Class
 * =========================
 *
 * Class implementing the quad tree data structure used to solve hovers and
 * determine which elements are currently in the scope of the camera so that
 * we don't waste time rendering things the user cannot see anyway.
 */

// TODO: should not ask the quadtree when the camera has the whole graph in
// sight.

// TODO: a square can be represented as topleft + width

// TODO: jsdoc

// TODO: be sure we can handle cases overcoming boundaries (because of size) or use a max

// TODO: decide whether to store at leaf level or at medium levels (frustum vs. hover)

/**
 * Constants.
 *
 * Note that since we are representing a static 4-ary tree, the indices of the
 * quadrants are the following:
 *   - TOP_LEFT:     4i + b
 *   - TOP_RIGHT:    4i + 2b
 *   - BOTTOM_LEFT:  4i + 3b
 *   - BOTTOM_RIGHT: 4i + 4b
 */
var BLOCKS = 4,
    MAX_LEVEL = 5;

var X_OFFSET = 0,
    Y_OFFSET = 1,
    WIDTH_OFFSET = 2,
    HEIGHT_OFFSET = 3;

var TOP_LEFT = 1,
    TOP_RIGHT = 2,
    BOTTOM_LEFT = 3,
    BOTTOM_RIGHT = 4;

/**
 * Geometry helpers.
 */

/**
 * Function returning whether the given rectangle is axis-aligned.
 *
 * @param  {number} x1
 * @param  {number} y1
 * @param  {number} x2
 * @param  {number} y2
 * @return {boolean}
 */
function isAxisAligned(x1, y1, x2, y2) {
  return x1 === x2 || y1 === y2;
}

function rectangleCollidesWithQuad(x1, y1, w, qx, qy, qw, qh) {
  return x1 < qx + qw && x1 + w > qx && y1 < qy + qh && y1 + w > qy;
}

function pointIsInQuad(x, y, qx, qy, qw, qh) {
  var xmp = qx + qw / 2,
      ymp = qy + qh / 2,
      top = y < ymp,
      left = x < xmp;

  return top ? left ? TOP_LEFT : TOP_RIGHT : left ? BOTTOM_LEFT : BOTTOM_RIGHT;
}

/**
 * Helper functions that are not bound to the class so an external user
 * cannot mess with them.
 */
function buildQuadrants(maxLevel, data) {

  // [block, level]
  var stack = [0, 0];

  while (stack.length) {
    var level = stack.pop(),
        block = stack.pop();

    var topLeftBlock = 4 * block + BLOCKS,
        topRightBlock = 4 * block + 2 * BLOCKS,
        bottomLeftBlock = 4 * block + 3 * BLOCKS,
        bottomRightBlock = 4 * block + 4 * BLOCKS;

    var x = data[block + X_OFFSET],
        y = data[block + Y_OFFSET],
        width = data[block + WIDTH_OFFSET],
        height = data[block + HEIGHT_OFFSET],
        hw = width / 2,
        hh = height / 2;

    data[topLeftBlock + X_OFFSET] = x;
    data[topLeftBlock + Y_OFFSET] = y;
    data[topLeftBlock + WIDTH_OFFSET] = hw;
    data[topLeftBlock + HEIGHT_OFFSET] = hh;

    data[topRightBlock + X_OFFSET] = x + hw;
    data[topRightBlock + Y_OFFSET] = y;
    data[topRightBlock + WIDTH_OFFSET] = hw;
    data[topRightBlock + HEIGHT_OFFSET] = hh;

    data[bottomLeftBlock + X_OFFSET] = x;
    data[bottomLeftBlock + Y_OFFSET] = y + hh;
    data[bottomLeftBlock + WIDTH_OFFSET] = hw;
    data[bottomLeftBlock + HEIGHT_OFFSET] = hh;

    data[bottomRightBlock + X_OFFSET] = x + hw;
    data[bottomRightBlock + Y_OFFSET] = y + hh;
    data[bottomRightBlock + WIDTH_OFFSET] = hw;
    data[bottomRightBlock + HEIGHT_OFFSET] = hh;

    if (level < maxLevel - 1) {
      stack.push(bottomRightBlock, level + 1);
      stack.push(bottomLeftBlock, level + 1);
      stack.push(topRightBlock, level + 1);
      stack.push(topLeftBlock, level + 1);
    }
  }
}

function insertNode(maxLevel, data, containers, key, x, y, size) {
  var x1 = x - size,
      y1 = y - size,
      w = size * 2;

  // [block, level]
  // TODO: does not require a stack if sticking with mid-level containers
  var stack = [0, 0];

  while (stack.length) {
    var level = stack.pop();

    var block = stack.pop();

    // If we reached max level
    if (level >= maxLevel) {
      containers[block] = containers[block] || [];
      containers[block].push(key);
      return;
    }

    var topLeftBlock = 4 * block + BLOCKS,
        topRightBlock = 4 * block + 2 * BLOCKS,
        bottomLeftBlock = 4 * block + 3 * BLOCKS,
        bottomRightBlock = 4 * block + 4 * BLOCKS;

    var collidingWithTopLeft = rectangleCollidesWithQuad(x1, y1, w, data[topLeftBlock + X_OFFSET], data[topLeftBlock + Y_OFFSET], data[topLeftBlock + WIDTH_OFFSET], data[topLeftBlock + HEIGHT_OFFSET]);

    var collidingWithTopRight = rectangleCollidesWithQuad(x1, y1, w, data[topRightBlock + X_OFFSET], data[topRightBlock + Y_OFFSET], data[topRightBlock + WIDTH_OFFSET], data[topRightBlock + HEIGHT_OFFSET]);

    var collidingWithBottomLeft = rectangleCollidesWithQuad(x1, y1, w, data[bottomLeftBlock + X_OFFSET], data[bottomLeftBlock + Y_OFFSET], data[bottomLeftBlock + WIDTH_OFFSET], data[bottomLeftBlock + HEIGHT_OFFSET]);

    var collidingWithBottomRight = rectangleCollidesWithQuad(x1, y1, w, data[bottomRightBlock + X_OFFSET], data[bottomRightBlock + Y_OFFSET], data[bottomRightBlock + WIDTH_OFFSET], data[bottomRightBlock + HEIGHT_OFFSET]);

    var collisions = collidingWithTopLeft + collidingWithTopRight + collidingWithBottomLeft + collidingWithBottomRight;

    // If we don't have at least a collision, there is an issue
    if (collisions === 0) throw new Error("sigma/quadtree.insertNode: no collision (level: " + level + ", key: " + key + ", x: " + x + ", y: " + y + ", size: " + size + ").");

    // If we have 3 collisions, we have a geometry problem obviously
    if (collisions === 3) throw new Error("sigma/quadtree.insertNode: 3 impossible collisions (level: " + level + ", key: " + key + ", x: " + x + ", y: " + y + ", size: " + size + ").");

    // If we have more that one collision, we stop here and store the node
    // in the relevant containers
    if (collisions > 1) {
      containers[block] = containers[block] || [];
      containers[block].push(key);
      return;
    } else {
      level++;
    }

    // Else we recurse into the correct quads
    if (collidingWithTopLeft) stack.push(topLeftBlock, level);

    if (collidingWithTopRight) stack.push(topRightBlock, level);

    if (collidingWithBottomLeft) stack.push(bottomLeftBlock, level);

    if (collidingWithBottomRight) stack.push(bottomRightBlock, level);
  }
}

/**
 * QuadTree class.
 *
 * @constructor
 * @param {Graph} graph - A graph instance.
 */

var QuadTree = function () {
  function QuadTree(boundaries) {
    _classCallCheck(this, QuadTree);

    // Allocating the underlying byte array
    var L = Math.pow(4, MAX_LEVEL);

    this.data = new Float32Array(BLOCKS * ((4 * L - 1) / 3));
    this.containers = {};

    if (boundaries) this.resize(boundaries);
  }

  _createClass(QuadTree, [{
    key: "add",
    value: function add(key, x, y, size) {
      insertNode(MAX_LEVEL, this.data, this.containers, key, x, y, size);

      return this;
    }
  }, {
    key: "resize",
    value: function resize(boundaries) {
      this.clear();

      // Building the quadrants
      this.data[X_OFFSET] = boundaries.x;
      this.data[Y_OFFSET] = boundaries.y;
      this.data[WIDTH_OFFSET] = boundaries.width;
      this.data[HEIGHT_OFFSET] = boundaries.height;

      buildQuadrants(MAX_LEVEL, this.data);
    }
  }, {
    key: "clear",
    value: function clear() {
      this.containers = {};

      return this;
    }
  }, {
    key: "point",
    value: function point(x, y) {
      var nodes = [];

      var block = 0,
          level = 0;

      do {
        if (this.containers[block]) nodes.push.apply(nodes, this.containers[block]);

        var quad = pointIsInQuad(x, y, this.data[block + X_OFFSET], this.data[block + Y_OFFSET], this.data[block + WIDTH_OFFSET], this.data[block + HEIGHT_OFFSET]);

        block = 4 * block + quad * BLOCKS;
        level++;
      } while (level <= MAX_LEVEL);

      return nodes;
    }
  }]);

  return QuadTree;
}();

exports.default = QuadTree;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.vec4 = exports.vec3 = exports.vec2 = exports.quat = exports.mat4 = exports.mat3 = exports.mat2d = exports.mat2 = exports.glMatrix = undefined;

var _common = __webpack_require__(0);

var glMatrix = _interopRequireWildcard(_common);

var _mat = __webpack_require__(17);

var mat2 = _interopRequireWildcard(_mat);

var _mat2d = __webpack_require__(18);

var mat2d = _interopRequireWildcard(_mat2d);

var _mat2 = __webpack_require__(8);

var mat3 = _interopRequireWildcard(_mat2);

var _mat3 = __webpack_require__(19);

var mat4 = _interopRequireWildcard(_mat3);

var _quat = __webpack_require__(20);

var quat = _interopRequireWildcard(_quat);

var _vec = __webpack_require__(21);

var vec2 = _interopRequireWildcard(_vec);

var _vec2 = __webpack_require__(9);

var vec3 = _interopRequireWildcard(_vec2);

var _vec3 = __webpack_require__(10);

var vec4 = _interopRequireWildcard(_vec3);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.glMatrix = glMatrix;
exports.mat2 = mat2;
exports.mat2d = mat2d;
exports.mat3 = mat3;
exports.mat4 = mat4;
exports.quat = quat;
exports.vec2 = vec2;
exports.vec3 = vec3;
exports.vec4 = vec4; /**
                      * @fileoverview gl-matrix - High performance matrix and vector operations
                      * @author Brandon Jones
                      * @author Colin MacKenzie IV
                      * @version 2.4.0
                      */

/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */
// END HEADER

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sub = exports.mul = undefined;
exports.create = create;
exports.fromMat4 = fromMat4;
exports.clone = clone;
exports.copy = copy;
exports.fromValues = fromValues;
exports.set = set;
exports.identity = identity;
exports.transpose = transpose;
exports.invert = invert;
exports.adjoint = adjoint;
exports.determinant = determinant;
exports.multiply = multiply;
exports.translate = translate;
exports.rotate = rotate;
exports.scale = scale;
exports.fromTranslation = fromTranslation;
exports.fromRotation = fromRotation;
exports.fromScaling = fromScaling;
exports.fromMat2d = fromMat2d;
exports.fromQuat = fromQuat;
exports.normalFromMat4 = normalFromMat4;
exports.projection = projection;
exports.str = str;
exports.frob = frob;
exports.add = add;
exports.subtract = subtract;
exports.multiplyScalar = multiplyScalar;
exports.multiplyScalarAndAdd = multiplyScalarAndAdd;
exports.exactEquals = exactEquals;
exports.equals = equals;

var _common = __webpack_require__(0);

var glMatrix = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(9);
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {mat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

function fromMat4(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[4];
  out[4] = a[5];
  out[5] = a[6];
  out[6] = a[8];
  out[7] = a[9];
  out[8] = a[10];
  return out;
}

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(9);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}

/**
 * Create a new mat3 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} A new mat3
 */
function fromValues(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  var out = new glMatrix.ARRAY_TYPE(9);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}

/**
 * Set the components of a mat3 to the given values
 *
 * @param {mat3} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} out
 */
function set(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a12 = a[5];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a01;
    out[5] = a[7];
    out[6] = a02;
    out[7] = a12;
  } else {
    out[0] = a[0];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a[1];
    out[4] = a[4];
    out[5] = a[7];
    out[6] = a[2];
    out[7] = a[5];
    out[8] = a[8];
  }

  return out;
}

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
function invert(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];

  var b01 = a22 * a11 - a12 * a21;
  var b11 = -a22 * a10 + a12 * a20;
  var b21 = a21 * a10 - a11 * a20;

  // Calculate the determinant
  var det = a00 * b01 + a01 * b11 + a02 * b21;

  if (!det) {
    return null;
  }
  det = 1.0 / det;

  out[0] = b01 * det;
  out[1] = (-a22 * a01 + a02 * a21) * det;
  out[2] = (a12 * a01 - a02 * a11) * det;
  out[3] = b11 * det;
  out[4] = (a22 * a00 - a02 * a20) * det;
  out[5] = (-a12 * a00 + a02 * a10) * det;
  out[6] = b21 * det;
  out[7] = (-a21 * a00 + a01 * a20) * det;
  out[8] = (a11 * a00 - a01 * a10) * det;
  return out;
}

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
function adjoint(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];

  out[0] = a11 * a22 - a12 * a21;
  out[1] = a02 * a21 - a01 * a22;
  out[2] = a01 * a12 - a02 * a11;
  out[3] = a12 * a20 - a10 * a22;
  out[4] = a00 * a22 - a02 * a20;
  out[5] = a02 * a10 - a00 * a12;
  out[6] = a10 * a21 - a11 * a20;
  out[7] = a01 * a20 - a00 * a21;
  out[8] = a00 * a11 - a01 * a10;
  return out;
}

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];

  return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
}

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
function multiply(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];

  var b00 = b[0],
      b01 = b[1],
      b02 = b[2];
  var b10 = b[3],
      b11 = b[4],
      b12 = b[5];
  var b20 = b[6],
      b21 = b[7],
      b22 = b[8];

  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22;

  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
  out[5] = b10 * a02 + b11 * a12 + b12 * a22;

  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
  return out;
}

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
function translate(out, a, v) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a10 = a[3],
      a11 = a[4],
      a12 = a[5],
      a20 = a[6],
      a21 = a[7],
      a22 = a[8],
      x = v[0],
      y = v[1];

  out[0] = a00;
  out[1] = a01;
  out[2] = a02;

  out[3] = a10;
  out[4] = a11;
  out[5] = a12;

  out[6] = x * a00 + y * a10 + a20;
  out[7] = x * a01 + y * a11 + a21;
  out[8] = x * a02 + y * a12 + a22;
  return out;
}

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
function rotate(out, a, rad) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a10 = a[3],
      a11 = a[4],
      a12 = a[5],
      a20 = a[6],
      a21 = a[7],
      a22 = a[8],
      s = Math.sin(rad),
      c = Math.cos(rad);

  out[0] = c * a00 + s * a10;
  out[1] = c * a01 + s * a11;
  out[2] = c * a02 + s * a12;

  out[3] = c * a10 - s * a00;
  out[4] = c * a11 - s * a01;
  out[5] = c * a12 - s * a02;

  out[6] = a20;
  out[7] = a21;
  out[8] = a22;
  return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
function scale(out, a, v) {
  var x = v[0],
      y = v[1];

  out[0] = x * a[0];
  out[1] = x * a[1];
  out[2] = x * a[2];

  out[3] = y * a[3];
  out[4] = y * a[4];
  out[5] = y * a[5];

  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.translate(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {vec2} v Translation vector
 * @returns {mat3} out
 */
function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = v[0];
  out[7] = v[1];
  out[8] = 1;
  return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.rotate(dest, dest, rad);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
function fromRotation(out, rad) {
  var s = Math.sin(rad),
      c = Math.cos(rad);

  out[0] = c;
  out[1] = s;
  out[2] = 0;

  out[3] = -s;
  out[4] = c;
  out[5] = 0;

  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.scale(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat3} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;

  out[3] = 0;
  out[4] = v[1];
  out[5] = 0;

  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat2d} a the matrix to copy
 * @returns {mat3} out
 **/
function fromMat2d(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = 0;

  out[3] = a[2];
  out[4] = a[3];
  out[5] = 0;

  out[6] = a[4];
  out[7] = a[5];
  out[8] = 1;
  return out;
}

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
function fromQuat(out, q) {
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;

  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;

  out[0] = 1 - yy - zz;
  out[3] = yx - wz;
  out[6] = zx + wy;

  out[1] = yx + wz;
  out[4] = 1 - xx - zz;
  out[7] = zy - wx;

  out[2] = zx - wy;
  out[5] = zy + wx;
  out[8] = 1 - xx - yy;

  return out;
}

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
function normalFromMat4(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }
  det = 1.0 / det;

  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

  out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

  out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

  return out;
}

/**
 * Generates a 2D projection matrix with the given bounds
 *
 * @param {mat3} out mat3 frustum matrix will be written into
 * @param {number} width Width of your gl context
 * @param {number} height Height of gl context
 * @returns {mat3} out
 */
function projection(out, width, height) {
  out[0] = 2 / width;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = -2 / height;
  out[5] = 0;
  out[6] = -1;
  out[7] = 1;
  out[8] = 1;
  return out;
}

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' + a[8] + ')';
}

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {mat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2));
}

/**
 * Adds two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat3} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  return out;
}

/**
 * Adds two mat3's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat3} out the receiving vector
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat3} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat3} a The first matrix.
 * @param {mat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat3} a The first matrix.
 * @param {mat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5],
      a6 = a[6],
      a7 = a[7],
      a8 = a[8];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3],
      b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7],
      b8 = b[8];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8));
}

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link mat3.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forEach = exports.sqrLen = exports.len = exports.sqrDist = exports.dist = exports.div = exports.mul = exports.sub = undefined;
exports.create = create;
exports.clone = clone;
exports.length = length;
exports.fromValues = fromValues;
exports.copy = copy;
exports.set = set;
exports.add = add;
exports.subtract = subtract;
exports.multiply = multiply;
exports.divide = divide;
exports.ceil = ceil;
exports.floor = floor;
exports.min = min;
exports.max = max;
exports.round = round;
exports.scale = scale;
exports.scaleAndAdd = scaleAndAdd;
exports.distance = distance;
exports.squaredDistance = squaredDistance;
exports.squaredLength = squaredLength;
exports.negate = negate;
exports.inverse = inverse;
exports.normalize = normalize;
exports.dot = dot;
exports.cross = cross;
exports.lerp = lerp;
exports.hermite = hermite;
exports.bezier = bezier;
exports.random = random;
exports.transformMat4 = transformMat4;
exports.transformMat3 = transformMat3;
exports.transformQuat = transformQuat;
exports.rotateX = rotateX;
exports.rotateY = rotateY;
exports.rotateZ = rotateZ;
exports.angle = angle;
exports.str = str;
exports.exactEquals = exactEquals;
exports.equals = equals;

var _common = __webpack_require__(0);

var glMatrix = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(3);
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  return out;
}

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues(x, y, z) {
  var out = new glMatrix.ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
function set(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}

/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to ceil
 * @returns {vec3} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}

/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to floor
 * @returns {vec3} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}

/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to round
 * @returns {vec3} out
 */
function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  return out;
}

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to invert
 * @returns {vec3} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
}

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
  }
  return out;
}

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];

  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}

/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {vec3} c the third operand
 * @param {vec3} d the fourth operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);

  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;

  return out;
}

/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {vec3} c the third operand
 * @param {vec3} d the fourth operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;

  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;

  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
function random(out, scale) {
  scale = scale || 1.0;

  var r = glMatrix.RANDOM() * 2.0 * Math.PI;
  var z = glMatrix.RANDOM() * 2.0 - 1.0;
  var zScale = Math.sqrt(1.0 - z * z) * scale;

  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
function transformMat3(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
function transformQuat(out, a, q) {
  // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

  var x = a[0],
      y = a[1],
      z = a[2];
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];

  // calculate quat * vec
  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z;

  // calculate result * inverse quat
  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  return out;
}

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateX(out, a, b, c) {
  var p = [],
      r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[0];
  r[1] = p[1] * Math.cos(c) - p[2] * Math.sin(c);
  r[2] = p[1] * Math.sin(c) + p[2] * Math.cos(c);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];

  return out;
}

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateY(out, a, b, c) {
  var p = [],
      r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[2] * Math.sin(c) + p[0] * Math.cos(c);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(c) - p[0] * Math.sin(c);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];

  return out;
}

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateZ(out, a, b, c) {
  var p = [],
      r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[0] * Math.cos(c) - p[1] * Math.sin(c);
  r[1] = p[0] * Math.sin(c) + p[1] * Math.cos(c);
  r[2] = p[2];

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];

  return out;
}

/**
 * Get the angle between two 3D vectors
 * @param {vec3} a The first operand
 * @param {vec3} b The second operand
 * @returns {Number} The angle in radians
 */
function angle(a, b) {
  var tempA = fromValues(a[0], a[1], a[2]);
  var tempB = fromValues(b[0], b[1], b[2]);

  normalize(tempA, tempA);
  normalize(tempB, tempB);

  var cosine = dot(tempA, tempB);

  if (cosine > 1.0) {
    return 0;
  } else if (cosine < -1.0) {
    return Math.PI;
  } else {
    return Math.acos(cosine);
  }
}

/**
 * Returns a string representation of a vector
 *
 * @param {vec3} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function str(a) {
  return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
}

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link vec3.divide}
 * @function
 */
var div = exports.div = divide;

/**
 * Alias for {@link vec3.distance}
 * @function
 */
var dist = exports.dist = distance;

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
var sqrDist = exports.sqrDist = squaredDistance;

/**
 * Alias for {@link vec3.length}
 * @function
 */
var len = exports.len = length;

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
var sqrLen = exports.sqrLen = squaredLength;

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach = exports.forEach = function () {
  var vec = create();

  return function (a, stride, offset, count, fn, arg) {
    var i = void 0,
        l = void 0;
    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];
    }

    return a;
  };
}();

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forEach = exports.sqrLen = exports.len = exports.sqrDist = exports.dist = exports.div = exports.mul = exports.sub = undefined;
exports.create = create;
exports.clone = clone;
exports.fromValues = fromValues;
exports.copy = copy;
exports.set = set;
exports.add = add;
exports.subtract = subtract;
exports.multiply = multiply;
exports.divide = divide;
exports.ceil = ceil;
exports.floor = floor;
exports.min = min;
exports.max = max;
exports.round = round;
exports.scale = scale;
exports.scaleAndAdd = scaleAndAdd;
exports.distance = distance;
exports.squaredDistance = squaredDistance;
exports.length = length;
exports.squaredLength = squaredLength;
exports.negate = negate;
exports.inverse = inverse;
exports.normalize = normalize;
exports.dot = dot;
exports.lerp = lerp;
exports.random = random;
exports.transformMat4 = transformMat4;
exports.transformQuat = transformQuat;
exports.str = str;
exports.exactEquals = exactEquals;
exports.equals = equals;

var _common = __webpack_require__(0);

var glMatrix = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  return out;
}

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {vec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
function fromValues(x, y, z, w) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the source vector
 * @returns {vec4} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
function set(out, x, y, z, w) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  out[3] = a[3] * b[3];
  return out;
}

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  out[3] = a[3] / b[3];
  return out;
}

/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to ceil
 * @returns {vec4} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  out[3] = Math.ceil(a[3]);
  return out;
}

/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to floor
 * @returns {vec4} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  out[3] = Math.floor(a[3]);
  return out;
}

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  out[3] = Math.min(a[3], b[3]);
  return out;
}

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  out[3] = Math.max(a[3], b[3]);
  return out;
}

/**
 * Math.round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to round
 * @returns {vec4} out
 */
function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  out[3] = Math.round(a[3]);
  return out;
}

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return x * x + y * y + z * z + w * w;
}

/**
 * Calculates the length of a vec4
 *
 * @param {vec4} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared length of a vec4
 *
 * @param {vec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return x * x + y * y + z * z + w * w;
}

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to negate
 * @returns {vec4} out
 */
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = -a[3];
  return out;
}

/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to invert
 * @returns {vec4} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
}

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
  }
  return out;
}

/**
 * Calculates the dot product of two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  var aw = a[3];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  out[3] = aw + t * (b[3] - aw);
  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */
function random(out, vectorScale) {
  vectorScale = vectorScale || 1.0;

  //TODO: This is a pretty awful way of doing this. Find something better.
  out[0] = glMatrix.RANDOM();
  out[1] = glMatrix.RANDOM();
  out[2] = glMatrix.RANDOM();
  out[3] = glMatrix.RANDOM();
  normalize(out, out);
  scale(out, out, vectorScale);
  return out;
}

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec4} out
 */
function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec4} out
 */
function transformQuat(out, a, q) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];

  // calculate quat * vec
  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z;

  // calculate result * inverse quat
  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  out[3] = a[3];
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {vec4} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function str(a) {
  return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {vec4} a The first vector.
 * @param {vec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec4} a The first vector.
 * @param {vec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link vec4.divide}
 * @function
 */
var div = exports.div = divide;

/**
 * Alias for {@link vec4.distance}
 * @function
 */
var dist = exports.dist = distance;

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
var sqrDist = exports.sqrDist = squaredDistance;

/**
 * Alias for {@link vec4.length}
 * @function
 */
var len = exports.len = length;

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
var sqrLen = exports.sqrLen = squaredLength;

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach = exports.forEach = function () {
  var vec = create();

  return function (a, stride, offset, count, fn, arg) {
    var i = void 0,
        l = void 0;
    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];vec[1] = a[i + 1];vec[2] = a[i + 2];vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];a[i + 1] = vec[1];a[i + 2] = vec[2];a[i + 3] = vec[3];
    }

    return a;
  };
}();

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = drawLabel;
/**
 * Sigma.js Canvas Renderer Label Component
 * =========================================
 *
 * Function used by the canvas renderer to display a single node's label.
 */
function drawLabel(context, data) {
  context.fillStyle = '#000';
  context.font = '14px arial';

  context.fillText(data.label, data.x + data.size + 3, data.y + 14 / 3);
}

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createElement = createElement;
exports.getPixelRatio = getPixelRatio;
exports.createNodeRescalingFunction = createNodeRescalingFunction;
/**
 * Sigma.js Rendering Utils
 * ===========================
 *
 * Helpers used by most renderers.
 */

/**
 * Function used to create DOM elements easily.
 *
 * @param  {string} tag        - Tag name of the element to create.
 * @param  {object} attributes - Attributes map.
 * @return {HTMLElement}
 */
function createElement(tag, attributes) {
  var element = document.createElement(tag);

  if (!attributes) return element;

  for (var k in attributes) {
    if (k === 'style') {
      for (var s in attributes[k]) {
        element.style[s] = attributes[k][s];
      }
    } else {
      element.setAttribute(k, attributes[k]);
    }
  }

  return element;
}

/**
 * Function returning the browser's pixel ratio.
 *
 * @return {number}
 */
function getPixelRatio() {
  var screen = window.screen;

  if (typeof screen.deviceXDPI !== 'undefined' && typeof screen.logicalXDPI !== 'undefined' && screen.deviceXDPI > screen.logicalXDPI) return screen.systemXDPI / screen.logicalXDPI;else if (typeof window.devicePixelRatio !== 'undefined') return window.devicePixelRatio;

  return 1;
}

/**
 * Default rescale options.
 */
var DEFAULT_NODE_RESCALE_OPTIONS = {
  mode: 'inside',
  margin: 0,
  minSize: 1,
  maxSize: 8
};

var DEFAULT_EDGE_RESCALE_OPTIONS = {
  minSize: 0.5,
  maxSize: 1
};

// TODO: should we let the user handle size through, for instance, d3 scales?
// TODO: should we put the rescaling in the camera itself?

/**
 * Factory returning a function rescaling the given node's position and/or size.
 *
 * @param  {object}   options - Options.
 * @param  {object}   extent  - Extent of the graph.
 * @return {function}
 */
function createNodeRescalingFunction(options, extent) {
  options = options || {};

  var mode = options.mode || DEFAULT_NODE_RESCALE_OPTIONS.mode,
      height = options.height || 1,
      width = options.width || 1;

  var maxX = extent.maxX,
      maxY = extent.maxY,
      minX = extent.minX,
      minY = extent.minY;


  var hx = (maxX + minX) / 2,
      hy = (maxY + minY) / 2;

  var scale = mode === 'outside' ? Math.max(width / Math.max(maxX - minX, 1), height / Math.max(maxY - minY, 1)) : Math.min(width / Math.max(maxX - minX, 1), height / Math.max(maxY - minY, 1));

  var fn = function fn(data) {
    return {
      x: (data.x - hx) * scale,
      y: (data.y - hy) * scale
    };
  };

  fn.inverse = function (data) {
    return {
      x: data.x / scale + hx,
      y: data.y / scale + hy
    };
  };

  return fn;
}

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Sigma.js WebGL Renderer Program
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * ================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Class representing a single WebGL program used by sigma's WebGL renderer.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _utils = __webpack_require__(30);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Program class.
 *
 * @constructor
 */
var Program = function () {
  function Program(gl, vertexShaderSource, fragmentShaderSource) {
    _classCallCheck(this, Program);

    this.vertexShaderSource = vertexShaderSource;
    this.fragmentShaderSource = fragmentShaderSource;

    this.load(gl);
  }

  /**
   * Method used to load the program into a webgl context.
   *
   * @param  {WebGLContext} gl - The WebGL context.
   * @return {WebGLProgram}
   */


  _createClass(Program, [{
    key: 'load',
    value: function load(gl) {
      this.vertexShader = (0, _utils.loadVertexShader)(gl, this.vertexShaderSource);
      this.fragmentShader = (0, _utils.loadFragmentShader)(gl, this.fragmentShaderSource);

      this.program = (0, _utils.loadProgram)(gl, [this.vertexShader, this.fragmentShader]);

      return this.program;
    }
  }]);

  return Program;
}();

exports.default = Program;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assign = assign;
/**
 * Sigma.js Utils
 * ===============
 *
 * Various helper functions & classes used throughout the library.
 */

/**
 * Very simple Object.assign-like function.
 *
 * @param  {object} target       - First object.
 * @param  {object} [...objects] - Objects to merge.
 * @return {object}
 */
function assign(target) {
  target = target || {};

  for (var _len = arguments.length, objects = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    objects[_key - 1] = arguments[_key];
  }

  for (var i = 0, l = objects.length; i < l; i++) {
    if (!objects[i]) continue;

    for (var k in objects[i]) {
      target[k] = objects[i][k];
    }
  }

  return target;
}

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _glMatrix = __webpack_require__(7);

var _renderer = __webpack_require__(1);

var _renderer2 = _interopRequireDefault(_renderer);

var _camera = __webpack_require__(4);

var _camera2 = _interopRequireDefault(_camera);

var _mouse = __webpack_require__(5);

var _mouse2 = _interopRequireDefault(_mouse);

var _quadtree = __webpack_require__(6);

var _quadtree2 = _interopRequireDefault(_quadtree);

var _node = __webpack_require__(29);

var _node2 = _interopRequireDefault(_node);

var _edge = __webpack_require__(28);

var _edge2 = _interopRequireDefault(_edge);

var _label = __webpack_require__(11);

var _label2 = _interopRequireDefault(_label);

var _hover = __webpack_require__(26);

var _hover2 = _interopRequireDefault(_hover);

var _utils = __webpack_require__(14);

var _utils2 = __webpack_require__(12);

var _utils3 = __webpack_require__(2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Sigma.js WebGL Renderer
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * ========================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * File implementing sigma's WebGL Renderer.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * Constants.
 */
var PIXEL_RATIO = (0, _utils2.getPixelRatio)();
var WEBGL_OVERSAMPLING_RATIO = (0, _utils2.getPixelRatio)();

/**
 * Main class.
 *
 * @constructor
 * @param {HTMLElement} container - The graph's container.
 */

var WebGLRenderer = function (_Renderer) {
  _inherits(WebGLRenderer, _Renderer);

  function WebGLRenderer(container) {
    _classCallCheck(this, WebGLRenderer);

    // Validating
    var _this = _possibleConstructorReturn(this, (WebGLRenderer.__proto__ || Object.getPrototypeOf(WebGLRenderer)).call(this));

    if (!(container instanceof HTMLElement)) throw new Error('sigma/renderers/webgl: container should be an html element.');

    // Properties
    _this.sigma = null;
    _this.captors = {};
    _this.container = container;
    _this.elements = {};
    _this.contexts = {};
    _this.listeners = {};

    _this.quadtree = new _quadtree2.default();

    _this.nodeArray = null;
    _this.nodeIndicesArray = null;
    _this.nodeOrder = {};

    // TODO: this could be improved by key => index => floatArray
    _this.nodeDataCache = {};
    _this.edgeArray = null;
    _this.edgeIndicesArray = null;
    _this.edgeOrder = {};

    // TODO: if we drop size scaling => this should become "rescalingFunction"
    _this.nodeRescalingFunction = null;

    // Starting dimensions
    _this.width = 0;
    _this.height = 0;

    // State
    _this.highlightedNodes = new Set();
    _this.hoveredNode = null;
    _this.wasRenderedInThisFrame = false;
    _this.renderFrame = null;
    _this.renderHighlightedNodesFrame = null;
    _this.needToProcess = false;
    _this.needToSoftProcess = false;
    _this.pixel = new Uint8Array(4);

    // Initializing contexts
    _this.createContext('edges');
    _this.createContext('nodes');
    _this.createContext('labels', false);
    _this.createContext('hovers', false);
    _this.createContext('mouse', false);

    // Blending
    var gl = _this.contexts.nodes;

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    gl = _this.contexts.edges;

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    // Loading programs
    _this.nodePrograms = {
      def: new _node2.default(_this.contexts.nodes)
    };
    _this.edgePrograms = {
      def: new _edge2.default(_this.contexts.edges)
    };

    // Initial resize
    _this.resize();

    // Initializing the camera
    _this.camera = new _camera2.default({
      width: _this.width,
      height: _this.height
    });

    // Binding camera events
    _this.bindCameraHandlers();

    // Initializing captors
    _this.captors = {
      mouse: new _mouse2.default(_this.elements.mouse, _this.camera)
    };

    // Binding event handlers
    _this.bindEventHandlers();
    return _this;
  }

  /**---------------------------------------------------------------------------
   * Internal methods.
   **---------------------------------------------------------------------------
   */

  /**
   * Method used to test a pixel of the given context.
   *
   * @param  {WebGLContext} gl - Context.
   * @param  {number}       x  - Client x.
   * @param  {number}       y  - Client y.
   * @return {boolean}
   */


  _createClass(WebGLRenderer, [{
    key: 'testPixel',
    value: function testPixel(gl, x, y) {
      (0, _utils3.extractPixel)(gl, x * WEBGL_OVERSAMPLING_RATIO, (this.height - y) * WEBGL_OVERSAMPLING_RATIO, this.pixel);

      return this.pixel[3] !== 0;
    }

    /**
     * Internal function used to create a canvas context and add the relevant
     * DOM elements.
     *
     * @param  {string}  id    - Context's id.
     * @param  {boolean} webgl - Whether the context is a webgl or canvas one.
     * @return {WebGLRenderer}
     */

  }, {
    key: 'createContext',
    value: function createContext(id) {
      var webgl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var element = (0, _utils2.createElement)('canvas', {
        class: 'sigma-' + id,
        style: {
          position: 'absolute'
        }
      });

      this.elements[id] = element;
      this.container.appendChild(element);

      var contextOptions = {
        preserveDrawingBuffer: true,
        antialias: false
      };

      var context = element.getContext(webgl ? 'webgl' : '2d', contextOptions);

      this.contexts[id] = context;

      return this;
    }

    /**
     * Method binding camera handlers.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'bindCameraHandlers',
    value: function bindCameraHandlers() {
      var _this2 = this;

      this.listeners.camera = function () {
        _this2.scheduleRender();
      };

      this.camera.on('updated', this.listeners.camera);

      return this;
    }

    /**
     * Method binding event handlers.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'bindEventHandlers',
    value: function bindEventHandlers() {
      var _this3 = this;

      // Handling window resize
      this.listeners.handleResize = function () {
        _this3.needToSoftProcess = true;
        _this3.scheduleRender();
      };

      window.addEventListener('resize', this.listeners.handleResize);

      // Function checking if the mouse is on the given node
      var mouseIsOnNode = function mouseIsOnNode(mouseX, mouseY, nodeX, nodeY, size) {
        return mouseX > nodeX - size && mouseX < nodeX + size && mouseY > nodeY - size && mouseY < nodeY + size && Math.sqrt(Math.pow(mouseX - nodeX, 2) + Math.pow(mouseY - nodeY, 2)) < size;
      };

      // Function returning the nodes in the mouse's quad
      var getQuadNodes = function getQuadNodes(mouseX, mouseY) {

        var mouseGraphPosition = _this3.camera.displayToGraph(mouseX, mouseY);

        return _this3.quadtree.point(mouseGraphPosition.x, mouseGraphPosition.y);
      };

      // Handling mouse move
      this.listeners.handleMove = function (e) {

        // NOTE: for the canvas renderer, testing the pixel's alpha should
        // give some boost but this slows things down for WebGL empirically.

        // TODO: this should be a method from the camera (or can be passed to graph to display somehow)
        var sizeRatio = Math.pow(_this3.camera.getState().ratio, 0.5);

        var quadNodes = getQuadNodes(e.x, e.y);

        for (var i = 0, l = quadNodes.length; i < l; i++) {
          var node = quadNodes[i];

          var data = _this3.nodeDataCache[node];

          var pos = _this3.camera.graphToDisplay(data.x, data.y);

          var size = data.size / sizeRatio;

          if (mouseIsOnNode(e.x, e.y, pos.x, pos.y, size)) {
            _this3.hoveredNode = node;

            _this3.emit('overNode', { node: node });
            return _this3.scheduleHighlightedNodesRender();
          }
        }

        // Checking if the hovered node is still hovered
        if (_this3.hoveredNode) {
          var _data = _this3.nodeDataCache[_this3.hoveredNode];

          var _pos = _this3.camera.graphToDisplay(_data.x, _data.y);

          var _size = _data.size / sizeRatio;

          if (!mouseIsOnNode(e.x, e.y, _pos.x, _pos.y, _size)) {
            _this3.hoveredNode = null;

            _this3.emit('outNode', { node: _this3.hoveredNode });
            return _this3.scheduleHighlightedNodesRender();
          }
        }
      };

      // Handling down
      this.listeners.handleDown = function (e) {
        var sizeRatio = Math.pow(_this3.camera.getState().ratio, 0.5);

        var quadNodes = getQuadNodes(e.x, e.y);

        for (var i = 0, l = quadNodes.length; i < l; i++) {
          var node = quadNodes[i];

          var data = _this3.nodeDataCache[node];

          var pos = _this3.camera.graphToDisplay(data.x, data.y);

          var size = data.size / sizeRatio;

          if (mouseIsOnNode(e.x, e.y, pos.x, pos.y, size)) return _this3.emit('downNode', { node: node });
        }
      };

      // Handling click
      this.listeners.handleClick = function (e) {
        var sizeRatio = Math.pow(_this3.camera.getState().ratio, 0.5);

        var quadNodes = getQuadNodes(e.x, e.y);

        for (var i = 0, l = quadNodes.length; i < l; i++) {
          var node = quadNodes[i];

          var data = _this3.nodeDataCache[node];

          var pos = _this3.camera.graphToDisplay(data.x, data.y);

          var size = data.size / sizeRatio;

          if (mouseIsOnNode(e.x, e.y, pos.x, pos.y, size)) return _this3.emit('clickNode', { node: node });
        }

        return _this3.emit('clickStage');
      };

      // TODO: optimize, we don't need to repeat collisions
      this.captors.mouse.on('mousemove', this.listeners.handleMove);
      this.captors.mouse.on('mousedown', this.listeners.handleDown);
      this.captors.mouse.on('click', this.listeners.handleClick);

      return this;
    }

    /**
     * Method binding graph handlers
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'bindGraphHandlers',
    value: function bindGraphHandlers() {
      var _this4 = this;

      var graph = this.sigma.getGraph();

      this.listeners.graphUpdate = function () {
        _this4.needToProcess = true;
        _this4.scheduleRender();
      };

      this.listeners.softGraphUpdate = function () {
        _this4.needToSoftProcess = true;
        _this4.scheduleRender();
      };

      // TODO: bind this on composed state events
      // TODO: it could be possible to update only specific node etc. by holding
      // a fixed-size pool of updated items
      graph.on('nodeAdded', this.listeners.graphUpdate);
      graph.on('nodeDropped', this.listeners.graphUpdate);
      graph.on('nodeAttributesUpdated', this.listeners.softGraphUpdate);
      graph.on('edgeAdded', this.listeners.graphUpdate);
      graph.on('nodeDropped', this.listeners.graphUpdate);
      graph.on('edgeAttributesUpdated', this.listeners.softGraphUpdate);
      graph.on('cleared', this.listeners.graphUpdate);

      return this;
    }

    /**
     * Method used to process the whole graph's data.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'process',
    value: function process() {
      var keepArrays = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


      var graph = this.sigma.getGraph();

      // TODO: possible to index this somehow using two byte arrays or so
      var extent = this.sigma.getGraphExtent();

      // Rescaling function
      this.nodeRescalingFunction = (0, _utils2.createNodeRescalingFunction)({ width: this.width, height: this.height }, extent);

      var minRescaled = this.nodeRescalingFunction({
        x: extent.minX,
        y: extent.minY
      });

      var maxRescaled = this.nodeRescalingFunction({
        x: extent.maxX,
        y: extent.maxY
      });

      this.quadtree.resize({
        x: minRescaled.x,
        y: minRescaled.y,
        width: maxRescaled.x - minRescaled.x,
        height: maxRescaled.y - minRescaled.y
      });

      this.nodeRescaleCache = {};

      var nodeProgram = this.nodePrograms.def;

      if (!keepArrays) {
        this.nodeArray = new Float32Array(_node2.default.POINTS * _node2.default.ATTRIBUTES * graph.order);

        this.nodeOrder = {};
      }

      var nodes = graph.nodes();

      for (var i = 0, l = nodes.length; i < l; i++) {
        var node = nodes[i];

        this.nodeOrder[node] = i;

        var data = this.sigma.getNodeData(node);

        var rescaledData = this.nodeRescalingFunction(data);

        // TODO: Optimize this to be save a loop and one object
        var displayData = (0, _utils.assign)({}, data, rescaledData);

        this.quadtree.add(node, displayData.x, displayData.y, displayData.size);

        this.nodeDataCache[node] = displayData;

        nodeProgram.process(this.nodeArray, displayData, i * _node2.default.POINTS * _node2.default.ATTRIBUTES);
      }

      var edgeProgram = this.edgePrograms.def;

      if (!keepArrays) {
        this.edgeArray = new Float32Array(_edge2.default.POINTS * _edge2.default.ATTRIBUTES * graph.size);

        this.edgeOrder = {};
      }

      var edges = graph.edges();

      for (var _i = 0, _l = edges.length; _i < _l; _i++) {
        var edge = edges[_i];

        this.edgeOrder[edge] = _i;

        var _data2 = this.sigma.getEdgeData(edge),
            extremities = graph.extremities(edge),
            sourceData = this.nodeDataCache[extremities[0]],
            targetData = this.nodeDataCache[extremities[1]];

        edgeProgram.process(this.edgeArray, sourceData, targetData, _data2, _i * _edge2.default.POINTS * _edge2.default.ATTRIBUTES);
      }

      // Computing edge indices if necessary
      if (!keepArrays && typeof edgeProgram.computeIndices === 'function') this.edgeIndicesArray = edgeProgram.computeIndices(this.edgeArray);

      return this;
    }

    /**
     * Method used to process a single node.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'processNode',
    value: function processNode(key) {

      var nodeProgram = this.nodePrograms.def;

      var data = this.sigma.getNodeData(key);

      nodeProgram.process(this.nodeArray, data, this.nodeOrder[key] * _node2.default.POINTS * _node2.default.ATTRIBUTES);

      return this;
    }

    /**
     * Method used to process a single edge.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'processEdge',
    value: function processEdge(key) {

      var graph = this.sigma.getGraph();

      var edgeProgram = this.edgePrograms.def;

      var data = this.sigma.getEdgeData(key),
          extremities = graph.extremities(key),
          sourceData = this.sigma.getNodeData(extremities[0]),
          targetData = this.sigma.getNodeData(extremities[1]);

      edgeProgram.process(this.edgeArray, sourceData, targetData, data, this.edgeOrder[key] * _edge2.default.POINTS * _edge2.default.ATTRIBUTES);

      return this;
    }

    /**---------------------------------------------------------------------------
     * Public API.
     **---------------------------------------------------------------------------
     */

    /**
     * Method used to bind the renderer to a sigma instance.
     *
     * @param  {Sigma} sigma - Target sigma instance.
     * @return {WebGLRenderer}
     */

  }, {
    key: 'bind',
    value: function bind(sigma) {

      // Binding instance
      this.sigma = sigma;

      this.bindGraphHandlers();

      // Processing initial data
      this.process();

      return this;
    }

    /**
     * Method returning the renderer's camera.
     *
     * @return {Camera}
     */

  }, {
    key: 'getCamera',
    value: function getCamera() {
      return this.camera;
    }

    /**
     * Method returning the mouse captor.
     *
     * @return {Camera}
     */

  }, {
    key: 'getMouseCaptor',
    value: function getMouseCaptor() {
      return this.captors.mouse;
    }

    /**
     * Method used to resize the renderer.
     *
     * @param  {number} width  - Target width.
     * @param  {number} height - Target height.
     * @return {WebGLRenderer}
     */

  }, {
    key: 'resize',
    value: function resize(width, height) {
      var previousWidth = this.width,
          previousHeight = this.height;

      if (arguments.length > 1) {
        this.width = width;
        this.height = height;
      } else {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
      }

      // If nothing has changed, we can stop right here
      if (previousWidth === this.width && previousHeight === this.height) return this;

      // Resizing camera
      // TODO: maybe move this elsewhere
      if (this.camera) this.camera.resize({ width: this.width, height: this.height });

      // Sizing dom elements
      for (var id in this.elements) {
        var element = this.elements[id];

        element.style.width = this.width + 'px';
        element.style.height = this.height + 'px';
      }

      // Sizing contexts
      for (var _id in this.contexts) {
        var context = this.contexts[_id];

        // Canvas contexts
        if (context.scale) {
          this.elements[_id].setAttribute('width', this.width * PIXEL_RATIO + 'px');
          this.elements[_id].setAttribute('height', this.height * PIXEL_RATIO + 'px');

          if (PIXEL_RATIO !== 1) context.scale(PIXEL_RATIO, PIXEL_RATIO);
        }

        // WebGL contexts
        else {
            this.elements[_id].setAttribute('width', this.width * WEBGL_OVERSAMPLING_RATIO + 'px');
            this.elements[_id].setAttribute('height', this.height * WEBGL_OVERSAMPLING_RATIO + 'px');
          }

        if (context.viewport) {
          context.viewport(0, 0, this.width * WEBGL_OVERSAMPLING_RATIO, this.height * WEBGL_OVERSAMPLING_RATIO);
        }
      }

      return this;
    }

    /**
     * Method used to clear the canvases.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'clear',
    value: function clear() {
      var context = this.contexts.nodes;
      context.clear(context.COLOR_BUFFER_BIT);

      context = this.contexts.edges;
      context.clear(context.COLOR_BUFFER_BIT);

      context = this.contexts.labels;
      context.clearRect(0, 0, this.width, this.height);

      context = this.contexts.hovers;
      context.clearRect(0, 0, this.width, this.height);

      return this;
    }

    /**
     * Method used to render.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'render',
    value: function render() {

      // If a render was scheduled, we cancel it
      if (this.renderFrame) {
        cancelAnimationFrame(this.renderFrame);
        this.renderFrame = null;
        this.needToProcess = false;
        this.needToSoftProcess = false;
      }

      // First we need to resize
      this.resize();

      // Clearing the canvases
      this.clear();

      // Then we need to extract a matrix from the camera
      var cameraState = this.camera.getState(),
          cameraMatrix = (0, _utils3.matrixFromCamera)(cameraState);

      var translation = _glMatrix.mat3.fromTranslation(_glMatrix.mat3.create(), [this.width / 2, this.height / 2]);

      _glMatrix.mat3.multiply(cameraMatrix, translation, cameraMatrix);

      var program = void 0,
          gl = void 0;

      // Drawing nodes
      gl = this.contexts.nodes;
      program = this.nodePrograms.def;

      // TODO: should probably use another name for the `program` abstraction
      program.render(gl, this.nodeArray, {
        matrix: cameraMatrix,
        width: this.width,
        height: this.height,
        ratio: cameraState.ratio,
        nodesPowRatio: 0.5,
        scalingRatio: WEBGL_OVERSAMPLING_RATIO
      });

      // Drawing edges
      gl = this.contexts.edges;
      program = this.edgePrograms.def;

      program.render(gl, this.edgeArray, {
        matrix: cameraMatrix,
        width: this.width,
        height: this.height,
        ratio: cameraState.ratio,
        edgesPowRatio: 0.5,
        scalingRatio: WEBGL_OVERSAMPLING_RATIO,
        indices: this.edgeIndicesArray
      });

      // Drawing labels
      // TODO: POW RATIO is currently default 0.5 and harcoded
      var nodes = this.sigma.getGraph().nodes(),
          context = this.contexts.labels;

      var sizeRatio = Math.pow(cameraState.ratio, 0.5);

      for (var i = 0, l = nodes.length; i < l; i++) {
        var data = this.nodeDataCache[nodes[i]];

        var _camera$graphToDispla = this.camera.graphToDisplay(data.x, data.y),
            x = _camera$graphToDispla.x,
            y = _camera$graphToDispla.y;

        // TODO: we can cache the labels we need to render until the camera's ratio changes


        var size = data.size / sizeRatio;

        // TODO: this is the label threshold hardcoded
        if (size < 8) continue;

        (0, _label2.default)(context, {
          label: data.label,
          size: size,
          x: x,
          y: y
        });
      }

      // Rendering highlighted nodes
      this.renderHighlightedNodes();

      return this;
    }

    /**
     * Method used to render the highlighted nodes.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'renderHighlightedNodes',
    value: function renderHighlightedNodes() {
      var _this5 = this;

      var camera = this.camera;

      var sizeRatio = Math.pow(camera.getState().ratio, 0.5);

      var context = this.contexts.hovers;

      // Clearing
      context.clearRect(0, 0, this.width, this.height);

      // Rendering
      var render = function render(node) {
        var data = _this5.nodeDataCache[node];

        var _camera$graphToDispla2 = camera.graphToDisplay(data.x, data.y),
            x = _camera$graphToDispla2.x,
            y = _camera$graphToDispla2.y;

        var size = data.size / sizeRatio;

        (0, _hover2.default)(context, {
          label: data.label,
          color: data.color,
          size: size,
          x: x,
          y: y
        });
      };

      if (this.hoveredNode) render(this.hoveredNode);

      this.highlightedNodes.forEach(render);
    }

    /**
     * Method used to schedule a render.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'scheduleRender',
    value: function scheduleRender() {
      var _this6 = this;

      // If we did not render in this frame yet
      // if (!this.wasRenderedInThisFrame) {

      //   // Do we need to process data?
      //   if (this.needToProcess || this.needToSoftProcess)
      //     this.process(this.needToSoftProcess);

      //   // Resetting state
      //   this.renderFrame = null;
      //   this.needToProcess = false;
      //   this.needToSoftProcess = false;

      //   this.render();

      //   this.wasRenderedInThisFrame = true;

      //   requestAnimationFrame(() => {
      //     this.wasRenderedInThisFrame = false;
      //   });

      //   return this;
      // }

      // A frame is already scheduled
      if (this.renderFrame) return this;

      // Let's schedule a frame
      this.renderFrame = requestAnimationFrame(function () {

        // Do we need to process data?
        if (_this6.needToProcess || _this6.needToSoftProcess) _this6.process(_this6.needToSoftProcess);

        // Resetting state
        _this6.renderFrame = null;
        _this6.needToProcess = false;
        _this6.needToSoftProcess = false;

        // Rendering
        _this6.render();
      });
    }

    /**
     * Method used to schedule a hover render.
     *
     * @return {WebGLRenderer}
     */

  }, {
    key: 'scheduleHighlightedNodesRender',
    value: function scheduleHighlightedNodesRender() {
      var _this7 = this;

      if (this.renderHighlightedNodesFrame || this.renderFrame) return this;

      this.renderHighlightedNodesFrame = requestAnimationFrame(function () {

        // Resetting state
        _this7.renderHighlightedNodesFrame = null;

        // Rendering
        _this7.renderHighlightedNodes();
      });
    }

    /**
     * Method used to highlight a node.
     *
     * @param  {string} key - The node's key.
     * @return {WebGLRenderer}
     */

  }, {
    key: 'highlightNode',
    value: function highlightNode(key) {

      // TODO: check the existence of the node
      // TODO: coerce?
      this.highlightedNodes.add(key);

      // Rendering
      this.scheduleHighlightedNodesRender();

      return this;
    }

    /**
     * Method used to unhighlight a node.
     *
     * @param  {string} key - The node's key.
     * @return {WebGLRenderer}
     */

  }, {
    key: 'unhighlightNode',
    value: function unhighlightNode(key) {

      // TODO: check the existence of the node
      // TODO: coerce?
      this.highlightedNodes.delete(key);

      // Rendering
      this.scheduleHighlightedNodesRender();

      return this;
    }
  }]);

  return WebGLRenderer;
}(_renderer2.default);

exports.default = WebGLRenderer;

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Sigma.js Core Class
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * ====================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Core class holding state for the bound graph and using a combination of
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * a renderer & camera to display the bound graph on screen.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _isGraph = __webpack_require__(31);

var _isGraph2 = _interopRequireDefault(_isGraph);

var _renderer = __webpack_require__(1);

var _renderer2 = _interopRequireDefault(_renderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO: sigma should only hold the graph and compose state to give to renderer,
// does it need to orchestrate?

// TODO: should be able to take n renderers
// TODO: what to do with refresh methods? We should probably drop them

// TODO: create a thumbnail renderer

/**
 * Sigma class
 *
 * @constructor
 * @param {Graph}    graph    - A graphology Graph instance.
 * @param {Renderer} renderer - A Renderer instance.
 */
var Sigma = function () {
  function Sigma(graph, renderer) {
    _classCallCheck(this, Sigma);

    // Checking the arguments
    if (!(0, _isGraph2.default)(graph)) throw new Error('Sigma.constructor: given graph is not an instance of a graphology implementation.');

    if (!(renderer instanceof _renderer2.default)) throw new Error('Sigma.constructor: given renderer is not an instance of a sigma Renderer.');

    // Properties
    this.graph = graph;
    this.renderer = renderer;
    this.renderer.bind(this);

    // Userland state
    this.state = {};
    this.nodeStates = null;
    this.edgeStates = null;

    // First time render
    this.renderer.render();
  }

  /**---------------------------------------------------------------------------
   * Internals
   **---------------------------------------------------------------------------
   */

  /**---------------------------------------------------------------------------
   * Getters
   **---------------------------------------------------------------------------
   */

  /**
   * Method returning the graph bound to the instance.
   *
   * @return {Graph} - The bound graph.
   */


  _createClass(Sigma, [{
    key: 'getGraph',
    value: function getGraph() {
      return this.graph;
    }

    /**
     * Method returning the composed data of the target node.
     *
     * @return {string} key - The node's key.
     * @return {object}     - The node's attributes.
     */

  }, {
    key: 'getNodeData',
    value: function getNodeData(key) {

      // TODO: this will change to compose state later
      return this.graph.getNodeAttributes(key);
    }

    /**
     * Method returning the composed data of the target edge.
     *
     * @return {string} key - The edge's key.
     * @return {object}     - The edge's attributes.
     */

  }, {
    key: 'getEdgeData',
    value: function getEdgeData(key) {

      // TODO: this will change to compose state later
      return this.graph.getEdgeAttributes(key);
    }

    /**
     * Method returning the extent of the bound graph.
     *
     * @return {object} - The graph's extent.
     */

  }, {
    key: 'getGraphExtent',
    value: function getGraphExtent() {
      var graph = this.graph;

      var nodes = graph.nodes(),
          edges = graph.edges();

      var maxX = -Infinity,
          maxY = -Infinity,
          minX = Infinity,
          minY = Infinity,
          maxNodeSize = -Infinity,
          maxEdgeSize = -Infinity;

      for (var i = 0, l = nodes.length; i < l; i++) {
        var node = nodes[i];

        var data = this.getNodeData(node);

        if (data.x > maxX) maxX = data.x;
        if (data.y > maxY) maxY = data.y;

        if (data.x < minX) minX = data.x;
        if (data.y < minY) minY = data.y;

        var size = data.size || 1;

        if (size > maxNodeSize) maxNodeSize = size;
      }

      for (var _i = 0, _l = edges.length; _i < _l; _i++) {
        var edge = edges[_i];

        var _data = this.getEdgeData(edge);

        var _size = _data.size || 1;

        if (_size > maxEdgeSize) maxEdgeSize = _size;
      }

      return {
        maxX: maxX,
        maxY: maxY,
        minX: minX,
        minY: minY,
        maxNodeSize: maxNodeSize,
        maxEdgeSize: maxEdgeSize
      };
    }
  }]);

  return Sigma;
}();

exports.default = Sigma;

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sub = exports.mul = undefined;
exports.create = create;
exports.clone = clone;
exports.copy = copy;
exports.identity = identity;
exports.fromValues = fromValues;
exports.set = set;
exports.transpose = transpose;
exports.invert = invert;
exports.adjoint = adjoint;
exports.determinant = determinant;
exports.multiply = multiply;
exports.rotate = rotate;
exports.scale = scale;
exports.fromRotation = fromRotation;
exports.fromScaling = fromScaling;
exports.str = str;
exports.frob = frob;
exports.LDU = LDU;
exports.add = add;
exports.subtract = subtract;
exports.exactEquals = exactEquals;
exports.equals = equals;
exports.multiplyScalar = multiplyScalar;
exports.multiplyScalarAndAdd = multiplyScalarAndAdd;

var _common = __webpack_require__(0);

var glMatrix = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * 2x2 Matrix
 * @module mat2
 */

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {mat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/**
 * Create a new mat2 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out A new 2x2 matrix
 */
function fromValues(m00, m01, m10, m11) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}

/**
 * Set the components of a mat2 to the given values
 *
 * @param {mat2} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out
 */
function set(out, m00, m01, m10, m11) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}

/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache
  // some values
  if (out === a) {
    var a1 = a[1];
    out[1] = a[2];
    out[2] = a1;
  } else {
    out[0] = a[0];
    out[1] = a[2];
    out[2] = a[1];
    out[3] = a[3];
  }

  return out;
}

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
function invert(out, a) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];

  // Calculate the determinant
  var det = a0 * a3 - a2 * a1;

  if (!det) {
    return null;
  }
  det = 1.0 / det;

  out[0] = a3 * det;
  out[1] = -a1 * det;
  out[2] = -a2 * det;
  out[3] = a0 * det;

  return out;
}

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
function adjoint(out, a) {
  // Caching this value is nessecary if out == a
  var a0 = a[0];
  out[0] = a[3];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a0;

  return out;
}

/**
 * Calculates the determinant of a mat2
 *
 * @param {mat2} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  return a[0] * a[3] - a[2] * a[1];
}

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
function multiply(out, a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  return out;
}

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
function rotate(out, a, rad) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  return out;
}

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
function scale(out, a, v) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var v0 = v[0],
      v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.rotate(dest, dest, rad);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
function fromRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.scale(dest, dest, vec);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat2} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v[1];
  return out;
}

/**
 * Returns a string representation of a mat2
 *
 * @param {mat2} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
}

/**
 * Returns Frobenius norm of a mat2
 *
 * @param {mat2} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2));
}

/**
 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
 * @param {mat2} L the lower triangular matrix
 * @param {mat2} D the diagonal matrix
 * @param {mat2} U the upper triangular matrix
 * @param {mat2} a the input matrix to factorize
 */

function LDU(L, D, U, a) {
  L[2] = a[2] / a[0];
  U[0] = a[0];
  U[1] = a[1];
  U[3] = a[3] - L[2] * U[1];
  return [L, D, U];
}

/**
 * Adds two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat2} a The first matrix.
 * @param {mat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat2} a The first matrix.
 * @param {mat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}

/**
 * Adds two mat2's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2} out the receiving vector
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link mat2.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sub = exports.mul = undefined;
exports.create = create;
exports.clone = clone;
exports.copy = copy;
exports.identity = identity;
exports.fromValues = fromValues;
exports.set = set;
exports.invert = invert;
exports.determinant = determinant;
exports.multiply = multiply;
exports.rotate = rotate;
exports.scale = scale;
exports.translate = translate;
exports.fromRotation = fromRotation;
exports.fromScaling = fromScaling;
exports.fromTranslation = fromTranslation;
exports.str = str;
exports.frob = frob;
exports.add = add;
exports.subtract = subtract;
exports.multiplyScalar = multiplyScalar;
exports.multiplyScalarAndAdd = multiplyScalarAndAdd;
exports.exactEquals = exactEquals;
exports.equals = equals;

var _common = __webpack_require__(0);

var glMatrix = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * 2x3 Matrix
 * @module mat2d
 *
 * @description
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, c, tx,
 *  b, d, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, c, tx,
 *  b, d, ty,
 *  0, 0, 1]
 * </pre>
 * The last row is ignored so the array is shorter and operations are faster.
 */

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(6);
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {mat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(6);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Create a new mat2d with the given values
 *
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} A new mat2d
 */
function fromValues(a, b, c, d, tx, ty) {
  var out = new glMatrix.ARRAY_TYPE(6);
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}

/**
 * Set the components of a mat2d to the given values
 *
 * @param {mat2d} out the receiving matrix
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} out
 */
function set(out, a, b, c, d, tx, ty) {
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
function invert(out, a) {
  var aa = a[0],
      ab = a[1],
      ac = a[2],
      ad = a[3];
  var atx = a[4],
      aty = a[5];

  var det = aa * ad - ab * ac;
  if (!det) {
    return null;
  }
  det = 1.0 / det;

  out[0] = ad * det;
  out[1] = -ab * det;
  out[2] = -ac * det;
  out[3] = aa * det;
  out[4] = (ac * aty - ad * atx) * det;
  out[5] = (ab * atx - aa * aty) * det;
  return out;
}

/**
 * Calculates the determinant of a mat2d
 *
 * @param {mat2d} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  return a[0] * a[3] - a[1] * a[2];
}

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
function multiply(out, a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3],
      b4 = b[4],
      b5 = b[5];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  out[4] = a0 * b4 + a2 * b5 + a4;
  out[5] = a1 * b4 + a3 * b5 + a5;
  return out;
}

/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
function rotate(out, a, rad) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  out[4] = a4;
  out[5] = a5;
  return out;
}

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
function scale(out, a, v) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var v0 = v[0],
      v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  out[4] = a4;
  out[5] = a5;
  return out;
}

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
function translate(out, a, v) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var v0 = v[0],
      v1 = v[1];
  out[0] = a0;
  out[1] = a1;
  out[2] = a2;
  out[3] = a3;
  out[4] = a0 * v0 + a2 * v1 + a4;
  out[5] = a1 * v0 + a3 * v1 + a5;
  return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.rotate(dest, dest, rad);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
function fromRotation(out, rad) {
  var s = Math.sin(rad),
      c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.scale(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat2d} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v[1];
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.translate(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {vec2} v Translation vector
 * @returns {mat2d} out
 */
function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = v[0];
  out[5] = v[1];
  return out;
}

/**
 * Returns a string representation of a mat2d
 *
 * @param {mat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ')';
}

/**
 * Returns Frobenius norm of a mat2d
 *
 * @param {mat2d} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + 1);
}

/**
 * Adds two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2d} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  return out;
}

/**
 * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2d} out the receiving vector
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2d} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat2d} a The first matrix.
 * @param {mat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat2d} a The first matrix.
 * @param {mat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3],
      b4 = b[4],
      b5 = b[5];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5));
}

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link mat2d.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sub = exports.mul = undefined;
exports.create = create;
exports.clone = clone;
exports.copy = copy;
exports.fromValues = fromValues;
exports.set = set;
exports.identity = identity;
exports.transpose = transpose;
exports.invert = invert;
exports.adjoint = adjoint;
exports.determinant = determinant;
exports.multiply = multiply;
exports.translate = translate;
exports.scale = scale;
exports.rotate = rotate;
exports.rotateX = rotateX;
exports.rotateY = rotateY;
exports.rotateZ = rotateZ;
exports.fromTranslation = fromTranslation;
exports.fromScaling = fromScaling;
exports.fromRotation = fromRotation;
exports.fromXRotation = fromXRotation;
exports.fromYRotation = fromYRotation;
exports.fromZRotation = fromZRotation;
exports.fromRotationTranslation = fromRotationTranslation;
exports.getTranslation = getTranslation;
exports.getScaling = getScaling;
exports.getRotation = getRotation;
exports.fromRotationTranslationScale = fromRotationTranslationScale;
exports.fromRotationTranslationScaleOrigin = fromRotationTranslationScaleOrigin;
exports.fromQuat = fromQuat;
exports.frustum = frustum;
exports.perspective = perspective;
exports.perspectiveFromFieldOfView = perspectiveFromFieldOfView;
exports.ortho = ortho;
exports.lookAt = lookAt;
exports.targetTo = targetTo;
exports.str = str;
exports.frob = frob;
exports.add = add;
exports.subtract = subtract;
exports.multiplyScalar = multiplyScalar;
exports.multiplyScalarAndAdd = multiplyScalarAndAdd;
exports.exactEquals = exactEquals;
exports.equals = equals;

var _common = __webpack_require__(0);

var glMatrix = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * 4x4 Matrix
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(16);
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */
function fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new glMatrix.ARRAY_TYPE(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}

/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */
function set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a12 = a[6],
        a13 = a[7];
    var a23 = a[11];

    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }

  return out;
}

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function invert(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }
  det = 1.0 / det;

  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

  return out;
}

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function adjoint(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

  out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
  out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
  out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
  out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
  out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
  out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
  out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
  out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
  out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
  out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
  out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
  out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
  out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
  out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
  out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
  out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
  return out;
}

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}

/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
function multiply(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

  // Cache only the current line of the second matrix
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[4];b1 = b[5];b2 = b[6];b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[8];b1 = b[9];b2 = b[10];b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[12];b1 = b[13];b2 = b[14];b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
function translate(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  var a00 = void 0,
      a01 = void 0,
      a02 = void 0,
      a03 = void 0;
  var a10 = void 0,
      a11 = void 0,
      a12 = void 0,
      a13 = void 0;
  var a20 = void 0,
      a21 = void 0,
      a22 = void 0,
      a23 = void 0;

  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];a01 = a[1];a02 = a[2];a03 = a[3];
    a10 = a[4];a11 = a[5];a12 = a[6];a13 = a[7];
    a20 = a[8];a21 = a[9];a22 = a[10];a23 = a[11];

    out[0] = a00;out[1] = a01;out[2] = a02;out[3] = a03;
    out[4] = a10;out[5] = a11;out[6] = a12;out[7] = a13;
    out[8] = a20;out[9] = a21;out[10] = a22;out[11] = a23;

    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }

  return out;
}

/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
function scale(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];

  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function rotate(out, a, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.sqrt(x * x + y * y + z * z);
  var s = void 0,
      c = void 0,
      t = void 0;
  var a00 = void 0,
      a01 = void 0,
      a02 = void 0,
      a03 = void 0;
  var a10 = void 0,
      a11 = void 0,
      a12 = void 0,
      a13 = void 0;
  var a20 = void 0,
      a21 = void 0,
      a22 = void 0,
      a23 = void 0;
  var b00 = void 0,
      b01 = void 0,
      b02 = void 0;
  var b10 = void 0,
      b11 = void 0,
      b12 = void 0;
  var b20 = void 0,
      b21 = void 0,
      b22 = void 0;

  if (Math.abs(len) < glMatrix.EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;

  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;

  a00 = a[0];a01 = a[1];a02 = a[2];a03 = a[3];
  a10 = a[4];a11 = a[5];a12 = a[6];a13 = a[7];
  a20 = a[8];a21 = a[9];a22 = a[10];a23 = a[11];

  // Construct the elements of the rotation matrix
  b00 = x * x * t + c;b01 = y * x * t + z * s;b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;b11 = y * y * t + c;b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;b21 = y * z * t - x * s;b22 = z * z * t + c;

  // Perform rotation-specific matrix multiplication
  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  return out;
}

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateX(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateY(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateZ(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Scaling vector
 * @returns {mat4} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function fromRotation(out, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.sqrt(x * x + y * y + z * z);
  var s = void 0,
      c = void 0,
      t = void 0;

  if (Math.abs(len) < glMatrix.EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;

  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;

  // Perform rotation-specific matrix multiplication
  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
function fromRotationTranslation(out, q, v) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;

  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;

  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;

  return out;
}

/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {mat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getTranslation(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];

  return out;
}

/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion paramter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {mat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];

  out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
  out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
  out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);

  return out;
}

/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {mat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */
function getRotation(out, mat) {
  // Algorithm taken from http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
  var trace = mat[0] + mat[5] + mat[10];
  var S = 0;

  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (mat[6] - mat[9]) / S;
    out[1] = (mat[8] - mat[2]) / S;
    out[2] = (mat[1] - mat[4]) / S;
  } else if (mat[0] > mat[5] & mat[0] > mat[10]) {
    S = Math.sqrt(1.0 + mat[0] - mat[5] - mat[10]) * 2;
    out[3] = (mat[6] - mat[9]) / S;
    out[0] = 0.25 * S;
    out[1] = (mat[1] + mat[4]) / S;
    out[2] = (mat[8] + mat[2]) / S;
  } else if (mat[5] > mat[10]) {
    S = Math.sqrt(1.0 + mat[5] - mat[0] - mat[10]) * 2;
    out[3] = (mat[8] - mat[2]) / S;
    out[0] = (mat[1] + mat[4]) / S;
    out[1] = 0.25 * S;
    out[2] = (mat[6] + mat[9]) / S;
  } else {
    S = Math.sqrt(1.0 + mat[10] - mat[0] - mat[5]) * 2;
    out[3] = (mat[1] - mat[4]) / S;
    out[0] = (mat[8] + mat[2]) / S;
    out[1] = (mat[6] + mat[9]) / S;
    out[2] = 0.25 * S;
  }

  return out;
}

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @param {vec3} s Scaling vector
 * @returns {mat4} out
 */
function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;

  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];

  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;

  return out;
}

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     mat4.translate(dest, origin);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *     mat4.translate(dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @param {vec3} s Scaling vector
 * @param {vec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */
function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;

  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;

  var sx = s[0];
  var sy = s[1];
  var sz = s[2];

  var ox = o[0];
  var oy = o[1];
  var oz = o[2];

  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0] + ox - (out[0] * ox + out[4] * oy + out[8] * oz);
  out[13] = v[1] + oy - (out[1] * ox + out[5] * oy + out[9] * oz);
  out[14] = v[2] + oz - (out[2] * ox + out[6] * oy + out[10] * oz);
  out[15] = 1;

  return out;
}

/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */
function fromQuat(out, q) {
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;

  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;

  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;

  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;

  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;

  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;

  return out;
}

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function perspective(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2);
  var nf = 1 / (near - far);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = 2 * far * near * nf;
  out[15] = 0;
  return out;
}

/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);

  out[0] = xScale;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  out[4] = 0.0;
  out[5] = yScale;
  out[6] = 0.0;
  out[7] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1.0;
  out[12] = 0.0;
  out[13] = 0.0;
  out[14] = far * near / (near - far);
  out[15] = 0.0;
  return out;
}

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function ortho(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
function lookAt(out, eye, center, up) {
  var x0 = void 0,
      x1 = void 0,
      x2 = void 0,
      y0 = void 0,
      y1 = void 0,
      y2 = void 0,
      z0 = void 0,
      z1 = void 0,
      z2 = void 0,
      len = void 0;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < glMatrix.EPSILON && Math.abs(eyey - centery) < glMatrix.EPSILON && Math.abs(eyez - centerz) < glMatrix.EPSILON) {
    return mat4.identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;

  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;

  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;

  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;

  return out;
}

/**
 * Generates a matrix that makes something look at something else.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
function targetTo(out, eye, target, up) {
  var eyex = eye[0],
      eyey = eye[1],
      eyez = eye[2],
      upx = up[0],
      upy = up[1],
      upz = up[2];

  var z0 = eyex - target[0],
      z1 = eyey - target[1],
      z2 = eyez - target[2];

  var len = z0 * z0 + z1 * z1 + z2 * z2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }

  var x0 = upy * z2 - upz * z1,
      x1 = upz * z0 - upx * z2,
      x2 = upx * z1 - upy * z0;

  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
};

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' + a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
}

/**
 * Returns Frobenius norm of a mat4
 *
 * @param {mat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2) + Math.pow(a[9], 2) + Math.pow(a[10], 2) + Math.pow(a[11], 2) + Math.pow(a[12], 2) + Math.pow(a[13], 2) + Math.pow(a[14], 2) + Math.pow(a[15], 2));
}

/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}

/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  out[9] = a[9] + b[9] * scale;
  out[10] = a[10] + b[10] * scale;
  out[11] = a[11] + b[11] * scale;
  out[12] = a[12] + b[12] * scale;
  out[13] = a[13] + b[13] * scale;
  out[14] = a[14] + b[14] * scale;
  out[15] = a[15] + b[15] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {mat4} a The first matrix.
 * @param {mat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {mat4} a The first matrix.
 * @param {mat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var a4 = a[4],
      a5 = a[5],
      a6 = a[6],
      a7 = a[7];
  var a8 = a[8],
      a9 = a[9],
      a10 = a[10],
      a11 = a[11];
  var a12 = a[12],
      a13 = a[13],
      a14 = a[14],
      a15 = a[15];

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  var b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7];
  var b8 = b[8],
      b9 = b[9],
      b10 = b[10],
      b11 = b[11];
  var b12 = b[12],
      b13 = b[13],
      b14 = b[14],
      b15 = b[15];

  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
}

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link mat4.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setAxes = exports.sqlerp = exports.rotationTo = exports.equals = exports.exactEquals = exports.normalize = exports.sqrLen = exports.squaredLength = exports.len = exports.length = exports.lerp = exports.dot = exports.scale = exports.mul = exports.add = exports.set = exports.copy = exports.fromValues = exports.clone = undefined;
exports.create = create;
exports.identity = identity;
exports.setAxisAngle = setAxisAngle;
exports.getAxisAngle = getAxisAngle;
exports.multiply = multiply;
exports.rotateX = rotateX;
exports.rotateY = rotateY;
exports.rotateZ = rotateZ;
exports.calculateW = calculateW;
exports.slerp = slerp;
exports.invert = invert;
exports.conjugate = conjugate;
exports.fromMat3 = fromMat3;
exports.fromEuler = fromEuler;
exports.str = str;

var _common = __webpack_require__(0);

var glMatrix = _interopRequireWildcard(_common);

var _mat = __webpack_require__(8);

var mat3 = _interopRequireWildcard(_mat);

var _vec = __webpack_require__(9);

var vec3 = _interopRequireWildcard(_vec);

var _vec2 = __webpack_require__(10);

var vec4 = _interopRequireWildcard(_vec2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Quaternion
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

function create() {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
function identity(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}

/**
 * Gets the rotation axis and angle for a given
 *  quaternion. If a quaternion is created with
 *  setAxisAngle, this method will return the same
 *  values as providied in the original parameter list
 *  OR functionally equivalent values.
 * Example: The quaternion formed by axis [0, 0, 1] and
 *  angle -90 is the same as the quaternion formed by
 *  [0, 0, 1] and 270. This method favors the latter.
 * @param  {vec3} out_axis  Vector receiving the axis of rotation
 * @param  {quat} q     Quaternion to be decomposed
 * @return {Number}     Angle, in radians, of the rotation
 */
function getAxisAngle(out_axis, q) {
  var rad = Math.acos(q[3]) * 2.0;
  var s = Math.sin(rad / 2.0);
  if (s != 0.0) {
    out_axis[0] = q[0] / s;
    out_axis[1] = q[1] / s;
    out_axis[2] = q[2] / s;
  } else {
    // If s is zero, return any axis (no rotation - axis does not matter)
    out_axis[0] = 1;
    out_axis[1] = 0;
    out_axis[2] = 0;
  }
  return rad;
}

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 */
function multiply(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];

  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
function rotateX(out, a, rad) {
  rad *= 0.5;

  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = Math.sin(rad),
      bw = Math.cos(rad);

  out[0] = ax * bw + aw * bx;
  out[1] = ay * bw + az * bx;
  out[2] = az * bw - ay * bx;
  out[3] = aw * bw - ax * bx;
  return out;
}

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
function rotateY(out, a, rad) {
  rad *= 0.5;

  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var by = Math.sin(rad),
      bw = Math.cos(rad);

  out[0] = ax * bw - az * by;
  out[1] = ay * bw + aw * by;
  out[2] = az * bw + ax * by;
  out[3] = aw * bw - ay * by;
  return out;
}

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
function rotateZ(out, a, rad) {
  rad *= 0.5;

  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bz = Math.sin(rad),
      bw = Math.cos(rad);

  out[0] = ax * bw + ay * bz;
  out[1] = ay * bw - ax * bz;
  out[2] = az * bw + aw * bz;
  out[3] = aw * bw - az * bz;
  return out;
}

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
function calculateW(out, a) {
  var x = a[0],
      y = a[1],
      z = a[2];

  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
  return out;
}

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
function slerp(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];

  var omega = void 0,
      cosom = void 0,
      sinom = void 0,
      scale0 = void 0,
      scale1 = void 0;

  // calc cosine
  cosom = ax * bx + ay * by + az * bz + aw * bw;
  // adjust signs (if necessary)
  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  // calculate coefficients
  if (1.0 - cosom > 0.000001) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  }
  // calculate final values
  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;

  return out;
}

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
function invert(out, a) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
  var invDot = dot ? 1.0 / dot : 0;

  // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

  out[0] = -a0 * invDot;
  out[1] = -a1 * invDot;
  out[2] = -a2 * invDot;
  out[3] = a3 * invDot;
  return out;
}

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
function conjugate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  return out;
}

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot = void 0;

  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w
    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)
    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    var i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;

    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }

  return out;
}

/**
 * Creates a quaternion from the given euler angle x, y, z.
 *
 * @param {quat} out the receiving quaternion
 * @param {x} Angle to rotate around X axis in degrees.
 * @param {y} Angle to rotate around Y axis in degrees.
 * @param {z} Angle to rotate around Z axis in degrees.
 * @returns {quat} out
 * @function
 */
function fromEuler(out, x, y, z) {
  var halfToRad = 0.5 * Math.PI / 180.0;
  x *= halfToRad;
  y *= halfToRad;
  z *= halfToRad;

  var sx = Math.sin(x);
  var cx = Math.cos(x);
  var sy = Math.sin(y);
  var cy = Math.cos(y);
  var sz = Math.sin(z);
  var cz = Math.cos(z);

  out[0] = sx * cy * cz - cx * sy * sz;
  out[1] = cx * sy * cz + sx * cy * sz;
  out[2] = cx * cy * sz - sx * sy * cz;
  out[3] = cx * cy * cz + sx * sy * sz;

  return out;
}

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function str(a) {
  return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
}

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {quat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
var clone = exports.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
var fromValues = exports.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the source quaternion
 * @returns {quat} out
 * @function
 */
var copy = exports.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
var set = exports.set = vec4.set;

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 * @function
 */
var add = exports.add = vec4.add;

/**
 * Alias for {@link quat.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {quat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
var scale = exports.scale = vec4.scale;

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
var dot = exports.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
var lerp = exports.lerp = vec4.lerp;

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 */
var length = exports.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
var len = exports.len = length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
var squaredLength = exports.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
var sqrLen = exports.sqrLen = squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
var normalize = exports.normalize = vec4.normalize;

/**
 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {quat} a The first quaternion.
 * @param {quat} b The second quaternion.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
var exactEquals = exports.exactEquals = vec4.exactEquals;

/**
 * Returns whether or not the quaternions have approximately the same elements in the same position.
 *
 * @param {quat} a The first vector.
 * @param {quat} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
var equals = exports.equals = vec4.equals;

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {vec3} a the initial vector
 * @param {vec3} b the destination vector
 * @returns {quat} out
 */
var rotationTo = exports.rotationTo = function () {
  var tmpvec3 = vec3.create();
  var xUnitVec3 = vec3.fromValues(1, 0, 0);
  var yUnitVec3 = vec3.fromValues(0, 1, 0);

  return function (out, a, b) {
    var dot = vec3.dot(a, b);
    if (dot < -0.999999) {
      vec3.cross(tmpvec3, xUnitVec3, a);
      if (vec3.len(tmpvec3) < 0.000001) vec3.cross(tmpvec3, yUnitVec3, a);
      vec3.normalize(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      vec3.cross(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot;
      return normalize(out, out);
    }
  };
}();

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {quat} c the third operand
 * @param {quat} d the fourth operand
 * @param {Number} t interpolation amount
 * @returns {quat} out
 */
var sqlerp = exports.sqlerp = function () {
  var temp1 = create();
  var temp2 = create();

  return function (out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));

    return out;
  };
}();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {vec3} view  the vector representing the viewing direction
 * @param {vec3} right the vector representing the local "right" direction
 * @param {vec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
var setAxes = exports.setAxes = function () {
  var matr = mat3.create();

  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];

    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];

    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];

    return normalize(out, fromMat3(out, matr));
  };
}();

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forEach = exports.sqrLen = exports.sqrDist = exports.dist = exports.div = exports.mul = exports.sub = exports.len = undefined;
exports.create = create;
exports.clone = clone;
exports.fromValues = fromValues;
exports.copy = copy;
exports.set = set;
exports.add = add;
exports.subtract = subtract;
exports.multiply = multiply;
exports.divide = divide;
exports.ceil = ceil;
exports.floor = floor;
exports.min = min;
exports.max = max;
exports.round = round;
exports.scale = scale;
exports.scaleAndAdd = scaleAndAdd;
exports.distance = distance;
exports.squaredDistance = squaredDistance;
exports.length = length;
exports.squaredLength = squaredLength;
exports.negate = negate;
exports.inverse = inverse;
exports.normalize = normalize;
exports.dot = dot;
exports.cross = cross;
exports.lerp = lerp;
exports.random = random;
exports.transformMat2 = transformMat2;
exports.transformMat2d = transformMat2d;
exports.transformMat3 = transformMat3;
exports.transformMat4 = transformMat4;
exports.str = str;
exports.exactEquals = exactEquals;
exports.equals = equals;

var _common = __webpack_require__(0);

var glMatrix = _interopRequireWildcard(_common);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(2);
  out[0] = 0;
  out[1] = 0;
  return out;
}

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(2);
  out[0] = a[0];
  out[1] = a[1];
  return out;
}

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
function fromValues(x, y) {
  var out = new glMatrix.ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
function set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  return out;
}

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  return out;
};

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  return out;
};

/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to ceil
 * @returns {vec2} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  return out;
};

/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to floor
 * @returns {vec2} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  return out;
};

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
};

/**
 * Math.round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to round
 * @returns {vec2} out
 */
function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  return out;
};

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
  var x = b[0] - a[0],
      y = b[1] - a[1];
  return Math.sqrt(x * x + y * y);
};

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
  var x = b[0] - a[0],
      y = b[1] - a[1];
  return x * x + y * y;
};

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
  var x = a[0],
      y = a[1];
  return Math.sqrt(x * x + y * y);
};

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
  var x = a[0],
      y = a[1];
  return x * x + y * y;
};

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  return out;
};

/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to invert
 * @returns {vec2} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
function normalize(out, a) {
  var x = a[0],
      y = a[1];
  var len = x * x + y * y;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
    out[0] = a[0] * len;
    out[1] = a[1] * len;
  }
  return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
  var z = a[0] * b[1] - a[1] * b[0];
  out[0] = out[1] = 0;
  out[2] = z;
  return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
function lerp(out, a, b, t) {
  var ax = a[0],
      ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */
function random(out, scale) {
  scale = scale || 1.0;
  var r = glMatrix.RANDOM() * 2.0 * Math.PI;
  out[0] = Math.cos(r) * scale;
  out[1] = Math.sin(r) * scale;
  return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat2(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[2] * y;
  out[1] = m[1] * x + m[3] * y;
  return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat2d(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat3(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[3] * y + m[6];
  out[1] = m[1] * x + m[4] * y + m[7];
  return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat4(out, a, m) {
  var x = a[0];
  var y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function str(a) {
  return 'vec2(' + a[0] + ', ' + a[1] + ')';
}

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {vec2} a The first vector.
 * @param {vec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec2} a The first vector.
 * @param {vec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
      a1 = a[1];
  var b0 = b[0],
      b1 = b[1];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
}

/**
 * Alias for {@link vec2.length}
 * @function
 */
var len = exports.len = length;

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link vec2.divide}
 * @function
 */
var div = exports.div = divide;

/**
 * Alias for {@link vec2.distance}
 * @function
 */
var dist = exports.dist = distance;

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
var sqrDist = exports.sqrDist = squaredDistance;

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
var sqrLen = exports.sqrLen = squaredLength;

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach = exports.forEach = function () {
  var vec = create();

  return function (a, stride, offset, count, fn, arg) {
    var i = void 0,
        l = void 0;
    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];a[i + 1] = vec[1];
    }

    return a;
  };
}();

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = __webpack_require__(3);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Sigma.js Captor Class
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * ======================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Abstract class representing a captor like the user's mouse or touch controls.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var Captor = function (_EventEmitter) {
  _inherits(Captor, _EventEmitter);

  function Captor(container, camera) {
    _classCallCheck(this, Captor);

    // Properties
    var _this = _possibleConstructorReturn(this, (Captor.__proto__ || Object.getPrototypeOf(Captor)).call(this));

    _this.container = container;
    _this.camera = camera;
    return _this;
  }

  return Captor;
}(_events.EventEmitter);

exports.default = Captor;

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * Sigma.js Captor Utils
                                                                                                                                                                                                                                                                               * ======================
                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                               * Miscellenous helper functions related to the captors.
                                                                                                                                                                                                                                                                               */


exports.getX = getX;
exports.getY = getY;
exports.getWidth = getWidth;
exports.getHeight = getHeight;
exports.getCenter = getCenter;
exports.getMouseCoords = getMouseCoords;
exports.getWheelDelta = getWheelDelta;

var _utils = __webpack_require__(12);

/**
 * Extract the local X position from a mouse or touch event.
 *
 * @param  {event}  e - A mouse or touch event.
 * @return {number}     The local X value of the mouse.
 */
function getX(e) {
  if (typeof e.offsetX !== 'undefined') return e.offsetX;

  if (typeof e.layerX !== 'undefined') return e.layerX;

  if (typeof e.clientX !== 'undefined') return e.clientX;

  throw new Error('sigma/captors/utils.getX: could not extract x from event.');
}

/**
 * Extract the local Y position from a mouse or touch event.
 *
 * @param  {event}  e - A mouse or touch event.
 * @return {number}     The local Y value of the mouse.
 */
function getY(e) {
  if (typeof e.offsetY !== 'undefined') return e.offsetY;

  if (typeof e.layerY !== 'undefined') return e.layerY;

  if (typeof e.clientY !== 'undefined') return e.clientY;

  throw new Error('sigma/captors/utils.getY: could not extract y from event.');
}

/**
 * Extract the width from a mouse or touch event.
 *
 * @param  {event}  e - A mouse or touch event.
 * @return {number}     The width of the event's target.
 */
function getWidth(e) {
  var w = !e.target.ownerSVGElement ? e.target.width : e.target.ownerSVGElement.width;

  if (typeof w === 'number') return w;

  if (w !== undefined && w.baseVal !== undefined) return w.baseVal.value;

  throw new Error('sigma/captors/utils.getWidth: could not extract width from event.');
}

/**
 * Extract the height from a mouse or touch event.
 *
 * @param  {event}  e - A mouse or touch event.
 * @return {number}     The height of the event's target.
 */
function getHeight(e) {
  var w = !e.target.ownerSVGElement ? e.target.height : e.target.ownerSVGElement.height;

  if (typeof w === 'number') return w;

  if (w !== undefined && w.baseVal !== undefined) return w.baseVal.value;

  throw new Error('sigma/captors/utils.getHeight: could not extract height from event.');
}

/**
 * Extract the center from a mouse or touch event.
 *
 * @param  {event}  e - A mouse or touch event.
 * @return {object}     The center of the event's target.
 */
function getCenter(e) {
  var ratio = e.target.namespaceURI.indexOf('svg') !== -1 ? 1 : (0, _utils.getPixelRatio)();

  return {
    x: getWidth(e) / (2 * ratio),
    y: getHeight(e) / (2 * ratio)
  };
}

/**
 * Convert mouse coords to sigma coords.
 *
 * @param  {event}   e   - A mouse or touch event.
 * @param  {number}  [x] - The x coord to convert
 * @param  {number}  [y] - The y coord to convert
 *
 * @return {object}
 */
function getMouseCoords(e) {
  return {
    x: getX(e),
    y: getY(e),
    clientX: e.clientX,
    clientY: e.clientY,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    altKey: e.altKey,
    shiftKey: e.shiftKey
  };
}

/**
 * Extract the wheel delta from a mouse or touch event.
 *
 * @param  {event}  e - A mouse or touch event.
 * @return {number}     The wheel delta of the mouse.
 */
function getWheelDelta(e) {
  if (_typeof(e.wheelDelta) !== undefined) return e.wheelDelta;

  if (_typeof(e.detail) !== undefined) return -e.detail;

  throw new Error('sigma/captors/utils.getDelta: could not extract delta from event.');
}

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Sigma.js Easings
 * =================
 *
 * Handy collection of easing functions.
 */
var linear = exports.linear = function linear(k) {
  return k;
};

var quadraticIn = exports.quadraticIn = function quadraticIn(k) {
  return k * k;
};

var quadraticOut = exports.quadraticOut = function quadraticOut(k) {
  return k * (2 - k);
};

var quadraticInOut = exports.quadraticInOut = function quadraticInOut(k) {
  if ((k *= 2) < 1) return 0.5 * k * k;
  return -0.5 * (--k * (k - 2) - 1);
};

var cubicIn = exports.cubicIn = function cubicIn(k) {
  return k * k * k;
};

var cubicOut = exports.cubicOut = function cubicOut(k) {
  return --k * k * k + 1;
};

var cubicInOut = exports.cubicInOut = function cubicInOut(k) {
  if ((k *= 2) < 1) return 0.5 * k * k * k;
  return 0.5 * ((k -= 2) * k * k + 2);
};

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _sigma = __webpack_require__(16);

var _sigma2 = _interopRequireDefault(_sigma);

var _renderer = __webpack_require__(1);

var _renderer2 = _interopRequireDefault(_renderer);

var _camera = __webpack_require__(4);

var _camera2 = _interopRequireDefault(_camera);

var _quadtree = __webpack_require__(6);

var _quadtree2 = _interopRequireDefault(_quadtree);

var _mouse = __webpack_require__(5);

var _mouse2 = _interopRequireDefault(_mouse);

var _webgl = __webpack_require__(15);

var _webgl2 = _interopRequireDefault(_webgl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Sigma.js Library Endpoint
 * ==========================
 *
 * The library endpoint.
 */
var library = {
  Sigma: _sigma2.default,
  Renderer: _renderer2.default,
  Camera: _camera2.default,
  QuadTree: _quadtree2.default,
  MouseCaptor: _mouse2.default,
  WebGLRenderer: _webgl2.default
};

for (var k in library) {
  _sigma2.default[k] = library[k];
}module.exports = _sigma2.default;

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = drawHover;

var _node = __webpack_require__(27);

var _node2 = _interopRequireDefault(_node);

var _label = __webpack_require__(11);

var _label2 = _interopRequireDefault(_label);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Sigma.js Canvas Renderer Hover Component
 * =========================================
 *
 * Function used by the canvas renderer to display a single node's hovered
 * state.
 */
function drawHover(context, data) {

  context.font = '14px arial';

  // Then we draw the label background
  context.beginPath();
  context.fillStyle = '#fff';
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 8;
  context.shadowColor = '#000';

  var textWidth = context.measureText(data.label).width;

  var x = Math.round(data.x - 14 / 2 - 2),
      y = Math.round(data.y - 14 / 2 - 2),
      w = Math.round(textWidth + 14 / 2 + data.size + 9),
      h = Math.round(14 + 4),
      e = Math.round(14 / 2 + 2);

  context.moveTo(x, y + e);
  context.moveTo(x, y + e);
  context.arcTo(x, y, x + e, y, e);
  context.lineTo(x + w, y);
  context.lineTo(x + w, y + h);
  context.lineTo(x + e, y + h);
  context.arcTo(x, y + h, x, y + h - e, e);
  context.lineTo(x, y + e);

  context.closePath();
  context.fill();

  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;

  // Then we need to draw the node
  (0, _node2.default)(context, data);

  // And finally we draw the label
  (0, _label2.default)(context, data);
}

// ;(function(undefined) {
//   'use strict';

//   if (typeof sigma === 'undefined')
//     throw 'sigma is not declared';

//   // Initialize packages:
//   sigma.utils.pkg('sigma.canvas.hovers');

//   /**
//    * This hover renderer will basically display the label with a background.
//    *
//    * @param  {object}                   node     The node object.
//    * @param  {CanvasRenderingContext2D} context  The canvas context.
//    * @param  {configurable}             settings The settings function.
//    */
//   sigma.canvas.hovers.def = function(node, context, settings) {
//     var x,
//         y,
//         w,
//         h,
//         e,
//         fontStyle = settings('hoverFontStyle') || settings('fontStyle'),
//         prefix = settings('prefix') || '',
//         size = node[prefix + 'size'],
//         fontSize = (settings('labelSize') === 'fixed') ?
//           settings('defaultLabelSize') :
//           settings('labelSizeRatio') * size;

//     // Label background:
//     context.font = (fontStyle ? fontStyle + ' ' : '') +
//       fontSize + 'px ' + (settings('hoverFont') || settings('font'));

//     context.beginPath();
//     context.fillStyle = settings('labelHoverBGColor') === 'node' ?
//       (node.color || settings('defaultNodeColor')) :
//       settings('defaultHoverLabelBGColor');

//     if (node.label && settings('labelHoverShadow')) {
//       context.shadowOffsetX = 0;
//       context.shadowOffsetY = 0;
//       context.shadowBlur = 8;
//       context.shadowColor = settings('labelHoverShadowColor');
//     }

//     if (node.label && typeof node.label === 'string') {
//       x = Math.round(node[prefix + 'x'] - fontSize / 2 - 2);
//       y = Math.round(node[prefix + 'y'] - fontSize / 2 - 2);
//       w = Math.round(
//         context.measureText(node.label).width + fontSize / 2 + size + 7
//       );
//       h = Math.round(fontSize + 4);
//       e = Math.round(fontSize / 2 + 2);

//       context.moveTo(x, y + e);
//       context.arcTo(x, y, x + e, y, e);
//       context.lineTo(x + w, y);
//       context.lineTo(x + w, y + h);
//       context.lineTo(x + e, y + h);
//       context.arcTo(x, y + h, x, y + h - e, e);
//       context.lineTo(x, y + e);

//       context.closePath();
//       context.fill();

//       context.shadowOffsetX = 0;
//       context.shadowOffsetY = 0;
//       context.shadowBlur = 0;
//     }

//     // Node border:
//     if (settings('borderSize') > 0) {
//       context.beginPath();
//       context.fillStyle = settings('nodeBorderColor') === 'node' ?
//         (node.color || settings('defaultNodeColor')) :
//         settings('defaultNodeBorderColor');
//       context.arc(
//         node[prefix + 'x'],
//         node[prefix + 'y'],
//         size + settings('borderSize'),
//         0,
//         Math.PI * 2,
//         true
//       );
//       context.closePath();
//       context.fill();
//     }

//     // Node:
//     var nodeRenderer = sigma.canvas.nodes[node.type] || sigma.canvas.nodes.def;
//     nodeRenderer(node, context, settings);

//     // Display the label:
//     if (node.label && typeof node.label === 'string') {
//       context.fillStyle = (settings('labelHoverColor') === 'node') ?
//         (node.color || settings('defaultNodeColor')) :
//         settings('defaultLabelHoverColor');

//       context.fillText(
//         node.label,
//         Math.round(node[prefix + 'x'] + size + 3),
//         Math.round(node[prefix + 'y'] + fontSize / 3)
//       );
//     }
//   };
// }).call(this);

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = drawNode;
/**
 * Sigma.js Canvas Renderer Node Component
 * ========================================
 *
 * Function used by the canvas renderer to display a single node.
 */
var PI_TIMES_2 = Math.PI * 2;

function drawNode(context, data) {

  context.fillStyle = data.color;
  context.beginPath();
  context.arc(data.x, data.y, data.size, 0, PI_TIMES_2, true);

  context.closePath();
  context.fill();
}

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _program = __webpack_require__(13);

var _program2 = _interopRequireDefault(_program);

var _utils = __webpack_require__(2);

var _edgeVert = __webpack_require__(33);

var _edgeVert2 = _interopRequireDefault(_edgeVert);

var _edgeFrag = __webpack_require__(32);

var _edgeFrag2 = _interopRequireDefault(_edgeFrag);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Sigma.js WebGL Renderer Node Program
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * =====================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Program rendering edges as thick lines using four points translated
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * orthogonally from the source & target's centers by half thickness.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Rendering two triangles by using only four points is made possible through
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * the use of indices.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * This method should be faster than the 6 points / 2 triangles approach and
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * should handle thickness better than with gl.LINES.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * This version of the shader balances geometry computation evenly between
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * the CPU & GPU (normals are computed on the CPU side).
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var EdgeProgram = function (_Program) {
  _inherits(EdgeProgram, _Program);

  function EdgeProgram(gl) {
    _classCallCheck(this, EdgeProgram);

    // Initializing buffers
    var _this = _possibleConstructorReturn(this, (EdgeProgram.__proto__ || Object.getPrototypeOf(EdgeProgram)).call(this, gl, _edgeVert2.default, _edgeFrag2.default));

    _this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, _this.buffer);

    _this.indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _this.indicesBuffer);

    // Locations
    _this.positionLocation = gl.getAttribLocation(_this.program, 'a_position');
    _this.normalLocation = gl.getAttribLocation(_this.program, 'a_normal');
    _this.thicknessLocation = gl.getAttribLocation(_this.program, 'a_thickness');
    _this.colorLocation = gl.getAttribLocation(_this.program, 'a_color');
    _this.resolutionLocation = gl.getUniformLocation(_this.program, 'u_resolution');
    _this.ratioLocation = gl.getUniformLocation(_this.program, 'u_ratio');
    _this.matrixLocation = gl.getUniformLocation(_this.program, 'u_matrix');

    // Bindings
    gl.enableVertexAttribArray(_this.positionLocation);
    gl.enableVertexAttribArray(_this.normalLocation);
    gl.enableVertexAttribArray(_this.thicknessLocation);
    gl.enableVertexAttribArray(_this.colorLocation);

    gl.vertexAttribPointer(_this.positionLocation, 2, gl.FLOAT, false, EdgeProgram.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(_this.normalLocation, 2, gl.FLOAT, false, EdgeProgram.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);
    gl.vertexAttribPointer(_this.thicknessLocation, 1, gl.FLOAT, false, EdgeProgram.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 16);
    gl.vertexAttribPointer(_this.colorLocation, 1, gl.FLOAT, false, EdgeProgram.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 20);
    return _this;
  }

  _createClass(EdgeProgram, [{
    key: 'process',
    value: function process(array, sourceData, targetData, data, i) {

      if (sourceData.hidden || targetData.hidden || data.hidden) {
        for (var l = i + EdgeProgram.POINTS * EdgeProgram.ATTRIBUTES; i < l; i++) {
          array[i] = 0;
        }
      }

      var thickness = data.size || 1,
          x1 = sourceData.x,
          y1 = sourceData.y,
          x2 = targetData.x,
          y2 = targetData.y,
          color = (0, _utils.floatColor)(data.color);

      // Computing normals
      var dx = x2 - x1,
          dy = y2 - y1;

      var len = dx * dx + dy * dy,
          n1 = 0,
          n2 = 0;

      if (len) {
        len = 1 / Math.sqrt(len);

        n1 = -dy * len;
        n2 = dx * len;
      }

      // First point
      array[i++] = x1;
      array[i++] = y1;
      array[i++] = n1;
      array[i++] = n2;
      array[i++] = thickness;
      array[i++] = color;

      // First point flipped
      array[i++] = x1;
      array[i++] = y1;
      array[i++] = -n1;
      array[i++] = -n2;
      array[i++] = thickness;
      array[i++] = color;

      // Second point
      array[i++] = x2;
      array[i++] = y2;
      array[i++] = n1;
      array[i++] = n2;
      array[i++] = thickness;
      array[i++] = color;

      // Second point flipped
      array[i++] = x2;
      array[i++] = y2;
      array[i++] = -n1;
      array[i++] = -n2;
      array[i++] = thickness;
      array[i++] = color;
    }
  }, {
    key: 'computeIndices',
    value: function computeIndices(array) {
      var l = array.length / EdgeProgram.ATTRIBUTES;

      var size = l + l / 2;

      var indices = new Uint16Array(size);

      for (var i = 0, c = 0; i < size; i += 4) {
        indices[c++] = i;
        indices[c++] = i + 1;
        indices[c++] = i + 2;
        indices[c++] = i + 2;
        indices[c++] = i + 1;
        indices[c++] = i + 3;
      }

      return indices;
    }
  }, {
    key: 'render',
    value: function render(gl, array, params) {
      var program = this.program;
      gl.useProgram(program);

      // Buffer data
      gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);

      // Binding uniforms
      gl.uniform2f(this.resolutionLocation, params.width, params.height);
      gl.uniform1f(this.ratioLocation, params.ratio / Math.pow(params.ratio, params.edgesPowRatio));

      gl.uniformMatrix3fv(this.matrixLocation, false, params.matrix);

      // Buffering indices data
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, params.indices, gl.STATIC_DRAW);

      // Drawing:
      gl.drawElements(gl.TRIANGLES, params.indices.length, gl.UNSIGNED_SHORT, 0);
    }
  }]);

  return EdgeProgram;
}(_program2.default);

exports.default = EdgeProgram;


EdgeProgram.POINTS = 4;
EdgeProgram.ATTRIBUTES = 6;

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _program = __webpack_require__(13);

var _program2 = _interopRequireDefault(_program);

var _utils = __webpack_require__(2);

var _nodeVert = __webpack_require__(35);

var _nodeVert2 = _interopRequireDefault(_nodeVert);

var _nodeFrag = __webpack_require__(34);

var _nodeFrag2 = _interopRequireDefault(_nodeFrag);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Sigma.js WebGL Renderer Node Program
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * =====================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Simple program rendering nodes as discs, shaped by triangles using the
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * `gl.TRIANGLES` display mode. So, to draw one node, it will need to store
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * three times the center of the node, with the color, the size and an angle
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * indicating which "corner" of the triangle to draw.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var ANGLE_1 = 0,
    ANGLE_2 = 2 * Math.PI / 3,
    ANGLE_3 = 4 * Math.PI / 3;

var NodeProgram = function (_Program) {
  _inherits(NodeProgram, _Program);

  function NodeProgram(gl) {
    _classCallCheck(this, NodeProgram);

    // Initializing buffers
    var _this = _possibleConstructorReturn(this, (NodeProgram.__proto__ || Object.getPrototypeOf(NodeProgram)).call(this, gl, _nodeVert2.default, _nodeFrag2.default));

    _this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, _this.buffer);

    // Locations
    _this.positionLocation = gl.getAttribLocation(_this.program, 'a_position');
    _this.sizeLocation = gl.getAttribLocation(_this.program, 'a_size');
    _this.colorLocation = gl.getAttribLocation(_this.program, 'a_color');
    _this.angleLocation = gl.getAttribLocation(_this.program, 'a_angle');
    _this.resolutionLocation = gl.getUniformLocation(_this.program, 'u_resolution');
    _this.matrixLocation = gl.getUniformLocation(_this.program, 'u_matrix');
    _this.ratioLocation = gl.getUniformLocation(_this.program, 'u_ratio');
    _this.scaleLocation = gl.getUniformLocation(_this.program, 'u_scale');

    // Bindings
    gl.enableVertexAttribArray(_this.positionLocation);
    gl.enableVertexAttribArray(_this.sizeLocation);
    gl.enableVertexAttribArray(_this.colorLocation);
    gl.enableVertexAttribArray(_this.angleLocation);

    gl.vertexAttribPointer(_this.positionLocation, 2, gl.FLOAT, false, NodeProgram.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.vertexAttribPointer(_this.sizeLocation, 1, gl.FLOAT, false, NodeProgram.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);

    gl.vertexAttribPointer(_this.colorLocation, 1, gl.FLOAT, false, NodeProgram.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 12);

    gl.vertexAttribPointer(_this.angleLocation, 1, gl.FLOAT, false, NodeProgram.ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 16);
    return _this;
  }

  _createClass(NodeProgram, [{
    key: 'process',
    value: function process(array, data, i) {
      var color = (0, _utils.floatColor)(data.color);

      array[i++] = data.x;
      array[i++] = data.y;
      array[i++] = data.size;
      array[i++] = color;
      array[i++] = ANGLE_1;

      array[i++] = data.x;
      array[i++] = data.y;
      array[i++] = data.size;
      array[i++] = color;
      array[i++] = ANGLE_2;

      array[i++] = data.x;
      array[i++] = data.y;
      array[i++] = data.size;
      array[i++] = color;
      array[i++] = ANGLE_3;
    }
  }, {
    key: 'render',
    value: function render(gl, array, params) {
      var program = this.program;
      gl.useProgram(program);

      gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);

      gl.uniform2f(this.resolutionLocation, params.width, params.height);
      gl.uniform1f(this.ratioLocation, 1 / Math.pow(params.ratio, params.nodesPowRatio));
      gl.uniform1f(this.scaleLocation, params.scalingRatio);
      gl.uniformMatrix3fv(this.matrixLocation, false, params.matrix);

      gl.drawArrays(gl.TRIANGLES, 0, array.length / NodeProgram.ATTRIBUTES);
    }
  }]);

  return NodeProgram;
}(_program2.default);

exports.default = NodeProgram;


NodeProgram.POINTS = 3;
NodeProgram.ATTRIBUTES = 5;

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadProgram = loadProgram;
/**
 * Sigma.js Shader Utils
 * ======================
 *
 * Code used to load sigma's shaders.
 */

/**
 * Function used to load a shader.
 */
function loadShader(type, gl, source) {
  var glType = type === 'VERTEX' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

  // Creating the shader
  var shader = gl.createShader(glType);

  // Loading source
  gl.shaderSource(shader, source);

  // Compiling the shader
  gl.compileShader(shader);

  // Retrieving compilation status
  var successfullyCompiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  // Throwing if something went awry
  if (!successfullyCompiled) {
    var infoLog = gl.getShaderInfoLog(shader);

    gl.deleteShader(shader);
    throw new Error('sigma/renderers/weblg/shaders/utils.loadShader: error while compiling the shader:\n' + infoLog + '\n' + source);
  }

  return shader;
}

var loadVertexShader = loadShader.bind(null, 'VERTEX'),
    loadFragmentShader = loadShader.bind(null, 'FRAGMENT');

exports.loadVertexShader = loadVertexShader;
exports.loadFragmentShader = loadFragmentShader;

/**
 * Function used to load a program.
 */

function loadProgram(gl, shaders) {
  var program = gl.createProgram();

  var i = void 0,
      l = void 0;

  // Attaching the shaders
  for (i = 0, l = shaders.length; i < l; i++) {
    gl.attachShader(program, shaders[i]);
  }gl.linkProgram(program);

  // Checking status
  var successfullyLinked = gl.getProgramParameter(program, gl.LINK_STATUS);

  if (!successfullyLinked) {

    gl.deleteProgram(program);
    throw new Error('sigma/renderers/weblg/shaders/utils.loadProgram: error while linking the program.');
  }

  return program;
}

/***/ }),
/* 31 */
/***/ (function(module, exports) {

/**
 * Graphology isGraph
 * ===================
 *
 * Very simple function aiming at ensuring the given variable is a
 * graphology instance.
 */

/**
 * Checking the value is a graphology instance.
 *
 * @param  {any}     value - Target value.
 * @return {boolean}
 */
module.exports = function isGraph(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.addUndirectedEdgeWithKey === 'function' &&
    typeof value.dropNodes === 'function' &&
    typeof value.multi === 'boolean'
  );
};


/***/ }),
/* 32 */
/***/ (function(module, exports) {

module.exports = "precision mediump float;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\n\nvoid main(void) {\n  float feather = 0.5;\n  vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);\n\n  float radius = v_thickness;\n\n  float dist = length(v_normal) * (radius + feather);\n\n  float t = smoothstep(\n    radius + feather,\n    radius - feather,\n    dist\n  );\n\n  gl_FragColor = mix(color0, v_color, t);\n}\n"

/***/ }),
/* 33 */
/***/ (function(module, exports) {

module.exports = "attribute vec2 a_position;\nattribute vec2 a_normal;\nattribute float a_thickness;\nattribute float a_color;\n\nuniform vec2 u_resolution;\nuniform float u_ratio;\nuniform mat3 u_matrix;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\n\nvoid main() {\n\n  float feather = 0.5 * 2.0;\n\n  // Scale from [[-1 1] [-1 1]] to the container:\n  vec2 delta = vec2(a_normal * (a_thickness + feather) / 2.0);\n  vec2 position = (u_matrix * vec3(a_position + delta, 1)).xy;\n  position = (position / u_resolution * 2.0 - 1.0) * vec2(1, -1);\n\n  // Applying\n  gl_Position = vec4(position, 0, 1);\n\n  v_normal = a_normal;\n  v_thickness = (a_thickness / 2.0) * (1.0 / u_ratio);\n\n  // Extract the color:\n  float c = a_color;\n  v_color.b = mod(c, 256.0); c = floor(c / 256.0);\n  v_color.g = mod(c, 256.0); c = floor(c / 256.0);\n  v_color.r = mod(c, 256.0); c = floor(c / 256.0); v_color /= 255.0;\n  v_color.a = 1.0;\n}\n"

/***/ }),
/* 34 */
/***/ (function(module, exports) {

module.exports = "precision mediump float;\n\nvarying vec4 color;\nvarying vec2 center;\nvarying float radius;\n\nvoid main(void) {\n  float border_size = 0.8;\n  vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);\n\n  vec2 m = gl_FragCoord.xy - center;\n  float dist = sqrt(m.x * m.x + m.y * m.y);\n  float t = smoothstep(\n    radius + border_size,\n    radius - border_size,\n    dist\n  );\n\n  // Here is how we draw a disc instead of a square:\n  gl_FragColor = mix(color0, color, t);\n}\n"

/***/ }),
/* 35 */
/***/ (function(module, exports) {

module.exports = "attribute vec2 a_position;\nattribute float a_size;\nattribute float a_color;\nattribute float a_angle;\n\nuniform vec2 u_resolution;\nuniform float u_ratio;\nuniform float u_scale;\nuniform mat3 u_matrix;\n\nvarying vec4 color;\nvarying vec2 center;\nvarying float radius;\n\nvoid main() {\n  // Multiply the point size twice:\n  radius = a_size * u_ratio;\n\n  // Scale from [[-1 1] [-1 1]] to the container:\n  vec2 position = (u_matrix * vec3(a_position, 1)).xy;\n  // center = (position / u_resolution * 2.0 - 1.0) * vec2(1, -1);\n  center = position * u_scale;\n  center = vec2(center.x, u_scale * u_resolution.y - center.y);\n\n  position = position +\n    2.0 * radius * vec2(cos(a_angle), sin(a_angle));\n  position = (position / u_resolution * 2.0 - 1.0) * vec2(1, -1);\n\n  radius = radius * u_scale;\n\n  gl_Position = vec4(position, 0, 1);\n\n  // Extract the color:\n  float c = a_color;\n  color.b = mod(c, 256.0); c = floor(c / 256.0);\n  color.g = mod(c, 256.0); c = floor(c / 256.0);\n  color.r = mod(c, 256.0); c = floor(c / 256.0); color /= 255.0;\n  color.a = 1.0;\n}\n"

/***/ })
/******/ ]);
});

/***/ })
/******/ ]);