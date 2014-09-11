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
                id: 'queriesLimit'
                ,type: 'number'
                ,value: 10
            },{
                id: 'currentQueries'
                ,type: 'number'
                ,value: 0
                ,dispatch: 'currentQueries_updated'
                ,triggers: 'update_currentQueries'
            },{
                id: 'inputFile'
                ,dispatch: 'inputFile_updated'
                ,triggers: 'update_inputFile'
            },{
                id:'inputFileUploader'
                ,dispatch: 'inputFileUploader_updated'
                ,triggers: 'update_inputFileUploader'
            },{
                id:'loadingProgress'
                ,type: 'number'
                ,dispatch: 'loadingProgress_updated'
                ,triggers: 'update_loadingProgress'
                ,value: 0
            },{
                id:'dataTable'
                ,dispatch: 'dataTable_updated'
                ,triggers: 'update_dataTable'
            },{
                id:'webentities'
                ,dispatch: 'webentities_updated'
                ,triggers: 'update_webentities'
                ,type: 'array'
                ,value: []
            },{
                id:'webentities_byId'
                ,dispatch: 'webentities_byId_updated'
                ,triggers: 'update_webentities_byId'
                ,type: 'object'
                ,value: {}
            },{
                id:'urlColumnId'
                ,dispatch: 'urlColumnId_updated'
                ,triggers: 'update_urlColumnId'
            }
        ]


        ,services: [
        	{
                id: 'getWebentities'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.GET,
                        'params' : [
                            settings.id_list    // List of webentities
                            ,(settings.light && !settings.semilight) || false
                            ,settings.semilight || false
                            ,"name"             // sort order
                            ,50000              // max results
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
                ,success: function(data, input){
                    var webentitiesUpdated = data[0].result
                        ,webentities_byId = this.get('webentities_byId')
                    webentitiesUpdated.forEach(function(we){
                        webentities_byId[we.id] = we
                    })
                    var webentities = d3.values(webentities_byId)
                    this.update('webentities', webentities)
                    this.update('webentities_byId', webentities_byId)

                    // NB: below, legit only because we will never call many webentities at once in this page
                    var _self = this
                    webentitiesUpdated.forEach(function(we){
                        _self.dispatchEvent('callback_webentityUpdated', {
                            webentityId: we.id
                        })
                    })
                }
            },{
                id: 'fetchWebEntityByURL'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.FETCH_BY_URL,
                        'params' : [settings.url],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type
                ,error: function(data, xhr, input){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )
                        this.dispatchEvent('callback_webentityFetched', {
                                webentityId: undefined
                                ,message: 'RPC error'
                                ,url: input.url
                            })

                        rpc_error(data, xhr, input)
                    }
                ,expect: function(data, input, serviceOptions){
                        // console.log('RPC expect', data[0].code == 'fail' || rpc_expect(data, input, serviceOptions), 'data[0].code', data[0].code)
                        return (data.length>0 && data[0].code == 'fail') || rpc_expect(data, input, serviceOptions)
                    }
                ,before: function(){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries + 1 )
                    }
                ,success: function(data, input){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )

                        if(data[0].code == 'fail'){
                            this.dispatchEvent('callback_webentityFetched', {
                                webentityId: undefined
                                ,message: 'no match'
                                ,url: input.url
                            })
                        } else {
                            var we = data[0].result
                                ,webentities = this.get('webentities')
                                ,webentities_byId = this.get('webentities_byId')
                                
                            webentities_byId[we.id] = we
                            var webentities = d3.values(webentities_byId)
                            this.update('webentities', webentities)
                            this.update('webentities_byId', webentities_byId)

                            this.dispatchEvent('callback_webentityFetched', {
                                webentityId: we.id
                                ,url: input.url
                            })
                        }
                    }
            },{
                id: 'getWebEntityPages'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.GET_PAGES,
                        'params' : [
                            settings.webentityId,    // Web entity id
                            false                    // Get all pages, not only crawled ones
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect
                ,error: function(data, xhr, input){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )
                        
                        this.dispatchEvent('callback_webentityPagesFetched', {
                                webentityId: input.webentityId
                                ,message: 'RPC error'
                                ,pages: undefined
                            })

                        rpc_error(data, xhr, input)
                    }
                ,before: function(){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries + 1 )
                    }
                ,success: function(data, input){
                    var currentQueries = this.get('currentQueries')
                    this.update('currentQueries', currentQueries - 1 )

                    var webentity = this.get('webentities_byId')[input.webentityId]
                        ,pages = data[0].result
                    if(webentity == undefined){
                        HypheCommons.errorAlert('<strong>Something weird happended.</strong> Unkown web entity\n<br/>\n"'+data+'"')

                        this.dispatchEvent('callback_webentityPagesFetched', {
                                webentityId: input.webentityId
                                ,message: 'Unknown web entity'
                                ,pages: undefined
                            })
                    } else {
                        // webentity.pages = pages
                        this.dispatchEvent('callback_webentityPagesFetched', {
                            webentityId: input.webentityId
                            ,pages: pages
                        })
                    }
                }
            },{
                id: 'setWebEntityStatus'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.SET_STATUS,
                        'params' : [
                            settings.webentityId      // web entity id
                            ,settings.status          // new status
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
                ,success: function(data, input){
                    this.dispatchEvent('request_webentities', {
                        id_list: [input.webentityId]
                    })
                }
            }
        ]


        ,hacks:[
            {
                // Some events that need to be registered
                triggers: ['loading_started', 'loading_completed', 'update_loadingProgress', 'request_cascade', 'cascadeFinished']
            },{
                // Parsing the CSV
                triggers: ['loading_completed']
                ,method: function(){
                    var fileLoader = this.get('inputFileUploader')
                        ,csv = fileLoader.reader.result
                        ,table = d3.csv.parseRows(csv)
                    this.update('dataTable', table)
                }
            },{
                // Request Fetch WebEntity
                triggers: ['request_fetchWebEntity']
                ,method: function(e){
                    var url = e.data.url
                    this.request('fetchWebEntityByURL', {
                        url: url
                    })
                }
            },{
                // Request get pages
                triggers: ['request_getPages']
                ,method: function(e){
                    var we_id = e.data.webentityId
                    this.request('getWebEntityPages', {
                        webentityId: we_id
                    })
                }
            },{
                // Request get pages
                triggers: ['request_updatePagesData']
                ,method: function(e){
                    var we_id = e.data.webentityId
                        ,pagesData = e.data.pagesData
                        ,webentities_byId = this.get('webentities_byId')
                    webentities_byId[we_id].pagesData = pagesData
                }
            },{
                // Request web entities
                triggers: ['request_webentities']
                ,method: function(e){
                    this.request('getWebentities', {
                        id_list: e.data.id_list
                        ,light: false
                        ,semilight: false
                    })
                }
            },{
                // Request SetWebEntityStatus service
                triggers: ['request_setWebEntityStatus']
                ,method: function(e){
                    this.request('setWebEntityStatus', {
                        webentityId: e.data.webentityId
                        ,status: e.data.status
                    })
                }
            },{
                // Export CSV table
                triggers: ['ui_exportCSV']
                ,method: function(e){
                    var table = this.get('dataTable')
                        ,webentities_byId = this.get('webentities_byId')
                        ,colId = this.get('urlColumnId')
                        ,exportHeadline = []
                        ,exportContent = []

                    table.forEach(function(row, i){
                        if(i == 0){
                            exportHeadline = row.slice(0)
                        } else {
                            var newRow = []
                            exportHeadline.forEach(function(headcell, col){
                                newRow.push(row[col] || '')
                            })
                            exportContent.push(newRow)
                        }
                    })

                    // Web entity id, name, prefixes
                    exportHeadline.push('id_webentity')
                    exportHeadline.push('name_webentity')
                    exportHeadline.push('prefixes_webentity')
                    exportHeadline.push('status')
                    exportHeadline.push('crawled_pages')
                    exportHeadline.push('uncrawled_pages')
                    exportContent.forEach(function(row, rowId){
                        var rowElement = $('.diagnostic-row[data-row-id='+rowId+']')
                            ,we_id = rowElement.attr('data-webentity-id')
                        if(we_id == '' || webentities_byId[we_id] === undefined){
                            row.push('None')
                            row.push('N/A')
                            row.push('N/A')
                            row.push('N/A')
                            row.push('N/A')
                            row.push('N/A')
                        } else {
                            var we = webentities_byId[we_id]
                            row.push(we_id)
                            row.push(we.name)
                            row.push(we.lru_prefixes.map(function(lru){return Utils.LRU_to_URL(lru)}).join(' ; '))
                            row.push(we.status)
                            row.push(we.pagesData.crawled)
                            row.push(we.pagesData.uncrawled)
                        }
                    })

                    // Write CSV
                    var csvElement = function(txt){
                        txt = ''+txt //cast
                        return '"'+txt.replace(/"/gi, '""')+'"'
                    }
                    var content = []
                    
                    content.push(exportHeadline.map(csvElement).join(','))
                    
                    exportContent.forEach(function(row, rowId){
                        content.push('\n'+row.map(csvElement).join(','))
                    })
                    var blob = new Blob(content, {'type':'text/csv;charset=utf-8'})
                        ,filename = "Table.csv"
                    saveAs(blob, filename)
                    this.dispatchEvent('csv_downloaded')
                }
            }
        ]
    })



    //// Modules

    // File loader
    D.addModule(function(){
        domino.module.call(this)

        var container = $('#csvloader')
            ,_self = this

        $(document).ready(function(e){
            container.html('<div style="height: 50px"><div class="input"><input type="file" name="file"/><span class="help-block">Note: you can drag and drop a file</span></div><div class="progress" style="display: none;"><div class="bar" style="width: 0%;"></div></div></div>')
            container.find('input').on('change', function(evt){
                var target = evt.target || evt.srcElement
                _self.dispatchEvent('update_inputFile', {
                    inputFile: target.files
                })
            })
        })

        
        this.triggers.events['inputFile_updated'] = function(controller, e){
            var files = controller.get('inputFile')
            if( files !== undefined && files.length >0 ){
                container.find('div.input').hide()
                container.find('div.progress').show()
                var bar = container.find('div.progress .bar')
                bar.css('width', '0%')
                
                var fileLoader = new FileLoader()
                _self.dispatchEvent('update_inputFileUploader', {
                    inputFileUploader: fileLoader
                })
                fileLoader.read(files, {
                    onloadstart: function(evt){
                        _self.dispatchEvent('loading_started', {})
                    }
                    ,onload: function(evt){
                        _self.dispatchEvent('loading_completed', {})
                    }
                    ,onprogress: function(evt){
                        // evt is an ProgressEvent
                        if (evt.lengthComputable) {
                            _self.dispatchEvent('update_loadingProgress', {
                                loadingProgress: Math.round((evt.loaded / evt.total) * 100)
                            })
                        }
                    }
                })
            }
        }

        this.triggers.events['loadingProgress_updated'] = function(controller, e){
            var percentLoaded = +controller.get('loadingProgress')
            // Increase the progress bar length.
            if (percentLoaded < 100) {
                var bar = container.find('div.progress .bar')
                bar.css('width', percentLoaded + '%')
                bar.text(percentLoaded + '%')
            }
        }

        this.triggers.events['loading_started'] = function(){
            var bar = container.find('div.progress .bar')
            bar.removeClass("bar-success")
            bar.removeClass("bar-warning")
        }

        this.triggers.events['loading_completed'] = function(){
            // Ensure that the progress bar displays 100% at the end.
            var bar = container.find('div.progress .bar')
            bar.addClass('bar-success')
            bar.css('width', '100%')
            bar.text('Reading: 100%')
        }
    })
    
    // Table Preview
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#tablepreview')
            ,_self = this

        var update = function(controller, e){
            var table = controller.get('dataTable')
            element.html('<div id="dataPreview"><table class="table table-condensed table-bordered">'
                + table
                    .filter(function(d,i){return i<10})
                    .map(function(row, i){
                            return '<tr>'
                                + row.map(function(d){
                                            return ((i==0)?('<th>'):('<td>'))+d.substr(0,200)+((i==0)?('</th>'):('</td>'));
                                    }).join('')
                                + '</tr>';
                        }).join('')
                + '</table></div>')
        }

        this.triggers.events['dataTable_updated'] = update
    })

    // Column selector
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#columnselector')
            ,_self = this

        var update = function(controller, e){
            var table = controller.get('dataTable')
            element.html('')
                .append(
                        $('<h3>Select a column containing URLs</h3>')
                    )
                .append(
                        $('<select id="column" class="span6"/>')
                            .append($('<option value="none">Choose a column...</option>'))
                            .append(table[0].map(function(d,i){return '<option value="'+i+'">'+d+'</option>';}))
                            .on('change', function(){
                                    var colId = $(this).val()
                                    _self.dispatchEvent('update_urlColumnId', {urlColumnId: colId})
                                })
                    )
        }

        this.triggers.events['dataTable_updated'] = update
    })

    // Diagnostic
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#diagnostic')
            ,_self = this

        var initialize = function(controller, e){
            var table = controller.get('dataTable')
                ,colId = controller.get('urlColumnId')
                ,queriesLimit = controller.get('queriesLimit')
                ,headline = table[0]
                ,rows = table.filter(function(d,i){return i>0})

            element.html('')
                .append(
                        $('<h3>Diagnostic</h3>')
                    )
                .append(
                        $('<div class="row header-row"/>')
                            .append(
                                    $('<div class="span2"/>')
                                        .html('<h5>Source URL</h5>')
                                )
                            .append(
                                    $('<div class="span4"/>')
                                        .html('<h5>Web entity <small class="muted">+ prefixes</small></h5>')
                                )
                            .append(
                                    $('<div class="span1"/>')
                                        .html('<h5>Status</h5>')
                                )
                            .append(
                                    $('<div class="span3"/>')
                                        .html('<h5>Crawled pages</h5>')
                                )
                            .append(
                                    $('<div class="span2"/>')
                                        .html('<h5>Potential issues</h5>')
                                )
                    )
                .append(
                        rows.map(function(row, i){
                            var url = Utils.reEncode(row[colId])
                            return $('<div class="row diagnostic-row"/>')
                                .attr('data-row-id', i)
                                .attr('data-url', url)
                                .attr('data-url-md5', $.md5(url))
                                .append(
                                        $('<div class="span2 col-url"/>')
                                            .append(
                                                    $('<span class="urlContainer"/>')
                                                        .text(Utils.URL_simplify(row[colId]))
                                                )
                                    )
                                .append(
                                        $('<div class="span4 col-webentity"/>')
                                            .attr('data-url', url)
                                            .attr('data-url-md5', $.md5(url))
                                            .attr('data-status', 'waiting')
                                            .append(
                                                    $('<span class="muted"/>')
                                                        .text('waiting')
                                                )
                                    )
                                .append(
                                        $('<div class="span1 col-status"/>')
                                    )
                                .append(
                                        $('<div class="span3 col-pages"/>')
                                    )
                                .append(
                                        $('<div class="span2 col-issues"/>')
                                    )
                        })
                    )
            _self.dispatchEvent('request_cascade', {})
        }

        var cascade = function(controller, e){
            var queriesLimit = controller.get('queriesLimit')
                ,currentQueries = controller.get('currentQueries')
            for(i = 0; i < queriesLimit - currentQueries; i++){
                
                // 1. Search for issues to summarize

                var waitingIssues = $('.col-issues[data-status=waiting]')
                if(waitingIssues.length > 0){
                    var element = waitingIssues.first()
                    buildIssues(element, controller)
                    _self.dispatchEvent('request_cascade', {})
                } else {

                    // 2. Search for pages to fetch

                    var waitingPages = $('.col-pages[data-status=waiting]')
                    if(waitingPages.length > 0){
                        var element = waitingPages.first()
                            ,we_id = element.attr('data-webentity-id')
                        element.html('<span class="text-info">Pending...</span>')
                            .attr('data-status', 'pending')

                        _self.dispatchEvent('request_getPages', {
                            webentityId: we_id
                        })
                    } else {

                        // 3. Search for a web entity to fetch

                        var waitingForFetching = $('.col-webentity[data-status=waiting]')
                        if(waitingForFetching.length > 0){
                            var element = waitingForFetching.first()
                                ,url = element.attr('data-url')

                            element.html('<span class="text-info">Fetching web entity...</span>')
                                .attr('data-status', 'pending')

                            _self.dispatchEvent('request_fetchWebEntity', {
                                url: url
                            })
                        } else {

                            // 4. If no pages to fetch, then it's over
                            
                            _self.dispatchEvent('cascadeFinished', {})
                        }
                    }
                }
            }
        }

        var displayWebentity = function(controller, elements, we_id){
            var webentities_byId = controller.get('webentities_byId')
                ,we = webentities_byId[we_id]
                ,statusButtons = $('<small/>')

            // Status buttons
            var addStatusButton = function(parentElement, status){
                if(we.status == 'DISCOVERED' && status.toUpperCase() == 'DISCOVERED'){
                    parentElement
                        .append($('<span class="muted"> - </span>'))
                        .append(
                                $('<span class="label"/>').text(we.status)
                                    .addClass(getStatusColor(we.status))
                            )
                } else if(status.toUpperCase() != 'DISCOVERED'){
                    if(we.status !== status.toUpperCase()){
                        parentElement.append(
                                $('<a class="muted overable"/>')
                                    .text(status.toLowerCase())
                                    .click(function(){
                                        _self.dispatchEvent('request_setWebEntityStatus', {
                                            webentityId: we.id
                                            ,status: status.toUpperCase()
                                        })
                                    })
                            )
                    } else {
                        parentElement.append(
                                $('<span class="label"/>').text(we.status)
                                    .addClass(getStatusColor(we.status))
                            )
                    }
                }
            }
            addStatusButton(statusButtons, 'IN')
            statusButtons.append($('<span class="muted"> - </span>'))
            addStatusButton(statusButtons, 'OUT')
            statusButtons.append($('<span class="muted"> - </span>'))
            addStatusButton(statusButtons, 'UNDECIDED')
            addStatusButton(statusButtons, 'DISCOVERED')

            // The rest of the row
            elements.html('')
                .attr('data-status', 'fetched')
                .append(
                        $('<strong/>')
                            .text(we.name)
                    )

                // edit - crawl
                .append(
                        $('<span/>')
                            .append(
                                    $('<span class="muted"> - </span>')
                                )
                            .append(
                                    $('<a class="muted"><small>edit</small></a>')
                                        .attr('href', 'webentity_edit.php#we_id='+we.id)
                                        .attr('target', '_blank')
                                )
                            .append(
                                    $('<span class="muted"> - </span>')
                                )
                            .append(
                                    $('<a class="muted"><small>crawl</small></a>')
                                        .attr('href', 'crawl_new.php#we_id='+we.id)
                                        .attr('target', '_blank')
                                )
                    )

                // prefixes
                .append(
                        $('<ul class="unstyled prefixeslist"/>')
                            .append(
                                    we.lru_prefixes.map(function(lru){
                                        var li = $('<li/>')
                                            .append(
                                                    $('<small class="muted"/>').text(Utils.URL_simplify(Utils.LRU_to_URL(lru)))
                                                )
                                        return li
                                    })
                                )
                    )

                // other columns
                .siblings('.col-status')
                    .attr('data-webentity-id', we.id)
                    .html('')
                    .append(statusButtons)
                .siblings('.col-pages')
                    .attr('data-status', 'waiting')
                    .attr('data-webentity-id', we.id)
                    .html('')
                    .append(
                            $('<span class="muted"/>').text('waiting')
                        )
                .siblings('.col-issues')
                    .attr('data-status', 'uninitialized')
                    .html('')
                .parent()
                    .removeClass('wrong')
                    .attr('data-webentity-id', we.id)
        }

        var updateWebentity = function(controller, e){
            var we_id = e.data.webentityId

            if(we_id !== undefined){
                var elements = $('div.row[data-webentity-id='+we_id+'] div.col-webentity')
                if(elements.length > 0){
                    displayWebentity(controller, elements, we_id)
                    _self.dispatchEvent('request_cascade', {})
                }
            }
        }

        var updateWebentityFetch = function(controller, e){
            var url = e.data.url
                ,we_id = e.data.webentityId
            var elements = $('.col-webentity[data-url-md5='+$.md5(url)+']')
            if(elements.length > 0){
                if(we_id !== undefined){
                    displayWebentity(controller, elements, we_id)
                } else {
                    var msg = e.data.message
                    elements.html('')
                        .attr('data-status', 'fetched')
                        .append(
                                $('<span class="text-error"/>')
                                    .text(msg)
                            )
                        .siblings('.col-status')
                            .attr('data-webentity-id', '')
                            .html('')
                        .parent()
                            .addClass('wrong')
                            .attr('data-webentity-id', '')
                }
            } else {
                HypheCommons.errorAlert('Arg, something unexpected happened. (unable to find the elements to update...)')
                console.log('Error from updateWebentityFetch', 'url', url)
            }
            _self.dispatchEvent('request_cascade', {})
        }

        var updatePagesFetch = function(controller, e){
            var we_id = e.data.webentityId
                ,pages = e.data.pages || []
            var elements = $('.col-pages[data-webentity-id='+we_id+']')
            if(elements.length > 0){
                var pagesData = getDataFromPages(pages)
                    ,ul = $('<ul class="pageslist unstyled"/>')

                _self.dispatchEvent('request_updatePagesData', {
                    webentityId: we_id
                    ,pagesData: pagesData
                })

                for(i=-1; i<=pagesData.depthMax; i++){
                    var d = pagesData.depths[i]
                        ,li = $('<li/>')
                    if(i>=0 || d.crawled > 0 || d.uncrawled > 0){
                        if(i == -1){
                            li.append(
                                    $('<span/>')
                                        .text('unkown depth: ')
                                )
                        } else {
                            li.append(
                                    $('<span/>')
                                        .text('depth '+i+': ')
                                )
                        }
                        if(d.crawled>0){
                            li.append(
                                    $('<span class="text-success"/>')
                                        .text(d.crawled + ' crawled')
                                )
                        } else if(d.uncrawled == 0) {
                            li.append(
                                    $('<span class="muted"/>')
                                        .text('none crawled')
                                )
                        }
                        if(d.uncrawled>0)
                            if(d.crawled>0){
                                li
                                    .append(
                                            $('<span class="muted"/>')
                                                .text(' - ')
                                        )
                                    .append(
                                            $('<span class="text-warning"/>')
                                                .text(d.uncrawled + ' uncrawled')
                                        )
                            } else {
                                li.append(
                                        $('<span class="text-warning"/>')
                                            .text(d.uncrawled + ' uncrawled')
                                    )
                            }
                        ul.append(li)
                    }
                }

                var dateMessage = 'error'
                    ,fromText = Utils.prettyDate(pagesData.dateMin)
                    ,toText = Utils.prettyDate(pagesData.dateMax)

                if(pages.length == 0){
                    dateMessage = "Not crawled yet"
                } else {
                    if(fromText == toText){
                        dateMessage = 'Pages were modified '+fromText
                    } else {
                        dateMessage = 'Pages were modified between '+fromText+' and '+toText
                    }
                }

                elements.html('')
                    .attr('data-status', 'fetched')
                    .append(
                            $('<span/>').text(dateMessage)
                        )
                    .append(ul)
                    // other columns
                    .siblings('.col-issues')
                        .attr('data-status', 'waiting')
                        .html('<span class="muted">waiting</span>')
            } else {
                HypheCommons.errorAlert('Arg, something unexpected happened. (unable to find the elements to update...)')
                console.log('Error from updatePagesFetch', 'we_id', we_id)
            }
            _self.dispatchEvent('request_cascade', {})
        }

        var buildIssues = function(element, controller){
            element.attr('data-status', 'done')
                .html('')

            var someIssue = false

            // Is the source URL very different from every prefix ?
            var url = element.parent().attr('data-url')
                ,lru = Utils.URL_to_LRU(url)
                ,we_id = element.parent().attr('data-webentity-id')
                ,we = controller.get('webentities_byId')[we_id]
                ,prefixMatching = false
            we.lru_prefixes.forEach(function(lru_prefix){
                if(lru == lru_prefix){
                    prefixMatching = true
                }
            })
            if(!prefixMatching){
                someIssue = true
                element
                    .append(
                            $('<p class="text-error"/>')
                                .append(
                                        $('<strong/>').text('Prefix mismatch ')
                                    )
                                .append(
                                        $('<small/>').text('Source URL differs from '+((we.lru_prefixes.length==1)?('the prefix'):('every prefix'))+'. Check that the webentity is the expected one.')
                                    )
                        )
            }

            // Status
            if(we.status == 'OUT'){
                someIssue = true
                element.append(
                        $('<p class="text-warning"/>')
                            .append(
                                    $('<strong/>').text('OUT status ')
                                )
                            .append(
                                    $('<small/>').text('You may want to remove this URL from your CSV')
                                )
                    )
            } else if(we.status == 'UNDECIDED'){
                someIssue = true
                element.append(
                        $('<p class="text-warning"/>')
                            .append(
                                    $('<strong/>').text('Undecided ')
                                )
                            .append(
                                    $('<small/>')
                                        .text('You shoud set the proper status: ')
                                        .append(
                                                $('<a class="overable"/>')
                                                    .text('IN')
                                                    .click(function(){
                                                        _self.dispatchEvent('request_setWebEntityStatus', {
                                                            webentityId: we.id
                                                            ,status: 'IN'
                                                        })
                                                    })
                                            )
                                        .append(
                                                $('<span> or </span>')
                                            )
                                        .append(
                                                $('<a class="overable"/>')
                                                    .text('OUT')
                                                    .click(function(){
                                                        _self.dispatchEvent('request_setWebEntityStatus', {
                                                            webentityId: we.id
                                                            ,status: 'OUT'
                                                        })
                                                    })
                                            )
                                )
                    )
            } else if(we.status == 'DISCOVERED'){
                someIssue = true
                element.append(
                        $('<p class="text-error"/>')
                            .append(
                                    $('<strong/>').text('Not crawled yet ')
                                )
                            .append(
                                    $('<small/>').text('The status is DISCOVERED - ')
                                )
                            .append(
                                    $('<a><small>Crawl</small></a>')
                                        .attr('href', 'crawl_new.php#we_id='+we.id)
                                        .attr('target', '_blank')
                                )
                    )
            }

            // Pages
            if(we.status != 'DISCOVERED' && we.status != 'OUT'){
                if(we.pagesData.crawled <= 3){
                    someIssue = true
                    element.append(
                            $('<p class="text-error"/>')
                                .append(
                                        $('<strong/>').text('Poor crawl ')
                                    )
                                .append(
                                        $('<small/>').text('Very few crawled pages ('+we.pagesData.crawled+'). The crawl may have failed - ')
                                    )
                                .append(
                                    $('<a><small>Crawl again</small></a>')
                                        .attr('href', 'crawl_new.php#we_id='+we.id)
                                        .attr('target', '_blank')
                                )
                        )
                } else if(we.pagesData.crawled <= 10 && we.pagesData.uncrawled > 0){
                    someIssue = true
                    element.append(
                            $('<p class="text-warning"/>')
                                .append(
                                        $('<strong/>').text('Small crawl ')
                                    )
                                .append(
                                        $('<small/>').text('There are few crawled pages ('+we.pagesData.crawled+'). You may want to check that it comes the web entity (and not a failed crawl) - ')
                                    )
                                .append(
                                    $('<a><small>Crawl again</small></a>')
                                        .attr('href', 'crawl_new.php#we_id='+we.id)
                                        .attr('target', '_blank')
                                )
                        )
                }
            }

            if(!someIssue){
                element
                    .append(
                            $('<i class="icon-thumbs-up"></i>')
                        )
                    .append(
                            $('<span class="text-success"/>')
                                .text(' No issue')
                        )
            }
        }

        this.triggers.events['urlColumnId_updated'] = initialize
        this.triggers.events['request_cascade'] = cascade
        this.triggers.events['callback_webentityFetched'] = updateWebentityFetch
        this.triggers.events['callback_webentityPagesFetched'] = updatePagesFetch
        this.triggers.events['callback_webentityUpdated'] = updateWebentity
    })
    
    // CSV exporting
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#csvexport')
            ,_self = this

        var update = function(provider, e){
            element.html('')
                .append(
                        $('<h3>Export CSV</h3>')
                    )
                .append(
                        $('<p class="text-info"/>').text('Export the original CSV with additional columns containing the diagnostic')
                    )
                .append(
                        $('<button class="btn" id="export_csv_button"></button>')
                            .click(function(){
                                var el = $(this)
                                if(!el.attr('disabled')){
                                    el.attr('disabled', true)
                                        .html('<i class="icon-download"/> Processing...')
                                    _self.dispatchEvent('ui_exportCSV')
                                }
                            })
                    )
            resetButton()
        }

        var resetButton = function(provider, e){
            $('#export_csv_button').html('<i class="icon-download"/> Download CSV')
                .removeAttr('disabled')
        }

        this.triggers.events['cascadeFinished'] = update
        this.triggers.events['csv_downloaded'] = resetButton
    })

    //// Processing
    var getDataFromPages = function(pages){
        var data = {}

        data.dateMin = Number.MAX_VALUE
        data.dateMax = Number.MIN_VALUE
        data.depthMax = Number.MIN_VALUE
        pages.forEach(function(p){
            data.dateMin = Math.min(data.dateMin, p.crawl_timestamp)
            data.dateMax = Math.max(data.dateMax, p.crawl_timestamp)
            data.depthMax = Math.max(data.depthMax, p.depth)
        })

        data.depths = []
        for(i=-1; i<=data.depthMax; i++){
            data.depths[i] = {crawled:0, uncrawled:0}
        }

        data.crawled = 0
        data.uncrawled = 0
        pages.forEach(function(p){
            var crawled = p.sources.some(function(tag){return tag=="CRAWL"})
                ,depth = p.depth
            if(crawled){
                data.depths[depth].crawled++
                data.crawled++
            } else {
                data.depths[depth].uncrawled++
                data.uncrawled++
            }
        })

        return data
    }


    /// Misc functions
    window.FileLoader = function(){
        this.read = function(files, settings){
            this.reader = new FileReader()

            // Settings
            if(settings.onerror === undefined)
                this.reader.onerror = this.errorHandler
            else
                this.reader.onerror = settings.onerror

            if(settings.onprogress === undefined)
                this.reader.onprogress = function(evt) {
                    console.log('file loader: progress ', evt)
                }
            else
                this.reader.onprogress = settings.onprogress

            if(settings.onabort === undefined)
                this.reader.onabort = function(e) {
                    alert('File read cancelled')
                }
            else
                this.reader.onabort = settings.onabort

            if(settings.onloadstart === undefined)
                this.reader.onloadstart = function(evt) {
                    console.log('file loader: Load start ', evt)
                }
            else
                this.reader.onloadstart = settings.onloadstart

            if(settings.onload === undefined)
                this.reader.onload = function(evt) {
                    console.log('file loader: Loading complete ', evt)
                }
            else
                this.reader.onload = settings.onload
            
            // Read
            for(i in files){
                this.reader.readAsText(files[i])
            }
        }

        this.abortRead = function(){
            this.reader.abort()
        }

        this.reader = undefined
        
        this.errorHandler = function(evt){
            var target = evt.target || evt.srcElement
            switch(target.error.code) {
                case target.error.NOT_FOUND_ERR:
                    alert('File Not Found!')
                    break
                case target.error.NOT_READABLE_ERR:
                    alert('File is not readable')
                    break
                case target.error.ABORT_ERR:
                    break // noop
                default:
                    alert('An error occurred reading this file.');
            }
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
