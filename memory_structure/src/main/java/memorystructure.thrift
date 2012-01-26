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
  10: map<string, list<string>> metadataItems
}

struct NodeLink {
  1: string id,
  2: string sourceLRU,
  3: string targetLRU,
  4: i32 weight=1
}

/**
 *
 */
struct WebEntity {
  1: string id,
  2: list<string> LRUlist,
  3: string name
}

struct WebEntityCreationRule {
  1: string regExp,
  2: string LRU
}

# Services
 
service MemoryStructure {

 // store webentity
 /**
  * @param 1 webEntity
  * @return id of the web entity
  */
  string saveWebEntity(1:WebEntity webEntity) throws (1:MemoryStructureException x),

// create_pages_cache
/**
 * @param 1 pageItems : list of PageItem objects
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
  * @return list of lru prefixes
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
  * @param 1 webEntityCreationRule : webentity creation rule to store
  */
void saveWebEntityCreationRule(1:WebEntityCreationRule webEntityCreationRule) throws (1:MemoryStructureException me),
 
// PageItems
/**
 *
 * @param 1 pageItems : list of PageItem objects
 */
void savePageItems(1:list<PageItem> pageItems) throws (1:MemoryStructureException me),

// NodeLinks
/**
 *
 * @param 1 nodeLinks : list of NodeLink objects
 */
void saveNodeLinks(1:list<NodeLink> nodeLinks) throws (1:MemoryStructureException me),

// WebEntity
/**
 *
 * @param 1 id : the id of the WebEntity to add this LRU to
 * @param 2 lruItem : the lruItem to be marked as WebEntity
**/
void addLRUtoWebEntity(1:string id, 2:PageItem pageItem) throws (1:MemoryStructureException me),

}