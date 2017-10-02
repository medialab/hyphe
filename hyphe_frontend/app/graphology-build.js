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

var freeGlobal = __webpack_require__(24);

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

var Symbol = __webpack_require__(23),
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

var defineProperty = __webpack_require__(22);

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
    isLength = __webpack_require__(32);

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
/* 17 */
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
/* 18 */
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
/* 19 */
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
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

var identity = __webpack_require__(21),
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
/* 21 */
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
/* 22 */
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
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

var root = __webpack_require__(1);

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(46)))

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var Stack = __webpack_require__(55),
    assignMergeValue = __webpack_require__(27),
    baseFor = __webpack_require__(79),
    baseMergeDeep = __webpack_require__(81),
    isObject = __webpack_require__(0),
    keysIn = __webpack_require__(35);

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
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var getNative = __webpack_require__(11),
    root = __webpack_require__(1);

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;


/***/ }),
/* 27 */
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
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

var overArg = __webpack_require__(89);

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;


/***/ }),
/* 29 */
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
/* 30 */
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
/* 31 */
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
/* 32 */
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
/* 33 */
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
/* 34 */
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
/* 35 */
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
/* 36 */
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
var forceAtlas2Layout = __webpack_require__(107);
window.graphlayout = {
  random: randomLayout,
  forceAtlas2: forceAtlas2Layout
};
window.Graph = __webpack_require__(110);
window.gexf = __webpack_require__(118);
// window.Sigma = require('sigma').default
// window.SigmaWebGLRenderer = require('sigma/renderers/webgl').default

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
    isGraph = __webpack_require__(16);

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

var apply = __webpack_require__(19),
    baseRest = __webpack_require__(20),
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

var apply = __webpack_require__(19);

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
    defineProperty = __webpack_require__(22),
    identity = __webpack_require__(21);

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

var Symbol = __webpack_require__(23);

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

var baseMerge = __webpack_require__(25),
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
    Map = __webpack_require__(26),
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
    Map = __webpack_require__(26);

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

var assignMergeValue = __webpack_require__(27),
    cloneBuffer = __webpack_require__(82),
    cloneTypedArray = __webpack_require__(83),
    copyArray = __webpack_require__(86),
    initCloneObject = __webpack_require__(87),
    isArguments = __webpack_require__(30),
    isArray = __webpack_require__(31),
    isArrayLikeObject = __webpack_require__(91),
    isBuffer = __webpack_require__(33),
    isFunction = __webpack_require__(12),
    isObject = __webpack_require__(0),
    isPlainObject = __webpack_require__(93),
    isTypedArray = __webpack_require__(34),
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
    getPrototype = __webpack_require__(28),
    isPrototype = __webpack_require__(29);

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
    getPrototype = __webpack_require__(28),
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
    isLength = __webpack_require__(32),
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

/* WEBPACK VAR INJECTION */(function(module) {var freeGlobal = __webpack_require__(24);

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
    keysIn = __webpack_require__(35);

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
    isArguments = __webpack_require__(30),
    isArray = __webpack_require__(31),
    isBuffer = __webpack_require__(33),
    isIndex = __webpack_require__(36),
    isTypedArray = __webpack_require__(34);

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
    isPrototype = __webpack_require__(29),
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

var baseMerge = __webpack_require__(25),
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

var baseRest = __webpack_require__(20),
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
    isIndex = __webpack_require__(36),
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

/**
 * Graphology ForceAtlas2 Layout
 * ==============================
 *
 * Library endpoint.
 */
var isGraph = __webpack_require__(16),
    iterate = __webpack_require__(108),
    helpers = __webpack_require__(109);

/**
 * Default Settings.
 */
var DEFAULT_SETTINGS = {
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

/**
 * Asbtract function used to run a certain number of iterations.
 *
 * @param  {boolean}       assign       - Whether to assign positions.
 * @param  {Graph}         graph        - Target graph.
 * @param  {object|number} params       - If number, params.iterations, else:
 * @param  {number}          iterations - Number of iterations.
 * @param  {object}          [settings] - Settings.
 * @return {object|undefined}
 */
function abstractSynchronousLayout(assign, graph, params) {
  if (!isGraph(graph))
    throw new Error('graphology-layout-forceatlas2: the given graph is not a valid graphology instance.');

  if (typeof params === 'number')
    params = {iterations: params};

  var iterations = params.iterations;

  if (typeof iterations !== 'number')
    throw new Error('graphology-layout-forceatlas2: invalid number of iterations.');

  if (iterations <= 0)
    throw new Error('graphology-layout-forceatlas2: you should provide a positive number of iterations.');

  // Validating settings
  var settings = helpers.assign({}, DEFAULT_SETTINGS, params.settings),
      validationError = helpers.validateSettings(settings);

  if (validationError)
    throw new Error('graphology-layout-forceatlas2: ' + validationError.message);

  // Building matrices
  var matrices = helpers.graphToByteArrays(graph),
      i;

  // Iterating
  for (i = 0; i < iterations; i++)
    iterate(settings, matrices.nodes, matrices.edges);

  // Applying
  if (assign) {
    helpers.applyLayoutChanges(graph, matrices.nodes);
    return;
  }

  return helpers.collectLayoutChanges(graph, matrices.nodes);
}

/**
 * Exporting.
 */
var synchronousLayout = abstractSynchronousLayout.bind(null, false);
synchronousLayout.assign = abstractSynchronousLayout.bind(null, true);

module.exports = synchronousLayout;


/***/ }),
/* 108 */
/***/ (function(module, exports) {

/* eslint no-constant-condition: 0 */
/**
 * Graphology ForceAtlas2 Iteration
 * =================================
 *
 * Function used to perform a single iteration of the algorithm.
 */

/**
 * Matrices properties accessors.
 */
var NODE_X = 0,
    NODE_Y = 1,
    NODE_DX = 2,
    NODE_DY = 3,
    NODE_OLD_DX = 4,
    NODE_OLD_DY = 5,
    NODE_MASS = 6,
    NODE_CONVERGENCE = 7,
    NODE_SIZE = 8,
    NODE_FIXED = 9;

var EDGE_SOURCE = 0,
    EDGE_TARGET = 1,
    EDGE_WEIGHT = 2;

var REGION_NODE = 0,
    REGION_CENTER_X = 1,
    REGION_CENTER_Y = 2,
    REGION_SIZE = 3,
    REGION_NEXT_SIBLING = 4,
    REGION_FIRST_CHILD = 5,
    REGION_MASS = 6,
    REGION_MASS_CENTER_X = 7,
    REGION_MASS_CENTER_Y = 8;

/**
 * Constants.
 */
var PPN = 10,
    PPE = 3,
    PPR = 9;

var MAX_FORCE = 10;

/**
 * Function used to perform a single interation of the algorithm.
 *
 * @param  {object}       options    - Layout options.
 * @param  {Float32Array} NodeMatrix - Node data.
 * @param  {Float32Array} EdgeMatrix - Edge data.
 * @return {object}                  - Some metadata.
 */
module.exports = function(options, NodeMatrix, EdgeMatrix) {

  // Initializing variables
  var l, r, n, n1, n2, e, w, g;

  var order = NodeMatrix.length,
      size = EdgeMatrix.length;

  var outboundAttCompensation,
      coefficient,
      xDist,
      yDist,
      ewc,
      distance,
      factor;

  var RegionMatrix = [];

  // 1) Initializing layout data
  //-----------------------------

  // Resetting positions & computing max values
  for (n = 0; n < order; n += PPN) {
    NodeMatrix[n + NODE_OLD_DX] = NodeMatrix[n + NODE_DX];
    NodeMatrix[n + NODE_OLD_DY] = NodeMatrix[n + NODE_DY];
    NodeMatrix[n + NODE_DX] = 0;
    NodeMatrix[n + NODE_DY] = 0;
  }

  // If outbound attraction distribution, compensate
  if (options.outboundAttractionDistribution) {
    outboundAttCompensation = 0;
    for (n = 0; n < order; n += PPN) {
      outboundAttCompensation += NodeMatrix[n + NODE_MASS];
    }

    outboundAttCompensation /= order;
  }


  // 1.bis) Barnes-Hut computation
  //------------------------------

  if (options.barnesHutOptimize) {

    // Setting up
    var minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity,
        q, q2;

    // Computing min and max values
    for (n = 0; n < order; n += PPN) {
      minX = Math.min(minX, NodeMatrix[n + NODE_X]);
      maxX = Math.max(maxX, NodeMatrix[n + NODE_X]);
      minY = Math.min(minY, NodeMatrix[n + NODE_Y]);
      maxY = Math.max(maxY, NodeMatrix[n + NODE_Y]);
    }

    // Build the Barnes Hut root region
    RegionMatrix[0 + REGION_NODE] = -1;
    RegionMatrix[0 + REGION_CENTER_X] = (minX + maxX) / 2;
    RegionMatrix[0 + REGION_CENTER_Y] = (minY + maxY) / 2;
    RegionMatrix[0 + REGION_SIZE] = Math.max(maxX - minX, maxY - minY);
    RegionMatrix[0 + REGION_NEXT_SIBLING] = -1;
    RegionMatrix[0 + REGION_FIRST_CHILD] = -1;
    RegionMatrix[0 + REGION_MASS] = 0;
    RegionMatrix[0 + REGION_MASS_CENTER_X] = 0;
    RegionMatrix[0 + REGION_MASS_CENTER_Y] = 0;

    // Add each node in the tree
    l = 1;
    for (n = 0; n < order; n += PPN) {

      // Current region, starting with root
      r = 0;

      while (true) {
        // Are there sub-regions?

        // We look at first child index
        if (RegionMatrix[r + REGION_FIRST_CHILD] >= 0) {

          // There are sub-regions

          // We just iterate to find a "leave" of the tree
          // that is an empty region or a region with a single node
          // (see next case)

          // Find the quadrant of n
          if (NodeMatrix[n + NODE_X] < RegionMatrix[r + REGION_CENTER_X]) {

            if (NodeMatrix[n + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {

              // Top Left quarter
              q = RegionMatrix[r + REGION_FIRST_CHILD];
            }
            else {

              // Bottom Left quarter
              q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR;
            }
          }
          else {
            if (NodeMatrix[n + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {

              // Top Right quarter
              q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 2;
            }
            else {

              // Bottom Right quarter
              q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 3;
            }
          }

          // Update center of mass and mass (we only do it for non-leave regions)
          RegionMatrix[r + REGION_MASS_CENTER_X] =
            (RegionMatrix[r + REGION_MASS_CENTER_X] * RegionMatrix[r + REGION_MASS] +
             NodeMatrix[n + NODE_X] * NodeMatrix[n + NODE_MASS]) /
            (RegionMatrix[r + REGION_MASS] + NodeMatrix[n + NODE_MASS]);

          RegionMatrix[r + REGION_MASS_CENTER_Y] =
            (RegionMatrix[r + REGION_MASS_CENTER_Y] * RegionMatrix[r + REGION_MASS] +
             NodeMatrix[n + NODE_Y] * NodeMatrix[n + NODE_MASS]) /
            (RegionMatrix[r + REGION_MASS] + NodeMatrix[n + NODE_MASS]);

          RegionMatrix[r + REGION_MASS] += NodeMatrix[n + NODE_MASS];

          // Iterate on the right quadrant
          r = q;
          continue;
        }
        else {

          // There are no sub-regions: we are in a "leave"

          // Is there a node in this leave?
          if (RegionMatrix[r + REGION_NODE] < 0) {

            // There is no node in region:
            // we record node n and go on
            RegionMatrix[r + REGION_NODE] = n;
            break;
          }
          else {

            // There is a node in this region

            // We will need to create sub-regions, stick the two
            // nodes (the old one r[0] and the new one n) in two
            // subregions. If they fall in the same quadrant,
            // we will iterate.

            // Create sub-regions
            RegionMatrix[r + REGION_FIRST_CHILD] = l * PPR;
            w = RegionMatrix[r + REGION_SIZE] / 2;  // new size (half)

            // NOTE: we use screen coordinates
            // from Top Left to Bottom Right

            // Top Left sub-region
            g = RegionMatrix[r + REGION_FIRST_CHILD];

            RegionMatrix[g + REGION_NODE] = -1;
            RegionMatrix[g + REGION_CENTER_X] = RegionMatrix[r + REGION_CENTER_X] - w;
            RegionMatrix[g + REGION_CENTER_Y] = RegionMatrix[r + REGION_CENTER_Y] - w;
            RegionMatrix[g + REGION_SIZE] = w;
            RegionMatrix[g + REGION_NEXT_SIBLING] = g + PPR;
            RegionMatrix[g + REGION_FIRST_CHILD] = -1;
            RegionMatrix[g + REGION_MASS] = 0;
            RegionMatrix[g + REGION_MASS_CENTER_X] = 0;
            RegionMatrix[g + REGION_MASS_CENTER_Y] = 0;

            // Bottom Left sub-region
            g += PPR;
            RegionMatrix[g + REGION_NODE] = -1;
            RegionMatrix[g + REGION_CENTER_X] = RegionMatrix[r + REGION_CENTER_X] - w;
            RegionMatrix[g + REGION_CENTER_Y] = RegionMatrix[r + REGION_CENTER_Y] + w;
            RegionMatrix[g + REGION_SIZE] = w;
            RegionMatrix[g + REGION_NEXT_SIBLING] = g + PPR;
            RegionMatrix[g + REGION_FIRST_CHILD] = -1;
            RegionMatrix[g + REGION_MASS] = 0;
            RegionMatrix[g + REGION_MASS_CENTER_X] = 0;
            RegionMatrix[g + REGION_MASS_CENTER_Y] = 0;

            // Top Right sub-region
            g += PPR;
            RegionMatrix[g + REGION_NODE] = -1;
            RegionMatrix[g + REGION_CENTER_X] = RegionMatrix[r + REGION_CENTER_X] + w;
            RegionMatrix[g + REGION_CENTER_Y] = RegionMatrix[r + REGION_CENTER_Y] - w;
            RegionMatrix[g + REGION_SIZE] = w;
            RegionMatrix[g + REGION_NEXT_SIBLING] = g + PPR;
            RegionMatrix[g + REGION_FIRST_CHILD] = -1;
            RegionMatrix[g + REGION_MASS] = 0;
            RegionMatrix[g + REGION_MASS_CENTER_X] = 0;
            RegionMatrix[g + REGION_MASS_CENTER_Y] = 0;

            // Bottom Right sub-region
            g += PPR;
            RegionMatrix[g + REGION_NODE] = -1;
            RegionMatrix[g + REGION_CENTER_X] = RegionMatrix[r + REGION_CENTER_X] + w;
            RegionMatrix[g + REGION_CENTER_Y] = RegionMatrix[r + REGION_CENTER_Y] + w;
            RegionMatrix[g + REGION_SIZE] = w;
            RegionMatrix[g + REGION_NEXT_SIBLING] = RegionMatrix[r + REGION_NEXT_SIBLING];
            RegionMatrix[g + REGION_FIRST_CHILD] = -1;
            RegionMatrix[g + REGION_MASS] = 0;
            RegionMatrix[g + REGION_MASS_CENTER_X] = 0;
            RegionMatrix[g + REGION_MASS_CENTER_Y] = 0;

            l += 4;

            // Now the goal is to find two different sub-regions
            // for the two nodes: the one previously recorded (r[0])
            // and the one we want to add (n)

            // Find the quadrant of the old node
            if (NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_X] < RegionMatrix[r + REGION_CENTER_X]) {
              if (NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {

                // Top Left quarter
                q = RegionMatrix[r + REGION_FIRST_CHILD];
              }
              else {

                // Bottom Left quarter
                q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR;
              }
            }
            else {
              if (NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {

                // Top Right quarter
                q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 2;
              }
              else {

                // Bottom Right quarter
                q = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 3;
              }
            }

            // We remove r[0] from the region r, add its mass to r and record it in q
            RegionMatrix[r + REGION_MASS] = NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_MASS];
            RegionMatrix[r + REGION_MASS_CENTER_X] = NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_X];
            RegionMatrix[r + REGION_MASS_CENTER_Y] = NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_Y];

            RegionMatrix[q + REGION_NODE] = RegionMatrix[r + REGION_NODE];
            RegionMatrix[r + REGION_NODE] = -1;

            // Find the quadrant of n
            if (NodeMatrix[n + NODE_X] < RegionMatrix[r + REGION_CENTER_X]) {
              if (NodeMatrix[n + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {

                // Top Left quarter
                q2 = RegionMatrix[r + REGION_FIRST_CHILD];
              }
              else {
                // Bottom Left quarter
                q2 = RegionMatrix[r + REGION_FIRST_CHILD] + PPR;
              }
            }
            else {
              if (NodeMatrix[n + NODE_Y] < RegionMatrix[r + REGION_CENTER_Y]) {

                // Top Right quarter
                q2 = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 2;
              }
              else {

                // Bottom Right quarter
                q2 = RegionMatrix[r + REGION_FIRST_CHILD] + PPR * 3;
              }
            }

            if (q === q2) {

              // If both nodes are in the same quadrant,
              // we have to try it again on this quadrant
              r = q;
              continue;
            }

            // If both quadrants are different, we record n
            // in its quadrant
            RegionMatrix[q2 + REGION_NODE] = n;
            break;
          }
        }
      }
    }
  }


  // 2) Repulsion
  //--------------
  // NOTES: adjustSizes = antiCollision & scalingRatio = coefficient

  if (options.barnesHutOptimize) {
    coefficient = options.scalingRatio;

    // Applying repulsion through regions
    for (n = 0; n < order; n += PPN) {

      // Computing leaf quad nodes iteration

      r = 0; // Starting with root region
      while (true) {

        if (RegionMatrix[r + REGION_FIRST_CHILD] >= 0) {

          // The region has sub-regions

          // We run the Barnes Hut test to see if we are at the right distance
          distance = Math.sqrt(
            (Math.pow(NodeMatrix[n + NODE_X] - RegionMatrix[r + REGION_MASS_CENTER_X], 2)) +
            (Math.pow(NodeMatrix[n + NODE_Y] - RegionMatrix[r + REGION_MASS_CENTER_Y], 2))
          );

          if (2 * RegionMatrix[r + REGION_SIZE] / distance < options.barnesHutTheta) {

            // We treat the region as a single body, and we repulse

            xDist = NodeMatrix[n + NODE_X] - RegionMatrix[r + REGION_MASS_CENTER_X];
            yDist = NodeMatrix[n + NODE_Y] - RegionMatrix[r + REGION_MASS_CENTER_Y];

            if (options.adjustSizes) {

              //-- Linear Anti-collision Repulsion
              if (distance > 0) {
                factor = coefficient * NodeMatrix[n + NODE_MASS] *
                  RegionMatrix[r + REGION_MASS] / distance / distance;

                NodeMatrix[n + NODE_DX] += xDist * factor;
                NodeMatrix[n + NODE_DY] += yDist * factor;
              }
              else if (distance < 0) {
                factor = -coefficient * NodeMatrix[n + NODE_MASS] *
                  RegionMatrix[r + REGION_MASS] / distance;

                NodeMatrix[n + NODE_DX] += xDist * factor;
                NodeMatrix[n + NODE_DY] += yDist * factor;
              }
            }
            else {

              //-- Linear Repulsion
              if (distance > 0) {
                factor = coefficient * NodeMatrix[n + NODE_MASS] *
                  RegionMatrix[r + REGION_MASS] / distance / distance;

                NodeMatrix[n + NODE_DX] += xDist * factor;
                NodeMatrix[n + NODE_DY] += yDist * factor;
              }
            }

            // When this is done, we iterate. We have to look at the next sibling.
            if (RegionMatrix[r + REGION_NEXT_SIBLING] < 0)
              break;  // No next sibling: we have finished the tree
            r = RegionMatrix[r + REGION_NEXT_SIBLING];
            continue;

          }
          else {

            // The region is too close and we have to look at sub-regions
            r = RegionMatrix[r + REGION_FIRST_CHILD];
            continue;
          }

        }
        else {

          // The region has no sub-region
          // If there is a node r[0] and it is not n, then repulse

          if (RegionMatrix[r + REGION_NODE] >= 0 && RegionMatrix[r + REGION_NODE] !== n) {
            xDist = NodeMatrix[n + NODE_X] - NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_X];
            yDist = NodeMatrix[n + NODE_Y] - NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_Y];

            distance = Math.sqrt(xDist * xDist + yDist * yDist);

            if (options.adjustSizes) {

              //-- Linear Anti-collision Repulsion
              if (distance > 0) {
                factor = coefficient * NodeMatrix[n + NODE_MASS] *
                  NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_MASS] / distance / distance;

                NodeMatrix[n + NODE_DX] += xDist * factor;
                NodeMatrix[n + NODE_DY] += yDist * factor;
              }
              else if (distance < 0) {
                factor = -coefficient * NodeMatrix[n + NODE_MASS] *
                  NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_MASS] / distance;

                NodeMatrix[n + NODE_DX] += xDist * factor;
                NodeMatrix[n + NODE_DY] += yDist * factor;
              }
            }
            else {

              //-- Linear Repulsion
              if (distance > 0) {
                factor = coefficient * NodeMatrix[n + NODE_MASS] *
                  NodeMatrix[RegionMatrix[r + REGION_NODE] + NODE_MASS] / distance / distance;

                NodeMatrix[n + NODE_DX] += xDist * factor;
                NodeMatrix[n + NODE_DY] += yDist * factor;
              }
            }

          }

          // When this is done, we iterate. We have to look at the next sibling.
          if (RegionMatrix[r + REGION_NEXT_SIBLING] < 0)
            break;  // No next sibling: we have finished the tree
          r = RegionMatrix[r + REGION_NEXT_SIBLING];
          continue;
        }
      }
    }
  }
  else {
    coefficient = options.scalingRatio;

    // Square iteration
    for (n1 = 0; n1 < order; n1 += PPN) {
      for (n2 = 0; n2 < n1; n2 += PPN) {

        // Common to both methods
        xDist = NodeMatrix[n1 + NODE_X] - NodeMatrix[n2 + NODE_X];
        yDist = NodeMatrix[n1 + NODE_Y] - NodeMatrix[n2 + NODE_Y];

        if (options.adjustSizes) {

          //-- Anticollision Linear Repulsion
          distance = Math.sqrt(xDist * xDist + yDist * yDist) -
            NodeMatrix[n1 + NODE_SIZE] -
            NodeMatrix[n2 + NODE_SIZE];

          if (distance > 0) {
            factor = coefficient *
              NodeMatrix[n1 + NODE_MASS] *
              NodeMatrix[n2 + NODE_MASS] /
              distance / distance;

            // Updating nodes' dx and dy
            NodeMatrix[n1 + NODE_DX] += xDist * factor;
            NodeMatrix[n1 + NODE_DY] += yDist * factor;

            NodeMatrix[n2 + NODE_DX] += xDist * factor;
            NodeMatrix[n2 + NODE_DY] += yDist * factor;
          }
          else if (distance < 0) {
            factor = 100 * coefficient *
              NodeMatrix[n1 + NODE_MASS] *
              NodeMatrix[n2 + NODE_MASS];

            // Updating nodes' dx and dy
            NodeMatrix[n1 + NODE_DX] += xDist * factor;
            NodeMatrix[n1 + NODE_DY] += yDist * factor;

            NodeMatrix[n2 + NODE_DX] -= xDist * factor;
            NodeMatrix[n2 + NODE_DY] -= yDist * factor;
          }
        }
        else {

          //-- Linear Repulsion
          distance = Math.sqrt(xDist * xDist + yDist * yDist);

          if (distance > 0) {
            factor = coefficient *
              NodeMatrix[n1 + NODE_MASS] *
              NodeMatrix[n2 + NODE_MASS] /
              distance / distance;

            // Updating nodes' dx and dy
            NodeMatrix[n1 + NODE_DX] += xDist * factor;
            NodeMatrix[n1 + NODE_DY] += yDist * factor;

            NodeMatrix[n2 + NODE_DX] -= xDist * factor;
            NodeMatrix[n2 + NODE_DY] -= yDist * factor;
          }
        }
      }
    }
  }


  // 3) Gravity
  //------------
  g = options.gravity / options.scalingRatio;
  coefficient = options.scalingRatio;
  for (n = 0; n < order; n += PPN) {
    factor = 0;

    // Common to both methods
    xDist = NodeMatrix[n + NODE_X];
    yDist = NodeMatrix[n + NODE_Y];
    distance = Math.sqrt(
      Math.pow(xDist, 2) + Math.pow(yDist, 2)
    );

    if (options.strongGravityMode) {

      //-- Strong gravity
      if (distance > 0)
        factor = coefficient * NodeMatrix[n + NODE_MASS] * g;
    }
    else {

      //-- Linear Anti-collision Repulsion n
      if (distance > 0)
        factor = coefficient * NodeMatrix[n + NODE_MASS] * g / distance;
    }

    // Updating node's dx and dy
    NodeMatrix[n + NODE_DX] -= xDist * factor;
    NodeMatrix[n + NODE_DY] -= yDist * factor;
  }

  // 4) Attraction
  //---------------
  coefficient = 1 *
    (options.outboundAttractionDistribution ?
      outboundAttCompensation :
      1);

  // TODO: simplify distance
  // TODO: coefficient is always used as -c --> optimize?
  for (e = 0; e < size; e += PPE) {
    n1 = EdgeMatrix[e + EDGE_SOURCE];
    n2 = EdgeMatrix[e + EDGE_TARGET];
    w = EdgeMatrix[e + EDGE_WEIGHT];

    // Edge weight influence
    ewc = Math.pow(w, options.edgeWeightInfluence);

    // Common measures
    xDist = NodeMatrix[n1 + NODE_X] - NodeMatrix[n2 + NODE_X];
    yDist = NodeMatrix[n1 + NODE_Y] - NodeMatrix[n2 + NODE_Y];

    // Applying attraction to nodes
    if (options.adjustSizes) {

      distance = Math.sqrt(
        (Math.pow(xDist, 2) + Math.pow(yDist, 2)) -
        NodeMatrix[n1 + NODE_SIZE] -
        NodeMatrix[n2 + NODE_SIZE]
      );

      if (options.linLogMode) {
        if (options.outboundAttractionDistribution) {

          //-- LinLog Degree Distributed Anti-collision Attraction
          if (distance > 0) {
            factor = -coefficient * ewc * Math.log(1 + distance) /
            distance /
            NodeMatrix[n1 + NODE_MASS];
          }
        }
        else {

          //-- LinLog Anti-collision Attraction
          if (distance > 0) {
            factor = -coefficient * ewc * Math.log(1 + distance) / distance;
          }
        }
      }
      else {
        if (options.outboundAttractionDistribution) {

          //-- Linear Degree Distributed Anti-collision Attraction
          if (distance > 0) {
            factor = -coefficient * ewc / NodeMatrix[n1 + NODE_MASS];
          }
        }
        else {

          //-- Linear Anti-collision Attraction
          if (distance > 0) {
            factor = -coefficient * ewc;
          }
        }
      }
    }
    else {

      distance = Math.sqrt(
        Math.pow(xDist, 2) + Math.pow(yDist, 2)
      );

      if (options.linLogMode) {
        if (options.outboundAttractionDistribution) {

          //-- LinLog Degree Distributed Attraction
          if (distance > 0) {
            factor = -coefficient * ewc * Math.log(1 + distance) /
              distance /
              NodeMatrix[n1 + NODE_MASS];
          }
        }
        else {

          //-- LinLog Attraction
          if (distance > 0)
            factor = -coefficient * ewc * Math.log(1 + distance) / distance;
        }
      }
      else {
        if (options.outboundAttractionDistribution) {

          //-- Linear Attraction Mass Distributed
          // NOTE: Distance is set to 1 to override next condition
          distance = 1;
          factor = -coefficient * ewc / NodeMatrix[n1 + NODE_MASS];
        }
        else {

          //-- Linear Attraction
          // NOTE: Distance is set to 1 to override next condition
          distance = 1;
          factor = -coefficient * ewc;
        }
      }
    }

    // Updating nodes' dx and dy
    // TODO: if condition or factor = 1?
    if (distance > 0) {

      // Updating nodes' dx and dy
      NodeMatrix[n1 + NODE_DX] += xDist * factor;
      NodeMatrix[n1 + NODE_DY] += yDist * factor;

      NodeMatrix[n2 + NODE_DX] -= xDist * factor;
      NodeMatrix[n2 + NODE_DY] -= yDist * factor;
    }
  }


  // 5) Apply Forces
  //-----------------
  var force,
      swinging,
      traction,
      nodespeed;

  // MATH: sqrt and square distances
  if (options.adjustSizes) {

    for (n = 0; n < order; n += PPN) {
      if (!NodeMatrix[n + NODE_FIXED]) {
        force = Math.sqrt(
          Math.pow(NodeMatrix[n + NODE_DX], 2) +
          Math.pow(NodeMatrix[n + NODE_DY], 2)
        );

        if (force > MAX_FORCE) {
          NodeMatrix[n + NODE_DX] =
            NodeMatrix[n + NODE_DX] * MAX_FORCE / force;
          NodeMatrix[n + NODE_DY] =
            NodeMatrix[n + NODE_DY] * MAX_FORCE / force;
        }

        swinging = NodeMatrix[n + NODE_MASS] *
          Math.sqrt(
            (NodeMatrix[n + NODE_OLD_DX] - NodeMatrix[n + NODE_DX]) *
            (NodeMatrix[n + NODE_OLD_DX] - NodeMatrix[n + NODE_DX]) +
            (NodeMatrix[n + NODE_OLD_DY] - NodeMatrix[n + NODE_DY]) *
            (NodeMatrix[n + NODE_OLD_DY] - NodeMatrix[n + NODE_DY])
          );

        traction = Math.sqrt(
          (NodeMatrix[n + NODE_OLD_DX] + NodeMatrix[n + NODE_DX]) *
          (NodeMatrix[n + NODE_OLD_DX] + NodeMatrix[n + NODE_DX]) +
          (NodeMatrix[n + NODE_OLD_DY] + NodeMatrix[n + NODE_DY]) *
          (NodeMatrix[n + NODE_OLD_DY] + NodeMatrix[n + NODE_DY])
        ) / 2;

        nodespeed =
          0.1 * Math.log(1 + traction) / (1 + Math.sqrt(swinging));

        // Updating node's positon
        NodeMatrix[n + NODE_X] =
          NodeMatrix[n + NODE_X] + NodeMatrix[n + NODE_DX] *
          (nodespeed / options.slowDown);
        NodeMatrix[n + NODE_Y] =
          NodeMatrix[n + NODE_Y] + NodeMatrix[n + NODE_DY] *
          (nodespeed / options.slowDown);
      }
    }
  }
  else {

    for (n = 0; n < order; n += PPN) {
      if (!NodeMatrix[n + NODE_FIXED]) {

        swinging = NodeMatrix[n + NODE_MASS] *
          Math.sqrt(
            (NodeMatrix[n + NODE_OLD_DX] - NodeMatrix[n + NODE_DX]) *
            (NodeMatrix[n + NODE_OLD_DX] - NodeMatrix[n + NODE_DX]) +
            (NodeMatrix[n + NODE_OLD_DY] - NodeMatrix[n + NODE_DY]) *
            (NodeMatrix[n + NODE_OLD_DY] - NodeMatrix[n + NODE_DY])
          );

        traction = Math.sqrt(
          (NodeMatrix[n + NODE_OLD_DX] + NodeMatrix[n + NODE_DX]) *
          (NodeMatrix[n + NODE_OLD_DX] + NodeMatrix[n + NODE_DX]) +
          (NodeMatrix[n + NODE_OLD_DY] + NodeMatrix[n + NODE_DY]) *
          (NodeMatrix[n + NODE_OLD_DY] + NodeMatrix[n + NODE_DY])
        ) / 2;

        nodespeed = NodeMatrix[n + NODE_CONVERGENCE] *
          Math.log(1 + traction) / (1 + Math.sqrt(swinging));

        // Updating node convergence
        NodeMatrix[n + NODE_CONVERGENCE] =
          Math.min(1, Math.sqrt(
            nodespeed *
            (Math.pow(NodeMatrix[n + NODE_DX], 2) +
             Math.pow(NodeMatrix[n + NODE_DY], 2)) /
            (1 + Math.sqrt(swinging))
          ));

        // Updating node's positon
        NodeMatrix[n + NODE_X] =
          NodeMatrix[n + NODE_X] + NodeMatrix[n + NODE_DX] *
          (nodespeed / options.slowDown);
        NodeMatrix[n + NODE_Y] =
          NodeMatrix[n + NODE_Y] + NodeMatrix[n + NODE_DY] *
          (nodespeed / options.slowDown);
      }
    }
  }

  // We return the information about the layout (no need to return the matrices)
  return {};
};


/***/ }),
/* 109 */
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
/* 110 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _utils = __webpack_require__(10);

var _graph = __webpack_require__(111);

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
/* 111 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = __webpack_require__(112);

var _iterator = __webpack_require__(37);

var _iterator2 = _interopRequireDefault(_iterator);

var _consume = __webpack_require__(17);

var _consume2 = _interopRequireDefault(_consume);

var _errors = __webpack_require__(3);

var _data = __webpack_require__(18);

var _indices = __webpack_require__(113);

var _attributes = __webpack_require__(114);

var _edges = __webpack_require__(115);

var _neighbors = __webpack_require__(116);

var _serialization = __webpack_require__(117);

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
/* 112 */
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
/* 113 */
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
/* 114 */
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
/* 115 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attachEdgeIteratorCreator = attachEdgeIteratorCreator;
exports.attachEdgeIterationMethods = attachEdgeIterationMethods;

var _iterator = __webpack_require__(37);

var _iterator2 = _interopRequireDefault(_iterator);

var _consume = __webpack_require__(17);

var _consume2 = _interopRequireDefault(_consume);

var _errors = __webpack_require__(3);

var _data = __webpack_require__(18);

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
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attachNeighborIterationMethods = attachNeighborIterationMethods;

var _consume = __webpack_require__(17);

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
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.serializeNode = serializeNode;
exports.serializeEdge = serializeEdge;
exports.validateSerializedNode = validateSerializedNode;
exports.validateSerializedEdge = validateSerializedEdge;

var _data = __webpack_require__(18);

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
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Graphology GEXF
 * ================
 *
 * Library endpoint.
 */
module.exports = __webpack_require__(119);


/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Graphology Node GEXF Endpoint
 * ==============================
 *
 * Endpoint gathering both parser & writer for Node.js.
 */
exports.write = __webpack_require__(120);


/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Graphology Common GEXF Writer
 * ==============================
 *
 * GEXF writer working for both node.js & the browser.
 */
var isGraph = __webpack_require__(16),
    XMLWriter = __webpack_require__(121);

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
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(122);


/***/ }),
/* 122 */
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


/***/ })
/******/ ]);