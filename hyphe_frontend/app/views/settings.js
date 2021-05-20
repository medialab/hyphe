'use strict';

angular.module('hyphe.settingsController', [])

  .controller('settings', ['$scope', 'api', 'utils', '$location', 'corpus'
  ,function($scope, api, utils, $location, corpus) {
    $scope.MAXPAGES = 50
    $scope.currentPage = 'settings'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId();
    $scope.corpusNotEmpty;
    $scope.corpusSettingsEditMode = false
    $scope.options = {}
    $scope.loading = true
    $scope.destroying = false
    $scope.resetting = false;
    $scope.saving = false;



    $scope.destroy = function(){
    if (confirm('Are you sure you want to PERMANENTLY destroy this corpus?')) {
      $scope.destroying = true
      $scope.status = {message: 'Destroying corpus'};
      api.destroyCorpus({
        id:corpus.getId()
      }, function(){
        $location.path('/project/'+$scope.corpusId+'/');
      }, function(){
        $scope.status = {message: "Error destroying project", background:'danger'};
      })
    }
  }

    $scope.resetCorpus = function(){
      if (confirm('Are you sure you want to reset this corpus?')) {
        $scope.resetting = true;
        $scope.status = {message: 'Resetting corpus'};
        api.resetCorpus({
          id:corpus.getId()
        }, function(){
          $location.path('/project/'+$scope.corpusId+'/overview');
        }, function(){
          $scope.status = {message: "Error resetting project", background:'danger'};
        });
      }
    };

    function checkValid(){
      if ( $scope.ed_defaultStartpagesMode.length < 1 ){
        $scope.status = {message:'You need to select at least one Startpages Mode', background:'danger'}
        return false;
      }
      // if a user enters with the keyboard a non acceptable value, the input sets the variable to undefined
      if ($scope.ed_max_depth === undefined) {
        $scope.status = {message:'max depth must be comprised between 0 and ' + $scope.maxmax_depth, background:'danger'}
        return false;
      }

      if ($scope.nbOfPages < 1 || $scope.nbOfPages > $scope.MAXPAGES){
        $scope.status = {message:'Please enter a valid number of pages as Startpages (between 1 and '+$scope.MAXPAGES+')', background:'danger'}
        return false;
      }

      return true;
    }


    $scope.editSettings = function(save){

      $scope.saving = false;
      if (save) {
        //construction of the array of startpages mode
        $scope.ed_defaultStartpagesMode = [];
        if ($scope.startpages_homepage) {
          $scope.ed_defaultStartpagesMode.push('homepage');
        }
        if ($scope.startpages_prefixes) {
          $scope.ed_defaultStartpagesMode.push('prefixes');
        }
        if ($scope.startpages_pages) {
          $scope.ed_defaultStartpagesMode.push('pages-' + $scope.nbOfPages);
        }

        if (!checkValid()) return;

        $scope.saving = true;

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
          "webarchives": {
            "enabled": $scope.ed_webarchive_enabled,
            "url_prefix": $scope.ed_webarchive_urlprefix,
            "date": $scope.ed_webarchive_date,
          },
          "follow_redirects": $scope.ed_follow_redirects,
          "defaultCreationRule": $scope.ed_defaultCreationRule
        };

        $scope.status = {message: 'Saving new settings'};

        api.setCorpusOptions({
          id: $scope.corpusId,
          options: modifiedOptions
        }, function (options) {
          $scope.options = options;
          $scope.status = {};
          $scope.saving = false;
          console.log("Settings successfully updated");
        },function(data, status, headers, config){
          $scope.status = {message: 'Could not save new settings: '+data[0]['message'], background: 'danger'}
          $scope.saving = false;
          console.error("Settings could not be updated", data, status, headers, config);
        });
      }
      $scope.ed_max_depth             = $scope.options.max_depth;
      $scope.ed_defaultStartpagesMode = $scope.options.defaultStartpagesMode.slice();
      $scope.ed_proxy_host            = $scope.options.proxy.host + "";
      $scope.ed_proxy_port            = $scope.options.proxy.port + 0;
      $scope.ed_webarchive_enabled    = !!$scope.options.webarchives.enabled;
      $scope.ed_webarchive_urlprefix  = $scope.options.webarchives.url_prefix + "";
    // TODO VALIDATE DATE
      $scope.ed_webarchive_date       = $scope.options.webarchives.date;
      $scope.ed_timeout               = $scope.options.phantom.timeout + 0;
      $scope.ed_ajax_timeout          = $scope.options.phantom.ajax_timeout + 0;
      $scope.ed_idle_timeout          = $scope.options.phantom.idle_timeout + 0;
      $scope.ed_whitelist             = $scope.options.phantom.whitelist_domains.slice();
      $scope.ed_follow_redirects      = $scope.options.follow_redirects.slice();
      $scope.ed_defaultCreationRule   = $scope.options.defaultCreationRule + "";
      $scope.startpages_homepage      = $scope.options.defaultStartpagesMode.includes('homepage');
      $scope.startpages_prefixes      = $scope.options.defaultStartpagesMode.includes('prefixes');
      $scope.startpages_pages         = $scope.options.defaultStartpagesMode.some(x => x.startsWith('pages'))
      $scope.corpusSettingsEditMode   = !$scope.corpusSettingsEditMode;

      //define the current number of most cited pages as start pages
      for (var i=0; i<$scope.options.defaultStartpagesMode.length; i++){
        if ($scope.ed_defaultStartpagesMode[i].startsWith('pages')){
          $scope.nbOfPages = parseInt($scope.ed_defaultStartpagesMode[i].split(/-/)[1]);
          break;
        }
      }
    };


    // Init
    $scope.status = {message: "Loading"}
    api.downloadCorpusTLDs(function(){
      api.globalStatus({},
        function(corpus_status){
          $scope.corpus_status=corpus_status;
          $scope.corpusNotEmpty = !!$scope.corpus_status.corpus.traph.webentities.total;
          $scope.options = corpus_status.corpus.options;
          $scope.maxmax_depth = corpus_status.hyphe.max_depth;
          $scope.options.follow_redirects.sort();
          $scope.creationrules = corpus_status.corpus.creation_rules.map(function(rule){
            return {
               domain: utils.LRU_to_URL(rule.prefix).replace(/^https?:\/\//, '') || "DEFAULT RULE"
              ,type: rule.name
              ,https: rule.prefix.indexOf('s:https') === 0
            };
          })
          $scope.loading = false
          $scope.status = {};


        },function(data, status, headers, config){
          
          $scope.status = {message: "Error while getting options", background:'danger'};

        });
    });

  }])
