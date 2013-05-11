import pymongo, unittest
from zope.interface.verify import verifyObject
from hcicrawler.mongo import MongoPageStore, MongoPageQueue
from hcicrawler.interfaces import IPageStore, IPageQueue

class MongoPageStoreTest(unittest.TestCase):

    def setUp(self):
        c = pymongo.Connection()
        c.drop_database('hci-test')
        col = c['hci-test']['crawler.pages']
        self.pagestore = MongoPageStore(col, 'JOBID')

    def test_interface(self):
        verifyObject(IPageStore, self.pagestore)


class MongoPageQueueTest(unittest.TestCase):

    def setUp(self):
        c = pymongo.Connection()
        c.drop_database('hci-test')
        col = c['hci-test']['crawler.pages']
        self.pagequeue = MongoPageQueue(col, 'JOBID')

    def test_interface(self):
        verifyObject(IPageQueue, self.pagequeue)


