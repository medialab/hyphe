'use strict';

/* Controllers */

angular.module('hyphe.controllers', [])
  .controller('Login', ['$scope', function($scope) {
  	$scope.currentPage = 'login'
  }])
  .controller('Overview', ['$scope', function($scope) {
  	$scope.currentPage = 'overview'
  }])
  .controller('ImportUrls', ['$scope', 'fileLoader', function($scope, fileLoader) {
  	$scope.currentPage = 'importurls'
  	$scope.glossary = function(term){
  		return term
  	}
  	$scope.parsingOption = 'paste_csv'
  	$scope.parsingFileOption = ''

    $scope.dataText = ''

  	$scope.loadFile = function(parsingFileOption){
  		$scope.parsingFileOption = parsingFileOption
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

    //============== DRAG & DROP =============
    // adapted from http://jsfiddle.net/danielzen/utp7j/
    var dropbox = document.getElementById("droppable-text-area")

    // init event handlers
    function dragEnterLeave(evt) {
      evt.stopPropagation()
      evt.preventDefault()
      $scope.$apply(function(){
        $scope.dropClass = 'over'
      })
    }
    dropbox.addEventListener("dragenter", dragEnterLeave, false)
    dropbox.addEventListener("dragleave", dragEnterLeave, false)
    dropbox.addEventListener("dragover", function(evt) {
      evt.stopPropagation()
      evt.preventDefault()
      var ok = evt.dataTransfer && evt.dataTransfer.types && evt.dataTransfer.types.indexOf('Files') >= 0
      $scope.$apply(function(){
        $scope.dropClass = ok ? 'over' : 'over-error'
      })
    }, false)
    dropbox.addEventListener("drop", function(evt) {
      console.log('drop evt:', JSON.parse(JSON.stringify(evt.dataTransfer)))
      evt.stopPropagation()
      evt.preventDefault()
      $scope.$apply(function(){
        $scope.dropClass = 'over'
      })
      var files = evt.dataTransfer.files
      if (files.length == 1) {
        $scope.$apply(function(){
          $scope.readFile(files[0])
        })
      }
    }, false)
    //============== DRAG & DROP =============
}])
