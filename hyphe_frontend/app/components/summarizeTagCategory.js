 'use strict';

angular.module('hyphe.summarizeTagCatComponent', [])

  .directive('summarizeTagCat', function($timeout, autocompletion){
    return {
      restrict: 'E'
      ,templateUrl: 'components/summarizeTagCategory.html'
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

        $scope.autoComplete = autocompletion.getTagAutoCompleteFunction($scope.tagCategories)

        function update() {
          $timeout(function(){
            var valuesIndex = {}
            $scope.undefinedValues = 0
            $scope.webentities.forEach(function(webentity){
              if (webentity.tags && webentity.tags.USER && webentity.tags.USER[$scope.tagCat] && webentity.tags.USER[$scope.tagCat].length>0) {
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
          })
        }
      }
    }
  })