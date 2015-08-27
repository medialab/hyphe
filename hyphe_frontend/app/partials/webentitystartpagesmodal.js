'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope,  api,  utils, QueriesBatcher, webentity, lookups) {
    
    $scope.lookups = lookups
    $scope.webentity = webentity
    $scope.startpages = webentity.startpages
      .map(function(url){
          return {
            url:url
          , status: (lookups[url] === undefined) ? ('loading') : ('loaded')
          }
        })

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

      startpage.status = 'loading'
      
      return {
        url: startpage.url
      , startpage: startpage
      , status: 'loading'
      }

    }

    function lookup_notifySuccessful(lookup, httpStatus){

      lookup.startpage.status = 'loaded'
      
      lookup.status = (+httpStatus == 200) ? ('success') : ('issue')
      lookup.httpStatus = httpStatus
    }

    function lookup_notifyFail(lookup){

      lookup.startpage.status = 'loaded'
      
      lookup.status = 'fail'
      lookup.httpStatus = undefined
    }


    // Start page lifecycle

    function startpage_setStatus(startpage, status){
      // startpages
    }


  })