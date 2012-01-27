package fr.sciencespo.medialab.hci.memorystructure.cache;

import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 *
 * @author heikki doeleman
 */
public class Cache {

    private Logger logger = LoggerFactory.getLogger(Cache.class);

    private final String id;

    private final int MAX_CACHE_SIZE = Integer.MAX_VALUE;

    private Set<PageItem> pageItems ;

    public Cache() {
        this.id = UUID.randomUUID().toString();
    }

    public String getId() {
        return id;
    }

    public Set<PageItem> getPageItems() {
        return pageItems;
    }

    public synchronized void setPageItems(Set<PageItem> pageItems) throws MaxCacheSizeException {
        logger.debug("adding PageItems to cache");
        if(pageItems.size() > MAX_CACHE_SIZE) {
            String msg = "attempt to add # " + pageItems.size() + " pageItems to cache with id: " + id + ". Allowed max is " + MAX_CACHE_SIZE;
            logger.error(msg);
            throw new MaxCacheSizeException(msg);
        }
        if(this.pageItems == null) {
            this.pageItems = new HashSet<PageItem>(pageItems.size());
        }
        this.pageItems = pageItems;
    }

    public void clear() {
        logger.info("clearing cache with id: " + id);
        this.pageItems.clear();
    }
}