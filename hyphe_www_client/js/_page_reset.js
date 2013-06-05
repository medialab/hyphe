HypheCommons.js_file_init()
HypheCommons.domino_init()

;(function($, domino, dmod, undefined){
    
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