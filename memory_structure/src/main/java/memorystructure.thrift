#
#   HCI memory structure - core interface
#
#
 

## Objects as structures

namespace java fr.sciencespo.medialab.hci.memorystructure.thrift

struct MetadataItem {
  1: string id,
  2: string name,
  3: bool multiple,
  4: string dataType,
  5: string defaultValue
}

struct LRUItem {
  1: string id,
  2: string url,
  3: string lru,
  4: string crawlerTimestamp,
  5: i32 httpStatusCode,
  6: i32 depth,
  7: string errorCode,
  8: bool isFullPrecision = false,
  9: bool isNode,
  10: bool isPage,
  11: bool isWebEntity,
  12: list<MetadataItem> metadataItems
}

struct NodeLink {
  1: string id,
  2: string sourceLRU,
  3: string targetLRU,
  4: i32 weight=1
}

struct WebEntityInfo {
  1: string id,
  2: string flagType,
  3: string lruPrefix,
  4: string regExp
}

# Services
 
service MemoryStructure {

// heikki: implementation of the new interface described on http://jiminy.medialab.sciences-po.fr/hci/index.php/Memory_structure_interface

// create_pages_cache
/**
 * @param 1 lruItems : list of LRUItem objects
 * @return id of the created cache
 */
string createCache(1:list<LRUItem> lruItems),

// index_pages_from_cache
/**
 * @param 1 cacheId : id of the cache
 * @return acknowledgement
 */
string indexCache(1:string cacheId),
 
 //get_precision_exceptions_from_cache
 /**
  * @param 1 cacheId : id of the cache
  * @return list of lru prefixes
  */
 list<string> getPrecisionExceptionsFromCache(1:string cacheId),
 
 // get_web_entities_flags_from_cache
 /**
  * @param 1 cacheId : id of the cache
  * @return list of WebEntityInfo
  */  
 list<WebEntityInfo> getWebEntitiesFromCache(1:string cacheId),
 
 // delete_page_cache
 /**
  * @param 1 cacheId : id of the cache
  * @return status
  */  
 i32 deleteCache(1:string cacheId),
 
 
 // heikki: does it mean the rest of the earlier interface below is no longer necessary ?
 
 
// LRUItems
/**
 *
 * @param 1 lruItems : list of LRUItem objects
 * @return true if success, false else
**/
bool storeLRUItems(1:list<LRUItem> lruItems),

// NodeLinks
/**
 *
 * @param 1 nodeLinks : list of NodeLink objects
 * @return true if success, false else
**/
bool storeNodeLinks(1:list<NodeLink> nodeLinks),

// WebEntity
/**
 *
 * @param 1 lruItem : the lruItem to be marked as WebEntity
 * @return true if success, false else
**/
bool storeWebEntity(1:LRUItem lruItem),

}