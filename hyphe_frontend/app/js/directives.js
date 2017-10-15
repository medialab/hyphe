'use strict';

/* Directives */


angular.module('hyphe.directives', [])

  .directive('hypheStatus', ['utils', function(utils){
    return {
      restrict: 'A'
      ,templateUrl: 'partials/status.html'
    }
  }])

  .directive('webentityLink', [function(){
    return {
      restrict: 'E',
      templateUrl: 'partials/webentitylink.html',
      scope: {
        webentityId: '=',
        corpusId: '='
      }
    }
  }])

  .directive('hypheGlossary', ['glossary', function(glossary){
    return {
      restrict: 'A'
      ,templateUrl: 'partials/glossary_expression.html'
      ,scope: {

      }
      ,link: function(scope, el, attrs) {
        scope.originalExpression = attrs.hypheGlossary
        scope.def = glossary.getDefinition(scope.originalExpression)

      }
    }
  }])

  .directive('ngPressEnter', [function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if(event.which === 13) {
          scope.$eval(attrs.ngPressEnter)
          event.preventDefault()
          scope.$apply()
        }
      })
    }
  }])

  .directive('waterLoader', [function(){
    return {
      restrict: 'A'
      ,templateUrl: 'partials/waterloader.html'
      ,scope: {
        message: '=',
        messageOnly: '=',
        cog: '='
      }
      ,link: function(scope, el, attrs) {

      }
    }
  }])

  .directive('minispinner', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/minispinner.html'
    }
  }])

  .directive('spinner', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/spinner.html'
      ,scope: {
        text: '='
      }
      ,link: function(scope, el, attrs) {
        if(el.hasClass('center')){
          el.find('.spinner-container').addClass('center')
        }
      }
    }
  }])

  .directive('disclaimer', ['disclaimer', '$sce', function(disclaimer, $sce){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/disclaimer.html'
      ,link: function($scope, el, attrs) {
        $scope.display = disclaimer.trim().length > 0
        $scope.disclaimer = $sce.trustAsHtml(disclaimer)
      }
    }
  }])

  .directive('ngCloseCorpus', ['$location', 'corpus', 'api', function($location, corpus, api){
    return {
      restrict: 'A'
      ,link: function($scope, el, attrs) {
        el[0].onclick = function(){
          $location.path('/')
          $scope.$apply()
        }
      }
    }
  }])

  .directive('focusMe', function($timeout) {
    return {
      scope: { trigger: '@focusMe' },
      link: function(scope, element) {
        scope.$watch('trigger', function(value) {
          if(value === "true") {
            $timeout(function() {
              element[0].focus()
            })
          }
        })
      }
    }
  })

  .directive('hypheStatusBox', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/statusbox.html'
      ,scope: {
        statuses: '='
      , counts: '='
      , change: '='
      , disabled: '='
      , vertical: '='
      }
      ,link: function(scope, el, attrs) {
      }
    }
  }])

.directive('summarizeTagCat', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/summarizeTagCategory.html'
      ,scope: {
        tagCat: '=',
        webentities: '=',
        tagCategories: '=',
        setValue: '=',
        deleteValue: '='
      }
      ,link: function($scope, el, attrs) {
        $scope.$watch('tagCat', update)
        $scope.$watch('webentities', update)

        $scope.transformChip = function(chip) {
          return {value: chip, count:0}
        }

        $scope.addValue = function(chip, freetag) {
          var webentities
          if (freetag) {
            webentities = $scope.webentities
          } else {
            webentities = $scope.webentities.filter(function(we){
              return we.tags.USER === undefined
                || we.tags.USER[$scope.tagCat] === undefined
                || we.tags.USER[$scope.tagCat].length == 0
            })
          }
          $scope.setValue(chip.value, $scope.tagCat, webentities)
        }

        $scope.removeValue = function(chip) {
          var webentities = $scope.webentities.filter(function(webentity){
            return webentity.tags.USER
              && webentity.tags.USER[$scope.tagCat]
              && webentity.tags.USER[$scope.tagCat].some(function(val){
                return val == chip.value
              })
          })
          $scope.deleteValue(chip.value, $scope.tagCat, webentities)
        }

        $scope.autoComplete = function(query, category){
          var searchQuery = searchable(query)
            , res = []
          Object.keys($scope.tagCategories[category] || {}).forEach(function(searchTag){
            if (searchTag && (!searchQuery || ~searchTag.indexOf(searchQuery))) {
              res.push(searchTag)
            }
          })
          return res
        }

        function update() {
          var valuesIndex = {}
          $scope.undefinedValues = 0
          $scope.webentities.forEach(function(webentity){
            if (webentity.tags && webentity.tags.USER && webentity.tags.USER[$scope.tagCat]) {
              webentity.tags.USER[$scope.tagCat].forEach(function(val){
                valuesIndex[val] = (valuesIndex[val] || 0) + 1
              })
            } else {
              $scope.undefinedValues++
            }
          })

          $scope.values = []
          var val
          for (val in valuesIndex) {
            $scope.values.push({
              value: val,
              count: valuesIndex[val]
            })
          }
        }

        function searchable(str){
          str = str.trim().toLowerCase()
          // remove diacritics
          var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;"
              , to = "aaaaeeeeiiiioooouuuunc------"
          for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
          }
          return str
        }
      }
    }
  }])
;
