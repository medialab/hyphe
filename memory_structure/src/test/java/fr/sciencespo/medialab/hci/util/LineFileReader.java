package fr.sciencespo.medialab.hci.util;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.Iterator;

/**
 *
 * @author heikki doeleman
 */
public class LineFileReader implements Iterator<String> {

    private BufferedReader reader;
    private String nextLine;

    public LineFileReader(String path) throws IOException {
        reader = new BufferedReader(new FileReader(path));
        nextLine = reader.readLine();
    }

    @Override
    public boolean hasNext() {
        return nextLine != null;
    }

    @Override
    public String next() {
        String line = nextLine;
        try {
            nextLine = reader.readLine();
        } catch(IOException ioe) {
            nextLine = null;
            ioe.printStackTrace();
        }
        if(nextLine == null) {
            try {
                reader.close();
            } catch(IOException ioe) {
                ioe.printStackTrace();
            }
        }
        return line;
    }

    @Override
    public void remove() {
    }

}