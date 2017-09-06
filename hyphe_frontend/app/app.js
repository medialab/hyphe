'use strict';

// Declare app level module which depends on views, and components
angular.module('hyphe', [
  'ngRoute'
  ,'ngMessages'
  ,'ngSanitize'
  ,'ngMaterial'
  ,'angulartics'
  ,'angulartics.google.tagmanager'
  ,'xeditable'
  ,'ngTagsInput'
  ,'hyphe.analytics'
  ,'hyphe.conf'
  ,'hyphe.filters'
  ,'hyphe.services'
  ,'hyphe.service_utils'
  ,'hyphe.service_hyphe_api'
  ,'hyphe.service_glossary'
  ,'hyphe.directives'
  ,'hyphe.controllers'
])

// Default conf settings for retrocompatibility
.value('googleAnalyticsId', '')
.value('disclaimer', '')

// Route
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {templateUrl: 'views/login.html', controller: 'Login'});
  $routeProvider.when('/admin', {templateUrl: 'views/admin.html', controller: 'Admin'});
  $routeProvider.when('/login2', {redirectTo: '/admin'});
  $routeProvider.when('/project/:corpusId/overview', {templateUrl: 'views/overview.html', controller: 'Overview'});
  $routeProvider.when('/project/:corpusId/importurls', {templateUrl: 'views/importurls.html', controller: 'ImportUrls'});
  $routeProvider.when('/project/:corpusId/definewebentities', {templateUrl: 'views/definewebentities.html', controller: 'DefineWebEntities'});
  $routeProvider.when('/project/:corpusId/newCrawl', {templateUrl: 'views/newCrawl.html', controller: 'NewCrawl'});
  $routeProvider.when('/project/:corpusId/prepareCrawls', {templateUrl: 'views/prepareCrawls.html', controller: 'PrepareCrawls'});
  $routeProvider.when('/project/:corpusId/monitorCrawls', {templateUrl: 'views/monitorCrawls.html', controller: 'monitorCrawls'});
  $routeProvider.when('/project/:corpusId/listWebentities', {templateUrl: 'views/listWebentities.html', controller: 'listWebentities'});
  $routeProvider.when('/project/:corpusId/export', {templateUrl: 'views/export.html', controller: 'export'});
  $routeProvider.when('/project/:corpusId/settings', {templateUrl: 'views/settings.html', controller: 'settings'});
  $routeProvider.when('/project/:corpusId/help', {templateUrl: 'views/help.html', controller: 'help'});
  $routeProvider.when('/project/:corpusId/help/entry/:entry', {templateUrl: 'views/help.html', controller: 'help'});
  $routeProvider.when('/project/:corpusId/network', {templateUrl: 'views/network.html', controller: 'network'});
  $routeProvider.when('/project/:corpusId/prospect', {templateUrl: 'views/prospect.html', controller: 'prospect'});
  $routeProvider.when('/project/:corpusId/webentity/:webentityId', {templateUrl: 'views/webentity.html', controller: 'webentity'});
  $routeProvider.when('/project/:corpusId/webentity/:webentityId/explorer', {templateUrl: 'views/webentity_explorer.html', controller: 'webentity.explorer', reloadOnSearch: false});
  $routeProvider.when('/project/:corpusId/webentity/:webentityId/pagesNetwork', {templateUrl: 'views/webentity_pagesNetwork.html', controller: 'webentity.pagesNetwork'});
  $routeProvider.otherwise({redirectTo: '/login'});
}])

// X-Editable
.run(function(editableOptions, editableThemes) {
  editableOptions.theme = 'bs3'; // Can be also 'bs2', 'bs3', 'default'
  editableThemes.bs3.inputClass = 'input-sm';
  editableThemes.bs3.buttonsClass = 'btn-sm';
})

// ngTagsInput
.config(function(tagsInputConfigProvider) {
  tagsInputConfigProvider.setDefaults('tagsInput', {
     minLength: 1
    ,pasteSplitPattern: ""
    ,addOnComma: false
    ,replaceSpacesWithDashes: false
  })
  .setDefaults('autoComplete', {
     minLength: 1
    ,maxResultsToShow: 25
    ,selectFirstMatch: false
    ,loadOnDownArrow: true
    ,loadOnEmpty: true
  })
})

.run(function(editableOptions, editableThemes) {
  editableOptions.theme = 'bs3'; // Can be also 'bs2', 'bs3', 'default'
  editableThemes.bs3.inputClass = 'input-sm';
  editableThemes.bs3.buttonsClass = 'btn-sm';
})

// Analytics
.config(['$analyticsProvider', function ($analyticsProvider) {
  $analyticsProvider.virtualPageviews(true);
}])

.controller('pageCtrl', ['$scope', 'Page'
  ,function($scope, Page) {
    $scope.Page = Page
  }])

angular.module('hyphe.analytics', [])
.run(['googleAnalyticsId', function(googleAnalyticsId) {

  if(googleAnalyticsId) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    ga('create', googleAnalyticsId, 'auto');
  }

}])
