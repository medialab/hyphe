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
                id:'webentitiesById'
                ,dispatch: 'webentitiesById_updated'
                ,triggers: 'update_webentitiesById'
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
                                ,webentities_byId = this.get('webentitiesById')
                                
                            webentities_byId[we.id] = we
                            var webentities = d3.values(webentities_byId)
                            this.update('webentities', webentities)
                            this.update('webentitiesById', webentities_byId)

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
                            settings.webentityId    // Web entity id
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

                    var webentity = this.get('webentitiesById')[input.webentityId]
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
            }
        ]


        ,hacks:[
            {
                // Some events that need to be registered
                triggers: ['loading_started', 'loading_completed', 'update_loadingProgress', 'request_cascade']
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
                                    $('<div class="span4"/>')
                                        .html('<h5>Source URL</h5>')
                                )
                            .append(
                                    $('<div class="span4"/>')
                                        .html('<h5>Prefix of web entity</h5>')
                                )
                            .append(
                                    $('<div class="span4"/>')
                                        .html('<h5>Name of web entity</h5>')
                                )
                        )
                .append(
                        rows.map(function(row, i){
                            var url = row[colId]
                            return $('<div class="row diagnostic-row"/>')
                                .attr('data-row-id', i)
                                .attr('data-url', url)
                                .attr('data-url-md5', $.md5(url))
                                .append(
                                        $('<div class="span4 col-url"/>')
                                            .append(
                                                    $('<span class="urlContainer"/>')
                                                        .text(Utils.URL_simplify(row[colId]))
                                                )
                                    )
                                .append(
                                        $('<div class="span8 col-webentity"/>')
                                            .attr('data-url', url)
                                            .attr('data-url-md5', $.md5(url))
                                            .attr('data-status', 'waiting')
                                            .append(
                                                    $('<span class="muted"/>')
                                                        .text('waiting')
                                                )
                                    )
                        })
                    )
            _self.dispatchEvent('request_cascade', {})
        }

        var cascade = function(controller, e){
            var queriesLimit = controller.get('queriesLimit')
                ,currentQueries = controller.get('currentQueries')

            for(i = 0; i < queriesLimit - currentQueries; i++){

                // 1. Search for a web entity to fetch

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

                    // 2. If no pages to fetch, then it's over
                    
                    _self.dispatchEvent('cascadeFinished', {})
                }
            }
        }

        var updateWebentityFetch = function(controller, e){
            var url = e.data.url
                ,we_id = e.data.webentityId
            var elements = $('.col-webentity[data-url-md5='+$.md5(url)+']')
            if(elements.length > 0){
                if(we_id !== undefined){
                    var webentities_byId = controller.get('webentitiesById')
                        ,we = webentities_byId[we_id]
                    elements.html('')
                        .attr('data-status', 'fetched')
                        .append(
                                $('<div class="row subrow-webentity"/>')
                                    .attr('data-webentity-id', '')
                                    .append(
                                            $('<div class="span4 subcol-webentity-prefix"/>')
                                                // Prefixes
                                                .append(
                                                        $('<ul class="unstyled prefixeslist"/>')
                                                            .append(
                                                                    we.lru_prefixes.map(function(lru){
                                                                        var li = $('<li/>')
                                                                            .append(
                                                                                    $('<span/>').text(Utils.LRU_to_URL(lru))
                                                                                )
                                                                        return li
                                                                    })
                                                                )
                                                    )
                                        )
                                    .append(
                                            $('<div class="span4 subcol-webentity-name"/>')
                                                // Name
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
                                        )
                            )
                } else {
                    var msg = e.data.message
                    elements.html('')
                        .attr('data-status', 'fetched')
                        .append(
                                $('<div class="row subrow-webentity"/>')
                                    .attr('data-webentity-id', '')
                                    .append(
                                             $('<div class="span4 subcol-webentity-prefix"/>')
                                                .append(
                                                        $('<span class="muted"/>')
                                                            .text('Ø')
                                                    )

                                        )
                                    .append(
                                            $('<div class="span4 subcol-webentity-name"/>')
                                                .append(
                                                        $('<strong class="muted"/>')
                                                            .text('No web entity')
                                                    )
                                        )
                            )
                }
            } else {
                HypheCommons.errorAlert('Arg, something unexpected happened. (unable to find the elements to update...)')
                console.log('Error from updateWebentityFetch', 'url', url)
            }
            _self.dispatchEvent('request_cascade', {})
        }

        this.triggers.events['urlColumnId_updated'] = initialize
        this.triggers.events['request_cascade'] = cascade
        this.triggers.events['callback_webentityFetched'] = updateWebentityFetch
    })


    //// Processing


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