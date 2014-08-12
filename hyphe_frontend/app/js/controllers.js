'use strict';

/* Controllers */

angular.module('hyphe.controllers', [])
  .controller('Login', ['$scope', function($scope) {
  	$scope.currentPage = 'login'
  }])
  .controller('Overview', ['$scope', function($scope) {
    $scope.currentPage = 'overview'
  }])
  .controller('ImportUrls', ['$scope', 'FileLoader', 'glossary', 'Parser', 'extractWebEntities', 'droppableTextArea', function($scope, FileLoader, glossary, Parser, extractWebEntities, droppableTextArea) {
    $scope.currentPage = 'importurls'
    $scope.glossary = glossary
    
    var parser = new Parser()

    $scope.parsingOption = 'csv'

    $scope.dataText = ''
    $scope.table
    $scope.columns = []
    $scope.selectedColumns
    $scope.textPreview = []
    $scope.headline = true
    $scope.previewMaxRow = 4
    $scope.previewMaxCol = 3

    
    // Custom filtering for the previews
    // $scope.$watchGroup(['dataText', 'parsingOption', 'headline'], updatePreview)
    $scope.$watch('dataText', updatePreview)
    $scope.$watch('parsingOption', updatePreview)
    $scope.$watch('headline', updatePreview)

    function updatePreview() {
      if($scope.parsingOption=='csv'){
        $scope.table = buildTable($scope.dataText, 'csv')
      }

      if($scope.parsingOption=='scsv'){
        $scope.table = buildTable($scope.dataText, 'scsv')
      }

      if($scope.parsingOption=='tsv'){
        $scope.table = buildTable($scope.dataText, 'tsv')
      }
      
      if($scope.parsingOption=='text'){
        $scope.textPreview = extractWebEntities($scope.dataText)
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
            if(extractWebEntities($scope.dataText).length > 0){
              found = true
              selectedColumnId = i
            }
          })
        }
      }

      $scope.selectedColumn = $scope.table[0][selectedColumnId]
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
          var msg = '[upload starting]'
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
