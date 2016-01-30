'use strict';

angular.module('hyphe.helpController', ['ngSanitize'])

  .controller('help', ['$scope', 'api', 'utils', '$location', 'corpus', 'glossary', '$anchorScroll', '$routeParams'
  ,function($scope, api, utils, $location, corpus, glossary, $anchorScroll, $routeParams) {
    $scope.currentPage = 'help'
    $scope.Page.setTitle('Help')
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    // Build index
    var entryIndex = {}
    var entries = []
    glossary.definitions.forEach(function(d){
      d.entries.forEach(function(e){
        entries.push(e)
        entryIndex[e] = d
      })
    })
    entries = entries.sort(function(a,b){return b.length - a.length})

    $scope.definitions = glossary.definitions
      .map(function(d){
        var tempIndex = []
        d.definitionParsed = d.definition
        entries.forEach(function(e){
          if (d.definitionParsed.indexOf(e) >= 0) {
            var placeholder = '###'+tempIndex.length+'***'
            tempIndex.push(e)
            d.definitionParsed = d.definitionParsed.replace(e, placeholder)
          }
        })
        // Write HTML
        tempIndex.forEach(function(e,i){
          d.definitionParsed = d.definitionParsed.replace('###'+i+'***', '<a href="#/project/'+$scope.corpusId+'/help/entry/'+encodeURIComponent(e)+'">'+e+'</a>')
        })
        return d
      })

    $scope.highlightedEntry =  $routeParams.entry
    if ($scope.highlightedEntry) console.log($scope.highlightedEntry)
  
  }])
