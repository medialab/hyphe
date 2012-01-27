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

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Implementation of MemeoryStructure interface.
 *
 * @author heikki doeleman
 */
public class MemoryStructureImpl implements MemoryStructure.Iface {

    private static Logger logger = LoggerFactory.getLogger(MemoryStructureImpl.class);

    private LRUIndex lruIndex;

    public MemoryStructureImpl(String lucenePath, IndexWriterConfig.OpenMode openMode) {
        this.lruIndex = LRUIndex.getInstance(lucenePath, openMode);
    }

    public void clearIndex() throws TException {
        //logger.debug("clearIndex");
        try {
            lruIndex.clearIndex();
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }
    public void shutdown() throws TException {
        logger.info("shutting down");
        try {
            lruIndex.close();
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    /*
    @Override
    public String saveWebEntity(WebEntity webEntity) throws TException {
        logger.debug("saveWebEntity");
        try {
            if(webEntity == null) {
                throw new TException("WebEntity is null");
            }
            return lruIndex.indexWebEntity(webEntity);
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }
    */

    @Override
    public String ping() throws TException {
        return "pong";
    }

    @Override
    public String updateWebEntity(WebEntity webEntity) throws MemoryStructureException, TException {
        logger.debug("updateWebEntity");
        try {
            if(webEntity == null) {
                throw new TException("WebEntity is null");
            }
            return lruIndex.indexWebEntity(webEntity);
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    @Override
    public WebEntity createWebEntity(String name, Set<String> lruSet) throws MemoryStructureException, TException {
        logger.debug("createWebEntity");
        WebEntity webEntity = new WebEntity();
        webEntity.setName(name);
        webEntity.setLRUSet(lruSet);
        try {
            if(webEntity == null) {
                throw new TException("WebEntity is null");
            }
            String id = lruIndex.indexWebEntity(webEntity);
            webEntity.setId(id);
            return webEntity;
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
            WebEntity found = lruIndex.retrieveWebEntity(id);
            if(found != null && logger.isDebugEnabled()) {
                logger.debug("found webentity with id: " + found.getId());
                logger.debug("webentity has # " + found.getLRUSet().size() + " lrus");
            }
            return found;
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }


    // TODO: @Override
    public Set<WebEntity> getWebEntities() throws TException {
        logger.debug("getWebEntities");
        try {
            return lruIndex.retrieveWebEntities();
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    // TODO add to interface
    public Set<WebEntityCreationRule> getWebEntityCreationRules() throws TException {
        logger.debug("getWebEntityCreationRules");
        try {
            return lruIndex.retrieveWebEntityCreationRules();
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    // TODO add to interface
    public void deleteWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws TException {
        logger.debug("deleteWebEntityCreationRule");
        try {
            lruIndex.deleteWebEntityCreationRule(webEntityCreationRule);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    @Override
    public String createCache(Set<PageItem> pageItems) throws TException, MemoryStructureException {
        if(pageItems != null && logger.isDebugEnabled()) {
            logger.debug("createCache for # " + pageItems.size() + " pageItems");
        }
        try {
            if(pageItems != null) {
                Cache cache = new Cache();
                cache.setPageItems(pageItems);
                CacheMap.getInstance().add(cache);
                logger.debug("createCache created cache with id " + cache.getId());
                return cache.getId();
            }
            else {
                logger.warn("createCache received null");
                return "WARNING: createCache received null pageItems. No cache created.";
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
        logger.debug("indexCache with cache id: " + cacheId);
        try {
            Cache cache = CacheMap.getInstance().get(cacheId);
            if(cache == null) {
                ObjectNotFoundException onf =  new ObjectNotFoundException();
                onf.setMsg("Could not find cache with id: " + cacheId);
                onf.setStacktrace(ExceptionUtils.stacktrace2string(Thread.currentThread().getStackTrace()));
                throw onf;
            }
            List pageItems = new ArrayList(cache.getPageItems());
            int indexedItemsCount = lruIndex.batchIndex(pageItems);
            logger.debug("indexCache finished indexing cache with id: " + cacheId);
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
        logger.debug("getPrecisionExceptionsFromCache with cache id: " + cacheId);
        try {
            Set<String> results = new HashSet<String>();
            // get precisionExceptions from index
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
                logger.debug("getPrecisionExceptionsFromCache returns # " + results.size() + " results");
                return results;
            }
            else {
                ObjectNotFoundException onf =  new ObjectNotFoundException();
                onf.setMsg("Could not find cache with id: " + cacheId);
                onf.setStacktrace(ExceptionUtils.stacktrace2string(Thread.currentThread().getStackTrace()));
                throw onf;
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
        //TODO
    }

    @Override
    public void deleteCache(String cacheId) throws TException, ObjectNotFoundException {
        logger.debug("deleteCache with cache id: " + cacheId);
        Cache cache = CacheMap.getInstance().get(cacheId);
        if(cache == null) {
                ObjectNotFoundException onf =  new ObjectNotFoundException();
                onf.setMsg("Could not find cache with id: " + cacheId);
                onf.setStacktrace(ExceptionUtils.stacktrace2string(Thread.currentThread().getStackTrace()));
                throw onf;
        }
        CacheMap.getInstance().get(cacheId).clear();
        CacheMap.getInstance().remove(cacheId);
    }

    @Override
    public void markPageWithPrecisionException(String pageItemId) throws MemoryStructureException, ObjectNotFoundException, TException {
        //TODO
    }

    @Override
    public void saveWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws TException, MemoryStructureException {
        logger.debug("saveWebEntityCreationRule");
        try{
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);
            logger.debug("saveWebEntityCreationRule finished indexing webEntityCreationRule: [" + webEntityCreationRule.getLRU() + ", " + webEntityCreationRule.getRegExp() + "]");
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }

    }

    @Override
    public void saveNodeLinks(Set<NodeLink> nodeLinks) throws TException {
        logger.debug("MemoryStructure storeNodeLinks() received # " + nodeLinks.size() + " NodeLinks");
        // TODO
    }

    @Override
    public void addLRUtoWebEntity(String id, PageItem pageItem) throws MemoryStructureException, TException {
        logger.debug("addLRUtoWebEntity pageItem: " + pageItem.getLru() + " for WebEntity: " + id);
        try {
            lruIndex.indexWebEntity(id, pageItem);
            logger.debug("addLRUtoWebEntity finished indexing PageItem: " + pageItem.getLru() + " for WebEntity: " + id);
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    @Override
    public void savePageItems(Set<PageItem> pageItems) throws TException, MemoryStructureException {
        logger.debug("savePageItems for # " + pageItems.size() + " pageItems");
        try {
            List pageItemsList = new ArrayList(pageItems);
            lruIndex.batchIndex(pageItemsList);
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

}