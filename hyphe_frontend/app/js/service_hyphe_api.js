'use strict';

angular.module('hyphe.service_hyphe_api', [])

  .factory('api', ['serverURL', '$http', function(surl, $http) {
    var ns = {} // Namespace
    ,API = {}

    API.WEBENTITY_LIST_GET                          = 'store.get_webentities'
    API.WEBENTITY_LIST_GET_LINKS                    = 'store.get_webentities_network_json'
    API.WEBENTITY_LIST_CREATE_BY_LRU                = 'store.declare_webentity_by_lru'
    API.WEBENTITY_LIST_CREATE_BY_LRU_LIST           = 'store.declare_webentity_by_lrus'
    API.WEBENTITY_LIST_MERGE                        = 'store.merge_webentity_into_another'

    API.WEBENTITY_STARTPAGE_ADD                     = 'store.add_webentity_startpage'
    API.WEBENTITY_STARTPAGE_REMOVE                  = 'store.rm_webentity_startpage'

    API.WEBENTITY_PREFIX_ADD                        = 'store.add_webentity_lruprefix'
    API.WEBENTITY_PREFIX_REMOVE                     = 'store.rm_webentity_lruprefix'
    
    API.WEBENTITY_PAGE_LIST_GET                     = 'store.get_webentity_pages'
    API.WEBENTITY_SUBWEBENTITY_LIST_GET             = 'store.get_webentity_subwebentities'
    API.WEBENTITY_PARENTWEBENTITY_LIST_GET          = 'store.get_webentity_parentwebentities'
    API.WEBENTITY_NAME_SET                          = 'store.rename_webentity'
    API.WEBENTITY_STATUS_SET                        = 'store.set_webentity_status'
    API.WEBENTITY_HOMEPAGE_SET                      = 'store.set_webentity_homepage'
    API.WEBENTITY_TAG_VALUES_SET                    = 'store.set_webentity_tag_values'
    API.WEBENTITY_CRAWL                             = 'crawl_webentity'
    API.WEBENTITY_FETCH_BY_URL                      = 'store.get_webentity_for_url'
    API.WEBENTITY_FETCH_BY_PREFIX_LRU               = 'store.get_webentity_by_lruprefix'
    API.WEBENTITY_FETCH_BY_PREFIX_URL               = 'store.get_webentity_by_lruprefix_as_url'

    API.POTENTIAL_WEBENTITY_CONTAINER_LIST_GET      = 'store.get_lru_definedprefixes'

    API.PAGE_LIST_DECLARE                           = 'declare_pages'

    API.PAGE_DECLARE                                = 'declare_page'

    API.CRAWLJOB_LIST_GET                           = 'listjobs'

    API.CRAWLJOB_CANCEL                             = 'crawl.cancel'

    API.STATUS_GET                                  = 'get_status'

    API.URL_LOOKUP                                  = 'lookup_httpstatus'

    API.RESET                                       = 'reinitialize'

    ns.getWebentities = buildApiCall(
        API.WEBENTITY_LIST_GET
        ,function(settings){
          return [
            settings.id_list                // List of webentities
            ,settings.light || false        // Mode light
            ,settings.semiLight || false    // Mode semi-light
          ]}
      )

    ns.getLruParentWebentities = buildApiCall(
        API.POTENTIAL_WEBENTITY_CONTAINER_LIST_GET
        ,function(settings){
          return [
            settings.lru
          ]}
      )

    ns.declareWebentity = buildApiCall(
        API.WEBENTITY_LIST_CREATE_BY_LRU_LIST
        ,function(settings){
          return [
              settings.prefixes             // LRU list
              ,settings.name || ''          // Name
              ,'IN'                         // Status
              ,settings.startPages || []    // Start pages
            ]}
      )

    ns.urlLookup = buildApiCall(
        API.URL_LOOKUP
        ,function(settings){
          return [
              settings.url
            ]}
      )

    ns.addStartPage = buildApiCall(
        API.WEBENTITY_STARTPAGE_ADD
        ,function(settings){
          return [
              settings.webentityId
              ,settings.url
            ]}
      )

    ns.removeStartPage = buildApiCall(
        API.WEBENTITY_STARTPAGE_REMOVE
        ,function(settings){
          return [
              settings.webentityId
              ,settings.url
            ]}
      )

    ns.addPrefix = buildApiCall(
        API.WEBENTITY_PREFIX_ADD
        ,function(settings){
          return [
              settings.webentityId
              ,settings.lru
            ]}
      )

    ns.removePrefix = buildApiCall(
        API.WEBENTITY_PREFIX_REMOVE
        ,function(settings){
          return [
              settings.webentityId
              ,settings.lru
            ]}
      )

    ns.webentitiesMerge = buildApiCall(
        API.WEBENTITY_LIST_MERGE
        ,function(settings){

          // Default settings
          if(settings.mergeTags === undefined)
            settings.mergeTags = true
          if(settings.mergeStartPages === undefined)
            settings.mergeStartPages = true
          
          return [
              settings.oldWebentityId
              ,settings.goodWebentityId
              ,settings.mergeTags             // Include tags
              ,settings.mergeStartPages       // Include Home and Startpages as Startpages
            ]}
      )

    ns.crawl = buildApiCall(
        API.WEBENTITY_CRAWL
        ,function(settings){
          return [
            settings.webentityId
            ,settings.depth
            ,false
            ,false
            ,settings.cautious || false
          ]}
      )

    ns.globalStatus = buildApiCall(
        API.STATUS_GET
        ,function(settings){
            return []
          }
      )

    ns.getCrawlJobs = buildApiCall(
        API.CRAWLJOB_LIST_GET
        ,function(settings){
          return [
            settings.id_list    // List of crawl jobs
          ]}
      )

    ns.abortCrawlJobs = buildApiCall(
        API.CRAWLJOB_CANCEL
        ,function(settings){
          return [
            settings.id
          ]}
      )

    return ns

    function buildApiCall(pseudo_route, params){
      return function(settings, successCallback, errorCallback){
        var s // settings
        if(typeof(settings) == 'object'){
          s = settings
        } else if(typeof(settings) == 'function'){
          s = settings()
        } else {
          s = {}
        }
        
        // Abort
        if(s._API_ABORT_QUERY){
          return false
        }

        errorCallback = errorCallback || rpcError
        $http({
          method: 'POST'
          ,url: surl
          ,data: JSON.stringify({ //JSON RPC
              'method' : pseudo_route,
              'params' : params(s),
            })
          ,headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
          .success(function(data, status, headers, config){
              var target = (data[0] || {}).result
              if(target){
                successCallback(target)
              } else {
                console.log('data', data, 'errorCallback', errorCallback)
                errorCallback(data, status, headers, config)
              }
            })
          .error(function(data, status, headers, config){
            errorCallback(data, status, headers, config)
          })

        return true
      }
    }

    function rpcError(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
      console.log('RPC Error', data, status, headers, config)
    }
  }])