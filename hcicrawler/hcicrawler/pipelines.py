import json, pymongo
from os.path import join
from scrapy.exceptions import NotConfigured
from hcicrawler.mongo import MongoPageQueue, MongoPageStore


class OutputFeeds(object):

    def __init__(self, dir):
        self.dir = dir

    @classmethod
    def from_crawler(cls, crawler):
        dir = crawler.settings['OUTPUT_DIR']
        if not dir:
            raise NotConfigured
        return cls(dir)

    def spider_opened(self, spider):
        self.sfile = open(join(self.dir, '%s.jl' % spider.jobid))
        self.ffile = open(join(self.dir, '%s.full.jl' % spider.jobid))

    def spider_closed(self, spider):
        self.sfile.close()
        self.ffile.close()

    def process_item(self, item, spider):
        d = dict(item)
        self.ffile.write(json.dumps(d) + '\n')
        del d['body']
        self.sfile.write(json.dumps(d) + '\n')
        return item 


class RemoveBody(object):

    def process_item(self, item, spider):
        del item['body']
        return item


class OutputQueue(object):

    def __init__(self, mongo_host, mongo_db, mongo_col, jobid):
        col = pymongo.Connection(mongo_host)[mongo_db][mongo_col]
        self.q = MongoPageQueue(col, jobid)

    @classmethod
    def from_crawler(cls, crawler):
        mongo_host = crawler.settings['MONGO_HOST']
        mongo_db = crawler.settings['MONGO_DB']
        mongo_col = crawler.settings['MONGO_QUEUE_COL']
        jobid = crawler.settings['JOBID']
        return cls(mongo_host, mongo_db, mongo_col, jobid)

    def process_item(self, item, spider):
        self.q.push(dict(item))
        return item


class OutputStore(object):

    def __init__(self, mongo_host, mongo_db, mongo_col, jobid):
        col = pymongo.Connection(mongo_host)[mongo_db][mongo_col]
        self.store = MongoPageStore(col, jobid)

    @classmethod
    def from_crawler(cls, crawler):
        mongo_host = crawler.settings['MONGO_HOST']
        mongo_db = crawler.settings['MONGO_DB']
        mongo_col = crawler.settings['MONGO_PAGESTORE_COL']
        jobid = crawler.settings['JOBID']
        return cls(mongo_host, mongo_db, mongo_col, jobid)

    def process_item(self, item, spider):
        self.store.store(item['lru'], dict(item))
        return item
