package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.cache.Cache;
import fr.sciencespo.medialab.hci.memorystructure.cache.MaxCacheSizeException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructureException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.ObjectNotFoundException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityLink;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import fr.sciencespo.medialab.hci.util.LineFileReader;
import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;
import org.apache.lucene.index.IndexWriterConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Test LRUIndex.
 *
 * @author heikki doeleman
 */
public class LRUIndexTest extends TestCase {

    private static DynamicLogger logger = new DynamicLogger(LRUIndexTest.class, DynamicLogger.LogLevel.ERROR);
    LRUIndex lruIndex;

    /**
     * Invoked before each test* method.
     */
    public void setUp() {
        lruIndex = LRUIndex.getInstance("luceneindex", IndexWriterConfig.OpenMode.CREATE);
    }

    /**
     * Invoked after each test* method. Empties the index between tests.
     */
    public void tearDown() throws Exception {
        lruIndex.clearIndex();
    }

    /**
     * Tests clearing an empty index.
     *
     */
    public void testClearEmptyIndex() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            lruIndex.clearIndex();
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests clearing a non-empty index.
     *
     */
    public void testClearNonEmptyIndex() {
        try {
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            lruIndex.batchIndex(lruItems);
            lruIndex.clearIndex();
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests LRUIndex.indexCount().
     *
     */
    public void testIndexCount() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            lruIndex.batchIndex(lruItems);
            assertEquals("IndexCount returns unexpected number", 3, lruIndex.indexCount());
            //lruIndex.close();
            logger.info("testIndexCount success");
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
    }


    //
    // PageItem index tests.
    //


    /**
     * Tests retrieving PageItem using an exact match.
     *
     */
    public void testRetrievePageItem() {
        try {
            //
            // add 1 PageItem to a new index
            //
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruIndex.batchIndex(lruItems);

            // test if this PageItem can be found
            PageItem found = lruIndex.retrievePageItemByLRU("s:http|h:fr|h:sciences-po|h:medialab");
            assertNotNull("Could not retrieve expected object", found);

            //lruIndex.close();
            logger.info("testRetrievePageItem success");
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }

    }

    /**
     * Tests retrieving a non-existing PageItem, which shouldn't be found.
     *
     */
    public void testDonotRetrieveNonExistingPageItem() {
        try {
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruIndex.batchIndex(lruItems);
            PageItem found = lruIndex.retrievePageItemByLRU("s:http|h:fr|h:sciences-po|h:medialab|h:do-not-find-me");
            assertNull("Retrieved unexpected object", found);
            //lruIndex.close();
            logger.info("testDonotRetrieveNonExistingPageItem success");
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests retrieving PageItems using the multi-character '*' wildcard.
     *
     */
    public void testRetrievePageItemByPrefix() {
        try {
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruIndex.batchIndex(lruItems);
            PageItem found = lruIndex.retrievePageItemByLRU("s:http|h:fr|h:sciences-po*");
            assertNotNull("Could not retrieve expected object by wildcard", found);
            //lruIndex.close();
            logger.info("testRetrievePageItemByPrefix success");
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests retrieving PageItem using the single character '?' wildcard.
     *
     */
    public void testRetrievePageItemBySingleCharWildCard() {
        try {
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruIndex.batchIndex(lruItems);
            PageItem found = lruIndex.retrievePageItemByLRU("s:http|h:fr|h:scien?es-po|h:medialab");
            assertNotNull("Could not retrieve expected object by single character wildcard", found);
            //lruIndex.close();
            logger.info("testRetrievePageItemBySingleCharWildCard success");
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }

    }

    /**
     * Tests retrieving PageItems using the multi character '*' wildcard.
     *
     */
    public void testRetrievePageItemByMultiCharacterWildCard() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            lruIndex.batchIndex(lruItems);
            PageItem found = lruIndex.retrievePageItemByLRU("*");
            assertEquals("IndexCount returns unexpected number", 3, lruIndex.indexCount());
            //lruIndex.close();
            logger.info("testRetrievePageItemByMultiCharacterWildCard success");
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests indexing a new WebEntity.
     *
     */
    public void testIndexNewWebEntity() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            WebEntity webEntity = new WebEntity();
            webEntity.setName("new webentity");
            webEntity.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab");
            String id = lruIndex.indexWebEntity(webEntity);
            logger.debug("indexed webentity with id " + id);
            assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests indexing a new WebEntity that has LRUs that already exist in the index.
     *
     */
    public void testIndexNewWebEntityWithDuplicateLRUs() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            //
            // create pre-existing data
            //
            WebEntity preX = new WebEntity();
            preX.setName("pre-existing");
            preX.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab-one");
            preX.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab-two");
            preX.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab-three");

            lruIndex.indexWebEntity(preX);

            //
            // new one to add with dupe LRUs
            //
            WebEntity newWE = new WebEntity();
            newWE.setName("new");
            newWE.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab-one");
            newWE.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab-2");
            newWE.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab-three");

            lruIndex.indexWebEntity(newWE);

            fail("Expected InexException wasn't thrown");
        }
        catch (IndexException x) {
            assertTrue("Unexpected exception message", x.getMessage().startsWith("WebEntity contains already existing LRUs:"));
        }
    }

    /**
     * Tests adding a LRU to an existing WebEntity.
     *
     */
    public void testAddToExistingWebEntity() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());

            // create a webentity
            WebEntity webEntity = new WebEntity();
            webEntity.setName("new webentity");
            webEntity.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab");
            String id = lruIndex.indexWebEntity(webEntity);

            // add lru to this webentity
            String lruItem2 = "s:http|h:fr|h:sciences-po|h:www";
            String id2 = lruIndex.indexWebEntity(id, lruItem2);

            assertEquals("update existing webentity returns unexpected id", id, id2);
            assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());

            WebEntity retrieved = lruIndex.retrieveWebEntity(id);
            assertNotNull("failed to retrieve existing webentity", webEntity);
            if(retrieved != null) {
                int lruListSize = retrieved.getLRUSetSize();
                assertEquals("unexpected webentity lrulist size", 2, lruListSize);
            }
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
        catch (ObjectNotFoundException x) {
            fail(x.getMsg());
        }
    }

    /**
     *  Tests adding a LRU to an 'existing' WebEntity that does not actually exist -- in this case, a new WebEntity
     *  is created.
     *
     */
    public void testAddToExistingWebEntityThatDoesNotActuallyExist() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            String nonExistingId = "there-is-no-webentity-with-this-id";
            String id = lruIndex.indexWebEntity(nonExistingId, "s:http|h:fr|h:sciences-po|h:medialab");
            fail("Expected ObjectNotFoundException wasn't thrown");
        }
        catch (ObjectNotFoundException e) {
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
    }

    /**
     * Tests finding web entities that match a page lru.
     */
    public void testFindMatchingWebEntitiesLRUPrefixes() {
        try {
            logger.debug("\n\n\ntestFindMatchingWebEntitiesLRUPrefixes\n\n");
            String pageLRU = "s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php|q:title=Reverse_URLs|r:bottom";

            // these 3 match

            WebEntity webEntity1 = new WebEntity();
            webEntity1.addToLRUSet("s:http|h:fr|h:sciences-po");
            webEntity1.setName("1");
            lruIndex.indexWebEntity(webEntity1);
            WebEntity webEntity2 = new WebEntity();
            webEntity2.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy");
            webEntity2.setName("2");
            lruIndex.indexWebEntity(webEntity2);
            WebEntity webEntity3 = new WebEntity();
            webEntity3.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php");
            webEntity3.setName("3");
            lruIndex.indexWebEntity(webEntity3);

            // these 2 don't match

            WebEntity webEntity4 = new WebEntity();
            webEntity4.addToLRUSet("s:http|h:fr|h:sciencespo|h:medialab|h:jiminy");
            webEntity4.setName("4");
            lruIndex.indexWebEntity(webEntity4);
            WebEntity webEntity5 = new WebEntity();
            webEntity5.addToLRUSet("s:http|h:com|h:sciencespo|h:medialab|h:jiminy");
            webEntity5.setName("5");
            lruIndex.indexWebEntity(webEntity5);

            Map<String, Set<WebEntity>> results = lruIndex.findMatchingWebEntityLRUPrefixes(pageLRU);

            assertEquals("Unexpected # of matching WebEntity LRUPrefixes", 3, results.size());

            for(String matchingPrefix : results.keySet()) {
                String matchingWebEntityName = results.get(matchingPrefix).iterator().next().getName();
                assertTrue("Unexpected matching WebEntity for matching prefix " + matchingPrefix, Arrays.asList(new String[] {"1", "2", "3"}).contains(matchingWebEntityName));
            }
        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
    }

    public void testRetrievePageItemsByLRUPrefix() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            lruIndex.batchIndex(lruItems);

            Set<PageItem> result = lruIndex.retrievePageItemsByLRUPrefix("s:http|h:fr|h:sciences-po*");
            assertNotNull("retrievePageItemsByLRUPrefix returned null", result);
            assertEquals("Unexpected # of pageitems", 2, result.size());
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }

    public void testRetrievePageItemsByLRUPrefixNullInput() {
        try {
            Set<PageItem> result = lruIndex.retrievePageItemsByLRUPrefix(null);
            assertNotNull("retrievePageItemsByLRUPrefix returned null", result);
            assertEquals("Unexpected # of pageitems", 0, result.size());
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }

    public void testRetrievePageItemsByLRUPrefixEmptyInput() {
        try {
            Set<PageItem> result = lruIndex.retrievePageItemsByLRUPrefix("");
            assertNotNull("retrievePageItemsByLRUPrefix returned null", result);
            assertEquals("Unexpected # of pageitems", 0, result.size());
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }


    public void testIndexWebEntityCreationRule() {
        try {
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU("s:http|h:fr|h:sciences-po");
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);
            assertTrue("Unexpected exception was thrown", true);
            assertEquals("Unexpected # of web entity creation rules", 1, lruIndex.retrieveWebEntityCreationRules().size());
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }

    public void testIndexWebEntityCreationRuleWithExistingPrefix() {
        try {
            // create pre-existing data
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU("s:http|h:fr|h:sciences-po");
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);

            // create new data
            WebEntityCreationRule webEntityCreationRule2 = new WebEntityCreationRule();
            webEntityCreationRule2.setLRU("s:http|h:fr|h:sciences-po");
            webEntityCreationRule2.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule2);

            fail("Expected IndexException wasn't thrown");
        }
        catch (IndexException x) {
            assertEquals("Unexpected exception message", "WebEntityCreationRule has already existing LRU prefix: s:http|h:fr|h:sciences-po", x.getMessage());
        }
    }

    public void testIndexWebEntityCreationRuleWithNullInput() {
        try {
            lruIndex.indexWebEntityCreationRule(null);
            fail("Expected IndexException wasn't thrown");
        }
        catch (IndexException x) {
            assertEquals("Unexpected exception message", "webEntityCreationRule is null", x.getMessage());
        }
    }

    public void testIndexWebEntityCreationRuleWithEmptyInput() {
        try {
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);
            fail("Expected IndexException wasn't thrown");
        }
        catch (IndexException x) {
            assertEquals("Unexpected exception message", "WebEntityCreationRule has null properties", x.getMessage());
        }
    }

    public void testFindPagesForWebEntity() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            lruIndex.batchIndex(lruItems);

            WebEntity webEntity = new WebEntity();
            webEntity.setName("Sciences Po");
            webEntity.addToLRUSet("s:http|h:fr|h:sciences-po");
            String id = lruIndex.indexWebEntity(webEntity);

            List<PageItem> result = lruIndex.findPagesForWebEntity(id);
            assertNotNull("findPagesForWebEntity returned null", result);
            assertEquals("Unexpected # of pageitems", 2, result.size());
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (ObjectNotFoundException x) {
            logger.error(x.getMsg());
            x.printStackTrace();
            fail(x.getMsg());
        }
    }

    public void testFindPagesForSubWebEntity() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            lruIndex.batchIndex(lruItems);

            WebEntity webEntity1 = new WebEntity();
            webEntity1.setName("medialab.sciences-po.fr");
            webEntity1.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab");
            String id1 = lruIndex.indexWebEntity(webEntity1);

            WebEntity webEntity2 = new WebEntity();
            webEntity2.setName("jiminy.medialab.sciences-po.fr");
            webEntity2.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy");
            String id2 = lruIndex.indexWebEntity(webEntity2);

            WebEntity webEntity3 = new WebEntity();
            webEntity3.setName("hci wiki");
            webEntity3.addToLRUSet("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci");
            String id3 = lruIndex.indexWebEntity(webEntity3);

            List<PageItem> result1 = lruIndex.findPagesForWebEntity(id1);
            assertNotNull("findPagesForWebEntity returned null", result1);
            assertEquals("Unexpected # of pageitems", 1, result1.size());

            List<PageItem> result2 = lruIndex.findPagesForWebEntity(id2);
            assertNotNull("findPagesForWebEntity returned null", result2);
            assertEquals("Unexpected # of pageitems", 1, result2.size());

            List<PageItem> result3 = lruIndex.findPagesForWebEntity(id3);
            assertNotNull("findPagesForWebEntity returned null", result3);
            assertEquals("Unexpected # of pageitems", 1, result3.size());
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (ObjectNotFoundException x) {
            logger.error(x.getMsg());
            x.printStackTrace();
            fail(x.getMsg());
        }
    }


    public void testFindPagesForWebEntityNullInput() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            lruIndex.batchIndex(lruItems);

            WebEntity webEntity = new WebEntity();
            webEntity.setName("Sciences Po");
            webEntity.addToLRUSet("s:http|h:fr|h:sciences-po");
            String id = lruIndex.indexWebEntity(webEntity);

            List<PageItem> result = lruIndex.findPagesForWebEntity(null);
            assertNotNull("findPagesForWebEntity returned null", result);
            assertEquals("Unexpected # of pageitems", 0, result.size());
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (ObjectNotFoundException x) {
            logger.error(x.getMsg());
            x.printStackTrace();
            fail(x.getMsg());
        }
    }

    public void testFindPagesForWebEntityThatDoesntExist() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            List<Object> lruItems = new ArrayList<Object>();
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po");
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciencespo");
            PageItem lruItem3 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            lruItems.add(lruItem1);
            lruItems.add(lruItem2);
            lruItems.add(lruItem3);
            lruIndex.batchIndex(lruItems);

            WebEntity webEntity = new WebEntity();
            webEntity.setName("Sciences Po");
            webEntity.addToLRUSet("s:http|h:fr|h:sciences-po");
            String id = lruIndex.indexWebEntity(webEntity);

            List<PageItem> result = lruIndex.findPagesForWebEntity(id+id);
            fail("Expected ObjectNotFoundException but it wasn't thrown");
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (ObjectNotFoundException x) {
            assertTrue("Unexpected exception message", x.getMsg().startsWith("Could not find webentity with id:"));
        }
    }

    public void testSaveNodeLinks() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            NodeLink nodeLink1 = new NodeLink();
            nodeLink1.setSourceLRU("s:http|h:fr|h:sciences-po");
            nodeLink1.setTargetLRU("s:http|h:fr|h:sciencespo");

            NodeLink nodeLink2 = new NodeLink();
            nodeLink2.setSourceLRU("s:http|h:fr|h:sciences-po|h:medialab");
            nodeLink2.setTargetLRU("s:http|h:fr|h:sciences-po");

            NodeLink nodeLink3 = new NodeLink();
            nodeLink3.setSourceLRU("s:http|h:com|h:blogspot|h:myblog");
            nodeLink3.setTargetLRU("s:http|h:fr|h:sciences-po");

            List<Object> nodelinks = new ArrayList<Object>();
            nodelinks.add(nodeLink1);
            nodelinks.add(nodeLink2);
            nodelinks.add(nodeLink3);

            int indexed  = lruIndex.batchIndex(nodelinks);

            assertEquals("Unexpected number of indexed nodeLinks", 3, indexed);

            Set<NodeLink> retrieved = lruIndex.retrieveNodeLinks();

            assertNotNull("Retrieved NodeLinks is null", retrieved);
            assertEquals("Unexpected # of nodelinks retrieved", 3, retrieved.size());
            for(NodeLink retrievedNL : retrieved) {
                String source = retrievedNL.getSourceLRU();
                if(source.equals("s:http|h:fr|h:sciences-po")) {
                    assertEquals("Retrieved nodelink with unexpected target", "s:http|h:fr|h:sciencespo", retrievedNL.getTargetLRU());
                }
                else if(source.equals("s:http|h:fr|h:sciences-po|h:medialab")) {
                    assertEquals("Retrieved nodelink with unexpected target", "s:http|h:fr|h:sciences-po", retrievedNL.getTargetLRU());
                }
                else if(source.equals("s:http|h:com|h:blogspot|h:myblog")) {
                    assertEquals("Retrieved nodelink with unexpected target", "s:http|h:fr|h:sciences-po", retrievedNL.getTargetLRU());
                }
                else {
                    fail("Retrieved nodelink with unexpected source: " + source);
                }
            }

        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }

    public void testIncreaseNodeLinkWeight() {
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());

            NodeLink nodeLink1 = new NodeLink();
            nodeLink1.setSourceLRU("s:http|h:fr|h:sciences-po");
            nodeLink1.setTargetLRU("s:http|h:fr|h:sciencespo");

            NodeLink nodeLink2 = new NodeLink();
            nodeLink2.setSourceLRU("s:http|h:fr|h:sciences-po|h:medialab");
            nodeLink2.setTargetLRU("s:http|h:fr|h:sciences-po");

            NodeLink nodeLink3 = new NodeLink();
            nodeLink3.setSourceLRU("s:http|h:com|h:blogspot|h:myblog");
            nodeLink3.setTargetLRU("s:http|h:fr|h:sciences-po");

            List<Object> nodelinks = new ArrayList<Object>();
            nodelinks.add(nodeLink1);
            nodelinks.add(nodeLink2);
            nodelinks.add(nodeLink3);

            int indexed  = lruIndex.batchIndex(nodelinks);
            assertEquals("Unexpected number of indexed nodeLinks", 3, indexed);

            Set<NodeLink> retrieved = lruIndex.retrieveNodeLinks();
            assertNotNull("Retrieved NodeLinks is null", retrieved);
            assertEquals("Unexpected # of nodelinks retrieved", 3, retrieved.size());

            for(NodeLink retrievedNL : retrieved) {
                assertEquals("Unexpected weight", 1, retrievedNL.getWeight());
            }

            //
            // now index same nodelinks again. Weights should be 2 now.
            //

            indexed  = lruIndex.batchIndex(nodelinks);
            assertEquals("Unexpected number of indexed nodeLinks", 3, indexed);

            retrieved = lruIndex.retrieveNodeLinks();
            assertNotNull("Retrieved NodeLinks is null", retrieved);
            assertEquals("Unexpected # of nodelinks retrieved", 3, retrieved.size());

            for(NodeLink retrievedNL : retrieved) {
                assertEquals("Unexpected weight", 2, retrievedNL.getWeight());
            }


        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }

    public void testGeneratingWebEntityLinks() {
        logger.debug("testGeneratingWebEntityLinks");
        try {

            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            //
            // create some PageItems in cache
            //
            Cache cache = new Cache(lruIndex);
            List<PageItem> pages = new ArrayList<PageItem>();

            PageItem page1 = new PageItem().setLru("s:http|h:com|h:megaupload");
            PageItem page2 = new PageItem().setLru("s:http|h:com|h:napster");
            PageItem page3 = new PageItem().setLru("s:http|h:fr|h:google");
            pages.add(page1);
            pages.add(page2);
            pages.add(page3);
            cache.setPageItems(pages);
            //
            // create default webEntityCreationRule
            //
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
            // regexp to match all sub domains
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);


            //
            // generate WebEntities from the PageItems
            //
            int created = cache.createWebEntities();
            logger.debug("created # " + created + " web entities");

            //
            // create some NodeLinks
            //
            NodeLink nodeLink1 = new NodeLink();
            nodeLink1.setSourceLRU("s:http|h:fr|h:google");
            nodeLink1.setTargetLRU("s:http|h:com|h:megaupload");

            NodeLink nodeLink2 = new NodeLink();
            nodeLink2.setSourceLRU("s:http|h:fr|h:google");
            nodeLink2.setTargetLRU("s:http|h:com|h:napster");

            NodeLink nodeLink3 = new NodeLink();
            nodeLink3.setSourceLRU("s:http|h:com|h:napster");
            nodeLink3.setTargetLRU("s:http|h:com|h:megaupload");

            NodeLink nodeLink4 = new NodeLink();
            nodeLink4.setSourceLRU("s:http|h:com|h:napster|p:license.html");
            nodeLink4.setTargetLRU("s:http|h:com|h:megaupload");

            List<Object> nodelinks = new ArrayList<Object>();
            nodelinks.add(nodeLink1);
            nodelinks.add(nodeLink2);
            nodelinks.add(nodeLink3);
            nodelinks.add(nodeLink4);

            int indexed  = lruIndex.batchIndex(nodelinks);
            logger.debug("indexed # " + indexed + " node links");

            //
            // now index same nodelinks again. Weights should be 2 now.
            //
            indexed  = lruIndex.batchIndex(nodelinks);
            assertEquals("Unexpected number of indexed nodeLinks", 4, indexed);

            //
            // now index same nodelinks again. Weights should be 3 now.
            //
            indexed  = lruIndex.batchIndex(nodelinks);
            assertEquals("Unexpected number of indexed nodeLinks", 4, indexed);

            //
            // generate WebEntityLinks
            //
            lruIndex.generateWebEntityLinks();

            Set<WebEntityLink> indexedWebEntityLinks = lruIndex.retrieveWebEntityLinks();
            assertEquals("Unexpected # of webentitylinks", 3, indexedWebEntityLinks.size());
            // there are 2 nodelinks with weight 3 that caused just 1 webentitylink; so the webentity links
            // must be 3, but one of them must be 6
            boolean weight6seen = false;
            for(WebEntityLink webEntityLink : indexedWebEntityLinks) {
                int weight = webEntityLink.getWeight();
                if(! (weight == 3 || weight == 6)) {
                    fail("Unexpected webentitylink weight: " + weight);
                }
                if(weight == 6) {
                    weight6seen = true;
                }
            }
            if(! weight6seen) {
                fail("Did not find expected aggregated webentitylink weigth");
            }

        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MaxCacheSizeException x) {
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

    public void testGeneratingWebEntityLinkWithIncreasedWeights() {
        logger.debug("testGeneratingWebEntityLinks");
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            //
            // create some PageItems in cache
            //
            Cache cache = new Cache(lruIndex);
            List<PageItem> pages = new ArrayList<PageItem>();

            PageItem page1 = new PageItem().setLru("s:http|h:com|h:megaupload");
            PageItem page2 = new PageItem().setLru("s:http|h:com|h:napster");
            PageItem page3 = new PageItem().setLru("s:http|h:fr|h:google");
            pages.add(page1);
            pages.add(page2);
            pages.add(page3);
            cache.setPageItems(pages);
            //
            // create default webEntityCreationRule
            //
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
            // regexp to match all sub domains
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);


            //
            // generate WebEntities from the PageItems
            //
            int created = cache.createWebEntities();
            logger.debug("created # " + created + " web entities");

            //
            // create some NodeLinks
            //
            NodeLink nodeLink1 = new NodeLink();
            nodeLink1.setSourceLRU("s:http|h:fr|h:google");
            nodeLink1.setTargetLRU("s:http|h:com|h:megaupload");

            NodeLink nodeLink2 = new NodeLink();
            nodeLink2.setSourceLRU("s:http|h:fr|h:google");
            nodeLink2.setTargetLRU("s:http|h:com|h:napster");

            NodeLink nodeLink3 = new NodeLink();
            nodeLink3.setSourceLRU("s:http|h:com|h:napster");
            nodeLink3.setTargetLRU("s:http|h:com|h:megaupload");

            List<Object> nodelinks = new ArrayList<Object>();
            nodelinks.add(nodeLink1);
            nodelinks.add(nodeLink2);
            nodelinks.add(nodeLink3);

            int indexed  = lruIndex.batchIndex(nodelinks);
            logger.debug("indexed # " + indexed + " node links");

            //
            // generate WebEntityLinks
            //
            lruIndex.generateWebEntityLinks();

            assertEquals("Unexpected # of webentitylinks", 3, lruIndex.retrieveWebEntityLinks().size());

        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MaxCacheSizeException x) {
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

    public void testFindDefaultWECR() {
        logger.debug("testFindDefaultWECR");
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            //
            // create default webEntityCreationRule
            //
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
            // regexp to match all sub domains
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);

            WebEntityCreationRule retrieved = lruIndex.retrieveDefaultWECR();
            assertNotNull("Failed to retrieve default WECR", retrieved);


        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }


    }

    public void testGeneratingWebEntityLinksWhenThereAreNoNodeLinks() {
        logger.debug("testGeneratingWebEntityLinks");
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
            //
            // create some PageItems in cache
            //
            Cache cache = new Cache(lruIndex);
            List<PageItem> pages = new ArrayList<PageItem>();

            PageItem page1 = new PageItem().setLru("s:http|h:com|h:megaupload");
            PageItem page2 = new PageItem().setLru("s:http|h:com|h:napster");
            PageItem page3 = new PageItem().setLru("s:http|h:fr|h:google");
            pages.add(page1);
            pages.add(page2);
            pages.add(page3);
            cache.setPageItems(pages);
            //
            // create default webEntityCreationRule
            //
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
            // regexp to match all sub domains
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);


            //
            // generate WebEntities from the PageItems
            //
            int created = cache.createWebEntities();
            logger.debug("created # " + created + " web entities");

            //
            // generate WebEntityLinks
            //
            lruIndex.generateWebEntityLinks();

            assertEquals("Unexpected # of webentitylinks", 0, lruIndex.retrieveWebEntityLinks().size());

        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MaxCacheSizeException x) {
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

    public void testGeneratingWebEntityLinksWhenThereAreNoWebEntities() {
        logger.debug("testGeneratingWebEntityLinks");
        try {
            assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());

            //
            // create some NodeLinks
            //
            NodeLink nodeLink1 = new NodeLink();
            nodeLink1.setSourceLRU("s:http|h:fr|h:google");
            nodeLink1.setTargetLRU("s:http|h:com|h:megaupload");

            NodeLink nodeLink2 = new NodeLink();
            nodeLink2.setSourceLRU("s:http|h:fr|h:google");
            nodeLink2.setTargetLRU("s:http|h:com|h:napster");

            NodeLink nodeLink3 = new NodeLink();
            nodeLink3.setSourceLRU("s:http|h:com|h:napster");
            nodeLink3.setTargetLRU("s:http|h:com|h:megaupload");

            List<Object> nodelinks = new ArrayList<Object>();
            nodelinks.add(nodeLink1);
            nodelinks.add(nodeLink2);
            nodelinks.add(nodeLink3);

            int indexed  = lruIndex.batchIndex(nodelinks);
            logger.debug("indexed # " + indexed + " node links");

            //
            // generate WebEntityLinks
            //
            lruIndex.generateWebEntityLinks();

            assertEquals("Unexpected # of webentitylinks", 0, lruIndex.retrieveWebEntityLinks().size());

        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }


    public void xtestBatchIndexPageItem() throws Exception {

        int totalDocCount = 0;
        int addedDocCount = 0;

        Iterator<String> rawUrlsIterator = new LineFileReader("C:\\source\\peace\\data\\tests\\urls.txt");

        LRUIndex urldb = LRUIndex.getInstance("luceneurldb", IndexWriterConfig.OpenMode.CREATE);

        //System.out.println("index size before: " +urldb.countUrls());

        long totalStart = System.currentTimeMillis();
        long totalDuration = 0;
        long localStart = 0;
        long localDuration = 0;

        List<Object> lruItems = new ArrayList<Object>();
        PageItem lruItem = new PageItem().setLru("heikkitest");
        lruItems.add(lruItem);
        System.out.println("reading");
        while(rawUrlsIterator.hasNext()) {
            totalDocCount++;
            localStart = System.currentTimeMillis();

            String lru = rawUrlsIterator.next();

            if(lru != null) {
                lruItems.add(new PageItem().setLru(lru));
                //if(urldb.addUrl(url))
                //	addedDocCount++;

            }

            if(lruItems.size() > 600000) {
                System.out.println("sending a batch to be indexed");
                urldb.batchIndex(lruItems);
                lruItems.clear();
            }

            //totalDuration = Math.max(System.currentTimeMillis() - totalStart, 1);
            //if(totalDocCount % 10000 == 0) {
            //	System.out.println((totalDuration/1000)+" s\t docs="+totalDocCount+"\t added="+addedDocCount+"\tdocs/s="+(1000L*totalDocCount)/(totalDuration));
            //}
        }
        System.out.println("finished reading");
        // process rest
        urldb.batchIndex(lruItems);

        PageItem found = urldb.retrievePageItemByLRU("heikkitest");
        if(found != null) {
            System.out.println("found it");
        }
        else {
            System.out.println("did not find it");
        }

        System.out.println("done");

    }

    /**
     * Creates the test case.
     *
     * @param testName name of the test case
     */
    public LRUIndexTest(String testName) {
        super( testName );
    }

    /**
     * @return the suite of tests being tested
     */
    public static Test suite() {
        return new TestSuite( LRUIndexTest.class );
    }

}