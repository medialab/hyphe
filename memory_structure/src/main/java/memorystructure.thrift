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
  8: set<string> sourceSet,
  9: bool isFullPrecision = false,
  10: bool isNode,
  11: map<string, map<string, set<string>>> metadataItems,
  12: string creationDate,
  13: string lastModificationDate
}

struct NodeLink {
  1: string id,
  2: string sourceLRU,
  3: string targetLRU,
  4: i32 weight=1,
  5: string creationDate,
  6: string lastModificationDate
}

struct WebEntityNodeLink {
  1: string id,
  2: string sourceId,
  3: string targetLRU,
  4: i32 weight=1,
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
  4: string status,
  5: string homepage,
  6: set<string> startpages,
  7: map<string, map<string, set<string>>> metadataItems,
  8: string creationDate,
  9: string lastModificationDate
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
// get webentity
/**
* @param 1 id
* @return a WebEntity Object
**/
WebEntity getWebEntity(1: string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

// get subwebentities
/**
* @param 1 id
* @return a List of WebEntity Objects
**/
list<WebEntity> getSubWebEntities(1: string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

// get parentwebentities
/**
* @param 1 id
* @return a List of WebEntity Objects
**/
list<WebEntity> getParentWebEntities(1: string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

// get all nodelinks
/**
 * @return all nodelinks in the index
 */
list<NodeLink> getNodeLinks() throws (1:MemoryStructureException me),

// get nodelinks of a specific webentity
/**
 * @param 1 webEntityId
 * @param 2 includeFrontier
 * @return nodelinks for webEntity
 */
list<NodeLink> getWebentityNodeLinks(1: string webEntityId, 2: bool includeFrontier) throws (1:MemoryStructureException me),

// get all webentities
/**
 * @return all webentities in the index
 */
list<WebEntity> getWebEntities() throws (1:MemoryStructureException me),

// get webentities by ids
/**
 * @param 1 listIDs
 * @return webentities having ids
 */
list<WebEntity> getWebEntitiesByIDs(1: list<string> listIDs) throws (1:MemoryStructureException me),

// get pages belonging to one webentity
/**
 * @param 1 id
 * @return set of pages for this webentity (may be empty)
 */
list<PageItem> getPagesFromWebEntity(1:string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

// deletes a webentity
/**
 * @param 1 webEntity
 */
void deleteWebEntity(1: WebEntity webEntity) throws (1:MemoryStructureException me),

// generate webentity links
/**
 * Generates WebEntity links.
 */
list<WebEntityLink> generateWebEntityLinks() throws (1:MemoryStructureException x),

// get all webentity links
/**
 * @return all WebEntity links from the index.
 */
list<WebEntityLink> getWebEntityLinks() throws (1:MemoryStructureException x),

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

 //get_precision_exceptions
 /**
  * @return set of lru prefixes
  */
 list<string> getPrecisionExceptions() throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

 /**
  * @param 1 cacheId : id of the cache
  */
i32 createWebEntities(1:string cacheId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

 // delete_page_cache
 /**
  * @param 1 cacheId : id of the cache
  */
 void deleteCache(1:string cacheId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

 // mark lrus as precision exception
 /**
  * @param 1 LRUs : list of lrus to add as precision exceptions
  */
 void markPrecisionExceptions(1:list<string> listLRUs) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

 // remove lrus as precision exception
 /**
  * @param 1 LRUs : list of lrus to remove from precision exceptions
  */
 void removePrecisionExceptions(1:list<string> listLRUs) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x),

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

/**
 * @param 1 lru to search for
 * @return web entity whose lruprefixes contain this LRU and not contained in any wubwebentity
 */
WebEntity findWebEntityMatchingLRU(1:string lru) throws (1:MemoryStructureException me),

/**
 * @param 1 prefix to search for
 * @return web entity whose aliases contains this prefix
 */
WebEntity findWebEntityByLRUPrefix(1:string prefix) throws (1:MemoryStructureException me),

/**
 * @param 1 prefix to search for
 * @return web entities one of whose aliases contains this prefix
 */
list<WebEntity> findWebEntitiesByLRUPrefix(1:string prefix) throws (1:MemoryStructureException me),

/**
 * @param 1 prefix to search for
 * @return pageitems whose lru matches this prefix
 */
list<PageItem> findPagesByPrefix(1:string prefix) throws (1:MemoryStructureException me),

/**
 * @param 1 prefix to search for
 * @return nodelinks whose source matches this prefix
 */
list<NodeLink> findNodeLinksBySource(1:string prefix) throws (1:MemoryStructureException me),

/**
 * @param 1 prefix to search for
 * @return nodelinks whose target matches this prefix
 */
list<NodeLink> findNodeLinksByTarget(1:string prefix) throws (1:MemoryStructureException me),

/**
 * @param 1 id: id of web entity
 * @return webentities whose source id are this
 */
list<WebEntityLink> findWebEntityLinksBySource(1:string id) throws (1:MemoryStructureException me),

/**
 * @param 1 id: id of web entity
 * @return webentities whose target id are this
 */
list<WebEntityLink> findWebEntityLinksByTarget(1:string id) throws (1:MemoryStructureException me)

/**
 * delete all NodeLinks from index
 */
void deleteNodeLinks() throws (1:MemoryStructureException me)
}