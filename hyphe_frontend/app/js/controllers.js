'use strict';

/* Controllers */

angular.module('hyphe.controllers', [])

  .controller('Login', ['$scope', function($scope) {
  	$scope.currentPage = 'login'
  }])

  .controller('Overview', ['$scope', function($scope) {
    $scope.currentPage = 'overview'
  }])

  .controller('ImportUrls', ['$scope', 'FileLoader', 'glossary', 'Parser', 'extractURLs', 'droppableTextArea', 'store', function($scope, FileLoader, glossary, Parser, extractURLs, droppableTextArea, store) {
    $scope.currentPage = 'importurls'
    $scope.glossary = glossary
    
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
          var msg = '[upload started]'
          $scope.dataText = msg
          $scope.$apply()
        }
        ,onprogress: function(evt){
          // evt is an ProgressEvent
          if (evt.lengthComputable) {
            var msg = '[upload ' + Math.round((evt.loaded / evt.total) * 100) + '% completed]'
            $scope.dataText = msg
            $scope.$apply()
          }
        }
        ,onload: function(evt){
          var target = evt.target || evt.srcElement
          $scope.dataText = target.result
          $scope.$apply()
        }
      })
    }

    // Make the text area droppable
    droppableTextArea(document.getElementById("droppable-text-area"), $scope, $scope.readFile)
  }])

  .controller('DefineWebEntities', ['$scope', 'store', 'utils', function($scope, store, utils) {
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
          obj.prefixLength = obj.pretty_lru.length - 1
          obj.parentWebEntities = [
            {id:1, name:"Webentity-That-Exist.com", prefixLength:3}
            ,{id:2, name:".com TLD", prefixLength:2}
          ]
          return obj
        })

    // Record in model
    $scope.urlList = list


  }])
