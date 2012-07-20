import sys, time, pymongo, bson, urllib, urllib2, random
import simplejson as json
from txjsonrpc.netstring import jsonrpc
from twisted.web import server
from twisted.application import service, internet
from twisted.internet import reactor
from twisted.internet.protocol import ClientCreator
from twisted.internet.defer import inlineCallbacks
from thrift import Thrift
from thrift.transport import TTwisted
from thrift.protocol import TBinaryProtocol
sys.path.append('../lib')
import config_hci, lru, gexf
sys.path.append('gen-py.twisted')
from memorystructure import MemoryStructure as ms
from memorystructure.ttypes import *
import processor

config = config_hci.load_config()
if not config:
    exit()

def assemble_urls(urls) :
    return ','.join([url for url in filter(lambda x : x, urls)])

class Core(jsonrpc.JSONRPC):
    addSlash = True

    def __init__(self) :
	jsonrpc.JSONRPC.__init__(self)
	self.crawler = Crawler()
	self.store = Memory_Structure()

    def jsonrpc_echo(self, x):
        """Return all passed args."""
        return x

    def jsonrpc_reinitialize(self) :
	print self.crawler.jsonrpc_reinitialize()
        print self.store.jsonrpc_reinitialize()
        return dict(code = 'success', mssg = 'Memory structure and crawling database contents emptied')

class Crawler(jsonrpc.JSONRPC):
    """
    An example object to be published.
    """

    scrappy_url = 'http://%s:%s/' % (config['scrapyd']['host'], config['scrapyd']['port'])

# TODO : handle corpuses with local db listing per corpus jobs/statuses

    def __init__(self) :
        jsonrpc.JSONRPC.__init__(self)
        self.crawling_db = pymongo.Connection(config['mongoDB']['host'])[config['mongoDB']['db']]

    def send_scrappy_query(self, action, arguments) :
	url = self.scrappy_url+action+".json"
	if action == 'listjobs' :
	    url += '?'+'&'.join([par+'='+val for (par,val) in arguments])
            req = urllib2.Request(url)
	else :
            data = urllib.urlencode(arguments)
            req = urllib2.Request(url, data)
	print "Crawler API call : ", url, " / ", arguments
        try :
            response = urllib2.urlopen(req)
	    result = json.loads(response.read())
            return result
        except urllib2.URLError as e :
            return dict(code = 'fail', message = 'Could not contact scrapyd server, maybe it\'s not started...')
	except Exception as e :
	    return dict(code = 'fail', message = e)

    def jsonrpc_start(self, starts, follow_prefixes, nofollow_prefixes, discover_prefixes, maxdepth=config['scrapyd']['maxdepth'], download_delay=config['scrapyd']['download_delay'], corpus='') :
        # Choose random user agent for each crawl
        agents = ["Mozilla/2.0 (compatible; MSIE 3.0B; Win32)","Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.4; en-US; rv:1.9b5) Gecko/2008032619 Firefox/3.0b5","Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; bgft)","Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; iOpus-I-M)","Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.19 (KHTML, like Gecko) Chrome/0.2.153.1 Safari/525.19","Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/525.19 (KHTML, like Gecko) Chrome/0.2.153.1 Safari/525.19"]
        # preparation of the request to scrapyd
        values = [('project', config['scrapyd']['project']),
                  ('spider', 'pages'),
                  ('setting' , 'DOWNLOAD_DELAY=' + str(download_delay)),
		  ('maxdepth', maxdepth),
                  ('start_urls_', assemble_urls(starts)),
                  ('follow_prefixes', assemble_urls(follow_prefixes)),
                  ('nofollow_prefixes', assemble_urls(nofollow_prefixes)),
                  ('discover_prefixes', assemble_urls(discover_prefixes)),
		  ('user_agent', agents[random.randint(0, len(agents) - 1)])]
        return self.send_scrappy_query('schedule', values)

    def jsonrpc_cancel(self, job_id) :
        print "Cancel crawl : ", job_id
        values = [('project' , config['scrapyd']['project']),
                  ('job' , job_id),]
        return self.send_scrappy_query('cancel', values)

    def jsonrpc_list(self) :
        print "List crawls : "
	values = [('project', config['scrapyd']['project'])]
	return self.send_scrappy_query('listjobs', values)

    #TODO
    def jsonrpc_list_corpus(self, corpus='') :
        print "List crawls for corpus : ", corpus
        return self.jsonrpc_list_crawls()

    def jsonrpc_reinitialize(self, corpus='') :
        print "Empty crawl list + mongodb queue"
	list_jobs = self.jsonrpc_list()
	for item in list_jobs['running'] + list_jobs['pending'] :
	    print self.jsonrpc_cancel(item['id'])
	self.crawling_db[config['mongoDB']['queueCol']].remove(safe=True)
	self.crawling_db[config['mongoDB']['pageStoreCol']].remove(safe=True)
	self.crawling_db[config['mongoDB']['jobListCol']].remove(safe=True)
        return dict(code = 'success', message = 'Crawling database reset')

    def jsonrpc_monitor(self) :
	list_jobs = self.jsonrpc_list()
	return dict(code = 'success', running = len(list_jobs['running']), pending = len(list_jobs['pending']), finished = len(list_jobs['finished']))

class Memory_Structure(jsonrpc.JSONRPC):

    def __init__(self) :
        jsonrpc.JSONRPC.__init__(self)
        self.mem_struct_conn = ClientCreator(reactor, TTwisted.ThriftClientProtocol, ms.Client, TBinaryProtocol.TBinaryProtocolFactory()).connectTCP(config['memoryStructure']['IP'], config['memoryStructure']['port'])
#        self.mem_struct_conn.addCallbacks(callback = self.handle_results, errback = self.handle_error)
	self.crawling_db = pymongo.Connection(config['mongoDB']['host'])[config['mongoDB']['db']]

    def handle_results(self, results) :
        return dict(code = 'success', message = results)

    def handle_error(self, failure) :
        failure.trap(Exception)
        return dict(code = 'fail', message = failure)

    @inlineCallbacks
    def jsonrpc_reinitialize(self) :
	yield self.mem_struct_conn.addCallback(clear_index)
        yield dict(code = 'success', mssg = 'Memory structure content emptied')

    def jsonrpc_add_pages(self, list_urls_pages, corpus='') :
        return True

    @inlineCallbacks
    def jsonrpc_index(self) :
        page_items = self.crawling_db[config['mongoDB']['queueCol']].find()
	ids = [bson.ObjectId(str(record['_id'])) for record in page_items]
        yield self.mem_struct_conn.addCallback(index_pages, page_items)
#	print self.crawling_db[config['mongoDB']['queueCol']].remove({'_id': {'$in': ids}}, safe=True)
#	for _id in ids :
#	    print self.crawling_db[config['mongoDB']['queueCol']].find_and_modify({'_id' : _id}, remove=True, safe=True)
	yield dict(code = 'success', mssg = 'Webentities indexed from mongodb queue')

    @inlineCallbacks
    def jsonrpc_get_webentities(self, corpus='') :
        WEs = yield self.mem_struct_conn.addCallback(list_web_entities, corpus).addErrback(self.handle_error)
        result = dict(code = 'success', list_web_entities = [])
        if WEs is not None:
	    for we in WEs:
                result['list_web_entities'][we.id] = json.dumps(we)
	    print len(WEs)
	yield result

    def jsonrpc_get_webentity_pages(self, webentity, corpus='') :
        return True

    @inlineCallbacks
    def jsonrpc_get_webentity_network(self) :
        yield self.mem_struct_conn.addCallback(get_gexf_network)
	yield dict(code = 'success', mssg = 'GEXF graph generated')

#.addCallbacks(callback = self.handle_results, errback = self.handle_error)

@inlineCallbacks
def clear_index(conn) :
    print "Empty memory structure content"
    client = conn.client
    yield client.clearIndex()
    yield client.saveWebEntityCreationRule(WebEntityCreationRule(config['defaultWebEntityCreationRule']['regexp'], config['defaultWebEntityCreationRule']['prefix']))
    yield client.createWebEntity('default', ['s:http'])

@inlineCallbacks
def list_web_entities(conn, corpus='') :
    client = conn.client
    print "List web entities from memory structure"
    res = yield client.getWebEntities()
    print res
    yield res
@inlineCallbacks
def index_pages(conn, page_items, corpus='') :
    client = conn.client
    pages, links = processor.generate_cache_from_pages_list(page_items, config["precisionLimit"], True)
    s=time.time()
    cache_id = yield client.createCache(pages.values())
    print "page cache created: "+str(cache_id)+ " containing "+str(len(pages))+" pages in "+str(time.time()-s)
    s=time.time()
    nb_pages = yield client.indexCache(cache_id)
    print str(nb_pages)+" pages indexed in "+str(time.time()-s)
    s=time.time()
    yield client.saveNodeLinks([NodeLink("id",source,target,weight) for (source,target),weight in links.iteritems()])
    print "inserting NodeLinks in "+str(time.time()-s)
    s=time.time()
    yield client.createWebEntities(cache_id)
    print "web entities created in "+str(time.time()-s)
    s=time.time()
    res = yield client.getWebEntities()
    print res
    yield client.generateWebEntityLinks()
    print "processed webentity links in "+str(time.time()-s)

@inlineCallbacks
def get_gexf_network(conn) :
    client = conn.client
    WEs=yield client.getWebEntities()
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
    gexf.write_WEs_network_from_MS(links, WEs_metadata, 'test_welinks.gexf', 'son')
    print "Graph saved in tesWEwelinks.gexf in "+str(time.time()-s)

application = service.Application("Example JSON-RPC Server")
#core = Crawler()
#site = server.Site(core)
#server = internet.TCPServer(config['twisted']['port'], site)
factory = jsonrpc.RPCFactory(Core)
factory.putSubHandler('crawl', Crawler)
factory.putSubHandler('store', Memory_Structure)
factory.addIntrospection()
server = internet.TCPServer(config['twisted']['port'], factory)
server.setServiceParent(application)

#reactor.listenTCP(config['twisted']['port'], server.Site(Crawler()))
#reactor.run()

