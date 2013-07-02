;(function($, ns, domino, undefined) {
  // Generic parameters
  ns.bsDarkBackgroundStyles = [   // The bootstrap styles that have a dark background
    'btn-primary'
    ,'btn-info'
    ,'btn-success'
    ,'btn-warning'
    ,'btn-danger'
    ,'btn-inverse'
  ]

  /**
   * A button dispatching an event on click. Bootstrap attributes can be set.
   * A property can be listened for enabling/disabling the button. An alternate label is possible for
   * the disabled button.
   * The ghost mode allows the button to look like a link unless in case of mouse over.
   * 
   * Last edit : 2013 07 02
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
   *   {?string}         disabled_property  The property that will be listened for the disabled status
   *   {?string}         cssClass           Additional css class(es) (bootstrap already managed)
   *   {?boolean}        ghost              A mode that makes the button frame appear only on mouseover
   *   {?(array|string)} dispatch           The events to dispatch when clicked
   */
  ns.Button = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<button class="btn"/>')

    if(o['bsIcon'] || o['label']){

      el.html('')
      
      if(o['bsIcon']){
        el.append($('<i class="'+o['bsIcon']+'"/>'))
        if(!o['ghost'] && o['bsColor'] && ns.bsDarkBackgroundStyles.indexOf(o['bsColor']) >= 0)
          el.find('i').addClass('icon-white')
      }

      if(o['label']){
        el.append($('<span/>').text( (o['bsIcon'] ? ' ' : '') + (o['label'] || '') ))
      }
    }

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
   * HideElement listens to a property to hide or show a DOM element
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element            The DOM element (jQuery)
   *   {?string}         property           The name of the property containing the text
   *                                        (it is updated on triggers)
   *   {?function}       property_wrap      A function to modify the property listened
   *   {?(array|string)} triggers           The events that trigger the property (optional)
   */
  ns.HideElement = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element']

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
            el.hide()
          } else {
            el.show()
          }
        }
      }
    }

    update(d)

    this.html = el
  }
  
  /**
   * TextAlert listens to a property to set its content. The property must contain an object
   * whose parameters can be these:
   *      - text: the text content, parsed as text (string)
   *      - html: the html content or a jQuery element (overrides text)
   *      - display: if false, the alert is hidden
   *      - bsClass: the class(es) of bootstrap (ie: 'alert-info')
   *
   * @param   {?Object} options     An object containing the specifications of the
   *                                module.
   * @param   {?Object} d           The instance of domino.
   *
   * Here is the list of options that are interpreted:
   * 
   *   {?string}         element            The DOM element (jQuery)
   *   {?string}         property           The name of the property containing the object
   *                                        (it is updated on triggers)
   *   {?function}       property_wrap      A function to modify the property listened
   *   {?(array|string)} triggers           Events to listen to (optional)
   */
  ns.TextAlert = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<div/>')

    el.addClass('alert')

    if(o['property']){
      if(o['triggers']){
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
          // Text Alert Options
          var tao = (o['property_wrap']) ? (o['property_wrap'](prop)) : (prop)
          if(tao.text !== undefined)
            el.text(tao.text)
          if(tao.html !== undefined)
            el.html(tao.html)
          if(tao.bsClass !== undefined){
            el.removeClass('alert-error')
              .removeClass('alert-success')
              .removeClass('alert-info')
            el.addClass(tao.bsClass)
          }
          if(tao.display !== undefined){
            if(tao.display)
              el.show()
            else
              el.hide()
          }
        }
      }
    }

    update(d)

    this.html = el
  }

  /**
   * Selector_bigList is a select2 selector adapted to big lists.
   * The list may be a list of objects, since you can set the item_wrap function to retrive id and text from
   * these objects.
   * The list must be stored in a property, but note that it is not listened.
   *
   * @param   {?Object} options An object containing the specifications of the
   *                            module.
   * @param   {?Object} d       The instance of domino.
   *
   * Here is the list of options that are interpreted:
   *
   *   {?string}         element                    The DOM element (jQuery)
   *   {string}          data_property              The data. Not listened.
   *   {?string}         disabled_property          The disabled state. Listened.
   *   {?string}         selected_property          The selected element. item_wrap will be applied. Listened.
   *   {?function}       item_wrap                  A function returning {id:, text:} from a given item
   *                                                from the list passed through data_property
   *   {?string}         placeholder                Text to display when nothing selected
   *   {?string}         id                         The DOM id
   *   {?(array|string)} triggers                   The events that disable the button
   */
  ns.Selector_bigList = function(options, d) {
    domino.module.call(this)

    var self = this
        ,o = options || {}
        ,el = o['element'] || $('<a/>')
        ,itemWrap = o['item_wrap'] || function(item){return {id:item, text:item}}
        ,s2o = {}

    o['id'] && el.attr('id', o['id'])
    
    if(o['placeholder'])
      s2o.placeholder = o['placeholder']

    s2o.query = function(query){
      if(o['data_property'] === undefined){
        query.callback([])
      } else {
        var data = {results: []}
          ,regexp = new RegExp(query.term,'gi')
        d.get(o['data_property']).forEach(function(item){
            var wrap = itemWrap(item)
            if(wrap.text.match(regexp))
              data.results.push(wrap)
        })
        query.callback(data)
      }
    }

    s2o.initSelection = function (element, callback) {
      if(o['data_property'] === undefined){
        callback()
      } else {
        var ids = element.val()
          ,data = d.get(o['data_property']).map(function(item){
            return itemWrap(item)
          }).filter(function(wrap){
            return ids.indexOf(wrap.id) >= 0
          })
        if(data.length>0)
          callback(data[0])
        else
          callback()
      }
    }

    el.select2(s2o)
    
    function update(){
      if(o['disabled_property'] !== undefined){
        if(d.get(o['disabled_property'])){
          el.select2('disable')
        } else {
          el.select2('enable')
        }
      }
      if(o['selected_property'] !== undefined){
        var item = d.get(o['selected_property'])
        if(item !== undefined){
          var wrap = itemWrap(item)
            ,current_id = el.val()
          if(wrap.id != current_id){
            el.select2('val', wrap.id)
          }
        }
      }
    }

    if (o['triggers']){
      domino.utils.array(o['triggers']).forEach(function(eventName) {
        self.triggers.events[eventName] = update
      });
    }else{
      self.triggers.properties[o['disabled_property']] = update
      self.triggers.properties[o['selected_property']] = update
    }

    if(o['disabled_property'] !== undefined || o['selected_property'] !== undefined){
      update()
    }

    el.on('change', function(e) {
      o['dispatch'] && self.dispatchEvent(domino.utils.array(o['dispatch']))
    })

    this.html = el
  }

})(jQuery, (window.dmod = window.dmod || {}), domino);