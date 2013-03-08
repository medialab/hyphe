;(function($, ns, domino, undefined) {
  // Generic parameters
  ns.bsDarkBackgroundStyles = [
    'btn-primary'
    ,'btn-info'
    ,'btn-success'
    ,'btn-warning'
    ,'btn-danger'
    ,'btn-inverse'
  ]

  /**
   * TextContent (alias Span ) dynamically shows a property (text). You can wrap it in a function.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element            The DOM element (jQuery)
   *   {?string}         text               The text
   *   {?string}         property           The name of the property containing the text
   *                                        (it is updated on triggers)
   *   {?function}       property_wrap      A function to modify the property listened
   *   {?string}         id                 The DOM id
   *   {?(array|string)} triggers           The events that disable the button
   */
  ns.TextContent = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<span/>')

    if(o['text'])
      el.text( o['text'] )
    else
      update(d)

    o['id'] && el.attr('id', o['id'])
    
    if(o['property'] && o['triggers'])
      self.triggers.events[o['triggers']] = update

    function update(domino) {
      var prop = domino.get(o['property'])
        ,text = (prop) ? ( (o['property_wrap']) ? (o['property_wrap'](prop)) : (prop) ) : ('')
      el.text( text || '' )
    }

    this.html = el
  }
  ns.Span = ns.TextContent  // Alias

  /**
   * HtmlContent (alias Div ) dynamically shows a property (html allowed). You can wrap it in a function.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element            The DOM element (jQuery)
   *   {?string}         content            The content (HTML allowed)
   *   {?string}         property           The name of the property containing the text
   *                                        (it is updated on triggers)
   *   {?function}       property_wrap      A function to modify the property listened
   *   {?string}         id                 The DOM id
   *   {?(array|string)} triggers           The events that disable the button
   */
  ns.HtmlContent = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<div/>')

    if(o['content'])
      el.html( o['content'] )
    else
      update(d)

    o['id'] && el.attr('id', o['id'])
    
    if(o['property'] && o['triggers'])
      self.triggers.events[o['triggers']] = update

    function update(domino) {
      var prop = domino.get(o['property'])
        ,content = (prop) ? ( (o['property_wrap']) ? (o['property_wrap'](prop)) : (prop) ) : ('')
      el.html( content || '' )
    }

    this.html = el
  }
  ns.Div = ns.HtmlContent

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
      if(!o['ghost'] && o['bsColor'] && ns.bsDarkBackgroundStyles.indexOf(o['bsColor']) >= 0)
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
          if(o['bsColor'] && ns.bsDarkBackgroundStyles.indexOf(o['bsColor']) >= 0)
            el.find('i').addClass('icon-white')
        }).mouseleave(function(){
          el.addClass('btn-link')
          o['bsColor'] && el.removeClass(o['bsColor'])
          if(o['bsColor'] && ns.bsDarkBackgroundStyles.indexOf(o['bsColor']) >= 0)
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
   * A button with two states: stateA and stateB
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element                The HTML element (jQuery)
   *   {?string}         id                     The DOM id
   *   {?string}         bsSize                 Bootstrap size class
   *   {?string}         cssClass               Additional css class(es) (bootstrap already managed)
   *   {?boolean}        ghost                  A mode that makes the button frame appear only on mouseover
   *   {?boolean}        stateB_init            State B at initialization
   *   {?string}         label_A                The text on state A
   *   {?string}         label_B                The text on state B
   *   {?string}         bsIcon_A               Bootstrap glyphicon class on state A
   *   {?string}         bsIcon_B               Bootstrap glyphicon class on state B
   *   {?string}         bsColor_A              Bootstrap color class on state A
   *   {?string}         bsColor_B              Bootstrap color class on state B
   *   {?(array|string)} triggers_stateA        The events that sets state A
   *   {?(array|string)} triggers_stateB        The events that sets state B
   *   {?(array|string)} triggers_stateToggle   The events that toggle the state
   *   {?boolean}        disabled               Disabled at initialization
   *   {?(array|string)} triggers_enable        The events that enable the button
   *   {?(array|string)} triggers_disable       The events that disable the button
   *   {?(array|string)} dispatch               The events to dispatch when clicked
   *   {?(array|string)} dispatch_A             The events to dispatch when clicked on state A
   *   {?(array|string)} dispatch_B             The events to dispatch when clicked on state B
   */
  ns.Button_twoStates = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<button class="btn" state="A"><i/><span/></button>')
        ,setState = function(s){
          var alt_s = (s == 'A') ? 'B' : 'A'

          el.attr('state', s)
          if(o['bsIcon_'+s]){
            o['bsIcon_'+alt_s] && el.find('i').removeClass(o['bsIcon_'+alt_s])
            el.find('i').addClass(o['bsIcon_'+s])
            if(!o['ghost'] && o['bsColor_'+s] && ns.bsDarkBackgroundStyles.indexOf(o['bsColor_'+s]) >= 0)
              el.find('i').addClass('icon-white')
          }

          el.find('span').text(((o['bsIcon_'+s])?(' '):('')) + o['label_'+s] || '')
        }

    if(o['stateB_init'])
      setState('B')
    else
      setState('A')

    o['bsSize'] && el.addClass(o['bsSize'])

    o['disabled'] && el.addClass('disabled')

    o['cssClass'] && el.addClass(o['cssClass'])
    o['id'] && el.attr('id', o['id'])

    if(o['ghost']){
      var s = el.attr('state')
      el.addClass('btn-link')
        .mouseenter(function(){
          el.removeClass('btn-link')
          o['bsColor_'+s] && el.addClass(o['bsColor_'+s])
          if(o['bsColor_'+s] && ns.bsDarkBackgroundStyles.indexOf(o['bsColor_'+s]) >= 0)
            el.find('i').addClass('icon-white')
        }).mouseleave(function(){
          el.addClass('btn-link')
          o['bsColor_'+s] && el.removeClass(o['bsColor_'+s])
          if(o['bsColor_'+s] && ns.bsDarkBackgroundStyles.indexOf(o['bsColor_'+s]) >= 0)
            el.find('i').removeClass('icon-white')
        })
    } else {
      o['bsColor_'+s] && el.addClass(o['bsColor_'+s])
    }

    if(o['triggers_enable'])
      self.triggers.events[o['triggers_enable']] = function(){
        el.removeClass('disabled')
      }
    if(o['triggers_disable'])
      self.triggers.events[o['triggers_disable']] = function(){
        el.addClass('disabled')
      }

    if(o['triggers_stateA'])
      self.triggers.events[o['triggers_stateA']] = function(){
        setState('A')
      }

    if(o['triggers_stateB'])
      self.triggers.events[o['triggers_stateB']] = function(){
        setState('B')
      }
    
    if(o['triggers_stateToggle'])
      self.triggers.events[o['triggers_stateToggle']] = function(){
        setState((el.attr('state') == 'A') ? 'B' : 'A')
      }

    el.click(function() {
      if(!el.hasClass('disabled'))
        o['dispatch'] && self.dispatchEvent(domino.utils.array(o['dispatch']))
        o['dispatch_'+el.attr('state')] && self.dispatchEvent(domino.utils.array(o['dispatch_'+el.attr('state')]))
    })

    this.html = el
  }



})(jQuery, (window.dmod = window.dmod || {}), domino);