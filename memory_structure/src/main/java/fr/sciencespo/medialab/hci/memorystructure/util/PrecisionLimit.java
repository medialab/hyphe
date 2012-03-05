package fr.sciencespo.medialab.hci.memorystructure.util;

/**
 * 
 */
public class PrecisionLimit {
    public static int PRECISION_LIMIT = 4;

    public static boolean isNode(String lru) {
        return lru.split("\\|").length <= PRECISION_LIMIT;
    }

    public static String getNode(String lru) {
        String[] ps = lru.split("\\|");
        String n = "";
        for(int i = 0; i < ps.length && i <PRECISION_LIMIT; i++) {
            n += ps[i] + "|";
        }
        n = n.substring(0, n.length()-1);
        return n;
    }
}
