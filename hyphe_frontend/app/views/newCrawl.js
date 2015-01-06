'use strict';

angular.module('hyphe.newcrawlController', [])

  .controller('NewCrawl', ['$scope', 'api', 'corpus'
  ,function($scope, api, corpus) {
    $scope.currentPage = 'newCrawl'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()
  }])