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
                ,dispatch: 'webentities_updated'
                ,triggers: 'update_webentities'
                ,type: 'array'
            },{
                id:'webentities_byId'
                ,dispatch: 'webentities_byId_updated'
                ,triggers: 'update_webentities_byId'
                ,type: 'object'
                ,value: {}
            },{
                id:'webentitiesByLruPrefix'
                ,dispatch: 'webentitiesByLruPrefix_updated'
                ,triggers: 'update_webentitiesByLruPrefix'
                ,type: 'object'
                ,value: {}
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
                id:'diagnostic_byUrl'
                ,type: 'object'
                ,value: {}
                ,dispatch: 'diagnostic_byUrl_updated'
                ,triggers: 'update_diagnostic_byUrl'
            },{
                id:'urlsDiagnosticActiveState'
                ,type: 'boolean'
                ,value: false
                ,triggers: 'update_urlsDiagnosticActiveState'
                ,dispatch: 'urlsDiagnosticActiveState_updated'
            },{
                id: 'urlsDiagnosticStatusCollapseInfo'
                ,type: 'object'
                ,value: {added: true, extend: true, exists: true, warning: false, merge: true, pending: false, cancelled: true, error: false}
                ,triggers: 'update_urlsDiagnosticStatusCollapseInfo'
                ,dispatch: 'urlsDiagnosticStatusCollapseInfo_updated'
            },{
                id: 'diagnosticComplete'
                ,type: 'boolean'
                ,value: false
                ,triggers: 'update_diagnosticComplete'
                ,dispatch: 'diagnosticComplete_updated'
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
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
                ,success: function(data, input){
                        var webentities = data[0].result
                            ,webentities_byId = this.get('webentities_byId')
                        
                        webentities.forEach(function(we){
                            webentities_byId[we.id] = we
                        })

                        this.update('webentities', webentities)
                        this.update('webentities_byId', webentities_byId)
                    }
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
                                ,url: input.url
                                ,diagUrl: input.diagUrl
                            })
                        } else {
                            var we = data[0].result
                            this.dispatchEvent('callback_webentityFetched', {
                                webentityId: we.id
                                ,url: input.url
                                ,diagUrl: input.diagUrl
                            })

                            // Update front-end web entities list
                            var webentities = this.get('webentities')
                                ,webentities_byId = this.get('webentities_byId')
                            if(webentities_byId[we.id] === undefined){
                                // New web entity
                                webentities.push(we)
                                this.update('webentities', webentities)
                                webentities_byId[we.id] = we
                                this.update('webentities_byId', webentities_byId)
                            }
                        }
                    }
            },{
                id: 'fetchWebEntityByURLPrefix'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.FETCH_BY_PREFIX_URL,
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
                                ,url: input.url
                                ,diagUrl: input.diagUrl
                            })
                        } else {
                            var we = data[0].result
                            this.dispatchEvent('callback_webentityFetched', {
                                webentityId: we.id
                                ,url: input.url
                                ,diagUrl: input.diagUrl
                            })
                            
                            // Update front-end web entities list
                            var webentities = this.get('webentities')
                                ,webentities_byId = this.get('webentities_byId')
                            if(webentities_byId[we.id] === undefined){
                                // New web entity
                                webentities.push(we)
                                this.update('webentities', webentities)
                                webentities_byId[we.id] = we
                                this.update('webentities_byId', webentities_byId)
                            }
                        }
                    }
            },{
                id: 'webentityDeclare'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.CREATE_BY_LRUS,
                        'params' : [
                            settings.prefixes
                            ,''         // Name
                            ,'IN'       // Status
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect
                ,before: function(){
                        var pendingTasksCount = this.get('pendingTasksCount')
                        this.update('pendingTasksCount', pendingTasksCount + 1 )
                    }
                ,error: function(data, xhr, input){
                        var pendingTasksCount = this.get('pendingTasksCount')
                        this.update('pendingTasksCount', pendingTasksCount - 1 )
                        this.dispatchEvent('callback_webentityDeclared', {
                            taskId: input.taskId
                            ,error: true
                            ,errorMessage: '<strong>We could not declare</strong> the web entity.'
                                +'<pre> '+xhr.responseText+' </pre>'
                            ,diagUrl: input.diagUrl
                        })

                        rpc_error(data, xhr, input)
                    }
                ,success: function(data, input){
                        var pendingTasksCount = this.get('pendingTasksCount')
                        this.update('pendingTasksCount', pendingTasksCount - 1 )
                        this.dispatchEvent('callback_webentityDeclared', {
                            webentityId: input.goodWebentityId
                            ,taskId: input.taskId
                            ,diagUrl: input.diagUrl
                        })
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
                            .map(function(url){
                                    return Utils.URL_stripLastSlash(Utils.URL_fix(url))
                                    // We strip the last slash because these URLs will become prefixes, and we don't want prefixes with slashes
                                })
                    this.update('candidateUrls', Utils.extractCases(urls))
                }
            },{
                // Having a non-empty candidates URLs list triggers the diagnostic
                triggers: ['candidateUrls_updated']
                ,method: function(){
                    var candidateUrls = this.get('candidateUrls')
                    if(candidateUrls && candidateUrls.length > 0)
                        this.update('urlsDiagnosticActiveState', true)
                }
            },{
                // Having an empty list of candidates URLs triggers an alert
                triggers: ['candidateUrls_updated']
                ,method: function(){
                    var candidateUrls = this.get('candidateUrls')
                    if(candidateUrls && candidateUrls.length == 0)
                        alert('There are no URLs in the text you pasted')
                }
            },{
                // Having an non-empty list of candidates URLs stacks tasks for parsing every URL
                triggers: ['candidateUrls_updated']
                ,method: function(){
                    var _self = this
                        ,candidateUrls = this.get('candidateUrls')
                        ,tasksToStack = []

                    if(candidateUrls && candidateUrls.length > 0){
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
                // Stack tasks on request
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

                            if(HYPHE_CONFIG.JAVASCRIPT_LOG_VERBOSE)
                                console.log('[Task] "'+task.type+'" - pending '+pendingTasksCount, task)

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
                                            ,added: false
                                            ,cancelled: false
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
                                            ,smallerVariations: false
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
                                    this.request('fetchWebEntityByURLPrefix', {url: Utils.LRU_to_URL(prefix), diagUrl:task.url})
                                    this.dispatchEvent('urlDiag_prefixCheckPending', {url: task.url})
                                    break

                                case 'buildDiagnostic':
                                    var diagnostic_byUrl = this.get('diagnostic_byUrl')
                                        ,diag = diagnostic_byUrl[task.url]
                                        ,looks_a_page = Utils.LRU_test_isNonsectionPage(diag.lru)
                                        ,looks_a_homepage = looks_a_page && ((Utils.LRU_to_JSON_LRU(diag.lru).path || []).pop() || '').match(/.*(index|home|accueil).*/gi)
                                        ,weCount = 0
                                        ,weValues = []

                                    for(prefixUrl in diag.webEntityId_byPrefixUrl){
                                        var val = diag.webEntityId_byPrefixUrl[prefixUrl]
                                        if(val !== undefined){
                                            weCount++
                                        }
                                        if(weValues.indexOf(val) < 0){
                                            weValues.push(val)
                                        }
                                    }

                                    if(weCount > 0){
                                        if(weValues.length == 1){
                                            
                                            // The web entity exists
                                            var webentities_byId = this.get('webentities_byId')
                                                ,we = webentities_byId[weValues[0]]
                                            diag.status = 'exists'
                                            diag.message = 'This web entity is <strong>already existing</strong>. Its current name is "'+we.name+'"</span>'

                                        } else if(weValues.length == 2 && weValues.indexOf(undefined)>=0){
                                            
                                            // Web entity exists and will be extended
                                            // We deal with this case as if everything is OK
                                            diag.status = 'extend'

                                        } else {
                                            // Web entity merge
                                            diag.status = 'merge'
                                            var weIdList = weValues.filter(function(val){return val !== undefined})
                                                ,webentities_byId = this.get('webentities_byId')
                                                ,webentities = weIdList.map(function(weId){return webentities_byId[weId]})
                                            diag.message = 'Different web entities match the URL, so <strong>we cannot add </strong> one:<ul>'
                                                + webentities.map(function(we){
                                                    return '<li>'+we.name+' <small class="muted">('
                                                        + we.lru_prefixes.map(function(lru){
                                                                return Utils.LRU_to_URL(lru)
                                                            }).join(', ')
                                                        + ')</small></li>'
                                                }).join('')
                                                + '</ul>'
                                        }
                                    } else if(looks_a_homepage){
                                        diag.status = 'warning'
                                        diag.message = '<strong>It looks like a homepage</strong>. Having the whole domain often makes more sense.<span class="muted"> Click "Add" to define a web entity for this page anyway.</span>'
                                    } else if(looks_a_page){
                                        diag.status = 'warning'
                                        diag.message = 'This URL <strong>looks like a page</strong> and not a section of a website. It might be a mistake.<span class="muted"> Click "Add" to define a web entity for this page anyway.</span>'
                                    } else {
                                        diag.status = 'success'
                                    }

                                    diagnostic_byUrl[task.url] = diag
                                    this.update('diagnostic_byUrl', diagnostic_byUrl)
                                    this.dispatchEvent('urlDiag_diagnosticBuilt', {url:task.url})
                                    break
                            }

                            // Remove task from the list
                            tasks.shift()
                            tasks_byId[task.id] = undefined
                            this.update('tasks', tasks)
                            this.update('tasks_byId', tasks_byId)
                        }

                        // Keep batching
                        setTimeout(function(){
                            domino.instances('main').dispatchEvent('cascadeTask')
                        }, 0)
                    }
                }
            },{
                // On callback of Fetch WebEntity, update the diagnostic
                triggers: ['callback_webentityFetched']
                ,method: function(e){
                    var _self = this
                        ,prefixUrl = e.data.url
                        ,prefixLru = Utils.URL_to_LRU(e.data.url)
                        ,diagUrl = e.data.diagUrl
                        ,weId = e.data.webentityId
                        ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                        ,diag = diagnostic_byUrl[diagUrl]
                    
                    diag.webEntityId_byPrefixUrl = diag.webEntityId_byPrefixUrl || {}
                    
                    if(weId){

                        diag.webEntityId_byPrefixUrl[prefixUrl] = weId

                    } else {

                        // Notice that if weId is undefined, we still want to report it
                        diag.webEntityId_byPrefixUrl[prefixUrl] = undefined
                    }

                    diagnostic_byUrl[diagUrl] = diag
                    this.update('diagnostic_byUrl', diagnostic_byUrl)
                    this.dispatchEvent('urlDiag_prefixChecked', {url:diagUrl})
                }
            },{
                // On callback of Add WebEntity, update the diagnostic
                triggers: ['callback_webentityDeclared']
                ,method: function(e){
                    var _self = this
                        ,diagUrl = e.data.diagUrl
                        ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                        ,diag = diagnostic_byUrl[diagUrl]
                    if(e.data.error){
                        diag.status = 'error'
                        diag.errorMessage = e.data.errorMessage
                    } else {
                        diag.added = true
                    }

                    diagnostic_byUrl[diagUrl] = diag
                    this.update('diagnostic_byUrl', diagnostic_byUrl)
                    this.dispatchEvent('urlDiag_webentityAdded', {url:diagUrl})
                }
            },{
                // Diagnostic: When the last URL is initialized, get prefixes
                triggers: ['urlDiag_initialized']
                ,method: function(e){
                    var diagnostic_byUrl = this.get('diagnostic_byUrl')
                        ,candidateUrls = this.get('candidateUrls')
                    if(d3.keys(diagnostic_byUrl).length == candidateUrls.length){
                        var tasks = candidateUrls.map(function(url){
                                return {
                                        type: 'definePrefixCandidates'
                                        ,url: url
                                    }
                            })
                        this.dispatchEvent('tasks_stack', {
                            tasks: tasks
                        })
                    }
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
            },{
                // Diagnostic: On prefix checked (w.e. fetching), if all prefixes fetched, build the diagnostic
                triggers: ['urlDiag_prefixChecked']
                ,method: function(e){
                    var url = e.data.url
                        ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                        ,diag = diagnostic_byUrl[url]
                        ,done = (d3.keys(diag.webEntityId_byPrefixUrl)).length
                        ,total = diag.prefixCandidates.length
                    if(done == total){
                        this.dispatchEvent('tasks_stack', {
                            tasks: [{
                                    type: 'buildDiagnostic'
                                    ,url: url
                                }]
                        })
                    }
                }
            },{
                // Diagnostic: On diagnostic built, add if needed
                triggers: ['urlDiag_diagnosticBuilt']
                ,method: function(e){
                    var url = e.data.url
                        ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                        ,diag = diagnostic_byUrl[url]
                    if(diag.status == 'success'){
                        this.request('webentityDeclare', {
                            prefixes: diag.prefixCandidates
                            ,diagUrl: url
                        })
                    }
                }
            },{
                // Diagnostic: on click "Add" on a 'to check' URL, force the add
                triggers: ['ui_diag_checkAdd']
                ,method: function(e){
                    var url = e.data.url
                        ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                        ,diag = diagnostic_byUrl[url]

                    this.dispatchEvent('urlDiag_forceAdd', {url: url})
                    
                    this.request('webentityDeclare', {
                            prefixes: diag.prefixCandidates
                            ,diagUrl: url
                        })
                }
            },{
                // Diagnostic: on click "Cancel" on a 'to check' URL, force the cancel
                triggers: ['ui_diag_checkCancel']
                ,method: function(e){
                    var url = e.data.url
                        ,diagnostic_byUrl = this.get('diagnostic_byUrl')
                        ,diag = diagnostic_byUrl[url]

                    this.dispatchEvent('urlDiag_cancel', {url: url})

                    diag.cancelled = true
                    diagnostic_byUrl[url] = diag
                    this.update('diagnostic_byUrl', diagnostic_byUrl)
                }
            },{
                // Diagnostic: change the collapse of some events
                triggers: ['ui_diag_setCollapseStatus']
                ,method: function(e){
                    var collapseInfo = this.get('urlsDiagnosticStatusCollapseInfo')

                    collapseInfo[e.data.status] = e.data.value

                    this.update('urlsDiagnosticStatusCollapseInfo', collapseInfo)
                }
            },{
                // Diagnostic: when the diagnostic is updated, if it is complete, finalize
                triggers:['diagnostic_byUrl_updated']
                ,method: function(e){
                    var diagnostic_byUrl = this.get('diagnostic_byUrl')
                    if(d3.keys(diagnostic_byUrl).length > 0){
                        var complete = true
                        for(url in diagnostic_byUrl){
                            var diag = diagnostic_byUrl[url]
                            if(diag.added){
                                // OK
                            } else if(diag.cancelled){
                                // OK
                            } else if(diag.status == 'warning'){
                                complete = false
                            } else if(diag.status == 'exists'){
                                // OK
                            } else if(diag.status == 'merge'){
                                // OK
                            } else if(diag.status == 'error'){
                                // OK
                            } else {
                                // Pending...
                                complete = false
                            }
                        }
                        if(complete){
                            this.update('diagnosticComplete', true)
                        }
                    }
                }
            },{
                // Diagnostic: finalize
                triggers:['urlDiag_finalize']
                ,method: function(e){

                    // Clear the input field
                    this.update('urlslistText', '')
                    
                    // Clear candidate URLs
                    this.update('candidateUrls', undefined)

                    // Clear diagnostic
                    this.update('diagnostic_byUrl', {})
                    this.update('diagnosticComplete', false)

                    // Reset the state
                    this.update('urlsDiagnosticActiveState', false)
                }
            }
        ]
    })

    

    //// Modules

    // Tempo module
    D.addModule(dmod.Tempo)

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
        ,contentTriggerEvent: 'urlslistText_updated'
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
            ,infoContainer = $('#urlsDiagInfoPanel')

        var initialize = function(provider){
            infoContainer.html('<p class="text-info"><i class="icon-hand-left"></i> We are verifying the URLs</p>')
        }

        this.triggers.events['candidateUrls_updated'] = function(provider, e) {
            var urls = provider.get('candidateUrls')
            if(urls && urls.length > 0){
                container.html('')
                    .append(
                            urls.map(function(url){
                                var pendingMessage = "Waiting..."
                                return $('<div class="urlCandidateBlock" data-url-md5="'+$.md5(url)+'"/>')
                                    .append($('<table/>')
                                        .append($('<col span="1"/>'))
                                        .append($('<col span="1" class="wide"/>'))
                                        .append($('<tr/>')
                                            .append($('<td/>')
                                                .append($('<div class="url"/>')
                                                    .append($('<span/>')
                                                            .text(url)
                                                        )
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
        }

        this.triggers.events['urlDiag_initialized'] = function(provider, e){
            var url = e.data.url
                ,url_md5 = $.md5(url)
                ,pendingMessage = "Check prepared..."
            container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress progress-striped progress-info"><div class="bar" style="width: 100%;">'+pendingMessage+'</div></div>')
        }

        this.triggers.events['urlDiag_prefixCheckPending'] = function(provider, e){
            var url = e.data.url
                ,url_md5 = $.md5(url)
                ,pendingMessage = "Prefix analyze pending..."
            container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress progress-striped progress-info active"><div class="bar" style="width: 100%;">'+pendingMessage+'</div></div>')
        }

        this.triggers.events['urlDiag_prefixChecked'] = function(provider, e){
            var url = e.data.url
                ,diagnostic_byUrl = provider.get('diagnostic_byUrl')
                ,diag = diagnostic_byUrl[url]
                ,url_md5 = diag.url_md5
                ,done = (d3.keys(diag.webEntityId_byPrefixUrl)).length
                ,total = diag.prefixCandidates.length
                ,pendingMessage = done+'/'+total+' prefix'
                ,percent = Math.round(100*done/total)

            if(done < total){
                container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress"><div class="bar" style="width: '+percent+'%;">'+pendingMessage+'</div></div></div>')
            } else {
                container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;">Diagnostic pending...</div></div>')
            }
        }

        updateDiagnosticSummary = function(provider, e){
            var diagnostic_byUrl = provider.get('diagnostic_byUrl')
                ,collapseInfo = provider.get('urlsDiagnosticStatusCollapseInfo')
                ,summary = {
                    pending: 0
                    ,added: 0
                    ,cancelled: 0
                    ,existing: 0
                    ,toBeChecked: 0
                    ,toBeCheckedUrls: []
                    ,conflict: 0
                    ,error: 0
                }
            for(url in diagnostic_byUrl){
                var diag = diagnostic_byUrl[url]
                if(diag.added){
                    summary.added++
                } else if(diag.cancelled){
                    summary.cancelled++
                } else if(diag.status == 'warning'){
                    summary.toBeChecked++
                    summary.toBeCheckedUrls.push(url)
                } else if(diag.status == 'exists'){
                    summary.existing++
                } else if(diag.status == 'merge'){
                    summary.conflict++
                } else if(diag.status == 'error'){
                    summary.error++
                } else {
                    summary.pending++
                }
            }
            infoContainer.html('')
            if(summary.added > 0 || summary.existing > 0){
                var el = $('<div class="text-success"/>')
                if(summary.added == 0){
                    el.html(summary.existing + ' web entit' + ((summary.existing>1)?('ies'):('y')) + ' <strong>already exist' + ((summary.existing>1)?(''):('s')) + '</strong> <a class="diag-collapse"  data-collapse-status="exists"/>')
                } else if(summary.existing == 0){
                    el.html(summary.added + ' web entit' + ((summary.added>1)?('ies'):('y')) + ' <strong>added</strong> <a class="diag-collapse"  data-collapse-status="added"/>')
                } else {
                    el.html(summary.added + ' web entit' + ((summary.added>1)?('ies are'):('y is')) + ' <strong>added</strong> <a class="diag-collapse"  data-collapse-status="added"/> while ' + summary.existing + ' <strong>already exist' + ((summary.existing>1)?(''):('s')) + '</strong> <a class="diag-collapse"  data-collapse-status="exists"/>')
                }
                infoContainer.append(
                    $('<div class="summary summary-success"/>').append(el)
                )
            }
            if(summary.conflict > 0 || summary.error > 0){
                var el = $('<div class="text-error"/>')
                if(summary.conflict == 0){
                    el.html(summary.error + ' URL' + ((summary.error>1)?('s have'):(' has')) + ' an <strong>error</strong> <a class="diag-collapse"  data-collapse-status="error"/>')
                } else if(summary.error == 0){
                    el.html(summary.conflict + ' URL' + ((summary.conflict>1)?('s have'):(' has')) + ' a <strong>conflict</strong> <a class="diag-collapse"  data-collapse-status="merge"/>')
                } else {
                    el.html(summary.conflict + ' URL' + ((summary.conflict>1)?('s have'):(' has')) + ' a <strong>conflict</strong> <a class="diag-collapse"  data-collapse-status="merge"/> and ' + summary.error + ((summary.cancelled>1)?(' have'):(' has')) + ' an <strong>error</strong> <a class="diag-collapse"  data-collapse-status="error"/>')
                }
                infoContainer.append(
                    $('<div class="summary summary-error"/>').append(el)
                )
            }
            if(summary.toBeChecked > 0){
                var el = $('<div class="text-info"/>')
                el.html(summary.toBeChecked + ' URL' + ((summary.toBeChecked>1)?('s <strong>need'):(' <strong>needs')) + ' a check</strong> <a class="diag-collapse"  data-collapse-status="warning"/>')
                el.append(
                        $('<div class="pull-right"/>').append($('<span> </span>'))
                            .append(
                                    $('<a class="btn btn-mini">Add all</a>')
                                        .click(function(){
                                                summary.toBeCheckedUrls.forEach(function(url){
                                                    _self.dispatchEvent('ui_diag_checkAdd', {url:url})
                                                })
                                            })
                                )
                            .append($('<span> </span>'))
                            .append(
                                    $('<a class="btn btn-mini">Cancel all</a>')
                                        .click(function(){
                                                summary.toBeCheckedUrls.forEach(function(url){
                                                    _self.dispatchEvent('ui_diag_checkCancel', {url:url})
                                                })
                                            })
                                )
                    )
                infoContainer.append(
                    $('<div class="summary summary-info"/>').append(el)
                )
            }
            if(summary.cancelled > 0){
                var el = $('<div class="muted"/>')
                el.html(summary.cancelled + ' URL' + ((summary.cancelled>1)?('s are'):(' is')) + ' <strong>cancelled</strong> <a class="diag-collapse"  data-collapse-status="cancelled"/>')
                infoContainer.append(
                    $('<div class="summary"/>').append(el)
                )
            }
            if(summary.pending > 0){
                var el = $('<div class="muted"/>')
                el.html(summary.pending + ' URL' + ((summary.pending>1)?('s are'):(' is')) + ' still <strong>in progress</strong> <a class="diag-collapse"  data-collapse-status="pending"/>')
                infoContainer.append(
                    $('<div class="summary"/>').append(el)
                )
            }

            // Draw the finalize button
            if(provider.get('diagnosticComplete')){
                infoContainer.append(
                    $('<a class="btn btn-block">Done</a>').click(function(){
                        _self.dispatchEvent('urlDiag_finalize')
                    })
                )
            } else {
                infoContainer.append(
                    $('<center class="muted">Please add or cancel all URLs to finalize the process</center>')
                )
            }

            // Update the show/hide elements
            infoContainer.find('a.diag-collapse').each(function(i, A){
                var a = $(A)
                    ,diagCollapseStatus = a.attr('data-collapse-status')
                a.addClass('overable')
                    .html('<small class="muted">('+((collapseInfo[diagCollapseStatus])?('show'):('hide'))+')</small>')
                    .click(function(){
                        _self.dispatchEvent('ui_diag_setCollapseStatus', {
                            status: diagCollapseStatus
                            ,value: !collapseInfo[diagCollapseStatus]
                        })
                    })
            })
        }

        this.triggers.events['urlDiag_diagnosticBuilt'] = function(provider, e){
            var url = e.data.url
                ,diagnostic_byUrl = provider.get('diagnostic_byUrl')
                ,collapseInfo = provider.get('urlsDiagnosticStatusCollapseInfo')
                ,diag = diagnostic_byUrl[url]
                ,url_md5 = diag.url_md5

            switch(diag.status){
                
                case 'success':
                    container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress progress-success progress-striped active"><div class="bar" style="width: 100%;">Being added...</div></div>')
                    container.find('div[data-url-md5='+url_md5+']').attr('data-collapse-status', 'pending')
                    if(collapseInfo.pending){
                        container.find('div[data-url-md5='+url_md5+']').addClass('collapsed')
                    }
                    break

                case 'extend':
                    container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress progress-success progress-striped active"><div class="bar" style="width: 100%;">Being added...</div></div>')
                    container.find('div[data-url-md5='+url_md5+']').attr('data-collapse-status', 'extend')
                    if(collapseInfo.extend){
                        container.find('div[data-url-md5='+url_md5+']').addClass('collapsed')
                    }
                    break

                case 'exists':
                    container.find('div[data-url-md5='+url_md5+'] .info').html('')
                        .append(
                                $('<div class="pull-right"/>')
                                    .append(
                                            $('<span class="label label-success">Already existing</span>')
                                        )
                            )
                    container.find('div[data-url-md5='+url_md5+']').attr('data-collapse-status', 'exists')
                    if(collapseInfo.exists){
                        container.find('div[data-url-md5='+url_md5+']').addClass('collapsed')
                    }
                    container.find('div[data-url-md5='+url_md5+']').popover({
                            placement: 'right'
                            ,trigger: 'hover'
                            ,title: 'Already existing'
                            ,content: diag.message
                        })
                    break

                case 'warning':
                    container.find('div[data-url-md5='+url_md5+'] .info').html('')
                        .append(
                                $('<div class="pull-right"/>')
                                    .append(
                                            $('<span class="label label-info">Please check</span>')
                                        )
                                    .append($('<span> </span>'))
                                    .append(
                                            $('<a class="btn btn-mini">Add</a>')
                                                .click(function(){
                                                        _self.dispatchEvent('ui_diag_checkAdd', {url:url})
                                                    })
                                        )
                                    .append($('<span> </span>'))
                                    .append(
                                            $('<a class="btn btn-mini">Cancel</a>')
                                                .click(function(){
                                                        _self.dispatchEvent('ui_diag_checkCancel', {url:url})
                                                    })
                                        )
                            )
                    container.find('div[data-url-md5='+url_md5+']').popover({
                            placement: 'right'
                            ,trigger: 'hover'
                            ,title: 'Please check this URL'
                            ,content: diag.message
                        })
                    container.find('div[data-url-md5='+url_md5+']').attr('data-collapse-status', 'warning')
                    if(collapseInfo.warning){
                        container.find('div[data-url-md5='+url_md5+']').addClass('collapsed')
                    }
                    break

                case 'merge':
                    container.find('div[data-url-md5='+url_md5+'] .info').html('')
                        .append(
                                $('<div class="pull-right"/>')
                                    .append(
                                            $('<span class="label label-important">Conflict</span>')
                                        )
                            )
                    container.find('div[data-url-md5='+url_md5+']').popover({
                            placement: 'right'
                            ,trigger: 'hover'
                            ,title: 'Multiple web entities'
                            ,content: diag.message
                        })
                    container.find('div[data-url-md5='+url_md5+']').attr('data-collapse-status', 'merge')
                    if(collapseInfo.merge){
                        container.find('div[data-url-md5='+url_md5+']').addClass('collapsed')
                    }
                    break
            }

            updateDiagnosticSummary(provider, e)
        }

        this.triggers.events['urlDiag_forceAdd'] = function(provider, e){
            var url = e.data.url
                ,diagnostic_byUrl = provider.get('diagnostic_byUrl')
                ,collapseInfo = provider.get('urlsDiagnosticStatusCollapseInfo')
                ,diag = diagnostic_byUrl[url]
                ,url_md5 = diag.url_md5

            container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress progress-success progress-striped active"><div class="bar" style="width: 100%;">Being added...</div></div>')
            container.find('div[data-url-md5='+url_md5+']').popover('disable')
            container.find('div[data-url-md5='+url_md5+']').attr('data-collapse-status', 'pending')
            if(collapseInfo.pending){
                container.find('div[data-url-md5='+url_md5+']').addClass('collapsed')
            }


            updateDiagnosticSummary(provider, e)
        }

        this.triggers.events['urlDiag_cancel'] = function(provider, e){
            var url = e.data.url
                ,diagnostic_byUrl = provider.get('diagnostic_byUrl')
                ,collapseInfo = provider.get('urlsDiagnosticStatusCollapseInfo')
                ,diag = diagnostic_byUrl[url]
                ,url_md5 = diag.url_md5

            container.find('div[data-url-md5='+url_md5+'] .info').html('')
                .append(
                        $('<div class="pull-right"/>')
                            .append(
                                    $('<span class="label label-inverse">Cancelled</span>')
                                )
                    )
            container.find('div[data-url-md5='+url_md5+']').popover('disable')
            container.find('div[data-url-md5='+url_md5+']').attr('data-collapse-status', 'cancelled')
            if(collapseInfo.cancelled){
                container.find('div[data-url-md5='+url_md5+']').addClass('collapsed')
            }

            updateDiagnosticSummary(provider, e)
        }

        this.triggers.events['urlDiag_webentityAdded'] = function(provider, e){
            var url = e.data.url
                ,diagnostic_byUrl = provider.get('diagnostic_byUrl')
                ,collapseInfo = provider.get('urlsDiagnosticStatusCollapseInfo')
                ,diag = diagnostic_byUrl[url]
                ,url_md5 = diag.url_md5

            if(diag.status == 'error'){
                container.find('div[data-url-md5='+url_md5+'] .info').html('')
                    .append(
                            $('<div class="pull-right"/>')
                                .append(
                                        $('<span class="label label-important">Error</span>')
                                    )
                        )
                container.find('div[data-url-md5='+url_md5+']').popover({
                        placement: 'right'
                        ,trigger: 'hover'
                        ,title: 'Error'
                        ,content: diag.errorMessage
                    })
                container.find('div[data-url-md5='+url_md5+']').attr('data-collapse-status', 'error')
                if(collapseInfo.error){
                    container.find('div[data-url-md5='+url_md5+']').addClass('collapsed')
                }
            } else {
                container.find('div[data-url-md5='+url_md5+'] .info').html('<div class="progress progress-success"><div class="bar" style="width: 100%;">Added</div></div>')
                container.find('div[data-url-md5='+url_md5+']').attr('data-collapse-status', 'added')
                if(collapseInfo.added){
                    container.find('div[data-url-md5='+url_md5+']').addClass('collapsed')
                }
            }

            updateDiagnosticSummary(provider, e)
        }

        this.triggers.events['urlsDiagnosticStatusCollapseInfo_updated'] = function(provider, e){
            var collapseInfo = provider.get('urlsDiagnosticStatusCollapseInfo')
            for(status in collapseInfo){
                var elements = container.find('[data-collapse-status='+status+']')
                if(collapseInfo[status]){
                    elements.addClass('collapsed')
                } else {
                    elements.removeClass('collapsed')
                }
            }

            updateDiagnosticSummary(provider, e)
        }

        this.triggers.events['diagnosticComplete_updated'] = function(provider, e){
            updateDiagnosticSummary(provider, e)
        }

        initialize()
    })
    
    // "To be crawled" module
    D.addModule(function(){
        domino.module.call(this)

        var _self = this
            ,container = $('#toBeCrawled_content')

        this.triggers.events['webentities_updated'] = function(provider, e){
            var webentities = provider.get('webentities')
                ,uncrawled_webentities = webentities.filter(function(we){
                        return we.status == "IN"
                            && we.crawling_status == "UNCRAWLED"
                    })
            container.html('')
            uncrawled_webentities.forEach(function(we){
                container.append(
                        $('<div class="toBeCrawledBlock"/>')
                            .append(
                                    $('<p/>').text(we.name)
                                )
                            .append(
                                    $('<p/>').append(
                                        $('<span class="label label-info"/>').text('Test test')
                                    )
                                )
                    )
            })
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