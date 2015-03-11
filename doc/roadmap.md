
To let you know where we're heading, we describe here Hyphe's evolutions we can forsee.

## new features we are dreaming about

### in-context prospection
Define a way to let the user decide what to do with a web entity while browsing its content.
We can't do that directly in Hyphe application using iframe because of framebreakers.

Maybe a web browser application or plugin to add a hyphe toolbar ?

### text analysis
Hyphe keeps the HTML sourcecode of crawled webpages in a mongo database.
We are interesting in analysing the texts of one Hyphe corpus.
We developed a small scripts which let you import your hyphe corpus into a solr engin. 
see [hyphe2solr](http://github.vom/medialab/hyphe2solr)

This experimental script might be developed further to add text search and analysis into hyphe.

### Time
One of our dream will be to allow longitudinal analysis of web corpora. 
So far we build one corpus and recrawl it from scratch at different time to do that.

It would be nice to include the concept of web corpus evolution in time in Hyphe.
An idea to address if we open the big subject of memory structure refactoring (see bellow).


## refactoring we have in mind
Hyphe has already a long story of development. Almost 5 years since the very first idea.
Part of the software architecture needs some cleaning.

### core API
We are thinking about dropping the JSON RPC protocol to move to REST for the core API.
This work would also be the occasion to rethink the API design.

### a new crawler ?
Hyphe uses scrapy for the crawler module.
Works well but we are experiencing some limitations with scrapyd.
We are thinking about moving to our own crawler: sandcrawler.

### a new memory structure ?
We chose Lucene as a memory structure on the advices of some web archive colleagus.
We achieved a good performance with this but we complex querying which doesn't fit nicely in our index-only memory structure..
One big project we are considering would be to test an other way to store and query Hyphe data.
Maybe some graph database with built-in lucene index might help us out ?

