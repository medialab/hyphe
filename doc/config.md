# Configuration

The following describes all configuration options one can set for Hyphe.

For installations using Docker, most of these variables should be set using Environment variables to be defined in the files `config-backend.env` and `config-frontend.env`. Docker unfortunately does not support environment variables on multiple lines, so even though it is not much readable, the variables which are expressed ad arrays or JSON objects should always remain monoline and not be surrounded by quotes (as in the `config-backend.env.example`).

Some rare advanced options are not directly configurable for Docker using these Environment variables. You should not require those for most uses, but if necessary, you can set them up by editing the files within the `config` directory of Hyphe after the Docker container has been started at least once (use `docker volume ls` to identify the config volume, then `docker volume inspect <VOLUME_NAME>` to collect the path given in `Mountpoint`, you will find the config files to edit within using sudo).


## Backend core API

The default configuration should work by default for a local install (i.e. running on [http://localhost/hyphe](http://localhost/hyphe)), but you may want to provide a few finer settings. You can configure Hyphe's options by editing `config/config.json` (or `config-backend.env` for Docker installs).

Default options should fit for most cases.
Typical important options to set depending on your situation are highlighted as bold:

- `mongo-scrapy [object]`: backend config for the database and the scrapy crawler

  + `host [str]` (in Docker: `HYPHE_MONGODB_HOST`):

    usually `"localhost"`, but possibly another domain name or IP (no http://) of a machine on which both MongoDB and ScrapyD are installed and accept external access (irrelevant for most Docker installs)

  + `mongo_port [int]` (in Docker: `HYPHE_MONGODB_PORT`):

    usually `27017`, the port on which MongoDB is served (irrelevant for most Docker installs)

  + __`proxy_host [str]`__ & __`proxy_port [int]`__ (in Docker: __`HYPHE_PROXY_HOST`__ & __`HYPHE_PROXY_PORT`__):

    in case you want the crawler to query the web through a http proxy (host should be a domain name, without http://)

  + `db_name [str]` (in Docker: `HYPHE_MONGODB_DBNAME`):

    usually `"hyphe"`, the name of the MongoDB database that will host Hyphe's data. Typically useful when wanting to deploy multiple Hyphe instances on the same server (irrelevant for most Docker installs)

  + `scrapy_port [int]` (in Docker: `HYPHE_CRAWLER_PORT`):

    usually `6800`, the port on which ScrapyD is served (irrelevant for most Docker installs)

  + __`max_depth [int]`__ (in Docker: __`HYPHE_MAXDEPTH`__):

    usually `3`, the maximum depth allowed to the users for each individual crawl (meaning the number of clicks to be followed within a crawled WebEntity). Note that crawls with a depth of 3 and more can easily take hours depending on the crawled website

  + `download_delay [int]` (in Docker: `HYPHE_DOWNLOAD_DELAY`):

    usually `1`, the pause time (in seconds) taken by the crawler between two queries of the same crawl

  + __`store_crawled_html_content [bool]`__ (in Docker __`HYPHE_STORE_CRAWLED_HTML`__):

    usually `false`, lets one enable archiving of full zipped HTML content of webpages crawled in MongoDB. This has to be set to true to use Hyphe in combination with [hyphe2solr](http://github.com/medialab/hyphe2solr). Set to false to consume a lot less hard drive space.

  + `max_simul_requests [int]` (in Docker: `HYPHE_MAX_SIM_REQ`):

    usually `12`, the maximum number of concurrent queries performed by the crawler

  + `max_simul_requests_per_host [int]` (in Docker: `HYPHE_HOST_MAX_SIM_REQ`):

    usually `1`, the maximum number of concurrent queries performed by the crawler on a same hostname


- `traph [object]`: config for the data structure

  + __`keepalive [int]`__ (in Docker: __`HYPHE_TRAPH_KEEPALIVE`__):

    usually `1800`, the time (in seconds) after which a corpus which has not been used will automatically stop and free a slot for other corpora

  + __`data_path [str]`__ (in Docker: __`HYPHE_TRAPH_DATAPATH`__):

    usually the `lucene-data` directory within Hyphe's code, the absolute path to the directory in which the MemoryStructure data for each corpus will be stored (can get as high as a few gigaoctets per corpus) (irrelevant for most Docker installs)

  + `max_simul_pages_indexing [int]` (in Docker: `HYPHE_TRAPH_MAX_SIM_PAGES`):

    usually `250`, advanced setting for internal performance adjustment, do not modify unless you know what you're doing


- `core_api_port [int]` (irrelevant for Docker):

  usually `6978`, the port through which the server and the web interface will communicate. Typically useful when wanting to deploy multiple Hyphe instances on the same server


- __`defaultStartpagesMode [str | str array]`__ (in Docker: __`HYPHE_DEFAULT_STARTPAGES_MODE`__):

  usually `["homepage", "prefixes", "pages-5"]`, possibly one or many of `"homepage"`, `"startpages"`, `"prefixes"`, `"pages-<N>"`. Sets the default behavior when crawling discovered WebEntities with no startpage manually set. When using only `"startpages"`, crawl will fail on WebEntities with no humanly set startpage. With other options, Hyphe will try respectively the `"N"` most linked pages known of the WebEntity (`"pages-<N>"`) or all of its prefixes (`"prefixes"`), then add them automatically to the WebEntity's startpages on success during crawl.


- __`defaultCreationRule [str]`__ (in Docker: __`HYPHE_DEFAULT_CREATION_RULE`__):

  usually `"domain"`, possibly one of `"subdomain"`, `"subdomain-<N>"`, `"domain"`, `"path-<N>"`, `"page"`, `"prefix+<N>"`. Sets the default behavior when discovering new web pages, meaning the creation of a new WebEntity for each different discovered `"domain"`, `"subdomain"`, etc. `<N>` being an integer. Read [more about creation rules in the wiki](https://github.com/medialab/hyphe/wiki/Web-entities#web-entities-creation-rules) and the [dedicated code](/hyphe_backend/lib/creationrules.py)


- __`creationRules [object]`__ (in Docker: __`HYPHE_CREATION_RULES`__):

  see default values for example, an object defined with domain names as keys and creationrules as values (read `defaultCreationRule` above for explanations on creationrules)


- __`discoverPrefixes [str array]`__ (in Docker: __`HYPHE_FOLLOW_REDIRECTS`__):

  see default values for example, a list of domain names for which the crawler will automatically try to resolve redirections in order to avoid having links shorteners in the middle of the graph of links


- `phantom [object]`: settings for crawl jobs using PhantomJS to simulate a human browsing the webpages, scrolling and clicking on any possible interactive part (still experimental and unstable, do not modify unless you know what you're doing) (unavailable in Docker installs for now)

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


- __`ADMIN_PASSWORD [str]`__ (in Docker: __`HYPHE_ADMIN_PASSWORD`__):

  usually unset, but can be defined to a string that will be accepted as the password by all existing corpora to let admins access them for administration use


- __`OPEN_CORS_API [bool]`__ (in Docker: __`HYPHE_OPEN_CORS_API`__):

  usually set to `false`, enable only when you want to allow another frontend web instance to query the core API from another web domain


- __`DEBUG [int]`__ (in Docker: __`HYPHE_DEBUG`__):

  a value from `0` to `2` indicating the level of verbosity desired from the API core in `log/hyphe-core.log`


__Note:__ Many of these settings are configurable per corpus individually. A corpus is configured along with Hyphe's global config on creation. Although the webapp interface does not allow to set them yet, they can be adjusted via [the command line client to the API](dev.md) using the [set_corpus_options method](https://github.com/medialab/hyphe/blob/master/doc/api.md#default-api-commands-no-namespace). See the list of settable corpus options [here](/hyphe_backend/lib/config_hci.py#L131-L167).


## Frontend webapp

A few adjustments can be set to the frontend by editing the file `hyphe_frontend/app/conf/conf.js`:

- `serverURL` (irrelevant for Docker installs):
    
  The path to Hyphe's core API. Default is `/hyphe-api` which corresponds to the url to which the API is proxied within `config/apache2.conf`. Useful to plug and develop a frontend onto an Hyphe instance without having it locally installed.

- `googleAnalyticsId` (in Docker: `HYPHE_GOOGLE_ANALYTICS_ID`):
    
  A Google Analytics ID to track use of the tool's web interface. Default is an empty string.

- `disclaimer` (in Docker: `HYPHE_DISCLAIMER`):
    
  A text to be displayed in the left column of Hyphe's website to give some extra info to users (mainly used for the Demo version)

- `hyBroURL` (in Docker: `HYPHE_BROWSER_URL`):
    
  A direct link URL to a web directory hosting build installs of Hyphe Browser
