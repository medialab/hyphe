# Roadmap

To let you know where we're heading, we describe here what we have in mind for Hyphe's future evolutions.

## Next features in the pile

- Display a webentity's ego network
- Import a previously exported corpus of web entities, and autorebuild & recrawl it from scratch in a few clicks
- Stabilize javascript enabled crawling (using for instance PhantomJS 2, Pupeteer, Fathom...)
- Advanced corpus and crawls settings from the interface (already accesible from the API only)
- Propose a monitoring tool to identify possibly failed or incomplete crawls


## New features we are dreaming about

### - Text-content analysis:

Since Hyphe keeps the HTML sourcecode of all crawled webpages in a MongoDB database, Hyphe could potentially provide text-analysis for the contents of a webentity or a corpus.
Until we can integrate this, we already developed a small set of python scripts to easily index the text-content of each webentity of a hyphe corpus into a SolR engine (see [hyphe2solr](http://github.com/medialab/hyphe2solr)).

This experimental prototype might be developed further or embedded in order to add text search and analysis into Hyphe.

### - Time evolution of a corpus:

One of our dreams would be to allow longitudinal analysis of web corpora though time. To do that, we have so far to first build a corpus, then redefine and recrawl it from scratch at different times.

It would be nice to include the concept of the time evolution of a web corpus in Hyphe. The future complete refactoring of the memory structure (see below) might be the good occasion to address this idea.


## Refactoring we have in mind

Hyphe already has a long story of development. Almost 8 years have passed since the very first idea and multiple full rewrites already happened. But parts of the software's architecture could still benefit from some more cleaning.

### - A new core API?

We are thinking about dropping the JSON-RPC protocol to move to REST for the core API.

This work will also be the occasion to clean, refactor and rethink the whole API design.

### - A new crawler?

Hyphe currently relies on Scrapy for its crawling part. It works quite well but we are experiencing problematic limitations in terms of packaging, especially with ScrapyD not being ditributed as a daemon anymore.

For a better maintainability, we are thinking about switching to our own crawler, still in active development: [sandcrawler](http://github.com/medialab/sandcrawler).

