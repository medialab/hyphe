"""
This module defines interfaces for certain crawler components.

Implementations can be found in module: hcicrawler.mongo
"""

from zope.interface import Interface

class IPageStore(Interface):
    """The page store will be used by the crawler to store full crawled pages
    (including the body), keyed by url.
    """

    def store(key, page):
        """Store a page. ``page`` is a dict containing the page fields, and key
        is the key to store the page as.
        """
        raise NotImplementedError

    def load(key):
        """Load a page from the store. Returns a dict containing the page
        fields, or raises KeyError if not found.
        """
        raise NotImplementedError


class IPageQueue(Interface):
    """The queue that the crawler will use for sending pages to the core
    """

    def push(page):
        """Push a page to the queue. ``page`` is a dict containing the page
        fields
        """
        raise NotImplementedError

    def pop():
        """Pop a page from the queue. Returns a dict containing the page
        fields, or None if the queue is empty.
        """
        raise NotImplementedError
