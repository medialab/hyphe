(function(ns, domino) {
  'use strict';

  // Requires a namespace to be initialized:
  if (!ns)
    throw (new Error('The namespace is not valid.'));

  // Requires domino.js to be initialized:
  if (!domino)
    throw (new Error('domino.js is required to initialize the modules.'));

  /**
   * The most basic module: a text displaying the value of a property
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element  The HTML element
   *   {?string}         cssClass The CSS class of the HTML element
   *   {?string}         cssId    The HTML id of the HTML element
   *   {?string}         label    The label of the module (default: the label
   *                              of the property)
   *   {?(array|string)} dispatch The events to dispatch when clicked
   *   {string}          property The name of the flag to represent
   *   {?(array|string)} triggers The events to listen from domino
   */
  ns.Text = function(options, d) {
    domino.module.call(this);

    var self = this,
        o = options || {};

    if (!o['property'])
      throw (new Error('[Text] Property missing'));

    var label = o['label'] || d.getLabel(o['property']),
        html = o['element'] || $(
          '<fieldset></fieldset>'
        );

    o['cssClass'] && html.addClass(o['cssClass']);
    o['cssId'] && html.attr('id', o['cssId']);

    function update(domino) {
      html.html(
        '<span class="property">' +
          label +
        '</span>: ' +
        '<span class="value">' +
          domino.get(o['property']) +
        '</span>'
      );
    }

    if (o['triggers'])
      domino.utils.array(o['triggers']).forEach(function(eventName) {
        self.triggers.events[eventName] = update;
      });
    else
      self.triggers.properties[o['property']] = update;

    this.html = html;
  };

  /**
   * The second most basic module: a button that will just dispatch an event
   * when it is clicked.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element     The HTML element
   *   {?string}         htmlContent The content of the HTML element
   *   {?string}         cssClass    The CSS class of the HTML element
   *   {?string}         cssId       The HTML id of the HTML element
   *   {?(array|string)} dispatch    The events to dispatch when clicked
   */
  ns.Button = function(options, d) {
    domino.module.call(this);

    var self = this,
        o = options || {},
        html = o['element'] || $('<' + (o['htmlTag'] || 'button') + '>' +
                   (o['htmlContent'] || '') +
                 '</' + (o['htmlTag'] || 'button') + '>');

    o['cssClass'] && html.addClass(o['cssClass']);
    o['cssId'] && html.attr('id', o['cssId']);

    html.click(function() {
      o['dispatch'] && self.dispatchEvent(domino.utils.array(o['dispatch']));
    });

    this.html = html;
  };

  /**
   * A checkbox which will represent a Boolean property, and update this
   * property when activated.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element  The HTML element
   *   {?string}         label    The label of the module (default: the label
   *                              of the property)
   *   {?string}         cssId    The HTML id of the HTML element
   *   {?(array|string)} dispatch The events to dispatch when clicked
   *   {string}          property The name of the flag to represent
   *   {?(array|string)} triggers The events to listen from domino
   */
  ns.Checkbox = function(options, d) {
    domino.module.call(this);

    var self = this,
        o = options || {};

    if (!o['property'])
      throw (new Error('[Checkbox] Property missing'));

    var dispatch =
          o['dispatch'] ||
            (d.getEvents(o['property']).length === 1 ?
              d.getEvents(o['property'])[0] :
              null),
        html = o['element'] || $('<fieldset>' +
                   '<input type="checkbox" id="' +
                     (o['cssId'] || o['property']) +
                   '" />' +
                   '<label for="' + (o['cssId'] || o['property']) + '">' +
                     (o['label'] || d.getLabel(o['property'])) +
                   '</label>' +
                 '</fieldset>');

    o['cssId'] && html.attr('id', o['cssId']);

    html.find('input').change(function() {
      var data = {};
      data[o['property']] = $(this).is(':checked');

      // Dispatch the event
      dispatch && self.dispatchEvent(dispatch, data);
    });

    function update(domino) {
      html.find('input').attr(
        'checked',
        !!domino.get(o['property']) ?
          'checked' :
          null
      );
    }

    if (o['triggers'])
      domino.utils.array(o['triggers']).forEach(function(eventName) {
        self.triggers.events[eventName] = update;
      });
    else
      self.triggers.properties[o['property']] = update;

    this.html = html;
  };

  /**
   * A button which will represent a Boolean property. When clicked, it will
   * toggle the property, and when the property is updated, the button will be
   * toggled as well.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element     The HTML element
   *   {?string}         htmlTag     The tag of the HTML element (default:
   *                                 'button')
   *   {?string}         htmlOn      The content of the HTML element (state:
   *                                 on)
   *   {?string}         htmlOff     The content of the HTML element (state:
   *                                 off)
   *   {?string}         cssClassOn  The CSS class of the HTML element (state:
   *                                 on)
   *   {?string}         cssClassOff The CSS class of the HTML element (state:
   *                                 off)
   *   {?string}         cssId       The HTML id of the HTML element
   *   {?(array|string)} dispatch    The events to dispatch when clicked
   *   {string}          property    The name of the flag to represent
   *   {?(array|string)} events      The events to listen from domino
   */
  ns.SwitchButton = function(options, d) {
    domino.module.call(this);

    var self = this,
        o = options || {};

    if (!o['property'])
      throw (new Error('[SwitchButton] Property missing'));

    var dispatch =
          o['dispatch'] ||
            (d.getEvents(o['property']).length === 1 ?
              d.getEvents(o['property'])[0] :
              null),
        isOn,
        html = o['element'] || $('<' + (o['htmlTag'] || 'button') + '>' +
                 '</' + (o['htmlTag'] || 'button') + '>');

    o['cssId'] && html.attr('id', o['cssId']);

    html.click(function() {
      if (!o['property'])
        return;

      var data = {};
      data[o['property']] = !isOn;

      // Dispatch the event
      dispatch && self.dispatchEvent(dispatch, data);
    });

    function update(domino) {
      // Check the current state of the flag:
      isOn = !!domino.get(o['property']);
      if (isOn) {
        o['cssClassOn'] && html.attr('class', o['cssClassOn']);
        o['htmlOn'] && html.html(o['htmlOn']);
      }else {
        o['cssClassOff'] && html.attr('class', o['cssClassOff']);
        o['htmlOff'] && html.html(o['htmlOff']);
      }
    }

    if (o['events'])
      domino.utils.array(o['events']).forEach(function(eventName) {
        self.triggers.events[eventName] = update;
      });
    else
      self.triggers.properties[o['property']] = update;

    this.html = html;
  };

  /**
   * An text-input which will represent a string property, and update this
   * property when validated.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element     The HTML element
   *   {?string}         label       The label of the module (default: the
   *                                 label of the property)
   *   {?string}         cssId       The HTML id of the HTML element
   *   {?string}         buttonLabel The HTML id of the HTML element
   *   {?boolean}        validate    Indicates wether or not the property must
   *                                 be updated on "Validate" being clicked or
   *                                 at any change (default: true)
   *   {?(array|string)} dispatch    The events to dispatch when clicked
   *   {string}          property    The name of the flag to represent
   *   {?(array|string)} triggers    The events to listen from domino
   */
  ns.TextInput = function(options, d) {
    domino.module.call(this);

    var self = this,
        o = options || {};

    if (!o['property'])
      throw (new Error('[TextInput] Property missing'));

    var dispatch =
          o['dispatch'] ||
            (d.getEvents(o['property']).length === 1 ?
              d.getEvents(o['property'])[0] :
              null),
        html = o['element'] || $('<fieldset>' +
                 '<label for="' + (o['cssId'] || o['property']) + '">' +
                   (o['label'] || d.getLabel(o['property'])) +
                 '</label>' +
                 '<input type="text" id="' +
                   (o['cssId'] || o['property']) +
                 '" />' +
                 '<button>' +
                   (o['buttonLabel'] || 'Validate') +
                 '</button>' +
               '</fieldset>');

    o['cssId'] && html.attr('id', o['cssId']);

    function dispatchUpdate() {
      var data = {};
      data[o['property']] = html.find('input').val();

      // Dispatch the event
      dispatch && self.dispatchEvent(dispatch, data);
    };

    html.find('button').click(dispatchUpdate);
    html.find('input').keyup(function(e) {
      if (e.keyCode === 13)
        dispatchUpdate.call(this, e);
    });

    function update(domino) {
      html.find('input').val(domino.get(o['property']));
    }

    if (o['triggers'])
      domino.utils.array(o['triggers']).forEach(function(eventName) {
        self.triggers.events[eventName] = update;
      });
    else
      self.triggers.properties[o['property']] = update;

    this.html = html;
  };

  /**
   * An text-input which will represent an Array property, and update this
   * property when validated.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element     The HTML element
   *   {?string}         label       The label of the module (default: the
   *                                 label of the property)
   *   {?boolean}        validate    Indicates wether or not the property must
   *                                 be updated on "Validate" being clicked or
   *                                 at any change (default: true)
   *   {?string}         cssId       The HTML id of the HTML element
   *   {?string}         sep         The separator for the splits/joins
   *   {?string}         buttonLabel The HTML id of the HTML element
   *   {?(array|string)} dispatch    The events to dispatch when clicked
   *   {string}          property    The name of the flag to represent
   *   {?(array|string)} triggers    The events to listen from domino
   */
  ns.ArrayInput = function(options, d) {
    domino.module.call(this);

    var self = this,
        o = options || {};

    if (!o['property'])
      throw (new Error('[ArrayInput] Property missing'));

    var dispatch =
          o['dispatch'] ||
            (d.getEvents(o['property']).length === 1 ?
              d.getEvents(o['property'])[0] :
              null),
        values = [],
        html = o['element'] || $('<fieldset>' +
                   '<label for="' + (o['cssId'] || o['property']) + '">' +
                     (o['label'] || d.getLabel(o['property'])) +
                   '</label>' +
                   '<input type="text" id="' +
                     (o['cssId'] || o['property']) +
                   '" />' +
                   '<button>' +
                     (o['buttonLabel'] || 'Validate') +
                   '</button>' +
                 '</fieldset>');

    o['cssId'] && html.attr('id', o['cssId']);

    function dispatchUpdate() {
      var data = {};
      data[o['property']] =
        html.find('input').val().split(',' || o['sep']).map(function(s) {
          return s.replace(/^ */g, '').replace(/ *$/g, '');
        }).filter(function(s) {
          return !!s;
        });

      // Dispatch the event
      dispatch && self.dispatchEvent(dispatch, data);
    }

    html.find('button').click(dispatchUpdate);
    html.find('input').keyup(function(e) {
      if (e.keyCode === 13)
        dispatchUpdate.call(this, e);
    });

    function update(domino) {
      var newValues = domino.get(o['property'])

      if (
        values.length !== newValues.length ||
        values.some(function(v, i) {
          return v !== newValues[i];
        })
      ) {
        values = newValues;
        html.find('input').val(
          domino.get(o['property']).join(', ' || o['sep'])
        );
      }
    }

    if (o['triggers'])
      domino.utils.array(o['triggers']).forEach(function(eventName) {
        self.triggers.events[eventName] = update;
      });
    else
      self.triggers.properties[o['property']] = update;

    this.html = html;
  };

  /**
   * An number-input which will represent a number property, and update this
   * property when validated.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element     The HTML element
   *   {?string}         label       The label of the module (default: the
   *                                 label of the property)
   *   {?string}         cssId       The HTML id of the HTML element
   *   {?string}         buttonLabel The HTML id of the HTML element
   *   {?(array|string)} dispatch    The events to dispatch when clicked
   *   {string}          property    The name of the flag to represent
   *   {?(array|string)} triggers    The events to listen from domino
   */
  ns.NumberInput = function(options, d) {
    domino.module.call(this);

    var self = this,
        o = options || {};

    if (!o['property'])
      throw (new Error('[NumberInput] Property missing'));

    var dispatch =
          o['dispatch'] ||
            (d.getEvents(o['property']).length === 1 ?
              d.getEvents(o['property'])[0] :
              null),
        html = o['element'] || $('<fieldset>' +
                   '<label for="' + (o['cssId'] || o['property']) + '">' +
                     (o['label'] || d.getLabel(o['property'])) +
                   '</label>' +
                   '<input type="number" id="' +
                     (o['cssId'] || o['property']) +
                   '" />' +
                   '<button>' +
                     (o['buttonLabel'] || 'Validate') +
                   '</button>' +
                 '</fieldset>');

    o['cssId'] && html.attr('id', o['cssId']);

    function dispatchUpdate() {
      var data = {};
      data[o['property']] = +html.find('input').val();

      // Dispatch the event
      dispatch && self.dispatchEvent(dispatch, data);
    }

    html.find('button').click(dispatchUpdate);
    html.find('input').keyup(function(e) {
      if (e.keyCode === 13)
        dispatchUpdate.call(this, e);
    });

    function update(domino) {
      html.find('input').val(+domino.get(o['property']));
    }

    if (o['triggers'])
      domino.utils.array(o['triggers']).forEach(function(eventName) {
        self.triggers.events[eventName] = update;
      });
    else
      self.triggers.properties[o['property']] = update;

    this.html = html;
  };

  /**
   * A button which will represent a multiple choice property. When clicked, it
   * will update the property, and when the property is updated, the module
   * will be updated as well.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element  The HTML element
   *   {(array|string)}  values   The array of the values, or the name of the
   *                              property that contains the values
   *   {?string}         cssClass The CSS class of the HTML element
   *   {?string}         htmlTag  The tag of the HTML element
   *   {?string}         cssId    The HTML id of the HTML element
   *   {?(array|string)} dispatch The events to dispatch when clicked
   *   {string}          property The name of the string property to represent
   *   {?(array|string)} triggers The events to listen from domino
   */
  ns.Select = function(options, d) {
    domino.module.call(this);

    var self = this,
        o = options || {};

    if (!o['property'])
      throw (new Error('[Select] Property missing'));

    var dispatch =
          o['dispatch'] ||
            (d.getEvents(o['property']).length === 1 ?
              d.getEvents(o['property'])[0] :
              null),
        selected,
        values = [],
        html = o['element'] || $('<select></select>');

    o['cssClass'] && html.addClass(o['cssClass']);
    o['cssId'] && html.attr('id', o['cssId']);

    if (o['values'] && domino.struct.get(o['values']) === 'array') {
      values = o['values'];
      html.append(values.map(function(v) {
        return typeof v === 'string' ?
          '<option value="' + v + '">' + v + '</option>' :
          '<option value="' + v.id + '">' + (v.label || v.id) + '</option>';
      }));
    }

    html.change(function() {
      var data = {};
      data[o['property']] = $(this).val();

      // Dispatch the event
      dispatch && self.dispatchEvent(dispatch, data);
    });

    function updateSelection(domino) {
      selected = domino.get(o['property']);
      html.val(selected);
    }

    function updateList(domino) {
      if (typeof o['values'] !== 'string')
        return;

      var newValues = domino.get(o['values'])

      if (
        values.length !== newValues.length ||
        values.some(function(v, i) {
          return v !== newValues[i];
        })
      ) {
        values = newValues;
        html.empty().append(values.map(function(v) {
          return typeof v === 'string' ?
            '<option value="' + v + '">' + v + '</option>' :
            '<option value="' + v.id + '">' + (v.label || v.id) + '</option>';
        })).val(selected);
      }
    }

    if (o['triggers'])
      domino.utils.array(o['triggers']).forEach(function(eventName) {
        self.triggers.events[eventName] = update;
      });
    else
      self.triggers.properties[o['property']] = updateSelection;

    if (typeof o['values'] === 'string')
      self.triggers.properties[o['values']] = updateList;

    this.html = html;
  };
})((domino.modules = domino.modules || {}), domino);
