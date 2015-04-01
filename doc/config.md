# Configuration
===============

The default configuration should work by default for a local install (i.e. running on [http://localhost/hyphe](http://localhost/hyphe)), but you may want to provide a few finer settings. You can configure Hyphe's options by editing ```config/config.json```. Default options should fit most cases. Important options to set depending on your situation could be:
 * ```mongo-scrapy - proxy_host/proxy_port```: in case you want the crawler to make the requests through a proxy
 * ```mongo-scrapy - project```: in case you want to run multiple hyphe instances on the same machine
 * ```mongo-scrapy - max_depth```: the maximum depth allowed to the users for each individual crawl (meaning the number of clicks to be followed within a crawled WebEntity)
 * ```mongo-scrapy - download_delay```: the time (in seconds) after which the crawler will time out on a webpage
 * ```memoryStructure - lucene.path```: the directory in which the memoryStructure's data will be stored (can get as high as a few gigaoctets)
 * ```memoryStructure - log.level```: set to WARN or DEBUG to get more log within Lucene's log/memory-structure.log
 * ```twisted - port: the port through which the server and the web interface will communicate (_warning_ this requires to be replicated for the client in ```hyphe_www_client/_confi/config.json```)
 * ```precisionLimit```: the maximum precision to keep on links between crawled webpages, the value being the number of slashes after the root prefix of a WebEntity (see the wiki for more info)
 * ```DEBUG```: a value from 0 to 2 indicating the level of verbosity desired from the API core in log/hyphe-core.log


Frontend: analytics
optionnally core root url for distant access
