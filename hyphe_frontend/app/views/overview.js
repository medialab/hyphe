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
      api.globalStatus({}, function(status){
        $scope.corpusStatus = status
        console.log('corpus status', status)
      },function(data, status, headers, config){
        $scope.status = {message: 'Error loading status', background:'danger'}
      })
    }
  }])