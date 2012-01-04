package fr.sciencespo.medialab.hci.memorystruture.thrift.client;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.MemoryStructure;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.protocol.TProtocol;
import org.apache.thrift.transport.TSocket;
import org.apache.thrift.transport.TTransport;

import java.util.ArrayList;
import java.util.List;

/**
 * Example client for the MemeoryStructure server.
 *
 * @author heikki doeleman
 */
public class MemoryStructureClient {

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
            System.out.println("fr.sciencespo.medialab.hci.memorystructure.client.MemoryStructureClient storeLRUItems() test start");
            //
            // create/retrieve test data
            //
            List<LRUItem> lruItems = new ArrayList<LRUItem>();
            for(int i = 0; i < 5; i++) {
                LRUItem lruItem = new LRUItem();
                lruItem.setLru("a" + i);
                lruItems.add(lruItem);
            }
            // store in Memory Structure
            boolean success = client.storeLRUItems(lruItems);
            if(success) {
                System.out.println("Thrift server returned success");
            }
            else {
                System.out.println("Thrift server returned failure");
            }
            System.out.println("fr.sciencespo.medialab.hci.memorystructure.client.MemoryStructureClient storeLRUItems() test finished");

        }
        catch(Throwable x) {
            System.err.println("Thrift fr.sciencespo.medialab.hci.memorystructure.client.MemoryStructureClient internal error: " + x.getMessage());
            x.printStackTrace();
        }
        finally {
            transport.close();
        }
    }
}