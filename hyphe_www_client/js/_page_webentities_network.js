domino.settings({
    shortcutPrefix: "::" // Hack: preventing a bug related to a port in a URL for Ajax
    ,verbose: true
})

;(function($, domino, dmod, undefined){
    
    // Check that config is OK
    if(HYPHE_CONFIG === undefined)
        alert('Your installation of Hyphe has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHYPHE_CONFIG = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')

    // Stuff we reuse often when we initialize Domino
    var rpc_url = HYPHE_CONFIG.SERVER_ADDRESS
        ,rpc_contentType = 'application/x-www-form-urlencoded'
        ,rpc_type = 'POST'
        ,rpc_expect = function(data){return data[0] !== undefined && data[0].code !== undefined && data[0].code == 'success'}
        ,rpc_error = function(data){alert('Oops, an error occurred... \n'+data)}

    var D = new domino({
        name: 'main'
        ,properties: [
            {
                id:'webentities'
                ,dispatch: 'webentities_updated'
                ,triggers: 'update_webentities'
            },{
                id:'webentitiesLinks'
                ,dispatch: 'webentitiesLinks_updated'
                ,triggers: 'update_webentitiesLinks'
            },{
                id:'networkJson'
                ,dispatch: 'networkJson_updated'
                ,triggers: 'update_networkJson'
            },{
                id:'sigmaInstance'
                ,dispatch: 'sigmaInstance_updated'
                ,triggers: 'update_sigmaInstance'
            },{
                id:'layoutRunning'
                ,type: 'boolean'
                ,value: false
                ,dispatch: 'layoutRunning_updated'
                ,triggers: 'update_layoutRunning'
            }
        ],services: [
            {
                id: 'getWebentitiesLinks'
                ,setter: 'webentitiesLinks'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET_LINKS,
                        'params' : [],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'getWebentities'
                ,setter: 'webentities'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }
        ],hacks:[
            {
                // Download network
                triggers: ['downloadNetwork']
                ,method: function(){downloadNetwork()}
            },{
                // When web entities and links are loaded, build the json network
                triggers: ['webentities_updated', 'webentitiesLinks_updated']
                ,method: function() {
                    if( D.get('webentities') !== undefined && D.get('webentitiesLinks') !== undefined ){
                        buildNetworkJson()
                    }
                }
            }
        ]
    })

    //// Modules

    // Sigma
    D.addModule(function(){
        domino.module.call(this)

        var container = $('#sigmaContainer')

        $(document).ready(function(e){
            container.html('<div class="sigma-parent"><div class="sigma-expand" id="sigma-example"></div></div>')
        })

        this.triggers.events['networkJson_updated'] = function(){
            var json = D.get('networkJson')

            // Kill old sigma if needed
            var oldSigmaInstance = D.get('sigmaInstance')
            if(oldSigmaInstance !== undefined){
                D.dispatchEvent('update_layoutRunning', {
                    layoutRunning: !D.get('layoutRunning')
                })
                oldSigmaInstance.emptyGraph() // .kill() is not currently implemented
                container.find('#sigma-example').html('')
            }

            // Instanciate sigma.js and customize it
            var sigmaInstance = sigma.init(document.getElementById('sigma-example')).drawingProperties({
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
                })
            })
            json.edges.forEach(function(link, i){
                sigmaInstance.addEdge(i,link.sourceID,link.targetID)
            })

            D.dispatchEvent('update_sigmaInstance', {
                sigmaInstance: sigmaInstance
            })

            // Start the ForceAtlas2 algorithm
            D.dispatchEvent('update_layoutRunning', {
                layoutRunning: true
            })
        }
    })
    
    // ForceAtlas
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['layoutRunning_updated'] = function(){
            var sigmaInstance = D.get('sigmaInstance')
                ,layoutRunning = D.get('layoutRunning')
            if(layoutRunning){
                sigmaInstance.startForceAtlas2()
            } else {
                sigmaInstance.stopForceAtlas2()
            }
        }
    })

    // Sigma buttons
    D.addModule(function(){
        domino.module.call(this)

        var container = $('#sigmaButtons')

        $(document).ready(function(e){
            container.html('<div class="btn-group"><button class="btn btn-small" id="layoutSwitch">Stop Layout</button> <button class="btn btn-small" id="rescaleGraph"><i class="icon-resize-full"/> Rescale Graph</button></div>')
            updateLayoutSwitch()
            container.find('#layoutSwitch').click(function(){
                D.dispatchEvent('update_layoutRunning', {
                    layoutRunning: !D.get('layoutRunning')
                })
            })
            updateRescaleGraph()
            container.find('#rescaleGraph').click(function(){
                var sigmaInstance = D.get('sigmaInstance')
                if(sigmaInstance !== undefined)
                    sigmaInstance.position(0,0,1).draw()
            })
        })

        function updateLayoutSwitch(){
            var button = container.find('#layoutSwitch')
                ,layoutRunning = D.get('layoutRunning')
                ,sigmaInstance = D.get('sigmaInstance')
            if(sigmaInstance === undefined){
                button.html('<i class="icon-play"/> Start layout')
                button.addClass('disabled')
            } else {
                button.removeClass('disabled')
                if(layoutRunning){
                    button.html('<i class="icon-stop"/> Stop layout')
                } else {
                    button.html('<i class="icon-play"/> Start layout')
                }
            }
        }

        function updateRescaleGraph(){
            var button = container.find('#rescaleGraph')
                ,sigmaInstance = D.get('sigmaInstance')
            if(sigmaInstance === undefined){
                button.addClass('disabled')
            } else {
                button.removeClass('disabled')
            }
        }

        this.triggers.events['sigmaInstance_updated'] = function(){
            updateLayoutSwitch()
            updateRescaleGraph()
        }

        this.triggers.events['layoutRunning_updated'] = function(){
            updateLayoutSwitch()
        }
    })

    // Download button
    D.addModule(dmod.Button, [{
        label: 'Download network'
        ,bsIcon: 'icon-download'
        ,dispatch: 'downloadNetwork'
    }]).html.appendTo($('#download'))
    
    
    //// On load, get the web entity
    $(document).ready(function(e){
        D.request('getWebentitiesLinks', {})
        D.request('getWebentities', {})
    })


    //// Processing
    var downloadNetwork = function() {
        var json = D.get('networkJson')
            ,blob = new Blob(json_graph_api.buildGEXF(json), {'type':'text/gexf+xml;charset=utf-8'})
            ,filename = "Web Entities.gexf"
        if(navigator.userAgent.match(/firefox/i))
           alert('Note:\nFirefox does not handle file names, so you will have to rename this file to\n\"'+filename+'\""\nor some equivalent.')
        saveAs(blob, filename)
    }

    var buildNetworkJson = function(){
        var webentities = D.get('webentities')
            ,links = D.get('webentitiesLinks')
            ,net = {}

        net.attributes = []

        net.nodesAttributes = []
        
        net.nodes = webentities.map(function(we){
            return {
                id: we.id
                ,label: we.name
                ,attributes: []
            }
        })
        
        net.edgesAttributes = []

        net.edges = links.map(function(link){
            return {
                sourceID: link[0]
                ,targetID: link[1]
                ,attributes: []
            }
        })

        json_graph_api.buildIndexes(net)

        D.dispatchEvent('update_networkJson', {
            networkJson: net
        })
    }

})(jQuery, domino, (window.dmod = window.dmod || {}))