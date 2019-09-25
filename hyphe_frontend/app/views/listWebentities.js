'use strict';

angular.module('hyphe.listwebentitiesController', [])

  .controller('listWebentities', 
  function(
    $scope,
    api,
    utils,
    store,
    $location,
    $timeout,
    $route,
    $window,
    corpus
  ) {
    $scope.currentPage = 'listWebentities'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.dynamicWebentities

    $scope.checkedList = []
    $scope.checkedIndex = {}
    $scope.allChecked = false
    $scope.allCheckedDisable = false
    $scope.allCheckedIndeterminate = false

    $scope.randomEasterEgg

    $scope.loading = false  // This flag prevents multiple simultaneous queries
    $scope.loadingStatus = false

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
    }
    $scope.counts = {}

    $scope.selected_setStatus = ''
    $scope.selected_mergeTarget = ''

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

    $scope.uncheck = function(weid){
      checkedList_remove(weid)
      $scope.dynamicWebentities.uncheck(weid)
    }

    $scope.uncheckAll = function(){
      while($scope.checkedList.length > 0){
        $scope.uncheck($scope.checkedList[0])
      }
    }

    $scope.toggleCheckAll = function() {
      if ($scope.allChecked) {
        $scope.allCheckedDisable = true
        $scope.dynamicWebentities.uncheckAll(function(){
          $timeout(function(){
            $scope.allChecked = false
            $scope.allCheckedDisable = false
          })
        })
      } else {
        $scope.allCheckedDisable = true
        $scope.dynamicWebentities.checkAll(function(){
          $timeout(function(){
            $scope.allChecked = true
            $scope.allCheckedDisable = false
          })
        })
      }
    }

    $scope.doCrawl = function(crawlExisting){

      function buildObj(we){
        return {
            webentity: we
          }
      }
      var list = $scope.checkedList
        .map(function(id){
          return $scope.checkedIndex[id]
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
      if($scope.selected_mergeTarget !== '' && !$scope.loading){

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
      if($scope.selected_setStatus !== '' && !$scope.loading){

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

    // Resize subheader
    window.onresize = function(event) {
      syncSubheaderWidth()
    }


    // Functions

    function loadStatus(callback){
      $timeout.cancel($scope.jobsToCome)
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
        $scope.jobsToCome=$timeout(loadStatus, 5000);
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
      $scope.loading = false
      $scope.checkedList = []
      $scope.checkedIndex = {}
      $scope.dynamicWebentities = new DynamicWebentities()

      $scope.selected_setStatus = ''
      $scope.selected_mergeTarget = ''

      doQuery()
    }

    function checkedList_remove(weid){
      var i = $scope.checkedList.indexOf(weid)
      if (i >= 0) {
        $scope.checkedList.splice(i, 1)
      }
      delete $scope.checkedIndex[weid]
    }

    function checkedList_add(weid, we){
      $scope.checkedList.push(weid)
      $scope.checkedIndex[weid] = we
    }

    function refreshEasterEgg(){
      var easterEggs = [
        'img/egg_linda.gif',
        'img/egg_howdevpictureusers.gif',
        'img/egg_userandphone.gif',
        'img/egg_selfie.gif',
        'img/egg_monkey.gif'
      ]
      $scope.randomEasterEgg = easterEggs[Math.floor(Math.random()*easterEggs.length)]
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
      this.PAGE_SIZE = 15;

    };

    // Required.
    DynamicWebentities.prototype.getItemAtIndex = function(index) {
      syncSubheaderWidth()
      var pageNumber = Math.floor(index / this.PAGE_SIZE);
      var page = this.loadedPages[pageNumber]

      if (this.numItems && index >= this.numItems) {
        return null
      }
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
                webentity: we,
                selected: $scope.checkedIndex[we.id] !== undefined,
                checked: $scope.checkedIndex[we.id] !== undefined
              }
              return obj
            })
            $scope.status = {}
            $scope.loading = false
            self.loading = false
          }
          ,function(){
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
                webentity: we,
                selected: $scope.checkedIndex[we.id] !== undefined,
                checked: $scope.checkedIndex[we.id] !== undefined
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

    DynamicWebentities.prototype.uncheck = function(weid) {
      var p
      for (p in this.loadedPages) {
        var items = this.loadedPages[p] || []
        items.forEach(function(obj){
          if (obj.webentity && obj.webentity.id == weid) {
            obj.selected = false
          }
        })
      }
    }

    DynamicWebentities.prototype.getCheckedSummary = function() {
      var summary = {checked:0, unchecked: 0, indeterminate: false}
      var p
      for (p = 0; p < Math.ceil(this.numItems / this.PAGE_SIZE); p++) {
        if (this.loadedPages[p]) {
          this.loadedPages[p].forEach(function(obj){
            if (obj.selected) {
              summary.checked++
            } else {
              summary.unchecked++
            }
          })
        } else {
          summary.indeterminate = true
        }
      }
      return summary
    }

    DynamicWebentities.prototype.checkAll = function(callback) {
      this.checkOrUncheckAll(true, callback)
    }

    DynamicWebentities.prototype.uncheckAll = function(callback) {
      this.checkOrUncheckAll(false, callback)
    }

    DynamicWebentities.prototype.checkOrUncheckAll = function(checkValue, callback) {
      // Strategy: Load each page, check all, and forget
      var settings = {pagesToLoad: [], totalPages: 0, token: this.searchToken, callback:callback, checkValue:checkValue}

      // Check/Uncheck loaded pages
      var p
      for (p = 0; p < Math.ceil(this.numItems / this.PAGE_SIZE); p++) {
        if (this.loadedPages[p]) {
          this.loadedPages[p].forEach(function(obj){
            obj.selected = checkValue
          })
        } else {
          settings.pagesToLoad.push(p)
        }
      }
      settings.totalPages = settings.pagesToLoad.length
      // Check all the pages
      this.cascadingCheckPage(settings)
    }

    DynamicWebentities.prototype.cascadingCheckPage = function(settings) {
      if ($route.current.loadedTemplateUrl != "views/listWebentities.html") return
      var percent = Math.round(100 - 100 * settings.pagesToLoad.length/settings.totalPages)
      var page = settings.pagesToLoad.shift()

      if (page === undefined) {
        settings.callback()
      } else {
        $scope.status = {message: ((settings.checkValue) ? ('Checking') : ('Unchecking')) + ' web entities - please wait', progress:percent}
        $scope.loading = true
        self.loading = true

        api.getResultsPage(
          {
            token: settings.token,
            idNamesOnly: true,
            page: page
          }
          ,function(result){
            if (settings.checkValue) {
              result.forEach(function(idName, i){
                checkedList_add(idName[0], {id: idName[0], name:idName[1]})
              })
            } else {
              result.forEach(function(idName, i){
                checkedList_remove(idName[0], {id: idName[0], name:idName[1]})
              })
            }
            if (settings.pagesToLoad.length > 0) {
              $scope.dynamicWebentities.cascadingCheckPage(settings)
            } else {
              $scope.status = {}
              $scope.loading = false
              self.loading = false
              settings.callback()
            }
          }
          ,function(){
            $scope.status = {message: 'Error loading results page for "check all"', background: 'danger'}
          }
        )
      }
    }
    
    function updateSelectionFromList() {
      var checked = []
      var checkedIndex = {}
      var unchecked = []
      var p
      for (p in $scope.dynamicWebentities.loadedPages) {
        var items = $scope.dynamicWebentities.loadedPages[p] || []
        items.forEach(function(obj){
          if (obj.webentity) {
            if (obj.selected) {
              var weid = obj.webentity.id
              checked.push(weid)
              checkedIndex[weid] = obj.webentity
            } else {
              unchecked.push(obj.webentity.id)
            }
          }
        })
      }

      // Add checked webentity ids
      checked.forEach(function(weid){
        if ($scope.checkedList.indexOf(weid) < 0) {
          checkedList_add(weid, checkedIndex[weid])
        }
      })

      // Remove unchecked webentity ids
      unchecked.forEach(function(weid){
        if ($scope.checkedList.indexOf(weid) >= 0) {
          checkedList_remove(weid)
        }
      }) 
    }

    function updateAllCheckedStatus() {
      if ($scope.checkedList.length == 0) {
        $scope.allChecked = false
        $scope.allCheckedIndeterminate = false
        return
      }
      var s = $scope.dynamicWebentities.getCheckedSummary()
      if (s.indeterminate) {
        $scope.allChecked = false
        $scope.allCheckedIndeterminate = true
        return
      }
      if (s.checked==0 && s.unchecked>0) {
        $scope.allChecked = false
        $scope.allCheckedIndeterminate = false
      } else if (s.checked>0 && s.unchecked==0) {
        $scope.allChecked = true
        $scope.allCheckedIndeterminate = false
      } else {
        $scope.allChecked = false
        $scope.allCheckedIndeterminate = true
      }

    }

    $scope.dynamicWebentities = new DynamicWebentities()

    $scope.$watch('dynamicWebentities', function(){
      updateSelectionFromList()
      updateAllCheckedStatus()
    }, true)

    // Init
    $scope.applySettings()

    $scope.$on('$destroy', function () {
      $timeout.cancel($scope.jobsToCome)
    })
  })
