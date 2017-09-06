'use strict';

angular.module('hyphe.prospectController', [])

  .controller('prospect', ['$scope', 'api', 'utils', 'corpus', 'store', '$location'
  ,function($scope, api, utils, corpus, store, $location) {
    $scope.currentPage = 'prospect'
    $scope.Page.setTitle('Prospect')
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.list = []
    
    $scope.loading = false  // This flag prevents multiple simultaneous queries

    $scope.paginationPage = 1
    $scope.paginationLength = 20   // How many items per page
    $scope.paginationNumPages = 10  // How many pages to display in the pagination
    
    $scope.fullListLength = 0
    $scope.currentSearchToken


    $scope.query
    $scope.settings = {
      query: $scope.query
    }
    $scope.settingsChanged

    $scope.setToInCollapsed = false
    $scope.setToOutCollapsed = true
    $scope.setToUndecidedCollapsed = true

    $scope.setIndex = {}
    $scope.setToIn = 0
    $scope.setToOut = 0
    $scope.setToUndecided = 0

    $scope.filteringCollapsed = false

    $scope.applySettings = function(){
      $scope.settings.query = $scope.query

      $scope.touchSettings()
      
      $scope.doQuery()
    }

    $scope.revertSettings = function(){
      $scope.query = $scope.settings.query

      $scope.touchSettings()
    }

    $scope.touchSettings = function(){

      // Check if difference with current settings
      var difference = false
      if ($scope.query != $scope.settings.query) {
        difference = true
      }

      $scope.settingsChanged = difference
    }

    $scope.pageChanged = function(){
      
      $scope.status = {message: 'Loading'}
      $scope.loading = true
      $scope.rangeObj = {loading:true}

      api.getResultsPage(
        {
          token: $scope.currentSearchToken
          ,page: $scope.paginationPage - 1
        }
        ,function(result){
          $scope.currentSearchToken = result.token

          $scope.list = result.webentities.map(function(we, i){
            var obj = {
              id:i
              ,webentity:we
              ,status: we.status  // object status is the status visible in UI
            }
            return obj
          })
          $scope.status = {}
          $scope.loading = false
        }
        ,function(){
          $scope.list = []
          $scope.status = {message: 'Error loading results page', background: 'danger'}
          $scope.loading = false
        }
      )
    }

    $scope.sortChanged = function(){
      $scope.loadWebentities($scope.lastQuery)
    }

    $scope.loadWebentities = function(query){
      $scope.status = {message: 'Loading'}
      $scope.loading = true

      $scope.paginationPage = 1

      // Set last query
      $scope.lastQuery = $scope.query

      // Get filtering settings
      var field_kw = [
          [
            'status'
            ,'DISCOVERED'
          ]
        ]

      api.searchWebentities(
        {
          allFieldsKeywords: query || []
          ,fieldKeywords: field_kw
          ,sortField: '-indegree'
          ,count: $scope.paginationLength
          ,page: $scope.paginationPage - 1
        }
        ,function(result){
          $scope.paginationPage = 1

          $scope.fullListLength = result.total_results
          $scope.currentSearchToken = result.token

          $scope.list = result.webentities.map(function(we, i){
            var obj = {
              id:i
              ,webentity:we
              ,status: we.status  // object status is the status visible in UI
            }
            return obj
          })
          $scope.status = {}
          $scope.loading = false
        }
        ,function(){
          $scope.list = []
          $scope.status = {message: 'Error loading web entities', background: 'danger'}
          $scope.loading = false
        }
      )
    }

    $scope.doQuery = function(){
      if(!$scope.loading){
        $scope.loadWebentities($scope.query)
      }
    }

    $scope.clearQuery = function(){
      $scope.query = undefined
      $scope.applySettings()
      $scope.doQuery()
    }

    $scope.setStatus = function(obj, status){
      if(obj.webentity.status.toLowerCase() === status.toLowerCase()){
        status = 'DISCOVERED'
      }
      api.webentitiesSetStatus(
        {
          webentityId_list: [obj.webentity.id]
          ,status: status
        }
        ,function(result){
            obj.webentity.status = status 
        }
        ,function(){
          // In case of error, we undo the modification in the UI
          obj.status = 'discovered'
          delete $scope.setIndex[obj.webentity.id]
          updateStatusCounts()
          $scope.status = {message: 'Error setting status', background:'danger'}
        }
      )

      $scope.setIndex[obj.webentity.id] = {webentity: obj.webentity, status: status}
      updateStatusCounts()
    }

    $scope.removeFromSetIndex = function(id){
      delete $scope.setIndex[id]
      updateStatusCounts()
    }

    $scope.doCrawl = function(status){

      function buildObj(we){
        return {
            webentity: we
          }
      }
      var list = []
      for(var id in $scope.setIndex){
        if($scope.setIndex[id].status == status)
          list.push(buildObj($scope.setIndex[id].webentity))
      }
      
      // Remove doublons
      list = utils.extractCases(list, function(obj){
        return obj.webentity.id
      })

      if(list.length > 0){
        store.set('webentities_toCrawl', list)
        $location.path('/project/'+$scope.corpusId+'/prepareCrawls')
      } else {
        $scope.status = {message:'No Web Entity to send', background:'danger'}
      }
    }

    $scope.openPreview = function(obj){
      var lru = obj.webentity.prefixes[0]
      if(lru)
        $scope.popLru(lru)
    }

    $scope.popLru = function(lru){
      window.open(utils.LRU_to_URL(lru), '_blank');
    }

    // Init
    $scope.loadWebentities()

    // Functions
    function reset(){
      $scope.list

      $scope.checkedList = []

      $scope.loading = false  // This flag prevents multiple simultaneous queries

      $scope.paginationPage = 1

      $scope.selected_setStatus = 'none'
      $scope.selected_mergeTarget = 'none'

      $scope.doQuery()
    }

    function updateStatusCounts(){
      $scope.setToIn = 0
      $scope.setToOut = 0
      $scope.setToUndecided = 0

      for(var id in $scope.setIndex){
        var o = $scope.setIndex[id]
        switch(o.status){
          case('IN'):
            $scope.setToIn++
            break
          case('OUT'):
            $scope.setToOut++
            break
          case('UNDECIDED'):
            $scope.setToUndecided++
            break
        }
      }
    }

  }])
