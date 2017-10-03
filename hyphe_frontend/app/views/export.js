'use strict';

angular.module('hyphe.exportController', [])

  .controller('export', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'export'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    $scope.dataVolume = 'compact'
    $scope.compactFields = ['id', 'name', 'prefixes', 'indegree', 'status', 'last_modification_date', 'user_tags']
    $scope.fields = {
      id: {
        name: 'ID'
        ,accessor: 'id'
        ,type: 'string'
        ,description: 'Unique identifier.'
      }
      ,name: {
        name: 'NAME'
        ,accessor: 'name'
        ,type: 'string'
        ,description: 'An explicit name for convenience.'
      }
      ,prefixes: {
        name: 'PREFIXES'
        ,accessor: 'prefixes'
        ,type: 'array of lru'
        ,description: 'List of LRUs defining the boundaries of the web entity.'
      }
      ,prefixes_lru: {
        name: 'PREFIXES AS LRU'
        ,accessor: 'prefixes'
        ,type: 'array of string'
        ,description: 'List of LRUs defining the boundaries of the web entity.'
      }
      ,home_page: {
        name: 'HOME PAGE'
        ,accessor: 'homepage'
        ,type: 'string'
        ,description: 'A URL used as hyperlink when you click on the web entity, for convenience.'
      }
      ,start_pages: {
        name: 'START PAGES'
        ,accessor: 'startpages'
        ,type: 'array of string'
        ,description: 'The list of start pages used the last time it was crawled.'
      }
      ,status: {
        name: 'STATUS'
        ,accessor: 'status'
        ,type: 'string'
        ,description: 'IN / OUT / UNDECIDED / DISCOVERED'
      }
      ,indegree: {
        name: 'INDEGREE'
        ,accessor: 'indegree'
        ,type: 'number'
        ,description: 'Number of other web entities citing it in the corpus'
      }
      ,crawling_status: {
        name: 'CRAWLING STATUS'
        ,accessor: 'crawling_status'
        ,type: 'string'
        ,description: 'Harvesting status of this web entity\'s last crawl job.'
      }
      ,indexing_status: {
        name: 'INDEXING STATUS'
        ,accessor: 'indexing_status'
        ,type: 'string'
        ,description: 'Indexing status of this web entity\'s last crawl job.'
      }
      ,creation_date: {
        name: 'CREATION DATE'
        ,accessor: 'creation_date'
        ,type: 'date'
        ,description: 'When it was created.'
      }
      ,last_modification_date: {
        name: 'LAST MODIFICATION DATE'
        ,accessor: 'last_modification_date'
        ,type: 'date'
        ,description: 'Last time its metadata were modified.'
      }
      ,creation_date_timestamp: {
        name: 'CREATION DATE AS TIMESTAMP'
        ,accessor: 'creation_date'
        ,type: 'string'
        ,description: 'When it was created.'
      }
      ,last_modification_date_timestamp: {
        name: 'LAST MODIFICATION DATE AS TIMESTAMP'
        ,accessor: 'last_modification_date'
        ,type: 'string'
        ,description: 'Last time its metadata were modified.'
      }
      ,user_tags: {
        name: 'TAGS'
        ,accessor: 'tags.USER'
        ,type: 'json'
        ,description: 'Tags manually added by users.'
      }
      ,core_tags: {
        name: 'TECHNICAL INFO'
        ,accessor: 'tags.CORE'
        ,type: 'json'
        ,description: 'Tags added by Hyphe for various technical reasons. Can be used like a log.'
      }
    }

    var queryBatchSize = 1000

    $scope.projectName = $scope.corpusName

    $scope.list

    $scope.statuses = {in:true, out:false, undecided:false, discovered:false}
    $scope.counts = {}
    
    $scope.fileFormat = 'CSV'

    $scope.working = false
    $scope.statusPending = []
    $scope.resultsList = []

    $scope.download = function(){
      $scope.working = true
      $scope.resultsList = []
      $scope.queriesToDo = {'in':{total:undefined,stack:[]}, 'out':{total:undefined,stack:[]}, 'undecided':{total:undefined,stack:[]}, 'discovered':{total:undefined,stack:[]}}
      
      if($scope.statuses.in){
        $scope.queriesToDo.in.stack.push(0)
      } else {
        $scope.queriesToDo.in.total = 0
      }
      if($scope.statuses.out){
        $scope.queriesToDo.out.stack.push(0)
      } else {
        $scope.queriesToDo.out.total = 0
      }
      if($scope.statuses.undecided){
        $scope.queriesToDo.undecided.stack.push(0)
      } else {
        $scope.queriesToDo.undecided.total = 0
      }
      if($scope.statuses.discovered){
        $scope.queriesToDo.discovered.stack.push(0)
      } else {
        $scope.queriesToDo.discovered.total = 0
      }

      loadWebentities()
    }

    $scope.applyPreset = function(p){
      for(var k in $scope.statuses){
        $scope.statuses[k] = $scope.presets[p].statuses[k]
      }
      for(var c in $scope.columns){
        $scope.columns[c].val = $scope.presets[p].columns[c]
      }
    }

    // Init
    loadStatus()

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

    function loadWebentities(){
      if($scope.queriesToDo.in.stack.length + $scope.queriesToDo.out.stack.length + $scope.queriesToDo.undecided.stack.length + $scope.queriesToDo.discovered.stack.length>0){
        
        var totalQueries = 0  // We do an estimation when we don't know
        totalQueries += $scope.queriesToDo.in.total || 10
        totalQueries += $scope.queriesToDo.out.total || 10
        totalQueries += $scope.queriesToDo.undecided.total || 10
        totalQueries += $scope.queriesToDo.discovered.total || 100
        
        var doneQueries = 0
        if($scope.queriesToDo.in.stack.length > 0)
          doneQueries += $scope.queriesToDo.in.stack[0]
        if($scope.queriesToDo.out.stack.length > 0)
          doneQueries += $scope.queriesToDo.out.stack[0]
        if($scope.queriesToDo.undecided.stack.length > 0)
          doneQueries += $scope.queriesToDo.undecided.stack[0]
        if($scope.queriesToDo.discovered.stack.length > 0)
          doneQueries += $scope.queriesToDo.discovered.stack[0]
        
        var percent = Math.floor(100 * doneQueries / totalQueries)
        ,msg = percent + '% loaded'
        $scope.status = {message: msg, progress:percent}

        /*console.log(percent + '%' + '\nSummary: ' + doneQueries + ' / ' + totalQueries
          + '\nIN:', $scope.queriesToDo.in.stack.join(' ') + ' / ' + $scope.queriesToDo.in.total
          + '\nOUT:', $scope.queriesToDo.out.stack.join(' ') + ' / ' + $scope.queriesToDo.out.total
          + '\nUNDECIDED:', $scope.queriesToDo.undecided.stack.join(' ') + ' / ' + $scope.queriesToDo.undecided.total
          + '\nDISCOVERED:', $scope.queriesToDo.discovered.stack.join(' ') + ' / ' + $scope.queriesToDo.discovered.total
        )*/

        var status
        ,page
        if($scope.queriesToDo.in.stack.length > 0){
          status = 'IN'
          page = $scope.queriesToDo.in.stack.shift()
        } else if($scope.queriesToDo.out.stack.length > 0){
          status = 'OUT'
          page = $scope.queriesToDo.out.stack.shift()
        } else if($scope.queriesToDo.undecided.stack.length > 0){
          status = 'UNDECIDED'
          page = $scope.queriesToDo.undecided.stack.shift()
        } else if($scope.queriesToDo.discovered.stack.length > 0){
          status = 'DISCOVERED'
          page = $scope.queriesToDo.discovered.stack.shift()
        }
        

        api.getWebentities_byStatus({
            status:status
            ,count:queryBatchSize
            ,page:page
          }
          ,function(result){
            
            // update queries totals
            var queriesTotal = 1 + Math.floor(result.total_results/queryBatchSize)
            $scope.queriesToDo[status.toLowerCase()].total = queriesTotal
            $scope.queriesToDo[status.toLowerCase()].stack = []
            for(var p = page+1; p<queriesTotal; p++){
              $scope.queriesToDo[status.toLowerCase()].stack.push(p)
            }

            $scope.resultsList = $scope.resultsList.concat(result.webentities)
            
            loadWebentities()
          }
          ,function(data, status, headers, config){
            $scope.status = {message: 'Loading error', background:'danger'}
          }
        )

      } else {
        // Finalize
        // NB: these setTimeout turn around a buggy interaction between saveAs and recent Firefox
        $scope.status = {message:'Processing...'}
        
        setTimeout(function(){
          var success = finalize()
          if(success){

            setTimeout(function(){
              $scope.working = false
              $scope.status = {message: "File downloaded", background:'success'}          
            }, 10)

          }
          
        }, 10)
      }
    }

    function finalize(){
      console.log('Finalize',$scope.resultsList)

      if(!$scope.backed_up){
        api.backupCorpus({
          id: $scope.corpusId
        }, function(){
          $scope.backed_up = true
        }, function(){})
      }

      if($scope.fileFormat == 'JSON'){
          
        var json = {
          exportTimestamp: +(new Date().getTime())
          ,webentities: $scope.resultsList.map(function(we){
              var result = {}
              for(var colKey in $scope.columns){
                var colObj = $scope.columns[colKey]
                if(colObj.val){
                  var value = we
                  colObj.accessor.split('.').forEach(function(accessor){
                    value = value[accessor]
                  })
                  var tv
                  if(value === undefined){
                    tv = ''
                  } else {
                    tv = translateValue(value, colObj.type, 'JSON')
                  }
                  if(tv === undefined){
                    console.log(value,we,colObj,'could not be transferred')
                  } else {
                    result[colObj.name] = tv
                  }
                }
              }
              return result
            })

        }

        var blob = new Blob([JSON.stringify(json)], {type: "application/json;charset=utf-8"})
        saveAs(blob, $scope.projectName + ".json")

        return true

      } else if($scope.fileFormat == 'TEXT'){
        
        var fileContent = []

        // Title
        fileContent.push($scope.projectName + '\n' + $scope.projectName.replace(/./gi,'=') + '\nExported ' + (new Date()).toLocaleString() + '\n\n' )

        $scope.resultsList.forEach(function(we){
          var content = '\n\n\n\n' + we.name + '\n' + we.name.replace(/./gi, '-')
          for(var colKey in $scope.columns){
            var colObj = $scope.columns[colKey]
            if(colObj.val){

              var value = we
              colObj.accessor.split('.').forEach(function(accessor){
                value = value[accessor]
              })

              var tv
              if(value === undefined){
                tv = ''
              } else {
                tv = translateValue(value, colObj.type, 'MD')
              }
              if(tv === undefined){
                console.log(value,we,colObj,'could not be transferred')
              } else {
                content += '\n\n#### ' + colObj.name + '\n' + tv
              }
            }
          }
          fileContent.push(content)
        })

        var blob = new Blob(fileContent, {type: "text/x-markdown; charset=UTF-8"})
        saveAs(blob, $scope.projectName + " MarkDown.txt")

        return true

      } else if($scope.fileFormat == 'CSV' || $scope.fileFormat == 'SCSV' || $scope.fileFormat == 'TSV'){

        // Build Headline
        var headline = [], csvKeys = []
        for(var colKey in $scope.columns){
          var colObj = $scope.columns[colKey]
          if(colObj.val){
            if (colObj.type === 'json'){
              $scope.resultsList.forEach(function(we){
                var value = we
                colObj.accessor.split('.').forEach(function(accessor){
                  value = value[accessor]
                })
                Object.keys(value || {}).forEach(function(k){
                  if (!~headline.indexOf(k + ' (' + colObj.name + ')')){
                    headline.push(k + ' (' + colObj.name + ')')
                    csvKeys.push({'col': colObj, 'key': k})
                  }
                })
              })
            } else {
              headline.push(colObj.name)
              csvKeys.push({'col': colObj})
            }
          }
        }

        // Build Table Content
        var tableContent = []
        $scope.resultsList.forEach(function(we){
          var row = []

          csvKeys.forEach(function(csvKey){
            var colObj = csvKey.col
               ,value = we
               ,valType = colObj.type
            colObj.accessor.split('.').forEach(function(accessor){
              value = value[accessor]
            })
            if (csvKey.key) {
              value = (value || {})[csvKey.key]
              valType = 'array of string with pipe'
            }
            var tv
            if(value === undefined){
              tv = ''
            } else {
              tv = translateValue(value, valType)
            }
            if(tv === undefined){
              console.log(value,we,colObj,'could not be transferred')
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
          saveAs(blob, $scope.projectName + ".csv");

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

    function translateValue(value, type, mode){
      
      mode = mode || 'TEXT'

      var array_separator = ' '
      if (type === 'array of string with pipe'){
        array_separator = '|'
        type = 'array of string'
      }

      if(type == 'string'){
        return value
      
      } else if(type == 'date'){
        return (new Date(+value*1000)).toLocaleString()
      
      } else if(type == 'array of string'){

        if(value instanceof Array){
          if(mode == 'JSON'){
            return value
          } else if(mode == 'MD'){
            return value
              .map(function(d){
                return '* ' + d
              })
              .join('\n')
          } else {
            return value.sort()
              .join(array_separator)
          }
        } else {
          console.log(value,'is not an array')
        }

      } else if(type == 'array of lru'){

        if(value instanceof Array){
          if(mode == 'JSON'){
            return value
              .map(utils.LRU_to_URL)
          } else if(mode == 'MD'){
            return value
              .map(utils.LRU_to_URL)
              .map(function(d){
                return '* ' + d
              })
              .join('\n')
          } else {
            return value.sort()
              .map(utils.LRU_to_URL)
              .join(array_separator)
          }
        } else {
          console.log(value,'is not an array')
        }

      } else if(type == 'json'){

        if(mode == 'JSON'){
          return value
        } else if(mode == 'MD'){
          return '```sh\n' + JSON.stringify(value) + '\n```'
        } else {
          return JSON.stringify(value)
        }

      }
    }
  }])
