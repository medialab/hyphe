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
    $scope.sort = null

    $scope.webentityIndex = {}

    $scope.listLoaded = false
    $scope.status = {message: 'Loading'}

    $scope.CSVfields = {
      webentity_name: {
        type: 'string'
      }
      ,webentity_id: {
        type: 'number'
      }
      ,crawljob_id: {
        type: 'string'
      }
      ,_id: {
        type: 'string'
      }
      ,max_depth: {
        type: 'number'
      }
      ,webarchives_used: {
        type: 'string'
      }
      ,webarchives_date: {
        type: 'string'
      }
      ,webarchives_days_range: {
        type: 'number'
      }
      ,start_urls: {
        type: 'array of string'
      }
      ,user_agent: {
        type: 'string'
      }
      ,cookies: {
        type: "string"
      }
      ,phantom: {
        type: "string"
      }
      ,globalStatus: {
        type: 'string'
      }
      ,crawling_status: {
        type: 'string'
      }
      ,indexing_status: {
        type: 'string'
      }
      ,nb_pages: {
        type: 'number'
      }
      ,nb_crawled_pages: {
        type: 'number'
      }
      ,nb_pages_indexed: {
        type: 'number'
      }
      ,nb_unindexed_pages: {
        type: 'number'
      }
      ,nb_links: {
        type: 'number'
      }
      ,created_at: {
        type: 'date'
      }
      ,scheduled_at: {
        type: 'date'
      }
      ,started_at: {
        type: 'date'
      }
      ,crawled_at: {
        type: 'date'
      }
      ,finished_at: {
        type: 'date'
      }
      ,durationOfCrawl: {
        type: 'number'
      }
      ,durationTotal: {
        type: 'number'
      }
      ,follow_prefixes: {
        type: 'array of string'
      }
      ,nofollow_prefixes: {
        type : 'array of string'
      }
      ,discover_prefixes: {
        type :'array of string'
      }
    }


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
        $location.search({})
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

    // Resize subheader
    window.onresize = function(event) {
      syncSubheaderWidth()
    }

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
        $scope.lastCrawlJobs.length == 0
          || !$scope.lastCrawlJobs.some(function(job){
            return job.globalStatus == 'CRAWLING' || job.globalStatus == 'INDEXING' || job.globalStatus == 'WAITING' || job.globalStatus == 'PENDING'
          })
        , updateLastCrawlJobs // Callback
      )

    }

    function loadRequiredWebentities(minIndex, maxIndex, callback){

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
        loadWebentities(webentityId_list, callback)
    }

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
      var one_hour_in_ms = 3600000     // =          60 * 60 * 1000
      var one_day_in_ms =  86400000    // =     24 * 60 * 60 * 1000
      var one_week_in_ms = 604800000   // = 7 * 24 * 60 * 60 * 1000
      var now = Date.now()
      var timespanMs = 3 * one_day_in_ms
      var from = (now - timespanMs)
      var to = now
      updateCrawlJobs({from:from, to:to, light: true}, function(consolidatedCrawlJobs){
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
      updateCrawlJobs({from:from, to:to, light: true}, function(consolidatedCrawlJobs){
        $scope.crawlJobs = consolidatedCrawlJobs
        updateCrawlJobsIndex()
        loadRequiredWebentities()
        callback()
      })
    }

    function updateCrawlJobs(settings, callback) {
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
                if (!$scope.sort) {
                  if (a.globalStatus === "CRAWLING" || a.globalStatus === "INDEXING")
                    return -1
                  if (b.globalStatus === "CRAWLING" || b.globalStatus === "INDEXING")
                    return 1
                  return b.created_at - a.created_at
                } else {
                  return b[$scope.sort] - b["$scope.sort"]
                }
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
      $scope.crawlJobs.forEach(function(job){
        $scope.crawljobsIndex[job._id] = deepmerge(job, $scope.crawljobsIndex[job._id] || {})
      })

    }

    function populateWebEntityNames(){
      ($scope.crawlJobs || []).forEach(function(job){
        var we = ($scope.webentityIndex[job.webentity_id])
        if (!we) delete job.webentity_name
        else job.webentity_name = we.name + (job.previous_webentity_name && job.previous_webentity_name != we.name ? ' (previously '+job.previous_webentity_name+')' : '')
      })
      updateCrawlJobsIndex()
    }

    function loadWebentities(list, callback) {
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
            populateWebEntityNames();
            if (callback) callback();
          }, function(){
            $scope.status = {message: 'Error loading web entities', background:'danger'}
          }
        )
      } else {
        $scope.status = {}
        populateWebEntityNames();
        if (callback) callback();
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

    function syncSubheaderWidth() {
      if (document.querySelector('.follow-md-virtual-repeat-width') && document.querySelector('.md-virtual-repeat-offsetter')) {
        document.querySelector('.follow-md-virtual-repeat-width').style.width = document.querySelector('.md-virtual-repeat-offsetter').offsetWidth + 'px'
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
          syncSubheaderWidth()
        })
      }

      DynamicCrawlJobs.prototype.fetchNumItems_ = function() {
        this.numItems = $scope.crawlJobs.length
      }

      return new DynamicCrawlJobs()
    }


    // Deep merge utility
    function isMergeableObject(val) {
      var nonNullObject = val && typeof val === 'object'

      return nonNullObject
        && Object.prototype.toString.call(val) !== '[object RegExp]'
        && Object.prototype.toString.call(val) !== '[object Date]'
    }

    function emptyTarget(val) {
      return Array.isArray(val) ? [] : {}
    }

    function cloneIfNecessary(value, optionsArgument) {
      var clone = optionsArgument && optionsArgument.clone === true
      return (clone && isMergeableObject(value)) ? deepmerge(emptyTarget(value), value, optionsArgument) : value
    }

    function defaultArrayMerge(target, source, optionsArgument) {
      var destination = target.slice()
      source.forEach(function(e, i) {
        if (typeof destination[i] === 'undefined') {
          destination[i] = cloneIfNecessary(e, optionsArgument)
        } else if (isMergeableObject(e)) {
          destination[i] = deepmerge(target[i], e, optionsArgument)
        } else if (target.indexOf(e) === -1) {
          destination.push(cloneIfNecessary(e, optionsArgument))
        }
      })
      return destination
    }

    function mergeObject(target, source, optionsArgument) {
      var destination = {}
      if (isMergeableObject(target)) {
        Object.keys(target).forEach(function (key) {
          destination[key] = cloneIfNecessary(target[key], optionsArgument)
        })
      }
      Object.keys(source).forEach(function (key) {
        if (!isMergeableObject(source[key]) || !target[key]) {
          destination[key] = cloneIfNecessary(source[key], optionsArgument)
        } else {
          destination[key] = deepmerge(target[key], source[key], optionsArgument)
        }
      })
      return destination
    }

    function deepmerge(target, source, optionsArgument) {
      var array = Array.isArray(source);
      var options = optionsArgument || { arrayMerge: defaultArrayMerge }
      var arrayMerge = options.arrayMerge || defaultArrayMerge

      if (array) {
        return Array.isArray(target) ? arrayMerge(target, source, optionsArgument) : cloneIfNecessary(source, optionsArgument)
      } else {
        return mergeObject(target, source, optionsArgument)
      }
    }

    deepmerge.all = function deepmergeAll(array, optionsArgument) {
      if (!Array.isArray(array) || array.length < 2) {
        throw new Error('first argument should be an array with at least two elements')
      }

      // we are sure there are at least 2 values, so it is safe to have no initial value
      return array.reduce(function(prev, next) {
        return deepmerge(prev, next, optionsArgument)
      })
    }

    $scope.toggleSort = function(field){
      if($scope.sort == field){
        // Reset
        $scope.sort = null
        $scope.crawlJobs = $scope.crawlJobs.sort(function(a,b){
          if (a.globalStatus === "CRAWLING" || a.globalStatus === "INDEXING")
            return -1
          if (b.globalStatus === "CRAWLING" || b.globalStatus === "INDEXING")
            return 1
          return b.created_at - a.created_at
        })
      } else {
        $scope.sort = field
        $scope.crawlJobs = $scope.crawlJobs.sort(function(a,b){
          if (field == "webentity_name") {
            if (a[field] < b[field]) {
              return -1;
            } else if (b[field] < a[field]) {
              return 1;
            }
            return 0;
          }
          return b[$scope.sort] - a[$scope.sort]
        })
      }
      $scope.dynamicCrawlJobs = getDynamicCrawlJobs() // Virtual repeat
    }

    //Download Metadata
    $scope.downloadCrawlsCSV = function() {
      $scope.status = {message: 'Downloading Crawls as CSV'}
      api.getCrawlJobs(
          {id_list: []}
          , function (listCrawls) {
            // Build Headline
            var headline = Object.keys($scope.CSVfields)
            loadRequiredWebentities(0,listCrawls.length, function () {
              // Build Table Content
              var tableContent = listCrawls.map(function (crawl) {
                crawl = utils.consolidateRichJob(crawl)
                crawl.webentity_name = $scope.webentityIndex[crawl.webentity_id].name
                return headline.map(function(field){
                  var value = crawl[field]
                  let type = $scope.CSVfields[field].type
                  if (type == 'date' && value) {
                    value = new Date(+value).toISOString()
                  } else if (type == 'array of string') {
                    value = value.sort().join(' ')
                  }
                  return value;
                })
              })
              // Parsing
              var fileContent = []
                  ,csvElement = function(txt){
                txt = ''+txt //cast
                return '"'+txt.replace(/"/gi, '""')+'"'
              }
              fileContent.push(headline.join(','))
              tableContent.forEach(function (row) {
                fileContent.push('\n' + row.map(csvElement).join(','))
              })
              var blob = new Blob(fileContent, {'type': "text/csv;charset=utf-8"});
              saveAs(blob, $scope.corpusName + "_crawls.csv", true);

              $scope.status = {}
            })
          }
          , function (data, status, headers, config) {
            // API call fail
            // Note: cannot access global status bar from modal
            $scope.status = {message: 'Error downloading crawls', background: 'danger'}
            console.error('Your file could not be downloaded', data, status, headers, config)
          }
      )
    }
  })
