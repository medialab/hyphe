'use strict';

/* Directives */


angular.module('hyphe.directives', [])

  .directive('hyphePrefixSlider', ['utils', function(utils){
    return {
      restrict: 'A'
      ,templateUrl: 'partials/webentityslider.html'
      ,link: function(scope, el, attrs) {
        
        // Options
        var opt = scope.$eval(attrs.hyphePrefixSlider) || {}

        scope.updateNameAndStatus = function(){
          var obj = scope.obj
          obj.truePrefixLength = obj.prefixLength - 1 + obj.tldLength
          var webentityFound
          obj.parentWebEntities.forEach(function(we){
            if(!webentityFound && we.stems_count == obj.truePrefixLength){
              webentityFound = we
            }
          })
          if(webentityFound){
            if (webentityFound.name){
              obj.name = webentityFound.name
              if(opt.editMode){
                obj.statusText = 'Merge ' + scope.webentity.name + ' into it?'
                scope.obj.task = {type:'merge', webentity:webentityFound}
              } else {
                obj.statusText = 'Already exists'
                obj.WEstatus = 'exists'
              }
            } else {
              obj.name = 'A creation rule will trigger this prefix'
              scope.obj.task = {type:'addPrefix'}
              obj.statusText = 'Add it to ' + scope.webentity.name + '?'
            }
          } else {
            if(opt.editMode){
              obj.name = 'No web entity defined with this prefix'
              scope.obj.task = {type:'addPrefix'}
              obj.statusText = 'Add it to ' + scope.webentity.name + '?'
            } else {
              obj.name = utils.nameLRU(utils.LRU_truncate(obj.lru, obj.truePrefixLength + !obj.tldLength))
              obj.statusText = 'New'
              obj.WEstatus = 'new'
            }
          }
        }

        scope.$watch(function(){// Watch object change
            return scope.obj
          } ,function(){
            scope.updateNameAndStatus()
          })

        scope.clickableStem = function(index){
          var obj = scope.obj
          return (index != obj.prefixLength - 1 && index >= obj.tldLength + 1 + !!obj.json_lru.port && index >= (scope.minPrefixLength || 0))
        }

        scope.clickStem = function(index){
          if (scope.clickableStem(index)) {
            scope.obj.prefixLength = index + 1
            scope.updateNameAndStatus()
          }
        }

        // Useful for templating
        scope.getRange = function(number){
          var result = []
          for(var i = 1; i<=number; i++){result.push(i)}
          return result
        }
      }
    }
  }])

  .directive('hyphePrefixSliderButton', [function() {
	  return {
      restrict: 'A'
      ,link: function(scope, el, attrs) {
	      
	      var opt = scope.$eval(attrs.hyphePrefixSliderButton) || {}	// allow options to be passed
	      opt.cursor = opt.cursor || 'move'

        // Keeping an updated version of x-coordinates where the slider makes something happen
	      var steps
        
        scope.$watch(function(){  // Watch active state (!.blurred container)
            var container = el.parent().parent().parent().parent()
            return container.hasClass('blurred')
          }, updateCoordinates)
        
        // scope.$watch(function(){  // Watch coordinate changes
        //     return el.parent().offset().left
        //   }, updateCoordinates)
        
        scope.$watch(function(){  // Watch obj changes
            return scope.obj
          }, updateCoordinates)
        
        scope.$watch(function(){  // Watch obj prefix length change
            return scope.obj.prefixLength
          }, updateCoordinates)
        
        scope.$watch(function(){  // Watch steps in DOM
            return el.parent().find('table>tbody>tr>td.stem').length
          }, updateCoordinates)

        $(window).resize(updateCoordinates)

	      var z_idx = el.css('z-index')
	      ,drg_w = el.outerWidth()
        ,pos_x = el.offset().left + drg_w
        
        el.css('cursor', opt.cursor)
        	.on("mousedown", startDrag)

        updateCoordinates(true)

        return el


        // functions used in this directive

        function startDrag(e) {
          updateSteps()
          drg_w = el.outerWidth()
          pos_x = el.offset().left + drg_w - e.pageX
          z_idx = el.css('z-index')

          e.preventDefault(); // disable selection

          el
          	.addClass('draggable')
          	.css('z-index', 1000)
	        	.parents()
          		.on("mousemove", updateDrag)
	        
	        $('body')
	        	.one("mouseup", endDrag)
        }

        function updateDrag(e) {
          updateSteps()
          var x = e.pageX + pos_x - drg_w

          // magnetic steps
          steps.forEach(function(step, i){
            if(Math.abs(step - x) < 12){
              x = step
            }
          })

          // boundaries
          x = applyBoundaries(x)

          $('.draggable').offset({
              left:x
          })

          // update prefix
          var closestStepId = -1
          ,cs_dist = Number.MAX_VALUE
          steps.forEach(function(step, i){
            var d = Math.abs(step - x)
            if(d < cs_dist){
              cs_dist = d
              closestStepId = i+1
            }
          })
          if(scope.obj.prefixLength != closestStepId){
            if(scope.conflictsIndex)
              scope.conflictsIndex.removeFromLruIndex(scope.obj)
            scope.obj.prefixLength = closestStepId
            scope.updateNameAndStatus()
            if(scope.conflictsIndex)
              scope.conflictsIndex.addToLruIndex(scope.obj)
            scope.$apply()
          }
        }

        function endDrag() {
          el
          	.removeClass('draggable')
						.css('z-index', z_idx)
						.parents()
          		.off("mousemove", updateDrag)
          updatePosition()
        }

        function updateSteps(){
        	steps = el.parent().find('table>tbody>tr>td.stem').toArray().map(function(td){
        		var $td = $(td)
        		return $td.offset().left + $td.outerWidth()
        	})
        }

        function updateBoundaries(){
          el.offset({
              left:applyBoundaries(el.offset().left)
          })
        }

        function applyBoundaries(x){
          var minstep = Math.max(scope.minPrefixLength || 0, !!scope.obj.tldLength + 1 + !!scope.obj.json_lru.port)
          if(x > steps[steps.length-1])
            x = steps[steps.length-1]
          if(x < steps[minstep])
            x = steps[minstep]
          return x
        }

        function updatePosition(){
          var container = el.parent().parent().parent().parent()
          if(!container.hasClass('blurred')){
            var x = steps[(scope.obj.prefixLength || 1)-1] || 0
            el.offset({
              left:x
            })
          }
        }

        function updateCoordinates(forceUpdateAll){
          var container = el.parent().parent().parent().parent()
          if(forceUpdateAll || !container.hasClass('blurred')){
            updateSteps()
            updateBoundaries()
            updatePosition()
          }
        }
	  }
    }
	}])

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
        
      }
      ,link: function(scope, el, attrs) {
        scope.waterLoaderMessage = attrs.waterLoader || ''
        scope.messageOnly = (attrs.wlMessageOnly == 'true')
        scope.textDanger = (attrs.wlTextDanger == 'true')
        scope.cog = (attrs.wlCog == 'true')
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

  .directive('webentityTabs', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/webentity_tabs.html'
      ,link: function(scope, el, attrs) {
        /*if(el.hasClass('tab')){
          // el.find('.spinner-container').addClass('center')
        }*/
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
      /*,scope: {
        text: '='
      }*/
      ,link: function($scope, el, attrs) {
        el.click(function(){

          $location.path('/')
          $scope.$apply()
          
          // Note: currently, this button does not close the corpus

          /*
          $scope.status = {message: 'Closing corpus'}
          api.stopCorpus({
            id: corpus.getId()
          }, function(){
            $scope.status = {}
            $location.path('/')
          }, function(){
            $scope.status = {message: 'Error while closing corpus', background: 'danger'}
          })
          */
        })
      }
    }
  }])

  .directive('rangeselector', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/rangeSelector.html'
      ,scope: {
        rangeObj: '='
      }
      ,link: function(scope, el, attrs) {
        
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
      }
      ,link: function(scope, el, attrs) {
      }
    }
  }])

;
