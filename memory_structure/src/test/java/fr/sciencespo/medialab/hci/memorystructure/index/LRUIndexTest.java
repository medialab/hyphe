package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.util.LineFileReader;
import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;
import org.apache.lucene.index.IndexWriterConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Test LRUIndex.
 *
 * TODO broken by Thrift-generated domain classes
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
     * @throws Exception hmm
     */
    public void testClearEmptyIndex() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        lruIndex.clearIndex();
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
    }

    /**
     * Tests clearing a non-empty index.
     *
     * @throws Exception hmm
     */
    public void testClearNonEmptyIndex() throws Exception {
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("1");
        LRUItem lruItem2 = new LRUItem().setLru("2");
        LRUItem lruItem3 = new LRUItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        lruIndex.batchIndex(lruItems);
        lruIndex.clearIndex();
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
    }

    /**
     * Tests LRUIndex.indexCount().
     *
     * @throws Exception hmm
     */
    public void testIndexCount() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("1");
        LRUItem lruItem2 = new LRUItem().setLru("2");
        LRUItem lruItem3 = new LRUItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        lruIndex.batchIndex(lruItems);
        assertEquals("IndexCount returns unexpected number", 3, lruIndex.indexCount());
        //lruIndex.close();
        logger.info("testIndexCount success");
    }

    //
    // Precision Exception index tests.
    //

    /**
     * Tests adding and retrieving Precision Exceptions.
     *
     * @throws Exception hmm
     */
    public void testAddPrecisionException() throws Exception {
        //
        // add 2 precision exceptions to a new index
        //
        String precisionExceptionLRU1 = "com.blogspot.rivieraonline";
        String precisionExceptionLRU2 = "com.blogspot.braziland";
        lruIndex.indexPrecisionException(precisionExceptionLRU1);
        lruIndex.indexPrecisionException(precisionExceptionLRU2);

        // test if all are retrieved
        List<String> foundList = lruIndex.retrievePrecisionExceptions();
        assertEquals("Did not retrieve all Precision Exceptions", 2, foundList.size());

        // test if a specific one is retrieved
        String found1 = lruIndex.retrievePrecisionException(precisionExceptionLRU1);
        assertEquals("Did not find expected single Precision Exception", precisionExceptionLRU1, found1);

        // test if a specific one is retrieved
        String found2 = lruIndex.retrievePrecisionException(precisionExceptionLRU2);
        assertEquals("Did not find expected single Precision Exception", precisionExceptionLRU2, found2);

        // test if a specific non-existing one is not retrieved
        String found3 = lruIndex.retrievePrecisionException("this-was-never-stored");
        assertNull("Found unexpected Precision Exception", found3);

        //lruIndex.close();
        logger.info("testAddPrecisionException success");
    }

    //
    // LRUItem index tests.
    //


    /**
     * Tests retrieving LRUItem using an exact match.
     *
     * @throws Exception hmm
     */
    public void testRetrieveLRUItem() throws Exception {
        //
        // add 1 LRUItem to a new index
        //
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("find-me");
        lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);

        // test if this LRUItem can be found
        LRUItem found = lruIndex.retrieveByLRU("find-me");
        assertNotNull("Could not retrieve expected object", found);

        //lruIndex.close();
        logger.info("testRetrieveLRUItem success");

    }

    /**
     * Tests retrieving a non-existing LRUItem, which shouldn't be found.
     *
     * @throws Exception hmm
     */
    public void testDonotRetrieveNonExistingLRUItem() throws Exception {
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("find-me");
        lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);
        LRUItem found = lruIndex.retrieveByLRU("do-not-find-me");
        assertNull("Retrieved unexpected object", found);
        //lruIndex.close();
        logger.info("testDonotRetrieveNonExistingLRUItem success");
    }

    /**
     * Tests retrieving LRUItems using the multi-character '*' wildcard.
     *
     * @throws Exception hmm
     */
    public void testRetrieveLRUItemByPrefix() throws Exception {
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("find-me");
        lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);
        LRUItem found = lruIndex.retrieveByLRU("fin*");
        assertNotNull("Could not retrieve expected object by wildcard", found);
        //lruIndex.close();
        logger.info("testRetrieveLRUItemByPrefix success");
    }

    /**
     * Tests retrieving LRUItem using the single character '?' wildcard.
     *
     * @throws Exception hmm
     */
    public void testRetrieveLRUItemBySingleCharWildCard() throws Exception {
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("find-me");
        lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);
        LRUItem found = lruIndex.retrieveByLRU("find-?e");
        assertNotNull("Could not retrieve expected object by single character wildcard", found);
        //lruIndex.close();
        logger.info("testRetrieveLRUItemBySingleCharWildCard success");
    }

    /**
     * Tests retrieving LRUItems using the multi character '*' wildcard.
     *
     * @throws Exception hmm
     */
    public void testRetrieveLRUItemByMultiCharacterWildCard() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem1 = new LRUItem().setLru("1");
        LRUItem lruItem2 = new LRUItem().setLru("2");
        LRUItem lruItem3 = new LRUItem().setLru("3");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        lruIndex.batchIndex(lruItems);
        LRUItem found = lruIndex.retrieveByLRU("*");
        assertEquals("IndexCount returns unexpected number", 3, lruIndex.indexCount());
        //lruIndex.close();
        logger.info("testRetrieveLRUItemByMultiCharacterWildCard success");
    }

    public void testIndexNewWebEntity() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        LRUItem lruItem1 = new LRUItem().setLru("1");
        String id = lruIndex.indexWebEntity(null, lruItem1);
        logger.debug("indexed webentity with id " + id);
        assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());
    }

    public void testAddToExistingWebEntity() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());

        // create a webentity
        LRUItem lruItem1 = new LRUItem().setLru("1");
        String id = lruIndex.indexWebEntity(null, lruItem1);

        // add lru to this webentity
        LRUItem lruItem2 = new LRUItem().setLru("2");
        String id2 = lruIndex.indexWebEntity(id, lruItem2);

        assertEquals("update existing webentity returns unexpected id", id, id2);
        assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());
        WebEntity webEntity = lruIndex.retrieveWebEntity(id);
        assertNotNull("failed to retrieve existing webentity", webEntity);
        if(webEntity != null) {
            int lruListSize = webEntity.getLRUlistSize();
            assertEquals("unexpected webentity lrulist size", 2, lruListSize);
        }
    }

    public void testAddToExistingWebEntityThatDoesNotActuallyExist() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        LRUItem lruItem1 = new LRUItem().setLru("1");
        String nonExistingId = "there-is-no-webentity-with-this-id";
        String id = lruIndex.indexWebEntity(nonExistingId, lruItem1);
        assertNotSame("update existing webentity that does not really exist returns unexpected id", id, nonExistingId);
        assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());
    }

    public void xtestBatchIndexLRUItem() throws Exception {

        int totalDocCount = 0;
        int addedDocCount = 0;

        Iterator<String> rawUrlsIterator = new LineFileReader("C:\\source\\peace\\data\\tests\\urls.txt");

        LRUIndex urldb = LRUIndex.getInstance("luceneurldb", IndexWriterConfig.OpenMode.CREATE);

        //System.out.println("index size before: " +urldb.countUrls());

        long totalStart = System.currentTimeMillis();
        long totalDuration = 0;
        long localStart = 0;
        long localDuration = 0;

        List<LRUItem> lruItems = new ArrayList<LRUItem>();
        LRUItem lruItem = new LRUItem().setLru("heikkitest");
        lruItems.add(lruItem);
        System.out.println("reading");
        while(rawUrlsIterator.hasNext()) {
            totalDocCount++;
            localStart = System.currentTimeMillis();

            String lru = rawUrlsIterator.next();

            if(lru != null) {
                lruItems.add(new LRUItem().setLru(lru));
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

        LRUItem found = urldb.retrieveByLRU("heikkitest");
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