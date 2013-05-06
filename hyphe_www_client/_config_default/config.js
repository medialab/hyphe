HYPHE_CONFIG = {
	"SERVER_ADDRESS":"http://host:port",
	"DEBUG_LEVEL":1
}

// Retro-compatibility
;(function(undefined){
	try{
		if(Hyphen != null)
			Hyphen.config = HYPHE_CONFIG
	} catch(e){

	}
})()
