package fr.sciencespo.medialab.hci.memorystructure.thrift;

import fr.sciencespo.medialab.hci.memorystructure.cache.Cache;
import fr.sciencespo.medialab.hci.memorystructure.cache.CacheMap;
import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.thrift.TException;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author heikki doeleman
 */
public class MemoryStructureImpl implements MemoryStructure.Iface {

    private String lucenePath;

    public void setLucenePath(String lucenePath) {
        this.lucenePath = lucenePath;
    }

    @Override
    public String createCache(List<LRUItem> lruItems) throws TException {
        if(lruItems != null) {
            System.out.println("MemoryStructure createCache() received " + lruItems.size() + " LRUItems");
            Cache cache = new Cache();
            cache.setLruItems(lruItems);
            CacheMap.getInstance().add(cache);
            System.out.println("MemoryStructure createCache() created cache with id " + cache.getId());
            return cache.getId();
        }
        else {
            System.out.println("WARNING: MemoryStructure createCache() received null");
            return "WARNING: MemoryStructure createCache() received null";
        }
    }

    @Override
    public String indexCache(String cacheId) throws TException {
        System.out.println("MemoryStructure indexCache() received id: " + cacheId);
        try {
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE);
            Cache cache = CacheMap.getInstance().get(cacheId);
            if(cache == null) {
                throw new Exception("Could not find cache with id: " + cacheId);
            }
            lruIndex.batchIndex(cache.getLruItems());
            System.out.println("MemoryStructure indexCache() finished indexing cache with id: " + cacheId);
            // TODO what acknowledgement to return ?
            return "ack";
        }
        catch(Exception x) {
            System.out.println("ERROR: " + x.getMessage());
            x.printStackTrace();
            // TODO what acknowledgement to return ?
            return "ERROR: " + x.getMessage();
        }
    }

    /**
     * extract the page (and not the nodes) from the cache. For each page, the memory structure will look for precision
     * exceptions in the LRU_item index :
     *
     * precision_limit_lru_prefixes=Array()
     * for lru of included_pages which are not node (is_node==false):
     *    look for precision_limit exception on the LRU branch
     *    if found one :
     *       precision_limit_lru_prefixes.append( lru_prefix_of_precision_limit_node)
     * return precision_limit_lru_prefixes
     *
     *
     * @param cacheId
     * @return
     * @throws TException
     */
    @Override
    public List<String> getPrecisionExceptionsFromCache(String cacheId) throws TException {
        try {
            System.out.println("MemoryStructure getPrecisionExceptionsFromCache() received id: " + cacheId);
            List<String> results = new ArrayList<String>();
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.APPEND);
            List<String> precisionExceptions = lruIndex.retrievePrecisionExceptions();
            Cache cache = CacheMap.getInstance().get(cacheId);
            for(LRUItem lruItem : cache.getLruItems()) {
                if(!lruItem.isNode) {
                    if(precisionExceptions.contains(lruItem.getLru())) {
                        results.add(lruItem.getLru());
                    }
                }
            }
            System.out.println("MemoryStructure getPrecisionExceptionsFromCache() returns # " + results.size() + " results");
            return results;
        }
        catch(IndexException x) {
            // TODO what to do
            return null;
        }
    }

    /**
     *
     * This function will be used by the core to make sure the correct web entity exists to hold this page regarding the
     * web entities creation rules
     *
     * The flags are :
     *    web entity creation rule : this flag indicates that a web entity creation rule is to be tested when inserting
     *                               new LRU sharing the LRU_prefix of the flag.
     *    no web entity found      : this flag has to be created by the memory strucutre when there were no Web entity
     *                               neither web entity creation rules on a LRU to be inserted.
     *
     *  To retrieve web entities flags the memory structure should behave as described below :
     *
     *
     *  for page in included_pages
     *     retrieve the first flag on the page.lru branch which is web_entity or web_entity_creation_rule (i.e. the
     *             longuest (in term of number of stem) lru_prefixe)
     *     if flag == web_entity :
     *        don't do nothing
     *     else if flag == web_entity_creation_rule :
     *        add_flag(flag="web_entity_creation_rule",lru_prefixe_of_flag,web_entity_creation_rule_flag)
     *     else if no flag found :
     *        add_flag(flag="no_web_entity",page.lru,Null)
     *
     *
     * @param cacheId
     * @return
     * @throws TException
     */
    @Override
    public List<WebEntityInfo> getWebEntitiesFromCache(String cacheId) throws TException {
        System.out.println("MemoryStructure getWebEntitiesFromCache() received id: " + cacheId);
        return null;
    }

    @Override
    public int deleteCache(String cacheId) throws TException {
        System.out.println("MemoryStructure deleteCache() received id: " + cacheId);
        try {
            Cache cache = CacheMap.getInstance().get(cacheId);
            if(cache == null) {
                throw new Exception("Could not find cache with id: " + cacheId);
            }
            CacheMap.getInstance().get(cacheId).clear();
            CacheMap.getInstance().remove(cacheId);
            // TODO what status to return ?
            return 0;
        }
        catch(Exception x) {
            System.out.println("ERROR: " + x.getMessage());
            x.printStackTrace();
            // TODO what status to return ?
            return -1;
        }
    }

    @Override
    public int setPrecisionException(String precisionException) throws TException {
        System.out.println("MemoryStructure setPrecisionException() received precision exception LRU: " + precisionException);
        try {
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE_OR_APPEND);
            lruIndex.indexPrecisionException(precisionException);
            System.out.println("MemoryStructure indexCache() finished indexing precision exception LRU: " + precisionException);
            // TODO what status to return ?
            return 0;
        }
        catch(Exception x) {
            System.out.println("ERROR: " + x.getMessage());
            x.printStackTrace();
            // TODO what status to return ?
            return -1;
        }
    }


    //
    // below old API, no longer necessary (?)
    //

    @Override
    public boolean storeNodeLinks(List<NodeLink> nodeLinks) throws TException {
        System.out.println("MemoryStructure storeNodeLinks() received # " + nodeLinks.size() + " NodeLinks");
        return true;
    }

    @Override
    public boolean storeWebEntity(LRUItem lruItem) throws TException {
        System.out.println("MemoryStructure storeWebEntity() received LRUItem " + lruItem.getLru());
        return false;
    }

    @Override
    public boolean storeLRUItems(List<LRUItem> lruItems) throws TException {
        try {
            System.out.println("MemoryStructure storeLRUItems() received # " + lruItems.size() + " LRUItems");
            LRUIndex index = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE);
            index.batchIndex(lruItems);
            return true;
        }
        catch(Exception x) {
            System.out.println(x.getMessage());
            x.printStackTrace();
            return false;
        }
    }

}
