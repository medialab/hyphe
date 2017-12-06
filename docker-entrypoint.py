#!/usr/bin/env python
import json
from os import environ,system

def loadConfig(filename):
    with open(filename, "r+") as filecontent:
        data = json.load(filecontent)
    return data

def setConfig(setting, value, configdata, section=None):
    if section is not None:
        configdata[section][setting] = value
    else:
        configdata[setting] = value

def writeConfig(filename,configdata):
    with open(filename, 'w') as f:
       f.write(json.dumps(configdata, indent=2))

def strToBool(string):
    if string in ["true", "True", "yes", "y"]:
        return True
    else:
        return False

configfile = "/app/config/config.json"

configdata = loadConfig(configfile)

if "HYPHE_MONGODB_HOST"     in environ: setConfig("host", environ["HYPHE_MONGODB_HOST"],configdata,"mongo-scrapy")
if "HYPHE_MONGODB_PORT"     in environ: setConfig("mongo_port", int(environ["HYPHE_MONGODB_PORT"]),configdata,"mongo-scrapy")
if "HYPHE_MONGODB_DBNAME"   in environ: setConfig("db_name", environ["HYPHE_MONGODB_DBNAME"],configdata,"mongo-scrapy")
if "HYPHE_CRAWLER_PORT"     in environ: setConfig("scrapy_port", int(environ["HYPHE_CRAWLER_PORT"]),configdata,"mongo-scrapy")
if "HYPHE_PROXY_HOST"       in environ: setConfig("proxy_host", environ["HYPHE_PROXY_HOST"],configdata,"mongo-scrapy")
if "HYPHE_PROXY_PORT"       in environ: setConfig("proxy_port", int(environ["HYPHE_PROXY_PORT"]),configdata,"mongo-scrapy")
if "HYPHE_MAXDEPTH"         in environ: setConfig("maxdepth", int(environ["HYPHE_MAXDEPTH"]),configdata,"mongo-scrapy")
if "HYPHE_DOWNLOAD_DELAY"   in environ: setConfig("download_delay", int(environ["HYPHE_DOWNLOAD_DELAY"]),configdata,"mongo-scrapy")
if "HYPHE_MAX_SIM_REQ"      in environ: setConfig("max_simul_requests", int(environ["HYPHE_MAX_SIM_REQ"]),configdata,"mongo-scrapy")
if "HYPHE_HOST_MAX_SIM_REQ" in environ: setConfig("max_simul_requests_per_host", int(environ["HYPHE_HOST_MAX_SIM_REQ"]),configdata,"mongo-scrapy")

if "HYPHE_TRAPH_KEEPALIVE"      in environ: setConfig("keepalive", int(environ["HYPHE_TRAPH_KEEPALIVE"]),configdata,"traph")
if "HYPHE_TRAPH_DATAPATH"       in environ: setConfig("data_path", environ["HYPHE_TRAPH_DATAPATH"],configdata,"traph")
if "HYPHE_TRAPH_MAX_SIM_PAGES"  in environ: setConfig("max_simul_pages_indexing", int(environ["HYPHE_TRAPH_MAX_SIM_PAGES"]),configdata,"traph")

if "HYPHE_OPEN_CORS_API"   in environ: setConfig("OPEN_CORS_API", strToBool(environ["HYPHE_OPEN_CORS_API"]),configdata)
if "HYPHE_BACKEND_PORT"    in environ: setConfig("twisted.port", int(environ["HYPHE_BACKEND_PORT"]),configdata)
if "HYPHE_PRECISION_LIMIT" in environ: setConfig("precisionLimit", int(environ["HYPHE_PRECISION_LIMIT"]),configdata)
if "HYPHE_MULTICORPUS"     in environ: setConfig("MULTICORPUS", strToBool(environ["HYPHE_MULTICORPUS"]),configdata)
if "HYPHE_ADMIN_PASSWORD"  in environ: setConfig("ADMIN_PASSWORD", environ["HYPHE_ADMIN_PASSWORD"],configdata)
if "HYPHE_DEBUG"           in environ: setConfig("DEBUG", environ["HYPHE_DEBUG"],configdata)

writeConfig(configfile, configdata)

system("/app/hyphe_backend/core.tac")
