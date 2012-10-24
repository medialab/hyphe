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



    // Glossary & Tooltip informations
    $('.info_start_pages').attr('title', "The <strong>start pages</strong> define where the crawler starts. They are used to compute the depth of other pages.")

	$(document).ready(function () {
	    $(".info_tooltip").tooltip()
  	})


})(jQuery)
