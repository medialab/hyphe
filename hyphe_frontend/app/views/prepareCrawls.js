'use strict';

angular.module('hyphe.preparecrawlsController', [])

  .controller('PrepareCrawls', ['$scope', 'api', 'store', 'utils', '$location', 'QueriesBatcher', '$modal', 'corpus'
  ,function($scope, api, store, utils, $location, QueriesBatcher, $modal, corpus) {
    $scope.currentPage = 'prepareCrawls'
    $scope.Page.setTitle('Prepare Crawls')
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.crawlDepth = 1

    $scope.httpStatusLoading = 0
    $scope.httpStatusWarning = 0
    $scope.httpStatusSuccess = 0
    
    $scope.paginationPage = 1
    $scope.paginationLength = 50    // How many items per page
    $scope.paginationNumPages = 10   // How many pages to display in the pagination

    $scope.depthRange = [0,1]

    $scope.queriesBatches = []

    $scope.list = []
    var list_byId = {}  // List index

    $scope.getWebentities = getWebentities

    $scope.removeRow = function(objId){
      console.log('remove row',objId)
      var obj = list_byId[objId]

      // Remove old status
      if(obj.startpagesSummary.status == 'warning'){
        $scope.httpStatusWarning--
      } else if(obj.startpagesSummary.status == 'success'){
        $scope.httpStatusSuccess--
      } else {
        $scope.httpStatusLoading--
      }

      $scope.list = $scope.list.filter(function(obj){
        return obj.id != objId
      })

      delete list_byId[objId]

    }


    // Initialization

    getSettingsFromCorpusOptions()
    bootstrapList(store.get('webentities_toCrawl'))
    store.remove('webentities_toCrawl')


    // Functions

    function getSettingsFromCorpusOptions(){
      api.getCorpusOptions({
        id: $scope.corpusId
      }, function(options){
        $scope.depthRange = Array.apply(0, Array(options.max_depth + 1)).map(function(a,i){return i})
      }, function(){
        $scope.status = {message: "Error while getting options", background: 'danger'}
      })
    }

    function bootstrapList(list){
      list = list || []

      // Remove doublons
      list = utils.extractCases(list, function(obj){
        return obj.webentity.id
      })

      // Clean and set exactly what we need
      list = list.map(function(obj, i){
        $scope.httpStatusLoading++
        return {
          id:i
          ,webentity: obj.webentity
          ,status: 'loading'
          ,touched: false
          ,collapsed: true
          ,startpagesSummary: {status: 'loading'}
        }
      })

      // Build index
      list.forEach(function(obj){
        list_byId[obj.id] = obj
      })

      // Redirect if needed
      if(list.length == 0){
        $location.path('/project/'+$scope.corpusId+'/monitorCrawls')
      } else {
        $scope.list = list
        // getWebentities()
      }
    }

    // Get web entities (including start pages)
    function getWebentities(opt){
      
      // Options
      opt = opt || {}
      // opt.skip_when_start_pages_exist
      // opt.list

      $scope.status = {message:'Loading Web Entities'}

      var queriesBatcher = new QueriesBatcher()
        , listToQuery = opt.list || $scope.list
      $scope.queriesBatches.push(queriesBatcher)

      if(opt.skip_when_start_pages_exist){
        listToQuery = listToQuery.filter(function(obj){
          return obj.webentity.startpages === undefined
        })
      }

      listToQuery.forEach(function(obj){
        // Stack the query
        queriesBatcher.addQuery(
            api.getWebentities                    // Query call
            ,{                                    // Query settings
                id_list:[obj.webentity.id]
              }
            ,function(we_list){                   // Success callback
                if(we_list.length > 0){
                  obj_setStatus(obj, 'loaded')
                  obj.webentity = we_list[0]
                  
                  // TODO : new behavior to implement
                  // updateStartPageLookups(obj)
                } else {
                  obj_setStatus(obj, 'error')
                  console.log('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', we_list, 'status:', status)
                }
              }
            ,function(data, status, headers){     // Fail callback
                obj_setStatus(obj, 'error')
                console.log('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', data, 'status:', status)
                if(data && data[0] && data[0].code == 'fail'){
                  obj.infoMessage = data[0].message
                }
              }
            ,{                                    // Options
                label: obj.webentity.id
                ,before: function(){
                    obj_setStatus(obj, 'pending')
                  }
              }
          )
      })

      queriesBatcher.atEachFetch(function(list,pending,success,fail){
        var summary = {
          total: list.length + pending.length + success.length + fail.length
          ,pending: pending.length
          ,loaded: success.length + fail.length
        }
        ,percent = Math.round((summary.loaded / summary.total) * 100)
        ,percent_pending = Math.round((summary.pending / summary.total) * 100)
        ,msg = percent + '% loaded'
        $scope.status = {message: msg, progress:percent, progressPending:percent_pending}
      })

      queriesBatcher.atFinalization(function(list,pending,success,fail){
        // Status message
        $scope.status = {}
      })

      queriesBatcher.run()
    }

    function obj_setStatus(obj, status){
      switch(obj.status){
        case('warning'):
          $scope.httpStatusWarning--
          break
        case('error'):
          $scope.httpStatusWarning--
          break
        case('loaded'):
          switch(obj.startpagesSummary.status){
            case('success'):
              $scope.httpStatusSuccess--
              break
            case('warning'):
              $scope.httpStatusWarning--
              break
            default:
              $scope.httpStatusLoading--
          }
          break
        default:
          $scope.httpStatusLoading--
      }

      obj.status = status

      switch(status){
        case('warning'):
          $scope.httpStatusWarning++
          break
        case('error'):
          $scope.httpStatusWarning++
          break
        case('loaded'):
          switch(obj.startpagesSummary.status){
            case('success'):
              $scope.httpStatusSuccess++
              break
            case('warning'):
              $scope.httpStatusWarning++
              break
            default:
              $scope.httpStatusLoading++
          }
          break
        default:
          $scope.httpStatusLoading++
      }
    }



  }])
