'use strict';

angular.module('hyphe.manageTagsController', [])

  .controller('manageTags',
  function(
    $scope,
    api,
    corpus,
    utils,
    $location,
    $timeout
  ) {
    var pageSize = 5000
    $scope.loadInWebentitiesCurrentToken = 0

    $scope.currentPage = 'manageTags'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

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
      links: {
        loading: false,
        loaded: false,
        links: []
      }
    }

    $scope.generalOption = undefined
    $scope.tagCategories = {}
    $scope.tagCategoriesUntagged = {}
    $scope.filters = []

    $scope.searchQuery
    $scope.displayCategory

    $scope.touchSpecialOption = function() {
      var tagCat
      for (tagCat in $scope.tagCategories) {
        $scope.tagCategoriesUntagged[tagCat] = false
        var val
        for (val in $scope.tagCategories[tagCat]) {
          var valData = $scope.tagCategories[tagCat][val]
          valData.selected = false
        }
      }
      updateTags()
    }

    $scope.touchUntagged = function(tagCat) {
      if (tagCat === undefined) {
        return
      } else {
        $scope.generalOption = undefined
        var val
        for (val in $scope.tagCategories[tagCat]) {
          var valData = $scope.tagCategories[tagCat][val]
          valData.selected = false
        }
      }
      updateTags()
    }

    $scope.touchTagValue = function(tagCat) {
      $scope.generalOption = undefined
      $scope.tagCategoriesUntagged[tagCat] = false
      updateTags()
    }

    // Init
    loadInWebentities()

    // Functions
    function updateTags() {
      if($scope.loading) { return }
      $scope.filters = []
      
      if ($scope.generalOption !== undefined) {
        // There is a general option (special option)
        // As a consequence everything else is unselected
        var filter = {
          type: 'special',
          value: $scope.generalOption,
          remove: function(){
            $scope.generalOption = undefined
            updateTags()
          }
        }
        if ($scope.generalOption == 'untagged') {
          filter.name = "Untagged"
        } else if ($scope.generalOption == 'partiallyUntagged') {
          filter.name = "Partially Untagged"
        } else if ($scope.generalOption == 'conflicts') {
          filter.name = "Conflicts"
        }
        $scope.filters.push(filter)
      } else {
        // There is no general option: we look at each category
        var tagCat
        for (tagCat in $scope.tagCategories) {
          if ($scope.tagCategoriesUntagged[tagCat]) {
            // Special option "untagged"
            $scope.filters.push({
              type: 'catUntagged',
              tagCat: tagCat,
              name: 'Untagged',
              remove: function(){
                $scope.tagCategoriesUntagged[this.tagCat] = false
                updateTags()
              }
            })
          } else {
            // Some tags may be tagged
            var selection = []
            var val
            for (val in $scope.tagCategories[tagCat]) {
              var valData = $scope.tagCategories[tagCat][val]
              if (valData.selected) {
                selection.push(val)
              }
            }
            if (selection.length > 2) {
              // 3+ values selected
              $scope.filters.push({
                type: 'cat',
                tagCat: tagCat,
                values: selection,
                name: 'Some of ' + selection.length + ' values',
                remove: function(){
                  this.values.forEach(function(val){
                    $scope.tagCategories[this.tagCat][val].selected = false
                    updateTags()
                  })
                }
              })
            } else if (selection.length == 2) {
              // 2 values selected
              $scope.filters.push({
                type: 'cat',
                tagCat: tagCat,
                values: selection,
                name: selection[0] + ' OR ' + selection[1],
                remove: function(){
                  $scope.tagCategories[this.tagCat][this.values[0]].selected = false
                  updateTags()
                }
              })
            } else if (selection.length == 1) {
              // Single value selected
              $scope.filters.push({
                type: 'cat',
                tagCat: tagCat,
                values: selection,
                name: selection[0],
                remove: function(){
                  $scope.tagCategories[this.tagCat][this.values[0]].selected = false
                  updateTags()
                }
              })
            }
          }
        }
      }
    }

    function buildTagData() {
      $scope.tagCategories = {}
      $scope.tagCategoriesUntagged = {}

      var tagCat
      $scope.data.in.webentities
        .map(function(d){return d.tags.USER || {}})
        .forEach(function(d){
          for (tagCat in d) {
            $scope.tagCategories[tagCat] = $scope.tagCategories[tagCat] || {}
            var values = d[tagCat]
            values.forEach(function(val){
              $scope.tagCategories[tagCat][val] = ($scope.tagCategories[tagCat][val] || {count:0, selected:false})
              $scope.tagCategories[tagCat][val].count++
            })
          }
        })

      for (tagCat in $scope.tagCategories) {
        $scope.tagCategoriesUntagged[tagCat] = false
      }

      $scope.loading = false

      console.log($scope.tagCategories)
    }

    function loadInWebentities(thisToken) {
      $scope.loading = true
      if ($scope.data.in.loading && $scope.data.in.token) {
        // Retrieve from query token
        $scope.status = {message:'Loading IN web entities', progress: Math.round(100 * $scope.data.in.webentities.length/$scope.data.in.total)}
        api.getResultsPage(
          {
            token: $scope.data.in.token
            ,page: ++$scope.data.in.page
          }
          ,function(result){
            // Stop if this function was called in the meanwhile
            if ($scope.loadInWebentitiesCurrentToken != thisToken) { return }
            console.log(result)
            $scope.data.in.webentities = $scope.data.in.webentities.concat(result.webentities)
            if ($scope.data.in.webentities.length >= $scope.data.in.total) {
              $scope.data.in.loading = false
              $scope.data.in.loaded = true
              $scope.status = {}
              loadLinks()
              buildTagData()
            } else {
              loadInWebentities(thisToken)
            }
          }
          ,function(data, status, headers, config){
            // Stop if this function was called in the meanwhile
            if ($scope.loadInWebentitiesCurrentToken != thisToken) { return }

            if ($scope.data.in.retry++ < 3){
              console.warn('Error loading results page: Retry', $scope.data.in.retry)
              loadInWebentities(thisToken)
            } else {
              console.log('Error loading results page:', data, headers, config)
              $scope.status = {message: 'Error loading results page', background: 'danger'}
            }
          }
        )
      } else {
        // Initial query
        $scope.status = {message:'Loading IN web entities'}
        $scope.data.in.loading = true
        $scope.data.in.loaded = false
        $scope.data.in.token = undefined
        $scope.data.in.page = 0
        $scope.data.in.retry = 0
        api.getWebentities_byStatus(
          {
            status: 'IN'
            ,semiLight: true
            ,count: pageSize
            ,page: 0
          }
          ,function(result){
            
            $scope.data.in.total = result.total_results
            $scope.data.in.token = result.token

            $scope.data.in.webentities = $scope.data.in.webentities.concat(result.webentities)
            if ($scope.data.in.webentities.length >= $scope.data.in.total) {
              $scope.data.in.loading = false
              $scope.data.in.loaded = true
              $scope.status = {}
              loadLinks()
              buildTagData()
            } else {
              loadInWebentities(thisToken)
            }
          }
          ,function(data, headers, config){
            // Stop if this function was called in the meanwhile
            if ($scope.loadInWebentitiesCurrentToken != thisToken) { return }

            if ($scope.data[status].retry++ < 3){
              console.warn('Error loading web entities: Retry', $scope.data.in.retry)
              loadInWebentities(thisToken)
            } else {
              $scope.status = {message: 'Error loading web entities', background: 'danger'}
            }
          }
        )
      }
    }

    function loadLinks() {
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
            buildNetwork()
          }
          ,function(data, status, headers, config){
            $scope.status = {message: 'Error loading links', background:'danger'}
          }
        )
        return
      }
    }

    // TODO
    function buildNetwork() {
      /*var weIndex = {}
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
      var averageNonNormalizedArea = g.size / g.order // because node area = indegree
      var minSize = 1
      var totalArea = 0
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        n.size = minSize + Math.sqrt(g.inDegree(nid) / averageNonNormalizedArea)
        totalArea += Math.PI * n.size * n.size
      })

      // Init Label and coordinates
      var nodesArea = totalArea
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        var xy = generateRandomCoordinates(nodesArea)
        n.x = xy.x
        n.y = xy.y
        n.label = n.name
      })

      // Default color for edges
      g.edges().forEach(function(eid){
        var e = g.getEdgeAttributes(eid)
        e.color = '#DDD'
      })

      // Make the graph global for console tinkering
      window.g = g

      $scope.network = g*/
    }
  })
