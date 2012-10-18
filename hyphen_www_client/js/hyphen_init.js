;(function(Hyphen, $, undefined){

	// Hyphen
	// ------
	
	// Utils
	Hyphen.utils = {}

	Hyphen.utils.URL_to_LRU = function(url){
		return Hyphen.utils.JSON_LRU_to_LRU(Hyphen.utils.URL_to_JSON_LRU(url));
	}
	Hyphen.utils.JSON_LRU_to_LRU = function(json_lru){
		var lru = "s:" + json_lru.scheme + "|t:" + json_lru.port
		json_lru.host.forEach(function(h){lru += "|h:"+h;})
		json_lru["path"].forEach(function(p){lru += "|p:"+p;})
		lru += "|q:" + json_lru.query + "|f:" + json_lru.fragment
		return lru
	}
	Hyphen.utils.URL_to_JSON_LRU = function(URL){
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
				
				host = host.split(/\./)
				if (host[0].toLowerCase().match(/w{3}/)){
					host.shift()
				}
				
				LRU = {
					"scheme": scheme,
					"port": (port) ? port : "80",
					"host": host.reverse(),
					"path": path.split(/\//).filter(function(pathToken){return pathToken.length}),   
					"query": query,
					"fragment": fragment
				}
			}
		}
		return LRU;
	}
	Hyphen.utils.LRU_to_URL = function(lru){
		return Hyphen.utils.JSON_LRU_to_URL(Hyphen.utils.LRU_to_JSON_LRU(lru)); 
	}
	Hyphen.utils.LRU_to_JSON_LRU = function(lru){
		var lru_array = lru.split("|"),
			json_lru = {host:[], path:[], query:"", fragment:""}
		lru_array.forEach(function(stem){
			var type = stem.substr(0, 1)
				name = stem.substr(2, stem.length - 2)
			if(type=="s"){
				json_lru.scheme = name
			} else if(type=="t"){
				json_lru.port = name
			} else if(type=="h"){
				json_lru.host.push(name)
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
	Hyphen.utils.JSON_LRU_to_URL = function(json_lru){
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

	Hyphen.utils.URL_simplify = function(url){
		return url.replace(/^http:\/\//, '').replace(/\/$/, '')
	}

	Hyphen.utils.LRU_prefix_fix = function(lru_prefix){
		var split = lru_prefix.split('|')
			,lastStem = split[split.length-1]
			,lastStemSplit = lastStem.split(':')
		if(lastStemSplit.length>1 && lastStemSplit[1]=='')
			split.pop()
		return split.join('|')
	}


	Hyphen.utils.htmlEncode = function(value){
		return $('<div/>').text(value).html();
	}

	Hyphen.utils.htmlDecode = function(value){
  		return $('<div/>').html(value).text();
	}






	// Debug
	Hyphen.debug = {}

	Hyphen.debug.level = 0	// 0: no debug, 1: track activated functions, 2: process tracking, 3: full details (unbearable)

	Hyphen.debug.log = function(messageOrMessages, level){
		level = level || 1
		if(level <= Hyphen.debug.level){
			if(typeof(messageOrMessages) == "string")
				console.log(messageOrMessages)
			else
				messageOrMessages.forEach(function(message){console.log(message)})
			console.log("")
		}
	}





})(window.Hyphen = window.Hyphen || {}, jQuery)
