package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructureImpl;
import junit.framework.TestCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * Tests for the MemoryStructure server interface.
 *
 * @author heikki doeleman
 */
public class MemoryStructureTest extends TestCase {
    private static Logger logger = LoggerFactory.getLogger(MemoryStructureTest.class);

    private MemoryStructureImpl memoryStructure = new MemoryStructureImpl();
    /**
     * Invoked before each test* method.
     */
    public void setUp() {
        memoryStructure = new MemoryStructureImpl();
        memoryStructure.setLucenePath("luceneindex");
    }

    /**
     * Invoked after each test* method. Empties the index between tests.
     */
    public void tearDown() throws Exception {
    }

    /**
     * Tests creating a cache for a list of LRUItems.
     *
     * @throws Exception hmm
     */
    public void testCreateCache() throws Exception {
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("1");
        LRUItem lruItem2 = new LRUItem().setLru("2");
        LRUItem lruItem3 = new LRUItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        String id = memoryStructure.createCache(lruItems);
        logger.debug("created cache with id " + id);
        assertTrue("No exception occurred when we got here", true);
    }

    /**
     * Tests createCache() with null input.
     *
     * @throws Exception hmm
     */
    public void testCreateCacheNullInput() throws Exception{
        List<LRUItem> lruItems = null;
        String id = memoryStructure.createCache(lruItems);
        assertEquals("WARNING: MemoryStructure createCache() received null. No cache created.", id);
    }

    /**
     * Tests indexing a cache.
     *
     * @throws Exception hmm
     */
    public void testIndexCache() throws Exception{
        //
        // first, create and populate a cache
        //
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("1");
        LRUItem lruItem2 = new LRUItem().setLru("2");
        LRUItem lruItem3 = new LRUItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        String id = memoryStructure.createCache(lruItems);
        logger.debug("created cache with id " + id);
        //
        // index this cache
        //
        memoryStructure.indexCache(id);

        // TODO what assertions to test ?
        assertTrue("No exception occurred when we got here", true);


    }

    /**
     * Tests deleting a cache.
     *
     * @throws Exception hmm
     */
    public void testDeleteCache() throws Exception {
        //
        // first, create and populate a cache
        //
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("1");
        LRUItem lruItem2 = new LRUItem().setLru("2");
        LRUItem lruItem3 = new LRUItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        String id = memoryStructure.createCache(lruItems);
        logger.debug("created cache with id " + id);
        //
        // delete this cache
        //
        int status = memoryStructure.deleteCache(id);
        assertEquals("Unexpected status: " + status, 0, status);
    }

    /**
     * Tests deleting a cache that doesn't exist.
     *
     * @throws Exception hmm
     */
    public void testDeleteNonExistingCache() throws Exception{
        String id = "There-is-no-cache-with-this-id";
        //
        // delete this cache
        //
        int status = memoryStructure.deleteCache(id);
        assertEquals("Unexpected status: " + status, -1, status);
    }

    /**
     * Tests setting a Precision Exception.
     *
     * @throws Exception
     */
    public void testSetPrecisionException() throws Exception {
        String precisionException = "fr|sciences-po|medialab";
        int status = memoryStructure.storePrecisionException(precisionException);
        assertEquals("Unexpected status: " + status, 0, status);
    }

    /**
     * Tests setting a Precision Exception with null input.
     *
     * @throws Exception hmm
     */
    public void testSetPrecisionExceptionNullInput() throws Exception {
        int status = memoryStructure.storePrecisionException(null);
        assertEquals("Unexpected status: " + status, -1, status);
    }

    /**
     * Tests retrieving PrecisionException from cache.
     *
     * @throws Exception hmm
     */
    public void testGetPrecisionExceptionsFromCache() throws Exception {
        //
        // first, create and populate a cache
        //
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("1");
        LRUItem lruItem2 = new LRUItem().setLru("2");
        LRUItem lruItem3 = new LRUItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        String id = memoryStructure.createCache(lruItems);
        logger.debug("created cache with id " + id);
        //
        // Add a Precision Exception
        //
        String precisionException = "2";
        int status = memoryStructure.storePrecisionException(precisionException);
        // verify it was saved succesfully
        assertEquals("Unexpected status: " + status, 0, status);

        List<String> precisionExceptionsFromCache = memoryStructure.getPrecisionExceptionsFromCache(id);

        assertNotNull("Received null PrecisionExceptions from cache", precisionException);
        assertEquals("Unexpected number of precision exceptions from cache", 1, precisionExceptionsFromCache.size());
        String retrievedPrecisionException = precisionExceptionsFromCache.get(0);
        assertEquals("Unexpted PrecisionException from cache", "2", retrievedPrecisionException);

    }

    /**
     * Tests retrieving precisionException from cache, but it's a node, so it should not be returned.
     *
     * @throws Exception hmm
     */
    public void testGetPrecisionExceptionsNodeFromCache() throws Exception {
        //
        // first, create and populate a cache
        //
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("1");
        LRUItem lruItem2 = new LRUItem().setLru("2");
        // set isNode true
        lruItem2.setIsNode(true);
        LRUItem lruItem3 = new LRUItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        String id = memoryStructure.createCache(lruItems);
        logger.debug("created cache with id " + id);
        //
        // Add a Precision Exception
        //
        String precisionException = "2";
        int status = memoryStructure.storePrecisionException(precisionException);
        // verify it was saved succesfully
        assertEquals("Unexpected status: " + status, 0, status);

        List<String> precisionExceptionsFromCache = memoryStructure.getPrecisionExceptionsFromCache(id);

        assertNotNull("Received null PrecisionExceptions from cache", precisionException);
        assertEquals("Unexpected number of precision exceptions from cache", 0, precisionExceptionsFromCache.size());
    }

    /**
     * Tests retrieving PrecisionException from cache with a null input.
     *
     * @throws Exception hmm
     */
    public void testGetPrecisionExceptionsFromCacheNullInput() throws Exception {
        //
        // first, create and populate a cache
        //
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("1");
        LRUItem lruItem2 = new LRUItem().setLru("2");
        LRUItem lruItem3 = new LRUItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        String id = memoryStructure.createCache(lruItems);
        logger.debug("created cache with id " + id);
        //
        // Add a Precision Exception
        //
        String precisionException = "2";
        int status = memoryStructure.storePrecisionException(precisionException);
        // verify it was saved succesfully
        assertEquals("Unexpected status: " + status, 0, status);

        List<String> precisionExceptionsFromCache = memoryStructure.getPrecisionExceptionsFromCache(null);
        assertNull("Received non-null PrecisionExceptions from cache", precisionExceptionsFromCache);
    }

}