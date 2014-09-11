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
  $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'Login'});
  $routeProvider.when('/overview', {templateUrl: 'partials/overview.html', controller: 'Overview'});
  $routeProvider.when('/importurls', {templateUrl: 'partials/importurls.html', controller: 'ImportUrls'});
  $routeProvider.when('/definewebentities', {templateUrl: 'partials/definewebentities.html', controller: 'DefineWebEntities'});
  $routeProvider.when('/newCrawl', {templateUrl: 'partials/newCrawl.html', controller: 'NewCrawl'});
  $routeProvider.when('/checkStartPages', {templateUrl: 'partials/checkStartPages.html', controller: 'CheckStartPages'});
  $routeProvider.when('/scheduleCrawls', {templateUrl: 'partials/scheduleCrawls.html', controller: 'scheduleCrawls'});
  $routeProvider.when('/monitorCrawls', {templateUrl: 'partials/monitorCrawls.html', controller: 'monitorCrawls'});
  $routeProvider.when('/listWebentities', {templateUrl: 'partials/listWebentities.html', controller: 'listWebentities'});
  $routeProvider.when('/export', {templateUrl: 'partials/export.html', controller: 'export'});
  $routeProvider.otherwise({redirectTo: '/login'});
}]);
