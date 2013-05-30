// Hyphe API abstraction
// This code is very simple (just a json), and makes sense because we often change the API specification
HYPHE_API = {
	WEBENTITIES:{
		GET: 'store.get_webentities'
		,GET_LINKS: 'store.get_webentities_network_json'
		,CREATE_BY_LRU: 'store.declare_webentity_by_lru'
		,MERGE: 'store.merge_webentity_into_another'
	}
	,WEBENTITY:{
		STARTPAGE:{
			ADD:'store.add_webentity_startpage'
			,REMOVE:'store.rm_webentity_startpage'
		}
		
		,GET_PAGES:'store.get_webentity_pages'
		,GET_SUBWEBENTITIES:'store.get_webentity_subwebentities'
		,GET_PARENTWEBENTITIES:'store.get_webentity_parentwebentities'

		,SET_NAME:'store.rename_webentity'
		,SET_STATUS: 'store.set_webentity_status'
		,SET_HOMEPAGE: 'store.set_webentity_homepage'
		,SET_TAG_VALUES: 'store.set_webentity_tag_values'

		,CRAWL:'crawl_webentity'
	}
	,PAGES:{
		DECLARE:'declare_pages'
	}
	,PAGE:{
		DECLARE:'declare_page'
	}
	,CRAWLJOBS:{
		GET:'listjobs'
	}
	,CRAWLJOB:{
		CANCEL:'crawl.cancel'
	}
	,STATUS:{
		GET:'get_status'
	}

	,URL_LOOKUP:'lookup_httpstatus'
	,RESET:'reinitialize'
}