API documentation
=================

Hyphe relies on a [JsonRPC](http://www.jsonrpc.org/) API that can be controlled easily through the web interface or called directly from a JsonRPC client.

_Note:_ as it relies on the JSON-RPC protocol, it is not quite easy to test the API methods from a browser hacing to send arguments through POST, but you can test directly from the command-line using the dedicated tools, see the [Developpers' documentation](doc/dev.md).


## Default API commands (no namespace)

- __test\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")
 + _msg_ (optional, default: null)


- __list\_corpus:__


- __get\_corpus\_options:__
 + _corpus_ (optional, default: "--hyphe--")


- __set\_corpus\_options:__
 + _corpus_ (optional, default: "--hyphe--")
 + _options_ (optional, default: null)


- __create\_corpus:__
 + _name_ (optional, default: "--hyphe--")
 + _password_ (optional, default: "")
 + _options_ (optional, default: null)


- __start\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")
 + _password_ (optional, default: "")


- __stop\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")


- __ping:__
 + _corpus_ (optional, default: null)
 + _timeout_ (optional, default: 3)


- __reinitialize:__
 + _corpus_ (optional, default: "--hyphe--")

 Reinitializes both crawl jobs and memory structure.


- __destroy\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")


- __clear\_all:__


- __get\_status:__
 + _corpus_ (optional, default: "--hyphe--")


- __listjobs:__
 + _list\_ids_ (optional, default: null)
 + _from\_ts_ (optional, default: null)
 + _to\_ts_ (optional, default: null)
 + _corpus_ (optional, default: "--hyphe--")

 Runs a monitoring task on the list of jobs in the database to update their status from scrapy API and indexing tasks.


- __declare\_page:__
 + _url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __declare\_pages:__
 + _list\_urls_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __crawl\_webentity:__
 + _webentity\_id_ (mandatory)
 + _depth_ (optional, default: null)
 + _phantom\_crawl_ (optional, default: false)
 + _status_ (optional, default: "IN")
 + _startpages_ (optional, default: "default")
 + _phantom\_timeouts_ (optional, default: {})
 + _corpus_ (optional, default: "--hyphe--")

 Tells scrapy to run crawl on a WebEntity defined by its id from memory structure.


- __get\_webentity\_logs:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __lookup\_httpstatus:__
 + _url_ (mandatory)
 + _timeout_ (optional, default: 30)
 + _corpus_ (optional, default: "--hyphe--")


- __lookup:__
 + _url_ (mandatory)
 + _timeout_ (optional, default: 30)
 + _corpus_ (optional, default: "--hyphe--")



## Commands for namespace: "crawl."

- __deploy\_crawler:__
 + _corpus_ (optional, default: "--hyphe--")


- __cancel\_all:__
 + _corpus_ (optional, default: "--hyphe--")

 Stops all current crawls.


- __reinitialize:__
 + _corpus_ (optional, default: "--hyphe--")

 Cancels all current crawl jobs running or planned and empty mongodbs.


- __start:__
 + _webentity\_id_ (mandatory)
 + _starts_ (mandatory)
 + _follow\_prefixes_ (mandatory)
 + _nofollow\_prefixes_ (mandatory)
 + _follow\_redirects_ (optional, default: null)
 + _depth_ (optional, default: null)
 + _phantom\_crawl_ (optional, default: false)
 + _phantom\_timeouts_ (optional, default: {})
 + _download\_delay_ (optional, default: config['mongo-scrapy']['download\_delay'])
 + _corpus_ (optional, default: "--hyphe--")

 Starts a crawl with scrapy from arguments using a list of urls and of lrus for prefixes.


- __cancel:__
 + _job\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Cancels a scrapy job with id job\_id.


- __list:__
 + _corpus_ (optional, default: "--hyphe--")

 Calls Scrappy monitoring API
 + _returns list of scrapy jobs.


- __get\_job\_logs:__
 + _job\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")



## Commands for namespace: "store."

- __get\_webentity\_creationrules:__
 + _prefix_ (optional, default: null)
 + _corpus_ (optional, default: "--hyphe--")


- __delete\_webentity\_creationrule:__
 + _lru\_prefix_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __add\_webentity\_creationrule:__
 + _lru\_prefix_ (mandatory)
 + _regexp_ (mandatory)
 + _apply\_to\_existing\_pages_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")


- __simulate\_creationrules\_for\_urls:__
 + _pageURLs_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __simulate\_creationrules\_for\_lrus:__
 + _pageLRUs_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __reinitialize:__
 + _corpus_ (optional, default: "--hyphe--")


- __declare\_webentity\_by\_lruprefix\_as\_url:__
 + _url_ (mandatory)
 + _name_ (optional, default: null)
 + _status_ (optional, default: null)
 + _startPages_ (optional, default: [])
 + _corpus_ (optional, default: "--hyphe--")


- __declare\_webentity\_by\_lru:__
 + _lru\_prefix_ (mandatory)
 + _name_ (optional, default: null)
 + _status_ (optional, default: null)
 + _startPages_ (optional, default: [])
 + _corpus_ (optional, default: "--hyphe--")


- __declare\_webentity\_by\_lrus:__
 + _list\_lrus_ (mandatory)
 + _name_ (optional, default: null)
 + _status_ (optional, default: null)
 + _startPages_ (optional, default: [])
 + _corpus_ (optional, default: "--hyphe--")


- __rename\_webentity:__
 + _webentity\_id_ (mandatory)
 + _new\_name_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __change\_webentity\_id:__
 + _webentity\_old\_id_ (mandatory)
 + _webentity\_new\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __set\_webentity\_status:__
 + _webentity\_id_ (mandatory)
 + _status_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __set\_webentities\_status:__
 + _webentity\_ids_ (mandatory)
 + _status_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __set\_webentity\_homepage:__
 + _webentity\_id_ (mandatory)
 + _homepage_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __add\_webentity\_lruprefixes:__
 + _webentity\_id_ (mandatory)
 + _lru\_prefixes_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __rm\_webentity\_lruprefix:__
 + _webentity\_id_ (mandatory)
 + _lru\_prefix_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

  Will delete WebEntity if no LRUprefix left


- __add\_webentity\_startpage:__
 + _webentity\_id_ (mandatory)
 + _startpage\_url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __rm\_webentity\_startpage:__
 + _webentity\_id_ (mandatory)
 + _startpage\_url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __add\_webentity\_tag\_value:__
 + _webentity\_id_ (mandatory)
 + _tag\_namespace_ (mandatory)
 + _tag\_key_ (mandatory)
 + _tag\_value_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __add\_webentities\_tag\_value:__
 + _webentity\_ids_ (mandatory)
 + _tag\_namespace_ (mandatory)
 + _tag\_key_ (mandatory)
 + _tag\_value_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __rm\_webentity\_tag\_key:__
 + _webentity\_id_ (mandatory)
 + _tag\_namespace_ (mandatory)
 + _tag\_key_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __rm\_webentity\_tag\_value:__
 + _webentity\_id_ (mandatory)
 + _tag\_namespace_ (mandatory)
 + _tag\_key_ (mandatory)
 + _tag\_value_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __set\_webentity\_tag\_values:__
 + _webentity\_id_ (mandatory)
 + _tag\_namespace_ (mandatory)
 + _tag\_key_ (mandatory)
 + _tag\_values_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __merge\_webentity\_into\_another:__
 + _old\_webentity\_id_ (mandatory)
 + _good\_webentity\_id_ (mandatory)
 + _include\_tags_ (optional, default: false)
 + _include\_home\_and\_startpages\_as\_startpages_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")


- __merge\_webentities\_into\_another:__
 + _old\_webentity\_ids_ (mandatory)
 + _good\_webentity\_id_ (mandatory)
 + _include\_tags_ (optional, default: false)
 + _include\_home\_and\_startpages\_as\_startpages_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")


- __delete\_webentity:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __trigger\_links\_reset:__
 + _corpus_ (optional, default: "--hyphe--")


- __get\_precision\_exceptions:__
 + _corpus_ (optional, default: "--hyphe--")


- __delete\_precision\_exceptions:__
 + _list\_exceptions_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities\_stats:__
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentity:__
 + _we\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities\_page:__
 + _token_ (mandatory)
 + _page_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities\_ranking\_stats:__
 + _pagination\_token_ (mandatory)
 + _ranking\_field_ (optional, default: "indegree")
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities:__
 + _list\_ids_ (optional, default: null)
 + _light_ (optional, default: false)
 + _semilight_ (optional, default: false)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _light\_for\_csv_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")


- __advanced\_search\_webentities:__
 + _allFieldsKeywords_ (optional, default: [])
 + _fieldKeywords_ (optional, default: [])
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __escape\_search\_query:__
 + _query_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __exact\_search\_webentities:__
 + _query_ (mandatory)
 + _field_ (optional, default: null)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __prefixed\_search\_webentities:__
 + _query_ (mandatory)
 + _field_ (optional, default: null)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __postfixed\_search\_webentities:__
 + _query_ (mandatory)
 + _field_ (optional, default: null)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __free\_search\_webentities:__
 + _query_ (mandatory)
 + _field_ (optional, default: null)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities\_by\_status:__
 + _status_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities\_by\_name:__
 + _name_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities\_by\_tag\_value:__
 + _value_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities\_by\_tag\_category:__
 + _category_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities\_by\_user\_tag:__
 + _category_ (mandatory)
 + _value_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentity\_by\_lruprefix\_as\_url:__
 + _url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentity\_by\_lruprefix:__
 + _lru\_prefix_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentity\_for\_url:__
 + _url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentity\_for\_url\_as\_lru:__
 + _lru_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_tags:__
 + _corpus_ (optional, default: "--hyphe--")


- __get\_tag\_namespaces:__
 + _corpus_ (optional, default: "--hyphe--")


- __get\_tag\_categories:__
 + _namespace_ (optional, default: null)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_tag\_values:__
 + _namespace_ (optional, default: null)
 + _category_ (optional, default: null)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentity\_pages:__
 + _webentity\_id_ (mandatory)
 + _onlyCrawled_ (optional, default: true)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentity\_subwebentities:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentity\_parentwebentities:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_lru\_definedprefixes:__
 + _lru_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentities\_network\_json:__
 + _corpus_ (optional, default: "--hyphe--")


- __generate\_webentities\_network\_gexf:__
 + _corpus_ (optional, default: "--hyphe--")


- __get\_webentity\_nodelinks\_network\_json:__
 + _webentity\_id_ (optional, default: null)
 + _outformat_ (optional, default: "json")
 + _include\_external\_links_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")

