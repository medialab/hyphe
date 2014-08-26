'use strict';

/* Controllers */

/*
  Getting the scope from the console with our general template:
  s = angular.element('body>div:first>div:first').scope();
*/

angular.module('hyphe.controllers', [])

  .controller('Login', ['$scope', function($scope) {
  	$scope.currentPage = 'login'
  }])



  .controller('Overview', ['$scope', 'api', function($scope, api) {
    $scope.currentPage = 'overview'
    api.getWebentities({light: true}, function(data){
      $scope.webEntities = data
    })
  }])



  .controller('ImportUrls', ['$scope', 'FileLoader', 'Parser', 'extractURLs', 'droppableTextArea', 'store', function($scope, FileLoader, Parser, extractURLs, droppableTextArea, store) {
    $scope.currentPage = 'importurls'
    
    var parser = new Parser()

    $scope.parsingOption = 'csv'

    $scope.dataText = ''
    $scope.table
    $scope.columns = []
    $scope.selectedColumn
    $scope.textPreview = []
    $scope.headline = true
    $scope.previewMaxRow = 4
    $scope.previewMaxCol = 3

    
    // Custom filtering process
    $scope.$watch('dataText', updatePreview)
    $scope.$watch('parsingOption', updatePreview)
    $scope.$watch('headline', updatePreview)

    function updatePreview() {
      // Parse URLs
      if($scope.parsingOption=='text'){
        $scope.textPreview = extractURLs($scope.dataText)
      } else{
        $scope.table = buildTable($scope.dataText, $scope.parsingOption)
      }
      
      // Store parsing results
      if($scope.parsingOption == 'text'){
        store.set('parsedUrls_type', 'list')
        store.set('parsedUrls', $scope.textPreview)
      } else {
        store.set('parsedUrls_type', 'table')
        store.set('parsedUrls', $scope.table)
      }

      function buildTable(text, mode) {
        if(text == '')
          return [[]]

        var data_text = String(text)
          ,array_data = ((mode=='scsv')?(parser.parseSCSV(data_text)):(mode=='tsv')?(parser.parseTSV(data_text)):(parser.parseCSV(data_text)))

        if(!$scope.headline){
          var headrow = array_data[0].map(function(col, i){return 'Col ' + (i+1)})
          array_data.unshift(headrow)
        }

        return array_data
      }
    }

    // Setting the columns list
    $scope.$watch('table', function(){
      // Default: first column
      var selectedColumnId = 0
        ,found = false

      // We look at the column names
      if($scope.table[0]){
        $scope.table[0].forEach(function(col, i){
          var text = col.toLowerCase()
          if(!found && (text.indexOf('url') >= 0 || text.indexOf('adress') >= 0 || text.indexOf('address') >= 0 || text.indexOf('lien') >= 0 || text.indexOf('link') >= 0 || text.indexOf('http') >= 0 || text.indexOf('www') >= 0)){
            found = true
            selectedColumnId = i
          }
        })
      }

      // Else we search for URLs in the first 10 lines
      if(!found && $scope.table[1]){
        for(var row = 1; row < 10 && !found && $scope.table[row]; row++){
          $scope.table[row].forEach(function(col, i){
            if(extractURLs(col).length > 0 && !found){
              found = true
              selectedColumnId = i
            }
          })
        }
      }

      $scope.columns = $scope.table[0].map(function(col, i){return {name:col, id:i}})
      $scope.selectedColumn = $scope.columns[selectedColumnId]

      // Store these settings
      store.set('parsedUrls_settings', {urlColId: selectedColumnId})
    })

    // File loading interactions
    $scope.loadFile = function(){
      $('#hidden-file-input').trigger('click');
    }

    $scope.setFile = function(element) {
      var file = element.files[0]
      $scope.readFile(file)
    }

    $scope.readFile = function(file){
      var fileLoader = new FileLoader()
      fileLoader.read(file, {
        onloadstart: function(evt){
          $scope.status = {message: 'Upload started'}
          $scope.$apply()
        }
        ,onprogress: function(evt){
          // evt is a ProgressEvent
          if (evt.lengthComputable) {
            var msg = 'Upload ' + Math.round((evt.loaded / evt.total) * 100) + '% completed'
            $scope.status = {message: msg, progress:Math.round((evt.loaded / evt.total) * 100)}
            $scope.$apply()
          }
        }
        ,onload: function(evt){
          var target = evt.target || evt.srcElement
          $scope.dataText = target.result
          $scope.status = {}
          $scope.$apply()
        }
      })
    }

    // Make the text area droppable
    droppableTextArea(document.getElementById("droppable-text-area"), $scope, $scope.readFile)
  }])



  .controller('DefineWebEntities', ['$scope', 'store', 'utils', 'api', 'QueriesBatcher', '$location', 'PrefixConflictsIndex',
    function($scope, store, utils, api, QueriesBatcher, $location, PrefixConflictsIndex) {
    
    $scope.currentPage = 'definewebentities'
    $scope.activeRow = 0
    $scope.wwwVariations = true
    $scope.httpsVariations = true
    $scope.list = []
    $scope.list_hidden = []
    $scope.list_byId = {}
    $scope.createdList = []
    $scope.existingList = []
    $scope.conflictedList = []
    $scope.errorList = []
    $scope.retry = false
    $scope.loadingWebentities = false
    $scope.creating = false
    $scope.crawlExisting = false
    $scope.retryConflicted = true

    // Build the basic list of web entities
    var list
    if(store.get('parsedUrls_type') == 'list'){
      list = store.get('parsedUrls')
        .map(function(url, i){
          return {
              id: i
              ,url: url
            }
        })

    } else if(store.get('parsedUrls_type') == 'table') {
      var settings = store.get('parsedUrls_settings')
      ,table = store.get('parsedUrls')
      
      // Table headline
      $scope.headline = table.shift().filter(function(d,i){return i != settings.urlColId})
      
      list = table.map(function(row, i){
        var meta = {}
        table[0].forEach(function(colName,j){
          if(j != settings.urlColId)
            meta[colName] = row[j]
        })
        return {
          id:i
          ,url:row[settings.urlColId]
          ,row:row.filter(function(d,i){return i != settings.urlColId})
          ,meta:meta
        }
      })
    }

    // Clean store
    store.remove('parsedUrls')
    store.remove('parsedUrls_type')
    store.remove('parsedUrls_settings')

    // Build the list
    bootstrapUrlList(list)

    if($scope.list.length==0){
      $location.path('/importurls')
    }

    // Fetching parent web entities
    var fetchParentWebEntities = function(){
      $scope.loadingWebentities = true
      var queriesBatcher = new QueriesBatcher()
      $scope.list.forEach(function(obj){
        queriesBatcher.addQuery(
            api.getLruParentWebentities             // Query call
            ,{lru: obj.lru}                         // Query settings
            ,function(webentities){                 // Success callback
                obj.parentWebEntities = webentities
                obj.status = 'loaded'
              }
            ,function(data, status, headers){       // Fail callback
                obj.status = 'error'
                console.log('[row '+(obj.id+1)+'] Error while fetching parent webentities for', obj.url, data, 'status', status, 'headers', headers)
                if(data && data[0] && data[0].code == 'fail'){
                  obj.infoMessage = data[0].message
                }
              }
            ,{                                      // Options
                label: obj.lru
                ,before: function(){
                    obj.status = 'pending'
                  }
              }
          )
      })

      queriesBatcher.atEachFetch(function(list,pending,success,fail){
        var summary = {
          total: list.length + pending.length + success.length + fail.length
          ,pending: pending.length
          ,loaded: success.length + fail.length
        }
        ,percent = Math.round((summary.loaded / summary.total) * 100)
        ,percent_pending = Math.round((summary.pending / summary.total) * 100)
        ,msg = percent + '% loaded'
        $scope.status = {message: msg, progress:percent, progressPending:percent_pending}
      })

      queriesBatcher.atFinalization(function(list,pending,success,fail){
        $scope.loadingWebentities = false
        $scope.status = {}
      })

      queriesBatcher.run()
    }
    fetchParentWebEntities()


    // Create web entities
    $scope.createWebEntities = function(){
      $scope.creating = true
      $scope.retry = false
      $scope.status = {message:'Creating web entities'}

      // Keep track of created web entity prefixes
      var createdPrefixes = {}

      // Mark all "existing"
      $scope.list.forEach(function(obj){
          var webentityFound
          obj.parentWebEntities.forEach(function(we){
            if(!webentityFound && we.stems_count == obj.truePrefixLength){
              webentityFound = we
            }
          })
          if(webentityFound){
            obj.status = 'existing'
            obj.webentity = webentityFound
          }
        })

      // Query the rest
      var queriesBatcher = new QueriesBatcher()
      $scope.list
        .filter(function(obj){
            var webentityFound
            obj.parentWebEntities.forEach(function(we){
              if(!webentityFound && we.stems_count == obj.truePrefixLength){
                webentityFound = we
              }
            })
            return obj.status == 'loaded' && webentityFound === undefined
          })
        .forEach(function(obj){
          // Stack the query
          queriesBatcher.addQuery(
              api.declareWebentity                  // Query call
              ,function(){                          // Query settings as a function
                  // Compute prefix variations
                  obj.prefixes = utils.LRU_variations(utils.LRU_truncate(obj.lru, obj.truePrefixLength), {
                    wwwlessVariations: $scope.wwwVariations
                    ,wwwVariations: $scope.wwwVariations
                    ,httpVariations: $scope.httpsVariations
                    ,httpsVariations: $scope.httpsVariations
                    ,smallerVariations: false
                  })

                  if(obj.prefixes.some(function(lru){
                    return createdPrefixes[lru]
                  })){
                    obj.status = 'conflict'
                    obj.prefixes.forEach(function(lru){
                      createdPrefixes[lru] = obj.id
                    })
                    return {_API_ABORT_QUERY:true}
                  }
                  obj.prefixes.forEach(function(lru){
                    createdPrefixes[lru] = obj.id
                  })

                  return {
                    prefixes: obj.prefixes
                    ,name: utils.nameLRU(utils.LRU_truncate(obj.lru, obj.truePrefixLength))
                    ,startPages: [obj.url]
                  }
                }
              ,function(we){                        // Success callback
                  obj.status = 'created'
                  obj.webentity = we
                }
              ,function(data, status, headers){     // Fail callback
                  obj.status = 'error'
                  console.log('[row '+(obj.id+1)+'] Error while fetching parent webentities for', obj.url, data, 'status', status, 'headers', headers)
                  if(data && data[0] && data[0].code == 'fail'){
                    obj.infoMessage = data[0].message
                  }
                }
              ,{                                    // Options
                  label: obj.lru
                  ,before: function(){
                      obj.status = 'pending'
                    }
                }
            )
        })

      queriesBatcher.atEachFetch(function(list,pending,success,fail){
        var summary = {
          total: list.length + pending.length + success.length + fail.length
          ,pending: pending.length
          ,loaded: success.length + fail.length
        }
        ,percent = Math.round((summary.loaded / summary.total) * 100)
        ,percent_pending = Math.round((summary.pending / summary.total) * 100)
        ,msg = percent + '% created'
        $scope.status = {message: msg, progress:percent, progressPending:percent_pending}
      })

      // FINALIZATION
      queriesBatcher.atFinalization(function(list,pending,success,fail){
        // Move treated web entities to other lists
        $scope.list = $scope.list.filter(function(obj){
            
            // Existing
            if(obj.status == 'existing'){
              $scope.existingList.push(obj)
              return false
            }

            // Created
            if(obj.status == 'created'){
              $scope.createdList.push(obj)
              return false
            }

            // Conflicted
            if(obj.status == 'conflict'){
              $scope.conflictedList.push(obj)
              return true
            }

            // The rest: errors
            $scope.errorList.push(obj)
            return true

            // NB: we return true because this way items stay in the list for monitoring
          })



        updatePagination()

        // Status message
        var count = $scope.createdList.length
        ,msg = count + ' web entit' + (count>1 ? 'ies' : 'y') + ' created'
        $scope.status = {message: msg}
        
        $scope.creating = false
      })

      queriesBatcher.run()
    }

    $scope.doRetry = function(withConflictsFlag){
      var withConflicts = $scope.retryConflicted || withConflictsFlag
      $scope.conflictedList = []
      $scope.errorList = []
      $scope.retry = true

      var list = $scope.list
      if(!withConflicts){
        list = list.filter(function(obj){
          return obj.status != 'conlict'
        })
      }

      // Reinitialize
      bootstrapUrlList(list)

      // Reload
      fetchParentWebEntities()
    }

    $scope.doCrawl = function(withExisting){

      function cleanObj(obj){
        return {
            webentity: obj.webentity
            // ,meta: obj.meta
          }
      }
      var list = $scope.createdList
        .map(cleanObj)
        .filter(function(obj){return obj.webentity.id !== undefined})
      
      // Remove doublons
      list = utils.extractCases(list, function(obj){
        return obj.webentity.id
      })

      if(withExisting){
        $scope.existingList.forEach(function(obj){
          if(obj.webentity.id !== undefined){
            list.push(cleanObj(obj))
          }
        })
      }

      store.set('webentities_toCrawl', list)
      $location.path('/checkStartPages')
    }

    function bootstrapUrlList(list){
      if(list){
        // Consolidate the list of web entities
        list = list
          // Filter out invalid URLs
          .filter(function(obj){
              return obj.url && utils.URL_validate(obj.url)
            })
          // Bootstrap the object
          .map(bootstrapPrefixObject)

        // Pagination
        initPagination(0, 50, list.length)

        $scope.goToPage = function(page){
          if(page >= 0 && page < Math.ceil(list.length/$scope.paginationLength))
            $scope.page = page
        }

        // Building an index of these objects to find them by id
        list.forEach(function(obj){
          $scope.list_byId[obj.id] = obj
        })

        // Catching conflicts: we use this index of LRU prefixes set in the UI
        $scope.conflictsIndex = new PrefixConflictsIndex($scope.list_byId)
        // NB: it is recorded in the model because the hyphePrefixSliderButton directives needs to access it

        list.forEach(function(obj){
          $scope.conflictsIndex.addToLruIndex(obj)
        })

        // Record list in model
        $scope.list = list

      } else {

        $scope.list = []
      }
    }

    function bootstrapPrefixObject(obj){
      obj.url = utils.URL_fix(obj.url)
      obj.lru = utils.URL_to_LRU(utils.URL_stripLastSlash(obj.url))
      obj.tldLength = utils.LRU_getTLD(obj.lru).split('.').length
      obj.json_lru = utils.URL_to_JSON_LRU(utils.URL_stripLastSlash(obj.url))
      obj.pretty_lru = utils.URL_to_pretty_LRU(utils.URL_stripLastSlash(obj.url))
        .map(function(stem){
            var maxLength = 12
            if(stem.length > maxLength+3){
              return stem.substr(0,maxLength) + '...'
            }
            return stem
          })
      obj.prefixLength = 3
      obj.truePrefixLength = obj.prefixLength - 1 + obj.tldLength
      obj.conflicts = []
      obj.status = 'loading'
      return obj
    }

    function initPagination(page, pl, l){
      $scope.page = page
      $scope.paginationLength = pl
      $scope.pages = utils.getRange(Math.ceil(l/$scope.paginationLength))
    }

    function updatePagination(){
      var max = Math.ceil($scope.list.length/$scope.paginationLength)
      if($scope.page >= max)
      $scope.page = max - 1
      $scope.pages = utils.getRange(max)
    }
  }])



  .controller('NewCrawl', ['$scope', 'api', function($scope, api) {
    $scope.currentPage = 'newCrawl'
    api.getWebentities({light: true}, function(data){
      $scope.webEntities = data
    })
  }])



  .controller('CheckStartPages', ['$scope', 'api', 'store', 'utils', '$location', 'QueriesBatcher', '$modal'
  ,function($scope, api, store, utils, $location, QueriesBatcher, $modal) {
    $scope.currentPage = 'checkStartPages'

    $scope.lookups = {}
    $scope.crawlAnyway = false
    $scope.crawlDepth = 1
    
    $scope.list = bootstrapList(store.get('webentities_toCrawl'))

    // Build index
    var list_byId = {}
    $scope.list.forEach(function(obj){
      list_byId[obj.id] = obj
    })

    // Clean store
    // store.remove('webentities_toCrawl')

    if($scope.list.length==0){
      $location.path('/newCrawl')
    }

    // Get web entities (including start pages)
    $scope.getWebentities = function(opt){
      // Options
      opt = opt || {}
      // opt.skip_when_start_pages_exist
      // opt.list

      $scope.status = {message:'Loading Web Entities'}

      var queriesBatcher = new QueriesBatcher()
      ,listToQuery = opt.list || $scope.list

      if(opt.skip_when_start_pages_exist){
        listToQuery = listToQuery.filter(function(obj){
          return obj.webentity.startpages === undefined
        })
      }

      listToQuery.forEach(function(obj){
        // Stack the query
        queriesBatcher.addQuery(
            api.getWebentities                    // Query call
            ,{                                    // Query settings
                id_list:[obj.webentity.id]
              }
            ,function(we_list){                   // Success callback
                if(we_list.length > 0){
                  obj.status = 'loaded'
                  obj.webentity = we_list[0]
                  updateStartPageLookups(obj)
                } else {
                  obj.status = 'error'
                  console.log('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', we_list, 'status:', status)
                }
              }
            ,function(data, status, headers){     // Fail callback
                obj.status = 'error'
                console.log('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', data, 'status:', status)
                if(data && data[0] && data[0].code == 'fail'){
                  obj.infoMessage = data[0].message
                }
              }
            ,{                                    // Options
                label: obj.webentity.id
                ,before: function(){
                    obj.status = 'pending'
                  }
              }
          )
      })

      queriesBatcher.atEachFetch(function(list,pending,success,fail){
        var summary = {
          total: list.length + pending.length + success.length + fail.length
          ,pending: pending.length
          ,loaded: success.length + fail.length
        }
        ,percent = Math.round((summary.loaded / summary.total) * 100)
        ,percent_pending = Math.round((summary.pending / summary.total) * 100)
        ,msg = percent + '% loaded'
        $scope.status = {message: msg, progress:percent, progressPending:percent_pending}
      })

      queriesBatcher.atFinalization(function(list,pending,success,fail){
        // Status message
        $scope.status = {}
      })

      queriesBatcher.run()
    }
    $scope.getWebentities()

    // Declaring a start page
    $scope.addStartPage = function(objId, apply){

      var obj = list_byId[objId]
      ,url = obj.currentStartPageInput

      obj.startPageInvalid = !utils.URL_validate(url)

      if(obj.startPageInvalid){

        alert('This URL is not valid:\n'+ url)

      } else {
        var url_is_prefixed = checkUrlPrefixed(url, obj.webentity.lru_prefixes)
        if(url_is_prefixed){

          addStartPageAndReload(obj.id, url)

        } else {

          /* Instanciate and open the Modal */
          var modalInstance = $modal.open({
            templateUrl: 'partials/sub/startpagemodal.html'
            ,size: 'lg'
            ,controller: startPageModalCtrl
            ,resolve: {
              url: function () {
                  return url
                }
              ,webentity: function () {
                  return obj.webentity
                }
            }
          })

          modalInstance.result.then(function (feedback) {
            // On 'OK'
            if(feedback.task){
              if(feedback.task.type == 'addPrefix'){
                
                // Add Prefix
                var prefix = feedback.prefix
                ,wwwVariations = feedback.wwwVariations
                ,httpsVariations = feedback.httpsVariations
                ,prefixes = utils.LRU_variations(prefix, {
                    wwwlessVariations: wwwVariations
                    ,wwwVariations: wwwVariations
                    ,httpVariations: httpsVariations
                    ,httpsVariations: httpsVariations
                    ,smallerVariations: false
                  })
                
                var queriesBatcher = new QueriesBatcher()
                prefixes.forEach(function(prefix){
                  // Stack the query
                  queriesBatcher.addQuery(
                      api.addPrefix                         // Query call
                      ,{                                    // Query settings
                          webentityId: obj.webentity.id
                          ,lru: prefix
                        }
                      ,function(){                          // Success callback
                        }
                      ,function(data, status, headers){     // Fail callback
                          $scope.status = {message:'Prefix could not be added', background:'danger'}
                        }
                      ,{                                    // Options
                          label: 'add '+prefix
                        }
                    )
                })

                queriesBatcher.atFinalization(function(list,pending,success,fail){
                  if(fail.length == 0)
                    addStartPageAndReload(obj.id, url)
                })

                queriesBatcher.run()

              } else if(feedback.task.type == 'merge'){
                
                // Merge web entities
                var webentity = feedback.task.webentity
                $scope.status = {message:'Merging web entities'}
                obj.status = 'merging'
                api.webentitiesMerge({
                    goodWebentityId: obj.webentity.id
                    ,oldWebentityId: webentity.id
                  }
                  ,function(data){
                    // If it is in the list, remove it...
                    purgeWebentityFromList(webentity)

                    addStartPageAndReload(obj.id, url)
                  }
                  ,function(data, status, headers, config){
                    $scope.status = {message:'Merge failed', background:'danger'}
                  }
                )

              }
            }
          }, function () {
            // On dismiss: nothing happens
          })

        }
      }
    }
    
    // Removing a start page
    $scope.removeStartPage = function(url, objId){
      removeStartPageAndReload(objId, url)
    }

    $scope.startPageValidate = function(objId){
      var obj = list_byId[objId]
      ,url = obj.currentStartPageInput

      obj.startPageInvalid = !utils.URL_validate(url) && url != ''
    }

    $scope.testAgain = function(rowId){
      reloadRow(rowId)
    }

    $scope.crawl = function(){
      console.log('crawl')

      function cleanObj(obj){
        return {
            webentity: obj.webentity
            ,depth: $scope.crawlDepth
          }
      }
      var list = $scope.list
        .map(cleanObj)
        .filter(function(obj){return obj.webentity.id !== undefined})
      
      store.set('webentities_toCrawl', list)
      $location.path('/launchCrawl')
    }

    function bootstrapList(list){
      list = list || []

      // Remove doublons
      list = utils.extractCases(list, function(obj){
        return obj.webentity.id
      })

      // Pagination
      initPagination(0, 50, list.length)
      
      // Clean and set exactly what we need
      return list.map(function(obj, i){
        return {
          id:i
          ,webentity: obj.webentity
          ,status: 'loading'
          ,collapsed: true
          ,startpagesSummary: {status: 'loading'}
        }
      })
    }

    function initPagination(page, pl, l){
      $scope.page = page
      $scope.paginationLength = pl
      $scope.pages = utils.getRange(Math.ceil(l/$scope.paginationLength))
    }

    function updatePagination(){
      var max = Math.ceil($scope.list.length/$scope.paginationLength)
      if($scope.page >= max)
      $scope.page = max - 1
      $scope.pages = utils.getRange(max)
    }

    function checkUrlPrefixed(url, lru_prefixes){
      var lru = utils.URL_to_LRU(url)
      ,lru_valid = false
      lru_prefixes.forEach(function(lru_prefix){
          if(lru.indexOf(lru_prefix) == 0)
              lru_valid = true
      })
      return lru_valid
    }

    function addStartPageAndReload(rowId, url){
      var obj = list_byId[rowId]
      obj.status = 'loading'
      _addStartPage(obj, url, function(){
        reloadRow(obj.id)
      })
    }

    function removeStartPageAndReload(rowId, url){
      var obj = list_byId[rowId]
      obj.status = 'loading'
      _removeStartPage(obj, url, function(){
        reloadRow(obj.id)
      })
    }

    function reloadRow(rowId){
      var obj = list_byId[rowId]
      obj.status = 'loading'

      // Reset the lookups
      obj.webentity.startpages.forEach(function(url){
        delete $scope.lookups[url]
      })
      updateRowForLookup(obj.id)

      api.getWebentities({
          id_list: [obj.webentity.id]
        }
        ,function(we_list){
          if(we_list.length > 0){
            obj.status = 'loaded'
            obj.webentity = we_list[0]
            updateStartPageLookups(obj)
          } else {
            obj.status = 'error'
            console.log('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', we_list, 'status:', status)
          }
        }
        ,function(data, status, headers, config){
          obj.status = 'error'
          console.log('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', data, 'status:', status)
          if(data && data[0] && data[0].code == 'fail'){
            obj.infoMessage = data[0].message
          }
        }
      )
    }

    // This function only performs the API call
    function _addStartPage(obj, url, callback){
      api.addStartPage({
          webentityId: obj.webentity.id
          ,url: url
        }
        ,function(data){
          if(callback)
            callback(data)
          else
            obj.status = 'loaded'
        }
        ,function(data, status, headers, config){
          $scope.status = {message:'Start page could not be added', background:'danger'}
          if(callback)
            callback(data)
          else
            obj.status = 'loaded'
        }
      )
    }

    // This function only performs the API call
    function _removeStartPage(obj, url, callback){
      api.removeStartPage({
          webentityId: obj.webentity.id
          ,url: url
        }
        ,function(data){
          if(callback)
            callback(data)
          else
            obj.status = 'loaded'
        }
        ,function(data, status, headers, config){
          $scope.status = {message:'Start page could not be removed', background:'danger'}
          if(callback)
            callback(data)
          else
            obj.status = 'loaded'
        }
      )
    }

    function purgeWebentityFromList(webentity){
      var objFound
      $scope.list = $scope.list.filter(function(obj){
        if(obj.webentity.id == webentity.id){
          objFound = obj
          return false
        }
        return true
      })
      if(objFound){
        delete list_byId[objFound.id]
      }
    }

    function updateStartPageLookups(obj){
      var something_changed = false
      // Add the new start pages to the lookup data if needed
      obj.webentity.startpages.forEach(function(sp){
        if($scope.lookups[sp] === undefined){
          $scope.lookups[sp] = {status:'loading', url:sp, rowId: obj.id}
          something_changed = true
        }
      })
      // Launch these lookups if needed
      if(something_changed)
        loopLookups()

      // If there are no pages, there will be no lookup, but the status is still 'warning'
      if(obj.webentity.startpages.length == 0){
        obj.startpagesSummary.status = 'warning'
        obj.collapsed = false
      }
    }

    function loopLookups(){
      var unlookedUrls = []

      for(var url in $scope.lookups){
        var lo = $scope.lookups[url]  // Lookup Object
        if(lo.status == 'loading'){
          unlookedUrls.push(url)
        }
      }

      if(unlookedUrls.length > 0){
        var lookupQB = new QueriesBatcher()
        unlookedUrls.forEach(function(url){
          lookupQB.addQuery(
              api.urlLookup                         // Query call
              ,{                                    // Query settings
                  url:url
                }
              ,function(httpStatus){                // Success callback
                  var lo = $scope.lookups[url]
                  lo.status = 'loaded'
                  lo.httpStatus = httpStatus
                  updateRowForLookup(lo.rowId)
                }
              ,function(data, status, headers){     // Fail callback
                  var lo = $scope.lookups[url]
                  lo.status = 'error'
                  lo.httpStatus = undefined
                  updateRowForLookup(lo.rowId)
                }
              ,{                                    // Options
                  label: 'lookup '+url
                  ,before: function(){
                      var lo = $scope.lookups[url]
                      lo.status = 'pending'
                    }
                  ,simultaneousQueries: 3
                }
            )
        })

        lookupQB.atFinalization(function(list,pending,success,fail){
          loopLookups()
        })

        lookupQB.run()
      }
    }

    function updateRowForLookup(rowId){
      var obj = list_byId[rowId]
      ,loadedPages = obj.webentity.startpages.filter(function(url){
        var lo = $scope.lookups[url]
        return lo && (lo.status == 'loaded' || lo.status == 'error')
      })
      ,warningPages = loadedPages.filter(function(url){
        var lo = $scope.lookups[url]
        return lo.status == 'error' || lo.httpStatus != 200
      })
      
      obj.startpagesSummary = {
        loaded: loadedPages.length
        ,loading: obj.webentity.startpages.length - loadedPages.length
        ,warning: warningPages.length
      }

      if(obj.webentity.startpages.length == 0){
        obj.startpagesSummary.status = 'warning'
      } else if(obj.startpagesSummary.loading == 0){
        if(obj.startpagesSummary.warning == 0){
          obj.startpagesSummary.status = 'success'
        } else {
          obj.startpagesSummary.status = 'warning'
          obj.collapsed = false
        }
      } else {
        obj.startpagesSummary.status = 'loading'
      }

    }

    /* Modal controller */
    function startPageModalCtrl($scope, $modalInstance, url, webentity) {
      $scope.url = url
      $scope.webentity = webentity
      $scope.wwwVariations = true
      $scope.httpsVariations = true

      // Bootstraping the object for the Prefix Slider
      var obj = {}
      obj.url = utils.URL_fix(url)
      obj.lru = utils.URL_to_LRU(utils.URL_stripLastSlash(obj.url))
      obj.tldLength = utils.LRU_getTLD(obj.lru).split('.').length
      obj.json_lru = utils.URL_to_JSON_LRU(utils.URL_stripLastSlash(obj.url))
      obj.pretty_lru = utils.URL_to_pretty_LRU(utils.URL_stripLastSlash(obj.url))
        .map(function(stem){
            var maxLength = 12
            if(stem.length > maxLength+3){
              return stem.substr(0,maxLength) + '...'
            }
            return stem
          })
      obj.prefixLength = 3
      obj.truePrefixLength = obj.prefixLength - 1 + obj.tldLength
      obj.conflicts = []
      obj.status = "loading"
      $scope.obj = obj

      // Load parent web entities
      api.getLruParentWebentities({
            lru: $scope.obj.lru
          }
          ,function(we_list){
            $scope.obj.parentWebEntities = we_list
            $scope.obj.status = 'loaded'
          }
          ,function(data, status, headers, config){
            $scope.obj.status = 'error'
            $scope.obj.errorMessage = 'Oops... The server query failed'
          }
        )

      $scope.ok = function () {
        var feedback = {
          task:$scope.obj.task
          ,prefix: utils.LRU_truncate($scope.obj.lru, $scope.obj.truePrefixLength)
          ,wwwVariations: $scope.wwwVariations
          ,httpsVariations: $scope.httpsVariations
        }
        $modalInstance.close(feedback);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }

  }])
  


  .controller('launchCrawl', [function(){
    $scope.currentPage = 'launchCrawl'

    $scope.list = bootstrapList([{"id":0,"webentity":{"status":"IN","name":"Tumblr","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:http|h:com|h:tumblr|","s:https|h:com|h:tumblr|h:www|","s:https|h:com|h:tumblr|","s:http|h:com|h:tumblr|h:www|"],"crawling_status":"UNCRAWLED","startpages":["http://1jour1raison-aubry.tumblr.com"],"creation_date":"1409049275524","indexing_status":"UNINDEXED","last_modification_date":"1409049275542","homepage":null,"id":"072c5d07-7b52-413b-b31c-9ef220497aa6"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":1,"webentity":{"status":"IN","name":"Tns-Sofres","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:https|h:com|h:tns-sofres|h:www|","s:http|h:com|h:tns-sofres|","s:http|h:com|h:tns-sofres|h:www|","s:https|h:com|h:tns-sofres|"],"crawling_status":"UNCRAWLED","startpages":["http://www.tns-sofres.com"],"creation_date":"1409049275157","indexing_status":"UNINDEXED","last_modification_date":"1409049275170","homepage":null,"id":"357b0135-c183-40d6-bdc2-80b94c90a720"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":2,"webentity":{"status":"IN","name":"Twitter","tags":{"CORE":{"startpages_modified":["added https://twitter.com/toutMontebourg","removed http://twitter.com/toutMontebourg"],"user_created_via":["lru"],"recrawl_needed":["true","true"]}},"lru_prefixes":["s:http|h:com|h:twitter|","s:http|h:com|h:twitter|h:www|","s:https|h:com|h:twitter|","s:https|h:com|h:twitter|h:www|"],"crawling_status":"UNCRAWLED","startpages":["https://twitter.com/toutMontebourg"],"creation_date":"1409049275242","indexing_status":"UNINDEXED","last_modification_date":"1409055296023","homepage":null,"id":"66be66cb-f7c5-416d-a923-d10daf326423"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":3,"webentity":{"status":"IN","name":"Trielec2012","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:https|h:fr|h:trielec2012|","s:http|h:fr|h:trielec2012|h:www|","s:http|h:fr|h:trielec2012|","s:https|h:fr|h:trielec2012|h:www|"],"crawling_status":"UNCRAWLED","startpages":["http://www.trielec2012.fr"],"creation_date":"1409049275428","indexing_status":"UNINDEXED","last_modification_date":"1409049275442","homepage":null,"id":"6827803f-a81a-48af-ba62-26ebd1702a18"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":4,"webentity":{"status":"IN","name":"Lemonde","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:http|h:fr|h:lemonde|","s:https|h:fr|h:lemonde|h:www|","s:https|h:fr|h:lemonde|","s:http|h:fr|h:lemonde|h:www|"],"crawling_status":"UNCRAWLED","startpages":["http://crise.blog.lemonde.fr"],"creation_date":"1409049275596","indexing_status":"UNINDEXED","last_modification_date":"1409049275611","homepage":null,"id":"8af8df7a-4e94-4655-9ea4-1beda3605f57"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":5,"webentity":{"status":"IN","name":"Tepsa","tags":{"CORE":{"startpages_modified":["added http://www.tepsa.eu/","removed http://www.tepsa.be"],"lruprefixes_modified":["added s:http|h:eu|h:tepsa|h:www|","added s:http|h:eu|h:tepsa|","added s:https|h:eu|h:tepsa|h:www|","added s:https|h:eu|h:tepsa|"],"user_created_via":["lru"],"recrawl_needed":["true","true","true","true","true","true"]}},"lru_prefixes":["s:https|h:be|h:tepsa|h:www|","s:http|h:be|h:tepsa|","s:http|h:eu|h:tepsa|h:www|","s:http|h:be|h:tepsa|h:www|","s:http|h:eu|h:tepsa|","s:https|h:eu|h:tepsa|h:www|","s:https|h:be|h:tepsa|","s:https|h:eu|h:tepsa|"],"crawling_status":"UNCRAWLED","startpages":["http://www.tepsa.eu/"],"creation_date":"1409049275299","indexing_status":"UNINDEXED","last_modification_date":"1409055315247","homepage":null,"id":"94d95282-fc67-4288-905d-8c9f7a98fe98"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":6,"webentity":{"status":"IN","name":"Trop-Libre","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:https|h:fr|h:trop-libre|h:www|","s:http|h:fr|h:trop-libre|","s:https|h:fr|h:trop-libre|","s:http|h:fr|h:trop-libre|h:www|"],"crawling_status":"UNCRAWLED","startpages":["http://www.trop-libre.fr"],"creation_date":"1409049275459","indexing_status":"UNINDEXED","last_modification_date":"1409049275470","homepage":null,"id":"a637a48b-be41-47dd-9975-a87cf085c6f2"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":7,"webentity":{"status":"IN","name":"Thierrydoukhan","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:http|h:fr|h:blogspot|h:thierrydoukhan|h:www|","s:http|h:fr|h:blogspot|h:thierrydoukhan|","s:https|h:fr|h:blogspot|h:thierrydoukhan|","s:https|h:fr|h:blogspot|h:thierrydoukhan|h:www|"],"crawling_status":"UNCRAWLED","startpages":["http://thierrydoukhan.blogspot.fr"],"creation_date":"1409049275186","indexing_status":"UNINDEXED","last_modification_date":"1409049275198","homepage":null,"id":"c2747b98-9e27-4301-bd72-211b0bc18153"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":8,"webentity":{"status":"IN","name":"Over-Blog","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:http|h:net|h:over-blog|h:www|","s:http|h:net|h:over-blog|","s:https|h:net|h:over-blog|","s:https|h:net|h:over-blog|h:www|"],"crawling_status":"UNCRAWLED","startpages":["http://turandot.over-blog.net"],"creation_date":"1409049275488","indexing_status":"UNINDEXED","last_modification_date":"1409049275503","homepage":null,"id":"c4d7201d-f7ff-4b4d-abee-db5673a6646d"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":9,"webentity":{"status":"IN","name":"Wordpress","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:http|h:com|h:wordpress|h:www|","s:http|h:com|h:wordpress|","s:https|h:com|h:wordpress|","s:https|h:com|h:wordpress|h:www|"],"crawling_status":"UNCRAWLED","startpages":["http://travauxpublics.wordpress.com"],"creation_date":"1409049275345","indexing_status":"UNINDEXED","last_modification_date":"1409049275357","homepage":null,"id":"e277f2e2-a0de-49bc-a722-8b5f7bbb91df"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":10,"webentity":{"status":"IN","name":"Touteleurope","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:https|h:eu|h:touteleurope|h:www|","s:http|h:eu|h:touteleurope|h:www|","s:https|h:eu|h:touteleurope|","s:http|h:eu|h:touteleurope|"],"crawling_status":"UNCRAWLED","startpages":["http://www.touteleurope.eu"],"creation_date":"1409049275216","indexing_status":"UNINDEXED","last_modification_date":"1409049275227","homepage":null,"id":"f060d61e-f910-4317-b653-9eeeb5cd80d2"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":11,"webentity":{"status":"IN","name":"Liberation","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:https|h:fr|h:liberation|h:www|","s:http|h:fr|h:liberation|","s:http|h:fr|h:liberation|h:www|","s:https|h:fr|h:liberation|"],"crawling_status":"UNCRAWLED","startpages":["http://traverses.blogs.liberation.fr/yves_michaud/"],"creation_date":"1409049275393","indexing_status":"UNINDEXED","last_modification_date":"1409049275408","homepage":null,"id":"f6e2c2c7-78b9-4bf2-9240-77eb208ce49b"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}},{"id":12,"webentity":{"status":"IN","name":"Trameverteetbleue","tags":{"CORE":{"user_created_via":["lru"]}},"lru_prefixes":["s:https|h:fr|h:trameverteetbleue|h:www|","s:https|h:fr|h:trameverteetbleue|","s:http|h:fr|h:trameverteetbleue|h:www|","s:http|h:fr|h:trameverteetbleue|"],"crawling_status":"UNCRAWLED","startpages":["http://www.trameverteetbleue.fr"],"creation_date":"1409049275268","indexing_status":"UNINDEXED","last_modification_date":"1409049275280","homepage":null,"id":"ff9c2c38-65d6-4532-a418-d156d77c1a04"},"status":"loaded","collapsed":true,"startpagesSummary":{"loaded":1,"loading":0,"warning":0,"status":"success"}}])
    // $scope.list = bootstrapList(store.get('webentities_toCrawl'))

    function bootstrapList(list){
      list = list || []

      // Clean and set exactly what we need
      return list.map(function(obj, i){
        return {
          id:i
          ,webentity: obj.webentity
          ,status: 'unlaunched'
        }
      })
    }
  }])
;

