'use strict';

angular.module('hyphe.adminController', [])

  .controller('Admin', ['$scope', 'api', 'utils', '$location', '$timeout', 'corpus', 'autocompletion',
  function($scope, api, utils, $location, $timeout, corpus, autocompletion) {
    $scope.currentPage = 'admin'
    $scope.corpusList
    $scope.corpusList_byId = {}
    $scope.globalStatus
    $scope.loadingStatus = false
    $scope.loadingList = false
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
        $scope.$on('$destroy', function(){
          clearInterval($scope.loop);
        });
      }, function(data, status, headers, config){
        $scope.passwordError = "Wrong password, redirecting you to home"
        $timeout($scope.cancel, 700)
      });
    }

    $scope.startCorpus = function(id){
      startCorpus(id, $scope.password);
    }

    $scope.stopCorpus = function(id){
      stopCorpus(id);
    }

    $scope.openCorpus = function(id, name){
      openCorpus(id, name);
    }

    $scope.destroyCorpus = function(id){
      destroyCorpus(id);
    }

    $scope.destroyAll = function(id){
      destroyAll(id);
    }

    $scope.backupCorpus = function(id){
      backupCorpus(id);
    }

    $scope.backupAll = function(){
      backupAll();
    }

    $scope.triggerLinks = function(id){
      triggerLinks(id);
    }
    $scope.resetCorpus = function(id){
      resetCorpus(id);
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
        });
        // console.log('list',list)

      },function(data, status, headers, config){
        $scope.loadingList = false
        $scope.corpusList = ''
        console.error('Error loading corpus list')
      });
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

      });
      
    }

      //Search
    $scope.autoComplete = function(query){
      var names = $scope.corpusList.map(function (corpus) {
        return corpus.name
      })
        var searchQuery = autocompletion.searchable(query)
            , res = []
            names.forEach(function(k){
              var candidateName = autocompletion.searchable(k)
              if (candidateName && (!searchQuery || ~candidateName.indexOf(searchQuery))) {
                res.push(k)
              }
            })
        res.sort(function(a,b){return a.localeCompare(b) })
        return res
    }

    function startCorpus(id, password, callback){
      api.startCorpus({
        id: id
        ,password: password
      }, function(){
        refresh()
        if (callback){
          api.pingCorpus({
            id: id
            ,timeout: 15
          },function(){
            callback(id)
          }, function(){

            alert('Error starting corpus '+id)

          })
        }

      },function(data, status, headers, config){
        alert('Error: possibly a wrong password')
      })
    }

    function stopCorpus(id, callback){
      api.stopCorpus({
        id: id
      }, refresh,
          function(){
        callback()
          }
      ,function(data, status, headers, config){
        alert('Error')
      })
    }

    $scope.destroyWarning =function (id){
      var sure = confirm('This will completely destroy this corpus, are you sure ?')
      if (sure){
        destroyCorpus(id)
      }
    }
    function simpleDestroy(id){
      api.destroyCorpus({
        id: id
      }, function () {

        refresh()

      }, function (data, status, headers, config) {
        alert('Error, corpus not destroyed')
      })
    }

    function destroyCorpus(id){
      if ($scope.corpusList_byId[id].status!=='ready') {
        startCorpus(id, $scope.password, function () {
          simpleDestroy(id)
        })
      }
      else{
        simpleDestroy(id)
      }
    }

    function destroyAll(){
      var password = prompt("This action is about to destroy every corpora. Are you sure ? Type your password to confirm.");
      if (password === $scope.password){
        for (var corpus in $scope.corpusList_byId){
          destroyCorpus(corpus)
        }
      }
      else
        event.preventDefault();
    }


    function resetCorpus(id){
      var sure = confirm('All data of this corpus will be lost, are you sure ?')
      if(sure) {
        api.resetCorpus({
              id: id
            }, loadCorpusList
            , function (data, status, headers, config) {
              alert('Error')
            })
      }
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


    function simpleBackup(id, stop, callback){
      api.backupCorpus({
        id: id
      },
      function () {
        refresh()
        if (stop)
          stopCorpus(id);
        if (callback)
          callback();
      },
      function (data, status, headers, config) {
        alert('Error during backup of '+id)
      })
    }

    function backupCorpus(id, callback) {
      if ($scope.corpusList_byId[id].status==='stopped'){
        startCorpus(id, $scope.password, function() {
          simpleBackup(id, true, callback)
        })
      }
      else if ($scope.corpusList_byId[id].status==='ready'){
        simpleBackup(id, false, callback)
      }
      else{
        alert('this corpus does not feel so good...')
      }
    }

    function backupAll(){
      console.log($scope.corpusList_byId)
      utils.waiter($scope.corpusList_byId,
          backupCorpus,
          function () { alert('All corpora successfully backed up !')
      }, function () {  console.log('Error in backup')

      })
    }

    function triggerLinks(id) {
      var sure = confirm('This might take some time, are you sure you want to re-index all links of this corpus ?')
      if(sure){
        api.triggerLinks({id
        }, function(){

        refresh()

        },function(data, status, headers, config){
          alert('Error during re-indexation of links')
        })
      }

    }
  }])
