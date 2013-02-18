// Use jQuery ajax
domino.utils.ajax = $.ajax
// Hack: preventing a bug related to a port in a URL for Ajax
domino.settings({
    shortcutPrefix: "::"
    ,verbose: true
})


;(function($, domino, undefined){
    
    // Check that config is OK
    if(HYPHE_CONFIG === undefined)
        alert('Your installation of Hyphe has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHYPHE_CONFIG = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')

    var D = new domino({
        properties: [
            {
                id:'currentWebEntity'
                ,dispatch: 'currentWebEntity_updated'
                ,triggers: 'update_currentWebEntity'
            }
        ],services: [
            {
                id: 'getCurrentWebEntity'
                ,setter: 'currentWebEntity'
                ,data: function(settings){  return JSON.stringify({ //JSON RPC
                        'method' : 'store.get_webentities',
                        'params' : [[settings.shortcuts.webEntityId]],
                    })}
                ,path:'0.result.0'
                ,url: HYPHE_CONFIG.SERVER_ADDRESS, contentType: 'application/x-www-form-urlencoded', type: 'POST'
            }
        ]
    })

    //// Modules

    // Log the web entity in the console
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            console.log('Current web entity', webEntity)
        }
    })

    // Page title
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            $('#pageTitle').text('Edit: '+webEntity.name)
        }
    })

    // Tags
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
                ,userTagCategories = webEntity.tags.USER || {}
                ,coreTagCategories = webEntity.tags.CORE || {}
            
            $('#tags_USER').html('')
            for(var cat in userTagCategories){
                $('#tags_USER').append($('<br/>'))
                    .append($('<h6/>').text(cat))
                var taglist = $('<div/>')
                        .addClass('tag-list')
                        .attr('tagns', 'user')
                        .attr('cat', cat)
                        .append(
                            $('<div class="tags"></div>')
                        )
                $('#tags_USER').append(taglist)

                /*taglist.tags({
                    tagData:[userTagCategories[cat]]
                    ,suggestions:[]
                    ,excludeList:[]
                })*/
            }
        }
    })




    //// On load, get the web entity
    $(document).ready(function(e){
        D.request('getCurrentWebEntity', {shortcuts:{
            webEntityId: Utils.hash.get('we_id')
        }})
    })

})(jQuery, domino)