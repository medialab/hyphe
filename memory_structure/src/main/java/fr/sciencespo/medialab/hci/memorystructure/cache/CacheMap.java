package fr.sciencespo.medialab.hci.memorystructure.cache;

import fr.sciencespo.medialab.hci.memorystructure.thrift.ObjectNotFoundException;

import java.util.HashMap;
import java.util.Map;

/**
 * Singleton map to hold caches. Caches can be retrieved by their id.
 *
 * @author heikki doeleman
 */
public class CacheMap {

    private static CacheMap instance;
    private static Map<String, Cache> map;

    public synchronized static CacheMap getInstance() {
        if(instance == null) {
            instance = new CacheMap();
        }
        return instance;
    }
    public Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException();
    }
    private CacheMap() {
        map = new HashMap<String, Cache>();
    }

    public void add(Cache cache) {
        map.put(cache.getId(), cache);
    }

    public void remove(String id) {
        map.remove(id);
    }

    public Cache get(String id) throws ObjectNotFoundException {
        Cache cache = map.get(id);
        if(cache == null) {
            throw new ObjectNotFoundException().setMsg("Failed to find cache with id: " + id);
        }
        return cache;
    }

}