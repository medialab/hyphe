package fr.sciencespo.medialab.hci.memorystructure.thrift;

import fr.sciencespo.medialab.hci.memorystructure.cache.Cache;
import fr.sciencespo.medialab.hci.memorystructure.cache.CacheMap;
import fr.sciencespo.medialab.hci.memorystructure.cache.MaxCacheSizeException;
import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import fr.sciencespo.medialab.hci.memorystructure.util.ExceptionUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.thrift.TException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 *
 * @author heikki doeleman
 */
public class MemoryStructureImpl implements MemoryStructure.Iface {

    private static Logger logger = LoggerFactory.getLogger(MemoryStructureImpl.class);

    private String lucenePath;

    public void setLucenePath(String lucenePath) {
        this.lucenePath = lucenePath;
    }

    @Override
    public String saveWebEntity(WebEntity webEntity) throws TException {
        logger.debug("saveWebEntity");
        try {
            if(webEntity == null) {
                throw new TException("WebEntity is null");
            }
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE);
            return lruIndex.indexWebEntity(webEntity);
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    @Override
    public WebEntity getWebEntity(String id) throws TException {
        logger.debug("getWebEntity with id: " + id);
        if(StringUtils.isEmpty(id)) {
            logger.debug("requested id is null, returning null");
            return null;
        }
        try {
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE);
            WebEntity found = lruIndex.retrieveWebEntity(id);
            if(found != null && logger.isDebugEnabled()) {
                logger.debug("found webentity with id: " + found.getId());
                logger.debug("webentity has # " + found.getLRUlist().size() + " lrus");
            }
            return found;
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }

    }

    @Override
    public Set<WebEntity> getWebEntities() throws TException {
        logger.debug("getWebEntities");
        try {
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE);
            return lruIndex.retrieveWebEntities();
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    @Override
    public String createCache(Set<PageItem> pageItems) throws TException, MemoryStructureException {
        try {
        if(pageItems != null) {
            logger.debug("MemoryStructure createCache() received " + pageItems.size() + " LRUItems");
            Cache cache = new Cache();
            cache.setPageItems(pageItems);
            CacheMap.getInstance().add(cache);
            logger.debug("MemoryStructure createCache() created cache with id " + cache.getId());
            return cache.getId();
        }
        else {
            logger.warn("MemoryStructure createCache() received null");
            return "WARNING: MemoryStructure createCache() received null. No cache created.";
        }
        }
        catch(MaxCacheSizeException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    @Override
    public int indexCache(String cacheId) throws TException, MemoryStructureException, ObjectNotFoundException {
        logger.debug("MemoryStructure indexCache() received id: " + cacheId);
        try {
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE);
            Cache cache = CacheMap.getInstance().get(cacheId);
            if(cache == null) {
                throw new ObjectNotFoundException("Could not find cache with id: " + cacheId, ExceptionUtils.stacktrace2string(Thread.currentThread().getStackTrace()));
            }
            List pageItems = new ArrayList(cache.getPageItems());
            int indexedItemsCount = lruIndex.batchIndex(pageItems);
            logger.debug("MemoryStructure indexCache() finished indexing cache with id: " + cacheId);
            return indexedItemsCount;
        }
        catch(ObjectNotFoundException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw x;
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    @Override
    public Set<String> getPrecisionExceptionsFromCache(String cacheId) throws TException, ObjectNotFoundException, MemoryStructureException {
        try {
            logger.debug("MemoryStructure getPrecisionExceptionsFromCache() received id: " + cacheId);
            Set<String> results = new HashSet<String>();
            // get precisionExceptions from index
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.APPEND);
            List<String> precisionExceptions = lruIndex.retrievePrecisionExceptions();

            Cache cache = CacheMap.getInstance().get(cacheId);
            if(cache != null) {
                for(PageItem pageItem : cache.getPageItems()) {
                    if(!pageItem.isNode) {
                        if(precisionExceptions.contains(pageItem.getLru())) {
                            results.add(pageItem.getLru());
                        }
                    }
                }
                logger.debug("MemoryStructure getPrecisionExceptionsFromCache() returns # " + results.size() + " results");
                return results;
            }
            else {
                throw new ObjectNotFoundException("Could not find cache with id: " + cacheId, ExceptionUtils.stacktrace2string(Thread.currentThread().getStackTrace()));
            }
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    @Override
    public void createWebEntities(String cacheId) throws MemoryStructureException, ObjectNotFoundException, TException {
        //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public void deleteCache(String cacheId) throws TException, ObjectNotFoundException {
        logger.debug("MemoryStructure deleteCache() received id: " + cacheId);
        Cache cache = CacheMap.getInstance().get(cacheId);
        if(cache == null) {
            throw new ObjectNotFoundException("Could not find cache with id: " + cacheId, ExceptionUtils.stacktrace2string(Thread.currentThread().getStackTrace()));
        }
        CacheMap.getInstance().get(cacheId).clear();
        CacheMap.getInstance().remove(cacheId);
    }

    @Override
    public void markPageWithPrecisionException(String pageItemId) throws MemoryStructureException, ObjectNotFoundException, TException {
        //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public void saveWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws TException, MemoryStructureException {
        try{
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE_OR_APPEND);
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);
            logger.debug("MemoryStructure indexWebEntityCreationRule() finished indexing webEntityCreationRule: [" + webEntityCreationRule.getLRU() + ", " + webEntityCreationRule.getRegExp() + "]");
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }

    }

    @Override
    public void saveNodeLinks(List<NodeLink> nodeLinks) throws TException {
        logger.debug("MemoryStructure storeNodeLinks() received # " + nodeLinks.size() + " NodeLinks");
    }

    @Override
    public void addLRUtoWebEntity(String id, PageItem pageItem) throws MemoryStructureException, TException {
        logger.debug("MemoryStructure storeWebEntity() received LRUItem: " + pageItem.getLru() + " for WebEntity: " + id);
        try {
            LRUIndex lruIndex = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE_OR_APPEND);
            lruIndex.indexWebEntity(id, pageItem);
            logger.debug("MemoryStructure storeWebEntity() finished indexing LRUItem: " + pageItem.getLru() + " for WebEntity: " + id);
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    @Override
    public void savePageItems(Set<PageItem> pageItems) throws TException, MemoryStructureException {
        logger.info("saveLRUItems invocation");
        try {
            logger.debug("MemoryStructure saveLRUItems() received # " + pageItems.size() + " PageItems");
            LRUIndex index = LRUIndex.getInstance(lucenePath, IndexWriterConfig.OpenMode.CREATE);
            List pageItemsList = new ArrayList(pageItems);
            index.batchIndex(pageItemsList);
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

}