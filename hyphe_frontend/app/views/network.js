'use strict';

angular.module('hyphe.networkController', ['angular-md5'])

  .controller('network',
  function(
    $scope,
    api,
    utils,
    md5,
    corpus,
    config,
    $window,
  ) {
    $scope.currentPage = 'network'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()
    $scope.headerCustomColor = config.get('headerCustomColor') || '#328dc7';
  })
