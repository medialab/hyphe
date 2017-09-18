'use strict';

/* Directives */


angular.module('hyphe.directives', [])

  .directive('hyphePrefixSlider', ['utils', function(utils){
    return {
      restrict: 'A'
      ,scope: {
        rowActive: '=',
        obj: '=',
        webentity: '=' // Used only in startpageChecker
      }
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

  .directive('hyphePrefixSliderButton', ['$timeout', function($timeout) {
	  return {
      restrict: 'A'
      ,link: function(scope, el, attrs) {
	      
	      var opt = scope.$eval(attrs.hyphePrefixSliderButton) || {}	// allow options to be passed
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
      ,link: function($scope, el, attrs) {
        el[0].onclick = function(){
          $location.path('/')
          $scope.$apply()
        }
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

  .directive('hypheStartpageChecker', ['utils', 'api', function(utils, api){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/startpageChecker.html'
      ,scope: {
        data: '=',
        resolve: '='
      }
      ,link: function($scope, el, attrs) {
        $scope.url = $scope.data.url
        $scope.webentity = $scope.data.webentity
        $scope.minPrefixLength = (($scope.data.minPrefix || "").match(/\|/g) || []).length - 1
        $scope.wwwVariations = true
        $scope.httpsVariations = true

        // Bootstrapping the object for the Prefix Slider
        var obj = {}
        obj.url = utils.URL_fix($scope.url)
        obj.lru = utils.URL_to_LRU(utils.URL_stripLastSlash(obj.url))
        obj.tld = utils.LRU_getTLD(obj.lru)
        obj.tldLength = obj.tld != ""
        obj.json_lru = utils.URL_to_JSON_LRU(utils.URL_stripLastSlash(obj.url))
        obj.pretty_lru = utils.URL_to_pretty_LRU(utils.URL_stripLastSlash(obj.url))
          .map(function(stem){
              var maxLength = 12
              if(stem.length > maxLength+3){
                return stem.substr(0,maxLength) + '...'
              }
              return stem
            })
        obj.prefixLength = Math.max($scope.minPrefixLength + 1, !!obj.tldLength + 2 + !!obj.json_lru.port)
        obj.truePrefixLength = obj.prefixLength - 1 + obj.tldLength
        obj.conflicts = []
        // obj_setStatus(obj, 'loading')
        $scope.obj = obj

        // Load parent web entities
        api.getLruParentWebentities({
              lru: $scope.obj.lru
            }
            ,function(we_list){
              $scope.obj.parentWebEntities = we_list
              $scope.obj.status = 'loaded'
              if ($scope.data.minPrefix){
                $scope.obj.parentWebEntities.unshift({
                  stems_count: $scope.minPrefixLength + 1
                })
              }
            }
            ,function(data, status, headers, config){
              $scope.obj.status = 'error'
              $scope.obj.errorMessage = 'Oops... The server query failed'
            }
          )

        $scope.cancel = function () {
          $scope.resolve({
            task: {
              type: 'drop',
              url: $scope.data.url
            }
          })
        }

        /*$scope.ok = function () {
          var feedback = {
            task:$scope.obj.task
            ,prefix: utils.LRU_truncate($scope.obj.lru, $scope.obj.truePrefixLength)
            ,wwwVariations: $scope.wwwVariations
            ,httpsVariations: $scope.httpsVariations
          }
          $modalInstance.close(feedback);
        };

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };*/
      }
    }
  }])

;
