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
	* Sigma module for displaying a network
	*
	* @param   {?Object} options 	An object containing the specifications of the module
	* @param   {?Object} d       	The instance of domino.
	*
	* Here is the list of options that are interpreted:
	*
	*   {?string}         element            		The HTML element (jQuery)
	*   {string}          networkProperty   		The name of the property - ex: "network"
	*   {string}          networkUpdatedEvent 	   	The name of the event - ex: "network_updated"
	*   {?string}         pendingStateProperty   	Pending state (boolean)
	*   {?string}         pendingStateUpdatedEvent 	Event updating the Pending state
	*   {?string}         pendingMessage 			Message shown during the pending state
	*/

	ns.Sigma = function(options, d) {
        domino.module.call(this)

        var _self = this
            ,o = options || {}
        	,sigmaInstance
        	,networkProperty = o['networkProperty']
        	,networkUpdatedEvent = o['networkUpdatedEvent']
        	,container = o['element'] || $('<div/>')
        	,pending = o['pendingStateProperty'] || false
        	,pendingStateUpdatedEvent = o['pendingStateUpdatedEvent']
        	,pendingMessage = o['pendingMessage'] || 'Loading...'

        container.html('<div class="sigma-parent"><div class="sigma-expand"></div><div class="sigma-overlay sigma-messages"></div><div class="sigma-overlay sigma-pending"></div></div>')
        
        var showPending = function(){
        	container.find('.sigma-pending').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;">'+pendingMessage+'</div></div>')
        }

        var hidePending = function(){
        	container.find('.sigma-pending').html('')
        }

        var rescale = function(){
        	if(sigmaInstance !== undefined)
                sigmaInstance.position(0,0,1).draw()
        }

        this.triggers.events[networkUpdatedEvent] = function(provider, e){
            var json = provider.get(networkProperty)

            // Kill old sigma if needed
            sigmaInstance && sigmaInstance.emptyGraph() // .kill() is not currently implemented

            // Clear HTML
            container.find('.sigma-expand').html('')

            // Instanciate sigma.js and customize it
            sigmaInstance = sigma.init(container.find('.sigma-expand')[0]).drawingProperties({
	                defaultLabelColor: '#666'
	                ,edgeColor: 'default'
	                ,defaultEdgeType: 'curve'
	                ,defaultEdgeColor: '#ccc'
	                ,defaultNodeColor: '#999'
	            })

            // Populate
            json.nodes.forEach(function(node){
                sigmaInstance.addNode(node.id,{
                    'x': Math.random()
                    ,'y': Math.random()
                    ,label: node.label
                    ,size: Math.sqrt( 1 + Math.log( 1 + 0.1 * ( node.inEdges.length ) ) )
                    ,'color': chroma.rgb(node.color.r, node.color.g, node.color.b).hex()
                })
            })
            json.edges.forEach(function(link, i){
                sigmaInstance.addEdge(i,link.sourceID,link.targetID)
            })

            // Info message: nodes size...
            if(json.nodes.length > 0){
                if(json.edges.length > 0){
                    container.find('.sigma-messages').html('<span class="label">Network</span> <span class="label label-inverse">'+json.nodes.length+' web entities</span> <span class="label label-inverse">'+json.edges.length+' links</span>')
                } else {
                    container.find('.sigma-messages').html('<span class="label">Network</span> <span class="label label-inverse">'+json.nodes.length+' web entities</span> <span class="label label-info">No link: crawl a web entity to get links</span>')
                }
            } else {
                container.find('.sigma-messages').html('<span class="label">Empty Network</span> <span class="label label-info">You have no web entity to visualize</span>')
            }

            rescale()
        }

        this.triggers.events[pendingStateUpdatedEvent] = function(provider, e){
        	pending = provider.get(o['pendingStateProperty'])
        	if(pending){
	        	showPending()
	        } else {
	        	hidePending()
	        }
        }

        // Initialization
        if(pending){
        	showPending()
        }

        return container
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
    *   {?string}         element                   The DOM element (jQuery)
    *   {?string}         contentProperty           The name of the property that will be set to the content
    *                                               (it is dispatched on contentDispatchEvent)
    *   {?(array|string)} contentDispatchEvent      The property dispatched
    */
    ns.TextArea = function(options, d) {
        domino.module.call(this)

        var _self = this
            ,o = options || {}
            ,el = o['element'] || $('<textarea/>')

        var contentUpdated = function(){
                var s = [] // settings
                s[o['contentProperty']] = el.val()
                _self.dispatchEvent(o['contentDispatchEvent'], s)
            }

        if(o['contentProperty'] !== undefined && o['contentDispatchEvent'] !== undefined){
            el.bind('input propertychange', contentUpdated)
        }


        this.html = el
    }

    /**
    * HideElement listens to a property to hide or show a DOM element
    *
    * @param   {?Object} options An object containing the specifications of the
    *                            module.
    * @param   {?Object} d       The instance of domino.
    *
    * Here is the list of options that are interpreted:
    *
    *   {?string}           element             The DOM element (jQuery)
    *   {?string}           hideProperty        The name of the property listened (boolean)
    *   {?(array|string)}   hideTriggerEvent   The event used to listen to the property
    *   {?function}         propertyWrap        A function to modify the property listened
    */
    ns.HideElement = function(options, d) {
        domino.module.call(this)

        var _self = this
            ,o = options || {}
            ,el = o['element']

        if(o['hideProperty']){
            if (o['hideTriggerEvent']){
                domino.utils.array(o['hideTriggerEvent']).forEach(function(eventName) {
                    _self.triggers.events[eventName] = update
                })
            }else{
                _self.triggers.properties[o['hideProperty']] = update
            }
        }

        function update(provider, e) {
            if(o['hideProperty'] !== undefined){
                var prop = provider.get(o['hideProperty'])
                if(prop !== undefined || o['propertyWrap'] !== undefined){
                    var hide = (o['propertyWrap']) ? (o['propertyWrap'](prop)) : (prop)
                    if(hide !== undefined){
                        if(hide){
                            el.hide()
                        } else {
                            el.show()
                        }
                    }
                }
            }
        }

        update(d)

        this.html = el
  }

})(jQuery, (window.dmod = window.dmod || {}), domino);