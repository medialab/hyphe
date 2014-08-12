'use strict';

/* Controllers */

angular.module('hyphe.controllers', [])
  .controller('Login', ['$scope', function($scope) {
  	$scope.currentPage = 'login'
  }])
  .controller('Overview', ['$scope', function($scope) {
    $scope.currentPage = 'overview'
  }])
  .controller('ImportUrls', ['$scope', 'FileLoader', 'glossary', 'Parser', 'extractWebEntities', function($scope, FileLoader, glossary, Parser, extractWebEntities) {
    $scope.currentPage = 'importurls'
    $scope.glossary = glossary
    
    var droppableTextArea = document.getElementById("droppable-text-area")
      ,parser = new Parser()

    $scope.parsingOption = 'csv'

    $scope.dataText = ''
    $scope.csvPreview = [[]]
    $scope.tsvPreview = [[]]
    $scope.textPreview = []
    $scope.headline = true

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

    // Custom filtering for the previews
    // $scope.$watchGroup(['dataText', 'parsingOption', 'headline'], updatePreview)
    $scope.$watch('dataText', updatePreview)
    $scope.$watch('parsingOption', updatePreview)
    $scope.$watch('headline', updatePreview)

    function updatePreview() {
      if($scope.parsingOption=='csv'){
        $scope.csvPreview = buildPreview_table($scope.dataText, 4, 3, 'csv')
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
          ,array_data = ((mode=='tsv')?(parser.parseTSV(data_text)):(parser.parseCSV(data_text)))

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
          $scope.readFile(files[0])
          $scope.dropClass = ''
        })
      }
    }, false)
}])
