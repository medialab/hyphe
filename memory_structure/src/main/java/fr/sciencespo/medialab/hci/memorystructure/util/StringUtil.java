package fr.sciencespo.medialab.hci.memorystructure.util;

import java.util.Set;
import java.util.List;
import java.util.ArrayList;
import java.util.HashSet;
import java.lang.String;
import java.lang.StringBuffer;

/**
 * Utility methods for Strings.
 *
 * @author benjamin ooghe-tabanou, heikki doeleman
 */
public class StringUtil {

    public static String toProperCase(String text) {
        text = text.toLowerCase();
        if (text.length() > 1) {
            text = text.substring(0, 1).toUpperCase() + text.substring(1).toLowerCase();
        } else {
            text = text.toUpperCase();
        }
        return text;
    }

    public static String toTitle(String text) {
        StringBuffer output = new StringBuffer();
        String[] tokens = text.replace(".", " ").replace("-", "- ").replace("/", " ")
                        .replace("?", " ").replace("&", " ").replace("#", " ")
                        .split(" ");
        for (int i=0; i<tokens.length; i++) {
            output.append(" " + toProperCase(tokens[i]));
        }
        return output.toString().replace("- ", "-").trim();
    }

    /**
     * Returns a set of the longest strings in a set. If the input is empty, returns a set containing the empty string.
     * @param strings strings
     * @return the longest string(s)
     */
    public static HashSet<String> findLongestString(Set<String> strings) {
        HashSet<String> longests = new HashSet<String>();
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

    public static <T> List<List<T>> chunkArray(List<T> list, int chunksSize) {
        List<List<T>> chunks = new ArrayList<List<T>>();
        final int size = list.size();
        for (int i = 0; i < size; i += chunksSize) {
            chunks.add(new ArrayList<T>(list.subList(i, Math.min(size, i + chunksSize))));
        }
        return chunks;
    }

}
