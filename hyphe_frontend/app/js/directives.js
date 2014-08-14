'use strict';

/* Directives */


angular.module('hyphe.directives', [])
  
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])

  .directive('hyphePrefixSlider', [function() {
	  return function(scope, elm, attrs) {
	      
	      var opt = scope.$eval(attrs.hyphePrefixSlider) || {}	// allow options to be passed
	      opt.cursor = opt.cursor || 'move'


	      var steps = buildSteps()

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

        function updateDrag(e){
        	console.log('updateDrag')
          $('.draggable').offset({
              left:e.pageX + pos_x - drg_w
          })
        }

        function endDrag() {
        	console.log('endDrag')
          elm
          	.removeClass('draggable')
						.css('z-index', z_idx)
						.parents()
          		.off("mousemove", updateDrag)
        }

        function buildSteps(){

        }
	    }
	}]);
