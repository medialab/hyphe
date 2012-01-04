package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
import fr.sciencespo.medialab.hci.memorystructure.util.LineFileReader;
import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;
import org.apache.lucene.index.IndexWriterConfig;

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

    public void testAddPrecisionException() throws Exception {
        LRUIndex lruIndex = LRUIndex.getInstance("C:\\source\\peace\\data\\tests\\luceneurldb", IndexWriterConfig.OpenMode.CREATE);
        String precisionExceptionLRU1 = "com.blogspot.rivieraonline";
        String precisionExceptionLRU2 = "com.blogspot.braziland";
        lruIndex.indexPrecisionException(precisionExceptionLRU1);
        lruIndex.indexPrecisionException(precisionExceptionLRU2);

        List<String> foundList = lruIndex.retrievePrecisionExceptions();
        assertEquals(2, foundList.size());

        String found1 = lruIndex.retrievePrecisionException(precisionExceptionLRU1);
        assertEquals(precisionExceptionLRU1, found1);

        String found2 = lruIndex.retrievePrecisionException(precisionExceptionLRU2);
        assertEquals(precisionExceptionLRU2, found2);

        String found3 = lruIndex.retrievePrecisionException("this-was-never-stored");
        assertNull(found3);
    }

    /**
     * Tests retrieving using an exact match.
     *
     * @throws Exception hmm
     */
    public void testRetrieveLRUItem() throws Exception {
        LRUIndex lruIndex = LRUIndex.getInstance("C:\\source\\peace\\data\\tests\\luceneurldb", IndexWriterConfig.OpenMode.CREATE);
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
       // LRUItem lruItem1 = new LRUItem("find-me");
      //  lruItems.add(lruItem1);
      //  lruIndex.batchIndex(lruItems);
        LRUItem found = lruIndex.retrieveByLRU("find-me");
        assertNotNull("Could not retrieve expected object", found);
    }

    /**
     * Tests retrieving a non-existing item, which souldn't succeed.
     *
     * @throws Exception hmm
     */
    public void testDonotRetrieveNonExistingLRUItem() throws Exception {
        LRUIndex lruIndex = LRUIndex.getInstance("C:\\source\\peace\\data\\tests\\luceneurldb", IndexWriterConfig.OpenMode.CREATE);
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
      //  LRUItem lruItem1 = new LRUItem("find-me");
     //   lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);
        LRUItem found = lruIndex.retrieveByLRU("do-not-find-me");
        assertNull("Retrieved unexpected object", found);
    }

    /**
     * Tests retrieving using the multi-character '*' wildcard.
     *
     * @throws Exception hmm
     */
    public void testRetrieveLRUItemByPrefix() throws Exception {
        LRUIndex lruIndex = LRUIndex.getInstance("C:\\source\\peace\\data\\tests\\luceneurldb", IndexWriterConfig.OpenMode.CREATE);
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
     //   LRUItem lruItem1 = new LRUItem("find-me");
      //  lruItems.add(lruItem1);
     //   lruIndex.batchIndex(lruItems);
        LRUItem found = lruIndex.retrieveByLRU("fin*");
        assertNotNull("Could not retrieve expected object by wildcard", found);
    }

    /**
     * Tests retrieving using the single character '?' wildcard.
     *
     * @throws Exception hmm
     */
    public void testRetrieveLRUItemBySingleCharWildCard() throws Exception {
        LRUIndex lruIndex = LRUIndex.getInstance("C:\\source\\peace\\data\\tests\\luceneurldb", IndexWriterConfig.OpenMode.CREATE);
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
     //   LRUItem lruItem1 = new LRUItem("find-me");
     //   lruItems.add(lruItem1);
        lruIndex.batchIndex(lruItems);
        LRUItem found = lruIndex.retrieveByLRU("find-?e");
        assertNotNull("Could not retrieve expected object by single character wildcard", found);
    }

    /**
     * Tests LRUIndex.indexCount().
     *
     * @throws Exception hmm
     */
    public void testIndexCount() throws Exception {
        LRUIndex lruIndex = LRUIndex.getInstance("C:\\source\\peace\\data\\tests\\luceneurldb", IndexWriterConfig.OpenMode.CREATE);
        assertEquals("IndexCount returns unexpected number", 0, lruIndex.indexCount());
        List<LRUItem> lruItems = new ArrayList<LRUItem>();
     //   LRUItem lruItem1 = new LRUItem("1");
     //   LRUItem lruItem2 = new LRUItem("2");
     //   LRUItem lruItem3 = new LRUItem("3");
     //   lruItems.add(lruItem1);
     //   lruItems.add(lruItem2);
     //   lruItems.add(lruItem3);
        lruIndex.batchIndex(lruItems);
        assertEquals("IndexCount returns unexpected number", 3, lruIndex.indexCount());
        lruIndex.close();
    }


    public void testBatchIndexLRUItem() throws Exception {

        int totalDocCount = 0;
        int addedDocCount = 0;

        Iterator<String> rawUrlsIterator = new LineFileReader("C:\\source\\peace\\data\\tests\\urls.txt");

        LRUIndex urldb = LRUIndex.getInstance("C:\\source\\peace\\data\\tests\\luceneurldb", IndexWriterConfig.OpenMode.CREATE);

        //System.out.println("index size before: " +urldb.countUrls());

        long totalStart = System.currentTimeMillis();
        long totalDuration = 0;
        long localStart = 0;
        long localDuration = 0;

        List<LRUItem> lruItems = new ArrayList<LRUItem>();
    //    LRUItem lruItem = new LRUItem("heikkitest");
    //    lruItems.add(lruItem);
        System.out.println("reading");
        while(rawUrlsIterator.hasNext()) {
            totalDocCount++;
            localStart = System.currentTimeMillis();

            String lru = rawUrlsIterator.next();

            if(lru != null) {
    //            lruItems.add(new LRUItem(lru));
                //if(urldb.addUrl(url))
                //	addedDocCount++;

            }

            if(lruItems.size() > 600000) {
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



        urldb.close();
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