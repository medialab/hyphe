'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope,  api,  utils, QueriesBatcher, $timeout, $modalInstance, webentity, lookups) {
    
    var lookupEngine = getLookupEngine()
    var startpageEngine = getStartpageEngine()

    $scope.lookups = lookups
    $scope.webentity = webentity
    $scope.startpagesSummary = spSummary_init()
    $scope.startpages = (webentity.startpages || []).map(startpageEngine.initStartpage)

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

    doLookups()

    // functions

    function doLookups(){

      var unlooked = $scope.startpages
        .filter(function(sp){return $scope.lookups[sp.url] === undefined })

      if(unlooked.length > 0){
        var lookupQB = new QueriesBatcher()
        $scope.queriesBatches.push(lookupQB)
        unlooked.forEach(function(sp){
          lookupQB.addQuery(
              api.urlLookup                         // Query call
              ,{                                    // Query settings
                  url: sp.url
                  ,timeout: timeout
                }
              ,function(httpStatus){                // Success callback
                  lookupEngine.notifySuccessful($scope.lookups[sp.url], httpStatus)
                }
              ,function(data, status, headers){     // Fail callback
                  lookupEngine.notifyFail($scope.lookups[sp.url])
                }
              ,{                                    // Options
                  label: 'lookup '+sp.url
                  ,before: function(){
                      $scope.lookups[sp.url] = lookupEngine.initLookup(sp)
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

      ns.initLookup = function(startpage){

        startpageEngine.setStatus(startpage, 'loading')
        
        return {
          url: startpage.url
        , startpage: startpage
        , status: 'loading'
        }

      }

      ns.notifySuccessful = function(lookup, httpStatus){

        lookup.status = (+httpStatus == 200) ? ('success') : ('issue')
        lookup.httpStatus = httpStatus

        startpageEngine.setStatus(lookup.startpage, lookup.status)
        
      }

      ns.notifyFail = function(lookup){
        
        lookup.status = 'fail'
        lookup.httpStatus = undefined

        startpageEngine.setStatus(lookup.startpage, lookup.status)
      }

      return ns;
    }

    // Startpage Engine
    function getStartpageEngine(){
      
      var ns = {}

      ns.spStatusIndex = {}

      ns.initStartpage = function(url){
        var status = ($scope.lookups[url]) ? ($scope.lookups[url].status) : ('loading')
        ns.spStatusIndex_increment(status)
        return {
            url: url
          , status: status
          }
      }

      ns.setStatus = function(startpage, status){
        ns.spStatusIndex_switch(startpage.status, status)
        startpage.status = status
      }

      ns.spStatusIndex_increment = function(status){
        ns.spStatusIndex[status] = (ns.spStatusIndex[status] || 0) + 1
        SpSummary_update()
      }

      ns.spStatusIndex_switch = function(oldStatus, newStatus){
        ns.spStatusIndex[oldStatus]--
        ns.spStatusIndex_increment(newStatus)
        SpSummary_update()
      }

      return ns

    }

    


    // Start pages summary lifecycle
    
    function spSummary_init(){
      return {
        stage: 'loading'
      , percent: 0
      , diagnostic: {}
      }
    }

    function SpSummary_update(){
      
      var loading = false
        , loading_count = 0
        , total = 0
      
      for (var status in startpageEngine.spStatusIndex) {

        var count = startpageEngine.spStatusIndex[status]
        total += count

        if(status == 'loading' && count > 0){
          loading_count += count
          loading = true
        }

      }

      if (loading) {
        $scope.startpagesSummary.stage = 'loading'
        $scope.startpagesSummary.percent = Math.round( 100 * (total - loading_count) / total )

      } else {
        $scope.startpagesSummary.stage = 'loaded'
        $scope.startpagesSummary.percent = 100

        SpDiagnostic()

        // Delayed collapse of the progress bar
        $timeout(function(){
          $scope.collapseProgressBar = true
        }, 500)
      }

    }

    function SpDiagnostic(){
      $scope.startpagesSummary.diagnostic = {
        ready: ( startpageEngine.spStatusIndex['success'] || 0 ) > 0
      , doomed: ( startpageEngine.spStatusIndex['success'] || 0 ) == 0
      , issues: ( startpageEngine.spStatusIndex['issue'] || 0 ) + ( startpageEngine.spStatusIndex['fail'] || 0 ) > 0
      }
    }

  })