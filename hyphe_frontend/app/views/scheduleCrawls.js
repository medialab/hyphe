'use strict';

angular.module('hyphe.schedulecrawlController', [])

  .controller('scheduleCrawls', ['$scope', 'api', 'store', 'utils', 'QueriesBatcher', '$location', 'corpus'
  ,function($scope, api, store, utils, QueriesBatcher, $location, corpus){
    $scope.currentPage = 'scheduleCrawls'
    $scope.Page.setTitle('Schedule Crawls')
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.list = bootstrapList(store.get('webentities_toCrawl'))
    $scope.summary = {pending:0, success:0, error:0}

    // Clean store
    store.remove('webentities_toCrawl')

    if($scope.list.length==0){
      $location.path('/project/'+$scope.corpusId+'/newCrawl')
    }

    var queriesBatcher = new QueriesBatcher()
    
    $scope.list.forEach(function(obj){

      $scope.summary.pending++

      // Stack the query
      queriesBatcher.addQuery(
          api.crawl                             // Query call
          ,{                                    // Query settings
              webentityId: obj.webentity.id
              ,depth: obj.depth || 0
              ,cautious: obj.cautiousCrawl || false
            }
          ,function(data){                      // Success callback
              $scope.summary.pending--
              $scope.summary.success++
              obj.status = 'scheduled'
            }
          ,function(data, status, headers){     // Fail callback
              $scope.summary.pending--
              $scope.summary.error++
              obj.status = 'error'
              obj.errorMessage = data[0].message
            }
          ,{                                    // Options
              label: obj.webentity.id
              ,before: function(){
                  obj.status = 'pending'
                }
              ,simultaneousQueries: 3
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
      ,msg = percent + '% launched'
      $scope.status = {message: msg, progress:percent, progressPending:percent_pending}
    })

    queriesBatcher.atFinalization(function(list,pending,success,fail){
      // Status message
      $scope.status = {}
    })

    queriesBatcher.run()

    function bootstrapList(list){
      list = list || []

      // Clean and set exactly what we need
      return list.map(function(obj, i){
        return {
          id:i
          ,webentity: obj.webentity
          ,depth: obj.depth
          ,status: 'waiting'
        }
      })


    }
  }])