HypheCommons.js_file_init()
HypheCommons.domino_init()

;(function($, domino, dmod, undefined){
    
    // RPC config of this page
    var rpc_url = HypheCommons.RPC.URL
        ,rpc_contentType = HypheCommons.RPC.contentType
        ,rpc_type = HypheCommons.RPC.type
        ,rpc_expect = HypheCommons.RPC.expect
        ,rpc_error = HypheCommons.RPC.error

    var D = new domino({
        name: 'main'
        ,properties: [
            {
                id:'webentities'
                ,dispatch: 'webentities_updated'
                ,triggers: 'update_webentities'
            }
        ]


        ,services: [
            {
                id: 'getWebentities'
                ,setter: 'webentities'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [
                            settings.id_list    // List of webentities
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'getWebentitiesLight'
                ,setter: 'webentities'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [
                            settings.id_list    // List of webentities
                            ,true               // Mode light
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'getWebentitiesSemilight'
                ,setter: 'webentities'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [
                            settings.id_list    // List of webentities
                            ,false               // Mode light
                            ,true                // Mode semi-light
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }
        ]


        ,hacks:[
            {
                // On button click, download json
                triggers: ['ui_downloadJson']
                ,method: function(){
                    var webentities = D.get('webentities')
                        ,content = []
                    content.push('[')
                    webentities.forEach(function(we,i){
                        if(i!=0)
                            content.push(',')
                        content.push(JSON.stringify(we))
                    })
                    content.push(']')
                    
                    var blob = new Blob(content, {'type':'text/json;charset=utf-8'})
                        ,filename = "WebEntities.json"
                    if(navigator.userAgent.match(/firefox/i))
                       alert('Note:\nFirefox does not handle file names, so you will have to rename this file to\n\"'+filename+'\""\nor some equivalent.')
                    saveAs(blob, filename)
                }
            }
        ]
    })



    //// Modules

    // Download JSON button
    D.addModule(dmod.Button, [{
        element: $('#webEntities_download')
        ,label: 'Download as JSON'
        ,bsIcon: 'icon-download'
        ,dispatch: 'ui_downloadJson'
        ,ghost: false
    }])

    // Data Table
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#webEntities_table')

        var build = function(){
            var webentities = D.get('webentities')
            
            /* Table initialisation */
            // Changing the order of columns is painful with this config, so we have an object allowing us to deal with that
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

            var webentitiesTableData = webentities.map(function(we){
                var searchable = we.name
                    + we.lru_prefixes.map(function(lru){return Utils.LRU_to_URL(lru)}).join(" ")
                    + 'status:' + we.status
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
                    ,searchable
                ]
            })
            
            initDataTables()    // Bootstrap integration

            // Initialize this table
            element.dataTable( {
                "sDom": "<'row'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>"
                ,'aaData': webentitiesTableData
                ,'bDeferRender': true
                ,"sPaginationType": "bootstrap"
                ,"oLanguage": {
                    "sLengthMenu": '_MENU_ web entities at once',
                    "sZeroRecords": '<span class="text-error">Nothing found - sorry</span>',
                    "sInfo": '<br/><span class="muted">Showing </span>_START_ to _END_<span class="muted"> of _TOTAL_ records</span>',
                    "sInfoEmpty": '<span class="text-warning">Showing 0 to 0 of 0 records</span>',
                    "sInfoFiltered": '<span class="text-info">(filtered from _MAX_ total records)</span>'
                }
                ,"aaSorting": [[ columns.last_modification_date_formatted, "asc" ]]
                ,"aoColumnDefs": [
                   {
                        "mRender": function ( data, type, row ) {

                            return $('<div/>').append(
                                $('<div class="table_name"/>').append(
                                        $('<a/>')
                                            .text(data)
                                        .attr('href', 'webentity_edit.php#we_id='+row[columns.id])
                                        .attr('webEntity_id', row[columns.id])
                                    )
                            ).html()
                        },
                        "aTargets": [ columns.name ]
                    }
                    ,{
                        "mRender": function ( data, type, row ) {

                            return $('<div/>').append(
                                $('<div class="table_status"/>').append(
                                    $('<span class="label"/>').text(data)
                                        .addClass(getStatusColor(data))
                                )
                            ).html()
                        },
                        "aTargets": [ columns.status ]
                    }
                    ,{
                        "mRender": function ( data, type, row ) {
                            return $('<div/>').append(
                                $('<div class="table_prefix"/>').append(
                                    $('<ul class="unstyled"/>').append(
                                        data.map(function(lru_prefix){
                                            var url = Utils.LRU_to_URL(lru_prefix)
                                            return $('<li/>')
                                                .append(
                                                        $('<span class="table_prefixtext"/>').text(Utils.URL_simplify(url)+'\xa0')
                                                            .append(
                                                                $('<a class="table_prefixlink"/>')
                                                                    .attr('href', url)
                                                                    .attr('target', '_blank')
                                                                    .append(
                                                                            $('<i class="icon-share-alt"/>')
                                                                        )
                                                           )
                                                   )
                                        })
                                    )
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
                                $('<small/>').text(Utils.prettyDate(date))
                                    .attr('title', date)
                            ).html()
                        },
                        "aTargets": [ columns.creation_date_formatted, columns.last_modification_date_formatted ]
                    }
                    ,{
                        "mRender": function ( data, type, row ) {
                            var we_id = data
                            return $('<div class="actions" we_id="'+we_id+'"></div>')
                                .append(
                                    $('<div class="btn-group pull-right"/>')
                                        .append(
                                            $('<a class="btn btn-link btn-mini"/>').html('edit')
                                                .attr('title', 'Edit')
                                                .attr('href', 'webentity_edit.php#we_id='+we_id)
                                        ).append(
                                            $('<a class="btn btn-link btn-mini"/>').html('crawl')
                                                .attr('title', 'Crawl')
                                                .attr('href', 'crawl_new.php#we_id='+we_id)
                                        )
                                ).html()
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
            })

            $('#loading_proxy').hide()
            $('#loading_achieved').show()
        }

        this.triggers.events['webentities_updated'] = build

    })
    

    //// On load
    $(document).ready(function(){
        D.request('getWebentitiesSemilight', {})
    })



    //// Data Tables Helpers
    var initDataTables = function(){
        // Code from http://www.datatables.net/blog/Twitter_Bootstrap_2

        /* Set the defaults for DataTables initialisation */
        $.extend( true, $.fn.dataTable.defaults, {
            "sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
            "sPaginationType": "bootstrap",
            "oLanguage": {
                "sLengthMenu": "_MENU_ records per page"
            }
        } );


        /* Default class modification */
        $.extend( $.fn.dataTableExt.oStdClasses, {
            "sWrapper": "dataTables_wrapper form-inline"
        } );


        /* API method to get paging information */
        $.fn.dataTableExt.oApi.fnPagingInfo = function ( oSettings )
        {
            return {
                "iStart":         oSettings._iDisplayStart,
                "iEnd":           oSettings.fnDisplayEnd(),
                "iLength":        oSettings._iDisplayLength,
                "iTotal":         oSettings.fnRecordsTotal(),
                "iFilteredTotal": oSettings.fnRecordsDisplay(),
                "iPage":          Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
                "iTotalPages":    Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
            };
        };


        /* Bootstrap style pagination control */
        $.extend( $.fn.dataTableExt.oPagination, {
            "bootstrap": {
                "fnInit": function( oSettings, nPaging, fnDraw ) {
                    var oLang = oSettings.oLanguage.oPaginate;
                    var fnClickHandler = function ( e ) {
                        e.preventDefault();
                        if ( oSettings.oApi._fnPageChange(oSettings, e.data.action) ) {
                            fnDraw( oSettings );
                        }
                    };

                    $(nPaging).addClass('pagination').append(
                        '<ul>'+
                            '<li class="prev disabled"><a href="#">&larr; '+oLang.sPrevious+'</a></li>'+
                            '<li class="next disabled"><a href="#">'+oLang.sNext+' &rarr; </a></li>'+
                        '</ul>'
                    );
                    var els = $('a', nPaging);
                    $(els[0]).bind( 'click.DT', { action: "previous" }, fnClickHandler );
                    $(els[1]).bind( 'click.DT', { action: "next" }, fnClickHandler );
                },

                "fnUpdate": function ( oSettings, fnDraw ) {
                    var iListLength = 5;
                    var oPaging = oSettings.oInstance.fnPagingInfo();
                    var an = oSettings.aanFeatures.p;
                    var i, j, sClass, iStart, iEnd, iHalf=Math.floor(iListLength/2);

                    if ( oPaging.iTotalPages < iListLength) {
                        iStart = 1;
                        iEnd = oPaging.iTotalPages;
                    }
                    else if ( oPaging.iPage <= iHalf ) {
                        iStart = 1;
                        iEnd = iListLength;
                    } else if ( oPaging.iPage >= (oPaging.iTotalPages-iHalf) ) {
                        iStart = oPaging.iTotalPages - iListLength + 1;
                        iEnd = oPaging.iTotalPages;
                    } else {
                        iStart = oPaging.iPage - iHalf + 1;
                        iEnd = iStart + iListLength - 1;
                    }

                    for ( i=0, iLen=an.length ; i<iLen ; i++ ) {
                        // Remove the middle elements
                        $('li:gt(0)', an[i]).filter(':not(:last)').remove();

                        // Add the new list items and their event handlers
                        for ( j=iStart ; j<=iEnd ; j++ ) {
                            sClass = (j==oPaging.iPage+1) ? 'class="active"' : '';
                            $('<li '+sClass+'><a href="#">'+j+'</a></li>')
                                .insertBefore( $('li:last', an[i])[0] )
                                .bind('click', function (e) {
                                    e.preventDefault();
                                    oSettings._iDisplayStart = (parseInt($('a', this).text(),10)-1) * oPaging.iLength;
                                    fnDraw( oSettings );
                                } );
                        }

                        // Add / remove disabled classes from the static elements
                        if ( oPaging.iPage === 0 ) {
                            $('li:first', an[i]).addClass('disabled');
                        } else {
                            $('li:first', an[i]).removeClass('disabled');
                        }

                        if ( oPaging.iPage === oPaging.iTotalPages-1 || oPaging.iTotalPages === 0 ) {
                            $('li:last', an[i]).addClass('disabled');
                        } else {
                            $('li:last', an[i]).removeClass('disabled');
                        }
                    }
                }
            }
        } );


        /*
         * TableTools Bootstrap compatibility
         * Required TableTools 2.1+
         */
        if ( $.fn.DataTable.TableTools ) {
            // Set the classes that TableTools uses to something suitable for Bootstrap
            $.extend( true, $.fn.DataTable.TableTools.classes, {
                "container": "DTTT btn-group",
                "buttons": {
                    "normal": "btn",
                    "disabled": "disabled"
                },
                "collection": {
                    "container": "DTTT_dropdown dropdown-menu",
                    "buttons": {
                        "normal": "",
                        "disabled": "disabled"
                    }
                },
                "print": {
                    "info": "DTTT_print_info modal"
                },
                "select": {
                    "row": "active"
                }
            } );

            // Have the collection use a bootstrap compatible dropdown
            $.extend( true, $.fn.DataTable.TableTools.DEFAULTS.oTags, {
                "collection": {
                    "container": "ul",
                    "button": "li",
                    "liner": "a"
                }
            } );
        }
    }
    
    var getStatusColor = function(status){
        return (status=='DISCOVERED')?('label-warning'):(
                (status=='UNDECIDED')?('label-info'):(
                    (status=='OUT')?('label-important'):(
                        (status=='IN')?('label-success'):('')
                    )
                )
            )
    }

})(jQuery, domino, (window.dmod = window.dmod || {}))






// Old code (deprecated)
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
                Hyphen.view.table_updateInteractions()
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
    

})//(window.Hyphen = window.Hyphen || {}, jQuery)