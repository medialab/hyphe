# Roadmap

To let you know where we're heading, we describe here what we have in mind for Hyphe's future evolutions.

## Next features in the pile

- Import a webentities corpus and autorecrawl from scratch from a previously exported corpus
- Stable javascript enabled crawling using new Phantom v2.0
- Autoprovide each discovered webentity with a main root url and possible startpages
- Display a webentity's ego network
- Advanced corpus and crawls settings from the interface (already accesible from the API only)
- Propose a monitoring tool to identify possibly failed or incomplete crawls


## New features we are dreaming about

### - A tagging interface:

Hyphe already permits to catalog webentities with rich tagging (namespace:key=value) through its API, but we didn't have the time to build the dedicated User Interface yet.

### - In-context prospection:

At the core of Hyphe's methodology, the web interface's "Prospect" tool aims at easily let the user decide what to do with discovered web entities. Although such prospection work would be greatly eased if it could be done while browsing the pages content at the same time.

We unfortunately cannot do that directly in Hyphe's website using an iframe because of the many websites using framebreakers to forbid their embedding. Some framebreakers can easily be bypassed, but the main one using the HTTP header "X-Frame-Options" can only be overruled by having the hand on the browser.

In consequence, we could provide Hyphe as a web browser application or plugin in order to add a Hyphe toolbar allowing such in-place prospection.

### - Text-content analysis:

Since Hyphe keeps the HTML sourcecode of all crawled webpages in a MongoDB database, Hyphe could potentially provide text-analysis for the contents of a webentity or a corpus.
Until we can integrate this, we already developed a small set of python scripts to easily index the text-content of each webentity of a hyphe corpus into a SolR engine (see [hyphe2solr](http://github.com/medialab/hyphe2solr)).

This experimental prototype might be developed further or embedded in order to add text search and analysis into Hyphe.

### - Time evolution of a corpus:

One of our dreams would be to allow longitudinal analysis of web corpora though time. To do that, we have so far to first build a corpus, then redefine and recrawl it from scratch at different times.

It would be nice to include the concept of the time evolution of a web corpus in Hyphe. The future complete refactoring of the memory structure (see below) might be the good occasion to address this idea.


## Refactoring we have in mind

Hyphe already has a long story of development. Almost 5 years have passed since the very first idea. So part of the software's architecture requires some cleaning.

### - A new core API?

We are thinking about dropping the JSON-RPC protocol to move to REST for the core API.

This work will also be the occasion to clean, refactor and rethink the whole API design.

### - A new crawler?

Hyphe currently relies on Scrapy for its crawling part. It works quite well but we are experiencing problematic limitations in terms of packaging, especially with ScrapyD, for which we had to build homemade Debian & CentOS packages.

For a better maintainability, we are thinking about switching to our own crawler, still in active development: [sandcrawler](http://github.com/medialab/sandcrawler).

### - A new memory structure?

An important technology challenge to overpass by Hyphe is the storage of a great deal of urls and links between them. On the advice of some web archives colleagues, we chose to build the memory structure on the grounds of Lucene, which is great for querying along prefixes.

We achieved a good performance with this but we also experiment some limitations in the case of some advanced uses, for instance when dealing with mainly nested webentities/

One big project we are considering would be to test other ways to store and query Hyphe's data, maybe some graph database engines with built-in Lucene index such as Neo4J might help us out?

