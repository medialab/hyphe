'use strict';


// Declare app level module which depends on filters, and services
angular.module('hyphe', [
  'ngRoute'
  ,'ui.bootstrap'
  ,'hyphe.conf'
  ,'hyphe.filters'
  ,'hyphe.services'
  ,'hyphe.service_utils'
  ,'hyphe.service_hyphe_api'
  ,'hyphe.service_glossary'
  ,'hyphe.directives'
  ,'hyphe.controllers'
])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {templateUrl: 'views/login.html', controller: 'Login'});
  $routeProvider.when('/overview', {templateUrl: 'views/overview.html', controller: 'Overview'});
  $routeProvider.when('/importurls', {templateUrl: 'views/importurls.html', controller: 'ImportUrls'});
  $routeProvider.when('/definewebentities', {templateUrl: 'views/definewebentities.html', controller: 'DefineWebEntities'});
  $routeProvider.when('/newCrawl', {templateUrl: 'views/newCrawl.html', controller: 'NewCrawl'});
  $routeProvider.when('/checkStartPages', {templateUrl: 'views/checkStartPages.html', controller: 'CheckStartPages'});
  $routeProvider.when('/scheduleCrawls', {templateUrl: 'views/scheduleCrawls.html', controller: 'scheduleCrawls'});
  $routeProvider.when('/monitorCrawls', {templateUrl: 'views/monitorCrawls.html', controller: 'monitorCrawls'});
  $routeProvider.when('/listWebentities', {templateUrl: 'views/listWebentities.html', controller: 'listWebentities'});
  $routeProvider.when('/export', {templateUrl: 'views/export.html', controller: 'export'});
  $routeProvider.when('/settings', {templateUrl: 'views/settings.html', controller: 'settings'});
  $routeProvider.when('/network', {templateUrl: 'views/network.html', controller: 'network'});
  $routeProvider.otherwise({redirectTo: '/login'});
}]);
