import os, sys

def which(pgm):
    path = os.getenv('PATH')
    for p in path.split(os.path.pathsep):
        p = os.path.join(p, pgm)
        if os.path.exists(p) and os.access(p, os.X_OK):
            return p

def is_docker():
    try:
        with open('/proc/1/cgroup') as f:
            return '/docker/' in f.read()
    except:
        return False

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

def chromium_executable(directory):
    """Get path of the chromium executable."""
    if is_docker():
        return which('chromium-browser')
    chromiumExecutable = dict(
        linux = os.path.join(
            directory,
            'chrome-linux',
            'chrome'
        ),
        mac = os.path.join(
            directory,
            'chrome-mac',
            'Chromium.app',
            'Contents',
            'MacOS',
            'Chromium'
        ),
        win32 = os.path.join(
            directory,
            'chrome-win32',
            'chrome.exe'
        ),
        win64 = os.path.join(
            directory,
            'chrome-win32',
            'chrome.exe'
        )
    )
    return chromiumExecutable.get(
        current_platform()
    )

def chrome_driver_executable(directory):
    """Get path of the chrome driver executable."""
    if is_docker():
        return which('chromedriver')
    executable = 'chromedriver'
    if 'win' in current_platform():
        executable += ".exe"
    return os.path.join(
        directory,
        executable
    )

