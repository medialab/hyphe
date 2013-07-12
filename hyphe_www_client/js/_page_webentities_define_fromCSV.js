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
                .replace(/^https:\/\//gi, '<span class="muted">https://</span>')
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
                                    $('<div class="span3"/>')
                                        .html('<h5>Source URL</h5>')
                                )
                            .append(
                                    $('<div class="span6"/>')
                                        .html('<h5>Suggested prefixes</h5>')
                                )
                            .append(
                                    $('<div class="span3"/>')
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
                                        $('<div class="span3 col-url"/>')
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
                                        $('<div class="span3 col-analysis"/>')
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
                                                                            $('<span class="muted"/>').text(' '+we.name+' ')
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

            // Activate checkboxes
            checkboxes.removeAttr('disabled')
                .attr('data-source-url-md5', urlMD5)

            // If one is equal to source URL and is prefixing a web entity, check and disable
            checkboxes.each(function(i,e){
                var el = $(e)
                if(el.val() == sourceLru){
                    matchingWebentityId = el.attr('data-webentity-id')
                    if(matchingWebentityId && matchingWebentityId != ''){
                        el.attr('checked', true)
                        el.attr('disabled', true)
                    }
                }
            })

            // Check every checkbox with the same webentity id if needed
            if(matchingWebentityId !== undefined && matchingWebentityId != ''){
               checkboxes.each(function(i,e){
                    var el = $(e)
                    if(el.attr('data-webentity-id') == matchingWebentityId){
                        el.attr('checked', true)
                            .attr('disabled', true)
                    }
                })
            }

            // Actions
            checkboxes.change(function(e){
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
            updateAnalysis(rowElement, true)

        }

        var updateAnalysis = function(rowElement, recommand){
            var checkboxes = rowElement.find('input[type=checkbox]')
                ,sourceUrl = rowElement.attr('data-url')
                ,sourceLru = Utils.URL_to_LRU(sourceUrl)
                ,sourceJsonLru = Utils.LRU_to_JSON_LRU(sourceLru)
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
                    ,disabled: el.is(':disabled')
                    ,check: function(){
                        this.element.prop('checked', true)
                        this.checked = el.is(':checked')
                    }
                })
            })

            /* Explanations

                The goal of this UI is to allow the user to declare web entities on the basis of URLs.
                
                But there are two sub-goals here:
                     - Goal 1: If there is no web entity prefixed by the URL, declare some
                     - Goal 2: If there is a web entity but there are some issues with it, fix it
                
                This supposes two mechanisms:
                     - Mechanism 1: Declaring a web entity by a prefix
                     - Mechanism 2: Proposing alternatives and give a feedback of common issues:
                                     alternatives with/-out www, https...
                
                So, we have checkboxes attached to the suggested prefixes.
                What do they represent?
                     - A way to select a prefix to declare to a new web entity (Mechanism 1)
                     - A way to add a prefix to the current web entity (Mechanism 2)
                
                Important remark: there is NO way to REMOVE a prefix. So only options can really be unchecked.
                The options are the w.e.-less prefixes and the alternatives.
                So IF there is a w.e. for the exact URL, it cannot be unchecked.
                
                From the point of view of only knowing the source URL and which prefixes are checked, this implies that:
                     - If there are checked prefixes not associated to a w.e., there is something to declare
                     - If there are checked prefixes associated to different w.e., there are some merges to do
                     - Unchecked prefixes do not mean anything. They are just ignored.
                     - If there are things checked that should NOT be, feedback an issue
                     - If there are things NOT checked that should be, feedback an issue
                
                Which are the cases where something is checked that should not be?
                     - I do not see any!
                
                Which are the cases where something UNchecked that should be checked?
                     - When there is a www URL prefixing a w.e. and the www-less URL does not prefix the web entity
                     - When there is a https URL prefixing a w.e. and the https-less URL does not prefix the web entity
                     - When there is a https-less URL prefixing a w.e. and the https URL does not prefix the web entity
                     - The same for discrepancies between TLDs (?)
                
                So, when do we propose the update button ?
                When we would do something in the back-end, that is:
                     - Creating a web entity: one or more w.e.-less prefixes are checked, and them only
                     - Adding prefixes to a web entity: a single w.e. prefix is checked and one or more w.e.-less prefixes are checked
                     - Merging web entities: prefixes checked are associated to two or more (different) w.e.. Also there can be added prefixes
            ****************/


            // Determine the matching item (there should always be one since the original lru is always in candidate prefixes)
            var matchingItem = items.filter(function(item){
                    return item.lru == sourceLru
                })[0]


            // Diagnostic before anything selected (just looking prefixes)

            // #issue - No prefix chosen: there is no web entity with this prefix or a shorter version
            var noPrefixChosen = !items.some(function(item){
                    return (item.lru == sourceLru || sourceLru.indexOf(item.lru) == 0)
                        && item.we_id
                        && item.we_id != ''
                })

            // #issue - WWW discrepancy: a web entity matches, but it has a www and the version without www is not a prefix / a prefix of the same w.e.
            var wwwDiscrepancy = matchingItem.we_id
                && matchingItem.we_id != ''
                && sourceJsonLru.host[sourceJsonLru.host.length - 1] == 'www'
                && items.some(function(item){
                        var item_jsonLru = Utils.LRU_to_JSON_LRU(item.lru)
                            ,item_jsonLru_wwwAdded = item_jsonLru
                        item_jsonLru_wwwAdded.host.push('www')
                        var item_lru_wwwAdded = Utils.JSON_LRU_to_LRU(item_jsonLru_wwwAdded)
                        return item_lru_wwwAdded == sourceLru
                            && (
                                    (item.we_id && item.we_id != '' && item.we_id != matchingItem.we_id)
                                    || (item.we_id === undefined || item.we_id == '')
                                )
                    })

            // #issue - HTTPS separated: a web entity matches, but it has a different / non-existent http alternative
            var httpsSeparated = sourceJsonLru.scheme == 'https'
                && matchingItem.we_id
                && matchingItem.we_id != ''
                && items.some(function(item){
                        return item.lru.replace(/^s:http\|/, 's:https') == sourceLru
                            && (
                                    (item.we_id && item.we_id != '' && item.we_id != matchingItem.we_id)
                                    || (item.we_id === undefined || item.we_id == '')
                                )
                    })

            // #issue - Inclusion issue: there is a shorter prefix linked to a w.e., but not to the exact prefix
            var inclusionIssue = (matchingItem.we_id === undefined || matchingItem.we_id == '')
                && items.some(function(item){
                        return item.we_id
                            && item.we_id != ''
                            && sourceLru.indexOf(item.lru) == 0
                    })
            



            // Recommandations if needed (pre-checking prefixes)
            if(recommand){
                // What we usually want is just to check the exact prefix (and its http(s) variants)...
                // ...except if it is www and has a www-less variant, because then we want this one instead (and its http(s) variants)
                if(sourceJsonLru.host[sourceJsonLru.host.length - 1] == 'www'){
                    // The matching URL, unchecked, has a shorter www-less variant.
                    // If it does not belong to a web entity, we will check it
                    var wwwLessVariant = items.filter(function(item){
                            var item_jsonLru = Utils.LRU_to_JSON_LRU(item.lru)
                                ,item_jsonLru_wwwAdded = item_jsonLru
                            item_jsonLru_wwwAdded.host.push('www')
                            var item_lru_wwwAdded = Utils.JSON_LRU_to_LRU(item_jsonLru_wwwAdded)
                            return item_lru_wwwAdded == sourceLru
                        })[0]
                    if(wwwLessVariant){
                        if(wwwLessVariant.we_id === undefined || wwwLessVariant.we_id == ''){
                            wwwLessVariant.check()
                        }
                    } else {
                        matchingItem.check()
                    }
                } else {
                    matchingItem.check()
                }
            }


            // Diagnostic after selection (simulation of the result of the checks)
            
            var checkedItems = items.filter(function(item){return item.checked})
            
            // #issuesolved - 'No prefix chosen': A prefix is checked
            var noPrefixChosen_solved = noPrefixChosen
                && items.some(function(item){
                        return item.checked
                    })

            // #issuesolved - 'WWW discrepancy': the www-less alternative is checked
            var wwwDiscrepancy_solved = wwwDiscrepancy
                && !items.some(function(item){
                        var item_jsonLru = Utils.LRU_to_JSON_LRU(item.lru)
                            ,item_jsonLru_wwwAdded = item_jsonLru
                        item_jsonLru_wwwAdded.host.push('www')
                        var item_lru_wwwAdded = Utils.JSON_LRU_to_LRU(item_jsonLru_wwwAdded)
                        return item_lru_wwwAdded == sourceLru
                            && (
                                    (item.we_id && item.we_id != '' && item.we_id != matchingItem.we_id)
                                    || (item.we_id === undefined || item.we_id == '')
                                )
                            && !item.checked
                    })

            // #issuesolved - 'HTTPS separated': the https versions are checked if their http version is also checked
            var httpsSeparated_solved = httpsSeparated
                && !items.some(function(item){
                        return item.lru.replace(/^s:http\|/, 's:https') == sourceLru
                            && (
                                    (item.we_id && item.we_id != '' && item.we_id != matchingItem.we_id)
                                    || (item.we_id === undefined || item.we_id == '')
                                )
                            && !item.checked
                    })

            // #issuesolved - 'Inclusion issue': the exact prefix is (or both)
            var inclusionIssue_solved = inclusionIssue
                && matchingItem.checked

            // #warning - Unecessary prefix: a non-mandatory prefix is checked while a shorter version is also checked
            var unnecessaryPrefix = items.some(function(item, i){
                    return item.checked && !item.disabled
                        && items.some(function(item2, i2){
                                return item2.checked && i != i2 && item.lru.indexOf(item2.lru) == 0
                            })
                })

            // #note - New web entity: if only w.e.-less prefixes are checked, a new w.e. will be created with all of them
            var newWebEntity = checkedItems.length>0
                && !checkedItems.some(function(item){
                        return item.we_id !== undefined && item.we_id != ''
                    })

            // #note - Prefixes added: if there is exactly one checked prefix with a w.e. and at least one checked prefix without, prefixes will be added to this w.e.
            var prefixesAdded = checkedItems.filter(function(item){return item.we_id !== undefined && item.we_id != ''}).length == 1
                && checkedItems.filter(function(item){return item.we_id === undefined || item.we_id == ''}).length > 0

            // #warning - Merge: if checked prefixes asssociated to different w.e. are checked, there would be a merge
            var merge = Utils.extractCases(
                    checkedItems
                        .filter(function(item){return item.we_id !== undefined && item.we_id != ''})
                        .map(function(item){return item.we_id})
                ).length >= 2

            // #potential-issue - would create WWW discrepancy: a web entity does not match but the exact prefix is checked,
            // and it has a www and the version without www is not a prefix / a prefix of the same w.e. and is not checked
            var wouldWwwDiscrepancy = (matchingItem.we_id === undefined || matchingItem.we_id == '')
                && sourceJsonLru.host[sourceJsonLru.host.length - 1] == 'www'
                && matchingItem.checked
                && items.some(function(item){
                        var item_jsonLru = Utils.LRU_to_JSON_LRU(item.lru)
                            ,item_jsonLru_wwwAdded = item_jsonLru
                        item_jsonLru_wwwAdded.host.push('www')
                        var item_lru_wwwAdded = Utils.JSON_LRU_to_LRU(item_jsonLru_wwwAdded)
                        return item_lru_wwwAdded == sourceLru
                            && (
                                    (item.we_id && item.we_id != '' && item.we_id != matchingItem.we_id)
                                    || (item.we_id === undefined || item.we_id == '')
                                )
                            && !item.checked
                    })

            var analysisElement = rowElement.find('.col-analysis')
            analysisElement.html('')
            
            if(inclusionIssue){
                if(!inclusionIssue_solved){
                    analysisElement.append(
                            $('<p/>').text('inclusionIssue')
                        )
                } else {
                    analysisElement.append(
                            $('<p/>').html('<del>inclusionIssue</del>')
                        )
                }
            }

            if(httpsSeparated){
                if(!httpsSeparated_solved){
                    analysisElement.append(
                            $('<p/>').text('httpsSeparated')
                        )
                } else {
                    analysisElement.append(
                            $('<p/>').html('<del>httpsSeparated</del>')
                        )
                }
            }

            if(noPrefixChosen){
                if(!noPrefixChosen_solved){
                    analysisElement.append(
                            $('<p/>').text('noPrefixChosen')
                        )
                } else {
                    analysisElement.append(
                            $('<p/>').html('<del>noPrefixChosen</del>')
                        )
                }
            }

            if(wwwDiscrepancy){
                if(!wwwDiscrepancy_solved){
                    analysisElement.append(
                            $('<p/>').text('wwwDiscrepancy')
                        )
                } else {
                    analysisElement.append(
                            $('<p/>').html('<del>wwwDiscrepancy</del>')
                        )
                }
            }

            if(unnecessaryPrefix){
                analysisElement.append(
                        $('<p/>').text('unnecessaryPrefix')
                    )
            }

            if(wouldWwwDiscrepancy){
                analysisElement.append(
                        $('<p/>').text('wouldWwwDiscrepancy')
                    )
            }

            if(newWebEntity){
                analysisElement.append(
                        $('<p/>').text('newWebEntity')
                    )
            }
            
            if(prefixesAdded){
                analysisElement.append(
                        $('<p/>').text('prefixesAdded')
                    )
            }

            if(merge){
                analysisElement.append(
                        $('<p/>').text('merge')
                    )
            }

        }

        this.triggers.events['urlColumnId_updated'] = initialize
        this.triggers.events['request_cascade'] = cascade
        this.triggers.events['callback_webentityFetched'] = updateWebentityFetch
        this.triggers.events['ui_updateRowAnalysis'] = function(provider, e){
            updateAnalysis($('div.diagnostic-row[data-row-id='+e.data.rowId+']'), false)
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