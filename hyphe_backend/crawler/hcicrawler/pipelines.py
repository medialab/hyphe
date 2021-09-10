import logging

from twisted.internet.defer import inlineCallbacks, returnValue
from txmongo import MongoConnection, connection as mongo_connection
mongo_connection._Connection.noisy = False
from txmongo.filter import sort as mongosort, ASCENDING

from hcicrawler.urllru import url_to_lru_clean, has_prefix
from hcicrawler.tlds_tree import TLDS_TREE
from hcicrawler.resolver import ResolverAgent


class RemoveBody(object):

    def process_item(self, item, spider):
        item.pop('body', None)
        return item


class MongoOutput(object):

    def __init__(self, host, port, db, queue_col, page_col, jobid):
        store = MongoConnection(host, port)[db]
        self.jobid = jobid
        self.pageStore = store[page_col]
        self.queueStore = store[queue_col]
        self.queueStore.create_index(mongosort(ASCENDING('_job')))

    @classmethod
    def from_crawler(cls, crawler):
        host = crawler.settings['MONGO_HOST']
        port = crawler.settings['MONGO_PORT']
        db = crawler.settings['MONGO_DB']
        queue_col = crawler.settings['MONGO_QUEUE_COL']
        page_col = crawler.settings['MONGO_PAGESTORE_COL']
        jobid = crawler.settings['JOBID']
        return cls(host, port, db, queue_col, page_col, jobid)


class OutputQueue(MongoOutput):

    @inlineCallbacks
    def process_item(self, item, spider):
        d = dict(item)
        d['_job'] = self.jobid
        yield self.queueStore.insert(d, safe=True)
        returnValue(item)

class OutputStore(MongoOutput):

    @inlineCallbacks
    def process_item(self, item, spider):
        d = dict(item)
        d['_id'] = "%s/%s" % (item['lru'], item['size'])
        d['_job'] = self.jobid
        d['forgotten'] = False
        yield self.pageStore.update({'_id': d['_id']}, d, upsert=True, safe=True)
        returnValue(item)


class ResolveLinks(object):

    def __init__(self, proxy=None):
        self.proxy = None
        if proxy:
            proxy_host, proxy_port = proxy.split(":", 1)
            self.proxy = {
              "host": proxy_host,
              "port": int(proxy_port)
            }

    @classmethod
    def from_crawler(cls, crawler):
        proxy = crawler.spider.proxy
        if proxy:
            return cls(proxy)
        return cls()

    @inlineCallbacks
    def process_item(self, item, spider):
        lrulinks = []
        for url, lru in item.get("lrulinks", []):
            if self._should_resolve(lru, spider):
                if url in spider.resolved_links:
                    lru = spider.resolved_links[url]
                else:
                    try:
                        agent = ResolverAgent(proxy=self.proxy)
                        rurl = yield agent.resolve(url)
                        if rurl == url and has_prefix(lru, spider.discover_prefixes):
                            rurl = yield agent.resolve(url)
                        lru = url_to_lru_clean(rurl, TLDS_TREE)
                        spider.resolved_links[url] = lru
                    except Exception, e:
                        spider.log("Error resolving redirects for URL %s (found into %s): %s %s" % (url, item['url'], type(e), e), logging.WARNING)
            lrulinks.append(lru)
        item["lrulinks"] = lrulinks
        returnValue(item)

    def _should_resolve(self, lru, spider):
        c1 = has_prefix(lru, spider.discover_prefixes)
        c2 = has_prefix(lru, spider.follow_prefixes)
        c3 = any((match in lru for match in ["url", "link", "redir", "target", "orig", "goto"]))
        return c1 or (c2 and c3)

