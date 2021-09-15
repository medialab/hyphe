'use strict';

angular.module('hyphe.preparecrawlsController', [])

  .controller('PrepareCrawls', ['$scope', 'api', 'store', 'utils', '$location', 'QueriesBatcher', 'corpus', '$timeout', '$interval', '$mdDialog'
  ,function($scope, api, store, utils, $location, QueriesBatcher, corpus, $timeout, $interval, $mdDialog) {
    
    $scope.currentPage = 'prepareCrawls'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.crawlDepth = 1
    $scope.cautious = false
    $scope.cookies = null
    $scope.webarchives = {}

    $scope.scheduling = false

    $scope.depthRange = [0,1]

    $scope.queriesBatches = []
    $scope.lookups = {}

    $scope.list = []    // List of objects representing web entities
    var list_byId = {}  // List index

    $scope.getWebentities = getWebentities

    var timeout = 20
    $scope.queriesBatches = []
    var lookupEngine = getLookupEngine()
      , lazylookupTimeInterval

    $scope.openWebentity = function(id, ev){
      var obj = list_byId[id]
      if (obj.status === 'loaded') {
        openWebentityModal(obj, ev)
      }
    }

    $scope.infinityRange = 50 * 365

    // Initialization

    getSettings()

    // Lazy lookups

    lazylookupTimeInterval = $interval(function(){ lazyLookups() }, 2000);
    $scope.$on(
      "$destroy",
      function( event ) {
          $interval.cancel( lazylookupTimeInterval )
      }
    )

    // Update summaries
    $scope.$watch('lookups', function (newValue, oldValue) {
      $timeout(function(){
        updateStartpagesSummaries()
      }, 0)
    }, true)

    $scope.removeCell = function(objId){
      $scope.list = $scope.list.filter(function(obj){
        return obj.id != objId
      })
      delete list_byId[objId]
      updateStartpagesSummaries()
      if (!$scope.list.length) {
        $location.path('/project/'+$scope.corpusId+'/overview')
      }
    }

    // Schedule crawls
    $scope.scheduleCrawls = function () {
      $scope.scheduling = true
      var queriesBatcher = new QueriesBatcher()
      $scope.list.forEach(function (obj) {
        if (obj.webentity.webarchives && (!obj.webentity.webarchives.days_range || obj.webentity.webarchives.days_range === 'infinity')) {
          obj.webentity.webarchives.days_range = $scope.infinityRange / 2
        }
        // Stack the query
        queriesBatcher.addQuery(
            api.crawl                             // Query call
            ,{                                    // Query settings
                webentityId: obj.webentity.id
                ,depth: obj.webentity.crawlDepth || $scope.crawlDepth
                ,cautious: $scope.cautious
                ,proxy: null
                ,cookies_string: obj.webentity.cookiesString || null
                ,webarchives: obj.webentity.webarchives || {}
              }
            ,function(data){                      // Success callback
                obj_setStatus(obj, 'scheduled')
              }
            ,function(data, status, headers){     // Fail callback
                obj_setStatus(obj, 'error')
                obj.errorMessage = data[0].message
              }
            ,{                                    // Options
                label: obj.webentity.id
                ,before: function(){
                    obj_setStatus(obj, 'pending')
                  }
                ,simultaneousQueries: 3
              }
          )
      })

      queriesBatcher.atEachFetch(function(list, pending, success, fail) {
        $scope.status = {message: 'Scheduling...'}
      })

      queriesBatcher.atFinalization(function(list, pending, success, fail){
        $scope.status = {}
        $timeout(function() {
          $location.path('/project/'+$scope.corpusId+'/monitorCrawls')
        }, 500)
      })

      queriesBatcher.run()
    }


    // Functions

    function getSettings(){
      api.globalStatus({},
        function(corpus_status){
        var options = corpus_status.corpus.options
        $scope.webarchives_options = corpus_status.hyphe.available_archives
        $scope.webarchives = {
          option: options.webarchives_option,
          date: options.webarchives_option ? options.webarchives_date : (new Date()).toISOString().slice(0, 10),
          days_range: options.webarchives_option ? options.webarchives_days_range : 'infinity'
        }
        $scope.depthRange = Array.apply(0, Array(options.max_depth + 1)).map(function(a,i){return i})
        bootstrapList()
      }, function(){
        $scope.status = {message: "Error while getting options", background: 'danger'}
      })
    }

    function bootstrapList(){
      var list = store.get('webentities_toCrawl') || []
      , oldjob = store.get('webentity_old_crawljob')

      // Reuse oldjob's settings if set from previous crawl

      if (oldjob){
        $scope.crawlDepth = oldjob.crawl_arguments.max_depth
        $scope.cookies = oldjob.crawl_arguments.cookies
        $scope.cautious = oldjob.crawl_arguments.phantom
        $scope.webarchives = oldjob.crawl_arguments.webarchives
      }
      store.remove('webentity_old_crawljob')
      store.remove('webentities_toCrawl')

      // Remove doublons
      list = utils.extractCases(list, function(obj){
        return obj.webentity.id
      })

      // Clean and set exactly what we need
      list = list.map(function(obj, i){
        return {
          id: i
          ,webentity: obj.webentity
          ,webarchives: obj.webarchives
          ,status: 'loading'
        }
      })

      // Build index
      list.forEach(function(obj){
        list_byId[obj.id] = obj
      })

      // Redirect if needed
      if(list.length == 0){
        $location.path('/project/'+$scope.corpusId+'/monitorCrawls')
      } else {
        $scope.list = list
        getWebentities()
      }
    }

    // Get web entities (including start pages)
    function getWebentities(opt){
      
      // Options
      opt = opt || {}
      // opt.skip_when_start_pages_exist
      // opt.list

      $scope.status = {message:'Loading Web Entities'}

      var queriesBatcher = new QueriesBatcher()
        , listToQuery = opt.list || $scope.list
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
                  if ($scope.cookies) {
                    obj.webentity.cookiesString = $scope.cookies
                  }
                  obj.webentity.webarchives = {}
                  Object.assign(obj.webentity.webarchives, $scope.webarchives)
                  if (obj.webarchives) {
                    Object.assign(obj.webentity.webarchives, obj.webarchives)
                  }
                  lazyLookups(obj.webentity.startpages, obj.webentity)
                } else {
                  obj_setStatus(obj, 'error')
                  console.error('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', we_list, 'status:', status)
                }
              }
            ,function(data, status, headers){     // Fail callback
                obj_setStatus(obj, 'error')
                console.error('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', data, 'status:', status)
                if(data && data[0] && data[0].code == 'fail'){
                  obj.infoMessage = data[0].message
                }
              }
            ,{                                    // Options
                label: obj.webentity.id
                ,before: function(){
                    obj_setStatus(obj, 'loading')
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

    // Web entities status lifecycle
    function obj_setStatus(obj, status) {
      obj.status = status
      updateStatusesSummary()
    }

    function updateStatusesSummary() {
      if ($scope.list && $scope.list.length > 0) {
        $scope.statusesSummary = {counts:{}, percents:{}, total:0, problems:0}
        $scope.list.forEach(function(obj){
          $scope.statusesSummary.counts[obj.status] = ($scope.statusesSummary.counts[obj.status] || 0) + 1
          if (obj.summary && obj.summary.diagnostic && obj.summary.diagnostic.doomed) {
            $scope.statusesSummary.problems++
          }
          $scope.statusesSummary.total++
        })

        // Compute percents
        var k
        for (k in $scope.statusesSummary.counts) {
          $scope.statusesSummary.percents[k] = Math.round( 100 * $scope.statusesSummary.counts[k] / $scope.statusesSummary.total )
        }
      }
    }

    // Lazy lookup
    function lazyLookups( batch, webentity ){
      var lookupBatch = {}
        , maxSize = 8;
      ( batch || [] ).slice().forEach(function(url){
        lookupBatch[url] = webentity
      })

      $scope.list.some(function(obj, i){
        if(obj.webentity && obj.webentity.startpages){
          
          obj.webentity.startpages.some(function(url){
            if($scope.lookups[url] === undefined){

              if (!lookupBatch[url]){
                lookupBatch[url] = obj.webentity
              }

            } else if($scope.lookups[url].status == 'loading') {

              maxSize-- // Loading lookups takes a slot

            }

            if(Object.keys(lookupBatch).length >= maxSize){
              return true
            }
          })

          if(Object.keys(lookupBatch).length >= maxSize){
            return true
          }

        }
      })

      if(Object.keys(lookupBatch).length > 0){
        lookupEngine.doLookups($scope.lookups, lookupBatch)
      }

    }

    // Start pages summaries
    function updateStartpagesSummaries(){
      $scope.list.forEach(function(obj){
        var loaded = obj.summary && obj.summary.stage && obj.summary.stage == 'loaded'
        if ( !loaded && obj.webentity && obj.webentity.startpages ) {
          var summary = updateStartpagesSummary(obj.webentity.startpages)
          obj.summary = summary
        }
      })
      updateStatusesSummary()
      $scope.$apply()
    }

    function updateStartpagesSummary(startpages){

      var loading = false
        , loading_count = 0
        , total = 0
        , statusIndex = {}
        , result = {}

      // build status index
      startpages.forEach(function(url){
        var status = ($scope.lookups[url] || {status:'loading'}).status
          , value = statusIndex[status] || 0

        statusIndex[status] = value + 1
      })

      // check if globally loading
      for (var status in statusIndex) {

        var count = statusIndex[status]
        total += count

        if(status == 'loading' && count > 0){
          loading_count += count
          loading = true
        }
      }

      if (loading) {
        result.stage = 'loading'
        result.percent = Math.round( 100 * (total - loading_count) / total )

        // Diagnostic
        result.diagnostic = {}

      } else {
        if (startpages.length) {
          result.stage = 'loaded'
        }
        result.percent = 100

        // Diagnostic
        result.diagnostic = {
          ready: ( statusIndex['success'] || 0 ) > 0
        , doomed: ( statusIndex['success'] || 0 ) == 0
        , issues: ( statusIndex['issue'] || 0 ) + ( statusIndex['fail'] || 0 ) > 0
        }

      }

      return result
    }

    // Web entity modal
    function openWebentityModal(obj, ev){

      if ((obj.webentity.startpages || []).length == 0) {

        getStartPagesSuggestions(obj.webentity, ev)

      } else {

        instanciateModal(obj, ev)

      }

      function getStartPagesSuggestions(webentity, ev) {
        api.getStartPagesSuggestions({
          webentityId: webentity.id,
          autoSet: true
        }, function(urls){

          lazyLookups(urls, webentity)
          webentity.summary = {}
          webentity.startpages = urls

          instanciateModal(obj, ev)

        }, function(){
          $scope.status = {message: "Error while getting start pages suggestions", background: 'danger'}
        })
      }

    }

    /* Instanciate and open the Modal */
    function instanciateModal(obj, ev) {

      obj.webentity.crawlDepth ||= $scope.crawlDepth+0

      $mdDialog.show({
        controller: webentityStartPagesDialogController,
        templateUrl: 'partials/webentitystartpagesmodal.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true,
        locals: {
          webentity: obj.webentity,
          depthRange: $scope.depthRange,
          webarchives_options: $scope.webarchives_options,
          lookups: $scope.lookups,
          lookupEngine: lookupEngine,
          // Updaters are used to propagate editions from modal to mother page
          updaters: {
            webentityAddStartPage: webentityAddStartPage,
            webentityRemoveStartPage: webentityRemoveStartPage,
            mergeWebentities: mergeWebentities
          }
        }
        
      })
      .then(function(answer) {
        // TODO. Ex:
        // $scope.status = 'You said the information was "' + answer + '".';
      }, function() {
        // TODO. Ex:
        // $scope.status = 'You cancelled the dialog.';
      });

    }

    // Lookup Engine
    function getLookupEngine(){

      var ns = {}

      ns.initLookup = function(url, webentity){

        return {
          url: url
        , webentity: webentity
        , status: 'loading'
        }

      }

      ns.notifySuccessful = function(lookup, httpStatus, redirectUrl){
        if (redirectUrl){
          api.getWebentity(
            { url: redirectUrl }
            , function(WE){
                lookup.status = (WE.id === lookup.webentity.id) ? ('success') : ('issue')
                lookup.httpStatus = (WE.id === lookup.webentity.id) ? (200) : (httpStatus)
              }
            , function(data){
                lookup.status = 'issue'
                lookup.httpStatus = httpStatus
              }
          )
        } else {
          lookup.status = (+httpStatus == 200) ? ('success') : ('issue')
          lookup.httpStatus = httpStatus
        }
      }

      ns.notifyFail = function(lookup){
        
        lookup.status = 'fail'
        lookup.httpStatus = undefined

      }

      ns.doLookups = function(lookups, urls){
        var unlooked = []
        Object.keys(urls).forEach(function(url){
          if (lookups[url] === undefined) {
            if (urls[url] === undefined) {
              console.error('Lookup error: an url has been passed without a webentity reference', url)
            }
            unlooked.push({
                url: url,
                webentity: urls[url]
            })
          }
        })

        if(unlooked.length > 0){
          var lookupQB = new QueriesBatcher()
          $scope.queriesBatches.push(lookupQB)
          unlooked.forEach(function(urlObj){
            lookupQB.addQuery(
                api.urlLookup                         // Query call
                ,{                                    // Query settings
                    url: urlObj.url
                    ,timeout: timeout
                  }
                ,function(httpStatus, extra){         // Success callback
                    
                    lookupEngine.notifySuccessful(lookups[urlObj.url], httpStatus, extra.location)
                    urlObj.webentity.webarchives.option_used_for_startpages = urlObj.webentity.webarchives.option + ''

                  }
                ,function(data, status, headers){     // Fail callback

                    lookupEngine.notifyFail(lookups[urlObj.url])

                  }
                ,{                                    // Options
                    label: 'lookup '+urlObj.url
                    ,before: function(){
                        lookups[urlObj.url] = lookupEngine.initLookup(urlObj.url, urlObj.webentity)
                      }
                    ,simultaneousQueries: 5
                  }
              )
          })

          lookupQB.atFinalization(function(list,pending,success,fail){
          })

          lookupQB.run()
        }
      }

      return ns;
    }

    // Updaters functions
    function webentityAddStartPage(id, url) {
      $scope.list.some(function(obj){
        if (obj.webentity.id === id) {
          obj.summary.stage = 'loading'
          if (!obj.webentity.startpages.some(function(u){return u === url})) {
            obj.webentity.startpages.push(url)
            lazyLookups([url], obj.webentity)
          }
          return true
        }
      })

      $timeout(function(){
        updateStartpagesSummaries()
      }, 0)
    }

    function webentityRemoveStartPage(id, url) {
      $scope.list.some(function(obj){
        if (obj.webentity.id === id) {
          obj.summary.stage = 'loading'
          var index = obj.webentity.startpages.indexOf(url);
          if (index > -1) {
            obj.webentity.startpages.splice(index, 1)
            return true
          }
          return false
        }
      })

      $timeout(function(){
        updateStartpagesSummaries()
      }, 0)
    }

    function mergeWebentities(sourceWebentity, targetWebentity) {
      // Remove source web entity if it's in the list, and target web entity as well
      $scope.list = $scope.list.filter(function(o){
        if (o.webentity.id !== sourceWebentity.id && o.webentity.id !== targetWebentity.id) {
          return true
        } else {
          obj_setStatus(o, 'deleted')
          return false
        }
      })

      // Add the target webentity object for reload
      var maxid = 0
      $scope.list.forEach(function(o){
        maxid = Math.max(maxid, o.id)
      })
      var obj = {
        id: maxid + 1,
        webentity: targetWebentity,
        status: 'loading',
        summary: {}
      }
      $scope.list.push(obj)

      // Update data related to the list
      $scope.list.forEach(function(o){
        list_byId[o.id] = o
      })

      // Ask for full WE data and update existing entity
      obj_setStatus(obj, 'loading')
      obj.summary.stage = 'loading'
      api.getWebentities({
          id_list:[obj.webentity.id]
        },
        function (we_list) {
          // Success
          if(we_list.length > 0){
            obj_setStatus(obj, 'loaded')
            obj.webentity = we_list[0]
            lazyLookups(obj.webentity.startpages, obj.webentity)
          } else {
            obj_setStatus(obj, 'error')
            console.error('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', we_list, 'status:', status)
          }
        },
        function (data) {
          // Fail
          obj_setStatus(obj, 'error')
          console.error('[row '+(obj.id+1)+'] Error while loading web entity ' + obj.webentity.id + '(' + obj.webentity.name + ')', data, 'status:', status)
          if(data && data[0] && data[0].code == 'fail'){
            obj.infoMessage = data[0].message
          }
        }
      )

      $timeout(function(){
        updateStartpagesSummaries()
      }, 0)
    }




    /***
    ****  DIALOG CONTROLLER
    ***/
    function webentityStartPagesDialogController($scope, $mdDialog, webentity, depthRange, webarchives_options, lookups, lookupEngine, updaters) {

      $scope.lookups = lookups
      $scope.webentity = webentity
      $scope.depthRange = depthRange
      $scope.cookies_error = ""
      $scope.date_error = ""
      $scope.webarchives_options = webarchives_options
      $scope.datepicker_date = new Date(webentity.webarchives.date)

      $scope.initDatePicker = function() {
        var dp = document.getElementById('datepicker')
        if (dp && (!dp.value || dp.value === "")) {
          dp.value = webentity.webarchives.date
          dp.parentNode.classList.add("md-input-has-value")
        }
      }

      $scope.webarchives_periods = {
        0: "Only that date",
        1: "a day",
        3: "3 days",
        7: "a week",
        14: "2 weeks",
        30: "a month",
        91: "3 months",
        182: "6 months",
        "custom": "Custom",
        "infinity": "Whatever"
      }
  
      $scope.setArchivesMinMaxDate = function() {
        $scope.date_error = ""
        if (!webentity.webarchives.option) {
          return
        }
        $scope.initDatePicker()

        if ($scope.ed_webarchive_daysrange_custom === undefined || $scope.ed_webarchive_daysrange_choice === undefined) {
          if (webentity.webarchives.days_range === $scope.infinityRange || webentity.webarchives.days_range === 'infinity') {
            $scope.ed_webarchive_daysrange_choice = 'infinity'
            $scope.ed_webarchive_daysrange_custom = $scope.infinityRange;
          } else {
            $scope.ed_webarchive_daysrange_custom = Math.trunc(webentity.webarchives.days_range / 2);
            if (Object.keys($scope.webarchives_periods).map(x => 2*x).indexOf(webentity.webarchives.days_range) == -1) {
              $scope.ed_webarchive_daysrange_choice = 'custom'
            } else {
              $scope.ed_webarchive_daysrange_choice = webentity.webarchives.days_range / 2
            }
          }
        }

        var chosen_option = $scope.webarchives_options.filter(function(o) { return o.id === webentity.webarchives.option})[0]
        $scope.min_allowed_webarchives_date = new Date(chosen_option.min_date || "1995-01-01")
        $scope.max_allowed_webarchives_date = new Date()

        if ($scope.ed_webarchive_daysrange_choice === 'custom') {
          webentity.webarchives.days_range = 2 * $scope.ed_webarchive_daysrange_custom
          $scope.webarchives_days_range_display = webentity.webarchives.days_range + " days"
        } else {
          if ($scope.ed_webarchive_daysrange_choice === 'infinity') {
            webentity.webarchives.days_range = $scope.infinityRange
          } else {
            webentity.webarchives.days_range = 2 * parseInt($scope.ed_webarchive_daysrange_choice)
          }
          $scope.webarchives_days_range_display = $scope.webarchives_periods[webentity.webarchives.days_range_choice]
        }
  
        if (document.getElementById('datepicker')) {
          webentity.webarchives.date = document.getElementById('datepicker').value
        }
        try {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(webentity.webarchives.date)) {
            $scope.date_error = "This is not a valid date, the format should be YYYY-MM-DD."
            return
          }
          var dat = new Date(webentity.webarchives.date)
          if (dat < $scope.min_allowed_webarchives_date || dat > $scope.max_allowed_webarchives_date) {
            $scope.date_error = "This web archive only ranges from " + $scope.min_allowed_webarchives_date.toISOString().slice(0, 10) + " to " + $scope.max_allowed_webarchives_date.toISOString().slice(0, 10)
            return
          }
          dat.setDate(dat.getDate() - webentity.webarchives.days_range / 2)
          $scope.webarchives_mindate = ($scope.ed_webarchive_daysrange_choice === 'infinity' ? $scope.min_allowed_webarchives_date : dat).toISOString().slice(0, 10)
          dat.setDate(dat.getDate() + webentity.webarchives.days_range)
          $scope.webarchives_maxdate = ($scope.ed_webarchive_daysrange_choice === 'infinity' ? $scope.max_allowed_webarchives_date : dat).toISOString().slice(0, 10)
        } catch(e) {
          $scope.date_error = "This is not a valid date, the format should be YYYY-MM-DD."
        }
      }
      $scope.setArchivesMinMaxDate()

      $scope.startpagesSummary = {
          stage: 'loading'
        , percent: 0
        , diagnostic: {}
      }
      $scope.startpages = (webentity.startpages || [])
      $scope.urlsToAdd = []
      $scope.urlErrors = []
      $scope.addingErrors = []
      $scope.newStartPagesInvalid = false
      $scope.newStartPagesURLs = ''
      $scope.removed = {}

      $scope.newStartPagesStack = []
      $scope.checkStartpagesProgress = 0
      $scope.checkStartpagesConflicts = 0

      $scope.hide = function() {
        $mdDialog.hide();
      }

      // Unused for now but could be used by calling recheckStartPages via on-md-select on the Start pages md-tab
      /*
      $scope.recheckStartPages = function(){
        if ($scope.startpagesSummary.stage === 'loading' || webentity.webarchives.option_used_for_startpages === webentity.webarchives.option) {
          return
        }
        var sp_index = {}
        for (var idx in $scope.startpages) {
          lookups[$scope.startpages[idx]] = undefined
          sp_index[$scope.startpages[idx]] = webentity
        }
        lookupEngine.doLookups(lookups, sp_index)
      }
      */

      $scope.validateNewStartPages = function(){
        $scope.urlsToAdd = []
        $scope.urlErrors = []
        $scope.addingErrors = []
        $scope.newStartPagesInvalid = false
        $scope.newStartPagesURLs.split(/[\s\n\r\t]+/).forEach(function(url){
          if (!url) return
          if (~$scope.startpages.indexOf(url) || ~$scope.urlsToAdd.indexOf(url)) {
            $scope.newStartPagesInvalid = true
            $scope.urlErrors.push(url + " (duplicate)")
          } else if (!utils.URL_validate(url)){
            $scope.newStartPagesInvalid = true
            $scope.urlErrors.push(url)
          } else {
            $scope.urlsToAdd.push(url)
          }
        })
      }

      $scope.addStartPages = function() {
        // Last check
        $scope.validateNewStartPages()
        if ($scope.newStartPagesInvalid) return

        if (!$scope.urlsToAdd.length || $scope.newStartPagesInvalid) {
          return
        }
        $scope.newStartPagesStack = $scope.urlsToAdd.map(function(url){
          return {url:url, status:'pending', webentity: webentity, minPrefix:undefined}
        })
        $scope.newStartPagesURLs = ''
        checkNextStartpageBelonging(webentity)
      }

      $scope.removeStartPage = function (url) {
        removeStartPageAndUpdate(webentity, url)
      }

      $scope.resolveCase = resolveCase

      $scope.$watch('lookups', function (newValue, oldValue) {
        $timeout(function(){
          $scope.startpagesSummary = updateStartpagesSummary($scope.startpages)
        }, 0)
      }, true)

      // Init
      var spIndex = {}
      $scope.startpages.forEach(function(url){
        spIndex[url] = webentity
      })
      lookupEngine.doLookups($scope.lookups, spIndex)

      // Functions
      function removeStartPageAndUpdate(webentity, url){
        $scope.removed[url] = true
        var index = $scope.startpages.indexOf(url);
        if (index > -1) {
          _removeStartPage(webentity, url, function () {
          // Remove the start page from lists of start pages
            $scope.startpages.splice(index, 1);
            $scope.startpagesSummary = updateStartpagesSummary($scope.startpages)
            updaters.webentityRemoveStartPage(webentity.id, url)
          })
        }
      }

      // This function only performs the API call
      function _removeStartPage(webentity, url, successCallback){
        api.removeStartPage({
            webentityId: webentity.id
            ,url: url
          }
          ,function (data) {
            successCallback(data)
            $scope.removed[url] = false
          }
          ,function (data, status, headers, config) {
            // API call fail
            // Note: cannot access global status bar from modal
            console.error('Start page could not be removed', data, status, headers, config)
            $scope.removed[url] = false
          }
        )
      }

      // This function only performs the API call
      function _addStartPage(webentity, url, successCallback){
        api.addStartPage({
            webentityId: webentity.id
            ,url: url
          }
          ,function (data) {
            successCallback(data)
          }
          ,function (data, status, headers, config) {
            // API call fail
            // Note: cannot access global status bar from modal
            console.error('Start page could not be added', data, status, headers, config)
            $scope.urlErrors.push(url + " (" + data[0].message + ")")
          }
        )
      }

      function checkNextStartpageBelonging(webentity) {
        // Get next pending start page
        var obj
        $scope.newStartPagesStack.some(function(o){
          if (o.status == 'pending') {
            o.status = 'checking'
            obj = o
            return true
          } else return false
        })

        updateCheckStartpagesSummary()

        if (obj === undefined) {
          return
        }

        var callbacks = {
          success: function () {
            // Add start page and update
            if ((webentity.startpages || []).indexOf(obj.url) < 0) {
              // Add the start page to the entity
              _addStartPage(webentity, obj.url, function () {
                updaters.webentityAddStartPage(webentity.id, obj.url)
                $timeout(function(){checkNextStartpageBelonging(webentity)})
              })
              // Remove the start page from the checking list
              $timeout(function(){
                $scope.newStartPagesStack = $scope.newStartPagesStack.filter(function(o){
                  return o.url != obj.url
                })
                $scope.$apply()
              })
            }
          },
          otherWebentity: function (prefix) {
            obj.status='other webentity'
            obj.minPrefix = prefix
            $timeout(function(){checkNextStartpageBelonging(webentity)})
          },
          queryFail: function () {
            obj.status='fail'
            $timeout(function(){checkNextStartpageBelonging(webentity)})
          }
        }

        api.getCreationRulesResult({
            urlList: [obj.url]
          }
          ,function (data) {
            if (!data[obj.url])
              callbacks.queryFail()
            else if (~webentity.prefixes.indexOf(data[obj.url]))
              callbacks.success()
            else callbacks.otherWebentity(data[obj.url])
          }
          ,function (data, status, headers, config) {
            // API call fail
            callbacks.queryFail()
            // Note: cannot access global status bar from modal
            console.error('Could not get web entity for url '+obj.url, data, status, headers, config)
          }
        )
      }

      function updateCheckStartpagesSummary() {
        var total = $scope.newStartPagesStack.length
        var count = $scope.newStartPagesStack.filter(function(o){
          return o.status != 'pending' && o.status != 'checking'
        }).length
        $scope.checkStartpagesProgress = Math.round(100 * count / total)
        $scope.checkStartpagesConflicts = $scope.newStartPagesStack.filter(function(o){
          return o.status == 'other webentity' || o.status == 'fail'
        }).length
      }

      function resolveCase(feedback) {
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
                webentityId: webentity.id
                ,lru: prefixes
              }
              ,function(){                          // Success callback
                // Add the start page to the entity
                _addStartPage(webentity, feedback.url, function () {
                  updaters.webentityAddStartPage(webentity.id, feedback.url)
                })
                // Remove the start page from the checking list
                $timeout(function(){
                  $scope.newStartPagesStack = $scope.newStartPagesStack.filter(function(o){
                    return o.url != feedback.url
                  })
                  $scope.$apply()
                })
              }
              ,function(data, status, headers, config){     // Fail callback
                // Note: cannot access global status bar from modal
                console.error('Prefix could not be added', data, status, headers, config)
                $scope.urlErrors.push(url + " (" + data[0].message + ")")
                $scope.addingErrors.push(url)
              })

          } else if (feedback.task.type == 'merge') {
            
            // Merge web entities
            api.webentityMergeInto({
                oldWebentityId: webentity.id
                ,goodWebentityId: feedback.task.webentity.id
                ,mergeNameAndStatus: false
              }
              ,function(data){
                // Add the start page to the entity
                _addStartPage(feedback.task.webentity, feedback.url, function () {
                  updaters.webentityAddStartPage(feedback.task.webentity.id, feedback.url)
                  updaters.mergeWebentities(webentity, feedback.task.webentity)
                })
                // Close modal
                $scope.hide()
              }
              ,function(data, status, headers, config){
                // Note: cannot access global status bar from modal
                console.error('Merge failed', data, status, headers, config)
                $scope.urlErrors.push(url + " (" + data[0].message + ")")
                $scope.addingErrors.push(url)
              }
            )
          } else if (feedback.task.type == 'drop') {
            var url = feedback.task.url
            $timeout(function(){
              $scope.newStartPagesStack = $scope.newStartPagesStack.filter(function(o){
                return o.url != url
              })
              $scope.$apply()
            })
          } else {
            console.error('Check new start page resolution feedback has unknown task', feedback)
          }
        } else {
          console.error('Check new start page resolution feedback is improper', feedback)
        }
      }

      $scope.validateCookiesString = function(){
        if (! /^(\s*\w+\s*=\s*[^;]+)(;\s*\w+\s*=\s*[^;]+)*;?$/.test($scope.webentity.cookiesString) ) {
          $scope.cookies_error = "This is not a valid cookies string (key1=value1; key2=value2; ...)."
        } else {
          $scope.cookies_error = ""
        }
      }

    }
  }])
