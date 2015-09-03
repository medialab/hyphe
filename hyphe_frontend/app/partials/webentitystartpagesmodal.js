'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope,  api,  utils, QueriesBatcher, $timeout, $modalInstance, webentity, lookups) {
    
    var lookupEngine = getLookupEngine()

    $scope.lookups = lookups
    $scope.webentity = webentity
    $scope.startpagesSummary = {
        stage: 'loading'
      , percent: 0
      , diagnostic: {}
    }
    $scope.startpages = (webentity.startpages || [])

    $scope.collapseProgressBar = false  // used to create a delay

    var timeout = 20
    $scope.queriesBatches = []

    $scope.ok = function () {
      var feedback = {

      }

      $modalInstance.close(feedback)
    }

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel')
    }

    $scope.$watch('lookups', function(newValue, oldValue) {
      $timeout(function(){
        updateStartpagesSummary()
      }, 0)
    }, true)

    doLookups()

    // functions

    function doLookups(){

      var unlooked = $scope.startpages
        .filter(function(url){return $scope.lookups[url] === undefined })

      if(unlooked.length > 0){
        var lookupQB = new QueriesBatcher()
        $scope.queriesBatches.push(lookupQB)
        unlooked.forEach(function(url){
          lookupQB.addQuery(
              api.urlLookup                         // Query call
              ,{                                    // Query settings
                  url: url
                  ,timeout: timeout
                }
              ,function(httpStatus){                // Success callback

                  lookupEngine.notifySuccessful($scope.lookups[url], httpStatus)

                }
              ,function(data, status, headers){     // Fail callback

                  lookupEngine.notifyFail($scope.lookups[url])

                }
              ,{                                    // Options
                  label: 'lookup '+url
                  ,before: function(){
                      $scope.lookups[url] = lookupEngine.initLookup(url)
                    }
                  ,simultaneousQueries: 3
                }
            )
        })

        lookupQB.atFinalization(function(list,pending,success,fail){
          // doLookups()
        })

        lookupQB.run()
      }
    }

    // Lookup Engine
    function getLookupEngine(){

      var ns = {}

      ns.initLookup = function(url){

        return {
          url: url
        , status: 'loading'
        }

      }

      ns.notifySuccessful = function(lookup, httpStatus){

        lookup.status = (+httpStatus == 200) ? ('success') : ('issue')
        lookup.httpStatus = httpStatus
        
      }

      ns.notifyFail = function(lookup){
        
        lookup.status = 'fail'
        lookup.httpStatus = undefined

      }

      return ns;
    }

    function updateStartpagesSummary(){
      
      var loading = false
        , loading_count = 0
        , total = 0
        , statusIndex = {}

      // build status index
      $scope.startpages.forEach(function(url){
        var status = ($scope.lookups[url] || {status:'loading'}).status
          , value = statusIndex[status] || 0

        statusIndex[status] = value + 1
      })
      
      // check if globally loading
      for (var status in statusIndex) {

        var count = statusIndex[status]
        total += count

        if(status == 'loading' && count > 0){
          loading_count += count
          loading = true
        }
      }

      if (loading) {
        $scope.startpagesSummary.stage = 'loading'
        $scope.startpagesSummary.percent = Math.round( 100 * (total - loading_count) / total )

        // Diagnostic
        $scope.startpagesSummary.diagnostic = {}

      } else {
        $scope.startpagesSummary.stage = 'loaded'
        $scope.startpagesSummary.percent = 100

        // Diagnostic
        $scope.startpagesSummary.diagnostic = {
          ready: ( statusIndex['success'] || 0 ) > 0
        , doomed: ( statusIndex['success'] || 0 ) == 0
        , issues: ( statusIndex['issue'] || 0 ) + ( statusIndex['fail'] || 0 ) > 0
        }

        // Delayed collapse of the progress bar
        $timeout(function(){
          $scope.collapseProgressBar = true
        }, 500)
      }

    }


  })