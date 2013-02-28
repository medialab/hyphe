domino.settings({
    shortcutPrefix: "::" // Hack: preventing a bug related to a port in a URL for Ajax
    ,name: "d"
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
            {
                id:'currentWebEntity'
                ,dispatch: 'currentWebEntity_updated'
                ,triggers: 'update_currentWebEntity'
            },{
                id:'currentWebEntityPages'
                ,dispatch: 'currentWebEntityPages_updated'
                ,triggers: 'update_currentWebEntityPages'
            },{
                id:'currentWebEntitySubwebentities'
                ,dispatch: 'currentWebEntitySubwebentities_updated'
                ,triggers: 'update_currentWebEntitySubwebentities'
            },{
                id:'syncPending'    // flag
                ,dispatch: 'syncPending_updated'
                ,triggers: 'update_syncPending'
                ,value: false
            },{
                id:'treeItemPopover'
                ,dispatch: 'treeItemPopover_updated'
                ,triggers: 'update_treeItemPopover'
            },{
                id:'nameValidation'
                ,dispatch: 'nameValidation_updated'
                ,triggers: 'update_nameValidation'
            },{
                id:'statusValidation'
                ,dispatch: 'statusValidation_updated'
                ,triggers: 'update_statusValidation'
            },{
                id:'homepageValidation'
                ,dispatch: 'homepageValidation_updated'
                ,triggers: 'update_homepageValidation'
            },{
                id:'tagValuesValidation'
                ,dispatch: 'tagValuesValidation_updated'
                ,triggers: 'update_tagValuesValidation'
            },{
                id:'createWebEntityByLruValidation'
                ,dispatch: 'createWebEntityByLruValidation_updated'
                ,triggers: 'update_createWebEntityByLruValidation'
            }
        ],services: [
            {
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
            },{
                id: 'getCurrentWebEntityPages'
                ,setter: 'currentWebEntityPages'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.GET_PAGES,
                        'params' : [
                            settings.shortcuts.webEntityId    // Web entity id
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'getCurrentWebEntitySubwebentities'
                ,setter: 'currentWebEntitySubwebentities'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.GET_SUBWEBENTITIES,
                        'params' : [
                            settings.shortcuts.webEntityId    // Web entity id
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'setCurrentWebEntityName'
                ,setter: 'nameValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.SET_NAME,
                        'params' : [
                            settings.shortcuts.webEntityId      // web entity id
                            ,settings.shortcuts.name            // new name
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'setCurrentWebEntityStatus'
                ,setter: 'statusValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.SET_STATUS,
                        'params' : [
                            settings.shortcuts.webEntityId      // web entity id
                            ,settings.shortcuts.status          // new status
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'setCurrentWebEntityHomepage'
                ,setter: 'homepageValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.SET_HOMEPAGE,
                        'params' : [
                            settings.shortcuts.webEntityId      // web entity id
                            ,settings.shortcuts.homepage        // new homepage
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'setCurrentWebEntityTagValues'
                ,setter: 'tagValuesValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.SET_TAG_VALUES,
                        'params' : [
                            settings.shortcuts.webEntityId      // web entity id
                            ,settings.shortcuts.namespace
                            ,settings.shortcuts.key
                            ,settings.shortcuts.values
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'createWebEntityByLru'
                ,setter: 'createWebEntityByLruValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.CREATE_BY_LRU,
                        'params' : [
                            settings.shortcuts.lru_prefix
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }
        ],hacks:[]
    })

    //// Modules

    // Log stuff in the console
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            console.log('Current web entity', webEntity)
        }

        this.triggers.events['currentWebEntityPages_updated'] = function(d) {
            console.log('pages', d.get('currentWebEntityPages'))
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

    // Editable enable / disable
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['syncPending_updated'] = function(d) {
            if(d.get('syncPending')){
                $('.editable').editable('disable')
            } else {
                $('.editable').editable('enable')
            }
        }

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            D.dispatchEvent('update_syncPending', {
                syncPending: false
            })
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
            $('#dates').text('Created '+Utils.prettyDate(webEntity.creation_date).toLowerCase()+', modified '+Utils.prettyDate(webEntity.last_modification_date).toLowerCase())
        }
    })

    // Crawl status
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            $('#crawl').html('')
            $('#crawl').append(
                $('<span/>').text(webEntity.crawling_status+' ')
            ).append(
                $('<span class="muted"/>').text('(Indexing: '+webEntity.indexing_status.toLowerCase()+') - ')
            ).append($('<a href="crawl_new.php#we_id='+webEntity.id+'">new crawl</a>'))
            
        }
    })

    // Prefixes
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
                            $('<a class="btn btn-link pull-right"/>')
                                .attr('href', Utils.LRU_to_URL(lru_prefix))
                                .attr('target', 'blank')
                                .append($('<i class="icon-share-alt"/>'))
                        )
                    )
                )
            })
            
        }
    })

    // Editable name
    D.addModule(function(){
        domino.module.call(this)
        $('#name').editable({
            type: 'text'
            ,inputclass: 'input-xlarge'
            ,title: 'Enter name'
            ,disabled: true
            ,unsavedclass: null
            ,validate: function(name){
                if(name.trim() == '')
                    return 'Must not be empty'
                D.dispatchEvent('update_syncPending', {
                    syncPending: true
                })
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
        }
    })

    // Editable home page
    D.addModule(function(){
        domino.module.call(this)
        $('#homepage').editable({
            type: 'text'
            ,inputclass: 'input-xlarge'
            ,title: 'Enter home page URL'
            ,emptytext: 'No home page'
            ,disabled: true
            ,unsavedclass: null
            ,validate: function(homepage){
                var webEntity = D.get('currentWebEntity')
                if(homepage != ''){
                    if(!Utils.URL_validate(homepage))
                        return 'URL is invalid'

                    // Check that the homepage is in one of the LRU prefixes
                    var homepage_lru = Utils.URL_to_LRU(homepage)
                        ,lru_valid = false
                    webEntity.lru_prefixes.forEach(function(lru_prefix){
                        if(homepage_lru.indexOf(lru_prefix) == 0)
                            lru_valid = true
                    })
                    if(!lru_valid)
                        return 'URL does not belong to this web entity (see the prefixes)'
                }

                D.dispatchEvent('update_syncPending', {
                    syncPending: true
                })
                D.request('setCurrentWebEntityHomepage', {shortcuts:{
                    webEntityId: webEntity.id
                    ,homepage: homepage
                }})
            }
        })
        
        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            $('#homepage').editable('option', 'value', webEntity.homepage || '')
        }
    })

    // Editable status
    D.addModule(function(){
        domino.module.call(this)
        $('#status').editable({
            type: 'select'
            ,title: 'Select status'
            ,disabled: true
            ,unsavedclass: null
            ,source: [
                {value: 'UNDECIDED', text: "UNDECIDED"}
                ,{value: 'IN', text: "IN"}
                ,{value: 'OUT', text: "OUT"}
                ,{value: 'DISCOVERED', text: "DISCOVERED"}
            ]
            ,validate: function(status){
                D.dispatchEvent('update_syncPending', {
                    syncPending: true
                })
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
        }
    })

    // User Tags
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
                ,userTagCategories = webEntity.tags.USER || {}
            
            $('#tags_User').html('')
            for(var cat in userTagCategories){
                $('#tags_User').append(
                    $('<tr/>').append(
                        $('<th/>').append(
                            $('<span/>').text(cat+"  ")
                        ).append(
                            $('<a class="btn btn-mini btn-link" title="remove"><i class="icon-remove-sign"/></a>')
                                .attr('cat', cat)
                                .click(function(){
                                    D.dispatchEvent('update_syncPending', {
                                        syncPending: true
                                    })
                                    var webEntity = D.get('currentWebEntity')
                                    D.request('setCurrentWebEntityTagValues', {shortcuts:{
                                        webEntityId: webEntity.id
                                        ,namespace: 'USER'
                                        ,key: $(this).attr('cat')
                                        ,values: []
                                    }})
                                }).mouseenter(function(){
                                    $(this).removeClass('btn-link')
                                    $(this).addClass('btn-warning')
                                    $(this).find('i').addClass('icon-white')
                                }).mouseleave(function(){
                                    $(this).addClass('btn-link')
                                    $(this).removeClass('btn-warning')
                                    $(this).find('i').removeClass('icon-white')
                                })
                            )
                    ).append(
                        $('<td/>').append(
                            $('<a></a>').editable({
                                type: 'select2'
                                ,inputclass: 'input-xxlarge'
                                ,value: userTagCategories[cat]
                                ,select2: {
                                    multiple: true
                                    ,tags: userTagCategories[cat]
                                }
                                ,title: 'Select tags'
                                ,unsavedclass: null
                                ,validate: function(values){
                                    D.dispatchEvent('update_syncPending', {
                                        syncPending: true
                                    })
                                    var webEntity = D.get('currentWebEntity')
                                    D.request('setCurrentWebEntityTagValues', {shortcuts:{
                                        webEntityId: webEntity.id
                                        ,namespace: 'USER'
                                        ,key: cat
                                        ,values: values
                                    }})
                                }
                            })
                        )
                    )
                )
            }
            $('#tags_User').append(
                $('<tr/>').append(
                    $('<th/>').append(
                        $('<a></a>').editable({
                            type: 'text'
                            ,emptyclass: 'editable'
                            ,emptytext: 'New category'
                            ,placeholder: 'Type category'
                            ,inputclass: 'input-small'
                            ,title: 'Enter new category'
                            ,disabled: false
                            ,unsavedclass: null
                            ,validate: function(cat){
                                if(cat.length==0)
                                    return 'No void category allowed'
                                if(cat.indexOf(':')>=0 || cat.indexOf('=')>=0)
                                    return 'The \':\' and \'=\' characters are forbidden'
                                // Step 2: create an editable for the values
                                $('#newTagValues').html('').append(
                                    $('<a></a>').editable({
                                        type: 'select2'
                                        ,inputclass: 'input-xxlarge'
                                        ,emptytext: 'Add tag(s) to complete'
                                        ,value: userTagCategories[cat]
                                        ,select2: {
                                            multiple: true
                                            ,tags: []
                                        }
                                        ,title: 'Select tags'
                                        ,unsavedclass: null
                                        ,validate: function(values){
                                            D.dispatchEvent('update_syncPending', {
                                                syncPending: true
                                            })
                                            var webEntity = D.get('currentWebEntity')
                                            D.request('setCurrentWebEntityTagValues', {shortcuts:{
                                                webEntityId: webEntity.id
                                                ,namespace: 'USER'
                                                ,key: cat
                                                ,values: values
                                            }})
                                        }
                                    }).editable('activate', '')
                                )
                            }
                        })
                    )
                ).append(
                    $('<td id="newTagValues"></td>')
                )
            )
        }
    })

    // Other Tags
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
            
            $('#tags_Other').html('')
            for(var namespace in webEntity.tags){
                if(namespace != "USER"){
                    $('#tags_Other').append(
                        $('<table class="table table-tags"></table>').append(
                            Object.keys(webEntity.tags[namespace]).map(function(cat, i){
                                var columns = []
                                if(i==0){
                                    columns.push(
                                        $('<th/>')
                                            .text(namespace)
                                            .attr('rowspan', Object.keys(webEntity.tags[namespace]).length)
                                    )
                                }
                                columns.push(
                                    $('<th/>').text(cat)
                                )
                                columns.push(
                                    $('<td/>').append(
                                        webEntity.tags[namespace][cat].map(function(tag){
                                            return $('<p/>').text(tag)
                                        })
                                    )
                                )
                                return $('<tr/>').append(columns)
                            })
                        )
                    )
                }
            }
        }
    })
    

    // Tree
    D.addModule(function(){
        domino.module.call(this)

        this.triggers.events['currentWebEntity_updated'] = function() {
            D.request('getCurrentWebEntityPages', {shortcuts:{
                webEntityId: D.get('currentWebEntity').id
            }})
        }

        this.triggers.events['currentWebEntityPages_updated'] = function() {
            D.request('getCurrentWebEntitySubwebentities', {shortcuts:{
                webEntityId: D.get('currentWebEntity').id
            }})
        }

        this.triggers.events['currentWebEntitySubwebentities_updated'] = function(d) {
            var webEntity = d.get('currentWebEntity')
                ,webEntityPages = d.get('currentWebEntityPages')
                ,webEntitySubwebentities = d.get('currentWebEntitySubwebentities')

            // Build web entity tree
            var tree = {children:{}}
                ,pushBranch = function(tree, lru, properties){
                    var path = tree
                        ,target = lru.split('|')

                    while(target.length>=1){
                        var stem = target.shift()
                        if(undefined === path.children[stem]){
                            // No branch for the stem: edit the tree
                            path.children[stem] = {lru_prefix: ( path.lru_prefix === undefined ) ? ( stem ) : ( path.lru_prefix + '|' + stem )}
                            path.children[stem].children = {}
                        }
                        path = path.children[stem]
                        
                        if(target.length==0) // Copy the properties
                            for(k in properties){
                                path[k] = properties[k]
                            }
                    }
                }

            webEntitySubwebentities.forEach(function(swe){
                // console.log('Sub web entity', swe)
                swe.lru_prefixes.filter(function(swe_prefix){
                    return webEntity.lru_prefixes.some(function(source_prefix){
                        return swe_prefix.indexOf(source_prefix) == 0
                    })
                }).forEach(function(swe_prefix){
                    pushBranch(tree, swe_prefix, {subWebEntity_prefix:swe_prefix, subWebEntity:swe})
                })
            })
            webEntity.lru_prefixes.forEach(function(lru_prefix){
                pushBranch(tree, lru_prefix, {prefix:lru_prefix})
            })
            webEntityPages.forEach(function(page){
                pushBranch(tree, page.lru, {page:page})
            })
            
            

            // Display the tree
            var itemCount = 0
                ,displayBranch = function(branch){
                var stack = $('<div class="stack"/>')
                if(branch.children !== undefined && Object.keys(branch.children).length>0){
                    stack.append(
                        Object.keys(branch.children).map(function(name){
                            var subBranch = branch.children[name]
                                ,cleanName = name.substring(2, name.length).trim()
                                ,item = $('<div class="item"/>')
                                ,popoverContent = $('<div/>')

                            // Build item
                            item.attr('id', 'treeItem-'+ ++itemCount)
                            if(subBranch.subWebEntity !== undefined)
                                item.addClass('treeItem-subWebEntity')
                            
                            // icons
                            if(subBranch.prefix !== undefined)
                                item.append(
                                    $('<i class="icon-map-marker"/>').tooltip({
                                        title:'It is a <strong>prefix</strong>'
                                    })
                                )
                            if(subBranch.page !== undefined)
                                item.append(
                                    $('<i class="icon-file"/>').tooltip({
                                        title:'It is a <strong>page</strong>'
                                    })
                                )
                            if(subBranch.subWebEntity !== undefined)
                                item.append(
                                    $('<i class="icon-book icon-white"/>').tooltip({
                                        title:'This prefix defines <strong>another web entity</strong>'
                                    })
                                )

                            // Popover
                            if(subBranch.subWebEntity !== undefined){
                                popoverContent.append(
                                    $('<p/>').append(
                                        $('<strong/>').text('Web entity:')
                                    ).append(
                                        $('<span/>').text(' '+subBranch.subWebEntity.name)
                                    )
                                ).append(
                                    $('<br/>')
                                ).append(
                                    $('<p/>').append(
                                        $('<a class="btn btn-link"><i class="icon-pencil"/> Edit web entity</a>')
                                            .attr('href', 'webentity_edit.php?dummy='+Math.round(Math.random()*100)+'#we_id='+subBranch.subWebEntity.id)
                                    )
                                )
                                if(subBranch.subWebEntity.homepage != undefined)
                                    popoverContent.append(
                                        $('<p/>').append(
                                            $('<a class="btn btn-link" target="_blank"><i class="icon-share-alt"/> Browse web entity</a>')
                                                .attr('href', subBranch.subWebEntity.homepage)
                                        )
                                    )
                            }
                            if(subBranch.page !== undefined)
                                popoverContent.append(
                                    $('<p/>').append(
                                        $('<a class="btn btn-link" target="_blank"><i class="icon-share-alt"/> Browse page</a>')
                                            .attr('href', subBranch.page.url)
                                    )
                                )
                            if(subBranch.subWebEntity === undefined && subBranch.prefix === undefined)
                                popoverContent.append(
                                    $('<p/>').append(
                                        $('<a class="btn btn-link newwebentity-button"><i class="icon-plus"/> Declare new web entity</a>')
                                            .attr('data-lru-prefix', subBranch.lru_prefix)
                                    )
                                )

                            item.append(
                                $('<a class="overable"/>').append(
                                    (cleanName == "")?(
                                        $('<em class="muted"/>').text(' (blank) ')
                                    ):(
                                        $('<span/>').text(' '+cleanName+' ')
                                    )
                                ).popover({
                                    trigger: 'manual'
                                    ,placement:'top'
                                    ,title: 'Actions <a class="btn pull-right btn-mini btn-link close-button"><i class="icon-remove"/></a>'
                                    ,content:popoverContent
                                }).attr('id', 'treeItem_a-'+itemCount).click(function(){
                                    if($(this).attr('id') == D.get('treeItemPopover')){
                                        D.dispatchEvent('update_treeItemPopover', {
                                            treeItemPopover: ''
                                        })
                                    } else {
                                        D.dispatchEvent('update_treeItemPopover', {
                                            treeItemPopover: $(this).attr('id')
                                        })
                                    }
                                })
                            )

                            // Display item
                            return $('<table/>').append(
                                $('<tr/>').append(
                                    $('<td class="spacer"/>').append($('<div/>'))
                                )
                            ).append(
                                $('<tr/>').append(
                                    $('<td class="itemContainer"/>')
                                        // .attr('title', cleanName)
                                        .append(item)
                                ).append(
                                    $('<td/>').append(displayBranch(subBranch))
                                )
                            )
                        })
                    )

                }
                return stack
            }
            $('#contentTree').html('').append(displayBranch(tree))
            $('#contentTreeContainer').overscroll({direction:'horizontal', scrollLeft:315, captureWheel:false})
                .on('overscroll:dragstart', function(){
                    D.dispatchEvent('update_treeItemPopover', {
                        treeItemPopover: ''
                    })
                });


        }
        // Deal with popovers
        this.triggers.events['update_treeItemPopover'] = function(d){
            var item = D.get('treeItemPopover')
            if(item !== undefined && item!='')
                $('#'+item).popover('hide')
        }
        this.triggers.events['treeItemPopover_updated'] = function(d){
            var item = D.get('treeItemPopover')
            if(item !== undefined && item!='')
                $('#'+item).popover('show')

                // Initialize actions
                $('.popover a.close-button').click(function(){
                    D.dispatchEvent('update_treeItemPopover', {
                        treeItemPopover: ''
                    })
                })
                $('.popover a.newwebentity-button')
                    .click(function(){
                        D.request('createWebEntityByLru', {shortcuts:{
                            lru_prefix: $(this).attr('data-lru-prefix')
                        }})
                    })/*.mouseenter(function(){
                        $(this).removeClass('btn-link')
                        $(this).addClass('btn-warning')
                        $(this).find('i').addClass('icon-white')
                    }).mouseleave(function(){
                        $(this).addClass('btn-link')
                        $(this).removeClass('btn-warning')
                        $(this).find('i').removeClass('icon-white')
                    })*/
        }
        this.triggers.events['update_currentWebEntity'] = function(d){
            D.dispatchEvent('update_treeItemPopover', {
                treeItemPopover: ''
            })
        }
        
    })


    // Reload all current web entity on property update
    D.addModule(function(){
        domino.module.call(this)

        var reload = function() {
            D.request('getCurrentWebEntity', {shortcuts:{
                webEntityId: D.get('currentWebEntity').id
            }})
        }

        this.triggers.events['nameValidation_updated'] = reload
        this.triggers.events['statusValidation_updated'] = reload
        this.triggers.events['homepageValidation_updated'] = reload
        this.triggers.events['tagValuesValidation_updated'] = reload
        this.triggers.events['createWebEntityByLruValidation_updated'] = reload
    })


    //// On load, get the web entity
    $(document).ready(function(e){
        D.request('getCurrentWebEntity', {shortcuts:{
            webEntityId: Utils.hash.get('we_id')
        }})
    })

})(jQuery, domino)