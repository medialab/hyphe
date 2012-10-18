;(function($, undefined){

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



    // Glossary & Tooltip informations
    $('.info_start_pages').attr('title', "The <strong>start pages</strong> define where the crawler starts. They are used to compute the depth of other pages.")

	$(document).ready(function () {
	    $(".info_tooltip").tooltip()
  	})


})(jQuery)
