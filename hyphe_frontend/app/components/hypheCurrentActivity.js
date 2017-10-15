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
        var statusListSize = 10

        $scope.statusList = []
        $scope.isCrawling = false

        $scope.$watch('status', function(newStatus, oldStatus){
          var crawledPagesBefore = 0
          var crawledPagesAfter = 0
          if (oldStatus && oldStatus.crawler && oldStatus.crawler.pages_crawled) {
            crawledPagesBefore = oldStatus.crawler.pages_crawled
          }
          if (newStatus && newStatus.crawler && newStatus.crawler.pages_crawled) {
            crawledPagesAfter = newStatus.crawler.pages_crawled
          }
          $scope.isCrawling = crawledPagesAfter > crawledPagesBefore
        })
        
      }
    }
  })

.directive('hcaCrawledPagesChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
      scope: {
        statusList: '='
      },
      link: function($scope, el, attrs) {
        
        $scope.$watch('status', update)
        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
        }

        function update() {
        }
      }
    }
  })
