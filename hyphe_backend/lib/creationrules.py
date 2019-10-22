# -*- coding: utf-8 -*-

import re
from hyphe_backend.lib.urllru import split_lru_in_stems

SCHEME = "s:[a-zA-Z]+\\|"
PORT = "t:[0-9]+\\|"
HOST = "h:[^\\|]+\\|"
SPE_HOST = "h:(?:localhost|(?:\\d{1,3}\\.){3}\\d{1,3}|\[[\da-f]*:[\da-f:]*\])\\|"
PATH = "p:[^\\|]+\\|"
ANY = "[thpqf]:[^\\|]+\\|"

DEFAULT = lambda x: "%s(?:%s)?(?:%s(?:%s)%s|%s)" % (SCHEME, PORT, HOST, HOST, x, SPE_HOST) # 1st host is TLD

PRESETS = {
  "subdomain": "(?:%s)" % DEFAULT("+"),
  "domain": "(?:%s)" % DEFAULT(""),
  "page": "(?:.*)$"
}

PREFIXN = ("(?:%s(?:%s)" % (SCHEME, ANY)) + "{%s})"
re_prefixN = re.compile(r"prefix\+(\d+)$")

SUBDOMN = "(?:%s)" % DEFAULT("{%d}")
re_subdomN = re.compile(r"subdomain-(\d+)$")

PATHN = ("(?:%s(?:%s)" % (DEFAULT("+"), PATH)) + "{%d})"
re_pathN = re.compile(r"path-(\d+)$")

re_regN = re.compile(r"\{(\d+)\}\)$")

def getPreset(name, prefix=None):
    key = name.lower()
    if key in PRESETS.keys():
        return PRESETS[key]
    prefixN = re_prefixN.match(key)
    if prefixN:
        stems = split_lru_in_stems(prefix)
        return PREFIXN % (int(prefixN.group(1)) + len(stems) - 1)
    subdomN = re_subdomN.match(key)
    if subdomN:
        return SUBDOMN % (int(subdomN.group(1)) + 1)
    pathN = re_pathN.match(key)
    if pathN:
        return PATHN % int(pathN.group(1))
    return name

def getName(regexp, prefix=None):
    for k, v in PRESETS.items():
        if regexp == v:
            return k
    digit = re_regN.search(regexp)
    if regexp.startswith("(?:%s(?:%s)" % (SCHEME, ANY)) and digit:
        lev = int(digit.group(1)) + 1 - len(split_lru_in_stems(prefix))
        return "prefix+%s" % lev
    elif regexp.startswith("(?:%s" % DEFAULT("+")) and digit:
        sreg = regexp.replace("(?:%s" % DEFAULT("+"), "")
        lev = int(digit.group(1))
        typ = "path"
        if sreg.startswith("(?:%s)" % PATH):
            typ = "path"
        else:
            lev -= 1
            typ = "subdomain"
        return "%s-%s" % (typ, lev)
    return 'unknown regexp'

def testPreset(name):
    """be a string among "domain", "subdomain", "subdomain-<N>", "path-<N>", "page", "prefix+<N>"."""
    if type(name) not in [str, unicode, bytes]:
        return False
    key = name.lower()
    return key in PRESETS.keys() or re_prefixN.match(key) or \
           re_subdomN.match(key) or re_pathN.match(key)
