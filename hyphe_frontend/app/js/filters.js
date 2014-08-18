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
  }]);

