# coding: utf8
import os, signal, sys
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException, TimeoutException as SeleniumTimeout

"""
This file is only there as a proof of concepts.
Some functions are duplicated from `install_chromium.py` for an easier reading.
Please don't use duplicated code.
It hurs me 🥴.
"""

def current_platform():
    """Get current platform name by short string."""
    if sys.platform.startswith('linux'):
        return 'linux'
    elif sys.platform.startswith('darwin'):
        return 'mac'
    elif (sys.platform.startswith('win') or
          sys.platform.startswith('msys') or
          sys.platform.startswith('cyg')):
        if sys.maxsize > 2 ** 31 - 1:
            return 'win64'
        return 'win32'
    raise OSError('Unsupported platform: ' + sys.platform)

def chromium_executable():
    """Get path of the chromium executable."""
    chromiumExecutable = dict(
        linux = os.path.join(
            temporary_location,
            'chrome-linux',
            'chrome'
        ),
        mac = os.path.join(
            temporary_location,
            'chrome-mac',
            'Chromium.app',
            'Contents',
            'MacOS',
            'Chromium'
        ),
        win32 = os.path.join(
            temporary_location,
            'chrome-win32',
            'chrome.exe'
        ),
        win64 = os.path.join(
            temporary_location,
            'chrome-win32',
            'chrome.exe'
        )
    )
    return chromiumExecutable.get(
        current_platform()
    )

ph_timeout = 30
ph_idle_timeout = 3
ph_ajax_timeout = 3
errors = 0
base_location = os.getcwd()
temporary_folder = os.environ.get(
    'CHROMIUM_LOCATION',
    'local-chromium'
)
temporary_location = os.path.join(
    base_location,
    temporary_folder
)
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.binary_location = chromium_executable()
driver = webdriver.Chrome(
    executable_path = os.path.join(
        temporary_folder,
        'chromedriver'
    ),
    chrome_options = chrome_options
)

def timeout_alarm(*args):
    raise SeleniumTimeout

driver.get('https://fr-fr.facebook.com/santeplusmag/')

with open(os.path.join(base_location, 'hyphe_backend', 'crawler', 'hcicrawler', 'spiders', 'js', 'get_iframes_content.js')) as js:
    get_bod_w_iframes = js.read()

driver.execute_script(get_bod_w_iframes)

with open(os.path.join(base_location, 'hyphe_backend', 'crawler', 'hcicrawler', 'spiders', 'js', 'scrolldown_and_unfold.js')) as js:
    try:
        signal.signal(
            signal.SIGALRM,
            timeout_alarm
        )
        signal.alarm(
            ph_timeout + 30
        )
        timedout = driver.execute_async_script(
            js.read(), ph_timeout,
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

f1 = open(os.path.join(temporary_location, 'testfile.html'), 'w+')
f1.write(driver.page_source.encode('utf8'))
f1.close()

# assert 'Looking Back at Android Security in 2016' in driver.page_source
driver.close()
driver.quit()
