# -*- coding: utf-8 -*-

import re

SCHEME = "s:[a-zA-Z]+\\|"
PORT = "t:[0-9]+\\|"
HOST = "h:[^\\|]+\\|"
PATH = "p:[^\\|]+\\|"

DEFAULT = "(%s(%s)?%s(%s)+)" % (SCHEME, PORT, HOST, HOST)

PRESETS = {
  "subdomain": DEFAULT,
  "domain": "(%s(%s)?%s%s)" % (SCHEME, PORT, HOST, HOST),
  "page": "(.*)$"
}

PATHN = ("(%s(%s)?%s(%s)+(%s)" % (SCHEME, PORT, HOST, HOST, PATH)) + "{%d})"

re_pathN = re.compile(r"path-(\d+)$")

def getPreset(name):
    key = name.lower()
    if key in PRESETS.keys():
        return PRESETS[keys]
    pathN = re_pathN.match(key)
    if pathN:
        return PATHN % int(pathN.group(1))
    return name

