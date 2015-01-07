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

  .controller('webentity.summary', ['$scope', 'api', 'utils'
  ,function($scope, api, utils) {

  }])

  .controller('webentity.explorer', ['$scope', 'api', 'utils'
  ,function($scope, api, utils) {
    var tree
    ,currentNode

    $scope.loading = true

    $scope.pages

    $scope.path
    $scope.items
    $scope.items_webentities

    // Init
    loadPages()

    $scope.goTo = function(node){
      currentNode = node
      updateExplorer()
    }

    // Functions
    function loadPages(){
      console.log('loading pages...')
      api.getPages({
          webentityId:$scope.webentity.id
        }
        ,function(result){
          console.log('...pages loaded')
          $scope.pages = result
          $scope.loading = false

          buildExplorerTree()
          updateExplorer()

        }
        ,function(){
          $scope.status = {message: 'Error loading pages', background: 'danger'}
        }
      )
    }
    
    function updateExplorer(){
      if(!currentNode){
        
        // Home: display prefixes
        
        $scope.items = []
        $scope.items_webentities = []
        
        for(var p in tree.prefix){
          var item = {
            label: utils.LRU_to_URL(p)
            ,lru: p
            ,url: utils.LRU_to_URL(p)
            ,node: tree.prefix[p]
            ,pagesCount: tree.prefix[p].pagesCount
            ,data: tree.prefix[p].data || {}
          }
          $scope.items.push(item)
        }

        // Path
        $scope.path = []

      } else {

        // Display the children

        $scope.items = []
        $scope.items_webentities = []

        for(var stem in currentNode.children){
          var item = {
            label: cleanStem(stem)
            ,lru: currentNode.children[stem].lru
            ,url: utils.LRU_to_URL(currentNode.children[stem].lru)
            ,node: currentNode.children[stem]
            ,pagesCount: currentNode.children[stem].pagesCount
            ,data: currentNode.children[stem].data || {}
          }
          $scope.items.push(item)
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
        
      }
    }

    function buildExplorerTree(){
      console.log('pages', $scope.pages)

      // Init tree.
      // It is a weird structure because it starts with prefixes, which we do not split in stems.
      tree = {prefix:{}}
      
      var prefixes = $scope.webentity.lru_prefixes

      $scope.webentity.lru_prefixes.forEach(function(p){
        tree.prefix[p] = {children:{}, pagesCount:0, lru:p, stem:p}
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
            currentNode.children[stem] = currentNode.children[stem] || {children:{}, pagesCount:0, parent:currentNode, lru:currentNode.lru+stem, stem:stem}
            currentNode = currentNode.children[stem]
            stub = stub.substr(stem.length, stub.length)

          }

          // Copy properties
          currentNode.data = properties

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

      console.log('tree', tree)
      
    }

    function cleanStem(stem){
      if(stem.match(/.*\|.*\|/gi)){
        return utils.LRU_to_URL(stem)
      } else {
        return stem.substr(2, stem.length-3)
      }
    }
    

  }])