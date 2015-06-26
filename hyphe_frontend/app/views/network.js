'use strict';

angular.module('hyphe.networkController', [])

  .controller('network', ['$scope', 'api', 'utils', 'corpus', '$window'
  ,function($scope, api, utils, corpus, $window) {
    $scope.currentPage = 'network'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.links
    $scope.webentities
    $scope.network

    $scope.sigmaInstance
    $scope.spatializationRunning = false
    $scope.overNode = false

    $scope.loading = true
    $scope.settingsChanged = false
    
    // Different presets for settings
    $scope.presets = {
      corpus: {
        status: true
        ,settings:{
          show_in: true
          ,show_undecided: true
          ,show_out: false
          ,show_discovered: false
          ,discoveredMinDegree: 0
        }
      }
      ,full: {
        status: false
        ,settings:{
          show_in: true
          ,show_undecided: true
          ,show_out: true
          ,show_discovered: true
          ,discoveredMinDegree: 0
        }
      }
      ,prospection: {
        status: false
        ,settings:{
          show_in: true
          ,show_undecided: true
          ,show_out: false
          ,show_discovered: true
          ,discoveredMinDegree: 3
        }
      }
    }

    // Actual active settings
    var settings = {
      show_in: $scope.presets.corpus.settings.show_in
      ,show_undecided: $scope.presets.corpus.settings.show_undecided
      ,show_out: $scope.presets.corpus.settings.show_out
      ,show_discovered: $scope.presets.corpus.settings.show_discovered
      ,discoveredMinDegree: $scope.presets.corpus.settings.discoveredMinDegree
    }

    // What is displayed (before validate or cancel)
    $scope.discoveredMinDegree =  settings.discoveredMinDegree
    $scope.show_in =              settings.show_in
    $scope.show_undecided =       settings.show_undecided
    $scope.show_out =             settings.show_out
    $scope.show_discovered =      settings.show_discovered

    $scope.$on("$destroy", function(){
      killSigma()
    })
    
    $scope.sigmaRecenter = function(){
      var c = $scope.sigmaInstance.cameras[0]
      c.goTo({
        ratio: 1
        ,x: 0
        ,y: 0
      })
    }

    $scope.sigmaZoom = function(){
      var c = $scope.sigmaInstance.cameras[0]
      c.goTo({
        ratio: c.ratio / c.settings('zoomingRatio')
      })
    }

    $scope.sigmaUnzoom = function(){
      var c = $scope.sigmaInstance.cameras[0]
      c.goTo({
        ratio: c.ratio * c.settings('zoomingRatio')
      })
    }

    $scope.toggleSpatialization = function(){
      if($scope.spatializationRunning){
        $scope.sigmaInstance.stopForceAtlas2()
        $scope.spatializationRunning = false
      } else {
        $scope.sigmaInstance.startForceAtlas2()
        $scope.spatializationRunning = true
      }
    }

    $scope.runSpatialization = function(){
      $scope.spatializationRunning = true
      $scope.sigmaInstance.startForceAtlas2()
    }

    $scope.stopSpatialization = function(){
      $scope.spatializationRunning = false
      $scope.sigmaInstance.killForceAtlas2()
    }

    $scope.downloadNetwork = function(){
      var network = $scope.network

      var blob = new Blob(json_graph_api.buildGEXF(network), {'type':'text/gexf+xml;charset=utf-8'});
      saveAs(blob, $scope.corpusName + ".gexf");
    }

    $scope.hide_unlinked_WEs = false
    $scope.toggleUnlinkedWEs = function(){
      var toggle = ($scope.hide_unlinked_WEs ?
        function(n){
          if(n.degree == 0) n.hidden = true
        } :
        function(n){
          n.hidden = false
        }
      )
      $scope.sigmaInstance.graph.nodes().forEach(toggle)
      $scope.sigmaInstance.refresh()
    }

    $scope.touchDiscovered = function(){
      $scope.show_discovered = true
      $scope.touchSettings()
    }

    $scope.touchSettings = function(){

      // Check if difference with current settings
      var difference = false
      for(var k in settings){
        if(settings[k] != $scope[k]){
          difference = true
        }
      }
      $scope.settingsChanged = difference

      // Check status of preset buttons
      for(var p in $scope.presets){
        var presetDifference = false
        for(var k in settings){
          if($scope.presets[p].settings[k] != $scope[k]){
            presetDifference = true
          }
        }
        $scope.presets[p].status = !presetDifference
      }
    }

    $scope.applyPreset = function(p){
      for(var k in settings){
        $scope[k] = $scope.presets[p].settings[k]
      }
      $scope.touchSettings()
    }

    $scope.revertSettings = function(){
      for(var k in settings){
        $scope[k] = settings[k]
      }
      $scope.touchSettings()
    }

    $scope.applySettings = function(){
      for(var k in settings){
        settings[k] = $scope[k]
      }
      $scope.touchSettings()
      killSigma()
      buildNetwork()
      initSigma()
    }

    $scope.initSigma = initSigma

    // Init
    loadCorpus()

    // Functions
    function loadCorpus(){
      $scope.status = {message: 'Loading web entities'}
      api.getWebentities(
        {
           sort: []
          ,count: -1
          ,light: true
        }
        ,function(result){
          $scope.webentities = {
            all: result,
            in: []
            ,out: []
            ,undecided: []
            ,discovered: []
            ,discovered_2: []
            ,discovered_3: []
            ,discovered_4: []
            ,discovered_5: []
          }
          result.forEach(function(we){
            $scope.webentities[we.status.toLowerCase()].push(we)
            if (we.status == "DISCOVERED"){
              [2, 3, 4, 5].forEach(function(min){
                if (we.indegree >= min) $scope.webentities["discovered_"+min].push(we)
              })
            }
          })
          loadLinks()
        }
        ,function(data, status, headers, config){
          $scope.status = {message: 'Error loading web entities', background:'danger'}
        }
      )
    }

    function loadLinks(){
      $scope.status = {message: 'Loading links'}
      api.getNetwork(
        {}
        ,function(links){
          $scope.links = links

          /*$window.links = links
          console.log('LINKS', links)*/

          buildNetwork()
          $scope.status = {}

          $scope.loading = false
          initSigma()

        }
        ,function(data, status, headers, config){
          $scope.status = {message: 'Error loading links', background:'danger'}
        }
      )
    }

    function initSigma(){
      $scope.sigmaInstance = new sigma('sigma');

      $window.s = $scope.sigmaInstance // For debugging purpose
      
      $scope.sigmaInstance.settings({
        defaultLabelColor: '#666'
        ,edgeColor: 'default'
        ,defaultEdgeColor: '#D1C9C3'
        ,defaultNodeColor: '#999'
        ,minNodeSize: 0.3
        ,maxNodeSize: 5
        ,zoomMax: 5
        ,zoomMin: 0.002
      });

      //var nodesIndex = {}

      // Populate
      $window.g = $scope.network
      $scope.unlinked_WEs = false
      $scope.network.nodes
        .forEach(function(node){
          //nodesIndex[node.id] = node
          var degree = node.inEdges.length + node.outEdges.length
          if (!$scope.unlinked_WEs && !degree){
            $scope.unlinked_WEs = true
          }
          $scope.sigmaInstance.graph.addNode({
            id: node.id
            ,label: node.label
            ,'x': Math.random()
            ,'y': Math.random()
            ,'degree': degree
            ,'hidden': $scope.hide_unlinked_WEs && !degree
            ,'size': 1 + Math.log(1 + 0.1 * degree )
            ,'color': node.color
          })
        })
      $scope.network.edges
        .forEach(function(link, i){
          $scope.sigmaInstance.graph.addEdge({
            'id': 'e'+i
            ,'source': link.sourceID
            ,'target': link.targetID
          })
        })

      // Force Atlas 2 settings
      $scope.sigmaInstance.configForceAtlas2({
        slowDown: 2 * (1 + Math.log($scope.network.nodes.length))
        ,worker: true
        ,scalingRatio: 10
        ,strongGravityMode: true
        ,gravity: 0.1
        ,barnesHutOptimize: $scope.network.nodes.length > 1000
      })

      // Bind interactions
      $scope.sigmaInstance.bind('overNode', function(e) {
        if(Object.keys(e.data.captor).length > 0){  // Sigma bug turnaround
          $scope.overNode = true
          $scope.$apply()
        }
      })

      $scope.sigmaInstance.bind('outNode', function(e) {
        if(Object.keys(e.data.captor).length > 0){  // Sigma bug turnaround
          $scope.overNode = false
          $scope.$apply()
        }
      })

      $scope.sigmaInstance.bind('clickNode', function(e) {
        var weId = e.data.node.id
        ,path = window.location.href.replace(window.location.hash, "") + '#/project/' + $scope.corpusId + '/webentity/' + weId
        $window.open(path, '_blank')
      })

      $scope.runSpatialization()
    }

    function killSigma(){
      if ($scope.sigmaInstance) {
        $scope.stopSpatialization()
        $scope.sigmaInstance.kill()
      }
    }

    function buildNetwork(){
      $scope.network = {}
      var statusColors = {
        IN:             "#000000"
        ,OUT:           "#FFFFFF"
        ,DISCOVERED:    "#FF846F"
        ,UNDECIDED:     "#869CAD"
      }

      $scope.network.attributes = []

      $scope.network.nodesAttributes = [
        {id:'attr_status', title:'Status', type:'string'}
        ,{id:'attr_crawling', title:'Crawling status', type:'string'}
        ,{id:'attr_indexing', title:'Indexing status', type:'string'}
        ,{id:'attr_creation', title:'Creation', type:'integer'}
        ,{id:'attr_modification', title:'Last modification', type:'integer'}
        ,{id:'attr_hyphe_indegree', title:'Hyphe Indegree', type:'integer'}
      ]
      
      // Extract categories from nodes
      var categories = []
      $scope.webentities.all.forEach(function(we){
        for(var namespace in we.tags){
          if(namespace == 'CORPUS' || namespace == 'USER'){
            var tagging = we.tags[namespace]
            for(var category in tagging){
              var values = tagging[category]
              categories.push(namespace+': '+category)
            }
          }
        }
      })

      categories = utils.extractCases(categories)
      categories.forEach(function(cat){
        $scope.network.nodesAttributes.push({id:'attr_'+$.md5(cat), title:cat, type:'string'})
      })

      var existingNodes = {}  // This index is useful to filter edges with unknown nodes
                              // ...and when the backend gives several instances of the same web entity

      var wes = [];
      ["in", "undecided", "out"].forEach(function(st){
        if (settings["show_"+st]){
          wes = wes.concat($scope.webentities[st])
        }
      })
      if (settings.show_discovered){
        wes = wes.concat($scope.webentities["discovered"+(settings.discoveredMinDegree > 0 ? "_"+settings.discoveredMinDegree : "")])
      }
      
      $scope.network.nodes = wes.filter(function(n){
        return n!== undefined
      }).map(function(we){
        if(existingNodes[we.id] === undefined){
          var color = statusColors[we.status] || '#FF0000'
            ,tagging = []
          for(var namespace in we.tags){
            if(namespace == 'CORPUS' || namespace == 'USER'){
              for(category in we.tags[namespace]){
                var values = we.tags[namespace][category]
                tagging.push({cat:namespace+': '+category, values:values})
              }
            }
          }
          existingNodes[we.id] = true
          return {
            id: we.id
            ,label: we.name
            ,color: color
            ,attributes: [
              {attr:'attr_status', val: we.status || 'error' }
              ,{attr:'attr_crawling', val: we.crawling_status || '' }
              ,{attr:'attr_indexing', val: we.indexing_status || '' }
              ,{attr:'attr_creation', val: we.creation_date || 'unknown' }
              ,{attr:'attr_modification', val: we.last_modification_date || 'unknown' }
              ,{attr:'attr_home', val: we.homepage || '' }
              ,{attr:'attr_hyphe_indegree', val: we.indegree || '0' }
            ].concat(tagging.map(function(catvalues){
              return {attr:'attr_'+$.md5(catvalues.cat), val:catvalues.values.join(' | ')}
            }))
          }
        } else {
          console.log('Duplicate id in web entities list', we.id)
        }
      })
      
      $scope.network.edgesAttributes = [
        {id:'attr_count', title:'Hyperlinks Count', type:'integer'}
      ]

      $scope.network.edges = $scope.links
      .filter(function(link){
        // Check that nodes exist and remove autolinks
        return existingNodes[link[0]] && existingNodes[link[1]] && link[0] !== link[1]
      })
      .map(function(link){
        return {
          sourceID: link[0]
          ,targetID: link[1]
          ,attributes: [
            {attr:'attr_count', val:link[2]}
          ]
        }
      })
      json_graph_api.buildIndexes($scope.network)

      // console.log('Network', $scope.network)
    }
  }])
