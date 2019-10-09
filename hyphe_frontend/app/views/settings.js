'use strict';

angular.module('hyphe.settingsController', [])

  .controller('settings', ['$scope', 'api', 'utils', '$location', 'corpus'
  ,function($scope, api, utils, $location, corpus) {
    $scope.currentPage = 'settings'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId();
    $scope.corpusNotEmpty = {};
    $scope.corpusSettingsEditMode = false
    $scope.options = {}
    $scope.loading = true
    $scope.destroying = false
    $scope.resetting = false;
    $scope.allStartpagesMode = ['homepage', 'prefixes', 'pages-5'];


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
      else
        return true;
    }

    $scope.toggle = function(item, list){
      var index = list.indexOf(item);
      if (index > -1){
        list.splice(index, 1);
      }
      else{
        list.push(item);
      }
    };

    $scope.editSettings = function(save){
      if (save && checkValid()) {
        $scope.saving = true;
        $scope.status = {message:'Saving new settings'}
        $scope.options.max_depth                 = $scope.ed_max_depth;
        $scope.options.defaultStartpagesMode     = $scope.ed_defaultStartpagesMode;
        $scope.options.proxy.host                = $scope.ed_proxy_host;
        $scope.options.proxy.port                = $scope.ed_proxy_port;
        $scope.options.phantom.timeout           = $scope.ed_timeout;
        $scope.options.phantom.ajax_timeout      = $scope.ed_ajax_timeout ;
        $scope.options.phantom.idle_timeout      = $scope.ed_idle_timeout;
        $scope.options.phantom.whitelist_domains = $scope.ed_whitelist;
        $scope.options.follow_redirects          = $scope.ed_follow_redirects;
        $scope.options.defaultCreationRule       = $scope.ed_defaultCreationRule;

        api.setCorpusOptions({
              id: $scope.corpusId,
              options: $scope.options
        }, function (options) {
          $scope.options = options;
          $scope.status = {};
          console.log("Settings successfully updated");
        },function(){
          $scope.saving = false;
          $scope.status = {message:'Could not save new settings.', background:'danger'}
          console.error("Settings could not be updated");
        });
      }
      $scope.ed_max_depth             = parseInt($scope.options.max_depth);
      $scope.ed_defaultStartpagesMode = $scope.options.defaultStartpagesMode.slice();
      $scope.ed_proxy_host            = $scope.options.proxy.host+"";
      $scope.ed_proxy_port            = $scope.options.proxy.port+0;
      $scope.ed_timeout               = $scope.options.phantom.timeout+0;
      $scope.ed_ajax_timeout          = $scope.options.phantom.ajax_timeout+0;
      $scope.ed_idle_timeout          = $scope.options.phantom.idle_timeout+0;
      $scope.ed_whitelist             = $scope.options.phantom.whitelist_domains.slice();
      $scope.ed_follow_redirects      = $scope.options.follow_redirects.slice();
      $scope.ed_defaultCreationRule   = $scope.options.defaultCreationRule+"";
      $scope.corpusSettingsEditMode   = !$scope.corpusSettingsEditMode;
    };


    // Init
    $scope.status = {message: "Loading"}
    api.downloadCorpusTLDs(function(){
      api.globalStatus({},
        function(corpus_status){
          $scope.corpus_status=corpus_status;
          $scope.corpusNotEmpty=$scope.corpus_status.corpus.traph.webentities.total;
          $scope.options = corpus_status.corpus.options;
          $scope.maxmax_depth = corpus_status.hyphe.max_depth;
          $scope.options.follow_redirects.sort();
          $scope.creationrules = corpus_status.corpus.creation_rules.map(function(rule){
            return {
               domain: utils.LRU_to_URL(rule.prefix).replace(/^https?:\/\//, '') || "DEFAULT RULE"
              ,type: rule.name
              ,https: rule.prefix.indexOf('s:https') == 0
            };
          })
          $scope.loading = false
          $scope.status = {};


        },function(data, status, headers, config){
          
          $scope.status = {message: "Error while getting options", background:'danger'};

        });
    });

  }])
