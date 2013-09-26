package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.WildcardQuery;
import org.apache.lucene.queryParser.MultiFieldQueryParser;
import org.apache.lucene.queryParser.ParseException;
import org.apache.lucene.queryParser.QueryParser;

import java.util.List;
import java.util.Set;

/**
 * Lucene queries used in the LRUIndex.
 *
 * @author heikki doeleman
 */
public class LuceneQueryFactory {

    private static DynamicLogger logger = new DynamicLogger(LuceneQueryFactory.class);

    private static Term typeEqualNodeLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.NODE_LINK.name());
    private static Term typeEqualPageItem = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.PAGE_ITEM.name());
    public static Term typeEqualPrecisionException = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.PRECISION_EXCEPTION.name());
    private static Term typeEqualWebEntity = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY.name());
    private static Term typeEqualWebEntityLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_LINK.name());
    private static Term typeEqualWebEntityNodeLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_NODE_LINK.name());
    private static Term typeEqualWebEntityCreationRule = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_CREATION_RULE.name());
    private static Term lruEqualDefaultWebEntityCreationRule = new Term(IndexConfiguration.FieldName.LRU.name(), IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
    
    protected static Query getObjectItemByFieldQuery(Term objectTypeQueryTerm, IndexConfiguration.FieldName fieldName, String fieldValue) {
    	BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(objectTypeQueryTerm);
        Query q2 = getWildcardManagedQuery(fieldName.name(), fieldValue);
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    protected static Query getPageItemByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemByFieldQuery(typeEqualPageItem, fieldName, fieldValue);
    }

    protected static Query getPageItemByURLQuery(String url) {
        return getPageItemByFieldQuery(IndexConfiguration.FieldName.URL, url);
    }

    protected static Query getPageItemByLRUQuery(String lru) {
        return getPageItemByFieldQuery(IndexConfiguration.FieldName.LRU, lru);
    }

    protected static Query getNodeLinkByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemByFieldQuery(typeEqualNodeLink, fieldName, fieldValue);
    }

    protected static Query getNodeLinksBySourceLRUQuery(String source) {
        return getNodeLinkByFieldQuery(IndexConfiguration.FieldName.SOURCE, source);
    }

    protected static Query getNodeLinksByTargetLRUQuery(String target) {
        return getNodeLinkByFieldQuery(IndexConfiguration.FieldName.TARGET, target);
    }

    protected static Query getWebEntityByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemByFieldQuery(typeEqualWebEntity, fieldName, fieldValue);
    }

    protected static Query getWebEntityByIdQuery(String id) {
        return getWebEntityByFieldQuery(IndexConfiguration.FieldName.ID, id);
    }

    protected static Query getLinkedWebEntitiesQuery() {
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(typeEqualWebEntity);
        BooleanQuery q2 = new BooleanQuery();
        q2.add(new TermQuery(new Term(IndexConfiguration.FieldName.TAG_NAMESPACE.name(), "CORE")), BooleanClause.Occur.SHOULD);
        q2.add(new TermQuery(new Term(IndexConfiguration.FieldName.STATUS.name(), IndexConfiguration.WEStatus.UNDECIDED.name().toLowerCase())), BooleanClause.Occur.SHOULD);
        q2.add(new TermQuery(new Term(IndexConfiguration.FieldName.STATUS.name(), IndexConfiguration.WEStatus.IN.name().toLowerCase())), BooleanClause.Occur.SHOULD);
        q2.add(new TermQuery(new Term(IndexConfiguration.FieldName.STATUS.name(), IndexConfiguration.WEStatus.OUT.name().toLowerCase())), BooleanClause.Occur.SHOULD);
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        return q;
    }

    protected static Query getWebEntitiesByLRUQuery(String lru) {
        return getWebEntityByFieldQuery(IndexConfiguration.FieldName.LRU, lru);
    }

    protected static Query getWebEntityNodeLinkByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemByFieldQuery(typeEqualWebEntityNodeLink, fieldName, fieldValue);
    }

    protected static Query getWebEntityNodeLinksByTargetLRUQuery(String source) {
        return getWebEntityNodeLinkByFieldQuery(IndexConfiguration.FieldName.TARGET, source);
    }

    protected static Query getWebEntityLinkByFieldQuery(IndexConfiguration.FieldName fieldName, String fieldValue) {
        return getObjectItemByFieldQuery(typeEqualWebEntityLink, fieldName, fieldValue);
    }

    protected static Query getWebEntityLinkByIdQuery(String id) {
        return getWebEntityLinkByFieldQuery(IndexConfiguration.FieldName.ID, id);
    }

    protected static Query getWebEntityLinksByTargetQuery(String lru) {
        return getWebEntityLinkByFieldQuery(IndexConfiguration.FieldName.TARGET, lru);
    }

    protected static Query getWebEntityLinksBySourceQuery(String lru) {
        return getWebEntityLinkByFieldQuery(IndexConfiguration.FieldName.SOURCE, lru);
    }

    protected static Query getPrecisionExceptionByLRUQuery(String lru) {
        return getObjectItemByFieldQuery(typeEqualPrecisionException, IndexConfiguration.FieldName.LRU, lru);
    }

    //
    // PageItem
    //
    protected static Query getPageItemsQuery() {
        return new TermQuery(typeEqualPageItem);
    }

    protected static Query getPageItemMatchingWebEntityButNotMatchingSubWebEntities(WebEntity webEntity, List<WebEntity> subWebEntities) {
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(typeEqualPageItem);
        q.add(q1, BooleanClause.Occur.MUST);
        
        BooleanQuery prefixesMatchQuery = new BooleanQuery();
        for(String webEntityPrefix : webEntity.getLRUSet()) {
            webEntityPrefix = webEntityPrefix + "*";
            Term prefixTerm = new Term(IndexConfiguration.FieldName.LRU.name(), webEntityPrefix);
            Query prefixQuery = new WildcardQuery(prefixTerm);
            prefixesMatchQuery.add(prefixQuery, BooleanClause.Occur.SHOULD);
        }
        q.add(prefixesMatchQuery, BooleanClause.Occur.MUST);

        for(WebEntity sub : subWebEntities) {
            for(String subPrefix : sub.getLRUSet()) {
                subPrefix = subPrefix + "*";
                Term prefixTerm = new Term(IndexConfiguration.FieldName.LRU.name(), subPrefix);
                Query prefixQuery = new WildcardQuery(prefixTerm);
                q.add(prefixQuery, BooleanClause.Occur.MUST_NOT);
            }
        }
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    //
    // NodeLink
    //
    protected static Query getNodeLinksQuery() {
        return new TermQuery(typeEqualNodeLink);
    }
    
    /**
    *
    * @param nodeLink
    * @return
    * @throws IndexException hmm
    */
	protected static Query getNodeLinkBySourceAndTargetQuery(String source, String target) throws IndexException {
		BooleanQuery q = new BooleanQuery();
		TermQuery q1 = new TermQuery(typeEqualNodeLink);
		TermQuery q2 = new TermQuery(new Term(IndexConfiguration.FieldName.SOURCE.name(), source));
		TermQuery q3 = new TermQuery(new Term(IndexConfiguration.FieldName.TARGET.name(), target));
		q.add(q1, BooleanClause.Occur.MUST);
		q.add(q2, BooleanClause.Occur.MUST);
		q.add(q3, BooleanClause.Occur.MUST);
		if (logger.isDebugEnabled()) {
			logger.debug("Lucene query: " + q.toString());
		}
		return q;
	}

    protected static Query getNodeLinksMatchingWebEntityButNotMatchingSubWebEntities(WebEntity webEntity, List<WebEntity> subWebEntities, Boolean includeExternalLinks) {
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(typeEqualNodeLink);
        q.add(q1, BooleanClause.Occur.MUST);

        BooleanQuery qLinks = new BooleanQuery();
        BooleanQuery qSources = new BooleanQuery();
        BooleanQuery qTargets = new BooleanQuery();
        for(String webEntityPrefix : webEntity.getLRUSet()) {
            webEntityPrefix = webEntityPrefix + "*";
            Term prefix = new Term(IndexConfiguration.FieldName.SOURCE.name(), webEntityPrefix);
            Query prefixQuery = new WildcardQuery(prefix);
            qSources.add(prefixQuery, BooleanClause.Occur.SHOULD);
            qLinks.add(prefixQuery, BooleanClause.Occur.SHOULD);
            prefix = new Term(IndexConfiguration.FieldName.TARGET.name(), webEntityPrefix);
            prefixQuery = new WildcardQuery(prefix);
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
                subPrefix = subPrefix + "*";
                Term prefixTerm = new Term(IndexConfiguration.FieldName.SOURCE.name(), subPrefix);
                Query prefixQuery = new WildcardQuery(prefixTerm);
                q.add(prefixQuery, BooleanClause.Occur.MUST_NOT);
                prefixTerm = new Term(IndexConfiguration.FieldName.TARGET.name(), subPrefix);
                prefixQuery = new WildcardQuery(prefixTerm);
                q.add(prefixQuery, BooleanClause.Occur.MUST_NOT);
            }
        }
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    protected static Query getNodeLinksBySourceWebEntity(WebEntity webEntity, List<WebEntity> subWebEntities) {
        return getLinksBySideWebEntity(typeEqualNodeLink, webEntity, subWebEntities, IndexConfiguration.FieldName.SOURCE.name());
    }

    protected static Query getNodeLinksByTargetWebEntity(WebEntity webEntity, List<WebEntity> subWebEntities) {
        return getLinksBySideWebEntity(typeEqualNodeLink, webEntity, subWebEntities, IndexConfiguration.FieldName.TARGET.name());
    }

    protected static Query getWebEntityNodeLinksBySourceWebEntity(WebEntity webEntity, List<WebEntity> subWebEntities) {
        return getLinksBySideWebEntity(typeEqualWebEntityNodeLink, webEntity, subWebEntities, IndexConfiguration.FieldName.SOURCE.name());
    }

    protected static Query getWebEntityNodeLinksByTargetWebEntity(WebEntity webEntity, List<WebEntity> subWebEntities) {
        return getLinksBySideWebEntity(typeEqualWebEntityNodeLink, webEntity, subWebEntities, IndexConfiguration.FieldName.TARGET.name());
    }

    protected static Query getLinksBySideWebEntity(Term typeLink, WebEntity webEntity, List<WebEntity> subWebEntities, String direction) {
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(typeLink);
        q.add(q1, BooleanClause.Occur.MUST);

        BooleanQuery qSources = new BooleanQuery();
        for(String webEntityPrefix : webEntity.getLRUSet()) {
            webEntityPrefix = webEntityPrefix + "*";
            Term prefix = new Term(direction, webEntityPrefix);
            Query prefixQuery = new WildcardQuery(prefix);
            qSources.add(prefixQuery, BooleanClause.Occur.SHOULD);
        }
        q.add(qSources, BooleanClause.Occur.MUST);
        for(WebEntity sub : subWebEntities) {
            for(String subPrefix : sub.getLRUSet()) {
                subPrefix = subPrefix + "*";
                Term prefixTerm = new Term(direction, subPrefix);
                Query prefixQuery = new WildcardQuery(prefixTerm);
                q.add(prefixQuery, BooleanClause.Occur.MUST_NOT);
            }
        }
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    //
    // PrecisionException
    //
    protected static Query getPrecisionExceptionsQuery() {
        return new TermQuery(typeEqualPrecisionException);
    }

    //
    // WebEntity
    //
    protected static Query getWebEntitiesQuery() {
        return new TermQuery(typeEqualWebEntity);
    }

    /**
     * Query to search for WebEntity by ID.
     *
     * @param id
     * @return
     */
    protected static Query getWebEntitiesByIdsQuery(List<String> ids) {
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(typeEqualWebEntity);
        q.add(q1, BooleanClause.Occur.MUST);
        Query qId;
        BooleanQuery qIds = new BooleanQuery();
        if (ids != null) {
            for (String id : ids) {
                qId = new TermQuery(new Term(IndexConfiguration.FieldName.ID.name(), id));
                qIds.add(qId, BooleanClause.Occur.SHOULD);
            }
        }
        q.add(qIds, BooleanClause.Occur.MUST);
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
        int nb_queries = 0;
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(typeEqualWebEntity);
        q.add(q1, BooleanClause.Occur.MUST);
        if (allFieldsKeywords != null && ! allFieldsKeywords.isEmpty()) {
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
                    if(logger.isDebugEnabled()) {
                        logger.debug("ERROR " + x + " - Skipping keyword " + keyword + " for search query.");
                    }
                }
            }
        }
        if (fieldKeywords != null && ! fieldKeywords.isEmpty()) {
            for (List<String> pair : fieldKeywords) {
                if (pair.size() != 2) {
                    if(logger.isDebugEnabled()) {
                        logger.debug("Skipping query " + pair + ". Each fieldKeyword must be a two-sized string array: field, keyword.");
                    }
                    continue;
                }
                String field = IndexConfiguration.getFieldNameValue(pair.get(0));
                String val = pair.get(1);
                if (field == null) {
                    if(logger.isDebugEnabled()) {
                        logger.debug("Skipping query " + val + " for field " + pair.get(0) + "not found.");
                    }
                } else {
                    QueryParser parser = new QueryParser(LRUIndex.LUCENE_VERSION, field, LRUIndex.analyzer);
                    if (val.startsWith("*")) {
                        parser.setAllowLeadingWildcard(true);
                    }
                    try {
                        Query qField = parser.parse(val);
                        q.add(qField, BooleanClause.Occur.MUST);
                        nb_queries++;
                    } catch (ParseException x) {
                        if(logger.isDebugEnabled()) {
                            logger.debug("ERROR " + x + " - Skipping keyword " + val + " for search query on field " + field + ".");
                        }
                    }
                }
            }
        }
        if (nb_queries == 0) {
            q.add(new TermQuery(typeEqualPageItem), BooleanClause.Occur.MUST);
        }
        if(logger.isDebugEnabled()) {
            logger.info("Lucene query: " + q.toString());
        }
        return q;
    }

    //
    // WebEntityCreationRule
    //
    protected static Query getWebEntityCreationRulesQuery() {
        return new TermQuery(typeEqualWebEntityCreationRule);
    }

    /**
     *
     * @param lru
     * @return
     */
    protected static Query getWebEntityCreationRuleByLRUQuery(String lru) {
        if(lru == null) {
            lru = IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE;
        }
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(typeEqualWebEntityCreationRule);
        Query q2 = new TermQuery(new Term(IndexConfiguration.FieldName.LRU.name(), lru));
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }
    
    /**
    *
    * @return
    * @throws IndexException hmm
    */
   protected static Query getDefaultWebEntityCreationRuleQuery() throws IndexException {
       BooleanQuery q = new BooleanQuery();
       Query q1 = new TermQuery(typeEqualWebEntityCreationRule);
       Query q2 = new TermQuery(lruEqualDefaultWebEntityCreationRule);
       q.add(q1, BooleanClause.Occur.MUST);
       q.add(q2, BooleanClause.Occur.MUST);
       if(logger.isDebugEnabled()) {
           logger.debug("Lucene query: " + q.toString());
       }
       return q;
   }
    
    //
    // WebEntityNodeLinks
    //
    /**
     *
     * @return
     */
    protected static Query getWebEntityNodeLinksQuery() {
        return new TermQuery(typeEqualWebEntityNodeLink);
    }

    //
    // WebEntityLinks
    //
    /**
     *
     * @return
     */
    protected static Query getWebEntityLinksQuery() {
        return new TermQuery(typeEqualWebEntityLink);
    }
    
    /**
     *
     * @param source
     * @param target
     * @return
     */
    protected static Query getWebEntityLinkBySourceAndTargetQuery(String source, String target) {
    	BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(typeEqualWebEntityLink);
        Query q2 = new TermQuery(new Term(IndexConfiguration.FieldName.SOURCE.name(), source));
        Query q3 = new TermQuery(new Term(IndexConfiguration.FieldName.TARGET.name(), target));
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        q.add(q3, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }
    
    /**
     *
     * @param webEntity
     * @return
     */
    protected static Query getSubWebEntitiesQuery(WebEntity webEntity) {
        if(logger.isDebugEnabled()) {
            logger.debug("getSubWebEntitiesQuery for webEntity " + webEntity.getName() );
        }
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(typeEqualWebEntity);
        q.add(q1, BooleanClause.Occur.MUST);
        BooleanQuery q2 = new BooleanQuery();
        
        Set<String> prefixes = webEntity.getLRUSet();
        for(String prefix : prefixes) {
            Query qNotPrefix = new TermQuery(new Term(IndexConfiguration.FieldName.LRU.name(), prefix));
            q.add(qNotPrefix, BooleanClause.Occur.MUST_NOT);

            prefix = prefix + "?*";
            Query qPrefixWildcard = new WildcardQuery(new Term(IndexConfiguration.FieldName.LRU.name(), prefix));
            q2.add(qPrefixWildcard, BooleanClause.Occur.SHOULD);
        }
        q.add(q2, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     * Query to search WebEntities by keywords through all fields and/or by keywords through specific fields
     *
     * @param allFieldsKeywords
     * @return List<WebEntity>
     * @throws ParseException
     */
    protected static Query getWildcardManagedQuery(String field, String value) {
    	Term prefixTerm = new Term(field, value);
    	// prefix query
        if(value != null && value.endsWith("*")) {
            return new PrefixQuery(new Term(field, value.substring(0, value.length() - 1)));
        }
        // wildcard query
        if (value != null && (value.contains("*") || value.contains("?"))) {
        	return new WildcardQuery(prefixTerm);
        }
        // no-wildcard query (faster)
        else {
        	return new TermQuery(prefixTerm);
        }
    }
}
