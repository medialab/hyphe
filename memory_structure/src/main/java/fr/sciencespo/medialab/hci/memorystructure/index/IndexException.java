package fr.sciencespo.medialab.hci.memorystructure.index;

/**
 * Created by IntelliJ IDEA.
 * User: heikki
 * Date: 12/26/11
 * Time: 2:09 PM
 * To change this template use File | Settings | File Templates.
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
