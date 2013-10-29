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
                id:'networkJson'
                ,dispatch: 'networkJson_updated'
                ,triggers: 'update_networkJson'
            },{
                id:'sigmaPending'
                ,type: 'boolean'
                ,value: true
                ,dispatch: 'sigmaPending_updated'
                ,triggers: 'update_sigmaPending'
            },{
                id:'urlslistText'
                ,dispatch: 'urlslistText_updated'
                ,triggers: 'update_urlslistText'
            }
        ]

        ,services: [
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
        ]


        ,hacks:[
            {
                // When web entities and links are loaded, build the json network
                triggers: ['webentities_updated', 'webentitiesLinks_updated']
                ,method: function() {
                    if( this.get('webentities') !== undefined && this.get('webentitiesLinks') !== undefined ){
                        var network = buildNetworkJson(this.get('webentities'), this.get('webentitiesLinks'))
                        this.dispatchEvent('update_networkJson', {
                            networkJson: network
                        })
                    }
                }
            },{
                // When the network is updated, sigma stops being pending
                triggers: ['networkJson_updated']
                ,method: function(){
                    this.update('sigmaPending', false)
                }
            }
        ]
    })

    

    //// Modules
    
    // Paste Urls Textarea
    D.addModule(dmod.TextArea, [{
        element: $('#urlsList')
        ,contentProperty: 'urlslistText'
        ,contentDispatchEvent: 'update_urlslistText'
    }])

    // Network display (Sigma)
    D.addModule(dmod.Sigma, [{
        element: $('#networkContainer')
        ,networkProperty: 'networkJson'
        ,networkUpdatedEvent: 'networkJson_updated'
        ,pendingStateProperty: 'sigmaPending'
        ,pendingStateUpdatedEvent: 'sigmaPending_updated'
        ,pendingMessage: 'Loading and parsing the network...'
    }])
    



    //// On load
    $(document).ready(function(e){
        D.request('getWebentitiesLinks', {})
        D.request('getWebentities', {})
    })




    //// Clock



    //// Processing
    var buildNetworkJson = function(webentities, links){
        var net = {}
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

        /*console.log('Web entities', webentities)
        console.log('Links', net)
        console.log('Network', net)*/

        return net
    }

    var buildNetworkForDownload = function(provider) {
        var json = provider.get('filteredNetworkJson')

        // Get layout properties from sigma
        var sigmaInstance = provider.get('sigmaInstance')
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


    /// Misc functions
    

})(jQuery, domino, (window.dmod = window.dmod || {}))