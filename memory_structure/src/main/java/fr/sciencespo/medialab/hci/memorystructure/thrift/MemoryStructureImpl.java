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
import java.util.Map;

/**
 * Implementation of MemoryStructure interface.
 *
 * @author heikki doeleman, benjamin ooghe-tabanou
 */
public class MemoryStructureImpl implements MemoryStructure.Iface {

    private static DynamicLogger logger = new DynamicLogger(MemoryStructureImpl.class);

    private LRUIndex lruIndex;

    public MemoryStructureImpl(String lucenePath, IndexWriterConfig.OpenMode openMode) {
        this.lruIndex = LRUIndex.getInstance(lucenePath, openMode);
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
    public void shutdown() throws MemoryStructureException {
        logger.info("shutting down");
        try {
            lruIndex.close();
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IOException.class.getName());
        } finally {
            logger.info("closed");
        }
    }


    // -- THRIFT API METHODS


    /**
     * Returns 'pong'.
     *
     * @return 'pong'
     * @throws TException hmm
     */
    @Override
    public List<PingPong> ping() {
        if(logger.isDebugEnabled()) {
            logger.debug("ping");
        }
        List<PingPong> pingpongset = new ArrayList<PingPong>();
        pingpongset.add(new PingPong("ping 1","pong 1"));
        pingpongset.add(new PingPong("ping 2","pong 2"));
        return pingpongset;
    }

    /**
     * Clears (empties) the index.
     *
     * @throws TException hmm
     */
    @Override
    public void clearIndex() throws MemoryStructureException {
        if (logger.isDebugEnabled()) {
            logger.debug("clearIndex");
        }
        try {
            lruIndex.clearIndex();
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }


    // -- PAGEITEMS


    /**
     * Creates a cache containing pages to be indexed.
     *
     * @param pageItems pages for this cache
     * @return id of cache
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public String createCache(List<PageItem> pageItems) throws MemoryStructureException {
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
            } else {
                logger.warn("createCache received null");
                throw new MemoryStructureException().setMsg("WARNING: createCache received null pageItems. No cache created.");
            }
        } catch(MaxCacheSizeException x) {
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
    public int indexCache(String cacheId) throws MemoryStructureException {
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
        } catch(ObjectNotFoundException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), ObjectNotFoundException.class.getName());
        } catch(IndexException x) {
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
    public int createWebEntitiesFromCache(String cacheId) throws MemoryStructureException {
        int newWebEntitiesCount = 0;
        try {
            if(logger.isDebugEnabled()) {
                logger.debug("createWebEntitiesFromCache with cache id: " + cacheId);
            }
            // obtain cache from cachemap
            CacheMap cacheMap = CacheMap.getInstance();
            Cache cache = cacheMap.get(cacheId);
            newWebEntitiesCount = cache.createWebEntities();
            if(logger.isDebugEnabled()) {
                logger.debug("# new web entities: " + newWebEntitiesCount);
            }
        } catch(ObjectNotFoundException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), ObjectNotFoundException.class.getName());
        } catch (IndexException x) {
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
    public void deleteCache(String cacheId) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleteCache with cache id: " + cacheId);
        }
        try {
            CacheMap.getInstance().get(cacheId).clear();
            CacheMap.getInstance().remove(cacheId);
        }
        catch(ObjectNotFoundException x) {
	        logger.error(x.getMessage());
	        x.printStackTrace();
	        throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), ObjectNotFoundException.class.getName());
        }
    }

    /**
     * Saves pageItems to index, bypassing cache.
     * This should not be used for most of the cases since it will not trigger the creation of corresponding webentities
     *
     * @param pageItems pages
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public void savePageItems(List<PageItem> pageItems) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("savePageItems for # " + pageItems.size() + " pageItems");
        }
        try {
            @SuppressWarnings({"unchecked"})
            List<Object> pageItemsList = new ArrayList(pageItems);
            lruIndex.batchIndex(pageItemsList);
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Search PageItems whose LRU starts with a LRUPrefix
     *
     * @return a List of PageItems whose lru matches this prefix
     */
    @Override
    public List<PageItem> findPageItemsMatchingLRUPrefix(String prefix) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("findPageItemsMatchingLRUPrefix");
        }
        try {
            return lruIndex.retrievePageItemsByLRUPrefix(prefix);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("findPageItemsMatchingLRUPrefix end");
            }
        }
    }

    /**
     * Reindex PageItems matching a LRU prefix in order to retro-apply a new creation rule
     *
     * @return the total of new webentities created
     */
    @Override
    public int reindexPageItemsMatchingLRUPrefix(String prefix) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("findPageItemsMatchingLRUPrefix");
        }
        try {
        	return lruIndex.reindexPageItemsMatchingLRUPrefix(prefix);
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IOException.class.getName());
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("findPageItemsMatchingLRUPrefix end");
            }
        }
    }

    /**
     * Returns theoretical LRUPrefix for a LRUPage according to WebEntity CreationRules.
     *
     * @return LRUPrefix
     * @throws TException hmm
     * @throws MemoryStructureException 
     */
    @Override
    public String getPrefixForLRU(String pageLRU) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getPrefixForLRU");
        }
        try {
            return lruIndex.findWERulePrefixForPageUrl(pageLRU);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }


    // -- NODELINKS


    /**
     * Returns all NodeLinks in the index.
     *
     * @return nodelinks
     * @throws TException hmm
     */
    @Override
    public List<NodeLink> getNodeLinks() throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getNodeLinks");
        }
        try {
            return lruIndex.retrieveNodeLinks();
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Removes all NodeLinks in index.
     *
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public void deleteNodeLinks() throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleteNodeLinks");
        }
        try {
            lruIndex.deleteNodeLinks();
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Store a set of NodeLinks in index.
     *
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public void saveNodeLinks(List<NodeLink> nodeLinks) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("MemoryStructure saveNodeLinks() received # " + nodeLinks.size() + " NodeLinks");
        }
        try{
            @SuppressWarnings({"unchecked"})
            List<Object> nodeLinksList = new ArrayList(nodeLinks);
            lruIndex.batchIndex(nodeLinksList);
            if(logger.isDebugEnabled()) {
                logger.debug("saveNodeLinks finished indexing nodeLinks");
            }
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Returns all NodeLinks whose Source LRU matches the LRU prefix
     *
     * @param prefix prefix to search for
     * @return nodelinks whose source matches this prefix
     */
    @Override
    public List<NodeLink> findNodeLinksMatchingSourceLRUPrefix(String prefix) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("findNodeLinksMatchingSourceLRUPrefix");
        }
        try {
            return lruIndex.retrieveNodeLinksBySourcePrefix(prefix);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("findNodeLinksMatchingSourceLRUPrefix end");
            }
        }
    }

    /**
     * Returns all NodeLinks whose Target LRU matches the LRU prefix
     *
     * @param prefix prefix to search for
     * @return nodelinks whose target matches this prefix
     */
    @Override
    public List<NodeLink> findNodeLinksMatchingTargetLRUPrefix(String prefix) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("findNodeLinksMatchingTargetLRUPrefix");
        }
        try {
            return lruIndex.retrieveNodeLinksByTargetPrefix(prefix);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("findNodeLinksMatchingTargetLRUPrefix end");
            }
        }
    }


    // -- WEBENTITIES


    /**
     * Returns all web entities in the index.
     *
     * @return web entities
     * @throws TException hmm
     */
    @Override
    public List<WebEntity> getWebEntities() throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntities");
        }
        try {
            return lruIndex.retrieveWebEntities();
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Returns web entities having ids in the given list.
     * @param list of webentities ids
     * @return web entities
     * @throws TException hmm
     */
    @Override
    public List<WebEntity> getWebEntitiesByIDs(List<String> listIDs) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntitiesByIDs");
        }
        try {
            return lruIndex.retrieveWebEntitiesByIDs(listIDs);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Retrieves a WebEntity. by its id
     *
     * @param id of web entity
     * @return web entity
     * @throws ObjectNotFoundException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public WebEntity getWebEntity(String id) throws MemoryStructureException {
        if(StringUtils.isEmpty(id)) {
            return null;
        }
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntity with id: " + id);
        }
        try {
            WebEntity found = lruIndex.retrieveWebEntity(id);
            if(found == null) {
                throw new MemoryStructureException("Could not find WebEntity with id " + id, null, ObjectNotFoundException.class.getName());
            } else if (logger.isDebugEnabled()) {
                logger.debug("found webentity with id: " + found.getId());
                logger.debug("webentity has # " + found.getLRUSet().size() + " lrus");
            }
            return found;
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
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
        if(logger.isDebugEnabled()) {
            logger.debug("updateWebEntity");
        }
        try {
            if(webEntity == null) {
                throw new MemoryStructureException().setMsg("WebEntity is null");
            }
            return lruIndex.indexWebEntity(webEntity, false, true);
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Deletes a web entity.
     *
     * @param webEntity to delete
     * @throws TException hmm
     */
    @Override
    public void deleteWebEntity(WebEntity webEntity) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleteWebEntity");
        }
        try {
            lruIndex.deleteWebEntity(webEntity);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
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
    public List<WebEntity> getWebEntitySubWebEntities(String id) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntitySubWebEntities");
        }
        try {
            WebEntity WE = lruIndex.retrieveWebEntity(id);
            return lruIndex.retrieveWebEntitySubWebEntities(WE);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Returns all web entities with LRU prefixes included into a child webentity's lru prefixes
     *
     * @param id of web entity
     * @return web entities
     * @throws TException hmm
     */
    @Override
    public List<WebEntity> getWebEntityParentWebEntities(String id) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntityParentWebEntities");
        }
        try {
            WebEntity WE = lruIndex.retrieveWebEntity(id);
            return lruIndex.retrieveWebEntityParentWebEntities(WE);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
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
    public List<PageItem> getWebEntityPages(String id) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntityPages with id: " + id);
        }
        List<PageItem> pages;
        try {
            pages = lruIndex.retrieveWebEntityPageItems(id, false);
            if(logger.isDebugEnabled()) {
                logger.debug("found # " + pages.size() + " pages");
            }
        }
        catch(ObjectNotFoundException x) {
	        logger.error(x.getMessage());
	        x.printStackTrace();
	        throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), ObjectNotFoundException.class.getName());
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        return pages;
    }

    /**
     * Retrieves crawled pages belonging to a WebEntity.
     *
     * @param id web entity id
     * @return pages
     * @throws TException
     * @throws MemoryStructureException
     * @throws ObjectNotFoundException
     */
    @Override
    public List<PageItem> getWebEntityCrawledPages(String id) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getCrawledWebEntityPages with id: " + id);
        }
        List<PageItem> pages;
        try {
            pages = lruIndex.retrieveWebEntityPageItems(id, true);
            if(logger.isDebugEnabled()) {
                logger.debug("found # " + pages.size() + " pages");
            }
        } catch(ObjectNotFoundException x) {
	        logger.error(x.getMessage());
	        x.printStackTrace();
	        throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), ObjectNotFoundException.class.getName());
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
        return pages;
    }

    /**
     * Returns all nodelinks within a webentity or all NodeLinks if null given as webEntityId.
     *
     * @param webEntityId
     * @param includeFrontier
     * @return nodelinks
     * @throws TException hmm
     */
    @Override
    public List<NodeLink> getWebentityNodeLinks(String webEntityId, boolean includeFrontier) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebentityNodeLinks");
        }
        if (webEntityId == null) {
            return getNodeLinks();
        }
        try {
            return lruIndex.retrieveWebEntityNodeLinks(webEntityId, includeFrontier);
        } catch(ObjectNotFoundException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
	        throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), ObjectNotFoundException.class.getName());
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Find the WebEntity which has LRU within its list of prefixes
     *
     * @param prefix prefix to search for
     * @return web entity whose aliases has this prefix
     */
    @Override
    public WebEntity getWebEntityByLRUPrefix(String prefix) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntityByLRUPrefix");
        }
        try {
            WebEntity webentity = lruIndex.retrieveWebEntityByLRUPrefix(prefix);
            if(webentity == null) {
                throw new MemoryStructureException("No WebEntity found for prefix " + prefix, "", IndexException.class.getName());
            }
            return webentity;
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("getWebEntityByLRUPrefix end");
            }
        }
    }

    /**
     * Search which WebEntity matches a LRU (meaning it matches one of its prefixes but none of the entity's subwebentities)
     *
     * @param lru to search for
     * @return web entity associated to this lru
     */
    @Override
    public WebEntity findWebEntityMatchingLRUPrefix(String lru) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("findWebEntityMatchingLRUPrefix");
        }
        try {
            WebEntity webentity = lruIndex.retrieveWebEntityMatchingLRU(lru);
            if(webentity == null) {
                throw new MemoryStructureException("No matching WebEntity found for lru " + lru, "", IndexException.class.getName());
            }
            return webentity;
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("findWebEntityMatchingLRUPrefix end");
            }
        }
    }

    /**
     * Perform free Lucene search upon the webentities stored in the index
     *
     * @param allFieldsKeywords List of keywords to search against the main text fields of the webentities
     * @param fieldKeywords
     * @return web entity associated to this lru
     */
    @Override
    public List<WebEntity> searchWebEntities(List<String> allFieldsKeywords, List<List<String>> fieldKeywords) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("searchWebEntities");
        }
        try {
            return lruIndex.retrieveWebEntitiesBySearchKeywords(allFieldsKeywords, fieldKeywords);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("searchWebEntities end");
            }
        }
    }

    /**
     * Get all tags describing the webentities as a map of namespace:key:value
     *
     * @return a Map by Namespaces of Maps by Categories of all Tag values stored in the index's WebEntities metadataItems
     */
    @Override
    public Map<String, Map<String, List<String>>> getTags() throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getTagNamespaces");
        }
        try {
            return lruIndex.retrieveWebEntitiesTags();
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("getTagNamespaces end");
            }
        }
    }


    // -- WEBENTITYLINKS


    /**
     * Returns all web entity links in the index.
     *
     * @return web entity links
     * @throws TException hmm
     */
    @Override
    public List<WebEntityLink> getWebEntityLinks() throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntityLinks");
        }
        try {
            return lruIndex.retrieveWebEntityLinks();
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Run the process to generate the WebEntityLinks from the definition of the WebEntities and the list of NodeLinks.
     *
     * @return web entity links
     * @throws TException hmm
     */
    @Override
    public List<WebEntityLink> generateWebEntityLinks() throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("generateWebEntityLinks");
        }
        try {
            return lruIndex.generateWebEntityLinks();
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Run the process to update the WebEntityLinks from the definition of the WebEntities and the list of NodeLinks modified since given timestamp.
     *
     * @return new timestamp to use the next time
     * @throws TException hmm
     */
    @Override
    public int updateWebEntityLinks(int lastTimestamp) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("updateWebEntityLinks");
        }
        try {
            return lruIndex.updateWebEntityLinks(lastTimestamp);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Returns a list of WebEntityLinks having a specific webentity as source
     *
     * @param id id of web entity
     * @return webentities whose source id are this
     */
    @Override
    public List<WebEntityLink> getWebEntityLinksByWebEntitySource(String id) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntityLinksByWebEntitySource");
        }
        try {
            return lruIndex.retrieveWebEntityLinksBySource(id);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("getWebEntityLinksByWebEntitySource end");
            }
        }
    }

    /**
     * Returns a list of WebEntityLinks having a specific webentity as target
     *
     * @param  id of the web entity
     * @return List of webentity links whose target id are this
     */
    @Override
    public List<WebEntityLink> getWebEntityLinksByWebEntityTarget(String id) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntityLinksByWebEntityTarget");
        }
        try {
            return lruIndex.retrieveWebEntityLinksByTarget(id);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        } finally {
            if(logger.isDebugEnabled()) {
                logger.debug("getWebEntityLinksByWebEntityTarget end");
            }
        }
    }


    // -- WEBENTITYCREATIONRULES


    /**
     * Returns all web entity creation rules stored in the index.
     *
     * @return web entity creation rules
     * @throws TException hmm
     */
    @Override
    public List<WebEntityCreationRule> getWebEntityCreationRules() throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getWebEntityCreationRules");
        }
        try {
            return lruIndex.retrieveWebEntityCreationRules();
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Stores a web entity creation rule.
     *
     * @param webEntityCreationRule rule to store
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public void addWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("addWebEntityCreationRule");
        }
        try {
            lruIndex.addWebEntityCreationRule(webEntityCreationRule);
            if(logger.isDebugEnabled()) {
                logger.debug("addWebEntityCreationRule finished indexing webEntityCreationRule: [" + webEntityCreationRule.getLRU() + ", " + webEntityCreationRule.getRegExp() + "]");
            }
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }

    /**
     * Deletes a web entity creation rule.
     *
     * @param webEntityCreationRule to delete
     * @throws TException hmm
     */
    @Override
    public void removeWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("removeWebEntityCreationRule");
        }
        try {
            lruIndex.deleteWebEntityCreationRule(webEntityCreationRule);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), MaxCacheSizeException.class.getName());
        }
    }


    // -- PRECISIONEXCEPTIONS


    /**
     * Returns all precision exceptions stored in the index.
     *
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     */
    @Override
    public List<String> getPrecisionExceptions() throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("getPrecisionExceptions");
        }
        try {
            return lruIndex.retrievePrecisionExceptions();
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Adds a set of precisions exceptions.
     *
     * @param listLRUs a list of LRU prefixes to add to precisions exceptions in the index
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     * @throws ObjectNotFoundException hmm
     */
    @Override
    public void addPrecisionExceptions(List<String> listLRUs) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("markPrecisionExceptions (" + listLRUs.size() +")");
        }
        try {
            lruIndex.indexPrecisionExceptions(listLRUs);
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

    /**
     * Removes a set of precisions exceptions.
     *
     * @param listLRUs a list of LRU prefixes to remove from precisions exceptions
     * @throws TException hmm
     * @throws MemoryStructureException hmm
     * @throws ObjectNotFoundException hmm
     */
    @Override
    public void removePrecisionExceptions(List<String> listLRUs) throws MemoryStructureException {
        if(logger.isDebugEnabled()) {
            logger.debug("removePrecisionExceptions (" + listLRUs.size() +")");
        }
        try {
            lruIndex.deletePrecisionExceptions(listLRUs);
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new MemoryStructureException(x.getMessage(), ExceptionUtils.stacktrace2string(x), IndexException.class.getName());
        }
    }

}
