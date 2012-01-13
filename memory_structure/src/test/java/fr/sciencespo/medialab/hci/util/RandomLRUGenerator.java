package fr.sciencespo.medialab.hci.util;

import fr.sciencespo.medialab.hci.memorystructure.domain.Page;
import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import org.apache.commons.lang.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Random;
import java.util.Set;

/**
 *
 * @author heikki doeleman
 */
public class RandomLRUGenerator {

    private static Logger logger = LoggerFactory.getLogger(RandomLRUGenerator.class);

    public static Set<NodeLink> createNodeLinks(Set<Page> pages, Random r) {
        Set<NodeLink> nodeLinks = new HashSet<NodeLink>();
        int pagesSize = pages.size();
        Object[] pagesArray = pages.toArray();
        logger.debug("page array size: " + pagesArray.length);
        // for each page, create 0-5 links to other pages
        for(Iterator<Page> pit = pages.iterator();pit.hasNext();) {
            Page page = pit.next();
            int numberOfLinks = r.nextInt(6);
            for(int i = 0; i < numberOfLinks; i++) {
                // pick a random target page
                int randomPage = r.nextInt(pagesSize);
                Page target = (Page)pagesArray[randomPage];
                NodeLink link = new NodeLink();
               // link.setLruSource(page.getLRU());
               // link.setLruTarget(target.getLRU());
                nodeLinks.add(link);
            }
        }
        logger.debug("nodeLinks size " + nodeLinks.size());
        return nodeLinks;
    }

    public static  void generateNextElement(String lru, Random r, Set<String> strings) {
        String randomNextElement = RandomStringUtils.randomAlphabetic(1 + r.nextInt(10)).toLowerCase();
        char lastElement = lru.substring(lru.lastIndexOf("|")).charAt(1);
        // count p:
        int plastIndex = 0;
        int pcount = 0;
        while(plastIndex != -1){
            plastIndex = lru.indexOf("p:", plastIndex);
            if(plastIndex != -1){
                pcount ++;
            }
        }

        // either create another host element or create a path element
        if(lastElement == 'h') {
            // host element
            if(r.nextBoolean()) {
                randomNextElement = "h:" + randomNextElement;
            }
            // path element
            else {
                if(pcount < 6) {
                    randomNextElement = "p:" + randomNextElement;
                }
                else {
                    randomNextElement = "";
                }
            }
            lru = lru + "|" + randomNextElement;
            strings.add(lru);

            // do a random number of recursions; this creates tree structure
            int recursions = r.nextInt(4);
            for(int i = 0; i < recursions; i++) {
                generateNextElement(lru, r, strings);
            }
        }
        // either create another path element, or not
        else if(lastElement == 'p') {
            // path element
            if(r.nextBoolean() && pcount < 6) {
                randomNextElement = "p:" + randomNextElement;
                lru = lru + "|" + randomNextElement;
                strings.add(lru);
                // do a random number of recursions; this creates tree structure
                int recursions = r.nextInt(4);
                for(int i = 0; i < recursions; i++) {
                    generateNextElement(lru, r, strings);
                }
            }
            // or not: stop recursion here; do nothing
        }
        else {
            System.err.println("unknown lru element type " + lastElement);
            throw new RuntimeException("unknown lru element type " + lastElement);
        }
    }

    public static Set<Page> createPages(Random r) {
        Set<Page> pages = new HashSet<Page>();

        String scheme = "s:http|";
        String host = "h:fr";
        host += "|h:" + RandomStringUtils.randomAlphabetic(1+r.nextInt(10)).toLowerCase();
        Set<String> strings = new HashSet<String>();
        generateNextElement(scheme + host, r, strings);

        //System.out.println("created # " + strings.size() + " strings");
        for(String s : strings) {
            Page p = new Page();
            p.setLRU(s);
            //System.out.println("created " + p.getLRU());
            pages.add(p);
        }
        return pages;
    }



    public static Set<String> createUrls(Random r, int times) {
        Set<String> urls = new HashSet<String>();

        String scheme = "http://";
        String host = RandomStringUtils.randomAlphabetic(1+r.nextInt(10)).toLowerCase();

        for(int i = 0; i < times; i++) {
            generateNextUrlSegment(scheme + host, r, urls);
        }

        return urls;
    }

    public static  void generateNextUrlSegment(String url, Random r, Set<String> strings) {
        String randomNextElement = RandomStringUtils.randomAlphabetic(1 + r.nextInt(10)).toLowerCase();
        // either create another host segment or create a path segment

        // url not yet past .fr
        if(!url.contains(".fr")) {
            // maybe add host segment
            if(r.nextBoolean()) {
                url += "." + randomNextElement;
            }
            // maybe end host segment section
            if(r.nextBoolean()) {
                url += ".fr";
            }
            // do a random number of recursions; this creates tree structure
            if(true) {
                int recursions = r.nextInt(4);
                for(int i = 0; i < recursions; i++) {
                    generateNextUrlSegment(url, r, strings);
                }
            }
            else {
                strings.add(url);
            }
        }
        // url already past .fr
        else {
            // maybe add path segment
            if(r.nextBoolean()) {
                url += "/" + randomNextElement;
            }
            // maybe do a random number of recursions; this creates tree structure
            if(r.nextBoolean()) {
                int recursions = r.nextInt(4);
                for(int i = 0; i < recursions; i++) {
                    generateNextUrlSegment(url, r, strings);
                }
            }
            else {
                strings.add(url);
            }
        }
    }

}