HypheCommons.js_file_init()
HypheCommons.domino_init()

;(function($, domino, dmod, undefined){
    
    // RPC config of this page
    var rpc_url = HypheCommons.RPC.URL
        ,rpc_contentType = HypheCommons.RPC.contentType
        ,rpc_type = HypheCommons.RPC.type
        ,rpc_expect = HypheCommons.RPC.expect
        ,rpc_error = HypheCommons.RPC.error

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
                id:'filteredNetworkJson'
                ,dispatch: 'filteredNetworkJson_updated'
                ,triggers: 'update_filteredNetworkJson'
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
            },{
                id: 'modes'
                ,value: [
                    {
                        id: 'mode_corpusInProgress'
                        ,title: 'Corpus in progress'
                        ,abstract: 'IN + UNDECIDED'
                        ,info: 'The corpus including web entities you still have to accept or refuse'
                        ,filter: function(n){
                            return ['IN', 'UNDECIDED'].indexOf(n.attributes_byId['attr_status']) >= 0
                        }
                    },{
                        id: 'mode_topNeighbors'
                        ,title: 'Top neighbors'
                        ,abstract: 'IN + UNDECIDED + top DISCOVERED'
                        ,info: 'The corpus in progress with neighbors (discovered web entities) cited 3+ times by other web entities'
                        ,filter: function(n){
                            if(['IN', 'UNDECIDED'].indexOf(n.attributes_byId['attr_status']) >= 0){
                                return true
                            } else if(n.attributes_byId['attr_status'] == 'DISCOVERED'){
                                return n.inEdges.length >= 3
                            } else {
                                return false
                            }
                        }
                    },{
                        id: 'mode_corpusStrict'
                        ,title: 'Corpus strict'
                        ,abstract: 'IN only'
                        ,info: 'The pure corpus, as the result of selection process'
                        ,filter: function(n){
                            return n.attributes_byId['attr_status'] == 'IN'
                        }
                    },{
                        id: 'mode_frontier'
                        ,title: 'Frontier'
                        ,abstract: 'IN + UNDECIDED + OUT'
                        ,info: 'The corpus and its frontier (rejected web entities), for analysis or monitoring the selection process'
                        ,filter: function(n){
                            return ['IN', 'UNDECIDED', 'OUT'].indexOf(n.attributes_byId['attr_status']) >= 0
                        }
                    },{
                        id: 'mode_neighbors'
                        ,title: 'All neighbors'
                        ,abstract: 'IN + UNDECIDED + DISCOVERED'
                        ,info: 'The corpus in progress with all discovered web entities'
                        ,filter: function(n){
                            return ['IN', 'UNDECIDED', 'DISCOVERED'].indexOf(n.attributes_byId['attr_status']) >= 0
                        }
                    },{
                        id: 'mode_full'
                        ,title: 'Full'
                        ,abstract: 'IN + OUT + UNDECIDED + DISCOVERED'
                        ,info: 'Everything'
                        ,filter: function(n){
                            return true
                        }
                    }
                ]
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
                        'params' : [
                            null
                            ,false
                            ,false
                            ,"name"             // sort order
                            ,50000              // max results
                        ],
                    })}
                ,path:'0.result.webentities'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }

        

        ],hacks:[
            {
                // Download network
                triggers: ['downloadNetwork']
                ,method: function(){downloadNetwork()}
            },{
                // Layout: start
                triggers: ['ui_layoutStart']
                ,method: function(){
                    D.dispatchEvent('update_layoutRunning', {
                        layoutRunning: true
                    })
                }
            },{
                // Layout: stop
                triggers: ['ui_layoutStop']
                ,method: function(){
                    D.dispatchEvent('update_layoutRunning', {
                        layoutRunning: false
                    })
                }
            },{
                // Layout: rescale
                triggers: ['layoutRescale']
                ,method: function(){
                    var sigmaInstance = D.get('sigmaInstance')
                    if(sigmaInstance !== undefined)
                        sigmaInstance.position(0,0,1).draw()
                }
            },{
                // Force Atlas 2 binding
                triggers: ['layoutRunning_updated']
                ,method: function(){
                    var sigmaInstance = D.get('sigmaInstance')
                        ,layoutRunning = D.get('layoutRunning')
                    if(layoutRunning){
                        sigmaInstance.startForceAtlas2()
                    } else {
                        sigmaInstance.stopForceAtlas2()
                    }
                }
            },{
                // When web entities and links are loaded, build the json network
                triggers: ['webentities_updated', 'webentitiesLinks_updated']
                ,method: function() {
                    if( D.get('webentities') !== undefined && D.get('webentitiesLinks') !== undefined ){
                        buildNetworkJson()
                    }
                }
            },{
                // When network is updated or mode is changed, rebuild the filtered network and rescale
                triggers: ['networkJson_updated', 'ui_changeMode']
                ,method: function(){
                    var net = D.get('networkJson')
                        ,modes = D.get('modes')
                        ,mode_id = $('#modes input[type=radio]:checked').val()
                        ,fetchMode = modes.filter(function(m){return m.id == mode_id})
                        ,mode

                    if(fetchMode.length == 1){
                        mode = fetchMode[0]
                    } else {
                        console.log('[_page_webentities_network.js] unexpected bug when fetching mode')
                    }

                    // Filter network
                    net.nodes.forEach(function(n){
                        n.display = mode.filter(n)
                    })

                    // Build filtered network
                    var fnet = {}  // Filtered network

                    fnet.attributes = []

                    fnet.nodesAttributes = net.nodesAttributes
                    
                    fnet.nodes = net.nodes.filter(function(n){
                        return n.display
                    })
                    
                    fnet.edgesAttributes = net.edgesAttributes

                    fnet.edges = net.edges.filter(function(e){
                        return e.source.display && e.target.display
                    })
                    fnet = json_graph_api.getBackbone(fnet)
                    json_graph_api.buildIndexes(fnet)

                    // Nodes size
                    fnet.nodes.forEach(function(n){
                        n.size = Math.sqrt(1+n.inEdges.length)
                    })

                    D.dispatchEvent('update_filteredNetworkJson', {
                        filteredNetworkJson: fnet
                    })
                    D.dispatchEvent('layoutRescale')
                    D.dispatchEvent('ui_layoutStart')
                }
            }
        ]
    })

    //// Modules

    // Sigma (custom module just for here)
    D.addModule(function(){
        domino.module.call(this)

        var container = $('#sigmaContainer')

        $(document).ready(function(e){
            container.html('<div class="sigma-parent"><div class="sigma-expand" id="sigma-example"></div></div>')
        })

        this.triggers.events['filteredNetworkJson_updated'] = function(){
            var json = D.get('filteredNetworkJson')

            // Kill old sigma if needed
            var oldSigmaInstance = D.get('sigmaInstance')
            if(oldSigmaInstance !== undefined){
               /* D.dispatchEvent('update_layoutRunning', {
                    layoutRunning: !D.get('layoutRunning')
                })*/
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
                    ,'color': chroma.rgb(node.color.r, node.color.g, node.color.b).hex()
                })
            })
            json.edges.forEach(function(link, i){
                sigmaInstance.addEdge(i,link.sourceID,link.targetID)
            })

            D.dispatchEvent('update_sigmaInstance', {
                sigmaInstance: sigmaInstance
            })

            // Start the ForceAtlas2 algorithm
            /*D.dispatchEvent('update_layoutRunning', {
                layoutRunning: true
            })*/
        }
    })
    
    // Modes (custom module)
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#modes')
            ,modes = D.get('modes')

        // Display options
        element.html('')
        modes.forEach(function(mode, i){
            element.append(
                $('<label class="radio"/>')
                    .append(
                        $('<input type="radio" name="optionsRadios" id="'+mode.id+'" value="'+mode.id+'" '+((i==0)?('checked'):(''))+'/>')
                        )
                    .append(
                        $('<strong/>').text(mode.title)
                        )
                    .append(
                        $('<span/>').text(' - '+mode.abstract)
                        )
                    .append(
                        $('<br/>')
                        )
                    .append(
                        $('<span class="text-info"/>').text(mode.info)
                        )
                    .append(
                        $('<br/>')
                        )
                    .append(
                        $('<br/>')
                        )
                )
        })
        element.find('input').change(function(){
            D.dispatchEvent('ui_layoutStop')
            D.dispatchEvent('ui_changeMode')
        })
    })

    // Layout start/stop button
    D.addModule(dmod.Button_twoStates, [{
        label_A: 'Start layout'
        ,label_B: 'Stop layout'
        ,bsIcon_A: 'icon-play'
        ,bsIcon_B: 'icon-stop'
        ,triggers_stateA: 'ui_layoutStop'
        ,triggers_stateB: 'ui_layoutStart'
        ,triggers_enable: 'sigmaInstance_updated'
        ,dispatch_A: 'ui_layoutStart'
        ,dispatch_B: 'ui_layoutStop'
        ,disabled: true
        ,stateB_init: true
        ,bsSize: 'btn-mini'
    }]).html.appendTo($('#sigmaButtons'))

    // Rescale button
    D.addModule(dmod.Button, [{
        label: 'Reset zoom'
        ,bsIcon: 'icon-resize-full'
        ,bsSize: 'btn-mini'
        ,disabled: true
        ,triggers_enable: 'sigmaInstance_updated'
        ,dispatch: 'layoutRescale'
    }]).html.appendTo($('#sigmaButtons'))

    // Download button
    D.addModule(dmod.Button, [{
        label: 'Download network'
        ,bsIcon: 'icon-download'
        ,disabled: true
        ,triggers_enable: 'networkJson_updated'
        ,dispatch: 'downloadNetwork'
    }]).html.appendTo($('#download'))
    
    
    //// On load, get the web entity
    $(document).ready(function(e){
        D.request('getWebentitiesLinks', {})
        D.request('getWebentities', {})
    })


    //// Processing
    var downloadNetwork = function() {
        var json = D.get('filteredNetworkJson')

        // Get layout properties from sigma
        var sigmaInstance = D.get('sigmaInstance')
        sigmaInstance.iterNodes(function(sigmaNode){
            var node = json.nodes_byId[sigmaNode.id]
            if(node === undefined){
                console.log('Cannot find node '+sigmaNode.id)
                sigmaNode.color = '#FF0000'
            } else {
                // console.log('Can find node '+sigmaNode.id)
                node.x = sigmaNode.x
                node.y = sigmaNode.y
                node.size = sigmaNode.size
                var rgb = chroma.hex(sigmaNode.color).rgb
                node.color = {r:rgb[0], g:rgb[1], b:rgb[2]}
            }
        })

        var blob = new Blob(json_graph_api.buildGEXF(json), {'type':'text/gexf+xml;charset=utf-8'})
            ,filename = "Web Entities.gexf"
        if(navigator.userAgent.match(/firefox/i))
           alert('Note:\nFirefox does not handle file names, so you will have to rename this file to\n\"'+filename+'\""\nor some equivalent.')
        saveAs(blob, filename)
    }

    var buildNetworkJson = function(){
        var webentities = D.get('webentities')
            ,links = D.get('webentitiesLinks')
            ,net = {}
            ,statusColors = {
                IN:             chroma.hex("#5AA04A")
                ,OUT:           chroma.hex("#CF5365")
                ,DISCOVERED:    chroma.hex("#D0A536")
                ,UNDECIDED:     chroma.hex("#8B80BC")
            }

        net.attributes = []

        net.nodesAttributes = [
            {id:'attr_status', title:'Status', type:'string'}
            ,{id:'attr_crawling', title:'Crawling status', type:'string'}
            ,{id:'attr_indexing', title:'Indexing status', type:'string'}
            ,{id:'attr_creation', title:'Creation', type:'integer'}
            ,{id:'attr_modification', title:'Last modification', type:'integer'}
            ,{id:'attr_home', title:'Home page', type:'string'}
        ]
        
        // Extract categories from nodes
        var categories = []
        webentities.forEach(function(we){
            for(namespace in we.tags){
                if(namespace == 'CORPUS' || namespace == 'USER'){
                    var tagging = we.tags[namespace]
                    for(category in tagging){
                        var values = tagging[category]
                        categories.push(namespace+': '+category)
                    }
                }
            }
        })
        categories = Utils.extractCases(categories)
        categories.forEach(function(cat){
            net.nodesAttributes.push({id:'attr_'+$.md5(cat), title:cat, type:'string'})
        })

        net.nodes = webentities.map(function(we){
            var color = statusColors[we.status] || chroma.hex('#FF0000')
                ,tagging = []
            for(namespace in we.tags){
                if(namespace == 'CORPUS' || namespace == 'USER'){
                    for(category in we.tags[namespace]){
                        var values = we.tags[namespace][category]
                        tagging.push({cat:namespace+': '+category, values:values})
                    }
                }
            }
            return {
                id: we.id
                ,label: we.name
                ,color: {r:color.rgb[0], g:color.rgb[1], b:color.rgb[2]}
                ,attributes: [
                    {attr:'attr_status', val: we.status || 'error' }
                    ,{attr:'attr_crawling', val: we.crawling_status || '' }
                    ,{attr:'attr_indexing', val: we.indexing_status || '' }
                    ,{attr:'attr_creation', val: we.creation_date || 'unknown' }
                    ,{attr:'attr_modification', val: we.last_modification_date || 'unknown' }
                    ,{attr:'attr_home', val: we.homepage || '' }
                ].concat(tagging.map(function(catvalues){
                    return {attr:'attr_'+$.md5(catvalues.cat), val:catvalues.values.join(' | ')}
                }))
            }
        })
        
        net.edgesAttributes = [
            {id:'attr_count', title:'Hyperlinks Count', type:'integer'}
        ]

        net.edges = links.map(function(link){
            return {
                sourceID: link[0]
                ,targetID: link[1]
                ,attributes: [
                    {attr:'attr_count', val:link[2]}
                ]
            }
        })

        json_graph_api.buildIndexes(net)

        D.dispatchEvent('update_networkJson', {
            networkJson: net
        })

        /*console.log('Web entities', webentities)
        console.log('Links', net)
        console.log('Network', net)*/
    }

})(jQuery, domino, (window.dmod = window.dmod || {}))
