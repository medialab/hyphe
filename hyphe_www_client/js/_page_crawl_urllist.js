domino.settings({
    shortcutPrefix: "::" // Hack: preventing a bug related to a port in a URL for Ajax
    ,verbose: true
})

// X-Editable: popup mode
$.fn.editable.defaults.mode = 'popup';

;(function($, domino, dmod, undefined){
    
    // Check that config is OK
    if(HYPHE_CONFIG === undefined)
        alert('Your installation of Hyphe has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHYPHE_CONFIG = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')

    // Stuff we reuse often when we initialize Domino
    var rpc_url = HYPHE_CONFIG.SERVER_ADDRESS
        ,rpc_contentType = 'application/x-www-form-urlencoded'
        ,rpc_type = 'POST'
        ,rpc_expect = function(data){if(data[0] !== undefined && data[0].code !== undefined && data[0].code == 'success'){return true}else{console.log('[RPC] Unexpected result: ',data)}  }
        ,rpc_error = function(data){alert('Oops, the server answered something unexpected...\nSorry for the crash.')}

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
                        ,timeout: 5
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

                    D.dispatchEvent('currentWebentityId_updated', {
                        currentWebentityId: we_id
                    })

                    if(we.startpages.length == 0){
                        var divs = $('div[data-webentity-id='+we_id+'] div.crawl-settings')
                        divs.html('<span class="text-info">Use prefix...</span>')
                            .attr('data-crawlsettings-status', 'pending')

                        D.dispatchEvent('update_currentWebentityId', {
                            currentWebentityId: we_id
                        })
                        // Use the first prefix
                        D.request('addStartPage', {
                            webentityId: we.id
                            ,url: Utils.LRU_to_URL(we.lru_prefixes[0])
                        })
                    } else {
                        var divs = $('div[data-webentity-id='+we_id+'] div.crawl-settings')
                        divs.html('<span>Start pages OK</span>')
                            .attr('data-crawlsettings-status', 'set')
                        cascadeCrawlsettings()
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
        ,content_property: 'urlslistText'
        ,content_dispatch: 'update_urlslistText'
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
                var editable_url = $('<a href="#"/>').text(Utils.URL_simplify(url))
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
                            $('<div class="span6"/>').append(
                                $('<div class="webentity-info muted"/>').text('...')
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

                    } else if([300, 301, 302].some(function(test){return status==test})){
                        // Redirection
                        // Edit the lookup
                        pending.text('Redirection').addClass('text-warning')
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
                        // Edit
                        pending.html('')
                            .addClass('text-success')
                            .attr('data-webentity-status', 'valid')
                            .attr('data-webentity-id', we.id)
                            .append(
                                $('<div class="row"/>')
                                    .append(
                                            $('<div class="span3"/>')
                                                .append(
                                                    $('<span/>')
                                                        .text(' '+we.name)
                                                ).append(
                                                    $('<small class="muted"/>')
                                                        .text(((we.lru_prefixes.length>1)?(' - '+we.lru_prefixes.length+' prefixes'):('')))
                                                )
                                        )
                                    .append(
                                        $('<div class="span2 crawl-settings"/>')
                                            .attr('data-crawlsettings-status', 'wait')
                                            .append(
                                                $('<span class="muted">Waiting</span>')
                                                )
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
            
            div.text('Fetch web entity...').attr('data-webentity-status', 'pending')
                .addClass('text-info')
            D.dispatchEvent('ui_webentityFetch', {url: url})
        } else {
            cascadeCrawlsettings()
        }
    }

    var cascadeCrawlsettings = function(){
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