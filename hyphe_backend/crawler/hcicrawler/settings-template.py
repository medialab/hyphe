import os, uuid

from chromium_utils import is_docker, chromium_executable, chrome_driver_executable

HYPHE_PROJECT = '{{db_name}}_{{project}}'
BOT_NAME = 'hcicrawler'

LOG_LEVEL = '{{log_level}}'

SPIDER_MODULES = 'hcicrawler.spiders'

ITEM_PIPELINES = {
    'hcicrawler.pipelines.ResolveLinks': 200,
    'hcicrawler.pipelines.OutputStore': 300,
    'hcicrawler.pipelines.RemoveBody': 400,
    'hcicrawler.pipelines.OutputQueue': 500,
}

CONCURRENT_REQUESTS = {{max_simul_requests}}
CONCURRENT_REQUESTS_PER_DOMAIN = {{max_simul_requests_per_host}}

DOWNLOADER_HTTPCLIENTFACTORY = 'hcicrawler.webclient.LimitSizeHTTPClientFactory'

REDIRECT_ENABLED = False

PROXY = '{{proxy_host}}:%s' % {{proxy_port}}

DOWNLOADER_MIDDLEWARES = {
    'hcicrawler.middlewares.ProxyMiddleware': 100,
    'scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware': 110,
    'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': 200
}

MAX_RESPONSE_SIZE = 5242880 # 5Mb

DUPEFILTER_CLASS = 'hcicrawler.middlewares.CustomDupeFilter'

MONGO_HOST = '{{host}}'
MONGO_PORT = {{mongo_port}}
MONGO_DB = '{{db_name}}_{{project}}'
MONGO_QUEUE_COL = 'queue'
MONGO_PAGESTORE_COL = 'pages'

if is_docker():
    JS_PATH = '/app/scrapers_js'
else:
    JS_PATH = os.path.join('{{crawlerPath}}', 'hcicrawler', 'spiders', 'js')

CHROME = {
  "PATH": chromium_executable(os.path.join('{{crawlerPath}}', 'local-chromium')),
  "DRIVER_PATH": chrome_driver_executable(os.path.join('{{crawlerPath}}', 'local-chromium')),
  "JS_PATH": JS_PATH,
  "TIMEOUT": {{headless_timeout}},
  "IDLE_TIMEOUT": {{headless_idle_timeout}},
  "AJAX_TIMEOUT": {{headless_ajax_timeout}}
}

STORE_HTML = {{store_crawled_html_content}}

if 'SCRAPY_JOB' in os.environ:
    JOBID = os.environ['SCRAPY_JOB']
else:
    JOBID = str(uuid.uuid4())
