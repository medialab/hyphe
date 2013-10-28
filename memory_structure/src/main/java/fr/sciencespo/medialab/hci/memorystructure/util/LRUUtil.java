package fr.sciencespo.medialab.hci.memorystructure.util;

import fr.sciencespo.medialab.hci.memorystructure.thrift.ThriftServer;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;

import org.apache.commons.lang.StringUtils;
import java.util.List;
import java.util.Scanner;
import java.util.regex.Pattern;


/**
 * Utility methods for LRUs.
 *
 * @author benjamin ooghe-tabanou
 */
public class LRUUtil {

    public static int PRECISION_LIMIT = ThriftServer.readPrecisionLimitFromProperties();
    public static final Pattern LRU_STEM_PATTERN = Pattern.compile("\\|[shtpqf]:");

    public static String getLimitedStemsLRU(String lru, int limit) {
        String[] ps = lru.split("\\|");
        String res = "";
        int nocount = 0;
        for(int i = 0; i < ps.length && i-nocount < limit; i++) {
            res += ps[i] + "|";
            if (ps[i].startsWith("s") || ps[i].startsWith("h")) {
                nocount++;
            }
        }
        return res;
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
        String res = "";
        int i = 0;
        while (i < ps.length && (ps[i].startsWith("h") || ps[i].startsWith("s") || ps[i].startsWith("t"))) {
            res += ps[i] + "|";
            i++;
        }
        return res;
    }

    public static String stripLRUScheme(String lru) {
        String[] ps = lru.split("\\|");
        String res = "";
        for (String s : ps) {
            if (!(s.startsWith("s:") || s.startsWith("t:"))) {
                res += s + "|";
            }
        }
        return res;
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
     * Reverts an lru to an url.
     * null when input is null, empty or blank.
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
        String key, scheme = "", host = "", port = "", path = "", query = "", fragment = "";
        Scanner scanner = new Scanner(lru);
        scanner.useDelimiter("\\|");
        while(scanner.hasNext()) {
            String lruElement = scanner.next();
            key = lruElement.substring(0, lruElement.indexOf(':')+1);
            lruElement = lruElement.substring(lruElement.indexOf(':')+1).trim();
            if(StringUtils.isNotEmpty(lruElement) || key.equals("p:")) {
                if(key.equals("s:")) {
                    scheme = lruElement + "://";
                } else if(key.equals("t:") && ! (lruElement.equals("80") || lruElement.equals("443"))) {
                    port = ":" + lruElement;
                } else if(key.equals("h:")) {
                    if (host == "") {
                        host = lruElement;
                    } else {
                        host = lruElement + "." + host;
                    }
                } else if(key.equals("p:")) {
                    path += "/" + lruElement.trim();
                } else if(key.equals("q:")) {
                    if (host == null) {
                        query = "?" + lruElement;
                    } else {
                        query += "&" + lruElement;
                    }
                } else if(lruElement.startsWith("f:")) {
                    fragment = "#" + lruElement;
                }
            }
        }
        scanner.close();
        return scheme + host + port + path + query + fragment;
    }

}
