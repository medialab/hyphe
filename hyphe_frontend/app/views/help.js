'use strict';

angular.module('hyphe.helpController', ['ngSanitize'])

  .controller('help', function(
    $scope,
    api,
    utils,
    $location,
    corpus,
    glossary,
    $anchorScroll,
    $routeParams,
    $timeout,
    config
  ) {
    $scope.currentPage = 'help'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()
    $scope.hyBro = config.get('hyBroURL')

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
            var elid = "def-"+def.id
            var target = document.getElementById(elid)
            if (target) {
              animate(document.getElementById('scrolling-element'), "scrollTop", "", 0, target.offsetTop - document.getElementById('scrolling-element').offsetTop - 8, 400, true);
            } else {
              console.warn('Cannot find element '+elid)
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

    function animate(elem, style, unit, from, to, time, prop) {
      if (!elem) {
          return;
      }
      var start = new Date().getTime(),
          timer = setInterval(function () {
              var step = Math.min(1, (new Date().getTime() - start) / time);
              if (prop) {
                  elem[style] = (from + step * (to - from))+unit;
              } else {
                  elem.style[style] = (from + step * (to - from))+unit;
              }
              if (step === 1) {
                  clearInterval(timer);
              }
          }, 25);
      if (prop) {
            elem[style] = from+unit;
      } else {
            elem.style[style] = from+unit;
      }
  }
})
