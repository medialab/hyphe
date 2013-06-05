;(function(ns /* namespace */, $, undefined){

	// Hyphe Commons

	ns.js_file_init = function(){
		// Check that config is OK
	    if(HYPHE_CONFIG === undefined)
	        alert('Your installation of Hyphe has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHYPHE_CONFIG = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')
	}

	ns.domino_init = function(){
		domino.settings({
		    shortcutPrefix: "::" // Hack: preventing a bug related to a port in a URL for Ajax
		    ,verbose: HYPHE_CONFIG.JAVASCRIPT_LOG_VERBOSE
		})
	}

	// RPC
	ns.RPC = {}
	ns.RPC.expect = function(data){
		return data[0] !== undefined && data[0].code !== undefined && data[0].code == 'success'
	}

	ns.RPC.error = function(data){
		alert('Oops, an error occurred... \n'+data)
	}

	ns.RPC.contentType = 'application/x-www-form-urlencoded'
	ns.RPC.type = 'POST'
	ns.RPC.URL = HYPHE_CONFIG.SERVER_ADDRESS
	
})(window.HypheCommons = window.HypheCommons || {}, jQuery)
