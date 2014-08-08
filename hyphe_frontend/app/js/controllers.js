'use strict';

/* Controllers */

angular.module('hyphe.controllers', [])
  .controller('Login', ['$scope', function($scope) {
  	$scope.currentPage = 'login'
  }])
  .controller('Overview', ['$scope', function($scope) {
  	$scope.currentPage = 'overview'
  }])
  .controller('ImportUrls', ['$scope', function($scope) {
  	$scope.currentPage = 'importurls'
  	$scope.gloss = function(term){
  		return term
  	}
  	$scope.parsingOption = 'paste_csv'
  }])

