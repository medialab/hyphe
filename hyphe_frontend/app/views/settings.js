'use strict';

angular.module('hyphe.settingsController', [])

  .controller('settings', ['$scope', 'api', 'utils', '$location', 'corpus'
  ,function($scope, api, utils, $location, corpus) {
    $scope.currentPage = 'settings'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.options = {}
    $scope.loading = true

    $scope.destroy = function(){
      if (confirm('Are you sure you want to PERMANENTLY destroy this corpus?')) {
        api.destroyCorpus({
          id:corpus.getId()
        }, function(){
          $location.path('/')
        }, function(){
          $scope.status = {message: "Error destroying project", background:'danger'}
        })
      }
    }

    $scope.resetCorpus = function(){
      if (confirm('Are you sure you want to reset this corpus?')) {
        api.resetCorpus({
          id:corpus.getId()
        }, function(){
          $location.path('/overview')
        }, function(){
          $scope.status = {message: "Error resetting project", background:'danger'}
        })
      }
    }

    init()

    function init(){
      $scope.status = {message: "Loading"}
      api.getCorpusOptions({
          id: corpus.getId()
        }, function(options){

          console.log('options', options)
          $scope.options = options
          $scope.loading = false
          $scope.status = {}

        },function(data, status, headers, config){
          
          $scope.status = {message: "Error while getting options", background:'danger'}

        })
    }

  }])