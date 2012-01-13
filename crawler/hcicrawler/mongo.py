import pymongo
from zope.interface import implements
from hcicrawler.interfaces import IPageQueue, IPageStore

class MongoPageQueue(object):

    implements(IPageQueue)

    def __init__(self, collection, jobid):
        self._col = collection
        self._jobid = jobid
        self._col.ensure_index('_job')

    def push(self, page):
        d = dict(page)
        d['_job'] = self._jobid
        self._col.insert(d)

    def pop(self):
        d = self._col.find_and_modify({'_job': self._jobid}, remove=True,
            sort=[('_id', pymongo.ASCENDING)])
        if d:
            del d['_id']
            del d['_job']
            return d


class MongoPageStore(object):

    implements(IPageStore)

    def __init__(self, collection, jobid):
        self._col = collection
        self._jobid = jobid

    def store(self, key, page):
        d = dict(page)
        d['_id'] = key
        d['_job'] = self._jobid
        self._col.save(d)

    def load(self, key):
        d = self._col.find_one(key)
        if d:
            del d['_id']
            del d['_job']
            return d
        raise KeyError("Page not found for key: " % key)
