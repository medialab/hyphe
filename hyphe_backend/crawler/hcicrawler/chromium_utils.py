import os, sys

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
    executable = 'chromedriver'
    if 'win' in current_platform():
        executable += ".exe"
    return os.path.join(
        directory,
        executable
    )

