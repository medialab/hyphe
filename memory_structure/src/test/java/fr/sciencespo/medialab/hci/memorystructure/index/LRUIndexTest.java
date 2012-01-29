package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
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

    private static Logger logger = LoggerFactory.getLogger(LRUIndexTest.class);

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
            PageItem found = lruIndex.retrieveByLRU("s:http|h:fr|h:sciences-po|h:medialab");
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
            PageItem found = lruIndex.retrieveByLRU("s:http|h:fr|h:sciences-po|h:medialab|h:do-not-find-me");
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
            PageItem found = lruIndex.retrieveByLRU("s:http|h:fr|h:sciences-po*");
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
            PageItem found = lruIndex.retrieveByLRU("s:http|h:fr|h:scien?es-po|h:medialab");
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
            PageItem found = lruIndex.retrieveByLRU("*");
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
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            String id = lruIndex.indexWebEntity(null, lruItem1);
            logger.debug("indexed webentity with id " + id);
            assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());
        }
        catch (IndexException x) {
            fail(x.getMessage());
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
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            String id = lruIndex.indexWebEntity(null, lruItem1);

            // add lru to this webentity
            PageItem lruItem2 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:www");
            String id2 = lruIndex.indexWebEntity(id, lruItem2);

            assertEquals("update existing webentity returns unexpected id", id, id2);
            assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());
            WebEntity webEntity = lruIndex.retrieveWebEntity(id);
            assertNotNull("failed to retrieve existing webentity", webEntity);
            if(webEntity != null) {
                int lruListSize = webEntity.getLRUSetSize();
                assertEquals("unexpected webentity lrulist size", 2, lruListSize);
            }
        }
        catch (IndexException x) {
            fail(x.getMessage());
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
            PageItem lruItem1 = new PageItem().setLru("s:http|h:fr|h:sciences-po|h:medialab");
            String nonExistingId = "there-is-no-webentity-with-this-id";
            String id = lruIndex.indexWebEntity(nonExistingId, lruItem1);
            assertNotSame("update existing webentity that does not really exist returns unexpected id", id, nonExistingId);
            assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());
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

        PageItem found = urldb.retrieveByLRU("heikkitest");
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