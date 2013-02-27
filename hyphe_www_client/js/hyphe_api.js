// Hyphe API abstraction
// This code is very simple (just a json), and makes sense because we often change the API specification
HYPHE_API = {
	WEBENTITIES:{
		GET: 'store.get_webentities'
	}
	,WEBENTITY:{
		GET_PAGES:'store.get_webentity_pages'
		,GET_SUBWEBENTITIES:'store.get_webentity_subwebentities'
		,SET_NAME:'store.rename_webentity'
		,SET_STATUS: 'store.set_webentity_status'
		,SET_HOMEPAGE: 'store.set_webentity_homepage'
		,SET_TAG_VALUES: 'store.set_webentity_tag_values'
	}
}