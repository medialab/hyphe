'use strict';

/* Directives */


angular.module('hyphe.directives', [])
  
  .directive('appVersion', ['version', function(version) {
    return function(scope, el, attrs) {
      el.text(version);
    };
  }])

  .directive('hyphePrefixSlider', [function(){
    return {
      restrict: 'A'
      ,templateUrl: 'partials/sub/webentityslider.html'
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

        return el

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
          x = Math.min(steps[steps.length-1], Math.max(steps[1], x))

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
          el
          	.removeClass('draggable')
						.css('z-index', z_idx)
						.parents()
          		.off("mousemove", updateDrag)
          updatePosition()
        }

        function updateSteps(){
        	steps = el.parent().find('table>tbody>tr>td').toArray().map(function(td){
        		var $td = $(td)
        		return $td.offset().left + $td.outerWidth()
        	})
        }

        function updateBoundaries(){
          el.offset({
              left:Math.min(steps[steps.length-1], Math.max(steps[1], el.offset().left))
          })
        }

        function updatePosition(){
          el.offset({
              left:steps[(scope.obj.prefixLength || 1)-1]
          })
        }

        function updateCoordinates(){
          var container = el.parent().parent().parent().parent()
          if(container.hasClass('blurred')){
            // we do not check
          } else {
            updateSteps()
            updateBoundaries()
            updatePosition()
          }
        }
	    }
    }
	}]);
