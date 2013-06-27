package fr.sciencespo.medialab.hci.memorystructure.thrift;

import fr.sciencespo.medialab.hci.memorystructure.cache.Cache;
import fr.sciencespo.medialab.hci.memorystructure.cache.CacheMap;
import fr.sciencespo.medialab.hci.memorystructure.cache.MaxCacheSizeException;
import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import fr.sciencespo.medialab.hci.memorystructure.util.ExceptionUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.thrift.TException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of MemoryStructure interface.
 *
 * @author heikki doeleman
 */
public class MemoryStructureImpl implements MemoryStructure.Iface {

    private static DynamicLogger logger = new DynamicLogger(MemoryStructureImpl.class);

    private LRUIndex lruIndex;

    public MemoryStructureImpl(String lucenePath, IndexWriterConfig.OpenMode openMode) {
        this.lruIndex = LRUIndex.getInstance(lucenePath, openMode);
    }

    /**
     * Clears (empties) the index.
     *
     * @throws TException hmm
     */
    @Override
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

    /**
     * Returns 'pong'.
     * @return 'pong'
     * @throws TException hmm
     */
    @Override
    public List<PingPong> ping() throws TException {
        logger.debug("ping");
        List<PingPong> pingpongset = new ArrayList<PingPong>();
        pingpongset.add(new PingPong("ping 1","pong 1"));
        pingpongset.add(new PingPong("ping 2","pong 2"));
        return pingpongset;
    }

    /**
     * Updates (or creates) a WebEntity .
     *
     * @param webEntity to update
     * @return id of indexed webentity
     * @throws MemoryStructureException hmm
     */
    @Override
    public String updateWebEntity(WebEntity webEntity) throws MemoryStructureException {
        logger.debug("updateWebEntity");
        try {
            if(webEntity == null) {
                throw new MemoryStructureException().setMsg("WebEntity is null");
            }
            return lruIndex.indexWebEntity(webEntity, false, true);
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Retrieves a WebEntity.
     *
     * @param id id of web entity
     * @return web entity
     * @throws ObjectNotFoundException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public WebEntity getWebEntity(String id) throws ObjectNotFoundException, MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntity with id: " + id);
        }
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
            if(found == null) {
                throw new ObjectNotFoundException().setMsg("Could not find WebEntity with id " + id);
            }
            return found;
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    /**
     * Returns all web entities thinner than a master web entity
     *
     * @param id id of web entity
     * @return web entities
     * @throws TException hmm
     */
    @Override
    public List<WebEntity> getSubWebEntities(String id) throws ObjectNotFoundException, MemoryStructureException, TException {
        logger.debug("getSubWebEntities");
        try {
            WebEntity WE = lruIndex.retrieveWebEntity(id);
            return lruIndex.findSubWebEntities(WE);
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    /**
     * Returns all web entities with LRU prefixes included into a child webentity's lru prefixes
     * 
     * @param id id of web entity
     * @return web entities
     * @throws TException hmm
     */
    @Override
    public List<WebEntity> getParentWebEntities(String id) throws ObjectNotFoundException, MemoryStructureException, TException {
        logger.debug("getParentWebEntities");
        try {
            WebEntity WE = lruIndex.retrieveWebEntity(id);
            return lruIndex.findParentWebEntities(WE);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    /**
     * Returns all web entities in the index.
     *
     * @return web entities
     * @throws TException hmm
     */
    @Override
    public List<WebEntity> getWebEntities() throws TException {
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
    
    /**
     * Returns web entities having ids in the given list.
     * @param list of webentities ids
     * @return web entities
     * @throws TException hmm
     */
    @Override
    public List<WebEntity> getWebEntitiesByIDs(List<String> listIDs) throws TException {
        logger.debug("getWebEntitiesByIDs");
        try {
            return lruIndex.retrieveWebEntitiesByIDs(listIDs);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    /**
     * Deletes a web entity.
     *
     * @param webEntity to delete
     * @throws TException hmm
     */
    @Override
    public void deleteWebEntity(WebEntity webEntity) throws TException {
        logger.debug("deleteWebEntity");
        try {
            lruIndex.deleteWebEntity(webEntity);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new TException(x.getMessage(), x);
        }
    }

    /**
     * Returns all web entity creation rules in the index.
     *
     * @return web entity creation rules
     * @throws TException hmm
     */
    @Override
    public List<WebEntityCreationRule> getWebEntityCreationRules() throws TException {
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

    /**
     * Deletes a web entity creation rule.
     *
     * @param webEntityCreationRule to delete
     * @throws TException hmm
     */
    @Override
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

    /**
     * Creates a cache containing pages.
     *
     * @param pageItems pages for this cache
     * @return id of cache
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public String createCache(List<PageItem> pageItems) throws TException, MemoryStructureException {
        if(pageItems != null && logger.isDebugEnabled()) {
            logger.debug("createCache for # " + pageItems.size() + " pageItems");
        }
        try {
            if(pageItems != null) {
                Cache cache = new Cache(lruIndex);
                cache.setPageItems(pageItems);
                CacheMap.getInstance().add(cache);
                if(logger.isDebugEnabled()) {
                    logger.debug("createCache created cache with id " + cache.getId());
                }
                return cache.getId();
            }
            else {
                logger.warn("createCache received null");
                throw new MemoryStructureException().setMsg("WARNING: createCache received null pageItems. No cache created.");
            }
        }
        catch(MaxCacheSizeException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    /**
     * Indexes pages and webentities from a cache.
     *
     * @param cacheId id of the cache
     * @return total number of documents indexed
     * @throws TException
     * @throws MemoryStructureException
     * @throws ObjectNotFoundException
     */
    @Override
    public int indexCache(String cacheId) throws TException, MemoryStructureException, ObjectNotFoundException {
        if(logger.isDebugEnabled()) {
            logger.debug("indexCache with cache id: " + cacheId);
        }
        try {
            Cache cache = CacheMap.getInstance().get(cacheId);
            if(cache == null) {
                ObjectNotFoundException onf =  new ObjectNotFoundException();
                onf.setMsg("Could not find cache with id: " + cacheId);
                onf.setStacktrace(ExceptionUtils.stacktrace2string(Thread.currentThread().getStackTrace()));
                throw onf;
            }
            @SuppressWarnings({"unchecked"})
            List pageItems = new ArrayList(cache.getPageItems());
            @SuppressWarnings({"unchecked"})
            int indexedPages = lruIndex.batchIndex(pageItems);

            if(logger.isDebugEnabled()) {
                logger.debug("indexCache finished indexing cache with id: " + cacheId);
            }
            return indexedPages;
        }
        catch(ObjectNotFoundException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw x;
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    /**
     * Retrieves pages belonging to a WebEntity.
     *
     * @param id web entity id
     * @return pages
     * @throws TException
     * @throws MemoryStructureException
     * @throws ObjectNotFoundException
     */
    @Override
    public List<PageItem> getPagesFromWebEntity(String id) throws TException, MemoryStructureException, ObjectNotFoundException {
        if(logger.isDebugEnabled()) {
            logger.debug("getPagesFromWebEntity with id: " + id);
        }
        List<PageItem> pages;
        try {
            pages = lruIndex.findPagesForWebEntity(id);
            if(logger.isDebugEnabled()) {
                logger.debug("found # " + pages.size() + " pages");
            }
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        return pages;
    }

    @Override
    public List<WebEntityLink> generateWebEntityLinks() throws MemoryStructureException, TException {
        logger.debug("generateWebEntityLinks");
        try {
            return lruIndex.generateWebEntityLinks();
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Returns all web entity links in the index.
     *
     * @return web entity links
     * @throws TException hmm
     */
    @Override
    public List<WebEntityLink> getWebEntityLinks() throws MemoryStructureException, TException {
        logger.debug("getWebEntityLinks");
        try {
            return lruIndex.retrieveWebEntityLinks();
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Returns all nodelinks in the index.
     *
     * @return nodelinks
     * @throws TException hmm
     */
    @Override
    public List<NodeLink> getNodeLinks() throws MemoryStructureException, TException {
        logger.debug("getNodeLinks");
        try {
            return lruIndex.retrieveNodeLinks();
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Returns all nodelinks within a webentity.
     *
     * @param webEntityId
     * @param includeFrontier
     * @return nodelinks
     * @throws TException hmm
     */
    @Override
    public List<NodeLink> getWebentityNodeLinks(String webEntityId, boolean includeFrontier) throws MemoryStructureException, TException {
        logger.debug("getWebentityNodeLinks");
        if (webEntityId == null) {
            return getNodeLinks();
        }
        try {
            return lruIndex.retrieveNodeLinksByWebentity(webEntityId, includeFrontier);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * @param lru to search for
     * @return web entity associated to this lru
     */
    @Override
    public WebEntity findWebEntityMatchingLRU(String lru) throws TException, MemoryStructureException {
        logger.debug("findWebEntityByLRU");
        try {
            WebEntity webentity = lruIndex.retrieveWebEntityMatchingLRU(lru);
            if(webentity == null) {
                throw new MemoryStructureException("No matching WebEntity found for lru " + lru, "", IndexException.class.getName());
            }
            return webentity;
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        finally {
            logger.debug("findWebEntityByPrefix end");
        }
    }


    /**
     * @param prefix prefix to search for
     * @return web entity whose aliases has this prefix
     */
    @Override
    public WebEntity findWebEntityByLRUPrefix(String prefix) throws TException, MemoryStructureException {
        logger.debug("findWebEntityByPrefix");
        try {
            WebEntity webentity = lruIndex.retrieveWebEntityByLRUPrefix(prefix);
            if(webentity == null) {
                throw new MemoryStructureException("No matching WebEntity found for prefix " + prefix, "", IndexException.class.getName());
            }
            return webentity;
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        finally {
            logger.debug("findWebEntityByPrefix end");
        }
    }

    /**
     * @param prefix prefix to search for
     * @return web entities one of whose aliases contains this prefix
     */
    @Override
    public List<WebEntity> findWebEntitiesByLRUPrefix(String prefix) throws TException, MemoryStructureException {
        logger.debug("findWebEntitiesByPrefix");
        try {
            return lruIndex.retrieveWebEntitiesStartingByLRUPrefix(prefix);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        finally {
            logger.debug("findWebEntitiesByPrefix end");
        }
    }

    /**
     * @param prefix prefix to search for
     * @return pageitems whose lru matches this prefix
     */
    @Override
    public List<PageItem> findPagesByPrefix(String prefix) throws TException, MemoryStructureException {
        logger.debug("findPagesByPrefix");
        try {
            return lruIndex.retrievePageItemsByLRUPrefix(prefix);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        finally {
            logger.debug("findPagesByPrefix end");
        }
    }

    /**
     * @param prefix prefix to search for
     * @return nodelinks whose source matches this prefix
     */
    @Override
    public List<NodeLink> findNodeLinksBySource(String prefix) throws TException, MemoryStructureException {
        logger.debug("findNodeLinksBySource");
        try {
            return lruIndex.retrieveNodeLinksBySourcePrefix(prefix);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        finally {
            logger.debug("findNodeLinksBySource end");
        }
    }

    /**
     * @param prefix prefix to search for
     * @return nodelinks whose target matches this prefix
     */
    @Override
    public List<NodeLink> findNodeLinksByTarget(String prefix) throws TException, MemoryStructureException {
        logger.debug("findNodeLinksByTarget");
        try {
            return lruIndex.retrieveNodeLinksByTargetPrefix(prefix);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        finally {
            logger.debug("findNodeLinksByTarget end");
        }
    }

    /**
     * @param id id of web entity
     * @return webentities whose source id are this
     */
    @Override
    public List<WebEntityLink> findWebEntityLinksBySource(String id) throws TException, MemoryStructureException {
        logger.debug("findWebEntityLinksBySource");
        try {
            return lruIndex.retrieveWebEntityLinksBySource(id);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        finally {
            logger.debug("findWebEntityLinksBySource end");
        }
    }

    /**
     * @param id id of web entity
     * @return webentities whose target id are this
     */
    @Override
    public List<WebEntityLink> findWebEntityLinksByTarget(String id) throws TException, MemoryStructureException {
        logger.debug("findWebEntityLinksByTarget");
        try {
            return lruIndex.retrieveWebEntityLinksByTarget(id);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        finally {
            logger.debug("findWebEntityLinksByTarget end");
        }
    }

    @Override
    public List<String> getPrecisionExceptions() throws TException, ObjectNotFoundException, MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getPrecisionExceptions");
        }
        try {
            // get precisionExceptions from index
            List<String> precisionExceptions = lruIndex.retrievePrecisionExceptions();
            return precisionExceptions;
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    @Override
    public void markPrecisionExceptions(List<String> listLRUs) throws MemoryStructureException, ObjectNotFoundException, TException {
        if(logger.isDebugEnabled()) {
            logger.debug("markPrecisionExceptions (" + listLRUs.size() +")");
        }
        try {
            lruIndex.addPrecisionExceptions(listLRUs);
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    @Override
    public void removePrecisionExceptions(List<String> listLRUs) throws MemoryStructureException, ObjectNotFoundException, TException {
        if(logger.isDebugEnabled()) {
            logger.debug("removePrecisionExceptions (" + listLRUs.size() +")");
        }
        try {
            lruIndex.deletePrecisionExceptions(listLRUs);
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Creates WebEntities for pages in a cache. Uses the following algorithm:
     *
     * for each page in the cache
     *     retrieve the most precise LRU prefix match from existing Web Entities + Web Entity Creation Rules
     *     if the most precise prefix is from a Web Entity, do nothing
     *     if the most precise prefix is from a Web Entity Creation Rule, apply that rule (may be the default rule)
     *
     * @param cacheId
     * @throws MemoryStructureException
     * @throws ObjectNotFoundException
     * @throws TException
     * @return Number of webentities created
     */
    @Override
    public int createWebEntities(String cacheId) throws MemoryStructureException, ObjectNotFoundException, TException {
        int newWebEntitiesCount = 0;
        try {
            if(logger.isDebugEnabled()) {
                logger.debug("createWebEntities with cache id: " + cacheId);
            }
            // obtain cache from cachemap
            CacheMap cacheMap = CacheMap.getInstance();
            Cache cache = cacheMap.get(cacheId);
            newWebEntitiesCount = cache.createWebEntities();
            if(logger.isDebugEnabled()) {
                logger.debug("# new web entities: " + newWebEntitiesCount);
            }
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        return newWebEntitiesCount;
    }

    /**
     * Deletes a cache.
     *
     * @param cacheId id of cache
     * @throws TException hmm
     * @throws ObjectNotFoundException hmm
     */
    @Override
    public void deleteCache(String cacheId) throws TException, ObjectNotFoundException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleteCache with cache id: " + cacheId);
        }
        CacheMap.getInstance().get(cacheId).clear();
        CacheMap.getInstance().remove(cacheId);
    }

    /**
     * Stores a web entity creation rule.
     *
     * @param webEntityCreationRule rule to store
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public void saveWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws TException, MemoryStructureException {
        logger.debug("saveWebEntityCreationRule");
        try{
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);
            if(logger.isDebugEnabled()) {
                logger.debug("saveWebEntityCreationRule finished indexing webEntityCreationRule: [" + webEntityCreationRule.getLRU() + ", " + webEntityCreationRule.getRegExp() + "]");
            }
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    @Override
    public void saveNodeLinks(List<NodeLink> nodeLinks) throws TException, MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("MemoryStructure saveNodeLinks() received # " + nodeLinks.size() + " NodeLinks");
        }
        try{
            @SuppressWarnings({"unchecked"})
            List<Object> nodeLinksList = new ArrayList(nodeLinks);
            lruIndex.batchIndex(nodeLinksList);
            logger.debug("saveNodeLinks finished indexing nodeLinks");
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    /**
     * Saves pageItems to index, bypassing cache.
     *
     * @param pageItems pages
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    // TODO TEST. IS METHOD NECESSARY? NORMAL IS : CREATE CACHE WITH PAGES AND INDEX CACHE
    @Override
    public void savePageItems(List<PageItem> pageItems) throws TException, MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("savePageItems for # " + pageItems.size() + " pageItems");
        }
        try {
            @SuppressWarnings({"unchecked"})
            List<Object> pageItemsList = new ArrayList(pageItems);
            lruIndex.batchIndex(pageItemsList);
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    /**
     * Removes all NodeLinks in index.
     *
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public void deleteNodeLinks() throws MemoryStructureException, TException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleteNodeLinks");
        }
        try {
            lruIndex.deleteNodeLinks();
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Shortcut method only to be used in unit tests, not part of MemoryStructure interface.
     * @return
     */
    public LRUIndex getLruIndex() {
        return this.lruIndex;
    }

    /**
     * Shuts down the LRUIndex.
     *
     * @throws TException hmm
     */
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
}
