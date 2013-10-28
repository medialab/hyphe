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
	* A Sigma module
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
        	,sigmaInstance
        	,networkProperty = options['networkProperty']
        	,networkUpdatedEvent = options['networkUpdatedEvent']
        	,container = options['element'] || $('<div/>')
        	,pending = options['pendingStateProperty'] || false
        	,pendingStateUpdatedEvent = options['pendingStateUpdatedEvent']
        	,pendingMessage = options['pendingMessage'] || 'Loading...'

        container.html('<div class="sigma-parent"><div class="sigma-expand"></div><div class="sigma-overlay"></div></div>')
        
        var showPending = function(){
        	container.find('.sigma-overlay').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;">'+pendingMessage+'</div></div>')
        }

        var hidePending = function(){
        	container.find('.sigma-overlay').html('')
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
                    ,size: 1 + Math.log(1 + 0.1 * ( node.inEdges.length + node.outEdges.length ) )
                    ,'color': chroma.rgb(node.color.r, node.color.g, node.color.b).hex()
                })
            })
            json.edges.forEach(function(link, i){
                sigmaInstance.addEdge(i,link.sourceID,link.targetID)
            })

            rescale()
        }

        this.triggers.events[pendingStateUpdatedEvent] = function(provider, e){
        	pending = provider.get(options['pendingStateProperty'])
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

    }
  

})(jQuery, (window.dmod = window.dmod || {}), domino);