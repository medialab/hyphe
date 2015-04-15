# Configuration

## Backend core API

The default configuration should work by default for a local install (i.e. running on [http://localhost/hyphe](http://localhost/hyphe)), but you may want to provide a few finer settings. You can configure Hyphe's options by editing `config/config.json`.

Default options should fit for most cases.
Typical important options to set depending on your situation are highlighted as bold:

 - `mongo-scrapy [object]`: backend config for the database and the scrapy crawler
  + `host [str]`:
    
    usually `"localhost"`, but possibly another domain name or IP (no http://) of a machine on which both MongoDB and ScrapyD are installed and accept external access
  + `mongo_port [int]`:
    
    usually `27017`, the port on which MongoDB is served
  + __`proxy_host [str]` & `proxy_port [int]`__:
    
    in case you want the crawler to query the web through a http proxy (host should be a domain name, without http://)
  + `db_name [str]`:
    
    usually `"hyphe"`, the name of the MongoDB database that will host Hyphe's data. Typically useful when wanting to deploy multiple Hyphe instances on the same server
  + `scrapy_port [int]`:
    
    usually `6800`, the port on which ScrapyD is served
  + __`maxdepth [int]`__:
    
    usually `3`, the maximum depth allowed to the users for each individual crawl (meaning the number of clicks to be followed within a crawled WebEntity). Note that crawls with a depth of 3 and more can easily take hours depending on the crawled website
  + `download_delay [int]`:
    
    usually `1`, the pause time (in seconds) taken by the crawler between two queries of the same crawl
  + `max_simul_requests [int]`:
    
    usually `12`, the maximum number of concurrent queries performed by the crawler
  + `max_simul_requests_per_host [int]`:
    
    usually `1`, the maximum number of concurrent queries performed by the crawler on a same hostname

 - `memoryStructure [object]`: config for the Java Lucene part of Hyphe, defining the limits of possibly simultaneously running corpora, by default to 10
  + __`keepalive [int]`__:
    
    usually `1800`, the time (in seconds) after which a corpus which has not been used will automatically stop and free a slot for other corpora
  + __`thrift.portrange [2-ints array]`__:
    
    usually `[13500, 13509]`, an array of two ports values defining a minimum and a maximum values between which all possible ports can be used by each corpus' MemoryStructure to communicate via Thrift with the core API. Hyphe won't accept more simultaneously running corpus than the number of available ports
  + __`thrift.max_ram [int]`__:
    
    usually `2560`, the maximum ram possibly allocated to the MemoryStructure of all simultaneously running corpora. By default a corpus will start with 256Mo, and, possibly restyart with 256 more whenever the corpus grows too big and runs out of memory
  + __`lucene.rootpath [str]`__:
    
    usually the `lucene-data` directory within Hyphe's code, the absolute path to the directory in which the MemoryStructure data for each corpus will be stored (can get as high as a few gigaoctets per corpus)
  + `log.level [str]`:
    
    usually `"INFO"`, possibly `"WARN"`, `"DEBUG"` or `"TRACE"` to get more log within each Lucene MemoryStructure's log files (such as `log/hyphe-memory-structure-<corpus>.log`)
  + `max_simul_pages_indexing [int]`:
    
    usually `100`, advanced setting for internal performance adjustment, do not modify unless you know what you're doing
  + `max_simul_links_indexing [int]`:
    
    usually `10000`, advanced setting for internal performance adjustment, do not modify unless you know what you're doing

 - `twisted.port [int]`:
   
   usually `6978`, the port through which the server and the web interface will communicate. Typically useful when wanting to deploy multiple Hyphe instances on the same server

 - `precisionLimit [int]`:
   
   usually `2`, the maximum precision to keep on links between crawled webpages, the value being the number of slashes after the root prefix of a WebEntity ([read the wiki for more info](https://github.com/medialab/hyphe/wiki/Precision-limit)). Do not modify unless you know what you're doing

 - __`defaultCreationRule [str]`__:
   
   usually `"domain"`, possibly one of `"subdomain"`, `"subdomain-<N>"`, `"domain"`, `"path-<N>"`, `"page"`, `"prefix+<N>"`. Sets the default behavior when discovering new web pages, meaning the creation of a new WebEntity for each different discovered `"domain"`, `"subdomain"`, etc. `<N>` being an integer. Read [more about creation rules in the wiki](https://github.com/medialab/hyphe/wiki/Web-entities#web-entities-creation-rules) and the [dedicated code](/hyphe_backend/lib/creationrules.py)

 - __`creationRules [object]`__:
   
   see default values for example, an object defined with domain names as keys and creationrules as values (read `defaultCreationRule` above for explanations on creationrules)

 - __`discoverPrefixes [str array]`__:
   
   see default values for example, a list of domain names for which the crawler will automatically try to resolve redirections in order to avoid having links shorteners in the middle of the graph of links

 - `phantom [object]`: settings for crawl jobs using PhantomJS to simulate a human browsing the webpages, scrolling and clicking on any possible interactive part (still experimental, do not modify unless you know what you're doing)
  + `autoretry [bool]`:
    
    `false` for now, set to `true` to enable auto retry of crawl jobs having apparently failed (depth > 0 & pages found < 3)
  + `timeout [int]`:
    
    usually `600`, the maximum time in seconds PhantomJS is allowed to spend on one single page (10 minutes are required for instance to load all hidden content on big Facebook group pages for instance)
  + `idle_timeout [int]`:
    
    usually `20`, the maximum time in seconds after which PhantomJS will consider the page properly crawled if nothing happened within during that time
  + `ajax_timeout [int]`:
    
    usually `15`, the maximum time in seconds allowed to any Ajax query performed within a crawled page
  + `whitelist_domains [str array]`:
    
    empty for now, a list of domain names for which the crawler will automatically use PhantomJS (meant for instance in the long term for Facebook, Twitter or Google)

 - `MULTICORPUS [bool]`:
   
   normally `true`, mainly for retrocompatibility, but can be set to `false` to allow only one corpus (called --hyphe--)

 - __`ADMIN_PASSWORD [str]`__:
   
   usually unset, but can be defined to a string that will be accepted as the password by all existing corpora to let admins access them for administration use

 - __`DEBUG [int]`__:
   
   a value from `0` to `2` indicating the level of verbosity desired from the API core in `log/hyphe-core.log`


__Note:__ Many of these settings are configurable per corpus individual. Although the webapp interface does not allow to set them yet, they can be adjusted via [the command line client to the API](dev.md) using the [set_corpus_options method](https://github.com/medialab/hyphe/blob/master/doc/api.md#default-api-commands-no-namespace). See the list of settable corpus options [here](/hyphe_backend/lib/config_hci.py#L182-L201).


## Frontend webapp

`hyphe_frontend/app/conf/conf.js`

 - analytics id
 - optionally core root url for distant access
