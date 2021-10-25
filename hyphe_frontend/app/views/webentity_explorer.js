'use strict';

angular.module('hyphe.webentityExplorerController', [])

  .controller('webentityExplorer',
  function($scope,
    api,
    utils,
    $route,
    corpus,
    $location,
    $timeout,
    $rootScope
  ) {
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.explorerActive = false
    
    $scope.webentity = {id:utils.readWebentityIdFromRoute(), loading:true}

    var tree
    var currentNode = false

    $scope.loading = true
    $scope.loadAllPages = true
    $scope.pagesToken

    $scope.pages = []
    $scope.subWebentities
    $scope.parentWebentities

    $scope.path
    $scope.pathUrl

    $scope.item_list
    $scope.itemSort = 'pages'

    $scope.creationRuleLoaded = false
    $scope.creationRule = null

    $scope.$watch('itemSort', function(){
      updateExplorer()
    })

    // Init
    api.downloadCorpusTLDs(function(){
      fetchWebentity(utils.readWebentityIdFromRoute())
    })

    $scope.goTo = function(node){
      currentNode = node
      updateExplorer()
    }

    $scope.goToParent = function(){
      $scope.goTo(currentNode.parent)
    }

    $rootScope.$on('$locationChangeSuccess', function() {
      if ($scope.webentity.id !== utils.readWebentityIdFromRoute()) {
        return;
      }
      if ($scope.webentity.prefixes && tree) {
        updateFromPath()
      }
      if (!~$location.path().indexOf("/webentityExplorer"))
        $location.search("p", undefined)
    })

    $scope.$on('$destroy', function(){
      $scope.loadAllPages = false
    })

    $scope.newWebEntity = function(obj){
      $scope.status = {message: 'Declaring web entity'}
      api.declareWebentity({
          prefixes: [obj.lru]
          ,name: utils.nameLRU(obj.lru)
          ,startPages: [obj.url]
          ,lruVariations: true
        }
        ,function(result){
          $route.reload();
        }
        ,function(){
          $scope.status = {message: 'Web entity could not be declared', background: 'danger'}
        }
      )
    }

    $scope.removePrefix = function(obj){
      $scope.status = {message: 'Removing prefix'}
      api.removePrefix({
          webentityId: $scope.webentity.id
          ,lru: obj.lru
        }
        ,function(result){
          $route.reload();
        }
        ,function(){
          $scope.status = {message: 'Prefix could not be removed', background: 'danger'}
        }
      )
    }

    $scope.mergeIntoCurrent = function(old_id){
      $scope.status = {message: 'Merging web entities'}
      api.webentityMergeInto({
          oldWebentityId: old_id
          ,goodWebentityId: $scope.webentity.id
        }
        ,function(result){
          $route.reload();
        }
        ,function(){
          $scope.status = {message: 'Web entities could not be merged', background: 'danger'}
        }
      )
    }

    $scope.addWECreationRule = function(){
      $scope.status = {message: 'Loading'}
      $scope.loading = true

      api.addWECreationRules({
          prefix: currentNode.lru
          ,regexp: 'prefix+1'
        }
        ,function(result){

          $scope.status = {message: ''}
          $scope.loading = false
          $scope.pages = []
          fetchWebentity(utils.readWebentityIdFromRoute())
          updateExplorer()
        }
        ,function(){
          $scope.status = {message: 'Error adding creation rule', background: 'danger'}
        }
      )
    }

    $scope.removeWECreationRule = function(){
      $scope.status = {message: 'Loading'}
      $scope.loading = true

      api.removeWECreationRules({
          prefix: currentNode.lru
        }
        ,function(result){

          $scope.status = {message: ''}
          $scope.loading = false
          updateExplorer()
        }
        ,function(){
          $scope.status = {message: 'Error removing creation rule', background: 'danger'}
        }
      )
    }

    // Functions
    function fetchWebentity(id){

      $scope.status = {message: 'Loading Web Entity'}
      
      api.getWebentities({
          id_list:[id]
          ,crawledOnly: false
        }
        ,function(result){
          $scope.webentity = result[0]
          $scope.webentity.loading = false
          $scope.webentity.prefixes.sort(utils.sort_LRUs)

          // Triple loading
          loadPages()
          loadSubWebentities()
          loadParentWebentities()
        }
        ,function(){
          $scope.status = {message: 'Error loading web entity', background: 'danger'}
        }
      )
    }

    function loadPages(){
      api.getPaginatedPages({
          webentityId: $scope.webentity.id
          ,includePageMetas: true
          ,token: $scope.pagesToken || null
        }
        ,function(result){

          $scope.pages = $scope.pages.concat(result.pages)
          $scope.pagesToken = result.token

          checkTripleLoading()

          if ($scope.loadAllPages && $scope.pagesToken) {
            $timeout(loadPages, 0)
          }

        }
        ,function(){
          $scope.status = {message: 'Error loading pages', background: 'danger'}
        }
      )
    }

    function loadSubWebentities(){

      api.getSubWebentities({
          webentityId:$scope.webentity.id
        }
        ,function(result){

          $scope.subWebentities = result
          
          checkTripleLoading()

        }
        ,function(){
          $scope.status = {message: 'Error loading sub web entities', background: 'danger'}
        }
      )
    }

    function loadParentWebentities(){

      api.getParentWebentities({
          webentityId:$scope.webentity.id
        }
        ,function(result){

          $scope.parentWebentities = result
          
          checkTripleLoading()

        }
        ,function(){
          $scope.status = {message: 'Error loading sub web entities', background: 'danger'}
        }
      )
    }

    function checkTripleLoading(){
      var count = 0

      if($scope.pagesToken === null){
        count += 90
      }else{
        count += 89.5 * $scope.pages.length / $scope.webentity.pages_total
      }
      if($scope.subWebentities !== undefined){
        count += 5
      }
      if($scope.parentWebentities !== undefined){
        count += 5
      }
      if(count < 100 || $scope.pagesToken !== null){
        $scope.status = {message: 'Loading ' + Math.round(count) + ' %', progress:count}
      } else {
        $scope.loading = false

        buildExplorerTree()

        $scope.status = {message: ''}
      }
    }

    function loadWECreationRules(lru){

      $scope.creationRuleLoaded = false
      
      api.getWECreationRules({
          prefix:lru
        }
        ,function(result){

          $scope.creationRuleLoaded = true
          $scope.creationRule = result

        }
        ,function(){
          $scope.status = {message: 'Error loading w.e. creation rule', background: 'danger'}
        }
      )
    }
    
    function updateExplorer(){
      if (tree === undefined) {return}
      $scope.item_list = []

      var items_prefixes = []
      var items_folders = []
      var items_pages = []
      var items_subwebentities = []
      var items_parentwebentities = []

      if(!currentNode){
        
        // Home: display prefixes + parent webentities
        
        for(var p in tree.prefix){
          if(tree.prefix[p].data.prefix){
            pushPrefix(
              cleanStem(p)                // label
              ,utils.LRU_to_URL(p)        // url
              ,p                          // lru
              ,tree.prefix[p]             // node
              ,tree.prefix[p].pagesCount  // page count
            )
          }
          if(tree.prefix[p].data.page){
            pushPage(
              utils.LRU_to_URL(p)         // label
              ,utils.LRU_to_URL(p)        // url
              ,p                          // lru
              ,tree.prefix[p].data.page   // page data
              ,tree.prefix[p].data.prefix // is a prefix
            )
          }
        }

        // Parent web entities
        items_parentwebentities = $scope.parentWebentities.map(function(we){
          return {
            label: we.name
            ,type: 'parentWebentity'
            ,sortLabel: we.name.toUpperCase()
            ,data: we
          }
        })
        
        // Path
        $scope.path = []
        $scope.pathUrl = ''

        $scope.creationRuleLoaded = true
        $scope.creationRule = null

      } else {

        // Display the children

        for(var stem in currentNode.children){
          var childNode = currentNode.children[stem]
          if(childNode.data.page){
            pushPage(
              cleanStem(stem)                   // label
              ,utils.LRU_to_URL(childNode.lru)  // url
              ,childNode.lru                    // lru
              ,childNode.data.page              // page data
              ,!!childNode.data.webentity       // is a prefix
              ,stem.substr(0,1)
            )
          }
          if(childNode.data.webentity){
            pushWebentityPrefix(
              cleanStem(stem)                   // label
              ,utils.LRU_to_URL(childNode.lru)  // url
              ,childNode.lru                    // lru
              ,childNode.data.webentity         // data
            )
          }
          if(Object.keys(childNode.children).length>0){
            pushFolder(
              cleanStem(stem)                   // label
              ,utils.LRU_to_URL(childNode.lru)  // url
              ,childNode.lru                    // lru
              ,childNode                        // node
              ,childNode.pagesCount             // page data
              ,!!childNode.data.webentity       // is a prefix
              ,stem.substr(0,1)                 // type
            )
          }
        }

        // Path
        $scope.path = []
        var ancestor = currentNode
        while(ancestor !== undefined){
          var item = {
            label: cleanStem(ancestor.stem)
            ,node: ancestor
            ,pagesCount: ancestor.pagesCount
            ,data: ancestor.data || {}
          }
          $scope.path.unshift(item)
          ancestor = ancestor.parent
        }
        $scope.pathUrl = utils.LRU_to_URL(currentNode.lru)
        
        // Web entity creation rule
        loadWECreationRules(currentNode.lru)

      }

      var sortFunction
      if ($scope.itemSort == 'pages') {
        sortFunction = function(a, b) {
          if (a.pagesCount !== undefined && b.pagesCount !== undefined) {
            return b.pagesCount - a.pagesCount
          } else {
            return a.sortLabel.localeCompare(b.sortLabel)
          }
        }
      } else {
        sortFunction = function(a, b) {
          return a.sortLabel.localeCompare(b.sortLabel)
        }
      }

      // Compile different lists as single list
      if (items_prefixes.length > 0) {
        $scope.item_list.push({
          type: 'title',
          label: 'Prefix' + ((items_prefixes.length > 1)?('es'):('')) + ' of ' + $scope.webentity.name + ' (' + items_prefixes.length + ')'
        })
        $scope.item_list = $scope.item_list.concat(items_prefixes.sort(sortFunction))
      }
      if (items_folders.length > 0) {
        $scope.item_list.push({
          type: 'title',
          label: 'Folder' + ((items_folders.length > 1)?('s'):('')) + ' (' + items_folders.length + ')'
        })
        $scope.item_list = $scope.item_list.concat(items_folders.sort(sortFunction))
      }
      if (items_pages.length > 0) {
        $scope.item_list.push({
          type: 'title',
          label: 'Page' + ((items_pages.length > 1)?('s'):('')) + ' (' + items_pages.length + ')'
        })
        $scope.item_list = $scope.item_list.concat(items_pages.sort(sortFunction))
      }
      if (items_subwebentities.length > 0) {
        $scope.item_list.push({
          type: 'title',
          label: 'Child web entit' + ((items_subwebentities.length > 1)?('ies'):('y')) + ' (' + items_subwebentities.length + ')'
        })
        $scope.item_list = $scope.item_list.concat(items_subwebentities.sort(sortFunction))
      }
      if (items_parentwebentities.length > 0) {
        $scope.item_list.push({
          type: 'title',
          label: 'Parent web entit' + ((items_parentwebentities.length > 1)?('ies'):('y')) + ' (' + items_parentwebentities.length + ')'
        })
        $scope.item_list = $scope.item_list.concat(items_parentwebentities.sort(sortFunction))
      }

      // Record path in location
      if ($scope.path.length) {
        $location.search({'p':$scope.path.map(function(d){return d.node.stem}).join('/')})
      } else {
        $location.search({})
      }

      // Internal functions
      function pushPrefix(label, url, lru, node, pageCount){
        items_prefixes.push({
          label: label
          ,type: 'prefix'
          ,sortLabel: label.toUpperCase()
          ,url: url
          ,lru: lru
          ,node: node
          ,pagesCount: pageCount
        })
      }

      function pushFolder(label, url, lru, node, pageCount, isPrefix, subtype){
        items_folders.push({
          label: label
          ,type: 'folder'
          ,sortLabel: label.toUpperCase()
          ,url: url
          ,lru: lru
          ,node: node
          ,pagesCount: pageCount
          ,isPrefix: isPrefix
          ,subtype: subtype
          ,subtype_explicit: explicitType(subtype)
        })
      }

      function pushPage(label, url, lru, data, isPrefix, subtype){
        items_pages.push({
          label: label
          ,type: 'page'
          ,sortLabel: label.toUpperCase()
          ,url: url
          ,lru: lru
          ,data: data
          ,archive_date_obtained: (data.archive_date_obtained || '').replace(/^(....)(..)(..).*$/, "$1-$2-$3")
          ,isPrefix: isPrefix
          ,crawled: data.crawled
          ,subtype: subtype
          ,subtype_explicit: explicitType(subtype)
        })
      }

      function pushWebentityPrefix(label, url, lru, data){
        items_subwebentities.push({
          label: label
          ,type: 'otherWebentityPrefix'
          ,sortLabel: label.toUpperCase()
          ,url: url
          ,lru: lru
          ,data: data
          ,webentityname: data.name
        })
      }
      
    }

    function buildExplorerTree(){
      
      // Init tree
      // It is a weird structure because it starts with prefixes, which we do not split in stems.
      tree = {prefix:{}}
      
      var prefixes = $scope.webentity.prefixes

      prefixes.forEach(function(p){
        tree.prefix[p] = {children:{}, pagesCount:0, lru:p, stem:p, data:{}}
      })

      
      var pushBranch = function(lru, properties, addPageCount){
        if (lru.length == 0) { return }

        // Check that the lru ends with a pipe
        if (lru[lru.length - 1] != "|") {
          console.warn("LRU does not end with a pipe:", lru)
          lru = lru + '|'
        }

        try{
          // Find the prefix of the lru
          var prefix = prefixes.filter(function(prefix){
              return lru.indexOf(prefix) == 0
            })
            .reduce(function(current, candidate){
              return (current.length>=candidate.length)?(current):(candidate)
            }, '')

          if (prefix == '') {
            throw('No prefix found')
          }

          var path = prefix 
          var stub = lru.substr(prefix.length, lru.length - prefix.length) || ''
          var currentNode = tree.prefix[prefix]
          
          /*
          
          EXAMPLE
            lru =     'river|of|tears|'
            prefix =  'river|'
    
          In the beginning:
            path =    'river|'
            stub =    'of|tears|'

          We always have: path + stub = lru

          So at the next step:
            path = 'river|of|'
            stub = 'tears|'

          Until the stub is empty string

          */
          
          while(stub.length > 0){
            
            if(addPageCount)
              currentNode.pagesCount++
            
            var stem = stub.substr(0, stub.indexOf('|') + 1)
            if(stem.length == 0){
              throw('Empty stem')
            }
            currentNode.children[stem] = currentNode.children[stem] || {children:{}, pagesCount:0, parent:currentNode, lru:currentNode.lru+stem, stem:stem, data:{}}
            currentNode = currentNode.children[stem]
            stub = stub.substr(stem.length, stub.length)

          }

          // Copy properties
          for(var k in properties){
            currentNode.data[k] = properties[k]
          }
        } catch(e){
          console.error('Unable to push branch in explorer tree', 'lru: '+lru, e)
        }

      }

      prefixes.forEach(function(p){
        pushBranch(p, {prefix:true}, false)
      })

      $scope.pages.forEach(function(page){
        pushBranch(page.lru, {page:page}, true)
      })

      $scope.subWebentities.forEach(function(we){
        we.prefixes.forEach(function(lru){
          // Check if lru is prefixed by one of this web entity's prefixes
          // It's not necessarily the case of all these prefixes
          if ($scope.webentity.prefixes.some(function(p){
            return lru.indexOf(p) == 0
          })) {
            pushBranch(lru, {webentity:we}, false)
          }
        })
      })

      // Now we get current node from path if possible
      updateFromPath()
      
    }

    function updateFromPath(){
      var path = ($location.search()['p'] || '').split('/')
      var candidateNode = tree.prefix[path[0]]
      for(var i in path){
        if(i>0 && candidateNode !== undefined){
          candidateNode = candidateNode.children[path[i]]
        }
      }
      if (candidateNode != currentNode)
        $scope.goTo(candidateNode)
    }

    function cleanStem(stem){
      if(stem.match(/.*\|.*\|/gi)){
        return stem.substr(0, stem.length-1).split('|').map(function(s){return s.substr(2, s.length-2)}).join(' / ')
      } else {
        var type = stem.substr(0, 1)
        return stem.substr(2, stem.length-3)
          .replace(/[\n\r]/gi, '<line break>')
          .replace(/^$/gi, '<empty>')
          .replace(/^ $/, '<space>')
          .replace(/(  +)/, ' <spaces> ')
      }
    }

    function explicitType(type){
      switch(type){
        case('h'):
          return 'Host'
          break
        case('p'):
          return 'Path'
          break
        case('q'):
          return 'Query'
          break
        case('f'):
          return 'Fragment'
          break
        default:
          return 'Prefix-level'
          break
      }
    }

  })
