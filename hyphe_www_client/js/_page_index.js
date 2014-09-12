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
                id:'status'
                ,dispatch: 'status_updated'
                ,triggers: 'update_status'
            }
        ]


        ,services: [
        	{
                id: 'getStatus'
                ,setter: 'status'
                ,data: function(settings){ return JSON.stringify({ //JSON RPC
                        'method' : HYPHE_API.STATUS.GET,
                        'params' : [],
                    })}
                ,path:'0.result'
                ,url: rpc_url, contentType: rpc_contentType, type: rpc_type, expect: rpc_expect, error: rpc_error
            }
        ]


        ,hacks:[
        ]
    })



    //// Modules

    // 
    D.addModule(function(){
        domino.module.call(this)

        var element = $('#summary')

        var redraw = function(){
        	var status = D.get('status')
        	console.log('status', status)
        	element.html('')

        	var div = $('<div/>')
			div.append(
						$('<strong/>').text(status.corpus.memory_structure.webentities.total + ' web entit'+((status.corpus.memory_structure.webentities.total>1)?('ies'):('y')))
					)
				.append($('<br/>'))
				.append($('<br/>'))

			div.append(
						$('<span/>').text(status.corpus.crawler.pages_crawled + ' page'+((status.corpus.crawler.pages_crawled>1)?('s'):(''))+' crawled')
					)
				.append($('<br/>'))

			if(status.corpus.crawler.jobs_pending == 0 && status.corpus.crawler.jobs_running == 0){
				div.append(
							$('<span/>').text('No crawl scheduled')
						)
					.append($('<br/>'))
			} else {
				div.append(
							$('<span/>').text(status.corpus.crawler.jobs_running+' crawl job'+((status.corpus.crawler.jobs_running>1)?('s'):(''))+' running')
						)
					.append($('<br/>'))
					.append(
							$('<span/>').text(status.corpus.crawler.jobs_pending+' crawl job'+((status.corpus.crawler.jobs_pending>1)?('s'):(''))+' pending')
						)
					.append($('<br/>'))
			}
			div.append($('<br/>'))

			div.append(
						$('<span/>').text(
								'Last content indexation '+Utils.prettyDate((new Date()).setTime(status.corpus.memory_structure.last_index))
								+((status.corpus.memory_structure.pages_to_index>0)?(' ('+status.corpus.memory_structure.pages_to_index+' pages to index)'):(''))
							)
					)
				.append($('<br/>'))
				.append(
						$('<span/>').text('Last link built '+Utils.prettyDate((new Date()).setTime(status.corpus.memory_structure.last_links_generation)))
					)
				.append($('<br/>'))
            if(status.corpus.memory_structure.job_running) {
                div.append($('<span/>').text('Server activity: '+status.corpus.memory_structure.job_running))
                .append($('<br/>'))
            }

        	element.append(div)
        }

        this.triggers.events['status_updated'] = redraw
    })




    //// On load
    $(document).ready(function(){
        D.request('getStatus', {})
    })




    //// Clock
    function refreshStatus() {
    	D.request('getStatus', {})
   	}
    // Reset each 20s
   	var auto_refresh_status = setInterval(refreshStatus, 20000)




    //// Processing
    


    /// Misc functions
    

})(jQuery, domino, (window.dmod = window.dmod || {}))
