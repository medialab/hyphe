'use strict';


// Declare app level module which depends on filters, and services
angular.module('hyphe', [
  'ngRoute'
  ,'ui.bootstrap'
  ,'angulartics'
  ,'angulartics.google.analytics'
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

// Route
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {templateUrl: 'views/login.html', controller: 'Login'});
  $routeProvider.when('/login2', {templateUrl: 'views/login2.html', controller: 'Login2'});
  $routeProvider.when('/project/:corpusId/overview', {templateUrl: 'views/overview.html', controller: 'Overview'});
  $routeProvider.when('/project/:corpusId/importurls', {templateUrl: 'views/importurls.html', controller: 'ImportUrls'});
  $routeProvider.when('/project/:corpusId/definewebentities', {templateUrl: 'views/definewebentities.html', controller: 'DefineWebEntities'});
  $routeProvider.when('/project/:corpusId/newCrawl', {templateUrl: 'views/newCrawl.html', controller: 'NewCrawl'});
  $routeProvider.when('/project/:corpusId/checkStartPages', {templateUrl: 'views/checkStartPages.html', controller: 'CheckStartPages'});
  $routeProvider.when('/project/:corpusId/scheduleCrawls', {templateUrl: 'views/scheduleCrawls.html', controller: 'scheduleCrawls'});
  $routeProvider.when('/project/:corpusId/monitorCrawls', {templateUrl: 'views/monitorCrawls.html', controller: 'monitorCrawls'});
  $routeProvider.when('/project/:corpusId/listWebentities', {templateUrl: 'views/listWebentities.html', controller: 'listWebentities'});
  $routeProvider.when('/project/:corpusId/export', {templateUrl: 'views/export.html', controller: 'export'});
  $routeProvider.when('/project/:corpusId/settings', {templateUrl: 'views/settings.html', controller: 'settings'});
  $routeProvider.when('/project/:corpusId/network', {templateUrl: 'views/network.html', controller: 'network'});
  $routeProvider.when('/project/:corpusId/prospect', {templateUrl: 'views/prospect.html', controller: 'prospect'});
  $routeProvider.when('/project/:corpusId/webentity/:webentityId', {templateUrl: 'views/webentity.html', controller: 'webentity'});
  $routeProvider.when('/project/:corpusId/webentity/:webentityId/explorer', {templateUrl: 'views/webentity_explorer.html', controller: 'webentity.explorer', reloadOnSearch: false});
  $routeProvider.when('/project/:corpusId/webentity/:webentityId/pagesNetwork', {templateUrl: 'views/webentity_pagesNetwork.html', controller: 'webentity.pagesNetwork'});
  $routeProvider.otherwise({redirectTo: '/login'});
}])

// Analytics
.config(['$analyticsProvider', function ($analyticsProvider) {
  $analyticsProvider.virtualPageviews(true);
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

  