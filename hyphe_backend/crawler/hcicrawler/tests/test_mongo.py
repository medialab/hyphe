import unittest
from zope.interface.verify import verifyObject
from hcicrawler.mongo import MongoPageStore, MongoPageQueue
try:
    from pymongo import MongoClient
except:
    from pymongo import Connection as MongoClient

class MongoPageStoreTest(unittest.TestCase):

    def setUp(self):
        c = MongoClient()
        c.drop_database('hci-test')
        col = c['hci-test']['crawler.pages']
        self.pagestore = MongoPageStore(col, 'JOBID')

class MongoPageQueueTest(unittest.TestCase):

    def setUp(self):
        c = MongoClient()
        c.drop_database('hci-test')
        col = c['hci-test']['crawler.pages']
        self.pagequeue = MongoPageQueue(col, 'JOBID')

