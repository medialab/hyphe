package fr.sciencespo.medialab.hci.memorystructure.test.cache;

import fr.sciencespo.medialab.hci.memorystructure.cache.Cache;
import fr.sciencespo.medialab.hci.memorystructure.cache.MaxCacheSizeException;
import fr.sciencespo.medialab.hci.memorystructure.index.IndexConfiguration;
import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructureException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.ObjectNotFoundException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import fr.sciencespo.medialab.hci.memorystructure.util.LRUUtil;
import fr.sciencespo.medialab.hci.memorystructure.util.PrecisionLimit;
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

    private static DynamicLogger logger = new DynamicLogger(CacheTest.class, DynamicLogger.LogLevel.DEBUG);
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
        logger.debug("created web entity with name: " + webEntity.getName());

        assertEquals("Unexpected # of LRUs in webEntity", 1, webEntity.getLRUSet().size());
        assertEquals("Unexpected LRU in webEntity", "s:http|h:www|h:com|h:megaupload", webEntity.getLRUSet().iterator().next());
    }


    public void testApplyDefaultWebEntityCreationRuleDoodleBug() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
        defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
        // regexp to match all sub domains
        defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");

        PageItem p1 = new PageItem();
        p1.setLru("s:http|h:com|h:doodle|p:");

        PageItem p2 = new PageItem();
        p2.setLru("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb");

        PageItem p3 = new PageItem();
        p3.setLru("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb");

        WebEntity w1 = cache.applyWebEntityCreationRule(defaultWebEntityCreationRule, p1);
        WebEntity w2 = cache.applyWebEntityCreationRule(defaultWebEntityCreationRule, p2);
        WebEntity w3 = cache.applyWebEntityCreationRule(defaultWebEntityCreationRule, p3);

        assertNotNull("Failed to create webEntity", w1);
        assertNotNull("Failed to create webEntity", w2);
        assertNotNull("Failed to create webEntity", w3);
        logger.debug("created web entity with name: " + w1.getName());
        logger.debug("created web entity with name: " + w2.getName());
        logger.debug("created web entity with name: " + w3.getName());

        assertEquals("Unexpted # of LRUs in webEntity", 1, w1.getLRUSet().size());
        assertEquals("Unexpted # of LRUs in webEntity", 1, w2.getLRUSet().size());
        assertEquals("Unexpted # of LRUs in webEntity", 1, w3.getLRUSet().size());

        assertEquals("Unexpted LRU in webEntity", "s:http|h:com|h:doodle", w1.getLRUSet().iterator().next());
        assertEquals("Unexpted LRU in webEntity", "s:http|h:com|h:doodle|h:blog", w2.getLRUSet().iterator().next());
        assertEquals("Unexpted LRU in webEntity", "s:http|h:com|h:doodle|h:blog", w3.getLRUSet().iterator().next());

    }

    public void testApplyDefaultWebEntityCreationRuleDoodleBugAutoCreateWEs() {
        try {
            Cache cache = new Cache(lruIndex);

            WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
            defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
            // regexp to match all sub domains
            defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(defaultWebEntityCreationRule);

            PageItem p0 = new PageItem();
            p0.setLru("s:http|h:com|h:google");

            PageItem p1 = new PageItem();
            p1.setLru("s:http|h:com|h:doodle|p:");

            PageItem p2 = new PageItem();
            p2.setLru("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb");

            PageItem p3 = new PageItem();
            p3.setLru("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb");

            List<PageItem> pages = new ArrayList<PageItem>();
            pages.add(p0);
            pages.add(p1);
            pages.add(p2);
            pages.add(p3);

            cache.setPageItems(pages);

            int createdwesize = cache.createWebEntities();
            logger.info("created # " + createdwesize + " wes");
            assertEquals("Unexpected # of web entities", 3, createdwesize);
            assertEquals("Unexpected # of web entities", 3, lruIndex.retrieveWebEntities().size());

            NodeLink n1 = new NodeLink();
            n1.setSourceLRU("s:http|h:com|h:google");
            n1.setTargetLRU("s:http|h:com|h:doodle|p:");

            NodeLink n2 = new NodeLink();
            n2.setSourceLRU("s:http|h:com|h:google");
            n2.setTargetLRU("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb");

            List<Object> links = new ArrayList<Object>();
            links.add(n1);
            links.add(n2);

            lruIndex.batchIndex(links);

            lruIndex.generateWebEntityLinks();

        }
        catch (MemoryStructureException x) {
            fail(x.getMessage());
            x.printStackTrace();  
        } 
        catch (IndexException x) {
            fail(x.getMessage());
            x.printStackTrace();
        }
        catch (MaxCacheSizeException x) {
            fail(x.getMessage());
            x.printStackTrace();
        }

        
    }


    
    public void testIsNode() {
        assertTrue("Unexpected isNode", PrecisionLimit.isNode("s:http|h:com|h:google"));
        assertFalse("Unexpected isNode", PrecisionLimit.isNode("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb"));
    }

    public void testGetNode() {
        assertEquals("Unexpected getNode", "s:http|h:com|h:google", PrecisionLimit.getNode("s:http|h:com|h:google"));
        assertEquals("Unexpected getNode", "s:http|h:com|h:doodle|h:blog", PrecisionLimit.getNode("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb"));
    }

        /**
         * Re-did Paul's Python test in Java.
         */
    public void testCrawlerTest() {
        try {

            PageItem p0 = new PageItem();
            p0.setLru("s:http|h:com|h:google");

            PageItem p1 = new PageItem();
            p1.setLru("s:http|h:com|h:doodle|p:");

            PageItem p2 = new PageItem();
            p2.setLru("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb");

            PageItem p3 = new PageItem();
            p3.setLru("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb");

            List<PageItem> pageItems = new ArrayList<PageItem>();
            pageItems.add(p0);
            pageItems.add(p1);
            pageItems.add(p2);
            pageItems.add(p3);

            List<Object> pages = new ArrayList<Object>();

            for(PageItem pi : pageItems) {
                // check not yet in list -- todo better with map
                boolean notYetInList = true;
                for(Object o : pages) {
                    PageItem p = (PageItem) o;
                    if(p.getLru().equals(pi.getLru())) {
                        notYetInList = false;
                        break;
                    }
                }
                if(notYetInList) {
                    PageItem page = new PageItem();
                    if(PrecisionLimit.isNode(pi.getLru())) {
                        page.setLru(pi.getLru());
                    }
                    else {
                        page.setLru(PrecisionLimit.getNode(pi.getLru()));
                    }
                    pages.add(page);
                }
            }

            NodeLink n1 = new NodeLink();
            n1.setSourceLRU("s:http|h:com|h:google");
            n1.setTargetLRU("s:http|h:com|h:doodle|p:");

            NodeLink n2 = new NodeLink();
            n2.setSourceLRU("s:http|h:com|h:google");
            n2.setTargetLRU("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb");

            List<Object> links = new ArrayList<Object>();
            links.add(n1);
            links.add(n2);

            for(Object o : links) {
                NodeLink n = (NodeLink)o;
                if(!PrecisionLimit.isNode(n.getTargetLRU())) {
                    n.setTargetLRU(PrecisionLimit.getNode(n.getTargetLRU()));
                }
                // check not yet in list -- todo better with map
                boolean notYetInList = true;
                for(Object oo : pages) {
                    PageItem p = (PageItem) oo;
                    if(p.getLru().equals(n.getSourceLRU())) {
                        notYetInList = false;
                        break;
                    }
                }
                if(notYetInList) {
                    PageItem page = new PageItem();
                    page.setLru(PrecisionLimit.getNode(n.getSourceLRU()));
                    pages.add(page);
                }
            }

            Cache cache = new Cache(lruIndex);

            List<PageItem> grrr = new ArrayList<PageItem>();
            for(Object o : pages) {
                PageItem p = (PageItem) o;
                grrr.add(p);
            }
            logger.debug("\n\n\nadding pages to cache: " + grrr.size());
            cache.setPageItems(grrr);
            logger.debug("\n\n\nindexing pages: " + pages.size());
            lruIndex.batchIndex(pages);


            WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
            defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
            // regexp to match all sub domains
            defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
            lruIndex.indexWebEntityCreationRule(defaultWebEntityCreationRule);

            logger.debug("\n\n\nindexing nodelinks");
            lruIndex.batchIndex(links);

            logger.debug("\n\n\ncreating webentities");
            int createdwesize = cache.createWebEntities();
            logger.info("created # " + createdwesize + " wes");
            assertEquals("Unexpected # of web entities", 3, createdwesize);
            assertEquals("Unexpected # of web entities", 3, lruIndex.retrieveWebEntities().size());

            logger.debug("\n\n\nchecking generated webentities");
            for(WebEntity we : lruIndex.retrieveWebEntities()) {
                logger.debug("\nchecking we " + we.getName());
                List<PageItem> pagesForWE = lruIndex.findPagesForWebEntity(we.getId());
                logger.debug("found # " + pagesForWE + " pages for we " + we.getName());
                for(PageItem p : pagesForWE) {
                    for(String lru : we.getLRUSet()) {
                    logger.debug("page: " + we.getName() + "\t" + p.getLru() + "\t" + lru);
                    }
                }
            }
            logger.debug("\n\n\ngenerating webentity links");
            lruIndex.generateWebEntityLinks();

        }
        catch (MemoryStructureException x) {
            fail(x.getMessage());
            x.printStackTrace();
        }
        catch (IndexException x) {
            fail(x.getMessage());
            x.printStackTrace();
        }
        catch (MaxCacheSizeException x) {
            fail(x.getMessage());
            x.printStackTrace();
        }
        catch (ObjectNotFoundException x) {
            fail(x.getMessage());
            x.printStackTrace();
        }

    }

    /**
     * Runs long time. Rename by removing the x to run this test.
     */
    public void xtestApplyDefaultWebEntityCreationRuleDoodleBug2() {
        Cache cache = new Cache(lruIndex);

        WebEntityCreationRule defaultWebEntityCreationRule = new WebEntityCreationRule();
        defaultWebEntityCreationRule.setLRU(IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
        // regexp to match all sub domains
        defaultWebEntityCreationRule.setRegExp("(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)");
        try {
            lruIndex.indexWebEntityCreationRule(defaultWebEntityCreationRule);
        } 
        catch (IndexException x) {
            fail(x.getMessage());
            x.printStackTrace();
        }

        List<PageItem> pageItems = new ArrayList<PageItem>();
        pageItems.add(new PageItem().setLru("s:http|h:com|h:lexisnexis|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:kirelabs|h:detexify|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:kirelabs|h:detexifyblog|p:past|p:2009|p:8|p:12|p:new_backend_new_server_android_app"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:dakwak|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:cafeclimb|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:mattinsler|h:www|p:why-and-how-i-replaced-amazon-sqs-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:uk|h:co|h:phpconference|p:talk|p:introduction-mongodb-php"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wherevent|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:46elks|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:opendining|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:douban|h:www|p:group|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:nationaldatacatalog"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:killerstartups|h:www|p:Web20|p:vuzz-com-share-what-you-like-with-everybody"));
        pageItems.add(new PageItem().setLru("s:http|h:by|h:dropzone|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:nu|h:enbil|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:dealmachine|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sentimnt"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:findthebest|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:kapost|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sharethis"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:fuseware|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:www|p:url|q:q=http%3A%2F%2Fwww.mongodb.org%2Fdisplay%2FDOCS%2F2.0%2BRelease%2BNotes%232.0ReleaseNotes-ConcurrencyImprovements&sa=D&sntz=1&usg=AFQjCNFPuopL1dnlbfMt-m9gRDHwo6Nvag"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:www|p:url|q:q=http%3A%2F%2Fcode.google.com%2Fp%2Fmorphia%2F"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:creativecommons|p:licenses|p:by-nc-sa|p:3.0|p:%20"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:where|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:jp|h:preferred|p:index.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:startupmonkeys|h:www|p:2010|p:09|p:building-a-scrabble-mmo-in-48-hours"));
        pageItems.add(new PageItem().setLru("s:http|h:mp|h:bu|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:br|h:org|h:phpsp|p:2011|p:12|p:phpubsp-edicao-de-natal"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:grepler|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:macports|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:shopwiki|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:onepagecrm|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:gametrailers|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:lanyrd|p:topics|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:do|h:bako"));
        pageItems.add(new PageItem().setLru("s:http|h:me|h:yeay|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tweetsaver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:compoundthinking|p:blog|p:index.php|p:2009|p:07|p:16|p:turbogears-on-sourceforge"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:databasemonth|h:www|p:database|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wuuhuuonline|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:nosqldatabases|h:www|p:main|p:2011|p:1|p:6|p:q-a-with-kenny-gorman-data-architect-for-shutterfly-inc.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:nick|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:ly|h:mu|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:mozilla|h:ubiquity|p:herd"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:searce|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:is|h:magnetic|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:backpagepics|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:billmonitor|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:hypem|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:acquia|p:resources|p:library|p:case-study-examinercom"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:heyzap|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:codepeek|p:paste"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:busyconf|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:squeaksource|h:www|p:MongoTalk.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:kidiso|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:johnpwood|p:2011|p:05|p:31|p:fast-queries-on-large-datasets-using-mongodb-and-summary-documents"));
        pageItems.add(new PageItem().setLru("s:http|h:us|h:vork|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:doodle|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:fm|h:turntable|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:fm|h:tastebuds|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:chicagotribune|h:schools|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:blogspot|h:agiletesting|p:2010|p:07|p:tracking-and-visualizing-mail-logs-with.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:picloud|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:za|h:co|h:buzzers|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:za|h:co|h:buzzers|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:nz|h:co|h:bluespark|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:mongomapper|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:pinterest|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:ikeepm|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:mobiusonline|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:summify"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:10gen|h:mms|p:user|p:register|q:c=blog"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:fotosearch|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:a-saas|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:songkick|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:yourchalkboard|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:slinkset|h:mongodb|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:mobi|h:bongi|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:me|h:persik|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:codaset|p:codaset|p:codaset|p:blog|p:the-awesomeness-that-is-mongodb-and-nosql-is-taking-over-codaset"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:techcrunch|h:jp|p:archives|p:jp-20100922-vuzz-is-a-social-ranking-site-that-can-vote-what-do-you-want-to-eat-today"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:klatunetworks|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:try|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:awkwardturtle|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:toptwittertrends|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:qwerly|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:comedycentral|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:in|h:net|h:easybillindia|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:ign|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:yottaa|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:scribd|h:www|p:doc|p:33558074|p:MongoDB-our-Swiss-Army-Knife-database"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:floxee|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:info|h:fundastic|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:workbreeze|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:fanimpulse|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:joomlaads|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:jounce|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:bloomdigital|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:wikipedia|h:en|p:wiki|p:Reactor_pattern"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:wikipedia|h:en|p:wiki|p:Colocation_centre"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:wikipedia|h:en|p:wiki|p:Index_(database)"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:wikipedia|h:en|p:wiki|p:Base64"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:lockerproject|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:totsy|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:buddymedia|h:www|p:newsroom|p:2010|p:11|p:the-new-buddy-media-publisher-what-you-need-to-know"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:themoviedb|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:zawodny|h:blog"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:seattlemug|h:meetup|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:mongosf|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:dsharpdiabetes|h:cdn2|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:php|h:us|p:manual|p:en|p:book.mongo.php"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:cookbook|p:patterns|p:perform-two-phase-commits"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:ananasblau|p:2010|p:6|p:11|p:mongodb-in-my-photostre-am"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:activesphere|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:moxiesoft"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tracknose|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:idea2"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:piyavate|h:www|p:web"));
        pageItems.add(new PageItem().setLru("s:http|h:uk|h:co|h:morango|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:gigaom|h:event|p:structuredata"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:oscon|h:www|p:oscon2010"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:oscon|h:www|p:oscon2012"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:oscon|h:www|p:oscon2010|p:public|p:schedule|p:detail|p:13669"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:squarespace|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:vanilladesk|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:cyberagentamerica|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:maansu|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mcgeary|h:ryan|p:talks|p:2010|p:12|p:14|p:busyconf-mongodc"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:strataconf|p:strata2012"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eaipatterns|p:ramblings|p:18_starbucks.html"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:sourceforge|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:sourceforge|p:blog|p:sourceforge-releases-ming"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:directdialogs|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:ru|h:konverta|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:cloudfoundry|h:support|p:entries|p:20012337-getting-started-guide-command-line-vmc-users"));
        pageItems.add(new PageItem().setLru("s:http|h:sy|h:art|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:bsonspec|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:bsonspec|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:bsonspec"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:okezone|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tumblr|h:codeshal|p:post|p:499713180|p:the-secret-weapons-behind-the-chartbeat-beta"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tumblr|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tumblr|h:aurum|p:post|p:1045864983|p:gamechanger-and-mongodb-a-case-study-in-mysql"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tumblr|h:dmerr|p:post|p:6633338010|p:schemaless"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tumblr|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:localstars|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:techunits|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:pl|h:pracanowo|h:cv|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:grooveshark|h:listen|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:harmonyapp|h:get|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:vimeo|p:20489222"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:nexon|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:manofthehouse|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:givemebeats|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:teachstreet|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:linkedin|h:www|p:groups|q:gid=2340731&mostPopular="));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:beaconpush"));
        pageItems.add(new PageItem().setLru("s:http|h:ly|h:visual|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:costore|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:io|h:qwk|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:id|h:co|h:republika"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:loteriafutbol|h:en|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:proxlet|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:prezi|p:owkppjicpers|p:mongonyc"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:prezi|p:nojhakjnp9gf|p:mongo-one-year-later"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:examiner|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:nytimes|h:blogs|h:open|p:2010|p:05|p:25|p:building-a-better-submission-form"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:oodle|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:buzzfeed|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mxunit|h:blog|p:2009|p:10|p:look-ma-no-sql-mongodb-and-coldfusion_25.html"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mxunit|h:blog|p:2009|p:10|p:look-ma-no-sql-mongodb-and-coldfusion_20.html"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mxunit|h:blog|p:2009|p:10|p:look-ma-no-sql-mongodb-and-coldfusion.html"));
        pageItems.add(new PageItem().setLru("s:http|h:eu|h:ubicast|h:lacantine|p:videos|p:21-06-2010-104603-partie-1"));
        pageItems.add(new PageItem().setLru("s:http|h:eu|h:ubicast|h:lacantine|p:videos|p:21-06-2010-130932-partie-6"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:nodejs"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:loc-cit|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:squeejee|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:fishidy|h:www|p:Landing|q:ReturnUrl=%2F"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:royans|h:www|p:arch|p:mongodb-migration-from-mysql-at-wordnik"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:serverdensity|h:www|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:serverdensity|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:milaap|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:expressjs|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:expressjs"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:skillsmatter|p:podcast|p:cloud-grid|p:mongodb-humongous-data-at-server-density"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:skillsmatter|p:podcast|p:cloud-grid|p:mongodb-full-text-search-with-sphinx"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:skillsmatter|p:podcast|p:cloud-grid|p:speeding-up-your-rails-application-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:skillsmatter|p:podcast|p:cloud-grid|p:building-a-content-management-system-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:skillsmatter|p:podcast|p:cloud-grid|p:one-year-with-mongodb-at-silentale"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:monoloop|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:friendmaps|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:coldhardcode|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:coldhardcode|h:www|p:blog|p:2011|p:01|p:jarvis-technical-notes.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:salsadb|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:izlesene|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:railstips|p:2009|p:6|p:27|p:mongomapper-the-rad-mongo-wrapper"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:snailinaturtleneck|h:www|p:blog|q:p=271"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:snailinaturtleneck|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:snailinaturtleneck|h:www|p:blog|p:2010|p:02|p:22|p:sleepy-mongoose-a-mongodb-rest-interface"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:samlown|h:www|p:en|p:planetaki_powered_by_mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:vuzz"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:dather|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tuojie|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:lobster1234|p:mongo-meetup"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:pstokes2|p:social-analytics-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:mongosf|p:implementing-mongodb-at-shutterfly-kenny-gorman"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:jrosoff|p:scalable-event-analytics-with-mongodb-ruby-on-rails"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:mongodb|p:indexing-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:ibwhite|p:how-business-insider-uses-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:kbanker|p:mongodb-schema-design-mongony"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:mongosf|p:indexing-and-query-optimizer-aaron-staple"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:dacort|p:mongodb-realtime-data-colleciton-and-stats-generation"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:fehguy|p:managing-a-mongodb-deployment"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:mongodb|p:mongodb-replica-sets"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:snamura|p:mongodb-nodejs"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:vkuznet|p:das-iccs-2010"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:blinqmedia|p:mongodb-delivers-results-for-facebook-advertisers|q:from=share_email"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:dokdok|p:confoo-migrating-to-mongo-db"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:fehguy|p:why-wordnik-went-nonrelational"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:pfi|p:mongodb-as-search-engine-repository-mongotokyo2011"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:silentale|p:one-year-with-mongodb-at-silentale-mongofr-mongouk"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:naverjapan|p:mongodb-9422893"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:ibwhite|p:mongodb-in-production-at-sailthru"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:slideshare|h:www|p:mongodb|p:mongodb-indexing-the-details"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:spoondate|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:st|h:urli|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:groups|p:group|p:mongodb-user|p:browse_thread|p:thread|p:e2b4a5d198b398cf|p:547e3f3206c5dd37|q:lnk=gst&q=funadvice"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:groups|p:group|p:mongodbtr"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:groups|p:group|p:mongodb-jp"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:groups|p:group|p:mongodb-user"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:groups|p:group|p:node-mongodb-native"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:groups|p:group|p:mongodb-dev"));
        pageItems.add(new PageItem().setLru("s:http|h:ca|h:p2pfinancial|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:riaforge|h:mongocfc|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:xperantum|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:agentstorm|h:www|p:blog|p:2010|p:11|p:19|p:now-with-50-100-millisecond-search-results"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:agentstorm|h:www"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:appharbor|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:appharbor|p:addons"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:appharbor|p:addons|p:mongohq."));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:blip|p:file|p:3680481"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:blip|p:file|p:3593780"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:blip|h:mongodb|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:blip|p:file|p:3704043"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:blip|p:file|p:3704046"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:blip|p:file|p:3704023"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:blip|p:file|p:3704083"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:blip|p:file|p:3704098"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:blip|p:file|p:3701052"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:apple|h:itunes|p:jp|p:app|p:id449576650"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:abusix"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:debian|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:uquery|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:mixero|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:vigilantmedical"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:atlassian|h:jira|p:secure|p:BrowseProject.jspa|q:id=10470"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:dc-storm|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:boxedice|h:blog|p:2009|p:07|p:25|p:choosing-a-non-relational-database-why-we-migrated-from-mysql-to-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:boxedice|h:blog|p:2010|p:08|p:03|p:automating-partitioning-sharding-and-failover-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:boxedice|h:blog|p:2010|p:02|p:28|p:notes-from-a-production-mongodb-deployment"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:boxedice|h:blog|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:it|h:crs4|h:paraimpu|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:hipster|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:playshadelight|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:cloudamp|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wusoup|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:hashrocket|p:people"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:hashrocket|p:services|p:process"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:hashrocket|p:work|p:view|p:pharmmd"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:hashrocket|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:hashrocket|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:hashrocket|p:work"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:musweet|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:java"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:python|p:current|p:api|p:index.html"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:scala|p:casbah|p:current"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:python"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:cplusplus|p:0.9.2|p:classmongo_1_1_grid_f_s.html"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:cplusplus"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:ruby"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:ruby|p:current|p:Mongo|p:Connection.html"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:erlang"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:ruby|p:current|p:Mongo|p:ReplSetConnection.html"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:ruby|p:current|p:file.WRITE_CONCERN.html"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:c"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:haskell"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:csharp"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:api|p:ruby|p:current|p:file.REPLICA_SETS.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:solimap|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:jira|p:browse|p:SERVER|p:fixforversion|p:10595"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:jira|p:browse|p:SERVER-3372"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:jira|p:browse|p:SERVER-2193"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:jira|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:jira|p:secure|p:IssueNavigator.jspa|q:mode=hide&requestId=10107"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:jira|p:browse|p:Java"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sunlightlabs|h:services|p:docs|p:Drumbone_API"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sugarcrm|h:www|p:crm"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:evite|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:customink|h:www|p:categories"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:customink|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:avinu|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:virb|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:fons|p:cl-mongo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:mongodb|p:mongo-azure|p:blob|p:master|p:SampleApplications|p:README.md"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:edsrzf|p:mongogo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:mongodb|p:mongo-snippets|p:blob|p:master|p:js|p:compact-example.js"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:TonyGen|p:bson-erlang"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:gatesvp|p:cloudfoundry_node_mongodb|p:blob|p:master|p:app.js.1"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:poiati|p:gmongo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:joyent|p:node|p:wiki|p:Installation"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:erh|p:mongosv-twitter-demo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:LockerProject"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:TonyGen|p:mongodb-erlang"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:khueue|p:prolongo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:garyburd|p:go-mongo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:jsr|p:cloud-foundry-mongodb-demo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:kakserpom|p:phpdaemon|p:blob|p:master|p:app-clients|p:MongoClient.php"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:mongodb|p:casbah|p:downloads"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:mongodb|p:mongo-azure"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:TonyGen|p:mongoDB-haskell"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:nightroman|p:Mdbc"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:gatesvp|p:cloudfoundry_node_mongodb"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:mongodb|p:mongo-ruby-driver|p:tree|p:async"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:marcesher|p:cfmongodb"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:gerald-lindsly|p:rmongodb"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:TonyGen|p:mongodb-erlang|p:downloads"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|h:gist|p:947786"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:moai|p:luamongo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:mongodb|p:casbah"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:mongodb|p:mongo-azure|p:blob|p:master|p:ReplicaSets|p:README.md"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:tc|p:RMongo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:gerald-lindsly|p:mongo-matlab-driver"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:github|p:gatesvp|p:cloudfoundry_node_mongodb|p:blob|p:master|p:app.js.2"));
        pageItems.add(new PageItem().setLru("s:http|h:ch|h:cern|h:web|h:cms|p:cms|p:Education|p:ComicBook|p:index.html"));
        pageItems.add(new PageItem().setLru("s:http|h:ch|h:cern|h:web|h:cms|p:cms|p:index.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:shopopensky|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-x86_64-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-x86_64-v2.0-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-x86_64-v1.8-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:sunos5|p:mongodb-sunos5-x86_64-v1.8-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:sunos5|p:mongodb-sunos5-i86pc-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-i686-v2.0-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-x86_64-static-legacy-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:osx|p:mongodb-osx-i386-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-i386-v1.8-latest.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-x86_64-v1.8-latest.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-i686-v1.8-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:sunos5|p:mongodb-sunos5-x86_64-v2.0-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-i386-2.0.2.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-i386-v2.0-latest.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-i386-1.8.4.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:osx|p:mongodb-osx-x86_64-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-x86_64-static-legacy-v1.8-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-x86_64-latest.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-i386-latest.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:osx|p:mongodb-osx-x86_64-v2.0-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:src|p:mongodb-src-r1.8.4.tar.gz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-x86_64-2.0.2.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:src|p:mongodb-src-r1.8.4.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:osx|p:mongodb-osx-i386-v2.0-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:src|p:mongodb-src-r2.0.2.tar.gz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:sunos5|p:mongodb-sunos5-x86_64-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-x86_64-v2.0-latest.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-i686-static-v1.8-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-i686-static-v2.0-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-i686-static-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-x86_64-static-legacy-v2.0-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:win32|p:mongodb-win32-x86_64-1.8.4.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:osx|p:mongodb-osx-i386-v1.8-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:sunos5|p:mongodb-sunos5-i86pc-v2.0-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:linux|p:mongodb-linux-i686-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:sunos5|p:mongodb-sunos5-i86pc-v1.8-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:osx|p:mongodb-osx-x86_64-v1.8-latest.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:downloads|p:src|p:mongodb-src-r2.0.2.zip"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-java-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-perl-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:itiu|p:mongo-d-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:craftgear|p:node-mongoskin"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-csharp-driver|p:tree|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-java-driver|p:downloads"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:casbah"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-csharp-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongodb-erlang"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:stijnsanders|p:TMongoWire"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:tree|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:argoncloud"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-ruby-driver|p:tree|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:christkv|p:node-mongodb-native"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:zipball|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:zipball|p:v2.0-latest"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-ruby-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-c-driver|p:downloads"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:tarball|p:v2.0-latest"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:tree|p:master|p:jstests|p:mr2.js"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:chuckremes|p:jmongo"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongoDB-haskell"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-php-driver|p:tree|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:virtix|p:cfmongodb|p:tree|p:0.9"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-java-driver|p:tree|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|h:gist|p:218388"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:tmm1|p:rmongo"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:tree|p:master|p:jstests|p:mr1.js"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-python-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:algernon|p:libmongo-client"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:learnboost"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:lunaru|p:MongoRecord"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:commits|p:v1.8"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-perl-driver|p:tree|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:timburks|p:NuMongoDB"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mikejs|p:gomongo"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:slavapestov|p:factor|p:tree|p:master|p:extra|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:tarball|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-c-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:tarball|p:v1.8-latest"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-csharp-driver|p:downloads"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:wpntv|p:erlmongo|p:tree|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:zipball|p:v1.8-latest"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:commits|p:v2.0"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|h:mnutt|p:hummingbird"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:casbah|p:tree|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-python-driver|p:tree|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo-php-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:bcg|p:em-mongo"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:tree|p:master|p:jstests|p:mr5.js"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mongodb|p:mongo|p:commits|p:master"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:github|p:mxcl|p:homebrew"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:yottaa|h:blog|p:2010|p:09|p:how-yottaa-uses-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:funadvice|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:support"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongoboston2010|p:harmony"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongodb-at-sunlight"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv-2011|p:hands-on-deploying-mongodb-on-azure"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosv2010|p:indexing"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:event_mongony_10may21"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv-2011|p:performance-tuning-and-scalability"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongonyc-2011|p:blending-mongodb-with-rdbms-for-ecommerce"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongoberlin2010|p:musweet"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:contact-consulting"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:customers|p:disney"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv2010|p:wordnik"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv2010|p:acr"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:healthcheck"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:first-mongodb-application"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:mongodb16"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:diagnostics-and-tuning"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:conferences|p:event_mongouk_18june10"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:conferences|p:mongonyc2011"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv-2011|p:experiences-deploying-mongodb-on-aws"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:webinar|p:mongodb-analytics-for-online-advertising-at-magnetic"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentation|p:mongonyc-2011|p:how-mtv-networks-leverages-mongodb-for-cms"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongodallas-2011|p:designing-algorithms-that-scale-horozontally-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:nyc-meetup-group|p:mongodb-at-fiesta.cc"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongo-sydney"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosv2010|p:craigslist"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:customers|p:mtv-networks"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:customers|p:shutterfly"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongouk-2011|p:intelligent-stream-filtering-using-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentation|p:mongonyc-2011|p:nytimes"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosv2010|p:indexingdetails"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:monitoring-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosf2011|p:sharding"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:asynchronous-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongoberlin2010|p:edelight"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongodb-version-2dot0-s2"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongodb-version-2dot0-s1"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongo-atlanta"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:hybrid-applications"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongodb-stockholm"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:swag"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosv2010|p:intuit"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:officehours"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongo-austin"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongo-boston-2011"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:mongodb-ruby-2011"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:csharp"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:customers|p:buddymedia"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:misc|p:foursquareqa"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosv2010|p:ign"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:customers|p:craigslist"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:misc|p:foursquare"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongoboston2010|p:totsy"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosf-2011|p:how-we-switched-from-hibernate-to-mongodb-in-a-week-with-morphia"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv-2011|p:x.commerce-makes-a-big-bet-on-open-source"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:event_mongosf_10apr30"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosf2011|p:journaling"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:customers|p:intuit"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentation|p:mongonyc-2011|p:foursquare"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:contact"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentation|p:mongoboston-2011|p:welcome-and-whats-new-in-mongodb-2.0"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv2010|p:boxedice"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentation|p:mongosf2011|p:craigslist"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongodallas-2011|p:achieving-2-plus-years-of-mongo-stability-and-performance-on-sf-net"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongodallas-2011|p:rapid-and-scalable-development-with-mongodb-pymongo-and-ming"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongouk-2011|p:introduction-to-saps-java-platform-as-a-service"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentation|p:mongosf2011|p:disney"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongodb-berlin"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:training"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentation|p:mongonyc-2011|p:forbes"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:reference"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosf2011|p:schemabasics"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:ny-mug|p:tracking-analytics-with-mongodb-at-signpost-mongodb-for-online-advertising"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:javawebapps"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongoboston2010|p:punchbowl"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongodb-dc-2012"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongosv-2011"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:nodejs"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosf-2011|p:allura-open-source-mongodb-based-document-oriented-sourceforge"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:visibiz"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:event_boxedice_10may5"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosf-2011|p:mongodb-monitoring-and-queueing"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosf2011|p:shutterfly"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv-2011|p:a-year-with-mongodb-running-operations-to-keep-the-game-magic-alive"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongonyc-2011|p:how-a-hedge-fund-uses-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:customers|p:foursquare"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:customers|p:wordnik"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosf2011|p:craigslist"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongo-los-angeles"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosv2010|p:eventbrite"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongoatlanta2011|p:sourceforge"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv2010|p:sharethis"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:nyc-meetup-group|p:mongodb-and-ec2-a-love-story"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv-2011|p:realtime-analytics-using-mongodb-python-gevent-and-zeromq"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|q:application=content_management&event=&programming_lang="));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:user-groups"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:lightning-consult"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv-2011|p:the-shutterfly-data-layer-and-schema-definitions"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongodc-2011|p:time-series-data-storage-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:conferences|p:mongosv2010"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv-2011|p:from-the-cloud-and-back"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:conferences|p:event_mongofr_21june10"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosv-2011|p:mongodbs-new-aggregation-framework"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|q:application=web2"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongo-boulder"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongonyc-2011|p:mongodb-and-nodejs"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:v18"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongo-tokyo-2012"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosf-2011|p:mongodb-with-python-pylons-pyramid"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosv2010|p:shutterfly"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:ec2"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentation|p:mongoboston-2011|p:cowboy-coding-learn-when-and-how-to-break-all-the-rules-for-really-rapid-prototyping"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:pygotham2011|p:behind-the-scenes-at-fiesta"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:misc|p:replicasets"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongoboston-2011|p:how-mtv-leverages-mongodb-for-cms"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongosf2011|p:wordnik"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentation|p:mongoboston-2011|p:how-mtv-leverages-mongodb-for-cms"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosv2010|p:schemadesign"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|p:mongonyc-2011|p:secondmarket"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosf2011|p:schemascale"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongodb-schema-design"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:presentations|q:application=e_commerce&event=&programming_lang="));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:webinars|p:cloudfoundry"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:mongosf2011|p:foursquare"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:video|p:misc|p:ecommerce"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:www|p:events|p:mongodb-uk"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:6254464258|p:how-journaling-and-replication-interact"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:424944471|p:2d-geospatial-indexing"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:523516007|p:on-distributed-consistency-part-6-consistency-chart"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:607112305|p:write-a-blog-post-on-mongodb-for-a-chance-to-win-a"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:10407828262|p:cache-reheating-not-to-be-ignored"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:5545198613|p:mongodb-live-at-craigslist"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:472834501|p:mongodb-1-4-performance"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:171353301|p:using-mongodb-for-real-time-analytics"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:2844804263|p:the-state-of-mongodb-and-ruby"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2008|p:12"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:459199759|p:are-you-going-to-structure"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:6587009156|p:cloudfoundry-mongodb-and-nodejs"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:2388886125|p:five-new-replica-set-features-in-1-7-x"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:4719358003"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:4982676520|p:mongodb-on-ec2-best-practices"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:9"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:7"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:8"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:5"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:6"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:4"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:3"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:1"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:428483394|p:you-need-to-learn-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:586818965|p:mongosf-slides-video-discounts-on-upcoming-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:4052034124|p:introduction-to-the-official-c-driver-from-10gen"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:5217011262|p:improving-scalable-java-application-development-with-mon"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:11321480271|p:mongo-boston-recap"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:12"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:3903149313|p:mongodb-1-8-released"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:137788967|p:32-bit-limitations"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2009|p:10"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2009|p:12"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2009|p:11"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:660037122|p:holy-large-hadron-collider-batman"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:812003773|p:node-js-and-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:677516152|p:blog-contest-winners"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:9"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:8"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:7"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:6"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:10450332040|p:2-0-presentation-at-new-york-mongodb-user-group"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:4"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:5"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:page|p:3"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:page|p:2"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:673306445|p:highlights-from-mongonyc"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:12290838151|p:mongodb-monitoring-service-docs-available"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:4719358003|p:getting-started-with-vmware-cloudfoundry-mongodb-and"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:13594969869|p:mongodb-on-microsoft-azure"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:5360007734|p:mongodb-powering-mtvs-web-properties"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:434865639|p:state-of-mongodb-march-2010"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:7270427645|p:design-of-the-erlang-driver-for-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|q:before_time=1266943680"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2009|p:4"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:407211339|p:announcing-speakers-for-nosql-live"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:468501961|p:mongodb-day-austin-coming-up-on-saturday-march-27"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:452856206|p:nosql-live-boston-recap"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:550850783|p:mongodb-q1-download-numbers"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:11"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:10"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2011|p:12"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:573215976|p:mongodb-conferences-in-london-and-paris-in-june"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2009|p:9"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2009|p:8"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2009|p:7"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2009|p:6"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2009|p:5"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:page|p:1"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:456716319|p:announcing-mongosf"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:1200539426|p:archiving-a-good-mongodb-use-case"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:9333386434|p:bson-and-data-interchange"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:475279604|p:on-distributed-consistency-part-1"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:472835820|p:mongodb-1-4-ready-for-production"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:14318434522|p:mongosv-recap"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:172254834|p:mongodb-is-fantastic-for-logging"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:505822180|p:on-distributed-consistency-part-3-network"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:516567520|p:on-distributed-consistency-part-4-multi-data-center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:498145601|p:on-distributed-consistency-part-2-some-eventual"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:119945109|p:why-schemaless"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:rss"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:520888030|p:on-distributed-consistency-part-5-many-writer"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:447761175|p:should-mongodb-use-sql-as-a-query-language"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:6320979730|p:a-reminder-about-mongodb-office-hours"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:420121891|p:mongodb-march-events-and-nyc-office-hours"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:908172564|p:mongodb-1-6-released"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:7494240825|p:master-detail-transactions-in-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:post|p:10126837729|p:mongodb-2-0-released"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:1"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:3"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:blog|p:archive|p:2010|p:2"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:blog|p:post|p:10239727744|p:mongodb-selected-as-the-core-content-management"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:blog|p:post|p:13885501875|p:announcing-the-mongodb-masters"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=MN4F13adAm&pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Articles"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~dwight"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:GridFS+Tools"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=przA3sXkci&pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:administrators.action"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Slides+and+Video"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=17596561"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:International+Docs"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=jPqjoGnbmy&pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Schema+Design|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:github.com|p:mongodb|p:mongo|p:zipball|p:v1.8-latest|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=17596561"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:viewspacesummary.action|q:key=DOCS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FReplication"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:github.com|p:mongodb|p:mongo|p:tarball|p:v1.8-latest|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=21268670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets+-+Priority"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=21267633"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Java+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=TQZCBxU4X0&pageId=17596795"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:linux|p:mongodb-linux-i686-static-1.8.4.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=5l9YtQcT_R&pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:sunos5|p:mongodb-sunos5-x86_64-1.8.4.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Compact+Command|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~jsr"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Quickstart"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=27165478&pageId=24707151"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:updates"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Object+IDs"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=21268630"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29819432&pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=24707151"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Architecture+and+Components"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=BzUeg-ista&pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Server-side+Code+Execution"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sharding"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=fs3EhOzGLo&pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Events|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=P6qPAeOvtF&pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Simple+Initial+Sharding+Architecture"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Drivers|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=24708155&pageId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NoJS0WvC8A&pageId=21268670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-i686-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=MpXUz9EeMb&pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:printslavereplicationinfo"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:github.com|p:mongodb|p:mongo|p:tarball|p:master|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=POovUEj0rp&pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-i686-static-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+on+Azure|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~mathias"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:viewmailarchive.action|q:key=DOCS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:github.com|p:mongodb|p:mongo|p:tarball|p:v2.0-latest|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-x86_64-static-legacy-v2.0-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-i386-v1.8-latest.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:github.com|p:mongodb|p:mongo|p:zipball|p:v2.0-latest|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=p6K2kHpOuu&pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=Q3RWuT0TSd&pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:SQL+to+Mongo+Mapping+Chart|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:CentOS+and+Fedora+Packages"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=B_IbrGBCPO&pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:download|p:attachments|p:590845|p:skimlinks.png"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Dot+Notation+(Reaching+into+Objects)"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=lEQucvsl0l&pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=eHzhXIIo6Q&pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Querying|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=przA3sXkci&pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:createCollection+Command"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=132305"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Quickstart+Unix"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=qG0EzBntwh&pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:How+MongoDB+is+Used+in+Media+and+Publishing"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=-0f-IAkgOC&pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Haskell+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:International+Documentation|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-i686-static-v1.8-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=23232639&pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=eHzhXIIo6Q&pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Versions+and+Compatibility"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:download|p:attachments|p:9830402|p:mongodb+replica+sets+intro.pdf"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Overview+-+Writing+Drivers+and+Tools"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Python+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=2nhRIL-iQr&pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:osx|p:mongodb-osx-x86_64-1.8.4.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:1.6+Release+Notes"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NoJS0WvC8A&pageId=132148"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=_IYoJZ8MOy&pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Quickstart|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Alerts"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Tutorial"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:download|p:attachments|p:590845|p:mashape.png"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Resyncing+a+Very+Stale+Replica+Set+Member"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~sridhar"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sharding|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:sunos5|p:mongodb-sunos5-i86pc-v1.8-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:download|p:attachments|p:590845|p:kapost.png"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-x86_64-v1.8-latest.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=xpYlYS2BTN&pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FMongoDB%2BUser%2BGroups%2B%28MUGs%29"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=etd-ga5UC3&pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=23855973&pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FMongoDB%2Bon%2BAzure"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=XEoTCk74F2&pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:src|p:mongodb-src-r2.0.2.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Security+and+Authentication|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:1.8+Release+Notes"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Geospatial+Indexing"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Journaling"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2F2.0%2BRelease%2BNotes"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Ruby+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NoJS0WvC8A&pageId=21268630"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Perl+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:src|p:mongodb-src-r1.8.4.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:About"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Validate+Command"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:github.com|p:mongodb|p:mongo|p:zipball|p:master|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:When+to+use+GridFS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=132148"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-i686-v1.8-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=21267633"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FReplica%2BSets"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~francescakrihely"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=s29R8HAmgW&pageId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:map"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29393217&pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=-lnjgiGbxl&pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Mongo+Usage+Basics"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpage.action|q:pageId=133409"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~geir"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=17596561"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:BSON"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:SQL+to+Mongo+Mapping+Chart"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=x1BO0hgy8g&pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:$"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sharding+FAQ"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:JVM+Languages"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Production+Deployments|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpage.action|q:pageId=17137769"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~kyle"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-i386-2.0.2.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:download|p:attachments|p:2097354|p:how+queries+work+with+sharding.pdf"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FDrivers"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=etd-ga5UC3&pageId=17596795"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Admin+UI"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:inc"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:download|p:attachments|p:590845|p:dakwak.png"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+on+Azure|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NoJS0WvC8A&pageId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:2.0+Release+Notes"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FQuerying"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Azure+Configuration"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Journaling|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Source+Code|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Updating+Data+in+Mongo"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~tyler@10gen.com"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Design+Concepts"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Full+Text+Search+in+Mongo"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Collections"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-x86_64-v2.0-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Databases"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Padding+Factor"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:linux|p:mongodb-linux-i686-2.0.2.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Upgrading+to+Replica+Sets"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~meghan"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=qG0EzBntwh&pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=132148"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:space-bookmarks.action|q:spaceKey=DOCS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets+-+Oplog"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=uXYYnCQJLG&pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-x86_64-2.0.2.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:durability"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Authentication"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:src|p:mongodb-src-r2.0.2.tar.gz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NoJS0WvC8A&pageId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FReplica%2BSet%2BDesign%2BConcepts"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=2uLhe8EXKO&pageId=17596561"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Drivers|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FInternational%2BDocumentation"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=24707151"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=s29R8HAmgW&pageId=21268670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=27854360&pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:upsert"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=UAbRdvsE4o&pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NBrXHQ4wr9&pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:download|p:attachments|p:590845|p:skyline-logo_square.jpg"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29393039&pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replication+Oplog+Length"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=s29R8HAmgW&pageId=21267633"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Commands"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:listattachmentsforspace.action|q:key=DOCS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:sunos5|p:mongodb-sunos5-i86pc-2.0.2.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=8cVEc365Zy&pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=t6SNq8uDlJ&pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages.action|q:key=DOCS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:osx|p:mongodb-osx-x86_64-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Internals"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:nosql"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29393171&pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=21267633"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Tutorial"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Changing+Config+Servers"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=21267633"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Job+Board"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:compact+Command"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=-0f-IAkgOC&pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:linux|p:mongodb-linux-x86_64-1.8.4.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:sunos5|p:mongodb-sunos5-i86pc-v2.0-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Dot+Notation"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Advanced+Queries"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Inserting"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Trees+in+MongoDB"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Journaling|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=s29R8HAmgW&pageId=24707151"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Mongo+Wire+Protocol"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29393036&pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=xHigKwAtRv&pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FUpdating"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Events|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=21268670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Quickstart+OS+X"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Downloads"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Reconfiguring+when+Members+are+Up"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FPhilosophy"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:sunos5|p:mongodb-sunos5-x86_64-v1.8-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=w1zn9mnyfN&pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NoJS0WvC8A&pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=28901771&pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Mongo+Query+Language"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=24707151"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=tnlo5GCz5G&pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Quickstart|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=21268630"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=21268630"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Atomic+Operations"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Events"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Journaling+Administration+Notes"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29819363&pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=17596561"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Visit+the+10gen+Offices"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Querying+and+nulls"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCSKR"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=17596795"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=24707151"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sharding+Introduction"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FSecurity%2Band%2BAuthentication"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCSJP"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Data+Center+Awareness"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Use+Cases"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:CSharp+Community+Projects"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=lnuSpTzUsx&pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:getLastError+Command|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=21268670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:quickref"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:download|p:attachments|p:2097354|p:mongodb+sharding+and+chunks+example.pdf"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=AwmjzE3TDQ&pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCSIT"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Driver+Syntax+Table"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Commands"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=UuEpr2PQsq&pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Philosophy|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sharding+and+Failover"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:osx|p:mongodb-osx-x86_64-v2.0-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2Fcompact%2BCommand"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=21268630"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCSFR"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Adding+an+Arbiter"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FHome"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-x86_64-static-legacy-v1.8-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Master+Slave"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:osx|p:mongodb-osx-i386-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Choosing+a+Shard+Key"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FgetLastError%2BCommand"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Use+Cases|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Optimizing+Object+IDs"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=21268670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCSDE"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Querying"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:compact"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-i386-v2.0-latest.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:download|p:attachments|p:590845|p:contactme.png"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=DC9il4rzXd&pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCSCN"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=_ac9GtFdoi&pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Indexing+Advice+and+FAQ"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~kristina"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:min+and+max+Query+Specifiers"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:push"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=21268670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Building+indexes+with+replica+sets"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~eliot"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:sunos5|p:mongodb-sunos5-x86_64-2.0.2.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=im-k7b4x4O&pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=17596795"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:two-phase+commit|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:src|p:mongodb-src-r1.8.4.tar.gz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~spf13"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FVerifying%2BPropagation%2Bof%2BWrites%2Bwith%2BgetLastError"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FSQL%2Bto%2BMongo%2BMapping%2BChart"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=tNIl9oI0YD&pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FIndexes"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replication|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+Masters"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FMongoDB%2BCommercial%2BServices%2BProviders"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Indexes|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Production+Deployments"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2Ftwo-phase%2Bcommit"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Mongo-Based+Applications"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Index+Versions"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=s29R8HAmgW&pageId=21268630"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Database+Profiler"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+User+Groups+(MUGs)|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=UAbRdvsE4o&pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FQuickstart"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29392971&pageId=21268670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MapReduce|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=21267633"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Semantics"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Configuration"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Use+Case+-+Session+Objects"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FEvents"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Home"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sharding+Limits"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=TQZCBxU4X0&pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Starting+and+Stopping+Mongo"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Security+and+Authentication"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Contributors"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Pairs"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Azure+Deployment"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=P6qPAeOvtF&pageId=17596561"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:osx|p:mongodb-osx-i386-2.0.2.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Version+Numbers"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:'%20+%20theEvents%5B'results'%5D%5Bi%5D.event_url%20+%20'"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=9exBM-jMbw&pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:linux|p:mongodb-linux-x86_64-static-legacy-2.0.2.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=27164824&pageId=17596561"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=Sgm4QGcXd8&pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-x86_64-v2.0-latest.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Connecting+to+Replica+Sets+from+Clients"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:reduce"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Developer+FAQ"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FUse%2BCases"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Querying|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Home|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29819076&pageId=21268630"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:set"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=28901840&pageId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+Commercial+Services+Providers|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:downloads"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=24707151"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=MN4F13adAm&pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=24707151"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:sunos5|p:mongodb-sunos5-x86_64-v2.0-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Overview+-+The+MongoDB+Interactive+Shell"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=132148"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=N-ntsabNoW&pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:quick"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=PJjuXDLSke&pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:command"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29819404&pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FMapReduce"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=132148"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:node.JS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=27853930&pageId=132148"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:osx|p:mongodb-osx-x86_64-2.0.2.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-x86_64-1.8.4.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-x86_64-latest.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets+Limits"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:findAndModify+Command"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=mWByl7C12I&pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:getreplicationinfo"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-i386-1.8.4.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=Fg7WgK8xGc&pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-i686-v2.0-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:CSharp+getLastError+and+SafeMode"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:CSharp+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=yiVMSvRTa-&pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=rMMUOHPCyO&pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=AwmjzE3TDQ&pageId=17596561"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Backups"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Tweaking+performance+by+document+bundling+during+schema+design"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sharding+Internals"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Durability+and+Repair"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=132148"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=s29R8HAmgW&pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:sheet"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=MvLVX50IiE&pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=Qhc1tWrt45&pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Drivers"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:SQL+to+Mongo+Mapping+Chart|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:two-phase+commit"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:labels|p:listlabels-heatmap.action|q:key=DOCS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Compact+Command"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=xsmZIqmYNn&pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Quickstart+Windows"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=2uLhe8EXKO&pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=xpYlYS2BTN&pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Community"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=Q3RWuT0TSd&pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-x86_64-static-legacy-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=_NxDcNfpss&pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Doc+Index"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:cheat"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Viewing+and+Terminating+Current+Operation"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=17596795"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:PHP+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:getLastError+Command"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:win32|p:mongodb-win32-i386-latest.zip|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+Design+Concepts|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=SLS9AAWYrd&pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replication"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=jNoMPpDjZl&pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=25265001&pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:ref"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets+Troubleshooting"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Query+Optimizer"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewrecentblogposts.action|q:key=DOCS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=q4ZALxU12e&pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29393041&pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:osx|p:mongodb-osx-i386-v1.8-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:sunos5|p:mongodb-sunos5-i86pc-1.8.4.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=17596561"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MapReduce|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=I9mPaXG2oq&pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Ubuntu+and+Debian+packages"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+Data+Modeling+and+Rails"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Building"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:sunos5|p:mongodb-sunos5-i86pc-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=iyoqHUW6FC&pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=xsmZIqmYNn&pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Writing+Drivers+and+Tools"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:osx|p:mongodb-osx-x86_64-v1.8-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Javascript+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Verifying+Propagation+of+Writes+with+getLastError"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:International+Documentation"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Updating|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:osx|p:mongodb-osx-i386-v2.0-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=rbpRyoTxGd&pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Introduction"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Index-Related+Commands"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets+-+Basics"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Adding+a+New+Set+Member"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:About+the+local+database"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+Commercial+Services+Providers"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=28901811&pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=9gyk4YCO1i&pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=lnuSpTzUsx&pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:GridFS|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FJournaling"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Indexing+as+a+Background+Operation"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpage.action|q:pageId=21270051"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=IbGbNvQ8-L&pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Retrieving+a+Subset+of+Fields"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=s29R8HAmgW&pageId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=1475652"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=21267633"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=21268630"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~dan@10gen.com"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Capped+Collections"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sharding|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:GridFS+Specification"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:linux|p:mongodb-linux-i686-1.8.4.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=vD7SciHvrf&pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=_ac9GtFdoi&pageId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=Hv65YMrr-7&pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Tools+and+Libraries"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=bNJlPaJLk8&pageId=589860"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=21270663"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~cwestin"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Durability+Internals"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=6HE3YIOMuW&pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=UAbRdvsE4o&pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Why+Replica+Sets"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=I9mPaXG2oq&pageId=17596795"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=B_IbrGBCPO&pageId=131465"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:User+Feedback"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~rian"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Reconfiguring+a+replica+set+when+members+are+down"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Moving+or+Replacing+a+Member"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Configuring+Sharding"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:listpages-dirview.action|q:key=DOCS&openId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=UuEpr2PQsq&pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Philosophy"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Production+Notes"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=27853063&pageId=9830402"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+Commercial+Services+Providers|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=27852966&pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replication|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets+-+Rollbacks"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Windows"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Home|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:flushRouterConfig+command"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~antoine"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Scala+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Manual"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Updating|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=MN4F13adAm&pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=XEoTCk74F2&pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:GridFS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Forcing+a+Member+to+be+Primary"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Indexes|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Erlang+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Multikeys"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=21268670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=19562967&pageId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:events"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~spencer"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sharding+Administration"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:OR+operations+in+query+expressions"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Your+Go-to+Resource+for+Running+a+MongoDB+User+Group"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Updating"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Indexes"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NoJS0WvC8A&pageId=21267633"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCSRS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Developer+Zone"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29392975&pageId=21267633"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=s29R8HAmgW&pageId=132148"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FSource%2BCode"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Schema+Design|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Queries+and+Cursors"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Verifying+Propagation+of+Writes+with+getLastError|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Use+Cases|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+User+Groups+(MUGs)"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29819406&pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=27164915&pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=21268630"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:operators"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Books"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Online+API+Documentation"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=La0Obp33G7&pageId=1475048"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Upgrading+from+a+Non-Sharded+System"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:linux|p:mongodb-linux-x86_64-2.0.2.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FGridFS"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=29819196&pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=17596795"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Sorting+and+Natural+Order"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Sets+-+Voting"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=evspwFMF4L&pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:mongo+-+The+Interactive+Shell"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:metadataLink=true&pageId=7209068"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=im-k7b4x4O&pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Source+Code"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:osx|p:mongodb-osx-i386-1.8.4.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FProduction%2BDeployments"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=15171600"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=xPm_JJBTUJ&pageId=131081"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=xPm_JJBTUJ&pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpagesrc.action|q:pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:~tad"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Admin+Zone"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:cheatsheet"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=t6SNq8uDlJ&pageId=590394"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-x86_64-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:C+Language+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Schema+Design"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NoJS0WvC8A&pageId=24707151"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=pCVMstMTqU&pageId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=fW4BCot2R_&pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Troubleshooting+MapReduce"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FSharding"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=132298"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=NoJS0WvC8A&pageId=590729"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-x86_64-v1.8-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:printreplicationinfo"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Import+Export+Tools"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=POovUEj0rp&pageId=590523"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:GridFS|q:showChildren=false"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewinfo.action|q:pageId=590845"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:label|p:DOCS|p:getlasterror"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Technical+Support"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:linux|p:mongodb-linux-i686-static-v2.0-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=8716963"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:linux|p:mongodb-linux-i686-static-2.0.2.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=28901921&pageId=1475679"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=5aWUbI6M0P&pageId=1475670"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=s29R8HAmgW&pageId=3048088"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=17596795"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MongoDB+on+Azure"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:downloads.mongodb.org|p:sunos5|p:mongodb-sunos5-x86_64-latest.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:diffpages.action|q:originalId=27853617&pageId=17596795"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Hosting+Center"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Replica+Set+FAQ"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=132148"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpageattachments.action|q:pageId=20742844"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:exportword|q:pageId=2097354"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Aggregation"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:2.0+Release+Notes|q:showCommentArea=true&showComments=true"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpreviousversions.action|q:pageId=2752789"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=BaXDgAv2q-&pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:pages|p:viewpage.action|q:pageId=21268822"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:Licensing"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=UixzGziEm9&pageId=131518"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:dr|p:fastdl.mongodb.org|p:linux|p:mongodb-linux-x86_64-static-legacy-1.8.4.tgz|p:download"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:login.action|q:os_destination=%2Fdisplay%2FDOCS%2FSchema%2BDesign"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:display|p:DOCS|p:MapReduce"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:www|p:spaces|p:flyingpdf|p:pdfpageexport.action|q:atl_token=zCIWZ4Eu6g&pageId=131603"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:jaredrosoff"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:ubuntu|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:stickybits|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sparcet|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:ly|h:scrabb|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:flickr|h:www|p:photos|p:49439061@N04|p:sets|p:72157627716787783|p:with|p:6221048217"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:flickr|h:www|p:photos|p:49439061@N04|p:6221048217"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:nodeknockout|p:teams|p:new"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:nodeknockout|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:webex|h:10genevents|p:ec0605lc|p:eventcenter|p:recording|p:recordAction.do;jsessionid=7QhXN1nR7t256CVRTnqKKLvnGn2lgTgMJYZPVC61W983bG1Gw0Bp!-1954799644|q:AT=pb&SP=EC&actappname=ec0605lc&actname=%2Feventcenter%2Fframe%2Fg.do&apiname=lsr.php&entactname=%2FnbrRecordingURL.do&entappname=url0107lc&format=short&isurlact=true&needFilter=false&rID=3610057&rKey=99ab04acf8a5b5e6&recordID=3610057&renewticket=0&renewticket=0&rnd=1831386686&siteurl=10genevents&theAction=poprecord"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:dianping|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364644716"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2356281702"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2356333858"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364610614"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2665834583"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364650734"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:1794538513"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2356297750"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2306169816"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364588548"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2369846274"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364602590"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2356347900"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364618638"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364636692"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2369820196"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364592560"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2356219516"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364594566"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364624656"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2369322708"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2369832232"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:www|p:event|p:2364614626"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:KL-MongoDB-User-Group|p:events|p:dfgsbcyqdbcb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:San-Francisco-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:New-York-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Philladelphia-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Toronto-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Swiss-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Chicago-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Stockholm-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:find|q:events=&gcResults=&keywords=mongoDB&lat=&lon=&mcId=&mcName=&op=search&resetgeo=true&submitButton=Search&userFreeform="));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:SP-MongoDB"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Munchen-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:MongoDB-Brasil"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Findland-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Paris-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Melbourne-MongoDB-User-group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Boston-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:London-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Saint-Louis-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:mongo-il"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:mongodbmx"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Los-Angeles-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:KL-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:MongoRaleigh"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Boston-MongoDB-User-Group|p:events|p:35018592"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Washington-DC-MongoDB-Users-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Bristol-MongoDB-user-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Huntsville-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:meetup|h:www|p:Atlanta-MongoDB-User-Group"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:facebook|h:www|p:pages|p:MongoDB|p:397955415556"));
        pageItems.add(new PageItem().setLru("s:http|h:jp|h:naver|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:interstateapp"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:struq|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:newscurve|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:shopwiki|h:devblog|p:post|p:660499806|p:averys-talk-at-mongonyc"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:dougfinke|p:blog|p:index.php|p:2009|p:10|p:25|p:how-to-use-mongodb-from-powershell-and-f"));
        pageItems.add(new PageItem().setLru("s:http|h:se|h:glo|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:de|h:excitingcommerce|h:www|p:2010|p:09|p:edelight-mongodb.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:peerpong|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:by|h:goo|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:plumwillow|h:www"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:facebook|h:www|p:groups|p:klmug"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sluggy|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sunlightlabs|p:blog|p:2010|p:how-we-use-mongodb-sunlight"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sunlightlabs|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:nytimes|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:oreillynet|h:www|p:pub|p:e|p:1826"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:oreillynet|p:pub|p:e|p:2109"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:oreilly|p:catalog|p:0636920018391"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:oreilly|p:catalog|p:0636920018308"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:oreilly|p:catalog|p:9780596101718"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:php|h:pecl|p:package|p:mongo"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:rowfeeder"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:pycon|h:us|p:2010|p:conference|p:schedule|p:event|p:110"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:singly|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:linux|p:mongodb-linux-x86_64-1.8.4.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:linux|p:mongodb-linux-i686-static-2.0.2.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:linux|p:mongodb-linux-i686-static-1.8.4.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:linux|p:mongodb-linux-x86_64-static-legacy-1.8.4.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:linux|p:mongodb-linux-x86_64-static-legacy-2.0.2.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:linux|p:mongodb-linux-x86_64-2.0.2.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:linux|p:mongodb-linux-i686-1.8.4.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:sunos5|p:mongodb-sunos5-x86_64-1.8.4.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:osx|p:mongodb-osx-i386-2.0.2.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:osx|p:mongodb-osx-i386-1.8.4.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:sunos5|p:mongodb-sunos5-i86pc-2.0.2.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:osx|p:mongodb-osx-x86_64-2.0.2.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:sunos5|p:mongodb-sunos5-i86pc-1.8.4.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:linux|p:mongodb-linux-i686-2.0.2.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:sunos5|p:mongodb-sunos5-x86_64-2.0.2.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:fastdl|p:osx|p:mongodb-osx-x86_64-1.8.4.tgz"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:fotopedia|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:travelpost|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:trendrr|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sciencedirect|h:www|p:science|q:_acct=C000050221&_alid=1599887349&_cdi=59117&_coverDate=05%2F31%2F2010&_ct=9&_docanchor=&_fmt=high&_ob=ArticleURL&_orig=search&_origin=search&_rdoc=2&_sort=r&_st=13&_udi=B9865-506HM1Y-63&_urlVersion=0&_user=10&_userid=10&_version=1&_zone=rslt_list_item&md5=3cac4c1c78f95ee5d0e3f274a6209537&searchtype=a&view=c"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:catch|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:catch|p:blog|p:2011|p:03|p:pycon-2011-mongodb-pylons-at-catch-com-scalable-web-apps-with-python-and-nosql"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:infoq|h:www|p:presentations|p:MongoDB-at-SourceForge"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:mongodb|h:jira|p:secure|p:IssueNavigator.jspa|q:mode=hide&requestId=11002"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:mongodb|h:jira|p:browse|p:SERVER-1097"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:mongodb|h:jira|p:secure|p:IssueNavigator.jspa|q:component=10010&mode=hide&pid=10000&reset=true&resolution=-1&sorter%2Ffield=priority&sorter%2Forder=DESC"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:mongodb|h:jira|p:browse|p:SERVER-2563"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:mongodb|h:jira|p:browse|p:AZURE"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:mongodb|h:jira|p:secure|p:IssueNavigator.jspa|q:requestId=11023"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:mongodb|h:jira|p:secure|p:IssueNavigator.jspa|q:requestId=10140"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:mongodb|h:jira|p:browse|p:SERVER|p:fixforversion|p:10991"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:businessinsider|h:www|p:how-we-use-mongodb-2009-11"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:businessinsider|h:www|p:business-insider-tech-infrastructure-2011-6"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:freebsd|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:osx|p:x86_64"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:linux|p:x86_64"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:docs"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:win32|p:x86_64"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:sunos5|p:i86pc"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:osx|p:i386"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:linux|p:i686"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:src"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:cxx-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:sunos5|p:x86_64"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:dl|p:dl|p:win32|p:i386"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:phpmyengine|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:cairenhui|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:yasabe|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:google|h:groups|p:group|p:mongodb-user"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:collaborate12|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:th|h:in|h:mongodb|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:ch|h:vow|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:ch|h:vow|p:2ij"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:twitter|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:twitter|p:forjared"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:twitter"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:twitter|h:www|p:kchodorow"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:twitter|h:www|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:twitter|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|h:mms|p:help"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:10gen|p:conferences|p:mongonyc2011"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:blabbermouthsocial|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:cc|h:fiesta|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:vschart|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:ly|h:bit|p:mongofb"));
        pageItems.add(new PageItem().setLru("s:http|h:ly|h:bit|p:chartbeat_mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:ly|h:bit|p:cajdYS"));
        pageItems.add(new PageItem().setLru("s:http|h:ly|h:bit|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:ly|h:bit|p:bitly_mongo"));
        pageItems.add(new PageItem().setLru("s:http|h:ly|h:bit"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:code|p:p|p:pebongo"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:code|p:p|p:luamongo"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:code|p:p|p:entity-language|p:wiki|p:mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:uk|h:co|h:stockopedia|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:defensio|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:copperegg|h:www|p:product|p:cloud-monitoring|q:utm_campaign=partner&utm_medium=listing&utm_source=mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:copperegg|h:www|p:|q:utm_campaign=partner&utm_medium=listing&utm_source=mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:peerindex|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:ru|h:rosspending|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:heiaheia|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:me|h:chirpat|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:thebitsource|h:www|p:featured-posts|p:mongosf-zero-to-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:carboncalculated|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:smfuse|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:spf13|p:post|p:augmenting-rdbms-with-nosql-for-e-commerce"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eztexting|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:secondmarket|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:opalang|h:doc|p:manual|p:Hello--MongoDB"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:editd|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tisproperty|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:equilar|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:socialcitydeals|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:cc|h:fiesta|h:blog|p:post|p:11319522700|p:walkthrough-mongodb-data-modeling"));
        pageItems.add(new PageItem().setLru("s:http|h:cc|h:fiesta|h:blog|p:post|p:10980328832|p:walkthrough-a-mongodb-map-reduce-job"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:g5platform|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:fstructures"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:flowdock|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:wiki|h:ru"));
        pageItems.add(new PageItem().setLru("s:http|h:me|h:markitfor|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wheelhousecms|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:archlinux|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:facebook|h:apps|p:marketplace"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:zopyx|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:familyties|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:ubervu|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:generalflows|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:skylineinnovations|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:yodle|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:fedoraproject|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:atlassian|h:www|p:software|p:confluence"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:atlassian|h:www|p:about|p:connected.jsp|q:s_kwcid=Confluence-stayintouch"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:talkabouthealth"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:techcrunch|h:uk|p:2009|p:09|p:08|p:silentale-lets-you-archive-and-search-your-every-conversation"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:yap|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:kirelabs|h:detexifyblog|p:past|p:2009|p:8|p:12|p:new_backend_new_server_android_app"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:wiki|h:ua"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:business|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:arrivalguides|h:beta|p:en"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:centos|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:springer|h:realtime|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:se|h:sifino|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:labix|p:mgo"));
        pageItems.add(new PageItem().setLru("s:http|h:uk|h:co|h:theukjobsite|h:www|p:tech.php"));
        pageItems.add(new PageItem().setLru("s:http|h:uk|h:co|h:theukjobsite|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:dailygourmet|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:cloudfoundry|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:cloudfoundry|h:mongodb-on-cf-demo|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:cloudfoundry|p:signup"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:bitbucket|p:fernandotakai|p:herd|p:src"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:bitbucket|p:namlook|p:mongokit|p:wiki|p:Home"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:bitbucket|p:liamstask|p:fantomongo|p:wiki|p:Home"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:bitbucket|p:rumataestor|p:emongo"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:hackshackers|p:2010|p:07|p:28|p:a-behind-the-scenes-look-at-the-new-york-times-moment-in-time-project"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:google|h:docs|p:present|p:view|q:id=dhkkqm6q_13gm6jq5fv"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wordnik|h:blog|p:b-is-for-billion"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wordnik|h:blog|p:12-months-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wordnik|h:blog|p:what-has-technology-done-for-words-lately"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:haskell|h:hackage|p:package|p:mongoDB"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:spike|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:rubylearning|p:blog|p:2010|p:12|p:21|p:being-awesome-with-the-mongodb-ruby-driver"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:contactme|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:vivu|p:portal|p:archive.jsp|q:flow=783-586-4282&id=1270584002677"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eflyover"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:deskmetrics"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:plt-scheme|h:planet|p:package-source|p:jaymccarthy|p:mongodb.plt|p:1|p:4|p:planet-docs|p:mongodb|p:index.html"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:plt-scheme|h:planet|p:display.ss|q:owner=jaymccarthy&package=mongodb.plt"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:zoofs|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:buildbot|p:waterfall"));
        pageItems.add(new PageItem().setLru("s:http|h:jp|h:co|h:cyberagent|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:keekme"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:thisorthat|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:ylastic|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:thumbtack|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:thumbtack|h:engineering|p:2011|p:05|p:03|p:building-our-own-tracking-engine-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:openchime|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:developingwithstyle|p:articles|p:2010|p:07|p:09|p:handling-dates-in-mongodb.html"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:sailthru|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:wiki|h:pt"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:crowdtap|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:doodle|h:blog|p:english|p:2011|p:09|p:16|p:an-introduction-to-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:chatpast|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:in|h:cmisoft|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:myestoreapp|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:kanoapps|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:nl|h:thuisvergelijken|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sizzix|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:fyndlr|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:thedailyshow|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:disqus|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:vitals"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:pycon|h:us|p:2012"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:python|h:pypi|p:pypi|p:pymongo"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:lightcubesolutions|h:www"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:10gen|h:www|p:weusemongodb"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:10gen|h:www|p:presentations|q:application=gaming&event="));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:10gen|h:www|p:presentation|p:mongonyc-2011|p:foursquare"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:deegr|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:am|h:photostre"));
        pageItems.add(new PageItem().setLru("s:http|h:jp|h:co|h:esm|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:org|h:socallinuxexpo|h:www|p:scale10x"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:youtube|h:www|p:watch|q:v=56TTOqMOkoY"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:kylebanker|p:blog|p:2009|p:12|p:mongodb-map-reduce-basics"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:pitchfork|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:ro|h:newsman|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:edu|h:cornell|h:lns|h:www|p:~vk"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:kompasiana|h:www|p:home"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:codeplex|h:mosh|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:doctrine-project|h:www|p:blog|p:mongodb-for-ecommerce"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:foursquare|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:cpan|h:search|p:dist|p:MongoDB"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:cpan|h:search|p:dist|p:MongoDB|p:lib|p:MongoDB.pm"));
        pageItems.add(new PageItem().setLru("s:http|h:nl|h:kabisa|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:au|h:com|h:arcturus|h:www|p:dolphin|p:mongodb.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:cookfollower|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:thrillist|h:www|p:NATION|p:browse|q:sort=browse"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:venmo|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:heroku|h:blog|p:archives|p:2010|p:4|p:30|p:mongohq_add_on_public_beta"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:simonwillison|p:2009|p:Nov|p:23|p:node"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wordpress|h:jbaruch|p:2010|p:04|p:27|p:integrating-mongodb-with-spring-batch"));
        pageItems.add(new PageItem().setLru("s:http|h:pl|h:totutam|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:fi|h:nodeta|h:blog|p:2010|p:07|p:26|p:flowdock-migrated-from-cassandra-to-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:intelie|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:pl|h:similaria|h:www|p:index.php"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sahibinden|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:punchtab|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:visibiz|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:mashape|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:phonetag|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:gilt|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:gilt|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:getfave|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:guildwork|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:foofind"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:mongohq|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:moontoast|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:skimlinks"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:highscalability|p:blog|p:2011|p:2|p:15|p:wordnik-10-million-api-requests-a-day-on-mongodb-and-scala.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:highscalability|p:blog|p:2010|p:3|p:16|p:justintvs-live-video-broadcasting-architecture.html"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:brainrepublic|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:brainrepublic|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eastghost"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:learnboost|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:learnboost|h:www|p:mongoose"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:silentale|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:ea|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:chemeo|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:planetaki|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:captaincodeman|h:www|p:2010|p:05|p:24|p:mongodb-azure-clouddrive"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:austindataparty|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:chartbeat|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:shapado|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:chemeo|p:doc|p:technology"));
        pageItems.add(new PageItem().setLru("s:http|h:me|h:attachments|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:holadoctor|p:es"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:ibibo|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:posterous|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:athenacr|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:pt|h:motores24h|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:https|h:com|h:pclicks|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:iccs-meeting|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:uk|h:co|h:shopperhive|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:eu|h:phpbenelux|h:conference|p:2012"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:pictomist|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:blog|p:guest-post-why-you-should-track-page-views-with-mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:eventbrite|h:blog|p:tech-corner-auto-recovery-with-mongodb-replica-sets-2"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:tweetcongress|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:freerice|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:cn|h:thinkphp|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:data-publica|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:topsy|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:teachstreet|h:blog|p:uncategorized|p:slides-mongo-seattle|q:utm_campaign=Feed%3A+teachstreet+%28TeachStreet+-+Find+Great+Classes.++Learn+Something+New.%29&utm_medium=twitter&utm_source=twitterfeed"));
        pageItems.add(new PageItem().setLru("s:http|h:ru|h:biggo|h:cms|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:tubricator|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:disqus|p:|q:ref_noscript=mongodb"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:disqus"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:trivian|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:io|h:gamechanger|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:memrise|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:noclouds|p:principal"));
        pageItems.add(new PageItem().setLru("s:http|h:de|h:edelight|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:mongodb|h:wiki|h:es"));
        pageItems.add(new PageItem().setLru("s:http|h:de|h:check24|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:gazaro|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:imok|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:bouncely|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:dokdok|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:za|h:co|h:buzzers|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:org|h:gemcutter|p:gems|p:mongo"));
        pageItems.add(new PageItem().setLru("s:http|h:net|h:codesanity|p:2010|p:05|p:mongodb-codeigniter-logs"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:ocwsearch|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:rupture|h:www"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wokeey|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:mediamath|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:sailthru|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:tv|h:justin"));
        pageItems.add(new PageItem().setLru("s:https|h:in|h:dayload|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:ru|h:insor-russia|h:www|p:en|p:_about_us"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:wireclub|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:eu|h:weconext|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:punchbowl|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:collegehumor|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:mongoosejs"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:listsbrowser|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:metamoki|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:soulgoal|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:mindvalley|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:kehalim|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:bentlyreserve|h:www|p:"));
        pageItems.add(new PageItem().setLru("s:http|h:com|h:nearley|h:www|p:"));


        try {
            long a = System.currentTimeMillis();
            logger.debug("setting pageitmes in cache");
            cache.setPageItems(pageItems);
            logger.debug("finished setting pageitmes in cache");
            long b = System.currentTimeMillis() - a;
            logger.info("created webentities took " + b + "ms" );

            long c = System.currentTimeMillis();
            logger.debug("creating webentities");            
            cache.createWebEntities();
            logger.debug("finished creating webentities");
            long d = System.currentTimeMillis() - c;
            logger.info("created webentities took " + d + "ms" );
            
            logger.info("# pageitems: " + pageItems.size() +" # webentities created: " + lruIndex.retrieveWebEntities().size());
            
        } 
        catch (MaxCacheSizeException x) {
            fail(x.getMessage());
            x.printStackTrace();
        } 
        catch (MemoryStructureException x) {
            fail(x.getMessage());
            x.printStackTrace();
        } 
        catch (IndexException x) {
            fail(x.getMessage());
            x.printStackTrace();
        }


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
        assertEquals("Unexpected URL", "megaupload.com", LRUUtil.revertLRU("s:http|h:www|h:com|h:megaupload"));
        assertEquals("Unexpected URL", "jiminy.medialab.sciences-po.fr/hci/index.php?title=Reverse_URLs&secondparameter=there#bottom", LRUUtil.revertLRU("s:http|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php|q:title=Reverse_URLs|q:secondparameter=there|r:bottom"));
        assertEquals("Unexpected URL", "bbc.co.uk", LRUUtil.revertLRU("s:http|h:www|h:uk|h:co|h:bbc"));
        assertNull("Null input should return null", LRUUtil.revertLRU(null));
        assertNull("Empty input should return null", LRUUtil.revertLRU(""));
        assertNull("Blank input should return null", LRUUtil.revertLRU(" "));
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