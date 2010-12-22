import re
from urlparse import urljoin

lruFullPattern=re.compile("^([^:/?#]+):(?://([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$")
lruSchemePattern=re.compile("https?")
lruAuthorityPattern=re.compile("^(?:([^:]+)(?::([^@]+))?\@)?([^\s:]+)(?::(\d+))?$")


def cleanUrl(url,currentUrl) :
	# relative path
	url=urljoin(currentUrl,url)
	
	lru= lruFullPattern.match(url)
	if lru :
		(scheme,authority,path,query,fragment ) =lru.groups()
		# mailto
		if not "mailto" in scheme :
			return url
	return None

def urlTokenizer(url):

	lru= lruFullPattern.match(url)
	if lru : 
		(scheme,authority,path,query,fragment ) =lru.groups()
		if lruSchemePattern.match(scheme) :
			hostAndPast=lruAuthorityPattern.match(authority)
			if hostAndPast :
				( user, pswd, host, port ) = hostAndPast.groups()
				tokens=["s:"+scheme,
				"t:"+(port if port else str(80))]
				host=host.split(".")
				host.reverse()
				if host : 
					tokens+=["h:"+stem for stem in host]
				if path : 
					tokens+=["p:"+stem for stem in path.strip("/").split("/")]
				if query :
					tokens.append("q:"+query if query else "")
				if fragment : 
					tokens.append("f:"+fragment if fragment else "")
				return "|".join(tokens)
	print "Error "+url
	return "not an url"



def lruRebuild(lru):
		# BE CAREFUL : naive algorithm to be updated
		lru_list=[stem.split(":") for stem in lru.split("|")]
		url=[stem for (k,stem) in filter(lambda (k,stem): k=="s",lru_list)][0]+"://"
		h=[stem for (k,stem) in filter(lambda (k,stem): k=="h",lru_list)]
		h.reverse()
		url+=".".join(h)
		path="/".join([stem for (k,stem) in filter(lambda (k,stem): k=="p",lru_list)])
		if path :
			path="/"+path
			url+=path
		return url

#url = "http://medialab.sciences-po.fr/hci"
#lru = urlTokenizer(url)
#print lru
#print lru.split("|")[0:5]
#print lruRebuild(lru)
		
#print getUrl("s:http|h:fr|h:sciences-po|h:www")	
#print getUrl("s:http|h:fr|h:sciences-po|h:medialab")		
#print getUrl("s:http|h:fr|h:sciences-po|h:www|p:dans|p:ton|p:cul.html")