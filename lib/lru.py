"""
URL/LRU library to manage, build and clean original URLs and corresponding URLs
"""

import re, urllib
from urlparse import urljoin, urlparse

lruFullPattern = re.compile("^([^:/?#]+):(?://([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$")
lruSchemePattern = re.compile("https?")
lruAuthorityPattern = re.compile("^(?:([^:]+)(?::([^@]+))?\@)?([^\s:]+)(?::(\d+))?$")

def fix_missing_http(url):
    if not url or url.strip() == "": 
        return None
    if not url.startswith('http'):
        url = "http://%s" % url.lstrip('/')
    # lowerize host since some servers answer badly when querying upcase hosts
    host = urlparse(url)[1]
    return url.replace("://"+host, "://"+host.lower())

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
                    if len(path) and path.startswith("/"):
                        path = path[1:]
                    tokens += ["p:"+stem for stem in path.split("/")]
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
        if not path and ['p', ''] in lru_list:
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

titlize_url_regexp = re.compile(r'(https?://|[./#])', re.I)
def lru_to_url_short(lru):
    return titlize_url_regexp.sub(' ', lru_to_url(lru)).strip().title()

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

re_trailing_slash = re.compile(r'(h:[^\|]*)\|p:\|?$')
def stripTrailingSlash(lru):
    return re_trailing_slash.sub(r'\1', lru)

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
    return stripTrailingSlash(stripHttpPort(lru))

def isFullPrecision(lru, precision_exceptions = []):
    return (lru in precision_exceptions)

re_host_lru = re.compile(r'(([sth]:[^|]*(\||$))+)', re.I)
re_path_lru = re.compile(r'(([sthp]:[^|]*(\||$))+)', re.I)
def getLRUHead(lru, precision_exceptions = []):
    possible_result = ""
    for precision_exception in precision_exceptions:
        if lru.startswith(precision_exception) and len(precision_exception) > len(possible_result):
            possible_result = precision_exception
    if possible_result:
        return possible_result
    return re_host_lru.match(lru).group(1).strip('|')

# Identify links which are nodes
def isLRUNode(lru, precision_limit = 1, precision_exceptions = [], lru_head = None):
    if not lru_head:
        lru_head = getLRUHead(lru, precision_exceptions)
    return (len(lru.replace(lru_head, '').strip('|').split("|")) <= precision_limit)

# Get a LRU's node
def getLRUNode(lru, precision_limit = 1, precision_exceptions = [], lru_head = None) :
# need to add check for exceptions
    if not lru_head:
        lru_head = getLRUHead(lru, precision_exceptions)
    stems = [stem for stem in lru.replace(lru_head, '').strip('|').split("|")[:precision_limit]]
    stems.insert(0, lru_head)
    return "|".join(stems)

def getURLHostFromLRU(lru):
    return lru_to_url(re_host_lru.match(lru).group(1).strip('|'))

def getURLPathFromLRU(lru):
    return lru_to_url(re_path_lru.match(lru).group(1).strip('|'))

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

