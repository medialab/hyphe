from scrapy.item import Item, Field

class Page(Item):
    url = Field()
    lru = Field()
    status = Field()
    timestamp = Field()
    size = Field()
    encoding = Field()
    depth = Field()
    content_type = Field()
    redirects_to = Field()
    body = Field()
    lrulinks = Field()
    archive_url = Field()
    archive_date_requested = Field()
    archive_date_obtained = Field()
    error = Field()
