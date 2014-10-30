'use strict';

angular.module('hyphe.login2Controller', [])

  .controller('Login2', ['$scope', 'api', 'utils', '$location', 'corpus'
  ,function($scope, api, utils, $location, corpus) {
    $scope.currentPage = 'login'

    $scope.corpusList
    $scope.corpusList_byId = {}
    $scope.globalStatus

    $scope.startCorpus = function(id, password){
      if(password){
        startCorpus(id, prompt("Password?"," "))
      } else {
        startCorpus(id, '')
      }
    }

    $scope.stopCorpus = function(id){
      stopCorpus(id)
    }

    $scope.openCorpus = function(id, name){
      openCorpus(id, name)
    }

    $scope.destroyCorpus = function(id){
      destroyCorpus(id)
    }

    $scope.resetCorpus = function(id){
      resetCorpus(id)
    }

    // Init
    getStatus()
    loadCorpusList()

    function loadCorpusList(){
      api.getCorpusList({}, function(list){
        $scope.corpusList = []
        for(var id in list){
          $scope.corpusList.push(list[id])
        }
        $scope.corpusList_byId = list
        $scope.corpusList.sort(function(a,b){
          if (a.name > b.name) {
            return 1;
          }
          if (a.name < b.name) {
            return -1;
          }
          // a must be equal to b
          return 0;
        })
        console.log('list',list)

      },function(data, status, headers, config){
        $scope.corpusList = ''
        console.log('Error loading corpus list')
      })
    }

    function openCorpus(id, name){
      // Ping until corpus started
      api.pingCorpus({
        id: id
        ,timeout: 10
      },function(data){

        $scope.starting = false
        corpus.setId(id)
        corpus.setName(name)
        $location.path('/overview')
      
      }, function(){

        $scope.starting = false
        $scope.new_project_message = 'Error starting corpus'

      })
      
    }

    function startCorpus(id, password){
      api.startCorpus({
        id: id
        ,password: password
      }, function(){

        loadCorpusList()
        // openCorpus($scope.corpus.corpus_id, $scope.corpus.name)

      },function(data, status, headers, config){
        alert('Error: possibly a wrong password')
      })
    }

    function stopCorpus(id){
      api.stopCorpus({
        id: id
      }, function(){

        loadCorpusList()

      },function(data, status, headers, config){
        alert('Error')
      })
    }
    
    function destroyCorpus(id){
      api.destroyCorpus({
        id: id
      }, function(){

        loadCorpusList()

      },function(data, status, headers, config){
        alert('Error')
      })
    }

    function resetCorpus(id){
      api.resetCorpus({
        id: id
      }, function(){

        loadCorpusList()

      },function(data, status, headers, config){
        alert('Error')
      })
    }

    function getStatus(){
      
      api.globalStatus({},function(status){

        console.log('Global Status', status.hyphe)
        $scope.globalStatus = status.hyphe
        
      }, function(){

      })
      
    }



  }])