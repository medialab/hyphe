'use strict';

angular.module('hyphe.monitorcrawlsController', [])

  .controller('monitorCrawls', ['$scope', 'api', 'store', 'utils', 'QueriesBatcher', '$location', 'refreshScheduler', 'corpus'
  ,function($scope, api, store, utils, QueriesBatcher, $location, refreshScheduler, corpus){
    $scope.currentPage = 'monitorCrawls'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()
    
    $scope.crawlJobs = []
    $scope.lastCrawlJobs = []
    $scope.lastCrawlJobsMax = 48
    $scope.lastCrawlJobsSuppl = 0
    $scope.oldestTimestamp = Date.now()
    
    $scope.tabs = {'hour':false, 'day':true, 'week':false, 'all':false, 'details':false}

    $scope.timespan = $location.search().tab || 'day'
    $scope.one_day_in_ms =  86400000    // =     24 * 60 * 60 * 1000
    $scope.one_hour_in_ms = 3600000     // =          60 * 60 * 1000
    $scope.one_week_in_ms = 604800000   // = 7 * 24 * 60 * 60 * 1000

    $scope.showDetails

    $scope.webentityIndex = {}

    $scope.listLoaded = false
    $scope.status = {message: 'Loading', progress:30}

    $scope.paginationPage = 1
    $scope.paginationLength = 50   // How many items per page
    $scope.paginationNumPages = 10  // How many pages to display in the pagination

    $scope.pageChanged = function(){
      // console.log('Nous sommes sur la page '+$scope.paginationPage)
      loadRequiredWebentities()
    }

    $scope.setTimespan = function(timespan){
      if ($location.search().tab != timespan)
        $location.search({'tab': timespan})
      if ($location.search().id && timespan != 'details')
        $location.search('id', undefined)
      // Sync tabs
      for(var tab in $scope.tabs){
        $scope.tabs[tab] = tab == timespan
      }

      // Do the job
      $scope.timespan = $location.search().tab || 'day'
      $scope.showDetails = !!$location.search().id

      $scope.msTimeout = $scope.msTimeout_min
      $scope.scheduleRefresh()

      // Pass on possible up-to-date data to the common data pool
      feedMainListBack()
      
      updateCrawlJobs()
    }

    $scope.displayDetails = function(job){
      if (!job)
        return $location.search({'tab': 'all', 'id': undefined})
      if (!$location.search().id)
        $location.search({'tab': 'details', 'id': job._id})
      $scope.showDetails = true
      $scope.lastCrawlJobs = [job]

      $scope.msTimeout = $scope.msTimeout_min
      $scope.scheduleRefresh()
      
      // console.log('Details of the job',job)
    }

    // Loop to refresh crawl jobs
    $scope.scheduleRefresh = function(){
      refreshScheduler.schedule(
        function(){ // Slowdown Condition
          return $scope.lastCrawlJobs.length == 0 || !$scope.lastCrawlJobs.some(function(job){return job.globalStatus == 'CRAWLING' || job.globalStatus == 'INDEXING' || job.globalStatus == 'WAITING' || job.globalStatus == 'PENDING'})
        }
        ,refreshCrawlJobs // Callback
      )
      
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

    // Initialization
    $scope.setTimespan($scope.timespan)

    // functions
    function loadRequiredWebentities(){
      if($scope.timespan == 'all'){
        
        var webentityId_list = $scope.crawlJobs
          
          // Get the pagination window
          .filter(function(job, i){
              return i >= ($scope.paginationPage - 1) * $scope.paginationLength
                && i < ($scope.paginationPage) * $scope.paginationLength
            })

          // Find web entities in the list of crawl jobs
          .map(function(job){
              return job.webentity_id
            })

          // Get those that are not indexed
          .filter(function(weId){
              return $scope.webentityIndex[weId] === undefined
            })

          // Remove doublons
          webentityId_list = utils.extractCases(webentityId_list)

          // Batch query them!
          loadWebentities(webentityId_list)

      } else {
        
        var webentityId_list = $scope.lastCrawlJobs
          
          // Find web entities in the list of crawl jobs
          .map(function(job){
              return job.webentity_id
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
    }

    function updateCrawlJobs(){
      var now = Date.now()
      ,timespanMs = now
      ,update = false

      switch($scope.timespan){
        case('day'):
          timespanMs = $scope.one_day_in_ms
          break;;
        case('hour'):
          timespanMs = $scope.one_hour_in_ms
          break;;
        case('week'):
          timespanMs = $scope.one_week_in_ms
          break;;
      }

      // Do we have the data in the main crawl jobs list?
      // It depends on if we already queryed so far

      if($scope.oldestTimestamp <= now - timespanMs){
        
        // We have the data: build list of last crawls
        lastCrawlJobs_build(now, timespanMs)

      } else {
        
        $scope.oldestTimestamp = now - timespanMs

        // We have to update: API call
        api.getCrawlJobs(

          // Settings
          {
            from: (now - timespanMs)
            ,to: null
          }

          // Success callback
          ,function(crawlJobs){
            $scope.listLoaded = true
            $scope.crawlJobs = crawlJobs
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

            updateCrawlJobs()
            $scope.scheduleRefresh()
        
            if ($location.search().id)
              $scope.displayDetails($scope.crawlJobs.filter(function(j){
                return j._id == $location.search().id
              })[0])
          }

          // Fail callback
          ,function(){
            $scope.status = {message: 'Error loading crawl jobs', background:'danger'}
          }
        )
      }

    }

    function populateWebEntityNames(){
      ($scope.crawlJobs || []).forEach(function(job){
        var we = ($scope.webentityIndex[job.webentity_id])
        if (!we) job.webentity_name = ""
        else job.webentity_name = we.name + (job.previous_webentity_name && job.previous_webentity_name != we.name ? ' (previously '+job.previous_webentity_name+')' : '')
      })
    }

    function loadWebentities(list){
      if(list.length > 0){
        $scope.status = {message: 'Loading', progress:60}
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

    function feedMainListBack(){

      // This function sends back last jobs to the main list,
      // because we have up to date information on them
      
      var lastCrawljobsIndex = {}
      ,changes = []

      if($scope.lastCrawlJobs && $scope.lastCrawlJobs.length > 0){

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
        populateWebEntityNames()
      }
    }

    function refreshCrawlJobs(){
      var currentTimespan = $scope.timespan
      $scope.status = {message: 'Refreshing crawl jobs'}
      if(currentTimespan == 'all'){
        // TODO
      } else {
        var crawlJobs = $scope.lastCrawlJobs.filter(function(job){
          return job.indexing_status != "FINISHED" && job.crawling_status != "CANCELED"
        }).map(function(job){return job._id})
        
        api.getCrawlJobs(
          {id_list: crawlJobs}
          ,function(crawlJobs){
            if(currentTimespan == $scope.timespan){

              // Enrich
              crawlJobs = crawlJobs.map(utils.consolidateJob)

              var changes = []

              if($scope.showDetails && crawlJobs.length == 1){

                $scope.lastCrawlJobs = crawlJobs

              } else {

                var crawljobsIndex = {}
                crawlJobs.forEach(function(job){
                  crawljobsIndex[job._id] = job
                })

                $scope.lastCrawlJobs.forEach(function(job, i){
                  var updatedJob = crawljobsIndex[job._id]
                  if(updatedJob){
                    if(updatedJob.globalStatus != job.globalStatus){
                      changes.push({type:'full', i:i, job:updatedJob})
                    } else if(updatedJob.nb_crawled_pages != job.nb_crawled_pages
                        || updatedJob.nb_links != job.nb_links
                      ) {
                      changes.push({type:'stats', i:i, job:updatedJob})
                    }
                  }
                })

                changes.forEach(function(change){
                  switch(change.type){
                    case('full'):
                      $scope.lastCrawlJobs[change.i] = change.job
                      break
                    case('stats'):
                      $scope.lastCrawlJobs[change.i].nb_crawled_pages = change.job.nb_crawled_pages
                      $scope.lastCrawlJobs[change.i].nb_unindexed_pages = change.job.nb_unindexed_pages
                      $scope.lastCrawlJobs[change.i].nb_links = change.job.nb_links
                      $scope.lastCrawlJobs[change.i].nb_pages = change.job.nb_pages
                      break
                  }
                })
              }

              feedMainListBack()

              $scope.status = {message: ''}
              $scope.scheduleRefresh()
            }
          }
          ,function(data, status, headers, config){
            $scope.status = {message: 'Error refreshing crawl jobs'}
          }
        )
      }
    }

    function lastCrawlJobs_build(now, timespanMs){
      $scope.lastCrawlJobsSuppl = 0
      $scope.lastCrawlJobs = ($scope.crawlJobs || [])
        .filter(function(job){
          return (now - job.created_at < timespanMs) ||
            (job.indexing_status != "FINISHED" &&
             job.indexing_status != "CANCELED");
        })
        .filter(function(job,i){
          if(i < $scope.lastCrawlJobsMax)
            return true
          $scope.lastCrawlJobsSuppl++
          return false
        })
      loadRequiredWebentities()
    }
  }])
