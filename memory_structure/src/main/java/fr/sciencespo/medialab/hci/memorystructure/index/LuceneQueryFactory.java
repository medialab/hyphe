package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.Constants;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityStatus;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.queryParser.MultiFieldQueryParser;
import org.apache.lucene.queryParser.ParseException;
import org.apache.lucene.queryParser.QueryParser;

import java.util.List;

/**
 * Lucene queries used in the LRUIndex.
 *
 * @author heikki doeleman, benjamin ooghe-tabanou
 */
public class LuceneQueryFactory {

    private static DynamicLogger logger = new DynamicLogger(LuceneQueryFactory.class);

    protected static Term typeEqualPageItem = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.PAGE_ITEM.name());
    protected static Term typeEqualNodeLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.NODE_LINK.name());
    protected static Term typeEqualWebEntity = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY.name());
    protected static Term typeEqualWebEntityNodeLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_NODE_LINK.name());
    protected static Term typeEqualWebEntityLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_LINK.name());
    protected static Term typeEqualWebEntityCreationRule = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_CREATION_RULE.name());
    protected static Term typeEqualPrecisionException = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.PRECISION_EXCEPTION.name());

    /**
     * Forge Lucene Queries to find a specific type of object having a certain value for a specific field
     *
     * @param objectTypeQueryTerm: a Lucene Term to match a specific type of object (as defined at the top of this class)
     * @param fieldName: a FieldName of the field to search through (as defined at the top of IndexConfiguration class)
     * @param fieldValue: a text string of the value to search in the field
     * @return Query
     */
    protected static Query getObjectItemsByFieldQuery(Term objectTypeQueryTerm, IndexConfiguration.FieldName fieldName, String fieldValue) {
        BooleanQuery q = new BooleanQuery();
        q.add(new TermQuery(objectTypeQueryTerm), BooleanClause.Occur.MUST);
        q.add(new TermQuery(new Term(fieldName.name(), fieldValue)), BooleanClause.Occur.MUST);
        return q;
    }

    // -- PAGEITEMS

    protected static Query getPageItemsQuery() {
        return new TermQuery(typeEqualPageItem);
    }

    protected static Query getPageItemsByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemsByFieldQuery(typeEqualPageItem, fieldName, fieldValue);
    }

    protected static Query getPageItemByLRUQuery(String LRU) {
        return getPageItemsByFieldQuery(IndexConfiguration.FieldName.LRU, LRU);
    }

    protected static Query getPageItemByLRUPrefixQuery(String LRU) {
        BooleanQuery q = new BooleanQuery();
        q.add(getPageItemsQuery(), BooleanClause.Occur.MUST);
        q.add(new PrefixQuery(new Term(IndexConfiguration.FieldName.LRU.name(), LRU)), BooleanClause.Occur.MUST);
        return q;
    }

    // -- NODELINKS

    protected static Query getNodeLinksQuery() {
        return new TermQuery(typeEqualNodeLink);
    }

    protected static Query getNodeLinksByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemsByFieldQuery(typeEqualNodeLink, fieldName, fieldValue);
    }

    protected static Query getNodeLinksBySourceLRUQuery(String sourceLRU) {
        return getNodeLinksByFieldQuery(IndexConfiguration.FieldName.SOURCE, sourceLRU);
    }

    protected static Query getNodeLinksByTargetLRUQuery(String targetLRU) {
        return getNodeLinksByFieldQuery(IndexConfiguration.FieldName.TARGET, targetLRU);
    }

    protected static Query getNodeLinksBySourceLRUPrefixQuery(String sourceLRU) {
        BooleanQuery q = new BooleanQuery();
        q.add(getNodeLinksQuery(), BooleanClause.Occur.MUST);
        q.add(new PrefixQuery(new Term(IndexConfiguration.FieldName.SOURCE.name(), sourceLRU)), BooleanClause.Occur.MUST);
        return q;
    }

    protected static Query getNodeLinksByTargetLRUPrefixQuery(String targetLRU) {
        BooleanQuery q = new BooleanQuery();
        q.add(getNodeLinksQuery(), BooleanClause.Occur.MUST);
        q.add(new PrefixQuery(new Term(IndexConfiguration.FieldName.TARGET.name(), targetLRU)), BooleanClause.Occur.MUST);
        return q;
    }

    protected static Query getNodeLinkBySourceAndTargetLRUsQuery(String sourceLRU, String targetLRU) {
        BooleanQuery q = new BooleanQuery();
        q.add(getNodeLinksBySourceLRUQuery(sourceLRU), BooleanClause.Occur.MUST);
        q.add(new TermQuery(new Term(IndexConfiguration.FieldName.TARGET.name(), targetLRU)), BooleanClause.Occur.MUST);
        return q;
    }

    // -- WEBENTITIES

    protected static Query getWebEntitiesQuery() {
        return new TermQuery(typeEqualWebEntity);
    }

    protected static Query getWebEntitiesByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemsByFieldQuery(typeEqualWebEntity, fieldName, fieldValue);
    }

    protected static Query getWebEntityByIdQuery(String ID) {
        return getWebEntitiesByFieldQuery(IndexConfiguration.FieldName.ID, ID);
    }

    // Returns all WebEntities if ids is null or empty list
    protected static Query getWebEntitiesByIdsQuery(List<String> IDs) {
        BooleanQuery q = new BooleanQuery();
        q.add(getWebEntitiesQuery(), BooleanClause.Occur.MUST);
        BooleanQuery qIds = new BooleanQuery();
        if (IDs != null) {
            for (String id : IDs) {
                qIds.add(new TermQuery(new Term(IndexConfiguration.FieldName.ID.name(), id)), BooleanClause.Occur.SHOULD);
            }
        }
        q.add(qIds, BooleanClause.Occur.MUST);
        return q;
    }

    protected static Query getWebEntityByLRUPrefixQuery(String LRUPrefix) {
        return getWebEntitiesByFieldQuery(IndexConfiguration.FieldName.LRU, LRUPrefix);
    }

    // -- WEBENTITYNODELINKS

    protected static Query getWebEntityNodeLinksQuery() {
        return new TermQuery(typeEqualWebEntityNodeLink);
    }

    protected static Query getWebEntityNodeLinksByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemsByFieldQuery(typeEqualWebEntityNodeLink, fieldName, fieldValue);
    }

    protected static Query getWebEntityNodeLinksBySourceWebEntityQuery(String sourceID) {
        return getWebEntityNodeLinksByFieldQuery(IndexConfiguration.FieldName.SOURCE, sourceID);
    }

    protected static Query getWebEntityNodeLinksByTargetLRUQuery(String targetLRU) {
        return getWebEntityNodeLinksByFieldQuery(IndexConfiguration.FieldName.TARGET, targetLRU);
    }

    // -- WEBENTITYLINKS

    protected static Query getWebEntityLinksQuery() {
        return new TermQuery(typeEqualWebEntityLink);
    }

    protected static Query getWebEntityLinksByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemsByFieldQuery(typeEqualWebEntityLink, fieldName, fieldValue);
    }

    protected static Query getWebEntityLinksBySourceWebEntityQuery(String sourceID) {
        return getWebEntityLinksByFieldQuery(IndexConfiguration.FieldName.SOURCE, sourceID);
    }

    protected static Query getWebEntityLinksByTargetWebEntityQuery(String targetID) {
        return getWebEntityLinksByFieldQuery(IndexConfiguration.FieldName.TARGET, targetID);
    }

    protected static Query getWebEntityLinkBySourceAndTargetWebEntitiesQuery(String sourceID, String targetID) {
        BooleanQuery q = new BooleanQuery();
        q.add(getWebEntityLinksBySourceWebEntityQuery(sourceID), BooleanClause.Occur.MUST);
        q.add(new TermQuery(new Term(IndexConfiguration.FieldName.TARGET.name(), targetID)), BooleanClause.Occur.MUST);
        return q;
    }

    // -- WEBENTITYCREATIONRULES

    protected static Query getWebEntityCreationRulesQuery() {
        return new TermQuery(typeEqualWebEntityCreationRule);
    }

    protected static Query getWebEntityCreationRuleByLRUQuery(String LRU) {
        if (LRU == null) {
            LRU = Constants.DEFAULT_WEBENTITY_CREATION_RULE;
        }
        BooleanQuery q = new BooleanQuery();
        q.add(getWebEntityCreationRulesQuery(), BooleanClause.Occur.MUST);
        q.add(new TermQuery(new Term(IndexConfiguration.FieldName.LRU.name(), LRU)), BooleanClause.Occur.MUST);
        return q;
    }

    protected static Query getDefaultWebEntityCreationRuleQuery() throws IndexException {
        return getWebEntityCreationRuleByLRUQuery(null);
    }

    // -- PRECISIONEXCEPTIONS

    protected static Query getPrecisionExceptionsQuery() {
        return new TermQuery(typeEqualPrecisionException);
    }

    protected static Query getPrecisionExceptionByLRUQuery(String LRU) {
        return getObjectItemsByFieldQuery(typeEqualPrecisionException, IndexConfiguration.FieldName.LRU, LRU);
    }

    // -- COMPLEX QUERIES

    /**
     * Make Query to find all WebEntities having been chosen or created by the user and not automatically from discovered pages
     * This relies on the fact that the Python core API always declares tags with the namespace CORE when defining manually webentities
     *
     * @return Query
     */
    protected static Query getLinkedWebEntitiesQuery() {
        BooleanQuery q = new BooleanQuery();
        q.add(getWebEntitiesQuery(), BooleanClause.Occur.MUST);
        BooleanQuery q1 = new BooleanQuery();
        q1.add(new TermQuery(new Term(IndexConfiguration.FieldName.TAG_NAMESPACE.name(), "CORE")), BooleanClause.Occur.SHOULD);
        q1.add(new TermQuery(new Term(IndexConfiguration.FieldName.STATUS.name(), WebEntityStatus.UNDECIDED.name().toLowerCase())), BooleanClause.Occur.SHOULD);
        q1.add(new TermQuery(new Term(IndexConfiguration.FieldName.STATUS.name(), WebEntityStatus.IN.name().toLowerCase())), BooleanClause.Occur.SHOULD);
        q1.add(new TermQuery(new Term(IndexConfiguration.FieldName.STATUS.name(), WebEntityStatus.OUT.name().toLowerCase())), BooleanClause.Occur.SHOULD);
        q.add(q1, BooleanClause.Occur.MUST);
        return q;
    }

    /**
     * Makes a query to get a WebEntity's subWebEntities
     * A WE is a subWE of a WE if one of its prefixes is the same as one of the parent with more stems
     *
     * @param webEntity WebEntity object
     * @return Query
     */
    protected static Query getWebEntitySubWebEntitiesQuery(WebEntity webEntity) {
        BooleanQuery q = new BooleanQuery();
        q.add(getWebEntitiesQuery(), BooleanClause.Occur.MUST);
        BooleanQuery q1 = new BooleanQuery();
        for(String prefix : webEntity.getLRUSet()) {
            q.add(new TermQuery(new Term(IndexConfiguration.FieldName.LRU.name(), prefix)), BooleanClause.Occur.MUST_NOT);
            q1.add(new PrefixQuery(new Term(IndexConfiguration.FieldName.LRU.name(), prefix)), BooleanClause.Occur.SHOULD);
        }
        q.add(q1, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     * Adds to a boolean query clauses so that input field is prefixes by one of the webentity's prefix but none of its subwebentities
     *
     * @param q a BooleanQuery
     * @param field an IndexConfiguration.FieldName (supposed to be LRU, SOURCE or TARGET)
     * @param webEntity WebEntity object
     * @param subWebEntities List of WebEntity objects being subWebEntities of the input WebEntity
     * @return Query
     */
    private static BooleanQuery addWebEntityButNotSubWebEntitiesToQuery(BooleanQuery q, IndexConfiguration.FieldName field, WebEntity webEntity, List<WebEntity> subWebEntities) {
        BooleanQuery prefixesMatchQuery = new BooleanQuery();
        for(String webEntityPrefix : webEntity.getLRUSet()) {
            prefixesMatchQuery.add(new PrefixQuery(new Term(field.name(), webEntityPrefix)), BooleanClause.Occur.SHOULD);
        }
        q.add(prefixesMatchQuery, BooleanClause.Occur.MUST);

        for(WebEntity sub : subWebEntities) {
            for(String subPrefix : sub.getLRUSet()) {
                q.add(new PrefixQuery(new Term(field.name(), subPrefix)), BooleanClause.Occur.MUST_NOT);
            }
        }
        return q;
    }

    /** LINKS ASSOCIATED TO A WEBENTITY
     * Make Query to find all NodeLinks or WebEntityLinks having direction (source or target) LRU
     * matching a webEntity's prefixes but none of its subWebEntities
     * Should only be used with direction = Target for WebEntityNodeLink
     *
     * @param linkType Term type as defined at the top of this class
     * @param webEntity WebEntity object
     * @param subWebEntities List of WebEntity objects being subWebEntities of the input WebEntity
     * @param direction IndexConfiguration.FieldName "SOURCE" or "TARGET"
     * @return Query
     */
    protected static Query getLRULinksByWebEntity(Term linkType, WebEntity webEntity, List<WebEntity> subWebEntities, IndexConfiguration.FieldName direction) {
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(linkType);
        q.add(q1, BooleanClause.Occur.MUST);
        q = addWebEntityButNotSubWebEntitiesToQuery(q, direction, webEntity, subWebEntities);
        if(logger.isDebugEnabled()) {
            logger.trace("Lucene query: " + q.toString());
        }
        return q;
    }

    protected static Query getNodeLinksBySourceWebEntityQuery(WebEntity webEntity, List<WebEntity> subWebEntities) {
        return getLRULinksByWebEntity(typeEqualNodeLink, webEntity, subWebEntities, IndexConfiguration.FieldName.SOURCE);
    }

    protected static Query getNodeLinksByTargetWebEntityQuery(WebEntity webEntity, List<WebEntity> subWebEntities) {
        return getLRULinksByWebEntity(typeEqualNodeLink, webEntity, subWebEntities, IndexConfiguration.FieldName.TARGET);
    }

    protected static Query getWebEntityNodeLinksByTargetWebEntityQuery(WebEntity webEntity, List<WebEntity> subWebEntities) {
        return getLRULinksByWebEntity(typeEqualWebEntityNodeLink, webEntity, subWebEntities, IndexConfiguration.FieldName.TARGET);
    }

    /**
     * Make Query to find all PageItems fitting within a webEntity's prefixes but not its subWebEntities
     *
     * @param webEntity WebEntity object
     * @param subWebEntities List of WebEntity objects being subWebEntities of the input WebEntity
     * @return Query
     */
    protected static Query getPageItemMatchingWebEntityButNotMatchingSubWebEntities(WebEntity webEntity, List<WebEntity> subWebEntities) {
        BooleanQuery q = new BooleanQuery();
        q.add(getPageItemsQuery(), BooleanClause.Occur.MUST);
        q.add(new TermQuery(new Term(IndexConfiguration.FieldName.SOURCE.name(), "CRAWL")), BooleanClause.Occur.MUST);
        q = addWebEntityButNotSubWebEntitiesToQuery(q, IndexConfiguration.FieldName.LRU, webEntity, subWebEntities);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     * Make Query to find all NodeLinks fitting within a webEntity's prefixes but not its subWebEntities
     *
     * @param webEntity WebEntity object
     * @param subWebEntities List of WebEntity objects being subWebEntities of the input WebEntity
     * @param includeExternalLinks
     * @return Query
     */
    protected static Query getNodeLinksMatchingWebEntityButNotMatchingSubWebEntities(WebEntity webEntity, List<WebEntity> subWebEntities, Boolean includeExternalLinks) {
        BooleanQuery q = new BooleanQuery();
        q.add(getNodeLinksQuery(), BooleanClause.Occur.MUST);
        Query prefixQuery;
        BooleanQuery qLinks = new BooleanQuery();
        BooleanQuery qSources = new BooleanQuery();
        BooleanQuery qTargets = new BooleanQuery();
        for(String webEntityPrefix : webEntity.getLRUSet()) {
            prefixQuery = new PrefixQuery(new Term(IndexConfiguration.FieldName.SOURCE.name(), webEntityPrefix));
            qSources.add(prefixQuery, BooleanClause.Occur.SHOULD);
            qLinks.add(prefixQuery, BooleanClause.Occur.SHOULD);
            prefixQuery = new PrefixQuery(new Term(IndexConfiguration.FieldName.TARGET.name(), webEntityPrefix));
            qTargets.add(prefixQuery, BooleanClause.Occur.SHOULD);
            qLinks.add(prefixQuery, BooleanClause.Occur.SHOULD);
        }
        if (includeExternalLinks != null && includeExternalLinks) {
            q.add(qLinks, BooleanClause.Occur.MUST);
        } else {
            q.add(qSources, BooleanClause.Occur.MUST);
            q.add(qTargets, BooleanClause.Occur.MUST);
        }
        for(WebEntity sub : subWebEntities) {
            for(String subPrefix : sub.getLRUSet()) {
                q.add(new PrefixQuery(new Term(IndexConfiguration.FieldName.SOURCE.name(), subPrefix)), BooleanClause.Occur.MUST_NOT);
                q.add(new PrefixQuery(new Term(IndexConfiguration.FieldName.TARGET.name(), subPrefix)), BooleanClause.Occur.MUST_NOT);
            }
        }
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     * Query to search WebEntities by keywords through all fields and/or by keywords through specific fields
     *
     * @param allFieldsKeywords List of keywords to look for in main text fields of webentities
     * @param fieldsKeywords List of keyword/field doublets to search keywords by field in webentities
     * @return List<WebEntity>
     */
    protected static Query searchWebEntitiesByKeywords(List<String> allFieldsKeywords, List<List<String>> fieldKeywords) {
        BooleanQuery q = new BooleanQuery();
        q.add(getWebEntitiesQuery(), BooleanClause.Occur.MUST);
        int nb_queries = 0;
        if (allFieldsKeywords != null && !allFieldsKeywords.isEmpty()) {
            String[] searchableFields = {
                    IndexConfiguration.FieldName.NAME.name(),
                    IndexConfiguration.FieldName.LRU.name(),
                    IndexConfiguration.FieldName.HOMEPAGE.name(),
                    IndexConfiguration.FieldName.STARTPAGE.name(),
                    IndexConfiguration.FieldName.TAG_VALUE.name()};
            for (String keyword : allFieldsKeywords) {
                MultiFieldQueryParser multiParser = new MultiFieldQueryParser(LRUIndex.LUCENE_VERSION, searchableFields, LRUIndex.analyzer);
                if (keyword.startsWith("*")) {
                    multiParser.setAllowLeadingWildcard(true);
                }
                try {
                    Query qAllFields = multiParser.parse(keyword);
                    q.add(qAllFields, BooleanClause.Occur.MUST);
                    nb_queries++;
                } catch (ParseException x) {
                    logger.error("ERROR " + x + " - Skipping keyword " + keyword + " for search query.");
                }
            }
        }
        if (fieldKeywords != null && ! fieldKeywords.isEmpty()) {
            for (List<String> pair : fieldKeywords) {
                if (pair.size() != 2) {
                    logger.error("Skipping query " + pair + ". Each fieldKeyword must be a two-sized string array: field, keyword.");
                    continue;
                }
                String field = IndexConfiguration.getFieldNameValue(pair.get(0));
                String val = pair.get(1);
                if (field == null) {
                    logger.error("Skipping query " + val + " for field " + pair.get(0) + "not found.");
                    continue;
                }
                QueryParser parser = new QueryParser(LRUIndex.LUCENE_VERSION, field, LRUIndex.analyzer);
                if (val.startsWith("*")) {
                    parser.setAllowLeadingWildcard(true);
                }
                try {
                    Query qField = parser.parse(val);
                    q.add(qField, BooleanClause.Occur.MUST);
                    nb_queries++;
                } catch (ParseException x) {
                    logger.error("ERROR " + x + " - Skipping keyword " + val + " for search query on field " + field + ".");
                }
            }
        }
        // Returns impossible result query if no actual search query added
        if (nb_queries == 0) {
            q.add(new TermQuery(typeEqualPageItem), BooleanClause.Occur.MUST);
        }
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

}
