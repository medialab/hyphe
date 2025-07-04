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
    $mdColors,
    config
  ) {
    var pageSize = 1000

    $scope.currentPage = 'manageTags'
    $scope.corpusName = corpus.getName(config.get('extraTitle') || '')
    $scope.corpusId = corpus.getId()
    $scope.headerCustomColor = config.get('headerCustomColor') || '#328dc7';

    $scope.webarchives_permalinks = null

    $scope.include_undecided = false

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
      undecided: {
        loading: false,
        loaded: false,
        token: undefined,
        page: 0,
        total: 0,
        retry: 0,
        webentities: []
      },
      webentities: [],
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
    $scope.displayedEntitiesList = ""

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

    $scope.lastClicked = null
    $scope.shiftCheck = function($event, $index, webentity){
      webentity.selected = !webentity.selected
      if ($event.shiftKey && $scope.lastClicked !== null && webentity.id !== $scope.lastClicked) {
        var first = $index, last = $scope.lastClicked;
        if (first > last) {
          first = $scope.lastClicked
          last = $index
        }
        $scope.displayedEntities.slice(first, last).forEach(function(we){
          we.selected = webentity.selected
        })
      }
      $scope.lastClicked = $index
    }

    $scope.toggleCheckAll = function() {
      $scope.lastClicked = null
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
      $scope.data.webentities.forEach(function(webentity){
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

    $scope.toggleUndecided = function(){
      $scope.include_undecided = !$scope.include_undecided
      $scope.resetInterface()
    }

    $scope.resetInterface = function(){
      $scope.data.webentities = $scope.data.in.webentities.concat($scope.include_undecided ? $scope.data.undecided.webentities : [])
      if (!$scope.data.links.loaded) loadLinks()
      else buildNetwork()
      buildTagData()
    }

    // Watchers

    // Watch selected to keep checked data up to date
    $scope.$watch('data.webentities', function(){
      // Displayed entities
      updateDisplayedEntities()

      // Checked entities
      $scope.checkedList
      if ($scope.data.webentities) {
        $scope.checkedList = []
        var someChecked
        var someUnchecked
        $scope.data.webentities.forEach(function(webentity){
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
    $scope.$watch('displayedEntitiesList', function(){
      $scope.lastClicked = null
    })

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
    api.globalStatus({}, function(status){
      var webarchives_date = status.corpus.options.webarchives_date.replace(/-/g, "") + "000000"
      $scope.webarchives_permalinks = (status.hyphe.available_archives.filter(function(a){ return a.id === status.corpus.options.webarchives_option })[0].permalinks_prefix || "")
        .replace("DATETIME", webarchives_date)
        .replace("DATE:TIME", webarchives_date.replace(/^(....)(..)(..)(..)(..)(..)$/, "$1-$2-$3T$4:$5:$6"))
      loadWebentities('in')
    })

    // Functions
    function updateDisplayedEntities() {
      $scope.displayedEntities = $filter('tagFilter')(
        $filter('filter')(
          $scope.data.in.webentities.concat($scope.include_undecided ? $scope.data.undecided.webentities : []),
          $scope.searchQuery, false, 'name'
        ),
        $scope.filters, $scope.tagCategories
      ).sort(function(a, b) {
        if (a.name < b.name) return -1;
        else if (a.name > b.name) return 1;
        return 0;
      })
      $scope.displayedEntities.forEach(function(we){
        we.webarchives_homepage = utils.getArchivesPermalinks(we.homepage, $scope.webarchives_permalinks)
      })
      $scope.displayedEntitiesList = $scope.displayedEntities.map(function(we){ return we.id }).join("|")
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
              if (valData && valData.selected) {
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
                  this.values.filter(function(val){
                    return $scope.tagCategories[tagCat][val]
                  }).forEach(function(val){
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
                  this.values.filter(function(val){
                    return $scope.tagCategories[tagCat][val]
                  }).forEach(function(val){
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
                  if ($scope.tagCategories[this.tagCat][this.values[0]])
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
      $scope.data.webentities
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

    function loadWebentities(status, thisToken) {
      $scope.loading = true
      if ($scope.data[status].loading && $scope.data[status].token) {
        // Retrieve from query token
        $scope.status = {message:'Loading ' + status.toUpperCase() + ' web entities', progress: Math.round(100 * $scope.data[status].webentities.length/$scope.data[status].total)}
        api.getResultsPage(
          {
            token: $scope.data[status].token
            ,page: ++$scope.data[status].page
          }
          ,function(result){
            // Stop if this function was called in the meanwhile
            if ($scope.data[status].token != thisToken) { return }
            $scope.data[status].webentities = $scope.data[status].webentities.concat(result.webentities)
            if ($scope.data[status].webentities.length >= $scope.data[status].total) {
              $scope.data[status].loading = false
              $scope.data[status].loaded = true
              $scope.status = {}
              if (status == 'in')
                loadWebentities('undecided')
              else $scope.resetInterface()
            } else {
              loadWebentities(status, thisToken)
            }
          }
          ,function(data, status, headers, config){
            // Stop if this function was called in the meanwhile
            if ($scope.data[status].token != thisToken) { return }

            if ($scope.data[status].retry++ < 3){
              console.warn('Error loading results page: Retry', $scope.data[status].retry)
              loadWebentities(status, thisToken)
            } else {
              console.log('Error loading results page:', data, headers, config)
              $scope.status = {message: 'Error loading results page', background: 'danger'}
            }
          }
        )
      } else {
        // Initial query
        $scope.status = {message:'Loading ' + status.toUpperCase() + ' web entities'}
        $scope.data[status].loading = true
        $scope.data[status].loaded = false
        $scope.data[status].token = undefined
        $scope.data[status].page = 0
        $scope.data[status].retry = 0
        api.getWebentities_byStatus(
          {
            status: status.toUpperCase()
            ,count: pageSize
            ,semiLight: true
            ,page: 0
          }
          ,function(result){

            $scope.data[status].total = result.total_results
            $scope.data[status].token = result.token

            $scope.data[status].webentities = $scope.data[status].webentities.concat(result.webentities)
            if ($scope.data[status].webentities.length >= $scope.data[status].total) {
              $scope.data[status].loading = false
              $scope.data[status].loaded = true
              $scope.status = {}
              if (status == 'in')
                loadWebentities('undecided')
              else $scope.resetInterface()
            } else {
              loadWebentities(status, result.token)
            }
          }
          ,function(data, headers, config){
            // Stop if this function was called in the meanwhile
            if (data[status].token != thisToken) { return }

            if ($scope.data[status].retry++ < 3){
              console.warn('Error loading web entities: Retry', $scope.data[status].retry)
              loadWebentities(status, thisToken)
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
      $scope.data.webentities.forEach(function(we){
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
      $scope.data.webentities.forEach(function(we){
        webentityIndex[we.id] = {selected:false, displayed: false}
      })
      $scope.displayedEntities.forEach(function(we){
        if (webentityIndex[we.id])
          webentityIndex[we.id].displayed = true
      })
      $scope.checkedList.forEach(function(we){
        if (webentityIndex[we.id])
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
