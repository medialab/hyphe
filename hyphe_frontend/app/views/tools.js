'use strict';

angular.module('hyphe.toolsController', ['ngSanitize'])

  .controller('tools', function(
    $scope,
    $timeout,
    corpus,
    $location,
    config
  ) {
    $scope.currentPage = 'tools'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.goTo = function(url){
      $location.path(url)
    }
  })
