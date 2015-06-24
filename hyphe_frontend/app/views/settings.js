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
          $location.path('/project/'+$scope.corpusId+'/')
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
          $location.path('/project/'+$scope.corpusId+'/overview')
        }, function(){
          $scope.status = {message: "Error resetting project", background:'danger'}
        })
      }
    }

    init()

    function init(){
      $scope.status = {message: "Loading"}
      api.globalStatus({
        }, function(corpus_status){

          console.log('status', corpus_status)
          $scope.options = corpus_status.corpus.options
          $scope.creationrules = corpus_status.corpus.creation_rules.map(function(rule){
            return {
               domain: utils.LRU_to_URL(rule.prefix).replace(/^https?:\/\//, '') || "DEFAULT RULE"
              ,type: rule.name
              ,https: rule.prefix.indexOf('s:https') == 0
            }
          })
          $scope.loading = false
          $scope.status = {}

        },function(data, status, headers, config){
          
          $scope.status = {message: "Error while getting options", background:'danger'}

        })
    }

  }])
