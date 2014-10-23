'use strict';

angular.module('hyphe.prospectController', [])

  .controller('prospect', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'prospect'
    $scope.corpusName = corpus.getName()

    // Init
    
    // Functions
    
  }])