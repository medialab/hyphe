'use strict';

/* Services */


angular.module('hyphe.services', []).
  value('version', '0.1').
  factory('FileLoader', ['$window', function(win){
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
  }]).
  factory('glossary', [function(){
  	return function(term){
      return term
    }
  }]).
  factory('Parser', [function(){
  	return function(){
  		var ns = this

  		ns.parseCSV = function(data){
  			return ns.CSVToArray(data, ',')
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
  }]).
  factory('extractWebEntities', ['extractCases', 'URL_validate', function(extractCases, URL_validate){
    return function(text){
      var re = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig
        ,raw_urls = text.match(re) || []
        ,urls = raw_urls
          .filter(function(expression){
              return URL_validate(expression)
            })
          .map(function(url){
              if(url.indexOf('http')!=0)
                return 'http://'+url
              return url
            })
      return extractCases(urls)
    }
  }]).
  factory('extractCases', [function(){
    return function(data_array, elementAccessor){
      if(elementAccessor === undefined)
      elementAccessor = function(x){return x}
      
      var temp_result = data_array.map(function(d){
        return {id:elementAccessor(d), content:d}
      }).sort(function(a, b) {
          return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
      })
        
      // Merge Doubles
      var result = []
      for (var i = 0; i < temp_result.length; i++) {
        if (i==0 || temp_result[i - 1].id != temp_result[i].id) {
          result.push(temp_result[i].content)
        }
      }
      
      return result
    }
  }]).
  factory('URL_validate', [function(){
    return function(url){
      var urlregex = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/
      return urlregex.test(url)
    }
  }]);