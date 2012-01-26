package fr.sciencespo.medialab.hci.memorystructure.util;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;

/**
 * @author heikki doeleman
 */
public class ExceptionUtils {

    public static String stacktrace2string(StackTraceElement[] stackTraceElements) {
        StringBuffer stackTraceStringBuffer = new StringBuffer();
        for(StackTraceElement stackTraceElement : stackTraceElements) {
            stackTraceStringBuffer.append(stackTraceElement.toString()).append("\n");
        }
        return stackTraceStringBuffer.toString();
    }

    public static String stacktrace2string(Throwable x) {
        final Writer result = new StringWriter();
        final PrintWriter printWriter = new PrintWriter(result);
        x.printStackTrace(printWriter);
        return result.toString();
    }

}