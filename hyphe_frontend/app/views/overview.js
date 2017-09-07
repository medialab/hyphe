'use strict';

angular.module('hyphe.overviewController', [])

  .controller('Overview', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'overview'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.corpusStatus
    $scope.loadingStatus = false

    // Init
    loadStatus()
    $scope.loop = setInterval(loadStatus, 1000)
    $scope.$on('$destroy', function(){ clearInterval($scope.loop) })

    // Functions
    function loadStatus(){
      if ($scope.loadingStatus) return;
      $scope.loadingStatus = true
      api.globalStatus({}, function(status){
        $scope.loadingStatus = false
        if (status.corpus.traph.job_running == "Diagnosing"){
          status.corpus.traph.job_running = ""
        }
        $scope.corpusStatus = status
      },function(data, status, headers, config){
        $scope.loadingStatus = false
        $scope.status = {message: 'Error loading status', background:'danger'}
      })
    }
  }])
