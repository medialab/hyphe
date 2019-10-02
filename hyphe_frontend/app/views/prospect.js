'use strict';

angular.module('hyphe.prospectController', [])

  .controller('prospect',
  function(
    $scope,
    api,
    utils,
    corpus,
    store,
    $location,
    $window
  ) {
    $scope.currentPage = 'prospect'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.loading = false  // This flag prevents multiple simultaneous queries

    $scope.fullListLength = -1

    $scope.query
    $scope.settings = {
      query: $scope.query
    }
    $scope.settingsChanged
    $scope.rankings = {}

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



    $scope.loadWebentities = function(query){

      // Get filtering settings
      var field_kw = [
          [
            'status',
            'discovered'
          ]
        ]
      var sort_field = '-indegree'

      $scope.dynamicWebentities.reload({
        query: query,
        field_kw: field_kw,
        sort_field: sort_field
      })
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
      if($scope.setIndex[obj.webentity.id] && $scope.setIndex[obj.webentity.id].status.toLowerCase() === status.toLowerCase()){
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

    // Resize subheader
    window.onresize = function(event) {
      syncSubheaderWidth()
    }

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

    function getRankings(searchToken) {
      if (searchToken) {
        api.getResultsRankings(
          {
            token: searchToken
          }
          ,function(data){
            $scope.rankings = data
          }
          ,function(){
            $scope.status = {message: 'Error loading results rankings', background: 'danger'}
          }
        )
      }
    }

    function syncSubheaderWidth() {
      if (document.querySelector('.follow-md-virtual-repeat-width') && document.querySelector('.md-virtual-repeat-offsetter')) {
        document.querySelector('.follow-md-virtual-repeat-width').style.width = document.querySelector('.md-virtual-repeat-offsetter').offsetWidth + 'px'
      }
    }

    /// Dynamic webentities list

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
                webentity:we
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
                webentity:we
              }
              return obj
            })
            $scope.status = {}
            $scope.loading = false
            self.loading = false

            getRankings(result.token)
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
            token: settings.token
            ,page: page
          }
          ,function(result){
            if (settings.checkValue) {
              result.webentities.forEach(function(we, i){
                checkedList_add(we.id, we)
              })
            } else {
              result.webentities.forEach(function(we, i){
                checkedList_remove(we.id, we)
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

    $scope.dynamicWebentities = new DynamicWebentities()

    // Init
    $scope.applySettings()

    $scope.$on('$locationChangeStart', function(event, newUrl) {
      if ( !newUrl.endsWith("/prepareCrawls")){
        var toIn = $scope.setToIn
        if (toIn) {
          var answer = confirm("You have set as IN " + toIn + " web entit" + (toIn > 1 ? "ies" : "y") + " which you should probably crawl. Do you really want to leave this page?")
          if (!answer) {
            event.preventDefault();
          } else {
            $window.onbeforeunload = null;
          }
        }
      }
    })

    $window.onbeforeunload = function(){
      if($scope.setToIn>0) {
        return "you have set some entities as IN which you should probably crawl. Do you really want to leave this page?"
      }
    }

  })
