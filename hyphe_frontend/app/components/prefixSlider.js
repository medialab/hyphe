'use strict';

angular.module('hyphe.prefixSliderComponent', [])

  .directive('hyphePrefixSlider', ['utils', function(utils){
    return {
      restrict: 'A'
      ,scope: {
        rowActive: '=',
        obj: '=',
        conflictsIndex: '=',
        webentity: '=' // Used only in startpageChecker
      }
      ,templateUrl: 'components/prefixSlider.html'
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

        scope.$watch(function(){ // Watch object change
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
            if(scope.conflictsIndex)
              scope.conflictsIndex.removeFromLruIndex(scope.obj)
            scope.obj.prefixLength = index + 1
            scope.updateNameAndStatus()
            if(scope.conflictsIndex)
              scope.conflictsIndex.addToLruIndex(scope.obj)
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

  .directive('hyphePrefixSliderButton', ['$timeout', function($timeout) {
    return {
      restrict: 'A'
      ,link: function(scope, el, attrs) {

        var opt = scope.$eval(attrs.hyphePrefixSliderButton) || {}  // allow options to be passed
        opt.cursor = opt.cursor || 'move'

        // Keeping an updated version of x-coordinates where the slider makes something happen
        var steps
        scope.sliderHidden = true

        scope.$watch(function(){
            return scope.rowActive
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

        window.addEventListener('resize', updateCoordinates, false);

        var drag_offset
        var predrag_x
        var predrag_z = el.css('z-index')
        var dragging = false

        el.css('cursor', opt.cursor)
          .on("mousedown", startDrag)

        $timeout(function(){
          updateCoordinates(true)
        }, 200)

        return el


        // functions used in this directive

        function startDrag(e) {
          dragging = true
          updateSteps()
          drag_offset = e.pageX
          predrag_x = +el[0].style.left.replace('px', '')
          predrag_z = el.css('z-index')

          e.preventDefault(); // disable selection

          el
            .addClass('draggable')
            .css('z-index', 1000)
            .parent() // .parents()
              .on("mousemove", updateDrag)

          document.body.addEventListener("mouseup", endDrag, {once: true})
        }

        function updateDrag(e) {
          updateSteps()
          var x = predrag_x + e.pageX - drag_offset

          // magnetic steps
          steps.forEach(function(step, i){
            if(Math.abs(step - x) < 12){
              x = step
            }
          })

          // boundaries
          x = applyBoundaries(x)

          el[0].style.left = x + 'px'

          // update prefix
          var closestStepId = -1
          ,cs_dist = Number.MAX_VALUE
          steps.forEach(function(step, i){
            var d = Math.abs(x - step)
            if(d >= 0 && d < cs_dist){
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
          dragging = false
          el
            .removeClass('draggable')
            .css('z-index', predrag_z)
            .parent() // .parents()
              .off("mousemove", updateDrag)
          updatePosition()
        }

        function updateSteps(){
          var elArray = []
          angular.forEach(el.parent().find('span'), function(e){
            elArray.push(e)
          })
          var current = 0
          steps = elArray.map(function(span, i){
            current += span.clientWidth
            return current
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
          if (dragging) { return }
          var x = (steps[(scope.obj.prefixLength || 1)-1] || 0)
          el[0].style.left = x + 'px'
        }

        function updateCoordinates(forceUpdateAll){
          if(forceUpdateAll || !scope.rowActive){
            updateSteps()
            if (steps.length > 0) {
              scope.sliderHidden = false
              updatePosition()
            } else {
              scope.sliderHidden = true
            }
          }
        }
      }
    }
  }])
