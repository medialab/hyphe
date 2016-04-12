#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, time, signal, re
try:
    import json
except:
    import simplejson as json
try:
    from pymongo.binary import Binary
except:
    from bson.binary import Binary

from scrapy import log
try:
    from scrapy.spider import Spider
except:
    from scrapy.spider import BaseSpider
from scrapy.http import Request, HtmlResponse
from scrapy.linkextractor import IGNORED_EXTENSIONS
from scrapy.utils.url import url_has_any_extension
from scrapyd.config import Config as scrapyd_config
from scrapy.signals import spider_closed, spider_error
from scrapy.xlib.pydispatch import dispatcher

from selenium.webdriver import PhantomJS
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.common.exceptions import WebDriverException, TimeoutException as SeleniumTimeout

from hcicrawler.linkextractor import RegexpLinkExtractor
from hcicrawler.urllru import url_to_lru_clean, lru_get_host_url, lru_get_path_url, has_prefix, lru_to_url
from hcicrawler.items import Page
from hcicrawler.settings import PROXY, HYPHE_PROJECT, PHANTOM
from hcicrawler.samples import DEFAULT_INPUT
from hcicrawler.errors import error_name

def timeout_alarm(*args):
    raise SeleniumTimeout

class PagesCrawler(BaseSpider):

    name = 'pages'
    link_extractor = RegexpLinkExtractor(canonicalize=False, deny_extensions=[])
    ignored_exts = set(['.' + e for e in IGNORED_EXTENSIONS])

    def __init__(self, **kw):
        args = DEFAULT_INPUT.copy()
        args.update(kw)
        self.args = args
        self.start_urls = to_list(args['start_urls'])
        self.maxdepth = int(args['maxdepth'])
        self.follow_prefixes = to_list(args['follow_prefixes'])
        self.nofollow_prefixes = to_list(args['nofollow_prefixes'])
        self.discover_prefixes = [url_to_lru_clean("http%s://%s" % (https, u.replace('http://', '').replace('https://', ''))) for u in to_list(args['discover_prefixes']) for https in ['', 's']]
        self.resolved_links = {}
        self.user_agent = args['user_agent']
        self.phantom = 'phantom' in args and args['phantom'] and args['phantom'].lower() != "false"
        if self.phantom:
            self.ph_timeout = int(args.get('phantom_timeout', PHANTOM['TIMEOUT']))
            self.ph_idle_timeout = int(args.get('phantom_idle_timeout', PHANTOM['IDLE_TIMEOUT']))
            self.ph_ajax_timeout = int(args.get('phantom_ajax_timeout', PHANTOM['AJAX_TIMEOUT']))
        self.errors = 0
        dispatcher.connect(self.closed, spider_closed)
        dispatcher.connect(self.crashed, spider_error)

    def start_requests(self):
        self.log("Starting crawl task - jobid: %s" % self.crawler.settings['JOBID'], log.INFO)
        self.log("ARGUMENTS : "+str(self.args), log.INFO)
        if self.phantom:
            self.init_phantom()
        for url in self.start_urls:
            yield self._request(url)

    def init_phantom(self):
        self.prefixfiles = os.path.join(
            scrapyd_config().get('logs_dir'),
            HYPHE_PROJECT,
            self.name,
            self.crawler.settings['JOBID']
        )
        self.log("Using path %s for PhantomJS crawl" % self.prefixfiles, log.INFO)
        phantom_args = []
        if PROXY and not PROXY.startswith(':'):
            phantom_args.append('--proxy=%s' % PROXY)
        phantom_args.append('--cookies-file=%s-phantomjs-cookie.txt' % self.prefixfiles)
        phantom_args.append('--ignore-ssl-errors=true')
        phantom_args.append('--load-images=false')
        self.capabilities = dict(DesiredCapabilities.PHANTOMJS)
        self.capabilities['phantomjs.page.settings.userAgent'] = self.user_agent
        self.capabilities['takesScreenshot'] = False
        self.capabilities['phantomjs.page.settings.javascriptCanCloseWindows'] = False
        self.capabilities['phantomjs.page.settings.javascriptCanOpenWindows'] = False
        self.phantom = PhantomJS(
            executable_path=PHANTOM['PATH'],
            service_args=phantom_args,
            desired_capabilities=self.capabilities,
            service_log_path="%s-phantomjs.log" % self.prefixfiles
        )
        self.phantom.implicitly_wait(10)
        self.phantom.set_page_load_timeout(60)
        self.phantom.set_script_timeout(self.ph_timeout + 15)

    def crashed(self, spider):
        self.errors += 1
        self.closed("CRASH")

    def closed(self, reason):
        if self.errors:
            self.log("%s error%s encountered during the crawl." %
                (self.errors, 's' if self.errors > 1 else ''), log.ERROR)
        if self.phantom:
            self.phantom.quit()
            if not self.errors:
                for f in ["phantomjs-cookie.txt", "phantomjs.log"]:
                    fi = "%s-%s" % (self.prefixfiles, f)
                    if os.path.exists(fi) and not self.errors:
                        os.remove(fi)

    def handle_response(self, response):
        lru = url_to_lru_clean(response.url)

        if self.phantom:
            self.phantom.get(response.url)

          # Collect whole DOM of the webpage including embedded iframes
            with open(os.path.join(PHANTOM["JS_PATH"], "get_iframes_content.js")) as js:
                get_bod_w_iframes = js.read()
            bod_w_iframes = self.phantom.execute_script(get_bod_w_iframes)
            response._set_body(bod_w_iframes.encode('utf-8'))

          # Try to scroll and unfold page
            self.log("Start PhantomJS scrolling and unfolding", log.INFO)
            with open(os.path.join(PHANTOM["JS_PATH"], "scrolldown_and_unfold.js")) as js:
                try:
                    signal.signal(signal.SIGALRM, timeout_alarm)
                    signal.alarm(self.ph_timeout + 30)
                    timedout = self.phantom.execute_async_script(
                        js.read(), self.ph_timeout,
                        self.ph_idle_timeout, self.ph_ajax_timeout)
                    signal.alarm(0)
                    if timedout:
                        raise SeleniumTimeout
                    self.log("Scrolling/Unfolding finished", log.INFO)
                except SeleniumTimeout:
                    self.log("Scrolling/Unfolding timed-out (%ss)" % self.ph_timeout, log.WARNING)
                    self.errors += 1
                except WebDriverException as e:
                    err = json.loads(e.msg)['errorMessage']
                    self.log("Scrolling/Unfolding crashed: %s" % err, log.ERROR)
                    self.errors += 1
                except Exception as e:
                    self.log("Scrolling/Unfolding crashed: %s %s" % (type(e), e), log.ERROR)
                    self.errors += 1
                    return self._make_raw_page(response, lru)
            bod_w_iframes = self.phantom.execute_script(get_bod_w_iframes)
            response._set_body(bod_w_iframes.encode('utf-8'))

      # Cleanup pages with base64 images embedded that make scrapy consider them not htmlresponses
        if response.status == 200 and not isinstance(response, HtmlResponse):
            try:
                flags = response.flags
                if "partial" in flags:
                    flags.remove("partial")
                flags.append("cleaned")
                response = HtmlResponse(response.url, headers=response.headers, body=cleanupbase64images(response.body), flags=flags, request=response.request)
                self.log("WARNING: page with base64 embedded images was cleaned-up for links extraction")
            except:
                pass

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
        error = failure.getErrorMessage()
        self.log("ERROR : %s" % error, log.ERROR)
        if PROXY and not PROXY.startswith(':') and "OpenSSL.SSL.Error" in error:
            return self._request(failure.request.url, noproxy=True)
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
            elif redir_url.startswith('../'):
                lrustart = lru[:lru.rfind('|p:')]
                while redir_url.startswith('../'):
                    lrustart = lrustart[:lrustart.rfind('|p:')]
                    redir_url = redir_url[3:]
                redir_url = "%s/%s" % (lru_to_url(lrustart+'|'), redir_url)
            elif redir_url.startswith('./') or not redir_url.startswith('http'):
                redir_url = "%s%s" % (lru_get_path_url(lru).strip('/'), redir_url[1:])
            links = [{'url': redir_url}]
            response.meta['depth'] -= 1
        else:
            try:
                links = self.link_extractor.extract_links(response)
            except Exception as e:
                self.log("ERROR: links extractor crashed on %s: %s %s" % (response, type(e), e), log.ERROR)
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
                self.log("Error converting URL %s to LRU: %s" % (url, e), log.ERROR)
                continue
            lrulinks.append((url, lrulink))
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
        p['error'] = None
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
        c1 = depth < self.maxdepth
        c2 = has_prefix(tolru, self.follow_prefixes)
        c3 = not(has_prefix(tolru, self.nofollow_prefixes))
        return c1 and c2 and c3

    def _request(self, url, noproxy=False, **kw):
        kw['meta'] = {'handle_httpstatus_all': True, 'noproxy': noproxy}
        kw['callback'] = self.handle_response
        kw['errback'] = self.handle_error
        if self.phantom:
            kw['method'] = 'HEAD'
        return Request(url, **kw)


def to_list(obj):
    if isinstance(obj, basestring):
        if obj.startswith("[") and obj.endswith("]"):
            return eval(obj)
        return []
    return list(obj)

re_cleanupbase64 = re.compile(r"src=['\"]data:image[^'\"]+['\"]", re.I|re.U)
cleanupbase64images = lambda x: re_cleanupbase64.sub('src=""', x)
