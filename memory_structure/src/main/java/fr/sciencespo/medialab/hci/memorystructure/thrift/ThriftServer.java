package fr.sciencespo.medialab.hci.memorystructure.thrift;

import org.apache.thrift.server.TServer;
import org.apache.thrift.server.TThreadPoolServer;
import org.apache.thrift.transport.TServerSocket;
import org.apache.thrift.transport.TServerTransport;

import java.io.File;
import java.io.FileInputStream;
import java.util.Properties;

/**
 * MemoryStructure server.
 *
 * @author heikki doeleman
 */
public class ThriftServer {

    private final static int port = 9090;

    private static String luceneDirectoryPath;

    private static MemoryStructureImpl memoryStructureImpl = new MemoryStructureImpl();

    public static void main(String[]args) {

        try {

            Properties properties = new Properties();
            boolean propertiesFileFound = false;
            boolean lucenePathProvided = false;
            //
            // load all properties from property file (if found)
            //
            try {
                properties.load(new FileInputStream("memorystructure.properties"));
                System.out.println("properties file found");
                System.out.println("lucene.path: " + properties.getProperty("lucene.path"));
                luceneDirectoryPath = properties.getProperty("lucene.path");
                propertiesFileFound = true;
                lucenePathProvided = true;
            }
            catch(Exception x) {
                System.out.println("no properties file found");
            }

            //
            // if no properties file provided and no command line arguments, show usage
            //
            if(!propertiesFileFound && args == null || args.length != 1) {
                System.out.println("usage: java -jar MemoryStructure.jar lucene.path=[path to Lucene directory, if it does not exist yet this program will attempt to create it]");
                System.exit(0);
            }
            //
            // if command line arguments provided use them (overriding values from properties file, if any)
            //
            else if(args.length > 0) {
                if(args[0].startsWith("lucene.path")) {
                    luceneDirectoryPath = args[0].substring(args[0].indexOf('=')+1);
                    lucenePathProvided = true;
                }
            }

            //
            // verify necessary parameters have been received, if no use defaults
            //
            if(lucenePathProvided == false) {
                System.out.println("Could not find lucene.path either from memeorystructure.properties or from command line arguments.");
                luceneDirectoryPath = System.getProperty("user.home") + File.separator + "memorystructure.lucene";
                System.out.println("Using default: lucene.path is ");
                System.exit(0);
            }

            File luceneDir = new File(luceneDirectoryPath);
            if(luceneDir.exists() && !luceneDir.isDirectory()) {
                System.out.println("Lucene path already exists: " + luceneDirectoryPath + " but it is not a directory, exiting");
                System.exit(0);
            }
            else if(!luceneDir.exists()) {
                System.out.println("Lucene path does not exist, creating directory: " + luceneDirectoryPath);
                luceneDir.mkdirs();
            }
            else {
                System.out.println("Using existing Lucene path: " + luceneDirectoryPath);
            }

            memoryStructureImpl.setLucenePath(luceneDirectoryPath);


            System.out.println("ThriftServer main()");

            //TNonblockingServerSocket serverTransport = new TNonblockingServerSocket(9090);
            TServerTransport serverTransport = new TServerSocket(port);
            MemoryStructure.Processor processor = new MemoryStructure.Processor(memoryStructureImpl);
            //final TServer server = new THsHaServer(processor, socket, new TFramedTransport.Factory(), new TCompactProtocol.Factory());
            //final TServer server = new THsHaServer(processor, socket, new TFramedTransport.Factory(), new TCompactProtocol.Factory());
            TServer server = new TThreadPoolServer(new TThreadPoolServer.Args(serverTransport).processor(processor));

            System.out.println("starting Thrift server at port " + port);
            server.serve();

        }
        catch(Throwable x) {
            System.err.println("Thrift server internal error " + x.getMessage() + ", shutting down");
            x.printStackTrace();
            System.exit(-1);
        }
    }

}