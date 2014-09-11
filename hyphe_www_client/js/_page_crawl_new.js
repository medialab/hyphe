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
                ,type: 'array'
                ,value: []
            },{
                id:'webentitiesById'
                ,dispatch: 'webentitiesById_updated'
                ,triggers: 'update_webentitiesById'
                ,type: 'object'
                ,value: {}
            },{
                id:'currentWebentity'
                ,dispatch: 'currentWebentity_updated'
                ,triggers: 'update_currentWebentity'
            },{
                id:'webentitiesselectorDisabled'
                ,dispatch: 'webentitiesselectorDisabled_updated'
                ,triggers: 'update_webentitiesselectorDisabled'
                ,type:'boolean'
                ,value:true
            },{
                id:'urldeclarationInvalid'
                ,dispatch: 'urldeclarationInvalid_updated'
                ,triggers: 'update_urldeclarationInvalid'
                ,type:'boolean'
                ,value:true
            },{
                id:'hidePrefixes'
                ,dispatch: 'hidePrefixes_updated'
                ,triggers: 'update_hidePrefixes'
                ,type:'boolean'
                ,value:true
            },{
                id:'startpagesMessageObject'
                ,dispatch: 'startpagesMessageObject_updated'
                ,triggers: 'update_startpagesMessageObject'
                ,value: {display: false}
            },{
                id:'addstartpageValidation'
                ,dispatch: 'addstartpageValidation_updated'
                ,triggers: 'update_addstartpageValidation'
                
            },{
                id:'removestartpageValidation'
                ,dispatch: 'removestartpageValidation_updated'
                ,triggers: 'update_removestartpageValidation'
                
            },{
                id:'lookedupUrl'
                ,dispatch: 'lookedupUrl_updated'
                ,triggers: 'update_lookedupUrl'
                
            },{
                id:'urllookupValidation'
                ,dispatch: 'urllookupValidation_updated'
                ,triggers: 'update_urllookupValidation'
            },{
                id:'crawlsettingsInvalid'
                ,dispatch: 'crawlsettingsInvalid_updated'
                ,triggers: ['update_crawlsettingsInvalid', 'update_crawlLaunchState']
                ,type:'boolean'
                ,value:true
            },{
                id:'launchcrawlMessageObject'
                ,dispatch: 'launchcrawlMessageObject_updated'
                ,triggers: ['update_launchcrawlMessageObject', 'update_crawlLaunchState']
                ,value: {html:'You must <strong>pick a web entity</strong> or declare a new one', bsClass:'alert-info', display: true}
            },{
                id:'crawlValidation'
                ,dispatch: 'crawlValidation_updated'
                ,triggers: 'update_crawlValidation'
            },{
                id:'prefixCandidates'
                ,dispatch: 'prefixCandidates_updated'
                ,triggers: 'update_prefixCandidates'
            },{
                id:'pendingStartPage'
                ,type: 'string'
                ,value: ''
                ,dispatch: 'pendingStartPage_updated'
                ,triggers: 'update_pendingStartPage'
            }
        ]


        ,services: [
            {
                id: 'getWebentities'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [
                            settings.id_list    // List of webentities
                            ,(settings.light && !settings.semilight) || false
                            ,settings.semilight || false
                            ,"name"             // sort order
                            ,50000              // max results
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
                ,success: function(data, input){
                    var webentitiesUpdated = data[0].result
                        ,webentities_byId = this.get('webentitiesById')
                    if (!input.id_list) webentitiesUpdated = webentitiesUpdated.webentities
                    webentitiesUpdated.forEach(function(we){
                        webentities_byId[we.id] = we
                    })
                    var webentities = d3.values(webentities_byId)
                    this.update('webentities', webentities)
                    this.update('webentitiesById', webentities_byId)

                    // If the update comes from current web entity, then update it
                    if(input.current){
                        this.update('currentWebentity', webentitiesUpdated[0])
                    }
                }
            },{
                id: 'declarePage'
                ,setter: 'currentWebentity'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.PAGE.DECLARE,
                        'params' : [settings.url],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'addStartPage'
                ,setter: 'addstartpageValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.STARTPAGE.ADD,
                        'params' : [
                            settings.webentityId
                            ,settings.url
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'removeStartPage'
                ,setter: 'removestartpageValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.STARTPAGE.REMOVE,
                        'params' : [
                            settings.webentityId
                            ,settings.url
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'urlLookup'
                ,setter: 'urllookupValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.URL_LOOKUP,
                        'params' : [
                            settings.url
                            ,settings.timeout
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'crawl'
                ,setter: 'crawlValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.CRAWL,
                        'params' : [
                            settings.webentityId
                            ,settings.maxDepth
                            ,document.getElementById("phantom").checked
                        ],
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
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )
                        this.dispatchEvent('callback_webentityFetched', {
                                webentityId: undefined
                                ,message: 'RPC error'
                                ,url: input.url
                            })

                        rpc_error(data, xhr, input)
                    }
                ,expect: function(data, input, serviceOptions){
                        return (data.length>0 && data[0].code == 'fail') || rpc_expect(data, input, serviceOptions)
                    }
                ,success: function(data, input){
                        if(data[0].code == 'fail'){
                            this.dispatchEvent('callback_webentityFetched', {
                                webentityId: undefined
                                ,message: 'no match'
                                ,url: input.url
                            })
                        } else {
                            var we = data[0].result
                                ,webentities = this.get('webentities')
                                ,webentities_byId = this.get('webentitiesById')
                                
                            webentities_byId[we.id] = we
                            var webentities = d3.values(webentities_byId)
                            this.update('webentities', webentities)
                            this.update('webentitiesById', webentities_byId)

                            this.dispatchEvent('callback_webentityFetched', {
                                webentityId: we.id
                                ,url: input.url
                            })
                        }
                    }
            },{
                id: 'webentityAddPrefix'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.PREFIX.ADD,
                        'params' : [
                            settings.webentityId
                            ,settings.lru
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, error: rpc_error, expect: rpc_expect
                ,success: function(data, input){
                        this.dispatchEvent('callback_prefixAdded', {
                            webentityId: input.webentityId
                            ,lru: input.lru
                        })
                    }
            },{
                id: 'webentityMerge'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.MERGE,
                        'params' : [
                            settings.oldWebentityId
                            ,settings.goodWebentityId
                            ,false   // Include tags
                            ,false   // Include Home and Startpages as Startpages
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
                ,success: function(data, input){
                        this.dispatchEvent('callback_webentityMerged', {
                            webentityId: input.goodWebentityId
                        })
                    }
            }
        ]


        ,hacks:[
            {
                // Registering events
                triggers: ['ui_addPrefix']
            },{
                // Enable the selector when the web entities are updated
                triggers: ['webentities_updated']
                ,method: function(){
                    this.dispatchEvent('update_webentitiesselectorDisabled', {
                        webentitiesselectorDisabled: false
                    })
                }
            },{
                // On web entity selected in UI, update current web entity
                triggers: ['ui_webentitySelected']
                ,method: function(){
                    var current_we_id = $('#webentities_selector').val()
                    this.dispatchEvent('request_updateCurrentWebentity', {currentWebentityId: current_we_id})
                }
            },{
                // On web entity declared in UI (by URL pasted), declare a page
                triggers: ['ui_webentityDeclared']
                ,method: function(){
                    if(!this.get('urldeclarationInvalid')){
                        this.request('declarePage', {
                            url: Utils.URL_reEncode($('#urlField').val())
                        })
                    }
                }
            },{
                // Selecting a web entity shows the prefixes
                triggers: ['currentWebentity_updated']
                ,method: function(){
                    this.dispatchEvent('update_hidePrefixes', {
                        hidePrefixes: false
                    })
                }
            },{
                // Start page message hidden when a new web entity is selected or declared
                triggers: ['ui_webentitySelected', 'ui_webentityDeclared']
                ,method: function(){
                    this.dispatchEvent('update_startpagesMessageObject', {
                        startpagesMessageObject: {text:'', display:false, bsClass:'', }
                    })
                }
            },{
                // Start page message displayed when clicking on "Use prefixes as start pages"
                triggers: ['ui_usePrefixesAsStartPages']
                ,method: function(){
                    this.dispatchEvent('update_startpagesMessageObject', {
                        startpagesMessageObject: {text:'Use prefixes as start pages...', display:true, bsClass:'alert-info', }
                    })
                }
            },{
                // Start page message displayed when one or more start pages added
                triggers: ['addstartpageValidation_updated']
                ,method: function(){
                    this.dispatchEvent('update_startpagesMessageObject', {
                        startpagesMessageObject: {text:'Start page(s) added', display:true, bsClass:'alert-success', }
                    })
                }
            },{
                // Start page message displayed when pages removed
                triggers: ['removestartpageValidation_updated']
                ,method: function(){
                    this.dispatchEvent('update_startpagesMessageObject', {
                        startpagesMessageObject: {text:'Start page removed', display:true, bsClass:'alert-success', }
                    })
                }
            },{
                // Clicking on "Use prefixes as start pages" triggers a remote action
                triggers: ['ui_usePrefixesAsStartPages']
                ,method: function(){
                    var we = this.get('currentWebentity')
                        ,_self = this
                    if(we !== undefined){
                        we.lru_prefixes.forEach(function(lru_prefix){
                            _self.request('addStartPage', {
                                webentityId: we.id
                                ,url: Utils.LRU_to_URL(lru_prefix)
                            })
                        })
                    }
                }
            },{
                // If the start pages are modified, reload the current web entity
                triggers: ['addstartpageValidation_updated', 'removestartpageValidation_updated']
                ,method: function(){
                    var we = this.get('currentWebentity')
                    if(we !== undefined)
                        this.dispatchEvent('request_updateCurrentWebentity', {currentWebentityId: we.id})
                }
            },{
                // On URL lookup demanded, store the URL and do the lookup
                triggers: ['lookupUrl']
                ,method: function(d){
                    this.dispatchEvent('update_lookedupUrl', {
                        lookedupUrl: d.data.url
                    })
                    this.request('urlLookup', {
                        url: d.data.url
                        ,timeout: 30
                    })
                }
            },{
                // On 'add start page' button clicked, validate
                triggers: ['ui_addStartpage']
                ,method: function(){
                    var url = Utils.URL_reEncode(Utils.URL_fix($('#startPages_urlInput').val()))
                    if(url=='' || url === undefined){                           // No start page: do nothing
                    } else if(!Utils.URL_validate(url)){                        // The URL is invalid: display a message
                        this.dispatchEvent('update_startpagesMessageObject', {
                            startpagesMessageObject: {html:'<strong>Invalid URL.</strong> This string is not recognized as an URL. Check that it begins with "http://".', display:true, bsClass:'alert-error', }
                        })
                    } else {                                                    // Check that the start page is in one of the LRU prefixes
                        var lru = Utils.URL_to_LRU(url)
                            ,lru_valid = false
                            ,we = this.get('currentWebentity')
                        we.lru_prefixes.forEach(function(lru_prefix){
                            if(lru.indexOf(lru_prefix) == 0)
                                lru_valid = true
                        })
                        if(!lru_valid){                                         // The start page does not belong to any LRU_prefix: trigger the resolution process
                            this.dispatchEvent('update_startpagesMessageObject', {
                                startpagesMessageObject: {html:'<strong>Invalid start page.</strong> This page does not belong to the web entity.', display:true, bsClass:'alert-error', }
                            })
                            this.dispatchEvent('lru_invalid', {lru: lru})
                        } else {                                                // It's OK: display a message and request the service
                            this.dispatchEvent('update_startpagesMessageObject', {
                                startpagesMessageObject: {text:'Adding the start page...', display:true, bsClass:'alert-info', }
                            })
                            this.request('addStartPage', {
                                webentityId: we.id
                                ,url: url
                            })
                        }
                    }
                }
            },{
                // On current web entity load, if there is a pending start page (from LRU invalid resolution), validate and add it
                triggers: ['currentWebentity_updated']
                ,method: function(){
                    var lru = this.get('pendingStartPage')

                    if(lru=='' || lru === undefined){                           // No pending start page: do nothing
                    } else {                                                    // Check that the start page is in one of the LRU prefixes
                        var lru_valid = false
                            ,we = this.get('currentWebentity')
                        we.lru_prefixes.forEach(function(lru_prefix){
                            if(lru.indexOf(lru_prefix) == 0)
                                lru_valid = true
                        })
                        if(!lru_valid){                                         // The start page does not belong to any LRU_prefix: trigger the resolution process
                            this.dispatchEvent('update_startpagesMessageObject', {
                                startpagesMessageObject: {html:'<strong>Invalid start page.</strong> This page does not belong to the web entity.', display:true, bsClass:'alert-error', }
                            })
                            this.dispatchEvent('lru_invalid', {lru: lru})
                        } else {                                                // It's OK: display a message and request the service
                            this.dispatchEvent('update_startpagesMessageObject', {
                                startpagesMessageObject: {text:'Adding the start page...', display:true, bsClass:'alert-info', }
                            })
                            this.request('addStartPage', {
                                webentityId: we.id
                                ,url: Utils.LRU_to_URL(lru)
                            })
                        }
                    }
                    this.update('pendingStartPage', '')
                }
            },{
                // On 'remove start page' clicked, display message and request the service
                triggers: ['ui_removeStartPage']
                ,method: function (d) {
                    this.dispatchEvent('update_startpagesMessageObject', {
                        startpagesMessageObject: {text:'Removing the start page...', display:true, bsClass:'alert-info', }
                    })
                    we = this.get('currentWebentity')
                    this.request('removeStartPage', {
                        webentityId: we.id
                        ,url: d.data.url
                    })
                }
            },{
                // Each time the settings change, test if the crawl can ben launched or not.
                // We dispatch the state of the launch button and the message.
                triggers: ['currentWebentity_updated', 'startpagesChecked', 'ui_depthChange']
                ,method: function(){
                    var we = this.get('currentWebentity')
                    if(we === undefined){
                        // No web entity selected
                        this.dispatchEvent('update_crawlLaunchState', {
                            launchcrawlMessageObject: {html:'You must <strong>pick a web entity</strong> or declare a new one', bsClass:'alert-info', display: true}
                            ,crawlsettingsInvalid: true
                        })
                    } else {
                        if(we.startpages === undefined || we.startpages.length == 0){
                            // There is a web entity but there are no starting pages
                            this.dispatchEvent('update_crawlLaunchState', {
                                launchcrawlMessageObject: {html:'<strong>No start page.</strong> You must define on which page the crawler will start', bsClass:'alert-error', display: true}
                                ,crawlsettingsInvalid: true
                            })
                        } else {
                            if($('.startPage_tr td a.unchecked').length > 0){
                                // Waiting for start pages validation
                                this.dispatchEvent('update_crawlLaunchState', {
                                    launchcrawlMessageObject: {text:'Waiting for start pages validation...', bsClass:'alert-info', display: true}
                                    ,crawlsettingsInvalid: true
                                })
                            } else if($('.startPage_tr td a.invalid').length > 0){
                                // There are some invalid start pages
                                this.dispatchEvent('update_crawlLaunchState', {
                                    launchcrawlMessageObject: {html:'<strong>Invalid start pages.</strong> Please check that start pages are not redirected and are actually working.', bsClass:'alert-warning', display: true}
                                    ,crawlsettingsInvalid: true
                                })
                            } else {
                                // There is a web entity and it has valid start pages
                                var maxdepth = $('#depth').val()
                                if(!Utils.checkforInteger(maxdepth)){
                                    // The depth is not an integer
                                    this.dispatchEvent('update_crawlLaunchState', {
                                        launchcrawlMessageObject: {html:'<strong>Wrong depth.</strong> The maximum depth must be an integer', bsClass:'alert-error', display: true}
                                        ,crawlsettingsInvalid: true
                                    })
                                } else {
                                    // Everything's OK !
                                    this.dispatchEvent('update_crawlLaunchState', {
                                        launchcrawlMessageObject: {display: false}
                                        ,crawlsettingsInvalid: false
                                    })
                                }
                            }
                        }
                    }
                }
            },{
                // Launch crawl on event
                triggers:['ui_launchCrawl']
                ,method: function(){
                    var we = this.get('currentWebentity')
                        ,maxdepth = $('#depth').val()
                    if(we !== undefined && Utils.checkforInteger(maxdepth)){
                        this.request('crawl', {
                            webentityId: we.id
                            ,maxDepth: maxdepth
                        })
                    }
                }
            },{
                // Redirection on crawl launched
                triggers: ['crawlValidation_updated']
                ,method: function(){
                    window.location = "crawl.php"
                }
            },{
                // Request web entities LIGHT
                triggers: ['requestWebentitiesLight']
                ,method: function(){
                    this.request('getWebentities', {
                        light: true
                    })
                }
            },{
                // Update current web entity (we may need to get the full content)
                triggers: ['request_updateCurrentWebentity']
                ,method: function(e){
                    this.request('getWebentities', {
                        id_list: [e.data.currentWebentityId]
                        ,current: true
                    })
                }
            },{
                // When prefix candidates are updated, fetch web entities
                triggers:['prefixCandidates_updated']
                ,method: function(e){
                    var lrus = this.get('prefixCandidates')
                        ,_self = this
                    lrus.forEach(function(lru){
                        _self.request('fetchWebEntityByURL', {
                            url: Utils.LRU_to_URL(lru)
                        })
                    })
                }
            },{
                // Request adding a LRU prefix to current web entity
                triggers: ['request_currentWebentityAddPrefix']
                ,method: function(e){
                    var currentWebentity = this.get('currentWebentity')
                    this.request('webentityAddPrefix', {
                        webentityId: currentWebentity.id
                        ,lru: e.data.lru
                    })

                }
            },{
                // When a prefix has been added or a merge has been done, reload current web entity
                triggers: ['callback_prefixAdded', 'callback_webentityMerged']
                ,method: function(e){
                    var we = this.get('currentWebentity')
                    this.dispatchEvent('request_updateCurrentWebentity', {
                        currentWebentityId: we.id
                    })
                }
            },{
                // Request the merge of another web entity in this one
                triggers: ['request_currentWebentityMerge']
                ,method: function(e){
                    var currentWebentity = this.get('currentWebentity')
                    this.request('webentityMerge', {
                        oldWebentityId: e.data.webentityId
                        ,goodWebentityId: currentWebentity.id
                    })
                }
            }
        ]
    })



    //// Modules

    // Selector of web entities
    D.addModule(dmod.Selector_bigList, [{
        element: $('#webentities_selector')
        ,placeholder: 'Select an existing web entity'
        ,data_property: 'webentities'
        ,item_wrap: function(webEntity){
            return {id:webEntity.id, text:webEntity.name}
        }
        ,disabled_property: 'webentitiesselectorDisabled'
        ,selected_property: 'currentWebentity'
        ,dispatch: 'ui_webentitySelected'
    }])

    // Button for webentity declaration
    D.addModule(dmod.Button, [{
        element: $('#webEntityByURL_button')
        ,disabled_property: 'urldeclarationInvalid'
        ,dispatch: 'ui_webentityDeclared'
    }])

    // Input for web entity declaration
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#urlField')
            ,_self = this

        element.on('keyup', function(e){
            if(e.keyCode == 13){
                // Enter key pressed
                if(!_self.get('urldeclarationInvalid')){
                    _self.dispatchEvent('ui_webentityDeclared', {})
                    element.blur()
                }
            } else {
                var url = Utils.URL_reEncode(element.val())
                // Validation
                _self.dispatchEvent('update_urldeclarationInvalid', {
                    urldeclarationInvalid: !Utils.URL_validate(url)
                })
            }
        })
    })

    // Web entity names
    D.addModule(dmod.TextContent, [{
        element: $('span[data-text-content="webentity_name"]')
        ,property: 'currentWebentity'
        ,property_wrap: function(we){return we.name}
        ,triggers: 'currentWebentity_updated'
    }])

    // LRU prefixes
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#webEntities_prefixes')

        this.triggers.events['currentWebentity_updated'] = function(controller) {
            var webEntity = controller.get('currentWebentity')
            element.html('')
            webEntity.lru_prefixes.forEach(function(lru_prefix){
                element.append(
                    $('<tr/>').append(
                        $('<td/>').text(Utils.LRU_to_URL(lru_prefix))
                    ).append(
                        $('<td>').append(
                            $('<a class="btn btn-link btn-mini pull-right"/>')
                                .attr('href', Utils.LRU_to_URL(lru_prefix))
                                .attr('target', 'blank')
                                .append($('<i class="icon-share-alt"/>'))
                        )
                    )
                )
            })
        }
    })

    // LRU prefixes info
    D.addModule(dmod.HideElement, [{
        element: $('#webEntities_prefixes_info')
        ,property: 'hidePrefixes'
    }])

    // Table of start pages
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#startPagesTable')
            ,messagesElement = $('#startPages_messages')
            ,_self = this

        _self.triggers.events['currentWebentity_updated'] = function(controller, e){
            var we = controller.get('currentWebentity')
            if(we !== undefined){
                element.html('')
                if(we.startpages.length>0){
                    displayStartpagesList(we.startpages)
                } else {
                    // No start page: propose to import from LRU_prefixes
                    element.append(
                        $('<tr class="startPage_tr"/>').append(
                            $('<td/>').text('No start page')
                        ).append(
                            $('<td/>').append(
                                $('<button class="btn btn-small pull-right">Use prefixes as start pages</button>').click(function(){
                                    _self.dispatchEvent('ui_usePrefixesAsStartPages', {})
                                })
                            )
                        )
                    )
                        
                }
                $('#startPages_add').removeClass('disabled')
                $('#startPages_urlInput').removeAttr('disabled')
            } else {
                element.html('<tr><td><span class="muted">Choose a web entity</span></td></tr>')
                $('#startPages_add').addClass('disabled')
                $('#startPages_urlInput').attr('disabled', true)
            }
            startPages_cascadeCheck()
            // TODO: Hyphen.view.launchButton_updateState()
        }

        var displayStartpagesList = function(startpages){
            startpages.forEach(function(sp){
                var tr = $('<tr class="startPage_tr"/>')
                element.append(tr)
                tr.append(
                    $('<td/>').append($('<small/>').append($('<a target="_blank" class="unchecked"/>').attr('href',sp).attr('title',sp).text(Utils.URL_remove_http(sp)+' ')))
                )
                if(startpages.length>1){
                    tr.append(
                        $('<td/>').append(
                            $('<button class="close">&times;</button>').click(function(){
                                _self.dispatchEvent('ui_removeStartPage', {
                                    url: sp
                                })
                            })
                        )
                    )
                } else {
                    tr.append($('<td/>'))
                }
            })
        }

        var startPages_cascadeCheck = function(){
            var uncheckedElements = $('.startPage_tr td a.unchecked')
            if(uncheckedElements.length > 0){
                var a = $(uncheckedElements[0])
                    ,url = a.attr('href')
                _self.dispatchEvent('lookupUrl', {url: url})
            } else {
                _self.dispatchEvent('startpagesChecked', {})
            }
        }

        // Lookup result
        this.triggers.events['urllookupValidation_updated'] = function(controller){
            var status = controller.get('urllookupValidation')
                ,url = controller.get('lookedupUrl')
                ,candidate = ''

            $('.startPage_tr td a.unchecked').each(function(i, el){
                if(candidate == '' && $(el).attr('href') == url){
                    candidate = $(el)
                }
            })

            if(candidate != ''){
                // We have a valid target for the update
                candidate.removeClass('unchecked')
                if(status==200){
                    // We have a valid URL
                    candidate.parent().parent().parent().addClass('success')
                    candidate.append($('<i class="icon-ok info_tooltip"/>').attr('title', 'Valid start page').tooltip())
                } else if((status+'').charAt(0) == '3'){
                    // Redirection
                    candidate.addClass('invalid')
                    candidate.parent().parent().parent().addClass('warning')
                    candidate.append($('<i class="icon-warning-sign info_tooltip"/>').attr('title', 'This page has a <strong>redirection</strong>. Please click on the link and use the right URL.').tooltip())
                } else {
                    // Fail
                    candidate.addClass('invalid')
                    candidate.parent().parent().parent().addClass('error')
                    candidate.append($('<i class="icon-warning-sign info_tooltip"/>').attr('title', '<strong>Invalid page.</strong> This URL has no proper page associated. You must use other start pages.').tooltip())
                }
                startPages_cascadeCheck()
            }
            
        }
    })

    // Start pages info messages
    D.addModule(dmod.TextAlert, [{
        element: $('#startPages_messages')
        ,property: 'startpagesMessageObject'
    }])

    // Input for adding a start page
    D.addModule(function(){
        domino.module.call(this)
        var element = $('#startPages_urlInput')
            ,_self = this
        element.on('keyup', function(e){
            if(e.keyCode == 13){ // Enter key pressed
                _self.dispatchEvent('ui_addStartpage', {})
                element.blur()
            }
        })
        // It has to be cleaned up at some points
        this.triggers.events['addstartpageValidation_updated', 'currentWebentity_updated'] = function(){
            element.val('')
        }
    })

    // Button to add a start page
    D.addModule(dmod.Button, [{
        element: $('#startPages_add')
        ,dispatch: 'ui_addStartpage'
    }])

    // Launch button
    D.addModule(dmod.Button, [{
        element: $('#launchButton')
        ,disabled_property: 'crawlsettingsInvalid'
        ,label: 'Launch crawl'
        ,label_disabled: 'Launch crawl (not ready)'
        ,bsColor: 'btn-primary'
        ,dispatch: 'ui_launchCrawl'
    }])

    // Launch crawl info messages
    D.addModule(dmod.TextAlert, [{
        element: $('#crawlLaunch_messages')
        ,property: 'launchcrawlMessageObject'
    }])

    // Input for the depth
    D.addModule(function(){
        domino.module.call(this)
        var element = $('#depth')
        element.on('keyup', function(e){
            D.dispatchEvent('ui_depthChange', {})
        })
    })

    // Hash and history module
    D.addModule(function(){
        domino.module.call(this)

        var _self = this
        // Update hash on web entity selection
        /*this.triggers.events['currentWebentity_updated'] = function(){
            var we = D.get('currentWebentity')
            if(we === undefined)
                Utils.hash.remove('we_id')
            else
                Utils.hash.add({we_id:we.id})
        }*/

        // Update web entity selection by hash, on web entities update (ie. on load)
        this.triggers.events['webentities_updated'] = function(e){
            var we_id = Utils.hash.get('we_id')
                ,we = e.get('currentWebentity')
            if(we_id !== undefined && we === undefined){
                var webentities = D.get('webentities')
                    ,we = fetchWebentity_byId(webentities, we_id)
                if(we !== undefined){
                    _self.dispatchEvent('request_updateCurrentWebentity', {
                        currentWebentityId: we.id
                    })
                }
            }
        }

        // Updating web entity selection on history change
        window.onpopstate = function(event) {
            var we_id = Utils.hash.get('we_id')
            if(we_id && we_id!=''){
                var webentities = D.get('webentities')
                    ,we = fetchWebentity_byId(webentities, we_id)
                if(we !== undefined){
                    _self.dispatchEvent('request_updateCurrentWebentity', {
                        currentWebentityId: we.id
                    })
                }
            } else {
                // _self.dispatchEvent('request_updateCurrentWebentity', {
                //     currentWebentity: ''
                // })
            }
        }
    })

    // Resolution of a start page proposed out of the web entities
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#modal_resolveInvalidLRU')
            ,_self = this

        var initModal = function(controller, e){
            var prefixListElement = element.find('.list-prefix-suggestions')
                ,lru = e.data.lru
                ,prefixCandidates = HypheCommons.getPrefixCandidates(lru, {
                        wwwlessVariations: (lru.indexOf("|p:") !== -1 ? false : true)
                        ,wwwVariations: false
                        ,httpVariations: false
                        ,httpsVariations: false
                    })
            if(prefixCandidates.length>0){
                element.modal('show')
                element.attr('data-startpage-lru', lru)

                prefixListElement.html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;">Loading...</div></div>')

                _self.dispatchEvent('update_prefixCandidates', {
                    prefixCandidates: prefixCandidates
                })

                $('#button-add-prefix').attr('disabled', true)
            }
        }

        var updateModal = function(controller, e){
            var prefixListElement = element.find('.list-prefix-suggestions')
                ,lrus = controller.get('prefixCandidates')

            prefixListElement.html('')
                .append(
                        lrus.map(function(lru, i){
                            return $('<div/>')
                                .attr('data-url-prefix-md5', $.md5(Utils.LRU_to_URL(lru)))
                                .append(
                                        $('<label class="radio"></label>')
                                            .append(
                                                    $('<input type="radio" name="prefixes" disabled/>')
                                                        .attr('value', lru)
                                                )
                                            .append(
                                                    $('<div class="progress progress-striped active"></div>')
                                                        .append(
                                                                $('<div class="bar" style="width: 100%;"></div>').text('Loading "'+Utils.LRU_to_URL(lru)+'" ...')
                                                            )
                                                )
                                    )
                        })
                    )

        }

        var updateLRU = function(controller, e){
            var url = e.data.url
                ,url_md5 = $.md5(url)
                ,lru = Utils.URL_to_LRU(url)
                ,we_id = e.data.webentityId
                ,lruElement = element.find('div[data-url-prefix-md5='+url_md5+']')
                ,p = $('<p/>')
                ,webentities_byId = controller.get('webentitiesById')
                ,we
                ,prefixAlreadyInUse = false

            if(we_id !== undefined){
                we = webentities_byId[we_id]
                prefixAlreadyInUse = we.lru_prefixes.some(function(we_prefix){
                    return we_prefix == lru
                })
            }

            if(prefixAlreadyInUse){
                p
                    .append(
                            $('<span/>').text(Utils.LRU_to_URL(lru))
                        )
                    .append(
                            $('<span class="text-info"/>').text(' - will merge with:')
                        )
                    .append(
                            $('<p/>').append(
                                        $('<span class="text-info"/>')
                                            .append(
                                                     $('<span class="label"/>').text(we.status)
                                                        .addClass(getStatusColor(we.status))
                                                )
                                            .append(
                                                    $('<strong/>').text(' '+we.name+' ')
                                                )
                                    )
                                
                        )
            } else {
                p.append(
                        $('<span/>').text(Utils.URL_simplify(Utils.LRU_to_URL(lru)))
                    )
            }

            lruElement.html('')
                .append(
                        $('<label class="radio"></label>')
                            .append(
                                    $('<input type="radio" name="prefixes"/>')
                                        .attr('data-webentity-id', ((prefixAlreadyInUse)?(we_id):(undefined)))
                                        .attr('value', lru)
                                )
                            .append(p)
                        .click(function(){
                            $('#button-add-prefix').removeAttr('disabled')
                        })
                    )
            
        }

        var resolve = function(controller){
            if($('#button-add-prefix').attr('disabled') === undefined){
                var lru = element.attr('data-startpage-lru')
                _self.dispatchEvent('update_pendingStartPage', {
                    pendingStartPage: lru
                })

                var checkedElement = element.find('input[name=prefixes]:checked')
                    ,prefix = checkedElement.val()
                    ,we_id = checkedElement.attr('data-webentity-id')
                
                if(we_id === undefined){
                    // Add prefix
                    _self.dispatchEvent('request_currentWebentityAddPrefix', {
                        lru: prefix
                    })
                } else {
                    // Merge web entity
                    _self.dispatchEvent('request_currentWebentityMerge', {
                        webentityId: we_id
                    })
                }

                var prefixListElement = element.find('.list-prefix-suggestions')

                prefixListElement.html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;">Updating web entity...</div></div>')

                $('#button-add-prefix').attr('disabled', true)
            }
        }

        var endModal = function(controller, e){
            var prefixListElement = element.find('.list-prefix-suggestions')
            element.modal('hide')
            element.attr('data-startpage-lru', '')

            prefixListElement.html('')
        }

        // Click on Add Prefix
        $('#button-add-prefix').click(function(e){
            _self.dispatchEvent('ui_addPrefix', {})
        })

        this.triggers.events['lru_invalid'] = initModal
        this.triggers.events['prefixCandidates_updated'] = updateModal
        this.triggers.events['callback_webentityFetched'] = updateLRU
        this.triggers.events['ui_addPrefix'] = resolve
        this.triggers.events['currentWebentity_updated'] = endModal

    })


    //// On load
    $(document).ready(function(){
        var we_id = Utils.hash.get('we_id')
        if(we_id && we_id!=''){
            D.dispatchEvent('request_updateCurrentWebentity', {currentWebentityId: we_id})
        }else{
            D.dispatchEvent('requestWebentitiesLight', {})
        }
    })




    /// Processing
    var fetchWebentity_byId = function(webentities, we_id){
        if(webentities !== undefined){
            var matchings = webentities.filter(function(we_candidate){
                    return we_candidate.id == we_id
                })
            if(matchings.length>0){
                return matchings[0]
            }
        }
        return undefined
    }

    /// Misc
    var getStatusColor = function(status){
        return (status=='DISCOVERED')?('label-warning'):(
                (status=='UNDECIDED')?('label-info'):(
                    (status=='OUT')?('label-important'):(
                        (status=='IN')?('label-success'):('')
                    )
                )
            )
    }

})(jQuery, domino, (window.dmod = window.dmod || {}))
