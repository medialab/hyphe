package fr.sciencespo.medialab.hci.memorystructure.cache;

/**
 * @author heikki doeleman
 */
public class MaxCacheSizeException extends Exception {

    public MaxCacheSizeException() {
    }

    public MaxCacheSizeException(String message) {
        super(message);
    }

    public MaxCacheSizeException(String message, Throwable cause) {
        super(message, cause);
    }

    public MaxCacheSizeException(Throwable cause) {
        super(cause);
    }
}
