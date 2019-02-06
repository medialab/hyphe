'use strict';

angular.module('hyphe.toolNetworkTagStatsController', [])

  .controller('toolNetworkTagStats',
  function(
    $scope,
    api,
    utils,
    md5,
    corpus,
    $window
  ) {
    $scope.currentPage = 'toolNetworkTagStats'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    var pageSize = 5000
    $scope.checkLoadAndUpdateCurrentToken = 0

    var untaggedPlaceholder = '[untagged]'

    $scope.statuses = {in:true, out:false, undecided:true, discovered:false}
    $scope.limitDiscovered = ''
    $scope.limitAll = ''

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
    $scope.counts
    $scope.loadingStatus
    $scope.loading = true

    $scope.network

    $scope.tagCategories = {}
    $scope.selectedCategory
    $scope.selectedValue = ''
    $scope.attributeData = {}
    $scope.$watch('selectedCategory', buildAttData)
    $scope.$watch('network', buildAttData)

    $scope.downloadNetwork = function() {
      if ($scope.network) {
        var blob = new Blob([gexf.write($scope.network)], {'type':'text/gexf+xml;charset=utf-8'});
        saveAs(blob, $scope.corpusName + ".gexf", true);
      }
    }

    // Init
    checkLoadAndUpdate(++$scope.checkLoadAndUpdateCurrentToken)

    /// Functions

    // Aggregated attribute data
    function buildAttData() {
      var g = $scope.network

      if (g && $scope.selectedCategory) {
        var attData = {}

        // Aggregate distribution of values
        attData.valuesIndex = {}
        g.nodes().forEach(function(nid){
          var n = g.getNodeAttributes(nid)
          if (attData.valuesIndex[n[$scope.selectedCategory]]) {
            attData.valuesIndex[n[$scope.selectedCategory]].nodes++
          } else {
            attData.valuesIndex[n[$scope.selectedCategory]] = {nodes: 1}
          }
        })
        attData.values = d3.keys(attData.valuesIndex)
        var valuesCounts = d3.values(attData.valuesIndex).map(function(d){return d.nodes})
        attData.distributionStats = {}
        attData.distributionStats.differentValues = valuesCounts.length
        attData.distributionStats.sizeOfSmallestValue = d3.min(valuesCounts)
        attData.distributionStats.sizeOfBiggestValue = d3.max(valuesCounts)
        attData.distributionStats.medianSize = d3.median(valuesCounts)
        attData.distributionStats.deviation = d3.deviation(valuesCounts)
        attData.distributionStats.valuesUnitary = valuesCounts.filter(function(d){return d==1}).length
        attData.distributionStats.valuesAbove1Percent = valuesCounts.filter(function(d){return d>=g.order*0.01}).length
        attData.distributionStats.valuesAbove10Percent = valuesCounts.filter(function(d){return d>=g.order*0.1}).length

        // Count edge flow
        attData.valueFlow = {}
        attData.values.forEach(function(v1){
          attData.valueFlow[v1] = {}
          attData.values.forEach(function(v2){
            attData.valueFlow[v1][v2] = {count: 0, expected: 0, nd:0}
          })
        })
        g.edges().forEach(function(eid){ // Edges count
          var nsid = g.source(eid)
          var ntid = g.target(eid)
          attData.valueFlow[g.getNodeAttribute(nsid, $scope.selectedCategory)][g.getNodeAttribute(ntid, $scope.selectedCategory)].count++
        })
        // For normalized density, we use the same version as the one used in Newmans' Modularity
        // Newman, M. E. J. (2006). Modularity and community structure in networks. Proceedings of the National Academy of …, 103(23), 8577–8582. http://doi.org/10.1073/pnas.0601602103
        // Here, for a directed network
        g.nodes().forEach(function(nsid){
          g.nodes().forEach(function(ntid){
            var expected = g.outDegree(nsid) * g.inDegree(ntid) / (2 * g.size)
            attData.valueFlow[g.getNodeAttribute(nsid, $scope.selectedCategory)][g.getNodeAttribute(ntid, $scope.selectedCategory)].expected += expected
          })
        })
        attData.values.forEach(function(v1){
          attData.values.forEach(function(v2){
            attData.valueFlow[v1][v2].nd = ( attData.valueFlow[v1][v2].count - attData.valueFlow[v1][v2].expected ) / (4 * g.size)
          })
        })

        // Value stats related to connectivity
        attData.values.forEach(function(v){
          attData.valuesIndex[v].internalLinks = attData.valueFlow[v][v].count
          attData.valuesIndex[v].internalNDensity = attData.valueFlow[v][v].nd

          attData.valuesIndex[v].inboundLinks = d3.sum(attData.values
              .filter(function(v2){ return v2 != v})
              .map(function(v2){ return attData.valueFlow[v2][v].count })
            )

          attData.valuesIndex[v].inboundNDensity = d3.sum(attData.values
              .filter(function(v2){ return v2 != v})
              .map(function(v2){ return attData.valueFlow[v2][v].nd })
            )

          attData.valuesIndex[v].outboundLinks = d3.sum(attData.values
              .filter(function(v2){ return v2 != v})
              .map(function(v2){ return attData.valueFlow[v][v2].count })
            )

          attData.valuesIndex[v].outboundNDensity = d3.sum(attData.values
              .filter(function(v2){ return v2 != v})
              .map(function(v2){ return attData.valueFlow[v][v2].nd })
            )

          attData.valuesIndex[v].externalLinks = attData.valuesIndex[v].inboundLinks + attData.valuesIndex[v].outboundLinks
          attData.valuesIndex[v].externalNDensity = attData.valuesIndex[v].inboundNDensity + attData.valuesIndex[v].outboundNDensity

        })

        // Global statistics
        attData.stats = {}

        // Modularity (based on previous computations)
        attData.stats.modularity = 0
        attData.values.forEach(function(v1){
          attData.values.forEach(function(v2){
            if (v1==v2) {
              attData.stats.modularity += attData.valueFlow[v1][v2].nd
            } else {
              attData.stats.modularity -= attData.valueFlow[v1][v2].nd
            }
          })
        })

        $scope.attributeData = attData
      }
    }

    function buildTagData() {
      $scope.tagCategories = {}
      $scope.noTagCatExceptFreetags = true

      var tagCat
      ['in'].forEach(function(status){
        if($scope.statuses[status]) {
          var webentities = $scope.data[status].webentities
          webentities
            .map(function(d){return d.tags.USER || {}})
            .forEach(function(d){
              for (tagCat in d) {
                $scope.tagCategories[tagCat] = $scope.tagCategories[tagCat] || {}
                var values = d[tagCat]
                values.forEach(function(val){
                  $scope.tagCategories[tagCat][val] = ($scope.tagCategories[tagCat][val] || {count:0})
                  $scope.tagCategories[tagCat][val].count++
                })

                if (tagCat != 'FREETAGS') {
                  $scope.noTagCatExceptFreetags = false
                }
              }
            })
        }
      })

      // Untagged
      for (tagCat in $scope.tagCategories) {
        var totalTagged = 0
        var tagVal
        for (tagVal in $scope.tagCategories[tagCat]) {
          totalTagged += $scope.tagCategories[tagCat][tagVal].count
        }
        var untaggedCount = $scope.data['in'].webentities.length - totalTagged
        if (untaggedCount > 0) {
          $scope.tagCategories[tagCat][untaggedPlaceholder] = {count: untaggedCount}
        }
      }

      $scope.selectedCategory = Object.keys($scope.tagCategories)[0] || ''

    }

    function checkLoadAndUpdate(thisToken) {

      // Check if some web entities require loading
      var someWebentitiesRequireLoading = ['in'].some(function(status){
        if (!$scope.data[status].loaded) {

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
      buildTagData()
      buildNetwork()
      $scope.loading = false
      $scope.status = {}
    }

    function buildNetwork() {
      var weIndex = {}
      var statuses = ['in']
      statuses.forEach(function(status){
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

      for (var k in weIndex)
        g.addNode(k, Object.assign({}, weIndex[k]))

      validLinks.forEach(function(l) {
        g.importEdge(l)
      })

      // Default nodes appearance
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        n.color = '#666'
        n.size = 1
      })

      // Init Label, coordinates and tags
      var nodesArea = g.order * 10
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        n.x = Math.random()
        n.y = Math.random()
        n.label = n.name

        // Tags
        var tagCat
        for (tagCat in $scope.tagCategories) {
          if (tagCat == "FREETAGS") {
            n[tagCat] = []
            if (n.tags && n.tags.USER && n.tags.USER[tagCat]) {
              n[tagCat] = n.tags.USER[tagCat]
            }
          } else {
            n[tagCat] = untaggedPlaceholder
            if (n.tags && n.tags.USER && n.tags.USER[tagCat] && n.tags.USER[tagCat].length > 0) {
              n[tagCat] = n.tags.USER[tagCat].join('|')
            }
          }
        }
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

  })
