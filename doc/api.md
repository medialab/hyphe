# API documentation

Hyphe relies on a [JsonRPC](http://www.jsonrpc.org/) API that can be controlled easily through the web interface or called directly from a JsonRPC client.

_Note:_ as it relies on the JSON-RPC protocol, it is not quite easy to test the API methods from a browser (having to send arguments through POST), but you can test directly from the command-line using the dedicated tools, see the [Developpers' documentation](dev.md).


## Default API commands (no namespace)
### CORPUS HANDLING

- __test\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns the current status of a `corpus`: "ready"/"starting"/"stopped"/"error".


- __list\_corpus:__

 Returns the list of all existing corpora with metas.


- __get\_corpus\_options:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns detailed settings of a `corpus`.


- __set\_corpus\_options:__
 + _corpus_ (optional, default: "--hyphe--")
 + _options_ (optional, default: null)

 Updates the settings of a `corpus` according to the keys/values provided in `options` as a json object respecting the settings schema visible by querying `get\_corpus\_options`. Returns the detailed settings.


- __create\_corpus:__
 + _name_ (optional, default: "--hyphe--")
 + _password_ (optional, default: "")
 + _options_ (optional, default: {})

 Creates a corpus with the chosen `name` and optional `password` and `options` (as a json object see `set/get\_corpus\_options`). Returns the corpus generated id and status.


- __start\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")
 + _password_ (optional, default: "")

 Starts an existing `corpus` possibly `password`-protected. Returns the new corpus status.


- __stop\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")

 Stops an existing and running `corpus`. Returns the new corpus status.


- __ping:__
 + _corpus_ (optional, default: null)
 + _timeout_ (optional, default: 3)

 Tests during `timeout` seconds whether an existing `corpus` is started. Returns "pong" on success or the corpus status otherwise.


- __reinitialize:__
 + _corpus_ (optional, default: "--hyphe--")

 Resets completely a `corpus` by cancelling all crawls and emptying the MemoryStructure and Mongo data.


- __destroy\_corpus:__
 + _corpus_ (optional, default: "--hyphe--")

 Resets a `corpus` then definitely deletes anything associated with it.


- __clear\_all:__

 Resets Hyphe completely: starts then resets and destroys all existing corpora one by one.

### CORE & CORPUS STATUS

- __get\_status:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns global metadata on Hyphe's status and specific information on a `corpus`.

### BASIC PAGE DECLARATION (AND WEBENTITY CREATION)

- __declare\_page:__
 + _url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Indexes a `url` into a `corpus`. Returns the (newly created or not) associated WebEntity.


- __declare\_pages:__
 + _list\_urls_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Indexes a bunch of urls given as an array in `list\_urls` into a `corpus`. Returns the (newly created or not) associated WebEntities.

### BASIC CRAWL METHODS

- __listjobs:__
 + _list\_ids_ (optional, default: null)
 + _from\_ts_ (optional, default: null)
 + _to\_ts_ (optional, default: null)
 + _corpus_ (optional, default: "--hyphe--")

 Returns the list and details of all "finished"/"running"/"pending" crawl jobs of a `corpus`. Optionally returns only the jobs whose id is given in an array of `list\_ids` and/or that was created after timestamp `from\_ts` or before `to\_ts`.


- __crawl\_webentity:__
 + _webentity\_id_ (mandatory)
 + _depth_ (optional, default: null)
 + _phantom\_crawl_ (optional, default: false)
 + _status_ (optional, default: "IN")
 + _startpages_ (optional, default: "startpages")
 + _phantom\_timeouts_ (optional, default: {})
 + _corpus_ (optional, default: "--hyphe--")

 Schedules a crawl for a `corpus` for an existing WebEntity defined by its `webentity\_id` with a specific crawl `depth [int]`. Optionally use PhantomJS by setting `phantom\_crawl` to "true" and adjust specific `phantom\_timeouts` as a json object with possible keys `timeout`/`ajax\_timeout`/`idle\_timeout`. Sets simultaneously the WebEntity's status to "IN" or optionally to another valid `status` ("undecided"/"out"/"discovered)". Optionally defines the `startpages` strategy by starting the crawl either from the WebEntity's preset "startpages" or "prefixes" or already seen "pages".


- __get\_webentity\_logs:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` crawl activity logs on a specific WebEntity defined by its `webentity\_id`.

### HTTP LOOKUP METHODS

- __lookup\_httpstatus:__
 + _url_ (mandatory)
 + _timeout_ (optional, default: 30)
 + _corpus_ (optional, default: "--hyphe--")

 Tests a `url` for `timeout` seconds using a `corpus` specific connection (possible proxy for instance). Returns the url's HTTP code.


- __lookup:__
 + _url_ (mandatory)
 + _timeout_ (optional, default: 30)
 + _corpus_ (optional, default: "--hyphe--")

 Tests a `url` for `timeout` seconds using a `corpus` specific connection (possible proxy for instance). Returns a boolean indicating whether `lookup\_httpstatus` returned HTTP code 200 or a redirection code (301/302/...).



## Commands for namespace: "crawl."

- __deploy\_crawler:__
 + _corpus_ (optional, default: "--hyphe--")

 Prepares and deploys on the ScrapyD server a spider (crawler) for a `corpus`.


- __delete\_crawler:__
 + _corpus_ (optional, default: "--hyphe--")

 Removes from the ScrapyD server an existing spider (crawler) for a `corpus`.


- __cancel\_all:__
 + _corpus_ (optional, default: "--hyphe--")

 Stops all "running" and "pending" crawl jobs for a `corpus`.

 Cancels all current crawl jobs running or planned for a `corpus` and empty related mongo data.


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

 Starts a crawl for a `corpus` defining finely the crawl options (mainly for debug purposes):
  * a `webentity\_id` associated with the crawl a list of `starts` urls to start from
  * a list of `follow\_prefixes` to know which links to follow
  * a list of `nofollow\_prefixes` to know which links to avoid
  * a `depth` corresponding to the maximum number of clicks done from the start pages
  * `phantom\_crawl` set to "true" to use PhantomJS for this crawl and optional `phantom\_timeouts` as an object with keys among `timeout`/`ajax\_timeout`/`idle\_timeout`
  * a `download\_delay` corresponding to the time in seconds spent between two requests by the crawler.


- __cancel:__
 + _job\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Cancels a crawl of id `job\_id` for a `corpus`.


- __get\_job\_logs:__
 + _job\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` activity logs of a specific crawl with id `job\_id`.



## Commands for namespace: "store."
### DEFINE WEBENTITIES

- __get\_lru\_definedprefixes:__
 + _lru_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` a list of all possible LRU prefixes shorter than `lru` and already attached to WebEntities.


- __declare\_webentity\_by\_lruprefix\_as\_url:__
 + _url_ (mandatory)
 + _name_ (optional, default: null)
 + _status_ (optional, default: null)
 + _startPages_ (optional, default: [])
 + _corpus_ (optional, default: "--hyphe--")

 Creates for a `corpus` a WebEntity defined for the LRU prefix given as a `url`. Optionally set the newly created WebEntity's `name` `status` ("in"/"ou"/"undecided"/"discovered") and list of `startPages`. Returns the newly created WebEntity.


- __declare\_webentity\_by\_lru:__
 + _lru\_prefix_ (mandatory)
 + _name_ (optional, default: null)
 + _status_ (optional, default: null)
 + _startPages_ (optional, default: [])
 + _corpus_ (optional, default: "--hyphe--")

 Creates for a `corpus` a WebEntity defined for a `lru\_prefix`. Optionally set the newly created WebEntity's `name` `status` ("in"/"ou"/"undecided"/"discovered") and list of `startPages`. Returns the newly created WebEntity.


- __declare\_webentity\_by\_lrus:__
 + _list\_lrus_ (mandatory)
 + _name_ (optional, default: null)
 + _status_ (optional, default: null)
 + _startPages_ (optional, default: [])
 + _corpus_ (optional, default: "--hyphe--")

 Creates for a `corpus` a WebEntity defined for a set of LRU prefixes given as `list\_lrus`. Optionally set the newly created WebEntity's `name` `status` ("in"/"ou"/"undecided"/"discovered") and list of `startPages`. Returns the newly created WebEntity.

### EDIT WEBENTITIES

- __rename\_webentity:__
 + _webentity\_id_ (mandatory)
 + _new\_name_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Changes for a `corpus` the name of a WebEntity defined by `webentity\_id` to `new\_name`.


- __change\_webentity\_id:__
 + _webentity\_old\_id_ (mandatory)
 + _webentity\_new\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Changes for a `corpus` the id of a WebEntity defined by `webentity\_old\_id` to `webenetity\_new\_id` (mainly for advanced debug use).


- __set\_webentity\_status:__
 + _webentity\_id_ (mandatory)
 + _status_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Changes for a `corpus` the status of a WebEntity defined by `webentity\_id` to `status` (one of "in"/"out"/"undecided"/"discovered").


- __set\_webentities\_status:__
 + _webentity\_ids_ (mandatory)
 + _status_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Changes for a `corpus` the status of a set of WebEntities defined by a list of `webentity\_ids` to `status` (one of "in"/"out"/"undecided"/"discovered").


- __set\_webentity\_homepage:__
 + _webentity\_id_ (mandatory)
 + _homepage_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Changes for a `corpus` the homepage of a WebEntity defined by `webentity\_id` to `homepage`.


- __add\_webentity\_lruprefixes:__
 + _webentity\_id_ (mandatory)
 + _lru\_prefixes_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Adds for a `corpus` a list of `lru\_prefixes` (or a single one) to a WebEntity defined by `webentity\_id`.


- __rm\_webentity\_lruprefix:__
 + _webentity\_id_ (mandatory)
 + _lru\_prefix_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Removes for a `corpus` a `lru\_prefix` from the list of prefixes of a WebEntity defined by `webentity\_id. Will delete the WebEntity if it ends up with no LRU prefix left.


- __add\_webentity\_startpage:__
 + _webentity\_id_ (mandatory)
 + _startpage\_url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Adds for a `corpus` a list of `lru\_prefixes` to a WebEntity defined by `webentity\_id`.


- __rm\_webentity\_startpage:__
 + _webentity\_id_ (mandatory)
 + _startpage\_url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Removes for a `corpus` a `startpage\_url` from the list of startpages of a WebEntity defined by `webentity\_id.


- __merge\_webentity\_into\_another:__
 + _old\_webentity\_id_ (mandatory)
 + _good\_webentity\_id_ (mandatory)
 + _include\_tags_ (optional, default: false)
 + _include\_home\_and\_startpages\_as\_startpages_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")

 Assembles for a `corpus` 2 WebEntities by deleting WebEntity defined by `old\_webentity\_id` and adding all of its LRU prefixes to the one defined by `good\_webentity\_id`. Optionally set `include\_tags` and/or `include\_home\_and\_startpages\_as\_startpages` to "true" to also add the tags and/or startpages to the merged resulting WebEntity.


- __merge\_webentities\_into\_another:__
 + _old\_webentity\_ids_ (mandatory)
 + _good\_webentity\_id_ (mandatory)
 + _include\_tags_ (optional, default: false)
 + _include\_home\_and\_startpages\_as\_startpages_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")

 Assembles for a `corpus` a bunch of WebEntities by deleting WebEntities defined by a list of `old\_webentity\_ids` and adding all of their LRU prefixes to the one defined by `good\_webentity\_id`. Optionally set `include\_tags` and/or `include\_home\_and\_startpages\_as\_startpages` to "true" to also add the tags and/or startpages to the merged resulting WebEntity.


- __delete\_webentity:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Removes from a `corpus` a WebEntity defined by `webentity\_id` (mainly for advanced debug use).

### RETRIEVE & SEARCH WEBENTITIES

- __get\_webentity:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` a WebEntity defined by its `webentity\_id`.


- __get\_webentity\_by\_lruprefix:__
 + _lru\_prefix_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` the WebEntity having `lru\_prefix` as one of its LRU prefixes.


- __get\_webentity\_by\_lruprefix\_as\_url:__
 + _url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` the WebEntity having one of its LRU prefixes corresponding to the LRU fiven under the form of a `url`.


- __get\_webentity\_for\_url:__
 + _url_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` the WebEntity to which a `url` belongs (meaning starting with one of the WebEntity's prefix and not another).


- __get\_webentity\_for\_url\_as\_lru:__
 + _lru_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` the WebEntity to which a url given under the form of a `lru` belongs (meaning starting with one of the WebEntity's prefix and not another).


- __get\_webentities:__
 + _list\_ids_ (optional, default: null)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _light_ (optional, default: false)
 + _semilight_ (optional, default: false)
 + _light\_for\_csv_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all existing WebEntities or only the WebEntities whose id is among `list\_ids.
 Results will be paginated with a total number of returned results of `count` and `page` the number of the desired page of results. Results will include metadata on the request including the total number of results and a `token` to be reused to collect the other pages via `get\_webentities\_page`.
 Other possible options include:
  * order the results with `sort` by inputting a field or list of fields as named in the WebEntities returned objects; optionally prefix a sort field with a "-" to revert the sorting on it; for instance: `["-indegree", "name"]` will order by maximum indegree first then by alphabetic order of names
  * set `light` or `semilight` or `light\_for\_csv` to "true" to collect lighter data with less WebEntities fields.


- __advanced\_search\_webentities:__
 + _allFieldsKeywords_ (optional, default: [])
 + _fieldKeywords_ (optional, default: [])
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _autoescape\_query_ (optional, default: true)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities matching a specific search using the `allFieldsKeywords` and `fieldKeywords` arguments. Searched keywords will automatically be escaped: set `autoescape\_query` to "false" to allow input of special Lucene queries.
 Results will be paginated with a total number of returned results of `count` and `page` the number of the desired page of results. Results will include metadata on the request including the total number of results and a `token` to be reused to collect the other pages via `get\_webentities\_page`.
  * `allFieldsKeywords` should be a string or list of strings to search in all textual fields of the WebEntities ("name"/"status"/"lruset"/"startpages"/...). For instance `["hyphe", "www"]`
  * `fieldKeywords` should be a list of 2-elements arrays giving first the field to search into then the searched value or optionally for the field "indegree" an array of a minimum and maximum values to search into. For instance: `[["name", "hyphe"], ["indegree", [3, 1000]]]`
  * see description of `sort` in `get\_webentities` above.


- __exact\_search\_webentities:__
 + _query_ (mandatory)
 + _field_ (optional, default: null)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities having one textual field or optional specific `field` exactly equal to the value given as `query`. Searched query will automatically be escaped of Lucene special characters.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get\_webentities\_page`: see `advanced\_search\_webentities` for explanations on `sort` `count` and `page`.


- __prefixed\_search\_webentities:__
 + _query_ (mandatory)
 + _field_ (optional, default: null)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities having one textual field or optional specific `field` beginning with the value given as `query`. Searched query will automatically be escaped of Lucene special characters.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get\_webentities\_page`: see `advanced\_search\_webentities` for explanations on `sort` `count` and `page`.


- __postfixed\_search\_webentities:__
 + _query_ (mandatory)
 + _field_ (optional, default: null)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities having one textual field or optional specific `field` finishing with the value given as `query`. Searched query will automatically be escaped of Lucene special characters.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get\_webentities\_page`: see `advanced\_search\_webentities` for explanations on `sort` `count` and `page`.


- __free\_search\_webentities:__
 + _query_ (mandatory)
 + _field_ (optional, default: null)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities having one textual field or optional specific `field` containing the value given as `query`. Searched query will automatically be escaped of Lucene special characters.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get\_webentities\_page`: see `advanced\_search\_webentities` for explanations on `sort` `count` and `page`.


- __get\_webentities\_by\_status:__
 + _status_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities having their status equal to `status` (one of "in"/"out"/"undecided"/"discovered").
 Results are paginated and will include a `token` to be reused to collect the other pages via `get\_webentities\_page`: see `advanced\_search\_webentities` for explanations on `sort` `count` and `page`.


- __get\_webentities\_by\_name:__
 + _name_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities having their name equal to `name`.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get\_webentities\_page`: see `advanced\_search\_webentities` for explanations on `sort` `count` and `page`.


- __get\_webentities\_by\_tag\_value:__
 + _value_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities having at least one tag in any namespace/category equal to `value`.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get\_webentities\_page`: see `advanced\_search\_webentities` for explanations on `sort` `count` and `page`.


- __get\_webentities\_by\_tag\_category:__
 + _category_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities having at least one tag in a specific `category`.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get\_webentities\_page`: see `advanced\_search\_webentities` for explanations on `sort` `count` and `page`.


- __get\_webentities\_by\_user\_tag:__
 + _category_ (mandatory)
 + _value_ (mandatory)
 + _sort_ (optional, default: null)
 + _count_ (optional, default: 100)
 + _page_ (optional, default: 0)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all WebEntities having at least one tag in any category of the namespace "USER" equal to `value`.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get\_webentities\_page`: see `advanced\_search\_webentities` for explanations on `sort` `count` and `page`.


- __get\_webentities\_page:__
 + _pagination\_token_ (mandatory)
 + _n\_page_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` the page number `n\_page` of WebEntities corresponding to the results of a previous query ran using any of the `get\_webentities` or `search\_webentities` methods using the returned `pagination\_token`.


- __get\_webentities\_ranking\_stats:__
 + _pagination\_token_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` histogram data on the indegrees of all WebEntities matching a previous query ran using any of the `get\_webentities` or `search\_webentities` methods using the return `pagination\_token`.

### TAGS

- __add\_webentity\_tag\_value:__
 + _webentity\_id_ (mandatory)
 + _namespace_ (mandatory)
 + _category_ (mandatory)
 + _value_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Adds for a `corpus` a tag `namespace:category_ (optional, default: value` to a WebEntity defined by `webentity\_id`.)


- __add\_webentities\_tag\_value:__
 + _webentity\_ids_ (mandatory)
 + _namespace_ (mandatory)
 + _category_ (mandatory)
 + _value_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Adds for a `corpus` a tag `namespace:category_ (optional, default: value` to a bunch of WebEntities defined by a list of `webentity\_ids`.)


- __rm\_webentity\_tag\_key:__
 + _webentity\_id_ (mandatory)
 + _namespace_ (mandatory)
 + _category_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Removes for a `corpus` all tags within `namespace:category` associated with a WebEntity defined by `webentity\_id` if it is set.


- __rm\_webentity\_tag\_value:__
 + _webentity\_id_ (mandatory)
 + _namespace_ (mandatory)
 + _category_ (mandatory)
 + _value_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Removes for a `corpus` a tag `namespace:category_ (optional, default: value` associated with a WebEntity defined by `webentity\_id` if it is set.)


- __set\_webentity\_tag\_values:__
 + _webentity\_id_ (mandatory)
 + _namespace_ (mandatory)
 + _category_ (mandatory)
 + _values_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Replaces for a `corpus` all existing tags of a WebEntity defined by `webentity\_id` for a specific `namespace` and `category` by a list of `values` or a single tag.


- __get\_tags:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` a tree of all existing tags of the webentities hierarchised by namespaces and categories.


- __get\_tag\_namespaces:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` a list of all existing namespaces of the webentities tags.


- __get\_tag\_categories:__
 + _namespace_ (optional, default: null)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` a list of all existing categories of the webentities tags. Optionally limits to a specific `namespace`.


- __get\_tag\_values:__
 + _namespace_ (optional, default: null)
 + _category_ (optional, default: null)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` a list of all existing values in the webentities tags. Optionally limits to a specific `namespace` and/or `category`.

### PAGES
 + _LINKS & NETWORKS

- __get\_webentity\_pages:__
 + _webentity\_id_ (mandatory)
 + _onlyCrawled_ (optional, default: true)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all indexed Pages fitting within the WebEntity defined by `webentity\_id`. Optionally limits the results to Pages which were actually crawled setting `onlyCrawled` to "true".


- __get\_webentity\_subwebentities:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all sub-webentities of a WebEntity defined by `webentity\_id` (meaning webentities having at least one LRU prefix starting with one of the WebEntity's prefixes).


- __get\_webentity\_parentwebentities:__
 + _webentity\_id_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all parent-webentities of a WebEntity defined by `webentity\_id` (meaning webentities having at least one LRU prefix starting like one of the WebEntity's prefixes).


- __get\_webentity\_nodelinks\_network:__
 + _webentity\_id_ (optional, default: null)
 + _include\_external\_links_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` the list of all internal NodeLinks of a WebEntity defined by `webentity\_id`. Optionally add external NodeLinks (the frontier) by setting `include\_external\_links` to "true".


- __get\_webentities\_network:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` the list of all agregated weighted links between WebEntities.

### CREATION RULES

- __get\_webentity\_creationrules:__
 + _lru\_prefix_ (optional, default: null)
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` all existing WebEntityCreationRules or only one set for a specific `lru\_prefix`.


- __delete\_webentity\_creationrule:__
 + _lru\_prefix_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Removes from a `corpus` an existing WebEntityCreationRule set for a specific `lru\_prefix`.


- __add\_webentity\_creationrule:__
 + _lru\_prefix_ (mandatory)
 + _regexp_ (mandatory)
 + _apply\_to\_existing\_pages_ (optional, default: false)
 + _corpus_ (optional, default: "--hyphe--")

 Adds to a `corpus` a new WebEntityCreationRule set for a `lru\_prefix` to a specific `regexp` or one of "subdomain"/"subdomain-N"/"domain"/"path-N"/"prefix+N"/"page" N being an integer. Optionally set `apply\_to\_existing\_pages` to "true" to apply it immediately to past crawls.


- __simulate\_creationrules\_for\_urls:__
 + _pageURLs_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns an object giving for each URL of `pageURLs` (single string or array) the prefix of the theoretical WebEntity the URL would be attached to within a `corpus` following its specific WebEntityCreationRules.


- __simulate\_creationrules\_for\_lrus:__
 + _pageLRUs_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Returns an object giving for each LRU of `pageLRUs` (single string or array) the prefix of the theoretical WebEntity the LRU would be attached to within a `corpus` following its specific WebEntityCreationRules.

### PRECISION EXCEPTIONS

- __get\_precision\_exceptions:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a `corpus` the list of all existing PrecisionExceptions.


- __delete\_precision\_exceptions:__
 + _list\_lru\_exceptions_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Removes from a `corpus` a set of existing PrecisionExceptions listed as `list\_lru\_exceptions`.


- __add\_precision\_exception:__
 + _lru\_prefix_ (mandatory)
 + _corpus_ (optional, default: "--hyphe--")

 Adds to a `corpus` a new PrecisionException for `lru\_prefix`.

### VARIOUS

- __trigger\_links\_reset:__
 + _corpus_ (optional, default: "--hyphe--")

 Will initiate a whole reset and regeneration of all WebEntityLinks of a `corpus`. Can take a while.


- __get\_webentities\_stats:__
 + _corpus_ (optional, default: "--hyphe--")

 Returns for a corpus a set of statistics on the WebEntities status repartition of a `corpus` each 5 minutes.

