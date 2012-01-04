package fr.sciencespo.medialab.hci.memorystructure.cache;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 *
 * @author heikki doeleman
 */
public class Cache {

    private final String id;

    private final int MAX_CACHE_SIZE = Integer.MAX_VALUE;

    private List<LRUItem> lruItems ;

    public Cache() {
        this.id = UUID.randomUUID().toString();
    }

    public String getId() {
        return id;
    }

    public List<LRUItem> getLruItems() {
        return lruItems;
    }

    public synchronized void setLruItems(List<LRUItem> lruItems) {
        System.out.println("adding LRUItems to cache");
        if(lruItems.size() > MAX_CACHE_SIZE) {
            System.out.println("WARNING: attempt to add # " + lruItems.size() + " elements to cache, which is larger than the allowed max " + MAX_CACHE_SIZE + " , cutting off surplus");
            lruItems = lruItems.subList(0, MAX_CACHE_SIZE);
        }
        if(this.lruItems == null) {
            this.lruItems = new ArrayList<LRUItem>(lruItems.size());
        }
        this.lruItems = lruItems;
    }

    public void clear() {
        System.out.println("clearing cache");
        this.lruItems.clear();
    }
}
