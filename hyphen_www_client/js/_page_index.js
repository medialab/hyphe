;(function(Hyphen, $, undefined){
    
    // On load
	$(document).ready(function(){

		Hyphen.controller.core.webEntities_update()
		Hyphen.controller.core.crawlJobs_update()


	})

	// View

	$('#reinitialize_all').click(function(){
		Hyphen.controller.core.reinitialize_all()
	})

})(window.Hyphen = window.Hyphen || {}, jQuery)