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
                if(data && data[0].code == 'fail'){
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
                  if(data[0].code == 'fail'){
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



  .controller('CheckStartPages', ['$scope', 'api', 'store', 'utils', '$location'
  ,function($scope, api, store, utils, $location) {
    $scope.currentPage = 'checkStartPages'
    
    // DEV MODE
    // $scope.list = bootstrapList(store.get('webentities_toCrawl'))
    var list = [{"id":0,"weId":{"webentity":{"lru":"s:http|h:com|h:24heuresactu|","stems_count":3,"name":"24heuresactu","id":"86f8ab4d-24a7-44c4-b4ac-5b94597927ad","$$hashKey":200}},"status":"loading"},{"id":1,"weId":{"webentity":{"lru":"s:http|h:com|h:365mots|","stems_count":3,"name":"365mots","id":"5a6877d5-c76a-4fab-9f10-31c0448088d6","$$hashKey":212}},"status":"loading"},{"id":2,"weId":{"webentity":{"lru":"s:http|h:com|h:60millions-mag|","stems_count":3,"name":"60millions-Mag","id":"720d37b0-61b5-4c7f-853a-8b77d3e0bc5d","$$hashKey":270}},"status":"loading"},{"id":3,"weId":{"webentity":{"lru":"s:http|h:fr|h:80propositions|","stems_count":3,"name":"80propositions","id":"328349a6-5e0d-441c-84fb-d6deea334ac8","$$hashKey":228}},"status":"loading"},{"id":4,"weId":{"webentity":{"lru":"s:http|h:net|h:acontrario|","stems_count":3,"name":"Acontrario","id":"b86b1fb8-e627-417b-8ffd-cb2b9ac42fe2","$$hashKey":244}},"status":"loading"},{"id":5,"weId":{"webentity":{"lru":"s:http|h:com|h:blogspot|h:perdre-la-raison|","stems_count":4,"name":"Perdre-La-Raison","id":"1ae8c609-36d8-4777-b7d0-3b39d1b3e7e2","$$hashKey":258}},"status":"loading"},{"id":6,"weId":{"webentity":{"lru":"s:http|h:org|h:aclefeu|","stems_count":3,"name":"Aclefeu","id":"b68d330b-0cd4-4e07-adc1-01b1d42e0e74","$$hashKey":286}},"status":"loading"},{"id":7,"weId":{"webentity":{"lru":"s:http|h:org|h:acrimed|","stems_count":3,"name":"Acrimed","id":"00d46fb0-2a5d-4f66-aab9-fac10ca11256","$$hashKey":302}},"status":"loading"},{"id":8,"weId":{"webentity":{"lru":"s:http|h:org|h:actupparis|","stems_count":3,"name":"Actupparis","id":"b732a439-e00e-4ad9-8287-755373fe7921","$$hashKey":318}},"status":"loading"},{"id":9,"weId":{"webentity":{"lru":"s:http|h:com|h:acteurspublics|","stems_count":3,"name":"Acteurspublics","id":"baa003d8-2941-43ee-a60b-99431a8d79e6","$$hashKey":334}},"status":"loading"},{"id":10,"weId":{"webentity":{"lru":"s:http|h:com|h:actu-environnement|","stems_count":3,"name":"Actu-Environnement","id":"9f757880-6d0c-4a6d-9b5a-291819a037e2","$$hashKey":350}},"status":"loading"},{"id":11,"weId":{"webentity":{"lru":"s:http|h:org|h:actuchomage|","stems_count":3,"name":"Actuchomage","id":"f5350b69-80c3-427d-b4e6-647679574762","$$hashKey":366}},"status":"loading"},{"id":12,"weId":{"webentity":{"lru":"s:http|h:fr|h:afev|","stems_count":3,"name":"Afev","id":"293c8afb-4920-484d-9228-0253d4430086","$$hashKey":382}},"status":"loading"},{"id":13,"weId":{"webentity":{"lru":"s:http|h:com|h:nouvelobs|","stems_count":3,"name":"Nouvelobs","id":"bcb2f904-967a-49fa-8182-1a8e6472b5ac","$$hashKey":398}},"status":"loading"},{"id":14,"weId":{"webentity":{"lru":"s:http|h:com|h:nouvelobs|","stems_count":3,"name":"Nouvelobs","id":"bcb2f904-967a-49fa-8182-1a8e6472b5ac","$$hashKey":411}},"status":"loading"},{"id":15,"weId":{"webentity":{"lru":"s:http|h:eu|h:euromemorandum|","stems_count":3,"name":"Euromemorandum","id":"3788c46d-48c8-42dc-ad0a-62fd7a5736c7","$$hashKey":425}},"status":"loading"},{"id":16,"weId":{"webentity":{"lru":"s:http|h:fr|h:ademe|","stems_count":3,"name":"Ademe","id":"4e724e2c-7491-470c-8e6b-31979c93d1f8","$$hashKey":435}},"status":"loading"},{"id":17,"weId":{"webentity":{"lru":"s:http|h:eu|h:europa|","stems_count":3,"name":"Europa","id":"0c11d51e-2492-42c3-a5a8-1ce8a63946a4","$$hashKey":448}},"status":"loading"},{"id":18,"weId":{"webentity":{"lru":"s:http|h:fr|h:anact|","stems_count":3,"name":"Anact","id":"4729ade7-0a4c-470b-b47c-bf5ecc9ff597","$$hashKey":459}},"status":"loading"},{"id":19,"weId":{"webentity":{"lru":"s:http|h:org|h:hypotheses|","stems_count":3,"name":"Hypotheses","id":"1a856fc8-2725-42dc-9437-ce5a101914f6","$$hashKey":474}},"status":"loading"},{"id":20,"weId":{"webentity":{"lru":"s:http|h:fr|h:agoravox|","stems_count":3,"name":"Agoravox","id":"419e79fb-3739-4edf-8f43-02acc9a3886a","$$hashKey":485}},"status":"loading"},{"id":21,"weId":{"webentity":{"lru":"s:http|h:org|h:aides|","stems_count":3,"name":"Aides","id":"23c20145-506b-4316-8ac1-516f1e0a5799","$$hashKey":501}},"status":"loading"},{"id":22,"weId":{"webentity":{"lru":"s:http|h:fr|h:alternatives-economiques|","stems_count":3,"name":"Alternatives-Economiques","id":"80c579ac-7959-460e-9e88-2c638e2e12c1","$$hashKey":517}},"status":"loading"},{"id":23,"weId":{"webentity":{"lru":"s:http|h:eu|h:alainlamassoure|","stems_count":3,"name":"Alainlamassoure","id":"4c9b2a78-5131-42b6-ab21-e643f3e9d031","$$hashKey":528}},"status":"loading"},{"id":24,"weId":{"webentity":{"lru":"s:http|h:net|h:lipietz|","stems_count":3,"name":"Lipietz","id":"14e7acf8-a691-431f-b98b-f17959ce2f6c","$$hashKey":542}},"status":"loading"},{"id":25,"weId":{"webentity":{"lru":"s:http|h:fr|h:parti-socialiste|","stems_count":3,"name":"Parti-Socialiste","id":"8b00cab2-bfe6-4af3-bb52-bddfd4c842d3","$$hashKey":555}},"status":"loading"},{"id":26,"weId":{"webentity":{"lru":"s:http|h:fr|h:blogspot|h:aliciabx|","stems_count":4,"name":"Aliciabx","id":"50465121-424a-4e16-98c9-0a3a333fb149","$$hashKey":569}},"status":"loading"},{"id":27,"weId":{"webentity":{"lru":"s:http|h:fr|h:alliancecentriste|","stems_count":3,"name":"Alliancecentriste","id":"f96935e7-c607-48f9-aae9-6a9a66337adc","$$hashKey":581}},"status":"loading"},{"id":28,"weId":{"webentity":{"lru":"s:http|h:eu|h:alde|","stems_count":3,"name":"Alde","id":"070f1b1a-3338-4833-b929-dfe8e20b8671","$$hashKey":598}},"status":"loading"},{"id":29,"weId":{"webentity":{"lru":"s:http|h:fr|h:centristesblog|","stems_count":3,"name":"Centristesblog","id":"fb7372b5-94bb-4a66-a59d-75580cde8d8e","$$hashKey":613}},"status":"loading"},{"id":30,"weId":{"webentity":{"lru":"s:http|h:fr|h:alliance-ecologiste-independante|","stems_count":3,"name":"Alliance-Ecologiste-Independante","id":"b3811b8e-56b4-4cd9-a1ca-4efe27499221","$$hashKey":624}},"status":"loading"},{"id":31,"weId":{"webentity":{"lru":"s:http|h:org|h:alliancegeostrategique|","stems_count":3,"name":"Alliancegeostrategique","id":"00529f6b-a104-4e4a-9d0e-7036b558dae0","$$hashKey":638}},"status":"loading"},{"id":32,"weId":{"webentity":{"lru":"s:http|h:eu|h:socialistsanddemocrats|","stems_count":3,"name":"Socialistsanddemocrats","id":"2b3148df-48eb-40a1-8b5d-ed4b91a7405f","$$hashKey":651}},"status":"loading"},{"id":33,"weId":{"webentity":{"lru":"s:http|h:fr|h:alliance-pour-une-france-juste|","stems_count":3,"name":"Alliance-Pour-Une-France-Juste","id":"e6bd50aa-54e8-4e13-8d09-09e0938b0143","$$hashKey":665}},"status":"loading"},{"id":34,"weId":{"webentity":{"lru":"s:http|h:org|h:allons-enfants|","stems_count":3,"name":"Allons-Enfants","id":"bf6733d4-c756-4354-9c2f-2c47f19fbdb1","$$hashKey":676}},"status":"loading"},{"id":35,"weId":{"webentity":{"lru":"s:http|h:org|h:alsacedabord|","stems_count":3,"name":"Alsacedabord","id":"5405c08a-1b31-4b31-a5ca-2e95a1d093f0","$$hashKey":692}},"status":"loading"},{"id":36,"weId":{"webentity":{"lru":"s:http|h:fr|h:alter-oueb|","stems_count":3,"name":"Alter-Oueb","id":"0681fcd3-e093-4a7c-a693-901a306438ac","$$hashKey":708}},"status":"loading"},{"id":37,"weId":{"webentity":{"lru":"s:http|h:org|h:altermondes|","stems_count":3,"name":"Altermondes","id":"fc510650-67a8-466e-af5a-57df0773e7bd","$$hashKey":724}},"status":"loading"},{"id":38,"weId":{"webentity":{"lru":"s:http|h:fr|h:alternative-liberale|","stems_count":3,"name":"Alternative-Liberale","id":"5d7c7533-6e91-4ac3-9ea5-6ead81c89f39","$$hashKey":741}},"status":"loading"}] 
    $scope.list = bootstrapList(list)
    
    // Clean store
    store.remove('webentities_toCrawl')

    if($scope.list.length==0){
      $location.path('/newCrawl')
    }



    function bootstrapList(weId_list){
      var weId_list = weId_list || []

      // Pagination
      initPagination(0, 50, weId_list.length)
      
      return weId_list.map(function(weId, i){
        return {
          id:i
          ,weId: weId
          ,status: 'loading'
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

  }])
