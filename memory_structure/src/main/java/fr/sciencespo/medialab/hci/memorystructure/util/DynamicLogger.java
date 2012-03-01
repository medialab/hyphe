package fr.sciencespo.medialab.hci.memorystructure.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Replaces SLF4J Logger to enable dynamic setting of log level.
 *
 * @author heikki doeleman
 */
public class DynamicLogger {

    public enum LogLevel {
        TRACE, DEBUG, INFO, WARNING, ERROR
    }
    
    private static Logger logger ;
    private static LogLevel logLevel = LogLevel.WARNING;

    public DynamicLogger(Class clazz, LogLevel logLevel) {
        DynamicLogger.logger = LoggerFactory.getLogger(clazz);
        DynamicLogger.logLevel = logLevel;
    }

    public DynamicLogger(Class clazz) {
        DynamicLogger.logger = LoggerFactory.getLogger(clazz);
    }

    public static void setLogLevel(String logLevel) {
        DynamicLogger.logLevel = DynamicLogger.LogLevel.valueOf(logLevel);
    }

    public boolean isDebugEnabled() {
        return DynamicLogger.logLevel == LogLevel.TRACE || DynamicLogger.logLevel == LogLevel.DEBUG;
    }

    public void trace(String message) {
        if(DynamicLogger.logLevel == LogLevel.TRACE) {
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[2];
            message = stackTraceElement.getMethodName() + ":" +  stackTraceElement.getLineNumber() + " "+ message;
            logger.trace(message);
        }
    }
    public void debug(String message) {
        if(DynamicLogger.logLevel == LogLevel.TRACE || DynamicLogger.logLevel == LogLevel.DEBUG) {
            StackTraceElement stackTraceElement2 = Thread.currentThread().getStackTrace()[2];
            message = stackTraceElement2.getMethodName() + ":" +  stackTraceElement2.getLineNumber() + " "+ message;
            logger.debug(message);
        }
    }

    public void info(String message) {
        if(DynamicLogger.logLevel == LogLevel.TRACE || DynamicLogger.logLevel == LogLevel.DEBUG ||
                DynamicLogger.logLevel == LogLevel.INFO) {
            logger.info(message);
        }
    }

    public void warn(String message) {
        if(DynamicLogger.logLevel == LogLevel.TRACE || DynamicLogger.logLevel == LogLevel.DEBUG ||
                DynamicLogger.logLevel == LogLevel.INFO || DynamicLogger.logLevel == LogLevel.WARNING) {
            logger.warn(message);
        }
    }

    public void error(String message) {
        if(DynamicLogger.logLevel == LogLevel.TRACE || DynamicLogger.logLevel == LogLevel.DEBUG ||
                DynamicLogger.logLevel == LogLevel.INFO || DynamicLogger.logLevel == LogLevel.WARNING ||
                DynamicLogger.logLevel == LogLevel.ERROR) {
            logger.error(message);
        }
    }

}