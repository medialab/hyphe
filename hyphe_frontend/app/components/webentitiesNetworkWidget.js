'use strict';

angular.module('hyphe.webentitiesNetworkWidgetComponent', [])

.directive('webentitiesNetworkWidget', function(
    $mdSidenav,
    api,
    utils,
    autocompletion,
    corpus,
    $timeout,
    $window
  ){
    return {
      restrict: 'E'
      ,templateUrl: 'components/webentitiesNetworkWidget.html'
      ,scope: {
        status: '=',
        corpusName: '='
      }
      ,link: function($scope, el, attrs) {
        var pageSize = 5000
        $scope.checkLoadAndUpdateCurrentToken = 0
        $scope.corpusId = corpus.getId()
        $scope.statuses = {in:true, out:false, undecided:true, discovered:false}
        $scope.limitDiscovered = '1+'
        $scope.limitAll = ''
        $scope.hideLinksFromOUT = true

        $scope.settings = {
          in: $scope.statuses.in
        , undecided: $scope.statuses.undecided
        , out: $scope.statuses.out
        , discovered: $scope.statuses.discovered
        , limitDiscovered: '1+'
        , limitAll: ''
        , hideLinksFromOUT: true
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

        $scope.nodeColorMode = '_webentitystatus'
        $scope.nodeSizeMode = 'indegree'
        $scope.nodeSizeBaseRatio = 1
        $scope.tagCategories = {}
        $scope.selectedItem = null

        $scope.findNode = function(name){
          g.forEachNode(function(node){
            var n = g.getNodeAttributes(node)
            if (n.name === name){
              $scope.networkNodeClick(node);
            }
          });
        }

        function setEdgesToGrey(){
          // Default color for edges
          $scope.network.edges().forEach(function(eid) {
            $scope.network.setEdgeAttribute(eid, 'color', '#DDD');
          });

        }

        $scope.$watch('selectedItem', function(newVal, oldVal){
          if ($scope.data.links.loaded && $scope.network){
            setEdgesToGrey();
            if (!newVal){
              resetInfos();
            }
          }
        });

        $scope.networkNodeClick = function(nid) {
          var n = g.getNodeAttributes(nid);
          $scope.WEId = nid;
          $scope.selectedItem = n.name;
          $scope.WEHomepage = n.homepage;

          $scope.inDegree = 0;
          $scope.outDegree = 0;
          $scope.bothDegree = 0;

          g.forEachEdge(nid, function(edge, attributes, source, target){
            if (source === nid){
              if (g.hasEdge(target, source)){
                g.setEdgeAttribute(edge, 'color', '#6e246c');
                $scope.bothDegree++;
              }
              else {
                g.setEdgeAttribute(edge, 'color', '#f3419c');
                $scope.outDegree++;
              }
            }
            else if(target === nid){
              if (g.hasEdge(target, source)) {
                g.setEdgeAttribute(edge, 'color', '#6e246c');
                $scope.bothDegree++;
              }
              else{
                g.setEdgeAttribute(edge, 'color', '#0053c2');
                $scope.inDegree++;
              }
            }
          });
          $scope.bothDegree = $scope.bothDegree/2;  //the bothDegree was counted from the two nodes so we have to divide it by 2.
        };

        $scope.networkStageClick = function(){
          $scope.selectedItem = null;
        }

        function resetInfos(){
          $scope.inDegree = null;
          $scope.outDegree = null;
          $scope.bothDegree = null;
        }

        //Search
        $scope.autoComplete = function(query){
          var webentities=[];
          for (var status in $scope.statuses){

            if ($scope.statuses[status]) {
              webentities = webentities.concat( $scope.data[status].webentities.map(function (we) {
                return we.name;
              }));
            }
          }
          var searchQuery = autocompletion.searchable(query);
            var res = [];
            webentities.forEach(function(k){
                var candidateName = autocompletion.searchable(k)
                if (candidateName && (!searchQuery || ~candidateName.indexOf(searchQuery))) {
                    res.push(k);
                }
            });
            res.sort(function(a,b){return a.localeCompare(b);});
            return res;
        }

        $scope.toggleSidenav = function() {
          $mdSidenav('right').toggle();
        }

        $scope.applySettings = function(){

          $scope.selectedItem = null;

          loadStatus(); // Get the number of IN / OUT / UND / DISC

          for(var status in $scope.statuses){
            $scope.settings[status] = $scope.statuses[status]
          }

          if ($scope.settings.hideLinksFromOUT !== $scope.hideLinksFromOUT) {
            $scope.data.links.loaded = false
          }

          $scope.settings.limitDiscovered = $scope.limitDiscovered
          $scope.settings.limitAll = $scope.limitAll
          $scope.settings.hideLinksFromOUT = $scope.hideLinksFromOUT

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
          $scope.hideLinksFromOUT = $scope.settings.hideLinksFromOUT
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
          if ($scope.hideLinksFromOUT != $scope.settings.hideLinksFromOUT) {
            difference = true
          }

          $scope.settingsChanged = difference
        }

        $scope.downloadNetwork = function() {
          if ($scope.network) {
            var blob = new Blob(
              [gexf.write($scope.network, {
                formatNode: function(key, attributes) {
                  return {
                    label: attributes.label,
                    attributes: utils.omit(
                      attributes,
                      ["label", "color", "x", "y", "size",  // graph fields already present
                       "tags", "prefixes"]                  // object fields undesired in GEXF
                    ),
                    viz: {
                      color: attributes.color,
                      x: attributes.x,
                      y: attributes.y,
                      size: attributes.size
                    }
                  };
                }
              })],
              {'type':'text/gexf+xml;charset=utf-8'}
            );
            saveAs(blob, $scope.corpusName + ".gexf", true);
          }
        }

        $scope.$watch('nodeColorMode', updateNodeColors)
        $scope.$watch('nodeSizeMode', updateNodeSizes)
        $scope.$watch('nodeSizeBaseRatio', updateNodeSizes)

        // Init
        $scope.applySettings()

        /// Functions

        function updateNetworkAppearance() {
          updateNodeColors();
          updateNodeSizes();
          setEdgesToGrey();
        }

        function updateNodeColors() {
          $scope.nodeColorMap = []
          if ($scope.nodeColorMode == '') {

            // All nodes to black
            $scope.nodeColorMap = [{color:'#000', name:'All nodes'}]
            var g = $scope.network
            if (g === undefined) { return }
            g.nodes().forEach(function(nid){
              g.setNodeAttribute(nid, 'color', $scope.nodeColorMap[0].color)
            })

          } else if ($scope.nodeColorMode == '_webentitystatus') {

            // Node colors by web entity status
            var colors = {
              'IN': '#333',
              'UNDECIDED': '#ADA299',
              'OUT': '#FAA',
              'DISCOVERED': '#93BDE0'
            }
            $scope.nodeColorMap = [
              {color:colors.IN, name:'IN'},
              {color:colors.UNDECIDED, name:'UNDECIDED'},
              {color:colors.OUT, name:'OUT'},
              {color:colors.DISCOVERED, name:'DISCOVERED'}
            ]
            var g = $scope.network
            if (g === undefined) { return }
            g.nodes().forEach(function(nid){
              g.setNodeAttribute(nid, 'color', colors[g.getNodeAttribute(nid, 'status')])
            })

          } else {

            // Node colors by tag
            var tagCat = $scope.nodeColorMode
            var colorArray = [
                  "#663185",
                  "#60ae62",
                  "#b8405a",
                  "#b3a140",
                  "#cd6cb9",
                  "#6b7dd6",
                  "#c26538"]
            var colorDefault = "#777"
            var colorUntagged = "#BBB"
            var colorError = "#600"
            var colors = {undefined: colorUntagged}
            var untaggedCount = 0
            $scope.nodeColorMap = Object.keys($scope.tagCategories[tagCat])
              .map(function(tagValue){
                var d = $scope.tagCategories[tagCat][tagValue]
                d.name = tagValue
                return d
              })
              .sort(function(a, b){
                return b.count - a.count
              })
              .map(function(d, i){
                if (i<colorArray.length) {
                  d.color = colorArray[i]
                } else {
                  d.color = colorDefault
                }
                colors[d.name] = d.color
                return d
              })
            var g = $scope.network
            if (g === undefined) { return }
            g.nodes().forEach(function(nid){
              var tags = g.getNodeAttribute(nid, 'tags')
              var color = colorError
              if (tags == undefined || tags.USER == undefined || tags.USER[tagCat] === undefined) {
                color = colorUntagged
                untaggedCount++
              } else {
                color = colors[tags.USER[tagCat]] || colorError
              }
              g.setNodeAttribute(nid, 'color', color)
            })
            if (untaggedCount > 0) {
              $scope.nodeColorMap.push({name: 'Untagged', color: colorUntagged, count: untaggedCount})
            }

          }
          // console.log('Update colors to', $scope.nodeColorMode)
        }

        function updateNodeSizes() {
          var g = $scope.network
          if (g === undefined) { return }

          var minSize = 1
          var values = []
          g.nodes().forEach(function(nid){
            var value = 1
            if ($scope.nodeSizeMode == 'indegree') {
              value = g.inDegree(nid)
            } else if ($scope.nodeSizeMode == 'outdegree') {
              value = g.outDegree(nid)
            } else if ($scope.nodeSizeMode == 'degree') {
              value = g.degree(nid)
            } else {
              value = g.getNodeAttribute(nid, $scope.nodeSizeMode)
            }
            var size = $scope.nodeSizeBaseRatio * (minSize + Math.sqrt(value))
            values.push(value)
            g.setNodeAttribute(nid, 'size', size)
          })

          $scope.nodeSizeMap = [
            {size: 0.5, name: 'Smallest node', value: d3.min(values)},
            {size: 1.2, name: 'Biggest node', value: d3.max(values)}
          ]
        }

        function buildTagData() {
          $scope.tagCategories = {}

          var tagCat
          ['in', 'undecided', 'out', 'discovered'].forEach(function(status){
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
              {
                include_links_from_OUT: !$scope.hideLinksFromOUT
              }
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

          for (var k in weIndex)
            g.addNode(k, Object.assign({}, weIndex[k]))

          validLinks.forEach(function(l) {
            g.importEdge(l)
          })

          // Filtering: mark nodes for deletion
          var allThreshold = 0
          var discThreshold = 0
          if ($scope.settings.limitAll) {
            allThreshold = +$scope.settings.limitAll.replace('+', '')
          }
          if ($scope.settings.limitDiscovered) {
            discThreshold = +$scope.settings.limitDiscovered.replace('+', '')
          }

          g.nodes().forEach(function(nid){
            var degree = g.degree(nid)
            if (degree < allThreshold || (g.getNodeAttribute(nid, "status") == 'DISCOVERED' && degree < discThreshold)) {
              g.dropNode(nid)
            }
          })

          var nodesArea = g.order * 10
          g.nodes().forEach(function(nid){
            // Remove duplicate fields
            g.removeNodeAttribute(nid, 'id')
            g.removeNodeAttribute(nid, '_id')

            // Default nodes appearance
            g.setNodeAttribute(nid, 'color', '#666')
            g.setNodeAttribute(nid, 'size', 1)

            // Init Label and coordinates
            var xy = generateRandomCoordinates(nodesArea)
            g.setNodeAttribute(nid, 'x', xy.x)
            g.setNodeAttribute(nid, 'y', xy.y)
            g.setNodeAttribute(nid, 'label', g.getNodeAttribute(nid, 'name'))

            // Tags
            var tagCat
            for (tagCat in $scope.tagCategories) {
              var tagVal = ''
              try {
                tagVal = g.getNodeAttribute(nid, 'tags').USER[tagCat]
              } catch(e) {
                tagVal = ''
              }
              g.setNodeAttribute(nid, tagCat.trim(), tagVal);
            }
            // g.removeNodeAttribute(nid, "tags");
          })


          // Make the graph global for console tinkering
          window.g = g

          $scope.network = g

          updateNetworkAppearance()
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

        function generateRandomCoordinates(area) {
          var d = Infinity
          var r = Math.sqrt(area / Math.PI || 1)
          var x, y
          while (d>r) {
            x = (0.5 - Math.random()) * 2 * r
            y = (0.5 - Math.random()) * 2 * r
            d = Math.sqrt(x*x + y*y)
          }
          return {x:x, y:y}
        }
      }
    }
  })


