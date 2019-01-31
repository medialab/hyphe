#!/usr/bin/env python
# coding: utf8
"""Chromium download module."""

import sys, stat, os, shutil
import urllib3
from io import BytesIO
from zipfile import ZipFile
from tqdm import tqdm

from hcicrawler.chromium_utils import current_platform, chromium_executable, chrome_driver_executable

FILEDIR = os.path.dirname(os.path.realpath(__file__))
LOCALDIR = os.path.join(FILEDIR, 'local-chromium')
if not os.path.exists(LOCALDIR):
    os.makedirs(LOCALDIR)

# Version number provided via https://commondatastorage.googleapis.com/chromium-browser-snapshots/Mac/LAST_CHANGE
chromium_working_version = '624487'
VERSION = os.environ.get(
    'CHROMIUM_VERSION',
    chromium_working_version
)
DOWNLOAD_HOST = 'https://storage.googleapis.com'
BASE_URL = '%s/chromium-browser-snapshots' % DOWNLOAD_HOST
NO_PROGRESS_BAR = os.environ.get('NO_PROGRESS_BAR', '')
if NO_PROGRESS_BAR.lower() in ('1', 'true'):
    NO_PROGRESS_BAR = True

def get_chromium_url(base_url, version):
    """Get chromium download url."""
    chromiumDownloadURLs = dict(
        linux = '%s/Linux_x64/%s/chrome-linux.zip' % (base_url, version),
        mac = '%s/Mac/%s/chrome-mac.zip' % (base_url, version),
        win32 = '%s/Win/%s/chrome-win32.zip' % (base_url, version),
        win64 = '%s/Win_x64/%s/chrome-win32.zip' % (base_url, version),
    )
    url = chromiumDownloadURLs.get(current_platform())
    print('Getting chromium at : %s' % url)
    return url

def get_chrome_driver_url (base_url, version):
    """Get chrome_driver download url."""
    chromeDriverDownloadURLs = dict(
        linux = '%s/%s/chromedriver_linux64.zip' % (base_url, version),
        mac = '%s/%s/chromedriver_mac64.zip' % (base_url, version),
        win32 = '%s/%s/chrome-win32.zip' % (base_url, version),
        win64 = '%s/%s/chromedriver_win32.zip' % (base_url, version),
    )
    url = chromeDriverDownloadURLs.get(current_platform())
    print('Getting chrome driver at : %s' % url)
    return url

def download_zip(url):
    """Download data from url."""
    print('start download.\n'
                   'Download may take a few minutes.')

    # disable warnings so that we don't need a cert.
    # see https://urllib3.readthedocs.io/en/latest/advanced-usage.html for more
    urllib3.disable_warnings()

    with urllib3.PoolManager() as http:
        # Get data from url.
        # set preload_content=False means using stream later.
        response = http.request('GET', url, preload_content=False)

        try:
            total_length = int(response.headers['content-length'])
        except (KeyError, ValueError, AttributeError):
            total_length = 0

        process_bar = tqdm(
            total = total_length,
            file = os.devnull if NO_PROGRESS_BAR else None,
            unit_scale = True,
        )

        # 10 * 1024
        data = BytesIO()
        for chunk in response.stream(10240):
            data.write(chunk)
            process_bar.update(len(chunk))
        process_bar.close()

    print('\ndownload done.')
    return data

def which(pgm):
    path = os.getenv('PATH')
    for p in path.split(os.path.pathsep):
        p = os.path.join(p, pgm)
        if os.path.exists(p) and os.access(p, os.X_OK):
            return p

def rm_r(path):
    if os.path.isdir(path) and not os.path.islink(path):
        shutil.rmtree(path)
    elif os.path.exists(path):
        os.remove(path)

def extract_zip(data, path, exec_path):
    """Extract zipped data to path."""
    if not os.path.exists(path):
        os.makedirs(path)
    # On mac zipfile module cannot extract correctly, so use unzip instead.
    if current_platform() == 'mac':
        import subprocess
        zip_path = '%s/chrome.zip' % path
        rm_r(zip_path)
        with open(zip_path, 'wb') as f:
            f.write(data.getvalue())
        if not which('unzip'):
            raise OSError('Failed to automatically extract zip file. Please unzip %s manually.' % zip_path)
        proc = subprocess.call(
            ['unzip', zip_path],
            cwd = str(path),
            stdout = subprocess.PIPE,
            stderr = subprocess.STDOUT,
        )
        if proc != 0:
            raise OSError('Failed to unzip %s with error %s.' % (zip_path, proc))
        else:
            rm_r(zip_path)
    else:
        with ZipFile(data) as zf:
            zf.extractall(str(path))
    if not os.path.exists(exec_path):
        raise IOError('Failed to extract chromium.')
    os.chmod(
        exec_path,
        os.stat(exec_path).st_mode | stat.S_IXOTH | stat.S_IXGRP | stat.S_IXUSR
    )
    print('chromium extracted to: %s' % (path))

def download_chromium(directory):
    """Download and extract chromium."""
    extract_zip(
        download_zip(
            get_chromium_url(
                BASE_URL,
                VERSION
            )
        ),
        directory,
        chromium_executable(LOCALDIR)
    )

def download_chrome_driver(directory):
    url = get_chrome_driver_url(
        'http://chromedriver.storage.googleapis.com',
        '2.45'
    )
    return extract_zip(
        download_zip(
            url
        ),
        directory,
        chrome_driver_executable(LOCALDIR)
    )

INSTALLDIR = sys.argv[1] if len(sys.argv) > 1 else LOCALDIR
rm_r(INSTALLDIR)
download_chromium(INSTALLDIR)
download_chrome_driver(INSTALLDIR)
