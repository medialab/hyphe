'use strict';

angular.module('hyphe.webentityController', [])

  .controller('webentity', ['$scope', 'api', 'utils', 'corpus', '$routeParams'
  ,function($scope, api, utils, corpus, $routeParams) {
    $scope.currentPage = 'webentity'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.explorerActive = false
    
    $scope.webentity = {id:$routeParams.webentityId, loading:true}

    // Init
    fetchWebentity($routeParams.webentityId)

    // Functions
    function fetchWebentity(id){
      api.getWebentities({
          id_list:[id]
          ,crawledOnly: false
        }
        ,function(result){
          $scope.webentity = result[0]
          $scope.webentity.loading = false
          console.log($scope.webentity.name, $scope.webentity)
        }
        ,function(){
          $scope.status = {message: 'Error loading web entity', background: 'danger'}
        }
      )
    }
  }])



  .controller('webentity.explorer', ['$scope', 'api', 'utils', '$route', 'corpus', '$routeParams'
  ,function($scope, api, utils, $route, corpus, $routeParams) {
    $scope.currentPage = 'webentity.explorer'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.explorerActive = false
    
    $scope.webentity = {id:$routeParams.webentityId, loading:true}

    var tree
    ,currentNode

    $scope.loading = true

    $scope.pages
    $scope.subWebentities
    $scope.parentWebentities

    $scope.path
    $scope.pathUrl
    $scope.items_pages
    $scope.items_folders
    $scope.items_prefixes
    $scope.items_webentities

    $scope.sort_pages = 'sortlabel'
    $scope.sort_asc_pages = true
    $scope.sort_folders = 'sortlabel'
    $scope.sort_asc_folders = true
    $scope.sort_prefixes = 'pagesCount'
    $scope.sort_asc_prefixes = false
    $scope.sort_webentities = 'sortlabel'
    $scope.sort_asc_webentities = true

    // Init
    fetchWebentity($routeParams.webentityId)
    
    $scope.goTo = function(node){
      currentNode = node
      updateExplorer()
    }

    $scope.goToParent = function(){
      $scope.goTo(currentNode.parent)
    }

    $scope.newWebEntity = function(obj){
      $scope.status = {message: 'Declaring web entity'}
      api.declareWebentity({
          prefixes:
            utils.LRU_variations(obj.lru, {
                wwwlessVariations: true
                ,wwwVariations: true
                ,httpVariations: true
                ,httpsVariations: true
                ,smallerVariations: false
              })
          ,name: utils.nameLRU(obj.lru)
          ,startPages: [obj.url]
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

    $scope.toogleSortPrefixes = function(field){
      if($scope.sort_prefixes == field){
        $scope.sort_asc_prefixes = !$scope.sort_asc_prefixes
      } else {
        $scope.sort_asc_prefixes = true
        $scope.sort_prefixes = field
      }
    }

    $scope.toogleSortFolders = function(field){
      if($scope.sort_folders == field){
        $scope.sort_asc_folders = !$scope.sort_asc_folders
      } else {
        $scope.sort_asc_folders = true
        $scope.sort_folders = field
      }
    }

    $scope.toogleSortPages = function(field){
      if($scope.sort_pages == field){
        $scope.sort_asc_pages = !$scope.sort_asc_pages
      } else {
        $scope.sort_asc_pages = true
        $scope.sort_pages = field
      }
    }

    $scope.toogleSortWebentities = function(field){
      if($scope.sort_webentities == field){
        $scope.sort_asc_webentities = !$scope.sort_asc_webentities
      } else {
        $scope.sort_asc_webentities = true
        $scope.sort_webentities = field
      }
    }

    // Functions
    function fetchWebentity(id){

      $scope.status = {message: 'Loading'}
      
      api.getWebentities({
          id_list:[id]
          ,crawledOnly: false
        }
        ,function(result){
          $scope.webentity = result[0]
          $scope.webentity.loading = false
          
          loadPages()
        }
        ,function(){
          $scope.status = {message: 'Error loading web entity', background: 'danger'}
        }
      )
    }

    function loadPages(){
      api.getPages({
          webentityId:$scope.webentity.id
        }
        ,function(result){

          $scope.pages = result

          loadSubWebentities()

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
          
          loadParentWebentities()

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
          $scope.loading = false

          buildExplorerTree()
          updateExplorer()

          $scope.status = {message: ''}

        }
        ,function(){
          $scope.status = {message: 'Error loading sub web entities', background: 'danger'}
        }
      )
    }
    
    function updateExplorer(){
      $scope.items_pages = []
      $scope.items_folders = []
      $scope.items_prefixes = []
      $scope.items_webentities = []

      if(!currentNode){
        
        // Home: display prefixes
        
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

        // Path
        $scope.path = []
        $scope.pathUrl = ''

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
        
      }

      function pushPrefix(label, url, lru, node, pageCount){
        $scope.items_prefixes.push({
          label: label
          ,sortlabel: label
          ,url: url
          ,lru: lru
          ,node: node
          ,pagesCount: pageCount
        })
      }

      function pushFolder(label, url, lru, node, pageCount, isPrefix, type){
        $scope.items_folders.push({
          label: label
          ,sortlabel: label
          ,url: url
          ,lru: lru
          ,node: node
          ,pagesCount: pageCount
          ,isPrefix: isPrefix
          ,type: explicitType(type)
        })
      }

      function pushPage(label, url, lru, data, isPrefix, type){
        $scope.items_pages.push({
          label: label
          ,sortlabel: label
          ,url: url
          ,lru: lru
          ,data: data
          ,isPrefix: isPrefix
          ,crawled: data.sources.some(function(d){return d == 'CRAWL'})
          ,type: explicitType(type)
        })
      }

      function pushWebentityPrefix(label, url, lru, data){
        $scope.items_webentities.push({
          label: label
          ,sortlabel: label
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
      
      var prefixes = $scope.webentity.lru_prefixes

      $scope.webentity.lru_prefixes.forEach(function(p){
        tree.prefix[p] = {children:{}, pagesCount:0, lru:p, stem:p, data:{}}
      })

      
      var pushBranch = function(lru, properties, addPageCount){
        try{
          // Find the prefix of the lru
          var prefix = prefixes.filter(function(prefix){
              return lru.indexOf(prefix) == 0
            })
            .reduce(function(current, candidate){
              return (current.length>=candidate.length)?(current):(candidate)
            }, '')
          ,path = prefix 
          ,stub = lru.substr(prefix.length, lru.length - prefix.length) || ''
          ,currentNode = tree.prefix[prefix]

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
            
            // console.log(stub)

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
          console.log('Unable to push branch in explorer tree', 'lru: '+lru, e)
        }

      }

      prefixes.forEach(function(p){
        pushBranch(p, {prefix:true}, false)
      })

      $scope.pages.forEach(function(page){
        pushBranch(page.lru, {page:page}, true)
      })

      $scope.subWebentities.forEach(function(we){
        we.lru_prefixes.forEach(function(lru){
          pushBranch(lru, {webentity:we}, false)
        })
      })

      console.log('tree', tree)
      
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
      }
    }

  }])