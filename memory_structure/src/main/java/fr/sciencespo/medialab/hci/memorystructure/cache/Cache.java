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
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Scanner;
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

    private Logger logger = LoggerFactory.getLogger(Cache.class);

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
    public Set<PageItem> getPageItems() {
        Set<PageItem> pageItems = new HashSet<PageItem>();
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
    public void setPageItems(Set<PageItem> pageItems) throws MaxCacheSizeException {
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
        logger.debug("removePageItem " + pageItem.getLru());
        if(this.pageItems.remove(pageItem.getLru()) == null) {
            throw new ObjectNotFoundException().setMsg("Could not find pageItem " + pageItem.getLru() + " in cache with id " + this.id);
        }
    }

    /**
     * Reverts an lru to an url. Scheme is stripped; a "www" host is also stripped; returns null when input is null,
     * empty or blank.
     *
     * @param lru to revert
     * @return url
     */
    protected String revertLRU(String lru) {
        if(lru == null) {
            return null;
        }
        lru = lru.trim();
        if(StringUtils.isEmpty(lru)) {
            return null;
        }
        String url = "";
        Scanner scanner = new Scanner(lru);
        scanner.useDelimiter("\\|");
        boolean tldDone = false;
        boolean removedTrailingDot = false;
        boolean questionMarkAdded = false;
        while(scanner.hasNext()) {
            String lruElement = scanner.next();
            if(!lruElement.startsWith("s:")) {
                if(lruElement.startsWith("h:")) {
                    if(!lruElement.equals("h:www")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        if(StringUtils.isNotEmpty(lruElement)) {
                            if(tldDone) {
                                url = url + "." + lruElement;
                            }
                            else {
                                url = lruElement + "." + url;
                            }
                            if(!tldDone && lruElement.startsWith("h:")) {
                                tldDone = true;
                            }
                        }
                    }
                }
                else {
                    if(!removedTrailingDot) {
                        url = url.substring(0, url.length() - 1);
                        removedTrailingDot = true;
                    }
                    if(lruElement.startsWith("p:")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        if(StringUtils.isNotEmpty(lruElement)) {
                            url = url + "/" + lruElement;
                        }
                    }
                    else if(lruElement.startsWith("q:")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        if(StringUtils.isNotEmpty(lruElement)) {
                            if(!questionMarkAdded) {
                                url = url + "?" + lruElement;
                                questionMarkAdded = true;
                            }
                            else {
                                url = url + "&" + lruElement;
                            }
                        }
                    }
                    else if(lruElement.startsWith("r:")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        if(StringUtils.isNotEmpty(lruElement)) {
                            url = url + "#" + lruElement;
                        }
                    }
                }
            }
        }
        if(!removedTrailingDot) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
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
    protected WebEntity applyWebEntityCreationRule(WebEntityCreationRule rule, PageItem page) {
        if(rule == null || page == null) {
            return null;
        }
        logger.debug("applyWebEntityCreationRule " + rule.getRegExp());
        // only apply rule to page with lru that match the rule lruprefix (or if this is the default rule)
        if(page.getLru().startsWith(rule.getLRU()) || rule.getLRU().equals(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE)) {
            logger.debug("page " + page.getLru() + " matches rule prefix " + rule.getLRU());
            String regexp = rule.getRegExp();
            Pattern pattern = Pattern.compile(regexp, Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(page.getLru());
            if(matcher.find()) {
                logger.debug("rule matches page " + page.getLru());
                String webEntityLRU = matcher.group();
                WebEntity webEntity = new WebEntity();
                String name = revertLRU(webEntityLRU);
                webEntity.setName(name);
                webEntity.setLRUSet(new HashSet<String>());
                webEntity.addToLRUSet(webEntityLRU);
                Date now = new Date();
                webEntity.setCreationDate(now.toString());
                webEntity.setLastModificationDate(now.toString());
                logger.debug("created new WebEntity");
                return webEntity;
            }
            else {
                logger.debug("rule does not match page " + page.getLru());
            }
        }
        else {
            logger.debug("page " + page.getLru() + " does not match rule prefix " + rule.getLRU());
        }
        return null;
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
        Set<String> pageLRUs = this.pageItems.keySet();
        for(String pageLRU : pageLRUs) {
            //
            // retrieve the most precise LRU prefix match from existing Web Entities + Web Entity Creation Rules
            //
            Map<String, Set<WebEntity>> matchingWEPrefixes = lruIndex.findMatchingWebEntityLRUPrefixes(pageLRU);
            String mostSpecificWEPrefix = "";
            if(matchingWEPrefixes.size() > 0) {
                Set<String> mostSpecificWEPrefixes = CollectionUtils.findLongestString(matchingWEPrefixes.keySet());
                // should never happen because of validation in lruindex when indexing webentity
                if(mostSpecificWEPrefixes.size() > 1) {
                    throw new MemoryStructureException().setMsg("Confused: more than one matching WebEntity Prefix with same specificity");
                }
                mostSpecificWEPrefix = mostSpecificWEPrefixes.iterator().next();

                if(mostSpecificWEPrefixes.size() > 0) {
                    logger.debug("found most specific matching web entity prefix: " + mostSpecificWEPrefixes.iterator().next());
                }
                else {
                    logger.debug("did not find any most specific matching web entity prefix");
                }
            }
            else {
                logger.debug("did not find any matching web entity lru prefixes");
            }


            Map<String, Set<WebEntityCreationRule>> matchingWECRPrefixes = lruIndex.findMatchingWebEntityCreationRuleLRUPrefixes(pageLRU);
            String mostSpecificWECRPrefix = "";
            if(matchingWECRPrefixes.size() > 0) {
                Set<String> mostSpecificWECRPrefixes = CollectionUtils.findLongestString(matchingWECRPrefixes.keySet());
                // should never happen because of validation in lruindex when indexing web entity creation rule
                if(matchingWECRPrefixes.size() > 1) {
                    throw new MemoryStructureException().setMsg("Confused: more than one matching WebEntityCreationRule Prefix with same specificity");
                }
                mostSpecificWECRPrefix = mostSpecificWECRPrefixes.iterator().next();

                if(mostSpecificWECRPrefixes.size() > 0) {
                    logger.debug("found most specific matching web entity creation rule prefix: " + mostSpecificWECRPrefixes.iterator().next());
                }
                else {
                    logger.debug("did not find any most specific matching web entity creation rule prefix");
                }
            }
            else {
                logger.debug("did not find any matching web entity creation rule lru prefixes");
            }

            // apply default rule if no other rule matches
            if(mostSpecificWEPrefix.length() == 0 && mostSpecificWECRPrefix.length() == 0) {
                logger.debug("did not find match from either WE or WECR: using default WECR");
                Set<WebEntityCreationRule> allWCRS = lruIndex.retrieveWebEntityCreationRules();
                for(WebEntityCreationRule webEntityCreationRule : allWCRS) {
                    if(webEntityCreationRule.getLRU().equals(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE)) {
                         WebEntity webEntity = applyWebEntityCreationRule(webEntityCreationRule, this.pageItems.get(pageLRU));
                        // rule matched, successfully created new web entity
                        if(webEntity != null) {
                            logger.debug("rule matched, successfully created new web entity");
                            createdWebEntitiesCount++;
                            logger.debug("indexing new webentity");
                            // store new webentity in index
                            lruIndex.indexWebEntity(webEntity);
                        }
                        else {
                            logger.debug("rule did not match, did not create new web entity");
                        }
                    }
                }
            }

            // if the most precise prefix is from a Web Entity, do nothing
            else if(mostSpecificWEPrefix.length() > mostSpecificWECRPrefix.length()) {
                logger.debug("most precise prefix is from a Web Entity, doing nothing");
                // do nothing
            }
            // if the most precise prefix is from a Web Entity Creation Rule, apply that rule (may be the default
            // rule)
            // if they are equal length, the most specific LRUPrefix from Rules and most specific LRUPrefix from
            // entities have same specificity : In such a case, priority to the creation rule

            else if(mostSpecificWECRPrefix.length() >= mostSpecificWEPrefix.length()) {
                if(mostSpecificWECRPrefix.length() > mostSpecificWEPrefix.length()) {
                    logger.debug("most precise prefix is from a Web Entity Creation Rule, applying that rule");
                }
                else {
                    logger.debug("most specific LRUPrefix from Rules and most specific LRUPrefix from entities have same specificity : prefer the creation rule");
                }
                // apply rule
                Set<WebEntityCreationRule> matchingRules = matchingWECRPrefixes.get(mostSpecificWECRPrefix);
                logger.debug("found # " + matchingRules.size() + " matching rules");
                // should never happen because of validation in lruindex when indexing web entity creation rule
                if(matchingRules.size() > 1) {
                    throw new MemoryStructureException().setMsg("Confused: more than one matching Rule with same specificity");
                }
                else {
                    WebEntity webEntity = applyWebEntityCreationRule(matchingRules.iterator().next(), this.pageItems.get(pageLRU));
                    // rule matched, successfully created new web entity
                    if(webEntity != null) {
                        logger.debug("rule matched, successfully created new web entity");
                        createdWebEntitiesCount++;
                        logger.debug("indexing new webentity");
                        // store new webentity in index
                        lruIndex.indexWebEntity(webEntity);
                    }
                    else {
                        logger.debug("rule did not match, did not create new web entity");
                    }
                }
            }
        }
        return createdWebEntitiesCount;
    }

    public void clear() {
        logger.info("clearing cache with id: " + id);
        this.pageItems.clear();
    }
}