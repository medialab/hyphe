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

  .controller('webentity.explorer', ['$scope', 'api', 'utils', '$route'
  ,function($scope, api, utils, $route) {
    var tree
    ,currentNode

    $scope.loading = true

    $scope.pages
    $scope.subWebentities
    $scope.parentWebentities

    $scope.path
    $scope.items
    $scope.items_webentities

    // Init
    loadPages()

    $scope.goTo = function(node){
      currentNode = node
      updateExplorer()
    }

    $scope.goToParent = function(){
      $scope.goTo(currentNode.parent)
    }

    $scope.newWebEntity = function(obj){
      console.log('NEW WEB ENTITY on',obj)
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

    // Functions
    function loadPages(){

      $scope.status = {message: 'Loading'}

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

        }
        ,function(){
          $scope.status = {message: 'Error loading sub web entities', background: 'danger'}
        }
      )
    }
    
    function updateExplorer(){
      $scope.items = []
      $scope.items_webentities = []

      if(!currentNode){
        
        // Home: display prefixes
        
        for(var p in tree.prefix){
          if(tree.prefix[p].data.prefix){
            pushPrefix(
              utils.LRU_to_URL(p)         // label
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

      } else {

        // Display the children

        for(var stem in currentNode.children){
          var childNode = currentNode.children[stem]
          if(childNode.data.page){
            pushPage(
              cleanStem(stem, true)             // label
              ,utils.LRU_to_URL(childNode.lru)  // url
              ,childNode.lru                    // lru
              ,childNode.data.page              // page data
              ,!!childNode.data.webentity       // is a prefix
            )
          }
          if(childNode.data.webentity){
            pushWebentityPrefix(
              cleanStem(stem, true)             // label
              ,utils.LRU_to_URL(childNode.lru)  // url
              ,childNode.lru                    // lru
              ,childNode.data.webentity         // data
            )
          }
          if(Object.keys(childNode.children).length>0){
            pushFolder(
              cleanStem(stem, true)             // label
              ,utils.LRU_to_URL(childNode.lru)  // url
              ,childNode.lru                    // lru
              ,childNode                        // node
              ,childNode.pagesCount             // page data
              ,!!childNode.data.webentity       // is a prefix
            )
          }
        }

        // Path
        $scope.path = []
        var ancestor = currentNode
        while(ancestor !== undefined){
          var item = {
            label: cleanStem(ancestor.stem, false)
            ,node: ancestor
            ,pagesCount: ancestor.pagesCount
            ,data: ancestor.data || {}
          }
          $scope.path.unshift(item)
          ancestor = ancestor.parent
        }
        
      }

      $scope.items.sort(function(a,b){
        if(a.sortlabel < b.sortlabel) return -1
        if(a.sortlabel > b.sortlabel) return 1
        return 0
      })

      function pushPrefix(label, url, lru, node, pageCount){
        $scope.items.push({
          type:'prefix'
          ,label: label
          ,sortlabel: url+' 0'
          ,url: url
          ,lru: lru
          ,node: node
          ,pagesCount: pageCount
        })
      }

      function pushFolder(label, url, lru, node, pageCount, isPrefix){
        $scope.items.push({
          type:'folder'
          ,label: label
          ,sortlabel: url+' 1'
          ,url: url
          ,lru: lru
          ,node: node
          ,pagesCount: pageCount
          ,isPrefix: isPrefix
        })
      }

      function pushPage(label, url, lru, data, isPrefix){
        $scope.items.push({
          type:'page'
          ,label: label
          ,sortlabel: url+' 2'
          ,url: url
          ,lru: lru
          ,data: data
          ,isPrefix: isPrefix
          ,crawled: data.sources.some(function(d){return d == 'CRAWL'})
        })
      }

      function pushWebentityPrefix(label, url, lru, data){
        $scope.items_webentities.push({
          type:'subwe_prefix'
          ,label: label
          ,sortlabel: url
          ,url: url
          ,lru: lru
          ,data: data
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

    function cleanStem(stem, detailed){
      if(stem.match(/.*\|.*\|/gi)){
        return utils.LRU_to_URL(stem)
      } else {
        var type = stem.substr(0, 1)
        stem = stem.substr(2, stem.length-3)
          .replace(/[\n\r]/gi, '<line break>')
          .replace(/^$/gi, '<empty>')
          .replace(/^ $/, '<space>')
          .replace(/(  +)/, ' <spaces> ')
        
        if(detailed){
          switch(type){
            case('h'):
              return stem + '.'
              break
            case('p'):
              return '/' + stem
              break
            case('q'):
              return '?' + stem
              break
            case('f'):
              return '#' + stem
              break
            default:
              return '.' + stem
              break
          }
        } else {
          return stem
        }
      }
    }

  }])