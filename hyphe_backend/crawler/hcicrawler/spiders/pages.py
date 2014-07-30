#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, time, uuid

from scrapy.spider import BaseSpider
from scrapy.http import Request, HtmlResponse
from scrapy.linkextractor import IGNORED_EXTENSIONS
from scrapy.utils.url import url_has_any_extension
from scrapy.contrib.linkextractors.regex import RegexLinkExtractor
from scrapy import log
from scrapyd.config import Config as scrapyd_config
try:
    from pymongo.binary import Binary
except:
    from bson.binary import Binary
from hcicrawler.urllru import url_to_lru_clean, lru_get_host_url, lru_get_path_url
from hcicrawler.items import Page
from hcicrawler.settings import PHANTOM_PATH, PROXY, HYPHE_PROJECT, JS_PATH
from hcicrawler.samples import DEFAULT_INPUT
from hcicrawler.errors import error_name

from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

class PagesCrawler(BaseSpider):

    name = 'pages'
    link_extractor = RegexLinkExtractor(canonicalize=False, deny_extensions=[])
    ignored_exts = set(['.' + e for e in IGNORED_EXTENSIONS])

    def __init__(self, **kw):
        args = DEFAULT_INPUT.copy()
        args.update(kw)
        self.args = args
        self.start_urls = to_list(args['start_urls'])
        self.maxdepth = int(args['maxdepth'])
        self.follow_prefixes = to_list(args['follow_prefixes'])
        self.nofollow_prefixes = to_list(args['nofollow_prefixes'])
        self.discover_prefixes = to_list(args['discover_prefixes'])
        self.user_agent = args['user_agent']
        self.phantom = 'phantom' in args and args['phantom'] and args['phantom'].lower() != "false"
        self.errors = 0

    def start_requests(self):
        self.log("Starting crawl task - jobid: %s" % self.crawler.settings['JOBID'])
        self.log("ARGUMENTS : "+str(self.args))
        if self.phantom:
            self.init_phantom()
        for url in self.start_urls:
            yield self._request(url)

    def init_phantom(self):
        self.cachedir = os.path.join(
            scrapyd_config().get('logs_dir'),
            HYPHE_PROJECT,
            self.name,
            "%s-phantom" % self.crawler.settings['JOBID']
        )
        self.log("Using directory %s for PhantomJs crawl" % self.cachedir)
        os.makedirs(self.cachedir)
        phantom_args = []
        if PROXY and not PROXY.startswith(':'):
            phantom_args.append('--proxy=%s' % PROXY)
        phantom_args.append('--cookies-file=%s' % os.path.join(self.cachedir, 'cookie.txt'))
        phantom_args.append('--ignore-ssl-errors=true')
        phantom_args.append('--load-images=false')
        phantom_args.append('--local-storage-path=%s' % self.cachedir)
        phantom_args.append('--local-storage-path=%s' % self.cachedir)
        capabilities = dict(DesiredCapabilities.PHANTOMJS)
        capabilities['phantomjs.page.settings.userAgent'] = self.user_agent
        self.phantom = webdriver.PhantomJS(
            executable_path=PHANTOM_PATH,
            service_args=phantom_args,
            desired_capabilities=capabilities,
            service_log_path=os.path.join(self.cachedir, 'phantomjs.log')
        )

    def closed(self, reason):
        if self.errors:
            self.log("%s error%s encountered during the crawl." %
                (self.errors, 's' if self.errors > 1 else ''))
        if self.phantom and not self.errors:
            for f in os.listdir(self.cachedir):
                os.remove(os.path.join(self.cachedir, f))
            os.rmdir(self.cachedir)
            self.phantom.quit()

    def handle_response(self, response):
        lru = url_to_lru_clean(response.url)
        if self.phantom:
            self.phantom.get(response.url)
            # TODO: handle wait/click listeners, see phantomas ?
            time.sleep(3)
            with open(os.path.join(JS_PATH, "get_iframes_content.js")) as js:
                iframes = self.phantom.execute_script(js.read())
            response._set_body((iframes).encode('utf-8'))
        if 300 < response.status < 400 or isinstance(response, HtmlResponse):
            return self.parse_html(response, lru)
        else:
            return self._make_raw_page(response, lru)

    def handle_error(self, failure, response=None):
        if response:
            p = self._make_raw_page(response, failure.request.url)
            p['error'] = error_name(failure.value)
            return p
        elif not "://www" in failure.request.url:
            return self._request(failure.request.url.replace('://', '://www.'))
        self.log("ERROR : %s" % failure.getErrorMessage())
        self.errors += 1
        return

    def parse_html(self, response, lru):
        lrulinks = []
        # handle redirects
        realdepth = response.meta['depth']
        if 300 < response.status < 400:
            redir_url = response.headers['Location']
            if redir_url.startswith('/'):
                redir_url = "%s%s" % (lru_get_host_url(lru).strip('/'), redir_url)
            elif redir_url.startswith('./') or not redir_url.startswith('http'):
                redir_url = "%s%s" % (lru_get_path_url(lru).strip('/'), redir_url[1:])
            links = [{'url': redir_url}]
            response.meta['depth'] -= 1
        else:
            try:
                links = self.link_extractor.extract_links(response)
            except:
                links = []
                self.errors += 1
        for link in links:
            try:
                url = link.url
            except AttributeError:
                url = link['url']
            try:
                lrulink = url_to_lru_clean(url)
            except ValueError, e:
                self.log("Error converting URL to LRU: %s" % e, log.ERROR)
                continue
            lrulinks.append(lrulink)
            if self._should_follow(response.meta['depth'], lru, lrulink) and \
                    not url_has_any_extension(url, self.ignored_exts):
                yield self._request(url)
        response.meta['depth'] = realdepth
        yield self._make_html_page(response, lru, lrulinks)

    def _make_html_page(self, response, lru, lrulinks):
        p = self._make_raw_page(response, lru)
        p['body'] = Binary(response.body.encode('zip'))
        p['lrulinks'] = lrulinks
        return p

    def _make_raw_page(self, response, lru):
        p = self._new_page(response.url, lru)
        p['status'] = response.status
        p['size'] = len(response.body)
        if isinstance(response, HtmlResponse):
            p['encoding'] = response.encoding
        if response.meta.get('depth'):
            p['depth'] = response.meta['depth']
        if response.headers.get('content-type'):
            p['content_type'] = response.headers.get('content-type').partition(';')[0]
        p['error'] = None;
        return p

    def _new_page(self, url, lru=None):
        if lru is None:
            lru = url_to_lru_clean(url)
        p = Page()
        p['url'] = url
        p['lru'] = lru
        p['depth'] = 0
        p['timestamp'] = int(time.time()*1000)
        return p

    def _should_follow(self, depth, fromlru, tolru):
        # this condition is documented here (please keep updated)
        # http://jiminy.medialab.sciences-po.fr/hci/index.php/Crawler#Link_following
        c1 = depth < self.maxdepth
        c2 = self.has_prefix(tolru, self.follow_prefixes + self.discover_prefixes)
        c3 = not(self.has_prefix(tolru, self.nofollow_prefixes))
        c4 = not(self.has_prefix(fromlru, self.discover_prefixes))
        #self.log("%s %s %s %s %s %s" % (depth, c1, c2, c3, c4, tolru)) # DEBUG
        return c1 and c2 and c3 and c4

    def _request(self, url, **kw):
        kw['meta'] = {'handle_httpstatus_all': True}
        kw['callback'] = self.handle_response
        kw['errback'] = self.handle_error
        if self.phantom:
            kw['method'] = 'HEAD'
        return Request(url, **kw)

    def has_prefix(self, string, prefixes):
        if prefixes:
            return any((string.startswith(p) for p in prefixes))
        return False

def to_list(obj):
    if isinstance(obj, basestring):
        if obj.startswith("['") and obj.endswith("']"):
            return obj[2:-2].split("', '")
        return []
    return list(obj)
