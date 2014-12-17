# -*- coding: utf-8 -*-

import re

SCHEME = "s:[a-zA-Z]+\\|"
PORT = "t:[0-9]+\\|"
HOST = "h:[^\\|]+\\|"
PATH = "p:[^\\|]+\\|"

DEFAULT = "(%s(%s)?%s(%s)+)" % (SCHEME, PORT, HOST, HOST)

PRESETS = {
  "subdomains": DEFAULT,
  "domain": "(%s(%s)?%s%s)" % (SCHEME, PORT, HOST, HOST),
  "page": "(.*)$"
}

SUBDOMN = ("(%s(%s)?%s(%s)" % (SCHEME, PORT, HOST, HOST)) + "{%d})"

re_subdomN = re.compile(r"subdomain-(\d+)$")

PATHN = ("(%s(%s)?%s(%s)+(%s)" % (SCHEME, PORT, HOST, HOST, PATH)) + "{%d})"

re_pathN = re.compile(r"path-(\d+)$")

def getPreset(name):
    key = name.lower()
    if key in PRESETS.keys():
        return PRESETS[key]
    subdomN = re_subdomN.match(key)
    if subdomN:
        return SUBDOMN % int(subdomN.group(1))
    pathN = re_pathN.match(key)
    if pathN:
        return PATHN % int(pathN.group(1))
    return name

def testPreset(name):
    key = name.lower()
    return key in PRESETS.keys() or re_subdomN.match(key) or re_pathN.match(key)
