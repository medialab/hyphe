'use strict';

angular.module('hyphe.helpController', ['ngSanitize'])

  .controller('help', ['$scope', 'api', 'utils', '$location', 'corpus', 'glossary'
  ,function($scope, api, utils, $location, corpus, glossary) {
    $scope.currentPage = 'help'
    $scope.Page.setTitle('Help')
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    // Build index
    var index = {}
    var entries = []
    glossary.definitions.forEach(function(d){
      d.entries.forEach(function(e){
        entries.push(e)
        index[e] = d
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
          d.definitionParsed = d.definitionParsed.replace('###'+i+'***', '<em>'+e+'</em>')
        })
        return d
      })




  }])
