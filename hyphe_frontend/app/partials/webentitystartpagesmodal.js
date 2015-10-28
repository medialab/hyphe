'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope,  api,  utils, QueriesBatcher, $timeout, $modalInstance, webentity, lookups, lookupEngine) {

    $scope.lookups = lookups
    $scope.webentity = webentity
    $scope.startpagesSummary = {
        stage: 'loading'
      , percent: 0
      , diagnostic: {}
    }
    $scope.startpages = (webentity.startpages || [])

    $scope.collapseProgressBar = false  // used to create a delay

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

    // Init
    lookupEngine.doLookups($scope.lookups, $scope.startpages)


    // Functions

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