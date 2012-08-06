"""
URL/LRU library to manage, build and clean original URLs and corresponding URLs
"""

import re
from urlparse import urljoin

lruFullPattern = re.compile("^([^:/?#]+):(?://([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$")
lruSchemePattern = re.compile("https?")
lruAuthorityPattern = re.compile("^(?:([^:]+)(?::([^@]+))?\@)?([^\s:]+)(?::(\d+))?$")
 
def url_to_lru(url):
    """
    Convert a URL to a LRU
 
    >>> url_to_lru("http://www.google.com/search?q=text&p=2")
    's:http|t:80|h:com|h:google|h:www|p:search|q:q=text&p=2'
 
    """
    lru = lruFullPattern.match(url)
    if lru:
        scheme, authority, path, query, fragment = lru.groups()
        if lruSchemePattern.match(scheme):
            hostAndPast = lruAuthorityPattern.match(authority)
            if hostAndPast:
                _, _, host, port = hostAndPast.groups()
                tokens = ["s:" + scheme, "t:"+ (port if port else str(80))]
                host = host.split(".")
                host.reverse()
                if host:
                    tokens += ["h:"+stem for stem in host]
                if path:
                    tokens += ["p:"+stem for stem in path.strip("/").split("/")]
                if query:
                    tokens.append("q:"+query if query else "")
                if fragment :
                    tokens.append("f:"+fragment if fragment else "")
                return "|".join(tokens)
    raise ValueError("not an url: %s" % url)

def url_to_lru_clean(url):
    return cleanLRU(url_to_lru(url))

def lru_to_url(lru):                                                                                                                      
    """         
    Convert a LRU to a URL
    
    >>> lru_to_url('s:http|t:80|h:com|h:google|h:www|p:search')
    'http://www.google.com/search'
    
    # FIXME: urls with queries are not supported yet
    #>>> lru_to_url('s:http|t:80|h:com|h:google|h:www|p:search|q:q=text&p=2')
    #'http://www.google.com/search?q=text&p=2'
    
    """         
    # TODO: naive algorithm (to be updated)
    lru_list = [stem.split(":", 1) for stem in lru.split("|")]
    url = [x[1] for x in filter(lambda (k, stem): k =="s", lru_list)][0] + "://"
    h = [x[1] for x in filter(lambda (k, stem): k =="h", lru_list)]
    h.reverse() 
    url += ".".join(h)
    path = "/".join([x[1] for x in filter(lambda (k, stem): k=="p", lru_list)])
    if path:    
        path = "/" + path
        url += path 
    return url  
 
# Clean a URL
def cleanUrl(url, currentUrl) :
	# relative path
	url = urljoin(currentUrl, url)
	
	lru = lruFullPattern.match(url)
	if lru :
		(scheme, authority, path, query, fragment) = lru.groups()
		# mailto
		if not "mailto" in scheme :
			return url
	return None

# removing port if 80 :
def stripHttpPort(lru) :
	return "|".join([stem for stem in lru.split("|") if stem!="t:80" ])

# Removing subdomain if www :
def stripWWW(lru) :
	return "|".join([stem for stem in lru.split("|") if stem!="h:www" ])

# Removing anchors :
anchorRegexp = re.compile(r"f")
def stripAnchors(lru) :
	return "|".join([stem for stem in lru.split("|") if not anchorRegexp.match(stem) ])

# Order query parameters alphabetically
queryRegexp = re.compile(r"\|q:([^\|]*)")
def orderQueryParameters(lru) :
	match = queryRegexp.search(lru)
        if match is not None and match.group(1) is not None :
            res = match.group(1).split("&")
            res.sort()
            return lru.replace(match.group(1), "&".join(res))
        return lru

#Clean LRU by applying selection of previous filters
def cleanLRU(lru) :
#	return orderQueryParameters(stripAnchors(stripWWW(stripHttpPort(lru))))
	return stripWWW(stripHttpPort(lru))
        
# Identify links which are nodes
def isLRUNode(lru, precisionLimit = 3) :
	return (len(lru.split("|")) <= precisionLimit)

# Get a LRU's node
def getLRUNode(lru, precisionLimit = 3) :
# need to add check for exceptions
	return "|".join([stem for stem in lru.split("|")[:precisionLimit] ])


# TESTS
#url = "http://medialab.sciences-po.fr/hci"
#lru = urlTokenizer(url)
#print lru
#print lru.split("|")[0:5]
#print lruRebuild(lru)
		
#print getUrl("s:http|h:fr|h:sciences-po|h:www")	
#print getUrl("s:http|h:fr|h:sciences-po|h:medialab")		
#print getUrl("s:http|h:fr|h:sciences-po|h:www|p:dans|p:ton|p:cul.html")

#    testlru = "s:http|t:80|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Verifying+Propagation+of+Writes+with+getLastError|q:f=1&sg=3&a=3&b=34&_675=5&loiyy=hdsjk|f:HGYT"
#    print "TEST : " + testlru + "\nTEST : " + cleanLRU(testlru)

