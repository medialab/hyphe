BOT_NAME = 'hcicrawler'
BOT_VERSION = '0.1'

SPIDER_MODULES = ['hcicrawler.spiders']
NEWSPIDER_MODULE = 'hcicrawler.spiders'
USER_AGENT = '%s/%s' % (BOT_NAME, BOT_VERSION)

ITEM_PIPELINES = [
    'hcicrawler.pipelines.OutputFeeds',
    'hcicrawler.pipelines.RemoveBody'
]

#OUTPUT_DIR = 'output'

DOWNLOADER_HTTPCLIENTFACTORY = 'hcicrawler.webclient.LimitSizeHTTPClientFactory'
