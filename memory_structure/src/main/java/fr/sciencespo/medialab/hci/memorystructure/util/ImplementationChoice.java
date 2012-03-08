package fr.sciencespo.medialab.hci.memorystructure.util;

/**
 * Enable choosing between different implementations from program startup.
 *
 * @author heikki doeleman
 */
public class ImplementationChoice {
    private static String implementationChoice;
    public static void set(String impl) {
        implementationChoice = impl;
    }
    public static String get() {
        if(implementationChoice == null) {
            return "HEIKKI";
        }
        else {
            return implementationChoice;
        }
    }
}
