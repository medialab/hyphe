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
import java.lang.Integer;
import gnu.trove.map.hash.THashMap;

/**
 * MemoryStructure server.
 *
 * @author heikki doeleman, benjamin ooghe-tabanou, patrick browne
 */
public class ThriftServer {

    private static DynamicLogger logger = null;

    // Default values, will be overriden by command line arguments or values from config.json
    private static int port = 0;
    private static String corpus = null;
    private static String luceneDirectoryPath = null;
    private static String luceneDirectoryRoot = null;
    private static String logLevel = null;

    private static MemoryStructureImpl memoryStructureImpl;


    /**
     * Starts the thrift server.
     *
     * @param args command line arguments
     */
    public static void main(String[]args) {
        THashMap<String, String> commandargs = readCL(args);
        corpus = commandargs.get("corpus");
        if(StringUtils.isEmpty(corpus)) {
            System.out.println("ERROR: memory structure cannot start without a corpus given in option as corpus=<corpus_name>");
            System.exit(1);
        }
        System.setProperty("corpus", corpus);
        logger = new DynamicLogger(ThriftServer.class);
        try {
            DynamicLogger.setLogLevel("INFO");
            logger.info("starting Thrift server");
            initializeMemoryStructure(args);
            initializeThriftServer();
        }
        catch(TException x) {
            logger.error("Thrift server exception: " + x.getMessage() + ", shutting down");
            x.printStackTrace();
            System.exit(1);
        }
        catch(Throwable x) {
            logger.error("Internal server error: " + x.getMessage() + ", shutting down");
            x.printStackTrace();
            System.exit(1);
        }
    }

    /**
     * Reads properties from file.
     *
     * @return map of property names and values
     */
    private static THashMap<String, String> readProperties(boolean silent) {
        THashMap<String, String> propertiesMap = new THashMap<String, String>();
        try {
            String jsonTxt = IOUtils.toString(new FileInputStream("config/config.json"));
            JSONObject json = new JSONObject(jsonTxt);
            JSONObject properties = json.getJSONObject("memoryStructure");
            String[] propertyNames = JSONObject.getNames(properties);
            if (logger.isDebugEnabled()) {
                logger.trace("properties file found");
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
                logger.trace("read property from config.json: " + key + " = " + propertiesMap.get(key));
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
    private static THashMap<String, String> readCL(String[] args) {
        THashMap<String, String> propertiesMap = new THashMap<String, String>();
        for(String parameter : args) {
            String property = parameter.substring(0, parameter.indexOf('='));
            String value = parameter.substring(parameter.indexOf('=')+1);
            propertiesMap.put(property, value);
        }
        if (logger != null && logger.isDebugEnabled()) {
            for(String key : propertiesMap.keySet()) {
                logger.debug("read property from command line: " + key + " = " + propertiesMap.get(key));
            }
        }
        return propertiesMap;
    }

    /**
     *
     * @param args command line arguments
     */
    private static void initializeMemoryStructure(String[] args) {


        THashMap<String, String> resolvedProperties = new THashMap<String, String>(readProperties(false));
        THashMap<String, String> propertiesFromCL = readCL(args);
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
            logger.debug("command line properties take precedence; result is:");
            for(String key : resolvedProperties.keySet()) {
                logger.debug("using property " + key + " = " + resolvedProperties.get(key));
            }
        }

        port = Integer.parseInt(resolvedProperties.get("thrift.port"));
        if(port == 0) {
            logger.warn("Could not find thrift.port either from memorystructure config.json or from command line arguments.");
            port = 9090;
            logger.warn("Using default: thrift.port is " + port);
        }

        corpus = resolvedProperties.get("corpus");
        luceneDirectoryRoot = resolvedProperties.get("lucene.rootpath");
        String luceneBackupRoot = resolvedProperties.get("lucene.path");
        if(StringUtils.isEmpty(luceneDirectoryRoot)) {
            if(StringUtils.isEmpty(luceneBackupRoot)) {
                logger.warn("Could not find lucene.rootpath either from memorystructure.properties or from command line arguments.");
                luceneDirectoryRoot = System.getProperty("user.home") + File.separator + "hyphe-memorystructure.lucene";
                logger.warn("Using default: lucene.rootpath is " + luceneDirectoryRoot);
            } else {
                luceneDirectoryRoot = luceneBackupRoot;
            }
        }
        luceneDirectoryPath = luceneDirectoryRoot + File.separator + corpus;

        File luceneDir = new File(luceneDirectoryPath);
        if(luceneDir.exists() && !luceneDir.isDirectory()) {
            logger.error("Lucene path already exists: " + luceneDirectoryPath + " but it is not a directory, exiting");
            System.exit(1);
        }
        else if(!luceneDir.exists()) {
            logger.info("Lucene path does not exist, creating directory: " + luceneDirectoryPath);
            luceneDir.mkdirs();
        }
        else {
            logger.info("Using existing Lucene path: " + luceneDirectoryPath);
        }

        memoryStructureImpl = new MemoryStructureImpl(luceneDirectoryPath, IndexWriterConfig.OpenMode.CREATE_OR_APPEND);

        logger.info("successfully created Memory Structure for corpus " + corpus);

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

        // choice of server guided by https://github.com/m1ch1/mapkeeper/wiki/Thrift-Java-Servers-Compared
        // choice of protocol guided by http://jnb.ociweb.com/jnb/jnbJun2009.html
        // TODO: tryouts on heavy Hyphe instances, local experiments give favor to THsHa + Binary

        TNonblockingServerTransport serverTransport = new TNonblockingServerSocket(port);
        //TServerTransport serverTransport = new TServerSocket(port);
        THsHaServer.Args serverArgs = new THsHaServer.Args(serverTransport);
        //TThreadPoolServer.Args serverArgs = new TThreadPoolServer.Args(serverTransport);

        MemoryStructure.Processor processor = new MemoryStructure.Processor(memoryStructureImpl);
        serverArgs.processor(processor);

        serverArgs.workerThreads(25);
        //serverArgs.minWorkerThreads(5);
        //serverArgs.maxWorkerThreads(25);

        serverArgs.transportFactory(new TFramedTransport.Factory());
        serverArgs.protocolFactory(new TBinaryProtocol.Factory(true, true));
        //serverArgs.protocolFactory(new TCompactProtocol.Factory());

        TServer server = new THsHaServer(serverArgs);
        //TServer server = new TThreadPoolServer(serverArgs);

        logger.info("starting Thrift server (" + server.getClass() + ") at port " + port);
        server.serve();
    }

}
