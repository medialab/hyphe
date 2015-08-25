'use strict';

angular.module('hyphe.preparecrawlsController', [])

  .controller('PrepareCrawls', ['$scope', 'api', 'store', 'utils', '$location', 'QueriesBatcher', '$modal', 'corpus'
  ,function($scope, api, store, utils, $location, QueriesBatcher, $modal, corpus) {
    $scope.currentPage = 'prepareCrawls'
    $scope.Page.setTitle('Prepare Crawls')
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()


  }])
