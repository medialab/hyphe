;(function(Hyphen, $, undefined){
    
    // On load
	$(document).ready(function(){
		// Update web entities list on load
        Hyphen.controller.core.webEntities_update()
        Hyphen.view.launchButton_updateState()

        Hyphen.view.weSelector_init()

	})

    /// View

    // Selector
    Hyphen.view.weSelector_init = function(){
        // Web entities selector (select2)
        var webentity_format = function(state){
            if (!state.id)
                return state.text // optgroup
            return "<img src='res/icon-we-16.png'/> " + state.text
        }
        $("#webentities_selector").select2({
            query: Hyphen.view.weSelector_getQueryFunction(),
            placeholder: "Select an existing web entity",
            allowClear: true,
            formatResult: webentity_format,
            formatSelection: webentity_format,
            initSelection: function (element, callback) {
                var we_id = element.val()
                var matches = []
                Hyphen.model.webEntities.getAll().forEach(function(we){
                    if(we.id == we_id)
                        matches.push({id: we.id, text: we.name})
                })
                callback(matches[0])
            }
        })
    }

   Hyphen.view.weSelector_getQueryFunction = function(){
        return function (query) {
            var data = {results: []}, i, j, s
            
            Hyphen.model.webEntities.getAll().forEach(function(we){
                if(we.searchable.match(query.term))
                    data.results.push({id: we.id, text: we.name})
            })
            query.callback(data)
        }
    }

    // Declare web entity by URL
    $('#webEntityByURL_button').click(function(){
        var url = $('#urlField').val()
        Hyphen.controller.core.declareWebEntityByURL(url)
    })
    // On web entity declared
    $(document).on( "/webentity", function(event, eventData){
        switch(eventData.what){
            case "declared":
                var we_id = eventData.webEntity_id
                    ,url = eventData.source_url
                    ,we = Hyphen.model.webEntities.get(we_id)

                // Hack: add the asked URL to the web entity as a start page
                console.log("we_id: "+we_id+" url: "+url)
                Hyphen.controller.core.webEntity_addStartPage(we_id, url)
                $('#startPages_messages').html('')
                    .append(
                        $('<div class="alert alert-warning"/>').html('Sending page to the server...')
                    )

                $("#webentities_selector").select2("val", we.id)
                Hyphen.controller.core.selectWebEntity(we.id)

                break
        }
    })
    // Choosing an existing web entity with the select2
    $("#webentities_selector").on("change", function(e){
        Hyphen.controller.core.selectWebEntity( $("#webentities_selector").val() )
    })

    // Updating the 'start pages' table
    $(document).on( "/webentity_focus", function(event, eventData){
        switch(eventData.what){
            case "updated":
                Hyphen.view.startPages_updateTable()
                break
        }
    })
    $(document).on( "/webentities", function(event, eventData){
        switch(eventData.what){
            case "updated":
                var we_id = Hyphen.model.vars.get('focused_webentity_id')
                if(we_id != '' && we_id !== undefined)
                    Hyphen.view.startPages_updateTable()
                break
        }
    })

    // Start pages
    // Add start page
    $('#startPages_add').click(function(){
        var startPage_url = $('#startPages_urlInput').val()
        if(startPage_url=='' || startPage_url === undefined){
            // No start page: do nothing
        } else if(!Hyphen.utils.URL_validate(startPage_url)){
            // The URL is invalid
            $('#startPages_messages').html('')
                .append(
                    $('<div class="alert alert-error"/>').html('<strong>Invalid URL.</strong> This string is not recognized as an URL. Check that it begins with "http://".')
                )
        } else {
            // Check that the start page is in one of the LRU prefixes
            var startPage_lru = Hyphen.utils.URL_to_LRU(startPage_url)
                ,lru_valid = false
                ,we_id = Hyphen.model.vars.get('focused_webentity_id')
                ,we = Hyphen.model.webEntities.get(we_id)
            we.lru_prefixes.forEach(function(lru_prefix){
                if(startPage_lru.indexOf(lru_prefix) == 0)
                    lru_valid = true
            })
            if(!lru_valid){
                // The start page does not belong to any LRU_prefix...
                $('#startPages_messages').html('')
                    .append(
                        $('<div class="alert alert-error"/>').html('<strong>Invalid start page.</strong> This page does not belong to the web entity.')
                    )
            } else {
                Hyphen.controller.core.webEntity_addStartPage(we_id, startPage_url)
                $('#startPages_messages').html('')
                    .append(
                        $('<div class="alert alert-warning"/>').html('Sending page to the server...')
                    )
            }
        }
    })
    
    // When page added
    $(document).on( "/webentity", function(event, eventData){
        switch(eventData.what){
            case "startpage_added":
                var we_id = Hyphen.model.vars.get('focused_webentity_id')
                $('#startPages_messages').html('')
                    .append(
                        $('<div class="alert alert-success"/>').html('Start page added')
                    )
                Hyphen.controller.core.webEntities_update([eventData.webEntity_id])
                break

            case "startpage_removed":
                var we_id = Hyphen.model.vars.get('focused_webentity_id')
                $('#startPages_messages').html('')
                    .append(
                        $('<div class="alert alert-success"/>').html('Start page removed')
                    )
                Hyphen.controller.core.webEntities_update([eventData.webEntity_id])
                break
        }
    })
    Hyphen.view.startPages_updateTable = function(){
        var we_id = Hyphen.model.vars.get('focused_webentity_id')
        $('#startPagesTable').html('')
        if(we_id != '' && we_id !== undefined){
            var we = Hyphen.model.webEntities.get(we_id)
                ,startPages = we.startpages
            if(startPages.length>0){
                startPages.forEach(function(sp){
                    var tr = $('<tr class="startPage_tr"/>')
                    $('#startPagesTable').append(tr)
                    tr.append(
                        $('<td/>').append($('<small/>').append($('<a target="_blank" class="unchecked"/>').attr('href',sp).text(sp+'  ')))
                    )
                    if(startPages.length>1){
                        tr.append(
                            $('<td/>').append(
                                $('<button class="close">&times;</button>').click(function(){
                                    $('#startPages_messages').html('')
                                        .append(
                                            $('<div class="alert alert-warning"/>').html('Removing server-side...')
                                        )
                                    Hyphen.controller.core.webEntity_removeStartPage(we_id, sp)
                                })
                            )
                        )
                    } else {
                        tr.append($('<td/>'))
                    }
                })
            } else {
                // No start page: propose to import from LRU_prefixes
                $('#startPagesTable').append(
                    $('<tr class="startPage_tr"/>').append(
                        $('<td/>').text('No start page')
                    ).append(
                        $('<td/>').append(
                            $('<button class="btn btn-small pull-right">Use prefixes as start pages</button>').click(function(){
                                $('#startPages_messages').html('')
                                    .append(
                                        $('<div class="alert alert-info"/>').html('Use prefixes as start pages...')
                                    )
                                we.lru_prefixes.forEach(function(lru_prefix){
                                    Hyphen.controller.core.webEntity_addStartPage(we.id, Hyphen.utils.LRU_to_URL(lru_prefix))
                                })
                            })
                        )
                    )
                )
                    
            }
            $('#startPages_add').removeClass('disabled')
            $('#startPages_urlInput').removeAttr('disabled')
        } else {
            $('#startPagesTable').html('<tr><td><span class="muted">Choose a web entity</span></td></tr>')
            $('#startPages_add').addClass('disabled')
            $('#startPages_urlInput').attr('disabled', true)
        }
        Hyphen.view.startPages_cascadeCheck()
        Hyphen.view.launchButton_updateState()
    }

    Hyphen.view.startPages_cascadeCheck = function(){
        var uncheckedElements = $('.startPage_tr td a.unchecked')
        if(uncheckedElements.length > 0){
            var a = $(uncheckedElements[0])
                ,url = a.attr('href')
            Hyphen.controller.core.lookup(url)
        } else {
            Hyphen.view.launchButton_updateState()
        }
    }
    Hyphen.view.startPages_cascadeUpdate = function(url, status){
        var candidate = ''

        $('.startPage_tr td a.unchecked').each(function(i,el){
            if(candidate == '' && $(el).attr('href') == url){
                candidate = $(el)
            }
        })

        if(candidate != ''){
            // We have a valid target for the update
            candidate.removeClass('unchecked')
            if(status==200){
                // We have a valid URL
                candidate.parent().parent().parent().addClass('success')
                candidate.append($('<i class="icon-ok info_tooltip"/>').attr('title', 'Valid start page').tooltip())
            } else if([300, 301, 302].some(function(test){return status==test})){
                // Redirection
                candidate.addClass('invalid')
                candidate.parent().parent().parent().addClass('warning')
                candidate.append($('<i class="icon-warning-sign info_tooltip"/>').attr('title', 'This page has a <strong>redirection</strong>. Please click on the link and use the right URL.').tooltip())
            } else {
                // Fail
                candidate.addClass('invalid')
                candidate.parent().parent().parent().addClass('error')
                candidate.append($('<i class="icon-warning-sign info_tooltip"/>').attr('title', '<strong>Invalid page.</strong> This URL has no proper page associated. You must use other start pages.').tooltip())
            }
            Hyphen.view.startPages_cascadeCheck()
        }
        
    }
    // On lookup result: update table and keep looking up
    $(document).on( "/lookup", function(event, eventData){
        switch(eventData.what){
            case "looked":
                Hyphen.view.startPages_cascadeUpdate(eventData.url, eventData.status)
                break
        }
    })




    // Depth input
    $('#depth').change(function(){
        Hyphen.view.launchButton_updateState()
    })



    // Launch button (and its title)
    $('#launchButton').click(function(){
        var maxdepth = $('#depth').val()
            ,we_id = Hyphen.model.vars.get('focused_webentity_id')
        if(we_id && maxdepth && Hyphen.utils.checkforInteger(maxdepth)){
            $('#launchButton').addClass('disabled')
            Hyphen.controller.core.webEntity_crawl(we_id, maxdepth)
        }
    })
    $(document).on( "/webentity_focus", function(event, eventData){
        switch(eventData.what){
            case "updated":
                Hyphen.view.launchButton_updateState()
                break
        }
    })
    Hyphen.view.launchButton_updateState = function(){
        var we_id = Hyphen.model.vars.get('focused_webentity_id')
        if(we_id == '' || we_id === undefined){
            // no web entity selected
            $('#launchButton').addClass('disabled')
            $('#launchButton').attr('title', 'You must pick a web entity')
            $('#crawlLaunch_messages').html('')
                .append(
                    $('<div class="alert alert-info"/>').html('You must <strong>pick a web entity</strong> or declare a new one')
                )
        } else {
            var we = Hyphen.model.webEntities.get(we_id)
                ,startPages = we.startpages
            if(!(startPages.length>0)){
                // There is a web entity but there are no starting pages
                $('#launchButton').addClass('disabled')
                $('#launchButton').attr('title', 'You must set at least one start page')
                $('#crawlLaunch_messages').html('')
                    .append(
                        $('<div class="alert alert-error"/>').html('<strong>No start page.</strong> You must define on which page the crawler will start')
                    )
            } else {
                if($('.startPage_tr td a.unchecked').length > 0){
                    // Waiting for start pages validation
                    $('#launchButton').addClass('disabled')
                    $('#launchButton').attr('title', 'Wait for start pages validation')
                    $('#crawlLaunch_messages').html('')
                        .append(
                            $('<div class="alert alert-info"/>').html('Waiting for start pages validation...')
                        )
                } else if($('.startPage_tr td a.invalid').length > 0){
                    // There are some invalid start pages
                    $('#launchButton').addClass('disabled')
                    $('#launchButton').attr('title', 'Invalid start pages')
                    $('#crawlLaunch_messages').html('')
                        .append(
                            $('<div class="alert alert-warning"/>').html('<strong>Invalid start pages.</strong> Please check that start pages are not redirected and are actually working.')
                        )
                } else {
                    // There is a web entity and it has valid start pages
                    var maxdepth = $('#depth').val()
                    if(!Hyphen.utils.checkforInteger(maxdepth)){
                        // The depth is not an integer
                        $('#launchButton').addClass('disabled')
                        $('#launchButton').attr('title', 'Max depth must be an integer')
                        $('#crawlLaunch_messages').html('')
                            .append(
                                $('<div class="alert alert-error"/>').html('<strong>Wrong depth.</strong> The maximum depth must be an integer')
                            )
                    } else {
                        // Everything's OK !
                        $('#launchButton').removeClass('disabled')
                        $('#launchButton').attr('title', '')
                        $('#crawlLaunch_messages').html('')
                    }
                }
            }
            $('#launchButton').attr('title', '')
        }
    }

    // Redirection on crawl launched
    $(document).on( "/crawl", function(event, eventData){
        switch(eventData.what){
            case "launched":
                window.location = "crawl.php"
                break
        }
    })

    /// Controller
    
    Hyphen.controller.core.selectWebEntity = function(we_id){
        Hyphen.debug.log(["Hyphen.controller.core.selectWebEntity: " + we_id], 1)
        Hyphen.model.vars.set('focused_webentity_id', we_id)    
        $(document).trigger( "/webentity_focus", [{what:'updated'}])
    }





})(window.Hyphen = window.Hyphen || {}, jQuery)