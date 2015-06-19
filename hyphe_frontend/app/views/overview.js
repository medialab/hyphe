'use strict';

angular.module('hyphe.overviewController', [])

  .controller('Overview', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'overview'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.corpusStatus

    // Init
    loadStatus()

    // Functions
    function loadStatus(){
      $scope.status = {message: 'Refreshing'}
      api.globalStatus({}, function(status){
        $scope.status = {message: ''}
        if (status.corpus.memory_structure.job_running == "Diagnosing"){
          status.corpus.memory_structure.job_running = ""
        }
        $scope.corpusStatus = status
        console.log('corpus status', status)
        setTimeout(loadStatus, 2500)
      },function(data, status, headers, config){
        $scope.status = {message: 'Error loading status', background:'danger'}
      })
    }
  }])
