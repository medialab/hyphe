HypheCommons.js_file_init()
HypheCommons.domino_init()

domino.settings({verbose:false})

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
                id:'webentitiesByLruPrefix'
                ,dispatch: 'webentitiesByLruPrefix_updated'
                ,triggers: 'update_webentitiesByLruPrefix'
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
                                ,webentities_byLruPrefix = this.get('webentitiesByLruPrefix')
                                
                            webentities_byId[we.id] = we
                            var webentities = d3.values(webentities_byId)
                            this.update('webentities', webentities)
                            this.update('webentitiesById', webentities_byId)

                            we.lru_prefixes.forEach(function(lru){
                                webentities_byLruPrefix[lru] = we
                            })
                            this.update('webentitiesByLruPrefix', webentities_byLruPrefix)

                            this.dispatchEvent('callback_webentityFetched', {
                                webentityId: we.id
                                ,url: input.url
                            })
                        }
                    }
            }
        ]


        ,hacks:[
            {
                // Some events that need to be registered
                triggers: ['loading_started', 'loading_completed', 'update_loadingProgress', 'request_cascade', 'ui_updateRowAnalysis']
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

        
        this.triggers.events['inputFile_updated'] = function(provider, e){
            var files = provider.get('inputFile')
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

        this.triggers.events['loadingProgress_updated'] = function(provider, e){
            var percentLoaded = +provider.get('loadingProgress')
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

        var update = function(provider, e){
            var table = provider.get('dataTable')
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

        var update = function(provider, e){
            var table = provider.get('dataTable')
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

        var displayLruPrefixHTML = function(lru){
            var lru_json = Utils.LRU_to_JSON_LRU(lru)
            return Utils.URL_simplify(Utils.LRU_to_URL(lru))
                .replace(/^www\./gi, '<span class="muted">www.</span>')
                .replace(/^https:\/\//gi, '<strong class="muted">https://</strong>')
                .replace(lru_json.host[1]+'.'+lru_json.host[0], lru_json.host[1]+'<span class="muted">.'+lru_json.host[0]+'</span>')

        }

        var initialize = function(provider, e){
            var table = provider.get('dataTable')
                ,colId = provider.get('urlColumnId')
                ,queriesLimit = provider.get('queriesLimit')
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
                                    $('<div class="span6"/>')
                                        .html('<h5>Suggested prefixes</h5>')
                                )
                            .append(
                                    $('<div class="span2"/>')
                                        .html('<h5>Analysis</h5>')
                                )
                        )
                .append(
                        rows.map(function(row, i){
                            var url = Utils.URL_fix(row[colId])
                            if(url==''){
                                return $('<div class="row"/>')
                            }
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
                                        $('<div class="span6 col-prefixes"/>')
                                            .attr('data-url', url)
                                            .attr('data-url-md5', $.md5(url))
                                            .attr('data-status', 'waiting')
                                            .append(
                                                    $('<span class="muted"/>')
                                                        .text('waiting')
                                                )
                                    )
                                .append(
                                        $('<div class="span2 col-analysis"/>')
                                            .append(
                                                    $('<span class="muted"/>')
                                                        .text('waiting')
                                                )
                                    )
                        })
                    )
            _self.dispatchEvent('request_cascade', {})
        }

        var cascade = function(provider, e){
            var queriesLimit = provider.get('queriesLimit')
                ,currentQueries = provider.get('currentQueries')

            for(i = 0; i < queriesLimit - currentQueries; i++){

                // 1. Search for prefixes that need a webentity fetch

                if(false){
                    


                } else {

                    // 2. Fill prefixes

                    var waitingForPrefixes = $('.col-prefixes[data-status=waiting]')
                    if(waitingForPrefixes.length > 0){
                        var element = waitingForPrefixes.first()
                            ,url = element.attr('data-url')
                            ,lru = Utils.URL_to_LRU(url)
                            ,prefixCandidates = HypheCommons.getPrefixCandidates(lru)
                        element.html('')
                            .attr('data-status', 'computed')
                        if(prefixCandidates.length > 0){
                            element
                                .append(
                                    prefixCandidates.map(function(lru){
                                        return $('<div class="prefix"/>')
                                            .attr('data-url-prefix-md5', $.md5(Utils.LRU_to_URL(lru)))
                                            .attr('data-lru-prefix', lru)
                                            .attr('data-status', 'fetching')
                                            .append(
                                                    $('<label class="checkbox"></label>')
                                                        .append(
                                                                $('<input type="checkbox" disabled/>')
                                                                    .attr('value', lru)
                                                            )
                                                        .append(
                                                                $('<span/>').html(
                                                                        displayLruPrefixHTML(lru)
                                                                    )
                                                            )
                                                        .append(
                                                                $('<span class="text-info"/>').text(' - fetching web entity...')
                                                            )
                                                )
                                    })
                                )
                        }

                        prefixCandidates.forEach(function(lru){
                            _self.dispatchEvent('request_fetchWebEntity', {url: Utils.LRU_to_URL(lru)})
                        })

                    } else {

                        // 3. Then it's over
                        
                        _self.dispatchEvent('cascadeFinished', {})
                    }
                }
            }
        }

        var updateWebentityFetch = function(provider, e){
            var url = e.data.url
                ,lru = Utils.URL_to_LRU(url)
                ,we_id = e.data.webentityId
                ,webentities_byLruPrefix = provider.get('webentitiesByLruPrefix')

            var elements = $('.prefix[data-url-prefix-md5='+$.md5(url)+']')
            if(elements.length > 0){
                if(we_id !== undefined && webentities_byLruPrefix[lru] && webentities_byLruPrefix[lru].id == we_id){
                    var webentities_byId = provider.get('webentitiesById')
                        ,we = webentities_byId[we_id]
                    elements.html('')
                        .attr('data-status', 'fetched')
                        .append(
                                $('<label class="checkbox overable"></label>')
                                    .append(
                                            $('<input type="checkbox"/>')
                                                .attr('data-webentity-id', we_id)
                                                .attr('value', lru)
                                        )
                                    .append(
                                            $('<div/>')
                                                .append(
                                                        $('<span/>').html(displayLruPrefixHTML(lru))
                                                    )
                                                .append(
                                                        $('<span class="muted"/>').text(' - is a prefix of')
                                                    )
                                                .append(
                                                        $('<p/>').append(
                                                                $('<span/>')
                                                                    .append(
                                                                             $('<span class="label"/>').text(we.status)
                                                                                .addClass(getStatusColor(we.status))
                                                                        )
                                                                    .append(
                                                                            $('<strong class="muted"/>').text(' '+we.name+' ')
                                                                        )
                                                                    
                                                            )
                                                            
                                                    )
                                        )
                            )
                } else {
                    var msg = e.data.message
                    elements.html('')
                        .attr('data-status', 'fetched')
                        .append(
                                $('<label class="checkbox overable"></label>')
                                    .append(
                                            $('<input type="checkbox"/>')
                                                .attr('data-webentity-id', '')
                                                .attr('value', lru)
                                        )
                                    .append(
                                            $('<div/>')
                                                .append(
                                                        $('<span/>').html(displayLruPrefixHTML(lru))
                                                    )
                                        )
                            )
                }

                // Test if all the prefixes were fetched
                elements.parent().each(function(i,e){
                    var element = $(e)
                    if(element.find('.prefix[data-status!=fetched]').length == 0){
                        // All prefixes fetched
                        initAnalysis(element.parent())
                    }
                })

            } else {
                HypheCommons.errorAlert('Arg, something unexpected happened. (unable to find the elements to update...)')
                console.log('Error from updateWebentityFetch', 'url', url)
            }
            _self.dispatchEvent('request_cascade', {})
        }

        var initAnalysis = function(rowElement){
            var checkboxes = rowElement.find('input[type=checkbox]')
                ,sourceUrl = rowElement.attr('data-url')
                ,sourceLru = Utils.URL_to_LRU(sourceUrl)
                ,urlMD5 = $.md5(sourceUrl)
                ,matchingWebentityId

            // Check one if it is equal to source URL
            checkboxes.each(function(i,e){
                var el = $(e)
                if(el.val() == sourceLru){
                    el.attr('checked', true)
                    // Get the id of the webentity, if there is one associated to this checkbox
                    matchingWebentityId = el.attr('data-webentity-id')
                }
            })

            // Check every checkbox with the same webentity id if needed
            if(matchingWebentityId !== undefined && matchingWebentityId != ''){
               checkboxes.each(function(i,e){
                    var el = $(e)
                    if(el.attr('data-webentity-id') == matchingWebentityId){
                        el.attr('checked', true)
                    }
                })
            }

            // Activate checkboxes
            checkboxes.removeAttr('disabled')
                .attr('data-source-url-md5', urlMD5)
                .change(function(e){
                        var el = $(this)
                            ,checked = el.is(':checked')
                            ,we_id = el.attr('data-webentity-id')
                        if(we_id != '')
                            $('input[type=checkbox][data-source-url-md5='+urlMD5+'][data-webentity-id='+we_id+']').prop('checked', checked)
                        
                        _self.dispatchEvent('ui_updateRowAnalysis', {
                            rowId: rowElement.attr('data-row-id')
                        })
                    })

            // Update analysis
            updateAnalysis(rowElement)

        }

        var updateAnalysis = function(rowElement){
            var checkboxes = rowElement.find('input[type=checkbox]')
                ,sourceUrl = rowElement.attr('data-url')
                ,sourceLru = Utils.URL_to_LRU(sourceUrl)
                ,items = []
                ,analysisElement = rowElement.find('.col-analysis')

            // Build the table of what is checked
            checkboxes.each(function(i, e){
                var el = $(e)
                items.push({
                    id: i
                    ,element: el
                    ,we_id: el.attr('data-webentity-id')
                    ,lru: el.attr('value')
                    ,checked: el.is(':checked')
                })
            })

            var noChange = items.every(function(item){
                return (
                        item.checked && (                                               // If the item is checked...
                                item.lru == sourceLru                                   // ...then it is the source LRU
                            ) || (                                                      // ...or it is because the item with the source LRU
                                items.some(function(item2){                             //    is checked and has the same webentity id
                                            return item2.we_id == item.we_id
                                                && item.we_id != ''
                                                && item2.lru == sourceLru
                                                && item2.checked
                                        })
                            )
                    ) || (                                                              // If the item is NOT checked
                        !item.checked && item.lru != sourceLru                          // ...then it not the source LRU
                            && !items.some(function(item2){                             // ...and it does not have the same webentity id
                                            return item2.we_id == item.we_id            //    than a checked item being the source Lru
                                                && item.we_id != ''
                                                && item2.lru == sourceLru
                                                && item2.checked
                                        })
                    )
            })
            if(noChange){
                var noIssue = true

                // Let's clarify this.
                //
                // The goal of this UI is to allow the user to declare web entities on the basis of URLs.
                //
                // But there are two sub-goals here:
                //      - Goal 1: If there is no web entity prefixed by the URL, declare some
                //      - Goal 2: If there is a web entity but there are some issues with it, fix it
                //
                // This supposes two mechanisms:
                //      - Mechanism 1: Declaring a web entity by a prefix
                //      - Mechanism 2: Proposing alternatives and give a feedback of common issues
                //
                // From the point of view of only knowing the source URL and which prefixes are checked, this implies that:
                //      - If there are checked prefixes not associated to a w.e., there is something to declare
                //      - If there are checked prefixes associated to different w.e., there are some merges to do
                //      - Unchecked prefixes do not mean anything. They are just ignored.
                //      - If there are things checked that should NOT be, feedback an issue
                //      - If there are things NOT checked that should be, feedback an issue
                //
                // Which are the cases where something is checked that should not be?
                //      - I do not see any!
                //
                // Which are the cases where something UNchecked that should be?
                //      - When there is a www URL prefixing a w.e. and the www-less URL does not prefix the web entity
                //      - When there is a https URL prefixing a w.e. and the https-less URL does not prefix the web entity
                //      - When there is a https-less URL prefixing a w.e. and the https URL does not prefix the web entity
                //      - The same for discrepancies between TLDs (?)


                // No issue
                if(noIssue){
                    analysisElement.html('')
                        .append(
                                $('<i class="icon-thumbs-up"></i>')
                            )
                        .append(
                                $('<span class="text-success"/>')
                                    .text(' Defines a web entity')
                            )
                }
            } else {
                analysisElement.html('')
                    .append(
                            $('<a class="btn btn-primary"/>')
                                .html('Apply changes')
                        )
            }



        }

        this.triggers.events['urlColumnId_updated'] = initialize
        this.triggers.events['request_cascade'] = cascade
        this.triggers.events['callback_webentityFetched'] = updateWebentityFetch
        this.triggers.events['ui_updateRowAnalysis'] = function(provider, e){
            updateAnalysis($('div.diagnostic-row[data-row-id='+e.data.rowId+']'))
        }
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