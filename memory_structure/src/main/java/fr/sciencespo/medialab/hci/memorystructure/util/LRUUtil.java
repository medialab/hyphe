package fr.sciencespo.medialab.hci.memorystructure.util;

import fr.sciencespo.medialab.hci.memorystructure.thrift.ThriftServer;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;

import org.apache.commons.lang.StringUtils;
import java.util.List;
import java.util.Scanner;


/**
 * Utility methods for LRUs.
 *
 * @author benjamin ooghe-tabanou
 */
public class LRUUtil {

    public static int PRECISION_LIMIT = ThriftServer.readPrecisionLimitFromProperties();

    public static String getLimitedStemsLRU(String lru, int limit) {
        String[] ps = lru.split("\\|");
        String n = "";
        int skip = 0;
        for(int i = 0; i < ps.length && i-skip < limit; i++) {
            n += ps[i] + "|";
            if (ps[i].startsWith("s") || ps[i].startsWith("h")) {
                skip++;
            }
        }
        n = n.substring(0, n.length()-1);
        return n;
    }

    /*   UNUSED, this logic was moved to the python core API instead

    public static String getPrecisionLimitNode(String lru) {
        return getLimitedStemsLRU(lru, PRECISION_LIMIT);
    }

    public static boolean isPrecisionLimitNode(String lru) {
        return lru.split("\\|").length <= PRECISION_LIMIT;
    }

    */

    public static String getLRUHead(String lru) {
        String[] ps = lru.split("\\|");
        String n = "";
        int i = 0;
        while (i < ps.length && (ps[i].startsWith("h") || ps[i].startsWith("s"))) {
            n += ps[i] + "|";
            i++;
        }
        n = n.substring(0, n.length()-1);
        return n;
    }

    public static boolean LRUBelongsToWebentity(String lru, WebEntity webEntity, List<WebEntity> subWEs) {
        for (WebEntity sub : subWEs) {
            for (String prefix : sub.getLRUSet()) {
                if (lru.startsWith(prefix)) {
                    return false;
                }
            }
        }
        for (String prefix : webEntity.getLRUSet()) {
            if (lru.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

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
        while(scanner.hasNext()) {
            String lruElement = scanner.next();
            if(!lruElement.startsWith("s:")) {
                if(lruElement.startsWith("h:")) {
                    if(lruElement.equals("h:localhost")) {
                        tldDone = true;
                    } else {
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
                } else if(lruElement.startsWith("t:") && ! (lruElement.endsWith(":80") || lruElement.endsWith(":443"))) {
                    url += ":"+lruElement.substring(lruElement.indexOf(':')+1).trim();
                } else {
                    if(!removedTrailingDot && url.endsWith(".")) {
                        url = url.substring(0, url.length() - 1);
                        removedTrailingDot = true;
                    }
                    if(lruElement.startsWith("p:")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        url = url + "/" + lruElement;
                    }
                    else if(lruElement.startsWith("q:")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        url = url + "?" + lruElement;
                    }
                    else if(lruElement.startsWith("f:")) {
                        lruElement = lruElement.substring(lruElement.indexOf(':')+1);
                        lruElement = lruElement.trim();
                        url = url + "#" + lruElement;
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
