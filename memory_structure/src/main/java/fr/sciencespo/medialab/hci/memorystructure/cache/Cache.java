package fr.sciencespo.medialab.hci.memorystructure.cache;

import fr.sciencespo.medialab.hci.memorystructure.index.IndexConfiguration;
import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructureException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.ObjectNotFoundException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.util.CollectionUtils;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import fr.sciencespo.medialab.hci.memorystructure.util.StringUtil;
import fr.sciencespo.medialab.hci.memorystructure.util.LRUUtil;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cache.
 *
 * @author heikki doeleman
 */
public class Cache {
	
	private static DynamicLogger logger = new DynamicLogger(Cache.class);

    // TODO make configurable
    private final int MAX_CACHE_SIZE = Integer.MAX_VALUE;

    private final String id;
    private Map<String, PageItem> pageItems = new HashMap<String, PageItem>();
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
        logger.debug("adding PageItems to cache");
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
            logger.debug("removePageItem " + pageItem.getLru());
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
    public WebEntity applyWebEntityCreationRule(WebEntityCreationRule rule, PageItem page) {
        if(rule == null || page == null) {
            return null;
        }
        WebEntity webEntity = null;
        if(logger.isDebugEnabled()) {
            logger.debug("applyWebEntityCreationRule " + rule.getRegExp());
        }
        String LRUPrefix = getLRUPrefixAccordingToRule(rule, page.getLru());
        if(LRUPrefix != null) {
            String name = StringUtil.toTitle(LRUUtil.revertLRU(LRUPrefix));
            webEntity = new WebEntity();
            webEntity.setName(name);
            webEntity.setLRUSet(new HashSet<String>());
            webEntity.addToLRUSet(LRUPrefix);
            String now = String.valueOf(System.currentTimeMillis());
            webEntity.setCreationDate(now);
            webEntity.setLastModificationDate(now);
            logger.debug("created new WebEntity");
        }
        return webEntity;
    }

    private String getLRUPrefixAccordingToRule(WebEntityCreationRule rule, String pageLRU) {
        String LRUPrefix = null;
        // only apply rule to page with lru that match the rule lruprefix (or if this is the default rule)
        if(pageLRU.startsWith(rule.getLRU()) || rule.getLRU().equals(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE)) {
            if(logger.isDebugEnabled()) {
                logger.debug("page " + pageLRU + " matches rule prefix " + rule.getLRU());
            }
            String regexp = rule.getRegExp();
            Pattern pattern = Pattern.compile(regexp, Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(pageLRU);
            if(matcher.find()) {
                if(logger.isDebugEnabled()) {
                    logger.debug("rule matches page " + pageLRU);
                }
                LRUPrefix = matcher.group();
            }
            else {
                if(logger.isDebugEnabled()) {
                    logger.debug("rule does not match page " + pageLRU);
                }
            }
        }
        else {
            if(logger.isDebugEnabled()) {
                logger.debug("page " + pageLRU + " does not match rule prefix " + rule.getLRU());
            }
        }
        return LRUPrefix;
    }

    /**
     * Creates web entities for the pages in the cache.
     *
     * @return number of new web entities
     * @throws MemoryStructureException hmm
     * @throws IndexException hmm
     */
    public int createWebEntities() throws MemoryStructureException, IndexException {
        logger.debug("createWebEntities");
        int createdWebEntitiesCount = 0;
        WebEntityCreationRule defaultRule = lruIndex.retrieveDefaultWECR();
        Set<WebEntityCreationRule> webEntityCreationRules = lruIndex.retrieveWebEntityCreationRules();
        Set<String> pageLRUs = this.pageItems.keySet();
        Set<String> doneLRUPrefixes = new HashSet<String>();
        WebEntity webEntityDefault;
        String ruleLRUPrefix, LRUPrefix;
        Set<String> LRUPrefixesCandidates;
        WebEntity WEcandidate;
        logger.debug("cache contains # " + pageLRUs.size() + " pages");
        for(String pageLRU : pageLRUs) {
            if(logger.isDebugEnabled()) {
                logger.debug("createWebEntities for page " + pageLRU);
            }
            webEntityDefault = applyWebEntityCreationRule(defaultRule, this.pageItems.get(pageLRU));
            LRUPrefixesCandidates = new HashSet<String>();
            if (webEntityDefault != null && webEntityDefault.getLRUSet().size() > 0) {
                LRUPrefixesCandidates.add((String)(webEntityDefault.getLRUSet().toArray())[0]);
            }
            for(WebEntityCreationRule wecr : webEntityCreationRules) {
                ruleLRUPrefix = wecr.getLRU();
                if (pageLRU.startsWith(ruleLRUPrefix)) {
                    LRUPrefixesCandidates.add(ruleLRUPrefix);
                }
            }
            LRUPrefix = (String) (CollectionUtils.findLongestString(LRUPrefixesCandidates)).toArray()[0];
            if (!doneLRUPrefixes.contains(LRUPrefix)) {
                WEcandidate = lruIndex.retrieveWebEntityByLRUPrefix(LRUPrefix);
                if (WEcandidate == null && webEntityDefault != null) {
                    createdWebEntitiesCount++;
                    logger.debug("indexing new webentity");
                    // store new webentity in index
                    lruIndex.indexWebEntity(webEntityDefault, false);
                }
                doneLRUPrefixes.add(LRUPrefix);
            }
        }
        return createdWebEntitiesCount;
    }

    public void clear() {
        logger.info("clearing cache with id: " + id);
        this.pageItems.clear();
    }
}
