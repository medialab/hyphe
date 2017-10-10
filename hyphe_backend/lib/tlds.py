#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.internet import reactor
from twisted.internet.defer import inlineCallbacks, returnValue as returnD
from twisted.web.client import getPage as getPageOrig

MOZ_TLD_LIST = "https://publicsuffix.org/list/public_suffix_list.dat"

# Handle Twisted 16+ now refusing unicode urls
def getPage(url, *args, **kwargs):
    try:
        url = str(url)
    except:
        pass
    return getPageOrig(url, *args, **kwargs)

def add_tld_chunks_to_tree(tld, tree):
    chunk = tld.pop()
    if chunk not in tree:
        tree[chunk] = {}
    if tld:
        add_tld_chunks_to_tree(tld, tree[chunk])

@inlineCallbacks
def collect_tlds():
    tree = {}
    try:
        tldlist = yield getPage(MOZ_TLD_LIST)
    except: #Fallback local copy
        from os.path import join, realpath, dirname
        with open(join(dirname(realpath(__file__)), "tld_list.txt")) as f:
            tldlist = f.read()
    for line in tldlist.split("\n"):
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        chunks = line.decode('utf-8').split('.')
        add_tld_chunks_to_tree(chunks, tree)
    returnD(tree)

def _get_tld_from_host_arr(host_arr, tldtree, tld=""):
    chunk = host_arr.pop()
    if "!%s" % chunk in tldtree:
        return tld
    if "*" in tldtree or chunk in tldtree:
        tld = "%s.%s" % (chunk, tld) if tld else chunk
    if chunk in tldtree:
        return _get_tld_from_host_arr(host_arr, tldtree[chunk], tld)
    return tld

def get_tld_from_host_arr(host_arr, tldtree):
    return _get_tld_from_host_arr(list(host_arr), tldtree)

def get_tld_from_host(host, tldtree):
    host_arr = host.split('.')
    return get_tld_from_host_arr(host.split('.'), tldtree)

def update_lru_with_tld(lru, tldtree):
    host_arr = [l[2:] for l in lru.split('|') if l and l[0] == 'h']
    host_arr.reverse()
    tld = get_tld_from_host_arr(host_arr, tldtree)
    if not tld:
        return lru
    revtld = tld.split(".")
    revtld.reverse()
    tldlru = "".join(["h:%s|" % stem for stem in revtld])
    return lru.replace(tldlru, "h:%s|" % tld, 1)

if __name__== "__main__":
    def test():
        res = collect_tlds()
        res.addCallback(process)
    def process(res):
        tldlist, tldtree = res
        print "TLDs first level: %s\n" % len(tldtree.keys())
        print "TEST extracting TLDs from hosts:"
        for url, tld in [
            ("blogs.lemonde.paris", "paris"),               # 1st level TLD
            ("axel.brighton.ac.uk", "ac.uk"),               # 2nd level TLD
            ("m.fr.blogspot.com.au", "blogspot.com.au"),    # 3rd level TLD
            ("house.www.city.kawasaki.jp", "kawasaki.jp"),  # * case
            ("help.www.kawasaki.jp", "www.kawasaki.jp"),    # ! case
            (u"help.www.福岡.jp", u"福岡.jp"),              # utf8 case
            (u"syria.arabic.variant.سوريا", u"سوريا"),      # utf8 case 2
            (u"192.169.1.1", ""),                           # no tld case
            (u"localhost:8080", ""),                        # no tld case 2
            (u"localhost", ""),                             # no tld case 3
          ]:
            try:
                urltld = get_tld_from_host(url, tldtree)
                print url, "->", urltld
                assert(tld == urltld)
            except:
                print "ERROR extracting TLD!"
                reactor.stop()
                return

        print "\nTEST fixing LRUs TLDs:"
        for lru, gd in [
("s:http|h:info|h:anyquestions|h:www|p:nosfinanceslocales-fr-pour-une-meilleure-transparence-financiere-de-nos-communes|p:|", "s:http|h:info|h:anyquestions|h:www|p:nosfinanceslocales-fr-pour-une-meilleure-transparence-financiere-de-nos-communes|p:|"), # 1st level TLD: no change
("s:http|h:uk|h:co|h:brighton|h:alex|p:en|p:index.php|p:|", "s:http|h:co.uk|h:brighton|h:alex|p:en|p:index.php|p:|"), # 2nd level TLD
("s:http|h:au|h:com|h:blogspot|h:www|h:medialab|p:en|q:index.php|f:#sdfsd|", "s:http|h:blogspot.com.au|h:www|h:medialab|p:en|q:index.php|f:#sdfsd|"), # 3rd level TLD
("s:https|h:jp|h:kawasaki|h:city|h:www|h:house|p:en|q:index.php|", "s:https|h:kawasaki.jp|h:city|h:www|h:house|p:en|q:index.php|"), # * case
("s:https|h:jp|h:kawasaki|h:www|h:help|p:en|q:index.php|", "s:https|h:www.kawasaki.jp|h:help|p:en|q:index.php|"), # ! case
(u"s:https|h:jp|h:福岡|h:www|h:help|p:en|p:index.html|", u"s:https|h:福岡.jp|h:www|h:help|p:en|p:index.html|"),        # utf8 case
("s:https|h:192.168.1.1|p:en|p:index.html|", "s:https|h:192.168.1.1|p:en|p:index.html|"),        # no tld case
("s:http|t:8080|h:localhost|p:en|p:index.html|", "s:http|t:8080|h:localhost|p:en|p:index.html|"),        # no tld case 2
("s:http|h:localhost|p:en|p:index.html|", "s:http|h:localhost|p:en|p:index.html|"),        # no tld case 3
          ]:
            try:
                gdlru = update_lru_with_tld(lru, tldtree)
                print lru, "->", gdlru
                assert(gd == gdlru)
            except Exception as e:
                print "ERROR updating LRU!\n%s: %s" % (type(e), e)
                reactor.stop()
                return

        print "\nALL GOOD!"
        reactor.stop()
    test()
    reactor.run()
