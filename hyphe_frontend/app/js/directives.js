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
      , vertical: '='
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

        $scope.ok = function () {
          $scope.resolve({
            task:$scope.obj.task,
            prefix: utils.LRU_truncate($scope.obj.lru, $scope.obj.truePrefixLength),
            wwwVariations: $scope.wwwVariations,
            httpsVariations: $scope.httpsVariations,
            url: $scope.data.url
          })
        }

      }
    }
  }])

  .directive('webentitiesNetworkWidget', function(
    $mdSidenav,
    api,
    $timeout
  ){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/webentitiesNetworkWidget.html'
      ,scope: {
        status: '='
      }
      ,link: function($scope, el, attrs) {
        var pageSize = 100
        $scope.checkLoadAndUpdateCurrentToken = 0

        $scope.statuses = {in:true, out:false, undecided:true, discovered:false}
        $scope.limitDiscovered = ''
        $scope.limitAll = ''
        
        $scope.settings = {
          in: $scope.statuses.in
        , undecided: $scope.statuses.undecided
        , out: $scope.statuses.out
        , discovered: $scope.statuses.discovered
        , limitDiscovered: ''
        , limitAll: ''
        }
        $scope.settingsChanged

        $scope.data = {
          in: {
            loading: false,
            loaded: false,
            token: undefined,
            page: 0,
            total: 0,
            retry: 0,
            webentities: []
          },
          out: {
            loading: false,
            loaded: false,
            token: undefined,
            page: 0,
            total: 0,
            retry: 0,
            webentities: []
          },
          undecided: {
            loading: false,
            loaded: false,
            token: undefined,
            page: 0,
            total: 0,
            retry: 0,
            webentities: []
          },
          discovered: {
            loading: false,
            loaded: false,
            token: undefined,
            page: 0,
            total: 0,
            retry: 0,
            webentities: []
          },
          links: {
            loading: false,
            loaded: false,
            links: []
          }

        }
        $scope.counts
        $scope.loadingStatus
        $scope.loading = true

        $scope.network

        $scope.toggleSidenav = function() {
          $mdSidenav('right').toggle()
        }

        $scope.applySettings = function(){
      
          loadStatus() // Get the number of IN / OUT / UND / DISC

          for(var status in $scope.statuses){
            $scope.settings[status] = $scope.statuses[status]
          }
          $scope.settings.limitDiscovered = $scope.limitDiscovered
          $scope.settings.limitAll = $scope.limitAll

          $scope.touchSettings()
          updateCounts()
          checkLoadAndUpdate(++$scope.checkLoadAndUpdateCurrentToken)
        }

        $scope.revertSettings = function(){
          for(var status in $scope.statuses){
            $scope.statuses[status] = $scope.settings[status]
          }
          $scope.limitDiscovered = $scope.settings.limitDiscovered
          $scope.limitAll = $scope.settings.limitAll
          $scope.touchSettings()
        }

        $scope.touchSettings = function(){

          // Check if difference with current settings
          var difference = false
          for(var status in $scope.statuses){
            if($scope.statuses[status] != $scope.settings[status]){
              difference = true
            }
          }
          if ($scope.limitDiscovered != $scope.settings.limitDiscovered) {
            difference = true
          }
          if ($scope.limitAll != $scope.settings.limitAll) {
            difference = true
          }

          $scope.settingsChanged = difference
        }

        // Init
        $scope.applySettings()

        /// Functions

        function checkLoadAndUpdate(thisToken) {
          
          // Check if some web entities require loading
          var someWebentitiesRequireLoading = ['in', 'out', 'undecided', 'discovered'].some(function(status){
            if ($scope.settings[status] && !$scope.data[status].loaded) {

              // Web entities of a given status require loading
              $scope.loading = true
              if ($scope.data[status].loading && $scope.data[status].token) {
                // Retrieve from query token
                $scope.status = {message:'Loading '+status.toUpperCase()+' web entities', progress: Math.round(100 * $scope.data[status].webentities.length/$scope.data[status].total)}
                api.getResultsPage(
                  {
                    token: $scope.data[status].token
                    ,page: ++$scope.data[status].page
                  }
                  ,function(result){
                    // Stop if this function was called in the meanwhile
                    if ($scope.checkLoadAndUpdateCurrentToken != thisToken) { return }
                    
                    $scope.data[status].webentities = $scope.data[status].webentities.concat(result.webentities)
                    if ($scope.data[status].webentities.length >= $scope.data[status].total) {
                      $scope.data[status].loading = false
                      $scope.data[status].loaded = true
                      $scope.status = {}
                    }
                    checkLoadAndUpdate(thisToken)
                  }
                  ,function(data, status, headers, config){
                    // Stop if this function was called in the meanwhile
                    if ($scope.checkLoadAndUpdateCurrentToken != thisToken) { return }

                    if ($scope.data[status].retry++ < 3){
                      console.warn('Error loading results page: Retry', $scope.data[status].retry)
                      checkLoadAndUpdate(thisToken)
                    } else {
                      console.log('Error loading results page:', data, status, headers, config)
                      $scope.status = {message: 'Error loading results page', background: 'danger'}
                    }
                  }
                )
              } else {
                // Initial query
                $scope.status = {message:'Loading '+status.toUpperCase()+' web entities'}
                $scope.data[status].loading = true
                $scope.data[status].loaded = false
                $scope.data[status].token = undefined
                $scope.data[status].page = 0
                $scope.data[status].retry = 0
                api.getWebentities_byStatus(
                  {
                    status: status.toUpperCase()
                    ,semiLight: true
                    ,count: pageSize
                    ,page: 0
                  }
                  ,function(result){
                    // Stop if this function was called in the meanwhile
                    if ($scope.checkLoadAndUpdateCurrentToken != thisToken) { return }
          
                    $scope.data[status].total = result.total_results
                    $scope.data[status].token = result.token

                    $scope.data[status].webentities = $scope.data[status].webentities.concat(result.webentities)
                    if ($scope.data[status].webentities.length >= $scope.data[status].total) {
                      $scope.data[status].loading = false
                      $scope.data[status].loaded = true
                      $scope.status = {}
                    }
                    checkLoadAndUpdate(thisToken)
                  }
                  ,function(data, status, headers, config){
                    // Stop if this function was called in the meanwhile
                    if ($scope.checkLoadAndUpdateCurrentToken != thisToken) { return }
                    
                    if ($scope.data[status].retry++ < 3){
                      console.warn('Error loading web entities: Retry', $scope.data[status].retry)
                      checkLoadAndUpdate(thisToken)
                    } else {
                      $scope.status = {message: 'Error loading web entities', background: 'danger'}
                    }
                  }
                )
              }
              return true
            } else return false
          })
          if (someWebentitiesRequireLoading) { return }

          // Check if links need loading
          if (!$scope.data.links.loaded) {
            $scope.loading = true
            $scope.status = {message: 'Loading links'}
            $scope.data.links.loading = true
            api.getNetwork(
              {}
              ,function(links){
                $scope.data.links.links = links
                $scope.data.links.loading = false
                $scope.data.links.loaded = true
                $scope.status = {}
                checkLoadAndUpdate(thisToken)
              }
              ,function(data, status, headers, config){
                $scope.status = {message: 'Error loading links', background:'danger'}
              }
            )
            return
          }

          // Update
          $scope.status = {message: 'Building network'}
          buildNetwork()
          $scope.loading = false
          $scope.status = {}
        }

        function buildNetwork() {
          var weIndex = {}
          var stati = ['in', 'out', 'undecided', 'discovered']
          stati.filter(function(status){
              return $scope.settings[status]
            })
            .forEach(function(status){
              $scope.data[status].webentities.forEach(function(we){
                weIndex[we.id] = we
              })
            })
          var validLinks = $scope.data.links.links
            .filter(function(l){
              return weIndex[l[0]] !== undefined && weIndex[l[1]] !== undefined
            })
            .map(function(l, i){
              return {
                key: l[0] + '>' + l[1],
                source: l[0],
                target: l[1],
                attributes: {count:l[2]}
              }
            })

          var g = new Graph({type: 'directed', allowSelfLoops: false})
          g.addNodesFrom(weIndex)
          g.importEdges(validLinks)

          // Filtering: mark nodes for deletion
          var allThreshold = 0
          var discThreshold = 0
          if ($scope.settings.limitAll) {
            allThreshold = +$scope.settings.limitAll.replace('+', '')
          }
          if ($scope.settings.limitDiscovered) {
            discThreshold = +$scope.settings.limitDiscovered.replace('+', '')
          }
          var nodesToDelete = []
          g.nodes().forEach(function(nid){
            var n = g.getNodeAttributes(nid)
            var degree = g.degree(nid)
            if (degree < allThreshold || (n.status == 'DISCOVERED' && degree < discThreshold)) {
              nodesToDelete.push(nid)
            }
          })
          g.dropNodes(nodesToDelete)

          // Color nodes by status
          // TODO: color by other means
          var statusColors = {
            IN:              "#333"
            ,UNDECIDED:      "#ADA299"
            ,OUT:            "#FAA"
            ,DISCOVERED:     "#93BDE0"
          }
          g.nodes().forEach(function(nid){
            var n = g.getNodeAttributes(nid)
            n.color = statusColors[n.status] || '#F00'
          })

          // Size nodes by indegree
          // TODO: size by other means
          g.nodes().forEach(function(nid){
            var n = g.getNodeAttributes(nid)
            n.size = 10 * Math.sqrt(1 + g.inDegree(nid))
          })

          // Init Label and coordinates
          g.nodes().forEach(function(nid){
            var n = g.getNodeAttributes(nid)
            n.x = Math.random()
            n.y = Math.random()
            n.label = n.name
          })

          // Default color for edges
          g.edges().forEach(function(eid){
            var e = g.getEdgeAttributes(eid)
            e.color = '#DDD'
          })

          // Make the graph global for console tinkering
          window.g = g

          $scope.network = g
        }

        function loadStatus(callback){
          if ($scope.loadingStatus) return
          $scope.loadingStatus = true
          api.globalStatus({}, function(status){
            $scope.counts = {
              in: status.corpus.traph.webentities.IN
            , undecided: status.corpus.traph.webentities.UNDECIDED
            , out: status.corpus.traph.webentities.OUT
            , discovered: status.corpus.traph.webentities.DISCOVERED
            }
            $scope.loadingStatus = false
          },function(data, status, headers, config){
            $scope.status = {message: 'Error loading status', background:'danger'}
            $scope.loadingStatus = false
          })
        }

        function updateCounts() {
          $scope.counts = ['in', 'undecided', 'out', 'discovered']
            .filter(function(k){ return $scope.settings[k] })
            .map(function(d){ return d.toUpperCase() }).join(' + ')
        }

      }
    }
  })

.directive('sigmaNetwork', function(
    networkDisplayThreshold
  ){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/sigmaNetwork.html'
      ,scope: {
        network: '='
      }
      ,link: function($scope, el, attrs) {
        $scope.nodesCount
        $scope.edgesCount
        $scope.tooBig = true

        $scope.$watch('network', function(){
          var g = $scope.network
          if ( g===undefined ) return 
          $scope.nodesCount = g.order
          $scope.edgesCount = g.size
          $scope.tooBig = $scope.nodesCount > networkDisplayThreshold.get()
          
          var container = document.getElementById('sigma-div')
          var renderer = new Sigma.WebGLRenderer(container)
          var sigma = new Sigma(g, renderer)
        })

        $scope.displayLargeNetwork = function() {
          networkDisplayThreshold.upTo($scope.nodesCount)
          $scope.tooBig = $scope.nodesCount > networkDisplayThreshold.get()
        }

      }
    }
  })
;
