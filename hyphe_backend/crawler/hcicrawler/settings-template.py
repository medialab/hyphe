import os, uuid

HYPHE_PROJECT = '{{db_name}}.{{project}}'
BOT_NAME = 'hcicrawler'

LOG_LEVEL = '{{log_level}}'

SPIDER_MODULES = 'hcicrawler.spiders'

ITEM_PIPELINES = {
    'hcicrawler.pipelines.ResolveLinks': 200,
    'hcicrawler.pipelines.OutputStore': 300,
    'hcicrawler.pipelines.RemoveBody': 400,
    'hcicrawler.pipelines.OutputQueue': 500,
}

ARCHIVES = {
  "ENABLED": {{webarchives_enabled}},
  "URL_PREFIX": '{{webarchives_url_prefix}}',
  "DATE": '{{webarchives_date}}'
}

CONCURRENT_REQUESTS = {{max_simul_requests}} if not ARCHIVES["ENABLED"] else 3
CONCURRENT_REQUESTS_PER_DOMAIN = {{max_simul_requests_per_host}} if not ARCHIVES["ENABLED"] else 1

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
MONGO_JOBS_COL = 'jobs'
MONGO_QUEUE_COL = 'queue'
MONGO_PAGESTORE_COL = 'pages'

PHANTOM = {
  "PATH": os.path.join('{{hyphePath}}', 'bin', 'hyphe-phantomjs-2.0.0'),
  "JS_PATH": os.path.join('{{hyphePath}}', 'hyphe_backend', 'crawler', BOT_NAME, 'spiders', 'js'),
  "TIMEOUT": {{phantom_timeout}},
  "IDLE_TIMEOUT": {{phantom_idle_timeout}},
  "AJAX_TIMEOUT": {{phantom_ajax_timeout}}
}

STORE_HTML = {{store_crawled_html_content}}

if 'SCRAPY_JOB' in os.environ:
    JOBID = os.environ['SCRAPY_JOB']
else:
    JOBID = str(uuid.uuid4())
