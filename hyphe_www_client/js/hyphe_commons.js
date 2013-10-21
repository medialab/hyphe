;(function(ns /* namespace */, $, undefined){

	// Hyphe Commons

	ns.js_file_init = function(){
		// Check that config is OK
	    if(HYPHE_CONFIG === undefined){
	        alert('Your installation of Hyphe has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHYPHE_CONFIG = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')
	    }
	    Messenger.options = {
			extraClasses: 'messenger-fixed messenger-on-top messenger-on-right',
			theme: 'block'
		}
	}

	ns.domino_init = function(){
		domino.settings({
		    shortcutPrefix: "::" // Hack: preventing a bug related to a port in a URL for Ajax
		    ,verbose: HYPHE_CONFIG.JAVASCRIPT_LOG_VERBOSE
		    ,maxDepth: 20
		})
	}

	// RPC
	ns.RPC = {}
	ns.RPC.expect = function(
		data
		,input
		,serviceOptions
	){
		var result = data[0] !== undefined && data[0].code !== undefined && data[0].code == 'success'
		if(!result){
			console.log('RPC expect fail - Data:', data, '\n                  Input:', input, '\n                  Service options:', serviceOptions)
		}
		return result
	}

	ns.RPC.error = function(
		data	// Message returned
		,xhr	// XHR object of ajax
		,input 	// Input, parameters send to do the request
	){
		// alert('Oops, an error occurred... \n'+data)
		Messenger().post({
		    message: '<strong>Oops</strong> - something failed when communicating with the server - '+data+' <pre> '+xhr.responseText+' </pre>'
		    ,type: 'error'
		    ,showCloseButton: true
		    /*,actions: {
			    retry: {
					label: 'Log it in console',
					action: function() {
						console.log('RPC error - XHR:', xhr, 'Input:', input)
					}
			    }
			}*/
    	})
    	console.log('RPC error - Data:', data, '\n            XHR:', xhr, '\n            Input:', input)
	}

	ns.RPC.contentType = 'application/x-www-form-urlencoded'
	ns.RPC.type = 'POST'
	ns.RPC.URL = HYPHE_CONFIG.SERVER_ADDRESS
	
	ns.errorAlert = function(message){
		Messenger().post({
		    message: message
		    ,type: 'error'
		    ,showCloseButton: true
    	})
	}

	ns.getPrefixCandidates = function(lru, settings){
		if(lru === undefined)
			return []
		var candidates = []
			,lru_a = lru.split('|')
			,lru_json = Utils.LRU_to_JSON_LRU(lru)
			,settings = settings || {}
		settings.wwwlessVariations = settings.wwwlessVariations || false
		settings.wwwVariations = settings.wwwVariations || false
		settings.httpVariations = settings.httpVariations || false
		settings.httpsVariations = settings.httpsVariations || false

		candidates.push(lru)
		
		if(lru_a.length>3){
			for(length = lru_a.length-1; length>=3; length--){
				var candidate = lru_a.filter(function(stem, i){
					return i < length
				}).join('|')
				
				candidates.push(candidate)
			}
		}
		if(settings.wwwlessVariations && lru_json.host[lru_json.host.length - 1] == 'www'){
			var wwwlessVariation_json = domino.utils.clone(lru_json)
			wwwlessVariation_json.host.pop()
			var wwwlessVariation = Utils.JSON_LRU_to_LRU(wwwlessVariation_json)
			candidates = candidates.concat(ns.getPrefixCandidates(wwwlessVariation, {
				wwwlessVariations: false
				,wwwVariations: false
				,httpVariations: settings.httpVariations
				,httpsVariations: settings.httpsVariations
			}))
		}
		if(settings.wwwVariations && lru_json.host[lru_json.host.length - 1] != 'www'){
			var wwwVariation_json = domino.utils.clone(lru_json)
			wwwVariation_json.host.push('www')
			var wwwVariation = Utils.JSON_LRU_to_LRU(wwwVariation_json)
			candidates = candidates.concat(ns.getPrefixCandidates(wwwVariation, {
				wwwlessVariations: false
				,wwwVariations: false
				,httpVariations: settings.httpVariations
				,httpsVariations: settings.httpsVariations
			}))
		}
		if(settings.httpsVariations && lru_json.scheme == 'http'){
			var httpsVariation_json = domino.utils.clone(lru_json)
			httpsVariation_json.scheme = 'https'
			var httpsVariation = Utils.JSON_LRU_to_LRU(httpsVariation_json)
			candidates = candidates.concat(ns.getPrefixCandidates(httpsVariation, {
				wwwlessVariations: settings.wwwlessVariations
				,wwwVariations: settings.wwwVariations
				,httpVariations: false
				,httpsVariations: false
			}))
		
		}
		if(settings.httpVariations && lru_json.scheme == 'https'){
			var httpVariation_json = domino.utils.clone(lru_json)
			httpVariation_json.scheme = 'http'
			var httpVariation = Utils.JSON_LRU_to_LRU(httpVariation_json)
			candidates = candidates.concat(ns.getPrefixCandidates(httpVariation, {
				wwwlessVariations: settings.wwwlessVariations
				,wwwVariations: settings.wwwVariations
				,httpVariations: false
				,httpsVariations: false
			}))
		}
		return Utils.extractCases(candidates).reverse()
	}

})(window.HypheCommons = window.HypheCommons || {}, jQuery)
