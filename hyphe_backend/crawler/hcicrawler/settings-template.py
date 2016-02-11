import os, uuid

HYPHE_PROJECT = '{{db_name}}.{{project}}'
BOT_NAME = 'hcicrawler'

SPIDER_MODULES = ['hcicrawler.spiders']
NEWSPIDER_MODULE = 'hcicrawler.spiders'

ITEM_PIPELINES = [
    'hcicrawler.pipelines.ResolveLinks',
    'hcicrawler.pipelines.OutputStore',
    'hcicrawler.pipelines.RemoveBody',
    'hcicrawler.pipelines.OutputQueue',
]

CONCURRENT_REQUESTS = {{max_simul_requests}}
CONCURRENT_REQUESTS_PER_DOMAIN = {{max_simul_requests_per_host}}

DOWNLOADER_CLIENTCONTEXTFACTORY = 'hcicrawler.webclient.CustomSSLContextFactory'
DOWNLOADER_HTTPCLIENTFACTORY = 'hcicrawler.webclient.LimitSizeHTTPClientFactory'
REDIRECT_ENABLED = False


PROXY = '{{proxy_host}}:%s' % {{proxy_port}}
DOWNLOADER_MIDDLEWARES = {
    'scrapy.contrib.downloadermiddleware.useragent.UserAgentMiddleware': 200,
    'scrapy.contrib.downloadermiddleware.httpproxy.HttpProxyMiddleware': 110,
    'hcicrawler.middlewares.ProxyMiddleware': 100,
}

MONGO_HOST = '{{host}}'
MONGO_PORT = {{mongo_port}}
MONGO_DB = '{{db_name}}'
MONGO_QUEUE_COL = '{{project}}.queue'
MONGO_PAGESTORE_COL = '{{project}}.pages'

PHANTOM = {
  "PATH": os.path.join('{{hyphePath}}', 'bin', 'hyphe-phantomjs-2.0.0'),
  "JS_PATH": os.path.join('{{hyphePath}}', 'hyphe_backend', 'crawler', BOT_NAME, 'spiders', 'js'),
  "TIMEOUT": {{phantom_timeout}},
  "IDLE_TIMEOUT": {{phantom_idle_timeout}},
  "AJAX_TIMEOUT": {{phantom_ajax_timeout}}
}

if 'SCRAPY_JOB' in os.environ:
    JOBID = os.environ['SCRAPY_JOB']
else:
    JOBID = str(uuid.uuid4())
