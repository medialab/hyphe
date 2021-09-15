'use strict';

angular.module('hyphe.settingsController', [])

  .controller('settings', ['$scope', 'api', 'utils', '$location', 'corpus'
  ,function($scope, api, utils, $location, corpus) {
    $scope.MAXPAGES = 50
    $scope.currentPage = 'settings'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()
    $scope.corpusNotEmpty
    $scope.corpusSettingsEditMode = false
    $scope.options = {}
    $scope.loading = true
    $scope.destroying = false
    $scope.resetting = false
    $scope.saving = false
    $scope.date_error = ""


    $scope.destroy = function(){
      if (confirm('Are you sure you want to PERMANENTLY destroy this corpus?')) {
        $scope.destroying = true
        $scope.status = {message: 'Destroying corpus'}
        api.destroyCorpus({
          id:corpus.getId()
        }, function(){
          $location.path('/project/'+$scope.corpusId+'/')
        }, function(){
          $scope.status = {message: "Error destroying project", background:'danger'}
        })
      }
    }

    $scope.resetCorpus = function(){
      if (confirm('Are you sure you want to reset this corpus?')) {
        $scope.resetting = true
        $scope.status = {message: 'Resetting corpus'}
        api.resetCorpus({
          id:corpus.getId()
        }, function(){
          $location.path('/project/'+$scope.corpusId+'/overview')
        }, function(){
          $scope.status = {message: "Error resetting project", background:'danger'}
        })
      }
    }

    function checkValid(){
      if ( $scope.ed_defaultStartpagesMode.length < 1 ){
        $scope.status = {message:'You need to select at least one Startpages Mode', background:'danger'}
        return false
      }
      // if a user enters with the keyboard a non acceptable value, the input sets the variable to undefined
      if ($scope.ed_max_depth === undefined) {
        $scope.status = {message:'max depth must be comprised between 0 and ' + $scope.maxmax_depth, background:'danger'}
        return false
      }

      if ($scope.nbOfPages < 1 || $scope.nbOfPages > $scope.MAXPAGES){
        $scope.status = {message:'Please enter a valid number of pages as Startpages (between 1 and '+$scope.MAXPAGES+')', background:'danger'}
        return false
      }

      return true
    }

    $scope.webarchives_periods = {
      0: "Only that date",
      1: "a day",
      3: "3 days",
      7: "a week",
      14: "2 weeks",
      30: "a month",
      91: "3 months",
      182: "6 months",
      "custom": "Custom",
      "infinity": "Whatever"
    }
    $scope.infinityRange = 50 * 365

    $scope.setArchivesMinMaxDate = function() {
      $scope.ed_webarchive_date = document.getElementById('datepicker').value
      $scope.date_error = ""
      if ($scope.ed_webarchive_daysrange_custom === undefined || $scope.ed_webarchive_daysrange_choice === undefined) {
        $scope.ed_webarchive_option = $scope.options.webarchives_option || ""
        if ($scope.options.webarchives_days_range === $scope.infinityRange) {
          $scope.ed_webarchive_daysrange_choice = 'infinity'
          $scope.ed_webarchive_daysrange_custom = $scope.infinityRange / 2
        } else {
          $scope.ed_webarchive_daysrange_custom = Math.trunc($scope.options.webarchives_days_range / 2)
          if (Object.keys($scope.webarchives_periods).map(x => 2*x).indexOf($scope.options.webarchives_days_range) == -1) {
            $scope.ed_webarchive_daysrange_choice = 'custom'
          } else {
            $scope.ed_webarchive_daysrange_choice = $scope.options.webarchives_days_range / 2
          }
        }
      }

      $scope.webarchives_chosen_option = $scope.webarchives_options.filter(function(o) { return o.id === $scope.ed_webarchive_option})[0]
      $scope.min_allowed_webarchives_date = new Date($scope.webarchives_chosen_option.min_date || "1995-01-01")
      $scope.max_allowed_webarchives_date = new Date()

      if ($scope.ed_webarchive_daysrange_choice === 'custom') {
        $scope.ed_webarchive_daysrange = $scope.ed_webarchive_daysrange_custom + 0
        $scope.webarchives_days_range_display = $scope.ed_webarchive_daysrange + " days"
      } else {
        if ($scope.ed_webarchive_daysrange_choice === 'infinity') {
          $scope.ed_webarchive_daysrange = $scope.infinityRange / 2
        } else {
          $scope.ed_webarchive_daysrange = parseInt($scope.ed_webarchive_daysrange_choice)
        }
        $scope.webarchives_days_range_display = $scope.webarchives_periods[$scope.ed_webarchive_daysrange_choice]
      }

      if ($scope.ed_webarchive_option !== '') {
        try {
          if (!/^\d{4}-\d{2}-\d{2}$/.test($scope.ed_webarchive_date)) {
            $scope.date_error = "This is not a valid date, the format should be YYYY-MM-DD."
            return
          }
          var dat = new Date($scope.ed_webarchive_date)
          if (dat < $scope.min_allowed_webarchives_date || dat > $scope.max_allowed_webarchives_date) {
            $scope.date_error = "This web archive only ranges from " + $scope.min_allowed_webarchives_date.toISOString().slice(0, 10) + " to " + $scope.max_allowed_webarchives_date.toISOString().slice(0, 10)
            return
          }
          dat.setDate(dat.getDate() - $scope.ed_webarchive_daysrange)
          $scope.webarchives_mindate = ($scope.ed_webarchive_daysrange_choice === 'infinity' ? $scope.min_allowed_webarchives_date : dat).toISOString().slice(0, 10)
          dat.setDate(dat.getDate() + 2 * $scope.ed_webarchive_daysrange)
          $scope.webarchives_maxdate = ($scope.ed_webarchive_daysrange_choice === 'infinity' ? $scope.max_allowed_webarchives_date : dat).toISOString().slice(0, 10)
        } catch(e) {
          $scope.date_error = "This is not a valid date, the format should be YYYY-MM-DD."
        }
      }
    }

    $scope.editSettings = function(save){

      $scope.saving = false
      $scope.corpusSettingsEditMode = !$scope.corpusSettingsEditMode
      if (save) {
        //construction of the array of startpages mode
        $scope.ed_defaultStartpagesMode = []
        if ($scope.startpages_homepage) {
          $scope.ed_defaultStartpagesMode.push('homepage')
        }
        if ($scope.startpages_prefixes) {
          $scope.ed_defaultStartpagesMode.push('prefixes')
        }
        if ($scope.startpages_pages) {
          $scope.ed_defaultStartpagesMode.push('pages-' + $scope.nbOfPages)
        }

        if (!checkValid()) return

        $scope.saving = true

        var modifiedOptions = {
          "max_depth": $scope.ed_max_depth,
          "defaultStartpagesMode": $scope.ed_defaultStartpagesMode,
          "proxy": {
            "port": $scope.ed_proxy_port,
            "host": $scope.ed_proxy_host
          },
          "phantom": {
            "timeout": $scope.ed_timeout,
            "ajax_timeout": $scope.ed_ajax_timeout,
            "idle_timeout": $scope.ed_idle_timeout,
            "whitelist_domains": $scope.ed_whitelist
          },
          "webarchives_option": $scope.ed_webarchive_option,
          "webarchives_date": $scope.ed_webarchive_date,
          "webarchives_days_range": 2 * $scope.ed_webarchive_daysrange,
          "follow_redirects": $scope.ed_follow_redirects,
          "defaultCreationRule": $scope.ed_defaultCreationRule
        }

        $scope.status = {message: 'Saving new settings'}

        api.setCorpusOptions({
          id: $scope.corpusId,
          options: modifiedOptions
        }, function (options) {
          $scope.options = options
          $scope.status = {}
          $scope.saving = false
          console.log("Settings successfully updated")
        },function(data, status, headers, config){
          $scope.status = {message: 'Could not save new settings: '+data[0]['message'], background: 'danger'}
          $scope.saving = false
          console.error("Settings could not be updated", data, status, headers, config)
        })
      } else {
        $scope.setEditableOptions()
      }
    }

    $scope.setEditableOptions = function() {
      $scope.ed_max_depth             = $scope.options.max_depth
      $scope.ed_proxy_host            = $scope.options.proxy.host + ""
      $scope.ed_proxy_port            = $scope.options.proxy.port + 0
      $scope.ed_timeout               = $scope.options.phantom.timeout + 0
      $scope.ed_ajax_timeout          = $scope.options.phantom.ajax_timeout + 0
      $scope.ed_idle_timeout          = $scope.options.phantom.idle_timeout + 0
      $scope.ed_whitelist             = $scope.options.phantom.whitelist_domains.slice()
      $scope.ed_follow_redirects      = $scope.options.follow_redirects.slice()
      $scope.ed_defaultCreationRule   = $scope.options.defaultCreationRule + ""
      $scope.startpages_homepage      = $scope.options.defaultStartpagesMode.includes('homepage')
      $scope.startpages_prefixes      = $scope.options.defaultStartpagesMode.includes('prefixes')
      $scope.startpages_pages         = $scope.options.defaultStartpagesMode.some(x => x.startsWith('pages'))
      $scope.ed_defaultStartpagesMode = $scope.options.defaultStartpagesMode.slice()

      //define the current number of most cited pages as start pages
      for (var i=0; i<$scope.options.defaultStartpagesMode.length; i++){
        if ($scope.ed_defaultStartpagesMode[i].startsWith('pages')){
          $scope.nbOfPages = parseInt($scope.ed_defaultStartpagesMode[i].split(/-/)[1])
          break;
        }
      }

      $scope.webarchives_chosen_option = $scope.webarchives_options.filter(function(o) { return o.id === $scope.options.webarchives_option})[0]
      $scope.ed_webarchive_option     = $scope.webarchives_chosen_option.id
      $scope.ed_webarchive_date       = $scope.options.webarchives_date
      $scope.datepicker_date          = new Date($scope.options.webarchives_date)
      document.getElementById('datepicker').value = $scope.options.webarchives_date
      $scope.setArchivesMinMaxDate()
    }

    // Init
    $scope.status = {message: "Loading"}
    api.downloadCorpusTLDs(function(){
      api.globalStatus({},
        function(corpus_status){
          $scope.corpus_status = corpus_status
          if (!$scope.corpus_status.corpus.traph) {
            $location.path('/login')
          }
          $scope.corpusNotEmpty = !!$scope.corpus_status.corpus.traph.webentities.total
          $scope.options = corpus_status.corpus.options
          $scope.maxmax_depth = corpus_status.hyphe.max_depth
          $scope.options.follow_redirects.sort()
          $scope.creationrules = corpus_status.corpus.creation_rules.map(function(rule){
            return {
               domain: utils.LRU_to_URL(rule.prefix).replace(/^https?:\/\//, '') || "DEFAULT RULE"
              ,type: rule.name
              ,https: rule.prefix.indexOf('s:https') === 0
            }
          })
          $scope.webarchives_options = corpus_status.hyphe.available_archives
          $scope.setEditableOptions()
          $scope.loading = false
          $scope.status = {}

        },function(data, status, headers, config){
          
          $scope.status = {message: "Error while getting options", background:'danger'}

        })
    }, function(){
      $location.path('/login')
    })

  }])
