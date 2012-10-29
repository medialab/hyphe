package fr.sciencespo.medialab.hci.memorystructure.util;

import java.util.Scanner;

import org.apache.commons.lang.StringUtils;

/**
 * Utility methods for LRUs.
 *
 * @author benjamin ooghe-tabanou
 */
public class LRUUtil {

    /**
     * Reverts an lru to an url. Scheme is stripped; a "www" host is also stripped; returns null when input is null,
     * empty or blank.
     *
     * @param lru to revert
     * @return url
     */
    public static String revertLRU(String lru) {
        if(lru == null) {
            return null;
        }
        lru = lru.trim();
        if(StringUtils.isEmpty(lru)) {
            return null;
        }
        String url = "";
        Scanner scanner = new Scanner(lru);
        scanner.useDelimiter("\\|");
        boolean tldDone = false;
        boolean removedTrailingDot = false;
        boolean questionMarkAdded = false;
        while(scanner.hasNext()) {
            String lruElement = scanner.next();
            if(!lruElement.startsWith("s:")) {
                if(lruElement.startsWith("h:")) {
                    if(lruElement.equals("h:localhost")) {
                        tldDone = true;
                    } else if(!lruElement.equals("h:www")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        if(StringUtils.isNotEmpty(lruElement)) {
                            if(tldDone) {
                                url = url + "." + lruElement;
                            }
                            else {
                                url = lruElement + "." + url;
                            }
                            if(!tldDone && lruElement.startsWith("h:")) {
                                tldDone = true;
                            }
                        }
                    }
                } else if(lruElement.startsWith("t:")) {
                    url += ":"+lruElement.substring(lruElement.indexOf(':')+1).trim();
                } else {
                    if(!removedTrailingDot && url.endsWith(".")) {
                        url = url.substring(0, url.length() - 1);
                        removedTrailingDot = true;
                    }
                    if(lruElement.startsWith("p:")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        if(StringUtils.isNotEmpty(lruElement)) {
                            url = url + "/" + lruElement;
                        }
                    }
                    else if(lruElement.startsWith("q:")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        if(StringUtils.isNotEmpty(lruElement)) {
                            if(!questionMarkAdded) {
                                url = url + "?" + lruElement;
                                questionMarkAdded = true;
                            }
                            else {
                                url = url + "&" + lruElement;
                            }
                        }
                    }
                    else if(lruElement.startsWith("f:")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        if(StringUtils.isNotEmpty(lruElement)) {
                            url = url + "#" + lruElement;
                        }
                    }
                }
            }
        }
        scanner.close();
        if(!removedTrailingDot && url.endsWith(".")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

}
