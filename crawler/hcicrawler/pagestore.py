"""
This module defines the PageStore interface.

For concrete implementation look in modules: hcicrawler.mongo
"""

class PageStore(object):
    """This class implements the page store that the crawler will use for
    storing crawled pages
    """

    def store(self, key, page):
        """Store a page. ``page`` is a dict containing the page fields, and key
        is the key to store the page as.
        """
        raise NotImplementedError

    def load(self, key):
        """Load a page from the store. Returns a dict containing the page
        fields, or raises KeyError if not found.
        """
        raise NotImplementedError
