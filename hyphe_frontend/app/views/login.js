'use strict';

angular.module('hyphe.loginController', [])

  .controller('Login', ['$scope', 'api', 'utils', '$location', 'corpus'
  ,function($scope, api, utils, $location, corpus) {
    $scope.currentPage = 'login'

    $scope.corpusList
    $scope.corpusList_byId = {}

    $scope.disconnected = false
    $scope.loading = true

    $scope.uiMode = 'default'
    $scope.new_project_message = ''
    $scope.new_project_name = ''
    $scope.new_project_password = ''
    $scope.new_project_password_2 = ''
    $scope.login_password = ''
    $scope.passwordProtected = false

    $scope.starting = false
    $scope.search_query = ''

    $scope.createCorpus = function(){
      var isValid = true

      if($scope.new_project_name.length == 0){
        isValid = false
        $scope.new_project_message = 'A name is required'
      } else if($scope.new_project_password.length == 0 && $scope.new_project_password_2.length == 0 && $scope.passwordProtected){
        isValid = false
        $scope.new_project_message = 'A password is required'
      } else if($scope.new_project_password.length > 0 && $scope.new_project_password_2.length == 0 && $scope.passwordProtected){
        isValid = false
        $scope.new_project_message = 'Password verification required'
      } else if($scope.new_project_password !== $scope.new_project_password_2){
        isValid = false
        $scope.new_project_message = 'Passwords do not match'
      }
      
      if(isValid){
        $scope.starting = true
        $scope.new_project_message = ''
        createCorpus($scope.new_project_name, $scope.new_project_password)
      }
    }

    $scope.selectCorpus = function(id){
      $scope.uiMode = 'login'
      $scope.corpus = $scope.corpusList_byId[id]
      if(!$scope.corpus.password){
        $scope.logIn()
      }
    }

    $scope.logIn = function(){
      var isValid = true

      if($scope.login_password.length == 0 && $scope.corpus.password){
        isValid = false
        $scope.login_message = 'Password required'
      }
      
      if(isValid){
        $scope.login_message = ''
        $scope.starting = true
        startCorpus($scope.corpus.corpus_id, $scope.login_password)
      }
    }

    // Init
    loadCorpusList()

    function startCorpus(id, password){
      api.startCorpus({
        id: id
        ,password: password
      }, function(){

        openCorpus($scope.corpus.corpus_id, $scope.corpus.name)

      },function(data, status, headers, config){
        
        $scope.starting = false
        $scope.login_message = 'Wrong Password'

      })
    }

    function createCorpus(name, password){
      api.createCorpus({
        name: name
        ,password: password
      }, function(data){
        
        openCorpus(data.corpus_id, $scope.new_project_name)

      },function(data, status, headers, config){
        $scope.starting = false

        $scope.new_project_message = 'Error creating corpus'

      })
    }

    function loadCorpusList(){
      api.getCorpusList({}, function(list){
        $scope.disconnected = false
        $scope.loading = false
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
        $scope.disconnected = true
        $scope.loading = false
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


  }])