"""
URL/LRU library to manage, build and clean original URLs and corresponding URLs
"""

import re, urllib
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
    try:
        url = url.encode('utf8')
    except:
        pass
    lru = lruFullPattern.match(url)
    if lru:
        scheme, authority, path, query, fragment = lru.groups()
        if lruSchemePattern.match(scheme):
            hostAndPast = lruAuthorityPattern.match(authority)
            if hostAndPast:
                _, _, host, port = hostAndPast.groups()
                tokens = ["s:" + scheme, "t:"+ (port if port else (str(443) if scheme == "https" else str(80)))]
                host = host.split(".")
                host.reverse()
                if host:
                    tokens += ["h:"+stem for stem in host]
                if path:
                    path = urllib.quote_plus(path).replace("%2F", "/")
                    tokens += ["p:"+stem for stem in path.strip("/").split("/")]
                if query is not None:
                    query = urllib.quote_plus(query)
                    tokens.append("q:"+query)
                if fragment is not None:
                    fragment = urllib.quote_plus(fragment)
                    tokens.append("f:"+fragment)
                return "|".join(tokens)
    raise ValueError("not an url: %s" % url)

def url_to_lru_clean(url):
    return cleanLRU(url_to_lru(url))

def lru_to_url(lru):
    """
    Convert a LRU to a URL

    >>> lru_to_url('s:http|t:80|h:com|h:google|h:www|p:search')
    'http://www.google.com/search'
    >>> lru_to_url('s:http|t:80|h:com|h:google|h:www|p:search|q:q=text&p=2')
    #'http://www.google.com/search?q=text&p=2'

    """
    # TODO: naive algorithm (to be updated)
    stem_types = []
    lru_list = [stem.split(":", 1) for stem in lru.split("|")]
    for stem in lru_list:
        if stem[0] not in stem_types:
            stem_types.append(stem[0])
    url = [x[1] for x in filter(lambda (k, stem): k == "s", lru_list)][0] + "://"
    h = [x[1] for x in filter(lambda (k, stem): k == "h", lru_list)]
    h.reverse()
    url += ".".join(h)
    if "t" in stem_types:
        port = [x[1] for x in filter(lambda (k, stem): k == "t", lru_list)][0]
        if port and port != '80' and port != '443':
            url += ":" + port
    if "p" in stem_types:
        path = "/".join([x[1] for x in filter(lambda (k, stem): k=="p", lru_list)])
        if path:
            url += "/" + urllib.unquote_plus(path)
        if ['p', ''] in lru_list:
            url += "/"
    if "q" in stem_types:
        query = [x[1] for x in filter(lambda (k, stem): k == "q", lru_list)][0]
        if query or ['q', ''] in lru_list:
            url += "?" + urllib.unquote_plus(query)
    if "f" in stem_types:
        fragment = [x[1] for x in filter(lambda (k, stem): k == "f", lru_list)][0]
        if fragment or ['f', ''] in lru_list:
            url += "#" + urllib.unquote_plus(fragment)
    return url

def lru_to_url_short(lru):
    return lru_to_url(lru).replace('http://', '').replace('https://', '').replace('.', ' ').title()

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
queryRegexp = re.compile(r"\|q:([^|]*)")
def orderQueryParameters(lru) :
    match = queryRegexp.search(lru)
    if match is not None and match.group(1) is not None :
        res = match.group(1).split("&")
        res.sort()
        return lru.replace(match.group(1), "&".join(res))
    return lru

#Clean LRU by applying selection of previous filters
def cleanLRU(lru) :
#   return orderQueryParameters(stripAnchors(stripWWW(stripHttpPort(lru))))
    return stripHttpPort(lru)

re_head_lru = re.compile(r'(([sth]:[^|]*(\||$))+)', re.I)
def getLRUHead(lru):
    return re_head_lru.match(lru).group(1)

# Identify links which are nodes
def isLRUNode(lru, precisionLimit = 1):
    head = getLRUHead(lru)
    return (len(lru.replace(head, '').split("|")) <= precisionLimit)

# Get a LRU's node
def getLRUNode(lru, precisionLimit = 1) :
# need to add check for exceptions
    head = getLRUHead(lru)
    return head+"|".join([stem for stem in lru.replace(head, '').split("|")[:precisionLimit]])


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

