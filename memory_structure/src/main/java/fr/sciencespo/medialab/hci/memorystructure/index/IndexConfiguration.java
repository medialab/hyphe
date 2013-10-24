package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.index.IndexException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.Constants;
import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityNodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityStatus;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import fr.sciencespo.medialab.hci.memorystructure.util.LRUUtil;

import org.apache.commons.lang.StringUtils;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.Fieldable;
import org.apache.lucene.index.FieldInfo;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.UUID;

/**
 * @author heikki doeleman, benjamin ooghe-tabanou
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
        TAG_NAMESPACE,
        TAG_CATEGORY,
        TAG_VALUE,
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
        WEBENTITY_NODE_LINK,
        WEBENTITY_LINK,
        WEBENTITY_CREATION_RULE
    }

    /**
     * Return the correct FieldName match for a string
     *
     * @param status
     * @return
     */
    public static String getFieldNameValue(final String field) {
        if (StringUtils.isNotEmpty(field)) {
            for (FieldName good : FieldName.values()) {
                if (field.equalsIgnoreCase(good.name())) {
                    return good.name();
                }
            }
        }
        return null;
    }

    /**
     * Return the correctly formatted status defined in WebEntityStatus corresponding to this status or DISCOVERED by default
     *
     * @param status
     * @return
     */
    public static String getWEStatusValue(final String status) {
        if (StringUtils.isNotEmpty(status)) {
            for (WebEntityStatus good : WebEntityStatus.values()) {
                if (status.equalsIgnoreCase(good.name())) {
                    return good.name();
                }
            }
        }
        return WebEntityStatus.DISCOVERED.name();
    }

    private static Document addDocumentField(Document document, FieldName name, String value, boolean store, boolean index, boolean tokenize) {
        Field.Store fieldStore = Field.Store.YES;
        if (! store) {
            fieldStore = Field.Store.NO;
        }
        Field.Index fieldIndex = Field.Index.NOT_ANALYZED_NO_NORMS;
        if (! index) {
            fieldIndex = Field.Index.NO;
        } else if (tokenize) {
            fieldIndex = Field.Index.ANALYZED_NO_NORMS;
        }
        Field field = new Field(name.name(), value, fieldStore, fieldIndex, Field.TermVector.NO);
        if (! tokenize) {
            field.setIndexOptions(FieldInfo.IndexOptions.DOCS_ONLY);
        }
        field.setOmitNorms(true);
        document.add(field);
        return document;
    }

    private static Document addDocumentUnstoredField(Document document, FieldName name, String value) {
        return addDocumentField(document, name, value, false, true, true);
    }

    private static Document addDocumentUnindexedField(Document document, FieldName name, String value) {
        return addDocumentField(document, name, value, true, false, false);
    }

    private static Document addDocumentUntokenizedField(Document document, FieldName name, String value) {
        return addDocumentField(document, name, value, true, true, false);
    }

    private static Document addDocumentTokenizedField(Document document, FieldName name, String value) {
        return addDocumentField(document, name, value, true, true, true);
    }

    /**
     * Set the creation and the modification date of the document
     *
     * @param document
     * @param creationDate The creation date
     * @return
     */
    private static Document setDocumentDates(Document document, String creationDate) {
        String currentDate = String.valueOf(System.currentTimeMillis());
        if (creationDate == null) {
            creationDate = currentDate;
        }
        document = addDocumentUnindexedField(document, FieldName.DATECREA, creationDate);
        document = addDocumentUnindexedField(document, FieldName.DATEMODIF, currentDate);
        return document;
    }


    // -- PAGEITEMS


    /**
     * Converts a PageItem into a Lucene document.
     *
     * @param pageItem PageItem to convert to a Lucene document
     * @return
     */
    protected static Document convertPageItemToLuceneDocument(PageItem pageItem) {
        Document document = new Document();

        // id: generate random UUID
        document = addDocumentUntokenizedField(document, FieldName.ID, UUID.randomUUID().toString());
        document = addDocumentUntokenizedField(document, FieldName.TYPE, DocType.PAGE_ITEM.name());

        // if the PageItem has no LRU, don't create a Lucene document for it
        if(StringUtils.isNotEmpty(pageItem.getLru())) {
            document = addDocumentUntokenizedField(document, FieldName.LRU, pageItem.getLru());
        }
        else {
            logger.warn("attempt to create Lucene document for PageItem without LRU");
            return null;
        }

        // if the PageItem has no URL, recreate it from LRU
        if(StringUtils.isEmpty(pageItem.getUrl())) {
            pageItem.setUrl(LRUUtil.revertLRU(pageItem.getLru()));
        }
        document = addDocumentUntokenizedField(document, FieldName.URL, pageItem.getUrl());

        if(StringUtils.isNotEmpty(pageItem.getCrawlerTimestamp())) {
            document = addDocumentUnindexedField(document, FieldName.CRAWLERTS, pageItem.getCrawlerTimestamp());
        }

        if(StringUtils.isNotEmpty(Integer.toString(pageItem.getDepth()))) {
            document = addDocumentUnindexedField(document, FieldName.DEPTH, Integer.toString(pageItem.getDepth()));
        }

        if(StringUtils.isNotEmpty(pageItem.getErrorCode())) {
            document = addDocumentUnindexedField(document, FieldName.ERROR, pageItem.getErrorCode());
        }

        if(StringUtils.isNotEmpty(Integer.toString(pageItem.getHttpStatusCode()))) {
            document = addDocumentUnindexedField(document, FieldName.HTTPSTATUS, Integer.toString(pageItem.getHttpStatusCode()));
        }

        if(StringUtils.isNotEmpty(Boolean.toString(pageItem.isNode))) {
            document = addDocumentUnindexedField(document, FieldName.IS_NODE, Boolean.toString(pageItem.isNode));
        }

        if(StringUtils.isNotEmpty(Boolean.toString(pageItem.isFullPrecision))) {
            document = addDocumentUnindexedField(document, FieldName.FULLPREC, Boolean.toString(pageItem.isFullPrecision));
        }

        if (pageItem.getSourceSet() != null) {
            for(String source : pageItem.getSourceSet()) {
                document = addDocumentUntokenizedField(document, FieldName.SOURCE, source);
            }
        }

        Map<String, Map<String, List<String>>> tags = pageItem.getMetadataItems();
        if (tags != null) {
            for (String tagNameSpace : tags.keySet()) {
                document = addDocumentUnstoredField(document, FieldName.TAG_NAMESPACE, tagNameSpace);
                for (String tagKey : tags.get(tagNameSpace).keySet()) {
                    document = addDocumentUnstoredField(document, FieldName.TAG_CATEGORY, tagKey);
                    for (String tagValue: tags.get(tagNameSpace).get(tagKey)) {
                        document = addDocumentUnstoredField(document, FieldName.TAG_VALUE, tagValue);
                        document = addDocumentUntokenizedField(document, FieldName.TAG, tagNameSpace+":"+tagKey+"="+tagValue);
                    }
                }
            }
        }

        document = setDocumentDates(document, pageItem.getCreationDate());
        return document;
    }

    /**
     * Returns a PageItem object from a PageItem Lucene document.
     *
     * @param document
     * @return
     */
    public static PageItem convertLuceneDocumentToPageItem(Document document) {
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
        if (sourceList != null) {
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
        pageItem.setMetadataItems(convertTagFieldsToTagsMap(tagFields));

        pageItem.setCreationDate(document.get(FieldName.DATECREA.name()));
        pageItem.setLastModificationDate(document.get(FieldName.DATEMODIF.name()));

        return pageItem;
    }


    // -- NODELINKS


    /**
     * Converts a NodeLink into a Lucene Document
     *
     * @param nodeLink NodeLink to convert into a Lucene Document
     * @return
     */
    protected static Document convertNodeLinkToLuceneDocument(NodeLink nodeLink) {
        if(nodeLink == null) {
            logger.warn("attempt to create Lucene document for null NodeLink");
            return null;
        }
        Document document = new Document();

        // id: generate random UUID
        document = addDocumentUntokenizedField(document, FieldName.ID, UUID.randomUUID().toString());
        document = addDocumentUntokenizedField(document, FieldName.TYPE, DocType.NODE_LINK.name());

        // if the NodeLink has no source and target, don't create a Lucene document for it
        if(StringUtils.isEmpty(nodeLink.getSourceLRU()) || StringUtils.isEmpty(nodeLink.getTargetLRU())) {
            logger.warn("attempt to create Lucene document for NodeLink without LRU");
            return null;
        }
        else {
            document = addDocumentUntokenizedField(document, FieldName.SOURCE, nodeLink.getSourceLRU());
            document = addDocumentUntokenizedField(document, FieldName.TARGET, nodeLink.getTargetLRU());

            String weight = String.valueOf(nodeLink.getWeight());
            document = addDocumentUnindexedField(document, FieldName.WEIGHT, weight);

            document = setDocumentDates(document, nodeLink.getCreationDate());
            return document;
        }
    }

    /**
     * Returns a NodeLink object from a NodeLink Lucene document.
     *
     * @param document
     * @return
     */
    public static NodeLink convertLuceneDocumentToNodeLink(Document document) {
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
            logger.trace("convertLuceneDocumentToNodeLink returns nodelink with id: " + id);
        }
        return nodeLink;
    }


    // -- WEBENTITIES


    /**
     * Returns a HashMap of tags from the corresponding fields of a Lucene document.
     *
     * @param tagFields
     * @return
     */
    private static Map<String, Map<String, List<String>>> convertTagFieldsToTagsMap(Fieldable[] tagFields) {
        List<String> tagStrings = new ArrayList<String>(tagFields.length);
        if (tagFields.length != 0) {
            for (Fieldable tagField : tagFields) {
                tagStrings.add(tagField.stringValue());
            }
        }
        return convertTagStringsToTagsMap(tagStrings);
    }

    /**
     * Returns a HashMap of tags from a list of String formatted tags
     *
     * @param tagFields
     * @return
     */
    protected static Map<String, Map<String, List<String>>> convertTagStringsToTagsMap(List<String> tagStrings) {

        Map<String, Map<String, List<String>>> tags = new HashMap<String, Map<String, List<String>>>();
        if (tagStrings.size() != 0) {
            for(String tag : tagStrings) {
                String nameSpace = tag.substring(0, tag.indexOf(":"));
                String keyValue = tag.replace(nameSpace + ":", "");
                String key = keyValue.substring(0, keyValue.indexOf("="));
                String value = keyValue.replace(key + "=", "");
                if (! tags.containsKey(nameSpace)) {
                    tags.put(nameSpace, new HashMap<String, List<String>>());
                }
                if (! tags.get(nameSpace).containsKey(key)) {
                    tags.get(nameSpace).put(key, new ArrayList<String>());
                }
                tags.get(nameSpace).get(key).add(value);
            }
        }
        return tags;
    }

    /**
     * Converts a WebEntity into a Lucene document. If the webEntity has no ID, one is created (in case of new
     * WebEntities that weren't stored before).
     *
     * @param webEntity
     * @return
     */
    protected static Document convertWebEntityToLuceneDocument(WebEntity webEntity) {
        String id = webEntity.getId();
        if(StringUtils.isEmpty(webEntity.getId())) {
            id = UUID.randomUUID().toString();
        }
        if(logger.isDebugEnabled()) {
            logger.trace("lucene document for webentity with id " + id);
        }
        Document document = new Document();
        document = addDocumentUntokenizedField(document, FieldName.ID, id);
        document = addDocumentUntokenizedField(document, FieldName.TYPE, DocType.WEBENTITY.name());

        String name = webEntity.getName();
        if(StringUtils.isEmpty(name)) {
            name = Constants.DEFAULT_WEBENTITY;
        }
        document = addDocumentTokenizedField(document, FieldName.NAME, name);

        if (webEntity.getLRUSet() != null) {
            for(String lru : webEntity.getLRUSet()) {
                document = addDocumentUntokenizedField(document, FieldName.LRU, lru);
            }
            if(logger.isDebugEnabled()) {
                logger.trace("lucene document has # " + document.getFieldables(FieldName.LRU.name()).length + " lrufields in webentity " + id);
            }
        }

        String status = getWEStatusValue(webEntity.getStatus());
        document = addDocumentTokenizedField(document, FieldName.STATUS, status);

        String homePage = webEntity.getHomepage();
        if(StringUtils.isNotEmpty(homePage)) {
            document = addDocumentUntokenizedField(document, FieldName.HOMEPAGE, homePage);
        }

        Set<String> startPages = webEntity.getStartpages();
        if (startPages != null) {
            for (String page : startPages) {
                document = addDocumentUntokenizedField(document, FieldName.STARTPAGE, page);
            }
        }

        Map<String, Map<String, List<String>>> tags = webEntity.getMetadataItems();
        if (tags != null) {
            for (String tagNameSpace : tags.keySet()) {
                document = addDocumentUnstoredField(document, FieldName.TAG_NAMESPACE, tagNameSpace);
                for (String tagKey : tags.get(tagNameSpace).keySet()) {
                    document = addDocumentUnstoredField(document, FieldName.TAG_CATEGORY, tagKey);
                    for (String tagValue: tags.get(tagNameSpace).get(tagKey)) {
                        document = addDocumentUnstoredField(document, FieldName.TAG_VALUE, tagValue);
                        document = addDocumentUntokenizedField(document, FieldName.TAG, tagNameSpace+":"+tagKey+"="+tagValue);
                    }
                }
            }
        }

        document = setDocumentDates(document, webEntity.getCreationDate());
        return document;
    }

    /**
     * Returns a WebEntity object from a WebEntity Lucene document.
     *
     * @param document
     * @return
     */
    protected static WebEntity convertLuceneDocumentToWebEntity(Document document) {
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

        String status = getWEStatusValue((String) document.get(FieldName.STATUS.name()));
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
        webEntity.setMetadataItems(convertTagFieldsToTagsMap(tagFields));

        webEntity.setCreationDate(document.get(FieldName.DATECREA.name()));
        webEntity.setLastModificationDate(document.get(FieldName.DATEMODIF.name()));

        if(logger.isDebugEnabled()) {
            logger.trace("convertLuceneDocumentToWebEntity returns webentity with id: " + id);
        }
        return webEntity;
    }


    // -- WEBENTITYNODELINKS


    /**
     * Converts a WebEntityNodeLink into a Lucene Document
     *
     * @param webEntityNodeLink WebEntityNodeLink to convert into Lucene Document
     * @return The Lucene Document
     */
    protected static Document convertWebEntityNodeLinkToLuceneDocument(WebEntityNodeLink webEntityNodeLink) {
        if(webEntityNodeLink == null) {
            logger.warn("attempt to create Lucene document for null WebEntityNodeLink");
            return null;
        }
        Document document = new Document();

        // id: generate random UUID
        if(StringUtils.isEmpty(webEntityNodeLink.getId())) {
            document = addDocumentUntokenizedField(document, FieldName.ID, UUID.randomUUID().toString());
        }
        document = addDocumentUntokenizedField(document, FieldName.TYPE, DocType.WEBENTITY_NODE_LINK.name());

        // if the WebEntityLink has no source and target, don't create a Lucene document for it
        if(StringUtils.isEmpty(webEntityNodeLink.getSourceId()) || StringUtils.isEmpty(webEntityNodeLink.getTargetLRU())) {
            logger.warn("attempt to create Lucene document for WebEntityNodeLink without source or target");
            return null;
        }
        else {
            document = addDocumentUntokenizedField(document, FieldName.SOURCE, webEntityNodeLink.getSourceId());
            document = addDocumentUntokenizedField(document, FieldName.TARGET, webEntityNodeLink.getTargetLRU());

            String weight = String.valueOf(webEntityNodeLink.getWeight());
            document = addDocumentUnindexedField(document, FieldName.WEIGHT, weight);

            return document;
        }
    }

    /**
     * Returns a WebEntityNodeLink object from a WebEntityNodeLink Lucene document.
     *
     * @param document
     * @return
     */
    public static WebEntityNodeLink convertLuceneDocumentToWebEntityNodeLink(Document document) {
        WebEntityNodeLink webEntityNodeLink = new WebEntityNodeLink();

        String id = document.get(FieldName.ID.name());
        webEntityNodeLink.setId(id);

        String source = document.get(FieldName.SOURCE.name());
        webEntityNodeLink.setSourceId(source);

        String target = document.get(FieldName.TARGET.name());
        webEntityNodeLink.setTargetLRU(target);

        String weight$ = document.get(FieldName.WEIGHT.name());
        int weight = 0;
        if(StringUtils.isNotEmpty(weight$)) {
            weight = Integer.parseInt(weight$);
        }
        webEntityNodeLink.setWeight(weight);

        if(logger.isDebugEnabled()) {
            logger.trace("convertLuceneDocumentToWebEntityNodeLink returns webEntityNodeLink with id: " + id);
        }
        return webEntityNodeLink;
    }


    // -- WEBENTITYLINKS


    /**
     * Converts a WebEntityLink into a Lucene Document
     *
     * @param webEntityLink WebEntityLink to convert into Lucene Document
     * @return The Lucene Document
     */
    protected static Document convertWebEntityLinkToLuceneDocument(WebEntityLink webEntityLink) {
        if(webEntityLink == null) {
            logger.warn("attempt to create Lucene document for null WebEntityLink");
            return null;
        }
        Document document = new Document();

        // id: generate random UUID
        if(StringUtils.isEmpty(webEntityLink.getId())) {
            document = addDocumentUntokenizedField(document, FieldName.ID, UUID.randomUUID().toString());
        }
        document = addDocumentUntokenizedField(document, FieldName.TYPE, DocType.WEBENTITY_LINK.name());

        // if the WebEntityLink has no source and target, don't create a Lucene document for it
        if(StringUtils.isEmpty(webEntityLink.getSourceId()) || StringUtils.isEmpty(webEntityLink.getTargetId())) {
            logger.warn("attempt to create Lucene document for WebEntityLink without source or target");
            return null;
        }
        else {
            document = addDocumentUntokenizedField(document, FieldName.SOURCE, webEntityLink.getSourceId());
            document = addDocumentUntokenizedField(document, FieldName.TARGET, webEntityLink.getTargetId());

            String weight = String.valueOf(webEntityLink.getWeight());
            document = addDocumentUnindexedField(document, FieldName.WEIGHT, weight);

            document = setDocumentDates(document, webEntityLink.getCreationDate());
            return document;
        }
    }

    /**
     * Returns a WebEntityLink object from a WebEntityLink Lucene document.
     *
     * @param document
     * @return
     */
    public static WebEntityLink convertLuceneDocumentToWebEntityLink(Document document) {
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
            logger.trace("convertLuceneDocumentToWebEntityLink returns webEntityLink with id: " + id);
        }
        return webEntityLink;
    }


    // -- WEBENTITYCREATIONRULES


    /**
     * Converts a WebEntityCreationRule into a Lucene document.
     *
     * @param webEntityCreationRule
     * @return
     */
    protected static Document convertWebEntityCreationRuleToLuceneDocument(WebEntityCreationRule webEntityCreationRule) throws IndexException {
        if(webEntityCreationRule == null) {
            throw new IndexException("WebEntityCreationRule is null");
        }
        if(webEntityCreationRule.getLRU() == null && webEntityCreationRule.getRegExp() == null) {
            throw new IndexException("WebEntityCreationRule has null properties");
        }

        Document document = new Document();
        document = addDocumentUntokenizedField(document, FieldName.ID, UUID.randomUUID().toString());
        document = addDocumentUntokenizedField(document, FieldName.TYPE, DocType.WEBENTITY_CREATION_RULE.name());

        String lru = Constants.DEFAULT_WEBENTITY_CREATION_RULE;
        if(StringUtils.isNotEmpty(webEntityCreationRule.getLRU())) {
            lru = webEntityCreationRule.getLRU();
        }
        document = addDocumentUntokenizedField(document, FieldName.LRU, lru);
        document = addDocumentUnindexedField(document, FieldName.REGEXP, webEntityCreationRule.getRegExp());
        document = setDocumentDates(document, webEntityCreationRule.getCreationDate());
        return document;
    }

    /**
     * Returns a WebEntityCreationRule object from a WebEntityCreationRule Lucene document.
     *
     * @param document
     * @return
     */
    protected static WebEntityCreationRule convertLuceneDocumentToWebEntityCreationRule(Document document) {
        WebEntityCreationRule webEntityCreationRule = new WebEntityCreationRule();
        String lru = document.get(FieldName.LRU.name());
        String regexp = document.get(FieldName.REGEXP.name());

        webEntityCreationRule.setLRU(lru);
        webEntityCreationRule.setRegExp(regexp);
        webEntityCreationRule.setCreationDate(document.get(FieldName.DATECREA.name()));
        webEntityCreationRule.setLastModificationDate(document.get(FieldName.DATEMODIF.name()));

        if(logger.isDebugEnabled()) {
            logger.trace("convertLuceneDocumentToWebEntity returns webEntityCreationRule with lru: " + lru + " and regexp " + regexp);
        }
        return webEntityCreationRule;
    }


    // -- PRECISIONEXCEPTIONS


    /**
     * Converts a PrecisionException into a Lucene Document
     *
     * @param lru to add to precision exceptions
     * @return The Lucene Document
     */
    protected static Document convertPrecisionExceptionToLuceneDocument(String lru) {
        if(lru == null) {
            logger.warn("attempt to create Lucene document for null PrecisionException");
            return null;
        }
        Document document = new Document();
        document = addDocumentUntokenizedField(document, FieldName.TYPE, DocType.PRECISION_EXCEPTION.name());
        document = addDocumentUntokenizedField(document, FieldName.LRU, lru);
        return document;
    }

}
