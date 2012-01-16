package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructureImpl;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import junit.framework.TestCase;
import org.apache.thrift.TException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    //
    // integration (scenario) tests
    //

    /**
     * Tests this scenario: http://jiminy.medialab.sciences-po.fr/hci/index.php/First_prototype_basic_user_scenario (as
     * far as the Memory Structure is concerned by it).
     */
    public void testBasicUserScenario() {
        try {
            //
            // configuration of the corpus
            //

            // 1. admin set the precision limit in core.settings.py
            // TODO should this be stored in MemoryStructure also, or not ?

            // 2. admin set the default web entity creation rule in core.settings.py
            // .. and stores it in the Memory Structure:
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setRegExp("(s:.*?\\|(h:.*?\\|)*?(h:.*?$)?)\\|?(p.*)?$");
            memoryStructure.storeWebEntityCreationRule(webEntityCreationRule);
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }

    }



    //
    // cache tests
    //

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

    //
    // WebEntity tests
    //

    /**
     * Tests storing a new webentity.
     */
    public void testStoreNewWebEntity() {
        try {
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            Set<String> lruList = new HashSet<String>();
            lruList.add("fr|sciences-po|www");
            lruList.add("fr|sciencespo|www");
            webEntity.setLRUlist(lruList);

            String id = memoryStructure.storeWebEntity(webEntity);
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);
        }
        catch (TException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests storing a webentity with null properties. Note that id and name may be null without problem: a null id
     * indicates creating a new webentity, and name is optional. Only lrulist may not be null.
     */
    public void testStoreWebEntityNullProperties() {
        try {
            WebEntity webEntity = new WebEntity();
            String id = memoryStructure.storeWebEntity(webEntity);
            fail("Exception was expected, but not thrown");
        }
        catch (TException x) {
            assertEquals("Expected exception about empty lrulist", "WebEntity has empty lru list", x.getMessage());
        }
    }

    /**
     * Tests storing a webentity with empty lru list.
     */
    public void testStoreWebEntityEmptyLRUList() {
        try {
            WebEntity webEntity = new WebEntity();
            Set<String> lruList = new HashSet<String>();
            webEntity.setLRUlist(lruList);
            String id = memoryStructure.storeWebEntity(webEntity);
            fail("Exception was expected, but not thrown");
        }
        catch (TException x) {
            assertEquals("Expected exception about empty lrulist", "WebEntity has empty lru list", x.getMessage());
        }
    }

    /**
     * Tests storing a null webentity.
     */
    public void testStoreNullWebEntity() {
        try {
            WebEntity webEntity = null;
            String id = memoryStructure.storeWebEntity(webEntity);
            fail("Exception was expected, but not thrown");
        }
        catch (TException x) {
            assertEquals("Expected exception about null webentity", "WebEntity is null", x.getMessage());
        }
    }

    /**
     * Tests retrieving a stored WebEntity.
     */
    public void testRetrieveWebEntityById() {
        try {
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            Set<String> lruList = new HashSet<String>();
            lruList.add("fr|sciences-po|www");
            lruList.add("fr|sciencespo|www");
            webEntity.setLRUlist(lruList);

            String id = memoryStructure.storeWebEntity(webEntity);
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            WebEntity retrieved = memoryStructure.findWebEntity(id);
            assertNotNull("could not retrieve webentity", retrieved);
        }
        catch (TException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests retrieving a WebEntity that does not exist.
     */
    public void testRetrieveNonExistingWebEntity() {
        try {
            WebEntity retrieved = memoryStructure.findWebEntity("there-is-no-webentity-with-this-id");
            assertNull("Retrieved non-existing webentity", retrieved);
        }
        catch (TException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests adding a LRU to a stored WebEntity.
     */
    public void testAddLRUtoWebEntity() {
        try {
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            Set<String> lruList = new HashSet<String>();
            lruList.add("fr|sciences-po|www");
            webEntity.setLRUlist(lruList);

            String id = memoryStructure.storeWebEntity(webEntity);
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            WebEntity retrieved = memoryStructure.findWebEntity(id);
            assertNotNull("could not retrieve webentity", retrieved);

            // check size of lrulist before adding
            assertEquals("unexpected size of lrulist", 1, retrieved.getLRUlist().size());

            retrieved.getLRUlist().add("fr|sciencespo|www");
            String newid = memoryStructure.storeWebEntity(retrieved);

            assertEquals("Failed to update webentity, id has changed", id, newid);

            retrieved = memoryStructure.findWebEntity(id);

            // check size of lrulist after adding
            assertEquals("unexpected size of lrulist", 2, retrieved.getLRUlist().size());

        }
        catch (TException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests adding a LRU to a stored WebEntity using the shortcut method.
     */
    public void testAddLRUtoWebEntity2() {
        try {
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            Set<String> lruList = new HashSet<String>();
            lruList.add("fr|sciences-po|www");
            webEntity.setLRUlist(lruList);

            String id = memoryStructure.storeWebEntity(webEntity);
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            memoryStructure.addLRUtoWebEntity(id, new LRUItem().setLru("fr|sciencespo|www"));

            WebEntity retrieved = memoryStructure.findWebEntity(id);
            assertNotNull("could not retrieve webentity", retrieved);

            // check size of lrulist after adding
            assertEquals("unexpected size of lrulist", 2, retrieved.getLRUlist().size());

        }
        catch (TException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests retrieving all webentities from the index.
     *
     */
    public void testRetrievingAllWebEntities() {
        try {
            // store 1 webentity
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            Set<String> lruList = new HashSet<String>();
            lruList.add("fr|sciences-po|www");
            webEntity.setLRUlist(lruList);

            String id = memoryStructure.storeWebEntity(webEntity);
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            // store 2nd webentity
            WebEntity webEntity2 = new WebEntity();
            webEntity2.setName("SCIENCES PO2");
            Set<String> lruList2 = new HashSet<String>();
            lruList2.add("fr|sciences-po2|www");
            webEntity2.setLRUlist(lruList2);

            String id2 = memoryStructure.storeWebEntity(webEntity2);
            assertNotNull("storeWebEntity returned null id", id2);
            logger.debug("storeWebEntity indexed web entity with id: " + id2);

             // retrieve them
            Set<WebEntity> webEntities = memoryStructure.findWebEntities();
            assertEquals("Unexpected number of retrieved webentities", 2, webEntities.size());
        }
        catch (TException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests retrieving all webentities from the index when there are none.
     *
     */
    public void testRetrievingAllWebEntitiesWhenThereAreNone() {
        try {
             // retrieve them
            Set<WebEntity> webEntities = memoryStructure.findWebEntities();
            assertEquals("Unexpected number of retrieved webentities", 0, webEntities.size());
        }
        catch (TException x) {
            fail(x.getMessage());
        }
    }

    //
    // WebEntity Creation Rule tests
    //

    /**
     * Tests storing a WebEntity Creation Rule.
     *
     * @throws Exception hmm
     */
    public void testStoreWebEntityCreationRule() throws Exception {
        WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
        webEntityCreationRule.setLRU("s:http|h:fr|h:sciences-po");
        webEntityCreationRule.setRegExp("(s:http|h:fr|h:sciences-po|(h:www|)?p:.*?\\|).*");
        int status = memoryStructure.storeWebEntityCreationRule(webEntityCreationRule);
        assertEquals("Unexpected status: " + status, 0, status);
    }

    /**
     * Tests storing a WebEntity Creation Rule that has null properties.
     *
     * @throws Exception hmm
     */
    public void testStoreWebEntityCreationRuleNullProperties() throws Exception {
        WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
        int status = memoryStructure.storeWebEntityCreationRule(webEntityCreationRule);
        assertEquals("Unexpected status: " + status, -1, status);
    }

    /**
     * Tests storing a WebEntity Creation Rule that's null.
     *
     * @throws Exception
     */
    public void testStoreWebEntityCreationRuleNull() throws Exception {
        WebEntityCreationRule webEntityCreationRule = null;
        int status = memoryStructure.storeWebEntityCreationRule(webEntityCreationRule);
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