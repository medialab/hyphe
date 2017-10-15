'use strict';

angular.module('hyphe.overviewController', [])

  .controller('Overview', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'overview'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.corpusStatus
    $scope.corpusStatistics
    $scope.loadingStatus = false
    $scope.loadingStatistics = false
    $scope.statusLogMode = false

    $scope.statuses = {in:true, undecided:true, out:true, discovered:true}

    $scope.visualCrawlJobs = [] // Updated on each status load

    // Init
    loadStatus()
    loadStatistics()
    $scope.statusLoop = setInterval(loadStatus, 1000)
    $scope.statisticsLoop = setInterval(loadStatistics, 300000)
    $scope.$on('$destroy', function(){
      clearInterval($scope.statusLoop)
      clearInterval($scope.statisticsLoop)
    })

    // Functions
    function loadStatus(){
      if ($scope.loadingStatus) return;
      $scope.loadingStatus = true
      api.globalStatus({}, function(status){
        $scope.loadingStatus = false
        if (status.corpus.traph.job_running == "Diagnosing"){
          status.corpus.traph.job_running = ""
        }
        $scope.corpusStatus = status
        updateVisualCrawlJobs()
      },function(data, status, headers, config){
        $scope.loadingStatus = false
        $scope.status = {message: 'Error loading status', background:'danger'}
      })
    }

    function loadStatistics() {
      if ($scope.loadingStatistics) return;
      $scope.loadingStatistics = true
      api.corpusStatistics({}, function(data){
        $scope.loadingStatistics = false
        $scope.corpusStatistics = data
        $scope.displayStatistics = data.length > 0 && data[data.length - 1].total > 0
      },function(data, status, headers, config){
        $scope.loadingStatistics = false
        $scope.status = {message: 'Error loading statistics', background:'danger'}
      })
    }

    function updateVisualCrawlJobs() {
      // The goal is to not reinitialize the list each time

      // Add crawl jobs if needed
      for (
        var i = $scope.visualCrawlJobs.length;
        i < $scope.corpusStatus.corpus.crawler.jobs_finished
          + $scope.corpusStatus.corpus.crawler.jobs_pending
          + $scope.corpusStatus.corpus.crawler.jobs_running;
        i++
      ) {
        $scope.visualCrawlJobs.push({status:'finished'})
      }

      // Update the statuses
      $scope.visualCrawlJobs.forEach(function(job, i){
        if (i < $scope.corpusStatus.corpus.crawler.jobs_running) {
          job.status = 'running'
        } else if (i < $scope.corpusStatus.corpus.crawler.jobs_running + $scope.corpusStatus.corpus.crawler.jobs_pending) {
          job.status = 'pending'
        } else {
          job.status = 'finished'
        }
      })
    }

  }])
