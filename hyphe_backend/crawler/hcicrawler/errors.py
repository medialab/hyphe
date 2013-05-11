error_map = {
    'TimeoutError': 'timeout_error',
    'ConnectError': 'connection_error',
    'ConnectionDone': 'connection_error',
    'ConnectionLost': 'connection_error',
    'ConnectionRefusedError': 'connection_error',
    'DNSLookupError': 'dns_error',
    'TCPTimedOutError': 'timeout_error',
    'PartialDownloadError': 'connection_error',
}


def error_name(exc):
    ename = type(exc).__name__
    if ename == 'DefaultException':
        return str(exc)
    else:
        return error_map.get(ename, "unknown (%s)" % ename)
