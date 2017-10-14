'use strict';

angular.module('hyphe.hypheCurrentActivityComponent', [])
 
.directive('hypheCurrentActivity', function(
    $timeout
  ){
    return {
      restrict: 'E',
      scope: {
        status: '='
      },
      templateUrl: 'components/hypheCurrentActivity.html',
      link: function($scope, el, attrs) {

      }
    }
  })
