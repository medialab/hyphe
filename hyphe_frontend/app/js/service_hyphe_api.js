'use strict';

angular.module('hyphe.service_hyphe_api', [])

  .factory('api', ['serverURL', '$http', 'corpus', '$location', function(surl, $http, corpus, $location) {
    var ns = {} // Namespace
    ,API = {}

    API.WEBENTITY_LIST_GET                          = 'store.get_webentities'
    API.WEBENTITY_LIST_GET_BY_STATUS                = 'store.get_webentities_by_status'
    API.WEBENTITY_LIST_GET_LINKS                    = 'store.get_webentities_network_json'
    API.WEBENTITY_LIST_CREATE_BY_LRU                = 'store.declare_webentity_by_lru'
    API.WEBENTITY_LIST_CREATE_BY_LRU_LIST           = 'store.declare_webentity_by_lrus'
    API.WEBENTITY_LIST_STATUS_SET                   = 'store.set_webentities_status'
    API.WEBENTITY_LIST_MERGE_INTO                   = 'store.merge_webentities_into_another'

    API.WEBENTITY_LIST_SEARCH_ADVANCED              = 'store.advanced_search_webentities'
    API.WEBENTITY_LIST_SEARCH_EXACT                 = 'store.exact_search_webentities'
    API.WEBENTITY_LIST_SEARCH_GET_PAGE              = 'store.get_webentities_page'

    API.WEBENTITY_STARTPAGE_ADD                     = 'store.add_webentity_startpage'
    API.WEBENTITY_STARTPAGE_REMOVE                  = 'store.rm_webentity_startpage'

    API.WEBENTITY_PREFIX_ADD                        = 'store.add_webentity_lruprefixes'
    API.WEBENTITY_PREFIX_REMOVE                     = 'store.rm_webentity_lruprefix'
    
    API.WEBENTITY_PAGE_LIST_GET                     = 'store.get_webentity_pages'
    API.WEBENTITY_PAGES_NETWORK_GET                 = 'store.get_webentity_nodelinks_network_json'
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
    API.WEBENTITY_MERGE_INTO                        = 'store.merge_webentity_into_another'

    API.WE_CREATION_RULE_ADD                        = 'store.add_webentity_creationrule'
    API.WE_CREATION_RULE_REMOVE                     = 'store.delete_webentity_creationrule'
    API.WE_CREATION_RULE_LIST_GET                   = 'store.get_webentity_creationrules'

    API.LINKS_RESET                                 = 'store.trigger_links_reset'

    API.POTENTIAL_WEBENTITY_CONTAINER_LIST_GET      = 'store.get_lru_definedprefixes'

    API.PAGE_LIST_DECLARE                           = 'declare_pages'

    API.PAGE_DECLARE                                = 'declare_page'

    API.CRAWLJOB_LIST_GET                           = 'listjobs'

    API.CRAWLJOB_CANCEL                             = 'crawl.cancel'

    API.STATUS_GET                                  = 'get_status'

    API.URL_LOOKUP                                  = 'lookup_httpstatus'

    API.RESET                                       = 'reinitialize'

    API.CORPUS_LIST_GET                             = 'list_corpus'
    API.CORPUS_CREATE                               = 'create_corpus'
    API.CORPUS_START                                = 'start_corpus'
    API.CORPUS_STOP                                 = 'stop_corpus'
    API.CORPUS_RESET                                = 'reinitialize'
    API.CORPUS_DESTROY                              = 'destroy_corpus'
    API.CORPUS_OPTIONS_GET                          = 'get_corpus_options'
    API.CORPUS_OPTIONS_SET                          = 'set_corpus_options'
    API.CORPUS_TEST                                 = 'test_corpus'
    API.CORPUS_PING                                 = 'ping'

    ns.getWebentities = buildApiCall(
        API.WEBENTITY_LIST_GET
        ,function(settings){
          return [
            settings.id_list                                 // List of webentities
            ,settings.light || false                         // Mode light
            ,settings.semiLight || false                     // Mode semi-light
            ,settings.sort || ["-status", "name"]            // Ordering
            ,settings.count || 1000                          // Results per page
            ,settings.page || 0                              // Results page
            ,settings.csvLight || false                      // Mode light special for CSV
            ,corpus.getId()
          ]}
      )

    ns.getWebentities_byStatus = buildApiCall(
        API.WEBENTITY_LIST_GET_BY_STATUS
        ,function(settings){
          return [
            settings.status
            ,settings.sort || ''
            ,settings.count || 100
            ,settings.page || 0
            ,corpus.getId()
          ]}
      )

    ns.setSort = function(sortField) {
        if (!sortField){
            return "name"
        } else if (sortField != "name" && sortField != "-name"){
            return [sortField, "name"]
        }
        return sortField
    }

    ns.searchWebentities = buildApiCall(
        API.WEBENTITY_LIST_SEARCH_ADVANCED
        ,function(settings){
          return [
            settings.allFieldsKeywords      // List of kw searched everywhere
            ,settings.fieldKeywords         // List of [field,kw] pairs for field search
            ,ns.setSort(settings.sortField) // Ordering
            ,settings.count || 1000         // Results per page
            ,settings.page || 0             // Page
            ,corpus.getId()
          ]}
      )

    ns.searchWebentities_exact = buildApiCall(
        API.WEBENTITY_LIST_SEARCH_EXACT
        ,function(settings){
          return [
            settings.query
            ,settings.field
            ,ns.setSort(settings.sortField) // Ordering
            ,settings.count || 1000         // Results per page
            ,settings.page || 0             // Page
            ,corpus.getId()
          ]}
      )

    ns.getResultsPage = buildApiCall(
        API.WEBENTITY_LIST_SEARCH_GET_PAGE
        ,function(settings){
          return [
            settings.token
            ,settings.page
            ,corpus.getId()
          ]}
      )

    ns.getLruParentWebentities = buildApiCall(
        API.POTENTIAL_WEBENTITY_CONTAINER_LIST_GET
        ,function(settings){
          return [
            settings.lru
            ,corpus.getId()
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
              ,corpus.getId()
            ]}
      )

    ns.urlLookup = buildApiCall(
        API.URL_LOOKUP
        ,function(settings){
          return [
              settings.url
              ,settings.timeout || 30
              ,corpus.getId()
            ]}
      )

    ns.resetLinks = buildApiCall(
        API.LINKS_RESET
        ,function(settings){
          return [
              corpus.getId()
            ]}
      )

    ns.addStartPage = buildApiCall(
        API.WEBENTITY_STARTPAGE_ADD
        ,function(settings){
          return [
              settings.webentityId
              ,settings.url
              ,corpus.getId()
            ]}
      )

    ns.removeStartPage = buildApiCall(
        API.WEBENTITY_STARTPAGE_REMOVE
        ,function(settings){
          return [
              settings.webentityId
              ,settings.url
              ,corpus.getId()
            ]}
      )

    ns.getPages = buildApiCall(
        API.WEBENTITY_PAGE_LIST_GET
        ,function(settings){
          return [
              settings.webentityId
              ,settings.crawledOnly || false
              ,corpus.getId()
            ]}
      )

    ns.getPagesNetwork = buildApiCall(
        API.WEBENTITY_PAGES_NETWORK_GET
        ,function(settings){
          return [
              settings.webentityId
              ,'json' // output format
              ,false  // include external links
              ,corpus.getId()
            ]}
      )

    ns.getSubWebentities = buildApiCall(
        API.WEBENTITY_SUBWEBENTITY_LIST_GET
        ,function(settings){
          return [
              settings.webentityId
              ,corpus.getId()
            ]}
      )

    ns.getParentWebentities = buildApiCall(
        API.WEBENTITY_PARENTWEBENTITY_LIST_GET
        ,function(settings){
          return [
              settings.webentityId
              ,corpus.getId()
            ]}
      )


    ns.addPrefix = buildApiCall(
        API.WEBENTITY_PREFIX_ADD
        ,function(settings){
          return [
              settings.webentityId
              ,settings.lru
              ,corpus.getId()
            ]}
      )

    ns.removePrefix = buildApiCall(
        API.WEBENTITY_PREFIX_REMOVE
        ,function(settings){
          return [
              settings.webentityId
              ,settings.lru
              ,corpus.getId()
            ]}
      )

    ns.webentityMergeInto = buildApiCall(
        API.WEBENTITY_MERGE_INTO
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
              ,corpus.getId()
            ]}
      )

    ns.webentitiesMergeInto = buildApiCall(
        API.WEBENTITY_LIST_MERGE_INTO
        ,function(settings){

          // Default settings
          if(settings.mergeTags === undefined)
            settings.mergeTags = true
          if(settings.mergeStartPages === undefined)
            settings.mergeStartPages = true
          
          return [
              settings.oldWebentityId_list
              ,settings.goodWebentityId
              ,settings.mergeTags             // Include tags
              ,settings.mergeStartPages       // Include Home and Startpages as Startpages
              ,corpus.getId()
            ]}
      )

    ns.webentitiesSetStatus = buildApiCall(
        API.WEBENTITY_LIST_STATUS_SET
        ,function(settings){
          return [
              settings.webentityId_list
              ,settings.status
              ,corpus.getId()
            ]}
      )

    ns.crawl = buildApiCall(
        API.WEBENTITY_CRAWL
        ,function(settings){
          return [
            settings.webentityId
            ,settings.depth
            ,settings.cautious || false
            ,settings.status || 'IN'
            ,settings.startpages || 'default'
            ,{}                                 // phantom timeouts
            ,corpus.getId()
          ]}
      )

    ns.globalStatus = buildApiCall(
        API.STATUS_GET
        ,function(settings){
            return [corpus.getId()]
          }
      )

    ns.getCorpusList = buildApiCall(
        API.CORPUS_LIST_GET
        ,function(settings){
            return []
          }
      )

    ns.createCorpus = buildApiCall(
        API.CORPUS_CREATE
        ,function(settings){
            return [
              settings.name
              ,settings.password
              ,settings.options || []
            ]
          }
      )

    ns.startCorpus = buildApiCall(
        API.CORPUS_START
        ,function(settings){
            return [
              settings.id
              ,settings.password
            ]
          }
      )

    ns.stopCorpus = buildApiCall(
        API.CORPUS_STOP
        ,function(settings){
            return [
              settings.id
            ]
          }
      )

    ns.getCorpusOptions = buildApiCall(
        API.CORPUS_OPTIONS_GET
        ,function(settings){
            return [
              settings.id
            ]
          }
      )

    ns.setCorpusOptions = buildApiCall(
        API.CORPUS_OPTIONS_SET
        ,function(settings){
            return [
              settings.id
              ,settings.options
            ]
          }
      )

    ns.testCorpus = buildApiCall(
        API.CORPUS_TEST
        ,function(settings){
            return [
              settings.id
            ]
          }
      )

    ns.pingCorpus = buildApiCall(
        API.CORPUS_PING
        ,function(settings){
            return [
              settings.id
              ,settings.timeout || 3    // Seconds before returning false
            ]
          }
      )

    ns.destroyCorpus = buildApiCall(
        API.CORPUS_DESTROY
        ,function(settings){
            return [
              settings.id
            ]
          }
      )

    ns.resetCorpus = buildApiCall(
        API.CORPUS_RESET
        ,function(settings){
            return [
              settings.id
            ]
          }
      )

    ns.getCrawlJobs = buildApiCall(
        API.CRAWLJOB_LIST_GET
        ,function(settings){
          return [
            settings.id_list    // List of crawl jobs
            ,settings.from || null
            ,settings.to || null
            ,corpus.getId()
          ]}
      )

    ns.abortCrawlJobs = buildApiCall(
        API.CRAWLJOB_CANCEL
        ,function(settings){
          return [
            settings.id
            ,corpus.getId()
          ]}
      )


    ns.getNetwork = buildApiCall(
        API.WEBENTITY_LIST_GET_LINKS
        ,function(settings){return [corpus.getId()]}
      )

    
    ns.getWECreationRules = buildApiCall(
        API.WE_CREATION_RULE_LIST_GET
        ,function(settings){
          return [
            settings.prefix    // lru_prefix
            ,corpus.getId()
          ]}
      )

    ns.addWECreationRules = buildApiCall(
        API.WE_CREATION_RULE_ADD
        ,function(settings){
          return [
            settings.prefix                               // lru_prefix
            ,settings.regexp                              // Regexp rule
            ,settings.apply_to_existing_pages || false
            ,corpus.getId()
          ]}
      )

    ns.removeWECreationRules = buildApiCall(
        API.WE_CREATION_RULE_REMOVE
        ,function(settings){
          return [
            settings.prefix    // lru_prefix
            ,corpus.getId()
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
              if(target !== undefined){
                // console.log('[OK]', data)
                successCallback(target)
              } else {
                if(data[0] && data[0].message && data[0].message.status && data[0].message.status != "ready"){
                  // Corpus shut down
                  $location.path('/')
                } else {
                  console.log('[Error: unexpected]', data)
                  errorCallback(data, status, headers, config)
                }
              }
            })
          .error(function(data, status, headers, config){
            console.log('[Error: fail]', data)
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
