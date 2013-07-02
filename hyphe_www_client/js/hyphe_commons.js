;(function(ns /* namespace */, $, undefined){

	// Hyphe Commons

	ns.js_file_init = function(){
		// Check that config is OK
	    if(HYPHE_CONFIG === undefined){
	        alert('Your installation of Hyphe has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHYPHE_CONFIG = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')
	    }
	    Messenger.options = {
			extraClasses: 'messenger-fixed messenger-on-top',
			theme: 'block'
		}
	}

	ns.domino_init = function(){
		domino.settings({
		    shortcutPrefix: "::" // Hack: preventing a bug related to a port in a URL for Ajax
		    ,verbose: HYPHE_CONFIG.JAVASCRIPT_LOG_VERBOSE
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
		    message: '<strong>Oops, an error occurred</strong> when communicating with the server\n<br/>\n"'+data+'"'
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
	
})(window.HypheCommons = window.HypheCommons || {}, jQuery)
