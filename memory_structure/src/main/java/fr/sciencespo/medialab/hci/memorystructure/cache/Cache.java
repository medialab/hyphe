package fr.sciencespo.medialab.hci.memorystructure.cache;

import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import fr.sciencespo.medialab.hci.memorystructure.thrift.Constants;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructureException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.ObjectNotFoundException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityStatus;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import fr.sciencespo.medialab.hci.memorystructure.util.StringUtil;
import fr.sciencespo.medialab.hci.memorystructure.util.LRUUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import gnu.trove.map.hash.THashMap;
import gnu.trove.set.hash.THashSet;

/**
 * Cache.
 *
 * @author heikki doeleman, benjamin ooghe-tabanou
 */
public class Cache {

    private static DynamicLogger logger = new DynamicLogger(Cache.class);
    private final int MAX_CACHE_SIZE = Integer.MAX_VALUE;
    private final String id;
    private THashMap<String, PageItem> pageItems = new THashMap<String, PageItem>();
    private LRUIndex lruIndex;


    /**
     * Creates a cache with generated id.
     *
     * @param lruIndex index
     */
    public Cache(LRUIndex lruIndex) {
        this.id = UUID.randomUUID().toString();
        this.lruIndex = lruIndex;
    }

    /**
     * Returns id of cache.
     *
     * @return cache id
     */
    public String getId() {
        return id;
    }

    /**
     * Returns pageitems in the cache.
     *
     * @return pageItems
     */
    public List<PageItem> getPageItems() {
        List<PageItem> pageItems = new ArrayList<PageItem>();
        for(PageItem pageItem : this.pageItems.values()) {
            pageItems.add(pageItem);
        }
        return pageItems;
    }

    /**
     * Adds pageItems to the cache.
     *
     * @param pageItems pageItems
     * @throws MaxCacheSizeException if resulting cache would exceed max cache size
     */
    public void setPageItems(List<PageItem> pageItems) throws MaxCacheSizeException {
        logger.trace("adding PageItems to cache");
        if(this.pageItems.size() + pageItems.size() > MAX_CACHE_SIZE) {
            String msg = "attempt to add # " + pageItems.size() + " pageItems to cache with id: " + id + ". Cache already contains " + this.pageItems.size() + "pageItems. Allowed max is " + MAX_CACHE_SIZE;
            logger.error(msg);
            throw new MaxCacheSizeException(msg);
        }
        for(PageItem pageItem : pageItems) {
            this.pageItems.put(pageItem.getLru(), pageItem);
        }
    }

    /**
     * Removes a pageItem form the cache.
     *
     * @param pageItem to remove
     * @throws ObjectNotFoundException if pageItem is not in cache
     */
    public void removePageItem(PageItem pageItem) throws ObjectNotFoundException {
        if(logger.isDebugEnabled()) {
            logger.trace("removePageItem " + pageItem.getLru());
        }
        if(this.pageItems.remove(pageItem.getLru()) == null) {
            throw new ObjectNotFoundException().setMsg("Could not find pageItem " + pageItem.getLru() + " in cache with id " + this.id);
        }
    }

    /**
     * Creates web entities for the pages in the cache.
     *
     * @return number of new web entities
     * @throws MemoryStructureException hmm
     * @throws IndexException hmm
     */
    public int createWebEntities() throws MemoryStructureException, IndexException {
        logger.trace("createWebEntities");
        int createdWebEntitiesCount = 0;
        THashSet<String> pageLRUs = new THashSet<String>();
        pageLRUs.addAll(this.pageItems.keySet());
        THashSet<String> doneLRUPrefixes = new THashSet<String>();
        if(logger.isDebugEnabled()) {
            logger.trace("cache contains # " + pageLRUs.size() + " pages");
        }
        String LRUPrefix, LRUVariation;
        WebEntity WEcandidate, existing, existingVariation;
        THashMap<String, WebEntity> WEcandidates;
        for(String pageLRU : pageLRUs) {
            if(logger.isDebugEnabled()) {
            	logger.trace("createWebEntities for page " + pageLRU);
            }
            WEcandidates = lruIndex.findWECandidatesForPageUrl(pageLRU);
            LRUPrefix = lruIndex.findWERulePrefixForPageUrl(WEcandidates, pageLRU);
            if (!doneLRUPrefixes.contains(LRUPrefix)) {
                WEcandidate = WEcandidates.get(LRUPrefix);
                existing = lruIndex.retrieveWebEntityByLRUPrefix(LRUPrefix);

                // store new webentity in index
                if (existing == null && WEcandidate != null) {
                	LRUVariation = LRUUtil.HTTPVariationLRU(LRUPrefix);
                	if (LRUVariation != null) {
                        existingVariation = lruIndex.retrieveWebEntityByLRUPrefix(LRUVariation);
                        if (existingVariation == null) {
                        	WEcandidate.addToLRUSet(LRUVariation);
                        }
                	}
                	LRUVariation = LRUUtil.HTTPWWWVariationLRU(LRUPrefix);
                	if (LRUVariation != null) {
                        existingVariation = lruIndex.retrieveWebEntityByLRUPrefix(LRUVariation);
                        if (existingVariation == null) {
                        	WEcandidate.addToLRUSet(LRUVariation);
                        }
                	}
                	LRUVariation = LRUUtil.WWWVariationLRU(LRUPrefix);
                	if (LRUVariation != null) {
                        existingVariation = lruIndex.retrieveWebEntityByLRUPrefix(LRUVariation);
                        if (existingVariation == null) {
                        	WEcandidate.addToLRUSet(LRUVariation);
                        }
                	}
                	createdWebEntitiesCount++;
                	if (logger.isDebugEnabled()) {
                		logger.debug("indexing new webentity for prefix " + LRUPrefix);
                	}
                	lruIndex.indexWebEntity(WEcandidate, false, true);
                }
                doneLRUPrefixes.add(LRUPrefix);
            }
        }
        return createdWebEntitiesCount;
    }

    public void clear() {
        logger.trace("clearing cache with id: " + id);
        this.pageItems.clear();
    }
}
