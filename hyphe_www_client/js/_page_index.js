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
						$('<strong/>').text(status.memory_structure.webentities + ' web entit'+((status.memory_structure.webentities>1)?('ies'):('y')))
					)
				.append($('<br/>'))
				.append($('<br/>'))

			div.append(
						$('<span/>').text(status.crawler.pages_crawled + ' page'+((status.crawler.pages_crawled>1)?('s'):(''))+' crawled')
					)
				.append($('<br/>'))

			if(status.crawler.jobs_pending == 0 && status.crawler.jobs_running == 0){
				div.append(
							$('<span/>').text('No crawl scheduled')
						)
					.append($('<br/>'))
			} else {
				div.append(
							$('<span/>').text(status.crawler.jobs_running+' crawl job'+((status.crawler.jobs_running>1)?('s'):(''))+' running')
						)
					.append($('<br/>'))
					.append(
							$('<span/>').text(status.crawler.jobs_pending+' crawl job'+((status.crawler.jobs_pending>1)?('s'):(''))+' pending')
						)
					.append($('<br/>'))
			}
			div.append($('<br/>'))
				
			div.append(
						$('<span/>').text('Last memory activity '+Utils.prettyDate((new Date()).setTime(status.memory_structure.job_running_since)))
					)
				.append($('<br/>'))
				.append(
						$('<span/>').text(
								'Last content indexation '+Utils.prettyDate((new Date()).setTime(status.memory_structure.last_index))
								+((status.memory_structure.pages_to_index>0)?(' ('+status.memory_structure.pages_to_index+' pages to index)'):(''))
							)
					)
				.append($('<br/>'))
				.append(
						$('<span/>').text('Last link built '+Utils.prettyDate((new Date()).setTime(status.memory_structure.last_links_generation)))
					)
				.append($('<br/>'))

        	element.append(div)

/*
        	crawler: Object
				jobs_pending: 0
				jobs_running: 0
				pages_crawled: 1242

			memory_structure: Object
				job_running: null
				job_running_since: 1369904197218.76
				last_index: 1369857266493.114
				last_links_generation: 1369904201808.857
				pages_to_index: 0
				webentities: 581
*/

        }

        this.triggers.events['status_updated'] = redraw
    })




    //// On load
    $(document).ready(function(){
        D.request('getStatus', {})
    })

    //// Processing
    


    /// Misc functions
    

})(jQuery, domino, (window.dmod = window.dmod || {}))