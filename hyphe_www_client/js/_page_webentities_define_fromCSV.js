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
                id:'webentities_byId'
                ,dispatch: 'webentities_byId_updated'
                ,triggers: 'update_webentities_byId'
                ,type: 'object'
                ,value: {}
            },{
                id:'webentitiesByLruPrefix'
                ,dispatch: 'webentitiesByLruPrefix_updated'
                ,triggers: 'update_webentitiesByLruPrefix'
                ,type: 'object'
                ,value: {}
            },{
                id:'nameColumnId'
                ,dispatch: 'nameColumnId_updated'
                ,triggers: 'update_nameColumnId'
            },{
                id:'urlColumnId'
                ,dispatch: 'urlColumnId_updated'
                ,triggers: 'update_urlColumnId'
            },{
                id:'taskBags'
                ,type: 'array'
                ,value: []
                ,dispatch: 'taskBags_updated'
                ,triggers: 'update_taskBags'
            },{
                id:'taskBags_byId'
                ,type: 'object'
                ,value: {}
                ,dispatch: 'taskBags_byId_updated'
                ,triggers: 'update_taskBags_byId'
            },{
                id:'tasks'
                ,type: 'array'
                ,value: []
                ,dispatch: 'tasks_updated'
                ,triggers: 'update_tasks'
            },{
                id:'tasks_byId'
                ,type: 'object'
                ,value: {}
                ,dispatch: 'tasks_byId_updated'
                ,triggers: 'update_tasks_byId'
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
                                ,webentities_byId = this.get('webentities_byId')
                                ,webentities_byLruPrefix = this.get('webentitiesByLruPrefix')
                                
                            webentities_byId[we.id] = we
                            var webentities = d3.values(webentities_byId)
                            this.update('webentities', webentities)
                            this.update('webentities_byId', webentities_byId)

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
            },{
                id: 'webentityAddPrefix'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITY.PREFIX.ADD,
                        'params' : [
                            settings.webentityId
                            ,settings.lru
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect
                ,before: function(){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries + 1 )
                    }
                ,error: function(data, xhr, input){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )
                        this.dispatchEvent('callback_webentityPrefixAdded', {
                            webentityId: input.webentityId
                            ,lru: input.lru
                            ,taskId: input.taskId
                            ,errorMessage: '<strong>Error adding a prefix to a web entity</strong> - We tried to add the prefix '+Utils.URL_simplify(Utils.LRU_to_URL(input.lru))+' <small class="muted">('+input.lru+')</small> '
                                +'to the web entity <code>'+input.webentityId+'</code>. '
                                +'The server said:<br/>'+data
                        })

                        rpc_error(data, xhr, input)
                    }
                ,success: function(data, input){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )
                        this.dispatchEvent('callback_webentityPrefixAdded', {
                            webentityId: input.webentityId
                            ,lru: input.lru
                            ,taskId: input.taskId
                        })
                    }
            },{
                id: 'webentityMerge'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.MERGE,
                        'params' : [
                            settings.oldWebentityId
                            ,settings.goodWebentityId
                            ,false   // Include tags
                            ,false   // Include Home and Startpages as Startpages
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect
                ,before: function(){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries + 1 )
                    }
                ,error: function(data, xhr, input){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )
                        this.dispatchEvent('callback_webentityMerged', {
                            taskId: input.taskId
                            ,errorMessage: '<strong>Error merging web entities</strong> - We tried to merge the web entity <code>'+input.oldWebentityId+'</code>'
                                +' into the web entity <code>'+input.goodWebentityId+'</code>. '
                                +'The server said: <br/>'+data+'.'
                        })

                        rpc_error(data, xhr, input)
                    }
                ,success: function(data, input){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )
                        this.dispatchEvent('callback_webentityMerged', {
                            webentityId: input.goodWebentityId
                            ,taskId: input.taskId
                        })
                    }
            },{
                id: 'webentityDeclare'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.WEBENTITIES.CREATE_BY_LRU,
                        'params' : [
                            settings.prefixes[0] // TO FIX AFTER API CHANGE
                        ],
                    })}
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect
                ,before: function(){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries + 1 )
                    }
                ,error: function(data, xhr, input){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )
                        this.dispatchEvent('callback_webentityDeclared', {
                            taskId: input.taskId
                            ,errorMessage: '<strong>Error declaring web entities</strong> - We tried to declare these prefixes:<ul>'
                                +input.prefixes.map(function(p){return '<li>'+Utils.URL_simplify(Utils.LRU_to_URL(p))+' <small class="muted">'+p+'</small></li>'}).join('')+'</ul>'
                                +'The server said: <br/>'+data+'.'
                        })

                        rpc_error(data, xhr, input)
                    }
                ,success: function(data, input){
                        var currentQueries = this.get('currentQueries')
                        this.update('currentQueries', currentQueries - 1 )
                        this.dispatchEvent('callback_webentityDeclared', {
                            webentityId: input.goodWebentityId
                            ,taskId: input.taskId
                        })
                    }
            }
        ]


        ,hacks:[
            {
                // Some events that need to be registered
                triggers: ['loading_started', 'loading_completed', 'update_loadingProgress', 'request_cascade', 'ui_updateRowAnalysis', 'cascadeFinished', 'rowDiagnosticUpdated']
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
                // On validate, trigger the begining of the analysis
                triggers: ['ui_validateColumns']
                ,dispatch: ['beginAnalysis']
            },{
                // When a row is done, update the tasks
                triggers: ['rowDiagnosticUpdated']
                ,method: function(e){
                    var taskBag = e.data.taskBag
                        ,taskBags = this.get('taskBags')
                        ,taskBags_byId = this.get('taskBags_byId')
                                
                    taskBags_byId[taskBag.id] = taskBag
                    var taskBags = d3.values(taskBags_byId)
                    this.update('taskBags_byId', taskBags_byId)
                    this.update('taskBags', taskBags)
                }
            },{
                // When the tasks are updated, if there is nothing left to wait, stack tasks and finalize
                triggers: ['taskBags_updated']
                ,method: function(e){
                    if($('[data-status=waiting]').length == 0){
                        var taskBags = this.get('taskBags')
                            ,tasks = []
                            ,tasks_byId = {}
                        taskBags.forEach(function(taskBag){
                            tasks = tasks.concat(
                                taskBag.tasks.map(function(task, i){
                                    task.status = 'waiting'
                                    task.bagId = taskBag.id
                                    task.id = taskBag.id+'-'+i
                                    return task
                                })
                            )
                        })
                        tasks.forEach(function(task){
                            tasks_byId[task.id] = task
                        })
                        this.update('tasks', tasks)
                        this.update('tasks_byId', tasks_byId)
                        this.dispatchEvent('finalize')
                    }
                }
            },{
                // On apply changes, cascade the tasks
                triggers: ['ui_applyChanges']
                ,method: function(e){
                    this.dispatchEvent('cascadeTask')
                }
            },{
                // On cascade task, execute the first non executed task
                triggers: ['cascadeTask']
                ,method: function(e){
                    var tasks = this.get('tasks')
                        ,queriesLimit = this.get('queriesLimit')
                        ,currentQueries = this.get('currentQueries')
                        
                    // Are there tasks still to execute ?
                    var waitingTasks = tasks.filter(function(t){return t.status == 'waiting'})
                    if(waitingTasks.length > 0){
                        // Get the first non executed task, depending on free queries
                        if(currentQueries <= queriesLimit){
                            var task = waitingTasks[0]
                            task.status = 'pending'

                            if(task.type == 'merge'){
                                this.request('webentityMerge', {
                                    oldWebentityId: task.mergeFrom
                                    ,goodWebentityId: task.mergeTo
                                    ,taskId: task.id
                                })
                                // this.dispatchEvent('callback_webentityMerged', {taskId: task.id})
                            } else if(task.type == 'addPrefix'){
                                this.request('webentityAddPrefix', {
                                    webentityId: task.addTo
                                    ,lru: task.prefix
                                    ,taskId: task.id
                                })
                                // this.dispatchEvent('callback_webentityPrefixAdded', {taskId: task.id})
                            } else if(task.type == 'declare'){
                                this.request('webentityDeclare', {
                                    prefixes: task.prefixes
                                    ,taskId: task.id
                                })
                                // this.dispatchEvent('callback_webentityDeclared', {taskId: task.id})
                            }
                        }
                        // Keep batching if there are other tasks and queries limit allows it
                        if(waitingTasks.length > 1){
                            if(currentQueries < queriesLimit){
                                this.dispatchEvent('cascadeTask')
                            }
                        }
                    }
                }
            },{
                // On task callbacks, trigger task executed event
                triggers: ['callback_webentityMerged', 'callback_webentityPrefixAdded', 'callback_webentityDeclared']
                ,method: function(e){
                    this.dispatchEvent('taskExecuted', {
                        taskId: e.data.taskId
                        ,errorMessage: e.data.errorMessage
                    })
                    this.dispatchEvent('cascadeTask')
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
                ,urlColumnPreselect = -1
                ,nameColumnPreselect = -1
            table[0].forEach(function(d,i){
                var text = d.toLowerCase()
                if(urlColumnPreselect == -1 && (text.indexOf('url') >= 0 || text.indexOf('adresse') >= 0 || text.indexOf('address') >= 0 || text.indexOf('lien') >= 0 || text.indexOf('link') >= 0)){
                    urlColumnPreselect = i
                }
                if(nameColumnPreselect == -1 && (text.indexOf('name') >= 0 || text.indexOf('nom') >= 0 || text.indexOf('title') >= 0 || text.indexOf('titre') >= 0 || text.indexOf('label') >= 0)){
                    nameColumnPreselect = i
                }
            })
            element.html('')
                .append(
                        $('<h3>2. Select columns</h3>')
                    )
                .append(
                        $('<p/>').html('Which column contains <strong>URLs</strong>?')
                    )
                .append(
                        $('<select id="urlColumn" class="span6"/>')
                            .append($('<option value="none">Choose a column...</option>'))
                            .append(table[0].map(function(d,i){
                                    var optEl = $('<option value="'+i+'">'+d+'</option>')
                                    if(urlColumnPreselect == i){
                                        optEl.attr('selected', true)
                                    }
                                    return optEl
                                }))
                            .on('change', function(){
                                    var urlColId = $(this).val()
                                    _self.dispatchEvent('update_urlColumnId', {urlColumnId: urlColId})
                                })
                    )
                .append($('<br/>'))
                .append($('<br/>'))
                .append(
                        $('<p/>').html('Is there a column for <strong>names</strong>? <small class="muted">(optional)</span>')
                    )
                .append(
                        $('<select id="nameColumn" class="span6"/>')
                            .append($('<option value="none">No column for names</option>'))
                            .append(table[0].map(function(d,i){
                                    var optEl = $('<option value="'+i+'">'+d+'</option>')
                                    if(nameColumnPreselect == i){
                                        optEl.attr('selected', true)
                                    }
                                    return optEl
                                }))
                            .on('change', function(){
                                    var nameColId = $(this).val()
                                    _self.dispatchEvent('update_nameColumnId', {nameColumnId: nameColId})
                                })
                    )
                .append($('<br/>'))
                .append($('<br/>'))
                .append(
                        $('<p/>')
                            .append(
                                    $('<a class="btn" id="validateColumnButton">Validate columns</a>')
                                        .click(function(){
                                            if(!$(this).prop('disabled')){
                                                _self.dispatchEvent('ui_validateColumns')
                                            }
                                        })
                                )
                    )
                .append($('<br/>'))
                .append($('<br/>'))

                if(urlColumnPreselect >= 0){
                    _self.dispatchEvent('update_urlColumnId', {urlColumnId: urlColumnPreselect})
                }
                if(nameColumnPreselect >= 0){
                    _self.dispatchEvent('update_nameColumnId', {nameColumnId: nameColumnPreselect})
                }
                
        }

        var updateValidateState = function(provider){
            var colId = provider.get('urlColumnId')
            if(colId && colId >= 0){
                $('#validateColumnButton').removeAttr('disabled')
            } else {
                $('#validateColumnButton').attr('disabled', true)
            }
        }

        var freeze = function(){
            $('#urlColumn').attr('disabled', true)
            $('#nameColumn').attr('disabled', true)
            $('#validateColumnButton').attr('disabled', true)
        }

        this.triggers.events['dataTable_updated'] = update
        this.triggers.events['nameColumnId_updated', 'urlColumnId_updated'] = updateValidateState
        this.triggers.events['beginAnalysis'] = freeze
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
                ,urlColId = provider.get('urlColumnId')
                ,nameColId = provider.get('nameColumnId')
                ,queriesLimit = provider.get('queriesLimit')
                ,headline = table[0]
                ,rows = table.filter(function(d,i){return i>0})

            element.html('')
                .append(
                        $('<h3>3. Diagnostic</h3>')
                    )
                .append(
                        $('<p class="text-info"/>')
                            .text('Review this table and validate changes below (step 4.)')
                    )
                .append(
                        $('<div class="row header-row"/>')
                            .append(
                                    $('<div class="span3"/>')
                                        .html('<h5>Source URL</h5>')
                                )
                            .append(
                                    $('<div class="span6"/>')
                                        .html('<h5>Possible prefixes <small class="muted"> - check to use it and validate under the table</small></h5>')
                                )
                            .append(
                                    $('<div class="span3"/>')
                                        .html('<h5>Analysis</h5>')
                                )
                        )
                .append(
                        rows.map(function(row, i){
                            var url = Utils.URL_fix(row[urlColId])
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
                                                        .text(Utils.URL_simplify(row[urlColId]))
                                                )
                                            .append(
                                                    $('<br/>')
                                                )
                                            .append(
                                                    $('<span class="muted"/>')
                                                        .text(row[nameColId])
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

        var cascade = function(provider, e){
            var queriesLimit = provider.get('queriesLimit')
                ,currentQueries = provider.get('currentQueries')

            for(i = 0; i < queriesLimit - currentQueries; i++){

                // 1. Fill prefixes

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

                    // 2. Then it's over
                    
                    _self.dispatchEvent('cascadeFinished', {})
                }
            }
        }

        var updateWebentityFetch = function(provider, e){
            var url = e.data.url
                ,lru = Utils.URL_to_LRU(url)
                ,we_id = e.data.webentityId
                ,webentities_byLruPrefix = provider.get('webentitiesByLruPrefix')

            var elements = $('.prefix[data-url-prefix-md5='+$.md5(url)+'][data-status!=fetched]')
            if(elements.length > 0){
                if(we_id !== undefined && webentities_byLruPrefix[lru] && webentities_byLruPrefix[lru].id == we_id){
                    var webentities_byId = provider.get('webentities_byId')
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
                                                                            $('<span class="muted webentity-name"/>').text(' '+we.name+' ')
                                                                                .attr('data-webentity-id', we.id)
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
                ,taskBag = {id: rowElement.attr('data-row-id'), tasks: []}        // This is for batch operations. We fill it during the diagnostic

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
            
            */


            // Determine the matching item (there should always be one since the original lru is always in candidate prefixes)
            var matchingItem = items.filter(function(item){
                    return item.lru == sourceLru
                })[0]
            var matchingItem_jsonLru = Utils.LRU_to_JSON_LRU(matchingItem.lru)
                ,matchingItem_jsonLru_wwwAdded = matchingItem_jsonLru
            matchingItem_jsonLru_wwwAdded.host.push('www')
            var matchingItem_lru_wwwAdded = Utils.JSON_LRU_to_LRU(matchingItem_jsonLru_wwwAdded)
                        


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

            // #issue - Inclusion issue: there is a shorter prefix linked to a w.e. (that is not the www-less one), but not to the exact prefix
            var inclusionIssue = (matchingItem.we_id === undefined || matchingItem.we_id == '')
                && items.some(function(item){
                        var item_jsonLru = Utils.LRU_to_JSON_LRU(item.lru)
                            ,item_jsonLru_wwwAdded = item_jsonLru
                        item_jsonLru_wwwAdded.host.push('www')
                        var item_lru_wwwAdded = Utils.JSON_LRU_to_LRU(item_jsonLru_wwwAdded)
                        return item.we_id
                            && item.we_id != ''
                            && sourceLru.indexOf(item.lru) == 0
                            && item_lru_wwwAdded != matchingItem.lru
                    })
            



            // Recommandations if needed (pre-checking prefixes)
            if(recommand){
                // What we usually want is just to check the exact prefix...
                // ...except if it is www and has a www-less variant, because then we want to deal with the www discrepancy 
                if(sourceJsonLru.host[sourceJsonLru.host.length - 1] == 'www'){
                    var wwwLessVariant = items.filter(function(item){
                            var item_jsonLru = Utils.LRU_to_JSON_LRU(item.lru)
                                ,item_jsonLru_wwwAdded = item_jsonLru
                            item_jsonLru_wwwAdded.host.push('www')
                            var item_lru_wwwAdded = Utils.JSON_LRU_to_LRU(item_jsonLru_wwwAdded)
                            return item_lru_wwwAdded == sourceLru
                        })[0]
                    if(wwwLessVariant){
                        // The matching URL has a shorter www-less variant
                        if(wwwLessVariant.we_id === undefined || wwwLessVariant.we_id == ''){
                            if(matchingItem.we_id === undefined || matchingItem.we_id == ''){
                                
                                // None has a web entity
                                wwwLessVariant.check()
                                matchingItem.check()

                            } else {

                                // Matching has a w.e. but not the www-less variant
                                wwwLessVariant.check()
                                matchingItem.check()

                            }
                        } else {
                            if(matchingItem.we_id === undefined || matchingItem.we_id == ''){
                                
                                // The www-less variant has a web entity, but not the matching
                                wwwLessVariant.check()
                                matchingItem.check()    // Check also to prevent the creation of a different w.e. later

                            } else {
                                if(matchingItem.we_id == wwwLessVariant.we_id){
                                    
                                    // Both have the SAME web entity
                                    wwwLessVariant.check()
                                    matchingItem.check()

                                } else {

                                    // Both have a DIFFERENT web entity
                                    matchingItem.check()

                                }
                            }
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

            // #warning - Homepage mistake: if checked prefixes contain 'home' or 'index', they might just be home pages
            var homepageMistake = checkedItems.some(function(item){
                    return item.lru.indexOf(':home')>=0
                        || item.lru.indexOf(':index')>=0
                        || item.lru.indexOf(':accueil')>=0
                })

            // #warning - Page as a web entity: 1 checked prefix that is a page (except if already Homepage mistake, because redundancy)
            var webentityAsPage = checkedItems.length == 1
                && Utils.LRU_to_JSON_LRU(checkedItems[0].lru).path.filter(function(p){return p.indexOf('.')>=0}).length>0
                && !homepageMistake

            // #note - New web entity: if only w.e.-less prefixes are checked, a new w.e. will be created with all of them
            var newWebEntity = checkedItems.length>0
                && !checkedItems.some(function(item){
                        return item.we_id !== undefined && item.we_id != ''
                    })

            // #note - Prefixes added: if there is exactly one checked prefix with a w.e. and at least one checked prefix without, prefixes will be added to this w.e.
            var prefixesAdded = checkedItems.filter(function(item){return item.we_id !== undefined && item.we_id != ''}).length == 1
                && checkedItems.filter(function(item){return item.we_id === undefined || item.we_id == ''}).length > 0

            // #warning - Merge: if checked prefixes are asssociated to different w.e., there would be a merge
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
                .attr('data-status', 'diagnostic-done')

            // #note - Already defined: Nothing will be done, but something is checked
            var alreadyDefined = (!noPrefixChosen || noPrefixChosen_solved)
                && !newWebEntity
                && !prefixesAdded
                && !merge
                && (!inclusionIssue || inclusionIssue_solved)
                && (!wwwDiscrepancy || wwwDiscrepancy_solved)
            
            // Building the taskBag
            // Merge
            if(merge){
                var webentitiesToMerge = Utils.extractCases(
                    checkedItems
                        .filter(function(item){return item.we_id !== undefined && item.we_id != ''})
                        .map(function(item){return item.we_id})
                )
                for(i=1; i<webentitiesToMerge.length; i++){
                    taskBag.tasks.push({
                        type:'merge'
                        ,mergeTo: webentitiesToMerge[0]
                        ,mergeFrom: webentitiesToMerge[i]
                    })
                }
                var checkedPrefixItems = checkedItems.filter(function(item){return item.we_id === undefined || item.we_id == ''})
                if(checkedPrefixItems.length > 0){
                    checkedPrefixItems.forEach(function(item){
                        taskBag.tasks.push({
                            type:'addPrefix'
                            ,prefix: item.lru
                            ,addTo: webentitiesToMerge[0]
                        })
                    })
                }
            }
            // Add prefix
            if(prefixesAdded){
                var checkedPrefixItems = checkedItems.filter(function(item){return item.we_id === undefined || item.we_id == ''})
                    ,targetWebentityId = checkedItems.filter(function(item){return item.we_id !== undefined && item.we_id != ''})[0].we_id
                if(checkedPrefixItems.length > 0){
                    checkedPrefixItems.forEach(function(item){
                        taskBag.tasks.push({
                            type:'addPrefix'
                            ,prefix: item.lru
                            ,addTo: targetWebentityId
                        })
                    })
                }
            }
            // New web entity
            if(newWebEntity){
                taskBag.tasks.push({
                    type:'declare'
                    ,prefixes: checkedItems.map(function(item){return item.lru})
                })
            }

            // Display inclusion issue
            if(inclusionIssue){
                if(!inclusionIssue_solved){
                    /*var overWebEntity_item = items.filter(function(item){
                            var item_jsonLru = Utils.LRU_to_JSON_LRU(item.lru)
                                ,item_jsonLru_wwwAdded = item_jsonLru
                            item_jsonLru_wwwAdded.host.push('www')
                            var item_lru_wwwAdded = Utils.JSON_LRU_to_LRU(item_jsonLru_wwwAdded)
                            return item.we_id
                                && item.we_id != ''
                                && sourceLru.indexOf(item.lru) == 0
                                && item_lru_wwwAdded != matchingItem.lru
                        })[0]
                        ,overWebEntity_name = overWebEntity_item.element.parent().find('.webentity-name[data-webentity-id='+overWebEntity_item.we_id+']').text()
*/
                    analysisElement.append(
                            $('<p/>')
                                .append(
                                        $('<strong class="text-error">Inclusion Issue</strong>')
                                    )
                                .append(
                                        $('<small class="text-error"/>')
                                            .text(' - The source URL does not define its own web entity, but belongs to a more generic web entity')
                                    )
                                /*.append(
                                        $('<small class="text-error"/>')
                                            .append(
                                                    $('<strong/>').text(overWebEntity_name)
                                                )
                                    )*/
                        )
                }/* else {
                    analysisElement.append(
                            $('<p class="muted"/>').append(
                                    $('<del/>').html('<span>&nbsp; Inclusion Issue &nbsp;</span>')
                                )
                        )
                }*/
            }

            // Display https separated issue
            if(httpsSeparated){
                if(!httpsSeparated_solved){
                    analysisElement.append(
                            $('<p/>')
                                .append(
                                        $('<strong class="text-error">HTTPS Issue</strong>')
                                    )
                                .append(
                                        $('<small class="text-error"/>')
                                            .text(' - Check the HTTP and HTTPS versions of the same URL. They should probably be in the same web entity. The HTTPS protocol is for secure connections.')
                                    )
                        )
                }/* else {
                    analysisElement.append(
                            $('<p class="muted"/>').append(
                                    $('<del/>').html('<span>&nbsp; HTTPS Issue &nbsp;</span>')
                                )
                        )
                }*/
            }

            // Display no prefix chosen issue
            if(noPrefixChosen){
                if(!noPrefixChosen_solved){
                    analysisElement.append(
                            $('<p/>')
                                .append(
                                        $('<strong class="text-error">No prefix</strong>')
                                    )
                                .append(
                                        $('<small class="text-error"/>')
                                            .text(' - No prefix is chosen for this URL. Hyphe does not know it exists (yet). Check a prefix to define a web entity.')
                                    )
                        )
                }/* else {
                    analysisElement.append(
                            $('<p class="muted"/>').append(
                                    $('<del/>').html('<span>&nbsp; No prefix &nbsp;</span>')
                                )
                        )
                }*/
            }

            // Display www discrepancy issue
            if(wwwDiscrepancy){
                if(!wwwDiscrepancy_solved){
                    analysisElement.append(
                            $('<p/>')
                                .append(
                                        $('<strong class="text-error">WWW discrepancy</strong>')
                                    )
                                .append(
                                        $('<small class="text-error"/>')
                                            .text(' - There is a prefix without the WWW and it is not in the same web entity. With and without "www." are probably the same, though exceptions exist.')
                                    )
                        )
                }/* else {
                    analysisElement.append(
                            $('<p class="muted"/>').append(
                                    $('<del/>').html('<span>&nbsp; WWW discrepancy &nbsp;</span>')
                                )
                        )
                }*/
            }

            // Display homepage mistake
            if(homepageMistake){
                analysisElement.append(
                        $('<p/>')
                            .append(
                                    $('<strong class="text-error">Home page instead of website</strong>')
                                )
                            .append(
                                    $('<small class="text-error"/>')
                                        .text(' - A prefix seems to be a home page. You should choose a shorter prefix to allow different pages in the web entity.')
                                )
                    )
            }

            // Display Webentity as a page
            if(webentityAsPage){
                analysisElement.append(
                        $('<p/>')
                            .append(
                                    $('<strong class="text-warning">Page as a web entity</strong>')
                                )
                            .append(
                                    $('<small class="text-warning"/>')
                                        .text(' - Defines a web entity with a page. Just make sure that it is what you want.')
                                )
                    )
            }

            // Display POTENTIAL www discrepancy issue
            if(wouldWwwDiscrepancy){
                analysisElement.append(
                        $('<p/>')
                            .append(
                                    $('<strong class="text-error">This would create a WWW discrepancy</strong>')
                                )
                            .append(
                                    $('<small class="text-error"/>')
                                        .text(' - There would be a prefix without the WWW that would not be in the same web entity.')
                                )
                    )
            }

            // Display new web entity info
            if(newWebEntity){
                analysisElement.append(
                        $('<p/>')
                            .append(
                                    $('<strong class="text-info">New web entity</strong>')
                                )
                            .append(
                                    $('<small class="text-info"/>')
                                        .text(' - Checked prefixes will create new web entities.')
                                )
                    )
            }
            
            // Display prefixes added
            if(prefixesAdded){
                analysisElement.append(
                        $('<p/>')
                            .append(
                                    $('<strong class="text-info">Adding prefixes</strong>')
                                )
                            .append(
                                    $('<small class="text-info"/>')
                                        .text(' - Checked prefixes will be added to existing web entities.')
                                )
                    )
            }

            // Display prefixes added
            if(merge){
                analysisElement.append(
                        $('<p/>')
                            .append(
                                    $('<strong class="text-warning">Merging web entities</strong>')
                                )
                            .append(
                                    $('<small class="text-warning"/>')
                                        .text(' - Web entities will be merged, be sure that it is what you want.')
                                )
                    )
            }

            // Display already defined
            if(alreadyDefined){
                analysisElement.append(
                        $('<p/>')
                            .append(
                                    $('<strong class="text-success">Already defined</strong>')
                                )
                            .append(
                                    $('<small class="text-success"/>')
                                        .text(' - Web entity defined for this URL')
                                )
                    )
            }


            _self.dispatchEvent('rowDiagnosticUpdated', {taskBag: taskBag})
        }

        var freeze = function(){
            element.find('input[type=checkbox]').attr('disabled', true)
        }

        this.triggers.events['beginAnalysis'] = initialize
        this.triggers.events['request_cascade'] = cascade
        this.triggers.events['callback_webentityFetched'] = updateWebentityFetch
        this.triggers.events['ui_updateRowAnalysis'] = function(provider, e){
            updateAnalysis($('div.diagnostic-row[data-row-id='+e.data.rowId+']'), false)
        }
        this.triggers.events['ui_applyChanges'] = freeze
    })

    

    // Finalization
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#finalization')
            ,_self = this

        var update = function(provider, e){
            var tasks = provider.get('tasks')
                ,declareCount = tasks.filter(function(task){return task.type == 'declare'}).length
                ,addPrefixCount = tasks.filter(function(task){return task.type == 'addPrefix'}).length
                ,mergeCount = tasks.filter(function(task){return task.type == 'merge'}).length
            element.html('')
                .append(
                        $('<h3>4. Apply changes</h3>')
                    )
                .append(
                        $('<div id="tasks_declare"/>')
                            .append(
                                    $('<p class="text-info"/>')
                                        .append(
                                                $('<span>'+declareCount+' web entit'+((declareCount>1)?('ies'):('y'))+' will be created</span>')
                                            )
                                )
                    )
                .append(
                        $('<div id="tasks_addPrefix"/>')
                            .append(
                                    $('<p class="text-info"/>')
                                        .append(
                                                $('<span>'+addPrefixCount+' prefix'+((addPrefixCount>1)?('es'):(''))+' will be added to '+((addPrefixCount>1)?('web entities'):('a web entity'))+'</span>')
                                            )
                                )
                    )
                .append(
                        $('<div id="tasks_merge"/>')
                            .append(
                                    $('<p class="text-info"/>')
                                        .append(
                                                $('<span>'+mergeCount+' web entit'+((mergeCount>1)?('ies'):('y'))+' will be merged into another one</span>')
                                            )
                                )
                    )
                .append(
                        $('<div class="row"/>')
                            .append(
                                    $('<div class="span4"/>')
                                        .append(
                                                $('<a class="btn btn-primary btn-block" id="applyChangesButton">Apply changes</a>')
                                                    .click(function(){
                                                        if($(this).attr('disabled') === undefined)
                                                            _self.dispatchEvent('ui_applyChanges')
                                                    })
                                            )
                                )
                            .append(
                                    $('<div class="span8" id="errorLog"/>')
                                )
                    )
                
        }

        var initLoadbars = function(provider, e){
            var tasks = provider.get('tasks')
                ,declareCount = tasks.filter(function(task){return task.type == 'declare'}).length
                ,addPrefixCount = tasks.filter(function(task){return task.type == 'addPrefix'}).length
                ,mergeCount = tasks.filter(function(task){return task.type == 'merge'}).length
                ,declareElement = $('#tasks_declare')
                ,addPrefixElement = $('#tasks_addPrefix')
                ,mergeElement = $('#tasks_merge')

            declareElement.html('<div class="progress"><div class="bar regular" style="width: 0%;">0/'+declareCount+' web entity declared</div><div class="bar bar-danger error" style="width: 0%;"></div></div>')
                .attr('data-total', declareCount)
                .attr('data-current', 0)
                .attr('data-error', 0)
            addPrefixElement.html('<div class="progress"><div class="bar regular" style="width: 0%;">0/'+addPrefixCount+' prefix added</div><div class="bar bar-danger error" style="width: 0%;"></div></div>')
                .attr('data-total', addPrefixCount)
                .attr('data-current', 0)
                .attr('data-error', 0)
            mergeElement.html('<div class="progress"><div class="bar regular" style="width: 0%;">0/'+mergeCount+' web entity merged</div><div class="bar bar-danger error" style="width: 0%;"></div></div>')
                .attr('data-total', mergeCount)
                .attr('data-current', 0)
                .attr('data-error', 0)

            if (declareCount == 0) {
                var bar = declareElement.find('div.progress .bar.regular')
                bar.css('width', '100%')
            }

            if (addPrefixCount == 0) {
                var bar = addPrefixElement.find('div.progress .bar.regular')
                bar.css('width', '100%')
            }

            if (mergeCount == 0) {
                var bar = mergeElement.find('div.progress .bar.regular')
                bar.css('width', '100%')
            }

            $('#applyChangesButton').attr('disabled', true)
                .removeClass('btn-primary')
                .addClass('btn-warning')
                .text('Do not quit this page until end of process...')
        }

        var updateLoadbars = function(provider, e){
            var tasks_byId = provider.get('tasks_byId')
                ,task = tasks_byId[e.data.taskId]
                ,declareElement = $('#tasks_declare')
                ,addPrefixElement = $('#tasks_addPrefix')
                ,mergeElement = $('#tasks_merge')
                ,declareCurrent = +declareElement.attr('data-current')
                ,declareError = +declareElement.attr('data-error')
                ,declareTotal = +declareElement.attr('data-total')
                ,addPrefixCurrent = +addPrefixElement.attr('data-current')
                ,addPrefixError = +addPrefixElement.attr('data-error')
                ,addPrefixTotal = +addPrefixElement.attr('data-total')
                ,mergeCurrent = +mergeElement.attr('data-current')
                ,mergeError = +mergeElement.attr('data-error')
                ,mergeTotal = +mergeElement.attr('data-total')

            if(e.data.errorMessage === undefined){
                if(task.type == 'declare'){
                    var bar = declareElement.find('div.progress .bar.regular')
                        ,declareCount = declareCurrent + 1
                    declareElement.attr('data-current', declareCount)
                    bar.css('width', (100*declareCount/declareTotal)+'%')
                    bar.text(declareCount+'/'+declareTotal+' web entit'+((declareCount>1)?('ies'):('y'))+' declared')
                
                } else if(task.type == 'addPrefix'){
                    var bar = addPrefixElement.find('div.progress .bar.regular')
                        ,addPrefixCount = addPrefixCurrent + 1
                    addPrefixElement.attr('data-current', addPrefixCount)
                    bar.css('width', (100*addPrefixCount/addPrefixTotal)+'%')
                    bar.text(addPrefixCount+'/'+addPrefixTotal+' prefix'+((addPrefixCount>1)?('es'):(''))+' added')
                
                } else if(task.type == 'merge'){
                    var bar = mergeElement.find('div.progress .bar.regular')
                        ,mergeCount = mergeCurrent + 1
                    mergeElement.attr('data-current', mergeCount)
                    bar.css('width', (100*mergeCount/mergeTotal)+'%')
                    bar.text(mergeCount+'/'+mergeTotal+' web entit'+((mergeCount>1)?('ies'):('y'))+' merged')
                }
            } else {
                if(task.type == 'declare'){
                    var bar = declareElement.find('div.progress .bar.error')
                        ,declareCount = declareError + 1
                    declareElement.attr('data-error', declareCount)
                    bar.css('width', (100*declareCount/declareTotal)+'%')
                    bar.text(declareCount+' error'+((declareCount>1)?('s'):('')))
                
                } else if(task.type == 'addPrefix'){
                    var bar = addPrefixElement.find('div.progress .bar.error')
                        ,addPrefixCount = addPrefixError + 1
                    addPrefixElement.attr('data-error', addPrefixCount)
                    bar.css('width', (100*addPrefixCount/addPrefixTotal)+'%')
                    bar.text(addPrefixCount+' error'+((addPrefixCount>1)?('s'):('')))
                
                } else if(task.type == 'merge'){
                    var bar = mergeElement.find('div.progress .bar.error')
                        ,mergeCount = mergeError + 1
                    mergeElement.attr('data-error', mergeCount)
                    bar.css('width', (100*mergeCount/mergeTotal)+'%')
                    bar.text(mergeCount+' error'+((mergeCount>1)?('s'):('')))
                }
                
                element.find('#errorLog').append(
                        $('<p class="text-error"/>').html(e.data.errorMessage)
                    )
            }

            if(declareCurrent + addPrefixCurrent + mergeCurrent + declareError + addPrefixError + mergeError + 1 == declareTotal + addPrefixTotal + mergeTotal){
                declareElement.find('.bar.regular').addClass('bar-success')
                addPrefixElement.find('.bar.regular').addClass('bar-success')
                mergeElement.find('.bar.regular').addClass('bar-success')
                $('#applyChangesButton').attr('disabled', true)
                    .removeClass('btn-warning')
                    .addClass('btn-success')
                    .text('Process successful')
            }
        }

        this.triggers.events['finalize'] = update
        this.triggers.events['ui_applyChanges'] = initLoadbars
        this.triggers.events['taskExecuted'] = updateLoadbars

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