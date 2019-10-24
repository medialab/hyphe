'use strict';

angular.module('hyphe.exportController', [])

  .controller('export', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'export'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.dataVolume = 'compact'
    $scope.compactFields = ['id', 'name', 'prefixes', 'indegree', 'pages_total', 'pages_crawled', 'status', 'last_modification_date', 'user_tags']
    $scope.fields = {
      id: {
        name: 'ID'
        ,type: 'string'
        ,description: 'Unique identifier.'
        ,accessor: 'id'
      }
      ,name: {
        name: 'NAME'
        ,type: 'string'
        ,description: 'An explicit name for convenience.'
        ,accessor: 'name'
      }
      ,status: {
        name: 'STATUS'
        ,type: 'string'
        ,description: 'IN / OUT / UNDECIDED / DISCOVERED'
        ,accessor: 'status'
      }
      ,prefixes: {
        name: 'PREFIXES AS URL'
        ,type: 'array of string'
        ,description: 'List of URLs defining the boundaries of the web entity.'
        ,accessor: 'prefixes'
        ,preprocess: function(d){
          return (d || []).map(utils.LRU_to_URL)
        }
      }
      ,prefixes_lru: {
        name: 'PREFIXES AS LRU'
        ,type: 'array of string'
        ,description: 'List of LRUs (native format) defining the boundaries of the web entity.'
        ,accessor: 'prefixes'
      }
      ,home_page: {
        name: 'HOME PAGE'
        ,type: 'string'
        ,description: 'A URL used as hyperlink when you click on the web entity, for convenience.'
        ,accessor: 'homepage'
      }
      ,start_pages: {
        name: 'START PAGES'
        ,type: 'array of string'
        ,description: 'The list of start pages used the last time it was crawled.'
        ,accessor: 'startpages'
      }
      ,crawled: {
        name: 'CRAWLED'
        ,type: 'string'
        ,description: 'Is it crawled? (true/false)'
        ,accessor: 'crawled'
      }
      ,crawling_status: {
        name: 'CRAWLING STATUS'
        ,type: 'string'
        ,description: 'Harvesting status of this web entity\'s last crawl job.'
        ,accessor: 'crawling_status'
      }
      ,indexing_status: {
        name: 'INDEXING STATUS'
        ,type: 'string'
        ,description: 'Indexing status of this web entity\'s last crawl job.'
        ,accessor: 'indexing_status'
      }
      ,indegree: {
        name: 'INDEGREE'
        ,type: 'number'
        ,description: 'Number of other web entities citing it in the corpus'
        ,accessor: 'indegree'
      }
      ,outdegree: {
        name: 'OUTDEGREE'
        ,type: 'number'
        ,description: 'Number of other web entities cited by it in the corpus'
        ,accessor: 'outdegree'
      }
      ,undirected_degree: {
        name: 'NEIGHBOORS COUNT'
        ,type: 'number'
        ,description: 'Number of other web entities cited by it or citing it in the corpus'
        ,accessor: 'undirected_degree'
      }
      ,pages_total: {
        name: 'TOTAL KNOWN PAGES'
        ,type: 'number'
        ,description: 'Number of web pages of this web entity visited or linked by other ones'
        ,accessor: 'pages_total'
      }
      ,pages_crawled: {
        name: 'CRAWLED PAGES'
        ,type: 'number'
        ,description: 'Number of web pages of this web entity visited when crawling the entity'
        ,accessor: 'pages_crawled'
      }
      ,creation_date_timestamp: {
        name: 'CREATION TIMESTAMP'
        ,type: 'number'
        ,description: 'When it was created, as a Unix timestamp.'
        ,accessor: 'creation_date'
      }
      ,creation_date: {
        name: 'CREATION DATE'
        ,type: 'string'
        ,description: 'When it was created, as a text date.'
        ,accessor: 'creation_date'
        ,preprocess: function(d){
          return (new Date(+d)).toISOString()
        }
      }
      ,last_modification_date_timestamp: {
        name: 'LAST MODIFICATION TIMESTAMP'
        ,type: 'number'
        ,description: 'Last time its metadata were modified, as a Unix timestamp.'
        ,accessor: 'last_modification_date'
      }
      ,last_modification_date: {
        name: 'LAST MODIFICATION DATE'
        ,type: 'string'
        ,description: 'Last time its metadata were modified, as a text date.'
        ,accessor: 'last_modification_date'
        ,preprocess: function(d){
          return (new Date(+d)).toISOString()
        }
      }
      ,user_tags: {
        name: 'TAGS'
        ,type: 'json'
        ,description: 'Tags manually added by users.'
        ,accessor: 'tags'
        ,preprocess: function(d){
          return d.USER
        }
      }
      ,core_tags: {
        name: 'TECHNICAL INFO'
        ,type: 'json'
        ,description: 'Tags added by Hyphe for various technical reasons. Can be used as a log.'
        ,accessor: 'tags'
        ,preprocess: function(d){
          return d.CORE
        }
      }
    }

    $scope.data = {
      in: {
        loading: false,
        loaded: false,
        token: undefined,
        page: 0,
        total: 0,
        retry: 0,
        webentities: []
      },
      out: {
        loading: false,
        loaded: false,
        token: undefined,
        page: 0,
        total: 0,
        retry: 0,
        webentities: []
      },
      undecided: {
        loading: false,
        loaded: false,
        token: undefined,
        page: 0,
        total: 0,
        retry: 0,
        webentities: []
      },
      discovered: {
        loading: false,
        loaded: false,
        token: undefined,
        page: 0,
        total: 0,
        retry: 0,
        webentities: []
      }
    }
    var pageSize = 100
    
    $scope.statuses = {in:true, out:false, undecided:false, discovered:false}
    $scope.counts = {}
    
    $scope.fileFormat = 'CSV'
    $scope.projectName = $scope.corpusName
    $scope.backupCorpus = true

    $scope.loading = true // loading tlds

    $scope.download = function(){
      checkLoadAndUpdate()
    }

    // Init
    api.downloadCorpusTLDs(function(){
      loadStatus()
      $scope.loading = false
    })

    // Functions
    function loadStatus(){
      api.globalStatus({}, function(status){
        $scope.counts = {
          in: status.corpus.traph.webentities.IN
        , undecided: status.corpus.traph.webentities.UNDECIDED
        , out: status.corpus.traph.webentities.OUT
        , discovered: status.corpus.traph.webentities.DISCOVERED
        }
      },function(data, status, headers, config){
        $scope.status = {message: 'Error loading status', background:'danger'}
      })
    }

    function checkLoadAndUpdate(thisToken) {
      
      // Check if some web entities require loading
      var someWebentitiesRequireLoading = ['in', 'out', 'undecided', 'discovered'].some(function(status){
        if ($scope.statuses[status] && !$scope.data[status].loaded) {

          // Web entities of a given status require loading
          $scope.loading = true
          if ($scope.data[status].loading && $scope.data[status].token) {
            // Retrieve from query token
            $scope.status = {message:'Loading '+status.toUpperCase()+' web entities', progress: Math.round(100 * $scope.data[status].webentities.length/$scope.data[status].total)}
            api.getResultsPage(
              {
                token: $scope.data[status].token
                ,page: ++$scope.data[status].page
              }
              ,function(result){
                // Stop if this function was called in the meanwhile
                if ($scope.checkLoadAndUpdateCurrentToken != thisToken) { return }
                
                $scope.data[status].webentities = $scope.data[status].webentities.concat(result.webentities)
                if ($scope.data[status].webentities.length >= $scope.data[status].total) {
                  $scope.data[status].loading = false
                  $scope.data[status].loaded = true
                  $scope.status = {}
                }
                checkLoadAndUpdate(thisToken)
              }
              ,function(data, status, headers, config){
                // Stop if this function was called in the meanwhile
                if ($scope.checkLoadAndUpdateCurrentToken != thisToken) { return }

                if ($scope.data[status].retry++ < 3){
                  console.warn('Error loading results page: Retry', $scope.data[status].retry)
                  checkLoadAndUpdate(thisToken)
                } else {
                  console.log('Error loading results page:', data, status, headers, config)
                  $scope.status = {message: 'Error loading results page', background: 'danger'}
                }
              }
            )
          } else {
            // Initial query
            $scope.status = {message:'Loading '+status.toUpperCase()+' web entities'}
            $scope.data[status].loading = true
            $scope.data[status].loaded = false
            $scope.data[status].token = undefined
            $scope.data[status].page = 0
            $scope.data[status].retry = 0
            api.getWebentities_byStatus(
              {
                status: status.toUpperCase()
                ,count: pageSize
                ,page: 0
              }
              ,function(result){
                // Stop if this function was called in the meanwhile
                if ($scope.checkLoadAndUpdateCurrentToken != thisToken) { return }
      
                $scope.data[status].total = result.total_results
                $scope.data[status].token = result.token

                $scope.data[status].webentities = $scope.data[status].webentities.concat(result.webentities)
                if ($scope.data[status].webentities.length >= $scope.data[status].total) {
                  $scope.data[status].loading = false
                  $scope.data[status].loaded = true
                  $scope.status = {}
                }
                checkLoadAndUpdate(thisToken)
              }
              ,function(data, status, headers, config){
                // Stop if this function was called in the meanwhile
                if ($scope.checkLoadAndUpdateCurrentToken != thisToken) { return }
                
                if ($scope.data[status].retry++ < 3){
                  console.warn('Error loading web entities: Retry', $scope.data[status].retry)
                  checkLoadAndUpdate(thisToken)
                } else {
                  $scope.status = {message: 'Error loading web entities', background: 'danger'}
                }
              }
            )
          }
          return true
        } else return false
      })
      if (someWebentitiesRequireLoading) { return }

      // Update
      $scope.status = {message: 'Building network'}
      finalize()
      $scope.loading = false
      $scope.status = {}
    }

    function finalize(){
      console.log('Finalize', $scope.data)
      if($scope.backupCorpus){
        $scope.backupCorpus = false
        api.backupCorpus({
          id: $scope.corpusId
        }, function(){
        }, function(){
          $scope.status = {message: 'Error during backup of '+ id, background:'danger'}
        })
      }

      // Gather necessary webentities
      var webentities = []
      if ($scope.statuses.in) {
        webentities = webentities.concat($scope.data.in.webentities || [])
      }
      if ($scope.statuses.out) {
        webentities = webentities.concat($scope.data.out.webentities || [])
      }
      if ($scope.statuses.undecided) {
        webentities = webentities.concat($scope.data.undecided.webentities || [])
      }
      if ($scope.statuses.discovered) {
        webentities = webentities.concat($scope.data.discovered.webentities || [])
      }

      // Fields
      var fields = ($scope.dataVolume == 'compact') ? ($scope.compactFields) : (Object.keys($scope.fields))

      if($scope.fileFormat == 'JSON'){
          
        var json = {
          exportTimestamp: +(new Date().getTime())
          ,webentities: webentities.map(function(we){
              var result = {}
              fields.forEach(function(f){
                var field = $scope.fields[f]
                if (field === undefined) {
                  console.error('[Export error] Unexpected field id: '+f)
                  return
                }
                var value = we[field.accessor]
                if (field.preprocess) {
                  value = field.preprocess(value)
                }

                var tv
                if(value === undefined){
                  tv = ''
                } else {
                  tv = utils.translateValue(value, field.type, 'JSON')
                }
                if(tv === undefined){
                  console.error('A value could not be translated',value,we,field)
                } else {
                  result[field.name] = tv
                }

              })
              return result
            })
        }

        var blob = new Blob([JSON.stringify(json)], {type: "application/json;charset=utf-8"})
        saveAs(blob, $scope.projectName + ".json", true)

        return true

      } else if($scope.fileFormat == 'TEXT'){
        
        var fileContent = []

        // Title
        fileContent.push($scope.projectName + '\n' + $scope.projectName.replace(/./gi,'=') + '\nExported ' + (new Date()).toISOString() + '\n\n' )

        webentities.forEach(function(we){
          var content = '\n\n\n\n' + we.name + '\n' + we.name.replace(/./gi, '-')
          fields.forEach(function(f){
            var field = $scope.fields[f]
            if (field === undefined) {
              console.error('[Export error] Unexpected field id: '+f)
              return
            }
            var value = we[field.accessor]
            if (field.preprocess) {
              value = field.preprocess(value)
            }

            var tv
            if(value === undefined){
              tv = ''
            } else {
              tv = utils.translateValue(value, field.type, 'MD')
            }
            if(tv === undefined){
              console.error('A value could not be transferred',value,we,field)
            } else {
              content += '\n\n#### ' + field.name + '\n' + tv
            }
          })
          fileContent.push(content)
        })

        var blob = new Blob(fileContent, {type: "text/x-markdown; charset=UTF-8"})
        saveAs(blob, $scope.projectName + " MarkDown.txt", true)

        return true

      } else if($scope.fileFormat == 'CSV' || $scope.fileFormat == 'SCSV' || $scope.fileFormat == 'TSV'){

        // Build Headline
        var headline = [], csvKeys = []
        fields.forEach(function(f){
          var field = $scope.fields[f]
          
          if (field.type === 'json'){
            
            webentities.forEach(function(we){
              var value = we[field.accessor]
              if (field.preprocess) {
                value = field.preprocess(value)
              }

              Object.keys(value || {}).forEach(function(k){
                if (!~headline.indexOf(k + ' (' + field.name + ')')){
                  headline.push(k + ' (' + field.name + ')')
                  csvKeys.push({'field': field, 'key': k})
                }
              })
            })

          } else {
            headline.push(field.name)
            csvKeys.push({'field': field})
          }

        })

        // Build Table Content
        var tableContent = []
        webentities.forEach(function(we){
          var row = []

          csvKeys.forEach(function(csvKey){
            var field = csvKey.field
            var valType = field.type
            var value = we[field.accessor]
            if (field.preprocess) {
              value = field.preprocess(value)
            }

            if (csvKey.key) {
              value = (value || {})[csvKey.key]
              valType = 'array of string with pipe'
            }
            var tv
            if(value === undefined){
              tv = ''
            } else {
              tv = utils.translateValue(value, valType)
            }
            if(tv === undefined){
              console.error('A value could not be translated',value,we,field)
            }
            row.push(tv)
          })

          tableContent.push(row)
        })


        // Parsing
        var fileContent = []
        ,csvElement = function(txt){
          txt = ''+txt //cast
          return '"'+txt.replace(/"/gi, '""')+'"'
        }

        if($scope.fileFormat == 'CSV'){

          fileContent.push(
            headline.map(csvElement).join(',')
          )
          tableContent.forEach(function(row){
            fileContent.push('\n' + row.map(csvElement).join(','))
          })

          var blob = new Blob(fileContent, {'type': "text/csv;charset=utf-8"});
          saveAs(blob, $scope.projectName + ".csv", true);

        } else if($scope.fileFormat == 'SCSV'){

          fileContent.push(
            headline.map(csvElement).join(';')
          )
          tableContent.forEach(function(row){
            fileContent.push('\n' + row.map(csvElement).join(';'))
          })

          var blob = new Blob(fileContent, {type: "text/csv;charset=utf-8"});
          saveAs(blob, $scope.projectName + " SEMICOLON.csv");

        } else if($scope.fileFormat == 'TSV'){

          fileContent.push(
            headline.map(csvElement).join('\t')
          )
          tableContent.forEach(function(row){
            fileContent.push('\n' + row.map(csvElement).join('\t'))
          })

          var blob = new Blob(fileContent, {type: "text/tsv;charset=utf-8"});
          saveAs(blob, $scope.projectName + ".tsv");

        }

        return true
      }

    }

  }])
