package fr.sciencespo.medialab.hci.memorystructure.index;

/**
 * @author heikki doeleman
 */
public class IndexException extends Exception {
    public IndexException() {
    }

    public IndexException(String message) {
        super(message);
    }

    public IndexException(String message, Throwable cause) {
        super(message, cause);
    }

    public IndexException(Throwable cause) {
        super(cause);
    }
}
