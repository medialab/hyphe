;(function(Hyphen, $, undefined){
    
    // On load
	$(document).ready(function(){
		// Update web entities list on load
        Hyphen.controller.core.webEntities_update()

        Hyphen.view.weSelector_init()

	})


    /// Model

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
        Hyphen.controller.core.declareWebEntityByURL(url, function(webEntity){
            
            $("#webentities_selector").select2("val", webEntity.id)

            Hyphen.controller.core.selectWebEntity(webEntity.id)
        })
    })

    // Choosing an existing web entity with the select2
    $("#webentities_selector").on("change", function(e){
        Hyphen.controller.core.selectWebEntity( $("#webentities_selector").val() )
    })

    // Updating the 'start pages' table
    $(document).on( "/webentity_focus", function(event, eventData){
        switch(eventData.what){
            case "updated":
                var we_id = Hyphen.model.vars.get('focused_webentity_id')
                $('#startPagesTable').html('')
                if(we_id != ''){
                    var we = Hyphen.model.webEntities.get(we_id)
                        // ,startPages = we.startPages
                        ,startPages = ['http://www.google.com', 'http://www.fromhell.com']
                    startPages.forEach(function(sp){
                        $('#startPagesTable').append(
                            $('<tr/>')
                            .append(
                                $('<td/>').append($('<small/>').append($('<a target="_blank"/>').attr('href',sp).text(sp)))
                                )
                            .append($('<td/>').append($((startPages.length>1)?('<button class="close">&times;</button>'):(''))))
                        )
                    })
                } else {
                    $('#startPagesTable').html('<tr><td><span class="muted">Choose a web entity</span></td></tr>')
                }

                break
        }
    })

    // Launch button (and its title)
    $(document).on( "/webentity_focus", function(event, eventData){
        switch(eventData.what){
            case "updated":
                var we_id = Hyphen.model.vars.get('focused_webentity_id')
                if(we_id != '')
                    $('#launchButton').attr('title', '')
                else
                    $('#launchButton').attr('title', 'Please choose a web entity')
                break
        }
    })


    /// Controller
    
    Hyphen.controller.core.selectWebEntity = function(we_id){
        Hyphen.model.vars.set('focused_webentity_id', we_id)    
        $(document).trigger( "/webentity_focus", [{what:'updated'}])
    }




})(window.Hyphen = window.Hyphen || {}, jQuery)