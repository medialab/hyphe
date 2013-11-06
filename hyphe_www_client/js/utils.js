;(function(ns /* namespace */, $, undefined){

	// Utils

	ns.URI_reEncode = function(uri){
		return encodeURI(decodeURI(uri))
	}
	ns.URI_reEncodeComponent = function(uri){
		return encodeURIComponent(decodeURIComponent(uri))
	}

	ns.URL_to_LRU = function(url){
		var json_lru = ns.URL_to_JSON_LRU(url)
		if(json_lru === undefined)
			return ''
		return ns.JSON_LRU_to_LRU(json_lru)
	}
	ns.JSON_LRU_to_LRU = function(json_lru){
		var lru = "s:" + json_lru.scheme + "|"
		if(json_lru.port)
			lru += "t:" + json_lru.port + "|"
		json_lru.host.forEach(function(h){lru += "h:" + h + "|";})
		json_lru["path"].forEach(function(p){lru += "p:" + ns.URI_reEncode(p) + "|";})
		if(json_lru.query)
			lru += "q:" + json_lru.query + "|"
		if(json_lru.fragment)
			lru += "f:" + ns.URI_reEncodeComponent(json_lru.fragment) + "|"
		return lru
	}
	ns.URL_to_JSON_LRU = function(URL){
		var LRU,
			regex = /^([^:\/?#]+):(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/
		
		if (URL.match(regex)) {	
			var scheme = RegExp.$1,
				authority = RegExp.$2,
				path = RegExp.$3,
				query = RegExp.$4,
				fragment = RegExp.$5
			if (scheme.match(/https?/) && authority.match(/^(?:([^:]+)(?::([^@]+))?\@)?([^\s:]+)(?::(\d+))?$/)) {
				var user = RegExp.$1,
					password = RegExp.$2,
					host = RegExp.$3,
					port = RegExp.$4
				
				host = host.toLowerCase().split(/\./)
				
				LRU = {
					"scheme": scheme.toLowerCase(),
					"host": host.reverse(),
					// "path": path.split(/\//).filter(function(pathToken){return pathToken.length}),   
					"path": path.split(/\//).filter(function(pathToken, i){return i>0}),   
				}
				if(port)
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
			} else if(type=="t"){
				json_lru.port = name
			} else if(type=="h"){
				json_lru.host.push(name.toLowerCase())
			} else if(type=="p"){
				json_lru.path.push(name)
			} else if(type=="q"){
				json_lru.query = name
			} else if(type=="f"){
				json_lru.fragment = name
			}
		})
		return json_lru
	}
	ns.JSON_LRU_to_URL = function(json_lru){
		var scheme		= "",
			hosts		= "",
			port		= "",
			path		= "",
			query		= "",
			fragment	= ""
		
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
		
		if(json_lru.path != undefined && json_lru.path.length>0)
			json_lru.path.forEach(function(p){
				path = path+"/"+ns.URI_reEncode(p)
			})
		
		if(json_lru.query != undefined && json_lru.query.length>0)
			query = "?"+json_lru.query
		
		if(json_lru.fragment != undefined && json_lru.fragment.length>0)
			fragment = "#"+ns.URI_reEncodeComponent(json_lru.fragment)
		
		if(json_lru.port != undefined && json_lru.port!="80")
			port = ":"+json_lru.port

		return scheme+hosts+port+path+query+fragment
	}

    ns.URL_remove_http = function(url) {
        return url.replace(/^http:\/\//, '')
    }

	ns.URL_simplify = function(url){
		return ns.URL_stripLastSlash(ns.URL_remove_http(url))
	}

	ns.URL_fix = function(url){
		// Trim
		url = $.trim(url)

		if(url == '')
			return ''
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
		url = $.trim(url)

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
		var lruregex = /^s:[^\|]+\|(h:[a-zA-Z0-9\-]+\|){2}/
		return lruregex.test(lru)
	}

	ns.URL_validate = function(url){
		var urlregex = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/
		return urlregex.test(url)
	}

	ns.LRU_getTLD = function(lru){
		var json_lru = ns.LRU_to_JSON_LRU(lru)
			,host_split = json_lru.host.slice(0)
			,tlds = ns.getTLDLists()

		function getLongestMatchingTLDSplit(tld_candidate_split){
			var longestMatchingTLD_split = []
			tlds.rules.forEach(function(tld){
				var tld_split = tld.split('.').reverse()
					,match_flag = true
					,i
					
					for(i in tld_split){
						if(tld_candidate_split.length < i){
							match_flag = false
							break
						}
						if(tld_split[i] != tld_candidate_split[i]){
							if(tld_split[i] != '*'){
								match_flag = false
								break
							}
						}
					}

					if(match_flag && tld_split.length > longestMatchingTLD_split.length){
						var actualTLDCandidate = host_split.slice(0, tld_split.length)
						longestMatchingTLD_split = tld_split
					}
				})
			if(longestMatchingTLD_split.length == 0){
				console.log('No tld matching for', lru)
				return []
			}
			// Check the longest matching tld is not an exception
			var actualTLDCandidate = host_split.slice(0, longestMatchingTLD_split.length)
				,matchingExceptions = tlds.exceptions.filter(function(tld){
					var tld_split = tld.split('.').reverse()
						,match_flag = true
					
					for(i in tld_split){
						if(actualTLDCandidate.length < i){
							match_flag = false
							break
						}
						if(tld_split[i] != actualTLDCandidate[i]){
							match_flag = false
							break
						}
					}
					return match_flag
				})
			if(matchingExceptions.length != 0){
				// console.log('TLD is an exception', longestMatchingTLD_split)
				longestMatchingTLD_split.pop()
			}
			return longestMatchingTLD_split
		}

		var longestMatchingTLD = getLongestMatchingTLDSplit(host_split, [])
		return host_split.slice(0, longestMatchingTLD.length).reverse().join('.')

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

	ns.LRU_test_hasNoSubdomain = function(lru, settings){
		settings = settings || {}
		var json_lru = ns.LRU_to_JSON_LRU(lru)
			,host_array = json_lru.host.slice(0)
		// Truncate host
		host_array.pop()
		var truncatedHost = host_array.reverse().join('.')
		// There was no subdomain if the removed part was the domain and thus the truncated host is just a tld
		return ns.TLD_isValid(truncatedHost)
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
	ns.tld_lists = undefined
	ns.getTLDLists = function(){
		// Retrieve the list only if it is the first time it's needed
		if(ns.tld_lists === undefined)
			ns.tld_lists = ns.buildTLDLists()
		return ns.tld_lists
	}
	ns.buildTLDLists = function(){
		var list_text
		$.ajax({
	        url:"res/tld_list.txt"
	        ,success: function(result) {
	        		list_text = result
            	}
	        ,async: false
	    })
	    // var lines = list_text.split('\r\n')
	    var lines = list_text.match(/[^\r\n]+/g)
	    	,list =  lines
		    	.filter(function(l){
			    		return l.length > 0
			    			&& l.indexOf('//') != 0
			    	})
		    	.map(function(l){
		    			var split = l.split(' ')
		    			return split[0] || ''
			    	})
		var tld_lists = {
				rules: list
					.filter(function(l){return l.substr(0,1) != '!'})
				,exceptions: list
					.filter(function(l){return l.substr(0,1) == '!'})
					.map(function(l){return l.substr(1, l.length-1)})
			}
		// console.log('tld_lists', tld_lists)
		return tld_lists
	}

	ns.TLD_isValid = function(tld_candidate){
		var tlds = ns.getTLDLists()
			,tld_candidate_split = tld_candidate.split('.')
			,matchingTLDs = tlds.rules.filter(function(tld){
				var tld_split = tld.split('.')
					,match_flag = true
				
				for(i in tld_candidate_split){
					if(tld_split.length < i){
						match_flag = false
						break
					}
					if(tld_split[i] != tld_candidate_split[i]){
						if(tld_split[i] != '*'){
							match_flag = false
							break
						}
					}
				}

				return match_flag
			})
		// Check for exceptions
		var matchingExceptions = tlds.exceptions.filter(function(tld){
				var tld_split = tld.split('.')
					,match_flag = true
				
				for(i in tld_candidate_split){
					if(tld_split.length < i){
						match_flag = false
						break
					}
					if(tld_split[i] != tld_candidate_split[i]){
						match_flag = false
						break
					}
				}

				return match_flag
			})
		return matchingTLDs.length > 0 && matchingExceptions.length == 0
	}

	//

	ns.htmlEncode = function(value){
		return $('<div/>').text(value).html()
	}

	ns.htmlDecode = function(value){
		return $('<div/>').html(value).text()
	}

	ns.checkforInteger = function(value) {
		if (parseInt(value) != value)
			return false
		else return true
	}

	ns.checkforPrice = function(value) {
		if (isNaN(parseFloat(value)))
			return false
		else return true
	}

	ns.prettyDate = function(date){
		// Code adapted from http://webdesign.onyou.ch/2010/08/04/javascript-time-ago-pretty-date/
		var time_formats = [
			[60, 'just now', 'just now'], // 60
			[120, '1 minute ago', '1 minute from now'], // 60*2
			[3600, 'minutes', 60], // 60*60, 60
			[7200, '1 hour ago', '1 hour from now'], // 60*60*2
			[86400, 'hours', 3600], // 60*60*24, 60*60
			[172800, 'yesterday', 'tomorrow'], // 60*60*24*2
			[604800, 'days', 86400], // 60*60*24*7, 60*60*24
			[1209600, 'last week', 'next week'], // 60*60*24*7*4*2
			[2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
			[4838400, 'last month', 'next month'], // 60*60*24*7*4*2
			[29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
			[58060800, 'last year', 'next year'], // 60*60*24*7*4*12*2
			[2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
			[5806080000, 'last century', 'next century'], // 60*60*24*7*4*12*100*2
			[58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
		]
		var seconds = (new Date() - date) / 1000
			,token = 'ago'
			,list_choice = 1
		if (seconds < 0) {
			seconds = Math.abs(seconds)
			token = 'from now'
			list_choice = 2
		}
		var i = 0, format
		while (format = time_formats[i++]) 
			if (seconds < format[0]) {
				if (typeof(format[2]) == 'string'){
					return format[list_choice]
				} else {
					return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token
				}
			}
		return date
	}

	// Manipulate variables in urls
	ns.hash = {
		// Adapted and extended from https://github.com/javve/hash.js ; hi jonnystromberg :) !
		fromHash: function() {
        	return ns.hash.fromUrlObject(window.location)
    	}
	    
		,fromUrl: function(url_string) {
        	var url = document.createElement('a')
        	url.href=url_string
        	return ns.hash.fromUrlObject(url)
    	}

    	,fromUrlObject: function(urlObject){
    		var params = urlObject.hash ? urlObject.hash.substr(1).split("&") : []
	            ,paramsObject = {}
	        
	        for(var i = 0; i < params.length; i++) {
            	var a = params[i].split("=")
	            paramsObject[a[0]] = decodeURIComponent(a[1])
	        }
	        return paramsObject
    	}

    	,toHash: function(params) {
	        var str = []
	        for(var p in params) {
	            str.push(p + "=" + encodeURIComponent(params[p]))
	        }
	        window.location.hash = str.join("&")
	    }

	    ,toUrl: function(url_string, params) {
	        var str = []
	        for(var p in params) {
	            str.push(p + "=" + encodeURIComponent(params[p]))
	        }
	        var url = document.createElement('a')
        	url.href=url_string
	        url.hash = str.join("&")
	        return url.href
	    }
		
		,get: function(param) {
            var params = ns.hash.fromHash()
            if (param) {
                return params[param]
            } else {
                return params
            }
        }

        ,add: function(newParams, updateHistory) {
            var params = ns.hash.fromHash()
            for (var p in newParams) {
                params[p] = newParams[p]
            }
            if(updateHistory && history){
				history.pushState(params, document.title, ns.hash.toUrl(window.location.href, params));
            } else {
	            ns.hash.toHash(params)
            }
        }

        ,remove: function(removeParams) {
            removeParams = (typeof(removeParams)=='string') ? [removeParams] : removeParams
            var params = ns.hash.fromHash()
            for (var i = 0; i < removeParams.length; i++) {
                delete params[removeParams[i]]
            }
            ns.hash.toHash(params)
        }

        ,clear: function() {
            ns.hash.toHash({})
        }

        ,addToUrl: function(url, newParams){
        	var params = ns.hash.fromUrl(url)
            for (var p in newParams) {
                params[p] = newParams[p]
            }
            return ns.hash.toUrl(url, params)
        }
        
        ,removeFromUrl: function(url, removeParams) {
            removeParams = (typeof(removeParams)=='string') ? [removeParams] : removeParams
            var params = ns.hash.fromUrl(url)
            for (var i = 0; i < removeParams.length; i++) {
                delete params[removeParams[i]]
            }
            return ns.hash.toUrl(url, params)
        }

        ,clearUrl: function(url) {
            ns.hash.toUrl({})
        }

	}

	// Sorts the array and removes the doubles
	ns.extractCases = function(data_array, elementAccessor){
		if(elementAccessor === undefined)
			elementAccessor = function(x){return x}
		
		var temp_result = data_array.map(function(d){
			return {id:elementAccessor(d), content:d}
		}).sort(function(a, b) {
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        });
        
        // Merge Doubles
        var result = []
        for (var i = 0; i < temp_result.length; i++) {
            if (i==0 || temp_result[i - 1].id != temp_result[i].id) {
                result.push(temp_result[i].content)
            }
        }
        
        return result
	}
})(window.Utils = window.Utils || {}, jQuery)
