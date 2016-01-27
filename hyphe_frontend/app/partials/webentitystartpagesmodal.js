'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope,  api,  utils, QueriesBatcher, $timeout, $modalInstance, webentity, lookups, lookupEngine, parentStatus) {

    $scope.lookups = lookups
    $scope.webentity = webentity
    $scope.startpagesSummary = {
        stage: 'loading'
      , percent: 0
      , diagnostic: {}
    }
    $scope.startpages = (webentity.startpages || [])
    $scope.newStartPageURL = ''
    $scope.removed = {}

    $scope.collapseProgressBar = false  // used to create a delay

    $scope.ok = function () {
      var feedback = {

      }

      $modalInstance.close(feedback)
    }

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel')
    }

    // Add a start page
    $scope.validateStartPageURL = function () {
      var url = $scope.newStartPageURL
      console.log("Add SP "+url)
    }

    // Remove a start page
    $scope.removeStartPage = function(url){
      removeStartPageAndReload($scope.webentity, url)
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

    function removeStartPageAndReload(webentity, url){
      $scope.removed[url] = true
      _removeStartPage(webentity, url, function () {
        // Remove the start page from lists of start pages
        webentity.startpages = webentity.startpages.filter(function(u){
          return u != url;
        })
        $scope.startpages = $scope.startpages.filter(function(u){
          return u != url;
        })
      })
    }

    // This function only performs the API call
    function _removeStartPage(webentity, url, successCallback){
      api.removeStartPage({
          webentityId: webentity.id
          ,url: url
        }
        ,function (data) {
          successCallback(data)
        }
        ,function (data, status, headers, config) {
          // Fail
          // FIXME: display an error message
          $scope.removed[url] = false
        }
      )
    }


  })