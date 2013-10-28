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
            },{
                id:'webentitiesLinks'
                ,dispatch: 'webentitiesLinks_updated'
                ,triggers: 'update_webentitiesLinks'
            },{
                id:'networkJson'
                ,dispatch: 'networkJson_updated'
                ,triggers: 'update_networkJson'
            },{
                id:'sigmaInstance'
                ,dispatch: 'sigmaInstance_updated'
                ,triggers: 'update_sigmaInstance'
            }
        ]


        ,services: [
        	
        ]


        ,hacks:[
        ]
    })



    //// Modules

    // 
    



    //// On load
    /*$(document).ready(function(){
        
    })*/




    //// Clock



    //// Processing
    


    /// Misc functions
    

})(jQuery, domino, (window.dmod = window.dmod || {}))