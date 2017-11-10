'use strict';

angular.module('hyphe.networkTagStatsComponent', [])
 
.directive('ntsDistributionOfValuesChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
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

        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');
              drawValuesDistribution(d3.select(el[0]), $scope.data)
            })
          }
        }
      }
    }
  })

.directive('ntsGroupToGroupEdgesCountChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
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

        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');
              drawFlowMatrix(d3.select(el[0]), $scope.data)
            })
          }
        }
      }
    }
  })

.directive('ntsGroupToGroupNormalizedDensityChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
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

        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');
              drawNormalizedDensityMatrix(d3.select(el[0]), $scope.data)
            })
          }
        }
      }
    }
  })

.directive('ntsNormalizedDensityProfileChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
      scope: {
        data: '=',
        value: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)
        $scope.$watch('value', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');
              drawValueInternalExternal(d3.select(el[0]), $scope.data, $scope.value)
            })
          }
        }
      }
    }
  })

.directive('ntsConnectivitySkewnessChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
      scope: {
        data: '=',
        value: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)
        $scope.$watch('value', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');
              drawValueInboundOutbound(d3.select(el[0]), $scope.data, $scope.value)
            })
          }
        }
      }
    }
  })

.directive('ntsConnectivitySkewnessDistributionChart', function(
    $timeout
  ){
    return {
      restrict: 'A',
      scope: {
        data: '=',
        value: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)
        $scope.$watch('value', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');
              drawValueSkewnessDistribution(d3.select(el[0]), $scope.data, $scope.value)
            })
          }
        }
      }
    }
  })

// Functions imported from Graph Recipes
function drawValuesDistribution(container, attData) {
  // Rank values by count
  var sortedValues = attData.values.slice(0).sort(function(v1, v2){
    return attData.valuesIndex[v1].nodes - attData.valuesIndex[v2].nodes
  })

  var barHeight = 32
  var margin = {top: 24, right: 180, bottom: 24, left: 180}
  var width = 800  - margin.left - margin.right
  var height = barHeight * attData.values.length

  var x = d3.scaleLinear().range([0, width])

  var y = d3.scaleBand().rangeRound([height, 0]).padding(.05)

  var xAxis = d3.axisBottom()
      .scale(x)
      .ticks(10)

  var yAxis = d3.axisLeft()
      .scale(y)

  var svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")")

  x.domain([0, d3.max(sortedValues, function(v) { return attData.valuesIndex[v].nodes })])
  y.domain(sortedValues)

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .selectAll("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", "9px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .selectAll("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  var bar = svg.selectAll("bar")
      .data(sortedValues)
    .enter().append('g')
      .attr("class", "bar")

  bar.append("rect")
      .style("fill", 'rgba(120, 120, 120, 0.5)')
      .attr("x", 0)
      .attr("y", function(v) { return y(v) })
      .attr("width", function(v) { return x(attData.valuesIndex[v].nodes) })
      .attr("height", y.bandwidth())

  bar.append('text')
      .attr('x', function(v) { return 6 + x(attData.valuesIndex[v].nodes) })
      .attr('y', function(v) { return y(v) + 12 })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .text(function(v){ return attData.valuesIndex[v].nodes + ' nodes'})

  bar.append('text')
      .attr('x', function(v) { return 6 + x(attData.valuesIndex[v].nodes) })
      .attr('y', function(v) { return y(v) + 24 })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .text(function(v){ return Math.round(100 * attData.valuesIndex[v].nodes / g.order) + '%'})
}

function drawFlowMatrix(container, attData) {
  // Compute crossings
  var crossings = []
  var v1
  var v2
  for (v1 in attData.valueFlow) {
    for (v2 in attData.valueFlow[v1]) {
      crossings.push({
        v1: v1,
        v2: v2,
        count: attData.valueFlow[v1][v2].count
      })
    }
  }

  // Rank values by count
  var sortedValues = attData.values.sort(function(v1, v2){
    return attData.valuesIndex[v2].nodes - attData.valuesIndex[v1].nodes
  })
  var valueRanking = {}
  sortedValues.forEach(function(v, i){
    valueRanking[v] = i
  })

  // Draw SVG
  var maxR = 32
  var margin = {top: 120 + maxR, right: 24 + maxR, bottom: 24 + maxR, left: 180 + maxR}
  var width = 2 * maxR * (attData.values.length - 1)
  var height = width // square space

  var x = d3.scaleLinear()
    .range([0, width]);

  var y = d3.scaleLinear()
    .range([0, height]);

  var size = d3.scaleLinear()
    .range([0, 0.95 * maxR])
  var a = function(r){
    return Math.PI * Math.pow(r, 2)
  }

  var r = function(a){
    return Math.sqrt(a/Math.PI)
  }

  x.domain([0, attData.values.length - 1])
  y.domain([0, attData.values.length - 1])
  size.domain(d3.extent(crossings, function(d){return r(d.count)}))

  var svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Horizontal lines
  svg.selectAll('line.h')
      .data(attData.values)
    .enter().append('line')
      .attr('class', 'h')
      .attr('x1', 0)
      .attr('y1', function(d){ return y(valueRanking[d]) })
      .attr('x2', width)
      .attr('y2', function(d){ return y(valueRanking[d]) })
      .style("stroke", 'rgba(0, 0, 0, 0.06)')

  // Vertical lines
  svg.selectAll('line.v')
      .data(attData.values)
    .enter().append('line')
      .attr('class', 'v')
      .attr('x1', function(d){ return x(valueRanking[d]) })
      .attr('y1', 0)
      .attr('x2', function(d){ return x(valueRanking[d]) })
      .attr('y2', height)
      .style("stroke", 'rgba(0, 0, 0, 0.06)')

  // Arrow
  var arr = svg.append('g')
    .attr('class', 'arrow')
    .style("stroke", 'rgba(0, 0, 0, 0.4)')
  arr.append('line')
    .attr('x1', -24 - maxR)
    .attr('y1', -24)
    .attr('x2', -24 - maxR)
    .attr('y2', -24 - maxR)
  arr.append('line')
    .attr('x1', -24 - maxR)
    .attr('y1', -24 - maxR)
    .attr('x2', -24)
    .attr('y2', -24 - maxR)
  arr.append('line')
    .attr('x1', -24)
    .attr('y1', -24 - maxR)
    .attr('x2', -24 - 6)
    .attr('y2', -24 - maxR - 6)
  arr.append('line')
    .attr('x1', -24)
    .attr('y1', -24 - maxR)
    .attr('x2', -24 - 6)
    .attr('y2', -24 - maxR + 6)

  // Horizontal labels
  svg.selectAll('text.h')
      .data(attData.values)
    .enter().append('text')
      .attr('class', 'h')
      .attr('x', -6-maxR)
      .attr('y', function(d){ return y(valueRanking[d]) + 3 })
      .text( function (d) { return d })
      .style('text-anchor', 'end')
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  // Vertical labels
  svg.selectAll('text.v')
      .data(attData.values)
    .enter().append('text')
      .attr('class', 'v')
      .attr('x', function(d){ return x(valueRanking[d]) + 3 })
      .attr('y', -6-maxR)
      .text( function (d) { return d })
      .style('text-anchor', 'end')
      .style('writing-mode', 'vertical-lr')
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  // Dots
  var dot = svg.selectAll(".dot")
      .data(crossings)
    .enter().append('g')
    
  dot.append("circle")
    .attr("class", "dot")
    .attr("r", function(d) { return size( r(d.count) ) })
    .attr("cx", function(d) { return x(valueRanking[d.v2]) })
    .attr("cy", function(d) { return y(valueRanking[d.v1]) })
    .style("fill", 'rgba(120, 120, 120, 0.3)')

  dot.append('text')
    .attr('x', function(d){ return x(valueRanking[d.v2]) })
    .attr('y', function(d){ return y(valueRanking[d.v1]) + 4 })
    .text( function (d) { return d.count })
    .style('text-anchor', 'middle')
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px")
    .attr("fill", 'rgba(0, 0, 0, 1.0)')
}

function drawNormalizedDensityMatrix(container, attData) {

  // Compute crossings
  var crossings = []
  var v1
  var v2
  for (v1 in attData.valueFlow) {
    for (v2 in attData.valueFlow[v1]) {
      crossings.push({
        v1: v1,
        v2: v2,
        nd: attData.valueFlow[v1][v2].nd
      })
    }
  }

  // Rank values by count
  var sortedValues = attData.values.sort(function(v1, v2){
    return attData.valuesIndex[v2].nodes - attData.valuesIndex[v1].nodes
  })
  var valueRanking = {}
  sortedValues.forEach(function(v, i){
    valueRanking[v] = i
  })

  // Draw SVG
  var maxR = 32
  var margin = {top: 120 + maxR, right: 24 + maxR, bottom: 24 + maxR, left: 180 + maxR}
  var width = 2 * maxR * (attData.values.length - 1)
  var height = width // square space

  var x = d3.scaleLinear()
    .range([0, width]);

  var y = d3.scaleLinear()
    .range([0, height]);

  var size = d3.scaleLinear()
    .range([0, 0.95 * maxR])

  var a = function(r){
    return Math.PI * Math.pow(r, 2)
  }

  var r = function(a){
    return Math.sqrt(a/Math.PI)
  }

  x.domain([0, attData.values.length - 1])
  y.domain([0, attData.values.length - 1])
  size.domain([0, d3.max(crossings, function(d){return r(Math.max(0, d.nd))})])

  var svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Horizontal lines
  svg.selectAll('line.h')
      .data(attData.values)
    .enter().append('line')
      .attr('class', 'h')
      .attr('x1', 0)
      .attr('y1', function(d){ return y(valueRanking[d]) })
      .attr('x2', width)
      .attr('y2', function(d){ return y(valueRanking[d]) })
      .style("stroke", 'rgba(0, 0, 0, 0.06)')

  // Vertical lines
  svg.selectAll('line.v')
      .data(attData.values)
    .enter().append('line')
      .attr('class', 'v')
      .attr('x1', function(d){ return x(valueRanking[d]) })
      .attr('y1', 0)
      .attr('x2', function(d){ return x(valueRanking[d]) })
      .attr('y2', height)
      .style("stroke", 'rgba(0, 0, 0, 0.06)')

  // Arrow
  var arr = svg.append('g')
    .attr('class', 'arrow')
    .style("stroke", 'rgba(0, 0, 0, 0.4)')
  arr.append('line')
    .attr('x1', -24 - maxR)
    .attr('y1', -24)
    .attr('x2', -24 - maxR)
    .attr('y2', -24 - maxR)
  arr.append('line')
    .attr('x1', -24 - maxR)
    .attr('y1', -24 - maxR)
    .attr('x2', -24)
    .attr('y2', -24 - maxR)
  arr.append('line')
    .attr('x1', -24)
    .attr('y1', -24 - maxR)
    .attr('x2', -24 - 6)
    .attr('y2', -24 - maxR - 6)
  arr.append('line')
    .attr('x1', -24)
    .attr('y1', -24 - maxR)
    .attr('x2', -24 - 6)
    .attr('y2', -24 - maxR + 6)

  // Horizontal labels
  svg.selectAll('text.h')
      .data(attData.values)
    .enter().append('text')
      .attr('class', 'h')
      .attr('x', -6-maxR)
      .attr('y', function(d){ return y(valueRanking[d]) + 3 })
      .text( function (d) { return d })
      .style('text-anchor', 'end')
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  // Vertical labels
  svg.selectAll('text.v')
      .data(attData.values)
    .enter().append('text')
      .attr('class', 'v')
      .attr('x', function(d){ return x(valueRanking[d]) + 3 })
      .attr('y', -6-maxR)
      .text( function (d) { return d })
      .style('text-anchor', 'end')
      .style('writing-mode', 'vertical-lr')
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  // Dots
  var dot = svg.selectAll(".dot")
      .data(crossings)
    .enter().append('g')
    
  dot.append("circle")
    .attr("class", "dot")
    .attr("r", function(d) { return size( r(Math.max(0, d.nd)) ) })
    .attr("cx", function(d) { return x(valueRanking[d.v2]) })
    .attr("cy", function(d) { return y(valueRanking[d.v1]) })
    .style("fill", function(d){
      if (d.v1 == d.v2) {
        return 'rgba(70, 220, 70, 0.3)'
      } else {
        return 'rgba(220, 70, 70, 0.3)'       
      }
    })

  dot.append('text')
    .attr('x', function(d){ return x(valueRanking[d.v2]) })
    .attr('y', function(d){ return y(valueRanking[d.v1]) + 4 })
    .text( function (d) { return formatDensityNumber(d.nd) })
    .style('text-anchor', 'middle')
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px")
    .attr("fill", 'rgba(0, 0, 0, 1.0)')

  function formatDensityNumber(d) {
    return d.toFixed(3)
  }
}

function drawValueInternalExternal(container, attData, v) {
  
  var data = [
    {
      label: 'INTERNAL',
      nd: attData.valuesIndex[v].internalNDensity,
      color: 'rgba(70, 220, 70, 0.3)'
    },
    {
      label: 'EXTERNAL',
      nd: attData.valuesIndex[v].externalNDensity,
      color: 'rgba(220, 70, 70, 0.3)'
    }
  ]
  
  var barHeight = 32
  var margin = {top: 24, right: 180, bottom: 24, left: 180}
  var width = 800  - margin.left - margin.right
  var height = barHeight * data.length

  var x = d3.scaleLinear().range([0, width])

  var y = d3.scaleBand().rangeRound([0, height]).padding(.05)

  var xAxis = d3.axisBottom()
      .scale(x)

  var yAxis = d3.axisLeft()
      .scale(y)

  var svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")")

  x.domain([0, d3.max(data, function(d) { return d.nd })])
  y.domain(data.map(function(d){return d.label}))

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .selectAll("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", "9px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .selectAll("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  var bar = svg.selectAll("bar")
      .data(data)
    .enter().append('g')
      .attr("class", "bar")

  bar.append("rect")
      .style("fill", function(d){ return d.color })
      .attr("x", 0)
      .attr("y", function(d) { return y(d.label) })
      .attr("width", function(d) { return x(Math.max(0, d.nd)) })
      .attr("height", y.bandwidth())

  bar.append('text')
      .attr('x', function(d) { return 6 + x(Math.max(0, d.nd)) })
      .attr('y', function(d) { return y(d.label) + 18 })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .text(function(d){ return d.nd.toFixed(3) + ' norm. density'})
}

function drawValueInboundOutbound(container, attData, v) {
  
  var data = [
    {
      label: 'INBOUND',
      nd: attData.valuesIndex[v].inboundNDensity,
      count: attData.valuesIndex[v].inboundLinks
    },
    {
      label: 'OUTBOUND',
      nd: attData.valuesIndex[v].outboundNDensity,
      count: attData.valuesIndex[v].outboundLinks
    }
  ]
  
  var barHeight = 32
  var margin = {top: 24, right: 180, bottom: 24, left: 180}
  var width = 800  - margin.left - margin.right
  var height = barHeight * data.length

  var x = d3.scaleLinear().range([0, width])

  var y = d3.scaleBand().rangeRound([0, height]).padding(.05)

  var xAxis = d3.axisBottom()
      .scale(x)

  var yAxis = d3.axisLeft()
      .scale(y)

  var svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")")

  x.domain([0, Math.max(0.01, d3.max(data, function(d) { return d.nd }))])
  y.domain(data.map(function(d){return d.label}))

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .selectAll("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", "9px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .selectAll("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  var bar = svg.selectAll("bar")
      .data(data)
    .enter().append('g')
      .attr("class", "bar")

  bar.append("rect")
      .style("fill", 'rgba(120, 120, 120, 0.5)')
      .attr("x", 0)
      .attr("y", function(d) { return y(d.label) })
      .attr("width", function(d) { return x(Math.max(0, d.nd)) })
      .attr("height", y.bandwidth())

  bar.append('text')
      .attr('x', function(d) { return 6 + x(Math.max(0, d.nd)) })
      .attr('y', function(d) { return y(d.label) + 12 })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .text(function(d){ return d.count + ' links'})

  bar.append('text')
      .attr('x', function(d) { return 6 + x(Math.max(0, d.nd)) })
      .attr('y', function(d) { return y(d.label) + 24 })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .text(function(d){ return d.nd.toFixed(3) + ' norm. density'})
}

function drawValueSkewnessDistribution(container, attData, v) {
  
  var sortedValues = attData.values.slice(0).sort(function(v1, v2){
    return attData.valuesIndex[v2].nodes - attData.valuesIndex[v1].nodes
  })

  var data = sortedValues
    .filter(function(v2){ return v2 != v })
    .map(function(v2){
      return {
        label: v2,
        ndToVal: attData.valueFlow[v2][v].nd,
        linksToVal: attData.valueFlow[v2][v].count,
        ndFromVal: attData.valueFlow[v][v2].nd,
        linksFromVal: attData.valueFlow[v][v2].count
      }
    })
  
  var barHeight = 32
  var centerSpace = 32
  var margin = {top: 36, right: 180, bottom: 24, left: 180}
  var width = 800  - margin.left - margin.right
  var height = barHeight * data.length

  var xl = d3.scaleLinear().range([width/2 - centerSpace/2, 0])
  var xr = d3.scaleLinear().range([width/2 + centerSpace/2, width])

  var y = d3.scaleBand().rangeRound([0, height]).padding(.05)

  var xlAxis = d3.axisBottom()
      .scale(xl)
      .ticks(3)

  var xrAxis = d3.axisBottom()
      .scale(xr)
      .ticks(3)

  var svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")")

  xl.domain([0, d3.max(data, function(d) { return Math.max(d.ndToVal, d.ndFromVal) })])
  xr.domain([0, d3.max(data, function(d) { return Math.max(d.ndToVal, d.ndFromVal) })])
  y.domain(data.map(function(d){return d.label}))

  svg.append("g")
      .attr("class", "xl axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xlAxis)
    .selectAll("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", "9px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  svg.append("g")
      .attr("class", "xr axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xrAxis)
    .selectAll("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", "9px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  svg.append('line')
      .attr('x1', xl(0))
      .attr('y1', height )
      .attr('x2', xl(0))
      .attr('y2', 0)
      .style("stroke", 'rgba(0, 0, 0, 0.3)')

  svg.append('line')
      .attr('x1', xr(0))
      .attr('y1', height )
      .attr('x2', xr(0))
      .attr('y2', 0)
      .style("stroke", 'rgba(0, 0, 0, 0.3)')

  svg.append('text')
      .text('INBOUND')
      .attr('text-anchor', 'end')
      .attr('x', xl(0))
      .attr('y', - 6)
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  svg.append('text')
      .text('OUTBOUND')
      .attr('x', xr(0))
      .attr('y', - 6)
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  svg.append('text')
      .text('→ ' + v + ' →')
      .attr('text-anchor', 'middle')
      .attr('x', width/2)
      .attr('y', - 24)
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .attr("fill", 'rgba(0, 0, 0, 0.5)')

  var bar = svg.selectAll("bar")
      .data(data)
    .enter().append('g')
      .attr("class", "bar")

  // Left
  bar.append("rect")
      .style("fill", 'rgba(120, 120, 120, 0.5)')
      .attr("x", function(d){ return xl(Math.max(0, d.ndToVal)) })
      .attr("y", function(d) { return y(d.label) })
      .attr("width", function(d) { return xl(0) - xl(Math.max(0, d.ndToVal)) })
      .attr("height", y.bandwidth())

  bar.append('text')
      .attr('x', function(d) { return xl(Math.max(0, d.ndToVal)) - 6 })
      .attr('y', function(d) { return y(d.label) + 12 })
      .attr('text-anchor', 'end')
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .text(function(d){ return d.linksToVal + ' links'})

  bar.append('text')
      .attr('x', function(d) { return xl(Math.max(0, d.ndToVal)) - 6 })
      .attr('y', function(d) { return y(d.label) + 24 })
      .attr('text-anchor', 'end')
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .text(function(d){ return d.ndToVal.toFixed(3) + ' nd.'})

  bar.append('text')
      .attr('x', function(d) { return xl(Math.max(0, d.ndToVal)) - 60 })
      .attr('y', function(d) { return y(d.label) + 18 })
      .attr('text-anchor', 'end')
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr('fill', 'rgba(0, 0, 0, 0.5)')
      .text(function(d){ return d.label})

  // Right
  bar.append("rect")
      .style("fill", 'rgba(120, 120, 120, 0.5)')
      .attr("x", function(d){ return xr(0) })
      .attr("y", function(d) { return y(d.label) })
      .attr("width", function(d) { return xr(Math.max(0, d.ndFromVal)) - xr(0) })
      .attr("height", y.bandwidth())

  bar.append('text')
      .attr('x', function(d) { return xr(Math.max(0, d.ndFromVal)) + 6 })
      .attr('y', function(d) { return y(d.label) + 12 })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .text(function(d){ return d.linksFromVal + ' links'})

  bar.append('text')
      .attr('x', function(d) { return xr(Math.max(0, d.ndFromVal)) + 6 })
      .attr('y', function(d) { return y(d.label) + 24 })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .text(function(d){ return d.ndFromVal.toFixed(3) + ' nd.'})

    bar.append('text')
      .attr('x', function(d) { return xr(Math.max(0, d.ndFromVal)) + 60 })
      .attr('y', function(d) { return y(d.label) + 18 })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '12px')
      .attr('fill', 'rgba(0, 0, 0, 0.5)')
      .text(function(d){ return d.label})
}  
  