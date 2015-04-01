API documentation
=================

Hyphe relies on a [JsonRPC](http://www.jsonrpc.org/) API that can be controlled easily through the web interface or called directly from a JsonRPC client.

_Note:_ as it relies on the JSON-RPC protocol, it is not quite easy to test the API methods from a browser (having to send arguments through POST), but you can test directly from the command-line using the dedicated tools, see the [Developpers' documentation](dev.md).


## Default API commands (no namespace)

- __test\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns the current status of corpus: ready/starting/stopped/error.


- __list\_corpus:__

 Returns the list of all existing corpora with metas.


- __get\_corpus\_options:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns detailed settings of a corpus.


- __set\_corpus\_options:__
 + _corpus_ (optional, default: "--hyphe--")
 + _options_ (optional, default: null)

 Updates settings of a corpus according to the keys/values provided in options as a json object. Returns the detailed settings.


- __create\_corpus:__
 + _name_ (optional, default: "--hyphe--")
 + _password_ (optional, default: "")
 + _options_ (optional, default: null)

 Creates a corpus with the chosen name and optionally password and options (as a json object). Returns the corpus generated id and its status.


- __start\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")
 + _password_ (optional, default: "")

 Starts an existing corpus possibly password-protected. Returns the new corpus status.


- __stop\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")

 Stops an existing and running corpus. Returns the new corpus status.


- __ping:__
 + _corpus_ (optional, default: null)
 + _timeout_ (optional, default: 3)

 Tests during timeout seconds whether an existing corpus is started. Returns pong on success or the corpus status otherwise.


- __reinitialize:__
 + _corpus_ (optional, default: "--hyphe--")

 Resets completely a corpus by cancelling all crawls and emptying the MemoryStructure and Mongo data.


- __destroy\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")

 Resets a corpus then definitely deletes anything associated with it.


- __clear\_all:__

 Resets Hyphe completely: starts then resets and destroys all existing corpora one by one.


- __get\_status:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns global metadata on Hyphe's status and specific information on a corpus.


- __listjobs:__
 + _list\_ids_ (optional, default: null)
 + _from\_ts_ (optional, default: null)
 + _to\_ts_ (optional, default: null)
 + _corpus_ (optional, default: "--hyphe--")

 Returns the list and details of all finished/running/pending crawl jobs of a corpus. Optionnally returns only the jobs whose id is given in an array of list\_ids and/or that was created after timestamp from\_ts or before to\_ts.


- __declare\_page:__
 + _url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Indexes an url into a corpus' MemoryStructure. Returns the (newly created or not) associated WebEntity.


- __declare\_pages:__
 + _list\_urls_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Indexes a list of urls (as an array) into a corpus' MemoryStructure. Returns the (newly created or not) associated WebEntities.


- __crawl\_webentity:__
 + _webentity\_id_ (mandatory)
 + _depth_ (optional, default: null)
 + _phantom\_crawl_ (optional, default: false)
 + _status_ (optional, default: "IN")
 + _startpages_ (optional, default: "startpages")
 + _phantom\_timeouts_ (optional, default: {})
 + _corpus_ (optional, default: "--hyphe--")

 Schedules a crawl for a specific WebEntity to a specific depth and optionnally using PhantomJS with possible specific phantom\_timeouts. Sets simultaneously the WebEntity's status to IN or optionally to another valid status (undecided/out/discovered). Optionally defines the startpages strategy by starting the crawl either from the WebEntity's preset 'startpages' or 'prefixes' or already seen 'pages'.


- __get\_webentity\_logs:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns activity logs on a specific WebEntity of a corpus.


- __lookup\_httpstatus:__
 + _url_ (mandatory)
 + _timeout_ (optional, default: 30)
 + _corpus_ (optional, default: "--hyphe--")

 Tests an url for timeout seconds. Returns the url's HTTP code.


- __lookup:__
 + _url_ (mandatory)
 + _timeout_ (optional, default: 30)
 + _corpus_ (optional, default: "--hyphe--")

 Tests an url for timeout seconds. Returns a boolean indicating whether lookup\_httpstatus returned HTTP code 200 or a redirection code (301/302/...).



## Commands for namespace: "crawl."

- __deploy\_crawler:__
 + _corpus_ (optional, default: "--hyphe--")


- __cancel\_all:__
 + _corpus_ (optional, default: "--hyphe--")

 Stops all running and pending crawl jobs or a corpus.


- __reinitialize:__
 + _corpus_ (optional, default: "--hyphe--")

 Cancels all current crawl jobs running or planned and empty mongo data.


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

 Cancels a crawl job for a corpus.


- __get\_job\_logs:__
 + _job\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns activity logs of a specific crawl job of a corpus.



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

