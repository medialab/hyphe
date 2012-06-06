package fr.sciencespo.medialab.hci.memorystructure.thrift;

import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import fr.sciencespo.medialab.hci.memorystructure.util.ImplementationChoice;
import org.apache.commons.lang.StringUtils;
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

import java.io.File;
import java.io.FileInputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

/**
 * MemoryStructure server.
 *
 * @author heikki doeleman
 */
public class ThriftServer {

    private static DynamicLogger logger = new DynamicLogger(ThriftServer.class);

    private final static int port = 9090;

    private static String luceneDirectoryPath = null;
    private static String implementationChoice = null;
    private static String logLevel = null;

    private static MemoryStructureImpl memoryStructureImpl ;


    /**
     * Starts the thrift server.
     *
     * @param args command line arguments
     */
    public static void main(String[]args) {
        try {
            DynamicLogger.setLogLevel("INFO");
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
     * Reads properties from file.
     *
     * @return map of property names and values
     */
    private static Map<String, String> readProperties() {
        Map<String, String> propertiesMap = new HashMap<String, String>();
        try {
            Properties properties = new Properties();
            properties.load(new FileInputStream("memorystructure.properties"));
            logger.info("properties file found");
            Set<String> propertyNames = properties.stringPropertyNames();
            for(String key : propertyNames) {
                propertiesMap.put(key, properties.getProperty(key)); 
            }
        }
        catch(Exception x) {
            logger.info("no properties file found");
        }
        for(String key : propertiesMap.keySet()) {
            logger.info("read property from properties file: " + key + " = " + propertiesMap.get(key));
        }
        return propertiesMap;
    }

    /**
     * Reads properties from command line.
     *
     * @param args command line arguments
     * @return map of property names and values
     */
    private static Map<String, String> readCL(String[] args) {
        Map<String, String> propertiesMap = new HashMap<String, String>();
        for(String parameter : args) {
            String property = parameter.substring(0, parameter.indexOf('='));
            String value = parameter.substring(parameter.indexOf('=')+1);
            propertiesMap.put(property, value);
        }
        for(String key : propertiesMap.keySet()) {
            logger.info("read property from command line: " + key + " = " + propertiesMap.get(key));
        }
        return propertiesMap;        
    }
    
    /**
     *
     * @param args command line arguments
     */
    private static void initializeMemoryStructure(String[] args) {

        Map<String, String> propertiesFromFile = readProperties();
        Map<String, String> propertiesFromCL = readCL(args);

        // properties from command line take precedence
        Map<String, String> resolvedProperties = new HashMap<String, String>(propertiesFromFile);
        for(String key : propertiesFromCL.keySet()) {
            resolvedProperties.put(key, propertiesFromCL.get(key));
        }

        logger.info("command line properties take precedence; result is:");
        for(String key : resolvedProperties.keySet()) {
            logger.info("using property " + key + " = " + resolvedProperties.get(key));
        }

        luceneDirectoryPath = resolvedProperties.get("lucene.path");
        logLevel = resolvedProperties.get("log.level");
        implementationChoice = resolvedProperties.get("impl.choice");

        //
        // defaults
        //
        if(StringUtils.isEmpty(luceneDirectoryPath)) {
            logger.warn("Could not find lucene.path either from memorystructure.properties or from command line arguments.");
            luceneDirectoryPath = System.getProperty("user.home") + File.separator + "memorystructure.lucene";
            logger.warn("Using default: lucene.path is " + luceneDirectoryPath);
        }
        if(StringUtils.isEmpty(logLevel)) {
            logger.warn("Could not find log.level either from memorystructure.properties or from command line arguments.");
            logLevel = "INFO";
            logger.warn("Using default: log.level is " + logLevel);
        }
        if(StringUtils.isEmpty(implementationChoice)) {
            logger.warn("Could not find impl.choice either from memorystructure.properties or from command line arguments.");
            implementationChoice = "HEIKKI";
            logger.warn("Using default: impl.choice is " + implementationChoice);
        }

        DynamicLogger.setLogLevel(logLevel);
        ImplementationChoice.set(implementationChoice);

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
                    logger.info("Memory Structure shutdown hook");
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

        logger.info("starting Thrift server (THsHaServer) at port " + port);
        server.serve();
    }

}