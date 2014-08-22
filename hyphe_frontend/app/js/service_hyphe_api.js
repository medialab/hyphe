'use strict';

angular.module('hyphe.service_hyphe_api', [])

  .factory('api', ['serverURL', '$http', function(surl, $http) {
    var api = {}
    ,HYPHE_API = {
      WEBENTITIES:{
        GET: 'store.get_webentities'
        ,GET_LINKS: 'store.get_webentities_network_json'
        ,CREATE_BY_LRU: 'store.declare_webentity_by_lru'
        ,CREATE_BY_LRUS: 'store.declare_webentity_by_lrus'
        ,MERGE: 'store.merge_webentity_into_another'
      }
      ,WEBENTITY:{
        STARTPAGE:{
          ADD:'store.add_webentity_startpage'
          ,REMOVE:'store.rm_webentity_startpage'
        }

        ,PREFIX:{
          ADD:'store.add_webentity_lruprefix'
          ,REMOVE:'store.rm_webentity_lruprefix'
        }
        
        ,GET_PAGES:'store.get_webentity_pages'
        ,GET_SUBWEBENTITIES:'store.get_webentity_subwebentities'
        ,GET_PARENTWEBENTITIES:'store.get_webentity_parentwebentities'

        ,SET_NAME:'store.rename_webentity'
        ,SET_STATUS: 'store.set_webentity_status'
        ,SET_HOMEPAGE: 'store.set_webentity_homepage'
        ,SET_TAG_VALUES: 'store.set_webentity_tag_values'

        ,CRAWL:'crawl_webentity'

        ,FETCH_BY_URL: 'store.get_webentity_for_url'
        ,FETCH_BY_PREFIX_LRU: 'store.get_webentity_by_lruprefix'
        ,FETCH_BY_PREFIX_URL: 'store.get_webentity_by_lruprefix_as_url'
      }
      ,PREFIX:{
        GET_PARENTWEBENTITIES:'store.get_lru_definedprefixes'
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

    api.getWebentities = buildApiCall(
        HYPHE_API.WEBENTITIES.GET
        ,function(settings){
          return [
            settings.id_list                // List of webentities
            ,settings.light || false        // Mode light
            ,settings.semiLight || false    // Mode semi-light
          ]}
      )

    api.getLruParentWebentities = buildApiCall(
        HYPHE_API.PREFIX.GET_PARENTWEBENTITIES
        ,function(settings){
          return [
            settings.lru
          ]}
      )

    api.declareWebentity = buildApiCall(
        HYPHE_API.WEBENTITIES.CREATE_BY_LRUS
        ,function(settings){
          return [
              settings.prefixes             // LRU list
              ,settings.name || ''          // Name
              ,'IN'                         // Status
            ]}
      )

    api.addStartPage = buildApiCall(
        HYPHE_API.WEBENTITY.STARTPAGE.ADD
        ,function(settings){
          return [
              settings.webentityId
              ,settings.url
            ]}
      )

    api.removeStartPage = buildApiCall(
        HYPHE_API.WEBENTITY.STARTPAGE.REMOVE
        ,function(settings){
          return [
              settings.webentityId
              ,settings.url
            ]}
      )

    api.addPrefix = buildApiCall(
        HYPHE_API.WEBENTITY.PREFIX.ADD
        ,function(settings){
          return [
              settings.webentityId
              ,settings.lru
            ]}
      )

    api.removePrefix = buildApiCall(
        HYPHE_API.WEBENTITY.PREFIX.REMOVE
        ,function(settings){
          return [
              settings.webentityId
              ,settings.lru
            ]}
      )

    api.webentitiesMerge = buildApiCall(
        HYPHE_API.WEBENTITIES.MERGE
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
              var target = data[0].result
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

    return api

    function rpcError(data, status, headers, config) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
      console.log('RPC Error', data, status, headers, config)
    }
  }])