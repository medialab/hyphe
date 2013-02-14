// Use jQuery ajax
domino.utils.ajax = $.ajax
// Hack: preventing a bug related to a port in a URL for Ajax
domino.settings('shortcutPrefix', "::")
domino.settings('verbose', true)


;(function($, domino, undefined){
    
    // Check that config is OK
    if(HYPHE_CONFIG === undefined)
        alert('Your installation of Hyphe has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHYPHE_CONFIG = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')

    var d = new domino({
        properties: [
            {
                id:'currentWebEntity'
                ,dispatch: 'currentWebEntity_updated'
                ,triggers: 'update_currentWebEntity'
            }
        ],services: [
            {
                id: 'getWebEntity'
                ,setter: 'currentWebEntity'
                ,data: function(settings){  return JSON.stringify({// It's JSON RPC
                        'method' : 'store.get_webentities',
                        'params' : [[settings.shortcuts.webEntityId]],
                    })}
                ,path:'0.result.0'
                ,url: HYPHE_CONFIG.SERVER_ADDRESS, contentType: 'application/x-www-form-urlencoded', type: 'POST'
            }
        ]
    })

    //// Modules
    // Page title
    d.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(dominoInstance) {
            var webEntity = dominoInstance.get('currentWebEntity')
            $('#pageTitle').text('WebEntity: '+webEntity.name)
            console.log('webEntity:')
            console.log(webEntity)
        }
    })

    // Get the web entity
    $(document).ready(function(e){
        d.request('getWebEntity', {shortcuts:{
            webEntityId: Utils.hash.get('we_id')
        }})
    })

})(jQuery, domino)