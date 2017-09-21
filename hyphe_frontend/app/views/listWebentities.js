'use strict';

angular.module('hyphe.listwebentitiesController', [])

  .controller('listWebentities', ['$scope', 'api', 'utils', 'store', '$location', '$timeout', 'corpus'
  ,function($scope, api, utils, store, $location, $timeout, corpus) {
    $scope.currentPage = 'listWebentities'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.list = []
    $scope.checkedList = []
    $scope.webentitiesCheckStack = {} // Web entities once checked
                                      // NB: will contain false positives

    $scope.randomEasterEgg

    $scope.loading = false  // This flag prevents multiple simultaneous queries
    $scope.loadingStatus = false

    $scope.filteringCollapsed = false

    $scope.pageChecked = false

    $scope.paginationPage = 1
    $scope.paginationMaxPage = 1
    $scope.paginationLength = "20"   // How many items per page
    $scope.paginationNumPages = 10  // How many pages to display in the pagination
    
    $scope.fullListLength = 0
    $scope.currentSearchToken

    $scope.query = ""
    $scope.sort = 'name'
    $scope.sortAsc = true
    $scope.statuses = {in:true, out:false, undecided:true, discovered:false}
    $scope.statusesSummary

    $scope.settingsChanged

    $scope.settings = {
      in: $scope.statuses.in
    , undecided: $scope.statuses.undecided
    , out: $scope.statuses.out
    , discovered: $scope.statuses.discovered
    , query: $scope.query
    , paginationLength: parseInt($scope.paginationLength)
    }
    $scope.counts = {}

    $scope.selected_setStatus = 'none'
    $scope.selected_mergeTarget = 'none'

    $scope.applySettings = function(){
      
      if (!validatePagination()) {
        return
      }
      $scope.settings.paginationLength = parseInt($scope.paginationLength)
      
      loadStatus()

      for(var status in $scope.statuses){
        $scope.settings[status] = $scope.statuses[status]
      }
      $scope.settings.query = $scope.query

      $scope.touchSettings()
      summarizeStatuses()
      doQuery()
    }

    $scope.revertSettings = function(){
      for(var status in $scope.statuses){
        $scope.statuses[status] = $scope.settings[status]
      }
      $scope.query = $scope.settings.query

      $scope.touchSettings()
    }

    function validatePagination(){
      var pglength = parseInt(($scope.paginationLength.trim().match(/^[1-9]\d*$/) || [])[0])
      if (pglength > 0 && pglength < 1000) {
        // $('.results-per-page input').removeClass('ng-invalid')
        return true
      }
      // $('.results-per-page input').addClass('ng-invalid')
      return false
    }

    $scope.touchSettings = function(){

      // Check if difference with current settings
      var difference = false
      for(var status in $scope.statuses){
        if($scope.statuses[status] != $scope.settings[status]){
          difference = true
        }
      }

      if ($scope.query != $scope.settings.query) {
        difference = true
      }

      if (validatePagination() && $scope.paginationLength != $scope.settings.paginationLength) {
        difference = true
      }

      $scope.settingsChanged = difference
    }

    $scope.validatePage = function(){
      var pgval = parseInt(((""+$scope.paginationPage).trim().match(/^[1-9]\d*$/) || [])[0])
      if (!(pgval > 0 && pgval <= $scope.paginationMaxPage)) {
        $('.page-input input').addClass('ng-invalid')
        return false
      }
      $('.page-input input').removeClass('ng-invalid')
      return true

    }

    $scope.pageChanged = function(){
      if (!$scope.validatePage()) {
        return
      }
      $scope.status = {message: 'Loading'}
      $scope.pageChecked = false
      $scope.loading = true

      api.getResultsPage(
        {
          token: $scope.currentSearchToken
          ,page: $scope.paginationPage - 1
        }
        ,function(result){

          $scope.currentSearchToken = result.token

          var allChecked = true
          $scope.list = result.webentities.map(function(we, i){
            var checked = $scope.checkedList.some(function(weId){return weId == we.id})
            ,obj = {
              id:i
              ,webentity:we
              ,checked:checked
            }
            if(!checked)
              allChecked = false
            return obj
          })
          $scope.status = {}
          $scope.pageChecked = allChecked
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
          if(!$scope.sortAsc) {
            $scope.sortAsc = !$scope.sortAsc
          } else {
            // Reset
            $scope.sort = 'name'
            $scope.sortAsc = true
          }
        }
      } else {
        $scope.sort = field
        $scope.sortAsc = ($scope.sort == 'name')
      }
      $scope.loadWebentities($scope.settings.query)
    }

    $scope.loadWebentities = function(query){
      $scope.status = {message: 'Loading'}
      $scope.loading = true

      $scope.paginationPage = 1

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
          ,count: $scope.settings.paginationLength
          ,page: $scope.paginationPage - 1
        }
        ,function(result){
          $scope.paginationPage = 1

          $scope.fullListLength = result.total_results
          $scope.paginationMaxPage = parseInt($scope.fullListLength / $scope.paginationLength) + 1
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

    $scope.clearQuery = function(){
      $scope.query = ""
      $scope.applySettings()
      doQuery()
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
        // $location.path('/project/'+$scope.corpusId+'/checkStartPages')
        $location.path('/project/'+$scope.corpusId+'/prepareCrawls')
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

    $scope.updatePageSelection = function(){
      if($scope.pageChecked){
        $scope.list.forEach(function(obj){
          if(!obj.checked){
            obj.checked = true
            checkedList_add(obj.webentity.id, obj.webentity)
          }
        })
      } else {
        $scope.list.forEach(function(obj){
          obj.checked = false
          checkedList_remove(obj.webentity.id)
        })
      }
    }

    // Init
    $scope.applySettings()


    // Functions

    function loadStatus(callback){
      if ($scope.loadingStatus) return
      $scope.loadingStatus = true
      api.globalStatus({}, function(status){
        $scope.counts = {
          in: status.corpus.traph.webentities.IN
        , undecided: status.corpus.traph.webentities.UNDECIDED
        , out: status.corpus.traph.webentities.OUT
        , discovered: status.corpus.traph.webentities.DISCOVERED
        }
        $scope.loadingStatus = false
        $timeout(loadStatus, 5000);
      },function(data, status, headers, config){
        $scope.status = {message: 'Error loading status', background:'danger'}
        $scope.loadingStatus = false
      })
    }

    function summarizeStatuses(){
      $scope.statusesSummary = ['in', 'undecided', 'out', 'discovered']
        .filter(function(k){ return $scope.settings[k] })
        .map(function(d){ return d.toUpperCase() }).join(' + ')
    }

    function doQuery(){
      if(!$scope.loading){
        refreshEasterEgg()  // yes, yes...
        $scope.loadWebentities($scope.settings.query)
      }
    }

    function reset(){
      $scope.list

      $scope.checkedList = []

      $scope.loading = false  // This flag prevents multiple simultaneous queries

      $scope.paginationPage = 1

      $scope.selected_setStatus = 'none'
      $scope.selected_mergeTarget = 'none'

      doQuery()
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

    function refreshEasterEgg(){
      $scope.randomEasterEgg = Math.floor(Math.random()*5)
    }
  }])
