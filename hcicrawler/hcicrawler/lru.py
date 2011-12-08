import re

_lru_full_re = re.compile("^([^:/?#]+):(?://([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$")
_lru_scheme_re = re.compile("https?")
_lru_authority_re = re.compile("^(?:([^:]+)(?::([^@]+))?\@)?([^\s:]+)(?::(\d+))?$")

def url_to_lru(url):
    """
    Convert a URL to a LRU

    >>> url_to_lru("http://www.google.com/search?q=text&p=2")
    's:http|t:80|h:com|h:google|h:www|p:search|q:q=text&p=2'

    """
    lru = _lru_full_re.match(url)
    if lru: 
        scheme, authority, path, query, fragment = lru.groups()
        if _lru_scheme_re.match(scheme):
            hostAndPast = _lru_authority_re.match(authority)
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
    lru_list = [stem.split(":") for stem in lru.split("|")]
    url = [x[1] for x in filter(lambda (k, stem): k =="s", lru_list)][0] + "://"
    h = [x[1] for x in filter(lambda (k, stem): k =="h", lru_list)]
    h.reverse()
    url += ".".join(h)
    path = "/".join([x[1] for x in filter(lambda (k, stem): k=="p", lru_list)])
    if path:
        path = "/" + path
        url += path
    return url

