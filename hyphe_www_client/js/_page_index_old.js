;(function(Hyphen, $, undefined){
    // On load
	$(document).ready(function(){

		Hyphen.controller.core.webEntities_update()

		// Select2
		var webentity_format = function(state){
			if (!state.id)
				return state.text // optgroup
            return "<img src='res/icon-we-16.png'/> " + state.text
		}
		$("#webentities_selector").select2({
            query: function (query) {
                var data = {results: []}, i, j, s
                
                Hyphen.model.webEntities.getAll().forEach(function(we){
                	if(we.searchable.match(query.term))
                		data.results.push({id: we.id, text: we.name});
                })
                query.callback(data);
            },
            placeholder: "Select a Web Entity",
            allowClear: true,
            formatResult: webentity_format,
            formatSelection: webentity_format
        })

	})



    // View


    // GENERIC (all, miscillaneous...)

    $('#reinitialize_all').click(function(){
        Hyphen.controller.core.reinitialize_all();
    })

    $('#page_add').click(function(){
        Hyphen.controller.core.webEntities_declare(['http://warincontext.org/','http://warincontext.org/american-empire/'])
    })





    
    
    // WEB ENTITY BROWSER

    // The Select2 selector triggers the right event
    $("#webentities_selector").on("change", function(e){
        Hyphen.controller.core.weBrowser_setWebEntityFocus( $("#webentities_selector").val() )
    })

    $(document).on( "/weBrowser", function(event, eventData){
        switch(eventData.what){
            case "focusUpdated":
                var we_id = Hyphen.model.uxSettings.get('focusedWebEntityId')
                
                Hyphen.model.uxSettings.set('browserPath','')
                if(we_id == "")
                    browserUpdate()
                else
                    Hyphen.controller.core.webEntity_getPages(we_id)

                break

            case "pathUpdated":
                var we_id = Hyphen.model.uxSettings.get('focusedWebEntityId')
                browserUpdate()
                break
        }
    })

    $(document).on( "/webentity", function(event, eventData){
        var we_id = Hyphen.model.uxSettings.get('focusedWebEntityId')
        
        if(eventData.webEntity_id == we_id){
            switch(eventData.what){
                case "pagesUpdated":

                browserUpdate()

                break
            }
        }
    })

    browserUpdate = function(){
        var we_id = Hyphen.model.uxSettings.get('focusedWebEntityId')
        $('.weBrowser').html('')
        $('.weBrowserPath').html('')
        
        if(we_id == ''){
            $('.weBrowserPath').append(
                $('<li/>').append($('<span class="divider">/</span>'))
            )

        } else {
            var we = Hyphen.model.webEntities.get(we_id)
            ,pages = Hyphen.model.webEntities.getPages(we_id)
            ,path = Hyphen.model.uxSettings.get('browserPath')
            
            $('.weBrowserPath').append(
                $('<li/>').append(
                    $('<a href="#"/>')
                        .append('<img src="res/icon-we-16.png"/>')
                        .click(function(){
                            Hyphen.controller.core.weBrowser_setPath('')
                        })
                ).append($('<span class="divider">/</span>'))
            )

            if(path == ''){
                we.lru_prefixes.forEach(function(lru_prefix){
                    var fixed_lru_prefix = Hyphen.utils.LRU_prefix_fix(lru_prefix)
                        ,url = Hyphen.utils.LRU_to_URL(fixed_lru_prefix)
                        ,url_simplified = Hyphen.utils.URL_simplify(url)
                        ,itemButton = $('<button class="btn btn-large btn-weBrowser-prefix" type="button"><p><img src="res/icon-folder-64.png"/></p><p>'+Hyphen.utils.htmlEncode(url_simplified)+'</p></button>')
                    $('.weBrowser').append(itemButton)
                    itemButton.click(function(){
                        Hyphen.controller.core.weBrowser_setPath(fixed_lru_prefix)
                    })
                })
            } else {
                // For writing the path, we need to know which is the lru_prefix containing this path
                var lru_prefix_container = ''
                we.lru_prefixes.forEach(function(lp){
                    lp = Hyphen.utils.LRU_prefix_fix(lp)
                    if(path.indexOf(lp) == 0)
                        lru_prefix_container = lp
                })

                $('.weBrowserPath').append(
                    $('<li/>').append(
                        $('<a href="#"/>').text(lru_prefix_container.split('|').map(function(d){return d.split(':')[1]}).join(' / '))
                            .click(function(){
                                Hyphen.controller.core.weBrowser_setPath(lru_prefix_container)
                            })
                    )
                )
                var tempPath = lru_prefix_container
                path.replace(new RegExp(lru_prefix_container.replace(/\|/gi, '\\|')+'\\|?', "i"), '')
                    .split('|')
                    .map(function(d){
                        tempPath = tempPath + '|' + d
                        return {stem:d.split(':')[1], path:tempPath}
                    })
                    .forEach(function(d){
                        //tempPath = tempPath+'|'+
                        $('.weBrowserPath').append(
                            $('<li/>').append($('<span class="divider">/</span>'))
                                .append($('<a href="#"/>').text(d.stem)
                                    .click(function(){
                                        Hyphen.controller.core.weBrowser_setPath(d.path)
                                    })
                                )
                            )
                    })

                var match = RegExp(path.replace(/\|/gi, '\\|')+'\\|([^\\|]*)', "i")
                    ,stems = d3.nest()
                        .key(function(d) { return d.stem; })
                        .entries(pages.map(function(p){
                                var result = match.exec(p)
                                return({page_lru:p, result:result})
                            }).filter(function(d){
                                return d.result && d.result.length>0
                            }).map(function(d){
                                return {page_lru: d.page_lru, stem:d.result[1]}
                            })
                        )
                    ,folders = []
                    ,pages = []

                stems.forEach(function(p){
                    var pagesCount = p.values.length
                        ,it_is_a_page = false
                    if(pagesCount == 1){
                        if(p.values[0].page_lru == path+'|'+p.key)
                            it_is_a_page = true
                    }
                    if(it_is_a_page)
                        pages.push(p)
                    else
                        folders.push(p)
                })
                
                folders.forEach(function(p){
                    // Folder
                    var title = p.key.split(':')[1]
                    if(title == "")
                        title = '<empty>'
                    var itemButton = $('<button title="'+p.values.length+' pages" class="btn btn-weBrowser-folder" type="button"><p><img src="res/icon-folder-64.png"/></p><p>'+Hyphen.utils.htmlEncode(title)+'</p></button>')
                    $('.weBrowser').append(itemButton)
                    itemButton.click(function(){
                        Hyphen.controller.core.weBrowser_setPath(path+'|'+p.key)
                    })
                })

                pages.forEach(function(p){
                    // Page
                    var title = p.key.split(':')[1]
                    if(title == "")
                        title = '<empty>'
                    console.log(p)
                    var itemButton = $('<button class="btn btn-weBrowser-page" type="button"><p><img src="res/icon-page-64.png"/></p><p>'+Hyphen.utils.htmlEncode(title)+'</p></button>')
                        .attr('title', Hyphen.utils.LRU_to_URL(p.values[0].page_lru))
                    $('.weBrowser').append(itemButton)
                    itemButton.click(function(){
                        //Hyphen.controller.core.weBrowser_setPath(Hyphen.utils.URL_to_LRU(path.replace(/\|p:$/, '')+(p.key)))
                    })
                })
            }
        }
    }

    // CRAWLS

    // Refresh list
    $('#crawljobs_refresh').click(function(){
        Hyphen.controller.core.crawlJobs_update();
    })

    // Reset crawls
    $('#crawljobs_reset').click(function(){
        Hyphen.controller.core.crawlJobs_reinitialize();
    })

})(window.Hyphen = window.Hyphen || {}, jQuery)