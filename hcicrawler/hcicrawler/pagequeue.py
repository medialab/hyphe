"""
This module defines the PageQueue interface.

For concrete implementation look in modules: hcicrawler.mongo
"""

class PageQueue(object):
    """This class implements the queue that the crawler will use for sending
    pages to the core
    """

    def push(self, page):
        """Push a page to the queue. ``page`` is a dict containing the page
        fields
        """
        raise NotImplementedError

    def pop(self):
        """Pop a page from the queue. Returns a dict containing the page
        fields, or None if the queue is empty.
        """
        raise NotImplementedError
