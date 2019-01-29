"""Chromium download module."""

from io import BytesIO
# import logging
import os
# from pathlib import Path
# import stat
import sys
from zipfile import ZipFile

import urllib3
from tqdm import tqdm

# from pyppeteer import __chromium_revision__, __pyppeteer_home__

__chromium_revision__ = '71.0.3578.127'
# __pyppeteer_home__ = os.environ.get('PYPPETEER_HOME', AppDirs('pyppeteer').user_data_dir)
__pyppeteer_home__ = './'
# https://dl.google.com/chrome/mac/stable/GGRO/googlechrome.dmg
# https://commondatastorage.googleapis.com/chromium-browser-snapshots/Mac/LAST_CHANGE
# https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Mac/626932/
# https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Mac%2F626932%2Fchrome-mac.zip?generation=1548755152176266&alt=media
DOWNLOADS_FOLDER = os.path.join(__pyppeteer_home__, 'local-chromium')
DEFAULT_DOWNLOAD_HOST = 'https://commondatastorage.googleapis.com'
DOWNLOAD_HOST = DEFAULT_DOWNLOAD_HOST
BASE_URL = '%s/chromium-browser-snapshots' % (DOWNLOAD_HOST)

REVISION = os.environ.get(
    'PYPPETEER_CHROMIUM_REVISION',
    __chromium_revision__
  )

NO_PROGRESS_BAR = os.environ.get('PYPPETEER_NO_PROGRESS_BAR', '')
if NO_PROGRESS_BAR.lower() in ('1', 'true'):
    NO_PROGRESS_BAR = True  # type: ignore

downloadURLs = {
    'linux': '%s/Linux_x64/%s/chrome-linux.zip' % (BASE_URL, REVISION),
    'mac': '%s/Mac/%s/chrome-mac.zip' % (BASE_URL, REVISION),
    'win32': '%s/Win/%s/chrome-win32.zip' % (BASE_URL, REVISION),
    'win64': '%s/Win_x64/%s/chrome-win32.zip' % (BASE_URL, REVISION),
}
chromiumExecutable = {
    'linux': os.path.join(DOWNLOADS_FOLDER, REVISION, 'chrome-linux', 'chrome'),
    'mac': os.path.join(DOWNLOADS_FOLDER, REVISION, 'chrome-mac', 'Chromium.app',
            'Contents', 'MacOS', 'Chromium'),
    'win32': os.path.join(DOWNLOADS_FOLDER, REVISION, 'chrome-win32', 'chrome.exe'),
    'win64': os.path.join(DOWNLOADS_FOLDER, REVISION, 'chrome-win32', 'chrome.exe'),
}

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


def get_url():
    """Get chromium download url."""
    print('iciiiiiiii')
    print(downloadURLs[current_platform()])
    return "https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Mac%2F626932%2Fchrome-mac.zip?generation=1548755152176266&alt=media"
    return downloadURLs[current_platform()]


def download_zip(url):
    """Download data from url."""
    print('start chromium download.\n'
                   'Download may take a few minutes.')

    # disable warnings so that we don't need a cert.
    # see https://urllib3.readthedocs.io/en/latest/advanced-usage.html for more
    urllib3.disable_warnings()

    print('ici')
    print(url)

    with urllib3.PoolManager() as http:
        # Get data from url.
        # set preload_content=False means using stream later.
        data = http.request('GET', url, preload_content=False)

        try:
            total_length = int(data.headers['content-length'])
        except (KeyError, ValueError, AttributeError):
            total_length = 0

        process_bar = tqdm(
            total=total_length,
            file=os.devnull if NO_PROGRESS_BAR else None,
        )

        # 10 * 1024
        _data = BytesIO()
        for chunk in data.stream(10240):
            _data.write(chunk)
            process_bar.update(len(chunk))
        process_bar.close()

    print('\nchromium download done.')
    return _data

def which(pgm):
    path=os.getenv('PATH')
    for p in path.split(os.path.pathsep):
        p=os.path.join(p,pgm)
        if os.path.exists(p) and os.access(p,os.X_OK):
            return p

def extract_zip(data, path):
    """Extract zipped data to path."""
    # On mac zipfile module cannot extract correctly, so use unzip instead.
    print("%s/chrome.zip" % (path))
    with ZipFile(data) as zf:
        zf.extractall("%s/chrome.zip" % (path))
    exec_path = chromium_executable()
    if not exec_path.exists():
        raise IOError('Failed to extract chromium.')
    exec_path.chmod(exec_path.stat().st_mode | stat.S_IXOTH | stat.S_IXGRP |
                    stat.S_IXUSR)
    print('chromium extracted to: %s' % (path))


def download_chromium():
    """Download and extract chromium."""
    extract_zip(download_zip(get_url()), os.path.join(DOWNLOADS_FOLDER, REVISION))


def chromium_excutable():
    """[Deprecated] miss-spelled function.

    Use `chromium_executable` instead.
    """
    print(
        '`chromium_excutable` function is deprecated. '
        'Use `chromium_executable instead.'
    )
    return chromium_executable()


def chromium_executable():
    """Get path of the chromium executable."""
    return chromiumExecutable[current_platform()]


def check_chromium():
    """Check if chromium is placed at correct path."""
    return chromium_executable().exists()

print(download_chromium())