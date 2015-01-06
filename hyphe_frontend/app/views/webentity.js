'use strict';

angular.module('hyphe.webentityController', [])

  .controller('webentity', ['$scope', 'api', 'utils', 'corpus', '$routeParams'
  ,function($scope, api, utils, corpus, $routeParams) {
    $scope.currentPage = 'webentity'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()
    
    $scope.webentity = {id:$routeParams.webentityId, loading:true}

    // Init
    fetchWebentity($routeParams.webentityId)

    // Functions
    function fetchWebentity(id){
      api.getWebentities({
        id_list:[id]
      }
      ,function(result){
        $scope.webentity = result[0]
        $scope.webentity.loading = false
        console.log('web entity', $scope.webentity)
      }
      ,function(){
        $scope.list = []
        $scope.status = {message: 'Error loading web entity', background: 'danger'}
        $scope.loading = false
      }
      )
    }
  }])

  .controller('webentity.summary', ['$scope', 'api', 'utils'
  ,function($scope, api, utils) {
    
  }])