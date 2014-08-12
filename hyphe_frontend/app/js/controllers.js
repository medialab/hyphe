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
    $scope.csvPreview = [[]]
    $scope.scsvPreview = [[]]
    $scope.tsvPreview = [[]]
    $scope.textPreview = []
    $scope.headline = true

    
    // Custom filtering for the previews
    // $scope.$watchGroup(['dataText', 'parsingOption', 'headline'], updatePreview)
    $scope.$watch('dataText', updatePreview)
    $scope.$watch('parsingOption', updatePreview)
    $scope.$watch('headline', updatePreview)

    function updatePreview() {
      if($scope.parsingOption=='csv'){
        $scope.csvPreview = buildPreview_table($scope.dataText, 4, 3, 'csv')
      }

      if($scope.parsingOption=='scsv'){
        $scope.scsvPreview = buildPreview_table($scope.dataText, 4, 3, 'scsv')
      }

      if($scope.parsingOption=='tsv'){
        $scope.tsvPreview = buildPreview_table($scope.dataText, 4, 3, 'tsv')
      }
      
      if($scope.parsingOption=='text'){
        $scope.textPreview = extractWebEntities($scope.dataText)
      }


      function buildPreview_table(text, maxRow, maxCol, mode) {
        maxRow = maxRow || 3
        maxCol = maxCol || 3

        if(text == '')
          return ''

        var data_text = String(text)
          ,array_data = ((mode=='scsv')?(parser.parseSCSV(data_text)):(mode=='tsv')?(parser.parseTSV(data_text)):(parser.parseCSV(data_text)))

        if(!$scope.headline){
          var headrow = array_data[0].map(function(col, i){return 'Col ' + (i+1)})
          array_data.unshift(headrow)
        }

        var array_data_filtered = array_data
          .filter(function(row,i){
            return i < maxRow
          })
          .map(function(row,i){
            return row.filter(function(col,j){
              return j < maxCol
            })
          })

        return array_data_filtered
      }
    }

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
