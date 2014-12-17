'use strict';

angular.module('hyphe.listwebentitiesController', [])

  .controller('listWebentities', ['$scope', 'api', 'utils', 'store', '$location', 'corpus'
  ,function($scope, api, utils, store, $location, corpus) {
    $scope.currentPage = 'listWebentities'
    $scope.corpusName = corpus.getName()

    $scope.list = []
    $scope.checkedList = []
    $scope.webentitiesCheckStack = {} // Web entities once checked
                                      // NB: will contain false positives

    $scope.randomEasterEgg

    $scope.loading = false  // This flag prevents multiple simultaneous queries

    $scope.paginationPage = 1
    $scope.paginationLength = 20   // How many items per page
    $scope.paginationNumPages = 5  // How many pages to display in the pagination
    
    $scope.fullListLength = 0
    $scope.currentSearchToken

    $scope.query
    $scope.lastQuery
    $scope.sort = 'name'
    $scope.sortAsc = true
    $scope.statuses = {in:true, out:false, undecided:true, discovered:false}

    $scope.selected_setStatus = 'none'
    $scope.selected_mergeTarget = 'none'

    $scope.pageChanged = function(){
      
      $scope.status = {message: 'Loading'}
      $scope.loading = true

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
              ,checked:$scope.checkedList.some(function(weId){return weId == we.id})
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

    $scope.toggleSort = function(field){
      if($scope.sort == field){
        if($scope.sort == 'name'){
            $scope.sortAsc = !$scope.sortAsc
        } else {
          if($scope.sortAsc){
            $scope.sortAsc = !$scope.sortAsc
          } else {
            // Reset
            $scope.sort = 'name'
            $scope.sortAsc = true
          }
        }
      } else {
        $scope.sort = field
        $scope.sortAsc = true
      }
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
            ,['in','out','undecided','discovered']
              .filter(function(s){
                  return $scope.statuses[s]
                })
              .map(function(s){
                  return s.toUpperCase()
                })
              .join(' ')
          ]
        ]

      api.searchWebentities(
        {
          allFieldsKeywords: query || []
          ,fieldKeywords: field_kw
          ,sortField: (($scope.sortAsc) ? ($scope.sort) : ('-' + $scope.sort))
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
              ,checked:$scope.checkedList.some(function(weId){return weId == we.id})
            }
            return obj
          })
          $scope.status = {}
          $scope.loading = false

          console.log($scope.list)
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
        refreshEasterEgg()  // yes, yes...
        var query = cleanQuery($scope.query)
        console.log('Query:',query)
        $scope.loadWebentities(query)
      }
    }

    $scope.clearQuery = function(){
      $scope.query = undefined
      $scope.loadWebentities()
    }

    $scope.doCrawl = function(crawlExisting){

      function buildObj(we){
        return {
            webentity: we
          }
      }
      var list = $scope.checkedList
        .map(function(id){
          return $scope.webentitiesCheckStack[id]
        })
        .map(buildObj)
        .filter(function(obj){return obj.webentity.id !== undefined})
      
      // Remove doublons
      list = utils.extractCases(list, function(obj){
        return obj.webentity.id
      })

      if(list.length > 0){
        store.set('webentities_toCrawl', list)
        $location.path('/checkStartPages')
      } else {
        $scope.status = {message:'No Web Entity to send', background:'danger'}
      }
    }

    $scope.doMerge = function(){
      if($scope.selected_mergeTarget !== 'none' && !$scope.loading){

        $scope.loading = true
        
        var target = $scope.selected_mergeTarget
        ,list = $scope.checkedList
          .filter(function(id){
            return id != target
          })
        $scope.status = {message:'Merging web entities'}
        api.webentitiesMergeInto({
            oldWebentityId_list: list
            ,goodWebentityId: target
            ,mergeStartPages: true
          }
          ,function(data){
            reset()
          }
          ,function(data, status, headers, config){
            $scope.status = {message:'Merge failed', background:'danger'}
            $scope.loading = false
          }
        )
      }
    }

    $scope.doSetStatus = function(){
      if($scope.selected_setStatus !== 'none' && !$scope.loading){

        $scope.loading = true
        
        var status = $scope.selected_setStatus
        ,list = $scope.checkedList
      
        $scope.status = {message:'Set web entities\' status'}
        api.webentitiesSetStatus({
            webentityId_list: list
            ,status: status
          }
          ,function(data){
            reset()
          }
          ,function(data, status, headers, config){
            $scope.status = {message:'Set status failed', background:'danger'}
            $scope.loading = false
          }
        )
      }
    }

    $scope.popLru = function(lru){
      window.open(utils.LRU_to_URL(lru), '_blank');
    }

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

    function checkedList_remove(weId){
      $scope.checkedList = $scope.checkedList.filter(function(d){
        return d != weId
      })
    }

    function checkedList_add(weId, we){
      $scope.checkedList.push(weId)
      $scope.webentitiesCheckStack[weId] = we
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

    function refreshEasterEgg(){
      $scope.randomEasterEgg = Math.floor(Math.random()*4)
    }
  }])