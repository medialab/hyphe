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
		return $('<div/>').text(value).html()
	}

	Hyphen.utils.htmlDecode = function(value){
  		return $('<div/>').html(value).text()
	}

	Hyphen.utils.checkforInteger = function(value) {
		if (parseInt(value) != value)
			return false
		else return true
    }

    Hyphen.utils.checkforPrice = function(value) {
    	if (isNaN(parseFloat(value)))
		    return false
        else return true
    }






	// Debug
	Hyphen.debug = {}

	Hyphen.debug.level = Hyphen.config.DEBUG_LEVEL || 0	// 0: no debug, 1: track activated functions, 2: process tracking, 3: full details (unbearable)

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










	// Integration
	Hyphen.integration = {}

	Hyphen.integration.initDataTables = function(){
		// Code from http://www.datatables.net/blog/Twitter_Bootstrap_2

		/* Set the defaults for DataTables initialisation */
		$.extend( true, $.fn.dataTable.defaults, {
			"sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
			"sPaginationType": "bootstrap",
			"oLanguage": {
				"sLengthMenu": "_MENU_ records per page"
			}
		} );


		/* Default class modification */
		$.extend( $.fn.dataTableExt.oStdClasses, {
			"sWrapper": "dataTables_wrapper form-inline"
		} );


		/* API method to get paging information */
		$.fn.dataTableExt.oApi.fnPagingInfo = function ( oSettings )
		{
			return {
				"iStart":         oSettings._iDisplayStart,
				"iEnd":           oSettings.fnDisplayEnd(),
				"iLength":        oSettings._iDisplayLength,
				"iTotal":         oSettings.fnRecordsTotal(),
				"iFilteredTotal": oSettings.fnRecordsDisplay(),
				"iPage":          Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
				"iTotalPages":    Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
			};
		};


		/* Bootstrap style pagination control */
		$.extend( $.fn.dataTableExt.oPagination, {
			"bootstrap": {
				"fnInit": function( oSettings, nPaging, fnDraw ) {
					var oLang = oSettings.oLanguage.oPaginate;
					var fnClickHandler = function ( e ) {
						e.preventDefault();
						if ( oSettings.oApi._fnPageChange(oSettings, e.data.action) ) {
							fnDraw( oSettings );
						}
					};

					$(nPaging).addClass('pagination').append(
						'<ul>'+
							'<li class="prev disabled"><a href="#">&larr; '+oLang.sPrevious+'</a></li>'+
							'<li class="next disabled"><a href="#">'+oLang.sNext+' &rarr; </a></li>'+
						'</ul>'
					);
					var els = $('a', nPaging);
					$(els[0]).bind( 'click.DT', { action: "previous" }, fnClickHandler );
					$(els[1]).bind( 'click.DT', { action: "next" }, fnClickHandler );
				},

				"fnUpdate": function ( oSettings, fnDraw ) {
					var iListLength = 5;
					var oPaging = oSettings.oInstance.fnPagingInfo();
					var an = oSettings.aanFeatures.p;
					var i, j, sClass, iStart, iEnd, iHalf=Math.floor(iListLength/2);

					if ( oPaging.iTotalPages < iListLength) {
						iStart = 1;
						iEnd = oPaging.iTotalPages;
					}
					else if ( oPaging.iPage <= iHalf ) {
						iStart = 1;
						iEnd = iListLength;
					} else if ( oPaging.iPage >= (oPaging.iTotalPages-iHalf) ) {
						iStart = oPaging.iTotalPages - iListLength + 1;
						iEnd = oPaging.iTotalPages;
					} else {
						iStart = oPaging.iPage - iHalf + 1;
						iEnd = iStart + iListLength - 1;
					}

					for ( i=0, iLen=an.length ; i<iLen ; i++ ) {
						// Remove the middle elements
						$('li:gt(0)', an[i]).filter(':not(:last)').remove();

						// Add the new list items and their event handlers
						for ( j=iStart ; j<=iEnd ; j++ ) {
							sClass = (j==oPaging.iPage+1) ? 'class="active"' : '';
							$('<li '+sClass+'><a href="#">'+j+'</a></li>')
								.insertBefore( $('li:last', an[i])[0] )
								.bind('click', function (e) {
									e.preventDefault();
									oSettings._iDisplayStart = (parseInt($('a', this).text(),10)-1) * oPaging.iLength;
									fnDraw( oSettings );
								} );
						}

						// Add / remove disabled classes from the static elements
						if ( oPaging.iPage === 0 ) {
							$('li:first', an[i]).addClass('disabled');
						} else {
							$('li:first', an[i]).removeClass('disabled');
						}

						if ( oPaging.iPage === oPaging.iTotalPages-1 || oPaging.iTotalPages === 0 ) {
							$('li:last', an[i]).addClass('disabled');
						} else {
							$('li:last', an[i]).removeClass('disabled');
						}
					}
				}
			}
		} );


		/*
		 * TableTools Bootstrap compatibility
		 * Required TableTools 2.1+
		 */
		if ( $.fn.DataTable.TableTools ) {
			// Set the classes that TableTools uses to something suitable for Bootstrap
			$.extend( true, $.fn.DataTable.TableTools.classes, {
				"container": "DTTT btn-group",
				"buttons": {
					"normal": "btn",
					"disabled": "disabled"
				},
				"collection": {
					"container": "DTTT_dropdown dropdown-menu",
					"buttons": {
						"normal": "",
						"disabled": "disabled"
					}
				},
				"print": {
					"info": "DTTT_print_info modal"
				},
				"select": {
					"row": "active"
				}
			} );

			// Have the collection use a bootstrap compatible dropdown
			$.extend( true, $.fn.DataTable.TableTools.DEFAULTS.oTags, {
				"collection": {
					"container": "ul",
					"button": "li",
					"liner": "a"
				}
			} );
		}
	}





})(window.Hyphen = window.Hyphen || {}, jQuery)
