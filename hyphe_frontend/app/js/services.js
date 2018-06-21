'use strict';

/* Services */

angular.module('hyphe.services', [])
  
  .factory('Page', function() {
    var title = 'Hyphe'
      return {
        title: function() { return title; },
        setTitle: function(newTitle) { title = newTitle }
      }
  })

  .factory('FileLoader', ['$window', function(win){
  	return function(){
      this.read = function(file, settings){
        this.reader = new FileReader()

        // Settings
        if(settings.onerror === undefined)
          this.reader.onerror = this.errorHandler
        else
          this.reader.onerror = settings.onerror

        if(settings.onprogress === undefined)
          this.reader.onprogress = function(evt) {
            console.log('file loader: progress ', evt)
          }
        else
          this.reader.onprogress = settings.onprogress

        if(settings.onabort === undefined)
          this.reader.onabort = function(e) {
            alert('File read cancelled')
          }
        else
          this.reader.onabort = settings.onabort

        if(settings.onloadstart === undefined)
          this.reader.onloadstart = function(evt) {
            console.log('file loader: Load start ', evt)
          }
        else
          this.reader.onloadstart = settings.onloadstart

        if(settings.onload === undefined)
          this.reader.onload = function(evt) {
            console.log('file loader: Loading complete ', evt)
          }
        else
          this.reader.onload = settings.onload
        
        this.reader.readAsText(file)
      }

      this.abortRead = function(){
          this.reader.abort()
      }

      this.reader = undefined
      
      this.errorHandler = function(evt){
        var target = evt.target || evt.srcElement
        switch(target.error.code) {
          case target.error.NOT_FOUND_ERR:
            alert('File Not Found!')
            break
          case target.error.NOT_READABLE_ERR:
            alert('File is not readable')
            break
          case target.error.ABORT_ERR:
            break // noop
          default:
            alert('An error occurred reading this file.');
        }
      }
    }
  }])

  .factory('config', ['$injector', function($injector){
    function get(configConstant){
      var data
      try {
        data = $injector.get(configConstant)
      } catch(e) {
        data = undefined
        console.warn('WARNING: "'+configConstant + '" constant not present in frontend config file');
      }
      return data
    }

    return {
      get: get
    }
  }])

  .factory('store', [function(){
    var savedData = {}
    
    function set(key, data){
      savedData[key] = data
    }
    function get(key){
      return savedData[key]
    }
    function remove(key){
      return delete savedData[key]
    }

    return {
      set: set
      ,get: get
      ,remove: remove
    }
  }])

  .factory('networkDisplayThreshold', [function(){
    var ns = {} // namespace
    ns.threshold = undefined
    ns.magnitude = 3
    ns._updateThreshold = function(){
      ns.threshold = Math.pow(10, ns.magnitude)
    }
    ns.up = function(){
      ns.magnitude++
      ns._updateThreshold()
    }
    ns.upTo = function(d){
      ns.magnitude = Math.ceil(Math.log(d)/Math.log(10))
      ns._updateThreshold()
    }
    ns.get = function(){
      return ns.threshold
    }
    ns._updateThreshold()
    return ns
  }])

  .factory('corpus', ['$routeParams', '$location', function($routeParams, $location){
    // NB: corpus id now stored in route

  	var ns = this    // Namespace
    ns.storage = localStorage // alternative: sessionStorage
    ns.prefix = $location.absUrl().split('#')[0]
      .replace($location.protocol() + "://" + $location.host(), '')
    ns.storageKeys = {name: 'hyphe-'+ns.prefix+'-name'}
   
    ns.getId = function(){
      return $routeParams.corpusId
    }

    ns.name = undefined

    ns.setName = function(name){
      ns.storage[ns.storageKeys.name] = name
      ns.name = name
    }
    ns.getName = function(){
      if(ns.name !== undefined)
        return ns.name
      return ns.storage[ns.storageKeys.name]
    }

    return ns
  }])

  .factory('Parser', [function(){
  	return function(){
  		var ns = this    // Namsepace

  		ns.parseCSV = function(data){
        return ns.CSVToArray(data, ',')
      }

      ns.parseSCSV = function(data){
  			return ns.CSVToArray(data, ';')
  		}

  		ns.parseTSV = function(data){
  			return ns.CSVToArray(data, '\t')
  		}

  		// ref: http://stackoverflow.com/a/1293163/2343
	    // This will parse a delimited string into an array of
	    // arrays. The default delimiter is the comma, but this
	    // can be overriden in the second argument.
	    ns.CSVToArray = function( strData, strDelimiter ){
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
          (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
          ),
          "gi"
        )

        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]]

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

          // Get the delimiter that was found.
          var strMatchedDelimiter = arrMatches[ 1 ]

          // Check to see if the given delimiter has a length
          // (is not the start of string) and if it matches
          // field delimiter. If id does not, then we know
          // that this delimiter is a row delimiter.
          if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] )

          }

          var strMatchedValue

          // Now that we have our delimiter out of the way,
          // let's check to see which kind of value we
          // captured (quoted or unquoted).
          if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
              new RegExp( "\"\"", "g" ),
              "\""
              )

          } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ]

          }

          // Now that we have our value string, let's add
          // it to the data array.
          arrData[ arrData.length - 1 ].push( strMatchedValue )
        }

        // Return the parsed data.
        return( arrData )
	    }
  	}
  }])

  .factory('extractURLs', ['utils', function(utils){
    return function(text){
      var re = /(\b((https?|ftp|file|mailto):\/\/|\[[a-f\d:]+\]|([-a-z\d]+\.)+([a-z\d]{2,}|\d)|:\d+|localhost|\S+:\S+@){2,}(\/\S*)?)/ig
        ,raw_urls = text.match(re) || []
        ,urls = raw_urls
          .filter(function(expression){
              return utils.URL_validate(expression)
            })
          .map(function(url){
              if(url.indexOf('://') === -1)
                return 'http://'+url
              return url
            })
      return utils.extractCases(urls)
    }
  }])

  .factory('droppableTextArea', [function(){
    return function(droppableTextArea, $scope, callback){
      if (droppableTextArea) {

        //============== DRAG & DROP =============
        // adapted from http://jsfiddle.net/danielzen/utp7j/

        // init event handlers
        function dragEnterLeave(evt) {
          evt.stopPropagation()
          evt.preventDefault()
          $scope.$apply(function(){
            $scope.dropClass = 'over'
          })
        }
        droppableTextArea.addEventListener("dragenter", dragEnterLeave, false)
        droppableTextArea.addEventListener("dragleave", dragEnterLeave, false)
        droppableTextArea.addEventListener("dragover", function(evt) {
          evt.stopPropagation()
          evt.preventDefault()
          var ok = evt.dataTransfer && evt.dataTransfer.types && evt.dataTransfer.types.indexOf('Files') >= 0
          $scope.$apply(function(){
            $scope.dropClass = ok ? 'over' : 'over-error'
          })
        }, false)
        droppableTextArea.addEventListener("drop", function(evt) {
          // console.log('drop evt:', JSON.parse(JSON.stringify(evt.dataTransfer)))
          evt.stopPropagation()
          evt.preventDefault()
          $scope.$apply(function(){
            $scope.dropClass = 'over'
          })
          var files = evt.dataTransfer.files
          if (files.length == 1) {
            $scope.$apply(function(){
              callback(files[0])
              $scope.dropClass = ''
            })
          }
        }, false)

      } else {
        console.log('Error: No droppable text area')
      }
    }
  }])

  .factory('QueriesBatcher', [function(){
    return function(){
      var ns = this   // namespace

      ns.currentId = 0
      ns.simultaneousQueries = 10
      ns.list = []
      ns.pending = []
      ns.success = []
      ns.fail = []
      ns._atEachFetch = function(list,pending,success,fail){}
      ns._atFinalization = function(list,pending,success,fail){}

      ns.addQuery = function(call, settings, success, fail, options){
        var query = {}
        options = options || {}
        
        query.id = ns.currentId++
        query.call = call
        query.settings = settings
        query.success = success
        query.fail = fail

        if(options.label){
          query.label = options.label
        } else {
          query.label = 'query ' + query.id
        }

        if(options.simultaneousQueries && options.simultaneousQueries > 0){
          ns.simultaneousQueries = options.simultaneousQueries
        }

        query.before = options.before
        query.after = options.after

        ns.list.push(query)
      }

      ns.atEachFetch = function(callback){
        ns._atEachFetch = callback
      }

      ns.atFinalization = function(callback){
        ns._atFinalization = callback
      }

      ns.run = function(){
        ns._fetch()
      }

      ns.abort = function(){
        ns.list = []
        ns.aborted = true
        ns.pending.forEach(function(q){
          ns._move_pending_to_fail(q)
        })
      }

      ns._move_pending_to_success = function(query){
        ns.pending = ns.pending
          .filter(function(q){return q.id != query.id})
        ns.success.push(query)
      }

      ns._move_pending_to_fail = function(query){
        ns.pending = ns.pending
          .filter(function(q){return q.id != query.id})
        ns.fail.push(query)
      }

      ns._fetch = function(){
        if(ns.list.length > 0){
          if(ns.pending.length < ns.simultaneousQueries){
            var query = ns.list.shift() || {}
            
            if(query.before)
              query.before()
            
            if(query.call){
              ns.pending.push(query)
              var launched = 
                query.call(
                    query.settings
                    ,function(data, status, headers, config){
                      if (ns.aborted){
                        return
                      }
                      ns._move_pending_to_success(query)
                      query.success(data, status, headers, config)
                      if(query.after){
                        query.after()
                      }
                      ns._atEachFetch(ns.list, ns.pending, ns.success, ns.fail)
                      ns._fetch()
                    }
                    ,function(data, status, headers, config){
                      if (ns.aborted){
                        return
                      }
                      ns._move_pending_to_fail(query)
                      query.fail(data, status, headers, config)
                      if(query.after){
                        query.after()
                      }
                      ns._atEachFetch(ns.list, ns.pending, ns.success, ns.fail)
                      ns._fetch()
                    }
                  )
              if(!launched){
                ns._move_pending_to_fail(query)
                ns._fetch()
              }
            } else {
              ns.fail.push(query)
              query.fail()
              if(query.after){
                query.after()
              }
              ns._atEachFetch(ns.list, ns.pending, ns.success, ns.fail)
              ns._fetch()
            }
            if(ns.pending.length < ns.simultaneousQueries){
              ns._fetch()
            }
          }
        } else {
          // No more queries
          if(ns.pending.length == 0){
            if(ns._atFinalization && !ns.aborted){
              ns._atFinalization(ns.list, ns.pending, ns.success, ns.fail)
            }
          }
        }
      }
    }
  }])

  .factory('PrefixConflictsIndex', ['utils', function(utils){
    return function(urlList_byId){
      var ns = {}

      ns.index = {}

      ns.LRUVariations = function(obj){
        return utils.LRU_variations(utils.LRU_truncate(obj.lru, obj.truePrefixLength), {
          wwwlessVariations: true
          ,wwwVariations: true
          ,httpVariations: true
          ,httpsVariations: true
          ,smallerVariations: false
        })
      }

      ns.addToLruIndex = function(obj){
        ns.LRUVariations(obj).forEach(function(lru){
          var objId_list = ns.index[lru]
          if(objId_list){
            ns.addConflictsTo(objId_list,obj.id)
            objId_list.push(obj.id)
          } else {
            ns.index[lru] = [obj.id]
          }
        })
      }

      ns.removeFromLruIndex = function(obj){
        ns.LRUVariations(obj).forEach(function(lru){
          var objId_list = ns.index[lru]
          if(!objId_list || objId_list.length == 1){
            // No conflict
            delete ns.index[lru]
          } else {
            var updated_objId_list = objId_list.filter(function(objId){
              return objId != obj.id
            })
            ns.removeConflictsFrom(updated_objId_list, obj.id)
            ns.index[lru] = updated_objId_list
          }
        })
      }

      ns.addConflictsTo = function(old_objId_list, new_objId){
        var new_obj = urlList_byId[new_objId]
        old_objId_list.forEach(function(old_objId){
          var old_obj = urlList_byId[old_objId]
          if (!~new_obj.conflicts.indexOf(old_objId))
            new_obj.conflicts.push(old_objId)
          if (!~old_obj.conflicts.indexOf(new_objId))
            old_obj.conflicts.push(new_objId)
        })
      }

      ns.removeConflictsFrom = function(objId_list, obsolete_objId){
        var obsolete_obj = urlList_byId[obsolete_objId]
        objId_list.forEach(function(objId){
          var obj = urlList_byId[objId]
          obj.conflicts = ns.filterOut(obsolete_objId, obj.conflicts)
          obsolete_obj.conflicts = ns.filterOut(objId, obsolete_obj.conflicts)
        })
      }

      ns.filterOut = function(val, arr){
        return arr.filter(function(d){
          return d != val
        })
      }

      return ns
    }
  }])

  .factory('refreshScheduler', ['$route', '$timeout', function($route, $timeout){
    var ns = {}

    ns.msTimeout_min = 2000
    ns.msTimeout_max = 60000

    ns.msTimeout = ns.msTimeout_min

    ns.refreshToken = 0
    
    ns.schedule = function(slowdown, callback){
      ns.refreshToken++

      var thisToken = ns.refreshToken

      if(slowdown){
        ns.msTimeout = Math.min(ns.msTimeout_max, ns.msTimeout * 2)
      } else {
        ns.msTimeout = ns.msTimeout_min
      }
      
      $timeout(function(){
        if(thisToken == ns.refreshToken && $route.current.loadedTemplateUrl == "views/monitorCrawls.html"){
          
          callback()
        }
      }, ns.msTimeout)
    }

    return ns
  }])

  .factory('autocompletion', function(){
    var ns = {}

    ns.getTagAutoCompleteFunction = function(tagAutocomplete) {
      return function(query, category){
        var searchQuery = ns.searchable(query)
          , res = []
        Object.keys(tagAutocomplete[category] || {})
        .forEach(function(k){
          var candidateTag = ns.searchable(k)
          if (candidateTag && (!searchQuery || ~candidateTag.indexOf(searchQuery))) {
            res.push(k)
          }
        })
        res.sort(function(a,b){return a.localeCompare(b) })
        return res
      }
    }

    ns.searchable = function(str){
      str = str.trim().toLowerCase()
      // remove diacritics
      var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;"
          , to = "aaaaeeeeiiiioooouuuunc------"
      for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
      }
      return str
    }

    return ns
  })
;
