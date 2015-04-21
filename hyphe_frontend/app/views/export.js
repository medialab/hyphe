'use strict';

angular.module('hyphe.exportController', [])

  .controller('export', ['$scope', 'api', 'utils', 'corpus'
  ,function($scope, api, utils, corpus) {
    $scope.currentPage = 'export'
    $scope.corpusName = corpus.getName()
    $scope.corpusId = corpus.getId()

    var queryBatchSize = 1000

    $scope.projectName = $scope.corpusName

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
        ,accessor: 'startpages'
        ,type: 'array of string'
        ,val: false
      }
      ,status: {
        name: 'STATUS'
        ,accessor: 'status'
        ,type: 'string'
        ,val: true
      }
      ,indegree: {
        name: 'INDEGREE'
        ,accessor: 'indegree'
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
        ,type: 'date'
        ,val: false
      }
      ,last_modification_date: {
        name: 'LAST MODIFICATION DATE'
        ,accessor: 'last_modification_date'
        ,type: 'date'
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
        ,type: 'json'
        ,val: false
      }
    }
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

    // Functions

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
        finalize()
      }
    }

    function finalize(){
      $scope.status = {message:'Processing...'}
      console.log('Finalize',$scope.resultsList)

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

        $scope.working = false
        $scope.status = {message: "File downloaded", background:'success'}

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

        $scope.working = false
        $scope.status = {message: "File downloaded", background:'success'}

      } else if($scope.fileFormat == 'CSV' || $scope.fileFormat == 'SCSV' || $scope.fileFormat == 'TSV'){

        // Build Headline
        var headline = []
        for(var colKey in $scope.columns){
          var colObj = $scope.columns[colKey]
          if(colObj.val){
            headline.push(colObj.name)
          }
        }

        // Build Table Content
        var tableContent = []
        $scope.resultsList.forEach(function(we){
          var row = []

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
                tv = translateValue(value, colObj.type)
              }
              if(tv === undefined){
                console.log(value,we,colObj,'could not be transferred')
              }
              row.push(tv)
            }
          }

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

          var blob = new Blob(fileContent, {type: "text/csv;charset=utf-8"});
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

        $scope.working = false
        $scope.status = {message: "File downloaded", background:'success'}
      }

    }

    function translateValue(value, type, mode){
      
      mode = mode || 'TEXT'

      var array_separator = ' '

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
            return value
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
            return value
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
