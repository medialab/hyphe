package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityLink;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import org.apache.commons.lang.StringUtils;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.Fieldable;
import org.apache.lucene.index.FieldInfo;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * @author heikki doeleman
 */
public class IndexConfiguration {

    private static DynamicLogger logger = new DynamicLogger(IndexConfiguration.class);

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
        REGEXP,
        NAME,
        SOURCE,
        TARGET,
        WEIGHT,
        CREATIONDATE,
        LASTMODIFICATIONDATE
    }

    /**
     * Types of objects in the index. These values are stored in the docs in field TYPE.
     */
    enum DocType {
        PAGE_ITEM,
        NODE_LINK,
        PRECISION_EXCEPTION,
        WEBENTITY,
        WEBENTITY_LINK,
        WEBENTITY_CREATION_RULE
    }

    public static final String DEFAULT_WEBENTITY_CREATION_RULE = "DEFAULT_WEBENTITY_CREATION_RULE";

    protected static Document SetDates(Document document, String creationDate, String lastModificationDate) {
        if (creationDate != null) {
            Field creationDateField = new Field(FieldName.LASTMODIFICATIONDATE.name(), creationDate, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            creationDateField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(creationDateField);
        }
        if (lastModificationDate != null) {
            Field lastModificationDateField = new Field(FieldName.CREATIONDATE.name(), lastModificationDate, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            lastModificationDateField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(lastModificationDateField);
        }
        return document;
    }

    protected static Document WebEntityLinkDocument(WebEntityLink webEntityLink) {
        if(webEntityLink == null) {
            logger.warn("attempt to create Lucene document for null WebEntityLink");
            return null;
        }
        Document document = new Document();
        //
        // id: generate random UUID
        //
        if(StringUtils.isEmpty(webEntityLink.getId())) {
            Field idField = new Field(FieldName.ID.name(), UUID.randomUUID().toString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(idField);
        }

        Field typeField = new Field(FieldName.TYPE.name(), DocType.WEBENTITY_LINK.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);

        //
        // if the WebEntityLink has no source and target, don't create a Lucene document for it
        //
        if(StringUtils.isEmpty(webEntityLink.getSourceId()) || StringUtils.isEmpty(webEntityLink.getTargetId())) {
            logger.warn("attempt to create Lucene document for WebEntityLink without source or target");
            return null;
        }
        else {
            Field sourceLRUField = new Field(FieldName.SOURCE.name(), webEntityLink.getSourceId(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            sourceLRUField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(sourceLRUField);

            Field targetLRUField = new Field(FieldName.TARGET.name(), webEntityLink.getTargetId(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            targetLRUField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(targetLRUField);

            String weight = String.valueOf(webEntityLink.getWeight());
            Field weightField = new Field(FieldName.WEIGHT.name(), weight, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            weightField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(weightField);

            document = SetDates(document, webEntityLink.getCreationDate(), webEntityLink.getLastModificationDate());

            return document;
        }
    }

    protected static Document NodeLinkDocument(NodeLink nodeLink) {
        if(nodeLink == null) {
            logger.warn("attempt to create Lucene document for null NodeLink");
            return null;
        }
        Document document = new Document();
        //
        // id: generate random UUID
        //
        Field idField = new Field(FieldName.ID.name(), UUID.randomUUID().toString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);

        Field typeField = new Field(FieldName.TYPE.name(), DocType.NODE_LINK.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);

        //
        // if the NodeLink has no source and target, don't create a Lucene document for it
        //
        if(StringUtils.isEmpty(nodeLink.getSourceLRU()) || StringUtils.isEmpty(nodeLink.getTargetLRU())) {
            logger.warn("attempt to create Lucene document for NodeLink without LRU");
            return null;
        }
        else {
            Field sourceLRUField = new Field(FieldName.SOURCE.name(), nodeLink.getSourceLRU(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            sourceLRUField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(sourceLRUField);

            Field targetLRUField = new Field(FieldName.TARGET.name(), nodeLink.getTargetLRU(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            targetLRUField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(targetLRUField);

            String weight = String.valueOf(nodeLink.getWeight());
            Field weightField = new Field(FieldName.WEIGHT.name(), weight, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            weightField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(weightField);

            document = SetDates(document, nodeLink.getCreationDate(), nodeLink.getLastModificationDate());

            return document;
        }
    }

    /**
     * Converts a PageItem into a Lucene document.
     *
     * @param pageItem
     * @return
     */
    protected static Document PageItemDocument(PageItem pageItem) {
        Document document = new Document();
        //
        // id: generate random UUID
        //
        Field idField = new Field(FieldName.ID.name(), UUID.randomUUID().toString(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);

        Field typeField = new Field(FieldName.TYPE.name(), DocType.PAGE_ITEM.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);

        //
        // if the PageItem has no LRU, don't create a Lucene document for it
        //
        if(StringUtils.isNotEmpty(pageItem.getLru())) {
            Field lruField = new Field(FieldName.LRU.name(), pageItem.getLru(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(lruField);
        }
        else {
            logger.warn("attempt to create Lucene document for PageItem without LRU");
            return null;
        }

        if(StringUtils.isNotEmpty(pageItem.getCrawlerTimestamp())) {
            Field crawlerTimestampField = new Field(FieldName.CRAWLERTIMESTAMP.name(), pageItem.getCrawlerTimestamp(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            crawlerTimestampField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(crawlerTimestampField);
        }

        if(StringUtils.isNotEmpty(Integer.toString(pageItem.getDepth()))) {
            Field depthField = new Field(FieldName.DEPTH.name(), Integer.toString(pageItem.getDepth()), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            depthField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(depthField);
        }

        if(StringUtils.isNotEmpty(pageItem.getErrorCode())) {
            Field errorCodeField = new Field(FieldName.ERRORCODE.name(), pageItem.getErrorCode(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            errorCodeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(errorCodeField);
        }

        if(StringUtils.isNotEmpty(Integer.toString(pageItem.getHttpStatusCode()))) {
            Field httpStatusCodeField = new Field(FieldName.HTTPSTATUSCODE.name(), Integer.toString(pageItem.getHttpStatusCode()), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            httpStatusCodeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(httpStatusCodeField);
        }

        document = SetDates(document, pageItem.getCreationDate(), pageItem.getLastModificationDate());

        return document;
    }


    /**
     * Converts a WebEntityCreationRule into a Lucene document.
     *
     * @param webEntityCreationRule
     * @return
     */
    protected static Document WebEntityCreationRuleDocument(WebEntityCreationRule webEntityCreationRule) throws IndexException {

        if(webEntityCreationRule == null) {
            throw new IndexException("WebEntityCreationRule is null");
        }
        if(webEntityCreationRule.getLRU() == null && webEntityCreationRule.getRegExp() == null) {
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
        if(logger.isDebugEnabled()) {
            logger.trace("lucene document for webentity with id " + id);
        }
        Field idField = new Field(FieldName.ID.name(), id, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        idField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(idField);

        String name = webEntity.getName();
        if(StringUtils.isEmpty(name)) {
            name = "auto-generated name" ;
        }
        Field nameField = new Field(FieldName.NAME.name(), name, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        nameField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(nameField);

        Field typeField = new Field(FieldName.TYPE.name(), DocType.WEBENTITY.name(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        typeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(typeField);

        if(logger.isDebugEnabled()) {
            logger.trace("lucene document adding # " + webEntity.getLRUSet().size() + " lrus");
        }
        for(String lru : webEntity.getLRUSet()) {
            Field lruField = new Field(FieldName.LRU.name(), lru, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(lruField);
        }

        document = SetDates(document, webEntity.getCreationDate(), webEntity.getLastModificationDate());

        if(logger.isDebugEnabled()) {
            logger.trace("lucene document has # " + document.getFieldables(FieldName.LRU.name()).length + " lrufields in webentity " + id);
        }
        return document;
    }

    /**
     * Returns a PageItem object from a PageItem Lucene document.
     *
     * @param document
     * @return
     */
    public static PageItem convertLuceneDocument2PageItem(Document document) {
        PageItem pageItem = new PageItem();

        String id = document.get(FieldName.ID.name());
        pageItem.setId(id);

        String lru = document.get(FieldName.LRU.name());
        pageItem.setLru(lru);

        String crawlerTimestamp = document.get(FieldName.CRAWLERTIMESTAMP.name());
        pageItem.setCrawlerTimestamp(crawlerTimestamp);

        String depth$ = document.get(FieldName.DEPTH.name());
        if(StringUtils.isNotEmpty(depth$)) {
            int depth = Integer.parseInt(depth$);
            pageItem.setDepth(depth);
        }

        String errorCode = document.get(FieldName.ERRORCODE.name());
        pageItem.setErrorCode(errorCode);
        pageItem.setCreationDate(document.get(FieldName.CREATIONDATE.name()));
        pageItem.setLastModificationDate(document.get(FieldName.LASTMODIFICATIONDATE.name()));

        String httpStatusCode$ = document.get(FieldName.HTTPSTATUSCODE.name());
        if(StringUtils.isNotEmpty(httpStatusCode$)) {
            int httpStatusCode = Integer.parseInt(httpStatusCode$);
            pageItem.setHttpStatusCode(httpStatusCode);
        }
        return pageItem;
    }

    /**
     * Returns a WebEntity object from a WebEntity Lucene document.
     *
     * @param document
     * @return
     */
    protected static WebEntity convertLuceneDocument2WebEntity(Document document) {
        WebEntity webEntity = new WebEntity();

        String id = document.get(FieldName.ID.name());
        webEntity.setId(id);

        String name = document.get(FieldName.NAME.name());
        webEntity.setName(name);

        Fieldable[] lruFields = document.getFieldables(FieldName.LRU.name());
        if(logger.isDebugEnabled()) {
            logger.trace("lucene doc for webentity has # " + lruFields.length + " lru fields");
        }
        Set<String> lruList = new HashSet<String>();
        for(Fieldable lruField : lruFields) {
            lruList.add(lruField.stringValue());
        }
        webEntity.setLRUSet(lruList);
        webEntity.setCreationDate(document.get(FieldName.CREATIONDATE.name()));
        webEntity.setLastModificationDate(document.get(FieldName.LASTMODIFICATIONDATE.name()));

        if(logger.isDebugEnabled()) {
            logger.trace("convertLuceneDocument2WebEntity returns webentity with id: " + id);
        }
        return webEntity;
    }

    /**
     * Returns a NodeLink object from a NodeLink Lucene document.
     *
     * @param document
     * @return
     */
    public static NodeLink convertLuceneDocument2NodeLink(Document document) {
        NodeLink nodeLink = new NodeLink();

        String id = document.get(FieldName.ID.name());
        nodeLink.setId(id);

        String source = document.get(FieldName.SOURCE.name());
        nodeLink.setSourceLRU(source);

        String target = document.get(FieldName.TARGET.name());
        nodeLink.setTargetLRU(target);

        String weight$ = document.get(FieldName.WEIGHT.name());
        int weight = 0;
        if(StringUtils.isNotEmpty(weight$)) {
            weight = Integer.parseInt(weight$);
        }
        nodeLink.setWeight(weight);
        nodeLink.setCreationDate(document.get(FieldName.CREATIONDATE.name()));
        nodeLink.setLastModificationDate(document.get(FieldName.LASTMODIFICATIONDATE.name()));

        if(logger.isDebugEnabled()) {
            logger.trace("convertLuceneDocument2NodeLink returns nodelink with id: " + id);
        }
        return nodeLink;
    }

    /**
     * Returns a WebEntityLink object from a WebEntityLink Lucene document.
     *
     * @param document
     * @return
     */
    public static WebEntityLink convertLuceneDocument2WebEntityLink(Document document) {
        WebEntityLink webEntityLink = new WebEntityLink();

        String id = document.get(FieldName.ID.name());
        webEntityLink.setId(id);

        String source = document.get(FieldName.SOURCE.name());
        webEntityLink.setSourceId(source);

        String target = document.get(FieldName.TARGET.name());
        webEntityLink.setTargetId(target);

        String weight$ = document.get(FieldName.WEIGHT.name());
        int weight = 0;
        if(StringUtils.isNotEmpty(weight$)) {
            weight = Integer.parseInt(weight$);
        }
        webEntityLink.setWeight(weight);
	webEntityLink.setCreationDate(document.get(FieldName.CREATIONDATE.name()));
	webEntityLink.setLastModificationDate(document.get(FieldName.LASTMODIFICATIONDATE.name()));

        if(logger.isDebugEnabled()) {
            logger.trace("convertLuceneDocument2WebEntityLink returns webEntityLink with id: " + id);
        }
        return webEntityLink;
    }

    /**
     * Returns a WebEntityCreationRule object from a WebEntityCreationRule Lucene document.
     *
     * @param document
     * @return
     */
    protected static WebEntityCreationRule convertLuceneDocument2WebEntityCreationRule(Document document) {
        WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
        String lru = document.get(FieldName.LRU.name());
        String regexp = document.get(FieldName.REGEXP.name());

        webEntityCreationRule.setLRU(lru);
        webEntityCreationRule.setRegExp(regexp);

        if(logger.isDebugEnabled()) {
            logger.trace("convertLuceneDocument2WebEntity returns webEntityCreationRule with lru: " + lru + " and regexp " + regexp);
        }
        return webEntityCreationRule;
    }

}
