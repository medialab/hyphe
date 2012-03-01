package fr.sciencespo.medialab.hci.memorystructure.util;

import java.util.HashSet;
import java.util.Set;

/**
 * Utility methods for Collections.
 *
 * @author heikki doeleman
 */
public class CollectionUtils {

    private static DynamicLogger logger = new DynamicLogger(CollectionUtils.class);
    /**
     * Returns a set of the longest strings in a set. If the input is empty, returns a set containing the empty string.
     *
     * @param strings strings
     * @return the longest string(s)
     */
    public static Set<String> findLongestString(Set<String> strings) {
        Set<String> longests = new HashSet<String>();
        String longest = "";
        longests.add(longest);
        if(strings != null) {
            // for each string
            for(String s : strings) {
                // if longer than longest seen before
                if(s.length() > longest.length()) {
                    // clear previous results
                    longests.clear();
                    // now this is the longest
                    longest = s;
                    // add to results
                    longests.add(longest);
                }
                // if equal length to longest seen before
                else if(s.length() == longest.length()) {
                    // add to results
                    longests.add(s);
                }
            }
        }
        return longests;
    }
}
