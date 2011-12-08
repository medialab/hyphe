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

    # only available in GETs
    body = Field()
    lrulinks = Field()
