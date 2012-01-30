package fr.sciencespo.medialab.hci.memorystructure.gexf;

import com.ojn.gexf4j.core.Gexf;
import com.ojn.gexf4j.core.GexfWriter;
import com.ojn.gexf4j.core.Node;
import com.ojn.gexf4j.core.data.Attribute;
import com.ojn.gexf4j.core.data.AttributeClass;
import com.ojn.gexf4j.core.data.AttributeList;
import com.ojn.gexf4j.core.data.AttributeType;
import com.ojn.gexf4j.core.impl.GexfImpl;
import com.ojn.gexf4j.core.impl.StaxGraphWriter;
import com.ojn.gexf4j.core.impl.data.AttributeListImpl;
import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Date;
import java.util.Set;

/**
 *  Create GEXF graphs from the web entities and web entities links in the index.
 * @author heikki doeleman
 */
public class GEXFWriter {

    private static Logger logger = LoggerFactory.getLogger(GEXFWriter.class);

    public static String writeGEXF() throws GEXFWriterException {
        try {
            Gexf gexf = new GexfImpl();

            gexf.getMetadata()
                    .setLastModified(new Date())
                    .setCreator("Sciences Po MediaLab")
                    .setDescription("Hypertext Corpus Initiative Web Entity Network");

            LRUIndex lruIndex = LRUIndex.getInstance();
            Set<WebEntity> webEntities = lruIndex.retrieveWebEntities();
            logger.debug("retrieved # " + webEntities.size() + " web entities for GEXF graph");

            AttributeList attrList = new AttributeListImpl(AttributeClass.NODE);

            Attribute attUrl = attrList.createAttribute("0", AttributeType.STRING, "url");
            Attribute attIndegree = attrList.createAttribute("1", AttributeType.FLOAT, "indegree");
            Attribute attFrog = attrList.createAttribute("2", AttributeType.BOOLEAN, "frog").setDefaultValue("true");

            gexf.getGraph().getAttributeLists().add(attrList);

            for(WebEntity webEntity : webEntities) {
                Node node = gexf.getGraph().createNode(webEntity.getId());
                node.setLabel(webEntity.getName());
                node.getAttributeValues().addValue(attUrl, webEntity.getLRUSetIterator().next()).addValue(attIndegree, "1");
            }

            GexfWriter writer = new StaxGraphWriter() ;
            OutputStream outputStream = new ByteArrayOutputStream();
            writer.writeToStream(gexf, outputStream);

            return outputStream.toString();
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new GEXFWriterException(x.getMessage(), x);
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new GEXFWriterException(x.getMessage(), x);
        }
    }
}