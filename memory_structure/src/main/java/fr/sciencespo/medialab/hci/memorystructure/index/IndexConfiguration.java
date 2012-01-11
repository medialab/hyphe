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

    /**
     * Names of fields in the index. Not every doc needs to have all of these fields.
     */
    enum FieldName {
        ID,
        TYPE,
        LRU,
        CRAWLERTIMESTAMP,
        DEPTH,
        ERRORCODE,
        HTTPSTATUSCODE
    }

    /**
     * Types of objects in the index. These values are stored in the docs in field TYPE.
     */
    enum DocType {
        LRU_ITEM,
        PRECISION_EXCEPTION
    }


    /**
     * Converts a LRUItem into a Lucene document.
     *
     * @param lruItem
     * @return
     */
    protected static Document LRUItemDocument(LRUItem lruItem) {
        Document document = new Document();

        Field idField = new Field(FieldName.ID.name(), UUID.randomUUID().toString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);

        Field typeField = new Field(FieldName.TYPE.name(), DocType.LRU_ITEM.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);

        Field lruField = new Field(FieldName.LRU.name(), lruItem.getLru(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(lruField);

        Field crawlerTimestampField = new Field(FieldName.CRAWLERTIMESTAMP.name(), lruItem.getCrawlerTimestamp(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(crawlerTimestampField);

        Field depthField = new Field(FieldName.DEPTH.name(), Integer.toString(lruItem.getDepth()), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(depthField);

        Field errorCodeField = new Field(FieldName.ERRORCODE.name(), lruItem.getErrorCode(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(errorCodeField);

        Field httpStatusCodeField = new Field(FieldName.HTTPSTATUSCODE.name(), Integer.toString(lruItem.getHttpStatusCode()), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(httpStatusCodeField);

        return document;
    }

    /**
     * Converts a Precision Exception into a Lucene document.
     *
     * @param lru
     * @return
     */
    protected static Document PrecisionExceptionDocument(String lru) {
        Document document = new Document();

        Field idField = new Field(FieldName.ID.name(), UUID.randomUUID().toString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);

        Field typeField = new Field(FieldName.TYPE.name(), DocType.PRECISION_EXCEPTION.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);

        Field lruField = new Field(FieldName.LRU.name(), lru, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(lruField);

        return document;
    }

}