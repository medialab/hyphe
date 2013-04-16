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
            }
        ]


        ,services: [
            {
                id: 'getWebentities'
                ,setter: 'webentities'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
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
            var urls = D.get('startUrls')
            urls.forEach(function(url){
                var editable_url = $('<a href="#"/>').text(Utils.URL_simplify(url))
                    .attr('data-old-url', url)
                
                D.addModule(function(){
                    domino.module.call(this)
                    editable_url.editable({
                        type: 'text'
                        ,title: 'Edit URL'
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
                                if( $(el).attr('data-url') == editable_url.attr('data-old-url') ){
                                    $(el).text('Waiting for lookup')
                                        .attr('class', 'lookup-info muted')
                                        .attr('data-url', url)
                                        .attr('data-lookup-status', 'wait')

                                    // Change the small link
                                    $(el).parent().parent().find('a.external_link').attr('href', url)
                                }
                            })



                            // Set current URL in the editable (for eventual further edition)
                            editable_url.attr('data-old-url', url)

                            D.dispatchEvent('some_url_updated', {})
                        }
                    })
                })
                
                el.append($('<div class="row urlrow"/>').append(
                    $('<div class="span4"/>').append(
                        $('<span class="startUrl"/>').append(editable_url)
                    ).append(
                        $('<span>&nbsp;</span>')
                    ).append(
                        $('<a class="external_link" target="_blank" title="Visit this link"><i class="icon-share-alt"></a>').attr('href', url)
                    )
                ).append(
                    $('<div class="span2"/>').append(
                        $('<span class="lookup-info muted"/>').text('Waiting for lookup')
                            .attr('data-url', url)
                            .attr('data-lookup-status', 'wait')
                    )
                ))
            })
            cascadeLookup()
        }
        
        this.triggers.events['urllookupValidation_updated'] = function() {
            var status = D.get('urllookupValidation')
                ,url = D.get('lookedupUrl')
                ,pendings = $('span.lookup-info[data-lookup-status=pending]')

            if(pendings.length>0 && $(pendings[0]).attr('data-url') == url){
                var pending = $(pendings[0])
                // We have a valid target for the update
                pending.removeClass('muted')
                if(status==200){
                    // We have a valid URL
                    pending.text('OK').addClass('text-success')
                        .attr('data-lookup-status', 'valid')
                } else if([300, 301, 302].some(function(test){return status==test})){
                    // Redirection
                    pending.text('Redirection').addClass('text-warning')
                        .attr('data-lookup-status', 'redirect')
                        .attr('title', 'You may want to check that the corresponding web entity is the right one')
                } else {
                    // Fail
                    pending.text('Dead link').addClass('text-error')
                        .attr('data-lookup-status', 'invalid')
                        .attr('title', 'The link is dead ; we will ignore it for web entity search')
                }
                cascadeLookup()
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
                ,url = span.attr('data-url')
            span.text('Looking up...').attr('data-lookup-status', 'pending')
            D.dispatchEvent('lookupUrl', {url: url})
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