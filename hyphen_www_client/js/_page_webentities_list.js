;(function(Hyphen, $, undefined){
    
    // On load
	$(document).ready(function(){

		Hyphen.controller.core.webEntities_update()

		Hyphen.integration.initDataTables()
		/* Table initialisation */
		$(document).ready(function() {
			$('.dataTable').dataTable( {
				"sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>",
				"sPaginationType": "bootstrap",
				"oLanguage": {
					"sLengthMenu": '_MENU_ web entities at once',
					"sZeroRecords": '<span class="text-error">Nothing found - sorry</span>',
		            "sInfo": '<span class="muted">Showing </span>_START_ to _END_<span class="muted"> of _TOTAL_ records</span>',
            		"sInfoEmpty": '<span class="text-warning">Showing 0 to 0 of 0 records</span>',
            		"sInfoFiltered": '<span class="text-info">(filtered from _MAX_ total records)</span>'
				}
			} )
		} )
	})

})(window.Hyphen = window.Hyphen || {}, jQuery)