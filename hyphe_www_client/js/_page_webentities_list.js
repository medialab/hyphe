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
            },{
                id:'statusValidation'
                ,dispatch: 'statusValidation_updated'
                ,triggers: 'update_statusValidation'
            },{
                id:'datatableColumns'
                ,value: {
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
                            settings.id_list        // List of webentities
                            ,false                  // Mode light
                            ,true                   // Mode semi-light
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'setWebentityStatus'
                ,setter: 'statusValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.SET_STATUS,
                        'params' : [
                            settings.webentityId      // web entity id
                            ,settings.status          // new status
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
            },{
                // On click on a button, create and put a popover over the status
                triggers: ['ui_clickOnStatus']
                ,method: function(d){
                    var dom_element = $(d.data.element)
                        ,dom_id = dom_element.attr('id')
                        ,we_id = d.data.webentityId
                        ,status = d.data.webentityStatus
                        ,row = d.data.row
                        ,buttons = $('<div class="status_buttons_div"/>')

                    $('.table_status:not(#'+dom_id+')').popover('destroy')

                    // In
                    if(status !== 'IN'){
                        buttons.append(
                                $('<button class="btn btn-success btn-small status-button">IN</button>')
                                    .attr('data-webentity-id', we_id)
                                    .attr('data-webentity-status', 'IN')
                            )
                    }
                    
                    // Out
                    if(status !== 'OUT'){
                        buttons.append(
                                $('<button class="btn btn-danger btn-small status-button">OUT</button>')
                                    .attr('data-webentity-id', we_id)
                                    .attr('data-webentity-status', 'OUT')
                            )
                    }
                    
                    // Undecided
                    if(status !== 'UNDECIDED'){
                        buttons.append(
                                $('<button class="btn btn-info btn-small status-button">UNDECIDED</button>')
                                    .attr('data-webentity-id', we_id)
                                    .attr('data-webentity-status', 'UNDECIDED')
                            )
                    }
                    
                    dom_element.popover({
                        'title': 'Select a new status'+'<button type="button" id="close" class="close" onclick="$(&quot;#'+dom_id+'&quot;).popover(&quot;hide&quot;);">&times;</button>'
                        ,'placement': 'right'
                        ,'trigger': 'manual'
                        ,'content': buttons
                    })

                    dom_element.popover('toggle')

                    $('button.status-button').unbind()
                    $('button.status-button').click(function(el){
                        var target = el.target
                            ,we_id = $(target).attr('data-webentity-id')
                            ,we_status = $(target).attr('data-webentity-status')
                        
                        // Notify to the server
                        D.request('setWebentityStatus', {
                            webentityId: we_id
                            ,status: we_status
                        })


                        // Destroy the popovers
                        $('.table_status').popover('destroy')

                        // We impact the change without checking server-side validation. Dirty but effective.
                        D.dispatchEvent('ui_updateWebentityStatus', {
                            webentityId: we_id
                            ,status: we_status
                            ,row: row
                        })
                    })
                }
            },{
                // On notification of status changed, we change the UI
                triggers: ['ui_updateWebentityStatus']
                ,method: function(d){
                    var we_id = d.data.webentityId
                        ,status = d.data.status
                        ,row = d.data.row
                        ,columns = D.get('datatableColumns')
// Modify the data table
                    var oTable = $('#webEntities_table').dataTable()
                    oTable.fnUpdate( status, row[0], columns.status ); // Single cell
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
            var columns = D.get('datatableColumns')

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
                "sDom": "<'row table_ui_top'<'span6'l><'span6'f>r>t<'row'<'span6'i><'span6'p>>"
                ,'aaData': webentitiesTableData
                ,'bDeferRender': true
                ,'bProcessing ': true
                ,"sPaginationType": "bootstrap"
                ,"oLanguage": {
                    "sLengthMenu": '_MENU_ web entities at once',
                    "sZeroRecords": '<span class="text-error">Nothing found - sorry</span>',
                    "sInfo": '<br/><span class="muted">Showing </span>_START_ to _END_<span class="muted"> of _TOTAL_ records</span>',
                    "sInfoEmpty": '<span class="text-warning">Showing 0 to 0 of 0 records</span>',
                    "sInfoFiltered": '<span class="text-info">(filtered from _MAX_ total records)</span>'
                }
                ,"aaSorting": [[ columns.last_modification_date_formatted, "asc" ]]
                ,"fnPreDrawCallback": function( oSettings ) {
                    // Destroy the popovers
                    $('.table_status').popover('destroy')
                }
                ,"fnDrawCallback": function( oSettings ) {
                    // Update the status labels (for edit)
                    $('.table_status').each(function(i, element){
                        var div = $(element)
                            ,we_id = div.attr('data-webentity-id')
                            ,we_status = div.find('span.label').text()
                        div.unbind()
                        div.click(function(){
                            D.dispatchEvent('ui_clickOnStatus', {
                                element: element
                                ,webentityId: we_id
                                ,webentityStatus: we_status
                                ,row: div.closest('tr')
                            })
                        })
                    })
                }
                ,"aoColumnDefs": [
                   {
                        "mRender": function ( data, type, row ) {

                            return $('<div/>').append(
                                $('<div class="table_name"/>').append(
                                        $('<a/>')
                                            .text(data)
                                        .attr('href', 'webentity_edit.php#we_id='+row[columns.id])
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
                                    .attr('data-webentity-id', row[columns.id])
                                    .attr('id', 'status-'+row[columns.id])
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
