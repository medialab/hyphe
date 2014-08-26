import pymongo, unittest
from zope.interface.verify import verifyObject
from hcicrawler.mongo import MongoPageStore, MongoPageQueue

class MongoPageStoreTest(unittest.TestCase):

    def setUp(self):
        c = pymongo.Connection()
        c.drop_database('hci-test')
        col = c['hci-test']['crawler.pages']
        self.pagestore = MongoPageStore(col, 'JOBID')

class MongoPageQueueTest(unittest.TestCase):

    def setUp(self):
        c = pymongo.Connection()
        c.drop_database('hci-test')
        col = c['hci-test']['crawler.pages']
        self.pagequeue = MongoPageQueue(col, 'JOBID')

