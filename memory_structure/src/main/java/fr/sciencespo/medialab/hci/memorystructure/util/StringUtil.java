package fr.sciencespo.medialab.hci.memorystructure.util;

import java.lang.String;
import java.lang.StringBuffer;

/**
 * Utility methods for Strings.
 *
 * @author benjamin ooghe-tabanou
 */
public class StringUtil {

    public static String toProperCase(String text) {
        text = text.toLowerCase();
        text = text.substring(0, 1).toUpperCase();
        return text;
    }

    public static String toTitle(String text) {
        StringBuffer output = new StringBuffer();
        String[] tokens = text.split(" ");
        for (int i=0; i<tokens.length; i++) {
            output.append(toProperCase(tokens[i]));
        }
        return output.toString();
    }

}
