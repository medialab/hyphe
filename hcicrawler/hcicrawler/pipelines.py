import json
from os.path import join

from scrapy.exceptions import NotConfigured

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
