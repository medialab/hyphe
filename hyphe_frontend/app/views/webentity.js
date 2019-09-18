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
    $timeout,
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

    $scope.$watch('tagCategories', synchronizeTags, true)

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
        $scope.homepageErrorMessage = 'Invalid URL'
        return
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
      api.getPaginatedPages({
          webentityId: $scope.webentity.id
          ,token: $scope.pagesToken
        }
        ,function(result){
          result.pages.forEach(function(page){
              page.isStartPage = $scope.webentity.startpages.includes(page.url)
          });
          $scope.pages = $scope.pages.concat(result.pages)
          $scope.pagesToken = result.token
          $scope.pagesLoading = false
          if ($scope.loadAllPages && $scope.pagesToken) {
            var percent = 99.5 * $scope.pages.length / $scope.webentity.pages_total
            $scope.status = {message: 'Loading pages ' + Math.round(percent) + ' %', progress: percent}
            $timeout($scope.loadPages, 0)
          } else {
            $scope.status = {}
          }
        }
        ,function(){
          $scope.pagesLoading = false
          $scope.status = {message: 'Error loading pages', background: 'danger'}
        }
      )
    }

    function _addStartPage(webentity, page){
      api.addStartPage({
            webentityId: webentity.id
            ,url: page.url
          }
          ,function () {
          }
          ,function (data, status, headers, config) {
            // API call fail
            // Note: cannot access global status bar from modal
            console.error('Start page could not be added', data, status, headers, config)
            $scope.RemoveStartPageOnPage(page)
          }
      )
    }
    function _removeStartPage(webentity, page){
      api.removeStartPage({
            webentityId: webentity.id
            ,url: page.url
          }
          ,function () {
          }
          ,function (data, status, headers, config) {
            // API call fail
            // Note: cannot access global status bar from modal
            console.error('Start page could not be removed', data, status, headers, config)
            $scope.AddStartPageOnPage(page)
          }
      )
    }

    $scope.RemoveStartPageOnPage=function(page){
      Object.keys($scope.webentity.tags['CORE-STARTPAGES']).forEach(function(type){
        if($scope.webentity.tags['CORE-STARTPAGES'][type].includes(page.url)){
          var pos = $scope.webentity.tags['CORE-STARTPAGES'][type].indexOf(page.url)
          $scope.webentity.tags['CORE-STARTPAGES'][type].splice(pos,1);
        }
      })
    }

    $scope.AddStartPageOnPage=function(page){
      if($scope.webentity.tags['CORE-STARTPAGES']['user']){
        $scope.webentity.tags['CORE-STARTPAGES']['user'].push(page.url);
      }
      else{
        $scope.webentity.tags['CORE-STARTPAGES'].user=[]
        $scope.webentity.tags['CORE-STARTPAGES']['user'].push(page.url)
      }
    }

    $scope.toggleStartPages=function(page){
      if (!page.isStartPage){
        $scope.RemoveStartPageOnPage(page)
        _removeStartPage($scope.webentity,page)
          }
      else{
        $scope.AddStartPageOnPage(page)
        _addStartPage( $scope.webentity, page)
      }
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
        ,function(data){
          $scope.status = {message: 'Error loading corpus tags', background: 'danger'}
        }
      )
    }

  })
