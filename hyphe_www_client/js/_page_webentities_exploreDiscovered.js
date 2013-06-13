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
                id:'webentitiesbyid'
                ,dispatch: 'webentitiesbyid_updated'
                ,triggers: 'update_webentitiesbyid'
            },{
                id:'webentitiesLinks'
                ,dispatch: 'webentitiesLinks_updated'
                ,triggers: 'update_webentitiesLinks'
            },{
                id:'networkJson'
                ,dispatch: 'networkJson_updated'
                ,triggers: 'update_networkJson'
            },{
                id:'discoveredWebentitiesList'
                ,dispatch: 'discoveredWebentitiesList_updated'
                ,triggers: 'update_discoveredWebentitiesList'
            },{
                id:'listLength'
                ,type: 'number'
                ,value: 10
                ,dispatch: 'listLength_updated'
                ,triggers: 'update_listLength'
            },{
                id:'currentItem'
                ,dispatch: 'currentItem_updated'
                ,triggers: ['update_currentItem', 'update_discoveredWebentitiesList']
            },{
                id:'statusValidation'
                ,dispatch: 'statusValidation_updated'
                ,triggers: 'update_statusValidation'
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
            },{
                id: 'setCurrentWebEntityStatus'
                ,setter: 'statusValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.SET_STATUS,
                        'params' : [
                            settings.webEntityId      // web entity id
                            ,settings.status          // new status
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }
        ],hacks:[
            {
                // When web entities and links are loaded, build the json network
                triggers: ['webentities_updated', 'webentitiesLinks_updated']
                ,method: function() {
                    if( D.get('webentities') !== undefined && D.get('webentitiesLinks') !== undefined ){
                        buildNetworkJson()
                    }
                }
            },{
                // When web entities are loaded, index them by id
                triggers: ['webentities_updated']
                ,method: function() {
                    var index = webentities_indexById(D.get('webentities'))
                    D.dispatchEvent('update_webentitiesbyid', {
                        webentitiesbyid: index
                    })
                }
            },{
                // When the json network is updated and the web entities are indexed by id, we update the list of discovered web entities and set current item to the first
                triggers: ['networkJson_updated', 'webentitiesbyid_updated']
                ,method: function() {
                    var net = D.get('networkJson')
                        ,wes_byId = D.get('webentitiesbyid')
                    if( net !== undefined && wes_byId != undefined){
                        var discoveredWebentitiesList = buildDiscoveredWebentitiesList(wes_byId, net)
                        D.dispatchEvent('update_discoveredWebentitiesList', {
                            discoveredWebentitiesList: discoveredWebentitiesList
                            ,currentItem: discoveredWebentitiesList[0]
                        })
                    }
                }
            },{
                // When a status change has been validated, we reload web entities
                triggers: ['statusValidation_updated']
                ,method: function() {
                    D.request('getWebentities', {})
                    /*D.dispatchEvent('update_currentItem', {
                        currentItem: null
                    })*/
                }
            }
        ]
    })

    //// Modules

    // List of discovered web entities
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#webentities_list')
            ,element_footer = $('#webentitieslist_footer')

        var update = function() {
            
            element.html('')

            var list = D.get('discoveredWebentitiesList')
                ,limit = D.get('listLength')
                ,current = D.get('currentItem')

            // console.log('list', list)

            list.forEach(function(item, i){
                if(i<limit){
                    var tr = $('<tr/>').append(
                        $('<td/>').text(item.indegree)
                    ).append(
                        $('<td/>').text(item.webentity.name)
                    )

                    if(item == current){
                        tr.addClass('info').append(
                            $('<td/>').append(
                                $('<i class="icon-chevron-right icon-white pull-right"></i>')
                            )
                        )
                    } else {
                        tr.append(
                            $('<td/>').append(
                                $('<i class="icon-chevron-right decorating-chevron icon-white pull-right"></i>')
                            )
                        )
                    }

                    tr.click(function(){
                        D.dispatchEvent('update_currentItem', {
                            currentItem: item
                        })
                    })

                    element.append(tr)
                }
            })
            if(list.length > limit){
                var bsDarkBackgroundStyles = [
                        'btn-primary'
                        ,'btn-info'
                        ,'btn-success'
                        ,'btn-warning'
                        ,'btn-danger'
                        ,'btn-inverse'
                    ]
                    ,ghostify = function(button, bsColor){
                        button.addClass('btn-link')
                            .mouseenter(function(){
                                button.removeClass('btn-link')
                                bsColor && button.addClass(bsColor)
                                if(bsColor && bsDarkBackgroundStyles.indexOf(bsColor) >= 0)
                                    button.find('i').addClass('icon-white')
                            }).mouseleave(function(){
                                button.addClass('btn-link')
                                bsColor && button.removeClass(bsColor)
                                if(bsColor && bsDarkBackgroundStyles.indexOf(bsColor) >= 0)
                                    button.find('i').removeClass('icon-white')
                            })
                        }
                    ,button = $('<button class="btn btn-block"/>').text('Show more items...')
                        .click(function(){
                            D.dispatchEvent('update_listLength', {
                                listLength: limit+10
                            })
                        })

                ghostify(button)
                element_footer.html('').append(button)
            }
        }

        this.triggers.events['discoveredWebentitiesList_updated'] = update
        this.triggers.events['listLength_updated'] = update
        this.triggers.events['currentItem_updated'] = update
    })
    
    // Web entity summary
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#webentity_summary')

        var update = function(){

            element.html('')

            var current = D.get('currentItem')
            if(current !== undefined && current !== null){
                var button_in = $('<button class="btn btn-success">IN</button>').click(function(){
                    D.request('setCurrentWebEntityStatus', {
                        webEntityId: current.webentity.id
                        ,status: 'IN'
                    })
                })
                
                var button_out = $('<button class="btn btn-danger">OUT</button>').click(function(){
                    D.request('setCurrentWebEntityStatus', {
                        webEntityId: current.webentity.id
                        ,status: 'OUT'
                    })
                })
                
                var button_undecided = $('<button class="btn btn-info">UNDECIDED</button>').click(function(){
                    D.request('setCurrentWebEntityStatus', {
                        webEntityId: current.webentity.id
                        ,status: 'UNDECIDED'
                    })
                })
                
                var button_crawl = $('<a class="btn btn-link">Crawl</a>')
                    .attr('href', 'crawl_new.php#we_id='+current.webentity.id)
                
                
                element.append(
                    $('<h3/>').text(current.webentity.name)
                ).append(
                    $('<div id="status_buttons_div"/>')
                        .append(button_in)
                        .append(button_out)
                        .append(button_undecided)
                        .append(button_crawl)
                )
            }
        }

        this.triggers.events['currentItem_updated'] = update
    })

    // Web entity neighbors
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#webentity_neighbors')

        var update = function(){

            element.html('')

            var current = D.get('currentItem')
            if(current !== undefined && current !== null){
                element.append(
                    $('<h5/>').text('Who is citing?')
                ).append(
                    $('<div class="cited-list"/>')
                        .append(
                                $('<table class="table table-condensed"/>').append(
                                    current.node.inEdges.map(function(e){
                                        var webentities_byId = D.get('webentitiesbyid')
                                            ,we = webentities_byId[e.source.id]
                                            ,tr = $('<tr/>').append(
                                                $('<td/>').append(
                                                    $('<a/>').text(we.name)
                                                        .attr('href', 'webentity_edit.php#we_id='+we.id)
                                                        .attr('target', 'blank')
                                                )
                                            )
                                        if(we.homepage){
                                            tr.append(
                                                $('<td>').append(
                                                    $('<a class="btn btn-link btn-mini pull-right"/>')
                                                        .attr('href', we.homepage)
                                                        .attr('target', 'blank')
                                                        .append($('<i class="icon-share-alt"/>'))
                                                )
                                            )
                                        } else {
                                            tr.append(
                                                $('<td>')
                                            )
                                        }

                                        return tr
                                    })
                                )
                            )
                )
            }
        }

        this.triggers.events['currentItem_updated'] = update
    })

    // Web entity preview
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#webentity_preview')

        var update = function(){

            element.html('')

            var current = D.get('currentItem')

            if(current !== undefined && current !== null){
                var url = Utils.LRU_to_URL(current.webentity.lru_prefixes[0])
                element.append(
                    $('<h5/>').text('Preview')
                ).append(
                    $('<p class="text-info"/>').append(
                        $('<span/>').text('The preview is based on the first prefix ')
                    ).append(
                        $('<a/>').text(url)
                            .attr('href', url)
                            .attr('target', '_blank')
                    ).append(
                    $('<span/>').text('. These may not be linked to pages, but the web entity may still be legitimate.')
                    )
                ).append(
                    $('<iframe/>').attr('src', url)
                )
            }
        }

        this.triggers.events['currentItem_updated'] = update
    })

    //// On load, get the web entities
    $(document).ready(function(e){
        D.request('getWebentitiesLinks', {})
        D.request('getWebentities', {})
    })


    //// Processing
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

/*      
        console.log('Web entities', webentities)
        console.log('Links', net)
        console.log('Network', net)
*/    
    }

    var webentities_indexById = function(webentities){
        var webentities_byId = {}
        webentities.forEach(function(we){
            webentities_byId[we.id] = we
        })
        return webentities_byId
    }

    var buildDiscoveredWebentitiesList = function(webentities_byId, network){
        var result = []
        
        network.nodes.forEach(function(n){
            var we = webentities_byId[n.id]
            if(we && we.status == 'DISCOVERED')
                result.push({node:n, webentity:we, indegree:n.inEdges.length})
        })
        result.sort(function(a,b){return b.indegree-a.indegree})
        return result
    }

})(jQuery, domino, (window.dmod = window.dmod || {}));