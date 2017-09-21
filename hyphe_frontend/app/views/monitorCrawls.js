'use strict';

angular.module('hyphe.monitorcrawlsController', [])

  .controller('monitorCrawls', 
  function(
    $scope,
    api,
    store,
    utils,
    QueriesBatcher,
    $location,
    refreshScheduler,
    corpus,
    $timeout
  ){
    $scope.currentPage = 'monitorCrawls'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.selectedTab = 0
    $scope.focusedJobId
    
    $scope.crawlJobs = []
    $scope.crawljobsIndex = {}
    $scope.lastCrawlJobs = []
    $scope.dynamicCrawlJobs // Virtual repeat
    
    $scope.webentityIndex = {}

    $scope.listLoaded = false
    $scope.status = {message: 'Loading'}

    $scope.focusOnJob = function(job){
      if (!job || !job._id) return
      $location.search({'id': job._id})
      $scope.focusedJobId = job._id
      $scope.selectedTab = 2
    }

    $scope.abortCrawl = function(job){
      $scope.status = {message: 'Aborting crawl job'}
      
      job.crawling_status = 'CANCELED'

      api.abortCrawlJobs(
        {id:job._id}
        ,function(){
          
          $scope.setTimespan('day')
          $scope.status = {}
      
        }, function(){
          $scope.status = {message: 'Error aborting crawl job', background:'danger'}
        }
      )
    }

    $scope.reCrawl = function(job){
      var webentity = $scope.webentityIndex[job.webentity_id]
      ,obj = {webentity: webentity}
      
      if(webentity !== undefined){
        store.set('webentities_toCrawl', [obj])
        store.set('webentity_old_crawljob', job)
        $location.path('/project/'+$scope.corpusId+'/prepareCrawls')
      } else {
        $scope.status = {message:'No Web Entity to send', background:'danger'}
      }
    }

    // Load full list of crawl jobs when necessary
    $scope.$watch('selectedTab', function(){
      // Explanation: unless the user has clicked on tab 1 (all crawls)
      // we do not load the full list. Note that $scope.crawlJobs is
      // supposed to be populated with the lastCrawlJobs, but that does
      // not mean that we have everything.
      // So we first get the full list (the function updates $scope.crawlJobs)
      // then we build $scope.dynamicCrawlJobs, which is necessary to
      // the virtual repeat.
      // Why using some lazy loading if we have the full list ?
      // Because we have to ask for the names of the web entities...
      if ($scope.selectedTab == 1) {
        updateAllCrawlJobs(function(){
          $scope.dynamicCrawlJobs = getDynamicCrawlJobs() // Virtual repeat
        })
      }
    })

    // Initialization
    updateLastCrawlJobs()
    if ($location.search().id) {
      $scope.focusedJobId = $location.search().id
      updateSingleCrawlJobs($location.search().id)
      $scope.selectedTab = 2
    }


    /// Functions

    // Loop to refresh crawl jobs
    function scheduleRefresh(){
      refreshScheduler.schedule(
        function(){ // Slowdown Condition
          return false
          // TODO: set proper slowdown condition (below, the old conditions)
          // return $scope.lastCrawlJobs.length == 0 || !$scope.lastCrawlJobs.some(function(job){return job.globalStatus == 'CRAWLING' || job.globalStatus == 'INDEXING' || job.globalStatus == 'WAITING' || job.globalStatus == 'PENDING'})
        }
        ,updateLastCrawlJobs // Callback
        // ,refreshCrawlJobs // Callback
      )
      
    }

    function loadRequiredWebentities(minIndex, maxIndex){

      minIndex = minIndex || 0 // Inclusive
      maxIndex = maxIndex || $scope.crawlJobs.length // Exclusive

      var webentityId_list = $scope.crawlJobs
        
        // Find web entities in the list of crawl jobs
        .map(function(job){
            return job.webentity_id
          })

        // Filter by index
        .filter(function(job, i){
            return i >= minIndex && i < maxIndex
          })

        // Get those that are not indexed
        .filter(function(weId){
            return $scope.webentityIndex[weId] === undefined
          })

        // Remove doublons
        webentityId_list = utils.extractCases(webentityId_list)

        // Batch query them!
        loadWebentities(webentityId_list)

    }

    var one_hour_in_ms = 3600000     // =          60 * 60 * 1000
    var one_day_in_ms =  86400000    // =     24 * 60 * 60 * 1000
    var one_week_in_ms = 604800000   // = 7 * 24 * 60 * 60 * 1000

    function updateSingleCrawlJobs(jobId){
      updateCrawlJobs({id_list:[jobId]}, function(consolidatedCrawlJobs){
        var updatedCrawljob = consolidatedCrawlJobs[0]
        if (!updatedCrawljob) return
        if (
          !$scope.crawlJobs.some(function(job, i){
            if (job._id == jobId) {
              $scope.crawlJobs[i] = updatedCrawljob
              return true
            } else return false
          })
        ) {
          $scope.crawlJobs.push(updatedCrawljob)
        }
        updateCrawlJobsIndex()
        loadRequiredWebentities()
      })
    }

    function updateLastCrawlJobs(){
      var now = Date.now()
      var timespanMs = one_week_in_ms
      var from = (now - timespanMs)
      var to = null
      updateCrawlJobs({from:from, to:to}, function(consolidatedCrawlJobs){
        $scope.lastCrawlJobs = consolidatedCrawlJobs
        feedBackMainList() // Pass on possible up-to-date data to the common data pool
        updateCrawlJobsIndex()
        loadRequiredWebentities()
        scheduleRefresh()
      })
    }

    function updateAllCrawlJobs(callback){
      var from = 0
      var to = null
      updateCrawlJobs({from:from, to:to}, function(consolidatedCrawlJobs){
        $scope.crawlJobs = consolidatedCrawlJobs
        updateCrawlJobsIndex()
        loadRequiredWebentities()
        callback()
      })
    }

    function updateCrawlJobs(settings, callback) {
      var now = Date.now()
      var timespanMs = one_week_in_ms

      $scope.status = {message: 'Refreshing crawl jobs'}

      api.getCrawlJobs(

        // Settings
        settings,

        // Success callback
        function(crawlJobs) {

          $scope.listLoaded = true
          $scope.status = {}
          
          callback(
            crawlJobs
              // Consolidate
              .map(utils.consolidateJob)
              // Sort by currently working then reverse chronological order
              .sort(function(a,b){
                if (a.globalStatus === "CRAWLING" || a.globalStatus === "INDEXING")
                  return -1
                if (b.globalStatus === "CRAWLING" || b.globalStatus === "INDEXING")
                  return 1
                return b.created_at - a.created_at
              })
          )

        },

        // Fail callback
        function() {
          $scope.status = {message: 'Error loading crawl jobs', background:'danger'}
        }
      )
      
    }

    function updateCrawlJobsIndex() {
      $scope.crawljobsIndex = {}
      $scope.crawlJobs.forEach(function(job){
        $scope.crawljobsIndex[job._id] = job
      })
    }

    function populateWebEntityNames(){
      ($scope.crawlJobs || []).forEach(function(job){
        var we = ($scope.webentityIndex[job.webentity_id])
        if (!we) job.webentity_name = ""
        else job.webentity_name = we.name + (job.previous_webentity_name && job.previous_webentity_name != we.name ? ' (previously '+job.previous_webentity_name+')' : '')
      })
    }

    function loadWebentities(list) {
      if(list.length > 0){
        $scope.status = {message: 'Loading'}
        api.getWebentities(
          {
            id_list: list
            ,light: true
          }
          ,function(webentities){
            $scope.status = {}
            webentities.forEach(function(we){
              $scope.webentityIndex[we.id] = we
            })
            populateWebEntityNames()
          }, function(){
            $scope.status = {message: 'Error loading web entities', background:'danger'}
          }
        )
      } else {
        $scope.status = {}
        populateWebEntityNames()
      }
    }

    function feedBackMainList() {

      // This function sends back last jobs to the main list,
      // because we have up to date information on them
      
      var crawljobsIndex = {}
      var lastCrawljobsIndex = {}
      var changes = []

      if($scope.lastCrawlJobs && $scope.lastCrawlJobs.length > 0){

        // Index crawl jobs by id
        $scope.crawlJobs.forEach(function(job){
          crawljobsIndex[job._id] = job
        })

        // Index last crawl jobs by id
        $scope.lastCrawlJobs.forEach(function(job){
          lastCrawljobsIndex[job._id] = job
        })

        // In the main jobs list, when a job is known (is indexed), then we update it
        $scope.crawlJobs.forEach(function(job, i){
          var updatedJob = lastCrawljobsIndex[job._id]
          if(updatedJob){
            changes.push({i:i, job:updatedJob})
          }
        })

        changes.forEach(function(change){
          $scope.crawlJobs[change.i] = change.job
        })

        // When a last crawl job is not known, we add it
        $scope.lastCrawlJobs.forEach(function(job, i){
          if (crawljobsIndex[job._id] === undefined) {
            $scope.crawlJobs.push(job)
          }
        })

        populateWebEntityNames()
      }
    }

    function getDynamicCrawlJobs() {
      
      // Here, we set up our model using a class.
      // Using a plain object would work too. All that matters
      // is that we implement getItemAtIndex and getLength.
      
      var DynamicCrawlJobs = function() {
        /**
         * @type {!Object<?Array>} Data pages, keyed by page number (0-index).
         */
        this.loadedPages = {};

        /** @type {number} Total number of items. */
        this.numItems = 0;

        /** @const {number} Number of items to fetch per request. */
        this.PAGE_SIZE = 20;

        this.fetchNumItems_();
      };

      // Required.
      DynamicCrawlJobs.prototype.getItemAtIndex = function(index) {
        var pageNumber = Math.floor(index / this.PAGE_SIZE);
        var page = this.loadedPages[pageNumber]

        if (page) {
          return page[index % this.PAGE_SIZE]
        } else if (page !== null) {
          this.fetchPage_(pageNumber)
        }
      };

      // Required.
      DynamicCrawlJobs.prototype.getLength = function() {
        return this.numItems
      }

      DynamicCrawlJobs.prototype.fetchPage_ = function(pageNumber) {
        // Set the page to null so we know it is already being fetched.
        this.loadedPages[pageNumber] = null;

        // We search for the crawl jobs in the concerned range whose
        // web entities are not known already
        var minIndex = Math.max(0, Math.min(this.PAGE_SIZE * pageNumber, $scope.crawlJobs.length - 1))
        var maxIndex = Math.max(0, Math.min(this.PAGE_SIZE * (pageNumber+1), $scope.crawlJobs.length))
        loadRequiredWebentities(minIndex, maxIndex)

        // We can immediately answer with the crawl jobs, since the
        // webentity names will be updated asynchronously later.
        var self = this
        $timeout(function(){
          self.loadedPages[pageNumber] = []
          var pageOffset = pageNumber * self.PAGE_SIZE
          for (var i = pageOffset; i < pageOffset + self.PAGE_SIZE; i++) {
            self.loadedPages[pageNumber].push($scope.crawlJobs[i])
          }
        })
      }

      DynamicCrawlJobs.prototype.fetchNumItems_ = function() {
        this.numItems = $scope.crawlJobs.length
      }
      
      return new DynamicCrawlJobs()
    }

  })
