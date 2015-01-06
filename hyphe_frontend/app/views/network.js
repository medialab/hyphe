'use strict';

angular.module('hyphe.networkController', [])

  .controller('network', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'network'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.links
    $scope.webentities
    $scope.network

    $scope.sigmaInstance
    $scope.spatializationRunning = false

    $scope.displayMode = {corpus:true, full:false, custom:false}
    $scope.networkMode = 'loading'

    $scope.$on("$destroy", function(){
      killSigma()
    })
    
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
      $scope.sigmaInstance.stopForceAtlas2()
    }

    $scope.updateDisplayMode = function(){
      if($scope.displayMode.corpus){
        if($scope.networkMode != 'corpus'){
          $scope.networkMode = 'corpus'
          killSigma()
          buildNetwork()
          initSigma()
        }
      } else if($scope.displayMode.full){
        if($scope.networkMode != 'full'){
          $scope.networkMode = 'full'
          killSigma()
          buildNetwork()
          initSigma()
        }
      }
      // console.log('UPDATE D M', $scope.displayMode)
    }

    $scope.downloadNetwork = function(){
      var network = $scope.network

      var blob = new Blob(json_graph_api.buildGEXF(network), {'type':'text/gexf+xml;charset=utf-8'});
      saveAs(blob, $scope.corpusName + ".gexf");
    }

    // Init
    loadCorpus()

    function loadCorpus(){
      $scope.status = {message: 'Loading web entities'}
      api.getWebentities(
        {
          count: 10000
        }
        ,function(result){
          $scope.webentities = result.webentities
          $scope.status = {}
          loadLinks()
        }
        ,function(data, status, headers, config){
          $scope.status = {message: 'Error loading web entities', background:'danger'}
        }
      )
    }

    function loadLinks(){
      $scope.networkMode = 'linksLoading'
      $scope.status = {message: 'Loading links'}
      api.getNetwork(
        {}
        ,function(links){
          $scope.links = links
          buildNetwork()
          $scope.status = {}

          $scope.networkMode = 'corpus'

          initSigma()
        }
        ,function(data, status, headers, config){
          $scope.status = {message: 'Error loading links', background:'danger'}
        }
      )
    }

    function initSigma(){
      $scope.sigmaInstance = new sigma('sigma-example');
      
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

      var nodesIndex = {}

      // Populate
      $scope.network.nodes
        .forEach(function(node){
          nodesIndex[node.id] = node
          $scope.sigmaInstance.graph.addNode({
            id: node.id
            ,label: node.label
            ,'x': Math.random()
            ,'y': Math.random()
            ,'size': 1 + Math.log(1 + 0.1 * ( node.inEdges.length + node.outEdges.length ) )
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
        slowDown: 10
        ,worker: true
        ,scalingRatio: 10
        ,strongGravityMode: true
        ,gravity: 0.1
      })

      $scope.runSpatialization()
    }

    function killSigma(){
      $scope.stopSpatialization()
      $scope.sigmaInstance.kill()
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
      ]
      
      // Extract categories from nodes
      var categories = []
      $scope.webentities.forEach(function(we){
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

      var existingNodes = {} // This index is useful to filter edges with unknown nodes

      $scope.network.nodes = $scope.webentities.filter(function(we){
        return we.status == 'IN' || we.status == 'UNDECIDED' || $scope.networkMode == 'full'
      }).map(function(we){
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
          ].concat(tagging.map(function(catvalues){
            return {attr:'attr_'+$.md5(catvalues.cat), val:catvalues.values.join(' | ')}
          }))
        }
      })
      
      $scope.network.edgesAttributes = [
        {id:'attr_count', title:'Hyperlinks Count', type:'integer'}
      ]

      $scope.network.edges = $scope.links
      .filter(function(link){
        // Check that nodes exist
        return existingNodes[link[0]] && existingNodes[link[1]]
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

      console.log('Network', $scope.network)

      // console.log('Web entities', $scope.webentities)
      // console.log('Links', $scope.links)
    }
  }])