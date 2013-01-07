;(function(Hyphen, $, undefined){

	// Check that config is OK
	if(Hyphen.config === undefined)
		alert('Your installation of Hyphen has no configuration.\nCreate a file at "_config/config.js" in the same directory than index.php, with at least this content:\n\nHyphen.config = {\n"SERVER_ADDRESS":"http://YOUR_RPC_ENDPOINT_URL"\n}')

})(window.Hyphen = window.Hyphen || {}, jQuery)
