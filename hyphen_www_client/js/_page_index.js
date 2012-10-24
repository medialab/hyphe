;(function(Hyphen, $, undefined){
    
    // On load
	$(document).ready(function(){

		Hyphen.controller.core.webEntities_update()
		Hyphen.controller.core.crawlJobs_update()


	})

})(window.Hyphen = window.Hyphen || {}, jQuery)