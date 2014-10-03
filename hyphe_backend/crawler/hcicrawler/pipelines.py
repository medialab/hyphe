import pymongo
from scrapy import log
from twisted.internet import defer
from hcicrawler.mongo import MongoPageQueue, MongoPageStore
from hcicrawler.urllru import url_to_lru_clean, has_prefix
from hcicrawler.resolver import ResolverAgent


class RemoveBody(object):

    def process_item(self, item, spider):
        item.pop('body', None)
        return item


class OutputQueue(object):

    def __init__(self, mongo_host, mongo_port, mongo_db, mongo_col, jobid):
        col = pymongo.Connection(mongo_host, mongo_port)[mongo_db][mongo_col]
        self.q = MongoPageQueue(col, jobid)

    @classmethod
    def from_crawler(cls, crawler):
        mongo_host = crawler.settings['MONGO_HOST']
        mongo_port = crawler.settings['MONGO_PORT']
        mongo_db = crawler.settings['MONGO_DB']
        mongo_col = crawler.settings['MONGO_QUEUE_COL']
        jobid = crawler.settings['JOBID']
        return cls(mongo_host, mongo_port, mongo_db, mongo_col, jobid)

    def process_item(self, item, spider):
        self.q.push(dict(item))
        return item


class OutputStore(object):

    def __init__(self, mongo_host, mongo_port, mongo_db, mongo_col, jobid):
        col = pymongo.Connection(mongo_host, mongo_port)[mongo_db][mongo_col]
        self.store = MongoPageStore(col, jobid)

    @classmethod
    def from_crawler(cls, crawler):
        mongo_host = crawler.settings['MONGO_HOST']
        mongo_port = crawler.settings['MONGO_PORT']
        mongo_db = crawler.settings['MONGO_DB']
        mongo_col = crawler.settings['MONGO_PAGESTORE_COL']
        jobid = crawler.settings['JOBID']
        return cls(mongo_host, mongo_port, mongo_db, mongo_col, jobid)

    def process_item(self, item, spider):
        self.store.store("%s/%s" % (item['lru'], item['size']), dict(item))
        return item


class ResolveLinks(object):

    def __init__(self, proxy_host=None, proxy_port=None):
        proxy = None
        if proxy_host and proxy_port:
            proxy = {
              "host": proxy_host,
              "port": int(proxy_port)
            }
        self.agent = ResolverAgent(proxy=proxy)

    @classmethod
    def from_crawler(cls, crawler):
        proxy = crawler.settings['PROXY']
        if proxy != "" and not proxy.startswith(':'):
            return cls(*proxy.split(":"))
        return cls()

    @defer.inlineCallbacks
    def process_item(self, item, spider):
        lrulinks = []
        for url, lru in item["lrulinks"]:
            if self._should_resolve(lru, spider):
                try:
                    rurl = yield self.agent.resolve(url)
                    lru = url_to_lru_clean(rurl)
                except Exception, e:
                    spider.log("Error resolving redirects from URL %s: %s %s" % (url, type(e), e), log.INFO)
            lrulinks.append(lru)
        item["lrulinks"] = lrulinks
        defer.returnValue(item)

    def _should_resolve(self, lru, spider):
        c1 = has_prefix(lru, spider.discover_prefixes)
        c2 = has_prefix(lru, spider.follow_prefixes)
        c3 = any((match in lru for match in ["url", "link", "redir", "target", "orig", "goto"]))
        return c1 or (c2 and c3)

