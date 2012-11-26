# -*- coding: utf-8 -*-
import sys, time, pymongo, bson, urllib, urllib2, httplib, urlparse, random, types
import json
from txjsonrpc.jsonrpc import Introspection
from txjsonrpc.web import jsonrpc
from twisted.web import server
from twisted.application import service, internet
from twisted.internet import reactor, defer, task
from twisted.internet.protocol import ClientCreator
from twisted.internet.defer import inlineCallbacks
from thrift import Thrift
from thrift.transport import TTwisted, TSocket
from thrift.protocol import TBinaryProtocol
sys.path.append('gen-py.twisted')
from memorystructure import MemoryStructure as ms
from memorystructure.ttypes import *
sys.path.append('../lib')
import config_hci, lru, gexf
import processor

defer.setDebugging(True)

config = config_hci.load_config()
if not config:
    exit()

class Enum(set):
    def __getattr__(self, name):
        if name in self:
            return name
        raise AttributeError
crawling_statuses = Enum(['UNCRAWLED', 'PENDING', 'RUNNING', 'FINISHED', 'CANCELED'])
indexing_statuses = Enum(['UNINDEXED', 'PENDING', 'BATCH_RUNNING', 'BATCH_FINISHED', 'BATCH_CRASHED', 'FINISHED'])

def jobslog(jobid, msg, db, timestamp=None):
    if timestamp is None:
        timestamp = int(time.time()*1000)
    if isinstance(jobid, types.ListType):
        return db[config['mongo-scrapy']['jobLogsCol']].insert([{'_job': _id, 'timestamp': timestamp, 'log': msg} for _id in jobid])
    return db[config['mongo-scrapy']['jobLogsCol']].insert({'_job': jobid, 'timestamp': timestamp, 'log': msg})

def convert_urls_to_lrus_array(urls):
    if not isinstance(urls, types.ListType):
        urls = urls.split(",")
    return [lru.url_to_lru_clean(url) for url in urls]

def getThriftConn():
    return ClientCreator(reactor, TTwisted.ThriftClientProtocol, ms.Client, TBinaryProtocol.TBinaryProtocolFactory()).connectTCP(config['memoryStructure']['thrift.IP'], config['memoryStructure']['thrift.port'])

class Core(jsonrpc.JSONRPC):

    addSlash = True

    def __init__(self):
        jsonrpc.JSONRPC.__init__(self)
        self.db = pymongo.Connection(config['mongo-scrapy']['host'],config['mongo-scrapy']['mongo_port'])[config['mongo-scrapy']['project']]
        self.crawler = Crawler(self.db)
        self.store = Memory_Structure(self.db)
        self.crawler.initDBindexes()
        self.monitor_loop = task.LoopingCall(self.jsonrpc_refreshjobs).start(1, False)

    def render(self, request):
        request.setHeader("Access-Control-Allow-Origin", "*")
        return jsonrpc.JSONRPC.render(self, request)

    def jsonrpc_ping(self):
        return {'code': 'success', 'result': 'pong'}

    def jsonrpc_reinitialize(self):
        """Reinitializes both crawl jobs and memory structure."""
        self.crawler.jsonrpc_reinitialize()
        self.store.jsonrpc_reinitialize()
        return {'code': 'success', 'result': 'Memory structure and crawling database contents emptied'}

    @inlineCallbacks
    def jsonrpc_crawl_webentity(self, webentity_id, maxdepth=None, all_pages_as_startpoints=False):
        """Tells scrapy to run crawl on a webentity defined by its id from memory structure."""
        if not maxdepth:
            maxdepth = config['mongo-scrapy']['maxdepth']
        mem_struct_conn = getThriftConn()
        WE = yield mem_struct_conn.addCallback(self.store.get_webentity_with_pages_and_subWEs, webentity_id, all_pages_as_startpoints)
        defer.returnValue(self.crawler.jsonrpc_start(webentity_id, WE['pages'], WE['lrus'], WE['subWEs'], convert_urls_to_lrus_array(config['discoverPrefixes']), maxdepth))

    def jsonrpc_refreshjobs(self):
        """Runs a monitoring task on the list of jobs in the database to update their status from scrapy API and indexing tasks."""
        scrapyjobs = self.crawler.jsonrpc_list()
        if scrapyjobs['code'] == 'fail':
            return scrapyjobs
        scrapyjobs = scrapyjobs['result']
        # update jobs crawling status accordingly to crawler's statuses
        running_ids = [job['id'] for job in scrapyjobs['running']]
        update_ids = [job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'_id': {'$in': running_ids}, 'crawling_status': crawling_statuses.PENDING}, fields=['_id'])]
        if len(update_ids):
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': {'$in': update_ids}}, {'$set': {'crawling_status': crawling_statuses.RUNNING}}, multi=True, safe=True)
            if (resdb['err']):
                print "ERROR updating running crawling jobs statuses", update_ids, resdb
                return
            jobslog(update_ids, "CRAWL_"+crawling_statuses.RUNNING, self.db)
        # update crawling status for finished jobs
        finished_ids = [job['id'] for job in scrapyjobs['finished']]
        update_ids = [job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'_id': {'$in': finished_ids}, 'crawling_status': {'$nin': [crawling_statuses.CANCELED, crawling_statuses.FINISHED]}}, fields=['_id'])]
        if len(update_ids):
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': {'$in': update_ids}}, {'$set': {'crawling_status': crawling_statuses.FINISHED}}, multi=True, safe=True)
            if (resdb['err']):
                print "ERROR updating finished crawling jobs statuses", update_ids, resdb
                return
            jobslog(update_ids, "CRAWL_"+crawling_statuses.FINISHED, self.db)
        # collect list of crawling jobs whose outputs is not fully indexed yet
        jobs_in_queue = self.db[config['mongo-scrapy']['queueCol']].distinct('_job')
        # set index finished for jobs with crawling finished and no page left in queue
        update_ids = [job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'_id': {'$in': list(set(finished_ids)-set(jobs_in_queue))}, 'crawling_status': crawling_statuses.FINISHED, 'indexing_status': {'$nin': [indexing_statuses.BATCH_RUNNING, indexing_statuses.FINISHED]}}, fields=['_id'])]
        if len(update_ids):
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.FINISHED}}, multi=True, safe=True)
            if (resdb['err']):
                print "ERROR updating finished indexing jobs statuses", update_ids, resdb
                return
            jobslog(update_ids, "INDEX_"+indexing_statuses.FINISHED, self.db)
        return self.jsonrpc_listjobs()

    def jsonrpc_listjobs(self):
        return {'code': 'success', 'result': list(self.db[config['mongo-scrapy']['jobListCol']].find(sort=[('crawling_status', pymongo.ASCENDING), ('indexing_status', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)]))}

    @inlineCallbacks
    def jsonrpc_declare_pages(self, list_urls, corpus=''):
        res = []
        print "Indexing pages and creating webentities from list of urls %s ..." % list_urls
        for url in list_urls:
            WE = yield self.jsonrpc_declare_page(url)
            res.append(WE['result'])
        defer.returnValue({'code': 'success', 'result': res})

    @inlineCallbacks
    def jsonrpc_declare_page(self, url, corpus=''):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.store.declare_page, url).addErrback(self.store.handle_error)
        if "code" in res:
            defer.returnValue(res)
        defer.returnValue({'code': 'success', 'result': res})

    def jsonrpc_lookup_httpstatus(self, url, timeout=2):
        try:
            prot, host, path = urlparse.urlparse(url)[0:3]
            if prot.endswith("s"):
                conn = httplib.HTTPSConnection(host, timeout=timeout)
            else:
                conn = httplib.HTTPConnection(host, timeout=timeout)
            conn.request('HEAD', path)
            response = conn.getresponse()
            return {"code": "success", "result": response.status}
        except:
            return {"code": "fail", "message": "Cannot process url %s" % url}

    def jsonrpc_lookup(self, url, timeout=2):
        res = self.jsonrpc_lookup_httpstatus(url, timeout)
        if res['code'] == 'success' and (res['result'] == 200 or 300 < res['result'] < 400):
            return {"code": "success", "result": "true"}
        return {"code": "success", "result": "false"}

    def jsonrpc_get_status(self):
        crawls = self.crawler.jsonrpc_list()
        pages = self.db[config['mongo-scrapy']['queueCol']].count()
        crawled = self.db[config['mongo-scrapy']['pageStoreCol']].count()
        res = {'crawler': {'jobs_pending': len(crawls['result']['pending']), 'jobs_running': len(crawls['result']['running']), 'pages_crawled': crawled},
               'memory_structure': {'job_running': self.store.loop_running, 'job_running_since': self.store.loop_running_since*1000,
                                    'last_index': self.store.last_index_loop*1000, 'last_links_generation': self.store.last_links_loop*1000,
                                    'pages_to_index': pages, 'webentities': self.store.total_webentities}}
        return {'code': 'success', 'result': res}


class Crawler(jsonrpc.JSONRPC):

    scrapy_url = 'http://%s:%s/' % (config['mongo-scrapy']['host'], config['mongo-scrapy']['scrapy_port'])

# TODO : handle corpuses with local db listing per corpus jobs/statuses

    def __init__(self, db=None):
        jsonrpc.JSONRPC.__init__(self)
        self.db = db

    def send_scrapy_query(self, action, arguments, tryout=0):
        url = self.scrapy_url+action+".json"
        if action == 'listjobs':
            url += '?'+'&'.join([par+'='+val for (par,val) in arguments.iteritems()])
            req = urllib2.Request(url)
        else:
            data = urllib.urlencode(arguments)
            req = urllib2.Request(url, data)
        try:
            response = urllib2.urlopen(req)
            result = json.loads(response.read())
            return {'code': 'success', 'result': result}
        except urllib2.URLError as e:
            return {'code': 'fail', 'message': 'Could not contact scrapyd server, maybe it\'s not started...'}
        except Exception as e:
            return {'code': 'fail', 'message': e}

    def jsonrpc_start(self, webentity_id, starts, follow_prefixes, nofollow_prefixes, discover_prefixes=config['discoverPrefixes'], maxdepth=config['mongo-scrapy']['maxdepth'], download_delay=config['mongo-scrapy']['download_delay'], corpus=''):
        """Starts a crawl with scrapy from arguments using a list of urls and of lrus for prefixes."""
        # Choose random user agent for each crawl
        agents = ["Mozilla/2.0 (compatible; MSIE 3.0B; Win32)","Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.4; en-US; rv:1.9b5) Gecko/2008032619 Firefox/3.0b5","Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; bgft)","Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; iOpus-I-M)","Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.19 (KHTML, like Gecko) Chrome/0.2.153.1 Safari/525.19","Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.19 (KHTML, like Gecko) Chrome/0.2.153.1 Safari/525.19"]
        # preparation of the request to scrapyd
        args = {'project': config['mongo-scrapy']['project'],
                  'spider': 'pages',
                  'setting': 'DOWNLOAD_DELAY=' + str(download_delay),
                  'maxdepth': maxdepth,
                  'start_urls': list(starts),
                  'follow_prefixes': list(follow_prefixes),
                  'nofollow_prefixes': list(nofollow_prefixes),
                  'discover_prefixes': list(discover_prefixes),
                  'user_agent': agents[random.randint(0, len(agents) - 1)]}
        res = self.send_scrapy_query('schedule', args)
        if res['code'] == 'fail':
            return res
        res = res['result']
        if 'jobid' in res:
            ts = int(time.time()*1000)
            jobslog(res['jobid'], "CRAWL_ADDED", self.db, ts)
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': res['jobid']}, {'$set': {'webentity_id': webentity_id, 'nb_pages': 0, 'nb_links': 0, 'crawl_arguments': args, 'crawling_status': crawling_statuses.PENDING, 'indexing_status': indexing_statuses.PENDING, 'timestamp': ts}}, upsert=True, safe=True)
            if (resdb['err']):
                print "ERROR saving crawling job %s in database for webentity %s with arguments %s" % (res['jobid'], webentity_id, args), resdb
                return {'code': 'fail', 'message': resdb}
        return {'code': 'success', 'result': res}

    def jsonrpc_cancel(self, job_id):
        """Cancels a scrapy job with id job_id."""
        print "Cancel crawl : ", job_id
        args = {'project': config['mongo-scrapy']['project'],
                  'job': job_id}
        res = self.send_scrapy_query('cancel', args)
        if res['code'] == 'fail':
            return res
        res = res['result']
        if 'prevstate' in res:
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': job_id}, {'$set': {'crawling_status': crawling_statuses.CANCELED}}, safe=True)
            if (resdb['err']):
                 print "ERROR updating job %s in database" % job_id, resdb
                 return {'code': 'fail', 'message': resdb}
            jobslog(job_id, "CRAWL_"+crawling_statuses.CANCELED, self.db)
        return {'code': 'success', 'result': res}

    def jsonrpc_list(self):
        """Calls Scrappy monitoring API, returns list of scrapy jobs."""
        return self.send_scrapy_query('listjobs', {'project': config['mongo-scrapy']['project']})

    def jsonrpc_get_job_logs(self, job_id):
        res = self.db[config['mongo-scrapy']['jobLogsCol']].find({'_job': job_id}, fields=['timestamp', 'log'], order=[('timestamp', pymongo.ASCENDING)])
        if not res.count():
            return {'code': 'fail', 'message': 'No log found for job %s.' % job_id}
        return {'code': 'success', 'result': [{'timestamp': log['timestamp'], 'log': log['log']} for log in res]}

    def jsonrpc_get_webentity_logs(self, webentity_id):
        jobs = self.db[config['mongo-scrapy']['jobListCol']].find({'webentity_id': webentity_id}, fields=['_id'], order=[('timestamp', pymongo.ASCENDING)])
        if not jobs.count():
            return {'code': 'fail', 'message': 'No job found for webentity %s.' % webentity_id}
        res = self.db[config['mongo-scrapy']['jobLogsCol']].find({'_job': {'$in': [a['_id'] for a in list(jobs)]}}, order=[('timestamp', pymongo.ASCENDING)])
        return {'code': 'success', 'result': [{'timestamp': log['timestamp'], 'job': log['_job'], 'log': log['log']} for log in list(res)]}

    def jsonrpc_cancel_all(self):
        """Stops all current crawls."""
        list_jobs = self.jsonrpc_list()
        if list_jobs['code'] == 'fail':
            return list_jobs
        list_jobs = list_jobs['result']
        for item in list_jobs['running'] + list_jobs['pending']:
            print self.jsonrpc_cancel(item['id'])
        while 'running' in list_jobs and len(list_jobs['running']):
            list_jobs = self.jsonrpc_list()
            if list_jobs['code'] != 'fail':
                list_jobs = list_jobs['result']
        return {'code': 'success', 'result': 'All crawling jobs canceled.'}

    def initDBindexes(self):
        self.db[config['mongo-scrapy']['pageStoreCol']].ensure_index([('timestamp', pymongo.ASCENDING)], safe=True)
        self.db[config['mongo-scrapy']['queueCol']].ensure_index([('timestamp', pymongo.ASCENDING)], safe=True)
        self.db[config['mongo-scrapy']['queueCol']].ensure_index([('_job', pymongo.ASCENDING), ('timestamp', pymongo.DESCENDING)], safe=True)
        self.db[config['mongo-scrapy']['jobLogsCol']].ensure_index([('timestamp', pymongo.ASCENDING)], safe=True)
        self.db[config['mongo-scrapy']['jobListCol']].ensure_index([('crawling_status', pymongo.ASCENDING), ('indexing_status', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)], safe=True)

    def emptyDB(self):
        self.db[config['mongo-scrapy']['queueCol']].drop()
        self.db[config['mongo-scrapy']['pageStoreCol']].drop()
        self.db[config['mongo-scrapy']['jobListCol']].drop()
        self.db[config['mongo-scrapy']['jobLogsCol']].drop()
        self.initDBindexes()

    def jsonrpc_reinitialize(self, corpus=''):
        """Cancels all current crawl jobs running or planned and empty mongodbs."""
        print "Empty crawl list + mongodb queue"
        canceljobs = self.jsonrpc_cancel_all()
        if canceljobs['code'] == 'fail':
            return canceljobs
        try:
            self.emptyDB()
        except:
            return {'code': 'fail', 'message': 'Error while resetting mongoDB.'}
        return {'code': 'success', 'result': 'Crawling database reset.'}


class Memory_Structure(jsonrpc.JSONRPC):

    def __init__(self, db=None):
        jsonrpc.JSONRPC.__init__(self)
        self.db = db
        self.index_loop = task.LoopingCall(self.index_batch_loop)
        self._start_loop()

    def _start_loop(self):
        self.total_webentities = -1
        self.jsonrpc_get_webentities()
        self.loop_running = False
        self.loop_running_since = 0
        self.last_links_loop = 0
        self.last_index_loop = 0
        self.recent_indexes = 0
        reactor.callLater(10, self.index_loop.start, 1, True)

    def handle_results(self, results):
        if config['DEBUG']:
            print results
        return {'code': 'success', 'result': results}

    def handle_error(self, failure):
        print failure
        return {'code': 'fail', 'message': failure.getErrorMessage()}

    def format_webentity(self, WE, jobs=None):
        if WE:
            res = {'id': WE.id, 'name': WE.name, 'lru_prefixes': list(WE.LRUSet), 'status': WE.status, 'homepage': WE.homepage, 'startpages': list(WE.startpages), 'creation_date': WE.creationDate, 'last_modification_date': WE.lastModificationDate, 'tags': {}}
            for tag in WE.metadataItems.keys():
                res["tags"][tag] = {}
                for key in WE.metadataItems[tag].keys():
                    res["tags"][tag][key] = list(WE.metadataItems[tag][key])
            #pages = yield client.getPagesFromWebEntity(WE.id)
            # nb_pages = len(pages)
            # nb_links 
            job = self.db[config['mongo-scrapy']['jobListCol']].find_one({'webentity_id': WE.id}, sort=[('timestamp', pymongo.DESCENDING)])
            if job:
                res['crawling_status'] = job['crawling_status']
                res['indexing_status'] = job['indexing_status']
            else:
                res['crawling_status'] = crawling_statuses.UNCRAWLED
                res['indexing_status'] = indexing_statuses.UNINDEXED
            return res
        return None

    def reset(self, conn):
        print "Empty memory structure content"
        client = conn.client
        client.clearIndex()
        client.saveWebEntityCreationRule(WebEntityCreationRule(config['defaultWebEntityCreationRule']['regexp'], config['defaultWebEntityCreationRule']['prefix']))

    @inlineCallbacks
    def ensureDefaultCreationRuleExists(self):
        mem_struct_conn = getThriftConn()
        yield mem_struct_conn.addCallback(self._ensureDefaultCreationRuleExists).addErrback(self.handle_error)

    @inlineCallbacks
    def _ensureDefaultCreationRuleExists(self, conn):
        client = conn.client
        rules = yield client.getWebEntityCreationRules()
        if (len(rules) == 0):
            print "Saves default WE creation rule"
            yield client.saveWebEntityCreationRule(WebEntityCreationRule(config['defaultWebEntityCreationRule']['regexp'], config['defaultWebEntityCreationRule']['prefix']))

    @inlineCallbacks
    def jsonrpc_reinitialize(self):
        mem_struct_conn = getThriftConn()
        self.index_loop.stop()
        res = yield mem_struct_conn.addCallback(self.reset).addErrback(self.handle_error)
        self._start_loop()
        defer.returnValue(res)

    @inlineCallbacks
    def return_new_webentity(self, client, lru_prefix, new=False, source=None):
        WE = yield client.findWebEntityMatchingLRU(lru_prefix)
        self.recent_indexes += 1
        if new:
            self.total_webentities += 1
            if source:
                yield self.jsonrpc_add_webentity_tag(WE.id, 'CORE', 'user_created_via', source)
        WE = self.format_webentity(WE)
        WE['created'] = True if new else False
        defer.returnValue(WE)

    @inlineCallbacks
    def declare_page(self, conn, url):
        url = lru.fix_missing_http(url)
        client = conn.client
        l = lru.url_to_lru_clean(url)
        t = str(int(time.time()*1000))
        is_node = lru.isLRUNode(l, config["precisionLimit"])
        page = PageItem("%s/%s" % (l, t), url, l, t, None, -1, None, ['USER'], False, is_node, {})
        cache_id = yield client.createCache([page])
        yield client.indexCache(cache_id)
        new = yield client.createWebEntities(cache_id)
        new_WE = yield self.return_new_webentity(client, l, new, 'page')
        defer.returnValue(new_WE)

    @inlineCallbacks
    def jsonrpc_declare_webentity_by_lru(self, lru_prefix):
        mem_struct_conn = getThriftConn()
        existing = yield mem_struct_conn.addCallback(self.get_webentity_by_lruprefix, lru_prefix).addErrback(self.handle_error)
        if not isinstance(existing, dict):
            defer.returnValue({'code': 'fail', 'message': 'LRU prefix "%s" is already set to an existing webentity : %s' % (lru_prefix, existing)})
        WE = WebEntity(None, [lru_prefix], lru.lru_to_url_short(lru_prefix))
        mem_struct_conn = getThriftConn()
        new_WE = yield mem_struct_conn.addCallback(self.create_webentity, WE, 'lru')
        defer.returnValue(self.handle_results(new_WE))

    @inlineCallbacks
    def create_webentity(self, conn, webentity, source=None):
        client = conn.client
        res = yield client.updateWebEntity(webentity)
        new_WE = yield self.return_new_webentity(client, webentity.LRUSet[0], True, source)
        defer.returnValue(new_WE)

    @inlineCallbacks
    def update_webentity(self, conn, webentity_id, field_name, value, array_behavior=None, array_key=None, array_namespace=None):
        client = conn.client
        WE = yield client.getWebEntity(webentity_id)
        try:
            if array_behavior:
                if array_key:
                    tmparr = getattr(WE, field_name, {})
                    if array_namespace:
                        tmparr = tmparr[array_namespace] if array_namespace in tmparr else {}
                    arr = tmparr[array_key] if array_key in tmparr else set()
                else:
                    arr = getattr(WE, field_name, set())
                if array_behavior == "push":
                    arr.add(value)
                elif array_behavior == "pop":
                    arr.remove(value)
                if array_key:
                    tmparr[array_key] = arr
                    if array_namespace:
                        tmparr2 = getattr(WE, field_name, {})
                        tmparr2[array_namespace] = tmparr
                        tmparr = tmparr2
                    arr = tmparr
                setattr(WE, field_name, arr)
            else:
                setattr(WE, field_name, value)
            if len(WE.LRUSet):
                res = yield client.updateWebEntity(WE)
                defer.returnValue(self.handle_results("%s field of webentity %s updated." % (field_name, res)))
            else:
                yield client.deleteWebEntity(WE)
                self.total_webentities -= 1
                defer.returnValue(self.handle_results("webentity %s had no LRUprefix left and was removed." % webentity_id))
        except Exception as x:
            defer.returnValue({"code": "fail", "message": "ERROR while updating webentity : %s" % x})

    @inlineCallbacks
    def jsonrpc_rename_webentity(self, webentity_id, new_name):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.update_webentity, webentity_id, "name", new_name).addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def jsonrpc_set_webentity_status(self, webentity_id, status):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.update_webentity, webentity_id, "status", status).addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def jsonrpc_set_webentity_homepage(self, webentity_id, homepage):
        mem_struct_conn = getThriftConn()
        homepage = lru.fix_missing_http(homepage)
        res = yield mem_struct_conn.addCallback(self.update_webentity, webentity_id, "homepage", homepage).addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def jsonrpc_add_webentity_lruprefix(self, webentity_id, lru_prefix):
        mem_struct_conn = getThriftConn()
        lru_prefix = lru.cleanLRU(lru_prefix)
        old_WE = yield mem_struct_conn.addCallback(self.get_webentity_by_lruprefix, lru_prefix).addErrback(self.handle_error)
        if not isinstance(old_WE, dict):
            print "Removing LRUPrefix %s from webentity %s" % (lru_prefix, old_WE.name)
            yield self.jsonrpc_rm_webentity_lruprefix(old_WE.id, lru_prefix)
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.update_webentity, webentity_id, "LRUSet", lru_prefix, "push").addErrback(self.handle_error)
        self.recent_indexes += 1
        defer.returnValue(res)

    @inlineCallbacks
    def jsonrpc_rm_webentity_lruprefix(self, webentity_id, lru_prefix):
        """ Will delete webentity if no LRUprefix left"""
        mem_struct_conn = getThriftConn()
        lru_prefix = lru.cleanLRU(lru_prefix)
        res = yield mem_struct_conn.addCallback(self.update_webentity, webentity_id, "LRUSet", lru_prefix, "pop").addErrback(self.handle_error)
        self.recent_indexes += 1
        defer.returnValue(res)

    @inlineCallbacks
    def jsonrpc_add_webentity_startpage(self, webentity_id, startpage_url):
        mem_struct_conn = getThriftConn()
        startpage_url = lru.fix_missing_http(startpage_url)
        res = yield mem_struct_conn.addCallback(self.update_webentity, webentity_id, "startpages", startpage_url, "push").addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def jsonrpc_rm_webentity_startpage(self, webentity_id, startpage_url):
        mem_struct_conn = getThriftConn()
        startpage_url = lru.fix_missing_http(startpage_url)
        res = yield mem_struct_conn.addCallback(self.update_webentity, webentity_id, "startpages", startpage_url, "pop").addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def jsonrpc_add_webentity_tag(self, webentity_id, tag_namespace, tag_key, tag_value):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.update_webentity, webentity_id, "metadataItems", tag_value, "push", tag_key, tag_namespace).addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def jsonrpc_rm_webentity_tag(self, webentity_id, tag_namespace, tag_key, tag_value):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.update_webentity, webentity_id, "metadataItems", tag_value, "pop", tag_key, tag_namespace).addErrback(self.handle_error)
        defer.returnValue(res) 

    @inlineCallbacks
    def jsonrpc_merge_webentity_into_another(self, old_webentity_id, good_webentity_id, include_tags=False, include_home_and_startpages_as_startpages=False):
        mem_struct_conn = getThriftConn()
        old_WE = yield mem_struct_conn.addCallback(self.get_webentity, old_webentity_id).addErrback(self.handle_error)
        if isinstance(old_WE, dict):
            defer.returnValue({'code': 'fail', 'message': 'ERROR retrieving webentity with id %s' % old_webentity_id})
        res = []
        if include_home_and_startpages_as_startpages:
            a = yield self.jsonrpc_add_webentity_startpage(good_webentity_id, old_WE.homepage)
            res.append(a)
            for page in old_WE.startpages:
                a = yield self.jsonrpc_add_webentity_startpage(good_webentity_id, page)
                res.append(a)
        if include_tags:
            for tag_namespace in old_WE.metadataItems.keys():
                for tag_key in old_WE.metadataItems[tag_namespace].keys():
                    for tag_val in old_WE.metadataItems[tag_namespace][tag_key]:
                        a = yield self.jsonrpc_add_webentity_tag(good_webentity_id, tag_namespace, tag_key, tag_val)
                        res.append(a)
        for lru in old_WE.LRUSet:
            a = yield self.jsonrpc_rm_webentity_lruprefix(old_webentity_id, lru)
            res.append(a)
            b = yield self.jsonrpc_add_webentity_lruprefix(good_webentity_id, lru)
            res.append(b)
        yield self.jsonrpc_add_webentity_tag(good_webentity_id, "CORE", "user_modified", "alias")
        self.total_webentities -= 1
        self.recent_indexes += 1
        defer.returnValue(self.handle_results(res))

    @inlineCallbacks
    def jsonrpc_delete_webentity(self, webentity_id):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.delete_webentity, webentity_id)
        defer.returnValue(res)

    @inlineCallbacks
    def delete_webentity(self, conn, webentity_id):
        client = conn.client
        try:
            WE = yield client.getWebEntity(webentity_id)
            yield client.deleteWebEntity(WE)
            defer.returnValue(self.handle_results("Webentity %s (%s) was removed" % (webentity_id, WE.name)))
            self.total_webentities -= 1
            self.recent_indexes += 1
        except Exception as x:
            defer.returnValue(self.handle_error(x))

    @inlineCallbacks
    def index_batch(self, conn, page_items, jobid):
        client = conn.client
        ids = [bson.ObjectId(str(record['_id'])) for record in page_items]
        if (len(ids) > 0):
            page_items.rewind()
            pages, links = processor.generate_cache_from_pages_list(page_items, config["precisionLimit"])
            s=time.time()
            cache_id = yield client.createCache(pages.values())
            nb_pages = yield client.indexCache(cache_id)
            print "... "+str(nb_pages)+" pages indexed in "+str(time.time()-s)+"s ..."
            s=time.time()
            nb_links = len(links)
            for link_list in [links[i:i+config['memoryStructure']['max_simul_links_indexing']] for i in range(0, nb_links, config['memoryStructure']['max_simul_links_indexing'])]:
                yield client.saveNodeLinks([NodeLink("id",source,target,weight) for source,target,weight in link_list])
            print "... "+str(nb_links)+" links indexed in "+str(time.time()-s)+"s ..."
            s=time.time()
            n_WE = yield client.createWebEntities(cache_id)
            print "... %s web entities created in %s" % (n_WE, str(time.time()-s))+"s"
            self.total_webentities += n_WE
            yield client.deleteCache(cache_id)
            resdb = self.db[config['mongo-scrapy']['queueCol']].remove({'_id': {'$in': ids}}, safe=True)
            if (resdb['err']):
                print "ERROR cleaning queue in database for job %s" % jobid, resdb
                return
            res = self.db[config['mongo-scrapy']['jobListCol']].find_and_modify({'_id': jobid}, update={'$inc': {'nb_pages': nb_pages, 'nb_links': nb_links}, '$set': {'indexing_status': indexing_statuses.BATCH_FINISHED}})
            if not res:
                print "ERROR updating job %s" % jobid
                return
            jobslog(jobid, "INDEX_"+indexing_statuses.BATCH_FINISHED, self.db)

    @inlineCallbacks
    def index_batch_loop(self):
        if self.loop_running:
            defer.returnValue(False)
        self.loop_running = True
        if self.db[config['mongo-scrapy']['jobListCol']].find_one({'indexing_status': indexing_statuses.BATCH_RUNNING}):
            print "WARNING : indexing job declared as running but probably crashed."
            defer.returnValue(False)
        oldest_page_in_queue = self.db[config['mongo-scrapy']['queueCol']].find_one(sort=[('timestamp', pymongo.ASCENDING)], fields=['_job'])
        # Run linking webentities on a regular basis when needed
        if self.recent_indexes > 10 or (self.recent_indexes and (not oldest_page_in_queue or time.time() - self.last_links_loop > 300)):
            self.loop_running = "generating links"
            self.loop_running_since = time.time()
            conn = getThriftConn()
            yield conn.addCallback(self.generate_WEs_links).addErrback(self.handle_index_error)
            self.recent_indexes = 0
            self.last_links_loop = time.time()
        elif oldest_page_in_queue:
            # find next job to be indexed and set its indexing status to batch_running
            job = self.db[config['mongo-scrapy']['jobListCol']].find_one({'_id': oldest_page_in_queue['_job'], 'crawling_status': {'$ne': crawling_statuses.PENDING}, 'indexing_status': {'$ne': indexing_statuses.BATCH_RUNNING}}, fields=['_id'], sort=[('timestamp', pymongo.ASCENDING)])
            if not job:
                defer.returnValue(False)
            jobid = job['_id']
            print "Indexing pages from job "+jobid
            page_items = self.db[config['mongo-scrapy']['queueCol']].find({'_job': jobid}, limit=config['memoryStructure']['max_simul_pages_indexing'], sort=[('timestamp', pymongo.ASCENDING)])
            if (page_items.count()) > 0:
                resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': jobid}, {'$set': {'indexing_status': indexing_statuses.BATCH_RUNNING}}, safe=True)
                if (resdb['err']):
                    print "ERROR updating job %s's indexing status" % jobid, resdb
                    defer.returnValue(False)
                jobslog(jobid, "INDEX_"+indexing_statuses.BATCH_RUNNING, self.db)
                self.loop_running = "indexing"
                self.loop_running_since = time.time()
                conn = getThriftConn()
                yield conn.addCallback(self.index_batch, page_items, jobid).addErrback(self.handle_index_error)
                self.recent_indexes += 1
                self.last_index_loop = time.time()
            else:
                print "WARNING : job %s found for index but no page corresponding found in queue."
        elif self.total_webentities == -1 or self.recent_indexes:
            print "Updating webentities count"
            yield self.jsonrpc_get_webentities()
        self.loop_running = None

    def handle_index_error(self, failure):
        update_ids = [job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'])]
        if len(update_ids):
            self.db[config['mongo-scrapy']['jobListCol']].update({'_id' : {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}}, multi=True)
            jobslog(update_ids, "INDEX_"+indexing_statuses.BATCH_CRASHED, self.db)
        failure.trap(Exception)
        print failure
        return {'code': 'fail', 'message': failure}

    @inlineCallbacks
    def jsonrpc_get_webentities(self, list_ids=None, corpus=''):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.get_webentities, list_ids).addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def get_webentity(self, conn, webentity_id):
        client = conn.client
        WE = yield client.getWebEntity(webentity_id)
        defer.returnValue(WE)

    @inlineCallbacks
    def get_webentities(self, conn, list_ids=None):
        client = conn.client
        if list_ids:
            WEs = yield client.getWebEntitiesByIDs(list_ids)
        else:
            WEs = yield client.getWebEntities()
            self.total_webentities = len(WEs)
        res = []
        if WEs:
            for WE in WEs:
                res.append(self.format_webentity(WE))
        defer.returnValue(self.handle_results(res))

    @inlineCallbacks
    def jsonrpc_get_webentity_pages(self, webentity_id, corpus=''):
        mem_struct_conn = getThriftConn()
        pages = yield mem_struct_conn.addCallback(self.get_webentity_pages, webentity_id).addErrback(self.handle_error)
        if "code" in pages:
            defer.returnValue(pages)
        formatted_pages = [{'lru': p.lru, 'sources': list(p.sourceSet), 'crawl_timestamp': p.crawlerTimestamp, 'url': p.url, 'depth': p.depth, 'error': p.errorCode, 'http_status': p.httpStatusCode, 'creation_date': p.creationDate, 'last_modification_date': p.lastModificationDate} for p in pages]
        defer.returnValue(self.handle_results(formatted_pages))

    def get_webentity_pages(self, conn, webentity_id):
        client = conn.client
        return client.getPagesFromWebEntity(webentity_id)

    @inlineCallbacks
    def jsonrpc_get_webentity_by_url(self, url):
        mem_struct_conn = getThriftConn()
        l = lru.url_to_lru_clean(url)
        WE = yield mem_struct_conn.addCallback(self.get_webentity_matching_lru, l).addErrback(self.handle_error)
        if isinstance(WE, dict):
            defer.returnValue({"code": 'fail', "result": "No webentity found in memory Structure for %s" % url})
        defer.returnValue(self.handle_results(self.format_webentity(WE)))

    @inlineCallbacks
    def get_webentity_matching_lru(self, conn, l):
        client = conn.client
        res = yield client.findWebEntityMatchingLRU(l)
        defer.returnValue(res)

    @inlineCallbacks
    def get_webentity_by_lruprefix(self, conn, l):
        client = conn.client
        res = yield client.findWebEntityByLRUPrefix(l)
        defer.returnValue(res)

    @inlineCallbacks
    def jsonrpc_get_webentity_subwebentities(self, webentity_id):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.get_webentity_subwebentities, webentity_id)
        defer.returnValue(res)

    @inlineCallbacks
    def get_webentity_subwebentities(self, conn, webentity_id):
        client = conn.client
        try:
            WEs = yield client.getSubWebEntities(webentity_id)
            res = []
            if WEs:
                for WE in WEs:
                    res.append(self.format_webentity(WE))
            defer.returnValue(self.handle_results(res))
        except Exception as x:
            defer.returnValue(self.handle_error(x))

    @inlineCallbacks
    def jsonrpc_get_webentities_network_json(self):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.generate_network_WEs, "json").addErrback(self.handle_error)
        if "code" in res:
            defer.returnValue(res)
        defer.returnValue(self.handle_results(res))

    def jsonrpc_generate_webentities_network_gexf(self):
        mem_struct_conn = getThriftConn()
        mem_struct_conn.addCallback(self.generate_network_WEs, "gexf").addErrback(self.handle_error)
        defer.returnValue(self.handle_results('GEXF graph generation started...'))

    @inlineCallbacks
    def jsonrpc_get_webentity_nodelinks_network_json(self, webentity_id=None, include_frontier=False):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.generate_network_WE_nodelinks, webentity_id, "json", include_frontier).addErrback(self.handle_error)
        if "code" in res:
            defer.returnValue(res)
        defer.returnValue(self.handle_results(res))

    @inlineCallbacks
    def get_webentity_with_pages_and_subWEs(self, conn, webentity_id, all_pages_as_startpoints=False):
        client = conn.client
        WE = yield client.getWebEntity(webentity_id)
        if not WE:
            raise Exception("No webentity with id %s found" % webentity_id)
        res = {'lrus': list(WE.LRUSet), 'pages': [lru.lru_to_url(lr) for lr in WE.LRUSet], 'subWEs': []}
        if all_pages_as_startpoints:
            pages = yield client.getPagesFromWebEntity(WE.id)
            if pages:
                res['pages'] = [p.url for p in pages]
        else:
            res['pages'] = list(WE.startpages)
        subs = yield client.getSubWebEntities(WE.id)
        if subs:
            res['subWEs'] = [lr for subwe in subs for lr in subwe.LRUSet]
        defer.returnValue(res)

    @inlineCallbacks
    def generate_WEs_links(self, conn):
        client = conn.client
        s = time.time()
        print "Generating links between web entities ..."
        jobslog("WE_LINKS", "Starting WebEntity links generation...", self.db)
        yield client.generateWebEntityLinks()
        s = str(time.time() -s)
        jobslog("WE_LINKS", "...finished WebEntity links generation (%ss)." %s, self.db)
        print "... processed webentity links in %ss" % s

    @inlineCallbacks
    def generate_network_WEs(self, conn, outformat="json"):
        client = conn.client
        s = time.time()
        print "Generating %s webentities network ..." % outformat
        links = yield client.getWebEntityLinks()
        if outformat == "gexf":
            WEs = yield client.getWebEntities()
            WEs_metadata = {}
            for WE in WEs:
                date = ''
                if WE.lastModificationDate:
                    date = WE.lastModificationDate
                elif WE.creationDate:
                    date = WE.creationDate
                pages = yield client.getPagesFromWebEntity(WE.id)
                WEs_metadata[WE.id] = {"name": WE.name, "date": date, "LRUset": ",".join(WE.LRUSet), "nb_pages": len(pages), "nb_intern_links": 0}
                WE_links = yield client.findWebEntityLinksBySource(WE.id)
                for link in WE_links:
                    if link.targetId == WE.id:
                        WEs_metadata[WE.id]['nb_intern_links'] = link.weight
            gexf.write_WEs_network_from_MS(links, WEs_metadata, 'test_welinks.gexf')
            print "... GEXF network generated in test_welinks.gexf in "+str(time.time()-s)
            defer.returnValue(None)
        elif outformat == "json":
            res = [[link.sourceId, link.targetId, link.weight] for link in links]
            print "... JSON network generated in "+str(time.time()-s)
            defer.returnValue(res)

    @inlineCallbacks
    def generate_network_WE_nodelinks(self, conn, webentity_id, outformat="json", include_frontier=False):
        if outformat == "gexf":
            print "... GEXF nodelinks network not implemented yet."
            pass
        client = conn.client
        s = time.time()
        print "Generating %s nodelinks network for webentity %s ..." % (outformat, webentity_id)
        links = yield client.getWebentityNodeLinks(webentity_id, include_frontier)
        res = [[l.sourceLRU, l.targetLRU, l.weight] for l in links]
        print "... JSON network generated in "+str(time.time()-s)
        defer.returnValue(res)

def test_connexions():
    try:
        run = Core()
        # clean possible previous crash
        update_ids = [job['_id'] for job in run.db[config['mongo-scrapy']['jobListCol']].find({'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'])]
        if len(update_ids):
            run.db[config['mongo-scrapy']['jobListCol']].update({'_id' : {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}}, multi=True)
            jobslog(update_ids, "INDEX_"+indexing_statuses.BATCH_CRASHED, run.db)
    except Exception as x:
        if config['DEBUG']:
            print x
        else:
            print "ERROR: Cannot connect to mongoDB, please check your server and the configuration in config.json."
        return None
    try:
        transport = TSocket.TSocket(config['memoryStructure']['thrift.IP'], config['memoryStructure']['thrift.port']).open()
# TODO: run via core ping on mem struct
    except Thrift.TException as x:
        print "ERROR: Cannot connect to lucene memory structure through thrift, please check your server and the configuration in config.json."
        if config['DEBUG']:
            print x
        return None
    try:
        run.store.ensureDefaultCreationRuleExists()
    except Exception as x:
        print "ERROR: Cannot save default web entity into memory structure."
        if config['DEBUG']:
            print x
    try:
        res = json.loads(urllib.urlopen("%slistprojects.json" % run.crawler.scrapy_url).read())
    except Exception as x:
        print "ERROR: Cannot connect to scrapyd server, please check your server and the configuration in config.json."
        if config['DEBUG']:
            print x
        return None
    if "projects" not in res or config['mongo-scrapy']['project'] not in res['projects']:
        print "ERROR: Project's spider does not exist in scrapyd server, please run bin/deploy_scrapy_spider.sh."
        print res
        return None
    return run

core = test_connexions()
if not core:
    exit()

# JSON-RPC interface
core.putSubHandler('crawl', core.crawler)
core.putSubHandler('store', core.store)
core.putSubHandler('system', Introspection(core))

# start JSON-RPC server with twisted
application = service.Application("Example JSON-RPC Server")
site = server.Site(core)
server = internet.TCPServer(config['twisted']['port'], site)
server.setServiceParent(application)
