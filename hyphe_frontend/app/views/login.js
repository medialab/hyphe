'use strict';

angular.module('hyphe.loginController', [])

  .controller('Login', ['$scope', 'api', 'utils', '$location', 'corpus'
  ,function($scope, api, utils, $location, corpus) {
    $scope.currentPage = 'login'

    $scope.corpusList
    $scope.corpusList_byId = {}
    $scope.corpusNameList = []
    $scope.loadingList = false

    $scope.disconnected = false
    $scope.loading = true

    $scope.uiMode = 'default'
    $scope.new_project_message = ''
    $scope.new_project_name = ''
    $scope.new_project_password = ''
    $scope.new_project_password_2 = ''
    $scope.login_password = ''
    $scope.passwordProtected = false

    $scope.globalStatus = false
    $scope.loadingStatus = false
    $scope.freeSlots = 0

    $scope.starting = false
    $scope.search_query = ''

    $scope.createCorpus = function(){
      var isValid = true
      
      if(~$scope.corpusNameList.indexOf($scope.new_project_name)){
        isValid = false
        $scope.new_project_message = 'A corpus with this name already exists'
      } else if($scope.new_project_name.length == 0){
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
      if(!($scope.globalStatus && $scope.globalStatus.ports_left == 0 && !$scope.corpusList_byId[id].ready)){
        $scope.uiMode = 'login'
        $scope.corpus = $scope.corpusList_byId[id]
        if(!$scope.corpus){
          $scope.uiMode = 'default'
        }else if (!$scope.corpus.password){
          $scope.logIn()
        }
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
    refresh()
    $scope.loop = setInterval(refresh, 2500)
    $scope.$on('$destroy', function(){ clearInterval($scope.loop) })

    function refresh(){
      getStatus()
      loadCorpusList()
    }

    $scope.switchToNew = function(){
      $scope.uiMode = 'new'
      if ($scope.new_project_name.length == 0 && $scope.search_query.length != 0){
        $scope.new_project_name = ""+$scope.search_query
      }
    }

    $scope.switchToChoice = function(){
      $scope.uiMode = 'default'
      $scope.search_query = ''
    }

    function startCorpus(id, password){
      api.startCorpus({
        id: id
        ,password: password
      }, function(){

        openCorpus($scope.corpus.corpus_id, $scope.corpus.name)

      },function(data, status, headers, config){
        
        $scope.starting = false
        if(data && data[0] && data[0].message.match(/^Wrong auth.*/)){
          $scope.login_message = 'Wrong Password'
        } else {
          $scope.login_message = 'An error occurred'
        }

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
      if ($scope.loadingList) return;
      $scope.loadingList = true
      api.getCorpusList({light: true}, function(list){
        $scope.loadingList = false
        $scope.disconnected = false
        $scope.loading = false
        $scope.corpusList = []
        for(var id in list){
          $scope.corpusList.push(list[id])
        }
        $scope.corpusList_byId = list
        $scope.corpusNameList = $scope.corpusList.map(function(corpus){ return corpus.name })
        $scope.corpusList.sort(function(a,b){
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;
          }
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;
          }
          // a must be equal to b
          return 0;
        })

      },function(data, status, headers, config){
        $scope.loadingList = false
        $scope.corpusList = ''
        $scope.disconnected = true
        $scope.loading = false
        console.log('Error loading corpus list')
      })
    }

    function openCorpus(id, name){
      // Ping until corpus started
      utils.tld_lists = undefined
      api.pingCorpus({
        id: id
        ,timeout: 10
      },function(data){

        $scope.starting = false
        corpus.setName(name)
        $location.path('/project/'+id+'/overview')
      
      }, function(){

        $scope.starting = false
        $scope.new_project_message = 'Error starting corpus'

      })
      
    }

    function getStatus(){
      if ($scope.loadingStatus) return;
      $scope.loadingStatus = true
      api.globalStatus({},function(status){
        $scope.loadingStatus = false
        $scope.globalStatus = status.hyphe
        $scope.freeSlots = Math.min(status.hyphe.ports_left, status.hyphe.ram_left/256)
      }, function(){
        $scope.loadingStatus = false
      })
    }


  }])
