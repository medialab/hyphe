'use strict';

angular.module('hyphe.manageTagsController', [])

  .controller('manageTags',
  function(
    $scope,
    api,
    corpus,
    utils,
    $location,
    $timeout
  ) {
    $scope.currentPage = 'manageTags'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()


  })
