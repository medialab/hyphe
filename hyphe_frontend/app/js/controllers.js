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

    // DEV MODE
    // $scope.list = bootstrapList(store.get('webentities_toCrawl'))
    // console.log(JSON.stringify($scope.list))
    var list = [{"id":0,"webentity":{"lru":"s:http|h:com|h:24heuresactu|","stems_count":3,"name":"24heuresactu","id":"bc95749f-29b9-4729-a0b4-c3f8ec4f70ba","$$hashKey":200},"status":"loading","collapsed":true},{"id":1,"webentity":{"lru":"s:http|h:com|h:365mots|","stems_count":3,"name":"365mots","id":"331f5458-b65d-4efc-8a4e-f58bc36ae0e2","$$hashKey":212},"status":"loading","collapsed":true},{"id":2,"webentity":{"lru":"s:http|h:com|h:60millions-mag|","stems_count":3,"name":"60millions-Mag","id":"5007fb4a-bdca-4e9f-ae7d-c9d37bba63fb","$$hashKey":244},"status":"loading","collapsed":true},{"id":3,"webentity":{"lru":"s:http|h:fr|h:80propositions|","stems_count":3,"name":"80propositions","id":"ee8f0376-99b3-44dc-a96c-1f2ba94e7f70","$$hashKey":270},"status":"loading","collapsed":true},{"id":4,"webentity":{"lru":"s:http|h:net|h:acontrario|","stems_count":3,"name":"Acontrario","id":"48ad5564-c8a3-4916-bbcd-c114bc3d7261","$$hashKey":228},"status":"loading","collapsed":true},{"id":5,"webentity":{"lru":"s:http|h:com|h:blogspot|h:perdre-la-raison|","stems_count":4,"name":"Perdre-La-Raison","id":"ee84cea1-c660-49a0-9b32-478b17c526eb","$$hashKey":258},"status":"loading","collapsed":true},{"id":6,"webentity":{"lru":"s:http|h:org|h:aclefeu|","stems_count":3,"name":"Aclefeu","id":"975375a4-462c-4e79-91d2-5df2ca620dae","$$hashKey":286},"status":"loading","collapsed":true},{"id":7,"webentity":{"lru":"s:http|h:org|h:acrimed|","stems_count":3,"name":"Acrimed","id":"6c590a5f-c5da-45ba-bc76-31a13246fadb","$$hashKey":302},"status":"loading","collapsed":true},{"id":8,"webentity":{"lru":"s:http|h:org|h:actupparis|","stems_count":3,"name":"Actupparis","id":"4b08cc28-0d25-4676-b191-09e5f3d47ba0","$$hashKey":318},"status":"loading","collapsed":true},{"id":9,"webentity":{"lru":"s:http|h:com|h:acteurspublics|","stems_count":3,"name":"Acteurspublics","id":"abdfee5b-b1a0-4eda-b158-9065b12525e8","$$hashKey":350},"status":"loading","collapsed":true},{"id":10,"webentity":{"lru":"s:http|h:com|h:actu-environnement|","stems_count":3,"name":"Actu-Environnement","id":"63260a07-f913-41f1-90fc-f4f3a9858a22","$$hashKey":334},"status":"loading","collapsed":true},{"id":11,"webentity":{"lru":"s:http|h:org|h:actuchomage|","stems_count":3,"name":"Actuchomage","id":"ea86a95b-1536-4bbf-92fc-b41c481d975a","$$hashKey":366},"status":"loading","collapsed":true},{"id":12,"webentity":{"lru":"s:http|h:fr|h:afev|","stems_count":3,"name":"Afev","id":"838d7638-d4af-4632-be90-86f263a7f5a9","$$hashKey":382},"status":"loading","collapsed":true},{"id":13,"webentity":{"lru":"s:http|h:com|h:nouvelobs|","stems_count":3,"name":"Nouvelobs","id":"130e6d45-a2f2-4ab3-a85f-5d6e3bf10cba","$$hashKey":398},"status":"loading","collapsed":true},{"id":14,"webentity":{"lru":"s:http|h:com|h:nouvelobs|","stems_count":3,"name":"Nouvelobs","id":"130e6d45-a2f2-4ab3-a85f-5d6e3bf10cba","$$hashKey":411},"status":"loading","collapsed":true},{"id":15,"webentity":{"lru":"s:http|h:eu|h:euromemorandum|","stems_count":3,"name":"Euromemorandum","id":"ef6d94ee-7da3-4b88-bfd7-a02e240bcc81","$$hashKey":425},"status":"loading","collapsed":true},{"id":16,"webentity":{"lru":"s:http|h:fr|h:ademe|","stems_count":3,"name":"Ademe","id":"00593063-54ea-4243-b94e-c9867076524f","$$hashKey":435},"status":"loading","collapsed":true},{"id":17,"webentity":{"lru":"s:http|h:eu|h:europa|","stems_count":3,"name":"Europa","id":"184f9d48-d307-4735-a882-5524e8922741","$$hashKey":448},"status":"loading","collapsed":true},{"id":18,"webentity":{"lru":"s:http|h:fr|h:anact|","stems_count":3,"name":"Anact","id":"2dcb385a-9b55-44fb-a894-0ab9fed2bd59","$$hashKey":459},"status":"loading","collapsed":true},{"id":19,"webentity":{"lru":"s:http|h:org|h:hypotheses|","stems_count":3,"name":"Hypotheses","id":"656ee592-fa5c-4cad-bdf7-44a4da2c2362","$$hashKey":474},"status":"loading","collapsed":true},{"id":20,"webentity":{"lru":"s:http|h:fr|h:agoravox|","stems_count":3,"name":"Agoravox","id":"cb33dad2-3f7b-4d9f-9d05-f15ba83a037b","$$hashKey":485},"status":"loading","collapsed":true},{"id":21,"webentity":{"lru":"s:http|h:org|h:aides|","stems_count":3,"name":"Aides","id":"7253c2b3-79ce-4726-aeef-a8ec30f6a612","$$hashKey":501},"status":"loading","collapsed":true},{"id":22,"webentity":{"lru":"s:http|h:fr|h:alternatives-economiques|","stems_count":3,"name":"Alternatives-Economiques","id":"eb0edb3d-8992-42fc-aad9-79703d730f67","$$hashKey":517},"status":"loading","collapsed":true},{"id":23,"webentity":{"lru":"s:http|h:eu|h:alainlamassoure|","stems_count":3,"name":"Alainlamassoure","id":"1d764f87-8636-481a-b534-2eea62244c7e","$$hashKey":528},"status":"loading","collapsed":true},{"id":24,"webentity":{"lru":"s:http|h:net|h:lipietz|","stems_count":3,"name":"Lipietz","id":"cb03ca54-7c3d-4cb0-bc22-fc7cba3e4b62","$$hashKey":542},"status":"loading","collapsed":true},{"id":25,"webentity":{"lru":"s:http|h:fr|h:parti-socialiste|","stems_count":3,"name":"Parti-Socialiste","id":"3f687491-13c9-4a52-9fc3-a3f9630cfd74","$$hashKey":555},"status":"loading","collapsed":true},{"id":26,"webentity":{"lru":"s:http|h:fr|h:blogspot|h:aliciabx|","stems_count":4,"name":"Aliciabx","id":"aec66ae4-4c51-446a-b811-95a3798acfcc","$$hashKey":569},"status":"loading","collapsed":true},{"id":27,"webentity":{"lru":"s:http|h:fr|h:alliancecentriste|","stems_count":3,"name":"Alliancecentriste","id":"cb82d4cb-5415-402b-96ba-735914495fbc","$$hashKey":581},"status":"loading","collapsed":true},{"id":28,"webentity":{"lru":"s:http|h:eu|h:alde|","stems_count":3,"name":"Alde","id":"5e14a436-b822-454f-900c-e53ba8591b1c","$$hashKey":598},"status":"loading","collapsed":true},{"id":29,"webentity":{"lru":"s:http|h:fr|h:centristesblog|","stems_count":3,"name":"Centristesblog","id":"6e219a67-e050-44c0-ab57-24ceddabce59","$$hashKey":613},"status":"loading","collapsed":true},{"id":30,"webentity":{"lru":"s:http|h:fr|h:alliance-ecologiste-independante|","stems_count":3,"name":"Alliance-Ecologiste-Independante","id":"b3797053-9409-46cd-887b-c8c92ba55a0a","$$hashKey":624},"status":"loading","collapsed":true},{"id":31,"webentity":{"lru":"s:http|h:org|h:alliancegeostrategique|","stems_count":3,"name":"Alliancegeostrategique","id":"e4a6bcea-8d3b-411b-a45a-1bc9d3fd1d66","$$hashKey":638},"status":"loading","collapsed":true},{"id":32,"webentity":{"lru":"s:http|h:eu|h:socialistsanddemocrats|","stems_count":3,"name":"Socialistsanddemocrats","id":"2872d824-aeb2-4eb9-97c8-6d0387f7098d","$$hashKey":651},"status":"loading","collapsed":true},{"id":33,"webentity":{"lru":"s:http|h:fr|h:alliance-pour-une-france-juste|","stems_count":3,"name":"Alliance-Pour-Une-France-Juste","id":"62dd0209-24dd-46bc-8eef-63717d49bc8d","$$hashKey":665},"status":"loading","collapsed":true},{"id":34,"webentity":{"lru":"s:http|h:org|h:allons-enfants|","stems_count":3,"name":"Allons-Enfants","id":"c126597e-860a-49ab-b261-8900b0a7012c","$$hashKey":676},"status":"loading","collapsed":true},{"id":35,"webentity":{"lru":"s:http|h:org|h:alsacedabord|","stems_count":3,"name":"Alsacedabord","id":"a5aad4eb-4524-4bf8-a85a-1d2720e41f8a","$$hashKey":692},"status":"loading","collapsed":true},{"id":36,"webentity":{"lru":"s:http|h:fr|h:alter-oueb|","stems_count":3,"name":"Alter-Oueb","id":"1adc3ed5-9d0f-469d-81f9-7440cdfc3b71","$$hashKey":708},"status":"loading","collapsed":true},{"id":37,"webentity":{"lru":"s:http|h:org|h:altermondes|","stems_count":3,"name":"Altermondes","id":"9ce99140-774f-4215-aa68-b0de5626636d","$$hashKey":724},"status":"loading","collapsed":true},{"id":38,"webentity":{"lru":"s:http|h:fr|h:alternative-liberale|","stems_count":3,"name":"Alternative-Liberale","id":"c8862789-51d9-47ce-a3f7-5a3354daaf14","$$hashKey":741},"status":"loading","collapsed":true}] 
    $scope.list = bootstrapList(list)
    console.log($scope.list)

    // Build index
    var list_byId = {}
    $scope.list.forEach(function(obj){
      list_byId[obj.id] = obj
    })

    // Clean store
    store.remove('webentities_toCrawl')

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

    function bootstrapList(list){
      list = list || []

      // Pagination
      initPagination(0, 50, list.length)
      
      // Clean and set exactly what we need
      return list.map(function(obj, i){
        return {
          id:i
          ,webentity: obj.webentity
          ,status: 'loading'
          ,collapsed: true
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
          $scope.lookups[sp] = {status:'loading', url:sp}
          something_changed = true
        }
      })
      // Launch these lookups if needed
      if(something_changed)
        loopLookups()
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
                }
              ,function(data, status, headers){     // Fail callback
                  var lo = $scope.lookups[url]
                  lo.status = 'error'
                  lo.httpStatus = undefined
                }
              ,{                                    // Options
                  label: 'lookup '+url
                  ,before: function(){
                      var lo = $scope.lookups[url]
                      lo.status = 'pending'
                    }
                }
            )
        })

        lookupQB.atEachFetch(function(list,pending,success,fail){
          var summary = {
            total: list.length + pending.length + success.length + fail.length
            ,pending: pending.length
            ,loaded: success.length + fail.length
          }
          ,percent = Math.round((summary.loaded / summary.total) * 100)
          ,percent_pending = Math.round((summary.pending / summary.total) * 100)
          ,msg = percent + '% loaded'
          console.log(msg)
        })

        lookupQB.atFinalization(function(list,pending,success,fail){
          loopLookups()
        })

        lookupQB.run()
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


