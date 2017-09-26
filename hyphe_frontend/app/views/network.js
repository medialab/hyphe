'use strict';

angular.module('hyphe.networkController', ['angular-md5'])

  .controller('network',
  function(
    $scope,
    api,
    utils,
    md5,
    corpus,
    $window
  ) {
    $scope.currentPage = 'network'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    // var queryBatchSize = 100

    /*$scope.resultsList = []
    $scope.queriesToDo = {}*/

    /*$scope.downloadNetwork = function(){
      var network = $scope.network

      var blob = new Blob(json_graph_api.buildGEXF(network), {'type':'text/gexf+xml;charset=utf-8'});
      saveAs(blob, $scope.corpusName + ".gexf");
    }*/

    /*var statusColors = {
      IN:              "#333"
      ,UNDECIDED:      "#ADA299"
      ,OUT:            "#FAA"
      ,DISCOVERED:     "#93BDE0"
    }
    , categoriesColor = [
      "#7dce47"
      ,"#74dbff"
      ,"#d4c237"
      ,"#7951c3"
      ,"#d26229"
      ,"#f36dcb"
      ,"#ada299"
    ]*/

    // Init
    // loadCorpus()

    // Functions
    /*function loadCorpus(){
      $scope.status = {message: 'Loading web entities'}
      $scope.resultsList = []
      $scope.queriesToDo = {'in':{total:undefined,stack:[]}, 'out':{total:undefined,stack:[]}, 'undecided':{total:undefined,stack:[]}, 'discovered':{total:undefined,stack:[]}}

    }

    function loadLinks(){
      $scope.status = {message: 'Loading links'}
      api.getNetwork(
        {}
        ,function(links){
          $scope.links = links

          // $window.links = links
          // console.log('LINKS', links)
          
          buildNetwork()
          $scope.status = {}

          $scope.loading = false
          initSigma()

        }
        ,function(data, status, headers, config){
          $scope.status = {message: 'Error loading links', background:'danger'}
        }
      )
    }*/

    /*function buildNetwork(){
      $scope.network = {}
      $scope.network.attributes = []

      $scope.categorization = 'HYPHE_internal_status'
      $scope.uniqCategories = {}
      $scope.uniqCategoriesExist = false

      $scope.network.nodesAttributes = [
        {id:'attr_status', title:'Status', type:'string'}
      , {id:'attr_crawling', title:'Crawling status', type:'string'}
      , {id:'attr_indexing', title:'Indexing status', type:'string'}
      , {id:'attr_home', title:'Homepage', type:'string'}
      , {id:'attr_creation', title:'Creation', type:'integer'}
      , {id:'attr_modification', title:'Last modification', type:'integer'}
      , {id:'attr_hyphe_indegree', title:'Hyphe Indegree', type:'integer'}
      ]
      
      // Extract categories from nodes
      var categories = [], tmpCategories = {}
      $scope.webentities.all.forEach(function(we){
        for(var category in we.tags.USER){
          categories.push(category)
        }
      })

      categories = utils.extractCases(categories)
      categories.forEach(function(cat){
        $scope.network.nodesAttributes.push({id:'attr_'+md5.createHash(cat), title:cat, type:'string'})
      })
      var existingNodes = {}  // This index is useful to filter edges with unknown nodes
                              // ...and when the backend gives several instances of the same web entity

      var wes = [];
      ["in", "undecided", "out"].forEach(function(st){
        if ($scope.settings[st]) {
          wes = wes.concat($scope.webentities[st])
        }
      })
      if ($scope.settings.discovered){
        wes = wes.concat($scope.webentities["discovered"+($scope.settings.discoveredMinDegree > 0 ? "_"+$scope.settings.discoveredMinDegree : "")])
      }

      // Identify tag categories with unique values for the filtered webentities
      wes.forEach(function(we){
        for(var category in we.tags.USER){
          if (!tmpCategories[category]){
            tmpCategories[category] = {
              maxitems: 0
              ,missing_values: wes.length
              ,values: {}
            }
          }
          tmpCategories[category].maxitems = Math.max(we.tags.USER[category].length, tmpCategories[category].maxitems)
          tmpCategories[category].missing_values -= 1
          we.tags.USER[category].forEach(function(tag){
            if (!tmpCategories[category].values[tag]) {
              tmpCategories[category].values[tag] = 0
            }
            tmpCategories[category].values[tag]++
          })
        }
      })

      for (var category in tmpCategories){
        var cat = tmpCategories[category],
          catkeys = Object.keys(cat.values)
        if (cat.maxitems === 1){
          var othervalues = catkeys.length >= maxCatLegend || (!cat.missing_values && catkeys.length > maxCatLegend)
          $scope.uniqCategoriesExist = true
          $scope.uniqCategories[category] = cat
          $scope.uniqCategories[category].legend = catkeys.sort(function(a, b){
              return cat.values[b] - cat.values[a]
            })
            .slice(0, maxCatLegend - othervalues - !!cat.missing_values)
            .map(function(c, i){
              return {
                name: c
                ,color: categoriesColor[i]
              }
            })
          $scope.uniqCategories[category].colors = {}
          $scope.uniqCategories[category].legend.forEach(function(c){
            $scope.uniqCategories[category].colors[c.name] = c.color
          })
          if (catkeys.length >= maxCatLegend){
            $scope.uniqCategories[category].legend.push({
              name: 'other tag values'
              ,color: categoriesColor[6]
            })
          }
          if (cat.missing_values){
            $scope.uniqCategories[category].legend.push({
              name: 'no tag value'
              ,color: '#F00'
            })
          }
        }
      }

      $scope.network.nodes = wes.filter(function(n){
        return n !== undefined
      }).map(function(we){
        if(existingNodes[we.id] === undefined){
          var tagging = [], wecategories = {}
          for(var category in we.tags.USER){
            tagging.push({cat:category, values:we.tags.USER[category]})
          }
          Object.keys($scope.uniqCategories).forEach(function(category){
            wecategories[category] = ((we.tags.USER || {})[category] || [''])[0]
          })
          existingNodes[we.id] = true
          return {
            id: we.id
            ,label: we.name
            ,status: we.status
            ,categories: wecategories
            ,attributes: [
              {attr:'attr_status', val: we.status || 'error' }
              ,{attr:'attr_crawling', val: we.crawling_status || '' }
              ,{attr:'attr_indexing', val: we.indexing_status || '' }
              ,{attr:'attr_creation', val: we.creation_date || 'unknown' }
              ,{attr:'attr_modification', val: we.last_modification_date || 'unknown' }
              ,{attr:'attr_home', val: we.homepage || '' }
              ,{attr:'attr_hyphe_indegree', val: we.indegree || '0' }
            ].concat(tagging.map(function(catvalues){
              return {attr:'attr_'+md5.createHash(catvalues.cat), val:catvalues.values.join(' | ')}
            }))
          }
        } else {
          console.log('Duplicate id in web entities list', we.id)
        }
      }).filter(function(we){ // filter duplicates
        return we !== undefined
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

      if ( $scope.statuses.hideIsolated ) {
        $scope.network.nodes.forEach(function(n){
          if (n.inEdges.length + n.outEdges.length == 0) {
            n.hidden = true
          } else {
            n.hidden = false
          }
        })
      }

      // console.log('Network', $scope.network)
    }*/

  })
