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

	      var steps
        scope.$watch(function(){  // Look at active state (blurred ancestor)
          var componentRoot = elm.parent().parent().parent().parent()
          ,container = componentRoot.parent()
          return componentRoot.hasClass('blurred') || container.hasClass('blurred')
        }, updateCoordinates)
        scope.$watch(function(){  // Look at active state (blurred ancestor)
          // Look at offset
          return elm.parent().offset().left
        }, updateCoordinates)
				$(window).resize(updateCoordinates)
        /*
        scope.$watch('obj', updateSteps)
        scope.$watch('slidersLoaded', updateSteps)
        */
	      
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
          $('.draggable').offset({
              left:Math.min(steps[steps.length-1], Math.max(steps[0], e.pageX + pos_x - drg_w))
          })
        }

        function endDrag() {
          elm
          	.removeClass('draggable')
						.css('z-index', z_idx)
						.parents()
          		.off("mousemove", updateDrag)
        }

        function updateSteps(){
        	steps = elm.parent().find('table>tbody>tr>td').toArray().map(function(td){
        		var $td = $(td)
        		return $td.offset().left// + $td.width()
        	})
        }

        function updateBoundaries(){
          elm.offset({
              left:Math.min(steps[steps.length-1], Math.max(steps[0], elm.offset().left))
          })
        }

        function updateCoordinates(){
          var componentRoot = elm.parent().parent().parent().parent()
          ,container = componentRoot.parent()
          if(componentRoot.hasClass('blurred') || container.hasClass('blurred')){
            // we do not check
          } else {
            console.log('update coordinates for row '+scope.$index)
            updateSteps()
            updateBoundaries()
          }
        }
	    }
	}]);
