'use strict';

angular.module('hyphe.checkstartpagesController', [])

  .controller('CheckStartPages', ['$scope', 'api', 'store', 'utils', '$location', 'QueriesBatcher', '$modal', 'corpus'
  ,function($scope, api, store, utils, $location, QueriesBatcher, $modal, corpus) {
    $scope.currentPage = 'checkStartPages'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    var timeout = 20
    ,secondaryTimeout = 5
    
    $scope.lookups = {}
    $scope.secondaryLookups = {}
    
    $scope.crawlDepth = 1

    $scope.httpStatusLoading = 0
    $scope.httpStatusWarning = 0
    $scope.httpStatusSuccess = 0
    
    $scope.paginationPage = 1
    $scope.paginationLength = 50    // How many items per page
    $scope.paginationNumPages = 5   // How many pages to display in the pagination

    $scope.list = bootstrapList(store.get('webentities_toCrawl'))

    $scope.queriesBatches = []

    $scope.depthRange = [0,1]
    api.getCorpusOptions({
      id: $scope.corpusId
    }, function(options){
      $scope.depthRange = Array.apply(0, Array(options.max_depth + 1)).map(function(a,i){return i})
    }, function(){
      $scope.status = {message: "Error while getting options", background: 'danger'}
    })

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
      $scope.queriesBatches.push(queriesBatcher)

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
                  obj_setStatus(obj, 'loaded')
                  obj.webentity = we_list[0]
                  updateStartPageLookups(obj)
                } else {
                  obj_setStatus(obj, 'error')
                  console.log('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', we_list, 'status:', status)
                }
              }
            ,function(data, status, headers){     // Fail callback
                obj_setStatus(obj, 'error')
                console.log('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', data, 'status:', status)
                if(data && data[0] && data[0].code == 'fail'){
                  obj.infoMessage = data[0].message
                }
              }
            ,{                                    // Options
                label: obj.webentity.id
                ,before: function(){
                    obj_setStatus(obj, 'pending')
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
      $location.path('/project/'+$scope.corpusId+'/newCrawl')
    } else {
      $scope.getWebentities()
    }

    // Declaring a start page
    $scope.addStartPage = function(objId){

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
            templateUrl: 'partials/startpagemodal.html'
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
                
                // Query call
                api.addPrefix({                         // Query settings
                    webentityId: obj.webentity.id
                    ,lru: prefixes
                  }
                  ,function(){                          // Success callback
                    addStartPageAndReload(obj.id, url)
                  }
                  ,function(data, status, headers){     // Fail callback
                    $scope.status = {message:'Prefix could not be added', background:'danger'}
                  })

              } else if(feedback.task.type == 'merge'){
                
                // Merge web entities
                var webentity = feedback.task.webentity
                $scope.status = {message:'Merging web entities'}
                obj_setStatus(obj, 'merging')
                api.webentityMergeInto({
                    oldWebentityId: webentity.id
                    ,goodWebentityId: obj.webentity.id
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
      
      // clear pending requests
      $scope.queriesBatches.forEach(function(q){
        q.abort()
      })

      store.set('webentities_toCrawl', list)
      $location.path('/project/'+$scope.corpusId+'/scheduleCrawls')
    }

    $scope.removeRow = function(objId){
      console.log('remove row',objId)
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
          ,touched: false
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
      obj_setStatus(obj, 'loading')
      obj.touched = true
      _addStartPage(obj, url, function(){
        reloadRow(obj.id)
      })
    }

    function removeStartPageAndReload(rowId, url){
      var obj = list_byId[rowId]
      obj_setStatus(obj, 'loading')
      obj.touched = true
      _removeStartPage(obj, url, function(){
        reloadRow(obj.id)
      })
    }

    function reloadRow(rowId){
      var obj = list_byId[rowId]
      obj_setStatus(obj, 'loading')

      // New status
      obj_setSummaryStatus(obj, 'loading')
      
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
            obj_setStatus(obj, 'loaded')
            obj.webentity = we_list[0]
            updateStartPageLookups(obj)
          } else {
            obj_setStatus(obj, 'error')
            console.log('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', we_list, 'status:', status)
          }
        }
        ,function(data, status, headers, config){
          obj_setStatus(obj, 'error')
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
            obj_setStatus(obj, 'loaded')
        }
        ,function(data, status, headers, config){
          $scope.status = {message:'Start page could not be added', background:'danger'}
          if(callback)
            callback(data)
          else
            obj_setStatus(obj, 'loaded')
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
            obj_setStatus(obj, 'loaded')
        }
        ,function(data, status, headers, config){
          $scope.status = {message:'Start page could not be removed', background:'danger'}
          if(callback)
            callback(data)
          else
            obj_setStatus(obj, 'loaded')
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

      // If there are no pages, it depends
      if(obj.webentity.startpages.length == 0){
        if(obj.touched){
          // The object was modified: there will be no lookup, but the status is still 'warning'
          obj_setSummaryStatus(obj, 'warning')
          obj.collapsed = false
        } else {
          // The object has not been touched: we will try the prefixes as lookups
          obj_setStatus(obj, 'loading')
          reschedulePrefixLookups(obj)
        }
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
        $scope.queriesBatches.push(lookupQB)
        unlookedUrls.forEach(function(url){
          lookupQB.addQuery(
              api.urlLookup                         // Query call
              ,{                                    // Query settings
                  url: url
                  ,timeout: timeout
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
    
    function reschedulePrefixLookups(obj){
      var prefixes = obj.webentity.lru_prefixes.map(utils.LRU_to_URL)

      var slo_obj = {}      // Secondary lookup object
      prefixes.forEach(function(vurl){
        slo_obj[vurl] = {status:'loading', url:vurl, rowId: obj.id}
      })
      $scope.secondaryLookups[obj.id] = slo_obj

      var secondaryLookupQB = new QueriesBatcher()
      $scope.queriesBatches.push(secondaryLookupQB)
      prefixes.forEach(function(vurl){
        secondaryLookupQB.addQuery(
          api.urlLookup                         // Query call
          ,{                                    // Query settings
              url:vurl
            }
          ,function(httpStatus){                // Success callback
              var slo = $scope.secondaryLookups[obj.id][vurl]
              slo.status = httpStatus
            }
          ,function(data, status, headers){     // Fail callback
              var slo = $scope.secondaryLookups[obj.id][vurl]
              slo.status = 'error'
            }
          ,{                                    // Options
              label: 'secondary prefix lookup '+vurl
              ,before: function(){
                  var slo = $scope.secondaryLookups[obj.id][vurl]
                  slo.status = 'pending'
                }
              ,simultaneousQueries: 1
            }
        )
      })
  
      secondaryLookupQB.atFinalization(function(list,pending,success,fail){
        console.log('All secondary prefix lookups done for '+obj.id,$scope.secondaryLookups[obj.id])

        var successfulVariations = []
        for(var vurl in $scope.secondaryLookups[obj.id]){
          var slo = $scope.secondaryLookups[obj.id][vurl]
          if(slo.status == 200){
            successfulVariations.push(vurl)
          }
        }

        // If no prefix is valid, we try to find the redirections
        if(successfulVariations.length == 0){
          for(var invurl in $scope.secondaryLookups[obj.id]){
            var slo = $scope.secondaryLookups[obj.id][invurl]
            if(!!(''+slo.status).match(/30./gi)){ // If code 30x, redirection, we keep
              successfulVariations.push(invurl)
            }
          }
        }

        // If still nothing, just add the shortest prefix
        if(successfulVariations.length == 0){
          for(var invurl in $scope.secondaryLookups[obj.id]){
            if(successfulVariations.length == 0){
              successfulVariations = [invurl]
            } else if(invurl.length < successfulVariations[0].length){
              successfulVariations = [invurl]
            }
          }
        }

        if(successfulVariations.length == 0){
          // The lookup failed
          obj_setStatus(obj, 'loaded')
          obj_setSummaryStatus(obj, 'warning')
          obj.collapsed = false
        } else {
          // Add all successful start pages
          var batchAddStartPages = new QueriesBatcher()
          $scope.queriesBatches.push(batchAddStartPages)

          successfulVariations.forEach(function(url){
            batchAddStartPages.addQuery(
              api.addStartPage                      // Query call
              ,{                                    // Query settings
                  webentityId: obj.webentity.id
                  ,url:url
                }
              ,function(httpStatus){                // Success callback
                  
                }
              ,function(data, status, headers){     // Fail callback
                  $scope.status = {message:'Start page could not be added', background:'danger'}
                  console.log('[Error] could not add prefix as startpage',url,obj)
                }
              ,{                                    // Options
                  label: 'adding start page '+url
                  ,simultaneousQueries: 1
                }
            )
          })

          batchAddStartPages.atFinalization(function(list,pending,success,fail){
            console.log('All start pages added for '+obj.id, $scope.secondaryLookups[obj.id])
            reloadRow(obj.id)
          })

          batchAddStartPages.run()
        }
      })

      secondaryLookupQB.run()
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
      $scope.queriesBatches.push(secondaryLookupQB)
      variations.forEach(function(vurl){
        secondaryLookupQB.addQuery(
          api.urlLookup                         // Query call
          ,{                                    // Query settings
              url: vurl
              ,timeout: secondaryTimeout
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
      
      obj_setSummaryStatus(obj, 'loading')
      obj.startpagesSummary = {
        loaded: loadedPages.length
        ,loading: obj.webentity.startpages.length - loadedPages.length
        ,warning: warningPages.length
        ,status: 'loading'
      }

      if(obj.webentity.startpages.length == 0){
        obj_setSummaryStatus(obj, 'warning')
        obj.collapsed = false
      } else if(obj.startpagesSummary.loading == 0){
        if(obj.startpagesSummary.warning == 0){
          obj_setSummaryStatus(obj, 'success')
          obj.collapsed = true
        } else {
          obj_setSummaryStatus(obj, 'warning')
          obj.collapsed = false
        }
      } else {
        obj_setSummaryStatus(obj, 'loading')
      }
    }

    function obj_setStatus(obj, status){
      switch(obj.status){
        case('warning'):
          $scope.httpStatusWarning--
          break
        case('error'):
          $scope.httpStatusWarning--
          break
        case('loaded'):
          switch(obj.startpagesSummary.status){
            case('success'):
              $scope.httpStatusSuccess--
              break
            case('warning'):
              $scope.httpStatusWarning--
              break
            default:
              $scope.httpStatusLoading--
          }
          break
        default:
          $scope.httpStatusLoading--
      }

      obj.status = status

      switch(status){
        case('warning'):
          $scope.httpStatusWarning++
          break
        case('error'):
          $scope.httpStatusWarning++
          break
        case('loaded'):
          switch(obj.startpagesSummary.status){
            case('success'):
              $scope.httpStatusSuccess++
              break
            case('warning'):
              $scope.httpStatusWarning++
              break
            default:
              $scope.httpStatusLoading++
          }
          break
        default:
          $scope.httpStatusLoading++
      }
    }

    function obj_setSummaryStatus(obj, summaryStatus){
      switch(obj.status){
        case('warning'):
          $scope.httpStatusWarning--
          break
        case('error'):
          $scope.httpStatusWarning--
          break
        case('loaded'):
          switch(obj.startpagesSummary.status){
            case('success'):
              $scope.httpStatusSuccess--
              break
            case('warning'):
              $scope.httpStatusWarning--
              break
            default:
              $scope.httpStatusLoading--
              break
          }
          break
        default:
          $scope.httpStatusLoading--
          break
      }

      obj.startpagesSummary.status = summaryStatus

      switch(obj.status){
        case('warning'):
          $scope.httpStatusWarning++
          break
        case('error'):
          $scope.httpStatusWarning++
          break
        case('loaded'):
          switch(summaryStatus){
            case('success'):
              $scope.httpStatusSuccess++
              break
            case('warning'):
              $scope.httpStatusWarning++
              break
            default:
              $scope.httpStatusLoading++
              break
          }
          break
        default:
          $scope.httpStatusLoading++
          break
      }
    }

    /* Modal controller */
    function startPageModalCtrl($scope, $modalInstance, url, webentity) {
      $scope.url = url
      $scope.webentity = webentity
      $scope.wwwVariations = true
      $scope.httpsVariations = true

      // Bootstrapping the object for the Prefix Slider
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
      obj_setStatus(obj, 'loading')
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
