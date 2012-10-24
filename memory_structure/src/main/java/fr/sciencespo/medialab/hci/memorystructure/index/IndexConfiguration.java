package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityLink;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import fr.sciencespo.medialab.hci.memorystructure.util.LRUUtil;

import org.apache.commons.lang.StringUtils;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.Fieldable;
import org.apache.lucene.index.FieldInfo;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
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
        URL,
        CRAWLERTS,
        DEPTH,
        ERROR,
        HTTPSTATUS,
        STATUS,
        FULLPREC,
        IS_NODE,
        TAG,
        REGEXP,
        NAME,
        HOMEPAGE,
        STARTPAGE,
        SOURCE,
        TARGET,
        WEIGHT,
        DATECREA,
        DATEMODIF
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
    enum WEStatus {
        UNDECIDED,
        IN,
        OUT,
        DISCOVERED
    }

    public static String getWEStatusValue(final String status) {
        for (WEStatus good : WEStatus.values()) {
            if (status == good.toString()) {
                return good.name();
            }
        }
        return WEStatus.DISCOVERED.name();
    }

    public static final String DEFAULT_WEBENTITY_CREATION_RULE = "DEFAULT_WEBENTITY_CREATION_RULE";

    protected static Document SetDates(Document document, String creationDate, String lastModificationDate) {
        String currentDate = String.valueOf(System.currentTimeMillis());
        if (creationDate == null) {
            creationDate = currentDate;
        }
        if (lastModificationDate == null) {
            lastModificationDate = currentDate;
        }
        Field creationDateField = new Field(FieldName.DATEMODIF.name(), creationDate, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        creationDateField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(creationDateField);
        if (lastModificationDate != null) {
            Field lastModificationDateField = new Field(FieldName.DATECREA.name(), lastModificationDate, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
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

        //
        // if the PageItem has no URL, recreate it from LRU
        //
        if(StringUtils.isEmpty(pageItem.getUrl())) {
            pageItem.setUrl(LRUUtil.revertLRU(pageItem.getLru()));
        }
        Field urlField = new Field(FieldName.URL.name(), pageItem.getUrl(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        urlField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(urlField);

        if(StringUtils.isNotEmpty(pageItem.getCrawlerTimestamp())) {
            Field crawlerTimestampField = new Field(FieldName.CRAWLERTS.name(), pageItem.getCrawlerTimestamp(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            crawlerTimestampField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(crawlerTimestampField);
        }

        if(StringUtils.isNotEmpty(Integer.toString(pageItem.getDepth()))) {
            Field depthField = new Field(FieldName.DEPTH.name(), Integer.toString(pageItem.getDepth()), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            depthField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(depthField);
        }

        if(StringUtils.isNotEmpty(pageItem.getErrorCode())) {
            Field errorCodeField = new Field(FieldName.ERROR.name(), pageItem.getErrorCode(), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            errorCodeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(errorCodeField);
        }

        if(StringUtils.isNotEmpty(Integer.toString(pageItem.getHttpStatusCode()))) {
            Field httpStatusCodeField = new Field(FieldName.HTTPSTATUS.name(), Integer.toString(pageItem.getHttpStatusCode()), Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            httpStatusCodeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(httpStatusCodeField);
        }

        if(StringUtils.isNotEmpty(Boolean.toString(pageItem.isNode))) {
            Field isNodeField = new Field(FieldName.IS_NODE.name(), Boolean.toString(pageItem.isNode), Field.Store.NO, Field.Index.NOT_ANALYZED_NO_NORMS);
            isNodeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(isNodeField);
        }

        if(StringUtils.isNotEmpty(Boolean.toString(pageItem.isFullPrecision))) {
            Field isFullPrecision = new Field(FieldName.FULLPREC.name(), Boolean.toString(pageItem.isFullPrecision), Field.Store.NO, Field.Index.NOT_ANALYZED_NO_NORMS);
            isFullPrecision.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(isFullPrecision);
        }

        if (pageItem.getSourceSet().size() > 0) {
	        for(String source : pageItem.getSourceSet()) {
	            Field sourceField = new Field(FieldName.SOURCE.name(), source, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
	            sourceField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
	            document.add(sourceField);
	        }
        }

        Map<String, Set<String>> tags = pageItem.getMetadataItems();
        for (String tagKey : tags.keySet()) {
            for (String tagValue: tags.get(tagKey)) {
                Field tagField = new Field(FieldName.TAG.name(), tagKey+"="+tagValue, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
                tagField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
                document.add(tagField);
            }
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

        document = SetDates(document, webEntityCreationRule.getCreationDate(), webEntityCreationRule.getLastModificationDate());

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
        if (webEntity.getLRUSet().size() > 0) {
            for(String lru : webEntity.getLRUSet()) {
                Field lruField = new Field(FieldName.LRU.name(), lru, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
                lruField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
                document.add(lruField);
            }
        }
        if(logger.isDebugEnabled()) {
            logger.trace("lucene document has # " + document.getFieldables(FieldName.LRU.name()).length + " lrufields in webentity " + id);
        }

        String status = getWEStatusValue(webEntity.getStatus());
        Field statusField = new Field(FieldName.STATUS.name(), status, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
        statusField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        document.add(statusField);

        String homePage = webEntity.getHomepage();
        if(StringUtils.isNotEmpty(homePage)) {
            Field homeField = new Field(FieldName.HOMEPAGE.name(), homePage, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
            homeField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
            document.add(homeField);
        }

        Set<String> startPages = webEntity.getStartpages();
        if (startPages.size() > 0) {
            for (String page : startPages) {
                Field pagesField = new Field(FieldName.STARTPAGE.name(), page, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
                pagesField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
                document.add(pagesField);
            }
        }

        Map<String, Set<String>> tags = webEntity.getMetadataItems();
        if (! tags.isEmpty()) {
            for (String tagKey : tags.keySet()) {
                for (String tagValue: tags.get(tagKey)) {
                    Field tagField = new Field(FieldName.TAG.name(), tagKey+"="+tagValue, Field.Store.YES, Field.Index.NOT_ANALYZED_NO_NORMS);
                    tagField.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
                    document.add(tagField);
                }
            }
        }

        document = SetDates(document, webEntity.getCreationDate(), webEntity.getLastModificationDate());

        return document;
    }


    /**
     * Returns a HashMap of tags from the corresponding fields of a Lucene document.
     *
     * @param tagFields
     * @return
     */
    private static Map<String, Set<String>> convertTagFieldsToTagsSet(Fieldable[] tagFields) {
        Map<String, Set<String>> tags = new HashMap<String, Set<String>>();
        if (tagFields.length != 0) {
            for(Fieldable tagField : tagFields) {
                String tag = tagField.stringValue();
                String key = tag.substring(0, tag.indexOf("="));
                String value = tag.replace(key + "=", "");
                if (! tags.containsKey(key)) {
                    tags.put(key, new HashSet<String>());
                }
                tags.get(key).add(value);
            }
        }
        return tags;
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

        String url = document.get(FieldName.URL.name());
        pageItem.setUrl(url);

        String crawlerTimestamp = document.get(FieldName.CRAWLERTS.name());
        pageItem.setCrawlerTimestamp(crawlerTimestamp);

        String depth$ = document.get(FieldName.DEPTH.name());
        if(StringUtils.isNotEmpty(depth$)) {
            int depth = Integer.parseInt(depth$);
            pageItem.setDepth(depth);
        }

        Fieldable[] sourceFields = document.getFieldables(FieldName.SOURCE.name());
        Set<String> sourceList = new HashSet<String>();
        if (sourceList.size() != 0) {
            for(Fieldable sourceField : sourceFields) {
                sourceList.add(sourceField.stringValue());
            }
        }
        pageItem.setSourceSet(sourceList);

        String errorCode = document.get(FieldName.ERROR.name());
        pageItem.setErrorCode(errorCode);

        Boolean isFullPrec = Boolean.valueOf(document.get(FieldName.FULLPREC.name()));
        pageItem.setIsFullPrecision(isFullPrec);
        Boolean isNode = Boolean.valueOf(document.get(FieldName.IS_NODE.name()));
        pageItem.setIsNode(isNode);
        
        String httpStatusCode$ = document.get(FieldName.HTTPSTATUS.name());
        if(StringUtils.isNotEmpty(httpStatusCode$)) {
            int httpStatusCode = Integer.parseInt(httpStatusCode$);
            pageItem.setHttpStatusCode(httpStatusCode);
        }

        Fieldable[] tagFields = document.getFieldables(FieldName.TAG.name());
        pageItem.setMetadataItems(convertTagFieldsToTagsSet(tagFields));

        pageItem.setCreationDate(document.get(FieldName.DATECREA.name()));
        pageItem.setLastModificationDate(document.get(FieldName.DATEMODIF.name()));
        
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

        String status = getWEStatusValue(document.get(FieldName.STATUS.name()));
        webEntity.setStatus(status);

        String homePage = document.get(FieldName.HOMEPAGE.name());
        webEntity.setHomepage(homePage);

        Fieldable[] startPageFields = document.getFieldables(FieldName.STARTPAGE.name());;
        Set<String> startPages = new HashSet<String>();
        if (startPageFields.length > 0) {
            for(Fieldable startPageField : startPageFields) {
                startPages.add(startPageField.stringValue());
            }
        }
        webEntity.setStartpages(startPages);

        Fieldable[] tagFields = document.getFieldables(FieldName.TAG.name());
        webEntity.setMetadataItems(convertTagFieldsToTagsSet(tagFields));

        webEntity.setCreationDate(document.get(FieldName.DATECREA.name()));
        webEntity.setLastModificationDate(document.get(FieldName.DATEMODIF.name()));

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
        nodeLink.setCreationDate(document.get(FieldName.DATECREA.name()));
        nodeLink.setLastModificationDate(document.get(FieldName.DATEMODIF.name()));

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
        webEntityLink.setCreationDate(document.get(FieldName.DATECREA.name()));
        webEntityLink.setLastModificationDate(document.get(FieldName.DATEMODIF.name()));

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
        webEntityCreationRule.setCreationDate(document.get(FieldName.DATECREA.name()));
        webEntityCreationRule.setLastModificationDate(document.get(FieldName.DATEMODIF.name()));

        if(logger.isDebugEnabled()) {
            logger.trace("convertLuceneDocument2WebEntity returns webEntityCreationRule with lru: " + lru + " and regexp " + regexp);
        }
        return webEntityCreationRule;
    }

}
