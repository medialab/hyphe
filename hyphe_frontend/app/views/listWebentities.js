'use strict';

angular.module('hyphe.listwebentitiesController', [])

  .controller('listWebentities', ['$scope', 'api', 'utils', 'store', '$location', '$timeout', 'corpus'
  ,function($scope, api, utils, store, $location, $timeout, corpus) {
    $scope.currentPage = 'listWebentities'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.dynamicWebentities

    $scope.list = []
    $scope.checkedList = []
    $scope.webentitiesCheckStack = {} // Web entities once checked
                                      // NB: will contain false positives

    $scope.randomEasterEgg

    $scope.loading = false  // This flag prevents multiple simultaneous queries
    $scope.loadingStatus = false

    $scope.pageChecked = false

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

      $scope.settingsChanged = difference
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
      var sort_field = (($scope.sortAsc) ? ($scope.sort) : ('-' + $scope.sort))

      $scope.dynamicWebentities.reload({
        query: query,
        field_kw: field_kw,
        sort_field: sort_field
      })
    }

/*    $scope.toggleRow = function(rowId){
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
*/

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

    // Resize subheader
    window.onresize = function(event) {
      syncSubheaderWidth()
    }


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

    function syncSubheaderWidth() {
      if (document.querySelector('.follow-md-virtual-repeat-width') && document.querySelector('.md-virtual-repeat-offsetter')) {
        document.querySelector('.follow-md-virtual-repeat-width').style.width = document.querySelector('.md-virtual-repeat-offsetter').offsetWidth + 'px'
      }
    }

    /// Dynamic list

    function DynamicWebentities() {
      /**
       * @type {!Object<?Array>} Data pages, keyed by page number (0-index).
       */
      this.loadedPages = {};

      /** @type {number} Total number of items. */
      this.numItems = 0;

      this.loading = false

      /** @type {!Object} Filter settings of the query. */
      this.querySettings = {};

      this.searchToken

      /** @const {number} Number of items to fetch per request. */
      this.PAGE_SIZE = 50;

    };

    // Required.
    DynamicWebentities.prototype.getItemAtIndex = function(index) {
      syncSubheaderWidth()
      var pageNumber = Math.floor(index / this.PAGE_SIZE);
      var page = this.loadedPages[pageNumber]

      if (page) {
        return page[index % this.PAGE_SIZE]
      } else if (page !== null) {
        this.fetchPage_(pageNumber)
      }
    };

    // Required.
    DynamicWebentities.prototype.getLength = function() {
      return this.numItems
    }

    DynamicWebentities.prototype.fetchPage_ = function(pageNumber) {
      // Set the page to null so we know it is already being fetched.
      this.loadedPages[pageNumber] = null

      $scope.status = {message: 'Loading'}
      $scope.loading = true
      this.loading = true

      var self = this
      if (this.searchToken) {
        api.getResultsPage(
          {
            token: self.searchToken
            ,page: pageNumber
          }
          ,function(result){
            self.loadedPages[pageNumber] = result.webentities.map(function(we, i){
              var obj = {
                id: pageNumber * self.PAGE_SIZE + i,
                webentity:we,
                checked: $scope.checkedList.some(function(weId){return weId == we.id})
              }
              return obj
            })
            self.loading = false
          }
          ,function(){
            $scope.list = []
            $scope.status = {message: 'Error loading results page', background: 'danger'}
            $scope.loading = false
            self.loading = false
          }
        )
      } else {
        api.searchWebentities(
          {
            allFieldsKeywords: self.querySettings.query || []
            ,fieldKeywords: self.querySettings.field_kw
            ,sortField: self.querySettings.sort_field
            ,count: self.PAGE_SIZE
            ,page: pageNumber
          }
          ,function(result){
            self.numItems = result.total_results
            self.searchToken = result.token

            self.loadedPages[pageNumber] = result.webentities.map(function(we, i){
              var obj = {
                id: pageNumber * self.PAGE_SIZE + i,
                webentity:we,
                checked: $scope.checkedList.some(function(weId){return weId == we.id})
              }
              return obj
            })
            $scope.status = {}
            $scope.loading = false
            self.loading = false
          }
          ,function(){
            $scope.status = {message: 'Error loading web entities', background: 'danger'}
            $scope.loading = false
            self.loading = false
          }
        )
      }
    }

    DynamicWebentities.prototype.reload = function(querySettings) {
      this.loadedPages = {}
      this.numItems = 0
      this.querySettings = querySettings
      this.searchToken = undefined
      this.fetchPage_(0)
    }

    $scope.dynamicWebentities = new DynamicWebentities()

    // Init
    $scope.applySettings()
  }])
