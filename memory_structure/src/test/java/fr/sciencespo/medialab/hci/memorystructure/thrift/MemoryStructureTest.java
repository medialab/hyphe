package fr.sciencespo.medialab.hci.memorystructure.thrift;

import fr.sciencespo.medialab.hci.memorystructure.index.IndexConfiguration;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import junit.framework.Assert;
import junit.framework.TestCase;
import org.apache.commons.collections.CollectionUtils;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.thrift.TException;

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

    private static DynamicLogger logger = new DynamicLogger(MemoryStructureTest.class, DynamicLogger.LogLevel.DEBUG);

    private MemoryStructureImpl memoryStructure ;

    //
    // integration (scenario) tests :
    //

    /**
     * Tests this scenario: http://jiminy.medialab.sciences-po.fr/hci/index.php/First_prototype_basic_user_scenario (as
     * far as the Memory Structure is concerned by it).
     */
    public void testBasicUserScenario() {
        logger.info("testBasicUserScenario");
        try {
            //
            // configuration of the corpus
            //

            // 1. admin set the precision limit in core.settings.py
            // this is not persisted in the Memory Structure

            // 2. admin set the default web entity creation rule in core.settings.py
            // .. and stores it in the Memory Structure:
            WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
            defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
            // regexp to match all sub domains
            defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            memoryStructure.saveWebEntityCreationRule(defaultWebEntityCreationRule);

            //
            //creating a corpus
            //

            // 1. the user add pages to the corpus (system will apply the default creation rule)

            PageItem p1 = new PageItem();
            p1.setLru("s:http|h:www|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php");

            PageItem p2 = new PageItem();
            p2.setLru("s:http|h:www|h:fr|h:sciencespo|h:medialab|h:jiminy|p:hci|p:contact.html");

            PageItem p3 = new PageItem();
            p3.setLru("s:http|h:www|h:fr|h:sciences-po");

            PageItem p4 = new PageItem();
            p4.setLru("s:http|h:www|h:fr|h:sciences-po|p:this-page-should-not-trigger-new-web-entity.php");

            List<PageItem> pages = new ArrayList<PageItem>();
            pages.add(p1);
            pages.add(p2);
            pages.add(p3);
            pages.add(p4);

            /* TODO should we remove the option to bypass the cache ?
            // without using cache
            memoryStructure.savePageItems(pages);
            */

            // create cache containing these pages
            String cacheId = memoryStructure.createCache(pages);

            // create WebEntities from pages in cache
            memoryStructure.createWebEntities(cacheId);
            List<WebEntity> indexedWEs = memoryStructure.getWebEntities();
            assertEquals("Unexpected # of web entities", 3, indexedWEs.size());

            // create web entities from cache again: should not create any more WEs
            memoryStructure.createWebEntities(cacheId);
            indexedWEs = memoryStructure.getWebEntities();
            assertEquals("Unexpected # of web entities", 3, indexedWEs.size());

            // store nodelinks in cache

            NodeLink l1 = new NodeLink();
            l1.setSourceLRU("s:http|h:www|h:fr|h:sciences-po");
            l1.setTargetLRU("s:http|h:www|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php");
            NodeLink l2 = new NodeLink();
            l2.setSourceLRU("s:http|h:www|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php");
            l2.setTargetLRU("s:http|h:www|h:fr|h:sciencespo|h:medialab|h:jiminy|p:hci|p:contact.html");
            NodeLink l3 = new NodeLink();
            l3.setSourceLRU("s:http|h:www|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php");
            l3.setTargetLRU("s:http|h:www|h:fr|h:sciences-po");
            NodeLink l4 = new NodeLink();
            l4.setSourceLRU("s:http|h:www|h:fr|h:sciencespo|h:medialab|h:jiminy|p:hci|p:contact.html");
            l4.setTargetLRU("s:http|h:www|h:fr|h:sciences-po");

            List<NodeLink> nodeLinks = new ArrayList<NodeLink>();
            nodeLinks.add(l1);
            nodeLinks.add(l2);
            nodeLinks.add(l3);
            nodeLinks.add(l4);
            memoryStructure.saveNodeLinks(nodeLinks);

            // index the cache
            memoryStructure.indexCache(cacheId);

        }
        catch(ObjectNotFoundException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch(MemoryStructureException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch(TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        finally {
            logger.info("end testBasicUserScenario");
        }
    }



    //
    // unit tests :
    //

    //
    // cache tests
    //

    /**
     * Tests creating a cache for a list of PageItems.
     *
     */
    public void testCreateCache() {
        logger.info("testCreateCache");
        try {
            List<PageItem> lruItems = new ArrayList<PageItem>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciencespo|h:medialab");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            String id = memoryStructure.createCache(lruItems);
            logger.debug("created cache with id " + id);
            assertTrue("No exception occurred when we got here", true);
        }
        catch (MemoryStructureException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        finally {
            logger.info("end testCreateCache");
        }
    }

    /**
     * Tests createCache() with null input.
     *
     */
    public void testCreateCacheNullInput() {
        logger.info("testCreateCacheNullInput");
        try {
            List<PageItem> lruItems = null;
            String id = memoryStructure.createCache(lruItems);
            fail("Expected MemoryStructureException that was not thrown");
        }
        catch (MemoryStructureException x) {
            assertEquals("Unexpected exception message", "WARNING: createCache received null pageItems. No cache created.", x.getMsg());
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        finally {
            logger.info("end testCreateCacheNullInput");
        }
    }

    /**
     * Tests indexing a cache.
     *
     */
    public void testIndexCache() {
        logger.info("testIndexCache");
        try {
            //
            // first, create and populate a cache
            //
            List<PageItem> lruItems = new ArrayList<PageItem>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            String id = memoryStructure.createCache(lruItems);
            logger.debug("created cache with id " + id);
            //
            // index this cache
            //
            memoryStructure.indexCache(id);
            assertTrue("No exception occurred when we got here", true);
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
        finally {
            logger.info("end testIndexCache");
        }
    }

    /**
     * Tests deleting a cache.
     *
     */
    public void testDeleteCache() {
        logger.info("testDeleteCache");
        try {
            //
            // first, create and populate a cache
            //
            List<PageItem> lruItems = new ArrayList<PageItem>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciencespo|h:medialab");
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
        finally {
            logger.info("end testDeleteCache");
        }
    }

    /**
     * Tests deleting a cache that doesn't exist.
     *
     */
    public void testDeleteNonExistingCache() {
        logger.info("testDeleteNonExistingCache");
        try {
            String id = "There-is-no-cache-with-this-id";
            //
            // delete this cache
            //
            memoryStructure.deleteCache(id);
            fail("Expected ObjectNotFoundException");
        }
        catch (ObjectNotFoundException x) {
            logger.error(x.getMsg());
            assertTrue("ObjectNotFoundException has unexpected message", x.getMsg().startsWith("Failed to find cache with id:"));
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        finally {
            logger.info("end testDeleteNonExistingCache");
        }
    }

    //
    // WebEntity tests
    //

    /**
     * Tests storing a new webentity.
     */
    public void testStoreNewWebEntity() {
        logger.info("testStoreNewWebEntity");
        try {
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            Set<String> lruList = new HashSet<String>();
            lruList.add("s:http|h:fr|h:sciences-po");
            lruList.add("s:http|h:fr|h:sciencespo");
            webEntity.setLRUSet(lruList);

            String id = memoryStructure.createWebEntity(webEntity.getName(), webEntity.getLRUSet()).getId();
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);
        }
        catch (MemoryStructureException x) {
            fail(x.getMessage());
        }
        finally {
            logger.info("end testStoreNewWebEntity");
        }
    }

    /**
     * Tests storing a webentity with null properties. Note that id and name may be null without problem: a null id
     * indicates creating a new webentity, and name is optional. Only lrulist may not be null.
     */
    public void testStoreWebEntityNullProperties() {
        logger.info("testStoreWebEntityNullProperties");
        try {
            WebEntity webEntity = new WebEntity();
            String id = memoryStructure.createWebEntity(webEntity.getId(), webEntity.getLRUSet()).getId();
            fail("Exception was expected, but not thrown: saved WebEntity with id " + id);
        }
        catch (MemoryStructureException x) {
            assertEquals("Expected exception about null webentity", "WebEntity has empty lru set", x.getMsg());
        }
        finally {
            logger.info("end testStoreWebEntityNullProperties");
        }
    }

    /**
     * Tests storing a webentity with empty lru list.
     */
    public void testStoreWebEntityEmptyLRUList() {
        logger.info("testStoreWebEntityEmptyLRUList");
        try {
            WebEntity webEntity = new WebEntity();
            Set<String> lruList = new HashSet<String>();
            webEntity.setLRUSet(lruList);
            String id = memoryStructure.createWebEntity(webEntity.getId(), webEntity.getLRUSet()).getId();
            fail("Exception was expected, but not thrown. Saved WebEntity with id " + id);
        }
        catch (MemoryStructureException x) {
            assertEquals("Expected exception about null webentity", "WebEntity has empty lru set", x.getMsg());
        }
        finally {
            logger.info("end testStoreWebEntityEmptyLRUList");
        }
    }

    /**
     * Tests storing a null webentity.
     */
    public void testStoreNullWebEntity() {
        logger.info("testStoreNullWebEntity");
        try {
            String id = memoryStructure.createWebEntity(null, null).getId();
            fail("Exception was expected, but not thrown. Saved WebEntity with id " + id);
        }
        catch (MemoryStructureException x) {
            assertEquals("Expected exception about null webentity", "WebEntity has empty lru set", x.getMsg());
        }
        finally {
            logger.info("end testStoreNullWebEntity");
        }
    }

    /**
     * Tests retrieving a stored WebEntity.
     */
    public void testRetrieveWebEntityById() {
        logger.info("testRetrieveWebEntityById");
        try {
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            Set<String> lruList = new HashSet<String>();
            lruList.add("s:http|h:fr|h:sciences-po");
            lruList.add("s:http|h:fr|h:sciencespo");
            webEntity.setLRUSet(lruList);

            String id = memoryStructure.createWebEntity(webEntity.getName(), webEntity.getLRUSet()).getId();
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            WebEntity retrieved = memoryStructure.getWebEntity(id);
            assertNotNull("could not retrieve webentity", retrieved);
            assertEquals("unexpected webentity name", retrieved.getName(), webEntity.getName());
            for(String lru : webEntity.getLRUSet()) {
                assertTrue("WebEntity does not contain expected LRU", retrieved.getLRUSet().contains(lru));
            }
        }
        catch (MemoryStructureException x) {
            fail(x.getMessage());
        }
        catch (ObjectNotFoundException x) {
            fail(x.getMessage());
        }
        finally {
            logger.info("end testRetrieveWebEntityById");
        }
    }

    /**
     * Tests retrieving a WebEntity that does not exist.
     */
    public void testRetrieveNonExistingWebEntity() {
        logger.info("testRetrieveNonExistingWebEntity");
        try {
            WebEntity retrieved = memoryStructure.getWebEntity("there-is-no-webentity-with-this-id");
            fail("Expected ObjectNotFoundException but it wasn't thrown");
        }
        catch (ObjectNotFoundException x) {
            assertTrue("Unexpected exception message ", x.getMsg().startsWith("Could not find WebEntity with id"));
        }
        catch (MemoryStructureException x) {
            logger.error(x.getMsg());
            x.printStackTrace();
            fail(x.getMsg());
        }
        finally {
            logger.info("end testRetrieveNonExistingWebEntity");
        }
    }

    /**
     * Tests adding a LRU to a stored WebEntity.
     */
    public void testAddLRUtoWebEntity() {
        logger.info("testAddLRUtoWebEntity");
        try {
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            webEntity.addToLRUSet("s:http|h:fr|h:sciences-po");

            String id = memoryStructure.createWebEntity(webEntity.getName(), webEntity.getLRUSet()).getId();
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            WebEntity retrieved = memoryStructure.getWebEntity(id);
            assertNotNull("could not retrieve webentity", retrieved);

            // check size of lrulist before adding
            assertEquals("unexpected size of lrulist", 1, retrieved.getLRUSet().size());

            retrieved.addToLRUSet("s:http|h:fr|h:sciencespo");
            String newid = memoryStructure.updateWebEntity(retrieved);

            assertEquals("Failed to update webentity, id has changed", id, newid);

            retrieved = memoryStructure.getWebEntity(id);

            // check size of lrulist after adding
            assertEquals("unexpected size of lrulist", 2, retrieved.getLRUSet().size());

        }
        catch (MemoryStructureException x) {
            fail(x.getMsg());
        }
        catch (ObjectNotFoundException x) {
            fail(x.getMsg());
        }
        finally {
            logger.info("end testAddLRUtoWebEntity");
        }
    }

    /**
     * Tests adding a LRU to a stored WebEntity using the shortcut method.
     */
    public void testAddLRUtoWebEntity2() {
        logger.info("testAddLRUtoWebEntity2");
        try {
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            webEntity.addToLRUSet("s:http|h:fr|h:sciences-po");

            String id = memoryStructure.createWebEntity(webEntity.getName(), webEntity.getLRUSet()).getId();
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            memoryStructure.addAliastoWebEntity(id, "s:http|h:fr|h:sciencespo");

            WebEntity retrieved = memoryStructure.getWebEntity(id);
            assertNotNull("could not retrieve webentity", retrieved);

            // check size of lrulist after adding
            assertEquals("unexpected size of lrulist", 2, retrieved.getLRUSet().size());

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
        catch (ObjectNotFoundException x) {
            fail(x.getMessage());
        }
        finally {
            logger.info("end testAddLRUtoWebEntity2");
        }
    }

    /**
     * Tests retrieving all webentities from the index when there are none.
     *
     */
    public void testRetrievingAllWebEntitiesWhenThereAreNone() {
        logger.info("testRetrievingAllWebEntitiesWhenThereAreNone");
        try {
             // retrieve them
            List<WebEntity> webEntities = memoryStructure.getWebEntities();
            assertEquals("Unexpected number of retrieved webentities", 0, webEntities.size());
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        finally {
            logger.info("end testRetrievingAllWebEntitiesWhenThereAreNone");
        }
    }

    /**
     * Tests retrieving all webentities from the index.
     *
     */
    public void testRetrievingAllWebEntities() {
        logger.info("testRetrievingAllWebEntities");
        try {
            // store 1 webentity
            WebEntity webEntity = new WebEntity();
            webEntity.setName("SCIENCES PO");
            Set<String> lruList = new HashSet<String>();
            lruList.add("s:http|h:fr|h:sciences-po");
            webEntity.setLRUSet(lruList);

            String id = memoryStructure.createWebEntity(webEntity.getName(), webEntity.getLRUSet()).getId();
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            // store 2nd webentity
            WebEntity webEntity2 = new WebEntity();
            webEntity2.setName("SCIENCES PO2");
            Set<String> lruList2 = new HashSet<String>();
            lruList2.add("s:http|h:fr|h:sciencespo");
            webEntity2.setLRUSet(lruList2);

            String id2 = memoryStructure.createWebEntity(webEntity2.getName(), webEntity2.getLRUSet()).getId();
            assertNotNull("storeWebEntity returned null id", id2);
            logger.debug("storeWebEntity indexed web entity with id: " + id2);

             // retrieve them
            List<WebEntity> webEntities = memoryStructure.getWebEntities();
            assertEquals("Unexpected number of retrieved webentities", 2, webEntities.size());
        }
        catch (TException x) {
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            fail(x.getMessage());
        }
        finally {
            logger.info("end testRetrievingAllWebEntities");
        }
    }

    public void testGetPagesFromWebEntity() {
        logger.info("testGetPagesFromWebEntity");
        try {
            // store 1 webentity
            WebEntity webEntity = new WebEntity();
            webEntity.setName("medialab.sciences-po.fr");
            Set<String> lruList = new HashSet<String>();
            lruList.add("s:http|h:fr|h:sciences-po|h:medialab");
            webEntity.setLRUSet(lruList);

            String id = memoryStructure.createWebEntity(webEntity.getName(), webEntity.getLRUSet()).getId();
            assertNotNull("storeWebEntity returned null id", id);
            logger.debug("storeWebEntity indexed web entity with id: " + id);

            // store 2nd webentity
            WebEntity webEntity2 = new WebEntity();
            webEntity2.setName("jiminy.medialab.sciences-po.fr");
            Set<String> lruList2 = new HashSet<String>();
            lruList2.add(" s:http|h:fr|h:sciences-po|h:medialab|h:jiminy");
            webEntity2.setLRUSet(lruList2);

            String id2 = memoryStructure.createWebEntity(webEntity2.getName(), webEntity2.getLRUSet()).getId();
            assertNotNull("storeWebEntity returned null id", id2);
            logger.debug("storeWebEntity indexed web entity with id: " + id2);

            // store 3rd webentity
            WebEntity webEntity3 = new WebEntity();
            webEntity3.setName("hci wiki");
            Set<String> lruList3 = new HashSet<String>();
            lruList3.add("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci");
            lruList3.add("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php");
            webEntity3.setLRUSet(lruList3);

            String id3 = memoryStructure.createWebEntity(webEntity3.getName(), webEntity3.getLRUSet()).getId();
            assertNotNull("storeWebEntity returned null id", id3);
            logger.debug("storeWebEntity indexed web entity with id: " + id3);

            // retrieve them
            List<WebEntity> webEntities = memoryStructure.getWebEntities();
            assertEquals("Unexpected number of retrieved webentities", 3, webEntities.size());

            List<PageItem> pages1 = memoryStructure.getPagesFromWebEntity(id3);
            for(PageItem pageItem : pages1) {
                logger.debug(pages1.toString());
            }
        }
        catch (TException x) {
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            fail(x.getMessage());
        }
        catch (ObjectNotFoundException x) {
            fail(x.getMessage());
        }
        finally {
            logger.info("end testGetPagesFromWebEntity");
        }
    }


    //
    // WebEntity Creation Rule tests
    //

    /**
     * Tests storing a WebEntity Creation Rule.
     *
     */
    public void testStoreWebEntityCreationRule() {
        logger.info("testStoreWebEntityCreationRule");
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
        finally {
            logger.info("end testStoreWebEntityCreationRule");
        }
    }

    public void testStoreDefaultWebEntityCreationRule() {
        logger.info("testStoreDefaultWebEntityCreationRule");
        try {
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU(null);
            webEntityCreationRule.setRegExp("(s:http|h:fr|h:sciences-po|(h:www|)?p:.*?\\|).*");
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule);

            List<WebEntityCreationRule> results = memoryStructure.getWebEntityCreationRules();
            assertEquals("Unexpected # of WebEntityCreationRules", 1, results.size());

            WebEntityCreationRule retrieved = results.iterator().next();
            Assert.assertEquals("Unexpected LRU for default webentitycreationrule", IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE, retrieved.getLRU());
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
        finally {
            logger.info("end testStoreDefaultWebEntityCreationRule");
        }
    }

    /**
     * There should be only 1 default webentitycreationrule.
     */
    public void testStoreDefaultWebEntityCreationRuleUnicity() {
        logger.info("testStoreDefaultWebEntityCreationRuleUnicity");
        try {
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU(null);
            webEntityCreationRule.setRegExp("(s:http|h:fr|h:sciences-po|(h:www|)?p:.*?\\|).*");
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule);

            WebEntityCreationRule webEntityCreationRule2 = new WebEntityCreationRule();
            webEntityCreationRule2.setLRU(null);
            webEntityCreationRule2.setRegExp("(s:http|h:com|h:megaupload|(h:www|)?p:.*?\\|).*");
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule2);

            List<WebEntityCreationRule> results = memoryStructure.getWebEntityCreationRules();
            assertEquals("Unexpected # of WebEntityCreationRules", 1, results.size());

            WebEntityCreationRule retrieved = results.iterator().next();
            assertEquals("Unexpected LRU for default webentitycreationrule", IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE, retrieved.getLRU());
            assertEquals("Unexpected regexp", retrieved.getRegExp(), webEntityCreationRule2.getRegExp());

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
        finally {
            logger.info("end testStoreDefaultWebEntityCreationRuleUnicity");
        }
    }

    /**
     * Tests storing a WebEntity Creation Rule that has null properties.
     *
     */
    public void testStoreWebEntityCreationRuleNullProperties()  {
        logger.info("testStoreWebEntityCreationRuleNullProperties");
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
        finally {
            logger.info("end testStoreWebEntityCreationRuleNullProperties");
        }
    }

    /**
     * Tests storing a WebEntity Creation Rule that's null.
     *
     */
    public void testStoreWebEntityCreationRuleNull() {
        logger.info("testStoreWebEntityCreationRuleNull");
        try {
            WebEntityCreationRule webEntityCreationRule = null;
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule);
            fail("Expected exception was not thrown");
        }
        catch (MemoryStructureException x) {
            assertTrue("Unexpected exception message", x.getMsg().contains("webEntityCreationRule is null"));
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        finally {
            logger.info("end testStoreWebEntityCreationRuleNull");
        }
    }


    /**
     * Tests retrieving WebEntityCreationRules from the index.
     */
    public void testRetrieveWebEntityCreationRules() {
        logger.info("testRetrieveWebEntityCreationRules");
        try {
            // store default WebEntityCreationRule
            WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
            defaultWebEntityCreationRule.setRegExp("(s:.*?\\|(h:.*?\\|)*?(h:.*?$)?)\\|?(p.*)?$");
            memoryStructure.saveWebEntityCreationRule(defaultWebEntityCreationRule);
            // store another WebEntityCreationRule
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU("s:http|h:fr|h:sciences-po");
            webEntityCreationRule.setRegExp("(s:http|h:fr|h:sciences-po|(h:www|)?p:.*?\\|).*");
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule);

            List<WebEntityCreationRule> results = memoryStructure.getWebEntityCreationRules();
            assertEquals("Unexpected # of WebEntityCreationRules", 2, results.size());

            for(WebEntityCreationRule result : results) {
                if(result.getLRU().equals(webEntityCreationRule.getLRU())) {
                    assertEquals("Unexpected regexp", webEntityCreationRule.getRegExp(), result.getRegExp());
                }
                else {
                    assertEquals("Unexpected regexp", defaultWebEntityCreationRule.getRegExp(), result.getRegExp());
                }
                if(result.getRegExp().equals(defaultWebEntityCreationRule.getRegExp())) {
                    assertEquals("Unexpected LRU for default webentitycreationrule", IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE, result.getLRU());
                }
            }

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
        finally {
            logger.info("end testRetrieveWebEntityCreationRules");
        }
    }

    /**
     * Tests removing WebEntityCreationRules from the index.
     */
    public void testRemoveWebEntityCreationRules() {
        logger.info("testRemoveWebEntityCreationRules");
        try {
            // store default WebEntityCreationRule
            WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
            defaultWebEntityCreationRule.setRegExp("(s:.*?\\|(h:.*?\\|)*?(h:.*?$)?)\\|?(p.*)?$");
            memoryStructure.saveWebEntityCreationRule(defaultWebEntityCreationRule);
            // store another WebEntityCreationRule
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU("s:http|h:fr|h:sciences-po");
            webEntityCreationRule.setRegExp("(s:http|h:fr|h:sciences-po|(h:www|)?p:.*?\\|).*");
            memoryStructure.saveWebEntityCreationRule(webEntityCreationRule);

            List<WebEntityCreationRule> results = memoryStructure.getWebEntityCreationRules();
            assertEquals("Unexpected # of WebEntityCreationRules", 2, results.size());

            memoryStructure.deleteWebEntityCreationRule(webEntityCreationRule);

            results = memoryStructure.getWebEntityCreationRules();
            assertEquals("Unexpected # of WebEntityCreationRules", 1, results.size());

            if(CollectionUtils.isNotEmpty(results)) {
                // deleted the non-default one, so the result must be the default one
                WebEntityCreationRule result = results.iterator().next();
                assertEquals("Unexpected LRU for default webentitycreationrule", IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE, result.getLRU());
            }

            memoryStructure.deleteWebEntityCreationRule(defaultWebEntityCreationRule);

            results = memoryStructure.getWebEntityCreationRules();
            assertEquals("Unexpected # of WebEntityCreationRules", 0, results.size());

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
        finally {
            logger.info("end testRemoveWebEntityCreationRules");
        }
    }

    /**
     * Tests removing WebEntityCreationRule that does not exist from the index.
     */
    public void testRemoveNonExistingWebEntityCreationRule() {
        logger.info("testRemoveWebEntityCreationRules");
        try {

            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU("there is no WebEntityCreationRule with this 'LRU'");
            webEntityCreationRule.setRegExp("(s:http|h:fr|h:sciences-po|(h:www|)?p:.*?\\|).*");

            memoryStructure.deleteWebEntityCreationRule(webEntityCreationRule);

            List<WebEntityCreationRule> results = memoryStructure.getWebEntityCreationRules();
            assertEquals("Unexpected # of WebEntityCreationRules", 0, results.size());
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        finally {
            logger.info("end testRemoveWebEntityCreationRules");
        }
    }

    /**
     * Tests retrieving PrecisionException from cache.
     *
     */
    public void testGetPrecisionExceptionsFromCache() {
        logger.info("testGetPrecisionExceptionsFromCache");

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
    public void testGetPrecisionExceptionsNodeFromCache() {
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
    public void testGetPrecisionExceptionsFromCacheNullInput() {
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

    /**
     * Invoked before each test* method.
     */
    public void setUp() throws Exception{
        memoryStructure = new MemoryStructureImpl("luceneindex", IndexWriterConfig.OpenMode.CREATE);
        memoryStructure.clearIndex();
        try {
            logger.debug("## after clearing index: webentities in index: " + memoryStructure.getWebEntities().size());
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
        }
    }

    /**
     * Invoked after each test* method. Empties the index between tests.
     */
    public void tearDown() throws Exception {
        memoryStructure.clearIndex();
        try {
            logger.debug("# after clearing index: webentities in index: " + memoryStructure.getWebEntities().size());
        }
        catch (TException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
        }
        finally {
            logger.debug("\n\n\n");
        }
    }

}