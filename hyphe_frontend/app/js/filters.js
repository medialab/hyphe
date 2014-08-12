'use strict';

/* Filters */

angular.module('hyphe.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]).
  filter('stripFirst', [function() {
    return function(array) {
    	if(array.filter)
	      return array.filter(function(d,i){return i>0})
	    return array
    }
  }]);

