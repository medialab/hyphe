'use strict';

angular.module('hyphe.overviewController', [])

  .controller('Overview', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'overview'
    $scope.Page.setTitle('Overview')
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.corpusStatus

    // Init
    loadStatus()
    $scope.loop = setInterval(loadStatus, 1000)
    $scope.$on('$destroy', function(){ clearInterval($scope.loop) })

    // Functions
    function loadStatus(){
      api.globalStatus({}, function(status){
        if (status.corpus.memory_structure.job_running == "Diagnosing"){
          status.corpus.memory_structure.job_running = ""
        }
        $scope.corpusStatus = status
      },function(data, status, headers, config){
        $scope.status = {message: 'Error loading status', background:'danger'}
      })
    }
  }])
