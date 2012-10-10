package fr.sciencespo.medialab.hci.memorystructure.cache;

/**
 * @author heikki doeleman
 */
public class MaxCacheSizeException extends Exception {

    /**
	 * 
	 */
	private static final long serialVersionUID = -5200167524495905973L;

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
