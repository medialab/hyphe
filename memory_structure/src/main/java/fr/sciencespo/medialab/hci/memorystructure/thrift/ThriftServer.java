package fr.sciencespo.medialab.hci.memorystructure.thrift;

import org.apache.lucene.index.IndexWriterConfig;
import org.apache.thrift.TException;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.protocol.TProtocolFactory;
import org.apache.thrift.server.THsHaServer;
import org.apache.thrift.server.TServer;
import org.apache.thrift.transport.TFramedTransport;
import org.apache.thrift.transport.TNonblockingServerSocket;
import org.apache.thrift.transport.TNonblockingServerTransport;
import org.apache.thrift.transport.TTransportException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.util.Properties;

/**
 * MemoryStructure server.
 *
 * @author heikki doeleman
 */
public class ThriftServer {

    private static Logger logger = LoggerFactory.getLogger(ThriftServer.class);

    private final static int port = 9090;

    private static String luceneDirectoryPath;

    private static MemoryStructureImpl memoryStructureImpl ;

    /**
     *
     * @param args
     */
    public static void main(String[]args) {
        try {
            logger.info("starting Thrift server");
            initializeMemoryStructure(args);
            initializeThriftServer();
        }
        catch(TException x) {
            logger.error("Thrift server exception: " + x.getMessage() + ", shutting down");
            x.printStackTrace();
            System.exit(-1);
        }
        catch(Throwable x) {
            logger.error("Internal server error: " + x.getMessage() + ", shutting down");
            x.printStackTrace();
            System.exit(-1);
        }
    }

    /**
     *
     * @param args
     */
    private static void initializeMemoryStructure(String[] args) {
        Properties properties = new Properties();
        boolean propertiesFileFound = false;
        boolean lucenePathProvided = false;
        //
        // load all properties from property file (if found)
        //
        try {
            properties.load(new FileInputStream("memorystructure.properties"));
            logger.debug("properties file found");
            logger.debug("lucene.path: " + properties.getProperty("lucene.path"));
            luceneDirectoryPath = properties.getProperty("lucene.path");
            propertiesFileFound = true;
            lucenePathProvided = true;
        }
        catch(Exception x) {
            logger.warn("no properties file found");
        }

        //
        // if no properties file provided and no command line arguments, show usage
        //
        if(!propertiesFileFound && args == null || args.length != 1) {
            logger.info("usage: java -jar MemoryStructure.jar lucene.path=[path to Lucene directory, if it does not exist yet this program will attempt to create it]");
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
            logger.warn("Could not find lucene.path either from memorystructure.properties or from command line arguments.");
            luceneDirectoryPath = System.getProperty("user.home") + File.separator + "memorystructure.lucene";
            logger.warn("Using default: lucene.path is " + luceneDirectoryPath);
        }

        File luceneDir = new File(luceneDirectoryPath);
        if(luceneDir.exists() && !luceneDir.isDirectory()) {
            logger.error("Lucene path already exists: " + luceneDirectoryPath + " but it is not a directory, exiting");
            System.exit(0);
        }
        else if(!luceneDir.exists()) {
            logger.info("Lucene path does not exist, creating directory: " + luceneDirectoryPath);
            luceneDir.mkdirs();
        }
        else {
            logger.info("Using existing Lucene path: " + luceneDirectoryPath);
        }

        memoryStructureImpl = new MemoryStructureImpl(luceneDirectoryPath, IndexWriterConfig.OpenMode.CREATE_OR_APPEND);

        logger.info("successfully created Memory Structure");

        Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    memoryStructureImpl.shutdown();
                }
                catch (TException x) {
                    logger.error(x.getMessage());
                    x.printStackTrace();
                }
            }
        }));
    }

    /**
     *
     * @throws TTransportException hmm
     */
    private static void initializeThriftServer() throws TTransportException {
        //TServerTransport serverTransport = new TServerSocket(port);
        //MemoryStructure.Processor processor = new MemoryStructure.Processor(memoryStructureImpl);
        //TServer server = new TThreadPoolServer(new TThreadPoolServer.Args(serverTransport).processor(processor));

        //
        // server code provided by Patrick Browne
        //
        TProtocolFactory pfactory = new TBinaryProtocol.Factory();

        TNonblockingServerTransport serverTransport = new TNonblockingServerSocket(port);
        MemoryStructure.Processor processor = new MemoryStructure.Processor(memoryStructureImpl);
        THsHaServer.Args serverArgs = new THsHaServer.Args(serverTransport);
        serverArgs.processor(processor);
        serverArgs.transportFactory(new TFramedTransport.Factory());
        serverArgs.protocolFactory(new TBinaryProtocol.Factory(true, true));
        TServer server = new THsHaServer(serverArgs);
        //
        // end server code provided by Patrick Browne
        //

        logger.info("starting Thrift server (TThreadPoolServer) at port " + port);
        server.serve();
    }

}