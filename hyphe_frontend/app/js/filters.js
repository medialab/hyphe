'use strict';

/* Filters */

angular.module('hyphe.filters', [])
  
  .filter('stripFirst', [function() {
    return function(array) {
      if(array.filter)
        return array.filter(function(d,i){return i>0})
      return array
    }
  }])
  

  .filter('paginate', [function() {
    return function(array,page,paginationLength) {
    	return array.filter(function(d,i){
        return i >= page * paginationLength && i < (page+1) * paginationLength
      })
    }
  }])

  .filter('titlecase', [function () {
    return function (input) {
      var words = input.split(' ');
      for (var i = 0; i < words.length; i++) {
        words[i] = words[i].toLowerCase(); // lowercase everything to get rid of weird casing issues
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
      }
      return words.join(' ');
    }
  }])

;

