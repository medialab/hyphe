 'use strict';

angular.module('hyphe.rankingsChartComponent', [])

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