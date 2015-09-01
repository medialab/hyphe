'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope,  api,  utils, QueriesBatcher, webentity, lookups) {
    
    var spStatusIndex = {}

    $scope.lookups = lookups
    $scope.webentity = webentity
    $scope.startpagesSummary = spSummary_init()
    $scope.startpages = (webentity.startpages || []).map(startpage_init)

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
                  lookup_notifySuccessful($scope.lookups[sp.url], httpStatus)
                }
              ,function(data, status, headers){     // Fail callback
                  lookup_notifyFail($scope.lookups[sp.url])
                }
              ,{                                    // Options
                  label: 'lookup '+sp.url
                  ,before: function(){
                      $scope.lookups[sp.url] = init_lookup(sp)
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

    // Lookups lifecycle

    function init_lookup(startpage){

      startpage_setStatus(startpage, 'loading')
      
      return {
        url: startpage.url
      , startpage: startpage
      , status: 'loading'
      }

    }

    function lookup_notifySuccessful(lookup, httpStatus){

      startpage_setStatus(lookup.startpage, 'loaded')
      
      lookup.status = (+httpStatus == 200) ? ('success') : ('issue')
      lookup.httpStatus = httpStatus
    }

    function lookup_notifyFail(lookup){

      startpage_setStatus(lookup.startpage, 'loaded')
      
      lookup.status = 'fail'
      lookup.httpStatus = undefined
    }


    // Start page lifecycle

    function startpage_init(url){
      var status = (lookups[url] === undefined) ? ('loading') : ('loaded')
      spStatusIndex_increment(status)
      return {
          url: url
        , status: status
        }
    }

    function startpage_setStatus(startpage, status){
      spStatusIndex_switch(startpage.status, status)
      startpage.status = status
    }

    function spStatusIndex_increment(status){
      spStatusIndex[status] = (spStatusIndex[status] || 0) + 1
      SpSummary_update()
    }

    function spStatusIndex_switch(oldStatus, newStatus){
      spStatusIndex[oldStatus]--
      spStatusIndex_increment(newStatus)
      SpSummary_update()
    }


    // Start pages summary lifecycle
    
    function spSummary_init(){
      return {
        stage: 'loading'
      , percent: 0
      }
    }

    function SpSummary_update(){
      console.log("Sp Summary", JSON.stringify(spStatusIndex))
      var loading = false
        , loading_count = 0
        , total = 0
      
      for (var status in spStatusIndex) {

        var count = spStatusIndex[status]
        total += count

        if(status == 'loading' && count > 0){
          loading_count += count
        }

        if(status != 'loaded' && count > 0){
          loading = true
        }

      }

      if (loading) {
        $scope.startpagesSummary.stage = 'loading'
        $scope.startpagesSummary.percent = Math.round( 100 * (total - loading_count) / total )

      } else {
        $scope.startpagesSummary.stage = 'loaded'
        delete $scope.startpagesSummary.percent
      }

    }


  })