;(function($, ns, domino, undefined) {
  // Generic parameters
  ns.darkBackgroundStyles = [
    'btn-primary'
    ,'btn-info'
    ,'btn-success'
    ,'btn-warning'
    ,'btn-danger'
    ,'btn-inverse'
  ]

  /**
   * A button dispatching an event.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element            The HTML element (jQuery)
   *   {?string}         label              The text
   *   {?string}         label_disabled     The text when the button is disabled
   *   {?string}         id                 The DOM id
   *   {?string}         bsIcon             Bootstrap glyphicon class
   *   {?string}         bsSize             Bootstrap size class
   *   {?string}         bsColor            Bootstrap color class
   *   {?boolean}        disabled           Disabled at initialization
   *   {?string}         cssClass           Additional css class(es) (bootstrap already managed)
   *   {?boolean}        ghost              A mode that makes the button frame appear only on mouseover
   *   {?(array|string)} triggers_enable    The events that enable the button
   *   {?(array|string)} triggers_disable   The events that disable the button
   *   {?(array|string)} dispatch           The events to dispatch when clicked
   */
  ns.Button = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<button class="btn"/>')

    if(o['bsIcon']){
      el.append($('<i class="'+o['bsIcon']+'"/>'))
      if(!o['ghost'] && o['bsColor'] && ns.darkBackgroundStyles.indexOf(o['bsColor']) >= 0)
        el.find('i').addClass('icon-white')
    }

    o['label'] && el.append($('<span/>').text( (o['bsIcon'] ? ' ' : '') + (o['label'] || '') ))

    o['bsSize'] && el.addClass(o['bsSize'])

    if(o['disabled']){
      el.addClass('disabled')
      o['label_disabled'] && el.find('span').text( (o['bsIcon'] ? ' ' : '') + o['label_disabled'] )
    } 

    o['cssClass'] && el.addClass(o['cssClass'])
    o['id'] && el.attr('id', o['id'])

    if(o['ghost']){
      el.addClass('btn-link')
        .mouseenter(function(){
          el.removeClass('btn-link')
          o['bsColor'] && el.addClass(o['bsColor'])
          if(o['bsColor'] && ns.darkBackgroundStyles.indexOf(o['bsColor']) >= 0)
            el.find('i').addClass('icon-white')
        }).mouseleave(function(){
          el.addClass('btn-link')
          o['bsColor'] && el.removeClass(o['bsColor'])
          if(o['bsColor'] && ns.darkBackgroundStyles.indexOf(o['bsColor']) >= 0)
            el.find('i').removeClass('icon-white')
        })
    } else {
      o['bsColor'] && el.addClass(o['bsColor'])
    }

    if(o['triggers_enable'])
      self.triggers.events[o['triggers_enable']] = function(){
        el.removeClass('disabled')
        o['label_disabled'] && el.find('span').text( (o['bsIcon'] ? ' ' : '') + (o['label'] || '') )
      }
    if(o['triggers_disable'])
      self.triggers.events[o['triggers_disable']] = function(){
        el.addClass('disabled')
        o['label_disabled'] && el.find('span').text( (o['bsIcon'] ? ' ' : '') + o['label_disabled'] )
      }

    el.click(function() {
      if(!el.hasClass('disabled'))
        o['dispatch'] && self.dispatchEvent(domino.utils.array(o['dispatch']))
    })

    this.html = el
  }

  /**
   * A button with two states: active and inactive
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element            The HTML element (jQuery)
   *   {?string}         label              The text
   *   {?string}         id                 The DOM id
   *   {?string}         bsIcon             Bootstrap glyphicon class
   *   {?string}         bsSize             Bootstrap size class
   *   {?string}         bsColor            Bootstrap color class
   *   {?string}         cssClass           Additional css class(es) (bootstrap already managed)
   *   {?boolean}        ghost              A mode that makes the button frame appear only on mouseover
   *   {?boolean}        inactive           Disabled at initialization
   *   {?(array|string)} triggers_active    The events that enable the button
   *   {?(array|string)} triggers_inactive  The events that disable the button
   *   {?boolean}        disabled           Disabled at initialization
   *   {?(array|string)} triggers_enable    The events that enable the button
   *   {?(array|string)} triggers_disable   The events that disable the button
   *   {?(array|string)} dispatch           The events to dispatch when clicked
   */
  ns.Button2 = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<button class="btn"/>')

    if(o['bsIcon']){
      el.append($('<i class="'+o['bsIcon']+'"/>'))
      if(!o['ghost'] && o['bsColor'] && ns.darkBackgroundStyles.indexOf(o['bsColor']) >= 0)
        el.find('i').addClass('icon-white')
    }

    o['label'] && el.append($('<span/>').text( (o['bsIcon'] ? ' ' : '') + o['label']))

    o['bsSize'] && el.addClass(o['bsSize'])

    o['disabled'] && el.addClass('disabled')

    o['cssClass'] && el.addClass(o['cssClass'])
    o['id'] && el.attr('id', o['id'])

    if(o['ghost']){
      el.addClass('btn-link')
        .mouseenter(function(){
          el.removeClass('btn-link')
          o['bsColor'] && el.addClass(o['bsColor'])
          if(o['bsColor'] && ns.darkBackgroundStyles.indexOf(o['bsColor']) >= 0)
            el.find('i').addClass('icon-white')
        }).mouseleave(function(){
          el.addClass('btn-link')
          o['bsColor'] && el.removeClass(o['bsColor'])
          if(o['bsColor'] && ns.darkBackgroundStyles.indexOf(o['bsColor']) >= 0)
            el.find('i').removeClass('icon-white')
        })
    } else {
      o['bsColor'] && el.addClass(o['bsColor'])
    }

    if(o['triggers_enable'])
      self.triggers.events[o['triggers_enable']] = function(){
        el.removeClass('disabled')
      }
    if(o['triggers_disable'])
      self.triggers.events[o['triggers_disable']] = function(){
        el.addClass('disabled')
      }

    el.click(function() {
      if(!el.hasClass('disabled'))
        o['dispatch'] && self.dispatchEvent(domino.utils.array(o['dispatch']))
    })

    this.html = el
  }



})(jQuery, (window.dmod = window.dmod || {}), domino);