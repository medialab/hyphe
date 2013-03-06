domino.settings({
    shortcutPrefix: "::" // Hack: preventing a bug related to a port in a URL for Ajax
    ,verbose: true
})

// X-Editable: inline mode
$.fn.editable.defaults.mode = 'inline';

;(function($, domino, undefined){
    
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
        properties: [
            /*{
                id:'currentWebEntity'
                ,dispatch: 'currentWebEntity_updated'
                ,triggers: 'update_currentWebEntity'
            }*/
        ],services: [
            /*{
                id: 'getCurrentWebEntity'
                ,setter: 'currentWebEntity'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [
                            [settings.shortcuts.webEntityId]    // List of web entities ids
                        ],
                    })}
                ,path:'0.result.0'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }*/
        ],hacks:[]
    })

    //// Modules

    // Log stuff in the console
    D.addModule(function(){
        domino.module.call(this)

        /*this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            console.log('Current web entity', webEntity)
        }*/

    })

    // Editable enable / disable
    D.addModule(function(){
        domino.module.call(this)

        /*this.triggers.events['currentWebEntity_updated'] = function() {
            D.dispatchEvent('update_syncPending', {
                syncPending: false
            })
        }*/

    })

    /*
    //// On load, get the web entity
    $(document).ready(function(e){
        D.request('getCurrentWebEntity', {shortcuts:{
            webEntityId: Utils.hash.get('we_id')
        }})
    })*/

})(jQuery, domino)