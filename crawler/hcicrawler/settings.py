import os, uuid

BOT_NAME = 'hcicrawler'
BOT_VERSION = '0.1'

SPIDER_MODULES = ['hcicrawler.spiders']
NEWSPIDER_MODULE = 'hcicrawler.spiders'
USER_AGENT = '%s/%s' % (BOT_NAME, BOT_VERSION)

ITEM_PIPELINES = [
    'hcicrawler.pipelines.OutputStore',
    'hcicrawler.pipelines.RemoveBody',
    'hcicrawler.pipelines.OutputQueue',
]

DOWNLOADER_HTTPCLIENTFACTORY = 'hcicrawler.webclient.LimitSizeHTTPClientFactory'
REDIRECT_ENABLED = False

MONGO_HOST = 'localhost'
MONGO_DB = 'hci'
MONGO_QUEUE_COL = 'crawler.queue'
MONGO_PAGESTORE_COL = 'crawler.pages'

if 'SCRAPY_JOB' in os.environ:
    JOBID = os.environ['SCRAPY_JOB']
else:
    JOBID = str(uuid.uuid4())
