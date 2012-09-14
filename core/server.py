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
from thrift.transport import TTwisted
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

def jobslog(msg, timestamp=None):
    if timestamp is None:
        timestamp = time.time()
    return "%s: %s" % (datetime.fromtimestamp(timestamp), msg)

def assemble_urls(urls):
    if not isinstance(urls, types.ListType):
        return urls
    return ','.join([url for url in filter(lambda x : x, urls)])

def convert_urls_to_lrus_array(urls):
    if not isinstance(urls, types.ListType):
        return [lru.url_to_lru_clean(url) for url in urls.split(',')]
    return [lru.url_to_lru_clean(url) for url in urls]

def getThriftConn():
    return ClientCreator(reactor, TTwisted.ThriftClientProtocol, ms.Client, TBinaryProtocol.TBinaryProtocolFactory()).connectTCP(config['memoryStructure']['IP'], config['memoryStructure']['port'])

class Core(jsonrpc.JSONRPC):

    addSlash = True
    db = pymongo.Connection(config['mongoDB']['host'])[config['mongoDB']['db']]

    def render(self, request):
        request.setHeader("Access-Control-Allow-Origin", "*")
        return jsonrpc.JSONRPC.render(self, request)

    def __init__(self):
        jsonrpc.JSONRPC.__init__(self)
        self.crawler = Crawler(self.db)
        self.store = Memory_Structure(self.db)

    def jsonrpc_ping(self):
        return {'code': 'success', 'result': 'pong'}

    def jsonrpc_reinitialize(self):
        """Reinitializes both crawl jobs and memory structure."""
        self.db[config['mongoDB']['jobListCol']].insert({'_id': 0})
        self.db[config['mongoDB']['jobListCol']].remove({'_id': 0})
        self.crawler.jsonrpc_reinitialize()
        self.store.jsonrpc_reinitialize()
        return {'code': 'success', 'result': 'Memory structure and crawling database contents emptied'}

    @inlineCallbacks
    def jsonrpc_crawl_webentity(self, webentity_id):
        """Tells scrapy to run crawl on a webentity defined by its id from memory structure."""
        mem_struct_conn = getThriftConn()
        WE = yield mem_struct_conn.addCallback(self.get_webentity_with_pages_and_subWEs, webentity_id)
        defer.returnValue(self.jsonrpc_start(WE['pages'], WE['lrus'], WE['subWEs']))

    def jsonrpc_refreshjobs(self):
        """Runs a monitoring task on the list of jobs in the database to update their status from scrapy API and indexing tasks."""
        scrapyjobs = self.crawler.jsonrpc_list()
        if scrapyjobs['code'] == 'fail':
            return scrapyjobs
        scrapyjobs = scrapyjobs['result']
        # update jobs crawling status accordingly to crawler's statuses
        running_ids = [job['id'] for job in scrapyjobs['running']]
        self.db[config['mongoDB']['jobListCol']].update({'_id': {'$in': running_ids}, 'crawling_status': crawling_statuses.PENDING}, {'$set': {'crawling_status': crawling_statuses.RUNNING}, '$push': {'log': jobslog("CRAWL_"+crawling_statuses.RUNNING)}}, multi=True)
        finished_ids = [job['id'] for job in scrapyjobs['finished']]
        self.db[config['mongoDB']['jobListCol']].update({'_id': {'$in': finished_ids}, 'crawling_status': {'$nin': [crawling_statuses.CANCELED, crawling_statuses.FINISHED]}}, {'$set': {'crawling_status': crawling_statuses.FINISHED}, '$push': {'log': jobslog("CRAWL_"+crawling_statuses.FINISHED)}}, multi=True)
        # collect list of crawling jobs whose outputs is not fully indexed yet
        jobs_in_queue = self.db[config['mongoDB']['queueCol']].distinct('_job')
        # set index finished for jobs with crawling finished and no page left in queue
        self.db[config['mongoDB']['jobListCol']].update({'_id': {'$in': list(set(finished_ids)-set(jobs_in_queue))}, 'crawling_status': crawling_statuses.FINISHED, 'indexing_status': {'$ne': indexing_statuses.FINISHED}}, {'$set': {'indexing_status': indexing_statuses.FINISHED}, '$push': {'log': jobslog("INDEX_"+indexing_statuses.FINISHED)}}, multi=True)
        return self.jsonrpc_listjobs()

    def jsonrpc_listjobs(self):
        return {'code': 'success', 'result': list(self.db[config['mongoDB']['jobListCol']].find(sort=[('crawling_status', pymongo.ASCENDING), ('indexing_status', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)]))}

    @inlineCallbacks
    def jsonrpc_add_pages(self, list_urls_pages, corpus=''):
        list_urls = list_urls_pages.split(',')
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.store.add_pages, list_urls).addErrback(self.store.handle_error)
        defer.returnValue(res)


class Crawler(jsonrpc.JSONRPC):

    scrapy_url = 'http://%s:%s/' % (config['scrapyd']['host'], config['scrapyd']['port'])

# TODO : handle corpuses with local db listing per corpus jobs/statuses

    def __init__(self, db=None):
        jsonrpc.JSONRPC.__init__(self)
        if db is None:
            db = pymongo.Connection(config['mongoDB']['host'])[config['mongoDB']['db']]
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

    def jsonrpc_starturls(self, starts, follow_prefixes, nofollow_prefixes, discover_prefixes, maxdepth=config['scrapyd']['maxdepth'], download_delay=config['scrapyd']['download_delay'], corpus=''):
        """Starts a crawl with Scrappy from arguments using only urls."""
        return self.jsonrpc_start(starts, convert_urls_to_lrus_array(follow_prefixes), convert_urls_to_lrus_array(nofollow_prefixes), convert_urls_to_lrus_array(discover_prefixes), maxdepth, download_delay, corpus)

    def jsonrpc_start(self, starts, follow_prefixes, nofollow_prefixes, discover_prefixes=convert_urls_to_lrus_array(config['discoverPrefixes']), maxdepth=config['scrapyd']['maxdepth'], download_delay=config['scrapyd']['download_delay'], corpus=''):
        """Starts a crawl with scrapy from arguments using a list of urls and of lrus for prefixes."""
        # Choose random user agent for each crawl
        agents = ["Mozilla/2.0 (compatible; MSIE 3.0B; Win32)","Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.4; en-US; rv:1.9b5) Gecko/2008032619 Firefox/3.0b5","Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; bgft)","Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; iOpus-I-M)","Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.19 (KHTML, like Gecko) Chrome/0.2.153.1 Safari/525.19","Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.19 (KHTML, like Gecko) Chrome/0.2.153.1 Safari/525.19"]
        # preparation of the request to scrapyd
        args = {'project': config['scrapyd']['project'],
                  'spider': 'pages',
                  'setting': 'DOWNLOAD_DELAY=' + str(download_delay),
                  'maxdepth': maxdepth,
                  'start_urls': assemble_urls(starts),
                  'follow_prefixes': assemble_urls(follow_prefixes),
                  'nofollow_prefixes': assemble_urls(nofollow_prefixes),
                  'discover_prefixes': assemble_urls(discover_prefixes),
                  'user_agent': agents[random.randint(0, len(agents) - 1)]}
        res = self.send_scrapy_query('schedule', args)
        if res['code'] == 'fail':
            return res
        res = res['result']
        if 'jobid' in res:
            ts = time.time()
            self.db[config['mongoDB']['jobListCol']].update({'_id': res['jobid']}, {'$set': {'crawl_arguments': args, 'crawling_status': crawling_statuses.PENDING, 'indexing_status': indexing_statuses.PENDING, 'timestamp': ts, 'log': [jobslog("CRAWL_ADDED", ts)]}}, upsert=True)
        return res

    def jsonrpc_cancel(self, job_id):
        """Cancels a scrapy job with id job_id."""
        print "Cancel crawl : ", job_id
        args = {'project': config['scrapyd']['project'],
                  'job': job_id}
        res = self.send_scrapy_query('cancel', args)
        if res['code'] == 'fail':
            return res
        res = res['result']
        if 'prevstate' in res:
            self.db[config['mongoDB']['jobListCol']].update({'_id': job_id}, {'$set': {'crawling_status': crawling_statuses.CANCELED}, '$push': {'log': jobslog("CRAWL_"+crawling_statuses.CANCELED)}})
        return res

    def jsonrpc_list(self):
        """Calls Scrappy monitoring API, returns list of scrapy jobs."""
        return self.send_scrapy_query('listjobs', {'project': config['scrapyd']['project']})

    def jsonrpc_reinitialize(self, corpus=''):
        """Cancels all current crawl jobs running or planned and empty mongodbs."""
        print "Empty crawl list + mongodb queue"
        list_jobs = self.jsonrpc_list()
        if list_jobs['code'] == 'fail':
            return list_jobs
        list_jobs = list_jobs['result']
        for item in list_jobs['running'] + list_jobs['pending']:
            print self.jsonrpc_cancel(item['id'])
        self.db[config['mongoDB']['queueCol']].remove(safe=True)
        self.db[config['mongoDB']['pageStoreCol']].remove(safe=True)
        self.db[config['mongoDB']['jobListCol']].remove(safe=True)
        return {'code': 'success', 'result': 'Crawling database reset'}


class Memory_Structure(jsonrpc.JSONRPC):

    def __init__(self, db=None):
        jsonrpc.JSONRPC.__init__(self)
        if db is None:
            db = pymongo.Connection(config['mongoDB']['host'])[config['mongoDB']['db']]
        self.db = db

    def handle_results(self, results):
        print results
        return {'code': 'success', 'result': results}

    def handle_error(self, failure):
        print failure
        return {'code': 'fail', 'message': failure.getErrorMessage()}

    def reset(self, conn):
        print "Empty memory structure content"
        client = conn.client
        client.clearIndex()
        client.saveWebEntityCreationRule(WebEntityCreationRule(config['defaultWebEntityCreationRule']['regexp'], config['defaultWebEntityCreationRule']['prefix']))

    @inlineCallbacks
    def jsonrpc_reinitialize(self):
        mem_struct_conn = getThriftConn()
        res = yield mem_struct_conn.addCallback(self.reset).addErrback(self.handle_error)
        defer.returnValue(res)

    @inlineCallbacks
    def add_pages(self, conn, list_urls):
        client = conn.client
        res = []
        for url in list_urls:
            l = lru.url_to_lru_clean(url)
            try:
                #urllib.urlopen(url)
                page = PageItem(lru=l)
                yield client.savePageItems([page])
                we = yield client.createWebEntity(lru.lru_to_url_short(l), [l])
                msg = "%s added as webentity %s" % (url, we.name)
            except MemoryStructureException as e:
                msg = "ERROR adding %s: %s" % (url, e.msg)
            except Exception as e:
                msg = "ERROR adding %s: %s" % (url, e)
            res.append(msg)
        defer.returnValue(self.handle_results(res))

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
    def setalias(self, old_webentity_id, gd_webentity_id):
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
        page_items.rewind()
        pages, links = processor.generate_cache_from_pages_list(page_items, config["precisionLimit"])
        if (len(pages) > 0):
            s=time.time()
            cache_id = yield client.createCache(pages.values())
            print "Indexing pages, links and webentities from cache "+cache_id+" ..."
            nb_pages = yield client.indexCache(cache_id)
            print "... "+str(nb_pages)+" pages indexed in "+str(time.time()-s)+" ..."
            s=time.time()
            yield client.saveNodeLinks([NodeLink("id",source,target,weight) for (source,target),weight in links.iteritems()])
            print "... "+str(len(links))+" links indexed in "+str(time.time()-s)+" ..."
            s=time.time()
            yield client.createWebEntities(cache_id)
            print "... web entities created in "+str(time.time()-s)
            self.db[config['mongoDB']['queueCol']].remove({'_id': {'$in': ids}}, safe=True)
            self.db[config['mongoDB']['jobListCol']].find_and_modify({'_id': jobid}, update={'$set': {'indexing_status': indexing_statuses.BATCH_FINISHED}, '$push': {'log': jobslog("INDEX_"+indexing_statuses.BATCH_FINISHED)}})

    def find_next_index_batch(self):
        job = None
        # check whether indexing is already running or not
        if self.db[config['mongoDB']['jobListCol']].find_one({'indexing_status': indexing_statuses.BATCH_RUNNING}) is None:
            toindex = self.db[config['mongoDB']['queueCol']].distinct('_job')
            # find next job to be indexed and set its indexing status to batch_running
            job = self.db[config['mongoDB']['jobListCol']].find_and_modify(query={'_id': {'$in': toindex}, 'crawling_status': {'$ne': crawling_statuses.PENDING}, 'indexing_status': {'$ne': indexing_statuses.BATCH_RUNNING}}, update={'$set': {'indexing_status': indexing_statuses.BATCH_RUNNING}, '$push': {'log': jobslog("INDEX_"+indexing_statuses.BATCH_RUNNING)}}, sort={'timestamp': pymongo.ASCENDING})
        return job

    @inlineCallbacks
    def index_batch_loop(self):
        job = self.find_next_index_batch()
        if job:
            print "Indexing : "+job['_id']
            page_items = self.db[config['mongoDB']['queueCol']].find({'_job': job['_id']})
            if page_items.count() > 0:
                conn = ClientCreator(reactor, TTwisted.ThriftClientProtocol, ms.Client, TBinaryProtocol.TBinaryProtocolFactory()).connectTCP(config['memoryStructure']['IP'], config['memoryStructure']['port'])
                yield conn.addCallback(self.index_batch, page_items, job['_id']).addErrback(self.handle_index_error)

    def handle_index_error(self, failure):
        self.db[config['mongoDB']['jobListCol']].update({'indexing_status': indexing_statuses.BATCH_RUNNING}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}, '$push': {'log': jobslog("INDEX_"+indexing_statuses.BATCH_CRASHED)}}, multi=True)
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
                #pages = yield client.getPagesFromWebEntityFromImplementation(WE.id, "PAUL")
                res.append({'id': WE.id, 'name': WE.name, 'lru_prefixes': list(WE.LRUSet), 'creation_date': WE.creationDate, 'last_modification_date': WE.lastModificationDate}) #, 'pages_count': len(pages)} #list([p.lru for p in pages])}
        defer.returnValue({'code': 'success', 'result': res})

    @inlineCallbacks
    def jsonrpc_get_webentity_pages(self, webentity_id, corpus=''):
        mem_struct_conn = getThriftConn()
        pages = yield mem_struct_conn.addCallback(self.get_webentity_pages, webentity_id).addErrback(self.handle_error)
        defer.returnValue({"code": 'success', "result": list([str(p.lru) for p in pages])})

    def get_webentity_pages(self, conn, webentity_id):
        client = conn.client
        return client.getPagesFromWebEntityFromImplementation(webentity_id, "PAUL")

    @inlineCallbacks
    def jsonrpc_get_webentities_network(self):
        mem_struct_conn = getThriftConn()
        yield mem_struct_conn.addCallback(self.update_WE_links_and_generate_gexf).addErrback(self.handle_error)
        defer.returnValue({'code': 'success', 'result': 'GEXF graph generation started...'})

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

# JSON-RPC interface
core = Core()
core.putSubHandler('crawl', Crawler(core.db))
core.putSubHandler('store', Memory_Structure(core.db))
core.putSubHandler('system', Introspection(core))

# start JSON-RPC server with twisted
application = service.Application("Example JSON-RPC Server")
site = server.Site(core)
server = internet.TCPServer(config['twisted']['port'], site)
server.setServiceParent(application)

run = Core()
# clean possible crash
run.db[config['mongoDB']['jobListCol']].update({'indexing_status': indexing_statuses.BATCH_RUNNING}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}, '$push': {'log': jobslog("INDEX_"+indexing_statuses.BATCH_CRASHED)}}, multi=True)
# launch daemon loops to monitor jobs and index them
monitor_loop = task.LoopingCall(run.jsonrpc_refreshjobs).start(1,False)
index_loop = task.LoopingCall(run.store.index_batch_loop).start(5,False)

