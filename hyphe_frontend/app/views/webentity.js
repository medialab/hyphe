'use strict';

angular.module('hyphe.webentityController', [])

  .controller('webentity', ['$scope', 'api', 'utils', 'corpus', '$routeParams'
  ,function($scope, api, utils, corpus, $routeParams) {
    $scope.currentPage = 'webentity'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()
    
    $scope.webentity = {id:$routeParams.webentityId, title:$routeParams.webentityId}

    // Init

    // Functions
  }])