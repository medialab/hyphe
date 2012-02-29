package fr.sciencespo.medialab.hci.memorystructure.thrift;

import fr.sciencespo.medialab.hci.memorystructure.cache.Cache;
import fr.sciencespo.medialab.hci.memorystructure.cache.CacheMap;
import fr.sciencespo.medialab.hci.memorystructure.cache.MaxCacheSizeException;
import fr.sciencespo.medialab.hci.memorystructure.gexf.GEXFWriter;
import fr.sciencespo.medialab.hci.memorystructure.gexf.GEXFWriterException;
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
 * Implementation of MemoryStructure interface.
 *
 * @author heikki doeleman
 */
public class MemoryStructureImpl implements MemoryStructure.Iface {

    private static Logger logger = LoggerFactory.getLogger(MemoryStructureImpl.class);

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
     * Updates a WebEntity.
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
            return lruIndex.indexWebEntity(webEntity);
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Creates a WebEntity.
     *
     * @param name name of web entity
     * @param lruSet lrus for this web entity
     * @return created web entity
     * @throws MemoryStructureException hmm
     */
    @Override
    public WebEntity createWebEntity(String name, Set<String> lruSet) throws MemoryStructureException {
        logger.debug("createWebEntity");
        WebEntity webEntity = new WebEntity();
        webEntity.setName(name);
        webEntity.setLRUSet(lruSet);
        try {
            String id = lruIndex.indexWebEntity(webEntity);
            webEntity.setId(id);
            return webEntity;
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
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
     * Returns all web entities in the index.
     *
     * @return web entities
     * @throws TException hmm
     */
    @Override
    public List<WebEntity> getWebEntities() throws TException {
        logger.debug("getWebEntities");
        try {
            List<WebEntity> webEntities = new ArrayList<WebEntity>(lruIndex.retrieveWebEntities());
            return webEntities;
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
            List<WebEntityCreationRule> results= new ArrayList<WebEntityCreationRule>(lruIndex.retrieveWebEntityCreationRules());
            return (results);
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
                logger.debug("createCache created cache with id " + cache.getId());
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
        logger.debug("indexCache with cache id: " + cacheId);
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

            logger.debug("indexCache finished indexing cache with id: " + cacheId);
            return indexedPages;
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
        logger.debug("getPagesFromWebEntity with id: " + id);
        List<PageItem> pages;
        try {
            pages = lruIndex.findPagesForWebEntity(id);
            logger.debug("found # " + pages.size() + " pages");
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        return pages;
    }

    @Override
    public void generateWebEntityLinks() throws MemoryStructureException, TException {
        logger.debug("generateWebEntityLinks");
        try {
            lruIndex.generateWebEntityLinks();
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Retrieves representation of whole WebEntity network in gexf.
     *
     * @param format must be 'gexf'
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public String getWebEntityNetwork(String format) throws TException, MemoryStructureException {
        logger.debug("getWebEntityNetwork");
        if(StringUtils.isNotEmpty(format) && !format.equals("gexf")) {
            throw new MemoryStructureException().setMsg("Unsupported requested WebEntityNetwork format: " + format + ". This program supports only gexf.");
        }
        try {
            return GEXFWriter.writeGEXF();
        }
        catch (GEXFWriterException x) {
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), GEXFWriterException.class.getName());
        }
    }

    /**
     * Retrieves representation of a WebEntity and its neighboors (at a given distance) in gexf.
     *
     * @param webEntityId web entity id
     * @param distance distance
     * @param format must be 'gexf'
     * @throws TException hmm
     * @throws ObjectNotFoundException if web entity is not found
     * @throws MemoryStructureException hmm
     */
    @Override
    public String getWebEntityEgoNetwork(String webEntityId, int distance, String format) throws TException, ObjectNotFoundException, MemoryStructureException  {
        logger.debug("getWebEntityEgoNetwork for WebEntity " + webEntityId + " with distance " + distance);
        if(StringUtils.isNotEmpty(format) && !format.equals("gexf")) {
            throw new MemoryStructureException().setMsg("Unsupported requested WebEntityNetwork format: " + format + ". This program supports only gexf.");
        }
        // TODO
        return "";
    }

    // TODO TEST
    @Override
    public List<String> getPrecisionExceptionsFromCache(String cacheId) throws TException, ObjectNotFoundException, MemoryStructureException {
        logger.debug("getPrecisionExceptionsFromCache with cache id: " + cacheId);
        try {
            List<String> results = new ArrayList<String>();
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
     */
    @Override
    public void createWebEntities(String cacheId) throws MemoryStructureException, ObjectNotFoundException, TException {
        try {
            logger.debug("createWebEntities with cache id: " + cacheId);
            // obtain cache from cachemap
            CacheMap cacheMap = CacheMap.getInstance();
            Cache cache = cacheMap.get(cacheId);
            int newWebEntitiesCount = cache.createWebEntities();
            logger.debug("# new web entities: " + newWebEntitiesCount);
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
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
        logger.debug("deleteCache with cache id: " + cacheId);
        CacheMap.getInstance().get(cacheId).clear();
        CacheMap.getInstance().remove(cacheId);
    }

    @Override
    public void markPageWithPrecisionException(String pageItemId) throws MemoryStructureException, ObjectNotFoundException, TException {
        //TODO
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
            logger.debug("saveWebEntityCreationRule finished indexing webEntityCreationRule: [" + webEntityCreationRule.getLRU() + ", " + webEntityCreationRule.getRegExp() + "]");
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    @Override
    public void saveNodeLinks(List<NodeLink> nodeLinks) throws TException, MemoryStructureException {
        logger.debug("MemoryStructure saveNodeLinks() received # " + nodeLinks.size() + " NodeLinks");
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

    @Override
    public void addAliastoWebEntity(String id, String lru) throws MemoryStructureException, ObjectNotFoundException, TException {
        logger.debug("addAliastoWebEntity lru: " + lru + " for WebEntity: " + id);
        try {
            lruIndex.indexWebEntity(id, lru);
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
        logger.debug("savePageItems for # " + pageItems.size() + " pageItems");
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