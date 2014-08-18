'use strict';

/* Directives */


angular.module('hyphe.directives', [])
  
  .directive('appVersion', ['version', function(version) {
    return function(scope, el, attrs) {
      el.text(version);
    };
  }])

  .directive('hyphePrefixSlider', ['utils', function(utils){
    return {
      restrict: 'A'
      ,templateUrl: 'partials/sub/webentityslider.html'
      ,link: function(scope, el, attrs) {
        
        scope.updateNameAndStatus = function(obj){
          var webentityFound
          obj.parentWebEntities.forEach(function(we){
            if(!webentityFound && we.stems_count == obj.prefixLength){
              webentityFound = we
            }
          })
          if(webentityFound){
            scope.name = webentityFound.name
            scope.statusText = 'Already exists'
            scope.status = 'exists'
          } else {
            scope.name = utils.nameLRU(utils.LRU_truncate(obj.lru, obj.prefixLength))
            scope.statusText = 'New'
            scope.status = 'new'
          }
        }

        scope.updateNameAndStatus(scope.obj)

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
        scope.$watch(function(){  // Watch coordinate changes
            return el.parent().offset().left
          }, updateCoordinates)
        scope.$watch(function(){  // Watch obj changes
            return scope.obj
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
            scope.obj.prefixLength = closestStepId
            scope.updateNameAndStatus(scope.obj)
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
          if(x > steps[steps.length-1])
            x = steps[steps.length-1]
          if(x < steps[1])
            x = steps[1]
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
	}]);
