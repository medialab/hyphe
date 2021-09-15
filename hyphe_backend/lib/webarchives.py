import re

ARCHIVES_OPTIONS = {
    "": {
        "label": "Live Web",
        "description": "crawl the live web, not any kind of web archive"
    },
    "web.archive.org": {
        "label": "Web.Archive.org",
        "description": "crawl worldwide web archives maintained by Archive.org",
        "url_prefix": "https://web.archive.org/web/",
        "min_date": "1996-01-01"
    },
    "archivesinternet.bnf.fr": {
        "label": "ArchivesInternet.BNF.fr",
        "description": "crawl France's official web archives maintained by BNF",
        "url_prefix": "http://pfcarchivesinternet.bnf.fr",
        "url_prefix_prod": "http://archivesinternet.bnf.fr",
        "proxy": "pfcarchivesinternet.bnf.fr:9115",
        "proxy_prod": "archivesinternet.bnf.fr:8090",
        "min_date": "1996-01-01"
    }
}


def validateOption(value):
    return type(value) in [str, bytes, unicode] and value.lower() in [x.lower() for x in ARCHIVES_OPTIONS.keys()]


def validateOptions(values):
    return all(validateOption(v) for v in values)


def validateArchiveDate(dt):
    """be a string or an int of the form YYYYSMMSDD with S being non numerical separators or empty and year comprised between 1980 and 2050."""
    try:
        valid_dt = re.sub(r"\D", "", str(dt))
        if len(valid_dt) != 8:
            return False
        year = int(valid_dt[0:4])
        month = int(valid_dt[4:6])
        day = int(valid_dt[6:8])
        if not (
            1980 <= year <= 2050 and
            1 <= month <= 12 and
            1 <= day <= 31
        ):
            return False
    except:
        return False
    return True

RE_ARCHIVE_REDIRECT = r'function go\(\) \{.*document.location.href = "(%s/[^"]*)".*<p class="code shift red">Got an HTTP (\d+) response at crawl time</p>.*<p class="code">Redirecting to...</p>'
RE_BNF_ARCHIVES_PERMALINK = re.compile(r'<input id="permalink" class="BANNER_PERMALIEN_LINK_CUSTOMED" value="([^"]+)"')
RE_BNF_ARCHIVES_BANNER = re.compile(r'<!--[\r\n]+\s+FILE ARCHIVED ON .*<!--[\r\n]+\s+END.*?-->', re.DOTALL)

