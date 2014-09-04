HypheCommons.js_file_init()
HypheCommons.domino_init()

// X-Editable: popup mode
$.fn.editable.defaults.mode = 'popup';

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
                id:'cannotFindWebentities'
                ,type: 'boolean'
                ,value: true
                ,dispatch: 'cannotFindWebentities_updated'
                ,triggers: 'update_cannotFindWebentities'
            },{
                id:'urlslistText'
                ,dispatch: 'urlslistText_updated'
                ,triggers: 'update_urlslistText'
            },{
                id:'startUrls'
                ,dispatch: 'startUrls_updated'
                ,triggers: 'update_startUrls'
            },{
                id:'lookedupUrl'
                ,dispatch: 'lookedupUrl_updated'
                ,triggers: 'update_lookedupUrl'
                
            },{
                id:'urllookupValidation'
                ,dispatch: 'urllookupValidation_updated'
                ,triggers: 'update_urllookupValidation'   
            },{
                id:'declaredWebentity'
                ,dispatch: 'declaredWebentity_updated'
                ,triggers: 'update_declaredWebentity'   
            },{
                id:'fetchedUrl'
                ,dispatch: 'fetchedUrl_updated'
                ,triggers: 'update_fetchedUrl'
            },{
                id:'webentities_byId'
                ,dispatch: 'webentities_byId_updated'
                ,triggers: 'update_webentities_byId'   
            },{
                id:'currentWebentityId'
                ,dispatch: 'currentWebentityId_updated'
                ,triggers: 'update_currentWebentityId'   
            },{
                id:'addstartpageValidation'
                ,dispatch: 'addstartpageValidation_updated'
                ,triggers: 'update_addstartpageValidation'   
            },{
                id:'reloadedWebentity'
                ,dispatch: 'reloadedWebentity_updated'
                ,triggers: 'update_reloadedWebentity'   
            },{
                id:'lookups_byUrl'
                ,value: {}
                ,dispatch: 'lookups_byUrl_updated'
                ,triggers: 'update_lookups_byUrl'   
            },{
                id:'crawlJobsScheduled'
                ,value: -1
                ,dispatch: 'crawlJobsScheduled_updated'
                ,triggers: 'update_crawlJobsScheduled'
            },{
                id:'crawlJobsConfirmed'
                ,value: 0
                ,dispatch: 'crawlJobsConfirmed_updated'
                ,triggers: 'update_crawlJobsConfirmed'
            },{
                id:'crawlValidation'
                ,dispatch: 'crawlValidation_updated'
                ,triggers: 'update_crawlValidation'
            }
        ]


        ,services: [
            {
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
                ,data: function(settings){ console.log([
                            settings.url
                            ,settings.timeout
                        ]);return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.URL_LOOKUP,
                        'params' : [
                            settings.url
                            ,settings.timeout
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'declarePage'
                ,setter: 'declaredWebentity'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.PAGE.DECLARE,
                        'params' : [settings.url],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'reloadWebentity'
                ,setter: 'reloadedWebentity'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [
                            [settings.webentityId]    // List of web entities ids
                        ],
                    })}
                ,path:'0.result.0'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'crawl'
                ,setter: 'crawlValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.CRAWL,
                        'params' : [
                            settings.webentityId
                            ,settings.maxDepth
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }
        ]


        ,hacks:[
            {
                // When the text area is typed in, if it is not empty, enable the button 'find web entities'
                triggers: ['urlslistText_updated']
                ,method: function(){
                    var urlslistText = D.get('urlslistText')
                    if(urlslistText !== undefined && urlslistText.length>0){
                        D.dispatchEvent(['update_cannotFindWebentities'], {
                            cannotFindWebentities: false
                        })
                    } else {
                        D.dispatchEvent(['update_cannotFindWebentities'], {
                            cannotFindWebentities: true
                        })
                    }
                }
            },{
                // When the button 'find web entities' is pushed, extract the URLs and dispatch
                triggers: ['ui_findWebentities']
                ,method: function(){
                    var urls = extractWebentities(D.get('urlslistText'))
                        .map(function(url){return Utils.URL_reEncode(Utils.URL_fix(url))})
                    D.dispatchEvent('update_startUrls', {
                        startUrls: urls
                    })
                }
            },{
                // On URL lookup demanded, store the URL and do the lookup
                triggers: ['lookupUrl']
                ,method: function(d){
                    D.dispatchEvent('update_lookedupUrl', {
                        lookedupUrl: d.data.url
                    })
                    D.request('urlLookup', {
                        url: d.data.url
                        ,timeout: 30
                    })
                }
            },{
                // When some url is changed, we cascade lookup
                triggers: ['some_url_updated']
                ,method: function(){
                    cascadeLookup()
                }
            },{
                // On WebEntity fetch demanded, store the URL and fetch
                triggers: ['ui_webentityFetch']
                ,method: function(d){
                    D.dispatchEvent('update_fetchedUrl', {
                        fetchedUrl: d.data.url
                    })
                    D.request('declarePage', {
                        url: d.data.url
                        ,timeout: 5
                    })
                }
            },{
                // When a new webentity is declared, we index it
                triggers: ['declaredWebentity_updated']
                ,method: function(){
                    var webentities_byId = D.get('webentities_byId') || {}
                        ,we = D.get('declaredWebentity')
                    if(we !== undefined && we.id !== undefined){
                        webentities_byId[we.id] = we
                        D.dispatchEvent('update_webentities_byId', {
                            webentities_byId: webentities_byId
                        })
                        D.dispatchEvent('declaredWebentity_indexed', {
                            webentities_byId: webentities_byId
                        })
                    }
                }
            },{
                // On autosearch startpages or webentity reloaded, we look at the start pages and if needed we use the prefix
                triggers: ['ui_startpagesAutosearch', 'startpagesWebentityreloaded']
                ,method: function(d){
                    var we_id = d.data.webentityId
                        ,we = D.get('webentities_byId')[we_id]
                        ,source_url = $('div[data-webentity-id='+we_id+']').parent().parent().find('[data-old-url]').attr('data-old-url')
                        ,scheme = source_url.substring(0, 11)
                        ,startpage = null
                        ,page = null
                        ,divs = $('div[data-webentity-id='+we_id+'] div.crawl-settings')
                        ,i = 0

                    D.dispatchEvent('currentWebentityId_updated', {
                        currentWebentityId: we_id
                    })

                    if(we.startpages.length == 0){
                        divs.html('<span class="text-info">Use prefix...</span>')
                            .attr('data-crawlsettings-status', 'pending')

                        D.dispatchEvent('update_currentWebentityId', {
                            currentWebentityId: we_id
                        })
                        // Use the first prefix starting with the same http/www scheme as input url
                        while (startpage == null && we.lru_prefixes[i]) {
                            page = Utils.LRU_to_URL(we.lru_prefixes[i])
                            if (page.substring(0, 11) === scheme) {
                                startpage = page
                                if(source_url.substring(source_url.length-1) === "/"){
                                    startpage += "/"
                                }
                            }
                            i++
                        }
                        // If no matching startpage found try with the first prefix
                        if (startpage == null) {
                            startpage = Utils.LRU_to_URL(we.lru_prefixes[0])
                        }
                        D.request('addStartPage', {
                            webentityId: we.id
                            ,url: startpage
                        })
                    } else {
                        divs.html('<span>'+we.startpages.length+' start page'+((we.startpages.length>1)?('s'):(''))+' to test</span>')
                            .attr('data-crawlsettings-status', 'startpagestestwaiting')
                        cascadeFetchstartpages()
                    }
                }
            },{
                // When start pages are modified, reload the web entity
                triggers: ['addstartpageValidation_updated']
                ,method: function(){
                    var we_id = D.get('currentWebentityId')
                        ,we = D.get('webentities_byId')[we_id]
                    if(we !== undefined){
                        D.request('reloadWebentity', {webentityId: we_id})
                    } else {
                        alert("we undefined")
                        console.log('we', we)
                    }
                }
            },{
                // When a web entity is reloaded, update the index and trigger
                triggers: ['reloadedWebentity_updated']
                ,method: function(){
                    var webentities_byId = D.get('webentities_byId') || {}
                        ,we = D.get('reloadedWebentity')
                    if(we !== undefined && we.id !== undefined){
                        webentities_byId[we.id] = we
                        D.dispatchEvent('update_webentities_byId', {
                            webentities_byId: webentities_byId
                        })
                        D.dispatchEvent('startpagesWebentityreloaded', {
                            webentityId: we.id
                        })
                    }
                }
            },{
                // When an URL is lookedup, store the result
                triggers: ['urllookupValidation_updated']
                ,method: function(){
                    var lookup = D.get('urllookupValidation')
                        ,url = D.get('lookedupUrl')
                        ,lookups_byUrl = D.get('lookups_byUrl')
                    lookups_byUrl[url] = lookup
                    D.dispatchEvent('update_lookups_byUrl', {
                        lookups_byUrl: lookups_byUrl
                    })
                }
            },{
                // When a web entity crawl selector is checked / unchecked, update UI
                triggers: ['toggleCrawlSelector']
                ,method: function(d){
                    var we_id = d.data.webentityId
                        ,selected = d.data.selected
                    // Check all similar web entities
                    var selectors = $('div[data-webentity-id='+we_id+'] div.select-webentity input.crawl-selector')
                    if(selected){
                        selectors.attr('checked', 'true')
                        selectors.parent().parent().parent().parent().removeClass('crawl-disabled')
                    } else {
                        selectors.removeAttr('checked')
                        selectors.parent().parent().parent().parent().addClass('crawl-disabled')
                    }
                    D.dispatchEvent('ui_update_globalSettings')
                }
            }, {
                // When the lauch crawl button is clicked, launch the crawljobs
                triggers: ['ui_launchCrawls']
                ,method: function(){
                    if(D.get('crawlJobsScheduled') == -1){
                        var webentityDivs = $('div.webentity-info')
                            ,selected_webentityIds = []
                        webentityDivs.each(function(i, webentityDiv){
                            var selector = $(webentityDiv).find('input.crawl-selector')
                            if(selector && selector.is(':checked')){
                                var we_id = $(webentityDiv).attr('data-webentity-id')
                                selected_webentityIds.push(we_id)
                            }
                        })
                        var selected_webentities = Utils.extractCases(selected_webentityIds)
                            .map(function(we_id){
                                    return D.get('webentities_byId')[we_id] || null
                                })
                        var maxdepth = $('#depth').val()
                        if(Utils.checkforInteger(maxdepth)){
                            // Freeze UI
                            $('input.crawl-selector').parent().parent().html('<small>Scheduled</small>')
                            $('#launchButton').addClass('disabled').click(function(){})
                            // Record crawl jobs
                            D.dispatchEvent('update_crawlJobsScheduled', {
                                crawlJobsScheduled: selected_webentities.length
                            })
                            // Launch crawl jobs
                            selected_webentities.forEach(function(we){
                                D.request('crawl', {
                                    webentityId: we.id
                                    ,maxDepth: maxdepth
                                })
                            })
                        }
                    }
                }
            },{
                // When a crawl is launched, update the confirmed count
                triggers:['crawlValidation_updated']
                ,method:function(){
                    D.dispatchEvent('update_crawlJobsConfirmed', {
                        crawlJobsConfirmed: D.get('crawlJobsConfirmed')+1
                    })
                }
            },{
                // When a crawl job is confirmed, display it
                triggers:['crawlJobsConfirmed_updated']
                ,method:function(){
                    var done = D.get('crawlJobsConfirmed')
                        ,total = D.get('crawlJobsScheduled')
                    $('#crawlJobsFeedback').html('')
                        .append(
                                $('<span class="text-info"></span>')
                                    .text(done+' / '+total+' crawl jobs launched')
                            )
                    if(done == total){
                        // window.location = "crawl.php"
                        $('#crawlJobsFeedback').html('')
                            .append(
                                    $('<span class="text-success"></span>')
                                        .text(total+' crawl jobs successfully launched - ')
                                )
                            .append(
                                    $('<a href="crawl.php" target="_blank">Monitor crawl jobs</a>')
                                )
                    }
                }
            }
        ]
    })



    //// Modules

    // The block containing the 'how to start' stuff 
    D.addModule(dmod.CollapseElement, [{
        element: $('#panel_howtostart')
        ,property: 'startUrls'
        ,property_wrap: function(startUrls){return startUrls && startUrls.length>0}
        ,timing: '0.5s'
    }])

    // Text area: paste URLs list
    D.addModule(dmod.TextArea, [{
        element: $('#urlsList')
        ,contentProperty: 'urlslistText'
        ,contentDispatchEvent: 'update_urlslistText'
    }])

    // Button: Find web entities
    D.addModule(dmod.Button, [{
        element: $('#button_findWebentities')
        ,label: "Find the web entities"
        ,disabled_property: 'cannotFindWebentities'
        ,dispatch: 'ui_findWebentities'
    }])
    
    // The block containing the start urls (show when ready) 
    D.addModule(dmod.HideElement, [{
        element: $('#panel_urllist')
        ,property: 'startUrls'
        ,property_wrap: function(startUrls){return !(startUrls && startUrls.length>0)}
    }])

    // URL list custom module
    D.addModule(function(){
        domino.module.call(this)

        var el = $('#urllist')

        this.triggers.events['startUrls_updated'] = function() {
            // When we have the startUrls, we display the list with waiting lookup
            var urls = D.get('startUrls')
            urls.forEach(function(url){
                var editable_url = $('<a href="#"/>').text(Utils.URL_remove_http(url))
                    .attr('data-old-url', url)
                
                D.addModule(function(){
                    domino.module.call(this)
                    editable_url.editable({
                        type: 'text'
                        ,title: 'Edit URL'
                        ,inputclass: 'input-xlarge'
                        ,disabled: false
                        ,unsavedclass: null
                        ,validate: function(url){
                            if(url.substring(0, 4).toLowerCase() !== 'http')
                                url = 'http://'+url

                            if(url.trim() == '')
                                return 'Must not be empty'
                            if(!Utils.URL_validate(url))
                                return 'Invalid URL'

                            url = Utils.reEncode(url)

                            // The URL is valid. Reroll lookup and erase the rest of the line
                            $('span.lookup-info').each(function(i, el){
                                if( $(el).parent().parent().attr('data-url') == editable_url.attr('data-old-url') ){
                                    $(el).text('Waiting for lookup')
                                        .attr('class', 'lookup-info muted')
                                        .attr('data-lookup-status', 'wait')

                                    // Change the small link
                                    $(el).parent().parent()
                                        .attr('data-url', url)
                                        .find('a.external_link').attr('href', url)
                                }
                            })



                            // Set current URL in the editable (for eventual further edition)
                            editable_url.attr('data-old-url', url)

                            D.dispatchEvent('some_url_updated', {})
                        }
                    })
                })
                
                el.append(
                    $('<div class="row urlrow"/>')
                        .attr('data-url', url)
                        .append(
                            $('<div class="span4"/>').append(
                                $('<span class="startUrl"/>').append(editable_url)
                            ).append(
                                $('<span>&nbsp;</span>')
                            ).append(
                                $('<a class="external_link" target="_blank" title="Visit this link"><i class="icon-share-alt"></a>').attr('href', url)
                            )
                        ).append(
                            $('<div class="span1"/>').append(
                                $('<span class="lookup-info muted"/>').text('Waiting')
                                    .attr('data-lookup-status', 'wait')
                            )
                        ).append(
                            $('<div class="span7"/>').append(
                                $('<div class="webentity-info muted"/>')
                                    .attr('data-webentity-status', 'uninitialized')
                            )
                        )
                )
            })
            cascadeLookup()
        }
        
        this.triggers.events['urllookupValidation_updated'] = function() {
            // When an url lookup is done, we search for the lookup to update and we update it, then we cascade lookup
            var status = D.get('urllookupValidation')
                ,url = D.get('lookedupUrl')
                ,pendings = $('span.lookup-info[data-lookup-status=pending]')

            if(pendings.length>0){
                var pending = $(pendings[0])
                    ,element_url = pending.parent().parent().attr('data-url')
                if(element_url == url){
                    // We have a valid target for the update
                    pending.removeClass('muted').removeClass('text-info')
                    if(status==200){
                        // We have a valid URL
                        // Edit the lookup
                        pending.text('OK').addClass('text-success')
                            .attr('data-lookup-status', 'valid')
                        
                        // Initialize the webentity
                        var we_element = pending.parent().parent().find('.webentity-info')[0]
                        $(we_element)
                            .addClass('muted')
                            .removeClass('text-error')
                            .attr('data-webentity-status', 'wait')
                            .text('Waiting')

                    } else if ((status+"").charAt(0) == '3'){
                        // Redirection
                        // Edit the lookup
                        pending.text('Redirect').addClass('text-warning')
                            .attr('data-lookup-status', 'redirect')
                            .attr('title', 'You may want to check that the corresponding web entity is the right one')

                        // Initialize the webentity
                        var we_element = pending.parent().parent().find('.webentity-info')[0]
                        $(we_element)
                            .addClass('muted')
                            .removeClass('text-error')
                            .attr('data-webentity-status', 'wait')
                            .text('Waiting')
                    } else {
                        // Fail
                        // Edit the lookup
                        pending.addClass('text-error')
                            .attr('data-lookup-status', 'invalid')
                        switch(status){
                            case -1:
                                pending.text('URL error').attr('title', 'The server says "invalid URL" ; we will ignore it for web entity search')
                                break;
                            case 0:
                                pending.text('Dead link').attr('title', 'The link is dead ; we will ignore it for web entity search')
                                break;
                            case 501:
                                pending.text('Blocked').attr('title', 'The server blocked our query (501 status)')
                                break;
                            default:
                                pending.text('Dead link ('+status+')').attr('title', 'The link is dead ; we will ignore it for web entity search (status: '+status+')')
                                break;
                        }

                        // Log
                        console.log('> Lookup failed',status)

                        // Initialize the webentity
                        var we_element = pending.parent().parent().find('.webentity-info')[0]
                        $(we_element)
                            .removeClass('muted')
                            .addClass('text-error')
                            .attr('data-webentity-status', 'skip')
                            .text('')
                    }
                    cascadeLookup()
                }
            }
        }

        this.triggers.events['declaredWebentity_indexed'] = function(){
            // When an web entity fetch is done (after indexing), we search for the web entity to update and we update it, then we cascade lookup
            var we = D.get('declaredWebentity')
                ,url = D.get('fetchedUrl')
                ,pendings = $('div.webentity-info[data-webentity-status=pending]')

            if(pendings.length>0){
                var pending = $(pendings[0])
                    ,element_url = pending.parent().parent().attr('data-url')
                if(element_url == url){
                    // We have a valid target for the update
                    if(we !== undefined){
                        // We have a valid web entity
                        var crawlStatusLabel = we.crawling_status.toLowerCase()
                        if(we.crawling_status.toLowerCase() == 'finished'){
                            crawlStatusLabel = 'crawled'
                        } else if(we.crawling_status.toLowerCase() == 'pending' || we.crawling_status.toLowerCase() == 'running'){
                            crawlStatusLabel = 'crawling'
                        } else if(we.crawling_status.toLowerCase() == 'uncrawled'){
                            crawlStatusLabel = ''
                        }
                        // Edit
                        pending.html('')
                            .attr('data-webentity-status', 'valid')
                            .attr('data-webentity-id', we.id)
                            .append(
                                $('<div class="row"/>')
                                    .append(
                                            $('<div class="span3"/>')
                                                .append(
                                                    $('<span/>')
                                                        .text(' '+we.name)
                                                        .addClass('text-success')
                                                ).append(
                                                    $('<small class="muted"/>')
                                                        .text((we.lru_prefixes.length>1)?(' ('+we.lru_prefixes.length+') '):(''))
                                                        .attr('title', we.lru_prefixes.length+' prefixes')
                                                ).append(
                                                    $('<span class="pull-right"/>').append(
                                                            $('<small class="muted"/>')
                                                                .text(crawlStatusLabel)
                                                        )
                                                )
                                        )
                                    .append(
                                            $('<div class="span3 crawl-settings"/>')
                                                .attr('data-crawlsettings-status', 'wait')
                                                .append(
                                                    $('<span class="muted">Waiting</span>')
                                                    )
                                        )
                                    .append(
                                            $('<div class="span1 select-webentity"/>')
                                        )
                                )
                    } else {
                        // Fail
                        // Edit
                        pending.html('')
                            .text('No web entity fetched').addClass('text-error')
                            .attr('data-webentity-status', 'fail')
                            .attr('data-webentity-id', '')
                    }
                }
                cascadeWebentities()
            }
        }
        this.triggers.events['lookups_byUrl_updated'] = function(){
            cascadeTeststartpages()
        }
    })

    // Global settings module
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#globalSettings')

        this.triggers.events['ui_update_globalSettings'] = function(){
            element.html('')
            var webentityDivs = $('div.webentity-info')
                ,selected_webentityIds = []
            webentityDivs.each(function(i, webentityDiv){
                var selector = $(webentityDiv).find('input.crawl-selector')
                if(selector && selector.is(':checked')){
                    var we_id = $(webentityDiv).attr('data-webentity-id')
                    selected_webentityIds.push(we_id)
                }
            })
            var selected_webentities = Utils.extractCases(selected_webentityIds)
                .map(function(we_id){
                        return D.get('webentities_byId')[we_id] || null
                    })

            // Display
            if(selected_webentities.length>0){
                element.append(
                        $('<h3/>').text(selected_webentities.length+' web entit'+((selected_webentities.length==1)?('y'):('ies'))+' to crawl')
                    ).append(
                        $('<label>Max depth</label>')
                    ).append(
                        $('<div class="input-append"/>').append(
                                $('<input class="span1" id="depth" type="text" placeholder="Depth" value="1"/>')
                            ).append(
                                $('<button class="btn btn-primary" id="launchButton" type="button">Launch '+selected_webentities.length+' crawl job'+((selected_webentities.length==1)?(''):('s'))+'</button>')
                                    .click(function(){
                                        D.dispatchEvent('ui_launchCrawls')
                                    })
                            )
                    ).append(
                        $('<div id="crawlJobsFeedback"/>')
                    )
            } else {
                element.append(
                        $('<h3/>').text('Nothing to crawl')
                    )
            }
        }
        
    })




    //// On load
    $(document).ready(function(){
        
    })



    //// Cascade functions
    var cascadeLookup = function(){
        var waiting = $('span.lookup-info[data-lookup-status=wait]')
        if(waiting.length>0){
            var span = $(waiting[0])
                ,url = span.parent().parent().attr('data-url')
            span.text('Lookup...').attr('data-lookup-status', 'pending')
                .addClass('text-info')
            D.dispatchEvent('lookupUrl', {url: url})
        } else {
            cascadeWebentities()
        }
    }

    var cascadeWebentities = function(){
        var waiting = $('div.webentity-info[data-webentity-status=wait]')
        if(waiting.length>0){
            var div = $(waiting[0])
                ,url = div.parent().parent().attr('data-url')
            
            div.html('').append(
                    $('<span class="text-info"/>').text('Fetch web entity...')
                ).attr('data-webentity-status', 'pending')
                
            D.dispatchEvent('ui_webentityFetch', {url: url})
        } else {
            cascadeFetchstartpages()
        }
    }

    var cascadeFetchstartpages = function(){
        var pending = $('div.crawl-settings[data-crawlsettings-status=pending]')
        if(pending.length == 0){
            var waiting = $('div.crawl-settings[data-crawlsettings-status=wait]')
            if(waiting.length>0){
                var div = $(waiting[0])
                    ,we_id = div.parent().parent().attr('data-webentity-id')
                    ,divs = $('div[data-webentity-id='+we_id+'] div.crawl-settings')
                divs.html('<span class="text-info">Auto-search start pages...</span>')
                    .attr('data-crawlsettings-status', 'pending')
                D.dispatchEvent('ui_startpagesAutosearch', {
                    webentityId: we_id
                })
            } else {
                cascadeTeststartpages()
            }
        }
    }

    var cascadeTeststartpages = function(){
        var pending = $('div.crawl-settings[data-crawlsettings-status=pending]')
        if(pending.length == 0){
            var waiting = $('div.crawl-settings[data-crawlsettings-status=startpagestestwaiting]')
            if(waiting.length>0){
                var div = $(waiting[0])
                    ,we_id = div.parent().parent().attr('data-webentity-id')
                    ,we = D.get('webentities_byId')[we_id]
                    ,startpages_tested = D.get('lookups_byUrl')
                    ,startpages_untested = []
                    ,startpages_valid = []
                    ,startpages_redirected = []
                    ,startpages_failed = []
                we.startpages.forEach(function(sp){
                    if(startpages_tested[sp] === undefined){
                        //console.log('start page ', sp, 'undefined')
                        startpages_untested.push(sp)
                    } else {
                        var status = startpages_tested[sp]
                        if(status == 200){
                            // The start page is valid
                            startpages_valid.push(sp)
                        } else if((status+"").charAt(0) == '3'){
                            // Redirection
                            startpages_redirected.push(sp)
                        } else {
                            // Fail
                            startpages_failed.push(sp)
                        }
                        //console.log('start page ', sp, 'status', status)
                    }
                })

                // If there are pages to test, test the first
                if(startpages_untested.length>0){
                    var pendingLookups = $('span.lookup-info[data-lookup-status=pending]')
                    if(pendingLookups.length == 0){
                        div.html('<span class="text-info">Start pages tested...</span>')
                        D.dispatchEvent('lookupUrl', {url: startpages_untested[0]})
                    }
                } else {
                    if(startpages_valid.length == we.startpages.length){
                        // Start pages are all valid !
                        var s_letter = startpages_valid.length>1 ? 's' : ''
                        div.attr('data-crawlsettings-status', 'startpagestestsuccess')
                        div.html('')
                        div.append(
                                $('<span class="text-success">'+startpages_valid.length+' start page'+s_letter+'</span>')
                            ).append(
                                $('<span> </span>')
                            )

                        var selectSpan = $('div[data-webentity-id='+we_id+'] div.select-webentity')
                        selectSpan.html('').append(
                                $('<label class="checkbox"></label>').append(
                                        $('<input type="checkbox" class="crawl-selector">')
                                            .attr('checked', 'true')
                                            .click(function(e){
                                                var state = $(e.target).is(':checked')
                                                D.dispatchEvent('toggleCrawlSelector', {
                                                    webentityId: we_id
                                                    ,selected: state
                                                })
                                            })
                                    ).append(
                                        $('<span class="text-success">crawl</span>')
                                    )
                            )

                    } else {
                        div.attr('data-crawlsettings-status', 'startpagestestfail')
                        div.html('')
                        if(startpages_valid.length>0){
                            var s_letter = startpages_redirected.length>1 ? 's' : ''
                            div.append(
                                    $('<span class="text-success">'+startpages_valid.length+' start page'+s_letter+'</span>')
                                ).append(
                                    $('<span> </span>')
                                )
                        }
                        if(startpages_redirected.length>0){
                            var s_letter = startpages_redirected.length>1 ? 's' : ''
                            div.append(
                                    $('<span class="text-warning">'+startpages_redirected.length+' redirection'+s_letter+'</span>')
                                        .attr('title', 'You cannot launch a crawl if some start pages are redirected')
                                ).append(
                                    $('<span> </span>')
                                )
                        }
                        if(startpages_failed.length>0){
                            var s_letter = startpages_failed.length>1 ? 's' : ''
                            div.append(
                                    $('<span class="text-warning">'+startpages_failed.length+' wrong page'+s_letter+'</span>')
                                ).append(
                                    $('<span> </span>')
                                )
                        }

                        var selectSpan = $('div[data-webentity-id='+we_id+'] div.select-webentity')
                        selectSpan.html('').append(
                                $('<a class="btn-link btn-mini fixncrawl">fix &amp; crawl</a>')
                                    .attr('target', '_blank')
                                    .attr('href', 'crawl_new.php#we_id='+we_id)
                            )
                    }
                    var source_url = div.parent().parent().parent().parent().attr('data-url')
                    if(we.startpages.indexOf(source_url) < 0){
                        div.append(
                                $('<i class="icon-exclamation-sign" title="The source URL is not in the start pages" style="opacity: 0.4"></i>')
                            )
                    }
                    cascadeTeststartpages()
                }
            } else {
                var waitingLookups = $('span.lookup-info[data-lookup-status=wait]')
                    ,uninitializedWebentities = $('div.webentity-info[data-webentity-status=uninitialized]')
                    ,waitingWebentities = $('div.webentity-info[data-webentity-status=wait]')
                    ,waitingSettings = $('div.crawl-settings[data-crawlsettings-status=wait]')
                if(waitingLookups.length == 0 && uninitializedWebentities.length == 0 && waitingWebentities.length == 0 && waitingSettings.length == 0)
                    D.dispatchEvent('ui_update_globalSettings')
            }
        }
    }

    //// Processing
    var extractWebentities = function(text){
        var raw_urls = text.split(/[ \n\r\t<>"']+/gi).filter(function(expression){
            return Utils.URL_validate(expression)
        }).map(function(url){
            if(url.indexOf('http')!=0)
                return 'http://'+url
            return url
        })
        return Utils.extractCases(raw_urls)
    }

})(jQuery, domino, (window.dmod = window.dmod || {}))
