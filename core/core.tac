from twisted.web import server
from twisted.internet.reactor import callLater
from twisted.web.client import getPage
from twisted.application import service, internet
from txjsonrpc.web import jsonrpc
import re
from urllru import urlTokenizer,lruRebuild,cleanUrl


linksHarvester=re.compile("<\s*a\s+[^>]*href\s*=\s*[\"']?([^\"' >]+)[\"' >]")
lruPattern=re.compile("^([^:/?#]+):(?://([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$")

crawlers=[]

class Crawler():
# this crawler take a web entity and crawl inside it to the depth declared"

	def __init__(self,corpus,webEntity,depth) :
		self.corpus=corpus
		self.webEntity=webEntity
		self.maximumDepth=depth
		self.insiderUrlSeen={}
		self.links={}
		self.depthLevel=0
		self.crawl(self.webEntity["url"])
		self.status="crawling"
	
	def crawl(self,url):
		self.currentCrawlingUrl=url
		self.getPageDeferred=getPage(self.currentCrawlingUrl)
		self.getPageDeferred.addCallback(self.processPage)
		self.getPageDeferred.addErrback(self.handleError)	

	def processPage(self,pageContent):
	    #extract links in <a href="">
	    links=linksHarvester.findall(pageContent)
	    for link in links :
	    	# clean url
	    	link=cleanUrl(link,self.currentCrawlingUrl)
	    	if link :
		    	#detect insideWebEntity/oustide Links
		    	if self.webEntity["url"] in link :
		    	# intern
		    		if not self.insiderUrlSeen.has_key(link) :
		    		# new intern link
			    		self.insiderUrlSeen[link]=[self.depthLevel,False]
		    	else :
		    		self.webEntity.weLinked.append(self.corpus.addWebEntity(urlTokenizer(link),5,"next"))
	    		
	    self.webEntity.pages.append(urlTokenizer(self.currentCrawlingUrl))
	    self.depthLevel+=1
	    self.crawlNext()

	def crawlNext(self) :
		if len(filter(lambda (k,(depthLevel,crawled)):crawled,self.insiderUrlSeen.iteritems()))<10 :
			urls_to_crawled=filter(lambda (k,(depthLevel,crawled)): depthLevel<self.maximumDepth and not crawled,self.insiderUrlSeen.iteritems())
			if urls_to_crawled :
				url_to_be_crawled=urls_to_crawled[0][0]
				self.insiderUrlSeen[url_to_be_crawled][1]=True
				self.crawl(url_to_be_crawled)
		
		# crawl finished
		self.status="finished"
	
	def handleError(self,error):
	    print 'got error %s' % error
	    self.crawlNext()
	    
	
#	pageFetchedDeferred = getPage("http://orestis.gr")
#	pageFetchedDeferred.addCallback(processPage)
#	pageFetchedDeferred.addErrback(handleError)





class WebEntity(dict):
	
	def __init__(self,lru,status):
		self["lru"]=lru
		self["status"]=status
		self["url"]=lruRebuild(lru)
		self.pages=[]
		self.weLinked=[]

			

class Corpus(dict) :

	def __init__(self):
		self.addWebEntity(urlTokenizer("http://www.sciencespo.fr"),5,"undefined")
		self.addWebEntity(urlTokenizer("http://medialab.sciences-po.fr"),5,"included")
	
	def addWebEntity(self,lru,weDepth,statut="undefined") :
		page=lru
		
		lru="|".join(page.split("|")[0:weDepth])
		
		if not self.has_key(lru) :
			self[lru]=WebEntity(lru,statut)

		self[lru].pages.append(page)	
		
		return self[lru]

		

class WebEntity_RPC(jsonrpc.JSONRPC):

	def loadCorpus(self,corpus) :
		self.corpus=corpus

	def jsonrpc_setStatus(self,lru,status) :
		"""Set the status of a web entity defined by his lru"""
		if lru in self.corpus.keys() :
			self.corpus[lru]["status"]=status
			return self.corpus[lru]
		else :
			return "not found"
	
	def jsonrpc_getLinksTo(self,lru) :
		if lru in self.corpus.keys() :
			return self.corpus[lru].weLinked
		else :
			return "not found"
	
	def jsonrpc_getPages(self,lru) :
		if lru in self.corpus.keys() :
			return self.corpus[lru].pages
		else :
			return "not found"

			

class Core_RPC(jsonrpc.JSONRPC):
	"""
	An example subhandler.
	"""
	
	def loadCorpus(self) :
		self.corpus=Corpus()
		self.crawlers=[]
		self.garbageCollectCrawlers()
	
	def garbageCollectCrawlers(self):
			for crawl in self.crawlers:
				if crawl.status=="finished":
					del(crawl)
			callLater(30, self.garbageCollectCrawlers)
	
	def jsonrpc_getWebEntities(self):
		"""Return the corpus as list of web entities"""
		return self.corpus
		
	def jsonrpc_declareWebEntity(self,lru,depth):
		"""Return the corpus as list of web entities"""
		return self.corpus.addWebEntity(lru,depth)
	
	def jsonrpc_crawl(self,lrus):
		""" launch crawl on web entities' id list"""

		lruTocrawl=[webEntity for (lru,webEntity) in filter(lambda (lru,webEntity):lru in lrus,self.corpus.iteritems())]

		for we in lruTocrawl :
			self.crawlers.append(Crawler(self.corpus,we,1))
		return len(self.crawlers)
		 
	def jsonrpc_monitorCrawl(self) :
		return len(self.crawlers)


application = service.Application("Example JSON-RPC Server")
core = Core_RPC()
core.loadCorpus()
print core.corpus
webEntity=WebEntity_RPC()
webEntity.loadCorpus(core.corpus)
core.putSubHandler('WebEntity',webEntity)
site = server.Site(core)
server = internet.TCPServer(8080, site)
server.setServiceParent(application)












