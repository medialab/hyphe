;(function($, undefined){

	Hyphen.controller = {};

	





	Hyphen.controller.core = {}	// Core: it manages the essential actions involved in the user experience

	Hyphen.controller.core.webEntities_declare = function(URLs_list){
		$(document).trigger( "/pages", [{what:'pushing'}])
		Hyphen.debug.log(["Hyphen.controller.core.pages_push:", URLs_list.join(', ')], 1)
		Hyphen.controller.io.pages_push([URLs_list.join(",")], function(json){
			if(json){
				$(document).trigger( "/pages", [{what:'pushed'}])
			}
		})
	}

	Hyphen.controller.core.webEntity_crawl = function(we_id){
		$(document).trigger( "/crawl", [{what:'launching'}])
		Hyphen.debug.log(["Hyphen.controller.core.webEntity_crawl: crawl web entity " + we_id], 1)
		Hyphen.controller.io.webEntity_crawl(we_id, function(json){
			if(json){
				$(document).trigger( "/crawl", [{what:'launched'}])
			}
		})
	}

	Hyphen.controller.core.crawlJobs_update = function(){
		$(document).trigger( "/crawls", [{what:'updating'}])
		Hyphen.debug.log(["Hyphen.controller.core.crawlJobs_update"], 1)
		Hyphen.controller.io.jobs_getAll(function(json){
			if(json){

				// Store in the model
				var jobs_list = json.result
				Hyphen.model.crawlJobs.setAll(jobs_list)

				$(document).trigger( "/crawls", [{what:'updated'}])
			}
		})
	}

	Hyphen.controller.core.reinitialize_all = function(){
		$(document).trigger( "/webentities", [{what:'reinitializing'}])
		$(document).trigger( "/crawls", [{what:'reinitializing'}])
		Hyphen.debug.log(["Hyphen.controller.core.reinitialize_all"], 1)
		Hyphen.controller.io.reinitialize_all(function(json){
			if(json){

				$(document).trigger( "/webentities", [{what:'reinitialized'}])
				$(document).trigger( "/crawls", [{what:'reinitialized'}])
			}
		})
	}

	Hyphen.controller.core.webEntities_update = function(){
		$(document).trigger( "/webentities", [{what:'updating'}])
		Hyphen.debug.log(["Hyphen.controller.core.webEntities_update"], 1)
		Hyphen.controller.io.webEntities_getAll(function(json){
			if(json){
				
				// Store in the model
				var we_list = json.result
				Hyphen.model.webEntities.setAll(we_list)

				$(document).trigger( "/webentities", [{what:'updated'}])
			}
		})
	}

	Hyphen.controller.core.webEntity_getPages = function(we_id){
		$(document).trigger( "/webentity", [{what:'updating', webEntity_id:we_id}])
		$(document).trigger( "/webentity", [{what:'pagesUpdating', webEntity_id:we_id}])
		Hyphen.debug.log(["Hyphen.controller.core.webEntity_getPages: from web entity " + we_id], 1)
		Hyphen.controller.io.webEntity_getPages(we_id, function(json){
			if(json){
				Hyphen.model.webEntities.setPages(we_id, json.result)
				$(document).trigger( "/webentity", [{what:'updated', webEntity_id:we_id}])
				$(document).trigger( "/webentity", [{what:'pagesUpdated', webEntity_id:we_id}])
			}
		})
	}

	Hyphen.controller.core.webEntity_rename = function(we_id, new_name){
		$(document).trigger( "/webentity", [{what:'renaming', webEntity_id:we_id}])
		Hyphen.debug.log(["Hyphen.controller.core.webEntity_rename: Renaming web entity " + we_id + " in '" + new_name + "'" ], 1)
		Hyphen.controller.io.webEntity_rename(we_id, new_name, function(json){
			if(json){
				$(document).trigger( "/webentity", [{what:'renamed', webEntity_id:we_id}])
			}
		})
	}

	Hyphen.controller.core.weBrowser_setWebEntityFocus = function(we_id){
		if(we_id == ""){
			// No web entity focused: reset
			Hyphen.model.uxSettings.set('focusedWebEntityId','')

		} else {
			// Web entity selected: we get the pages
			Hyphen.model.uxSettings.set('focusedWebEntityId',we_id)
		}

		$(document).trigger( "/weBrowser", [{what:'focusUpdated'}])
	}

	Hyphen.controller.core.weBrowser_setPath = function(path){
		if(path == ""){
			// No web entity focused: reset
			Hyphen.model.uxSettings.set('browserPath','')

		} else {
			// Web entity selected: we get the pages
			Hyphen.model.uxSettings.set('browserPath',path)
		}

		$(document).trigger( "/weBrowser", [{what:'pathUpdated'}])
	}







	Hyphen.controller.macros = {}	// Functions that involve the state of the UI.









	// CASCADING EVENTS
	
	// Web Entities (list)
	$(document).on( "/webentities", function(event, eventData){
		switch(eventData.what){

			// Reinitialize web entities -> update the list of web entities
			case "reinitialized":
			Hyphen.controller.core.webEntities_update()
			break

		}
	})

	// Crawls (list)
	$(document).on( "/crawls", function(event, eventData){
		switch(eventData.what){

			// Reinitialize crawls -> update the list of crawls
			case "reinitialized":
			Hyphen.controller.core.crawlJobs_update()
			break
		}
	})

	// Pages (list)
	$(document).on( "/pages", function(event, eventData){
		switch(eventData.what){

			// Push a page -> update the list of web entities
			case "pushed":
			Hyphen.controller.core.webEntities_update()
			break
		}
	})









	Hyphen.controller.io = {}	// A module for rpc in/out with the core

	Hyphen.controller.io.call = function (method, params, callback) {
		var jsonquery = {			// It's JSON RPC
			"method" : method,
			"params" : params,
		}
			,query = JSON.stringify(jsonquery)
			,rpc_xhr = new XMLHttpRequest()		// Classic Ajax code

		Hyphen.debug.log(["Hyphen.controller.io.call: RPC query sent to the server: " + method, jsonquery], 2)

		rpc_xhr.onreadystatechange = function () {
			Hyphen.debug.log(["Hyphen.controller.io.call: XHR Ready state has changed:", rpc_xhr.readyState], 3)
			if (rpc_xhr.readyState == 4 && rpc_xhr.status == 200) {
				
				Hyphen.debug.log(["Hyphen.controller.io.call: The server answered:", rpc_xhr.responseText], 2)

				var json = JSON.parse(rpc_xhr.responseText)[0]
				if(json.code && json.code == "success"){
					callback(json)
				} else {
					Hyphen.debug.log(["/!\\ Error: RPC Server Fail - ResponseText:", rpc_xhr.responseText],0)
				}
			}
		}
		rpc_xhr.open("POST", Hyphen.config.SERVER_ADDRESS, true)
		rpc_xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
		rpc_xhr.send(query)
	}

	Hyphen.controller.io.ping = function(callback){
		Hyphen.controller.io.call('ping', '', callback)
	}

	Hyphen.controller.io.reinitialize_all = function(callback){
		Hyphen.controller.io.call('reinitialize', '', callback)
	}

	Hyphen.controller.io.pages_push = function(URLs_list, callback){
		Hyphen.controller.io.call('index_pages', URLs_list, callback)
	}

	Hyphen.controller.io.webEntity_crawl = function(we_id, callback){
		Hyphen.controller.io.call('crawl_webentity', [we_id], callback)
	}

	Hyphen.controller.io.jobs_getAll = function(callback){
		Hyphen.controller.io.call('listjobs', '', callback)
	}

	Hyphen.controller.io.webEntities_getAll = function(callback){
		Hyphen.controller.io.call('store.get_webentities', '', callback)
	}

	Hyphen.controller.io.webEntity_getPages = function(we_id, callback){
		Hyphen.controller.io.call('store.get_webentity_pages', [we_id], callback)

		// Just for test
		//callback(["http://www.warincontext.com", "http://www.warincontext.com/blog/page1", "http://www.warincontext.com/blog/page2", "http://www.warincontext.com/archive/2010", "http://www.warincontext.com/archive/2011"]);
	}

	Hyphen.controller.io.webEntity_rename = function(we_id, new_name, callback){
		Hyphen.controller.io.call('store.rename_webentity', JSON.stringify([we_id, new_name]), callback)
	}
	
})(jQuery)