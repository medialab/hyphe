'use strict';

angular.module('hyphe.webentityController', [])

  .controller('webentity', ['$scope', 'api', 'utils', 'corpus', '$routeParams'
  ,function($scope, api, utils, corpus, $routeParams) {
    $scope.currentPage = 'webentity'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.explorerActive = false
    
    $scope.webentity = {id:$routeParams.webentityId, loading:true}

    // Init
    fetchWebentity($routeParams.webentityId)

    // Functions
    function fetchWebentity(id){
      api.getWebentities({
          id_list:[id]
          ,crawledOnly: false
        }
        ,function(result){
          $scope.webentity = result[0]
          $scope.webentity.loading = false
          console.log('web entity', $scope.webentity)
        }
        ,function(){
          $scope.status = {message: 'Error loading web entity', background: 'danger'}
          $scope.webentity.loading = false
        }
      )
    }
  }])

  .controller('webentity.summary', ['$scope', 'api', 'utils'
  ,function($scope, api, utils) {

  }])

  .controller('webentity.explorer', ['$scope', 'api', 'utils'
  ,function($scope, api, utils) {
    $scope.loading = true

    $scope.pages

    // Init
    loadPages()

    // Functions
    function loadPages(){
      api.getPages({
          webentityId:$scope.webentity.id
        }
        ,function(result){
          $scope.pages = result
          $scope.loading = false
          buildExplorerTree()
        }
        ,function(){
          $scope.status = {message: 'Error loading pages', background: 'danger'}
          $scope.loading = false
        }
      )
    }

    function buildExplorerTree(){
      console.log('build')
    }
    

  }])