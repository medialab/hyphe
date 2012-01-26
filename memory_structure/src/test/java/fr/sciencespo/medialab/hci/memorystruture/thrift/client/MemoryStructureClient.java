package fr.sciencespo.medialab.hci.memorystruture.thrift.client;

import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructure;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.protocol.TProtocol;
import org.apache.thrift.transport.TSocket;
import org.apache.thrift.transport.TTransport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Example client for the MemoryStructure server.
 *
 * @author heikki doeleman
 */
public class MemoryStructureClient {

    private static Logger logger = LoggerFactory.getLogger(MemoryStructureClient.class);

    private final static int port = 9090;
    private final static String server = "localhost";


    public static void main(String[] args) {
        TTransport transport = null;
        try {
            /*
            //Setup the transport and protocol
            final TSocket socket = new TSocket("localhost", 9090);
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
            Set<PageItem> lruItems = new HashSet<PageItem>();
            for(int i = 0; i < 5; i++) {
                PageItem lruItem = new PageItem();
                lruItem.setLru("a" + i);
                lruItems.add(lruItem);
            }
            // store in Memory Structure
            String cacheId = client.createCache(lruItems);
            logger.debug("Thrift server returned success (no exception happened)");

            logger.debug("fr.sciencespo.medialab.hci.memorystructure.client.MemoryStructureClient storeLRUItems() test finished");

        }
        catch(Throwable x) {
            logger.error("Thrift fr.sciencespo.medialab.hci.memorystructure.client.MemoryStructureClient internal error: " + x.getMessage());
            x.printStackTrace();
        }
        finally {
            transport.close();
        }
    }
}