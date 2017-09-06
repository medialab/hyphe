'use strict';

angular.module('hyphe.helpController', ['ngSanitize'])

  .controller('help', ['$scope', 'api', 'utils', '$location', 'corpus', 'glossary', '$anchorScroll', '$routeParams', '$timeout'
  ,function($scope, api, utils, $location, corpus, glossary, $anchorScroll, $routeParams, $timeout) {
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
        d.definitionParsed = htmlEntries(d.definition)
        return d
      })
    $scope.highlightedEntry = $routeParams.entry

    $scope.$watchGroup(['highlightedEntry', 'definitions'], function (newValues, oldValues) {
      $timeout(function () {
        if ($routeParams.entry) {
          $scope.highlightedDefinition = entryIndex[$routeParams.entry.toLowerCase()]
          if ($scope.highlightedDefinition) {
            var def = $scope.highlightedDefinition
              , elid = "#def-"+def.id
            if ($(elid).offset()) {
              $('html, body').animate({
                  scrollTop: $(elid).offset().top - 64
              }, 400);          
            } else {
              console.warn('Cannot find element '+elid, $(elid), $(elid).offset())
            }
          }
        }
      }, 0)
    })

    $scope.hyphePresentation = htmlEntries("As a web crawler, Hyphe allows you to harvest the hyperlinks " +
      "of a collection of web pages by performing a series of “crawl jobs” on demand. " +
      "Pages are aggregated as “web entities” (roughly corresponding to websites) in order " +
      "to reduce the complexity of data. The typical output is a network of web entities to " + 
      "be analyzed through network analysis software such as Gephi.")



    function htmlEntries(html) {
      var tempIndex = []
      var result = html
      entries.forEach(function(e){
        var regEx = new RegExp(e, "i");
        while (result.search(regEx) >= 0) {
          var placeholder = '==='+tempIndex.length+'==='
          tempIndex.push(result.match(regEx)[0])
          result = result.replace(regEx, placeholder)
        }
      })
      // Write HTML
      tempIndex.forEach(function(e,i){
        var regEx = new RegExp('==='+i+'===', "ig");
        result = result.replace(regEx, '<a href="#/project/'+$scope.corpusId+'/help/entry/'+encodeURIComponent(e)+'">'+e+'</a>')
      })
      return result
    }

  
  }])
