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
      console.log('loadStatistics...')
      $scope.loadingStatistics = true
      api.corpusStatistics({}, function(data){
        console.log('...oui')
        $scope.loadingStatistics = false
        $scope.corpusStatistics = data
        console.log('statistics', data)
      },function(data, status, headers, config){
        console.log('...non')
        $scope.loadingStatistics = false
        $scope.status = {message: 'Error loading statistics', background:'danger'}
      })
    }

  }])
