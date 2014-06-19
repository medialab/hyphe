import os, uuid

BOT_NAME = 'hcicrawler'

SPIDER_MODULES = ['hcicrawler.spiders']
NEWSPIDER_MODULE = 'hcicrawler.spiders'
#USER_AGENT = '%s/%s' % (BOT_NAME, BOT_VERSION)

ITEM_PIPELINES = [
    'hcicrawler.pipelines.OutputStore',
    'hcicrawler.pipelines.RemoveBody',
    'hcicrawler.pipelines.OutputQueue',
]

CONCURRENT_REQUESTS = {{max_simul_requests}}
CONCURRENT_REQUESTS_PER_DOMAIN = {{max_simul_requests_per_host}}

DOWNLOADER_HTTPCLIENTFACTORY = 'hcicrawler.webclient.LimitSizeHTTPClientFactory'
REDIRECT_ENABLED = False

PROXY = '{{proxy_host}}:%s' % {{proxy_port}}
DOWNLOADER_MIDDLEWARES = {
    'scrapy.contrib.downloadermiddleware.httpproxy.HttpProxyMiddleware': 110,
    'hcicrawler.middlewares.ProxyMiddleware': 100,
}

MONGO_HOST = '{{host}}'
MONGO_PORT = {{mongo_port}}
MONGO_DB = '{{project}}'
MONGO_QUEUE_COL = '{{queueCol}}'
MONGO_PAGESTORE_COL = '{{pageStoreCol}}'

if 'SCRAPY_JOB' in os.environ:
    JOBID = os.environ['SCRAPY_JOB']
else:
    JOBID = str(uuid.uuid4())
