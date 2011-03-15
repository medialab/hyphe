hyphen.io.core.setServer("http://lrrr.medialab.sciences-po.fr:8080");
hyphen.ui.updateWebEntities();

/*
function tabSelected(event) {
  var browser = gBrowser.selectedBrowser;
  window.dump('new tab selected');
  browser.addEventListener("load", pageLoad, true);
}

// During initialisation
var container = gBrowser.tabContainer;
container.addEventListener("TabSelect", tabSelected, false);
*/

// check page for loading and subscribe to on location event
window.addEventListener("load", function() { firefox.listener.init(); }, false);


var firefox = {
	listener : {
  		init: function() {
	    	var appcontent = document.getElementById("appcontent");   // browser
	    	if(appcontent) {
	      		appcontent.addEventListener("DOMContentLoaded", firefox.listener.onPageLoad, true);
	    	}
	    	
	    	var container = gBrowser.tabContainer;
			container.addEventListener("TabSelect", firefox.listener.tabSelected, false);	    	
	  	},
		
		onPageLoad: function(aEvent) {
		    var doc = aEvent.originalTarget; 
		    window.dump("firefox.listener.onPageLoad." + doc.location.href + "\n");
		    firefox.ux.createWebEntity(hyphen.utils.tokenizeURL_JSON(doc.location.href));
		    
		    //aEvent.originalTarget.defaultView.addEventListener("unload", function(){ firefox.listener.onPageUnload(); }, true);
  		},

  		onPageUnload: function(aEvent) {
    		// do something
  		},
  		
  		tabSelected: function tabSelected(event) {
  			var browser = gBrowser.selectedBrowser;
		  	window.dump('firefox.listener.tabSelected');
		  	firefox.ux.createWebEntity(hyphen.utils.tokenizeURL_JSON(doc.location.href));
		}
	}, 
	
	ux : {
		createWebEntity : function(tokenizedUrl) {
			if(tokenizedUrl != undefined){
				const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
				var makeStemElement = function(name){
					var button = document.createElementNS(XUL_NS, "button");
					button.setAttribute("label", name);
					button.setAttribute("class", "stemElement");
					var lru = hyphen.utils.serialize_JSON_LRU(tokenizedUrl);
					button.setAttribute("oncommand", "javascript:hyphen.actions.declareWebEntity('"+ lru +"', "+ flagrank +");");
					if(flagrank<5){
						wes_in.appendChild(button);
					} else {
						wes_out.appendChild(button);
					}
					
					var separator = document.createElementNS(XUL_NS, "image");
					separator.setAttribute("class", "stem-separator");
					var spacer1 = document.createElementNS(XUL_NS, "spacer");
					var spacer2 = document.createElementNS(XUL_NS, "spacer");
					spacer1.setAttribute("flex", "1");
					spacer2.setAttribute("flex", "1");
					var vbox = document.createElementNS(XUL_NS, "vbox");
					vbox.appendChild(spacer1);
					vbox.appendChild(separator);
					vbox.appendChild(spacer2);
					if(flagrank<5){
						wes_in.appendChild(vbox);
					} else {
						wes_out.appendChild(vbox);
					}
					flagrank++;
				}
				
				var wes_in = document.getElementById("webEntityStems_in");
				var wes_out = document.getElementById("webEntityStems_out");
				hyphen.utils.domClear(wes_in);
				hyphen.utils.domClear(wes_out);
				
				var flagrank = 3;
				tokenizedUrl.host.forEach(makeStemElement);
				tokenizedUrl.path.forEach(makeStemElement);
				
				// Crawl (button for test)
				var tpc = document.getElementById("tabpanelCrawl");
				hyphen.utils.domClear(tpc);
				var button = document.createElementNS(XUL_NS, "button");
				var lru = hyphen.utils.serialize_JSON_LRU(tokenizedUrl);
				button.setAttribute("label", "Crawler: \""+hyphen.utils.rebuildLRU(lru)+"\"");
				button.setAttribute("oncommand", "javascript:hyphen.actions.crawlWebEntity('"+ lru +"');");
				tpc.appendChild(button);
			}
		}
	}
};