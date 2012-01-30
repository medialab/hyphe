package fr.sciencespo.medialab.hci.util;

/**
 *
 * @author heikki doeleman
 */
public class Page {

    @Override
    public boolean equals(Object o) {
        if(o instanceof Page) {
            return ((Page)o).getLRU().equalsIgnoreCase(this.getLRU());
        }
        return false;
    }

    @Override
    public int hashCode() {
        int result = LRU != null ? LRU.hashCode() : 0;
        return result;
    }

    /**
     * The LRU of that page.
     */
    private String LRU;

    /**
     * Indicates if a FULL PRECISION flag has been set on this page by the user. Note that this field is stored by the
     * memory structure but will only be used by the core since it's the core which does the web entities creation and
     * link agregations.
     */
    private boolean fullPrecision;

    /**
     * Indicates wether this page is above or below the Precision_limit.
     */
    private boolean isNode;

    public String getLRU() {
        return LRU;
    }

    public void setLRU(String LRU) {
        this.LRU = LRU;
    }

    public boolean isFullPrecision() {
        return fullPrecision;
    }

    public void setFullPrecision(boolean fullPrecision) {
        this.fullPrecision = fullPrecision;
    }

    public boolean isNode() {
        return isNode;
    }

    public void setNode(boolean node) {
        isNode = node;
    }
}