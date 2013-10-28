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
     * Applies web entity creation rule to a page. If the rule is the default rule, or if the page lru matches the rule
     * lruprefix, a match is attempted between page lru and rule regular expression. If there is a match, a web entity
     * is created.
     *
     * @param rule web entity creation rule
     * @param page page
     * @return created web entity or null
     */
    public WebEntity applyWebEntityCreationRule(WebEntityCreationRule rule, String pageLRU) {
        if(rule == null || pageLRU == null) {
            return null;
        }
        if(logger.isDebugEnabled()) {
            logger.debug("applyWebEntityCreationRule " + rule.getRegExp());
        }
        String name, LRUPrefix;
        Matcher matcher = Pattern.compile(rule.getRegExp(), Pattern.CASE_INSENSITIVE).matcher(pageLRU);
        if(matcher.find()) {
            LRUPrefix = matcher.group();
            name = StringUtil.toTitle(LRUUtil.revertLRU(LRUUtil.stripLRUScheme(LRUPrefix)));
            if(logger.isDebugEnabled()) {
                logger.debug("page " + pageLRU + " matches prefix " + LRUPrefix + " -> " + name);
            }
        }
        // Sets LRUs that don't match any CreationRule RegExp to default scheme only entity
        else {
            LRUPrefix = pageLRU.substring(0, pageLRU.indexOf('|'));
            name = Constants.DEFAULT_WEBENTITY;
        }
        WebEntity webEntity = new WebEntity();
        webEntity.setName(name);
        webEntity.setLRUSet(new HashSet<String>());
        webEntity.addToLRUSet(LRUPrefix);
        webEntity.setStatus(WebEntityStatus.DISCOVERED.name());
        String now = String.valueOf(System.currentTimeMillis());
        webEntity.setCreationDate(now);
        webEntity.setLastModificationDate(now);
        return webEntity;
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
        List<WebEntityCreationRule> webEntityCreationRules = lruIndex.retrieveWebEntityCreationRules();
        THashSet<String> pageLRUs = new THashSet<String>();
        pageLRUs.addAll(this.pageItems.keySet());
        THashSet<String> doneLRUPrefixes = new THashSet<String>();
        if(logger.isDebugEnabled()) {
            logger.trace("cache contains # " + pageLRUs.size() + " pages");
        }
        String LRUPrefix;
        WebEntity WEcandidate, existing;
        THashMap<String, WebEntity> WEcandidates;
        for(String pageLRU : pageLRUs) {
            if(logger.isDebugEnabled()) {
                logger.trace("createWebEntities for page " + pageLRU);
            }
            WEcandidates = new THashMap<String, WebEntity>();
            for(WebEntityCreationRule rule : webEntityCreationRules) {
                // only apply rule to page with lru that match the rule lruprefix (or if this is the default rule)
                if (pageLRU.startsWith(rule.getLRU()) || rule.getLRU().equals(Constants.DEFAULT_WEBENTITY_CREATION_RULE)) {
                    if(logger.isDebugEnabled()) {
                        logger.debug("page " + pageLRU + " matches rule " + rule.getLRU());
                    }
                    WEcandidate = applyWebEntityCreationRule(rule, pageLRU);
                    if (WEcandidate != null && WEcandidate.getLRUSet().size() > 0) {
                        LRUPrefix = (String)(WEcandidate.getLRUSet().toArray())[0];
                        WEcandidates.put(LRUPrefix, WEcandidate);
                    }
                }
            }
            LRUPrefix = (String) (StringUtil.findLongestString(WEcandidates.keySet())).toArray()[0];
            if (!doneLRUPrefixes.contains(LRUPrefix)) {
                WEcandidate = WEcandidates.get(LRUPrefix);
                existing = lruIndex.retrieveWebEntityByLRUPrefix(LRUPrefix);
                // store new webentity in index
                if (existing == null && WEcandidate != null) {
                    createdWebEntitiesCount++;
                    logger.debug("indexing new webentity for prefix " + LRUPrefix);
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
