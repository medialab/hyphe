HypheCommons.js_file_init()
HypheCommons.domino_init()

domino.settings('maxDepth', 1000)

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
                id: 'concurrentTasksLimit'
                ,type: 'number'
                ,value: 10
            },{
                id: 'pendingTasksCount'
                ,type: 'number'
                ,value: 0
                ,dispatch: 'pendingTasksCount_updated'
                ,triggers: 'update_pendingTasksCount'
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
            },{
                id: 'fetchWebEntityByURL'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.FETCH_BY_URL,
                        'params' : [settings.url],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type
                ,error: function(data, xhr, input){
                        var pendingTasksCount = this.get('pendingTasksCount')
                        this.update('pendingTasksCount', pendingTasksCount - 1 )
                        this.dispatchEvent('callback_webentityFetched', {
                                webentityId: undefined
                                ,message: 'RPC error'
                                ,url: input.url
                                ,diagUrl: input.diagUrl
                            })

                        rpc_error(data, xhr, input)
                    }
                ,expect: function(data, input, serviceOptions){
                        // console.log('RPC expect', data[0].code == 'fail' || rpc_expect(data, input, serviceOptions), 'data[0].code', data[0].code)
                        return (data.length>0 && data[0].code == 'fail') || rpc_expect(data, input, serviceOptions)
                    }
                ,before: function(){
                        var pendingTasksCount = this.get('pendingTasksCount')
                        this.update('pendingTasksCount', pendingTasksCount + 1 )
                    }
                ,success: function(data, input){
                        var pendingTasksCount = this.get('pendingTasksCount')
                        this.update('pendingTasksCount', pendingTasksCount - 1 )

                        if(data[0].code == 'fail'){
                            this.dispatchEvent('callback_webentityFetched', {
                                webentityId: undefined
                                ,message: '<span class="muted">invalid address</span>'
                                ,url: input.url
                                ,diagUrl: input.diagUrl
                            })
                        } else {
                            var we = data[0].result
                                ,webentities = this.get('webentities')
                                ,webentities_byId = this.get('webentities_byId')
                                ,webentities_byLruPrefix = this.get('webentitiesByLruPrefix')
                                
                            webentities_byId[we.id] = we
                            var webentities = d3.values(webentities_byId)
                            this.update('webentities', webentities)
                            this.update('webentities_byId', webentities_byId)

                            we.lru_prefixes.forEach(function(lru){
                                webentities_byLruPrefix[lru] = we
                            })
                            this.update('webentitiesByLruPrefix', webentities_byLruPrefix)

                            this.dispatchEvent('callback_webentityFetched', {
                                webentityId: we.id
                                ,url: input.url
                                ,diagUrl: input.diagUrl
                            })
                        }
                    }
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
                triggers: ['ui_DiagnosticUrlsButton']
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
                    var _self = this
                        ,tasks = this.get('tasks')
                        ,tasks_byId = this.get('tasks_byId')
                        ,concurrentTasksLimit = this.get('concurrentTasksLimit')
                        ,pendingTasksCount = this.get('pendingTasksCount')
                        
                    // Are there tasks still to execute ?
                    if(tasks.length > 0){

                        // Get the first non executed task, depending on free queries
                        if(pendingTasksCount <= concurrentTasksLimit){
                            var task = tasks[0]

                            switch(task.type){

                                case 'initializeCandidateURL':
                                    var url = task.url
                                        ,lru = Utils.URL_to_LRU(url)
                                        ,url_md5 = $.md5(url)
                                        ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                                    
                                    diagnostic_byUrl[url] = {
                                            url: url
                                            ,url_md5: url_md5
                                            ,lru: lru
                                        }

                                    this.update('diagnostic_byUrl', diagnostic_byUrl)
                                    this.dispatchEvent('urlDiag_initialized', {url:url})
                                    break

                                case 'definePrefixCandidates':
                                    var diagnostic_byUrl = this.get('diagnostic_byUrl')
                                        ,diag = diagnostic_byUrl[task.url]

                                    diag.prefixCandidates = HypheCommons.getPrefixCandidates(diag.lru, {
                                            wwwlessVariations: true
                                            ,wwwVariations: !Utils.LRU_test_hasNoPath(diag.lru, {strict: false}) && Utils.LRU_test_hasNoSubdomain(diag.lru)
                                            ,httpVariations: true
                                            ,httpsVariations: true
                                        })

                                    diagnostic_byUrl[task.url] = diag
                                    this.update('diagnostic_byUrl', diagnostic_byUrl)
                                    this.dispatchEvent('urlDiag_prefixesDefined', {url:task.url})
                                    break

                                case 'fetchWebEntityFromPrefix':
                                    var diagnostic_byUrl = this.get('diagnostic_byUrl')
                                        ,diag = diagnostic_byUrl[task.url]
                                        ,prefix = task.prefix

                                    diagnostic_byUrl[task.url] = diag
                                    this.update('diagnostic_byUrl', diagnostic_byUrl)
                                    this.request('fetchWebEntityByURL', {url: Utils.LRU_to_URL(prefix), diagUrl:task.url})
                                    break
                            }
                        }

                        // Remove task from the list
                        tasks.shift()
                        tasks_byId[task.id] = undefined
                        this.update('tasks', tasks)
                        this.update('tasks_byId', tasks_byId)

                        // Keep batching if there are other tasks and queries limit allows it
                        if(tasks.length > 1){
                            if(pendingTasksCount < concurrentTasksLimit){
                                setTimeout(0, function(){
                                    _self.dispatchEvent('cascadeTask')
                                })
                            }
                        }
                    }
                }
            },{
                // On callback of Fetch WebEntity, update the diagnostic
                triggers: ['callback_webentityFetched']
                ,method: function(e){
                    var _self = this
                        ,prefixUrl = e.data.url
                        ,diagUrl = e.data.diagUrl
                        ,weId = e.data.webentityId
                        ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                        ,diag = diagnostic_byUrl[diagUrl]
                    
                    diag.webEntityId_byPrefixUrl = diag.webEntityId_byPrefixUrl || {}
                    diag.webEntityId_byPrefixUrl[prefixUrl] = weId

                    diagnostic_byUrl[diagUrl] = diag
                    this.update('diagnostic_byUrl', diagnostic_byUrl)
                    this.dispatchEvent('urlDiag_prefixChecked', {url:diagUrl})
                    this.dispatchEvent('cascadeTask')
                }
            },{
                // Diagnostic: On url initialized, ask for prefixes
                triggers: ['urlDiag_initialized']
                ,method: function(e){
                    var url = e.data.url
                    
                    this.dispatchEvent('tasks_stack', {
                        tasks: [{
                                type: 'definePrefixCandidates'
                                ,url: url
                            }]
                    })
                }
            },{
                // Diagnostic: On prefixes found, ask for fetching the webentities
                triggers: ['urlDiag_prefixesDefined']
                ,method: function(e){
                    var url = e.data.url
                        ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                        ,diag = diagnostic_byUrl[url]
                        ,tasks = []
                    
                    diag.prefixCandidates.forEach(function(prefix){
                        tasks.push({
                                type: 'fetchWebEntityFromPrefix'
                                ,url: url
                                ,prefix: prefix
                            })
                    })
                    this.dispatchEvent('tasks_stack', {
                        tasks: tasks
                    })
                }
            }/*,{
                // Diagnostic: On prefix checked (w.e. fetching), ...
                triggers: ['urlDiag_prefixChecked']
                ,method: function(e){

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
        ,dispatchEvent: 'ui_DiagnosticUrlsButton'
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

        this.triggers.events['urlDiag_initialized'] = function(provider, e){
            var url = e.data.url
                ,url_md5 = $.md5(url)
                ,pendingMessage = "Checking variants"
            container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;">'+pendingMessage+'</div></div>')
        }

        this.triggers.events['urlDiag_prefixChecked'] = function(provider, e){
            var url = e.data.url
                ,diagnostic_byUrl = provider.get('diagnostic_byUrl')
                ,diag = diagnostic_byUrl[url]
                ,url_md5 = diag.url_md5
                ,done = (d3.keys(diag.webEntityId_byPrefixUrl)).length
                ,total = diag.prefixCandidates.length
                ,pendingMessage = done+'/'+total+' variants checked'
                ,percent = Math.round(100*done/total)
            console.log('pendingMessage', pendingMessage)
            container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress"><div class="bar" style="width: '+percent+'%;">'+pendingMessage+'</div></div>')
        }
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