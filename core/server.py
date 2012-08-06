import sys, time, pymongo, bson, urllib, urllib2, random, types
import simplejson as json
from datetime import datetime
from txjsonrpc.netstring import jsonrpc
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

config = config_hci.load_config()
if not config:
    exit()

class Enum(set) :
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

def assemble_urls(urls) :
    if not isinstance(urls, types.ListType) :
        return urls
    return ','.join([url for url in filter(lambda x : x, urls)])

def convert_urls_to_lrus(urls) :
    return [lru.url_to_lru(url) for url in urls.split(',')]

class Core(jsonrpc.JSONRPC):

    addSlash = True
    db = pymongo.Connection(config['mongoDB']['host'])[config['mongoDB']['db']]

    def __init__(self) :
        jsonrpc.JSONRPC.__init__(self)
        self.crawler = Crawler(self.db)
        self.store = Memory_Structure(self.db)

    def jsonrpc_reinitialize(self) :
        self.db[config['mongoDB']['jobListCol']].insert({'_id': 0})
        self.db[config['mongoDB']['jobListCol']].remove({'_id': 0})
        self.crawler.jsonrpc_reinitialize()
        self.store.jsonrpc_reinitialize()
        return dict(code = 'success', mssg = 'Memory structure and crawling database contents emptied')

    def jsonrpc_refreshjobs(self) :
        scrappyjobs = self.crawler.jsonrpc_list()
        if 'code' in scrappyjobs :
            return scrappyjobs
        # update jobs crawling status accordingly to crawler's statuses
        running_ids = [job['id'] for job in scrappyjobs['running']]
        self.db[config['mongoDB']['jobListCol']].update({'_id': {'$in': running_ids}, 'crawling_status': crawling_statuses.PENDING}, {'$set': {'crawling_status': crawling_statuses.RUNNING}, '$push': {'log': jobslog("CRAWL_"+crawling_statuses.RUNNING)}}, multi=True)
        finished_ids = [job['id'] for job in scrappyjobs['finished']]
        self.db[config['mongoDB']['jobListCol']].update({'_id': {'$in': finished_ids}, 'crawling_status': {'$nin': [crawling_statuses.CANCELED, crawling_statuses.FINISHED]}}, {'$set': {'crawling_status': crawling_statuses.FINISHED}, '$push': {'log': jobslog("CRAWL_"+crawling_statuses.FINISHED)}}, multi=True)
        # collect list of crawling jobs whose outputs is not fully indexed yet
        jobs_in_queue = self.db[config['mongoDB']['queueCol']].distinct('_job')
        # set index finished for jobs with crawling finished and no page left in queue
        self.db[config['mongoDB']['jobListCol']].update({'_id': {'$in': list(set(finished_ids)-set(jobs_in_queue))}, 'crawling_status': crawling_statuses.FINISHED, 'indexing_statuses': {'$ne': indexing_statuses.FINISHED}}, {'$set': {'indexing_status': indexing_statuses.FINISHED}, '$push': {'log': jobslog("INDEX_"+indexing_statuses.FINISHED)}}, multi=True)
        return dict(code='success', jobs = self.jsonrpc_listjobs())

    def jsonrpc_listjobs(self) :
        return list(self.db[config['mongoDB']['jobListCol']].find(sort=[('crawling_status', pymongo.ASCENDING), ('indexing_status', pymongo.ASCENDING), ('timestamp', pymongo.ASCENDING)]))

class Crawler(jsonrpc.JSONRPC):
    """
    An example object to be published.
    """

    scrappy_url = 'http://%s:%s/' % (config['scrapyd']['host'], config['scrapyd']['port'])

# TODO : handle corpuses with local db listing per corpus jobs/statuses

    def __init__(self, db=None) :
        jsonrpc.JSONRPC.__init__(self)
        if db is None :
            db = pymongo.Connection(config['mongoDB']['host'])[config['mongoDB']['db']]
        self.db = db

    def send_scrappy_query(self, action, arguments) :
        url = self.scrappy_url+action+".json"
        if action == 'listjobs' :
            url += '?'+'&'.join([par+'='+val for (par,val) in arguments])
            req = urllib2.Request(url)
        else :
            data = urllib.urlencode(arguments)
            req = urllib2.Request(url, data)
        #print "Crawler API call : ", url, " / ", arguments
        try :
            response = urllib2.urlopen(req)
            result = json.loads(response.read())
            return result
        except urllib2.URLError as e :
            return dict(code = 'fail', message = 'Could not contact scrapyd server, maybe it\'s not started...')
        except Exception as e :
            return dict(code = 'fail', message = e)

    def jsonrpc_starturls(self, starts, follow_prefixes, nofollow_prefixes, discover_prefixes, maxdepth=config['scrapyd']['maxdepth'], download_delay=config['scrapyd']['download_delay'], corpus='') :
        return self.jsonrpc_start(starts, convert_urls_to_lrus(follow_prefixes), convert_urls_to_lrus(nofollow_prefixes), convert_urls_to_lrus(discover_prefixes), maxdepth, download_delay, corpus)

    def jsonrpc_start(self, starts, follow_prefixes, nofollow_prefixes, discover_prefixes, maxdepth=config['scrapyd']['maxdepth'], download_delay=config['scrapyd']['download_delay'], corpus='') :
        # Choose random user agent for each crawl
        print starts, follow_prefixes, discover_prefixes
        agents = ["Mozilla/2.0 (compatible; MSIE 3.0B; Win32)","Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.4; en-US; rv:1.9b5) Gecko/2008032619 Firefox/3.0b5","Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; bgft)","Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; iOpus-I-M)","Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.19 (KHTML, like Gecko) Chrome/0.2.153.1 Safari/525.19","Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.19 (KHTML, like Gecko) Chrome/0.2.153.1 Safari/525.19"]
        # preparation of the request to scrapyd
        values = [('project', config['scrapyd']['project']),
                  ('spider', 'pages'),
                  ('setting' , 'DOWNLOAD_DELAY=' + str(download_delay)),
                  ('maxdepth', maxdepth),
                  ('start_urls', assemble_urls(starts)),
                  ('follow_prefixes', assemble_urls(follow_prefixes)),
                  ('nofollow_prefixes', assemble_urls(nofollow_prefixes)),
                  ('discover_prefixes', assemble_urls(discover_prefixes)),
                  ('user_agent', agents[random.randint(0, len(agents) - 1)])]
        res = self.send_scrappy_query('schedule', values)
        if 'jobid' in res :
            ts = time.time()
            self.db[config['mongoDB']['jobListCol']].update({'_id': res['jobid']}, {'$set': {'label': assemble_urls(starts), 'crawling_status': crawling_statuses.PENDING, 'indexing_status': indexing_statuses.PENDING, 'timestamp': ts, 'log': [jobslog("CRAWL_ADDED", ts)]}}, upsert=True)
        return res

    def jsonrpc_cancel(self, job_id) :
        print "Cancel crawl : ", job_id
        values = [('project' , config['scrapyd']['project']),
                  ('job' , job_id),]
        res = self.send_scrappy_query('cancel', values)
        if 'prevstate' in res :
            self.db[config['mongoDB']['jobListCol']].update({'_id': job_id}, {'$set': {'crawling_status': crawling_statuses.CANCELED}, '$push': {'log': jobslog("CRAWL_".crawling_statuses.CANCELED)}})
        return res

    def jsonrpc_list(self) :
        values = [('project', config['scrapyd']['project'])]
        return self.send_scrappy_query('listjobs', values)

    #TODO
    def jsonrpc_list_corpus(self, corpus='') :
        return self.jsonrpc_list()

    def jsonrpc_reinitialize(self, corpus='') :
        print "Empty crawl list + mongodb queue"
        list_jobs = self.jsonrpc_list()
        for item in list_jobs['running'] + list_jobs['pending'] :
            print self.jsonrpc_cancel(item['id'])
        self.db[config['mongoDB']['queueCol']].remove(safe=True)
        self.db[config['mongoDB']['pageStoreCol']].remove(safe=True)
        self.db[config['mongoDB']['jobListCol']].remove(safe=True)
        return dict(code = 'success', message = 'Crawling database reset')

    def jsonrpc_monitor(self) :
        list_jobs = self.jsonrpc_list()
        return dict(code = 'success', running = len(list_jobs['running']), pending = len(list_jobs['pending']), finished = len(list_jobs['finished']))

class Memory_Structure(jsonrpc.JSONRPC):

    def __init__(self, db=None) :
        jsonrpc.JSONRPC.__init__(self)
        self.mem_struct_conn = ClientCreator(reactor, TTwisted.ThriftClientProtocol, ms.Client, TBinaryProtocol.TBinaryProtocolFactory()).connectTCP(config['memoryStructure']['IP'], config['memoryStructure']['port'])
        if db is None :
            db = pymongo.Connection(config['mongoDB']['host'])[config['mongoDB']['db']]
        self.db = db

    def handle_results(self, results) :
        print results
        return dict(code = 'success', message = results)

    def handle_error(self, failure) :
        failure.trap(Exception)
        print failure
        return dict(code = 'fail', message = failure)

    @inlineCallbacks
    def reset(self, conn) :
        print "Empty memory structure content"
        client = conn.client
        yield client.clearIndex()
        yield client.saveWebEntityCreationRule(WebEntityCreationRule(config['defaultWebEntityCreationRule']['regexp'], config['defaultWebEntityCreationRule']['prefix']))

    @inlineCallbacks
    def jsonrpc_reinitialize(self) :
        yield self.mem_struct_conn.addCallback(self.reset)
        defer.returnValue(dict(code = 'success', mssg = 'Memory structure content emptied'))

    def add_page(self, conn, url) :
        client = conn.client
        client.createWebEntity(url, lru.url_to_lru(url))

    @inlineCallbacks
    def jsonrpc_add_pages(self, list_urls_pages, corpus='') :
        for url in list_urls_pages :
            yield self.mem_struct_conn.addCallback(self.add_page, url)
        defer.returnValue(dict(code = 'success', mssg = url+" added as webentity"))

    @inlineCallbacks
    def index_batch(self, conn, page_items, jobid) :
        client = conn.client
        ids = [bson.ObjectId(str(record['_id'])) for record in page_items]
        page_items.rewind()
        pages, links = processor.generate_cache_from_pages_list(page_items, config["precisionLimit"])
        if (len(pages) > 0) :
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

    def find_next_index_batch(self) :
        job = None
        # check whether indexing is already running or not
        if self.db[config['mongoDB']['jobListCol']].find_one({'indexing_status': indexing_statuses.BATCH_RUNNING}) is None :
            toindex = self.db[config['mongoDB']['queueCol']].distinct('_job')
            # find next job to be indexed and set its indexing status to batch_running
            job = self.db[config['mongoDB']['jobListCol']].find_and_modify(query={'_id': {'$in': toindex}, 'crawling_status': {'$ne': crawling_statuses.PENDING}, 'indexing_status': {'$ne': indexing_statuses.BATCH_RUNNING}}, update={'$set': {'indexing_status': indexing_statuses.BATCH_RUNNING}, '$push': {'log': jobslog("INDEX_"+indexing_statuses.BATCH_RUNNING)}}, sort={'timestamp': pymongo.ASCENDING})
        return job

    @inlineCallbacks
    def index_batch_loop(self) :
        job = self.find_next_index_batch()
        if job is not None :
            print "Indexing : "+job['_id']
            page_items = self.db[config['mongoDB']['queueCol']].find({'_job': job['_id']})
            if page_items.count() > 0 :
                conn = ClientCreator(reactor, TTwisted.ThriftClientProtocol, ms.Client, TBinaryProtocol.TBinaryProtocolFactory()).connectTCP(config['memoryStructure']['IP'], config['memoryStructure']['port'])
                yield conn.addCallback(self.index_batch, page_items, job['_id']).addErrback(self.handle_index_error)

    def handle_index_error(self, failure) :
        self.db[config['mongoDB']['jobListCol']].update({'indexing_status': indexing_statuses.BATCH_RUNNING}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}, '$push': {'log': jobslog("INDEX_"+indexing_statuses.BATCH_CRASHED)}}, multi=True)
        failure.trap(Exception)
        print failure
        return dict(code = 'fail', message = failure)

    @inlineCallbacks
    def update_webentities_links(self, conn):                   
        s=time.time()                   
        print "Generating links between web entites ..."        
        yield client.generateWebEntityLinks()
        print "... processed webentity links in "+str(time.time()-s)+" ..."
        s=time.time()
        yield self.get_gexf_network(conn)
        print "... GEXF network generated in "+str(time.time()-s)

    def get_webentities(self, conn):
        client = conn.client
        return client.getWebEntities()

    @inlineCallbacks
    def jsonrpc_get_webentities(self, corpus='') :
        WEs = yield self.mem_struct_conn.addCallback(self.get_webentities).addErrback(self.handle_error)
        if WEs is not None :
            a = [we.name for we in WEs]
        defer.returnValue(dict(code = 'success', mssg = a))

    def jsonrpc_get_webentity_pages(self, webentity, corpus='') :
        return True

    def jsonrpc_get_webentity_network(self) :
        self.mem_struct_conn.addCallback(self.update_webentities_links)
        self.mem_struct_conn.addCallback(self.get_gexf_network)
        return dict(code = 'success', mssg = 'GEXF graph generation started...')

    @inlineCallbacks
    def update_webentities_links(self, conn):                   
        client = conn.client
        s=time.time()                   
        print "Generating links between web entities ..."        
        yield client.generateWebEntityLinks()
        print "... processed webentity links in "+str(time.time()-s)+" ..."
        s=time.time()
        #yield self.get_gexf_network(client)
        #print "... GEXF network generated in "+str(time.time()-s)

    @inlineCallbacks
    def get_gexf_network(self, client) :
        WEs = yield client.getWebEntities()
        WEs_metadata = dict()
        for WE in WEs :
            if WE.lastModificationDate is not None :
                date = WE.lastModificationDate
            elif WE.creationDate is not None :
                date = WE.creationDate
            else :
                date = ''
            pages = yield client.getPagesFromWebEntityFromImplementation(WE.id, "PAUL")
            WEs_metadata[WE.id] = {"name": WE.name, "date": date, "LRUset": ",".join(WE.LRUSet), "nb_pages": len(pages), "nb_intern_links": 0}
            links = yield client.findWebEntityLinksBySource(WE.id)
            for link in links :
                if link.targetId == WE.id:
                    WEs_metadata[WE.id]['nb_intern_links'] = link.weight
        links = yield client.getWebEntityLinks()
        s=time.time()
        gexf.write_WEs_network_from_MS(links, WEs_metadata, 'test_welinks.gexf')
        print "Graph saved in test_welinks.gexf in "+str(time.time()-s)


# JSON-RPC interface
factory = jsonrpc.RPCFactory(Core)
factory.putSubHandler('crawl', Crawler)
factory.putSubHandler('store', Memory_Structure)
factory.addIntrospection()

# start JSON-RPC server with twisted
server = internet.TCPServer(config['twisted']['port'], factory)
application = service.Application("Example JSON-RPC Server")
server.setServiceParent(application)
defer.setDebugging(True)
run = Core()
# clean possible crash
run.db[config['mongoDB']['jobListCol']].update({'indexing_status': indexing_statuses.BATCH_RUNNING}, {'$set': {'indexing_status': indexing_statuses.BATCH_CRASHED}, '$push': {'log': jobslog("INDEX_"+indexing_statuses.BATCH_CRASHED)}}, multi=True)
# launch daemon loops to monitor jobs and index them
monitor_loop = task.LoopingCall(run.jsonrpc_refreshjobs).start(2,False)
index_loop = task.LoopingCall(run.store.index_batch_loop).start(5,False)

