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

    $scope.downloadNetwork = function() {
      if ($scope.network) {
        var blob = new Blob([gexf.write($scope.network)], {'type':'text/gexf+xml;charset=utf-8'});
        saveAs(blob, $scope.corpusName + ".gexf");
      }
    }

    // Init
    checkLoadAndUpdate(++$scope.checkLoadAndUpdateCurrentToken)

    /// Functions
    function buildTagData() {
      $scope.tagCategories = {}

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
                  $scope.tagCategories[tagCat][val] = ($scope.tagCategories[tagCat][val] || {count:0, selected:false})
                  $scope.tagCategories[tagCat][val].count++
                })
              }
            })
        }
      })
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
      g.addNodesFrom(weIndex)
      g.importEdges(validLinks)

      // Default nodes appearance
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        n.color = '#666'
        n.size = 1
      })

      // Init Label and coordinates
      var nodesArea = g.order * 10
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
  
  })
