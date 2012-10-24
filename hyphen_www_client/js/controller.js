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
		
		// FAKE BEHAVIOR
		// Hyphen.model.crawlJobs.setAll([{
		// 	   "_id": "43d1f4b00d5911e2943c00163e22b2db",
		// 	   "crawl_arguments": {
		// 	     "project": "hci-dev",
		// 	     "follow_prefixes": "s: http|h: fr|h: blogspot|h: informationpreneur",
		// 	     "setting": "DOWNLOAD_DELAY=0.5",
		// 	     "maxdepth": 3,
		// 	     "discover_prefixes": "s: http|h: ly|h: bit,s: http|h: co|h: t,s: http|h: com|h: tinyurl,s: http|h: gl|h: goo,s: http|h: me|h: fb,s: http|h: me|h: fb|h: on,s: http|h: ca|h: ur1,s: http|h: ly|h: ow",
		// 	     "nofollow_prefixes": "",
		// 	     "start_urls": "http: \/\/informationpreneur.blogspot.fr",
		// 	     "spider": "pages",
		// 	     "user_agent": "Mozilla\/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit\/525.19 (KHTML, like Gecko) Chrome\/0.2.153.1 Safari\/525.19" 
		// 	  },
		// 	   "crawling_status": "FINISHED",
		// 	   "indexing_status": "BATCH_FINISHED",
		// 	   "log": {
		// 	     "0": "2012-10-03 14: 53: 01.565295: CRAWL_ADDED",
		// 	     "1": "2012-10-04 04: 29: 07.440874: CRAWL_RUNNING",
		// 	     "2": "2012-10-04 04: 38: 05.438264: CRAWL_FINISHED",
		// 	     "3": "2012-10-09 06: 25: 57.753555: INDEX_BATCH_RUNNING",
		// 	     "4": "2012-10-09 07: 31: 29.542201: INDEX_BATCH_FINISHED",
		// 	     "5": "2012-10-09 07: 31: 32.755192: INDEX_BATCH_RUNNING",
		// 	     "6": "2012-10-09 10: 26: 40.122168: INDEX_BATCH_CRASHED",
		// 	     "7": "2012-10-09 10: 26: 45.143327: INDEX_BATCH_RUNNING",
		// 	     "8": "2012-10-09 11: 09: 33.669391: INDEX_BATCH_FINISHED",
		// 	     "9": "2012-10-09 11: 09: 35.146540: INDEX_BATCH_RUNNING",
		// 	     "10": "2012-10-09 11: 56: 33.098484: INDEX_BATCH_FINISHED",
		// 	     "11": "2012-10-09 11: 56: 35.147096: INDEX_BATCH_RUNNING",
		// 	     "12": "2012-10-09 13: 00: 38.354539: INDEX_BATCH_FINISHED",
		// 	     "13": "2012-10-09 13: 00: 40.143949: INDEX_BATCH_RUNNING",
		// 	     "14": "2012-10-09 13: 32: 29.372957: INDEX_BATCH_FINISHED" 
		// 	  },
		// 	   "nb_links": 40925,
		// 	   "nb_pages": 12923,
		// 	   "timestamp": 1349268781.5653,
		// 	   "webentity_id": "907ee235-4b88-4542-9714-61351796dc7c" 
		// 	},
		// 	{
		// 	   "_id": "43a38f120d5911e2943c00163e22b2db",
		// 	   "crawl_arguments": {
		// 	     "project": "hci-dev",
		// 	     "follow_prefixes": "s: http|h: fr|h: blogspot|h: alzheimerscaregiver",
		// 	     "setting": "DOWNLOAD_DELAY=0.5",
		// 	     "maxdepth": 3,
		// 	     "discover_prefixes": "s: http|h: ly|h: bit,s: http|h: co|h: t,s: http|h: com|h: tinyurl,s: http|h: gl|h: goo,s: http|h: me|h: fb,s: http|h: me|h: fb|h: on,s: http|h: ca|h: ur1,s: http|h: ly|h: ow",
		// 	     "nofollow_prefixes": "",
		// 	     "start_urls": "http: \/\/alzheimerscaregiver.blogspot.fr",
		// 	     "spider": "pages",
		// 	     "user_agent": "Mozilla\/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit\/525.19 (KHTML, like Gecko) Chrome\/0.2.153.1 Safari\/525.19" 
		// 	  },
		// 	   "crawling_status": "FINISHED",
		// 	   "indexing_status": "BATCH_FINISHED",
		// 	   "log": {
		// 	     "0": "2012-10-03 14: 53: 01.291868: CRAWL_ADDED",
		// 	     "1": "2012-10-04 04: 24: 21.447763: CRAWL_RUNNING",
		// 	     "2": "2012-10-04 04: 29: 07.441113: CRAWL_FINISHED",
		// 	     "3": "2012-10-09 05: 31: 32.757739: INDEX_BATCH_RUNNING",
		// 	     "4": "2012-10-09 05: 51: 12.745961: INDEX_BATCH_FINISHED",
		// 	     "5": "2012-10-09 05: 51: 17.756762: INDEX_BATCH_RUNNING",
		// 	     "6": "2012-10-09 06: 10: 10.873500: INDEX_BATCH_FINISHED",
		// 	     "7": "2012-10-09 06: 10: 12.758871: INDEX_BATCH_RUNNING",
		// 	     "8": "2012-10-09 06: 25: 52.814966: INDEX_BATCH_FINISHED" 
		// 	  },
		// 	   "nb_links": 30056,
		// 	   "nb_pages": 2768,
		// 	   "timestamp": 1349268781.2919,
		// 	   "webentity_id": "39694346-c6d7-4a9a-94fa-ea97b35935b0" 
		// 	}])
		$(document).trigger( "/crawls", [{what:'updated'}])
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
		Hyphen.debug.log(["Hyphen.controller.core.weBrowser_setWebEntityFocus: " + we_id], 1)
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
		Hyphen.debug.log(["Hyphen.controller.core.weBrowser_setPath: " + path], 1)
		if(path == ""){
			// No web entity focused: reset
			Hyphen.model.uxSettings.set('browserPath','')

		} else {
			// Web entity selected: we get the pages
			Hyphen.model.uxSettings.set('browserPath',path)
		}

		$(document).trigger( "/weBrowser", [{what:'pathUpdated'}])
	}

	Hyphen.controller.core.declareWebEntityByURL = function(url, callback){
        Hyphen.debug.log(["Hyphen.controller.core.declareWebEntityByURL: " + url], 1)
		Hyphen.controller.io.declarePage(url, function(json){
            if(json){
            	if(json.result && json.result.id){
            		var we = json.result
            		Hyphen.model.webEntities.update(we)
					$(document).trigger( "/webentity", [{what:'updated', webEntity_id:we.id}])
		            callback(we)
            	}
			}
        })
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
	}

	Hyphen.controller.io.webEntity_rename = function(we_id, new_name, callback){
		Hyphen.controller.io.call('store.rename_webentity', JSON.stringify([we_id, new_name]), callback)
	}

	Hyphen.controller.io.declarePage = function(url, callback){
		Hyphen.controller.io.call('declare_page', [url], callback)
	}

})(jQuery)