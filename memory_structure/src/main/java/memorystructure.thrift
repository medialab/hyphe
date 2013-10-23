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
  11: map<string, map<string, list<string>>> metadataItems,
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

struct WebEntity {
  1: string id,
  2: set<string> LRUSet,
  3: string name,
  4: string status,
  5: string homepage,
  6: set<string> startpages,
  7: map<string, map<string, list<string>>> metadataItems,
  8: string creationDate,
  9: string lastModificationDate
}

struct WebEntityLink {
  1: string id,
  2: string sourceId,
  3: string targetId,
  4: i32 weight=1,
  5: string creationDate,
  6: string lastModificationDate
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


// ping
/**
 * replies pong
 */
list<PingPong> ping()

// clearIndex
/**
 * Empties completely the index.
 */
void clearIndex() throws (1:MemoryStructureException x)


// -- PAGEITEMS

// createCache
/**
 * @param 1 pageItems : List of PageItem objects to be indexed
 * @return id of the created cache
 */
string createCache(1:list<PageItem> pageItems) throws (1:MemoryStructureException x)

// indexCache
/**
 * @param 1 cacheId : id of the cache containing the PageItems to be indexed
 * @return number of indexed PageItems
 */
i32 indexCache(1:string cacheId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)

/** createWebEntitiesFromCache
 * @param 1 cacheId : id of the cache
 * @return number of indexed PageItems
 */
i32 createWebEntitiesFromCache(1:string cacheId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)

// deleteCache
/**
 * @param 1 cacheId : id of the cache
 */
void deleteCache(1:string cacheId) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)

/** savePageItems
 * Saves pages in the index WITHOUT USING THE CACHE.
 * @param 1 pageItems : List of PageItem objects to index
 */
void savePageItems(1:list<PageItem> pageItems) throws (1:MemoryStructureException me)

/** findPageItemsMatchingLRUPrefix
  * @param 1 prefix to search for
  * @return a List of PageItems whose lru matches this prefix
 */
list<PageItem> findPageItemsMatchingLRUPrefix(1:string prefix) throws (1:MemoryStructureException me)


// -- NODELINKS

// getNodeLinks
/**
 * @return all NodeLinks in the index
 */
list<NodeLink> getNodeLinks() throws (1:MemoryStructureException me)

// deleteNodeLinks
/**
 * delete all NodeLinks from index
 */
void deleteNodeLinks() throws (1:MemoryStructureException me)

/** saveNodeLinks
 *
 * @param 1 nodeLinks : List of NodeLink objects to be indexed
 */
void saveNodeLinks(1:list<NodeLink> nodeLinks) throws (1:MemoryStructureException me)

/** findNodeLinksBySourceLRUPrefix
 * @param 1 LRU prefix to match by Searched NodeLink's source
 * @return a List of NodeLinks whose source matches this prefix
 */
list<NodeLink> findNodeLinksMatchingSourceLRUPrefix(1:string prefix) throws (1:MemoryStructureException me)

/** findNodeLinksByTargetLRUPrefix
 * @param 1 LRU prefix to match by Searched NodeLink's target
 * @return a List of NodeLinks whose target matches this prefix
 */
list<NodeLink> findNodeLinksMatchingTargetLRUPrefix(1:string prefix) throws (1:MemoryStructureException me)


// -- WEBENTITIES

// getWebEntities
/**
 * @return all WebEntities in the index
 */
list<WebEntity> getWebEntities() throws (1:MemoryStructureException me)

// getWebEntitiesByIDs
/**
 * @param 1 listIDs
 * @return webentities having ids in listIDs
 */
list<WebEntity> getWebEntitiesByIDs(1: list<string> listIDs) throws (1:MemoryStructureException me)

// getWebEntity
/**
* @param 1 id of the webentity
* @return a WebEntity Object
**/
WebEntity getWebEntity(1: string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)

// updateWebEntity
/**
 * @param 1 webEntity
 * @return id of the web entity
 */
string updateWebEntity(1:WebEntity webEntity) throws (1:MemoryStructureException x)

// deleteWebEntity
/**
 * @param 1 webEntity
 */
void deleteWebEntity(1: WebEntity webEntity) throws (1:MemoryStructureException me)

// getWebEntitySubWebEntities: get children webentities of a webentity
/**
* @param 1 id of the webentity
* @return a List of WebEntity Objects
**/
list<WebEntity> getWebEntitySubWebEntities(1: string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)

// getWebEntityParentWebEntities: get parent webentities of a webentity
/**
* @param 1 id of the webentity
* @return a List of WebEntity Objects
**/
list<WebEntity> getWebEntityParentWebEntities(1: string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)

// getWebEntityPages pages belonging to one webentity
/**
 * @param 1 id
 * @return a List of Page Objects having urls within the prefixes of the webentity (may be empty)
 */
list<PageItem> getWebEntityPages(1:string id) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)

// getWebEntityNodeLinks: get all NodeLinks for a specific WebEntity
/**
 * @param 1 webEntityId
 * @param 2 includeFrontier: boolean to decide whether external links from other webentities to the specific one whoudl be included or not
 * @return a List of NodeLink Objects having source or target within the prefixes of the webentity (may be empty)
 */
list<NodeLink> getWebentityNodeLinks(1: string webEntityId, 2: bool includeFrontier) throws (1:MemoryStructureException me)

/** getWebEntityByLRUPrefix
 * @param 1 prefix to search for
 * @return a WebEntity Object whose LRU prefixes contains this prefix
 */
WebEntity getWebEntityByLRUPrefix(1:string prefix) throws (1:MemoryStructureException me)

/** findWebEntityMatchingLRUPrefix
 * @param 1 lru to search for
 * @return a WebEntity Object whose LRUprefixes match the LRU and where the LRU is not contained in any subwebentity
 */
WebEntity findWebEntityMatchingLRUPrefix(1:string lru) throws (1:MemoryStructureException me)

/** searchWebEntities: Free search of webentities in the index on main fields and/or by specific fields. Accepts Lucene wildcards.
 * @param 1 list of keywords to search for
 * @param 2 list of pair field/keyword to search for
 * @return a List of WebEntity Objects matching the search
 */
list<WebEntity> searchWebEntities(1:list<string> allFieldsKeywords, 2: list<list<string>> fieldKeywords) throws (1:MemoryStructureException me)

/** getTags
 * @return a Map by Namespaces of Maps by Categories of all Tag values stored in the index's WebEntities metadataItems
 */
map<string, map<string, list<string>>> getTags() throws (1:MemoryStructureException me)


// -- WEBENTITYLINKS

// getWebEntityLinks
/**
 * @return all WebEntityLinks from the index.
 */
list<WebEntityLink> getWebEntityLinks() throws (1:MemoryStructureException x)

// generate webentity links
/**
 * Run process to generate WebEntityLinks from WebEntities and NodeLinks.
 */
list<WebEntityLink> generateWebEntityLinks() throws (1:MemoryStructureException x)

/** getWebEntityLinksByWebEntitySource
 * @param 1 id: id of web entity
 * @return a List of WebEntityLink Objects whose source id are this
 */
list<WebEntityLink> getWebEntityLinksByWebEntitySource(1:string id) throws (1:MemoryStructureException me)

/** getWebEntityLinksByWebEntityTarget
 * @param 1 id: id of web entity
 * @return a List of WebEntityLink Objects whose target id are this
 */
list<WebEntityLink> getWebEntityLinksByWebEntityTarget(1:string id) throws (1:MemoryStructureException me)


// -- WEBENTITYCREATIONRULES

// getWebEntityCreationRules
/**
 * @return the List of WebEntityCreationRules Objects in index
 */
list<WebEntityCreationRule> getWebEntityCreationRules()

// addWebEntityCreationRule
/**
 * Adds or updates a single WebEntityCreationRule to the index. If the rule's LRU is empty, it is set as the
 * DEFAULT rule. If there exists already a rule with this rule's LRU, it is updated, otherwise it is created.
 * @param 1 webEntityCreationRule : WebEntityCreationRule object to save
 */
void addWebEntityCreationRule(1:WebEntityCreationRule webEntityCreationRule) throws (1:MemoryStructureException me)

// removeWebEntityCreationRule
/**
 * @param 1 webEntityCreationRule : WebEntityCreationRule to delete
 */
void removeWebEntityCreationRule(1:WebEntityCreationRule webEntityCreationRule)


// -- PRECISIONEXCEPTIONS

// getPrecisionExceptions
/**
 * @return the List of LRU prefixes defining precision exceptions
 */
list<string> getPrecisionExceptions() throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)

// addPrecisionExceptions: mark LRUs as precision exceptions
/**
 * @param 1 listLRUs : list of LRUs to add as precision exceptions
 */
void addPrecisionExceptions(1:list<string> listLRUs) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)

// removePrecisionExceptions: remove LRUs as precision exceptions
/**
 * @param 1 LRUs : list of LRUs to remove from precision exceptions
 */
void removePrecisionExceptions(1:list<string> listLRUs) throws (1:MemoryStructureException me, 2:ObjectNotFoundException x)


}
