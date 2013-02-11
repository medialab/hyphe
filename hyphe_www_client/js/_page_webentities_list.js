;(function(Hyphen, $, undefined){
    
    // On load
	$(document).ready(function(){

		/* Table initialisation */
        // Changing the columns is painful with this config, so we have an object allowing us to deal with that
        var columns = {
            name:0
            ,status:1
            ,prefixes:2
            ,creation_date_formatted:3
            ,last_modification_date_formatted:4
            ,actions:5
            ,id:6
            ,creation_date_unformatted:7
            ,last_modification_date_unformatted:8
            ,searchable:9
        }
        
        Hyphen.integration.initDataTables()
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
            ,"fnDrawCallback": function( oSettings ) {
                // Update the web entities proxies
                Hyphen.view.webEntities.proxiesUpdate(true)
            }
            ,"aaSorting": [[ columns.last_modification_date_formatted, "asc" ]]
            ,"aoColumnDefs": [
                {
                    "mRender": function ( data, type, row ) {

                        return $('<div/>').append(
                            $('<span/>').text(data)
                                .addClass('webEntity_proxy')
                                .attr('webEntity_id', row[columns.id])
                        ).html()
                    },
                    "aTargets": [ columns.name ]
                }
                ,{
                    "mRender": function ( data, type, row ) {

                        return $('<div/>').append(
                            $('<span class="label"/>').text(data)
                                .addClass(Hyphen.view.webEntities_status_getLabelColor(data))
                        ).html()
                    },
                    "aTargets": [ columns.status ]
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
                    "aTargets": [ columns.prefixes ]
                }
                ,{
                    "mRender": function ( data, type, row ) {
                        var date = new Date()
                        date.setTime(data)
                        return $('<div/>').append(
                            $('<small/>').text(Hyphen.utils.prettyDate(date))
                                .attr('title', date)
                        ).html()
                    },
                    "aTargets": [ columns.creation_date_formatted, columns.last_modification_date_formatted ]
                }
                ,{
                    "mRender": function ( data, type, row ) {
                        return '<div class="actions" we_id="'+data+'"></div>'
                    },
                    "aTargets": [ columns.actions ]
                }
                ,{ "iDataSort": columns.creation_date_unformatted, "aTargets": [ columns.creation_date_formatted ] }
                ,{ "iDataSort": columns.last_modification_date_unformatted, "aTargets": [ columns.last_modification_date_formatted ] }
                ,{ "bVisible": false,  "aTargets": [ columns.searchable, columns.creation_date_unformatted, columns.last_modification_date_unformatted, columns.id ] }
                ,{ "sClass": "center", "aTargets": [ columns.actions ] }
                ,{ "bSearchable": false, "aTargets": [ columns.prefixes, columns.creation_date_formatted, columns.last_modification_date_formatted, columns.actions ] }
                ,{ "bSortable": false, "aTargets": [ columns.prefixes, columns.actions, columns.searchable ] }
                ,{ "sWidth": "80px", "aTargets": [ columns.actions ] }
                ,{ "sWidth": "80px", "aTargets": [ columns.status ] }
                ,{ "sWidth": "80px", "aTargets": [ columns.creation_date_formatted, columns.last_modification_date_formatted ] }
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
                        ,we.status
                        ,we.lru_prefixes
                        ,we.creation_date
                        ,we.last_modification_date
                        ,we.id
                        ,we.id
                        ,-we.creation_date
                        ,-we.last_modification_date
                        ,we.searchable
                    ]
                }))
                $('#loading_proxy').hide()
				$('#loading_achieved').show()
                Hyphen.view.table_updateInteractions()
                break
        }
    })

    Hyphen.view.table_updateInteractions = function(){
        $('#webEntities_table tbody tr').mouseenter(function(event){
            var tr = event.currentTarget
                actionsDiv = $(tr).find('div.actions')[0]
            $(actionsDiv).html('').show()
                .append(
                    $('<div class="btn-group"/>')
                        .append(
                            $('<a class="btn btn-primary"/>').html('<i class="icon-edit icon-white"/>')
                                .attr('title', 'Edit')
                                .attr('href', 'webentity_edit.php#we_id='+$(actionsDiv).attr('we_id'))
                        ).append(
                            $('<a class="btn"/>').html('<i class="icon-download-alt"/>')
                                .attr('title', 'Crawl')
                                .attr('href', 'crawl_new.php#we_id='+$(actionsDiv).attr('we_id'))
                        )
                )
        })
        $('#webEntities_table tbody tr').mouseleave(function(event){
            var tr = event.currentTarget
                actionsDiv = $(tr).find('div.actions')[0]
            $(actionsDiv).hide()
        })
    }

    // Download json
    $('#webEntities_download').click(function(){
        // Blob Builder
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder
        var bb = new BlobBuilder
        bb.append('[')
        Hyphen.model.webEntities.getAll().forEach(function(we,i){
            if(i!=0)
                bb.append(',')
            bb.append(JSON.stringify(we))
        })
        bb.append(']')
        saveAs(bb.getBlob("text/json;charset=utf-8"), "WebEntities.json")
    })
    

})(window.Hyphen = window.Hyphen || {}, jQuery)