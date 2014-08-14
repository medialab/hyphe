'use strict';

/* Directives */


angular.module('hyphe.directives', [])
  
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])

  .directive('hyphePrefixSlider', ['$route', function($route) {
	  return function(scope, elm, attrs) {
	      
	      var opt = scope.$eval(attrs.hyphePrefixSlider) || {}	// allow options to be passed
	      opt.cursor = opt.cursor || 'move'

        // Keeping an updated
	      var steps
        scope.$watch(function(){  // Watch active state (blurred ancestor)
            var componentRoot = elm.parent().parent().parent().parent()
            ,container = componentRoot.parent()
            return componentRoot.hasClass('blurred') || container.hasClass('blurred')
          }, updateCoordinates)
        scope.$watch(function(){  // Watch coordinates change
            return elm.parent().offset().left
          }, updateCoordinates)
        /*scope.$watch(function(){  // Watch object change
            return scope.obj
          }, updateCoordinates)*/
				$(window).resize(updateCoordinates)
	      
	      var z_idx = elm.css('z-index')
	      ,drg_w = elm.outerWidth()
        ,pos_x = elm.offset().left + drg_w
        
        elm.css('cursor', opt.cursor)
        	.on("mousedown", startDrag)

        return elm

        function startDrag(e) {
          drg_w = elm.outerWidth()
          pos_x = elm.offset().left + drg_w - e.pageX
          z_idx = elm.css('z-index')

          e.preventDefault(); // disable selection

          elm
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
          x = Math.min(steps[steps.length-1], Math.max(steps[0], x))

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
            scope.$apply()
          }
        }

        function endDrag() {
          elm
          	.removeClass('draggable')
						.css('z-index', z_idx)
						.parents()
          		.off("mousemove", updateDrag)
          updatePosition()
        }

        function updateSteps(){
        	steps = elm.parent().find('table>tbody>tr>td').toArray().map(function(td){
        		var $td = $(td)
        		return $td.offset().left + $td.outerWidth()
        	})
        }

        function updateBoundaries(){
          elm.offset({
              left:Math.min(steps[steps.length-1], Math.max(steps[0], elm.offset().left))
          })
        }

        function updatePosition(){
          elm.offset({
              left:steps[(scope.obj.prefixLength || 1)-1]
          })
        }

        function updateCoordinates(){
          var componentRoot = elm.parent().parent().parent().parent()
          ,container = componentRoot.parent()
          if(componentRoot.hasClass('blurred') || container.hasClass('blurred')){
            // we do not check
          } else {
            updateSteps()
            updateBoundaries()
            updatePosition()
          }
        }
	    }
	}]);
