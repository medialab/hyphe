package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.util.RandomLRUGenerator;
import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.util.Iterator;
import java.util.Random;
import java.util.Set;

/**
 * Not an actual test class, but handy to create some random input test data. Rename method to run to start with 'test'
 * to run from Junit test runner.
 *
 * @author heikki doeleman
 *
 */
public class TestDataUtilityTest extends TestCase {

    /**
     *
     */
    public void xtestGenerateUrls() {
        Random r = new Random(System.currentTimeMillis());
        Set<String> urls = RandomLRUGenerator.createUrls(r, 1000000);
        System.out.println("created urls # "+urls.size());
         try {
            BufferedWriter bw = new BufferedWriter(new FileWriter(new File("C:/tmp/urls.txt"), true));
            int x = 0;
            for(Iterator<String> uit = urls.iterator(); uit.hasNext();) {
                x++;
                //System.out.println(uit.next());
                bw.write(uit.next());
                bw.newLine();
            }
             bw.close();
         }
         catch (Exception x) {
             System.out.println(x.getMessage());
             x.printStackTrace();
         }
        /*

        // create random links between urls created above
        Object[] urlArray = urls.toArray();
        int urlssize = urls.size();
        int totlinks = 0;
        try {
            BufferedWriter bw = new BufferedWriter(new FileWriter(new File("C:/tmp/links.txt"), true));
            // for each url, create 0-5 links to other pages
            for(String source : urls) {
                int numberOfLinks = r.nextInt(6);
                for(int i = 0; i < numberOfLinks; i++) {
                    // pick a random target url
                    int randomTarget = r.nextInt(urlssize);
                    String target = (String)urlArray[randomTarget];
                    bw.write(source + " " + target + " " + 2) ;
                    bw.newLine();
                    totlinks++;
                }
            }
            bw.close();

        }
         catch (Exception e) {
             System.out.println(e.getMessage());
         }

        System.out.println("created urls # "+urls.size() + " and links # " + totlinks);
        */
    }


    /**
     * Creates the test case.
     *
     * @param testName name of the test case
     */
    public TestDataUtilityTest(String testName) {
        super( testName );
    }

    /**
     * @return the suite of tests being tested
     */
    public static Test suite() {
        return new TestSuite( TestDataUtilityTest.class );
    }
}
