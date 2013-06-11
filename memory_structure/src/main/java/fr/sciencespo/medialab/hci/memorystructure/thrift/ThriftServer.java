package fr.sciencespo.medialab.hci.memorystructure.thrift;

import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.thrift.TException;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.server.THsHaServer;
import org.apache.thrift.server.TServer;
import org.apache.thrift.transport.TFramedTransport;
import org.apache.thrift.transport.TNonblockingServerSocket;
import org.apache.thrift.transport.TNonblockingServerTransport;
import org.apache.thrift.transport.TTransportException;
import org.json.JSONObject;
import org.json.JSONException;
import java.io.FileInputStream;
import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.lang.Integer;

/**
 * MemoryStructure server.
 *
 * @author heikki doeleman
 */
public class ThriftServer {

    private static DynamicLogger logger = new DynamicLogger(ThriftServer.class);

    // Default values, will be overriden by command line arguments or values from config.json
    private static int port = 0;
    private static String luceneDirectoryPath = null;
    private static String logLevel = null;

    private static MemoryStructureImpl memoryStructureImpl;


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
     * Reads precision limit from properties file.
     *
     * @return map of property names and values
     */
    public static int readPrecisionLimitFromProperties() {
        Map<String, String> propertiesMap = readProperties(true);
        return Integer.valueOf(propertiesMap.get("precisionLimit"));
    }

    /**
     * Reads properties from file.
     *
     * @return map of property names and values
     */
    private static Map<String, String> readProperties(boolean silent) {
        Map<String, String> propertiesMap = new HashMap<String, String>();
        try {
            String jsonTxt = IOUtils.toString(new FileInputStream("config.json"));
            JSONObject json = new JSONObject(jsonTxt);
            JSONObject properties = json.getJSONObject("memoryStructure");
            String[] propertyNames = JSONObject.getNames(properties);
            if (logger.isDebugEnabled()) {
                logger.info("properties file found");
            }
            for(String key : propertyNames) {
                propertiesMap.put(key, properties.getString(key));
            }
        }
        catch(JSONException x) {
            logger.warn("ERROR while parsing json in config.json");
        }
        catch(Exception x) {
            logger.warn("no config.json file found");
            x.printStackTrace();
        }
        if (!silent && logger.isDebugEnabled()) {
            for(String key : propertiesMap.keySet()) {
                logger.info("read property from config.json: " + key + " = " + propertiesMap.get(key));
            }
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
        if (logger.isDebugEnabled()) {
            for(String key : propertiesMap.keySet()) {
                logger.info("read property from command line: " + key + " = " + propertiesMap.get(key));
            }
        }
        return propertiesMap;
    }

    /**
     *
     * @param args command line arguments
     */
    private static void initializeMemoryStructure(String[] args) {


        Map<String, String> resolvedProperties = new HashMap<String, String>(readProperties(false));
        Map<String, String> propertiesFromCL = readCL(args);
        for(String key : propertiesFromCL.keySet()) {
            resolvedProperties.put(key, propertiesFromCL.get(key));
        }

        logLevel = resolvedProperties.get("log.level");
        if(StringUtils.isEmpty(logLevel)) {
            logger.warn("Could not find log.level either from memorystructure.properties or from command line arguments.");
            logLevel = "INFO";
            logger.warn("Using default: log.level is " + logLevel);
        }
        DynamicLogger.setLogLevel(logLevel);

        if (logger.isDebugEnabled()) {
            logger.info("command line properties take precedence; result is:");
            for(String key : resolvedProperties.keySet()) {
                logger.info("using property " + key + " = " + resolvedProperties.get(key));
            }
        }

        port = Integer.parseInt(resolvedProperties.get("thrift.port"));
        if(port == 0) {
            logger.warn("Could not find thrift.port either from memorystructure config.json or from command line arguments.");
            port = 9090;
            logger.warn("Using default: thrift.port is " + port);
        }

        luceneDirectoryPath = resolvedProperties.get("lucene.path");
        if(StringUtils.isEmpty(luceneDirectoryPath)) {
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

        MemoryStructure.Processor processor = new MemoryStructure.Processor(memoryStructureImpl);
        // server code provided by Patrick Browne
        TNonblockingServerTransport serverTransport = new TNonblockingServerSocket(port);
        THsHaServer.Args serverArgs = new THsHaServer.Args(serverTransport);
        serverArgs.workerThreads(25);
        serverArgs.processor(processor);
        serverArgs.transportFactory(new TFramedTransport.Factory());
        serverArgs.protocolFactory(new TBinaryProtocol.Factory(true, true));
        //serverArgs.protocolFactory(new TCompactProtocol.Factory());
        TServer server = new THsHaServer(serverArgs);
        logger.info("starting Thrift server (THsHaServer) at port " + port);

        // choice of server guided by https://github.com/m1ch1/mapkeeper/wiki/Thrift-Java-Servers-Compared
        // choice of protocol guided by http://jnb.ociweb.com/jnb/jnbJun2009.html
        // tryouts on hyphe TODO, local experiments give favor to THsHa + Binary
        //TServerTransport serverTransport = new TServerSocket(port);
        //TThreadPoolServer.Args serverArgs = new TThreadPoolServer.Args(serverTransport);
        //serverArgs.minWorkerThreads(5);
        //serverArgs.maxWorkerThreads(25);
        //serverArgs.processor(processor);
        //serverArgs.transportFactory(new TFramedTransport.Factory());
        //serverArgs.protocolFactory(new TBinaryProtocol.Factory(true, true));
        //serverArgs.protocolFactory(new TCompactProtocol.Factory());
        //TServer server = new TThreadPoolServer(serverArgs);
        //logger.info("starting Thrift server (TThreadPoolServer) at port " + port);

        server.serve();
    }

}
