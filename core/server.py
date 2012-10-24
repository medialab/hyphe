# -*- coding: utf-8 -*-
import sys, time, pymongo, bson, urllib, urllib2, random, types
import json
from datetime import datetime
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
crawling_statuses = Enum(['PENDING', 'RUNNING', 'FINISHED', 'CANCELED'])
indexing_statuses = Enum(['PENDING', 'BATCH_RUNNING', 'BATCH_FINISHED', 'BATCH_CRASHED', 'FINISHED'])

def jobslog(jobid, msg, db, timestamp=None):
    if timestamp is None:
        timestamp = datetime.fromtimestamp(time.time())
    if isinstance(jobid, types.ListType):
        return db[config['mongo-scrapy']['jobLogsCol']].insert([{'_job': id, 'timestamp': timestamp, 'log': msg} for id in jobid])
    return db[config['mongo-scrapy']['jobLogsCol']].insert({'_job': jobid, 'timestamp': timestamp, 'log': msg})

def assemble_urls(urls):
    if not isinstance(urls, types.ListType):
        return urls
    return ','.join([url for url in filter(lambda x : x, urls)])

def convert_urls_to_lrus_array(urls):
    if not isinstance(urls, types.ListType):
        return [lru.url_to_lru_clean(url) for url in urls.split(',')]
    return [lru.url_to_lru_clean(url) for url in urls]

def getThriftConn():
    return ClientCreator(reactor, TTwisted.ThriftClientProtocol, ms.Client, TBinaryProtocol.TBinaryProtocolFactory()).connectTCP(config['memoryStructure']['thrift.IP'], config['memoryStructure']['thrift.port'])

class Core(jsonrpc.JSONRPC):

    addSlash = True

    def render(self, request):
        request.setHeader("Access-Control-Allow-Origin", "*")
        return jsonrpc.JSONRPC.render(self, request)

    def __init__(self):
        jsonrpc.JSONRPC.__init__(self)
        self.db = pymongo.Connection(config['mongo-scrapy']['host'],config['mongo-scrapy']['mongo_port'])[config['mongo-scrapy']['project']]
        self.crawler = Crawler(self.db)
        self.store = Memory_Structure(self.db)
        self.crawler.initDBindexes()
        self.monitor_loop = task.LoopingCall(self.jsonrpc_refreshjobs).start(1,False)

    def jsonrpc_ping(self):
        return {'code': 'success', 'result': 'pong'}

    def jsonrpc_reinitialize(self):
        """Reinitializes both crawl jobs and memory structure."""
        self.crawler.jsonrpc_reinitialize()
        self.store.jsonrpc_reinitialize()
        return {'code': 'success', 'result': 'Memory structure and crawling database contents emptied'}

    @inlineCallbacks
    def jsonrpc_crawl_webentity(self, webentity_id, maxdepth=None):
        """Tells scrapy to run crawl on a webentity defined by its id from memory structure."""
        if not maxdepth:
            maxdepth = config['mongo-scrapy']['maxdepth']
        mem_struct_conn = getThriftConn()
        WE = yield mem_struct_conn.addCallback(self.store.get_webentity_with_pages_and_subWEs, webentity_id)
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
    def jsonrpc_declare_webentity_by_lruprefix(self, lru_prefix, corpus=''):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.store.declare_webentity_by_lruprefix, lru_prefix).addErrback(self.store.handle_error)
        defer.returnValue(res)

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
        defer.returnValue({'code': 'success', 'result': res})

class Crawler(jsonrpc.JSONRPC):

    scrapy_url = 'http://%s:%s/' % (config['mongo-scrapy']['host'], config['mongo-scrapy']['scrapy_port'])

# TODO : handle corpuses with local db listing per corpus jobs/statuses

    def __init__(self, db=None):
        jsonrpc.JSONRPC.__init__(self)
        if db is None:
            db = pymongo.Connection(config['mongo-scrapy']['host'],config['mongo-scrapy']['mongo_port'])[config['mongo-scrapy']['project']]
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
            ts = time.time()
            jobslog(res['jobid'], "CRAWL_ADDED", self.db, datetime.fromtimestamp(ts))
            resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': res['jobid']}, {'$set': {'webentity_id': webentity_id, 'nb_pages': 0, 'nb_links': 0, 'crawl_arguments': args, 'crawling_status': crawling_statuses.PENDING, 'indexing_status': indexing_statuses.PENDING, 'timestamp': ts}}, upsert=True, safe=True)
            if (resdb['err']):
                print "ERROR saving crawling job %s in database for webentity %s with arguments %s" % (res['jobid'], webentity_id, args), resdb
                return {'code': 'fail', 'message': resdb}
        return res

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
        return res

    def jsonrpc_list(self):
        """Calls Scrappy monitoring API, returns list of scrapy jobs."""
        return self.send_scrapy_query('listjobs', {'project': config['mongo-scrapy']['project']})

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
        self.db[config['mongo-scrapy']['jobLogsCol']].ensure_index([('_job', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)], safe=True)
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
            return {'code': 'fail', 'result': 'Error while resetting mongoDB.'}
        return {'code': 'success', 'result': 'Crawling database reset.'}


class Memory_Structure(jsonrpc.JSONRPC):

    def __init__(self, db=None):
        jsonrpc.JSONRPC.__init__(self)
        if db is None:
            db = pymongo.Connection(config['mongo-scrapy']['host'], config['mongo-scrapy']['mongo_port'])[config['mongo-scrapy']['project']]
        self.db = db
        self.index_loop = task.LoopingCall(self.index_batch_loop).start(1,False)

    def handle_results(self, results):
        print results
        return {'code': 'success', 'result': results}

    def handle_error(self, failure):
        print failure
        return {'code': 'fail', 'message': failure.getErrorMessage()}

    def format_webentity(self, WE, jobs=None):
        if WE:
            res = {'id': WE.id, 'name': WE.name, 'lru_prefixes': list(WE.LRUSet), 'creation_date': WE.creationDate, 'last_modification_date': WE.lastModificationDate}
            #pages = yield client.getPagesFromWebEntityFromImplementation(WE.id, "PAUL")
            # nb_pages = len(pages)
            # nb_links, tags, WEstatus
            job = self.db[config['mongo-scrapy']['jobListCol']].find_one({'webentity_id': WE.id}, sort=[('timestamp', pymongo.DESCENDING)])
            if job:
                res['crawling_status'] = job['crawling_status']
                res['indexing_status'] = job['indexing_status']
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
        res = yield mem_struct_conn.addCallback(self.reset).addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def declare_webentity_by_lruprefix(self, conn, lru_prefix):
        client = conn.client
        res = []
        l = lru.cleanLRU(lru_prefix)
        try:
            we = yield client.createWebEntity(lru.lru_to_url_short(l), [l])
            msg = "%s added as webentity %s" % (url, we.name)
        except MemoryStructureException as e:
            msg = "ERROR adding %s: %s" % (url, e.msg)
        except Exception as e:
            msg = "ERROR adding %s: %s" % (url, e)
        res.append(msg)
        defer.returnValue(self.handle_results(res))

    @inlineCallbacks
    def declare_page(self, conn, url):
        client = conn.client
        l = lru.url_to_lru_clean(url)
        t = str(time.time())
        is_node = lru.isLRUNode(l, config["precisionLimit"])
        page = PageItem("%s/%s" % (l, t), url, l, t, None, -1, None, ['USER'], False, is_node, {})
        cache_id = yield client.createCache([page])
        yield client.indexCache(cache_id)
        new = yield client.createWebEntities(cache_id)
        WE = yield client.findWebEntityByLRU(l)
        WE = self.format_webentity(WE)
        WE['created'] = True if new else False
        defer.returnValue(WE)

    @inlineCallbacks
    def rename_webentity(self, conn, webentity_id, new_name):
        client = conn.client
        WE = yield client.getWebEntity(webentity_id)
        WE.name = new_name
        res = yield client.updateWebEntity(WE)
        defer.returnValue("Webentity %s renamed as %s" % (res, new_name))

    @inlineCallbacks
    def jsonrpc_rename_webentity(self, webentity_id, new_name):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.rename_webentity, webentity_id, new_name).addErrback(self.handle_error)
        defer.returnValue(self.handle_results(res))

    @inlineCallbacks
    def setalias(self, conn, old_webentity_id, gd_webentity_id):
        client = conn.client
        #WE = yield client.addAliadtoWebEntity(webentity_id)
        #WE = yield client.getWebEntity(webentity_id)
        pass

    @inlineCallbacks
    def jsonrpc_setalias(self, old_webentity_id, good_webentity_id):
        res = yield self.setalias(old_webentity_id, gd_webentity_id)
        defer.returnValue(self.handle+results(res))

    @inlineCallbacks
    def index_batch(self, conn, page_items, jobid):
        client = conn.client
        ids = [bson.ObjectId(str(record['_id'])) for record in page_items]
        if (len(ids) > 0):
            page_items.rewind()
            pages, links = processor.generate_cache_from_pages_list(page_items, config["precisionLimit"])
            s=time.time()
            cache_id = yield client.createCache(pages.values())
            print "Indexing pages, links and webentities from cache "+cache_id+" ..."
            nb_pages = yield client.indexCache(cache_id)
            print "... "+str(nb_pages)+" pages indexed in "+str(time.time()-s)+" ..."
            s=time.time()
            nb_links = len(links)
            for link_list in [links[i:i+config['memoryStructure']['max_simul_links_indexing']] for i in range(0, nb_links, config['memoryStructure']['max_simul_links_indexing'])]:
                s2=time.time()
                yield client.saveNodeLinks([NodeLink("id",source,target,weight) for source,target,weight in link_list])
            print "... "+str(nb_links)+" links indexed in "+str(time.time()-s)+" ..."
            s=time.time()
            n_WE = yield client.createWebEntities(cache_id)
            print "... %s web entities created in %s" % (n_WE, str(time.time()-s))
            resdb = self.db[config['mongo-scrapy']['queueCol']].remove({'_id': {'$in': ids}}, safe=True)
            if (resdb['err']):
                print "ERROR cleaning queue in database for job %s" % jobid, resdb
                return
            res = self.db[config['mongo-scrapy']['jobListCol']].find_and_modify({'_id': jobid}, update={'$inc': {'nb_pages': nb_pages, 'nb_links': nb_links}, '$set': {'indexing_status': indexing_statuses.BATCH_FINISHED}})
            if not res:
                print "ERROR updating job %s" % jobid
                return
            jobslog(jobid, "INDEX_"+indexing_statuses.BATCH_FINISHED, self.db)

    def find_next_index_batch(self):
        jobid = None
        oldest_page_in_queue = self.db[config['mongo-scrapy']['queueCol']].find_one(sort=[('timestamp', pymongo.ASCENDING)], fields=['_job'])
        # if page to index in queue, check whether indexing is already running or not
        if oldest_page_in_queue:
            if not self.db[config['mongo-scrapy']['jobListCol']].find_one({'indexing_status': indexing_statuses.BATCH_RUNNING}):
                # find next job to be indexed and set its indexing status to batch_running
                job = self.db[config['mongo-scrapy']['jobListCol']].find_one({'_id': oldest_page_in_queue['_job'], 'crawling_status': {'$ne': crawling_statuses.PENDING}, 'indexing_status': {'$ne': indexing_statuses.BATCH_RUNNING}}, fields=['_id'], sort=[('timestamp', pymongo.ASCENDING)])
                jobid = job['_id']
        return jobid

    @inlineCallbacks
    def index_batch_loop(self):
        jobid = self.find_next_index_batch()
        if jobid:
            print "Indexing : "+jobid
            page_items = self.db[config['mongo-scrapy']['queueCol']].find({'_job': jobid}, limit=config['memoryStructure']['max_simul_pages_indexing'], sort=[('timestamp', pymongo.ASCENDING)])
            if (page_items.count()) > 0:
                resdb = self.db[config['mongo-scrapy']['jobListCol']].update({'_id': jobid}, {'$set': {'indexing_status': indexing_statuses.BATCH_RUNNING}}, safe=True)
                if (resdb['err']):
                    print "ERROR updating job %s's indexing status" % jobid, resdb
                    return
                jobslog(jobid, "INDEX_"+indexing_statuses.BATCH_RUNNING, self.db)
                conn = getThriftConn()
                yield conn.addCallback(self.index_batch, page_items, jobid).addErrback(self.handle_index_error)
            else:
                print "WARNING : job %s found for index but no page corresponding found in queue."

    def handle_index_error(self, failure):
        update_ids = [job['_id'] for job in self.db[config['mongo-scrapy']['jobListCol']].find({'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'])]
        if len(update_ids):
            self.db[config['mongo-scrapy']['jobListCol']].update({'_id' : {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}}, multi=True)
            jobslog(update_ids, "INDEX_"+indexing_statuses.BATCH_CRASHED, self.db)
        failure.trap(Exception)
        print failure
        return {'code': 'fail', 'message': failure}

    @inlineCallbacks
    def jsonrpc_get_webentities(self, corpus=''):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.get_webentities).addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def get_webentities(self, conn):
        client = conn.client
        WEs = yield client.getWebEntities()
        res = []
        if WEs:
            for WE in WEs:
                res.append(self.format_webentity(WE))
        defer.returnValue({'code': 'success', 'result': res})

    @inlineCallbacks
    def jsonrpc_get_nodelinks(self, corpus=''):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.get_nodelinks).addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def get_nodelinks(self, conn):
        client = conn.client
        WEs = yield client.getNodeLinks()
        defer.returnValue({'code': 'success', 'result': [{'source': l.sourceLRU, 'target': l.targetLRU} for l in WEs]})

    @inlineCallbacks
    def jsonrpc_get_webentity_pages(self, webentity_id, corpus=''):
        mem_struct_conn = getThriftConn()
        pages = yield mem_struct_conn.addCallback(self.get_webentity_pages, webentity_id).addErrback(self.handle_error)
        defer.returnValue({"code": 'success', "result": [p.lru for p in pages]})
#        defer.returnValue({"code": 'success', "result": [{'lru': p.lru, 'sources': list(p.sourceSet), 'crawlTimestamp': p.crawlerTimestamp, 'url': p.url, 'depth': p.depth, 'error': p.errorCode, 'HTTPstatus': p.httpStatusCode} for p in pages]})

    def get_webentity_pages(self, conn, webentity_id):
        client = conn.client
        return client.getPagesFromWebEntityFromImplementation(webentity_id, "PAUL")

    @inlineCallbacks
    def jsonrpc_get_webentity_by_url(self, url):
        mem_struct_conn = getThriftConn()
        l = lru.url_to_lru_clean(url)
        WE = yield mem_struct_conn.addCallback(self.get_webentity_by_lru, l).addErrback(self.handle_error)
        if isinstance(WE, dict):
            defer.returnValue({"code": 'fail', "result": "No webentity found in memory Structure for %s" % url})
        defer.returnValue({"code": 'success', "result": self.format_webentity(WE)})

    def get_webentity_by_lru(self, conn, l):
        client = conn.client
        return client.findWebEntityByLRU(l)

    def jsonrpc_get_webentities_network(self):
        mem_struct_conn = getThriftConn()
        mem_struct_conn.addCallback(self.update_WE_links_and_generate_gexf).addErrback(self.handle_error)
        return {'code': 'success', 'result': 'GEXF graph generation started...'}

    @inlineCallbacks
    def get_webentity_with_pages_and_subWEs(self, conn, webentity_id):
        client = conn.client
        WE = yield client.getWebEntity(webentity_id)
        if not WE:
            raise Exception("No webentity with id %s found" % webentity_id)
        res = {'lrus': list(WE.LRUSet), 'pages': [lru.lru_to_url(lr) for lr in WE.LRUSet], 'subWEs': []}
        pages = yield client.getPagesFromWebEntityFromImplementation(WE.id, "PAUL")
        if pages:
            res['pages'] = [lru.lru_to_url(p.lru) for p in pages]
        subs = yield client.getSubWebEntities(WE.id)
        if subs:
            res['subWEs'] = [lr for subwe in subs for lr in subwe.LRUSet]
        defer.returnValue(res)

    @inlineCallbacks
    def update_WE_links_and_generate_gexf(self, conn):
        client = conn.client
        s = time.time()
        print "Generating links between web entities ..."
        yield client.generateWebEntityLinks()
        print "... processed webentity links in "+str(time.time()-s)+" ..."
        s = time.time()
        print "... generating GEXF entities network ..."
        WEs = yield client.getWebEntities()
        WEs_metadata = {}
        for WE in WEs:
            date = ''
            if WE.lastModificationDate:
                date = WE.lastModificationDate
            elif WE.creationDate:
                date = WE.creationDate
            pages = yield client.getPagesFromWebEntityFromImplementation(WE.id, "PAUL")
            WEs_metadata[WE.id] = {"name": WE.name, "date": date, "LRUset": ",".join(WE.LRUSet), "nb_pages": len(pages), "nb_intern_links": 0}
            links = yield client.findWebEntityLinksBySource(WE.id)
            for link in links:
                if link.targetId == WE.id:
                    WEs_metadata[WE.id]['nb_intern_links'] = link.weight
        links = yield client.getWebEntityLinks()
        gexf.write_WEs_network_from_MS(links, WEs_metadata, 'test_welinks.gexf')
        print "... GEXF network generated in test_welinks.gexf in "+str(time.time()-s)

def test_connexions():
    try:
        run = Core()
        # clean possible previous crash
        update_ids = [job['_id'] for job in run.db[config['mongo-scrapy']['jobListCol']].find({'indexing_status': indexing_statuses.BATCH_RUNNING}, fields=['_id'])]
        if len(update_ids):
            run.db[config['mongo-scrapy']['jobListCol']].update({'_id' : {'$in': update_ids}}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}}, multi=True)
            jobslog(update_ids, "INDEX_"+indexing_statuses.BATCH_CRASHED, run.db)
    except:
        print "ERROR: Cannot connect to mongoDB, please check your server and the configuration in config.json."
        return None
    try:
        transport = TSocket.TSocket(config['memoryStructure']['thrift.IP'], config['memoryStructure']['thrift.port']).open()
# TODO: run via core ping on mem struct
    except Thrift.TException:
        print "ERROR: Cannot connect to lucene memory structure through thrift, please check your server and the configuration in config.json."
        return None
    try:
        run.store.ensureDefaultCreationRuleExists()
    except:
        print "ERROR: Cannot save default web entity into memory structure."
    try:
        res = json.loads(urllib.urlopen("%slistprojects.json" % run.crawler.scrapy_url).read())
    except:
        print "ERROR: Cannot connect to scrapyd server, please check your server and the configuration in config.json."
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
