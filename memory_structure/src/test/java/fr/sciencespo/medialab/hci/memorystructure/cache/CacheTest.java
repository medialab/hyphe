package fr.sciencespo.medialab.hci.memorystructure.cache;

import fr.sciencespo.medialab.hci.memorystructure.index.IndexConfiguration;
import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructureException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;
import org.apache.lucene.index.IndexWriterConfig;

import java.util.ArrayList;
import java.util.List;

/**
 * Test Cache.
 *
 * @author heikki doeleman
 */
public class CacheTest extends TestCase {

    private static DynamicLogger logger = new DynamicLogger(CacheTest.class, DynamicLogger.LogLevel.ERROR);
    private LRUIndex lruIndex;



    //
    // tests for null input to applyWebEntityCreationRule
    //

    public void testapplyWebEntityCreationRuleNullRule() {
        Cache cache = new Cache(lruIndex);

        PageItem pageItem = new PageItem();
        pageItem.setLru("s:http|h:www|h:com|h:megaupload");

        @SuppressWarnings({"NullableProblems"})
        WebEntity webEntity = cache.applyWebEntityCreationRule(null, pageItem);

        assertNull("Created webEntity when it shouldn't", webEntity);
    }

    public void testapplyWebEntityCreationRuleNullPage() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
        defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
        // regexp to match all sub domains
        defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        @SuppressWarnings({"NullableProblems"})
        WebEntity webEntity = cache.applyWebEntityCreationRule(defaultWebEntityCreationRule, null);

        assertNull("Created webEntity when it shouldn't", webEntity);
    }

    //
    // tests for default web entity creation rule
    //

    public void testApplyDefaultWebEntityCreationRuleDomainLevel() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
        defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
        // regexp to match all sub domains
        defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        PageItem pageItem = new PageItem();
        pageItem.setLru("s:http|h:www|h:com|h:megaupload");
        WebEntity webEntity = cache.applyWebEntityCreationRule(defaultWebEntityCreationRule, pageItem);

        assertNotNull("Failed to create webEntity", webEntity);
        assertEquals("Unexpted # of LRUs in webEntity", 1, webEntity.getLRUSet().size());
        assertEquals("Unexpted LRU in webEntity", "s:http|h:www|h:com|h:megaupload", webEntity.getLRUSet().iterator().next());
    }

    public void testApplyDefaultWebEntityCreationRuleSubDomainLevel() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
        defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
        // regexp to match all sub domains
        defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        PageItem pageItem = new PageItem();
        pageItem.setLru("s:http|h:www|h:com|h:megaupload|h:copyright");
        WebEntity webEntity = cache.applyWebEntityCreationRule(defaultWebEntityCreationRule, pageItem);

        assertNotNull("Failed to create webEntity", webEntity);
        assertEquals("Unexpted # of LRUs in webEntity", 1, webEntity.getLRUSet().size());
        assertEquals("Unexpted LRU in webEntity", "s:http|h:www|h:com|h:megaupload|h:copyright", webEntity.getLRUSet().iterator().next());
    }

    public void testApplyDefaultWebEntityCreationRulePageLevel() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
        defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
        // regexp to match all sub domains
        defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        PageItem pageItem = new PageItem();
        pageItem.setLru("s:http|h:www|h:com|h:megaupload|p:order.html");
        WebEntity webEntity = cache.applyWebEntityCreationRule(defaultWebEntityCreationRule, pageItem);

        assertNotNull("Failed to create webEntity", webEntity);
        assertEquals("Unexpted # of LRUs in webEntity", 1, webEntity.getLRUSet().size());
        assertEquals("Unexpted LRU in webEntity", "s:http|h:www|h:com|h:megaupload", webEntity.getLRUSet().iterator().next());
    }

    public void testApplyDefaultWebEntityCreationRuleRegExpDoesntMatch() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
        defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
        // regexp to match all sub domains
        defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        PageItem pageItem = new PageItem();
        pageItem.setLru("this does not match the reg exp at all");
        WebEntity webEntity = cache.applyWebEntityCreationRule(defaultWebEntityCreationRule, pageItem);

        assertNull("Created webEntity when it shouldn't", webEntity);
    }

    //
    // tests for non-default web entity creation rule
    //
    public void testApplyWebEntityCreationRuleDomainLevel() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
        webEntityCreationRule.setLRU("s:http|h:www|h:com|h:megaupload");
        // regexp to match all sub domains
        webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        PageItem pageItem = new PageItem();
        pageItem.setLru("s:http|h:www|h:com|h:megaupload");
        WebEntity webEntity = cache.applyWebEntityCreationRule(webEntityCreationRule, pageItem);

        assertNotNull("Failed to create webEntity", webEntity);
        assertEquals("Unexpted # of LRUs in webEntity", 1, webEntity.getLRUSet().size());
        assertEquals("Unexpted LRU in webEntity", "s:http|h:www|h:com|h:megaupload", webEntity.getLRUSet().iterator().next());
    }

    public void testApplyWebEntityCreationRuleSubDomainLevel() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
        webEntityCreationRule.setLRU("s:http|h:www|h:com|h:megaupload");
        // regexp to match all sub domains
        webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        PageItem pageItem = new PageItem();
        pageItem.setLru("s:http|h:www|h:com|h:megaupload|h:copyright");
        WebEntity webEntity = cache.applyWebEntityCreationRule(webEntityCreationRule, pageItem);

        assertNotNull("Failed to create webEntity", webEntity);
        assertEquals("Unexpted # of LRUs in webEntity", 1, webEntity.getLRUSet().size());
        assertEquals("Unexpted LRU in webEntity", "s:http|h:www|h:com|h:megaupload|h:copyright", webEntity.getLRUSet().iterator().next());
    }

    public void testApplyWebEntityCreationRulePageLevel() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
        webEntityCreationRule.setLRU("s:http|h:www|h:com|h:megaupload");
        // regexp to match all sub domains
        webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        PageItem pageItem = new PageItem();
        pageItem.setLru("s:http|h:www|h:com|h:megaupload|p:order.html");
        WebEntity webEntity = cache.applyWebEntityCreationRule(webEntityCreationRule, pageItem);

        assertNotNull("Failed to create webEntity", webEntity);
        assertEquals("Unexpted # of LRUs in webEntity", 1, webEntity.getLRUSet().size());
        assertEquals("Unexpted LRU in webEntity", "s:http|h:www|h:com|h:megaupload", webEntity.getLRUSet().iterator().next());
    }

    public void testApplyWebEntityCreationRuleRegExpDoesntMatch() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
        webEntityCreationRule.setLRU("s:http|h:www|h:com|h:megaupload");
        // regexp to match all sub domains
        webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        PageItem pageItem = new PageItem();
        pageItem.setLru("this does not match the reg exp at all");
        WebEntity webEntity = cache.applyWebEntityCreationRule(webEntityCreationRule, pageItem);

        assertNull("Created webEntity when it shouldn't", webEntity);
    }

    //
    // tests for createWebEntities
    //

    public void testCreateWebEntitiesWebEntityMatch() {
        try {
            //
            // create pre-existing web entities
            //
            WebEntity webEntity = new WebEntity();
            webEntity.setName("Napster");
            webEntity.addToLRUSet("s:http|h:www|h:com|h:napster");

            lruIndex.indexWebEntity(webEntity);

            //
            // create web entity creation rules
            //
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU("s:http|h:www|h:com|h:megaupload");
            // regexp to match all sub domains
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);

            Cache cache = new Cache(lruIndex);
            List<PageItem> pages = new ArrayList<PageItem>();
            PageItem pageItem = new PageItem();
            pageItem.setLru("s:http|h:www|h:com|h:napster|h:contact.do");
            pages.add(pageItem);
            cache.setPageItems(pages);

            //
            // most precise prefix is from a Web Entity, no webentity should be created
            //
            int created = cache.createWebEntities();

            assertEquals("Unexpected # of web entities created", 0, created);

        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
        catch (MaxCacheSizeException x) {
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            fail(x.getMessage());
        }
    }

    public void testCreateWebEntitiesWebEntityCreationRuleMatch() {
        try {
            //
            // create pre-existing web entities
            //
            WebEntity webEntity = new WebEntity();
            webEntity.setName("Megaupload");
            webEntity.addToLRUSet("s:http|h:www|h:com|h:megaupload");

            lruIndex.indexWebEntity(webEntity);

            //
            // create web entity creation rules
            //
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU("s:http|h:www|h:com|h:napster");
            // regexp to match all sub domains
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);

            Cache cache = new Cache(lruIndex);
            List<PageItem> pages = new ArrayList<PageItem>();
            PageItem pageItem = new PageItem();
            pageItem.setLru("s:http|h:www|h:com|h:napster|h:contact.do");
            pages.add(pageItem);
            cache.setPageItems(pages);

            //
            // most precise prefix is from a Web Entity Creation Rule, apply that rule (may be the default rule)
            //
            int created = cache.createWebEntities();

            assertEquals("Unexpected # of web entities created", 1, created);

        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
        catch (MaxCacheSizeException x) {
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            fail(x.getMessage());
        }
    }

    public void testCreateWebEntitiesWebEntityCreationRuleAndWebEntityBothMatch() {
        try {
            //
            // create pre-existing web entities
            //
            WebEntity webEntity = new WebEntity();
            webEntity.setName("Megaupload");
            webEntity.addToLRUSet("s:http|h:www|h:com|h:megaupload");

            lruIndex.indexWebEntity(webEntity);

            //
            // create web entity creation rules
            //
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU("s:http|h:www|h:com|h:megaupload");
            // regexp to match all sub domains
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);

            Cache cache = new Cache(lruIndex);
            List<PageItem> pages = new ArrayList<PageItem>();
            PageItem pageItem = new PageItem();
            pageItem.setLru("s:http|h:www|h:com|h:megaupload|h:contact.asp");
            pages.add(pageItem);
            cache.setPageItems(pages);

            //
            // most specific LRUPrefix from Rules and most specific LRUPrefix from entities have same specificity :
            // prefer the creation rule
            //
            int created = cache.createWebEntities();

            assertEquals("Unexpected # of web entities created", 1, created);

        }
        catch (IndexException x) {
            fail(x.getMessage());
        }
        catch (MaxCacheSizeException x) {
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            fail(x.getMessage());
        }
    }

    public void testCreateWebEntitiesDefaultWebEntityCreationRuleMatch() {
        try {
            //
            // create pre-existing web entities
            //
            WebEntity webEntity = new WebEntity();
            webEntity.setName("Megaupload");
            webEntity.addToLRUSet("s:http|h:www|h:com|h:megaupload");

            lruIndex.indexWebEntity(webEntity);

            //
            // create web entity creation rules
            //
            WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
            webEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
            // regexp to match all sub domains
            webEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(webEntityCreationRule);

            Cache cache = new Cache(lruIndex);
            List<PageItem> pages = new ArrayList<PageItem>();
            PageItem pageItem = new PageItem();
            pageItem.setLru("s:http|h:www|h:com|h:napster|h:contact.do");
            pages.add(pageItem);
            cache.setPageItems(pages);

            //
            // most precise prefix is from a Web Entity Creation Rule, apply that rule (here it is be the default rule)
            //
            int created = cache.createWebEntities();

            assertEquals("Unexpected # of web entities created: " + created, 1, created);

        }
        catch (IndexException x) {
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MaxCacheSizeException x) {
            x.printStackTrace();
            fail(x.getMessage());
        }
        catch (MemoryStructureException x) {
            x.printStackTrace();
            fail(x.getMsg());
        }
    }

    public void testRevertLRU() {
        Cache cache = new Cache(lruIndex);
        assertEquals("Unexpected URL", "megaupload.com", cache.revertLRU("s:http|h:www|h:com|h:megaupload"));
        assertEquals("Unexpected URL", "jiminy.medialab.sciences-po.fr/hci/index.php?title=Reverse_URLs&secondparameter=there#bottom", cache.revertLRU("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php|q:title=Reverse_URLs|q:secondparameter=there|r:bottom"));
        assertEquals("Unexpected URL", "bbc.co.uk", cache.revertLRU("s:http|h:www|h:uk|h:co|h:bbc"));
        assertNull("Null input should return null", cache.revertLRU(null));
        assertNull("Empty input should return null", cache.revertLRU(""));
        assertNull("Blank input should return null", cache.revertLRU(" "));
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
    public CacheTest(String testName) {
        super( testName );
    }

    /**
     * @return the suite of tests being tested
     */
    public static Test suite() {
        return new TestSuite( CacheTest.class );
    }

}