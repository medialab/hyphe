'use strict';

/* Controllers */

angular.module('hyphe.controllers', [])

  .controller('Login', ['$scope', function($scope) {
  	$scope.currentPage = 'login'
  }])



  .controller('Overview', ['$scope', 'api', function($scope, api) {
    $scope.currentPage = 'overview'
    api.getWebentities({light: true}, function(data){
      $scope.webEntities = data
    })
  }])



  .controller('ImportUrls', ['$scope', 'FileLoader', 'Parser', 'extractURLs', 'droppableTextArea', 'store', function($scope, FileLoader, Parser, extractURLs, droppableTextArea, store) {
    $scope.currentPage = 'importurls'
    
    var parser = new Parser()

    $scope.parsingOption = 'csv'

    $scope.dataText = ''
    $scope.table
    $scope.columns = []
    $scope.selectedColumn
    $scope.textPreview = []
    $scope.headline = true
    $scope.previewMaxRow = 4
    $scope.previewMaxCol = 3

    
    // Custom filtering process
    $scope.$watch('dataText', updatePreview)
    $scope.$watch('parsingOption', updatePreview)
    $scope.$watch('headline', updatePreview)

    function updatePreview() {
      // Parse URLs
      if($scope.parsingOption=='text'){
        $scope.textPreview = extractURLs($scope.dataText)
      } else{
        $scope.table = buildTable($scope.dataText, $scope.parsingOption)
      }
      
      // Store parsing results
      if($scope.parsingOption == 'text'){
        store.set('parsedUrls_type', 'list')
        store.set('parsedUrls', $scope.textPreview)
      } else {
        store.set('parsedUrls_type', 'table')
        store.set('parsedUrls', $scope.table)
      }

      function buildTable(text, mode) {
        if(text == '')
          return [[]]

        var data_text = String(text)
          ,array_data = ((mode=='scsv')?(parser.parseSCSV(data_text)):(mode=='tsv')?(parser.parseTSV(data_text)):(parser.parseCSV(data_text)))

        if(!$scope.headline){
          var headrow = array_data[0].map(function(col, i){return 'Col ' + (i+1)})
          array_data.unshift(headrow)
        }

        return array_data
      }
    }

    // Setting the columns list
    $scope.$watch('table', function(){
      // Default: first column
      var selectedColumnId = 0
        ,found = false

      // We look at the column names
      if($scope.table[0]){
        $scope.table[0].forEach(function(col, i){
          var text = col.toLowerCase()
          if(!found && (text.indexOf('url') >= 0 || text.indexOf('adress') >= 0 || text.indexOf('address') >= 0 || text.indexOf('lien') >= 0 || text.indexOf('link') >= 0 || text.indexOf('http') >= 0 || text.indexOf('www') >= 0)){
            found = true
            selectedColumnId = i
          }
        })
      }

      // Else we search for URLs in the first 10 lines
      if(!found && $scope.table[1]){
        for(var row = 1; row < 10 && !found && $scope.table[row]; row++){
          $scope.table[row].forEach(function(col, i){
            if(extractURLs(col).length > 0 && !found){
              found = true
              selectedColumnId = i
            }
          })
        }
      }

      $scope.columns = $scope.table[0].map(function(col, i){return {name:col, id:i}})
      $scope.selectedColumn = $scope.columns[selectedColumnId]

      // Store these settings
      store.set('parsedUrls_settings', {urlColId: selectedColumnId})
    })

    // File loading interactions
    $scope.loadFile = function(){
      $('#hidden-file-input').trigger('click');
    }

    $scope.setFile = function(element) {
      var file = element.files[0]
      $scope.readFile(file)
    }

    $scope.readFile = function(file){
      var fileLoader = new FileLoader()
      fileLoader.read(file, {
        onloadstart: function(evt){
          $scope.status = {message: 'Upload started'}
          $scope.$apply()
        }
        ,onprogress: function(evt){
          // evt is a ProgressEvent
          if (evt.lengthComputable) {
            var msg = 'Upload ' + Math.round((evt.loaded / evt.total) * 100) + '% completed'
            $scope.status = {message: msg, progress:Math.round((evt.loaded / evt.total) * 100)}
            $scope.$apply()
          }
        }
        ,onload: function(evt){
          var target = evt.target || evt.srcElement
          $scope.dataText = target.result
          $scope.status = {}
          $scope.$apply()
        }
      })
    }

    // Make the text area droppable
    droppableTextArea(document.getElementById("droppable-text-area"), $scope, $scope.readFile)
  }])



  .controller('DefineWebEntities', ['$scope', 'store', 'utils', 'api', 'QueriesBatcher', '$location', 
    function($scope, store, utils, api, QueriesBatcher, $location) {
    
    $scope.currentPage = 'definewebentities'
    $scope.activeRow = 0

    // Build the basic list of web entities
    var list
    if(store.get('parsedUrls_type') == 'list'){
      list = store.get('parsedUrls')
        .map(function(url, i){return {id:i, url:url}})

    } else if(store.get('parsedUrls_type') == 'table') {
      var settings = store.get('parsedUrls_settings')
        ,table = store.get('parsedUrls')
      $scope.headline = table.shift().filter(function(d,i){return i != settings.urlColId})
      list = table.map(function(row, i){
        var meta = {}
        table[0].forEach(function(colName,j){
          if(j != settings.urlColId)
            meta[colName] = row[j]
        })
        return {
          id:i
          ,url:row[settings.urlColId]
          ,row:row.filter(function(d,i){return i != settings.urlColId})
          ,meta:meta
        }
      })
    }

    // Clean store
    store.remove('parsedUrls')
    store.remove('parsedUrls_type')
    store.remove('parsedUrls_settings')
    
    if(list){

      // Consolidate the list of web entities
      list = list
        .filter(function(obj){
            return obj.url && utils.URL_validate(obj.url)
          })
        .map(function(obj){
            obj.lru = utils.URL_to_LRU(utils.URL_stripLastSlash(obj.url))
            obj.json_lru = utils.URL_to_JSON_LRU(utils.URL_stripLastSlash(obj.url))
            obj.pretty_lru = utils.URL_to_pretty_LRU(utils.URL_stripLastSlash(obj.url))
              .map(function(stem){
                  var maxLength = 12
                  if(stem.length > maxLength+3){
                    return stem.substr(0,maxLength) + '...'
                  }
                  return stem
                })
            obj.prefixLength = 3
            obj.status = 'loading'
            return obj
          })

      // Pagination
      $scope.paginationLength = 50
      $scope.pages = utils.getRange(Math.ceil(list.length/$scope.paginationLength))
      $scope.page = 0

      $scope.goToPage = function(page){
        if(page >= 0 && page < Math.ceil(list.length/$scope.paginationLength))
          $scope.page = page
      }

      // Record list in model
      $scope.urlList = list

    } else {

      $scope.urlList = []
    }

    if($scope.urlList.length==0){
      $location.path('/importurls')
    }

    // Fetching parent web entities
    var queriesBatcher = new QueriesBatcher()
    $scope.urlList.forEach(function(obj){
      queriesBatcher.addQuery(
          api.getLruParentWebentities   // Query call
          ,{lru: obj.lru}               // Query settings
          ,function(webentities){       // Success callback
              obj.parentWebEntities = webentities
              obj.status = 'loaded'
            }
          ,function(){                  // Fail callback
              console.log('Error while fetching parent webentities for', obj.url)
              obj.status = 'error'
            }
          ,{                            // Options
              label: obj.lru
              ,before: function(){
                  obj.status = 'pending'
                }
            }
        )
    })

    queriesBatcher.atEachFetch(function(list,pending,success,fail){
      var summary = {
        total: list.length + pending.length + success.length + fail.length
        ,pending: pending.length
        ,loaded: success.length + fail.length
      }
      ,percent = Math.round((summary.loaded / summary.total) * 100)
      ,percent_pending = Math.round((summary.pending / summary.total) * 100)
      ,msg = percent + '% loaded'
      $scope.status = {message: msg, progress:percent, progressPending:percent_pending}
    })

    queriesBatcher.atFinalization(function(list,pending,success,fail){
      $scope.status = {}
    })

    queriesBatcher.run()

  }])
