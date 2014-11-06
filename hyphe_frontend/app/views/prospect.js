'use strict';

angular.module('hyphe.prospectController', [])

  .controller('prospect', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'prospect'
    $scope.corpusName = corpus.getName()

    $scope.list = []
    
    $scope.loading = false  // This flag prevents multiple simultaneous queries

    $scope.paginationPage = 1
    $scope.paginationLength = 20   // How many items per page
    $scope.paginationNumPages = 5  // How many pages to display in the pagination
    
    $scope.fullListLength = 0
    $scope.currentSearchToken

    $scope.query
    $scope.lastQuery

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
      if($scope.lastQuery === undefined){
        $scope.loadWebentities()
      } else {
        $scope.loadWebentities($scope.lastQuery)
      }
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

    $scope.toggleRow = function(rowId){
      var obj = $scope.list[rowId]
      if(obj.checked){
        obj.checked = false
        checkedList_remove(obj.webentity.id)
      } else {
        obj.checked = true
        checkedList_add(obj.webentity.id, obj.webentity)
      }
    }

    $scope.uncheck = function(weId){
      checkedList_remove(weId)
      $scope.list.some(function(obj){
        if(obj.webentity.id == weId){
          obj.checked = false
          return true
        }
      })
    }

    $scope.uncheckAll = function(){
      while($scope.checkedList.length > 0){
        $scope.uncheck($scope.checkedList[0])
      }
    }

    $scope.doQuery = function(){
      if(!$scope.loading){
        var query = cleanQuery($scope.query)
        console.log('Query:',query)
        $scope.loadWebentities(query)
      }
    }

    $scope.clearQuery = function(){
      $scope.query = undefined
      $scope.loadWebentities()
    }

    $scope.setStatus = function(obj, status){
      api.webentitiesSetStatus(
        {
          webentityId_list: [obj.webentity.id]
          ,status: status
        }
        ,function(result){
          // We do nothing in case of success, since we already updated the UI
        }
        ,function(){
          // In case of error, we undo the modification in the UI
          obj.status = 'discovered'
          $scope.status = {message: 'Error setting status', background:'danger'}
        }
      )
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

    var escapedChars = ['\\', '+', '-', '!', '(', ')', ':', '^', '[', ']', '{', '}', '~', '*', '?']
    function cleanQuery(query){
      if(query === undefined)
        return undefined
      if(query == '')
        return ''
      escapedChars.forEach(function(character){
        query = query.replace(character, '\\'+character)
      })
      return '*' + query + '*'
      // return query.replace(' ', '?')
    }
    
  }])