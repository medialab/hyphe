'use strict';

angular.module('hyphe.importurlsController', [])

  .controller('ImportUrls', ['$scope', 'FileLoader', 'Parser', 'extractURLs', 'droppableTextArea', 'store', 'corpus', '$timeout', 'api'
  ,function($scope, FileLoader, Parser, extractURLs, droppableTextArea, store, corpus, $timeout, api) {
    $scope.currentPage = 'importurls'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()
    
    var parser = new Parser()

    $scope.parsingOption = 'text'

    $scope.dataText = ''
    $scope.table
    $scope.columns = []
    $scope.selectedColumn
    $scope.textPreview = []
    $scope.headline = true
    $scope.previewMaxRow = 4
    $scope.previewMaxCol = 3
    $scope.differedLoading = false

    $scope.settingsTouched = false
    $scope.justImported = false
    $scope.justPasted = false
    
    // Custom filtering process
    $scope.$watch('dataText', updatePreview)
    $scope.$watch('parsingOption', updatePreview)
    $scope.$watch('headline', updatePreview)

    // This trick to turn around a bug about textarea initialization
    $timeout(function(){
      $scope.differedLoading = true
      $timeout(function(){
        // Make the text area droppable
        droppableTextArea(document.getElementById("droppable-text-area"), $scope, $scope.readFile)
      }, 10)
    })

    api.globalStatus({}, function(status){
      $scope.available_archives = status.hyphe.available_archives
      store.set('available_archives', status.hyphe.available_archives)
    })

    function updatePreview() {
      
      // Update parsingOption if needed
      if($scope.justPasted){
        $scope.justPasted = false
        if(!$scope.settingsTouched){
          autoSetOption()
        }
      }
      if($scope.justImported){
        $scope.justImported = false
        if(!$scope.settingsTouched){
          autoSetOption()
        }
      }

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

      function autoSetOption(){
        if($scope.dataText.length > 0){
          var firstRow = $scope.dataText.split('\n')[0]
          ,containsTab = firstRow.indexOf('\t') >= 0
          ,containsComa = firstRow.indexOf(',') >= 0
          ,containsSemicolon = firstRow.indexOf(';') >= 0
          ,containsHttp = firstRow.indexOf('http://') >= 0
          
          if(!containsTab && !containsComa && !containsSemicolon){
            $scope.parsingOption = 'text'
          } else if(containsTab && !containsComa && !containsSemicolon){
            $scope.parsingOption = 'tsv'
          } else if(!containsTab && containsComa && !containsSemicolon){
            $scope.parsingOption = 'csv'
          } else if(!containsTab && !containsComa && containsSemicolon){
            $scope.parsingOption = 'scsv'
          }

          if($scope.parsingOption != 'text' && containsHttp){
            $scope.headline = false
          }

        }
      }
    }

    // Setting the columns list
    $scope.$watch('table', function(){
      if($scope.table){

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
      }
    })
  
    $scope.handlePaste = function(){
      // At this point, $scope.dataText is not updated yet
      // So we just notify and we will treat it at next update
      $scope.justPasted = true
    }

    // File loading interactions
    $scope.loadFile = function(){
      var fileInput = document.getElementById('hidden-file-input')
      fileInput.click()
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
          $scope.justImported = true
          $scope.$apply()
        }
      })
    }
  }])
