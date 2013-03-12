domino.settings({
    shortcutPrefix: "::" // Hack: preventing a bug related to a port in a URL for Ajax
    ,verbose: true
})

;(function($, domino, dmod, undefined){
    
    // Check that config is OK
    if(HYPHE_CONFIG === undefined)
        alert('Your installation of Hyphe has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHYPHE_CONFIG = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')

    // Stuff we reuse often when we initialize Domino
    var rpc_url = HYPHE_CONFIG.SERVER_ADDRESS
        ,rpc_contentType = 'application/x-www-form-urlencoded'
        ,rpc_type = 'POST'
        ,rpc_expect = function(data){return data[0] !== undefined && data[0].code !== undefined && data[0].code == 'success'}
        ,rpc_error = function(data){alert('Oops, an error occurred... \n'+data)}

    var D = new domino({
        name: 'main'
        ,properties: [
            {
                id:'webentities'
                ,dispatch: 'webentities_updated'
                ,triggers: 'update_webentities'
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
            }
        ],services: [
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
            }
        ],hacks:[
            {
                // Enable the selector when the web entities are updated
                triggers: ['webentities_updated']
                ,method: function(){
                    D.dispatchEvent('update_webentitiesselectorDisabled', {
                        webentitiesselectorDisabled: false
                    })
                }
            },{
                // Web entity selected
                triggers: ['ui_webentitySelected']
                ,method: function(){
                    var current_we_id = $('#webentities_selector').val()
                        ,current_we
                        ,webentities = D.get('webentities')
                    webentities.forEach(function(we){
                        if(we.id == current_we_id)
                            current_we = we
                    })
                    D.dispatchEvent('update_currentWebentity', {
                        currentWebentity: current_we
                    })
                }
            },{
                // Web entity declared (by URL pasted)
                triggers: ['ui_webentityDeclared']
                ,method: function(){
                    if(!D.get('urldeclarationInvalid')){
                        D.request('declarePage', {
                            url: $('#urlField').val()
                        })
                    }
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

        element.on('keyup', function(e){
            if(e.keyCode == 13){
                // Enter key pressed
                if(D.get('urldeclarationInvalid')){
                    element.blur()
                    D.dispatchEvent('declarePage', {})
                }
            } else {
                var url = element.val()
                // Validation
                D.dispatchEvent('update_urldeclarationInvalid', {
                    urldeclarationInvalid: !Utils.URL_validate(url)
                })
            }
        })
    })

    // Table of start pages
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#startPagesTable')
            ,messagesElement = $('#startPages_messages')

        this.triggers.events['currentWebentity_updated'] = function(){
            var we = D.get('currentWebentity')
            if(we !== undefined){
                element.html('')
                if(we.startpages.length>0){
                    startpages.forEach(function(sp){
                        var tr = $('<tr class="startPage_tr"/>')
                        element.append(tr)
                        tr.append(
                            $('<td/>').append($('<small/>').append($('<a target="_blank" class="unchecked"/>').attr('href',sp).text(sp+'  ')))
                        )
                        if(startpages.length>1){
                            tr.append(
                                $('<td/>').append(
                                    $('<button class="close">&times;</button>').click(function(){
                                        messagesElement.html('')
                                            .append(
                                                $('<div class="alert alert-warning"/>').html('Removing server-side...')
                                            )
                                        // TODO: Hyphen.controller.core.webEntity_removeStartPage(we_id, sp)
                                    })
                                )
                            )
                        } else {
                            tr.append($('<td/>'))
                        }
                    })
                } else {
                    // No start page: propose to import from LRU_prefixes
                    element.append(
                        $('<tr class="startPage_tr"/>').append(
                            $('<td/>').text('No start page')
                        ).append(
                            $('<td/>').append(
                                $('<button class="btn btn-small pull-right">Use prefixes as start pages</button>').click(function(){
                                    messagesElement.html('')
                                        .append(
                                            $('<div class="alert alert-info"/>').html('Use prefixes as start pages...')
                                        )
                                    we.lru_prefixes.forEach(function(lru_prefix){
                                        // TODO: Hyphen.controller.core.webEntity_addStartPage(we.id, Hyphen.utils.LRU_to_URL(lru_prefix))
                                    })
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
            // TODO: Hyphen.view.startPages_cascadeCheck()
            // TODO: Hyphen.view.launchButton_updateState()
        }
    })




    //// On load
    $(document).ready(function(){
        D.request('getWebentities', {})
    })

})(jQuery, domino, (window.dmod = window.dmod || {}))