HypheCommons.js_file_init()
HypheCommons.domino_init()

domino.settings('maxDepth', 10000)

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
                ,triggers: 'update_webentities'
                ,dispatch: 'webentities_updated'
            },{
                id:'webentitiesLinks'
                ,triggers: 'update_webentitiesLinks'
                ,dispatch: 'webentitiesLinks_updated'
            },{
                id:'networkJson'
                ,triggers: 'update_networkJson'
                ,dispatch: 'networkJson_updated'
            },{
                id:'sigmaPending'
                ,type: 'boolean'
                ,value: true
                ,triggers: 'update_sigmaPending'
                ,dispatch: 'sigmaPending_updated'
            },{
                id:'urlslistText'
                ,triggers: 'update_urlslistText'
                ,dispatch: 'urlslistText_updated'
            },{
                id:'candidateUrls'
                ,triggers: 'update_candidateUrls'
                ,dispatch: 'candidateUrls_updated'
            },{
                id:'hideParseUrlListButton'
                ,type: 'boolean'
                ,value: true
                ,triggers: 'update_hideParseUrlListButton'
                ,dispatch: 'hideParseUrlListButton_updated'
            },{
                id:'urlsDiagnosticActiveState'
                ,type: 'boolean'
                ,value: false
                ,triggers: 'update_urlsDiagnosticActiveState'
                ,dispatch: 'urlsDiagnosticActiveState_updated'
            },{
                id:'diagnostic_byUrl'
                ,type: 'object'
                ,value: {}
                ,dispatch: 'diagnostic_byUrl_updated'
                ,triggers: 'update_diagnostic_byUrl'
            },{
                id: 'queriesLimit'
                ,type: 'number'
                ,value: 10
            },{
                id: 'currentQueries'
                ,type: 'number'
                ,value: 0
                ,dispatch: 'currentQueries_updated'
                ,triggers: 'update_currentQueries'
            },{
                id:'tasks'
                ,type: 'array'
                ,value: []
                ,dispatch: 'tasks_updated'
                ,triggers: 'update_tasks'
            },{
                id:'nextTaskId'
                ,type: 'number'
                ,value: 0
            },{
                id:'tasks_byId'
                ,type: 'object'
                ,value: {}
                ,dispatch: 'tasks_byId_updated'
                ,triggers: 'update_tasks_byId'
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
            },{
                // When the list of URLs textarea is empty, hide the button, and not else
                triggers: ['urlslistText_updated']
                ,method: function() {
                    var text = this.get('urlslistText')
                    if(text == ''){
                        this.update('hideParseUrlListButton', true)
                    } else {
                        this.update('hideParseUrlListButton', false)
                    }
                }
            },{
                // Clicking on Diagnostic URLs button parses the URLs list
                triggers: ['ui_DiagnosticUrls']
                ,method: function(){
                    var urlslistText = this.get('urlslistText')
                        ,urls = extractWebentities(urlslistText)
                    this.update('candidateUrls', urls)
                }
            },{
                // Having a non-empty candidates URLs list triggers the diagnostic
                triggers: ['candidateUrls_updated']
                ,method: function(){
                    var candidateUrls = this.get('candidateUrls')
                    if(candidateUrls.length > 0)
                        this.update('urlsDiagnosticActiveState', true)
                }
            },{
                // Having an empty list of candidates URLs triggers an alert
                triggers: ['candidateUrls_updated']
                ,method: function(){
                    var candidateUrls = this.get('candidateUrls')
                    if(candidateUrls.length == 0)
                        alert('There are no URLs in the text you pasted')
                }
            },{
                // Having an non-empty list of candidates URLs stacks tasks for parsing every URL
                triggers: ['candidateUrls_updated']
                ,method: function(){
                    var _self = this
                        ,candidateUrls = this.get('candidateUrls')
                        ,tasksToStack = []

                    if(candidateUrls.length > 0){
                        candidateUrls.forEach(function(url){
                            tasksToStack.push({
                                    type: 'initializeCandidateURL'
                                    ,status: 'waiting'
                                    ,url: url
                                })
                        })
                        _self.dispatchEvent('tasks_stack', {
                            tasks: tasksToStack
                        })
                    }
                }
            },{
                // Stack a task on request
                triggers: ['tasks_stack']
                ,method: function(e){
                    var tasks = this.get('tasks')
                        ,tasks_byId = this.get('tasks_byId')
                        ,taskId = this.get('nextTaskId')
                        ,tasksToStack = e.data.tasks || []

                    tasksToStack.forEach(function(task){                    
                        task.id = taskId++
                        tasks.push(task)
                        tasks_byId[task.id] = task
                    })

                    this.update('nextTaskId', taskId)
                    this.update('tasks', tasks)
                    this.update('tasks_byId', tasks_byId)

                    this.dispatchEvent('cascadeTask')
                }
            },{
                // On cascade task, execute the first non executed task
                triggers: ['cascadeTask']
                ,method: function(e){
                    var tasks = this.get('tasks')
                        ,queriesLimit = this.get('queriesLimit')
                        ,currentQueries = this.get('currentQueries')
                        
                    // Are there tasks still to execute ?
                    var waitingTasks = tasks.filter(function(t){return t.status == 'waiting'})
                    if(waitingTasks.length > 0){

                        // Get the first non executed task, depending on free queries
                        if(currentQueries <= queriesLimit){
                            var task = waitingTasks[0]
                            task.status = 'pending'

                            if(task.type == 'initializeCandidateURL'){
                                var url = task.url
                                    ,url_md5 = $.md5(url)
                                    ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                                diagnostic_byUrl[url] = {}
                                console.log('Initialize candidate url ', task.url)
                                this.update('diagnostic_byUrl', diagnostic_byUrl)
                            }
                        }

                        // Keep batching if there are other tasks and queries limit allows it
                        if(waitingTasks.length > 1){
                            if(currentQueries < queriesLimit){
                                this.dispatchEvent('cascadeTask')
                            }
                        }
                    }
                }
            }/*,{
                // On task callbacks, trigger task executed event
                triggers: ['callback_webentityMerged', 'callback_webentityPrefixAdded', 'callback_webentityDeclared']
                ,method: function(e){
                    this.dispatchEvent('taskExecuted', {
                        taskId: e.data.taskId
                        ,errorMessage: e.data.errorMessage
                    })
                    this.dispatchEvent('cascadeTask')
                }
            }*/
        ]
    })

    

    //// Modules

    // Network display (Sigma)
    D.addModule(dmod.Sigma, [{
        element: $('#networkContainer')
        ,networkProperty: 'networkJson'
        ,networkUpdatedEvent: 'networkJson_updated'
        ,pendingStateProperty: 'sigmaPending'
        ,pendingStateUpdatedEvent: 'sigmaPending_updated'
        ,pendingMessage: 'Loading and parsing the network...'
    }])
    
    // Paste URLs Textarea
    D.addModule(dmod.TextArea, [{
        element: $('#urlsList')
        ,contentProperty: 'urlslistText'
        ,contentDispatchEvent: 'update_urlslistText'
    }])

    // Hide/Show URLs Paste Panel
    D.addModule(dmod.HideElement, [{
        element: $('#urlsPastePanel')
        ,hideProperty: 'urlsDiagnosticActiveState'
        ,hideTriggerEvent: 'urlsDiagnosticActiveState_updated'
    }])

    // Hide/Show URLs Diagnostic Panel
    D.addModule(dmod.HideElement, [{
        element: $('#urlsDiagnosticPanel')
        ,hideProperty: 'urlsDiagnosticActiveState'
        ,propertyWrap: function(d){return !d}
        ,hideTriggerEvent: 'urlsDiagnosticActiveState_updated'
    }])

    // Hide/Show URLs Diagnostic "Find" button
    D.addModule(dmod.HideElement, [{
        element: $('#addWebentitiesDiagnostic_findButton')
        ,hideProperty: 'hideParseUrlListButton'
        ,hideTriggerEvent: 'hideParseUrlListButton_updated'
    }])

    // Action on diagnostic button
    D.addModule(dmod.Button, [{
        element: $('#addWebentitiesDiagnostic_findButton')
        ,dispatchEvent: 'ui_DiagnosticUrls'
    }])

    // Display the diagnostic (Custom Module)
    D.addModule(function(){
        domino.module.call(this)

        var _self = this
            ,container = $('#urlsDiagnosticPanel_content')

        this.triggers.events['candidateUrls_updated'] = function(provider, e) {
            var urls = provider.get('candidateUrls')
            container.html('')
                .append(
                        urls.map(function(url){
                            var pendingMessage = "Waiting..."
                            return $('<div class="urlCandidateBlock" data-url-md5="'+$.md5(url)+'"/>')
                                .append($('<table/>')
                                    .append($('<tr/>')
                                        .append($('<td class="url"/>')
                                            .append($('<span/>')
                                                    .text(url)
                                                )
                                            )
                                        .append($('<td class="info pull-right"/>')
                                            .html('<div class="progress progress-striped progress-info active"><div class="bar" style="width: 100%;">'+pendingMessage+'</div></div>')
                                            )
                                        )
                                    )
                        })
                    )
        }

        // this.triggers.events['urlDiag_'] = function(provider, e)
    })

        



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

    var extractWebentities = function(text){
        var re = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig
            ,raw_urls = text.match(re) || []
            ,urls = raw_urls.filter(function(expression){
                        return Utils.URL_validate(expression)
                    })
                .map(function(url){
                        if(url.indexOf('http')!=0)
                            return 'http://'+url
                        return url
                    })

        return Utils.extractCases(urls)
    }


    /// Misc functions
    

})(jQuery, domino, (window.dmod = window.dmod || {}))