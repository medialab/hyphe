'use strict';

angular.module('hyphe.overviewController', [])

  .controller('Overview', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'overview'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.corpusStatus
    $scope.corpusStatistics
    $scope.loadingStatus = false
    $scope.loadingStatistics = false

    // Init
    loadStatus()
    loadStatistics()
    // $scope.statusLoop = setInterval(loadStatus, 1000)
    $scope.statisticsLoop = setInterval(loadStatistics, 300000)
    $scope.$on('$destroy', function(){
      // clearInterval($scope.statusLoop)
      clearInterval($scope.statisticsLoop)
    })

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

    function loadStatistics() {
      if ($scope.loadingStatistics) return;
      $scope.loadingStatistics = true
      api.corpusStatistics({}, function(data){
        $scope.loadingStatistics = false
        $scope.corpusStatistics = data
        $scope.displayStatistics = data.length > 0 && data[data.length - 1].total > 0
      },function(data, status, headers, config){
        $scope.loadingStatistics = false
        $scope.status = {message: 'Error loading statistics', background:'danger'}
      })
    }

  }])
