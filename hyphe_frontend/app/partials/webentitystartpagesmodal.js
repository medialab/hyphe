'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope,  api,  utils, QueriesBatcher, $timeout, $modal, $modalInstance, webentity, lookups, lookupEngine, updaters) {
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
      $modalInstance.close()
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
        $scope.startpages = $scope.startpages.filter(function(u){
          return u != url;
        })
        updaters.webentityRemoveStartPage(webentity.id, url)
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
          // Note: cannot access global status bar from modal
          console.error('Start page could not be removed', data, status, headers, config)
          $scope.removed[url] = false
        }
      )
    }

    function addStartPageAndUpdate(webentity, url){
      if (webentity.startpages.indexOf(url) < 0) {
        _addStartPage(webentity, url, function () {
          if ($scope.startpages.indexOf(url) < 0) {
            $scope.startpages.push(url)
          }
        })
        updaters.webentityAddStartPage(webentity.id, url)
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
          // Note: cannot access global status bar from modal
          console.error('Start page could not be added', data, status, headers, config)
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
          // Note: cannot access global status bar from modal
          console.error('Could not get web entity for url '+url, data, status, headers, config)
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
              return webentity
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
                webentityId: webentity.id
                ,lru: prefixes
              }
              ,function(){                          // Success callback
                addStartPageAndUpdate(webentity, url)
              }
              ,function(data, status, headers){     // Fail callback
                // Note: cannot access global status bar from modal
                console.error('Prefix could not be added', data, status, headers, config)
              })

          } else if (feedback.task.type == 'merge') {
            
            // Merge web entities
            api.webentityMergeInto({
                oldWebentityId: webentity.id
                ,goodWebentityId: feedback.task.webentity.id
                ,mergeNameAndStatus: true
              }
              ,function(data){
                // Remove current entity and add the other one
                updaters.mergeWebentities(webentity, feedback.task.webentity)
                $modalInstance.close()
              }
              ,function(data, status, headers, config){
                // Note: cannot access global status bar from modal
                console.error('Merge failed', data, status, headers, config)
              }
            )

          }
        }
      }, function () {
        // On dismiss: nothing happens
      })
    }

    /* (Sub-)Modal controller */
    function startPageModalCtrl($scope, $modalInstance, url, webentity) {
      $scope.url = url
      $scope.webentity = webentity
      $scope.wwwVariations = true
      $scope.httpsVariations = true

      // Bootstrapping the object for the Prefix Slider
      var obj = {}
      obj.url = utils.URL_fix(url)
      obj.lru = utils.URL_to_LRU(utils.URL_stripLastSlash(obj.url))
      obj.tld = utils.LRU_getTLD(obj.lru)
      obj.tldLength = obj.tld !== "" ? obj.tld.split('.').length : 0
      obj.json_lru = utils.URL_to_JSON_LRU(utils.URL_stripLastSlash(obj.url))
      obj.pretty_lru = utils.URL_to_pretty_LRU(utils.URL_stripLastSlash(obj.url))
        .map(function(stem){
            var maxLength = 12
            if(stem.length > maxLength+3){
              return stem.substr(0,maxLength) + '...'
            }
            return stem
          })
      obj.prefixLength = !!obj.tldLength + 2 + !!obj.json_lru.port
      obj.truePrefixLength = obj.prefixLength - 1 + obj.tldLength
      obj.conflicts = []
      // obj_setStatus(obj, 'loading')
      $scope.obj = obj

      // Load parent web entities
      api.getLruParentWebentities({
            lru: $scope.obj.lru
          }
          ,function(we_list){
            $scope.obj.parentWebEntities = we_list
            $scope.obj.status = 'loaded'
          }
          ,function(data, status, headers, config){
            $scope.obj.status = 'error'
            $scope.obj.errorMessage = 'Oops... The server query failed'
          }
        )

      $scope.ok = function () {
        var feedback = {
          task:$scope.obj.task
          ,prefix: utils.LRU_truncate($scope.obj.lru, $scope.obj.truePrefixLength)
          ,wwwVariations: $scope.wwwVariations
          ,httpsVariations: $scope.httpsVariations
        }
        $modalInstance.close(feedback);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }

  })