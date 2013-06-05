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
                id:'resetallValidation'
                ,dispatch: 'resetallValidation_updated'
                ,triggers: 'update_resetallValidation'
            }
        ]


        ,services: [
        	{
                id: 'resetAll'
                ,setter: 'resetallValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.RESET,
                        'params' : [],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }
        ]


        ,hacks:[
            {
                // On reset button pushed, reset
                triggers: ['ui_reset']
                ,method: function(){
                    D.request('resetAll')
                }
            }
        ]
    })



    //// Modules

    // Reset button
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#reinitialize_all')

        element.click(function(){
            if(!element.hasClass('disabled'))
                D.dispatchEvent('ui_reset')
        })
        
        this.triggers.events['ui_reset'] = function(){
            element.addClass('disabled')
        }
    })

    // Validation
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#result_message')

        this.triggers.events['resetallValidation_updated'] = function(){
            element.html('')
                .append(
                        $('<span>The reset has been done</span>')
                    )
                .append(
                        $('<span> - </span>')
                    )
                .append(
                        $('<a href="index.php">Back to home page</a>')
                    )
        }
    })



    //// Processing
    


    /// Misc functions
    

})(jQuery, domino, (window.dmod = window.dmod || {}))