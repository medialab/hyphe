package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructureException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.ObjectNotFoundException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructureImpl;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import junit.framework.TestCase;
import org.apache.thrift.TException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
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
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule);
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }

    }



    //
    // cache tests
    //

    /**
     * Tests creating a cache for a list of PageItems.
     *
     * @throws Exception hmm
     */
    public void testCreateCache() throws Exception {
        Set<PageItem> lruItems = new HashSet<PageItem>();
        PageItem lruItem1 = new PageItem().setLru("1");
        PageItem lruItem2 = new PageItem().setLru("2");
        PageItem lruItem3 = new PageItem().setLru("3");
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
        Set<PageItem> lruItems = null;
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
        Set<PageItem> lruItems = new HashSet<PageItem>();
        PageItem lruItem1 = new PageItem().setLru("1");
        PageItem lruItem2 = new PageItem().setLru("2");
        PageItem lruItem3 = new PageItem().setLru("3");
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
    public void testDeleteCache() {
        try {
            //
            // first, create and populate a cache
            //
            Set<PageItem> lruItems = new HashSet<PageItem>();
            PageItem lruItem1 = new PageItem().setLru("1");
            PageItem lruItem2 = new PageItem().setLru("2");
            PageItem lruItem3 = new PageItem().setLru("3");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            String id = memoryStructure.createCache(lruItems);
            logger.debug("created cache with id " + id);
            //
            // delete this cache
            //
            memoryStructure.deleteCache(id);
            assertTrue("If we got here, no exception was thrown", true);
        }
        catch (MemoryStructureException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (ObjectNotFoundException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }

    /**
     * Tests deleting a cache that doesn't exist.
     *
     * @throws Exception hmm
     */
    public void testDeleteNonExistingCache() {
        try {
            String id = "There-is-no-cache-with-this-id";
            //
            // delete this cache
            //
            memoryStructure.deleteCache(id);
            fail("Expected ObjectNotFoundException");
        }
        catch (ObjectNotFoundException x) {
            logger.error(x.getMessage());
            assertTrue("ObjectNotFoundException has unexpected message", x.getMsg().startsWith("Could not find cache with id:"));
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
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

            String id = memoryStructure.saveWebEntity(webEntity);
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
            String id = memoryStructure.saveWebEntity(webEntity);
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
            String id = memoryStructure.saveWebEntity(webEntity);
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
            String id = memoryStructure.saveWebEntity(webEntity);
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

            String id = memoryStructure.saveWebEntity(webEntity);
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            WebEntity retrieved = memoryStructure.getWebEntity(id);
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
            WebEntity retrieved = memoryStructure.getWebEntity("there-is-no-webentity-with-this-id");
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

            String id = memoryStructure.saveWebEntity(webEntity);
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            WebEntity retrieved = memoryStructure.getWebEntity(id);
            assertNotNull("could not retrieve webentity", retrieved);

            // check size of lrulist before adding
            assertEquals("unexpected size of lrulist", 1, retrieved.getLRUlist().size());

            retrieved.getLRUlist().add("fr|sciencespo|www");
            String newid = memoryStructure.saveWebEntity(retrieved);

            assertEquals("Failed to update webentity, id has changed", id, newid);

            retrieved = memoryStructure.getWebEntity(id);

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

            String id = memoryStructure.saveWebEntity(webEntity);
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            memoryStructure.addLRUtoWebEntity(id, new PageItem().setLru("fr|sciencespo|www"));

            WebEntity retrieved = memoryStructure.getWebEntity(id);
            assertNotNull("could not retrieve webentity", retrieved);

            // check size of lrulist after adding
            assertEquals("unexpected size of lrulist", 2, retrieved.getLRUlist().size());

        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
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

            String id = memoryStructure.saveWebEntity(webEntity);
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            // store 2nd webentity
            WebEntity webEntity2 = new WebEntity();
            webEntity2.setName("SCIENCES PO2");
            Set<String> lruList2 = new HashSet<String>();
            lruList2.add("fr|sciences-po2|www");
            webEntity2.setLRUlist(lruList2);

            String id2 = memoryStructure.saveWebEntity(webEntity2);
            assertNotNull("storeWebEntity returned null id", id2);
            logger.debug("storeWebEntity indexed web entity with id: " + id2);

             // retrieve them
            Set<WebEntity> webEntities = memoryStructure.getWebEntities();
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
            Set<WebEntity> webEntities = memoryStructure.getWebEntities();
            assertEquals("Unexpected number of retrieved webentities", 0, webEntities.size());
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
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
    public void testStoreWebEntityCreationRule() {
        try {
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU("s:http|h:fr|h:sciences-po");
            webEntityCreationRule.setRegExp("(s:http|h:fr|h:sciences-po|(h:www|)?p:.*?\\|).*");
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule);
            assertTrue("If we got here no exception was thrown", true);
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }

    /**
     * Tests storing a WebEntity Creation Rule that has null properties.
     *
     * @throws Exception hmm
     */
    public void testStoreWebEntityCreationRuleNullProperties()  {
        try {
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule);
            fail("Expected exception was not thrown");
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            logger.error(x.getMessage());
            assertTrue("Unexpected exception message", x.getMsg().contains("WebEntityCreationRule has null properties"));
        }
    }

    /**
     * Tests storing a WebEntity Creation Rule that's null.
     *
     * @throws Exception
     */
    public void testStoreWebEntityCreationRuleNull() {
        try {
            WebEntityCreationRule webEntityCreationRule = null;
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule);
            fail("Expected exception was not thrown");
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            logger.error(x.getMessage());
            assertTrue("Unexpected exception message", x.getMsg().contains("WebEntityCreationRule is null"));
        }
    }


    /**
     * Tests retrieving PrecisionException from cache.
     *
     * @throws Exception hmm
     */
    public void testGetPrecisionExceptionsFromCache() throws Exception {
        /** TODO new API
        //
        // first, create and populate a cache
        //
        Set<PageItem> lruItems = new HashSet<PageItem>();
        PageItem lruItem1 = new PageItem().setLru("1");
        PageItem lruItem2 = new PageItem().setLru("2");
        PageItem lruItem3 = new PageItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        String id = memoryStructure.createCache(lruItems);
        logger.debug("created cache with id " + id);
        //
        // Add a Precision Exception
        //
        String precisionException = "2";
        int status = memoryStructure.PrecisionException(precisionException);
        // verify it was saved succesfully
        assertEquals("Unexpected status: " + status, 0, status);

        List<String> precisionExceptionsFromCache = memoryStructure.getPrecisionExceptionsFromCache(id);

        assertNotNull("Received null PrecisionExceptions from cache", precisionException);
        assertEquals("Unexpected number of precision exceptions from cache", 1, precisionExceptionsFromCache.size());
        String retrievedPrecisionException = precisionExceptionsFromCache.get(0);
        assertEquals("Unexpted PrecisionException from cache", "2", retrievedPrecisionException);

         **/

    }

    /**
     * Tests retrieving precisionException from cache, but it's a node, so it should not be returned.
     *
     * @throws Exception hmm
     */
    public void testGetPrecisionExceptionsNodeFromCache() throws Exception {
        /** TODO new API
        //
        // first, create and populate a cache
        //
        List<PageItem> lruItems = new ArrayList<PageItem>();
        PageItem lruItem1 = new PageItem().setLru("1");
        PageItem lruItem2 = new PageItem().setLru("2");
        // set isNode true
        lruItem2.setIsNode(true);
        PageItem lruItem3 = new PageItem().setLru("3");
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

         */
    }

    /**
     * Tests retrieving PrecisionException from cache with a null input.
     *
     * @throws Exception hmm
     */
    public void testGetPrecisionExceptionsFromCacheNullInput() throws Exception {
        /* TODO new API
        //
        // first, create and populate a cache
        //
        List<PageItem> lruItems = new ArrayList<PageItem>();
        PageItem lruItem1 = new PageItem().setLru("1");
        PageItem lruItem2 = new PageItem().setLru("2");
        PageItem lruItem3 = new PageItem().setLru("3");
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

        */
    }

}