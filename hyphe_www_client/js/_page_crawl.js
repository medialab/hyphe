domino.settings({
    shortcutPrefix: "::" // Hack: preventing a bug related to a port in a URL for Ajax
    ,verbose: true
})

;(function($, domino, dmod, undefined){
    
    // Check that config is OK
    if(HYPHE_CONFIG === undefined)
        alert('Your installation of Hyphe has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHYPHE_CONFIG = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')

    // Stuff we reuse often when we initialize Domino
    var rpc_url = HYPHE_CONFIG.SERVER_ADDRESS
        ,rpc_contentType = 'application/x-www-form-urlencoded'
        ,rpc_type = 'POST'
        ,rpc_expect = function(data){return data[0] !== undefined && data[0].code !== undefined && data[0].code == 'success'}
        ,rpc_error = function(data){alert('Oops, an error occurred... \n'+data)}

    var D = new domino({
        name: 'main'
        ,properties: [
            {
                id:'crawljobs'
                ,dispatch: 'crawljobs_updated'
                ,triggers: 'update_crawljobs'
            },{
                id:'currentCrawljob'
                ,dispatch: 'currentCrawljob_updated'
                ,triggers: 'update_currentCrawljob'
            },{
                id:'webentities'
                ,dispatch: 'webentities_updated'
                ,triggers: 'update_webentities'
            },{
                id:'crawljobAbortValidation'
                ,dispatch: 'crawljobAbortValidation_updated'
                ,triggers: 'update_crawljobAbortValidation'
            }
        ]


        ,services: [
            {
                id: 'getCrawljobs'
                ,setter: 'crawljobs'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.CRAWLJOBS.GET,
                        'params' : [],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            },{
                id: 'getWebentities'
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
                id: 'crawljobAbort'
                ,setter: 'crawljobAbortValidation'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.CRAWLJOB.CANCEL,
                        'params' : [
                            settings.id
                        ],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }
        ]


        ,hacks:[
            {
                // Log in console on button click
                triggers:['logInConsole']
                ,method: function(){
                    console.log('crawl job', D.get('currentCrawljob'))
                }
            },{
                // Abort crawl on button click
                triggers:['abortCrawl']
                ,method: function(){
                    D.request('crawljobAbort', {
                        id: D.get('currentCrawljob')._id
                    })
                }
            },{
                // Refresh after abortion
                triggers:['crawljobAbortValidation_updated']
                ,method: function(){
                    D.request('getCrawljobs', {})
                }
            },{
                // We need to declare the event somewhere
                triggers:['crawljobs_redraw']
                ,method: function(){
                    //console.log('redraw')
                }
            }
        ]
    })



    //// Modules

    // Redraw when changing the settings
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#crawlJobs_showFinished')

        element.click(function(){
            D.dispatchEvent('crawljobs_redraw',{})
        })
    })

    D.addModule(function(){
        domino.module.call(this)

        var element = $('#crawlJobs_showPending')

        element.click(function(){
            D.dispatchEvent('crawljobs_redraw',{})
        })
    })

    D.addModule(dmod.Button, [{
        element: $('#crawlJobs_refresh')
        ,label: 'Refresh'
        ,bsIcon: 'icon-refresh'
        ,dispatch: 'crawljobs_redraw'
        ,ghost: true
    }])


    // The big list of crawl jobs
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#jobs')

        element.html('').append(
            $('<div id="jobsMessage"><span class="muted">Loading...</span></div>')
        ).append(
            $('<table class="table table-hover" style="display:none;" id="jobsTable"><thead><tr><th>Web entity</th><th style="width:80px">Harvesting</th><th style="width:80px">Indexing</th><th style="width:80px">Data</th><th style="width:10px"></th></tr></thead><tbody id="jobsTableBody"></tbody></table>')
        )
        
        var redraw = function() {
            var jobs = D.get('crawljobs')
                ,showPending = $('#crawlJobs_showPending').is(':checked')
                ,showFinished = $('#crawlJobs_showFinished').is(':checked')
                ,webEntitites_idDisplayed = []

            if(!showFinished){
                jobs = jobs.filter(function(job, i){
                    return i<5 || (job.crawling_status.toLowerCase() != "finished" && job.crawling_status.toLowerCase() != "canceled") || job.indexing_status.toLowerCase() != "finished" 
                })
            }
            if(!showPending){
                jobs = jobs.filter(function(job){
                    return job.crawling_status.toLowerCase() != "pending"
                })
            }
            jobs.sort(function(a,b){
                return b.timestamp - a.timestamp
            })

            if(jobs.length > 0){
                $('#jobsMessage').html('')
                $('#jobsTable').show()
                $('#jobsTableBody').html('')
                jobs.forEach(function(crawlJob){
                    var crawling_colorClass = crawlJobs_crawling_getLabelColor(crawlJob.crawling_status)
                        ,indexing_colorClass = crawlJobs_indexing_getLabelColor(crawlJob.indexing_status)
                        ,row_colorClass = ''
                    webEntitites_idDisplayed.push(crawlJob.webentity_id)
                    
                    if(crawlJob.crawling_status.toLowerCase().indexOf("crashed") >= 0 || crawlJob.indexing_status.toLowerCase().indexOf("crashed") >= 0 || crawlJob.crawling_status.toLowerCase() == "canceled")
                        row_colorClass = 'error'
                    else if(crawlJob.crawling_status.toLowerCase() == "finished" && crawlJob.indexing_status.toLowerCase() == "finished")
                        row_colorClass = 'success'
                    else if(crawlJob.crawling_status.toLowerCase() == "pending")
                        row_colorClass = 'warning'
                    else 
                        row_colorClass = 'info'

                    // DOM
                    $('#jobsTableBody').append(
                        $('<tr class="'+row_colorClass+' hover" crawljobid="'+crawlJob._id+'"/>').append(
                            $('<td/>').append(
                                $('<span/>').append(
                                    $('<small class="muted"/>').text(crawlJob.webentity_id)
                                )
                                    .addClass('webEntity_proxy')
                                    .attr('webEntity_id', crawlJob.webentity_id)
                            )
                        ).append(
                            $('<td/>').append(
                                $('<span class="label '+crawling_colorClass+'"/>').text(crawlJob.crawling_status.replace('_', ' ').toLowerCase())
                            )
                        ).append(
                            $('<td/>').append(
                                $('<span class="label '+indexing_colorClass+'"/>').text(crawlJob.indexing_status.replace('_', ' ').toLowerCase())
                            )
                        ).append(
                            $('<td><small>'+crawlJob.nb_pages+' pages<br/>'+crawlJob.nb_links+' links</small></td>')
                        ).append(
                            $('<td style="vertical-align:middle;"><i class="icon-chevron-right icon-white decorating-chevron pull-right"/></td>')
                        ).click(function(){
                            D.dispatchEvent('update_currentCrawljob', {
                                currentCrawljob: crawlJob
                            })
                        })
                    )
                    // Call web entities displayed
                    D.request('getWebentities', {
                        id_list: webEntitites_idDisplayed
                    })
                })
            } else {
                $('#jobsMessage').html('<span class="text-info">No crawl job</span>')
                $('#jobsTable').hide()
                $('#jobsTableBody').html('')
            }
        }

        this.triggers.events['crawljobs_updated'] = redraw
        this.triggers.events['crawljobs_redraw'] = redraw
    })
    
    // The div for current crawl job
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#jobFrame')

        element.html('')

        var redraw = function(){
            var crawlJob = D.get('currentCrawljob')
                ,offsetTop = -1
            if(crawlJob != undefined){
                $('#jobsTableBody tr').each(function(i, tr){
                    trElement = $(tr)
                    var crawlJob_id = trElement.attr('crawljobid')
                    if(crawlJob_id == crawlJob._id){
                        trElement.addClass("selected")
                        offsetTop = trElement.offset().top
                    } else {
                        trElement.removeClass("selected")
                    }
                })
                if(offsetTop >= 0){
                    var crawling_colorClass = crawlJobs_crawling_getLabelColor(crawlJob.crawling_status)
                        ,indexing_colorClass = crawlJobs_indexing_getLabelColor(crawlJob.indexing_status)
                        ,noCancel = crawlJob.crawling_status.toLowerCase() == "finished" || crawlJob.crawling_status.toLowerCase() == "crashed" || crawlJob.crawling_status.toLowerCase() == "canceled"
                    element.show()
                    element.html('')
                    element.append(
                        $('<div/>').css('margin-top', offsetTop - element.offset().top)
                    ).append($('<hr/>'))
                    element.append(
                        $('<h4/>').append(
                            $('<span/>').text('Crawling "')
                        ).append(
                            $('<span/>').append(
                                $('<small class="muted"/>').text(crawlJob.webentity_id)
                            )
                                .addClass('webEntity_proxy')
                                .attr('webEntity_id', crawlJob.webentity_id)
                        ).append(
                            $('<span/>').text('"')
                        )
                    ).append(
                        $('<p/>').append(
                            $('<span class="label '+crawling_colorClass+'"/>').text('Harvesting: '+crawlJob.crawling_status.replace('_', ' ').toLowerCase())
                        ).append(
                            $('<span/>').text(' ')
                        ).append(
                            $('<span class="label '+indexing_colorClass+'"/>').text('Indexing: '+crawlJob.indexing_status.replace('_', ' ').toLowerCase())
                        ).append(
                            $('<span/>').text(' ')
                        )
                    ).append(
                        $('<p/>').append(
                            $('<span/>').text('Launched '+Utils.prettyDate((new Date()).setTime(crawlJob.timestamp)).toLowerCase())
                        ).append(
                            $('<br/>')
                        ).append(
                            $('<span/>').text(crawlJob.nb_pages+' pages and '+crawlJob.nb_links+' links ')
                        )
                    ).append($('<hr/>'))
                    
                    if(!noCancel){
                        var abortButton = $('<a class="btn"/>')
                        D.addModule(dmod.Button, [{
                            element: abortButton
                            ,label: 'Abort crawl'
                            ,bsIcon: 'icon-remove-sign'
                            ,bsColor: 'btn-danger'
                            ,dispatch: 'abortCrawl'
                            ,ghost: true
                        }])
                        element.append(abortButton)
                    }
                    var logButton = $('<a class="btn"/>')
                    D.addModule(dmod.Button, [{
                        element: logButton
                        ,label: 'Log in the browser\'s console'
                        ,dispatch: 'logInConsole'
                        ,ghost: true
                    }])
                    element.append(logButton)
                    
                    element.append($('<hr/>'))

                    element.append(
                        $('<strong/>').html('Settings')
                    ).append(
                        $('<br/>')
                    ).append(
                        $('<span/>').text('Id: '+crawlJob._id)
                    ).append(
                        $('<br/>')
                    ).append(
                        $('<span/>').text("Maximum depth: ")
                    ).append(
                        $('<span class="badge badge-info"/>').text(crawlJob.crawl_arguments.maxdepth)
                    ).append(
                        $('<br/>')
                    ).append(
                        $('<span/>').text("Options: ")
                    ).append(
                        $('<span/>').text(crawlJob.crawl_arguments.setting)
                    ).append(
                        $('<br/>')
                    ).append(
                        $('<span/>').text("Starting URLs:")
                    ).append(
                        $('<ul class="unstyled"/>').append(
                            crawlJob.crawl_arguments.start_urls.map(function(d){
                                return $('<li/>').append(
                                    $('<a/>').append(
                                        $('<small/>').text(d)
                                    ).attr('href', d)
                                    .attr('target', '_blank')
                                )
                            })
                        )
                    )
                }
            }
        }

        this.triggers.events['currentCrawljob_updated'] = redraw
        this.triggers.events['crawljobs_updated'] = redraw
        this.triggers.events['crawljobs_redraw'] = redraw
        
    })



    //// On load
    $(document).ready(function(){
        D.request('getCrawljobs', {})
    })




    /// Misc functions
    var crawlJobs_crawling_getLabelColor = function(status){
        var crawling_colorClass
        if(status.toLowerCase() == "finished")
            crawling_colorClass = 'label-success'
        else if(status.toLowerCase().indexOf("crashed") >= 0)
            crawling_colorClass = 'label-important'
        else if(status.toLowerCase() == "pending")
            crawling_colorClass = 'label-warning'
        else if(status.toLowerCase() == "canceled")
            crawling_colorClass = 'label-inverse'
        else
            crawling_colorClass = ''
        return crawling_colorClass
    }

    var crawlJobs_indexing_getLabelColor = function(status){
        var indexing_colorClass
        if(status.toLowerCase() == "finished")
            indexing_colorClass = 'label-success'
        else if(status.toLowerCase().indexOf("crashed") >= 0)
            indexing_colorClass = 'label-important'
        else if(status.toLowerCase() == "pending")
            indexing_colorClass = 'label-warning'
        else
            indexing_colorClass = ''
        return indexing_colorClass
    }

})(jQuery, domino, (window.dmod = window.dmod || {}))




















// To delete:
;(function(Hyphen, $, undefined){
    


    // On load
	$(document).ready(function(){

        Hyphen.controller.core.crawlJobs_update()

        $('#crawlJobs_refresh').click(Hyphen.controller.core.crawlJobs_update)
        $('#crawlJobs_showFinished').change(function(){
            Hyphen.view.crawlJobs_drawTable()
        })
        $('#crawlJobs_showPending').change(function(){
            Hyphen.view.crawlJobs_drawTable()
        })
	})

    // View

    Hyphen.view.crawlJobs_drawTable = function(){
        var jobs = Hyphen.model.crawlJobs.getAll()
            ,showPending = $('#crawlJobs_showPending').is(':checked')
            ,showFinished = $('#crawlJobs_showFinished').is(':checked')
            ,webEntitites_idDisplayed = []
        if(!showFinished){
            jobs = jobs.filter(function(job, i){
                return i<5 || (job.crawling_status.toLowerCase() != "finished" && job.crawling_status.toLowerCase() != "canceled") || job.indexing_status.toLowerCase() != "finished" 
            })
        }
        if(!showPending){
            jobs = jobs.filter(function(job){
                return job.crawling_status.toLowerCase() != "pending"
            })
        }
        jobs.sort(function(a,b){
            return b.timestamp - a.timestamp
        })
        if(jobs.length > 0){
            $('#jobsMessage').html('')
            $('#jobsTable').show()
            $('#jobsTableBody').html('')
            jobs.forEach(function(crawlJob){
                var crawling_colorClass = Hyphen.view.crawlJobs_crawling_getLabelColor(crawlJob.crawling_status)
                    ,indexing_colorClass = Hyphen.view.crawlJobs_indexing_getLabelColor(crawlJob.indexing_status)
                    ,row_colorClass = ''
                webEntitites_idDisplayed.push(crawlJob.webentity_id)
                
                if(crawlJob.crawling_status.toLowerCase().indexOf("crashed") >= 0 || crawlJob.indexing_status.toLowerCase().indexOf("crashed") >= 0 || crawlJob.crawling_status.toLowerCase() == "canceled")
                    row_colorClass = 'error'
                else if(crawlJob.crawling_status.toLowerCase() == "finished" && crawlJob.indexing_status.toLowerCase() == "finished")
                    row_colorClass = 'success'
                else if(crawlJob.crawling_status.toLowerCase() == "pending")
                    row_colorClass = 'warning'
                else 
                    row_colorClass = 'info'

                // DOM
                $('#jobsTableBody').append(
                    $('<tr class="'+row_colorClass+' hover" crawljobid="'+crawlJob.id+'"/>').append(
                        $('<td/>').append(
                            $('<span/>').append(
                                $('<small class="muted"/>').text(crawlJob.webentity_id)
                            )
                                .addClass('webEntity_proxy')
                                .attr('webEntity_id', crawlJob.webentity_id)
                        )
                    ).append(
                        $('<td/>').append(
                            $('<span class="label '+crawling_colorClass+'"/>').text(crawlJob.crawling_status.replace('_', ' ').toLowerCase())
                        )
                    ).append(
                        $('<td/>').append(
                            $('<span class="label '+indexing_colorClass+'"/>').text(crawlJob.indexing_status.replace('_', ' ').toLowerCase())
                        )
                    ).append(
                        $('<td><small>'+crawlJob.nb_pages+' pages<br/>'+crawlJob.nb_links+' links</small></td>')
                    ).append(
                        $('<td style="vertical-align:middle;"><i class="icon-chevron-right icon-white decorating-chevron pull-right"/></td>')
                    ).click(function(){
                        Hyphen.controller.core.selectCrawlJob(crawlJob.id)
                    })
                )
            })
        } else {
            $('#jobsMessage').html('<span class="text-info">No crawl job</span>')
            $('#jobsTable').hide()
            $('#jobsTableBody').html('')
        }
        // Store web entities displayed
        Hyphen.controller.core.webEntities_update(webEntitites_idDisplayed)
    }

    Hyphen.view.crawlJob_drawFrame = function(crawlJob){
        $('#jobsTableBody tr').each(function(i, tr){
            var crawlJob_id = $(tr).attr('crawljobid')
            if(crawlJob_id == crawlJob.id)
                $(tr).addClass("selected")
            else
                $(tr).removeClass("selected")
        })
        var crawling_colorClass = Hyphen.view.crawlJobs_crawling_getLabelColor(crawlJob.crawling_status)
            ,indexing_colorClass = Hyphen.view.crawlJobs_indexing_getLabelColor(crawlJob.indexing_status)
            ,noCancel = crawlJob.crawling_status.toLowerCase() == "finished" || crawlJob.crawling_status.toLowerCase() == "crashed" || crawlJob.crawling_status.toLowerCase() == "canceled"
        $('#jobFrame').show()
        $('#jobFrame').html('')
        $('#jobFrame').append(
            $('<h4/>').append(
                $('<span/>').text('Crawling "')
            ).append(
                $('<span/>').append(
                    $('<small class="muted"/>').text(crawlJob.webentity_id)
                )
                    .addClass('webEntity_proxy')
                    .attr('webEntity_id', crawlJob.webentity_id)
            ).append(
                $('<span/>').text('"')
            )
        ).append(
            $('<p/>').append(
                $('<span class="label '+crawling_colorClass+'"/>').text('Harvesting: '+crawlJob.crawling_status.replace('_', ' ').toLowerCase())
            ).append(
                $('<span/>').text(' ')
            ).append(
                $('<span class="label '+indexing_colorClass+'"/>').text('Indexing: '+crawlJob.indexing_status.replace('_', ' ').toLowerCase())
            ).append(
                $('<span/>').text(' ')
            )
        ).append(
            $('<p/>').append(
                $('<strong/>').text("Launched: ")
            ).append(
                $('<span/>').text(Hyphen.utils.prettyDate((new Date()).setTime(crawlJob.timestamp)))
            ).append(
                $('<br/>')
            ).append(
                 $('<strong/>').text("Pages: ")
            ).append(
                $('<span/>').text(crawlJob.nb_pages)
            ).append(
                $('<br/>')
            ).append(
                $('<strong/>').text("Links: ")
            ).append(
                $('<span/>').text(crawlJob.nb_links)
            ).append(
                $('<span/>').text(' ')
            )
        ).append(
            $('<p/>').append(
                $('<a class="btn btn-danger '+((noCancel)?('disabled'):(''))+'"/>').html('<i class="icon-remove-sign icon-white"/> Abort crawl').click(function(){
                    Hyphen.controller.core.crawlJobs_cancel(crawlJob.id)
                })
            ).append(
                $('<span/>').text(' ')
            ).append(
                $('<a class="btn"/>').text('Show in console').click(function(){
                    console.log(crawlJob)
                })
            )
        ).append(
            $('<p/>').append(
                $('<small class="muted"/>').text('Crawl job id: '+crawlJob.id)
            )
        ).append(
            $('<h4/>').html('Settings')
        ).append(
            $('<p/>').append(
                $('<strong/>').text("Maximum depth: ")
            ).append(
                $('<span class="badge badge-info"/>').text(crawlJob.crawl_arguments.maxdepth)
            )
        ).append(
            $('<p/>').append(
                $('<strong/>').text("Options: ")
            ).append(
                $('<span/>').text(crawlJob.crawl_arguments.setting)
            )
        ).append(
            $('<p/>').append(
                $('<strong/>').text("Starting URLs:")
            ).append(
                $('<ul class="unstyled"/>').append(
                    crawlJob.crawl_arguments.start_urls.map(function(d){
                        return $('<li/>').append(
                            $('<a/>').append(
                                $('<small/>').text(d)
                            ).attr('href', d)
                            .attr('target', '_blank')
                        )
                    })
                )
            )
        )
        // Update the web entity proxy
        Hyphen.view.webEntities.proxiesUpdate(true)
    }

    $(document).on( "/crawls", function(event, eventData){
        switch(eventData.what){
            case "updated":
            
            Hyphen.view.crawlJobs_drawTable()
            if(crawlJob_id = Hyphen.model.uxSettings.get('crawlJob_focused'))
                Hyphen.view.crawlJob_drawFrame(Hyphen.model.crawlJobs.get(crawlJob_id))

            break
        }
    })

    $(document).on( "/crawlJob", function(event, eventData){
        switch(eventData.what){
            case "focusUpdated":
            var crawlJob = Hyphen.model.crawlJobs.get(eventData.crawjJob_id)
            Hyphen.view.crawlJob_drawFrame(crawlJob)
            break
        }
    })



    // Controller

    Hyphen.controller.core.selectCrawlJob = function(job_id){
        Hyphen.model.uxSettings.set('crawlJob_focused', job_id)
        $(document).trigger( "/crawlJob", [{what:'focusUpdated', crawjJob_id:job_id}])
    }




})//(window.Hyphen = window.Hyphen || {}, jQuery)