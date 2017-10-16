'use strict';

angular.module('hyphe.hypheCurrentActivityComponent', [])
 
.directive('hypheCurrentActivity', function(
    $timeout
  ){
    return {
      restrict: 'E',
      scope: {
        status: '='
      },
      templateUrl: 'components/hypheCurrentActivity.html',
      link: function($scope, el, attrs) {

        $scope.statusListSize = 20
        $scope.lastActivity

        $scope.statusList = []
        $scope.isCrawling = false

        $scope.$watch('status', function(newStatus, oldStatus){
          if (newStatus) {
            $scope.lastActivity = Math.max($scope.status.corpus.traph.last_index, $scope.status.corpus.traph.last_links)
            $scope.statusList.push(newStatus)
            if ($scope.statusList.length > $scope.statusListSize) {
              $scope.statusList.shift()
            }
          }

          // Is it crawling?
          var crawledPagesBefore
          var crawledPagesAfter
          if (oldStatus && oldStatus.corpus && oldStatus.corpus.crawler && oldStatus.corpus.crawler.pages_crawled) {
            crawledPagesBefore = oldStatus.corpus.crawler.pages_crawled
            /*if(oldStatus.corpus.traph && oldStatus.corpus.traph.pages_to_index) {
              crawledPagesBefore += oldStatus.corpus.traph.pages_to_index
            }*/
          }
          if (newStatus && newStatus.corpus && newStatus.corpus.crawler && newStatus.corpus.crawler.pages_crawled) {
            crawledPagesAfter = newStatus.corpus.crawler.pages_crawled
            /*if(newStatus.corpus.traph && newStatus.corpus.traph.pages_to_index) {
              crawledPagesAfter += newStatus.corpus.traph.pages_to_index
            }*/
          }
          
          if (crawledPagesAfter === undefined || crawledPagesBefore === undefined) {
            $scope.isCrawling = false
          } else {
            $scope.isCrawling = crawledPagesAfter > crawledPagesBefore
          }
        })
        
      }
    }
  })

.directive('hcaCrawledPagesChart', function(
    $timeout,
    $mdColors
  ){
    return {
      restrict: 'A',
      scope: {
        statusList: '=',
        statusListSize: '=',
        scale: '='
      },
      link: function($scope, el, attrs) {
        
        $scope.$watch('statusList', redraw, true)
        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.statusList !== undefined){
            $timeout(function(){
              el.html('');

              window.el = el[0]
              // Setup: dimensions
              var margin = {top: 2, right: 0, bottom: 0, left: 0};
              var width = el[0].offsetWidth - margin.left - margin.right;
              var height = el[0].offsetHeight - margin.top - margin.bottom;

              // While loading redraw may trigger before element being properly sized
              if (width <= 0 || height <= 0) {
                $timeout(redraw, 250)
                return
              }

              // Data
              var data = $scope.statusList
                .filter(function(status){
                  return status && status.corpus && status.corpus.crawler
                })
                .map(function(status){
                  return {
                    crawled: status.corpus.crawler.pages_crawled,
                    indexed: status.corpus.crawler.pages_crawled - status.corpus.traph.pages_to_index
                  }
                })

              // Setup: scales
              var x = d3.scaleLinear()
                .domain([0, $scope.statusListSize-1])
                .range([0, width])

              var maxCrawled = d3.max(data, function(d){return d.crawled})
              var y = d3.scaleLinear()
                .domain([Math.max(0, maxCrawled - $scope.scale), maxCrawled])
                .range([height, 0])
              
              var colorizeLine = function(type){
                if (type == 'crawled') return '#328dc7'
                if (type == 'indexed') return $mdColors.getThemeColor('default-warn-900')
                return '#ff699b' // Error
              }

              var colorizeArea = function(type){
                if (type == 'crawled') return $mdColors.getThemeColor('default-warn-300')
                if (type == 'indexed') return $mdColors.getThemeColor('default-background-200')
                return '#ff699b' // Error
              }

              var line = d3.line()
                .curve(d3.curveLinear)
                .x(function(d) { return x(d.x) })
                .y(function(d) { return y(d.value) })

              var area = d3.area()
                .x(function(d) { return x(d.x) })
                .y0(function(d) { return y(0) })
                .y1(function(d) { return y(d.value) })

              var curves = ['crawled', 'indexed'].map(function(k){
                return {
                  type: k,
                  values: data.map(function(d, i){
                    return {x: i, value: d[k]}
                  })
                }
              })

              // Setup: SVG container
              var svg = d3.select(el[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)

              var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

              // Areas
              var areaG = g.selectAll(".area")
                .data(curves)
                .enter().append("g")
                  .attr("class", "area")

              areaG.append("path")
                  .attr("class", "area")
                  .attr("d", function(d) { return area(d.values) })
                  .style("fill", function(d) { return colorizeArea(d.type) })

              // Curves
              var curve = g.selectAll(".curve")
                .data(curves.reverse())
                .enter().append("g")
                  .attr("class", "curve")

              curve.append("path")
                  .attr("class", "line")
                  .attr("d", function(d) { return line(d.values) })
                  .style("stroke", function(d) { return colorizeLine(d.type) })
                  .style("stroke-width", "4px")
                  .style("fill", "none")

              // Axis
              g.append("g")
                  .attr("class", "axis axis--y")
                  .attr("transform", "translate(" + width + ", 0)")
                  .call(d3.axisLeft(y).ticks(5))
                .select(".domain")
                  .remove()

            })
          }
        }
      }
    }
  })

.directive('hcaSimpleChart', function(
    $timeout,
    $mdColors
  ){
    return {
      restrict: 'A',
      scope: {
        statusList: '=',
        statusListSize: '=',
        scale: '=',
        key: '='
      },
      link: function($scope, el, attrs) {
        
        $scope.$watch('statusList', redraw, true)
        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.statusList !== undefined){
            $timeout(function(){
              el.html('');

              window.el = el[0]
              // Setup: dimensions
              var margin = {top: 2, right: 0, bottom: 0, left: 0};
              var width = el[0].offsetWidth - margin.left - margin.right;
              var height = el[0].offsetHeight - margin.top - margin.bottom;

              // While loading redraw may trigger before element being properly sized
              if (width <= 0 || height <= 0) {
                $timeout(redraw, 250)
                return
              }

              // Data
              var data = $scope.statusList
                .filter(function(status){
                  return status && status.corpus && status.corpus.crawler
                })
                .map(function(status, i){
                  return {
                    x: i,
                    value: status.corpus.crawler[$scope.key]
                  }
                })

              // Setup: scales
              var x = d3.scaleLinear()
                .domain([0, $scope.statusListSize-1])
                .range([0, width])

              var maxValue = d3.max(data, function(d){return d.value})
              var y = d3.scaleLinear()
                .domain([Math.max(0, maxValue - $scope.scale), maxValue])
                .range([height, 0])
              
              var lineColor = '#666'
              var areaColor = $mdColors.getThemeColor('default-background-200')

              var line = d3.line()
                .curve(d3.curveLinear)
                .x(function(d) { return x(d.x) })
                .y(function(d) { return y(d.value) })

              var area = d3.area()
                .x(function(d) { return x(d.x) })
                .y0(function(d) { return y(0) })
                .y1(function(d) { return y(d.value) })

              // Setup: SVG container
              var svg = d3.select(el[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)

              var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

              g.append("path")
                  .datum(data)
                  .attr("class", "area")
                  .attr("d", area)
                  .style("fill", areaColor)

              g.append("path")
                  .datum(data)
                  .attr("class", "line")
                  .attr("d", line)
                  .style("stroke", lineColor)
                  .style("stroke-width", "2px")
                  .style("fill", "none")

              // Axis
              g.append("g")
                  .attr("class", "axis axis--y")
                  .attr("transform", "translate(" + width + ", 0)")
                  .call(d3.axisLeft(y).ticks(3))
                .select(".domain")
                  .remove()

            })
          }
        }
      }
    }
  })

.directive('hcaUnindexedChart', function(
    $timeout,
    $mdColors
  ){
    return {
      restrict: 'A',
      scope: {
        status: '='
      },
      link: function($scope, el, attrs) {
        
        $scope.$watch('status', redraw)
        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.status !== undefined){
            $timeout(function(){
              el.html('');

              window.el = el[0]
              // Setup: dimensions
              var margin = {top: 4, right: 16, bottom: 4, left: 4};
              var width = el[0].offsetWidth - margin.left - margin.right;
              var height = el[0].offsetHeight - margin.top - margin.bottom;

              // While loading redraw may trigger before element being properly sized
              if (width <= 0 || height <= 0) {
                $timeout(redraw, 250)
                return
              }

              // Setup: scales
              var minDomain = 0.5
              var x = d3.scaleLog()
                .domain([minDomain, 1000])
                .range([0, width])

              // Setup: SVG container
              var svg = d3.select(el[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)

              var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

              g.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', x(Math.max(minDomain, $scope.status.corpus.traph.pages_to_index)))
                .attr('height', height)
                .attr('fill', $mdColors.getThemeColor('default-warn-300'))

              // Axis
              var formatTick = function(d) { return d };
              var xAxis = d3.axisBottom(x)
                .ticks(5, formatTick)

              g.append("g")
                  .attr("class", "axis axis--x")
                  .call(xAxis)
                .select(".domain")
                  .remove()

            })
          }
        }
      }
    }
  })