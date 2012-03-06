#
#   HCI memory structure - core interface
#
#


## Objects as structures

namespace java fr.sciencespo.medialab.hci.memorystructure.thrift

exception MemoryStructureException {
  1: string msg,
  2: string stacktrace,
  3: string classname
}

exception ObjectNotFoundException {
  1: string msg,
  2: string stacktrace,
  3: string classname
}

struct PageItem {
  1: string id,
  2: string url,
  3: string lru,
  4: string crawlerTimestamp,
  5: i32 httpStatusCode,
  6: i32 depth,
  7: string errorCode,
  8: bool isFullPrecision = false,
  9: bool isNode,
  10: map<string, set<string>> metadataItems,
  11: string creationDate,
  12: string lastModificationDate
}

struct NodeLink {
  1: string id,
  2: string sourceLRU,
  3: string targetLRU,
  4: i32 weight=1,
  5: string creationDate,
  6: string lastModificationDate
}

struct WebEntityLink {
  1: string id,
  2: string sourceId,
  3: string targetId,
  4: i32 weight=1,
  5: string creationDate,
  6: string lastModificationDate
}

/**
 *
 */
struct WebEntity {
  1: string id,
  2: set<string> LRUSet,
  3: string name,
  4: string creationDate,
  5: string lastModificationDate
}

struct WebEntityCreationRule {
  1: string regExp,
  2: string LRU,
  3: string creationDate,
  4: string lastModificationDate
}

struct PingPong {
  1: string ping,
  2: string pong
}


# Services

service MemoryStructure {

// CREATED by PAUL
// ping
/*¨replies pong */
list<PingPong> ping(),


// MODIFIED by Paul
 //update  webentity
 /**
  * @param 1 webEntity
  * @return id of the web entity
  */
  string updateWebEntity(1:WebEntity webEntity) throws (1:MemoryStructureException x),

// ADDED by Paul
// create webentity
/**
* @param 1 name
* @param 2 LRUSet
* @return a WebEntity object
**/
  WebEntity createWebEntity(1: string name,2:set<string> LRUSet) throws (1:MemoryStructureException x),

// ADDED by Paul
// get webentity
/**
* @param 1 id
* @return a WebEntity Object
**/
WebEntity getWebEntity(1: string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

// get all webentities
/**
 * @return all webentities in the index
 */
list<WebEntity> getWebEntities(),

// get pages belonging to one webentity
/**
 * @param 1 id
 * @return set of pages for this webentity (may be empty)
 */
list<PageItem> getPagesFromWebEntity(1:string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

// generate webentity links
/**
 * Generates WebEntity links.
 */
void generateWebEntityLinks() throws (1:MemoryStructureException x),

// clear complete index
/**
 * Clears (empties) the index.
 */
void clearIndex() throws (1:MemoryStructureException x),

// create_pages_cache
/**
 * @param 1 pageItems : set of PageItem objects
 * @return id of the created cache
 */
string createCache(1:list<PageItem> pageItems) throws (1:MemoryStructureException x),

// index_pages_from_cache
/**
 * @param 1 cacheId : id of the cache
 * @return number of indexed PageItems
 */
i32 indexCache(1:string cacheId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

 //get_precision_exceptions_from_cache
 /**
  * @param 1 cacheId : id of the cache
  * @return set of lru prefixes
  */
 list<string> getPrecisionExceptionsFromCache(1:string cacheId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

 /**
  * @param 1 cacheId : id of the cache
  */
 void createWebEntities(1:string cacheId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

 // delete_page_cache
 /**
  * @param 1 cacheId : id of the cache
  */
 void deleteCache(1:string cacheId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

 // mark pageitem as precision exception
 /**
  * @param 1 pageItemId : id of the pageItem to be
  */
 void markPageWithPrecisionException(1:string pageItemId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

 // store WebEntityCreationRule
 /**
  * Adds or updates a single WebEntityCreationRule to the index. If the rule's LRU is empty, it is set as the
  * DEFAULT rule. If there exists already a rule with this rule's LRU, it is updated, otherwise it is created.
  *
  * @param 1 webEntityCreationRule : webentity creation rule to save
  */
void saveWebEntityCreationRule(1:WebEntityCreationRule webEntityCreationRule) throws (1:MemoryStructureException me),

// get all WebEntityCreationRules from index
/**
 *
 */
list<WebEntityCreationRule> getWebEntityCreationRules(),

// delete a WebEntityCreationRule from index
/**
 * @param 1 webEntityCreationRule : webentity creation rule to delete
 */
void deleteWebEntityCreationRule(1:WebEntityCreationRule webEntityCreationRule),

// PageItems
/**
 * Saves pages in the index WITHOUT USING THE CACHE.
 *
 * @param 1 pageItems : set of PageItem objects
 */
void savePageItems(1:list<PageItem> pageItems) throws (1:MemoryStructureException me),

// NodeLinks
/**
 *
 * @param 1 nodeLinks : set of NodeLink objects
 */
void saveNodeLinks(1:list<NodeLink> nodeLinks) throws (1:MemoryStructureException me),

// WebEntity
/**
 *
 * @param 1 id : the id of the WebEntity to add this LRU to
 * @param 2 lru : the lru to add
**/
void addAliastoWebEntity(1:string id, 2:string lru) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

// gefx network
/**
 * @param 1 format: must be 'gefx'
 * @return gefx graph
 */
string getWebEntityNetwork(1:string format) throws (1:MemoryStructureException me),

// gefx egonetwork
/**
 * @param 1 webEntityId: id of web entity
 * @param 2 distance: distance
 * @param 3 format: must be 'gefx'
 * @return gefx graph
 */
string getWebEntityEgoNetwork(1:string webEntityId, 2:i32 distance, 3:string format) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

/**
 * @param 1 prefix to search for
 * @return web entities one of whose aliases contains this prefix
 */
list<WebEntity> findWebEntitiesByPrefix(1:string prefix),

/**
 * @param 1 prefix to search for
 * @return pageitems whose lru matches this prefix
 */
list<PageItem> findPagesByPrefix(1:string prefix),

/**
 * @param 1 prefix to search for
 * @return nodelinks whose source matches this prefix
 */
list<NodeLink> findNodeLinksBySource(1:string prefix),

/**
 * @param 1 prefix to search for
 * @return nodelinks whose target matches this prefix
 */
list<NodeLink> findNodeLinksByTarget(1:string prefix),

/**
 * @param 1 id: id of web entity
 * @return webentities whose source id are this
 */
list<WebEntityLink> findWebEntityLinksBySource(1:string id),

/**
 * @param 1 id: id of web entity
 * @return webentities whose target id are this
 */
list<WebEntityLink> findWebEntityLinksByTarget(1:string id),

}