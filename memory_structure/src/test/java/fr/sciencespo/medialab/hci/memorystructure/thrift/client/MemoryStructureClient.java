package fr.sciencespo.medialab.hci.memorystructure.thrift.client;

import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructure;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.protocol.TProtocol;
import org.apache.thrift.transport.TSocket;
import org.apache.thrift.transport.TTransport;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.json.JSONException;
import java.util.ArrayList;
import java.util.List;

/**
 * Example client for the MemoryStructure server.
 *
 * @author heikki doeleman
 */
public class MemoryStructureClient {

    private static DynamicLogger logger = new DynamicLogger(MemoryStructureClient.class, DynamicLogger.LogLevel.DEBUG);

    private static int port = 0;
    private static String server = null;

    public static void main(String[] args) {
        TTransport transport = null;
        try {
            String jsonTxt = IOUtils.toString(new FileInputStream("config.json"));
            JSONObject json = new JSONObject(jsonTxt);
            JSONObject properties = json.getJSONObject("memoryStructure");
            String[] propertyNames = JSONObject.getNames(properties);
            logger.info("properties file found");
            for(String key : propertyNames) {
                propertiesMap.put(key, properties.getString(key)); 
            }
        }
        catch(JSONException x) {
            logger.info("ERROR while parsing json in config.json");
        }
        catch(Exception x) {
            logger.info("no config.json file found, using default localhost:9090");
            x.printStackTrace();
            server = "localhost";
            port = 9090
        }
        try {
            /* Code example to connect through thrift to the memory structure
            // Setup the transport and protocol
            final TSocket socket = new TSocket(server, port);
            socket.setTimeout(5000);
            final TTransport transport = new TFramedTransport(socket);
            final TProtocol protocol = new TBinaryProtocol(transport);//new TCompactProtocol(transport);
            final memory_structure.fr.sciencespo.medialab.hci.memorystructure.client.MemoryStructureClient client = new memory_structure.fr.sciencespo.medialab.hci.memorystructure.client.MemoryStructureClient(protocol);

            //The transport must be opened before you can begin using
            transport.open();
            */

            transport = new TSocket(server, port);
            transport.open();
            TProtocol protocol = new  TBinaryProtocol(transport);
            MemoryStructure.Client client = new MemoryStructure.Client(protocol);

            // all hooked up, start using the service

            //
            // test: store LRUItems
            //
            logger.debug("fr.sciencespo.medialab.hci.memorystructure.client.MemoryStructureClient storeLRUItems() test start");
            //
            // create/retrieve test data
            //
            List<PageItem> lruItems = new ArrayList<PageItem>();
            for(int i = 0; i < 5; i++) {
                PageItem lruItem = new PageItem();
                lruItem.setLru("a" + i);
                lruItems.add(lruItem);
            }
            // store in Memory Structure
            String cacheId = client.createCache(lruItems);
            logger.debug("Thrift server successfully created cache with id " + cacheId);

            logger.debug("MemoryStructureClient storeLRUItems() test finished");

        }
        catch(Throwable x) {
            logger.error("Thrift MemoryStructureClient internal error: " + x.getMessage());
            x.printStackTrace();
        }
        finally {
            transport.close();
        }
    }
}
