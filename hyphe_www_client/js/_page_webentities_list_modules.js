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

})(jQuery, (window.dmod = window.dmod || {}), domino);