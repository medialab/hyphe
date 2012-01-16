package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import org.apache.commons.lang.StringUtils;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.Fieldable;
import org.apache.lucene.index.FieldInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * @author heikki doeleman
 */
public class IndexConfiguration {

    private static Logger logger = LoggerFactory.getLogger(IndexConfiguration.class);

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
        HTTPSTATUSCODE,
        REGEXP
    }

    /**
     * Types of objects in the index. These values are stored in the docs in field TYPE.
     */
    enum DocType {
        LRU_ITEM,
        PRECISION_EXCEPTION,
        WEBENTITY,
        WEBENTITY_CREATION_RULE
    }

    private static final String DEFAULT_WEBENTITY_CREATION_RULE = "DEFAULT_WEBENTITY_CREATION_RULE";

    /**
     * Converts a LRUItem into a Lucene document.
     *
     * @param lruItem
     * @return
     */
    protected static Document LRUItemDocument(LRUItem lruItem) {
        Document document = new Document();
        //
        // id: generate random UUID
        //
        Field idField = new Field(FieldName.ID.name(), UUID.randomUUID().toString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);

        Field typeField = new Field(FieldName.TYPE.name(), DocType.LRU_ITEM.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);

        //
        // if the LRUItem has no LRU, don't create a Lucene document for it
        //
        if(StringUtils.isNotEmpty(lruItem.getLru())) {
            Field lruField = new Field(FieldName.LRU.name(), lruItem.getLru(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(lruField);
        }
        else {
            logger.warn("attempt to create Lucene document for LRUItem without LRU");
            return null;
        }

        if(StringUtils.isNotEmpty(lruItem.getCrawlerTimestamp())) {
            Field crawlerTimestampField = new Field(FieldName.CRAWLERTIMESTAMP.name(), lruItem.getCrawlerTimestamp(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            crawlerTimestampField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(crawlerTimestampField);
        }

        if(StringUtils.isNotEmpty(Integer.toString(lruItem.getDepth()))) {
            Field depthField = new Field(FieldName.DEPTH.name(), Integer.toString(lruItem.getDepth()), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            depthField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(depthField);
        }

        if(StringUtils.isNotEmpty(lruItem.getErrorCode())) {
            Field errorCodeField = new Field(FieldName.ERRORCODE.name(), lruItem.getErrorCode(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            errorCodeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(errorCodeField);
        }

        if(StringUtils.isNotEmpty(Integer.toString(lruItem.getHttpStatusCode()))) {
            Field httpStatusCodeField = new Field(FieldName.HTTPSTATUSCODE.name(), Integer.toString(lruItem.getHttpStatusCode()), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            httpStatusCodeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(httpStatusCodeField);
        }

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

    /**
     * Converts a WebEntityCreationRule into a Lucene document.
     *
     * @param webEntityCreationRule
     * @return
     */
    protected static Document WebEntityCreationRuleDocument(WebEntityCreationRule webEntityCreationRule) throws IndexException {

        if(webEntityCreationRule.getLRU() == null || webEntityCreationRule.getRegExp() == null) {
            throw new IndexException("WebEntityCreationRule has null properties");
        }

        Document document = new Document();

        Field idField = new Field(FieldName.ID.name(), UUID.randomUUID().toString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);

        Field typeField = new Field(FieldName.TYPE.name(), DocType.WEBENTITY_CREATION_RULE.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);

        String lru = DEFAULT_WEBENTITY_CREATION_RULE;
        if(StringUtils.isNotEmpty(webEntityCreationRule.getLRU())) {
            lru = webEntityCreationRule.getLRU();
        }
        Field lruField = new Field(FieldName.LRU.name(), lru, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(lruField);

        Field regExpField = new Field(FieldName.REGEXP.name(), webEntityCreationRule.getRegExp(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        regExpField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(regExpField);

        return document;
    }

    /**
     * Converts a WebEntity into a Lucene document. If the webEntity has no ID, one is created (in case of new
     * WebEntities that weren't stored before).
     *
     * @param webEntity
     * @return
     */
    protected static Document WebEntityDocument(WebEntity webEntity) {
        Document document = new Document();

        String id = webEntity.getId();
        if(StringUtils.isEmpty(webEntity.getId())) {
            id = UUID.randomUUID().toString();
        }
        logger.debug("lucene document for webentity with id " + id);
        Field idField = new Field(FieldName.ID.name(), id, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);

        Field typeField = new Field(FieldName.TYPE.name(), DocType.WEBENTITY.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);

        logger.debug("lucene document adding # " + webEntity.getLRUlist().size() + " lrus");
        for(String lru : webEntity.getLRUlist()) {
            Field lruField = new Field(FieldName.LRU.name(), lru, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(lruField);
        }
        logger.debug("lucene document has # " + document.getFieldables(FieldName.LRU.name()).length + " lrufields in webentity " + id);
        return document;
    }

    /**
     * Returns a WebEntity object from a WebEntity Lucene document.
     *
     * @param webEntityDocument
     * @return
     */
    protected static WebEntity convertLuceneDocument2WebEntity(Document webEntityDocument) {
        WebEntity webEntity = new WebEntity();
        String id = webEntityDocument.get(IndexConfiguration.FieldName.ID.name());
        webEntity.setId(id);
        Fieldable[] lruFields = webEntityDocument.getFieldables(IndexConfiguration.FieldName.LRU.name());
        logger.debug("lucene doc for webentity has # " + lruFields.length + " lru fields");
        Set<String> lruList = new HashSet<String>();
        for(Fieldable lruField : lruFields) {
            lruList.add(lruField.stringValue());
        }
        webEntity.setLRUlist(lruList);
        logger.debug("convertLuceneDocument2WebEntity returns webentity with id: " + id);
        return webEntity;
    }

}