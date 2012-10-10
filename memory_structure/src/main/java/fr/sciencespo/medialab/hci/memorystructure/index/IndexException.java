package fr.sciencespo.medialab.hci.memorystructure.index;

/**
 * @author heikki doeleman
 */
public class IndexException extends Exception {
	
    /**
	 * 
	 */
	private static final long serialVersionUID = -200951043795227203L;

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
