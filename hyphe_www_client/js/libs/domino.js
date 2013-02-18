/**
 * *domino.js* is a JavaScript cascading controller for quick interaction
 * prototyping.
 *
 * Sources: http://github.com/jacomyal/domino.js
 * Doc:     http://dominojs.org
 *
 * License:
 * --------
 * Copyright © 2012 Alexis Jacomy, Linkfluence - http://dominojs.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * The Software is provided "as is", without warranty of any kind, express or
 * implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose and noninfringement. In no event shall the
 * authors or copyright holders be liable for any claim, damages or other
 * liability, whether in an action of contract, tort or otherwise, arising
 * from, out of or in connection with the software or the use or other dealings
 * in the Software.
 */
;(function(window, undefined) {
  'use strict';

  // This RegExp determines which property names are valid or not:
  var _validPropertyName = /^[a-zA-Z_$-][a-zA-Z_$0-9-]*$/;

  // This Date is used when displayTime is true, to compute the difference:
  var _startTime = new Date();

  // Here is an object containing a reference to any named unkilled instance:
  var _instances = {};

  // Check domino.js existance:
  if (window.domino) {
    throw new Error('domino already exists');
  }

  /**
   * The constructor of any domino.js instance.
   *
   * @constructor
   * @extends domino.EventDispatcher
   * @this {domino}
   */
  window.domino = function() {
    // Inheritance:
    dispatcher.call(this);

    // Misc:
    var _self = this,
        _utils = domino.utils,
        _struct = domino.struct,
        _localSettings = {},
        _reference;

    // Properties management:
    var _types = {},
        _labels = {},
        _events = {},
        _getters = {},
        _setters = {},
        _statics = {},
        _properties = {},
        _propertyParameters = {},
        _overriddenGetters = {},
        _overriddenSetters = {};

    // Modules:
    var _modules = [];

    // Communication management:
    var _ascending = {},
        _descending = {},
        _eventListeners = {},
        _propertyListeners = {};

    // Hacks management:
    var _hackMethods = {},
        _hackDispatch = {};

    // AJAX management:
    var _services = {},
        _currentCalls = {},
        _shortcuts = {};

    // Set protected property names:
    var _protectedNames = {
      events: 1,
      services: 1,
      hacks: 1
    };
    (function() {
      var k;
      for (k in Object.prototype)
        _protectedNames[k] = 1;
      for (k in _getScope({full: true}))
        _protectedNames[k] = 1;
    })();

    // Initialization:
    _reference = _getScope({ full: true });

    var _o = {},
        _name;

    if (_struct.get(arguments[0]) === 'string')
      _name = arguments[0];
    else if (
      arguments[0] !== undefined &&
      _struct.get(arguments[0]) === 'object'
    )
      _o = arguments[0];
    else if (
      arguments[1] !== undefined &&
      _struct.get(arguments[1]) === 'object'
    )
      _o = arguments[1];

    _name = _o['name'];

    if (_name) {
      // Check if there is already an instance with the same name running:
      if (_instances[_name])
        _die('An instance named "' + _name + '" is already running.');
      else
        _instances[_name] = _reference;
    }

    (function() {
      var i;
      for (i in _o.properties || [])
        _addProperty(_o.properties[i].id, _o.properties[i]);

      for (i in _o.hacks || [])
        _addHack(_o.hacks[i]);

      for (i in _o.services || [])
        _addService(_o.services[i]);

      for (i in _o.shortcuts || [])
        _addShortcut(_o.shortcuts[i]['id'], _o.shortcuts[i]['method']);
    })();

    /**
     * Generates a "view" of the instance of domino, ie a new object containing
     * references to some methods of the instance. This makes the data and
     * methods manipulation way safer.
     *
     * @param  {?object} options The options that determine which scope to
     *                           return.
     *
     * @return {object} Returns the scope.
     *
     * Here is the list of options that are interpreted:
     *
     *   {?boolean} full          If true, then the full scope will be returned
     *   {?boolean} request       If true, then the scope will be able to use
     *                            the "request" method
     *   {?boolean} dispatchEvent If true, then the scope will be able to use
     *                            the "dispatchEvent" method
     */
    function _getScope(options) {
      var o = options || {},
          scope = {
            // Methods
            getEvents: _getEvents,
            getLabel: _getLabel,
            expand: _expand,
            warn: _warn,
            log: _log,
            die: _die,
            get: _get
          };

      // Here, we give to the scope direct possibility to activate domino
      // features. This scope is basically the "public view" of the domino
      // instance:
      if (o.full) {
        scope.kill = _kill;
        scope.update = _update;
        scope.addModule = _addModule;
        scope.request = _request;
        scope.settings = _settings;
        scope.dispatchEvent = function(type, data) {
          _mainLoop({
            events: _self.getEvent(type, data)
          });

          return this;
        };

      // But here, request() and dispatchEvent() will be "fake" functions: They
      // will store instruction that will be evaluated by domino after the
      // execution of the function that will use the scope:
      } else {
        if (o.request) {
          Object.defineProperty(scope, '_services', {
            value: []
          });

          scope.request = function(service, params) {
            this._services.push({
              service: service,
              params: params
            });

            return this;
          };
        }

        if (o.dispatchEvent) {
          Object.defineProperty(scope, '_events', {
            value: []
          });

          scope.dispatchEvent = function(type, data) {
            this._events.push({
              type: type,
              data: data
            });

            return this;
          };
        }
      }

      return scope;
    }

    /**
     * Replaces the pseudo-methods in the scope by errors, since they are no
     * longer useful.
     * @param  {Object} scope The scope the disable.
     */
    function _disableScope(scope) {
      if (scope.request !== undefined)
        scope.request = function() {
          _die('This method is no longer available.');
          return this;
        };

      if (scope.dispatchEvent !== undefined)
        scope.dispatchEvent = function() {
          _die('This method is no longer available.');
          return this;
        };
    }

    /**
     * References a new property, generated the setter and getter if not
     * specified, and binds the events.
     *
     * @param   {string}  id     The id of the property.
     * @param   {?Object} options An object containing some more precise
     *                            indications about the hack.
     *
     * @return {domino} Returns the domino instance itself.
     *
     * Here is the list of options that are recognized:
     *
     *   {?string}          label    The label of the property (the ID by
     *                               default)
     *   {?(string|object)} type     Indicated the type of the property. It has
     *                               to be a valid "structure".
     *   {?function}        setter   Overrides the default property setter.
     *   {?function}        getter   Overrides the default property getter.
     *   {?*}               value    The initial value of the property. Will be
     *                               set with the new setter if specified.
     *   {?(string|array)}  triggers The list of events that can modify the
     *                               property. Can be an array or the list of
     *                               events separated by spaces.
     *   {?(string|array)}  dispatch The list of events that must be triggered
     *                               after modification of the property. Can be
     *                               an array or the list of events separated
     *                               by spaces.
     */
    function _addProperty(id, options) {
      var i, k,
          o = options || {};

      // Check errors:
      if (id === undefined)
        _die('Property name not specified');

      if (_struct.get(id) !== 'string')
        _die('The property name must be a string');

      if (_properties[id] !== undefined)
        _die('Property "' + id + '" already exists');

      if (_protectedNames[id] !== undefined)
        _die('"' + id + '" can not be used to name a property');

      if (!id.match(_validPropertyName))
        _die('Property name not valid (' + _validPropertyName + ')');

      // Every parameters are stored here:
      _propertyParameters[id] = {};

      for (k in o)
        _propertyParameters[id][k] = o[k];

      // Label:
      _labels[id] = o['label'] || id;

      // Type:
      if (o['type'] !== undefined)
        if (!_struct.isValid(o['type']))
          _warn(
            'Property "' + id + '": Type not valid'
          );
        else
          _types[id] = o['type'];

      // Setter:
      if (o['setter'] !== undefined)
        if (_struct.get(o['setter']) !== 'function')
          _warn(
            'Property "' + id + '": Setter is not a function'
          );
        else {
          _setters[id] = o['setter'];
          _overriddenSetters[id] = true;
        }

      _setters[id] = _setters[id] || function(v) {
        if (
          _struct.deepScalar(_types[id]) &&
          _struct.compare(v, _properties[id], _types[id])
        )
          return false;

        if (_types[id] && !_struct.check(_types[id], v)) {
          _warn(
            'Property "' + id + '": Wrong type error'
          );
        } else
          _properties[id] = v;

        return true;
      };

      // Getter:
      if (o['getter'] !== undefined)
        if (_struct.get(o['getter']) !== 'function')
          _warn(
            'Property "' + id + '": Getter is not a function'
          );
        else {
          _getters[id] = o['getter'];
          _overriddenGetters[id] = true;
        }

      _getters[id] = _getters[id] || function() {
        return _properties[id];
      };

      // Initial value:
      if (o['value'] !== undefined || _types[id])
        o['value'] !== undefined ?
          _set(id, o['value']) :
          _log(
            'Property "' + id + '": ' +
              'Initial value is missing'
          );

      // Triggers (modules-to-domino events):
      if (o['triggers'] !== undefined) {
        !_struct.check('array|string', o['triggers']) &&
          _warn(
            'Property "' + id + '": ' +
              'Events ("triggers") must be specified in an array or ' +
              'separated by spaces in a string'
          );

        _events[id] = _utils.array(o['triggers']);
        for (i in _events[id] || []) {
          _ascending[_events[id][i]] = _ascending[_events[id][i]] || [];
          _ascending[_events[id][i]].push(id);
        }
      }

      // Dispatched events (domino-to-modules event):
      if (o['dispatch'] !== undefined)
        !_struct.check('array|string', o['dispatch']) ?
          _warn(
            'Property "' + id + '": ' +
              'Events ("dispatch") must be specified in an array or ' +
              'separated by spaces in a string'
          ) :
          (_descending[id] = _utils.array(o['dispatch']));

      return _self;
    }

    /**
     * Binds a new hack. Basically, hacks make possible to explicitely
     * trigger actions and events on specified events.
     *
     * @param   {?Object} options An object containing some more precise
     *                            indications about the hack.
     *
     * @return {domino} Returns the domino instance itself.
     *
     * Here is the list of options that are interpreted:
     *
     *   {(array|string)}  triggers The list of events that can trigger the
     *                              hack. Can be an array or the list of
     *                              events separated by spaces.
     *   {?(array|string)} dispatch The list of events that will be triggered
     *                              after actionning the hack. Can be an array
     *                              or the list of events separated by spaces.
     *                              spaces.
     *   {?function}       method   A method to execute after receiving a
     *                              trigger and before dispatching the
     *                              specified events.
     */
    function _addHack(options) {
      var a, i,
          o = options || {};

      // Errors:
      if (o['triggers'] === undefined)
        _die(
          'A hack requires at least one trigger to be bound'
        );

      a = _utils.array(o['triggers']);
      for (i in a) {
        _hackDispatch[a[i]] = _hackDispatch[a[i]] || [];
        _hackMethods[a[i]] = _hackMethods[a[i]] || [];

        // Method to execute:
        if (o['method'])
          _hackMethods[a[i]].push(o['method']);

        // Events to dispatch:
        if (o['dispatch'])
          _hackDispatch[a[i]] = _hackDispatch[a[i]].concat(
            _utils.array(o['dispatch'])
          );
      }

      return _self;
    }

    /**
     * References a new service, ie an helper to easily interact between your
     * server and your properties. This service will take itself as parameter
     * an object, whose most keys can override the default described bellow.
     *
     * @param   {?Object} options An object containing some more precise
     *                            indications about the service.
     *
     * @return {domino} Returns the domino instance itself.
     *
     * Here is the list of options that are interpreted:
     *
     *   {string}          id           The unique id of the service, used to
     *                                  specify which service to call.
     *   {string|function} url          The URL of the service. If a string,
     *                                  then any shortcut in it will be
     *                                  resolved. If a function, will be
     *                                  executed with the second argument given
     *                                  to request, and the returned string
     *                                  will also be resolved before the call.
     *   {?string}         contentType+ The AJAX query content-type
     *   {?string}         dataType+    The AJAX query data-type
     *   {?string}         type+        The AJAX call type (GET|POST|DELETE)
     *   {?(*|function)}   data+*       The data sent in the AJAX call. Can be
     *                                  either an object or a function (in
     *                                  which case it will be evaluated with
     *                                  the "light" scope). Then, the object
     *                                  will be parsed, and shortcuts can be
     *                                  used in the first depth of the object.
     *   {?function}       error+       A function to execute if AJAX failed.
     *   {?function}       before+      A function to execute before calling
     *                                  AJAX.
     *   {?function}       success+     A function to execute if AJAX
     *                                  successed.
     *   {?function}       expect+      A function to execute before the
     *                                  success. If returns true, the "success"
     *                                  callback will be triggered. Else, the
     *                                  "error" callback will be triggered.
     *                                  This value can be set as well from the
     *                                  instance settings or the global
     *                                  settings.
     *                                  This function takes as arguments the
     *                                  data returned by the service, the input
     *                                  object and the service configuration.
     *   {?string}         setter+*     The name of a property. If the setter
     *                                  exists, then it will be called with the
     *                                  received data as parameter, or the
     *                                  value corresponding to the path, if
     *                                  specified.
     *   {?(string|array)} path+*       Indicates the path of the data to give
     *                                  to the setter, if specified.
     *                                  (Example: "a.b.c")
     *   {?(string|array)} events++     The events to dispatch in case of
     *                                  success
     *
     * The properties followed by + are overridable when the service is called.
     * The properties followed by ++ are cumulative when the service is called.
     * The properties followed by "*" accept shortcut values.
     */
    function _addService(options) {
      var o = options || {};

      // Errors:
      if (o['id'] === undefined || _struct.get(o['id']) !== 'string')
        _die(
          'The service id is not indicated.'
        );

      if (!_struct.check('function|string', o['url']))
        _die(
          'The service URL is not valid.'
        );

      if (_services[o['id']] !== undefined)
        _die(
          'The service "' + o['id'] + '" already exists.'
        );

      _services[o['id']] = function(params) {
        _log('Calling service "' + o['id'] + '".');

        var p = params || {},
            shortcuts = p['shortcuts'] || {},
            ajaxObj = {
              contentType: p['contentType'] || o['contentType'],
              dataType: p['dataType'] || o['dataType'],
              type: (p['type'] || o['type'] || 'GET').toString().toUpperCase(),
              data: p['data'] !== undefined ?
                      p['data'] :
                      _struct.get(o['data']) === 'function' ?
                        o['data'].call(_getScope(), p) :
                        o['data'],
              url: _struct.get(o['url']) === 'function' ?
                     o['url'].call(_getScope(), p) :
                     o['url'],
              error: function(mes, xhr) {
                _self.dispatchEvent('domino.ajaxFailed');
                var error = p['error'] || o['error'],
                    a, k, property;

                if (_struct.get(error) === 'function') {
                  _execute(error, {
                    parameters: [mes, xhr, p],
                    loop: true,
                    scope: {
                      request: true,
                      dispatchEvent: true
                    }
                  });
                } else
                  _log(
                    'Loading service "' + o['id'] + '" ' +
                    'failed with message "' + mes + '" ' +
                    'and status ' + xhr.status + '.'
                  );
              }
            };

        var i, exp, k, doTest, val,
            pref = _settings('shortcutPrefix'),
            regexContains = new RegExp(pref + '(\\w+)', 'g'),
            regexFull = new RegExp('^' + pref + '(\\w+)$'),
            oldURL = null,
            matches;

        // Check that URL is still a string:
        if (_struct.get(ajaxObj['url']) !== 'string')
          _die(
            'The URL is no more a string (typed "' +
            _struct.get(ajaxObj['url']) +
            '")'
          );

        // Manage shortcuts in URL:
        while (
          (matches = ajaxObj['url'].match(regexContains)) &&
          ajaxObj['url'] !== oldURL
        ) {
          oldURL = ajaxObj['url'];
          for (i in matches) {
            exp = _expand(matches[i].match(regexFull)[1], shortcuts);
            ajaxObj['url'] =
              ajaxObj['url'].replace(new RegExp(matches[i], 'g'), exp);
          }
        }

        // Manage shortcuts in params:
        // (NOT DEEP - only first level)
        doTest = true;
        if (_struct.get(ajaxObj['data']) === 'string')
          if (ajaxObj['data'].match(regexFull))
            ajaxObj['data'] =
              _expand(ajaxObj['data'].match(regexFull)[1], shortcuts);

        if (_struct.get(ajaxObj['data']) === 'object')
          while (doTest) {
            doTest = false;
            for (k in ajaxObj['data'])
              if (
                _struct.get(ajaxObj['data'][k]) === 'string' &&
                ajaxObj['data'][k].match(regexFull)
              ) {
                ajaxObj['data'][k] =
                  _expand(ajaxObj['data'][k].match(regexFull)[1], shortcuts);
                doTest = true;
              }
          }

        // Success management:
        ajaxObj.success = function(data) {
          _log('Service "' + o['id'] + '" successfull.');

          var i, a, pushEvents, event, property,
              pathArray, d,
              dispatch = {},
              services = [],
              events = [],
              update = {},
              reiterate = false,
              path = p['path'] || o['path'],
              setter = p['setter'] || o['setter'],
              success = p['success'] || o['success'],
              expect = p['expect'] || o['expect'] || _settings('expect');

          // Check "expect" test:
          if (
            _struct.get(expect) === 'function' &&
            // If expect returns "falsy", then the error callback is called
            // instead of the success:
            !expect.call(_getScope(), data, p, o)
          ) {
            ajaxObj.error.call(this, 'Unexpected data received.', this);
            return;
          }

          // Expand different string params:
          if (
            _struct.get(setter) === 'string' &&
            setter.match(regexFull)
          )
            setter = _expand(setter.match(regexFull)[1], shortcuts);

          if (
            _struct.get(path) === 'string' &&
            path.match(regexFull)
          )
            path = _expand(path.match(regexFull)[1], shortcuts);

          // Check path:
          d = data;

          if ((path || '').match(/^(?:\w+\.)*\w+$/))
            pathArray = _struct.get(path, 'string') ?
              path.split('.') :
              undefined;
          else if (_struct.get(path) === 'string')
            _warn(
              'Path "' + path + '" does not match RegExp /^(?:\\w+\\.)*\\w+$/'
            );

          if (pathArray)
            for (i in pathArray) {
              d = d[pathArray[i]];
              if (d === undefined) {
                _warn(
                  'Wrong path "' + path + '" for service "' + o['id'] + '".'
                );
                continue;
              }
            }

          // Events to dispatch (service config):
          a = _utils.array(o['events']);
          for (i in a) {
            dispatch[a[i]] = 1;
            reiterate = true;
          }

          // Events to dispatch (call config):
          a = _utils.array(p['events']);
          for (i in a) {
            dispatch[a[i]] = 1;
            reiterate = true;
          }

          // Check setter:
          if (setter && _setters[setter]) {
            if (d !== undefined) {
              update[setter] = d;
              reiterate = true;
            }
          }

          // Check success:
          if (_struct.get(success) === 'function') {
            var obj = _execute(success, {
              parameters: [data, p],
              scope: {
                request: true,
                dispatchEvent: true
              }
            });

            a = _utils.array(obj['events']);
            for (k in a) {
              reiterate = true;
              dispatch[a[k].type] = 1;
            }

            for (k in obj['update'])
              if (update[k] === undefined) {
                update[k] = obj['update'][k];
                reiterate = true;
              } else
                _warn(
                  'The key ' +
                  '"' + k + '"' +
                  ' is nor a method neither a property.'
                );

            if ((obj['services'] || []).length) {
              reiterate = true;
              services = services.concat(obj['services']);
            }

            _disableScope(obj);
          }

          // Check events to dispatch:
          events = [];
          for (event in dispatch) {
            _self.dispatchEvent(event, _getScope());
            events.push(_self.getEvent(event, _getScope()));
          }

          // Start looping:
          if (reiterate)
            _mainLoop({
              events: events,
              update: update,
              services: services
            });
        };

        // Check if there is anything to do before launching the call:
        var before = p['before'] || o['before'];
        if (before != null && _struct.get(before) === 'function') {
          _execute(before, {
            parameters: [p],
            loop: true,
            scope: {
              dispatchEvent: true
            }
          });
        }

        // Abort:
        if (p['abort'] && _currentCalls[o['id']])
          _currentCalls[o['id']].abort();

        // Launch AJAX call:
        _currentCalls[o['id']] = _utils.ajax(ajaxObj);
      };

      return _self;
    }

    /**
     * Creates a shortcut, that can be called from different parameters in the
     * services. Basically, makes easier to insert changing values in URLs,
     * data, etc...
     *
     * Any property is already registered as shortcut (that returns then the
     * value when called), but can be overridden safely.
     *
     * @param   {string}   id     The string to use to call the shortcut.
     * @param   {function} method The method to call.
     *
     * @return {domino} Returns the domino instance itself.
     */
    function _addShortcut(id, method) {
      // Check errors:
      if (id === undefined)
        _die('Shortcut ID not specified.');

      if (_shortcuts[id])
        _die('Shortcut "' + id + '" already exists.');

      if (method === undefined)
        _die('Shortcut method not specified.');

      // Add shortcut:
      _shortcuts[id] = method;

      return _self;
    }

    /**
     * This module will create and reference a module, and return it
     *
     * @param   {function} klass   The module class constructor.
     * @param   {?array}   params  The array of the parameters to give to the
     *                             module constructor. The "light" scope will
     *                             always be given as the last parameter, to
     *                             make it easier to find labels or events
     *                             related to any property.
     * @param   {?object}  options An object containing some more precise
     *                             indications about the service (currently not
     *                             used).
     *
     * @return {*} Returns the module just created.
     */
    function _addModule(klass, params, options) {
      var i,
          o = options || {},
          module = {},
          bind = {},
          triggers,
          property,
          events,
          event;

      // Check errors:
      if (klass === undefined)
        _die('Module class not specified.');

      if (_struct.get(klass) !== 'function')
        _die('First parameter must be a function.');

      // Instanciate the module:
      klass.apply(module, (params || []).concat(_getScope()));
      triggers = module.triggers || {};

      // Ascending communication:
      for (event in triggers.events || {}) {
        _eventListeners[event] = _eventListeners[event] || [];
        _eventListeners[event].push(triggers.events[event]);
      }

      for (property in triggers.properties || {}) {
        for (i in _descending[property] || []) {
          _propertyListeners[property] =
            _propertyListeners[property] || [];

          _propertyListeners[property].push(
            triggers.properties[property]
          );
        }

        if (_getters[property] !== undefined) {
          var data = {};
          data[property] = _get(property);
          _execute(triggers.properties[property], {
            parameters: [_getScope()]
          });
        }
      }

      // Descending communication:
      for (event in _ascending || {})
        bind[event] = 1;

      for (event in _hackMethods || {})
        bind[event] = 1;

      for (event in _hackDispatch || {})
        bind[event] = 1;

      for (event in bind)
        module.addEventListener(event, _triggerMainLoop);

      // Finalize:
      _modules.push(module);
      return module;
    }

    /**
     * A method that can update any of the properties - designed to be used
     * especially from the hacks, eventually from the services success methods.
     * For each property actually updated, the related events will be
     * dispatched through the _mainLoop method.
     *
     * Can be called with two parameters (then the first one must be the name
     * of a property), or with one (then it must be an object, and each key
     * must be the name of a property).
     */
    function _update(a1, a2) {
      var o = (typeof a1 === 'object' && arguments.length === 1) ?
        a1 || {} :
        {};
      if (typeof a1 === 'string')
        o[a1] = a2;

      _mainLoop({
        update: o
      });

      return this;
    }

    /**
     * Starts the main loop with a single event as input.
     * @param  {object} event The event.
     */
    function _triggerMainLoop(event) {
      _mainLoop({
        events: [event]
      });
    }

    /**
     * The main loop, that is triggered either by modules, hacks or event by
     * itself, and that will update properties and dispatch events to the
     * modules, trigger hacks (and so eventually load services, for example).
     *
     * @param   {?object} options The options.
     *
     * Here is the list of options that are interpreted:
     *
     *   {?object}  update   The properties to update.
     *   {?array}   events   The events to trigger.
     *   {?array}   services The services to call.
     *   {?number}  loop     The depth of the loop.
     *   {?boolean} force    If true, all updated properties will dispatch the
     *                       outgoing events, event if the property has
     *                       actually not been updated.
     */
    function _mainLoop(options) {
      var a, i, j, k, event, data, push, property, log,
          reiterate = false,
          hacks = [],
          events = [],
          services = [],
          o = options || {},
          dispatch = {},
          update = {};

      o['loop'] = (+o['loop'] || 0) + 1;

      var eventsArray = _utils.array(o['events']),
          servicesArray = _utils.array(o['services']),
          updateObject = o['update'] || {};

      // Log:
      if (_settings('verbose')) {
        _log('Iteration ' + o['loop'] + ' (main loop)');

        if (eventsArray.length) {
          log = [];
          for (i in eventsArray)
            log.push(eventsArray[i].type);
          _log(' -> Events: ', log);
        }

        if (servicesArray.length) {
          log = [];
          for (i in servicesArray)
            log.push(servicesArray[i].service);
          _log(' -> Services: ', log);
        }

        log = [];
        for (i in updateObject)
          log.push(i);

        if (log.length)
          _log(' -> Update: ', log);
      }

      // Check properties to update:
      for (property in updateObject) {
        if (_setters[property] === undefined)
            _warn('The property "' + property + '" is not referenced.');
        else {
          push =
            _set(property, updateObject[property]) ||
            !!o['force'];

          if (push) {
            for (i in _propertyListeners[property])
              _execute(_propertyListeners[property][i], {
                parameters: [_getScope(), {
                  property: property
                }]
              });

            for (i in _descending[property] || [])
              dispatch[_descending[property][i]] = 1;
          }
        }
      }

      // Check services to call:
      for (i in servicesArray || [])
        _request(servicesArray[i].service, servicesArray[i].params);

      // Check events to trigger:
      for (i in eventsArray) {
        event = eventsArray[i];
        data = event.data || {};

        // Properties:
        if (data || o['force']) {
          a = _ascending[event.type] || [];
          for (j in a) {
            if (data[a[j]] !== undefined) {
              reiterate = true;
              update[a[j]] = data[a[j]];
            }
          }
        }

        // Modules triggers:
        for (k in _eventListeners[event.type]) {
          _execute(_eventListeners[event.type][k], {
            parameters: [_getScope(), event]
          });
        }

        // Hacks:
        for (j in _hackMethods[event.type] || []) {
          if (hacks.indexOf(_hackMethods[event.type][j]) < 0) {
            hacks.push(_hackMethods[event.type][j]);

            var obj = _execute(_hackMethods[event.type][j], {
              parameters: [event],
              scope: {
                request: true,
                dispatchEvent: true
              }
            });

            a = _utils.array(obj['events']);
            for (k in a)
              dispatch[a[k].type] = 1;

            for (k in obj['update']) {
              if (update[k] === undefined) {
                reiterate = true;
                update[k] = obj['update'][k];
              } else
                _warn(
                  'The property "' + k + '" ' +
                  'has already been updated in the current loop.'
                );
            }

            if ((obj['services'] || []).length) {
              reiterate = true;
              services = services.concat(obj['services']);
            }

            _disableScope(obj);
          }
        }

        for (j in _hackDispatch[event.type] || [])
          dispatch[_hackDispatch[event.type][j]] = 1;
      }

      for (event in dispatch) {
        _self.dispatchEvent(event, _getScope());
        events.push(_self.getEvent(event, _getScope()));
        reiterate = true;
      }

      // Reloop:
      if (reiterate)
        _mainLoop({
          events: events,
          update: update,
          services: services,
          loop: o['loop']
        });
    }

    /**
     * Returns the value of a property.
     *
     * @param  {string} property The name of the property.
     *
     * @return {*} If clone mode is activated, returns a clone of the value.
     *             Else, returns a reference to the value. Also, if the getter
     *             is overridden, it will return a reference or a clone of what
     *             the setter returns.
     */
    function _get(property) {
      if (_getters[property]) {
        if (_overriddenGetters[property]) {
          var arg = [],
              inputs = {},
              res;

          for (var i = 1, l = arguments.length; i < l; i++)
            arg.push(arguments[i]);

          inputs[property] = _properties[property];

          res = _execute(_getters[property], {
            parameters: arg,
            inputValues: inputs
          });

          return _doClone(property) ?
            _utils.clone(res['returned']) :
            res['returned'];
        } else
          return _doClone(property) ?
            _utils.clone(_getters[property]()) :
            _getters[property]();
      } else
        _warn('Property "' + property + '" not referenced.');
    }

    /**
     * Updates a property.
     *
     * @param {string} property The name of the property.
     * @param {*}      value    The value of the property.
     *
     * @return {boolean} Returns false if domino.js knows that the new value is
     *                   not different than the old one, and true else (useful
     *                   to know if events have to be dispatched after).
     *
     */
    function _set(property, value) {
      if (_setters[property]) {
        if (_overriddenSetters[property]) {
          var updated, res,
              arg = [],
              inputs = {};

          if (_doClone(property))
            value = _utils.clone(value);

          inputs[property] = _get(property);

          for (var i = 1, l = arguments.length; i < l; i++)
            arg.push(arguments[i]);

          res = _execute(_setters[property], {
            parameters: arg,
            inputValues: inputs
          });

          updated =
            _struct.get(res['returned']) !== 'boolean' ||
            res['returned'];

          if (updated)
            _properties[property] = res['update'][property];

          return updated;
        } else
          return _setters[property].call(
            _getScope(),
            _doClone(property) ?
              _utils.clone(value) :
              value
          );
      }

      _warn('Property "' + property + '" not referenced.');
      return false;
    }

    /**
     * Calls a service declared in the domino instance.
     *
     * @param  {string}  service The name of the service.
     * @param  {?object} options An object of options given to the declared
     *                           service.
     *
     * @return {*} Returns itself.
     *
     * Here is the list of options that are recognized:
     *
     *   {?boolean}      abort       Indicates if the last call of the
     *                               specified service has to be aborted.
     *   {?function}     before      Overrides the original service "before"
     *                               value.
     *   {?string}       contentType The contentType of the AJAX call.
     *   {?*}            data        If the original service "data" attribute
     *                               is not a function, then it will be
     *                               overridden by this "data" value.
     *   {?string}       dataType    The dataType of the AJAX call.
     *   {?function}     error       Overrides the original service "error"
     *                               value.
     *   {?array|string} events      Adds more events to dispatch when the
     *                               "success" is called.
     *   {?object}       params      The pairs (key/value) in this object will
     *                               override the shortcuts.
     *   {?string}       path        Overrides the original service "path"
     *                               value.
     *   {?string}       setter      Overrides the original service "setter"
     *                               value.
     *   {?function}     success     Overrides the original service "success"
     *                               value.
     *   {?string}       type        Overrides the AJAX call type
     *                               (GET|POST|DELETE).
     */
    function _request(service, options) {
      if (_services[service])
        _services[service](options);
      else
        _warn('Service "' + service + '" not referenced.');

      return this;
    }

    /**
     * Executes safely a function, deals with the "scope question"
     *
     * @param  {function} f       The function to execute.
     * @param  {?object}  options The options.
     *
     * @return {?object} Returns the formalized scopes alteration if loop is
     *                   not true in the options.
     *
     * Here is the list of options that are recognized:
     *
     *   {?string}  scope       Indicates which scope to give to the function.
     *   {?object}  inputValues Values to insert inside the scope before
     *                          execution.
     *   {?array}   parameters  The array of the parameters to give as input to
     *                          the function to execute.
     *   {?boolean} loop        If true, the _mainLoop() will directly be
     *                          triggered after execution. Else, the scope will
     *                          be formalized and returned.
     */
    function _execute(f, options) {
      var k, obj, returned,
          o = options || {},
          scope = _getScope(o['scope']);

      if (_struct.get(f) !== 'function')
        _die('The first parameter must be a function');

      for (k in o['inputValues'] || {})
        scope[k] = o['inputValues'][k];

      // Execute the function on the related scope:
      returned = f.apply(scope, o['parameters'] || []);

      // Initialize result object:
      obj = {
        'returned': returned,
        'update': {},
        'events': [],
        'services': []
      };

      // Check new vars:
      if (scope._events != null && !_struct.check('array', scope._events))
        _warn('Events must be stored in an array.');
      else
        obj['events'] = scope._events;

      for (k in scope)
        if (_setters[k] !== undefined) {
          obj['update'][k] = scope[k];
        } else if (_protectedNames[k] === undefined)
          _warn('The key "' + k + '" is not a method nor a property.');

      for (k in o['inputValues'])
        obj['update'][k] = scope[k];

      for (k in scope._services)
        obj['services'][k] = scope._services[k];

      // Check if the main loop has to be started directly from here:
      if (o['loop']) {
        var iterate =
          (obj['services'] || []).length ||
          (obj['events'] || []).length;

        if (!iterate)
          for (k in obj['update']) {
            iterate = true;
            continue;
          }

        if (iterate)
          _mainLoop(obj);
      } else {
        return obj;
      }
    }

    /**
     * Returns the label of the specified property.
     *
     * @param  {string} id The property.
     *
     * @return {string}    The label.
     */
    function _getLabel(id) {
      return _labels[id];
    }

    /**
     * Returns the events that can alter the specified property (ie the input
     * events).
     *
     * @param  {string} id The property.
     *
     * @return {array}     The events types.
     */
    function _getEvents(id) {
      return _events[id];
    }

    /**
     * Checks the shortcuts and eventually arbitrary objects if they have
     * anything corresponding to the string, and returns the related value.
     *
     * @param  {string}    v    The string to expand.
     * @param  {...object} args The arbitraty objects to check before the
     *                          shortcuts.
     *
     * @return {*}         The expanded value.
     */
    function _expand(s) {
      var sc = s,
          a = (s || '').toString().match(
            new RegExp('^' + _settings('shortcutPrefix') + '(\\w+)$')
          );

      if (a && a.length) {
        _warn('Prefix in expand() calls is deprecated.');
        sc = a[1];
      }

      // Check other custom objects:
      for (var i = 1, l = arguments.length; i < l; i++)
        if ((arguments[i] || {})[sc] !== undefined)
          return arguments[i][sc];

      // Check properties:
      if (_struct.get(_getters[sc]) === 'function')
        return _get(sc);

      // Check declared shortcuts:
      if (_struct.get(_shortcuts[sc]) === 'function')
        return _shortcuts[sc].call(_getScope());

      // If the shortcut is not resolved:
      _warn('The shortcut "', sc, '" has not been recognized.');
      return sc;
    }

    /**
     * An helper to know if the property must be cloned or not:
     */
    function _doClone(property) {
      var c = (_propertyParameters[property] || {}).clone;
      return c !== undefined ? !!c : _settings('clone');
    }

    /**
     * Kills the instance.
     */
    function _kill() {
      var i;

      _log('Killing instance "' + _name + '"');

      // Remove event listeners:
      for (i in _modules)
        _modules[i].removeEventListener();

      // Remove references:
      _modules = null;
      _types = null;
      _labels = null;
      _events = null;
      _getters = null;
      _setters = null;
      _statics = null;
      _properties = null;
      _overriddenGetters = null;
      _overriddenSetters = null;
      _modules = null;
      _ascending = null;
      _descending = null;
      _eventListeners = null;
      _propertyListeners = null;
      _hackMethods = null;
      _hackDispatch = null;
      _services = null;
      _currentCalls = null;
      _shortcuts = null;

      // Disable instance reference:
      for (i in _reference)
        delete _reference[i];

      // Kill the named reference:
      if (_instances[_name])
        delete _instances[_name];
    }

    /**
     * Instance settings manipulation method:
     */

    function _settings(a1, a2) {
      if (typeof a1 === 'string' && arguments.length === 1)
        return _localSettings[a1] !== undefined ?
          _localSettings[a1] :
          __settings__[a1];
      else {
        var o = (typeof a1 === 'object' && arguments.length === 1) ?
          a1 || {} :
          {};
        if (typeof a1 === 'string')
          o[a1] = a2;

        for (var k in o)
          if (o[k] !== undefined)
            _localSettings[k] = o[k];
          else
            delete _localSettings[k];

        return this;
      }
    };

    /**
     * Log methods (in the instance)
     */

    function _warn() {
      var a = ['[' + (_name || 'domino') + ']'];

      if (!_settings('strict'))
        a.push('WARNING');

      for (var k in arguments)
        a.push(arguments[k]);

      if (_settings('strict'))
        __die__.apply(this, a);
      else if (_settings('verbose'))
        __say__.apply(this, a);
    };

    function _die() {
      var a = ['[' + (_name || 'domino') + ']'];

      for (var k in arguments)
        a.push(arguments[k]);

      __die__.apply(this, a);
    };

    function _log() {
      var a = ['[' + (_name || 'domino') + ']'];

      if (!_settings('verbose'))
        return;

      for (var k in arguments)
        a.push(arguments[k]);

      __say__.apply(this, a);
    };

    // Return the full scope:
    return _reference;
  };
  var domino = window.domino;


  /**
   * Utils classes:
   */

  // Logs:
  function __warn__() {
    if (__settings__['strict'])
      __die__.apply(this, arguments);
    else
      __log__.apply(this, arguments);
  }

  function __die__() {
    var m = '';
    for (var k in arguments)
      m += (!!m ? ' ' : '') +
        arguments[k];

    throw (new Error(m));
  }

  function __log__() {
    if (!__settings__['verbose'])
      return;

    __say__.apply(this, arguments);
  }

  function __say__() {
    var a = [];
    for (var k in arguments)
      a.push(arguments[k]);

    if (__settings__['displayTime'])
      a.unshift(('00000000' + (new Date().getTime() - _startTime)).substr(-8));

    if (console && console.log instanceof Function)
      console.log.apply(console, a);
  }

  // Utils:
  domino.utils = {
    array: function(v, sep) {
      var a = (
            domino.struct.get(v) === 'string' ?
              v.split(sep || ' ') :
              domino.struct.get(v) === 'array' ?
                v :
                [v]
          ),
          res = [];
      for (var i in a)
        if (!!a[i])
          res.push(a[i]);

      return res;
    },
    clone: function(item) {
      if (!item) {
        return item;
      }

      var result, k;

      if (struct.get(item) === 'array') {
        result = [];
        for (var k in item)
          result[k] = this.clone(item[k]);
      } else if (struct.get(item) === 'date') {
        result = new Date(item.getTime());
      } else if (struct.get(item) === 'object') {
        if (!item.prototype) {
          result = {};
          for (var i in item) {
            result[i] = this.clone(item[i]);
          }
        } else {
          result = item;
        }
      } else {
        result = item;
      }

      return result;
    },
    ajax: function(o, fn) {
      if (typeof o === 'string')
        o = { url: o, ok: fn };
      else if (struct.get(o) !== 'object')
        __die__('[domino.global] Invalid parameter given to AJAX');

      var type = o.type || 'GET',
          url = o.url || '',
          ctyp = o.contentType || 'application/x-www-form-urlencoded',
          dtyp = o.dataType || 'json',
          xhr = new XMLHttpRequest(),
          timer,
          d, n;

      if (o.data) {
        if (typeof o.data === 'string')
          d = o.data;
        else if (/json/.test(ctyp))
          d = JSON.stringify(o.data);
        else {
          d = [];
          for (n in o.data)
            d.push(encodeURIComponent(n) + '=' + encodeURIComponent(o.data[n]));
          d = d.join('&');
        }

        if (/GET|DEL/i.test(type)) {
          url += /\?/.test(url) ?
            '&' + d :
            '?' + d;
          d = '';
        }
      }

      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          if (timer)
            clearTimeout(timer);

          if (/^2/.test(xhr.status)) {
            d = xhr.responseText;
            if (/json/.test(dtyp)) {
              try {
                d = JSON.parse(xhr.responseText);
              } catch (e) {
                return (
                  o.error &&
                  o.error('JSON parse error: ' + e.message, xhr)
                );
              }
            }
            o.success && o.success(d, xhr);
          } else {

            var message = +xhr.status ?
              xhr.responseText :
              xhr.responseText.length ?
                'Aborted: ' + xhr.responseText :
                'Aborted';

            o.error && o.error(message, xhr);
          }
        }
      };

      xhr.open(type, url, true);
      xhr.setRequestHeader('Content-Type', ctyp);

      if (o.headers)
        for (n in o.headers)
          xhr.setRequestHeader(n, o.headers[n]);

      if (o.timeout)
        timer = setTimeout(function() {
          xhr.onreadystatechange = function() {};
          xhr.abort();
          if (o.error)
            o.error && o.error('timeout', xhr);
        }, o.timeout * 1000);

      xhr.send(d);
      return xhr;
    }
  };

  // Structures helpers:
  domino.struct = (function() {
    var atoms = ['number', 'string', 'boolean', 'null', 'undefined'],
        classes = (
          'Boolean Number String Function Array Date RegExp Object'
        ).split(' '),
        class2type = {},
        types = ['*'];

    var customs = {};

    // Fill types
    for (var k in classes) {
      var name = classes[k];
      types.push(name.toLowerCase());
      class2type['[object ' + name + ']'] = name.toLowerCase();
    }

    return {
      add: function(a1, a2, a3) {
        var k, a, id, tmp, struct, o;

        // Check errors:
        if (arguments.length === 1) {
          if (this.get(a1) === 'object') {
            o = a1;
            id = o.id;
            struct = o.struct;
          } else
            __die__(
              '[domino.global] ' +
              'If struct.add is called with one arguments, ' +
              'it has to be an object'
            );
        } else if (arguments.length === 2) {
          if (this.get(a1) !== 'string' || !a1)
            __die__(
              '[domino.global] ' +
              'If struct.add is called with more than one arguments, ' +
              'the first one must be the string id'
            );
          else
            id = a1;

          struct = a2;
        } else
          __die__(
            '[domino.global] ' +
            'struct.add has to be called with one or three arguments'
          );

        if (this.get(id) !== 'string' || id.length === 0)
          __die__('[domino.global] A structure requires an string id');

        if (customs[id] !== undefined && customs[id] !== 'proto')
          __die__(
            '[domino.global] The structure "' + id + '" already exists'
          );

        customs[id] = 1;

        // Check given prototypes:
        a = domino.utils.array((o || {}).proto);
        tmp = {};
        for (k in a)
          if (customs[a[k]] === undefined) {
            customs[a[k]] = 1;
            tmp[a[k]] = 1;
          }

        if (
          (this.get(struct) !== 'function') && !this.isValid(struct)
        )
          __die__(
            '[domino.global] ' +
            'A structure requires a valid "structure" property ' +
            'describing the structure. It can be a valid structure or a ' +
            'function that test if an object matches the structure.'
          );

        if (~types.indexOf(id))
          __die__(
            '[domino.global] "' + id + '" is a reserved structure name'
          );

        // Effectively add the structure:
        customs[id] = (o === undefined) ?
          {
            id: id,
            struct: struct
          } :
          {};

        if (o !== undefined)
          for (k in o)
            customs[id][k] = o[k];

        // Delete prototypes:
        for (k in tmp)
          if (k !== id)
            delete customs[k];
      },
      get: function(obj) {
        return obj == null ?
          String(obj) :
          class2type[Object.prototype.toString.call(obj)] || 'object';
      },
      check: function(type, obj) {
        var a, i,
            typeOf = this.get(obj);

        if (this.get(type) === 'string') {
          a = type.replace(/^\?/, '').split(/\|/);
          for (i in a)
            if (types.indexOf(a[i]) < 0 && customs[a[i]] === undefined) {
              __warn__('[domino.global] Invalid type');
              return false;
            }

          if (obj == null)
            return !!type.match(/^\?/, '');
          else
            type = type.replace(/^\?/, '');

          for (i in a)
            if (customs[a[i]])
              if (
                (this.get(customs[a[i]].struct) === 'function') &&
                (customs[a[i]].struct(obj) === true) ||
                this.check(customs[a[i]].struct, obj)
              )
                return true;

          return !!(~a.indexOf('*') || ~a.indexOf(typeOf));
        } else if (this.get(type) === 'object') {
          if (typeOf !== 'object')
            return false;
          var k;

          for (k in type)
            if (!this.check(type[k], obj[k]))
              return false;

          for (k in obj)
            if (type[k] === undefined)
              return false;

          return true;
        } else if (this.get(type) === 'array') {
          if (typeOf !== 'array')
            return false;

          if (type.length !== 1) {
            __warn__('[domino.global] Invalid type');
            return false;
          }

          for (k in obj)
            if (!this.check(type[0], obj[k]))
              return false;

          return true;
        } else
          return false;
      },
      deepScalar: function(type) {
        var a, i;
        if (this.get(type) === 'string') {
          a = type.replace(/^\?/, '').split(/\|/);
          for (i in a)
            if (atoms.indexOf(a[i]) < 0)
              return false;
          return true;
        } else if (this.check('object|array', type)) {
          for (i in type)
            if (!this.deepScalar(type[i]))
              return false;
          return true;
        }

        return false;
      },
      compare: function(v1, v2, type) {
        var t1 = this.get(v1),
            t2 = this.get(v2),
            a, i;

        if (
          !this.deepScalar(type) ||
          !this.check(type, v1) ||
          !this.check(type, v2)
        )
          return false;

        if (this.get(type) === 'string') {
          return v1 === v2;
        } else if (this.get(type) === 'object') {
          for (i in type)
            if (!this.compare(v1[i], v2[i], type[i]))
              return false;
          return true;
        } else if (this.get(type) === 'array') {
          if (v1.length !== v2.length)
            return false;
          var l = v1.length;
          for (i = 0; i < l; i++)
            if (!this.compare(v1[i], v2[i], type[0]))
              return false;
          return true;
        }

        return false;
      },
      isValid: function(type) {
        var a, k, i;
        if (this.get(type) === 'string') {
          a = type.replace(/^\?/, '').split(/\|/);
          for (i in a)
            if (types.indexOf(a[i]) < 0 && customs[a[i]] === undefined)
              return false;
          return true;
        } else if (this.get(type) === 'object') {
          for (k in type)
            if (!this.isValid(type[k]))
              return false;

          return true;
        } else if (this.get(type) === 'array')
          return type.length === 1 ?
            this.isValid(type[0]) :
            false;
        else
          return false;
      }
    };
  })();
  var utils = domino.utils;
  var struct = domino.struct;

  // Global settings:
  var __settings__ = {
    strict: false,
    verbose: false,
    shortcutPrefix: ':',
    displayTime: false,
    clone: false
  };

  domino.settings = function(a1, a2) {
    if (typeof a1 === 'string' && arguments.length === 1)
      return __settings__[a1];
    else {
      var o = (typeof a1 === 'object' && arguments.length === 1) ?
        a1 || {} :
        {};
      if (typeof a1 === 'string')
        o[a1] = a2;

      for (var k in o)
        if (o[k] !== undefined)
          __settings__[k] = o[k];
        else
          delete __settings__[k];

      return this;
    }
  };

  // Access to all named instances:
  domino.instances = function(name) {
    if (!arguments.length)
      __die__(
        '[domino.global] You need to indicate a name to get the instance.'
      );
    else
      return _instances[name];
  }

  // Event dispatcher:
  domino.EventDispatcher = function() {
    var _handlers = {};

    /**
     * Will execute the handler everytime that the indicated event (or the
     * indicated events) will be triggered.
     * @param  {string}           events  The name of the event (or the events
     *                                    separated by spaces).
     * @param  {function(Object)} handler The handler to addEventListener.
     * @return {EventDispatcher} Returns itself.
     */
    function addEventListener(events, handler) {
      if (!arguments.length)
        return this;
      else if (
        arguments.length === 1 &&
        utils.type.get(arguments[0]) === 'object'
      )
        for (var events in arguments[0])
          this.addEventListener(events, arguments[0][events]);
      else if (arguments.length > 1) {
        var event,
            events = arguments[0],
            handler = arguments[1],
            eArray = utils.array(events),
            self = this;

        for (var i in eArray) {
          event = eArray[i];

          if (!_handlers[event])
            _handlers[event] = [];

          // Using an object instead of directly the handler will make possible
          // later to add flags
          _handlers[event].push({
            handler: handler
          });
        }
      }

      return this;
    };

    /**
     * Removes the handler from a specified event (or specified events).
     * @param  {?string}           events  The name of the event (or the events
     *                                     separated by spaces). If undefined,
     *                                     then all handlers are removed.
     * @param  {?function(Object)} handler The handler to removeEventListener.
     *                                     If undefined, each handler bound to
     *                                     the event or the events will be
     *                                     removed.
     * @return {EventDispatcher} Returns itself.
     */
    function removeEventListener(events, handler) {
      if (!arguments.length) {
        this._handlers_ = {};
        return this;
      }

      var i, j, a, event,
          eArray = utils.array(events),
          self = this;

      if (handler) {
        for (i in eArray) {
          event = eArray[i];
          if (_handlers[event]) {
            a = [];
            for (j in _handlers[event])
              if (_handlers[event][j].handler !== handler)
                a.push(_handlers[event][j]);

            _handlers[event] = a;
          }

          if (_handlers[event] && _handlers[event].length === 0)
            delete _handlers[event];
        }
      } else
        for (i in eArray)
          delete _handlers[eArray[i]];

      return self;
    };

    /**
     * Executes each handler bound to the event
     * @param  {string}  events The name of the event (or the events separated
     *                          by spaces).
     * @param  {?Object} data   The content of the event (optional).
     * @return {EventDispatcher} Returns itself.
     */
    function dispatchEvent(events, data) {
      var i, j, a, event, eventName,
          eArray = utils.array(events),
          self = this;

      data = data === undefined ? {} : data;

      for (i in eArray) {
        eventName = eArray[i];

        if (_handlers[eventName]) {
          event = self.getEvent(eventName, data);
          a = [];

          for (j in _handlers[eventName]) {
            _handlers[eventName][j].handler(event);
            if (!_handlers[eventName][j]['one'])
              a.push(_handlers[eventName][j]);
          }

          _handlers[eventName] = a;
        }
      }

      return this;
    };

    /**
     * Return an event Object.
     * @param  {string}  events The name of the event.
     * @param  {?Object} data   The content of the event (optional).
     * @return {Object} Returns itself.
     */
    function getEvent(event, data) {
      return {
        type: event,
        data: data,
        target: this
      };
    };

    this.removeEventListener = removeEventListener;
    this.addEventListener = addEventListener;
    this.dispatchEvent = dispatchEvent;
    this.getEvent = getEvent;
  };
  var dispatcher = domino.EventDispatcher;

  // Default module template:
  domino.module = function() {
    dispatcher.call(this);

    // In this object will be stored the module's triggers:
    this.triggers = {
      properties: {},
      events: {}
    };
  };
  var module = domino.module;
})(window);
