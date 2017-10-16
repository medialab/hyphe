'use strict';

angular.module('hyphe.networkController', ['angular-md5'])

  .controller('network',
  function(
    $scope,
    api,
    utils,
    md5,
    corpus,
    $window
  ) {
    $scope.currentPage = 'network'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()
  })
