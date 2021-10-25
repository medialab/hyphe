'use strict';

angular.module('hyphe.service_utils', [])
  
  /*
  NB: If you have the use of utils in console, use this line:
  utils = angular.element(document.body).injector().get('utils')
  */

  .factory('utils', ['api', '$routeParams', 'autocompletion', function(api, $routeParams, autocompletion){
    var ns = {} // Namespace

    ns.readWebentityIdFromRoute = function(){
      return +$routeParams.webentityId;
    }

    ns.url_regex = /^((https?|ftp|file|mailto):\/\/)?(www\.)?[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}/
    var specialhosts_regex_str = 'localhost|(\\d{1,3}\\.){3}\\d{1,3}|\\[[\\da-f]*:[\\da-f:]*\\]'
    ns.specialhosts_regex = new RegExp(specialhosts_regex_str, 'i')
    ns.specialhosts_url_regex = new RegExp('://[^/]*' + specialhosts_regex_str + '(?::\\d+)?(?:/\\S*)?', 'i')
 
    ns.reEncode = function(uri){
      try {
        return encodeURI(decodeURI(uri))
      } catch(e) {
        console.log("ERROR reEncoding url", uri)
        return uri
      }
    }

    ns.reEncodeComponent = function(uri){
      try {
        return encodeURIComponent(decodeURIComponent(uri))
      } catch(e) {
        console.log("ERROR reEncoding url components", uri)
        return uri
      }
    }

    ns.LRU_reEncode = function(lru){
      var json_lru = ns.LRU_to_JSON_LRU(lru)
      if(json_lru["path"])
        json_lru["path"] = json_lru["path"].map(function(p){
          return p = ns.reEncodeComponent(p)
        })
      if(json_lru["fragment"])
        json_lru["fragment"] = ns.reEncodeComponent(json_lru["fragment"])
      return ns.JSON_LRU_to_LRU(json_lru)
    }

    ns.URL_reEncode = function(url){
      return ns.LRU_to_URL(ns.LRU_reEncode(ns.URL_to_LRU(url)))
    }

    ns.URL_to_LRU = function(url){
      var json_lru = ns.URL_to_JSON_LRU(url)
      if(json_lru === undefined)
        return ''
      return ns.JSON_LRU_to_LRU(json_lru)
    }

    ns.JSON_LRU_to_LRU = function(json_lru){
      var lru = "s:" + json_lru.scheme + "|"
      if(json_lru.port && json_lru.port !== "80")
        lru += "t:" + json_lru.port + "|"
      if(json_lru.tld)
        lru += "h:" + json_lru.tld + "|"
      json_lru.host.forEach(function(h){lru += "h:" + h + "|";})
      json_lru["path"].forEach(function(p){lru += "p:" + p + "|";})
      if(json_lru.query)
        lru += "q:" + json_lru.query + "|"
      if(json_lru.fragment)
        lru += "f:" + json_lru.fragment + "|"
      return lru
    }

    var _get_TLD_from_host_array = function(host, tldtree, tld){
      tld = tld || ""
      var chunk = host.pop()
      if (tldtree["!" + chunk])
        return tld
      if (tldtree["*"] || tldtree[chunk])
        tld = tld ? chunk + "." + tld : chunk
      if (tldtree[chunk])
        return _get_TLD_from_host_array(host, tldtree[chunk], tld)
      return tld
    }

    ns.get_TLD_from_host_array = function(host, tldtree){
      return _get_TLD_from_host_array(host.slice(), tldtree)
    }

    ns.URL_to_JSON_LRU = function(URL){
      var LRU,
      regex = /^([^:\/?#]+):(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/
      
      if (URL.match(regex)) { 
        var scheme = RegExp.$1
          , authority = RegExp.$2
          , path = RegExp.$3
          , query = RegExp.$4
          , fragment = RegExp.$5
          , tld = ""
        if (authority.match(/^(?:([^:]+)(?::([^@]+))?\@)?(\[[\da-f]*:[\da-f:]*\]|[^\s:]+)(?::(\d+))?$/i)) {
          var user = RegExp.$1
            , password = RegExp.$2
            , host = RegExp.$3
            , port = RegExp.$4
          
          if (ns.specialhosts_regex.test(host))
            host = [host.toLowerCase()]
          else {
            host = host.toLowerCase().split(/\./)
            var tlds = ns.getTLDTree()
            if (tlds) {
              tld = ns.get_TLD_from_host_array(host, tlds)
              if (tld) {
                for (var i=0; i < tld.split(/\./).length; i++)
                  host.pop()
              }
            }
          }
          
          LRU = {
            "scheme": scheme.toLowerCase(),
            "host": host.reverse(),
            "tld": tld,
            "path": path.split(/\//).filter(function(pathToken, i){return i>0}),   
          }
          if(port && port != "80")
            LRU.port = port
          if(query)
            LRU.query = query
          if(fragment)
            LRU.fragment = fragment
        }
      }
      return LRU;
    }

    ns.LRU_to_URL = function(lru){
      return ns.JSON_LRU_to_URL(ns.LRU_to_JSON_LRU(lru)); 
    }

    ns.LRU_to_JSON_LRU = function(lru){
      var lru_array = lru.replace(/\|$/, '').split("|"),
      json_lru = {host:[], path:[]}
      lru_array.forEach(function(stem){
        var type = stem.substr(0, 1)
        name = stem.substr(2, stem.length - 2)
        if(type=="s"){
          json_lru.scheme = name.toLowerCase()
        } else if(type=="t" && name !== '80'){
          json_lru.port = name
        } else if(type=="h"){
          name.toLowerCase().split('.').reverse().forEach(function(h){
            json_lru.host.push(h)
          })
        } else if(type=="p"){
          json_lru.path.push(name)
        } else if(type=="q"){
          json_lru.query = name
        } else if(type=="f"){
          json_lru.fragment = name
        }
      })
      var tlds = ns.getTLDTree()
      if (tlds) {
        json_lru.tld = ns.get_TLD_from_host_array(json_lru.host.slice().reverse(), tlds)
        if (json_lru.tld) {
          for (var i=0; i < json_lru.tld.split(/\./).length; i++)
            json_lru.host.shift()
        }
      }
      return json_lru
    }

    ns.JSON_LRU_to_URL = function(json_lru){
      var scheme    = "",
      hosts   = "",
      port    = "",
      path    = "",
      query   = "",
      fragment  = ""
      
      if(json_lru.scheme != undefined && json_lru.scheme.length>0)
        scheme = json_lru.scheme+"://"
      else
        scheme = "http://"
      
      if(json_lru.host != undefined && json_lru.host.length>0){
        json_lru.host.forEach(function(h){
          hosts = "."+h+hosts
        })
        hosts = hosts.substr(1, hosts.length)
      }

      if(json_lru.tld)
        hosts += "."+json_lru.tld
      
      if(json_lru.path != undefined && json_lru.path.length>0)
        json_lru.path.forEach(function(p){
          path = path+"/"+p
        })
      
      if(json_lru.query != undefined && json_lru.query.length>0)
        query = "?"+json_lru.query
      
      if(json_lru.fragment != undefined && json_lru.fragment.length>0)
        fragment = "#"+json_lru.fragment
      
      if(json_lru.port != undefined && json_lru.port!="80")
        port = ":"+json_lru.port

      return scheme+hosts+port+path+query+fragment
    }

    ns.URL_to_pretty_LRU = function(url){
      if(ns.URL_validate(url))
        return ns.JSON_LRU_to_pretty_LRU(ns.URL_to_JSON_LRU(url))
      return []
    }

    ns.LRU_to_pretty_LRU = function(lru){
      var url = ns.LRU_to_URL(lru)
      return ns.URL_to_pretty_LRU(url)
    }

    ns.JSON_LRU_to_pretty_LRU = function(json_lru){
      
      if(json_lru === undefined || !json_lru.scheme)
        return []

      var pretty_lru = []

      pretty_lru.push(json_lru.scheme)
      if (json_lru.port && json_lru.port !== "80")
        pretty_lru.push(':'+explicit(json_lru.port))
      if(json_lru.tld)
        pretty_lru.push("."+explicit(json_lru.tld))
      json_lru.host.forEach(function(stem, i){
        pretty_lru.push(explicit(stem) + (i ? '.' : ''))
      })
      json_lru.path.forEach(function(stem){
        pretty_lru.push('/'+explicit(stem))
      })
      if(json_lru.query)
        pretty_lru.push('?'+json_lru.query)
      if(json_lru.fragment)
        pretty_lru.push('#'+json_lru.fragment)

      function explicit(stem){
        return stem.replace(/[\n\r]/gi, '<line break>')
          .replace(/^$/gi, '<empty>')
          .replace(/^ $/, '<space>')
          .replace(/(  +)/, ' <spaces> ')
      }

      return pretty_lru
    }

    ns.LRU_truncate = function(lru, length){
      return lru.split('|').slice(0, length).join('|') + '|'
    }

    ns.URL_remove_http = function(url) {
      return url.replace(/^http:\/\//, '')
    }

    ns.URL_fix = function(url){
      // Trim
      url = (''+url).trim()

      if(url == '')
        return ''

      // Add HTTP:// if needed
      var protocolSplit = url.split('://')
      if(protocolSplit.length == 1 || (protocolSplit.length > 1 && protocolSplit[0].length > 10)){
        url = 'http://'+url
      }
      
      // Strip the last slash if there are only three slashes in the URL
      if(url.match(/\//g).length == 3){
        url = url.replace(/\/$/, '')
      }

      return url
    }

    ns.URL_stripLastSlash = function(url){
      // Trim
      url = (''+url).trim()

      url = url.replace(/\/$/, '')

      return url
    }

    ns.LRU_prefix_fix = function(lru_prefix){
      var split = lru_prefix.replace(/\|$/, '').split('|')
      ,lastStem = split[split.length-1]
      ,lastStemSplit = lastStem.split(':')
      if(lastStemSplit.length>1 && lastStemSplit[1]=='')
        split.pop()
      return split.join('|') + '|'
    }

    ns.LRU_validate = function(lru){
      var lruregex = /^s:[^\|]+\|(h:[a-zA-Z0-9\-:\.[\]]+\|){2}/
      return lruregex.test(lru)
    }

    ns.URL_validate = function(url){
      return ns.url_regex.test(url) || ns.specialhosts_url_regex.test(url)
    }

    ns.LRU_getTLD = function(lru){
      var json_lru = ns.LRU_to_JSON_LRU(lru)
      return json_lru.tld
    }

    ns.LRU_variations = function(lru, settings){
      if(lru === undefined)
        return []
      var candidates = []
      ,tld_length = ns.LRU_getTLD(lru) != ""
      ,lru_a = lru.split('|')
      ,lru_json = ns.LRU_to_JSON_LRU(lru)
      ,settings = settings || {}
      
      // Settings content and defaults
      settings.wwwlessVariations  = settings.wwwlessVariations || false
      settings.wwwVariations      = settings.wwwVariations || false
      settings.httpVariations     = settings.httpVariations || false
      settings.httpsVariations    = settings.httpsVariations || false
      if(settings.smallerVariations === undefined){settings.smallerVariations = true}
    
      candidates.push(lru)
      if(lru_a.length > 2+tld_length && settings.smallerVariations){
        for(length = lru_a.length-1; length >= 2 + tld_length; length--){
          var candidate = lru_a.filter(function(stem, i){
            return i < length
          }).join('|') + '|'
          candidates.push(candidate)
        }
      }
      if(settings.wwwlessVariations && lru_json.tld && lru_json.host[lru_json.host.length - 1] == 'www'){
        var wwwlessVariation_json = extend(true, {}, lru_json)
        wwwlessVariation_json.host.pop()
        var wwwlessVariation = ns.JSON_LRU_to_LRU(wwwlessVariation_json)
        candidates = candidates.concat(ns.LRU_variations(wwwlessVariation, {
          wwwlessVariations: false
          ,wwwVariations: false
          ,httpVariations: settings.httpVariations
          ,httpsVariations: settings.httpsVariations
          ,smallerVariations: settings.smallerVariations
        }))
      }
      if(settings.wwwVariations && lru_json.tld && lru_json.host[lru_json.host.length - 1] != 'www'){
        var wwwVariation_json = extend(true, {}, lru_json)
        wwwVariation_json.host.push('www')
        var wwwVariation = ns.JSON_LRU_to_LRU(wwwVariation_json)
        candidates = candidates.concat(ns.LRU_variations(wwwVariation, {
          wwwlessVariations: false
          ,wwwVariations: false
          ,smallerVariations: settings.smallerVariations
          ,httpVariations: settings.httpVariations
          ,httpsVariations: settings.httpsVariations
        }))
      }
      if(settings.httpsVariations && lru_json.scheme == 'http'){
        var httpsVariation_json = extend(true, {}, lru_json)
        httpsVariation_json.scheme = 'https'
        var httpsVariation = ns.JSON_LRU_to_LRU(httpsVariation_json)
        candidates = candidates.concat(ns.LRU_variations(httpsVariation, {
          wwwlessVariations: settings.wwwlessVariations
          ,wwwVariations: settings.wwwVariations
          ,smallerVariations: settings.smallerVariations
          ,httpVariations: false
          ,httpsVariations: false
        }))
      
      }
      if(settings.httpVariations && lru_json.scheme == 'https'){
        var httpVariation_json = extend(true, {}, lru_json)
        httpVariation_json.scheme = 'http'
        var httpVariation = ns.JSON_LRU_to_LRU(httpVariation_json)
        candidates = candidates.concat(ns.LRU_variations(httpVariation, {
          wwwlessVariations: settings.wwwlessVariations
          ,wwwVariations: settings.wwwVariations
          ,smallerVariations: settings.smallerVariations
          ,httpVariations: false
          ,httpsVariations: false
        }))
      }

      // Pass in the objects to merge as arguments.
      // For a deep extend, set the first argument to `true`.
      function extend() {

        // Variables
        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        // Check if a deep merge
        if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
            deep = arguments[0];
            i++;
        }

        // Merge the object into the extended object
        var merge = function (obj) {
            for ( var prop in obj ) {
                if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
                    // If deep merge and property is an object, merge properties
                    if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
                        extended[prop] = extend( true, extended[prop], obj[prop] );
                    } else {
                        extended[prop] = obj[prop];
                    }
                }
            }
        };

        // Loop through each object and conduct a merge
        for ( ; i < length; i++ ) {
            var obj = arguments[i];
            merge(obj);
        }

        return extended;

      }

      return ns.extractCases(candidates).reverse()
    }

    ns.sort_URLs_as_LRUs = function(a, b){
      return ns.sort_JSON_LRUs(ns.URL_to_JSON_LRU(a), ns.URL_to_JSON_LRU(b))
    }

    ns.sort_LRUs = function(a, b){
      return ns.sort_JSON_LRUs(ns.LRU_to_JSON_LRU(a), ns.LRU_to_JSON_LRU(b))
    }

    ns.sort_JSON_LRUs = function(LRUa, LRUb){
      var hosta = LRUa.host.shift() || ""
        , hostb = LRUb.host.shift() || ""
      if (hosta !== hostb)
        return hosta.localeCompare(hostb)
      if (LRUa.tld !== LRUb.tld)
        return LRUa.tld.localeCompare(LRUb.tld)
      var suba = LRUa.host.join(".")
        , subb = LRUb.host.join(".")
      if (suba !== subb)
        return suba.localeCompare(subb)
      if (LRUa.port !== LRUb.port)
        return (LRUa.port || "").localeCompare(LRUb.port || "")
      var patha = (LRUa.path || []).join("/")
        , pathb = (LRUb.path || []).join("/")
      if (patha !== pathb)
        return patha.localeCompare(pathb)
      if (LRUa.query !== LRUb.query)
        return LRUa.query.localeCompare(LRUb.query)
      return LRUa.scheme.localeCompare(LRUb.scheme)
    }

    ns.nameLRU = function(lru){
      return ns.nameURL(ns.LRU_to_URL(lru))
    }

    ns.nameURL = function(url){
      var json_lru = ns.URL_to_JSON_LRU(ns.URL_stripLastSlash(url))
      if(json_lru === undefined)
        return '<Impossible to Name> ' + url
      var name = json_lru.host.map(function(d,i){
          if (i == 0 && json_lru.tld)
            return ns.toDomainCase(d)
          return d.replace(/\[]/g, '')
        })
        .reverse()
        .filter(function(d,i){return d != 'www' || i > 0})
        .join('.')
      if(json_lru.tld)
        name += "." + json_lru.tld
      if(json_lru.port && json_lru.port !== "80")
        name += ' :' + json_lru.port
      if(json_lru.path.length == 1 && json_lru.path[0].trim().length>0){
        name += ' /' + decodeURIComponent(json_lru.path[0])
      } else if(json_lru.path.length > 1) {
        name += ' /.../' + decodeURIComponent(json_lru.path[json_lru.path.length-1])
      }
      if(json_lru.query && json_lru.query.length > 0)
        name += ' ?' + decodeURIComponent(json_lru.query)
      if(json_lru.fragment && json_lru.fragment.length > 0)
        name += ' #' + decodeURIComponent(json_lru.fragment)
      return name
    }

    // Test functions
    ns.LRU_test_hasNoPath = function(lru, settings){
      settings = settings || {}
      if(settings.strict === undefined)
        settings.strict = true
      var json_lru = ns.LRU_to_JSON_LRU(lru)
      if(settings.strict){
        return json_lru.path.length == 0
      } else {
        if(json_lru.path.length == 0){
          return true
        } else if(json_lru.path.length == 0){
          return json_lru.path[0] == ''
        } else {
          return false
        }
      }
    }

    ns.LRU_test_isNonsectionPage = function(lru, settings){
      settings = settings || {}
      var json_lru = ns.LRU_to_JSON_LRU(lru)
      return (json_lru.fragment && json_lru.fragment != '')
      || (json_lru.query !== undefined)
      || (
        json_lru.path.length > 0
        && json_lru.path.pop().indexOf('.') >= 0
        )
    }

    // TLD
    ns.tld_tree = undefined
    ns.getTLDTree = function(){
      // Retrieve the list only if it is the first time it's needed for the corpus
      if(ns.tld_tree === undefined)
        ns.tld_tree = api.getCorpusTLDs()
      return ns.tld_tree
    }

    // Misc

    ns.htmlEncode = function(value){
      return $('<div/>').text(value).html()
    }

    ns.htmlDecode = function(value){
      return $('<div/>').html(value).text()
    }

    ns.checkforInteger = function(value) {
      if (parseInt(value) != value)
        return false
      else
        return true
    }

    ns.checkforPrice = function(value) {
      if (isNaN(parseFloat(value)))
        return false
      else
        return true
    }

    ns.prettyDate = function(date){
      // Code adapted from http://webdesign.onyou.ch/2010/08/04/javascript-time-ago-pretty-date/
      var time_formats = [
        [5, 'just now', 'just now'],                  // 5
        [60, 'seconds ago', 'in seconds'],            // 60
        [120, '1 minute ago', '1 minute from now'],   // 60*2
        [3600, 'minutes', 60],                        // 60*60, 60
        [7200, '1 hour ago', '1 hour from now'],      // 60*60*2
        [86400, 'hours', 3600],                       // 60*60*24, 60*60
        [172800, 'yesterday', 'tomorrow'],            // 60*60*24*2
        [604800, 'days', 86400],                      // 60*60*24*7, 60*60*24
        [1209600, 'last week', 'next week'],          // 60*60*24*7*4*2
        [2419200, 'weeks', 604800],                   // 60*60*24*7*4, 60*60*24*7
        [4838400, 'last month', 'next month'],        // 60*60*24*7*4*2
        [29030400, 'months', 2419200],                // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'last year', 'next year'],         // 60*60*24*7*4*12*2
        [2903040000, 'years', 29030400],              // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'last century', 'next century'], // 60*60*24*7*4*12*100*2
        [58060800000, 'centuries', 2903040000]        // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
      ]
      ,seconds = (new Date() - date) / 1000
      ,token = 'ago'
      ,list_choice = 1
      if (seconds < 0) {
        seconds = Math.abs(seconds)
        token = 'from now'
        list_choice = 2
      }
      var i = 0, format
      while (format = time_formats[i++]){
        if (seconds < format[0]) {
          if (typeof(format[2]) == 'string'){
            return format[list_choice]
          } else {
            return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token
          }
        }
      }
      return date
    }

    ns.toProperCase = function(str){
      return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();})
    }

    ns.toDomainCase = function(str){
      return str.replace(/\w[^ -]*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();})
    }

    // Sort array and remove doubles
    ns.extractCases = function(data_array, elementAccessor){
      if(elementAccessor === undefined)
        elementAccessor = function(x){return x}
      
      var temp_result = data_array
        .map(function(d){
            return {id:elementAccessor(d), content:d}
          })
        .sort(function(a, b) {
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
          })

      // Merge Doubles
      var result = []
      for (var i = 0; i < temp_result.length; i++) {
        if (i==0 || temp_result[i - 1].id != temp_result[i].id) {
          result.push(temp_result[i].content)
        }
      }
      
      return result
    }

    // Sometimes useful for templating. Ex.: 3 -> [1,2,3]
    ns.getRange = function(number){
      var result = []
      for(var i = 1; i<=number; i++){result.push(i)}
      return result
    }

    // lodash's omit function to clone an object without a list of keys
    ns.omit = function(obj, omitKeys){
      return Object.keys(obj).reduce((result, key) => {
        if(!~omitKeys.indexOf(key)){
           result[key] = obj[key];
        }
        return result;
      }, {});
    }

    ns.consolidateJob = function(job){
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
      job.nb_pages_indexed = job.nb_crawled_pages - job.nb_unindexed_pages
      job.duration = (job.finished_at || new Date().getTime()) - job.scheduled_at
      return job
    }

      ns.consolidateRichJob = function(job){
        var richJob = ns.consolidateJob(job)

        richJob.max_depth = job.crawl_arguments.max_depth
        richJob.cookies = job.crawl_arguments.cookies
        richJob.phantom = job.crawl_arguments.phantom
        richJob.webarchives_used = job.crawl_arguments.webarchives.option
        richJob.webarchives_date = job.crawl_arguments.webarchives.option && job.crawl_arguments.webarchives.date
        richJob.webarchives_days_range = job.crawl_arguments.webarchives.option && job.crawl_arguments.webarchives.days_range
        richJob.discover_prefixes = job.crawl_arguments.discover_prefixes
        richJob.follow_prefixes = job.crawl_arguments.follow_prefixes
        richJob.nofollow_prefixes = job.crawl_arguments.nofollow_prefixes
        richJob.start_urls = job.crawl_arguments.start_urls
        richJob.user_agent = job.crawl_arguments.user_agent
        richJob.durationTotal = (job.finished_at - job.scheduled_at) / 1000
        richJob.durationOfCrawl = (job.finished_at - job.started_at) / 1000

        return richJob
      }


    ns.translateValue = function(value, type, mode){

      mode = mode || 'TEXT'

      var array_separator = ' '
      if (type === 'array of string with pipe') {
          array_separator = '|'
          type = 'array of string'
      }

      if (type == 'string') {
          return value

      } else if (type == 'number') {
          if (mode == 'TEXT') {
              return ''+value
          } else {
              return value
          }

      } else if (type == 'array of string'){

          if (value instanceof Array) {
              if(mode == 'JSON') {
                  return value
              } else if(mode == 'MD') {
                  return value
                      .map(function(d) {
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


    ns.waiter = function(array, worker, callback){
        var i = -1;
        function doTheWork(){
            i++;
            if( i >= array.length )
                return callback()
            var item = array[i]
            worker(item, function(){
                return doTheWork();
            })
        }
        return doTheWork();

      }

      ns.sortByField = function(array, field, asc){
          var result = array.slice();
          result.sort(function(a,b) {
              if (typeof(a[field])==='string'){
                  let alc = autocompletion.searchable(a[field]),
                      blc = autocompletion.searchable(b[field]);
                  if (alc < blc) return -1;
                  if (alc > blc) return 1;
                  return 0
              }
              return a[field]-b[field]
          });
          if (asc)
              return result;
          else
              return result.reverse()
      };

    //Function to create random coordinates to each nodes when creating a network so that it is displayed properly
      ns.generateRandomCoordinates = function(area){
          var d = Infinity
          var r = Math.sqrt(area / Math.PI || 1)
          var x, y
          while (d>r) {
              x = (0.5 - Math.random()) * 2 * r
              y = (0.5 - Math.random()) * 2 * r
              d = Math.sqrt(x*x + y*y)
          }
          return {x:x, y:y}
      }

    return ns
  }])
