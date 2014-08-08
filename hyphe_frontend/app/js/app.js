'use strict';


// Declare app level module which depends on filters, and services
angular.module('hyphe', [
  'ngRoute',
  'hyphe.filters',
  'hyphe.services',
  'hyphe.directives',
  'hyphe.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'Login'});
  $routeProvider.when('/overview', {templateUrl: 'partials/overview.html', controller: 'Overview'});
  $routeProvider.when('/importurls', {templateUrl: 'partials/importurls.html', controller: 'ImportUrls'});
  $routeProvider.otherwise({redirectTo: '/login'});
}]);
