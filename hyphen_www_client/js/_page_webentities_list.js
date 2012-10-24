;(function(Hyphen, $, undefined){
    
    // On load
	$(document).ready(function(){

		Hyphen.integration.initDataTables()
		/* Table initialisation */
		$('.dataTable').dataTable( {
			"sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>"
			,"sPaginationType": "bootstrap"
			,"oLanguage": {
				"sLengthMenu": '_MENU_ web entities at once',
				"sZeroRecords": '<span class="text-error">Nothing found - sorry</span>',
	            "sInfo": '<span class="muted">Showing </span>_START_ to _END_<span class="muted"> of _TOTAL_ records</span>',
        		"sInfoEmpty": '<span class="text-warning">Showing 0 to 0 of 0 records</span>',
        		"sInfoFiltered": '<span class="text-info">(filtered from _MAX_ total records)</span>'
			}
            ,"aaSorting": [[ 3, "asc" ]]
            ,"aoColumnDefs": [
                {
                    // `data` refers to the data for the cell (defined by `mData`, which
                    // defaults to the column being worked with, in this case is the first
                    // Using `row[0]` is equivalent.
                    "mRender": function ( data, type, row ) {
                        return $('<div/>').text(data).html()
                        //return data +' '+ row[3];
                    },
                    "aTargets": [ 0 ]
                }
                ,{
                    "mRender": function ( data, type, row ) {
                        return $('<div/>').append(
                            $('<ul class="unstyled"/>').append(
                                data.map(function(lru_prefix){
                                    var url = Hyphen.utils.LRU_to_URL(lru_prefix)
                                    return $('<li/>').append(
                                        $('<small/>').append(
                                            $('<a/>')
                                                .attr('href', url)
                                                .attr('target', '_blank')
                                                .text(Hyphen.utils.URL_simplify(url))
                                        )
                                    )
                                })
                            )
                        ).html()
                    },
                    "aTargets": [ 1 ]
                }
                ,{
                    "mRender": function ( data, type, row ) {
                        var date = new Date()
                        date.setTime(data)
                        return $('<div/>').append(
                            $('<span/>').text(Hyphen.utils.prettyDate(date))
                                .attr('title', date)
                        ).html()
                    },
                    "aTargets": [ 2, 3 ]
                }
                ,{ "iDataSort": 6, "aTargets": [ 2 ] }
                ,{ "iDataSort": 7, "aTargets": [ 3 ] }
                ,{ "bVisible": false,  "aTargets": [ 5, 6, 7 ] }
                ,{ "sClass": "center", "aTargets": [ 4 ] }
                ,{ "bSearchable": false, "aTargets": [ 1, 2, 3, 4 ] }
                ,{ "bSortable": false, "aTargets": [ 1, 4, 5 ] }
                ,{ "sWidth": "20px", "aTargets": [ 4 ] }
                ,{ "sWidth": "100px", "aTargets": [ 2, 3 ] }
            ]
		} )
		Hyphen.controller.core.webEntities_update()

	})



	// View

	// Fill the table on update
	$(document).on( "/webentities", function(event, eventData){
        switch(eventData.what){
            case "updated":
                $('#webEntities_table').dataTable().fnAddData(Hyphen.model.webEntities.getAll().map(function(we){
                	return [
                		we.name
                		,we.lru_prefixes
                		,we.creation_date
                		,we.last_modification_date
                		,''
                        ,we.searchable
                        ,-we.creation_date
                        ,-we.last_modification_date
                	]
                }))
				
                break
        }
    })

})(window.Hyphen = window.Hyphen || {}, jQuery)