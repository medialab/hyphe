package fr.sciencespo.medialab.hci.memorystructure.gexf;

/**
 * @author heikki doeleman
 */
public class GEXFWriterException extends Exception {
    public GEXFWriterException() {
    }

    public GEXFWriterException(String message) {
        super(message);
    }

    public GEXFWriterException(String message, Throwable cause) {
        super(message, cause);
    }

    public GEXFWriterException(Throwable cause) {
        super(cause);
    }
}