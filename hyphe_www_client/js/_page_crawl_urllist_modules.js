;(function($, ns, domino, undefined) {
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
    
    if(o['property']){
      if (o['triggers']){
        domino.utils.array(o['triggers']).forEach(function(eventName) {
          self.triggers.events[eventName] = update
        })
      }else{
        self.triggers.properties[o['property']] = update
      }
    }

    function update(domino) {
      if(o['property'] !== undefined){
        var prop = domino.get(o['property'])
        if(prop){
          var text = (o['property_wrap']) ? (o['property_wrap'](prop)) : (prop)
          el.text( text || '' )
        } // No property does not mean empty text
      }
    }

    this.html = el
  }
  ns.Span = ns.TextContent  // Alias

  /**
   * A button dispatching an event on click. Bootstrap attributes can be set.
   * A property can be listened for enabling/disabling the button. An alternate label is possible for
   * the disabled button.
   * The ghost mode allows the button to look like a link unless in case of mouse over.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element              The HTML element (jQuery)
   *   {?string}         label                The text
   *   {?string}         label_disabled       The text when the button is disabled
   *   {?string}         id                   The DOM id
   *   {?string}         bsIcon               Bootstrap glyphicon class
   *   {?string}         bsSize               Bootstrap size class
   *   {?string}         bsColor              Bootstrap color class
   *   {?string}         disabled_property    The property that will be listened for the disabled status
   *   {?string}         cssClass             Additional css class(es) (bootstrap already managed)
   *   {?boolean}        ghost                A mode that makes the button frame appear only on mouseover
   *   {?(array|string)} dispatch             The events to dispatch when clicked
   */
  ns.Button = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<button/>')

    el.addClass('btn')

    if(o['bsIcon']){
      el.append($('<i class="'+o['bsIcon']+'"/>'))
      if(!o['ghost'] && o['bsColor'] && ns.bsDarkBackgroundStyles.indexOf(o['bsColor']) >= 0)
        el.find('i').addClass('icon-white')
    }

    o['label'] && el.append($('<span/>').text( (o['bsIcon'] ? ' ' : '') + (o['label'] || '') ))

    o['bsSize'] && el.addClass(o['bsSize'])

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

    el.click(function() {
      if(!el.hasClass('disabled'))
        o['dispatch'] && self.dispatchEvent(domino.utils.array(o['dispatch']))
    })

    function update(){
      if(o['disabled_property'] !== undefined){
        if(d.get(o['disabled_property'])){
          el.addClass('disabled')
          o['label_disabled'] && el.find('span').text( (o['bsIcon'] ? ' ' : '') + o['label_disabled'] )
        } else {
          el.removeClass('disabled')
          o['label_disabled'] && el.find('span').text( (o['bsIcon'] ? ' ' : '') + (o['label'] || '') )
        }
      }
    }

    if(o['disabled_property'] !== undefined){
      self.triggers.properties[o['disabled_property']] = update
      update()
    }

    this.html = el
  }

  /**
   * TextArea dynamically updates a property with the content.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element            The DOM element (jQuery)
   *   {?string}         content_property   The name of the property that will be set to the content
   *                                        (it is dispatched on content_dispatch)
   *   {?(array|string)} content_dispatch   The property dispatched
   */
  ns.TextArea = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<textarea/>')

    if(o['content_property'] !== undefined && o['content_dispatch'] !== undefined)
      el.on('keyup', function(){
        var s = [] // settings
        s[o['content_property']] = el.val()
        self.dispatchEvent(o['content_dispatch'], s)
      })

    this.html = el
  }


  /**
   * CollapseElement listens to a property to hide or show a DOM element
   * The collapse is done with height=0 so that there is an animation
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element            The DOM element (jQuery)
   *   {?string|integer} height             The initial height
   *   {?string|integer} timing             The css timing for animation (ex: '0.5s')
   *   {?string}         property           The name of the property that collapses if true
   *                                        (it is updated on triggers)
   *   {?function}       property_wrap      A function to modify the property listened
   *   {?(array|string)} triggers           The events that trigger the property (optional)
   */
  ns.CollapseElement = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<div/>')
        ,t = o['timing'] || '0.8s'

    el.css('transition', 'height '+t)
    el.css('-moz-transition', 'height '+t)
    el.css('-webkit-transition', 'height '+t)
    el.css('-o-transition', 'height '+t)

    if(o['height']){
      el.css('height', o['height'])
    } else {
      el.css('height', el.height())
      o['height'] = el.height()
    }

    if(o['property']){
      if (o['triggers']){
        domino.utils.array(o['triggers']).forEach(function(eventName) {
          self.triggers.events[eventName] = update
        })
      }else{
        self.triggers.properties[o['property']] = update
      }
    }

    function update(domino) {
      if(o['property'] !== undefined){
        var prop = domino.get(o['property'])
        if(prop !== undefined){
          var hide = (o['property_wrap']) ? (o['property_wrap'](prop)) : (prop)
          if(hide){
            el.css('overflow', 'hidden')
            el.css('height', 0)
          } else {
            el.css('overflow', '')
            el.css('height', o['height'])
          }
        }
      }
    }

    update(d)

    this.html = el
  }


})(jQuery, (window.dmod = window.dmod || {}), domino);