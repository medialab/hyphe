'use strict';

angular.module('hyphe.webentityController', [])

  .controller('webentity',
  function(
    $scope,
    api,
    utils,
    corpus,
    store,
    $location,
    $window,
    $timeout,
    $mdColors,
    autocompletion
  ){
    $scope.currentPage = 'webentity'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.webentity = {id:utils.readWebentityIdFromRoute(), loading:true}

    $scope.identityEditMode = false
    $scope.identityEditLoading = false
    
    $scope.tagCategories = {}
    $scope.tagsPendingQueries = 0
    $scope.tagsAutocomplete = {}
    $scope.newCategory = ""

    $scope.crawls = []

    $scope.pages = []
    $scope.pagesLoading = true
    $scope.pagesToken = null
    $scope.loadAllPages = false
    $scope.pagesOnlyCrawled = false

    $scope.ego = {
      loading: false,
      loaded: false,
      webentities: [],
      links: [],
      network: null
    }

    $scope.$on("$destroy", function(){
      $scope.ego = {}
    })


    $scope.$watch('tagCategories', synchronizeTags, true)

    $scope.$watch('urlSearchQuery', function(newVal){
      if (!newVal) return;
      if ($scope.pagesToken && !$scope.pagesLoading && !$scope.loadAllPages) {
        $scope.loadAllPages = true
        $scope.loadPages();
      }
    }, true)

    $scope.$on('$destroy', function(){
      $scope.loadAllPages = false
    })

    $scope.enableEditMode = function(){
      $scope.webentityEdit_name = $scope.webentity.name
      $scope.webentityEdit_status = $scope.webentity.status
      $scope.webentityEdit_homepage = $scope.webentity.homepage
      $scope.identityEditMode = true
      $scope.homepageErrorMessage = ''
    }

    $scope.disableEditMode = function(){
      $scope.identityEditMode = false
      $scope.status = {}
    }

    $scope.crawlDetails = function(job){
      $location.url('/project/'+$scope.corpusId+'/monitorCrawls?id='+job._id)
    }

    $scope.reCrawl = function(oldjob){
      var obj = {webentity: $scope.webentity}
      store.set('webentities_toCrawl', [obj])
      store.set('webentity_old_crawljob', oldjob)
      $location.path('/project/'+$scope.corpusId+'/prepareCrawls')
    }

    $scope.abortCrawl = function(job){
      if(job !== undefined){
        $scope.status = {message: 'Aborting crawl job'}
        job.crawling_status = 'CANCELED'
        utils.consolidateJob(job)
        api.abortCrawlJobs({
            id: job._id
          }, function(){
            $scope.status = {}
          }, function(){
            $scope.status = {message: 'Error aborting crawl job', background:'danger'}
          }
        )
      }
    }

    $scope.saveWebEntity = function(){
      var homepageValid = checkWebEntityHomepage($scope.webentityEdit_homepage)
      if (!homepageValid) {
        $scope.homepageErrorMessage = 'This page does not seem like a valid URL.'
        return;
      } else {
        $scope.homepageErrorMessage = ''
      }
      $scope.status = {message: 'Updating web entity'}
      $scope.identityEditLoading = true
      var settings = {
        webentityId: $scope.webentity.id
        ,name: $scope.webentityEdit_name
        ,status: $scope.webentityEdit_status
        ,homepage: $scope.webentityEdit_homepage
      }
      return api.webentityUpdate(
        settings
        ,function(result){
          $scope.status = {message: ''}
          $scope.identityEditLoading = false
          $scope.identityEditMode = false
          $scope.webentity.name = settings.name
          $scope.webentity.status = settings.status
          $scope.webentity.homepage = settings.homepage
          updateWELastModifTime()
        }
        ,function(error){
          $scope.status = {message: 'Web entity update failed', background:'warning'}
          $scope.homepageErrorMessage="This page does not belong to this WebEntity, you should add the corresponding prefix before."
          $scope.identityEditLoading = false
        }
      )
    }

    $scope.saveNewCategory = function(){
      var category = $scope.newCategory.trim()
      if (!category || $scope.tagCategories[category]) {
        $scope.status = {message: 'This category already exists.', background: 'warning'}
        return false
      }
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

    // Functions
    $scope.loadPages = function(){
      $scope.pagesLoading = true
      if (!$scope.loadAllPages) {
        $scope.status = {message: 'Loading pages'}
      } else if (!$scope.pagesToken) {
        $scope.status = {message: 'Loading pages 0 %', progress: 0}
      }
      $scope.webentity.startpages_lrus = ($scope.webentity.startpages || []).map(utils.URL_to_LRU)
      api.getPaginatedPages({
          webentityId: $scope.webentity.id
          ,includePageMetas: true
          ,token: $scope.pagesToken
        }
        ,function(result){
          var pagesBatch = []
          var required_fields = ["crawled", "archive_url", "archive_date_obtained", "archive_date_requested"]
          result.pages.forEach(function(page){
            if (page.archive_date_requested) {
              page.archive_date_requested = page.archive_date_requested.replace(/^(....)(..)(..).*$/, "$1-$2-$3")
            }
            if (page.archive_date_obtained) {
              page.archive_date_obtained = page.archive_date_obtained.replace(/^(....)(..)(..).*$/, "$1-$2-$3")
            }
            if (!$scope.webentity.startpages_lrus.includes(page.lru)) {
              pagesBatch.push(page)
            } else {
              for (var p in $scope.pages) {
                if ($scope.pages[p].lru === page.lru) {
                  for (var field in required_fields) {
                    $scope.pages[p][required_fields[field]] = page[required_fields[field]]
                  }
                  break
                }
              }
            }
          });
          $scope.pages = $scope.pages.concat(pagesBatch)
          $scope.pagesToken = result.token
          if ($scope.loadAllPages && $scope.pagesToken) {
            var percent = 99.5 * $scope.pages.length / $scope.webentity.pages_total
            $scope.status = {message: 'Loading pages ' + Math.round(percent) + ' %', progress: percent}
            $timeout($scope.loadPages, 0)
          } else {
            $scope.pagesLoading = false
            $scope.status = {}
          }
        }
        ,function(){
          $scope.pagesLoading = false
          $scope.status = {message: 'Error loading pages', background: 'danger'}
        }
      )
    }

    $scope.toggleStartPages = function(page){
      var remove, msg1, msg2, func;
      if (page.isStartPage){
        remove = false
        msg1 = "Add"
        msg2 = "add"
        func = "addStartPage"
      }else{
        remove = true
        msg1 = "Remov"
        msg2 = "remov"
        func = "removeStartPage"
      }
      $scope.status = {message: msg1+'ing startpage'}
      $scope.editingStartpages = true
      api[func]({
           webentityId: $scope.webentity.id
          ,url: page.url
        }
        ,function () {
          $scope.status = {}
          UpdateStartPagesForPage(page.url, remove)
          $scope.editingStartpages = false
        }
        ,function (data, status, headers, config) {
          // API call fail
          $scope.status = {message: 'Error '+msg2+'ing startpage', background: 'danger'}
          console.error('Startpage could not be '+msg2+'ed', data, status, headers, config)
          page.isStartPage = !page.isStartPage
          $scope.editingStartpages = false
        }
      )
    }

    function UpdateStartPagesForPage(url, remove){
      if (remove) {
        var pos = $scope.webentity.startpages.indexOf(url);
        $scope.webentity.startpages.splice(pos, 1);
        Object.keys($scope.webentity.tags['CORE-STARTPAGES']).forEach(function(type){
          if($scope.webentity.tags['CORE-STARTPAGES'][type].includes(url)){
            pos = $scope.webentity.tags['CORE-STARTPAGES'][type].indexOf(url);
            $scope.webentity.tags['CORE-STARTPAGES'][type].splice(pos, 1);
          }
        })
      } else {
        $scope.webentity.startpages.push(url);
        if(!$scope.webentity.tags['CORE-STARTPAGES']) {
          $scope.webentity.tags['CORE-STARTPAGES'] = {};
        }
        if(!$scope.webentity.tags['CORE-STARTPAGES']['user']) {
          $scope.webentity.tags['CORE-STARTPAGES'].user = [];
        }
        $scope.webentity.tags['CORE-STARTPAGES']['user'].push(url);
      }
    }

    $scope.addAllStartPages = function(){
      $scope.status = {message: "Adding all known pages as startpages"}
      $scope.editingStartpages = true
      var pagesToAdd = $scope.pages.filter(function(p){
          return !p.isStartPage 
        }).map(function(p){
          return p.url
        });
      api.addStartPages({
           webentityId: $scope.webentity.id
          ,urls: pagesToAdd
        }
        ,function(){
          $scope.status = {}
          $scope.pages.forEach(function(page){
            if (!page.isStartPage) {
              page.isStartPage = true
              UpdateStartPagesForPage(page.url)
            }
          })
          $scope.editingStartpages = false
        }
        ,function(data, status, headers, config){
          $scope.status = {message: 'Error adding all pages as startpages', background: 'danger'}
          console.error('Could not add all pages as startpages', data, status, headers, config)
          $scope.editingStartpages = false
        }
      )
    }

    $scope.removeAllStartPages = function(){
      $scope.status = {message: "Removing all startpages"}
      $scope.editingStartpages = true
      api.removeStartPages({
           webentityId: $scope.webentity.id
          ,urls: $scope.webentity.startpages
        }
        ,function(){
          $scope.status = {}
          $scope.pages.forEach(function(page){
            if ($scope.webentity.startpages.includes(page.url))
              page.isStartPage = false
          })
          $scope.webentity.startpages.slice(0).forEach(function(url){
            UpdateStartPagesForPage(url, true)
          })
          $scope.editingStartpages = false
        }
        ,function(data, status, headers, config){
          $scope.status = {message: 'Error removing all startpages', background: 'danger'}
          console.error('Could not remove all startpages', data, status, headers, config)
          $scope.editingStartpages = false
        }
      )
    }

    // Init
    api.downloadCorpusTLDs(function(){
      fetchWebentity()
      fetchCrawls()
      fetchAutocompletionTags()
    })

    function synchronizeTags() {
      if ($scope.tagCategories && $scope.webentity.tags) {
        var comparison = {}
        var tagCat
        for (tagCat in $scope.tagCategories) {
          comparison[tagCat] = comparison[tagCat] || {}
          comparison[tagCat].new = $scope.tagCategories[tagCat]
        }
        for (tagCat in $scope.webentity.tags.USER) {
          comparison[tagCat] = comparison[tagCat] || {}
          comparison[tagCat].old = $scope.webentity.tags.USER[tagCat]
        }
        for (tagCat in comparison) {
          var tags = comparison[tagCat]
          var tagsToAdd = (tags.new || []).filter(function(tag){
            return (tags.old || []).indexOf(tag) < 0
          })
          var tagsToRemove = (tags.old || []).filter(function(tag){
            return (tags.new || []).indexOf(tag) < 0
          })
          tagsToAdd.forEach(function(tag){
            addTag(tag, tagCat)
          })
          tagsToRemove.forEach(function(tag){
            removeTag(tag, tagCat)
          })
        }
      }
    }

    function addTag(tag, category){
      $scope.status = {message: 'Adding tag'}
      $scope.tagsPendingQueries++
      $scope.webentity.tags.USER[category] = $scope.webentity.tags.USER[category] || []
      $scope.webentity.tags.USER[category].push(tag)
      
      return api.addTag({
          webentityId: $scope.webentity.id
          ,category: category
          ,value: tag
        }
        ,function(){
          $scope.tagsPendingQueries--
          $scope.status = {message: ''}
          updateWELastModifTime()
        }
        ,function(error){
          $scope.tagsPendingQueries--
          $scope.tagCategories[category] = $scope.tagCategories[category].filter(function(t){
            return t != tag
          })
          $scope.status = {message: 'Could not add tag', background:'warning'}
        }
      )
    }

    function removeTag(tag, category){
      $scope.status = {message: 'Removing tag'}
      $scope.tagsPendingQueries++
      $scope.webentity.tags.USER[category] = $scope.webentity.tags.USER[category].filter(function(t){
        return t != tag
      })

      return api.removeTag({
          webentityId: $scope.webentity.id
          ,category: category
          ,value: tag
        }
        ,function(){
          $scope.tagsPendingQueries--
          $scope.status = {message: ''}
          updateWELastModifTime()
        }
        ,function(error){
          $scope.tagsPendingQueries--
          $scope.tagCategories[category].push(tag)
          $scope.status = {message: 'Could not remove tag', background:'warning'}
        }
      )
    }

    function checkWebEntityHomepage(homepage){
      var lru
      try{
        lru = utils.URL_to_JSON_LRU(homepage)
      } catch(e){
        lru = ""
      }
      if (!lru || (lru.scheme !== "http" && lru.scheme !== "https")){
        return false
      }
      return true
    }

    function updateWELastModifTime(){
      $scope.webentity.last_modification_date = (new Date()).getTime()
    }

    function fetchWebentity(){
      api.getWebentities({
          id_list:[utils.readWebentityIdFromRoute()]
          ,crawledOnly: false
        }
        ,function(result){
          $scope.webentity = result[0]
          $scope.webentity.loading = false

          $scope.webentity.prefixes.sort(utils.sort_LRUs)
          $scope.webentity.tags.USER = $scope.webentity.tags.USER || {}
          $scope.webentity.tags.USER.FREETAGS = $scope.webentity.tags.USER.FREETAGS || []
          
          // Clone categories
          var tagCat
          for(tagCat in $scope.webentity.tags.USER) {
            $scope.tagCategories[tagCat] = $scope.webentity.tags.USER[tagCat].slice(0)
          }

          $scope.pages = ($scope.webentity.startpages || []).sort(function(a, b){
            return a.localeCompare(b)
          }).map(function(p){
            return {
              url: p,
              lru: utils.URL_to_LRU(p),
              isStartPage: true,
              crawled: false
            }
          })
          $scope.loadPages()
        }
        ,function(){
          $scope.status = {message: 'Error loading web entity', background: 'danger'}
        }
      )
    }

    function fetchCrawls(){
      api.webentityCrawlsList({
          webentityId: utils.readWebentityIdFromRoute()
        }
        ,function(result){
          $scope.crawls = result.map(utils.consolidateJob)
          $scope.crawls.sort(function(a, b){
            return b.created_at - a.created_at
          })
          if ($scope.crawls.some(function(job){
            return job.globalStatus != 'ACHIEVED' && job.globalStatus != 'UNSUCCESSFUL' && job.globalStatus != 'CANCELED'
          })) $timeout(fetchCrawls, 3000)
        }
        ,function(){
          $scope.status = {message: "Error loading web entity's crawls", background: 'danger'}
        }
      )
    }

    function fetchAutocompletionTags(){
      api.getTags(
        { namespace: 'USER' }
        ,function(data){
          var tagCat
          for (tagCat in data) {
            $scope.tagsAutocomplete[tagCat] = {}
            $scope.tagCategories[tagCat] = $scope.tagCategories[tagCat] || []
            var tag
            var tagCatValues = data[tagCat]
            for (tag in tagCatValues) {
              $scope.tagsAutocomplete[tagCat][tag] = tag
            }
          }
          $scope.autoComplete = autocompletion.getTagAutoCompleteFunction($scope.tagsAutocomplete)
        }
        ,function(){
          $scope.status = {message: 'Error loading corpus tags', background: 'danger'}
        }
      )
    }

    // Ego Network Section
    loadLinks()


    $scope.downloadNetwork = function() {
      if ($scope.ego.network) {
        var blob = new Blob([gexf.write($scope.ego.network)], {'type': 'text/gexf+xml;charset=utf-8'});
        saveAs(blob, $scope.corpusId+"_"+$scope.webentity.name+"_egoNetwork.gexf", true);
      }
    }

    $scope.networkNodeClick = function(node) {
      var url = "#/project/"+$scope.corpusId+"/webentity/"+$scope.ego.network.getNodeAttribute(node, 'id')
      $window.open(url, '_blank');
    }

    function loadLinks() {
      if (!$scope.ego.loaded) {
        $scope.loading = true
        $scope.status = {message: 'Loading ego network links'}
        $scope.ego.loading = true
        $scope.ego.loaded = false
        api.getWebentityEgoNetwork(
            {webentityId: $scope.webentity.id}
            ,function(links){
              $scope.ego.links = links
              $scope.ego.loading = false
              $scope.ego.loaded = true
              loadEgoWebentities()
            }
            ,function(egonetwork, status, headers, config){
              $scope.ego.loading = false
              $scope.ego.loaded = false
              $scope.status = {message: 'Error loading links for Ego network', background:'danger'}
            }
        )}
    }


    function loadEgoWebentities() {
      $scope.status = {message: 'Loading ego network web entities'}
      var egoWebentities = new Set([]);
      for (var c = 0; c < $scope.ego.links.length; c++) {
        egoWebentities.add($scope.ego.links[c][0]);
        egoWebentities.add($scope.ego.links[c][1]);
      }
      egoWebentities = Array.from(egoWebentities)
      api.getWebentities({
            id_list: egoWebentities,
            count: -1,
            light: true
          }
          , function (result) {
            $scope.status = {}
            $scope.ego.webentities = result
            buildEgoNetwork()
          }
          , function () {
            $scope.status = {message: 'Error loading Web Entities for Ego network', background: 'danger'}
          }
      )
    }

    function buildEgoNetwork() {
      //delete the current webentity from the ego webentities to get a proper egoNetwork
      for (var c = 0; c < $scope.ego.webentities.length; c++){
        if ($scope.ego.webentities[c].id === $scope.webentity.id){
          $scope.ego.webentities.splice(c,1)
          break;
        }
      }
      var weIndex = {}
      $scope.ego.webentities.forEach(function(we){
         weIndex[we.id] = we
      })

      var g = new Graph({type: 'directed', allowSelfLoops: false})

      for (var k in weIndex)
        g.addNode(k, Object.assign({}, weIndex[k]))

      $scope.ego.links.forEach(function(l) {
        if (l[0] === $scope.webentity.id || l[1] === $scope.webentity.id)
          return;
        g.importEdge({
          key: l[0] + '>' + l[1],
          source: l[0],
          target: l[1],
          attributes: {count: l[2]}
        })
      })

      var averageNonNormalizedArea = g.size / g.order // because node area = indegree
      var minSize = 4
      var totalArea = 0
      var nodesArea = totalArea
      g.nodes().forEach(function(nid){
        var n = g.getNodeAttributes(nid)
        if(n.status === "DISCOVERED"){
          n.color = '#93BDE0'
        }
        else if(n.status === "IN"){
          n.color = '#333'
        }
        else if(n.status === "UNDECIDED"){
          n.color = '#ADA299'
        }
        else if(n.status === "OUT"){
          n.color = '#FAA'
        }

        // Size nodes by indegree
        // TODO: size by other means
        n.initialsize = minSize + Math.sqrt(g.inDegree(nid) / averageNonNormalizedArea)
        n.size = n.initialsize
        totalArea += Math.PI * n.size * n.size

        // Init Label and coordinates
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
      $scope.ego.network = g
    }
  })
