;(function($, undefined){

	Hyphen.model = {};	// The model keeps a memory of "what we know" from the data sent by the Core (server side)

	
	// Various settings of graphic component
	Hyphen.model.uxSettings = {
		_private:{
			focusedWebEntityId: ''
			,browserPath: ''
		}

		// Generic getters and setters
		,get: function(property){
			return Hyphen.model.uxSettings._private[property]
		}
		,set: function(property, value){
			Hyphen.model.uxSettings._private[property] = value
		}
	}


	// Manage unitary variables
	Hyphen.model.vars = {
		_private:{
			index:{}
		}

		// Getters and setters
		,get: function(key){
			return Hyphen.model.vars._private.index[key]
		}
		,set: function(key, value){
			Hyphen.model.vars._private.index[key] = value
		}
	}

	// Manage web entities
	Hyphen.model.webEntities = {
		_private:{
			list:[]
			,index:{}
			,consolidate: function(we){
				// Add url_prefixes
				we.url_prefixes = we.lru_prefixes.map(function(lru){
					return Hyphen.utils.LRU_to_URL(lru)
				})

				// Fix some missing keys
				we.crawling_status = we.crawling_status || 'uncrawled'
				we.indexing_status = we.crawling_status || 'unindexed'

				// Add a "searchable" field concatenating url prefixes, name...
				we.searchable = we.name
					+ " " + we.url_prefixes.join(" ")
					+ " " + we.homepage
					+ " " + we.startpages.join(" ")
					+ " " + we.indexing_status
					+ " " + we.crawling_status
			}
			,consolidatePage: function(page){
				page.id = page.lru
			}
		}

		// Getters and setters
		,get: function(id){
			return Hyphen.model.webEntities._private.index[id]
		}
		,getAll: function(){
			return Hyphen.model.webEntities._private.list.slice(0)
		}
		,setAll: function(we_list){
			Hyphen.model.webEntities._private.list = we_list.slice(0)

			// Consolidate
			Hyphen.model.webEntities._private.list.forEach(Hyphen.model.webEntities._private.consolidate)

			// Index
			Hyphen.model.webEntities._private.index = {}
			Hyphen.model.webEntities._private.list.forEach(function(we){
				if(we.id){
					Hyphen.model.webEntities._private.index[we.id] = we
				}
			})
		},update: function(web_entity){
			// consolidate web entity
			Hyphen.model.webEntities._private.consolidate(web_entity)
			
			if(Hyphen.model.webEntities.get(web_entity.id)){
				// update list
				for(var i=0; i<Hyphen.model.webEntities._private.list.length; i++){
					if(Hyphen.model.webEntities._private.list[i].id == web_entity.id){
						Hyphen.model.webEntities._private.list[i] = web_entity
						i = Hyphen.model.webEntities._private.list.length
					}
				}
				// update index
				Hyphen.model.webEntities._private.index[web_entity.id] = web_entity
			} else {
				// push in the list
				Hyphen.model.webEntities._private.list.push(web_entity)
				// index
				Hyphen.model.webEntities._private.index[web_entity.id] = web_entity
			}
		},setPages: function(we_id, pages){
			pages.forEach(function(page){
				Hyphen.model.webEntities._private.consolidatePage(page)
			})
			Hyphen.model.webEntities._private.index[we_id].pages = pages
			Hyphen.model.webEntities._private.index[we_id].pages_byId = {}
			pages.forEach(function(page){
				Hyphen.model.webEntities._private.index[we_id].pages_byId[page.id] = page
			})
		},getPages: function(we_id){
			return Hyphen.model.webEntities._private.index[we_id].pages
		},getPage_byId: function(we_id, page_id){
			return Hyphen.model.webEntities._private.index[we_id].pages_byId[page_id]
		}
	}

	// Manage crawl jobs
	Hyphen.model.crawlJobs = {
		_private:{
			list:[]
			,index:{}
			,consolidate: function(job){
				// Proper id
				job.id = job._id
			}
		}

		// Getters and setters
		,get: function(id){
			return Hyphen.model.crawlJobs._private.index[id]
		}
		,getAll: function(){
			return Hyphen.model.crawlJobs._private.list.slice(0)
		}
		,setAll: function(jobs_list){
			Hyphen.model.crawlJobs._private.list = jobs_list
			Hyphen.model.crawlJobs._private.index = {}
			jobs_list.forEach(function(crawlJob){
				Hyphen.model.crawlJobs._private.consolidate(crawlJob)
				if(crawlJob.id){
					Hyphen.model.crawlJobs._private.index[crawlJob.id] = crawlJob
				}
			})
		}
	}



})(jQuery)
