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

    $scope.status

    api.globalStatus({}, function(status){
      $scope.status = status
      console.log(status)
    })
  }])



  .controller('ImportUrls', ['$scope', 'FileLoader', 'Parser', 'extractURLs', 'droppableTextArea', 'store', function($scope, FileLoader, Parser, extractURLs, droppableTextArea, store) {
    $scope.currentPage = 'importurls'
    
    var parser = new Parser()

    $scope.parsingOption = 'text'

    $scope.dataText = ''
    $scope.table
    $scope.columns = []
    $scope.selectedColumn
    $scope.textPreview = []
    $scope.headline = true
    $scope.previewMaxRow = 4
    $scope.previewMaxCol = 3

    $scope.settingsTouched = false
    $scope.justImported = false
    $scope.justPasted = false
    
    // Custom filtering process
    $scope.$watch('dataText', updatePreview)
    $scope.$watch('parsingOption', updatePreview)
    $scope.$watch('headline', updatePreview)

    function updatePreview() {
      
      // Update parsingOption if needed
      if($scope.justPasted){
        $scope.justPasted = false
        if(!$scope.settingsTouched){
          autoSetOption()
        }
      }
      if($scope.justImported){
        $scope.justImported = false
        if(!$scope.settingsTouched){
          autoSetOption()
        }
      }

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

      function autoSetOption(){
        if($scope.dataText.length > 0){
          var firstRow = $scope.dataText.split('\n')[0]
          ,containsTab = firstRow.indexOf('\t') >= 0
          ,containsComa = firstRow.indexOf(',') >= 0
          ,containsSemicolon = firstRow.indexOf(';') >= 0
          ,containsHttp = firstRow.indexOf('http://') >= 0
          
          if(!containsTab && !containsComa && !containsSemicolon){
            $scope.parsingOption = 'text'
          } else if(containsTab && !containsComa && !containsSemicolon){
            $scope.parsingOption = 'tsv'
          } else if(!containsTab && containsComa && !containsSemicolon){
            $scope.parsingOption = 'csv'
          } else if(!containsTab && !containsComa && containsSemicolon){
            $scope.parsingOption = 'scsv'
          }

          if($scope.parsingOption != 'text' && containsHttp){
            $scope.headline = false
          }

        }
      }
    }

    // Setting the columns list
    $scope.$watch('table', function(){
      if($scope.table){

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
      }
    })
  
    $scope.handlePaste = function(){
      // At this point, $scope.dataText is not updated yet
      // So we just notify and we will treat it at next update
      $scope.justPasted = true
    }

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
          $scope.justImported = true
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

    $scope.list = []
    $scope.list_byId = {}
    
    $scope.activeRow = 0
    
    $scope.paginationPage = 1
    $scope.paginationLength = 50    // How many items per page
    $scope.paginationNumPages = 5  // How many pages to display in the pagination

    $scope.wwwVariations = true
    $scope.httpsVariations = true
    
    $scope.createdList = []
    $scope.existingList = []
    $scope.conflictedList = []
    $scope.errorList = []
    
    $scope.retry = false
    $scope.creating = false
    $scope.loadingWebentities = false
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
          (obj.parentWebEntities || []).forEach(function(we){
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

    $scope.doCrawl = function(crawlExisting){

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

      if(crawlExisting){
        $scope.existingList.forEach(function(obj){
          if(obj.webentity.id !== undefined){
            list.push(cleanObj(obj))
          }
        })
      }

      if(list.length > 0){
        store.set('webentities_toCrawl', list)
        $location.path('/checkStartPages')
      } else {
        $scope.status = {message:'No Web Entity to send', background:'danger'}
      }
    }

    $scope.removeLine = function(objId){
      $scope.list = $scope.list.filter(function(obj){
        return obj.id != objId
      })
      delete $scope.list_byId[objId]
    }


    // Functions

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

  }])



  .controller('NewCrawl', ['$scope', 'api', function($scope, api) {
    $scope.currentPage = 'newCrawl'
  }])



  .controller('CheckStartPages', ['$scope', 'api', 'store', 'utils', '$location', 'QueriesBatcher', '$modal'
  ,function($scope, api, store, utils, $location, QueriesBatcher, $modal) {
    $scope.currentPage = 'checkStartPages'

    $scope.lookups = {}
    $scope.secondaryLookups = {}
    
    $scope.crawlDepth = 1

    $scope.httpStatusLoading = 0
    $scope.httpStatusWarning = 0
    $scope.httpStatusSuccess = 0
    
    $scope.paginationPage = 1
    $scope.paginationLength = 50    // How many items per page
    $scope.paginationNumPages = 5  // How many pages to display in the pagination

    $scope.list = bootstrapList(store.get('webentities_toCrawl'))

    // Build index
    var list_byId = {}
    $scope.list.forEach(function(obj){
      list_byId[obj.id] = obj
    })

    // Clean store
    store.remove('webentities_toCrawl')

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

    if($scope.list.length==0){
      $location.path('/newCrawl')
    } else {
      $scope.getWebentities()
    }

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

    $scope.sortWarnings = function(){
      var warnings = $scope.list.filter(function(obj){
        return obj.startpagesSummary.status == 'warning'
      })
      ,others = $scope.list.filter(function(obj){
        return obj.startpagesSummary.status != 'warning'
      })
      $scope.list = warnings.concat(others)
      $scope.paginationPage = 1
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
      $location.path('/scheduleCrawls')
    }

    $scope.removeRow = function(objId){
      var obj = list_byId[objId]

      // Remove old status
      if(obj.startpagesSummary.status == 'warning'){
        $scope.httpStatusWarning--
      } else if(obj.startpagesSummary.status == 'success'){
        $scope.httpStatusSuccess--
      } else {
        $scope.httpStatusLoading--
      }

      $scope.list = $scope.list.filter(function(obj){
        return obj.id != objId
      })

      delete list_byId[objId]

    }

    function bootstrapList(list){
      list = list || []

      // Remove doublons
      list = utils.extractCases(list, function(obj){
        return obj.webentity.id
      })

      // Clean and set exactly what we need
      return list.map(function(obj, i){
        $scope.httpStatusLoading++
        return {
          id:i
          ,webentity: obj.webentity
          ,status: 'loading'
          ,collapsed: true
          ,startpagesSummary: {status: 'loading'}
        }
      })
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

      // Remove old status
      if(obj.startpagesSummary.status == 'warning'){
        $scope.httpStatusWarning--
      } else if(obj.startpagesSummary.status == 'success'){
        $scope.httpStatusSuccess--
      } else {
        $scope.httpStatusLoading--
      }

      // New status
      $scope.httpStatusLoading++
      obj.startpagesSummary.status == 'loading'
      
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
        launchLookups()

      // If there are no pages, there will be no lookup, but the status is still 'warning'
      if(obj.webentity.startpages.length == 0){
        obj.startpagesSummary.status = 'warning'
        obj.collapsed = false
      }
    }

    function launchLookups(){
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
                  lo.httpStatus = httpStatus

                  if(httpStatus == 200){
                    lo.status = 'loaded'
                  } else {
                    lo.status = 'variations pending'
                    rescheduleVariationsLookups(url)
                  }
                  
                  updateRowForLookup(lo.rowId)
                }
              ,function(data, status, headers){     // Fail callback
                  var lo = $scope.lookups[url]
                  lo.status = 'variations pending'
                  lo.httpStatus = undefined
                  rescheduleVariationsLookups(url)
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
          launchLookups()
        })

        lookupQB.run()
      }
    }
    
    function rescheduleVariationsLookups(url){
      var lo = $scope.lookups[url]
      ,obj = list_byId[lo.rowId]
      ,lru = utils.URL_to_LRU(url)
      ,variations = utils.LRU_variations(
          lru
          ,{
            wwwlessVariations: true
            ,wwwVariations: true
            ,httpVariations: true
            ,httpsVariations: true
            ,smallerVariations: false
          }
        )
        .filter(function(vlru){
          // We check that each vlru is actually prefixed in the web entity
          return obj.webentity.lru_prefixes.some(function(p){
            return vlru.indexOf(p) == 0
          })
        })
        .map(utils.LRU_to_URL)
        .filter(function(vurl){
          // We check that each vurl is not already a start page
          return !obj.webentity.startpages.some(function(sp){
            return sp == vurl
          })
        })

      var slo_obj = {}
      variations.forEach(function(vurl){
        slo_obj[vurl] = {status:'loading', url:vurl, rowId: obj.id, originalUrl: url}
      })
      $scope.secondaryLookups[url] = slo_obj

      var secondaryLookupQB = new QueriesBatcher()
      variations.forEach(function(vurl){
        secondaryLookupQB.addQuery(
          api.urlLookup                         // Query call
          ,{                                    // Query settings
              url:vurl
            }
          ,function(httpStatus){                // Success callback
              var slo = $scope.secondaryLookups[url][vurl]
              slo.status = httpStatus
            }
          ,function(data, status, headers){     // Fail callback
              var slo = $scope.secondaryLookups[url][vurl]
              slo.status = 'error'
            }
          ,{                                    // Options
              label: 'secondary lookup '+vurl
              ,before: function(){
                  var slo = $scope.secondaryLookups[url][vurl]
                  slo.status = 'pending'
                }
              ,simultaneousQueries: 1
            }
        )
      })
  
      secondaryLookupQB.atFinalization(function(list,pending,success,fail){
        console.log('All secondary lookups done for '+url,$scope.secondaryLookups[url])

        var successfulVariation
        for(var vurl in $scope.secondaryLookups[url]){
          var slo = $scope.secondaryLookups[url][vurl]
          if(slo.status == 200){
            successfulVariation = vurl
          }
        }

        if(successfulVariation){
          // We replace the original start page with the new one
          console.log('A better start page found. ' + url + ' will be replaced by ' + successfulVariation)
          _addStartPage(obj, successfulVariation, function(){
            _removeStartPage(obj, url, function(){
              reloadRow(obj.id)
            })
          })
        } else {
          // The lookup failed. We use the status from the original lookup.
          var lo = $scope.lookups[url]
          if(lo.httpStatus === undefined){
            lo.status = 'error'
          } else {
            lo.status = 'loaded'
          }
          updateRowForLookup(lo.rowId)
        }
      })

      secondaryLookupQB.run()

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

      // Old httpStatus
      if(obj.startpagesSummary.status == 'warning'){
        $scope.httpStatusWarning--
      } else if(obj.startpagesSummary.status == 'success'){
        $scope.httpStatusSuccess--
      } else {
        $scope.httpStatusLoading--
      }

      // New httpStatus
      if(obj.webentity.startpages.length == 0){
        obj.startpagesSummary.status = 'warning'
        obj.collapsed = false
        $scope.httpStatusWarning++
      } else if(obj.startpagesSummary.loading == 0){
        if(obj.startpagesSummary.warning == 0){
          obj.startpagesSummary.status = 'success'
          $scope.httpStatusSuccess++
        } else {
          obj.startpagesSummary.status = 'warning'
          obj.collapsed = false
          $scope.httpStatusWarning++
        }
      } else {
        obj.startpagesSummary.status = 'loading'
        $scope.httpStatusLoading++
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
  


  .controller('scheduleCrawls', ['$scope', 'api', 'store', 'utils', 'QueriesBatcher', '$location',
  function($scope, api, store, utils, QueriesBatcher, $location){
    $scope.currentPage = 'scheduleCrawls'

    $scope.list = bootstrapList(store.get('webentities_toCrawl'))
    $scope.summary = {pending:0, success:0, error:0}

    // Clean store
    store.remove('webentities_toCrawl')

    if($scope.list.length==0){
      $location.path('/newCrawl')
    }

    var queriesBatcher = new QueriesBatcher()
    
    $scope.list.forEach(function(obj){

      $scope.summary.pending++

      // Stack the query
      queriesBatcher.addQuery(
          api.crawl                             // Query call
          ,{                                    // Query settings
              webentityId: obj.webentity.id
              ,depth: obj.depth || 0
              ,cautious: obj.cautiousCrawl || false
            }
          ,function(data){                      // Success callback
              $scope.summary.pending--
              $scope.summary.success++
              obj.status = 'scheduled'
            }
          ,function(data, status, headers){     // Fail callback
              $scope.summary.pending--
              $scope.summary.error++
              obj.status = 'error'
              obj.errorMessage = data[0].message
            }
          ,{                                    // Options
              label: obj.webentity.id
              ,before: function(){
                  obj.status = 'pending'
                }
              ,simultaneousQueries: 3
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
      ,msg = percent + '% launched'
      $scope.status = {message: msg, progress:percent, progressPending:percent_pending}
    })

    queriesBatcher.atFinalization(function(list,pending,success,fail){
      // Status message
      $scope.status = {}
    })

    queriesBatcher.run()

    function bootstrapList(list){
      list = list || []

      // Clean and set exactly what we need
      return list.map(function(obj, i){
        return {
          id:i
          ,webentity: obj.webentity
          ,depth: obj.depth
          ,status: 'waiting'
        }
      })


    }
  }])



  .controller('monitorCrawls', ['$scope', 'api', 'store', 'utils', 'QueriesBatcher', '$location', 'refreshScheduler',
  function($scope, api, store, utils, QueriesBatcher, $location, refreshScheduler){
    $scope.currentPage = 'monitorCrawls'
    

    $scope.crawlJobs
    $scope.lastCrawlJobs
    
    $scope.timespan
    $scope.one_day_in_ms =  86400000    // =     24 * 60 * 60 * 1000
    $scope.one_hour_in_ms = 3600000     // =          60 * 60 * 1000
    $scope.one_week_in_ms = 604800000   // = 7 * 24 * 60 * 60 * 1000

    $scope.showDetails = false

    $scope.webentityIndex = {}

    $scope.listLoaded = false
    $scope.status = {message: 'Loading', progress:30}

    api.getCrawlJobs({}, function(crawlJobs){
      $scope.listLoaded = true
      $scope.crawlJobs = crawlJobs

        // Sort by reverse chronological order
        .sort(function(a,b){
          return b.created_at - a.created_at
        })

        // Enrich
        .map(enrichJob)

      updateLastCrawlJobs()
      $scope.scheduleRefresh()
  
    }, function(){
      $scope.status = {message: 'Error loading crawl jobs', background:'danger'}
    })

    $scope.setTimespan = function(timespan){
      $scope.timespan = timespan
      $scope.showDetails = false

      $scope.msTimeout = $scope.msTimeout_min
      $scope.scheduleRefresh()

      feedMainListBack()
      
      updateLastCrawlJobs()
    }

    $scope.displayDetails = function(job){
      $scope.showDetails = true
      $scope.lastCrawlJobs = [job]

      $scope.msTimeout = $scope.msTimeout_min
      $scope.scheduleRefresh()
      
      // console.log('Details of the job',job)
    }

    // Loop to refresh crawl jobs
    $scope.scheduleRefresh = function(){
        refreshScheduler.schedule(
        function(){ // Slowdown Condition
          return $scope.lastCrawlJobs.length == 0 || !$scope.lastCrawlJobs.some(function(job){return job.globalStatus == 'CRAWLING' || job.globalStatus == 'INDEXING' || job.globalStatus == 'WAITING' || job.globalStatus == 'PENDING'})
        }
        ,refreshCrawlJobs // Callback
      )
    }

    $scope.abortCrawl = function(job){
      $scope.status = {message: 'Aborting crawl jobs'}
      
      job.crawling_status = 'CANCELED'

      api.abortCrawlJobs(
        {id:job._id}
        ,function(){
          
          $scope.setTimespan('day')
          $scope.status = {}
      
        }, function(){
          $scope.status = {message: 'Error aborting crawl job', background:'danger'}
        }
      )
    }

    $scope.reCrawl = function(weId){
      var webentity = $scope.webentityIndex[weId]
      ,obj = {webentity:webentity}
      
      if(webentity !== undefined){
        store.set('webentities_toCrawl', [obj])
        $location.path('/checkStartPages')
      } else {
        $scope.status = {message:'No Web Entity to send', background:'danger'}
      }
    }

    // functions
    function enrichJob(job){
      job.globalStatus = ''
      if(job.crawling_status == 'RUNNING'){
        job.globalStatus = 'CRAWLING'
      } else if(job.crawling_status != 'FINISHED'){
        job.globalStatus = job.crawling_status
      } else if(job.indexing_status == 'FINISHED'){
        if(job.nb_crawled_pages > 0){
          job.globalStatus = 'ACHIEVED'
        } else {
          job.globalStatus = 'UNSUCCESSFUL'
        }
      } else if(job.indexing_status == 'RUNNING' || job.indexing_status == 'BATCH_RUNNING' || job.indexing_status == 'BATCH_FINISHED'){
        job.globalStatus = 'INDEXING'
      } else if(job.indexing_status == 'PENDING'){
        job.globalStatus = 'WAITING'
      } else {
        job.globalStatus = 'INDEXING ' + job.indexing_status
      }
      return job
    }


    function loadRequiredWebentities(){
      if($scope.timespan == 'all'){
        // TODO
      } else {
        
        var webentityId_list = $scope.lastCrawlJobs
          
          // Find web entities in the list of crawl jobs
          .map(function(job){
              return job.webentity_id
            })

          // Get those that are not indexed
          .filter(function(weId){
              return $scope.webentityIndex[weId] === undefined
            })

        // Remove doublons
        webentityId_list = utils.extractCases(webentityId_list)

        // Batch query them!
        loadWebentities(webentityId_list)
      }
    }

    function updateLastCrawlJobs(){
      var now = Date.now()
      ,timespanMs
      ,update = false

      switch($scope.timespan){
        case('day'):
          timespanMs = $scope.one_day_in_ms
          update = true
          break
        case('hour'):
          timespanMs = $scope.one_hour_in_ms
          update = true
          break
        case('week'):
          timespanMs = $scope.one_week_in_ms
          update = true
          break
        default:
          // We do not update (typically, timespan is 'all')
          break
      }

      if(update){
        $scope.lastCrawlJobs = ($scope.crawlJobs || []).filter(function(job){
          return now - job.created_at < timespanMs
        })
      }

      loadRequiredWebentities()
    }

    function loadWebentities(list){
      if(list.length > 0){
        $scope.status = {message: 'Loading', progress:60}
        api.getWebentities(
          {
            id_list: list
            ,light: true
          }
          ,function(webentities){
            $scope.status = {}
            webentities.forEach(function(we){
              $scope.webentityIndex[we.id] = we
            })
          }, function(){
            $scope.status = {message: 'Error loading web entities', background:'danger'}
          }
        )
      } else {
        $scope.status = {}
      }
    }

    function feedMainListBack(){
      var lastCrawljobsIndex = {}
      ,changes = []

      if($scope.lastCrawlJobs && $scope.lastCrawlJobs.length > 0){

        $scope.lastCrawlJobs.forEach(function(job){
          lastCrawljobsIndex[job._id] = job
        })

        $scope.crawlJobs.forEach(function(job, i){
          var updatedJob = lastCrawljobsIndex[job._id]
          if(updatedJob){
            changes.push({i:i, job:updatedJob})
          }
        })

        changes.forEach(function(change){
          $scope.crawlJobs[change.i] = change.job
        })
      }
    }

    function refreshCrawlJobs(){
      var currentTimespan = $scope.timespan
      $scope.status = {message: 'Refreshing crawl jobs'}
      if(currentTimespan == 'all'){
        // TODO
      } else {
        var crawlJobs = $scope.lastCrawlJobs.map(function(job){return job._id})
        
        api.getCrawlJobs(
          {id_list: crawlJobs}
          ,function(crawlJobs){
            if(currentTimespan == $scope.timespan){

              // Enrich
              crawlJobs = crawlJobs.map(enrichJob)

              

              var changes = []

              if($scope.showDetails){

                $scope.lastCrawlJobs = crawlJobs

              } else {

                var crawljobsIndex = {}
                crawlJobs.forEach(function(job){
                  crawljobsIndex[job._id] = job
                })

                $scope.lastCrawlJobs.forEach(function(job, i){
                  var updatedJob = crawljobsIndex[job._id]
                  if(updatedJob){
                    if(updatedJob.globalStatus != job.globalStatus){
                      changes.push({type:'full', i:i, job:updatedJob})
                    } else if(updatedJob.nb_crawled_pages != job.nb_crawled_pages
                        || updatedJob.nb_links != job.nb_links
                      ) {
                      changes.push({type:'stats', i:i, job:updatedJob})
                    }
                  }
                })

                changes.forEach(function(change){
                  switch(change.type){
                    case('full'):
                      $scope.lastCrawlJobs[change.i] = change.job
                      break
                    case('stats'):
                      $scope.lastCrawlJobs[change.i].nb_crawled_pages = change.job.nb_crawled_pages
                      $scope.lastCrawlJobs[change.i].nb_links = change.job.nb_links
                      $scope.lastCrawlJobs[change.i].nb_pages = change.job.nb_pages
                      break
                  }
                })
              }

              $scope.status = {message: ''}

              $scope.scheduleRefresh()
            }
          }
          ,function(data, status, headers, config){
            $scope.status = {message: 'Error refreshing crawl jobs'}
          }
        )
      }
    }
  }])



  .controller('listWebentities', ['$scope', 'api', 'utils', 'store', '$location',
  function($scope, api, utils, store, $location) {
    $scope.currentPage = 'listWebentities'

    $scope.list
    $scope.checkedList = []
    $scope.webentitiesCheckStack = {} // Web entities once checked
                                      // NB: will contain false positives

    $scope.randomEasterEgg

    $scope.loaded = false
    $scope.loading = false  // This flag prevents multiple simultaneous queries

    $scope.paginationPage = 1
    $scope.paginationLength = 20   // How many items per page
    $scope.paginationNumPages = 5  // How many pages to display in the pagination

    $scope.query
    $scope.lastQuery
    $scope.sort = 'date'
    $scope.statuses = {in:true, out:false, undecided:true, discovered:false}

    $scope.selected_setStatus = 'none'
    $scope.selected_mergeTarget = 'none'

    $scope.loadWebentities = function(query){
      $scope.status = {message: 'Loading'}
      $scope.loading = true

      // Set last query
      $scope.lastQuery = $scope.query

      // Get filtering settings
      var field_kw = [
          [
            'status'
            ,['in','out','undecided','discovered']
              .filter(function(s){
                  return $scope.statuses[s]
                })
              .map(function(s){
                  return s.toUpperCase()
                })
              .join(' ')
          ]
        ]

      api.searchWebentities(
        {
          allFieldsKeywords: query || ['*']
          ,fieldKeywords: field_kw
        }
        ,function(webentities){
          $scope.paginationPage = 1

          $scope.list = webentities.map(function(we, i){
            var obj = {
              id:i
              ,webentity:we
              ,checked:$scope.checkedList.some(function(weId){return weId == we.id})
            }
            return obj
          })
          $scope.status = {}
          $scope.loaded = true
          $scope.loading = false
        }
        ,function(){
          $scope.list = []
          $scope.status = {message: 'Error loading web entities', background: 'danger'}
          $scope.loading = false
        }
      )
    }

    $scope.toggleRow = function(rowId){
      var obj = $scope.list[rowId]
      if(obj.checked){
        obj.checked = false
        checkedList_remove(obj.webentity.id)
      } else {
        obj.checked = true
        checkedList_add(obj.webentity.id, obj.webentity)
      }
    }

    $scope.uncheck = function(weId){
      checkedList_remove(weId)
      $scope.list.some(function(obj){
        if(obj.webentity.id == weId){
          obj.checked = false
          return true
        }
      })
    }

    $scope.uncheckAll = function(){
      while($scope.checkedList.length > 0){
        $scope.uncheck($scope.checkedList[0])
      }
    }

    $scope.doQuery = function(){
      if(!$scope.loading){
        refreshEasterEgg()  // yes, yes...
        var query = cleanQuery($scope.query)
        console.log('Query:',query)
        $scope.loadWebentities(query)
      }
    }

    $scope.clearQuery = function(){
      $scope.query = undefined
      $scope.loadWebentities()
    }

    $scope.doCrawl = function(crawlExisting){

      function buildObj(we){
        return {
            webentity: we
          }
      }
      var list = $scope.checkedList
        .map(function(id){
          return $scope.webentitiesCheckStack[id]
        })
        .map(buildObj)
        .filter(function(obj){return obj.webentity.id !== undefined})
      
      // Remove doublons
      list = utils.extractCases(list, function(obj){
        return obj.webentity.id
      })

      if(list.length > 0){
        store.set('webentities_toCrawl', list)
        $location.path('/checkStartPages')
      } else {
        $scope.status = {message:'No Web Entity to send', background:'danger'}
      }
    }

    $scope.loadWebentities()


    // Functions
    function checkedList_remove(weId){
      $scope.checkedList = $scope.checkedList.filter(function(d){
        return d != weId
      })
    }

    function checkedList_add(weId, we){
      $scope.checkedList.push(weId)
      $scope.webentitiesCheckStack[weId] = we
    }

    var escapedChars = ['\\', '+', '-', '!', '(', ')', ':', '^', '[', ']', '{', '}', '~', '*', '?']
    function cleanQuery(query){
      if(query === undefined)
        return undefined
      escapedChars.forEach(function(character){
        query = query.replace(character, '\\'+character)
      })
      return '*' + query + '*'
      // return query.replace(' ', '?')
    }

    function refreshEasterEgg(){
      $scope.randomEasterEgg = Math.floor(Math.random()*4)
    }
    
  }])

.controller('export', ['$scope', 'api', 'utils', '$location',
  function($scope, api, utils, $location) {
    $scope.currentPage = 'export'

    $scope.list

    $scope.statuses = {in:true, out:false, undecided:false, discovered:false}
    $scope.columns = {
      id: {
        name: 'ID'
        ,accessor: 'id'
        ,type: 'string'
        ,val: true
      }
      ,name: {
        name: 'NAME'
        ,accessor: 'name'
        ,type: 'string'
        ,val: true
      }
      ,prefixes: {
        name: 'PREFIXES'
        ,accessor: 'lru_prefixes'
        ,type: 'array of lru'
        ,val: true
      }
      ,prefixes_lru: {
        name: 'PREFIXES AS LRU'
        ,accessor: 'lru_prefixes'
        ,type: 'array of string'
        ,val: false
      }
      ,start_pages: {
        name: 'START PAGES'
        ,accessor: 'start_pages'
        ,type: 'array of string'
        ,val: false
      }
      ,status: {
        name: 'STATUS'
        ,accessor: 'status'
        ,type: 'string'
        ,val: true
      }
      ,crawling_status: {
        name: 'CRAWLING STATUS'
        ,accessor: 'crawling_status'
        ,type: 'string'
        ,val: true
      }
      ,indexing_status: {
        name: 'INDEXING STATUS'
        ,accessor: 'indexing_status'
        ,type: 'string'
        ,val: false
      }
      ,creation_date: {
        name: 'CREATION DATE'
        ,accessor: 'creation_date'
        ,type: 'timestamp'
        ,val: false
      }
      ,last_modification_date: {
        name: 'LAST MODIFICATION DATE'
        ,accessor: 'last_modification_date'
        ,type: 'timestamp'
        ,val: true
      }
      ,creation_date_timestamp: {
        name: 'CREATION DATE AS TIMESTAMP'
        ,accessor: 'creation_date'
        ,type: 'string'
        ,val: false
      }
      ,last_modification_date_timestamp: {
        name: 'LAST MODIFICATION DATE AS TIMESTAMP'
        ,accessor: 'last_modification_date'
        ,type: 'string'
        ,val: false
      }
      ,core_tags: {
        name: 'TECHNICAL TAGS'
        ,accessor: 'tags.CORE'
        ,type: 'array of string'
        ,val: false
      }
    }
    $scope.fileFormat = 'CSV'


    $scope.loadWebentities = function(){
      $scope.status = {message: 'Loading'}
      $scope.loading = true

      // Get filtering settings
      var field_kw = [
        [
          'status'
          ,['in','out','undecided','discovered']
            .filter(function(s){
                return $scope.statuses[s]
              })
            .map(function(s){
                return s.toUpperCase()
              })
            .join(' ')
        ]
      ]

      api.searchWebentities(
        {
          allFieldsKeywords: ['*']
          ,fieldKeywords: field_kw
        }
        ,function(webentities){
          $scope.paginationPage = 1

          $scope.list = webentities
          $scope.status = {}
          $scope.loaded = true
          $scope.loading = false

          console.log($scope.list[0])
        }
        ,function(){
          $scope.list = []
          $scope.status = {message: 'Error loading web entities', background: 'danger'}
          $scope.loading = false
        }
      )
    }

    
  }])
;

