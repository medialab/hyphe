# -*- coding: utf-8 -*-

import os, time, signal, re
import json
import logging
from datetime import datetime, timedelta

from pymongo import MongoClient
try:
    from pymongo.binary import Binary
except:
    from bson.binary import Binary

from scrapy.spiders import Spider
from scrapy.http import Request, HtmlResponse
from scrapy.signals import spider_closed, spider_error
from scrapy.linkextractors import IGNORED_EXTENSIONS
from scrapy.utils.url import url_has_any_extension
from scrapyd.config import Config as scrapyd_config

from selenium.webdriver import PhantomJS
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.common.exceptions import WebDriverException, TimeoutException as SeleniumTimeout

from ural import normalize_url, get_domain_name
from ural.lru import LRUTrie

from hcicrawler.linkextractor import RegexpLinkExtractor, SCHEME_FILTERS
from hcicrawler.urllru import url_to_lru_clean, lru_get_host_url, lru_get_path_url, has_prefix, lru_to_url
from hcicrawler.tlds_tree import TLDS_TREE
from hcicrawler.items import Page
from hcicrawler.settings import PROXY, HYPHE_PROJECT, PHANTOM, STORE_HTML, MONGO_HOST, MONGO_PORT, MONGO_DB, MONGO_JOBS_COL, ARCHIVES
from hcicrawler.errors import error_name

def timeout_alarm(*args):
    raise SeleniumTimeout

RE_ARCHIVE_REDIRECT = r'function go\(\) \{.*document.location.href = "(%s/[^"]*)".*<p class="code shift red">Got an HTTP (\d+) response at crawl time</p>.*<p class="code">Redirecting to...</p>'

def normalize(url):
    return normalize_url(
        url,
        strip_index=False,
        strip_irrelevant_subdomains=False
    )

class PagesCrawler(Spider):

    name = 'pages'
    link_extractor = RegexpLinkExtractor(canonicalize=False, deny_extensions=[])
    ignored_exts = set(['.' + e for e in IGNORED_EXTENSIONS])

    def __init__(self, **kwargs):
        mongo = MongoClient(MONGO_HOST, MONGO_PORT)[MONGO_DB][MONGO_JOBS_COL]
        job = mongo.find_one({"_id": kwargs["job_id"]})
        args = job["crawl_arguments"]
        self.args = args

        self.start_urls = to_list(args['start_urls'])

        self.maxdepth = int(args['max_depth'])

        self.follow_prefixes = to_list(args['follow_prefixes'])
        self.nofollow_prefixes = to_list(args['nofollow_prefixes'])
        self.prefixes_trie = LRUTrie()
        for p in self.follow_prefixes:
            self.prefixes_trie.set_lru(p, True)
        for p in self.nofollow_prefixes:
            self.prefixes_trie.set_lru(p, False)

        self.discover_prefixes = [url_to_lru_clean("http%s://%s" % (https, u.replace('http://', '').replace('https://', '')), TLDS_TREE) for u in to_list(args['discover_prefixes']) for https in ['', 's']]

        # Init this dictionary to be filled by resolver from within pipelines.py
        self.resolved_links = {}

        self.user_agent = args['user_agent']

        self.phantom = 'phantom' in args and args['phantom'] and args['phantom'].lower() != "false"
        if self.phantom:
            self.ph_timeout = int(args.get('phantom_timeout', PHANTOM['TIMEOUT']))
            self.ph_idle_timeout = int(args.get('phantom_idle_timeout', PHANTOM['IDLE_TIMEOUT']))
            self.ph_ajax_timeout = int(args.get('phantom_ajax_timeout', PHANTOM['AJAX_TIMEOUT']))
        self.errors = 0

        # TODO: handle bypassing ARCHIVES default config from job's arguments
        if ARCHIVES["ENABLED"]:
            archivedate = re.sub(r"\D", "", str(ARCHIVES["DATE"]))
            self.archivedate = str(archivedate) + "120000"
            archivedt = datetime.strptime(self.archivedate, "%Y%m%d%H%M%S")
            self.archivemindate = datetime.strftime(archivedt - timedelta(ARCHIVES["DAYS_RANGE"]/2.), "%Y%m%d%H%M%S")
            self.archivemaxdate = datetime.strftime(archivedt + timedelta(ARCHIVES["DAYS_RANGE"]/2.), "%Y%m%d%H%M%S")

            archiveprefix = ARCHIVES["URL_PREFIX"].rstrip('/')
            self.archiveprefix = "%s/%s/" % (archiveprefix, self.archivedate)
            self.archiveregexp = re.compile(r"^%s/(\d{14}).?/" % archiveprefix, re.I)
            self.archivehost = "/".join(archiveprefix.split('/')[:3])
            self.archivedomain_lru = url_to_lru_clean("http://%s" % get_domain_name(archiveprefix), TLDS_TREE)
            archivedomain_regexp = "(?:%s|%s)" % (archiveprefix, archiveprefix.replace(self.archivehost, ""))
            self.archiveredirect = re.compile(RE_ARCHIVE_REDIRECT % archivedomain_regexp, re.I|re.S)


        self.cookies = None
        if 'cookies' in args and args["cookies"]:
            self.cookies = dict(cookie.split('=', 1) for cookie in re.split(r'\s*;\s*', args['cookies']) if '=' in cookie)

    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        spider = super(PagesCrawler, cls).from_crawler(crawler, *args, **kwargs)
        crawler.signals.connect(spider.spider_closed, signal=spider_closed)
        crawler.signals.connect(spider.spider_crashed, signal=spider_error)
        return spider

    def start_requests(self):
        self.log("Starting crawl task - jobid: %s" % self.crawler.settings['JOBID'], logging.INFO)
        self.log("ARGUMENTS : "+str(self.args), logging.INFO)
        if ARCHIVES["ENABLED"]:
            self.log("Crawling on Web Archive using for prefix %s" % self.archiveprefix)

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
        self.log("Using path %s for PhantomJS crawl" % self.prefixfiles, logging.INFO)
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

    def spider_crashed(self, spider):
        self.errors += 1
        self.spider_closed(spider, reason="CRASH")

    def spider_closed(self, spider, reason=""):
        if self.errors:
            self.log("%s error%s encountered during the crawl (%s)." %
                (self.errors, 's' if self.errors > 1 else '', reason), logging.ERROR)
        if self.phantom:
            self.phantom.quit()
            if not self.errors:
                for f in ["phantomjs-cookie.txt", "phantomjs.log"]:
                    fi = "%s-%s" % (self.prefixfiles, f)
                    if os.path.exists(fi) and not self.errors:
                        os.remove(fi)

    def handle_response(self, response):
        if self.phantom:
            self.phantom.get(response.url)

          # Collect whole DOM of the webpage including embedded iframes
            with open(os.path.join(PHANTOM["JS_PATH"], "get_iframes_content.js")) as js:
                get_bod_w_iframes = js.read()
            bod_w_iframes = self.phantom.execute_script(get_bod_w_iframes)
            response._set_body(bod_w_iframes.encode('utf-8'))

          # Try to scroll and unfold page
            self.log("Start PhantomJS scrolling and unfolding", logging.INFO)
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
                    self.log("Scrolling/Unfolding finished", logging.INFO)
                except SeleniumTimeout:
                    self.log("Scrolling/Unfolding timed-out (%ss)" % self.ph_timeout, logging.WARNING)
                    self.errors += 1
                except WebDriverException as e:
                    err = json.loads(e.msg)['errorMessage']
                    self.log("Scrolling/Unfolding crashed: %s" % err, logging.ERROR)
                    self.errors += 1
                except Exception as e:
                    self.log("Scrolling/Unfolding crashed: %s %s" % (type(e), e), logging.ERROR)
                    self.errors += 1
                    return self._make_raw_page(response)
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

        if ARCHIVES["ENABLED"]:
            # Handle transparently redirections from archives to another available timestamp
            if response.status == 302:
                redir_url = response.headers['Location']
                real_url = self.archiveregexp.sub("", redir_url)
                orig_url = self.archiveregexp.sub("", response.url)
                match = self.archiveregexp.search(redir_url)
                if match:
                    # Check date obtained fits into a user defined timerange and return 404 otherwise
                    if not self.archivemindate <= match.group(1) <= self.archivemaxdate:
                        self.log("Skipping archive page (%s) with date outside desired range (%s/%s)" % (redir_url, self.archivemindate, self.archivemaxdate), logging.DEBUG)
                        return
                    if normalize(real_url) == normalize(orig_url):
                        if "depth" in response.meta:
                            response.meta['depth'] -= 1
                        else:
                            response.meta['depth'] = -1
                        return self._request(redir_url)
            if response.status >= 400:
                return self._make_raw_page(response)

        if 300 <= response.status < 400 or isinstance(response, HtmlResponse):
            return self.parse_html(response)
        else:
            return self._make_raw_page(response)

    def handle_error(self, failure, response=None):
        if response:
            p = self._make_raw_page(response)
            p['error'] = error_name(failure.value)
            return p
        elif not "://www" in failure.request.url:
            return self._request(failure.request.url.replace('://', '://www.'))
        error = failure.getErrorMessage()
        self.log("ERROR : %s" % error, logging.ERROR)
        if PROXY and not PROXY.startswith(':') and "OpenSSL.SSL.Error" in error:
            return self._request(failure.request.url, noproxy=True)
        self.errors += 1
        return

    def parse_html(self, response):
        orig_url = response.url
        if ARCHIVES["ENABLED"]:
            orig_url = self.archiveregexp.sub("", orig_url)
        lru = url_to_lru_clean(orig_url, TLDS_TREE)
        lrulinks = []

        # Handle redirects
        realdepth = response.meta['depth']

        if ARCHIVES["ENABLED"]:
            # Specific case of redirections from website returned by archives as JS redirections with code 200
            redir_url = self.archiveredirect.search(response.body)
            if redir_url:
                # Check date obtained fits into a user defined timerange and return 404 otherwise
                if not self.archivemindate <= redir_url.group(2) <= self.archivemaxdate:
                    self.log("Skipping archive page (%s) with date outside desired range (%s/%s)" % (redir_url.group(1), self.archivemindate, self.archivemaxdate), logging.DEBUG)
                    return
                response.status = int(redir_url.group(2))
                redir_location = redir_url.group(1)
                if redir_location.startswith("/"):
                    redir_location = "%s%s" % (self.archivehost, redir_location)
                response.headers['Location'] = redir_location

        if 300 <= response.status < 400:
            redir_url = response.headers['Location']

            if ARCHIVES["ENABLED"] and self.archiveregexp.match(redir_url):
                redir_url = self.archiveregexp.sub("", redir_url)

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
                self.log("ERROR: links extractor crashed on %s: %s %s" % (response, type(e), e), logging.ERROR)
                links = []
                self.errors += 1

        for link in links:
            try:
                url = link.url
            except AttributeError:
                url = link['url']

            if ARCHIVES["ENABLED"]:
                # Rewrite archives urls and filter internal archives links
                url = self.archiveregexp.sub("", url)
                if url.startswith(self.archivehost) or \
                  url.split(":")[0].lower() in SCHEME_FILTERS:
                    continue

            try:
                lrulink = url_to_lru_clean(url, TLDS_TREE)
            except (ValueError, IndexError) as e:
                self.log("Error converting URL %s to LRU: %s" % (url, e), logging.ERROR)
                continue

            if ARCHIVES["ENABLED"]:
                # Filter more links added within archives to other pieces of the archive
                if lrulink.replace("s:https|", "s:http|").startswith(self.archivedomain_lru):
                    continue

            lrulinks.append((url, lrulink))

            if self._should_follow(response.meta['depth'], lrulink) and \
                    not url_has_any_extension(url, self.ignored_exts):
                yield self._request(url)

        response.meta['depth'] = realdepth
        yield self._make_html_page(response, lrulinks)

    def _make_html_page(self, response, lrulinks):
        p = self._make_raw_page(response)
        if STORE_HTML:
            p['body'] = Binary(response.body.encode('zip'))
        p['lrulinks'] = lrulinks
        return p

    def _make_raw_page(self, response):
        p = Page()
        p['url'] = response.url
        if ARCHIVES["ENABLED"]:
            p['url'] = self.archiveregexp.sub("", response.url)
            p['archive_url'] = response.url
            p['archive_date_requested'] = self.archivedate
            if 'archive_timestamp' in response.meta:
                p['archive_date_obtained'] = response.meta['archive_timestamp']
        p['lru'] = url_to_lru_clean(p['url'], TLDS_TREE)
        p['depth'] = 0
        p['timestamp'] = int(time.time()*1000)
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

    def _should_follow(self, depth, tolru):
        c1 = depth < self.maxdepth
        c2 = self.prefixes_trie.match_lru(tolru)
        return c1 and c2

    def _request(self, url, noproxy=False, **kw):
        kw['meta'] = {'handle_httpstatus_all': True, 'noproxy': noproxy}
        kw['callback'] = self.handle_response
        kw['errback'] = self.handle_error
        if self.cookies:
            kw['cookies'] = self.cookies
        if self.phantom:
            kw['method'] = 'HEAD'
        if ARCHIVES["ENABLED"]:
            if url.startswith(ARCHIVES["URL_PREFIX"]):
                kw["meta"]["archive_timestamp"] = self.archiveregexp.search(url).group(1)
                return Request(url, **kw)
            else:
                kw["meta"]["archive_timestamp"] = self.archivedate
                return Request(self.archiveprefix + url, **kw)
        return Request(url, **kw)


def to_list(obj):
    if isinstance(obj, basestring):
        if obj.startswith("[") and obj.endswith("]"):
            return eval(obj)
        return []
    return list(obj)

re_cleanupbase64 = re.compile(r"src=['\"]data:image[^'\"]+['\"]", re.I|re.U)
cleanupbase64images = lambda x: re_cleanupbase64.sub('src=""', x)
