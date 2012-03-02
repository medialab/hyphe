package fr.sciencespo.medialab.hci.memorystructure.gexf;

import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;
import org.apache.lucene.index.IndexWriterConfig;

/**
 * Test GEXFWriter.
 *
 * @author heikki doeleman
 */
public class GEXFWriterTest extends TestCase {

    private static DynamicLogger logger = new DynamicLogger(GEXFWriterTest.class, DynamicLogger.LogLevel.ERROR);
    private LRUIndex lruIndex;

    public void testGEXFWriter() {
        try {
            // add some webentities

            WebEntity webEntityA = new WebEntity();
            webEntityA.setName("AAA");
            webEntityA.addToLRUSet("s:http|h:www|h:com|h:megaupload");

            WebEntity webEntityB = new WebEntity();
            webEntityB.setName("BBB");
            webEntityB.addToLRUSet("s:http|h:www|h:com|h:rapidshare");

            WebEntity webEntityC = new WebEntity();
            webEntityC.setName("CCC");
            webEntityC.addToLRUSet("s:http|h:www|h:com|h:fileserve");

            WebEntity webEntityD = new WebEntity();
            webEntityD.setName("DDD");
            webEntityD.addToLRUSet("s:http|h:www|h:com|h:napster");

            WebEntity webEntityE = new WebEntity();
            webEntityE.setName("EEE");
            webEntityE.addToLRUSet("s:http|h:www|h:org|h:thepiratebay");

            lruIndex.indexWebEntity(webEntityA);
            lruIndex.indexWebEntity(webEntityB);
            lruIndex.indexWebEntity(webEntityC);
            lruIndex.indexWebEntity(webEntityD);
            lruIndex.indexWebEntity(webEntityE);

            String graph = GEXFWriter.writeGEXF();

            logger.debug("graph:\n" + graph);
        }
        catch (GEXFWriterException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            fail(x.getMessage());
        }
    }




    /**
     * Invoked before each test* method.
     */
    public void setUp() {
        lruIndex = LRUIndex.getInstance("luceneindex", IndexWriterConfig.OpenMode.CREATE);
    }

    /**
     * Invoked after each test* method.
     */
    public void tearDown() throws Exception {
        lruIndex.clearIndex();
    }

    /**
     * Creates the test case.
     *
     * @param testName name of the test case
     */
    public GEXFWriterTest(String testName) {
        super( testName );
    }

    /**
     * @return the suite of tests being tested
     */
    public static Test suite() {
        return new TestSuite( GEXFWriterTest.class );
    }

}