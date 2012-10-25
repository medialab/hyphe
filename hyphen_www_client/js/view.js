;(function($, undefined){

    Hyphen.view = {}

	// Generic quantities
	$(document).on( "/webentities", function(event, eventData){
        switch(eventData.what){
            case "updated":
            
            var l = Hyphen.model.webEntities.getAll().length
            $('.content_webEntityCount').text(l)
            $('.content_webEntityCount_text').text((l>1)?('web entities'):('web entity'))

            break
        }
    })

    $(document).on( "/crawls", function(event, eventData){
        switch(eventData.what){
            case "updated":
            
            var l = Hyphen.model.crawlJobs.getAll().length
            $('.content_crawlJobsCount').text(l)
            $('.content_crawlJobsCount_text').text((l>1)?('crawl jobs'):('crawl job'))

            break
        }
    })

    // Web entities proxies
    $(document).on( "/webentities", function(event, eventData){
        switch(eventData.what){
            case "updated":
            Hyphen.view.webEntities.proxiesUpdate()
            break
        }
    })
    Hyphen.view.webEntities = {}
    Hyphen.view.webEntities.proxiesUpdate = function(onlyOutdated){
        $('.webEntity_proxy').each(function(i,proxy){
            Hyphen.view.webEntities.replaceProxyElement($(proxy), onlyOutdated)
            
        })
    }
    Hyphen.view.webEntities.replaceProxyElement = function(proxyElement, onlyOutdated){
        var we_id = proxyElement.attr('webEntity_id')
            ,we = Hyphen.model.webEntities.get(we_id)
        if(!(onlyOutdated && proxyElement.hasClass('webEntity_proxy_updated'))){
            var creationDate = new Date()
                ,lastModificationDate = new Date()
            creationDate.setTime(we.creation_date)
            lastModificationDate.setTime(we.last_modification_date)
            proxyElement.html('')
            proxyElement.addClass('webEntity_proxy_updated')
            proxyElement.append(
                $('<span/>').text(we.name)
                    .addClass('info_tooltip')
                    .popover({
                        trigger:'hover'
                        ,title: $('<img src="res/icon-we-16.png"/>').after($('<span/>').text(' '+we.name))
                        ,content:
                            $('</p>').append(
                                $('<strong/>').text('Status: ')
                            ).append(
                                $('<span class="label"/>').text(we.status)
                                    .addClass(Hyphen.view.webEntities_status_getLabelColor(we.status))
                            ).after($('</p>').append(
                                    $('<strong/>').text('Last crawl: ')
                                ).append(
                                    $('<br/>')
                                ).append(
                                    $('<span class="label"/>').text('Harvesting: '+we.crawling_status.replace('_', ' ').toLowerCase())
                                        .addClass(Hyphen.view.crawlJobs_crawling_getLabelColor(we.crawling_status))
                                ).append(
                                    $('<span/>').text(' ')
                                ).append(
                                    $('<span class="label"/>').text('Indexing: '+we.indexing_status.replace('_', ' ').toLowerCase())
                                        .addClass(Hyphen.view.crawlJobs_indexing_getLabelColor(we.indexing_status))
                                ).append(
                                    $('<span/>').text(' ')
                                )
                            ).after($('</p>').append(
                                    $('<strong/>').text('Created: ')
                                ).append(
                                    $('<span/>').text(Hyphen.utils.prettyDate(creationDate))
                                        .attr('title', creationDate)
                                ).append(
                                    $('<br/>')
                                ).append(
                                    $('<strong/>').text('Modified: ')
                                ).append(
                                    $('<span/>').text(Hyphen.utils.prettyDate(lastModificationDate))
                                        .attr('title', lastModificationDate)
                                )
                            )
                    })
            )
        }
        return proxyElement
    }

    // Glossary & Tooltip informations
    $('.info_start_pages').attr('title', "The <strong>start pages</strong> define where the crawler starts. They are used to compute the depth of other pages.")

	$(document).ready(function () {
	    $(".info_tooltip").tooltip()
  	})

    // Color codes
    Hyphen.view.crawlJobs_crawling_getLabelColor = function(status){
        var crawling_colorClass
        if(status.toLowerCase() == "finished")
            crawling_colorClass = 'label-success'
        else if(status.toLowerCase().indexOf("crashed") >= 0)
            crawling_colorClass = 'label-important'
        else if(status.toLowerCase() == "pending")
            crawling_colorClass = 'label-warning'
        else if(status.toLowerCase() == "canceled")
            crawling_colorClass = 'label-inverse'
        else
            crawling_colorClass = ''
        return crawling_colorClass
    }
    Hyphen.view.crawlJobs_indexing_getLabelColor = function(status){
        var indexing_colorClass
        if(status.toLowerCase() == "finished")
            indexing_colorClass = 'label-success'
        else if(status.toLowerCase().indexOf("crashed") >= 0)
            indexing_colorClass = 'label-important'
        else if(status.toLowerCase() == "pending")
            indexing_colorClass = 'label-warning'
        else
            indexing_colorClass = ''
        return indexing_colorClass
    }
    Hyphen.view.webEntities_status_getLabelColor = function(status){
        return (status=='DISCOVERED')?('label-warning'):(
                (status=='UNDECIDED')?('label-info'):(
                    (status=='OUT')?('label-important'):(
                        (status=='OUT')?('label-success'):('')
                    )
                )
            )
    }


})(jQuery)
