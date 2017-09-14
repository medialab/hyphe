'use strict';

angular.module('hyphe.webentityStartPagesModalController', [])

  .controller('webentityStartPagesModalController'
  ,function( $scope, api,  utils, QueriesBatcher, $timeout, $mdDialog, webentity, lookups, lookupEngine, updaters) { 

    $scope.closeOpenedDialog  = closeOpenedDialog;
    
    $scope.lookups = lookups
    $scope.webentity = webentity
    $scope.startpagesSummary = {
        stage: 'loading'
      , percent: 0
      , diagnostic: {}
    }
    $scope.startpages = (webentity.startpages || [])
    $scope.urlsToAdd = []
    $scope.urlErrors = []
    $scope.addingErrors = []
    $scope.newStartPagesInvalid = false
    $scope.newStartPagesURLs = ''
    $scope.removed = {}

    $scope.collapseProgressBar = false  // used to create a delay

    $scope.ok = function () {
      $modalInstance.close()
    }

    $scope.validateNewStartPages = function(){
      $scope.urlsToAdd = []
      $scope.urlErrors = []
      $scope.addingErrors = []
      $scope.newStartPagesInvalid = false
      $scope.newStartPagesURLs.split(/[\s\n\r\t]+/).forEach(function(url){
        if (!url) return
        if (~$scope.startpages.indexOf(url) || ~$scope.urlsToAdd.indexOf(url)) {
          $scope.newStartPagesInvalid = true
          $scope.urlErrors.push(url + " (duplicate)")
        } else if (!utils.URL_validate(url)){
          $scope.newStartPagesInvalid = true
          $scope.urlErrors.push(url)
        } else {
          $scope.urlsToAdd.push(url)
        }
      })
    }

    // Add a start page
    $scope.addStartPages = function() {
      if (!$scope.urlsToAdd.length || $scope.newStartPagesInvalid) {
        return
      }
      var url = $scope.urlsToAdd.shift()
      var processNextStartpage = function () {
        if ($scope.urlsToAdd.length) {
          $scope.addStartPages()
        } else {
          $scope.newStartPagesURLs = $scope.addingErrors.join(' ')
          $scope.validateNewStartPages()
        }
      }
      checkStartpageBelonging(webentity, url, {
        success: function () {
          addStartPageAndUpdate(webentity, url, processNextStartpage)
        },
        otherWebentity: function (prefix) {
          startPageModal(url, webentity, processNextStartpage, prefix)
        },
        queryFail: function () {
          startPageModal(url, webentity, processNextStartpage)
        },
      })
    }

    // Remove a start page
    $scope.removeStartPage = function (url) {
      removeStartPageAndUpdate($scope.webentity, url)
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
        updateStartpagesSummary()
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

    function addStartPageAndUpdate(webentity, url, callback){
      if ((webentity.startpages || []).indexOf(url) < 0) {
        _addStartPage(webentity, url, function () {
          if ($scope.startpages.indexOf(url) < 0) {
            $scope.startpages.push(url)
          }
          updateStartpagesSummary()
          updaters.webentityAddStartPage(webentity.id, url)
          if (callback) {
            callback()
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
          // Note: cannot access global status bar from modal
          console.error('Start page could not be added', data, status, headers, config)
          $scope.urlErrors.push(url + " (" + data[0].message + ")")
        }
      )
    }

    function checkStartpageBelonging(webentity, url, callbacks) {
      api.getCreationRulesResult({
          urlList: [url]
        }
        ,function (data) {
          if (!data[url])
            callbacks.queryFail()
          else if (~webentity.prefixes.indexOf(data[url]))
            callbacks.success()
          else callbacks.otherWebentity(data[url])
        }
        ,function (data, status, headers, config) {
          // API call fail
          callbacks.queryFail()
          // Note: cannot access global status bar from modal
          console.error('Could not get web entity for url '+url, data, status, headers, config)
        }
      )
    }

    function startPageModal(url, webentity, callback, minPrefix) {
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
          ,minPrefix: function(){return minPrefix}
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
                addStartPageAndUpdate(webentity, url, callback)
              }
              ,function(data, status, headers, config){     // Fail callback
                // Note: cannot access global status bar from modal
                console.error('Prefix could not be added', data, status, headers, config)
                $scope.urlErrors.push(url + " (" + data[0].message + ")")
                $scope.addingErrors.push(url)
                callback()
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
                addStartPageAndUpdate(feedback.task.webentity, url, function(){
                  updaters.mergeWebentities(webentity, feedback.task.webentity)
                })
                $modalInstance.close()
                callback()
              }
              ,function(data, status, headers, config){
                // Note: cannot access global status bar from modal
                console.error('Merge failed', data, status, headers, config)
                $scope.urlErrors.push(url + " (" + data[0].message + ")")
                $scope.addingErrors.push(url)
                callback()
              }
            )
          }
        }
      }, function(){
      // On dismiss: nothing happened, run next new startpage
        $scope.addingErrors.push(url)
        callback()
      })
    }

    /* (Sub-)Modal controller */
    function startPageModalCtrl($scope, $modalInstance, url, webentity, minPrefix) {
      $scope.url = url
      $scope.webentity = webentity
      $scope.minPrefixLength = ((minPrefix || "").match(/\|/g) || []).length - 1
      $scope.wwwVariations = true
      $scope.httpsVariations = true

      // Bootstrapping the object for the Prefix Slider
      var obj = {}
      obj.url = utils.URL_fix(url)
      obj.lru = utils.URL_to_LRU(utils.URL_stripLastSlash(obj.url))
      obj.tld = utils.LRU_getTLD(obj.lru)
      obj.tldLength = obj.tld != ""
      obj.json_lru = utils.URL_to_JSON_LRU(utils.URL_stripLastSlash(obj.url))
      obj.pretty_lru = utils.URL_to_pretty_LRU(utils.URL_stripLastSlash(obj.url))
        .map(function(stem){
            var maxLength = 12
            if(stem.length > maxLength+3){
              return stem.substr(0,maxLength) + '...'
            }
            return stem
          })
      obj.prefixLength = Math.max($scope.minPrefixLength + 1, !!obj.tldLength + 2 + !!obj.json_lru.port)
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
            if (minPrefix){
              $scope.obj.parentWebEntities.unshift({
                stems_count: $scope.minPrefixLength + 1
              })
            }
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
