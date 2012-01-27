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
import java.util.Iterator;
import java.util.List;

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
        List<Object> lruItems = new ArrayList<Object>();
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|www");
        PageItem lruItem2 = new PageItem().setLru("fr|sciencespo|www");
        PageItem lruItem3 = new PageItem().setLru("fr|sciences-po|medialab");
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
        List<Object> lruItems = new ArrayList<Object>();
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|www");
        PageItem lruItem2 = new PageItem().setLru("fr|sciencespo|www");
        PageItem lruItem3 = new PageItem().setLru("fr|sciences-po|medialab");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        lruIndex.batchIndex(lruItems);
        assertEquals("IndexCount returns unexpected number", 3, lruIndex.indexCount());
        //lruIndex.close();
        logger.info("testIndexCount success");
    }


    //
    // PageItem index tests.
    //


    /**
     * Tests retrieving PageItem using an exact match.
     *
     * @throws Exception hmm
     */
    public void testRetrievePageItem() throws Exception {
        //
        // add 1 PageItem to a new index
        //
        List<Object> lruItems = new ArrayList<Object>();
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|medialab");
        lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);

        // test if this PageItem can be found
        PageItem found = lruIndex.retrieveByLRU("fr|sciences-po|medialab");
        assertNotNull("Could not retrieve expected object", found);

        //lruIndex.close();
        logger.info("testRetrievePageItem success");

    }

    /**
     * Tests retrieving a non-existing PageItem, which shouldn't be found.
     *
     * @throws Exception hmm
     */
    public void testDonotRetrieveNonExistingPageItem() throws Exception {
        List<Object> lruItems = new ArrayList<Object>();
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|medialab");
        lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);
        PageItem found = lruIndex.retrieveByLRU("fr|sciences-po|medialab|do-not-find-me");
        assertNull("Retrieved unexpected object", found);
        //lruIndex.close();
        logger.info("testDonotRetrieveNonExistingPageItem success");
    }

    /**
     * Tests retrieving PageItems using the multi-character '*' wildcard.
     *
     * @throws Exception hmm
     */
    public void testRetrievePageItemByPrefix() throws Exception {
        List<Object> lruItems = new ArrayList<Object>();
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|medialab");
        lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);
        PageItem found = lruIndex.retrieveByLRU("fr|sciences-po*");
        assertNotNull("Could not retrieve expected object by wildcard", found);
        //lruIndex.close();
        logger.info("testRetrievePageItemByPrefix success");
    }

    /**
     * Tests retrieving PageItem using the single character '?' wildcard.
     *
     * @throws Exception hmm
     */
    public void testRetrievePageItemBySingleCharWildCard() throws Exception {
        List<Object> lruItems = new ArrayList<Object>();
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|medialab");
        lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);
        PageItem found = lruIndex.retrieveByLRU("fr|scien?es-po|medialab");
        assertNotNull("Could not retrieve expected object by single character wildcard", found);
        //lruIndex.close();
        logger.info("testRetrievePageItemBySingleCharWildCard success");
    }

    /**
     * Tests retrieving PageItems using the multi character '*' wildcard.
     *
     * @throws Exception hmm
     */
    public void testRetrievePageItemByMultiCharacterWildCard() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        List<Object> lruItems = new ArrayList<Object>();
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|www");
        PageItem lruItem2 = new PageItem().setLru("fr|sciencespo|www");
        PageItem lruItem3 = new PageItem().setLru("fr|sciences-po|medialab");
        lruItems.add(lruItem1);
        lruItems.add(lruItem2);
        lruItems.add(lruItem3);
        lruIndex.batchIndex(lruItems);
        PageItem found = lruIndex.retrieveByLRU("*");
        assertEquals("IndexCount returns unexpected number", 3, lruIndex.indexCount());
        //lruIndex.close();
        logger.info("testRetrievePageItemByMultiCharacterWildCard success");
    }

    /**
     * Tests indexing a new WebEntity.
     *
     * @throws Exception hmm
     */
    public void testIndexNewWebEntity() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|medialab");
        String id = lruIndex.indexWebEntity(null, lruItem1);
        logger.debug("indexed webentity with id " + id);
        assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());
    }

    /**
     * Tests adding a LRU to an existing WebEntity.
     *
     * @throws Exception hmm
     */
    public void testAddToExistingWebEntity() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());

        // create a webentity
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|medialab");
        String id = lruIndex.indexWebEntity(null, lruItem1);

        // add lru to this webentity
        PageItem lruItem2 = new PageItem().setLru("fr|sciences-po|www");
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

    /**
     *  Tests adding a LRU to an 'existing' WebEntity that does not actually exist -- in this case, a new WebEntity
     *  is created.
     *
     * @throws Exception hmm
     */
    public void testAddToExistingWebEntityThatDoesNotActuallyExist() throws Exception {
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        PageItem lruItem1 = new PageItem().setLru("fr|sciences-po|medialab");
        String nonExistingId = "there-is-no-webentity-with-this-id";
        String id = lruIndex.indexWebEntity(nonExistingId, lruItem1);
        assertNotSame("update existing webentity that does not really exist returns unexpected id", id, nonExistingId);
        assertEquals("IndexCount returns unexpected number", 1, lruIndex.indexCount());
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