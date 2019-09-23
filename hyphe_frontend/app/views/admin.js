'use strict';

angular.module('hyphe.adminController', [])

  .controller('Admin', ['$scope', 'api', 'utils', '$location', '$timeout', 'corpus',
  function($scope, api, utils, $location, $timeout, corpus, autocompletion) {
    $scope.currentPage = 'admin'
    $scope.corpusList
    $scope.corpusList_byId = {}
    $scope.globalStatus
    $scope.loadingStatus = false
    $scope.loadingList = false
    $scope.corpusAutocomplete = {}
    $scope.reverse = false
    $scope.currentSort='name'





    // Connection
    $scope.password = ""
    $scope.cancel = function(){
      $location.path('/login')
    }
    $scope.connect = function(){
      api.startCorpus({
        id: null
        ,password: $scope.password
      }, function(){
        refresh()
        $scope.loop = setInterval(refresh, 2500)
        $scope.$on('$destroy', function(){ clearInterval($scope.loop) })
      }, function(data, status, headers, config){
        $scope.passwordError = "Wrong password, redirecting you to home"
        $timeout($scope.cancel, 700)
      })
    }

    $scope.startCorpus = function(id){
      startCorpus(id, $scope.password)
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


    function loadCorpusList(){
      if ($scope.loadingList) return;
      $scope.loadingList = true
      api.getCorpusList({}, function(list){
        $scope.loadingList = false
        $scope.corpusList = []
        for(var id in list){
          $scope.corpusList.push(list[id])
        }
        $scope.corpusList_byId = list
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
        // console.log('list',list)

      },function(data, status, headers, config){
        $scope.loadingList = false
        $scope.corpusList = ''
        console.error('Error loading corpus list')
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

    /*
    //Sort By
    $scope.sortBy = function(newPropertySort) {
      if($scope.currentSort == newPropertySort) {
        $scope.reverse = !$scope.reverse
      }
      else {
        $scope.reverse = false;
        $scope.currentSort = newPropertySort;
      }
      console.log('hey')
        //$scope.reverse = ($scope.propertyName === propertyName) ? !$scope.reverse : false;
    };


    //Search
    $scope.nameAutoComplete=function(){
        var listNames=$scope.corpusList.map(function(corpus){return corpus.name})
        for (name in listNames) {
          $scope.corpusAutocomplete[name] = name
        }
      $scope.autoComplete = autocompletion.getTagAutoCompleteFunction($scope.corpusAutocomplete)
    }

/*
    function nameAutocomplete ($timeout, $q) {
      var self = this;

      // list of `state` value/display objects
      self.names = $scope.corpusList.map(function (corpus) {
        return corpus.name
      })
      self.selectedItem = null;
      self.searchText = null;
      self.querySearch = querySearch;

      function querySearch(query) {
        var results = query ? self.names.filter(createFilterFor(query)) : self.names;
        var deferred = $q.defer();
        $timeout(function () {
          deferred.resolve(results);
        }, Math.random() * 1000, false);
        return deferred.promise;
      }
*/
      /**
       * Build `states` list of key/value pairs


      function createFilterFor(query) {
        var lowercaseQuery = query.toLowerCase();

        return function filterFn(state) {
          return (state.value.indexOf(lowercaseQuery) === 0);
        };
      }
    }
       */


          function startCorpus(id, password){
      api.startCorpus({
        id: id
        ,password: password
      }, function(){

        refresh()
        // openCorpus($scope.corpus.corpus_id, $scope.corpus.name)

      },function(data, status, headers, config){
        alert('Error: possibly a wrong password')
      })
    }

    function stopCorpus(id){
      api.stopCorpus({
        id: id
      }, refresh
      ,function(data, status, headers, config){
        alert('Error')
      })
    }
    
    function destroyCorpus(id){
      api.destroyCorpus({
        id: id
      }, function(){

        refresh()

      },function(data, status, headers, config){
        alert('Error')
      })
    }

    function resetCorpus(id){
      api.resetCorpus({
        id: id
      }, loadCorpusList
      ,function(data, status, headers, config){
        alert('Error')
      })
    }

    function getStatus(){
      if ($scope.loadingStatus) return;
      $scope.loadingStatus = true
      api.globalStatus({},function(status){
        $scope.loadingStatus = false
        // console.log('Global Status', status.hyphe)
        $scope.globalStatus = status.hyphe
      }, function(){
        $scope.loadingStatus = false
      })
    }

    function refresh(){
        getStatus()
        loadCorpusList()
    }

  }])
