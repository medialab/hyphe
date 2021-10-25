'use strict';

angular.module('hyphe.startpageCheckerComponent', [])
 
  .directive('hypheStartpageChecker', ['utils', 'api', function(utils, api){
    return {
      restrict: 'E'
      ,templateUrl: 'components/startpageChecker.html'
      ,scope: {
        data: '=',
        resolve: '='
      }
      ,link: function($scope, el, attrs) {
        $scope.url = $scope.data.url
        $scope.webentity = $scope.data.webentity
        $scope.minPrefixLength = (($scope.data.minPrefix || "").match(/\|/g) || []).length - 1
        $scope.wwwVariations = true
        $scope.httpsVariations = true

        // Bootstrapping the object for the Prefix Slider
        var obj = {}
        obj.url = utils.URL_fix($scope.url)
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
              if ($scope.data.minPrefix){
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

        $scope.cancel = function () {
          $scope.resolve({
            task: {
              type: 'drop',
              url: $scope.data.url
            }
          })
        }

        $scope.ok = function () {
          $scope.resolve({
            task: $scope.obj.task,
            prefix: utils.LRU_truncate($scope.obj.lru, $scope.obj.truePrefixLength),
            wwwVariations: $scope.wwwVariations,
            httpsVariations: $scope.httpsVariations,
            url: $scope.data.url
          })
        }

      }
    }
  }])
