#!/usr/bin/env python
# coding: utf8
"""
This file is only there as a proof of concepts and developing tests.
Some functions are duplicated from `install_chromium.py` for an easier reading.
Please don't use duplicated code.
It hurts me 🥴.
"""

import os, signal, sys
from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException, TimeoutException as SeleniumTimeout

from hcicrawler.chromium_utils import current_platform, chromium_executable, chrome_driver_executable

FILEDIR = os.path.dirname(os.path.realpath(__file__))
LOCALDIR = os.path.join(FILEDIR, 'local-chromium')

DEBUG = "--debug" in sys.argv
clargs = [a for a in sys.argv[1:] if a != "--debug"]
TEST_URL = clargs[0] if clargs else 'https://fr-fr.facebook.com/santeplusmag/'

ph_timeout = 30
ph_idle_timeout = 3
ph_ajax_timeout = 3
errors = 0

chrome_options = Options()
if not DEBUG:
    chrome_options.add_argument('--headless')
chrome_options.binary_location = chromium_executable(LOCALDIR)
driver = Chrome(
    executable_path = chrome_driver_executable(LOCALDIR),
    chrome_options = chrome_options
)

def timeout_alarm(*args):
    raise SeleniumTimeout

driver.get(TEST_URL)

with open(os.path.join(FILEDIR, 'hcicrawler', 'spiders', 'js', 'get_iframes_content.js')) as js:
    get_bod_w_iframes = js.read()

driver.execute_script(get_bod_w_iframes)

with open(os.path.join(FILEDIR, 'hcicrawler', 'spiders', 'js', 'scrolldown_and_unfold.js')) as js:
    unfold_and_scoll = js.read()

try:
    signal.signal(
        signal.SIGALRM,
        timeout_alarm
    )
    signal.alarm(
        ph_timeout + 30
    )
    timedout = driver.execute_async_script(
        unfold_and_scoll, ph_timeout,
        ph_idle_timeout, ph_ajax_timeout
    )
    signal.alarm(0)
    if timedout:
        raise SeleniumTimeout
    print("Scrolling/Unfolding finished")
except SeleniumTimeout:
    print("Scrolling/Unfolding timed-out (%ss)" % ph_timeout)
    errors += 1
except WebDriverException as e:
    print("Scrolling/Unfolding crashed: %s" % (e))
    errors += 1
except Exception as e:
    print("Scrolling/Unfolding crashed: %s %s" % (type(e), e))
    errors += 1

print(driver.page_source.encode('utf8'))

driver.close()
driver.quit()
