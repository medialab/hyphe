'use strict';

/* Directives */


angular.module('hyphe.directives', [])

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

  .directive('activityChart', function(
    $timeout
  ){
    return {
      restrict: 'E',
      scope: {
        data: '=',
        statuses: '=',
        logMode: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)
        $scope.$watch('logMode', redraw)
        $scope.$watch('statuses', redraw, true)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        // Data: timestamp in undecided out discovered in_uncrawled in_untagged total
        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');

              window.el = el[0]
              // Setup: dimensions
              var margin = {top: 8, right: 64, bottom: 32, left: 0};
              var width = el[0].offsetWidth - margin.left - margin.right;
              var height = el[0].offsetHeight - margin.top - margin.bottom;

              // While loading redraw may trigger before element being properly sized
              if (width <= 0 || height <= 0) {
                $timeout(redraw, 250)
                return
              }

              var x = d3.scaleTime()
                  .domain(d3.extent($scope.data, function(d) { return new Date(d.timestamp) }))
                  .range([0, width])

              var colorize = function(type){
                if (type=='in') return '#333'
                if (type=='undecided') return '#ADA299'
                if (type=='out') return '#E67E7E'
                if (type=='discovered') return '#75ADDC'
                return '#ff699b' // Error
              }

              // Status list
              var statusList = ['in', 'undecided', 'out', 'discovered']
                .filter(function(d){return $scope.statuses[d]})

              if ($scope.logMode) {

                var y = d3.scaleLog()
                  .domain([1, 1.6 * d3.max($scope.data, function(d){return d3.max(statusList, function(s){return d[s]})})])
                  .range([height, 0])

                var size = function(type){
                  return '3px'
                }

                var line = d3.line()
                  .curve(d3.curveStepBefore)
                  .x(function(d) { return x(new Date(d.timestamp)) })
                  .y(function(d) { return y(d.value) })

                var curves = statusList.map(function(status){
                  return {
                    type: status,
                    values: $scope.data.map(function(d){
                      return {timestamp: d.timestamp, value: d[status]}
                    }).filter(function(d){
                      return d.value > 0
                    })
                  }
                })

                // Setup: SVG container
                var svg = d3.select(el[0]).append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)

                var g = svg.append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

                g.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));

                var formatTick = function(d) { return d };
                var yAxis = d3.axisRight(y)
                  .ticks(8, formatTick)

                g.append("g")
                    .attr("class", "axis axis--y")
                    .attr("transform", "translate(" + width + ", 0)")
                    .call(yAxis)

                var curve = g.selectAll(".curve")
                  .data(curves)
                  .enter().append("g")
                    .attr("class", "curve")

                curve.append("path")
                    .attr("class", "line")
                    .attr("d", function(d) { return line(d.values) })
                    .style("stroke", function(d) { return colorize(d.type) })
                    .style("stroke-width", function(d){ return size(d.type) })
                    .style("fill", "none")

                curve.append("text")
                    .datum(function(d) { return {type: d.type, value: d.values[d.values.length - 1] || 0} })
                    .attr("transform", function(d) { return "translate(" + (x(new Date(d.value.timestamp || 0)) - ((d.type=='in')?(10):(20)) ) + "," + (y(d.value.value || 1) - 10) + ")"; })
                    .attr("x", 3)
                    .attr("dy", "0.35em")
                    .style("font", "10px sans-serif")
                    .style("text-anchor", "end")
                    .style("fill", function(d) { return colorize(d.type) })
                    .text(function(d) { return d.type });

              } else {

                var y = d3.scaleLinear()
                  .domain([0, d3.max($scope.data, function(d){return d3.sum(statusList, function(s){return d[s]})})])
                  .range([height, 0])

                var stack = d3.stack();

                var area = d3.area()
                    .x(function(d, i) { return x(new Date(d.data.timestamp)) })
                    .y0(function(d) { return y(d[0]); })
                    .y1(function(d) { return y(d[1]); });

                // Setup: SVG container
                var svg = d3.select(el[0]).append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)

                var g = svg.append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                stack.keys(statusList)

                var layer = g.selectAll(".layer")
                  .data(stack($scope.data))
                  .enter().append("g")
                    .attr("class", "layer")

                layer.append("path")
                    .attr("class", "area")
                    .style("fill", function(d) { return colorize(d.key) })
                    .attr("d", area)

                layer.filter(function(d) { return y(d[d.length - 1][0]) - y(d[d.length - 1][1]) > 10; })
                  .append("text")
                    .attr("x", width - 6)
                    .attr("y", function(d) { return y((d[d.length - 1][0] + d[d.length - 1][1]) / 2); })
                    .attr("dy", ".35em")
                    .style("font", "10px sans-serif")
                    .style("fill", "#FFF")
                    .style("text-anchor", "end")
                    .text(function(d) { return $scope.data[$scope.data.length - 1][d.key] + ' ' + d.key })

                g.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));

                g.append("g")
                    .attr("class", "axis axis--y")
                    .attr("transform", "translate(" + width + ", 0)")
                    .call(d3.axisRight(y));
                
              }

            })
          }
        }

        function regionValid(d) {
          return $scope.statuses[d] && $scope.statuses[d].available
        }
      }
    }
  })

  .directive('activityChart2', function(
    $timeout
  ){
    return {
      restrict: 'E',
      scope: {
        data: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        // Data: timestamp in undecided out discovered in_uncrawled in_untagged total
        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');

              window.el = el[0]
              // Setup: dimensions
              var margin = {top: 16, right: 64, bottom: 32, left: 0};
              var width = el[0].offsetWidth - margin.left - margin.right;
              var height = el[0].offsetHeight - margin.top - margin.bottom;

              // While loading redraw may trigger before element being properly sized
              if (width <= 0 || height <= 0) {
                $timeout(redraw, 250)
                return
              }

              // Setup: scales
              var x = d3.scaleTime()
                .domain(d3.extent($scope.data, function(d) { return new Date(d.timestamp) }))
                .range([0, width])

              var y = d3.scaleLinear()
                .domain([0, d3.max($scope.data, function(d){return d.in})])
                .range([height, 0])

              var colorize = function(type){
                if (type=='in') return '#333'
                if (type=='in_uncrawled') return '#dcba75'
                if (type=='in_untagged') return '#75dcbd'
                return '#ff699b' // Error
              }
              var size = function(type){
                if (type=='in') return '3px'
                return '2px'
              }

              var line = d3.line()
                .curve(d3.curveStepBefore)
                .x(function(d) { return x(new Date(d.timestamp)) })
                .y(function(d) { return y(d.value) })

              var curves = ['in', 'in_uncrawled', 'in_untagged'].map(function(k){
                return {
                  type: k,
                  values: $scope.data.map(function(d){
                    return {timestamp: d.timestamp, value: d[k]}
                  })
                }
              })

              // Setup: SVG container
              var svg = d3.select(el[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)

              var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

              g.append("g")
                  .attr("class", "axis axis--x")
                  .attr("transform", "translate(0," + height + ")")
                  .call(d3.axisBottom(x));

              g.append("g")
                  .attr("class", "axis axis--y")
                  .attr("transform", "translate(" + width + ", 0)")
                  .call(d3.axisRight(y))

              var curve = g.selectAll(".curve")
                .data(curves)
                .enter().append("g")
                  .attr("class", "curve")

              curve.append("path")
                  .attr("class", "line")
                  .attr("d", function(d) { return line(d.values) })
                  .style("stroke", function(d) { return colorize(d.type) })
                  .style("stroke-width", function(d){ return size(d.type) })
                  .style("fill", "none")

              curve.append("text")
                  .datum(function(d) { return {type: d.type, value: d.values[d.values.length - 1]} })
                  .attr("transform", function(d) { return "translate(" + (x(new Date(d.value.timestamp)) - ((d.type=='in')?(10):(20)) ) + "," + (y(d.value.value) - 10) + ")"; })
                  .attr("x", 3)
                  .attr("dy", "0.35em")
                  .style("font", "10px sans-serif")
                  .style("text-anchor", "end")
                  .style("fill", function(d) { return colorize(d.type) })
                  .text(function(d) { return d.type });
            })
          }
        }

        function regionValid(d) {
          return $scope.statuses[d] && $scope.statuses[d].available
        }
      }
    }
  })

  .directive('rankingsChart', function(
    $timeout
  ){
    return {
      restrict: 'E',
      scope: {
        data: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        // Data: timestamp in undecided out discovered in_uncrawled in_untagged total
        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');

              window.el = el[0]
              // Setup: dimensions
              var margin = {top: 8, right: 8, bottom: 8, left: 8};
              var width = el[0].offsetWidth - margin.left - margin.right;
              var height = el[0].offsetHeight - margin.top - margin.bottom;

              // While loading redraw may trigger before element being properly sized
              if (width <= 0 || height <= 0) {
                $timeout(redraw, 250)
                return
              }

              var data = []
              for (var k in $scope.data) {
                if (k>0) {
                  data.push({indegree: +k, count: +$scope.data[k]})
                }
              }

              // Setup: scales
              var x = d3.scaleLog()
                .domain(d3.extent(data, function(d){return d.count}))
                .range([0, width])

              var y = d3.scaleLog()
                .domain(d3.extent(data, function(d){return d.indegree}))
                .range([height, 0])

              // Setup: SVG container
              var svg = d3.select(el[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)

              var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

              // Axes
              var formatTick = function(d) { return d };
              var xAxis = d3.axisTop(x)
                .ticks(5, formatTick)
                .tickSize(1)
              var yAxis = d3.axisRight(y)
                .ticks(4, formatTick)
                .tickSize(2)

              g.append("g")
                  .attr("class", "axis axis--x")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis)

              g.append("g")
                  .attr("class", "axis axis--y")
                  // .attr("transform", "translate(" + width + ", 0)")
                  .call(yAxis)

              g.selectAll(".domain")
                  .attr("stroke", "#BBB")

              g.selectAll(".tick line")
                  .attr("stroke", "#BBB")

              g.selectAll(".tick text")
                  .attr("fill", "#BBB")

              // add the tooltip area to the webpage
              var tooltip = d3.select("body").append("div")
                  .attr("class", "d3-rankings-tooltip")
                  .style("opacity", 0);

              // Line
              var line = d3.line()
                .x(function(d) { return x(d.count) })
                .y(function(d) { return y(d.indegree) })
              g.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 0.5)
                .attr("d", line)

              // Dots
              g.selectAll("scatter-dots")
                .data(data)
                .enter().append("svg:circle")
                    .attr("cx", function (d,i) { return x(d.count) } )
                    .attr("cy", function (d) { return y(d.indegree) } )
                    .attr("r", 2)
                .on("mouseover", function(d) {
                    tooltip.transition()
                         .duration(200)
                         .style("opacity", .9)
                    tooltip.html(d.count + ' web entities have<br>an indegree of ' + d.indegree)
                         .style("left", (d3.event.pageX + 5) + "px")
                         .style("top", (d3.event.pageY - 28) + "px")
                })
                .on("mouseout", function(d) {
                    tooltip.transition()
                         .duration(500)
                         .style("opacity", 0)
                });


            })
          }
        }

        function regionValid(d) {
          return $scope.statuses[d] && $scope.statuses[d].available
        }
      }
    }
  })

.directive('summarizeTagCat', [function(){
    return {
      restrict: 'E'
      ,templateUrl: 'partials/summarizeTagCategory.html'
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

        $scope.autoComplete = function(query, category){
          var searchQuery = searchable(query)
            , res = []
          Object.keys($scope.tagCategories[category] || {}).forEach(function(searchTag){
            if (searchTag && (!searchQuery || ~searchTag.indexOf(searchQuery))) {
              res.push(searchTag)
            }
          })
          return res
        }

        function update() {
          var valuesIndex = {}
          $scope.undefinedValues = 0
          $scope.webentities.forEach(function(webentity){
            if (webentity.tags && webentity.tags.USER && webentity.tags.USER[$scope.tagCat]) {
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
        }

        function searchable(str){
          str = str.trim().toLowerCase()
          // remove diacritics
          var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;"
              , to = "aaaaeeeeiiiioooouuuunc------"
          for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
          }
          return str
        }
      }
    }
  }])
;
