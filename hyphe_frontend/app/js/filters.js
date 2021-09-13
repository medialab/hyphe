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

  .filter('uppercase', [function () {
    return function (input) {
      return (''+input).toUpperCase()
    }
  }])

  .filter('slugify', [function () {
    return function (input) {
      return input.replace(/[^a-z0-9]/i, '_')
    }
  }])

  .filter('prettyDate', ['utils', function(utils) {
    return function(timestamp) {
      return utils.prettyDate(timestamp)
    }
  }])

  .filter('plural', [function(){
    return function(plural) {
      return (plural > 1 ? 's' : '')
    }
  }])

  .filter('y_ies', [function(){
    return function(plural) {
      return (plural > 1 ? 'ies' : 'y')
    }
  }])

  .filter('were_was', [function(){
    return function(plural) {
      return (plural > 1 ? 'were' : 'was')
    }
  }])

  .filter('none', [function(){
    return function(integer) {
      return (!integer ? 'None' : integer)
    }
  }])

  .filter('no', [function(){
    return function(integer) {
      return (!integer ? 'No' : integer)
    }
  }])

  .filter('date', [function(){
    return function(timestamp) {
      return (new Date(+timestamp)).toLocaleString()
    }
  }])

  .filter('duration', [function(){
    return function(milliseconds) {
      if (milliseconds > 3600000){
        var h = Math.round(milliseconds/3600000)
        return h + " hour" + ((h > 1) ? 's' : '')
      }
      if (milliseconds > 60000){
        var m = Math.round(milliseconds/60000)
        return m + " minute" + ((m > 1) ? 's' : '')
      }
      var s = Math.round(milliseconds/1000)
      return s + " second" + ((s > 1) ? 's' : '')
    }
  }])

  .filter('search', [function(){
    return function(list,query,accessors) {
      var dig
      if(accessors === undefined){
        dig = function(d){return d}
      } else {
        dig = function(d){
          return accessors.map(function(a){
            return d[a].toLowerCase()
          }).join('|')
        }
      }

      query = (''+query).toLowerCase()

      return list.filter(function(item){
        return dig(item).match(query)
      })
    }
  }])

  .filter('filterBoolFieldWhenActive', [function(){
    return function(list, active, field) {
      return list.filter(function(item){
        return !active || item[field]
      })
    }
  }])

  .filter('tagFilter', [function(){
    return function(webentities, filters, tagCategories) {
      var list = webentities
      filters.forEach(function(filterObject){
        var filterFunction = function(){ return true } // Default

        if (filterObject.type == 'special') {
          
          if (filterObject.value == 'untagged') {
            filterFunction = function(webentity){
              var aCategoryIsFilled = false
              var tagCat
              for (tagCat in tagCategories) {
                if (webentity.tags.USER && webentity.tags.USER[tagCat] !== undefined) {
                  aCategoryIsFilled = true
                }
              }
              return !aCategoryIsFilled
            }

          } else if (filterObject.value == 'partiallyUntagged') {
            filterFunction = function(webentity){
              var aCategoryIsUnfilled = false
              var tagCat
              for (tagCat in tagCategories) {
                if (tagCat != 'FREETAGS' && (!webentity.tags.USER || webentity.tags.USER[tagCat] == undefined) ) {
                  aCategoryIsUnfilled = true
                }
              }
              return aCategoryIsUnfilled
            }

          } else if (filterObject.value == 'conflicts') {
            filterFunction = function(webentity){
              var aCategoryhasMultiple = false
              var tagCat
              for (tagCat in tagCategories) {
                if (tagCat != 'FREETAGS' && webentity.tags.USER && webentity.tags.USER[tagCat] && webentity.tags.USER[tagCat].length>1 ) {
                  aCategoryhasMultiple = true
                }
              }
              return aCategoryhasMultiple
            }
          }

        } else if (filterObject.type == 'catUntagged') {
          filterFunction = function(webentity){
            return !webentity.tags.USER
              || webentity.tags.USER[filterObject.tagCat] === undefined
              || webentity.tags.USER[filterObject.tagCat].length == 0
          }

        } else if (filterObject.type == 'cat') {
          filterFunction = function(webentity){
            return webentity.tags.USER
              && webentity.tags.USER[filterObject.tagCat] !== undefined
              && webentity.tags.USER[filterObject.tagCat].some(function(t){return filterObject.values.some(function(d){return d==t})})
          }
        }
        
        list = list.filter(filterFunction)
      })
      return list
    }
  }])

  .filter('lru_to_url', ['utils', function(utils){
    return function(lru) {
      return utils.LRU_to_URL(lru)
    }
  }])

  .filter('cutPrefixToUrl', ['utils', function(utils){
    return function(lru, cut) {
      cut = cut || Infinity
      var cutLru = (lru||'').split('|')
        .filter(function(stem, i){
          return i < cut
        })
        .join('|')
      return utils.LRU_to_URL(cutLru)
    }
  }])

  .filter('sortByField', ['utils', function(utils){
    return utils.sortByField;
  }])

  .filter('toSortedKeysArray', [function(){
    return function(obj){
      if (!(obj instanceof Object)) {
        return obj
      }
      return Object.keys(obj).sort(function(a, b){
        var alc = a.toLowerCase(),
            blc = b.toLowerCase()
        if (alc < blc) return -1
        if (alc > blc) return 1
        return 0
      })
    }
  }])

  .filter('explicitHttpCode', [function () {
    return function (code) {
      code = ''+code
      switch(code){
        case('-1'):
          return 'Connection Refused'
          break
        case('0'):
          return 'Domain name cannot be found'
          break
        case('200'):
          return 'Test Successful'
          break
        case('300'):
          return 'Redirection "Multiple Choices"'
          break
        case('301'):
          return 'Redirection "Moved Permanently"'
          break
        case('302'):
          return 'Redirection "Found"'
          break
        case('303'):
          return 'Redirection "See Other"'
          break
        case('304'):
          return 'Redirection "Not Modified"'
          break
        case('305'):
          return 'Redirection "Use Proxy"'
          break
        case('306'):
          return 'Redirection "Switch Proxy"'
          break
        case('307'):
          return 'Redirection "Temporary Redirect"'
          break
        case('308'):
          return 'Redirection "Permanent Redirect"'
          break
        case('400'):
          return 'Client Error "Bad Request"'
          break
        case('401'):
          return 'Client Error "Unauthorized"'
          break
        case('402'):
          return 'Client Error "Payment Required"'
          break
        case('403'):
          return 'Client Error "Forbidden"'
          break
        case('404'):
          return 'Client Error "Not Found"'
          break
        case('405'):
          return 'Client Error "Method Not Allowed"'
          break
        case('406'):
          return 'Client Error "Not Acceptable"'
          break
        case('407'):
          return 'Client Error "Proxy Authentification Required"'
          break
        case('408'):
          return 'Client Error "Request Timeout"'
          break
        case('409'):
          return 'Client Error "Conflict"'
          break
        case('410'):
          return 'Client Error "Gone"'
          break
        case('411'):
          return 'Client Error "Length Required"'
          break
        case('412'):
          return 'Client Error "Precondition Failed"'
          break
        case('413'):
          return 'Client Error "Request Entity Too Large"'
          break
        case('414'):
          return 'Client Error "Request-URI Too Long"'
          break
        case('415'):
          return 'Client Error "Unsupported Media Type"'
          break
        case('416'):
          return 'Client Error "Requested Range Not Satisfiable"'
          break
        case('417'):
          return 'Client Error "Expectation Failed"'
          break
        case('418'):
          return 'This server appears to be a teapot. True story.'
          break
        case('419'):
          return 'Client Error "Authentication Timeout"'
          break
        case('420'):
          return 'Client Error "Enhance Your Calm / Method Failure"'
          break
        case('422'):
          return 'Client Error "Unprocessable Entity"'
          break
        case('423'):
          return 'Client Error "Locked"'
          break
        case('424'):
          return 'Client Error "Failed Dependency"'
          break
        case('426'):
          return 'Client Error "Upgrade Required"'
          break
        case('428'):
          return 'Client Error "Precondition Required"'
          break
        case('429'):
          return 'Client Error "Too Many Requests"'
          break
        case('431'):
          return 'Client Error "Request Header Fields Too Large"'
          break
        case('440'):
          return 'Client Error "Login Timeout / No Response"'
          break
        case('444'):
          return 'Client Error "No Response"'
          break
        case('449'):
          return 'Client Error "Retry With"'
          break
        case('450'):
          return 'Client Error "Blocked by Windows Parental Controls"'
          break
        case('451'):
          return 'Client Error "Unavailable for Legal Reasons / Redirect"'
          break
        case('494'):
          return 'Client Error "Request Header Too Large"'
          break
        case('495'):
          return 'Client Error "Cert Error"'
          break
        case('496'):
          return 'Client Error "No Cert"'
          break
        case('497'):
          return 'Client Error "HTTP to HTTPS"'
          break
        case('498'):
          return 'Client Error "Token expired/invalid"'
          break
        case('499'):
          return 'Client Error "Client Closed Request / Token Required"'
          break
        case('500'):
          return 'Server Error'
          break
        case('501'):
          return 'Server Error "Not Implemented"'
          break
        case('502'):
          return 'Server Error "Bad Gateway"'
          break
        case('503'):
          return 'Server Error "Service Unavailable"'
          break
        case('504'):
          return 'Server Error "Gateway Timeout"'
          break
        case('505'):
          return 'Server Error "HTTP Version Not Supported"'
          break
        case('506'):
          return 'Server Error "Variant Also Negotiates"'
          break
        case('507'):
          return 'Server Error "Insufficient Storage"'
          break
        case('508'):
          return 'Server Error "Loop Detected"'
          break
        case('509'):
          return 'Server Error "Bandwidth Limit Exceeded"'
          break
        case('510'):
          return 'Server Error "Not Extended"'
          break
        case('511'):
          return 'Server Error "Network Authentication Required"'
          break
        case('520'):
          return 'Server Error "Origin Error"'
          break
        case('521'):
          return 'Server Error "Web server is down"'
          break
        case('522'):
          return 'Server Error "Connection timed out"'
          break
        case('523'):
          return 'Server Error "Proxy Declined Request"'
          break
        case('524'):
          return 'Server Error "A timeout occurred"'
          break
        case('598'):
          return 'Server Error "Network read timeout error"'
          break
        case('599'):
          return 'Server Error "Network connect timeout error"'
          break
      }
      return "Lookup Fail"
    }
  }])

  .filter('arrayToString', [function(){
    return function(arr) {
      arr = arr || []
      return arr.toString().replace(/,/g, ', ')
    }
  }])


  //A filter that handles accents and other characters
    .filter('nonSensitiveFilter', ['autocompletion', function(autocompletion){
      return function(list, query) {
        var searchableQuery = autocompletion.searchable(query)
        return list.filter(function (elem) {
          return ~autocompletion.searchable(elem.name).indexOf(searchableQuery)
        })
      }
    }])

    .filter('cleanArchivesPrefix', [function(){
      return function(url, available_archives) {
        for (var i in available_archives) {
          if (available_archives[i].url_prefix && url.indexOf(available_archives[i].url_prefix) == 0) {
            return url.replace(available_archives[i].url_prefix, "").replace(/^\/?\d+\/http/, "http")
          }
        }
        return url
      }
    }])
;

