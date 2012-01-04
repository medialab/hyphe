package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.index.FieldInfo;

import java.util.UUID;

/**
 * @author heikki doeleman
 */
public class IndexConfiguration {

    enum fieldName {
        ID,
        TYPE,
        lRU
    }

    enum docType {
        LRU_ITEM,
        PRECISION_EXCEPTION
    }


    /**
     * Converts a LRUItem into an Index document.
     *
     * @param lruItem
     * @return
     */
    protected static Document LRUItemDocument(LRUItem lruItem) {
        Document document = new Document();
        Field idField = new Field(fieldName.ID.name(), UUID.randomUUID().toString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);
        Field typeField = new Field(fieldName.TYPE.name(), docType.LRU_ITEM.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);
        Field lruField = new Field(fieldName.lRU.name(), lruItem.getLru(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(lruField);
        return document;
    }

    /**
     * Converts a Precision Limit into an Index document.
     *
     * @param lru
     * @return
     */
    protected static Document PrecisionLimitDocument(String lru) {
        Document document = new Document();
        Field idField = new Field(fieldName.ID.name(), UUID.randomUUID().toString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);
        Field typeField = new Field(fieldName.TYPE.name(), docType.PRECISION_EXCEPTION.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);
        Field lruField = new Field(fieldName.lRU.name(), lru, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(lruField);
        return document;
    }

}
