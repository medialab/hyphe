'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope,  api,  utils, QueriesBatcher, $timeout, $modal, $modalInstance, webentity, lookups, lookupEngine, parentStatus) {

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
    $scope.addStartPage = function () {
      var url = $scope.newStartPageURL
      if (utils.URL_validate(url) && url !== '') {
        checkStartpageBelonging(webentity, url, {
          success: function () {
            addStartPageAndUpdate(webentity, url)
          },
          otherWebentity: function () {
            startPageModal(url, webentity)
          },
          noWebentity: function () {
            startPageModal(url, webentity)
          },
          queryFail: function () {
            startPageModal(url, webentity)
          }
        })
      } 
    }

    // Remove a start page
    $scope.removeStartPage = function (url) {
      removeStartPageAndUpdate($scope.webentity, url)
    }

    $scope.startPageValidate = function () {
      var url = $scope.newStartPageURL
      $scope.startPageInvalid = !utils.URL_validate(url) && url != ''
    }

    $scope.$watch('lookups', function (newValue, oldValue) {
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

    function removeStartPageAndUpdate(webentity, url){
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
          $scope.removed[url] = false
        }
        ,function (data, status, headers, config) {
          // API call fail
          // TODO: display an error message
          $scope.removed[url] = false
        }
      )
    }

    function addStartPageAndUpdate(webentity, url){
      console.log('ADD SP & UPDATE')
      if (webentity.startpages.indexOf(url) < 0) {
        _addStartPage(webentity, url, function () {
          webentity.startpages.push(url)
          if ($scope.startpages.indexOf(url) < 0) {
            $scope.startpages.push(url)
          }
        })
      }
    }

    // This function only performs the API call
    function _addStartPage(webentity, url, successCallback){
      api.addStartPage({
          webentityId: webentity.id
          ,url: url
        }
        ,function (data) {
          successCallback(data)
        }
        ,function (data, status, headers, config) {
          // API call fail
          // TODO: error message
        }
      )
    }

    function checkStartpageBelonging(webentity, url, callbacks) {
      api.getWebentity({
          url: url
        }
        ,function (data) {
          if (data[0] && data[0].code === 'fail') {
            callbacks.noWebentity()
          } else if (data.id) {
            if (data.id == webentity.id) {
              callbacks.success()
            } else {
              callbacks.otherWebentity()
            }
          }
        }
        ,function (data, status, headers, config) {
          // API call fail
          callbacks.queryFail()
        }
      )
    }

    function startPageModal(url, webentity) {
      /* Instanciate and open the Modal */
      var modalInstance = $modal.open({
        templateUrl: 'partials/startpagemodal.html'
        ,size: 'lg'
        ,controller: startPageModalCtrl
        ,resolve: {
          url: function () {
              return url
            }
          ,webentity: function () {
              return obj.webentity
            }
        }
      })

      modalInstance.result.then(function (feedback) {
        // On 'OK'
        if(feedback.task){
          if(feedback.task.type == 'addPrefix'){
            
            // Add Prefix
            var prefix = feedback.prefix
            ,wwwVariations = feedback.wwwVariations
            ,httpsVariations = feedback.httpsVariations
            ,prefixes = utils.LRU_variations(prefix, {
                wwwlessVariations: wwwVariations
                ,wwwVariations: wwwVariations
                ,httpVariations: httpsVariations
                ,httpsVariations: httpsVariations
                ,smallerVariations: false
              })
            
            // Query call
            api.addPrefix({                         // Query settings
                webentityId: obj.webentity.id
                ,lru: prefixes
              }
              ,function(){                          // Success callback
                addStartPageAndReload(obj.id, url)
              }
              ,function(data, status, headers){     // Fail callback
                $scope.status = {message:'Prefix could not be added', background:'danger'}
              })

          } else if(feedback.task.type == 'merge'){
            
            // Merge web entities
            var webentity = feedback.task.webentity
            $scope.status = {message:'Merging web entities'}
            obj_setStatus(obj, 'merging')
            api.webentityMergeInto({
                oldWebentityId: webentity.id
                ,goodWebentityId: obj.webentity.id
                ,mergeNameAndStatus: true
              }
              ,function(data){
                // If it is in the list, remove it...
                purgeWebentityFromList(webentity)

                addStartPageAndReload(obj.id, url)
              }
              ,function(data, status, headers, config){
                $scope.status = {message:'Merge failed', background:'danger'}
              }
            )

          }
        }
      }, function () {
        // On dismiss: nothing happens
      })
    }

  })