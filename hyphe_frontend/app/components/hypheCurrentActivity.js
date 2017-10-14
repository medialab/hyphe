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
        
        $scope.$watch('status', redraw)
        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          redrawCrawledPages()
          // TODO: other charts
        }

        function redrawCrawledPages() {
          
        }
      }
    }
  })
