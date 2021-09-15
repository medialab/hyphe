# API documentation

Hyphe relies on a [JsonRPC](http://www.jsonrpc.org/) API that can be controlled easily through the web interface or called directly from a JsonRPC client.

_Note:_ as it relies on the JSON-RPC protocol, it is not quite easy to test the API methods from a browser (having to send arguments through POST), but you can test directly from the command-line using the dedicated tools, see the [Developers' documentation](dev.md).


## Data &amp; Query format

The current JSON-RPC 1.0 implementation requires to provide arguments as an ordered array of the methods arguments. Call with named arguments is possible but not well handled and not recommanded until we migrate to REST.

The API will always answer as such:
- Success:
```json
{
  "code": "success",
  "result": "<The actual expected result, possibly an objet, an array, a number, a string, ...>"
}
```
- Error:
```json
{
  "code": "fail",
  "message": "<A string describing the possible cause of the error.>"
}
```


## Summary
- [Default API commands (no namespace)](#default-api-commands-no-namespace)
  + [CORPUS HANDLING](#corpus-handling)
    * __`test_corpus`__
    * __`list_corpus`__
    * __`get_corpus_options`__
    * __`set_corpus_options`__
    * __`create_corpus`__
    * __`start_corpus`__
    * __`stop_corpus`__
    * __`get_corpus_tlds`__
    * __`backup_corpus`__
    * __`ping`__
    * __`reinitialize`__
    * __`destroy_corpus`__
    * __`force_destroy_corpus`__
    * __`clear_all`__
  + [CORE AND CORPUS STATUS](#core-and-corpus-status)
    * __`get_status`__
  + [BASIC PAGE DECLARATION (AND WEBENTITY CREATION)](#basic-page-declaration-and-webentity-creation)
    * __`declare_page`__
    * __`declare_pages`__
  + [BASIC CRAWL METHODS](#basic-crawl-methods)
    * __`listjobs`__
    * __`propose_webentity_startpages`__
    * __`crawl_webentity`__
    * __`crawl_webentity_with_startmode`__
    * __`get_webentity_jobs`__
    * __`cancel_webentity_jobs`__
    * __`get_webentity_logs`__
  + [HTTP LOOKUP METHODS](#http-lookup-methods)
    * __`lookup_httpstatus`__
    * __`lookup`__
- [Commands for namespace: "crawl."](#commands-for-namespace-crawl)
    * __`deploy_crawler`__
    * __`delete_crawler`__
    * __`cancel_all`__
    * __`start`__
    * __`cancel`__
    * __`get_job_logs`__
- [Commands for namespace: "store."](#commands-for-namespace-store)
  + [DEFINE WEBENTITIES](#define-webentities)
    * __`get_lru_definedprefixes`__
    * __`declare_webentity_by_lruprefix_as_url`__
    * __`declare_webentity_by_lru`__
    * __`declare_webentity_by_lrus_as_urls`__
    * __`declare_webentity_by_lrus`__
  + [EDIT WEBENTITIES](#edit-webentities)
    * __`basic_edit_webentity`__
    * __`rename_webentity`__
    * __`set_webentity_status`__
    * __`set_webentities_status`__
    * __`set_webentity_homepage`__
    * __`add_webentity_lruprefixes`__
    * __`rm_webentity_lruprefix`__
    * __`add_webentity_startpages`__
    * __`add_webentity_startpage`__
    * __`rm_webentity_startpages`__
    * __`rm_webentity_startpage`__
    * __`merge_webentity_into_another`__
    * __`merge_webentities_into_another`__
    * __`delete_webentity`__
  + [RETRIEVE AND SEARCH WEBENTITIES](#retrieve-and-search-webentities)
    * __`get_webentity`__
    * __`get_webentity_by_lruprefix`__
    * __`get_webentity_by_lruprefix_as_url`__
    * __`get_webentity_for_url`__
    * __`get_webentity_for_url_as_lru`__
    * __`get_webentities`__
    * __`search_webentities`__
    * __`wordsearch_webentities`__
    * __`get_webentities_by_status`__
    * __`get_webentities_by_name`__
    * __`get_webentities_by_tag_value`__
    * __`get_webentities_by_tag_category`__
    * __`get_webentities_mistagged`__
    * __`get_webentities_uncrawled`__
    * __`get_webentities_page`__
    * __`get_webentities_ranking_stats`__
  + [TAGS](#tags)
    * __`rebuild_tags_dictionary`__
    * __`add_webentity_tag_value`__
    * __`add_webentities_tag_value`__
    * __`rm_webentity_tag_value`__
    * __`rm_webentities_tag_value`__
    * __`edit_webentity_tag_value`__
    * __`get_tags`__
    * __`get_tag_namespaces`__
    * __`get_tag_categories`__
    * __`get_tag_values`__
  + [PAGES, LINKS AND NETWORKS](#pages-links-and-networks)
    * __`get_webentity_pages`__
    * __`paginate_webentity_pages`__
    * __`get_webentity_mostlinked_pages`__
    * __`get_webentity_subwebentities`__
    * __`get_webentity_parentwebentities`__
    * __`get_webentity_pagelinks_network`__
    * __`paginate_webentity_pagelinks_network`__
    * __`get_webentity_referrers`__
    * __`get_webentity_referrals`__
    * __`get_webentity_ego_network`__
    * __`get_webentities_network`__
  + [CREATION RULES](#creation-rules)
    * __`get_default_webentity_creationrule`__
    * __`get_webentity_creationrules`__
    * __`delete_webentity_creationrule`__
    * __`add_webentity_creationrule`__
    * __`simulate_creationrules_for_urls`__
    * __`simulate_creationrules_for_lrus`__
  + [VARIOUS](#various)
    * __`trigger_links_build`__
    * __`get_webentities_stats`__


## Default API commands (no namespace)
### CORPUS HANDLING

- __`test_corpus`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns the current status of a `corpus`: "ready"/"starting"/"missing"/"stopped"/"error".


- __`list_corpus`:__
  + _`light`_ (optional, default: `true`)

 Returns the list of all existing corpora with metas.


- __`get_corpus_options`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns detailed settings of a `corpus`.


- __`set_corpus_options`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)
  + _`options`_ (optional, default: `null`)

 Updates the settings of a `corpus` according to the keys/values provided in `options` as a json object respecting the settings schema visible by querying `get_corpus_options`. Returns the detailed settings.


- __`create_corpus`:__
  + _`name`_ (optional, default: `"--hyphe--"`)
  + _`password`_ (optional, default: `""`)
  + _`options`_ (optional, default: `{}`)

 Creates a corpus with the chosen `name` and optional `password` and `options` (as a json object see `set/get_corpus_options`). Returns the corpus generated id and status.


- __`start_corpus`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)
  + _`password`_ (optional, default: `""`)

 Starts an existing `corpus` possibly `password`-protected. Returns the new corpus status.


- __`stop_corpus`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Stops an existing and running `corpus`. Returns the new corpus status.


- __`get_corpus_tlds`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns the tree of TLDs rules built from Mozilla's list at the creation of `corpus`.


- __`backup_corpus`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Saves locally on the server in the archive directory a timestamped backup of `corpus` including 4 json backup files of all webentities/links/crawls and corpus options.


- __`ping`:__
  + _`corpus`_ (optional, default: `null`)
  + _`timeout`_ (optional, default: `3`)

 Tests during `timeout` seconds whether an existing `corpus` is started. Returns "pong" on success or the corpus status otherwise.


- __`reinitialize`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Resets completely a `corpus` by cancelling all crawls and emptying the Traph and Mongo data.


- __`destroy_corpus`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Backups, resets, then definitely deletes a `corpus` and anything associated with it.


- __`force_destroy_corpus`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Deletes completely and definitely a `corpus` without restarting it (backup may be less complete).


- __`clear_all`:__
  + _`except_corpus_ids`_ (optional, default: `[]`)

 Resets Hyphe completely: starts then resets and destroys all existing corpora one by one except for those whose ID is given in `except_corpus_ids`.

### CORE AND CORPUS STATUS

- __`get_status`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns global metadata on Hyphe's status and specific information on a `corpus`.

### BASIC PAGE DECLARATION (AND WEBENTITY CREATION)

- __`declare_page`:__
  + _`url`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Indexes a `url` into a `corpus`. Returns the (newly created or not) associated WebEntity.


- __`declare_pages`:__
  + _`list_urls`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Indexes a bunch of urls given as an array in `list_urls` into a `corpus`. Returns the (newly created or not) associated WebEntities.

### BASIC CRAWL METHODS

- __`listjobs`:__
  + _`list_ids`_ (optional, default: `null`)
  + _`from_ts`_ (optional, default: `null`)
  + _`to_ts`_ (optional, default: `null`)
  + _`light`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns the list and details of all "finished"/"running"/"pending" crawl jobs of a `corpus`. Optionally returns only the jobs whose id is given in an array of `list_ids` and/or that was created after timestamp `from_ts` or before `to_ts`. Set `light` to true to get only essential metadata for heavy queries.


- __`propose_webentity_startpages`:__
  + _`webentity_id`_ (mandatory)
  + _`startmode`_ (optional, default: `"default"`)
  + _`categories`_ (optional, default: `false`)
  + _`save_startpages`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns a list of suggested startpages to crawl an existing WebEntity defined by its `webentity_id` using the "default" `startmode` defined for the `corpus` or one or an array of either the WebEntity's preset "startpages", "homepage" or "prefixes" or <N> most seen "pages-<N>". Returns them categorised by type of source if "categories" is set to true. Will save them into the webentity if `save_startpages` is True.


- __`crawl_webentity`:__
  + _`webentity_id`_ (mandatory)
  + _`depth`_ (optional, default: `0`)
  + _`phantom_crawl`_ (optional, default: `false`)
  + _`status`_ (optional, default: `"IN"`)
  + _`proxy`_ (optional, default: `null`)
  + _`cookies_string`_ (optional, default: `null`)
  + _`phantom_timeouts`_ (optional, default: `{}`)
  + _`webarchives`_ (optional, default: `{}`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Schedules a crawl for a `corpus` for an existing WebEntity defined by its `webentity_id` with a specific crawl `depth [int]`.
 Optionally use PhantomJS by setting `phantom_crawl` to "true" and adjust specific `phantom_timeouts` as a json object with possible keys `timeout`/`ajax_timeout`/`idle_timeout`.
 Sets simultaneously the WebEntity's status to "IN" or optionally to another valid `status` ("undecided"/"out"/"discovered").
 Optionally add a HTTP `proxy` specified as "domain_or_IP:port".
 Also optionally add known `cookies_string` with auth rights to a protected website.
 Optionally use some `webarchives` by defining a json object with keys `date`/`days_range`/`option`, the latter being one of ""/"web.archive.org"/"archivesinternet.bnf.fr".
 Will use the WebEntity's startpages if it has any or use otherwise the `corpus`' "default" `startmode` heuristic as defined in `propose_webentity_startpages` (use `crawl_webentity_with_startmode` to apply a different heuristic, see details in `propose_webentity_startpages`).


- __`crawl_webentity_with_startmode`:__
  + _`webentity_id`_ (mandatory)
  + _`depth`_ (optional, default: `0`)
  + _`phantom_crawl`_ (optional, default: `false`)
  + _`status`_ (optional, default: `"IN"`)
  + _`startmode`_ (optional, default: `"default"`)
  + _`proxy`_ (optional, default: `null`)
  + _`cookies_string`_ (optional, default: `null`)
  + _`phantom_timeouts`_ (optional, default: `{}`)
  + _`webarchives`_ (optional, default: `{}`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Schedules a crawl for a `corpus` for an existing WebEntity defined by its `webentity_id` with a specific crawl `depth [int]`.
 Optionally use PhantomJS by setting `phantom_crawl` to "true" and adjust specific `phantom_timeouts` as a json object with possible keys `timeout`/`ajax_timeout`/`idle_timeout`.
 Sets simultaneously the WebEntity's status to "IN" or optionally to another valid `status` ("undecided"/"out"/"discovered").
 Optionally add a HTTP `proxy` specified as "domain_or_IP:port".
 Also optionally add known `cookies_string` with auth rights to a protected website.
 Optionally define the `startmode` strategy differently to the `corpus` "default one (see details in `propose_webentity_startpages`).
 Optionally use some `webarchives` by defining a json object with keys `date`/`days_range`/`option`, the latter being one of ""/"web.archive.org"/"archivesinternet.bnf.fr".


- __`get_webentity_jobs`:__
  + _`webentity_id`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` crawl jobs that has run for a specific WebEntity defined by its `webentity_id`.


- __`cancel_webentity_jobs`:__
  + _`webentity_id`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Cancels for a `corpus` all running or pending crawl jobs that were booked for a specific WebEntity defined by its `webentity_id`.


- __`get_webentity_logs`:__
  + _`webentity_id`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` crawl activity logs on a specific WebEntity defined by its `webentity_id`.

### HTTP LOOKUP METHODS

- __`lookup_httpstatus`:__
  + _`url`_ (mandatory)
  + _`timeout`_ (optional, default: `30`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Tests a `url` for `timeout` seconds using a `corpus` specific connection (possible proxy for instance). Returns the url's HTTP code.


- __`lookup`:__
  + _`url`_ (mandatory)
  + _`timeout`_ (optional, default: `30`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Tests a `url` for `timeout` seconds using a `corpus` specific connection (possible proxy for instance). Returns a boolean indicating whether `lookup_httpstatus` returned HTTP code 200 or a redirection code (301/302/...).



## Commands for namespace: "crawl."

- __`deploy_crawler`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Prepares and deploys on the ScrapyD server a spider (crawler) for a `corpus`.


- __`delete_crawler`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Removes from the ScrapyD server an existing spider (crawler) for a `corpus`.


- __`cancel_all`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Stops all "running" and "pending" crawl jobs for a `corpus`.

 Cancels all current crawl jobs running or planned for a `corpus` and empty related mongo data.


- __`start`:__
  + _`webentity_id`_ (mandatory)
  + _`starts`_ (mandatory)
  + _`follow_prefixes`_ (mandatory)
  + _`nofollow_prefixes`_ (mandatory)
  + _`follow_redirects`_ (optional, default: `null`)
  + _`depth`_ (optional, default: `0`)
  + _`phantom_crawl`_ (optional, default: `false`)
  + _`phantom_timeouts`_ (optional, default: `{}`)
  + _`download_delay`_ (optional, default: `1`)
  + _`proxy`_ (optional, default: `null`)
  + _`cookies_string`_ (optional, default: `null`)
  + _`webarchives`_ (optional, default: `{}`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Starts a crawl for a `corpus` defining finely the crawl options (mainly for debug purposes):
  * a `webentity_id` associated with the crawl a list of `starts` urls to start from
  * a list of `follow_prefixes` to know which links to follow
  * a list of `nofollow_prefixes` to know which links to avoid
  * a `depth` corresponding to the maximum number of clicks done from the start pages
  * `phantom_crawl` set to "true" to use PhantomJS for this crawl and optional `phantom_timeouts` as an object with keys among `timeout`/`ajax_timeout`/`idle_timeout`
  * a `download_delay` corresponding to the time in seconds spent between two requests by the crawler.
  * an HTTP `proxy` specified as "domain_or_IP:port"
  * a known `cookies_string` with auth rights to a protected website.
 Optionally use some `webarchives` by defining a json object with keys `date`/`days_range`/`option`, the latter being one of ""/"web.archive.org"/"archivesinternet.bnf.fr".


- __`cancel`:__
  + _`job_id`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Cancels a crawl of id `job_id` for a `corpus`.


- __`get_job_logs`:__
  + _`job_id`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` activity logs of a specific crawl with id `job_id`.



## Commands for namespace: "store."
### DEFINE WEBENTITIES

- __`get_lru_definedprefixes`:__
  + _`lru`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` a list of all possible LRU prefixes shorter than `lru` and already attached to WebEntities.


- __`declare_webentity_by_lruprefix_as_url`:__
  + _`url`_ (mandatory)
  + _`name`_ (optional, default: `null`)
  + _`status`_ (optional, default: `null`)
  + _`startpages`_ (optional, default: `[]`)
  + _`lruVariations`_ (optional, default: `true`)
  + _`tags`_ (optional, default: `{}`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Creates for a `corpus` a WebEntity defined for the LRU prefix given as a `url` and optionnally for the corresponding http/https and www/no-www variations if `lruVariations` is true. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startpages`. Returns the newly created WebEntity.


- __`declare_webentity_by_lru`:__
  + _`lru_prefix`_ (mandatory)
  + _`name`_ (optional, default: `null`)
  + _`status`_ (optional, default: `null`)
  + _`startpages`_ (optional, default: `[]`)
  + _`lruVariations`_ (optional, default: `true`)
  + _`tags`_ (optional, default: `{}`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Creates for a `corpus` a WebEntity defined for a `lru_prefix` and optionnally for the corresponding http/https and www/no-www variations if `lruVariations` is true. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startpages`. Returns the newly created WebEntity.


- __`declare_webentity_by_lrus_as_urls`:__
  + _`list_urls`_ (mandatory)
  + _`name`_ (optional, default: `null`)
  + _`status`_ (optional, default: `null`)
  + _`startpages`_ (optional, default: `[]`)
  + _`lruVariations`_ (optional, default: `true`)
  + _`tags`_ (optional, default: `{}`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Creates for a `corpus` a WebEntity defined for a set of LRU prefixes given as URLs under `list_urls` and optionnally for the corresponding http/https and www/no-www variations if `lruVariations` is true. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startpages`. Returns the newly created WebEntity.


- __`declare_webentity_by_lrus`:__
  + _`list_lrus`_ (mandatory)
  + _`name`_ (optional, default: `null`)
  + _`status`_ (optional, default: `""`)
  + _`startpages`_ (optional, default: `[]`)
  + _`lruVariations`_ (optional, default: `true`)
  + _`tags`_ (optional, default: `{}`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Creates for a `corpus` a WebEntity defined for a set of LRU prefixes given as `list_lrus` and optionnally for the corresponding http/https and www/no-www variations if `lruVariations` is true. Optionally set the newly created WebEntity's `name` `status` ("in"/"out"/"undecided"/"discovered") and list of `startpages`. Returns the newly created WebEntity.

### EDIT WEBENTITIES

- __`basic_edit_webentity`:__
  + _`webentity_id`_ (mandatory)
  + _`name`_ (optional, default: `null`)
  + _`status`_ (optional, default: `null`)
  + _`homepage`_ (optional, default: `null`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Changes for a `corpus` at once the `name`, `status` and `homepage` of a WebEntity defined by `webentity_id`.


- __`rename_webentity`:__
  + _`webentity_id`_ (mandatory)
  + _`new_name`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Changes for a `corpus` the name of a WebEntity defined by `webentity_id` to `new_name`.


- __`set_webentity_status`:__
  + _`webentity_id`_ (mandatory)
  + _`status`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Changes for a `corpus` the status of a WebEntity defined by `webentity_id` to `status` (one of "in"/"out"/"undecided"/"discovered").


- __`set_webentities_status`:__
  + _`webentity_ids`_ (mandatory)
  + _`status`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Changes for a `corpus` the status of a set of WebEntities defined by a list of `webentity_ids` to `status` (one of "in"/"out"/"undecided"/"discovered").


- __`set_webentity_homepage`:__
  + _`webentity_id`_ (mandatory)
  + _`homepage`_ (optional, default: `""`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Changes for a `corpus` the homepage of a WebEntity defined by `webentity_id` to `homepage`.


- __`add_webentity_lruprefixes`:__
  + _`webentity_id`_ (mandatory)
  + _`lru_prefixes`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Adds for a `corpus` a list of `lru_prefixes` (or a single one) to a WebEntity defined by `webentity_id`.


- __`rm_webentity_lruprefix`:__
  + _`webentity_id`_ (mandatory)
  + _`lru_prefix`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Removes for a `corpus` a `lru_prefix` from the list of prefixes of a WebEntity defined by `webentity_id. Will delete the WebEntity if it ends up with no LRU prefix left.


- __`add_webentity_startpages`:__
  + _`webentity_id`_ (mandatory)
  + _`startpages_urls`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Adds for a `corpus` a list of `startpages_urls` to the list of startpages to use when crawling the WebEntity defined by `webentity_id`.


- __`add_webentity_startpage`:__
  + _`webentity_id`_ (mandatory)
  + _`startpage_url`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Adds for a `corpus` a `startpage_url` to the list of startpages to use when crawling the WebEntity defined by `webentity_id`.


- __`rm_webentity_startpages`:__
  + _`webentity_id`_ (mandatory)
  + _`startpages_urls`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Removes for a `corpus` a list of `startpages_urls` from the list of startpages to use when crawling the WebEntity defined by `webentity_id.


- __`rm_webentity_startpage`:__
  + _`webentity_id`_ (mandatory)
  + _`startpage_url`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Removes for a `corpus` a `startpage_url` from the list of startpages to use when crawling the WebEntity defined by `webentity_id.


- __`merge_webentity_into_another`:__
  + _`old_webentity_id`_ (mandatory)
  + _`good_webentity_id`_ (mandatory)
  + _`include_tags`_ (optional, default: `false`)
  + _`include_home_and_startpages_as_startpages`_ (optional, default: `false`)
  + _`include_name_and_status`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Assembles for a `corpus` 2 WebEntities by deleting WebEntity defined by `old_webentity_id` and adding all of its LRU prefixes to the one defined by `good_webentity_id`. Optionally set `include_tags` and/or `include_home_and_startpages_as_startpages` and/or `include_name_and_status` to "true" to also add the tags and/or startpages and/or name&status to the merged resulting WebEntity.


- __`merge_webentities_into_another`:__
  + _`old_webentity_ids`_ (mandatory)
  + _`good_webentity_id`_ (mandatory)
  + _`include_tags`_ (optional, default: `false`)
  + _`include_home_and_startpages_as_startpages`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Assembles for a `corpus` a bunch of WebEntities by deleting WebEntities defined by a list of `old_webentity_ids` and adding all of their LRU prefixes to the one defined by `good_webentity_id`. Optionally set `include_tags` and/or `include_home_and_startpages_as_startpages` to "true" to also add the tags and/or startpages to the merged resulting WebEntity.


- __`delete_webentity`:__
  + _`webentity_id`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Removes from a `corpus` a WebEntity defined by `webentity_id` (mainly for advanced debug use).

### RETRIEVE AND SEARCH WEBENTITIES

- __`get_webentity`:__
  + _`webentity_id`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` a WebEntity defined by its `webentity_id`.


- __`get_webentity_by_lruprefix`:__
  + _`lru_prefix`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` the WebEntity having `lru_prefix` as one of its LRU prefixes.


- __`get_webentity_by_lruprefix_as_url`:__
  + _`url`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` the WebEntity having one of its LRU prefixes corresponding to the LRU fiven under the form of a `url`.


- __`get_webentity_for_url`:__
  + _`url`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` the WebEntity to which a `url` belongs (meaning starting with one of the WebEntity's prefix and not another).


- __`get_webentity_for_url_as_lru`:__
  + _`lru`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` the WebEntity to which a url given under the form of a `lru` belongs (meaning starting with one of the WebEntity's prefix and not another).


- __`get_webentities`:__
  + _`list_ids`_ (optional, default: `[]`)
  + _`sort`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`light`_ (optional, default: `false`)
  + _`semilight`_ (optional, default: `false`)
  + _`light_for_csv`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all existing WebEntities or only the WebEntities whose id is among `list_ids`.
 Results will be paginated with a total number of returned results of `count` and `page` the number of the desired page of results. Returns all results at once if `list_ids` is provided or `count` `_ (optional, default: `= -1 ; otherwise results will include metadata on the request including the total number of results and a `token` to be reused to collect the other pages via `get_webentities_page`.`)
 Other possible options include:
  * order the results with `sort` by inputting a field or list of fields as named in the WebEntities returned objects; optionally prefix a sort field with a "-" to revert the sorting on it; for instance: `["-indegree", "name"]` will order by maximum indegree first then by alphabetic order of names
  * set `light` or `semilight` or `light_for_csv` to "true" to collect lighter data with less WebEntities fields.


- __`search_webentities`:__
  + _`allFieldsKeywords`_ (optional, default: `[]`)
  + _`fieldKeywords`_ (optional, default: `[]`)
  + _`sort`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`light`_ (optional, default: `false`)
  + _`semilight`_ (optional, default: `true`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all WebEntities matching a specific search using the `allFieldsKeywords` and `fieldKeywords` arguments.
 Returns all results at once if `count` `_ (optional, default: `= -1 ; otherwise results will be paginated with `count` results per page, using `page` as index of the desired page. Results will include metadata on the request including the total number of results and a `token` to be reused to collect the other pages via `get_webentities_page`.`)
  * `allFieldsKeywords` should be a string or list of strings to search in all textual fields of the WebEntities ("name", "lru prefixes", "startpages" & "homepage"). For instance `["hyphe", "www"]`
  * `fieldKeywords` should be a list of 2-elements arrays giving first the field to search into then the searched value or optionally for the field "indegree" an array of a minimum and maximum values to search into (notes: this does not work with undirected_degree and outdegree ; only exact values will be matched when querying on field status field). For instance: `[["name", "hyphe"], ["indegree", [3, 1000]]]`
  * see description of `sort`, `light` and `semilight` in `get_webentities` above.


- __`wordsearch_webentities`:__
  + _`allFieldsKeywords`_ (optional, default: `[]`)
  + _`fieldKeywords`_ (optional, default: `[]`)
  + _`sort`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`light`_ (optional, default: `false`)
  + _`semilight`_ (optional, default: `true`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Same as `search_webentities` except that search is only matching exact full words
  + _`and that `allFieldsKeywords` query also search into tags values.


- __`get_webentities_by_status`:__
  + _`status`_ (mandatory)
  + _`sort`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`light`_ (optional, default: `false`)
  + _`semilight`_ (optional, default: `true`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all WebEntities having their status equal to `status` (one of "in"/"out"/"undecided"/"discovered").
 Results are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`.


- __`get_webentities_by_name`:__
  + _`name`_ (mandatory)
  + _`sort`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all WebEntities having their name equal to `name`.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`.


- __`get_webentities_by_tag_value`:__
  + _`value`_ (mandatory)
  + _`namespace`_ (optional, default: `null`)
  + _`category`_ (optional, default: `null`)
  + _`sort`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all WebEntities having at least one tag in any namespace/category equal to `value`.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`.


- __`get_webentities_by_tag_category`:__
  + _`namespace`_ (mandatory)
  + _`category`_ (mandatory)
  + _`sort`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all WebEntities having at least one tag in a specific `category` for a specific `namespace`.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`.


- __`get_webentities_mistagged`:__
  + _`status`_ (optional, default: `'IN'`)
  + _`missing_a_category`_ (optional, default: `false`)
  + _`multiple_values`_ (optional, default: `false`)
  + _`sort`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`light`_ (optional, default: `false`)
  + _`semilight`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all WebEntities of status `status` with no tag of the namespace "USER" or multiple tags for some USER categories if `multiple_values` is true or no tag for at least one existing USER category if `missing_a_category` is true.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`.


- __`get_webentities_uncrawled`:__
  + _`sort`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`light`_ (optional, default: `false`)
  + _`semilight`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all IN WebEntities which have no crawljob associated with it.
 Results are paginated and will include a `token` to be reused to collect the other pages via `get_webentities_page`: see `search_webentities` for explanations on `sort` `count` and `page`.


- __`get_webentities_page`:__
  + _`pagination_token`_ (mandatory)
  + _`n_page`_ (mandatory)
  + _`idNamesOnly`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` the page number `n_page` of WebEntities corresponding to the results of a previous query ran using any of the `get_webentities` or `search_webentities` methods using the returned `pagination_token`. Returns only an array of [id, name] arrays if `idNamesOnly` is true.


- __`get_webentities_ranking_stats`:__
  + _`pagination_token`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` histogram data on the indegrees of all WebEntities matching a previous query ran using any of the `get_webentities` or `search_webentities` methods using the return `pagination_token`.

### TAGS

- __`rebuild_tags_dictionary`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Administrative function to regenerate for a `corpus` the dictionnary of tag values used by autocompletion features
  + _`mostly a debug function which should not be used in most cases.


- __`add_webentity_tag_value`:__
  + _`webentity_id`_ (mandatory)
  + _`namespace`_ (mandatory)
  + _`category`_ (mandatory)
  + _`value`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Adds for a `corpus` a tag `namespace:category`_ (optional, default: `value` to a WebEntity defined by `webentity_id`.`)


- __`add_webentities_tag_value`:__
  + _`webentity_ids`_ (mandatory)
  + _`namespace`_ (mandatory)
  + _`category`_ (mandatory)
  + _`value`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Adds for a `corpus` a tag `namespace:category`_ (optional, default: `value` to a bunch of WebEntities defined by a list of `webentity_ids`.`)


- __`rm_webentity_tag_value`:__
  + _`webentity_id`_ (mandatory)
  + _`namespace`_ (mandatory)
  + _`category`_ (mandatory)
  + _`value`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Removes for a `corpus` a tag `namespace:category`_ (optional, default: `value` associated with a WebEntity defined by `webentity_id` if it is set.`)


- __`rm_webentities_tag_value`:__
  + _`webentity_ids`_ (mandatory)
  + _`namespace`_ (mandatory)
  + _`category`_ (mandatory)
  + _`value`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Removes for a `corpus` a tag `namespace:category`_ (optional, default: `value` to a bunch of WebEntities defined by a list of `webentity_ids`.`)


- __`edit_webentity_tag_value`:__
  + _`webentity_id`_ (mandatory)
  + _`namespace`_ (mandatory)
  + _`category`_ (mandatory)
  + _`old_value`_ (mandatory)
  + _`new_value`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Replaces for a `corpus` a tag `namespace:category`_ (optional, default: `old_value` into a tag `namespace:category=new_value` for the WebEntity defined by `webentity_id` if it is set.`)


- __`get_tags`:__
  + _`namespace`_ (optional, default: `null`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` a tree of all existing tags of the webentities hierarchised by namespaces and categories. Optionally limits to a specific `namespace`.


- __`get_tag_namespaces`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` a list of all existing namespaces of the webentities tags.


- __`get_tag_categories`:__
  + _`namespace`_ (optional, default: `null`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` a list of all existing categories of the webentities tags. Optionally limits to a specific `namespace`.


- __`get_tag_values`:__
  + _`namespace`_ (optional, default: `null`)
  + _`category`_ (optional, default: `null`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` a list of all existing values in the webentities tags. Optionally limits to a specific `namespace` and/or `category`.

### PAGES, LINKS AND NETWORKS

- __`get_webentity_pages`:__
  + _`webentity_id`_ (mandatory)
  + _`onlyCrawled`_ (optional, default: `true`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Warning: this method can be very slow on webentities with many pages, privilege paginate_webentity_pages whenever possible. Returns for a `corpus` all indexed Pages fitting within the WebEntity defined by `webentity_id`. Optionally limits the results to Pages which were actually crawled setting `onlyCrawled` to "true".


- __`paginate_webentity_pages`:__
  + _`webentity_id`_ (mandatory)
  + _`count`_ (optional, default: `5000`)
  + _`pagination_token`_ (optional, default: `null`)
  + _`onlyCrawled`_ (optional, default: `false`)
  + _`include_page_metas`_ (optional, default: `false`)
  + _`include_page_body`_ (optional, default: `false`)
  + _`body_as_plain_text`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` `count` indexed Pages alphabetically ordered fitting within the WebEntity defined by `webentity_id` and returns a `pagination_token` to reuse to collect the following pages. Optionally limits the results to Pages which were actually crawled setting `onlyCrawled` to "true". Also optionally returns complete page metadata (http status, body size, content_type, encoding, crawl timestamp\ and crawl depth) when `include_page_metas` is set to "true". Additionally returns the page's zipped body encoded in base64 when `include_page_body` is "true" (only possible when Hyphe is configured with `store_crawled_html_content` to "true"); setting body_as_plain_text to "true" decodes and unzip these to return them as plain text.


- __`get_webentity_mostlinked_pages`:__
  + _`webentity_id`_ (mandatory)
  + _`npages`_ (optional, default: `20`)
  + _`max_prefix_distance`_ (optional, default: `null`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` the `npages` (defaults to 20) most linked Pages indexed that fit within the WebEntity defined by `webentity_id` and optionnally at a maximum depth of `max_prefix_distance`.


- __`get_webentity_subwebentities`:__
  + _`webentity_id`_ (mandatory)
  + _`light`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all sub-webentities of a WebEntity defined by `webentity_id` (meaning webentities having at least one LRU prefix starting with one of the WebEntity's prefixes).


- __`get_webentity_parentwebentities`:__
  + _`webentity_id`_ (mandatory)
  + _`light`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all parent-webentities of a WebEntity defined by `webentity_id` (meaning webentities having at least one LRU prefix starting like one of the WebEntity's prefixes).


- __`get_webentity_pagelinks_network`:__
  + _`webentity_id`_ (optional, default: `null`)
  + _`include_external_links`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Warning: this method can be very slow on webentities with many pages or links, privilege paginate_webentity_pagelinks_network whenever possible. Returns for a `corpus` the list of all internal NodeLinks of a WebEntity defined by `webentity_id`. Optionally add external NodeLinks (the frontier) by setting `include_external_links` to "true".


- __`paginate_webentity_pagelinks_network`:__
  + _`webentity_id`_ (optional, default: `null`)
  + _`count`_ (optional, default: `10`)
  + _`pagination_token`_ (optional, default: `null`)
  + _`include_external_outlinks`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` internal page links for `count` source pages of a WebEntity defined by `webentity_id` and returns a `pagination_token` to reuse to collect the following links. Optionally add external NodeLinks (the frontier) by setting `include_external_outlinks` to "true".


- __`get_webentity_referrers`:__
  + _`webentity_id`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`light`_ (optional, default: `true`)
  + _`semilight`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all WebEntities with known links to `webentity_id` ordered by decreasing link weight.
 Results are paginated and will include a `token` to be reused to collect the other entities via `get_webentities_page`: see `search_webentities` for explanations on `count` and `page`.


- __`get_webentity_referrals`:__
  + _`webentity_id`_ (optional, default: `null`)
  + _`count`_ (optional, default: `100`)
  + _`page`_ (optional, default: `0`)
  + _`light`_ (optional, default: `true`)
  + _`semilight`_ (optional, default: `false`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all WebEntities with known links from `webentity_id` ordered by decreasing link weight.
 Results are paginated and will include a `token` to be reused to collect the other entities via `get_webentities_page`: see `search_webentities` for explanations on `count` and `page`.


- __`get_webentity_ego_network`:__
  + _`webentity_id`_ (optional, default: `null`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` a list of all weighted links between webentities linked to `webentity_id`.


- __`get_webentities_network`:__
  + _`include_links_from_OUT`_ (optional, default: `INCLUDE_LINKS_FROM_OUT`)
  + _`include_links_from_DISCOVERED`_ (optional, default: `INCLUDE_LINKS_FROM_DISCOVERED`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` the list of all agregated weighted links between WebEntities.

### CREATION RULES

- __`get_default_webentity_creationrule`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` the default WebEntityCreationRule.


- __`get_webentity_creationrules`:__
  + _`lru_prefix`_ (optional, default: `null`)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a `corpus` all existing WebEntityCreationRules or only one set for a specific `lru_prefix`.


- __`delete_webentity_creationrule`:__
  + _`lru_prefix`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Removes from a `corpus` an existing WebEntityCreationRule set for a specific `lru_prefix`.


- __`add_webentity_creationrule`:__
  + _`lru_prefix`_ (mandatory)
  + _`regexp`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Adds to a `corpus` a new WebEntityCreationRule set for a `lru_prefix` to a specific `regexp` or one of "subdomain"/"subdomain-N"/"domain"/"path-N"/"prefix+N"/"page" N being an integer. It will immediately by applied to past crawls.


- __`simulate_creationrules_for_urls`:__
  + _`pageURLs`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns an object giving for each URL of `pageURLs` (single string or array) the prefix of the theoretical WebEntity the URL would be attached to within a `corpus` following its specific WebEntityCreationRules.


- __`simulate_creationrules_for_lrus`:__
  + _`pageLRUs`_ (mandatory)
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns an object giving for each LRU of `pageLRUs` (single string or array) the prefix of the theoretical WebEntity the LRU would be attached to within a `corpus` following its specific WebEntityCreationRules.

### VARIOUS

- __`trigger_links_build`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Will initiate a links calculation update (useful especially when a corpus crashed during the links calculation and no more crawls is programmed).


- __`get_webentities_stats`:__
  + _`corpus`_ (optional, default: `"--hyphe--"`)

 Returns for a corpus a set of statistics on the WebEntities status repartition of a `corpus` each 5 minutes.

