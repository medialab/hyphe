// Use jQuery ajax
domino.utils.ajax = $.ajax

// Hack: preventing a bug related to a port in a URL for Ajax
domino.settings({
    shortcutPrefix: "::"
    ,verbose: true
})

// X-Editable: inline mode
$.fn.editable.defaults.mode = 'inline';

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
            },{
                id:'nameValidation'
                ,dispatch: 'nameValidation_updated'
                ,triggers: 'update_nameValidation'
            },{
                id:'statusValidation'
                ,dispatch: 'statusValidation_updated'
                ,triggers: 'update_statusValidation'
            }
        ],services: [
            {
                id: 'getCurrentWebEntity'
                ,setter: 'currentWebEntity'
                ,data: function(settings){  return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [
                            [settings.shortcuts.webEntityId]    // List of web entities ids
                        ],
                    })}
                ,path:'0.result.0'
                ,url: HYPHE_CONFIG.SERVER_ADDRESS, contentType: 'application/x-www-form-urlencoded', type: 'POST'
                ,expect: function(data){return data[0].code == 'success'}
                ,error: function(data){alert('Oops, an error occurred... \n\nThe server says:\n'+data)}
            },{
                id: 'setCurrentWebEntityName'
                ,setter: 'nameValidation'
                ,data: function(settings){  return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.SET_NAME,
                        'params' : [
                            settings.shortcuts.webEntityId      // web entity id
                            ,settings.shortcuts.name            // new name
                        ],
                    })}
                ,path:'0.result'
                ,url: HYPHE_CONFIG.SERVER_ADDRESS, contentType: 'application/x-www-form-urlencoded', type: 'POST'
                ,expect: function(data){return data[0].code == 'success'}
                ,error: function(data){alert('Oops, an error occurred... \n\nThe server says:\n'+data)}
            },{
                id: 'setCurrentWebEntityStatus'
                ,setter: 'statusValidation'
                ,data: function(settings){  return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.SET_STATUS,
                        'params' : [
                            settings.shortcuts.webEntityId      // web entity id
                            ,settings.shortcuts.status          // new status
                        ],
                    })}
                ,path:'0.result'
                ,url: HYPHE_CONFIG.SERVER_ADDRESS, contentType: 'application/x-www-form-urlencoded', type: 'POST'
                ,expect: function(data){return data[0].code == 'success'}
                ,error: function(data){alert('Oops, an error occurred... \n\nThe server says:\n'+data)}
            }
        ],hacks:[
        ]
    })

    //// Modules

    // Log stuff in the console
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            console.log('Current web entity', webEntity)
        }

        this.triggers.events['nameValidation_updated'] = function(d) {
            var nameValidation = d.get('nameValidation')
            console.log('nameValidation', nameValidation)
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

    // Identity table: ID
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            $('#id').text(webEntity.id)
        }
    })

    // Identity table: Dates
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            $('#creation_date').text(Utils.prettyDate(webEntity.creation_date))
            $('#last_modification_date').text(Utils.prettyDate(webEntity.last_modification_date))
        }
    })

    // LRU_prefixes
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            $('#lru_prefixes').html('')
            webEntity.lru_prefixes.forEach(function(lru_prefix){
                $('#lru_prefixes').append(
                    $('<tr/>').append(
                        $('<td/>').text(Utils.LRU_to_URL(lru_prefix))
                    ).append(
                        $('<td>').append(
                            $('<a class="btn btn-mini pull-right"/>')
                                .attr('href', Utils.LRU_to_URL(lru_prefix))
                                .attr('target', 'blank')
                                .append($('<i class="icon-share-alt"/>'))
                        )
                    )
                )
            })
            
        }
    })

    // Identity table: editable name
    D.addModule(function(){
        domino.module.call(this)
        $('#name').editable({
            type: 'text'
            ,title: 'Enter name'
            ,disabled: true
            ,validate: function(name){
                $('.editable').editable('disable')
                var webEntity = D.get('currentWebEntity')
                D.request('setCurrentWebEntityName', {shortcuts:{
                    webEntityId: webEntity.id
                    ,name: name
                }})
            }
        })
        
        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            $('#name').editable('option', 'value', webEntity.name)
            $('#name').editable('enable')
        }
    })

    // Identity table: editable status
    D.addModule(function(){
        domino.module.call(this)
        $('#status').editable({
            type: 'select'
            ,title: 'Select status'
            ,source: [
                {value: 'UNDECIDED', text: "Undecided"}
                ,{value: 'IN', text: "In"}
                ,{value: 'OUT', text: "Out"}
                ,{value: 'DISCOVERED', text: "Discovered"}
            ]
            ,disabled: true
            ,validate: function(status){
                if(['UNDECIDED', 'IN', 'OUT', 'DISCOVERED'].indexOf(status)<0)
                    return false
                $('.editable').editable('disable')
                var webEntity = D.get('currentWebEntity')
                D.request('setCurrentWebEntityStatus', {shortcuts:{
                    webEntityId: webEntity.id
                    ,status: status
                }})
            }
        })
        
        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            $('#status').editable('option', 'value', webEntity.status)
            $('#status').editable('enable')
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

    // Reload all current web entity on property update
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['nameValidation_updated', 'statusValidation_updated'] = function() {
            D.request('getCurrentWebEntity', {shortcuts:{
                webEntityId: D.get('currentWebEntity').id
            }})
        }
    })


    //// On load, get the web entity
    $(document).ready(function(e){
        D.request('getCurrentWebEntity', {shortcuts:{
            webEntityId: Utils.hash.get('we_id')
        }})
    })

})(jQuery, domino)