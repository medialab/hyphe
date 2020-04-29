'use strict';

angular.module('hyphe.manageTagsController', [])

  .controller('manageTags',
  function(
    $scope,
    api,
    corpus,
    utils,
    $location,
    $timeout,
    $filter,
    $mdColors
  ) {
    var pageSize = 1000

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

    $scope.$on("$destroy", function(){
      $scope.data = {}
    })

    $scope.generalOption = undefined
    $scope.tagCategories = {}
    $scope.tagCategoriesUntagged = {}
    $scope.filters = []

    $scope.allChecked = false
    $scope.allCheckedIndeterminate = false
    $scope.searchQuery
    $scope.displayCategory

    $scope.network

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

    $scope.toggleCheckAll = function() {
      if ($scope.allChecked) {
        // Uncheck all
        $scope.displayedEntities.forEach(function(webentity){
            webentity.selected = false
          })
        $scope.allChecked = false
      } else {
        // Check all
        $scope.displayedEntities.forEach(function(webentity){
            webentity.selected = true
          })
        $scope.allChecked = true
      }
    }

    $scope.uncheckAll = function() {
      $scope.data.in.webentities.forEach(function(webentity){
        webentity.selected = false
      })
    }

    $scope.focusCategory = function(tagCat) {
      $scope.displayCategory = tagCat
      $scope.selectedTab = 0
    }

    $scope.deleteTagFromSelection = function(tagValue, tagCat, webentities) {
      $scope.status = {message: 'Deleting tags'}
      var webentities_cured = webentities.map(function(webentity){
        webentity.tags.USER[tagCat] = webentity.tags.USER[tagCat].filter(function(d){
          return d != tagValue
        })
      })
      buildTagData()

      return api.removeTag_webentities({
          webentityId_list: webentities.map(function(we){return we.id})
          ,category: tagCat
          ,value: tagValue
        }
        ,function(){
          $scope.status = {message: ''}
        }
        ,function(error){
          $scope.status = {message: 'Could not remove tags', background:'warning'}
        }
      )
    }

    $scope.saveNewCategory = function(){
      var category = $scope.newCategory.trim()
      if (!category || $scope.tagCategories[category]) return false
      if (~category.indexOf('.')) {
        $scope.status = {message: 'Tag categories cannot include dot characters', background: 'warning'}
        return false
      }
      $scope.tagCategories[category] = []

      // Wait a frame to render the new category before resetting the form field and focus on input
      $timeout(function(){
        $scope.newCategory = ''
        var slugCat = category.replace(/[^a-z0-9]/i, '_')
        document.querySelector(".category-"+slugCat+" input").focus()
      }, 0)

      return true
    }

    $scope.downloadNetwork = function() {
      if ($scope.network) {
        var blob = new Blob([gexf.write($scope.network)], {'type':'text/gexf+xml;charset=utf-8'});
        saveAs(blob, $scope.corpusName + ".gexf", true);
      }
    }

    $scope.networkNodeClick = function(nid) {
      $scope.displayedEntities.some(function(webentity){
        if (webentity.id == nid) {
          webentity.selected = !webentity.selected
          return true
        }
      })
    }

    // Watchers

    // Watch selected to keep checked data up to date
    $scope.$watch('data.in.webentities', function(){
      // Displayed entities
      updateDisplayedEntities()

      // Checked entities
      $scope.checkedList
      if ($scope.data.in.webentities) {
        $scope.checkedList = []
        var someChecked
        var someUnchecked
        $scope.data.in.webentities.forEach(function(webentity){
          if (webentity.selected) {
            someChecked = true
            $scope.checkedList.push(webentity)
          } else {
            someUnchecked = true
          }
        })
        if (!someChecked) {
          $scope.allChecked = false
          $scope.allCheckedIndeterminate = false
        } else if (!someUnchecked) {
          $scope.allChecked = true
          $scope.allCheckedIndeterminate = false
        } else {
          $scope.allChecked = false
          $scope.allCheckedIndeterminate = true
        }
      }
    }, true)

    $scope.$watch('filters', updateDisplayedEntities)
    $scope.$watch('searchQuery', updateDisplayedEntities)
    $scope.$watch('displayedEntities', updateNetwork)
    $scope.$watch('checkedList', updateNetwork)

    $scope.addTagToSelection = function(tagValue, tagCat, webentities) {
      $scope.status = {message: 'Adding tags'}
      var webentityId_list = webentities.map(function(we){return we.id})
      webentities.forEach(function(webentity){
        webentity.tags.USER = webentity.tags.USER || []
        webentity.tags.USER[tagCat] = webentity.tags.USER[tagCat] || []
        webentity.tags.USER[tagCat].push(tagValue)
      })
      buildTagData()

      return api.addTag_webentities({
          webentityId_list: webentities.map(function(we){return we.id})
          ,category: tagCat
          ,value: tagValue
        }
        ,function(){
          $scope.status = {message: ''}
        }
        ,function(error){
          $scope.status = {message: 'Could not add tags', background:'warning'}
        }
      )
    }

    // Init
    loadInWebentities()

    // Functions
    function updateDisplayedEntities() {
      $scope.displayedEntities = $filter('tagFilter')(
        $filter('filter')(
          $scope.data.in.webentities,
          $scope.searchQuery, false, 'name'
        ),
        $scope.filters, $scope.tagCategories
      ).sort(function (a,b) {
        if (a.name < b.name) return -1;
        else if (a.name > b.name) return 1;
        return 0;
      })
    }

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
                  var tagCat = this.tagCat
                  this.values.forEach(function(val){
                    $scope.tagCategories[tagCat][val].selected = false
                  })
                  updateTags()
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
                  var tagCat = this.tagCat
                  this.values.forEach(function(val){
                    $scope.tagCategories[tagCat][val].selected = false
                  })
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
            if ($scope.data.in.token != thisToken) { return }
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
            if ($scope.data.in.token != thisToken) { return }

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
            ,count: pageSize
            ,semiLight: true
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
              loadInWebentities(result.token)
            }
          }
          ,function(data, headers, config){
            // Stop if this function was called in the meanwhile
            if (data.in.token != thisToken) { return }

            if ($scope.data.in.retry++ < 3){
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
        $scope.data.links.loaded = false
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
            $scope.data.links.loading = false
            $scope.data.links.loaded = false
            $scope.status = {message: 'Error loading links', background:'danger'}
          }
        )
        return
      }
    }

    function buildNetwork() {
      var weIndex = {}
      $scope.data.in.webentities.forEach(function(we){
        weIndex[we.id] = we
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

      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        n.color = '#AAA'
      })

      // Size nodes by indegree
      // TODO: size by other means
      var averageNonNormalizedArea = g.size / g.order // because node area = indegree
      var minSize = 1
      var totalArea = 0
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        n.initialsize = minSize + Math.sqrt(g.inDegree(nid) / averageNonNormalizedArea)
        n.size = n.initialsize
        totalArea += Math.PI * n.size * n.size
      })

      // Init Label and coordinates
      var nodesArea = totalArea
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        var xy = utils.generateRandomCoordinates(nodesArea)
        n.x = xy.x
        n.y = xy.y
        n.label = n.name
      })

      // Default color for edges
      g.edges().forEach(function(eid){
        var e = g.getEdgeAttributes(eid)
        e.color = $mdColors.getThemeColor('default-background-100')
      })

      // Make the graph global for console tinkering
      window.g = g

      $scope.network = g
      updateNetwork()
    }

    function updateNetwork() {
      var g = $scope.network
      if (g === undefined) { return }

      // Build webentity index
      var webentityIndex = {}
      $scope.data.in.webentities.forEach(function(we){
        webentityIndex[we.id] = {selected:false, displayed: false}
      })
      $scope.displayedEntities.forEach(function(we){
        webentityIndex[we.id].displayed = true
      })
      $scope.checkedList.forEach(function(we){
        webentityIndex[we.id].selected = true
      })

      // Color network
      var colors = {
        selected: $mdColors.getThemeColor('default-accent'),
        displayed: $mdColors.getThemeColor('default-primary-700'),
        regular: $mdColors.getThemeColor('default-background-200')
      }
      g.nodes().forEach(function(nid){
        if (webentityIndex[nid].selected) {
          g.setNodeAttribute(nid, 'color', colors.selected)
          g.setNodeAttribute(nid, 'size', 2.0 * +g.getNodeAttribute(nid, 'initialsize'))
        } else if (webentityIndex[nid].displayed) {
          g.setNodeAttribute(nid, 'color', colors.displayed)
          g.setNodeAttribute(nid, 'size', 1.2 * +g.getNodeAttribute(nid, 'initialsize'))
        } else {
          g.setNodeAttribute(nid, 'color', colors.regular)
          g.setNodeAttribute(nid, 'size', 1.0 * +g.getNodeAttribute(nid, 'initialsize'))
        }
      })
    }

  })
