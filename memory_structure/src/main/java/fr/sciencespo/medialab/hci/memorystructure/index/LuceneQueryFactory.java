package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.WildcardQuery;

import java.util.List;
import java.util.Set;

/**
 * Lucene queries used in the LRUIndex.
 *
 * @author heikki doeleman
 */
public class LuceneQueryFactory {

    private static DynamicLogger logger = new DynamicLogger(LuceneQueryFactory.class);

    private static Term isWebEntityLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_LINK.name());
    private static Query isWebEntityLinkQuery = new TermQuery(isWebEntityLink);

    private static Term isWebEntityCreationRule = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_CREATION_RULE.name());
    private static Query isWebEntityCreationRuleQuery = new TermQuery(isWebEntityCreationRule);

    private static Term isDefaultWebEntityCreationRule = new Term(IndexConfiguration.FieldName.LRU.name(), IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE);
    private static Query isDefaultWebEntityCreationRuleQuery = new TermQuery(isDefaultWebEntityCreationRule);

    private static Term isNodeLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.NODE_LINK.name());
    private static Query isNodeLinkQuery = new TermQuery(isNodeLink);

    private static Term isWebEntity = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY.name());
    private static Query isWebEntityQuery = new TermQuery(isWebEntity);

    private static Term isPageItem = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.PAGE_ITEM.name());
    private static Query isPageItemQuery = new TermQuery(isPageItem);

    /**
     *
     * @param id
     * @return
     */
    protected static Query getWebEntityLinkByIdQuery(String id) {
        Term idTerm = new Term(IndexConfiguration.FieldName.ID.name(), id);
        BooleanQuery q = new BooleanQuery();
        Query idQuery = new TermQuery(idTerm);
        q.add(isWebEntityLinkQuery, BooleanClause.Occur.MUST);
        q.add(idQuery, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     *
     * @return
     */
    protected static Query getAllWEntityLinksQuery() {
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + isWebEntityLinkQuery.toString());
        }
        return isWebEntityLinkQuery;
    }

    /**
     *
     * @return
     * @throws IndexException hmm
     */
    protected static Query getDefaultWECRQuery() throws IndexException {
        BooleanQuery q = new BooleanQuery();
        q.add(isWebEntityCreationRuleQuery, BooleanClause.Occur.MUST);
        q.add(isDefaultWebEntityCreationRuleQuery, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     *
     * @param source
     * @param target
     * @return
     */
    protected static Query getWebEntityLinkBySourceAndTargetQuery(WebEntity source, WebEntity target) {
        BooleanQuery q = (BooleanQuery) getWebEntityLinkBySourceIdQuery(source.getId());
        Term targetTerm = new Term(IndexConfiguration.FieldName.TARGET.name(), target.getId());
        Query q3 = new TermQuery(targetTerm);
        q.add(q3, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     *
     * @param id
     * @return
     */
    protected static Query getWebEntityLinkBySourceIdQuery(String id) {
        Term sourceTerm = new Term(IndexConfiguration.FieldName.SOURCE.name(), id);
        BooleanQuery q = new BooleanQuery();
        TermQuery q1 = new TermQuery(isWebEntityLink);
        TermQuery q2 = new TermQuery(sourceTerm);
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    protected static Query getNodeLinksQuery() {
        return isNodeLinkQuery;
    }

    protected static Query getWebEntitiesQuery() {
        return isWebEntityQuery;
    }

    protected static Query getWebEntityCreationRuleQuery() {
        return isWebEntityCreationRuleQuery;
    }

    protected static Query getPageItemQuery() {
        return isPageItemQuery;
    }

    /**
     *
     * @param id
     * @return
     */
    protected static Query getWebEntityLinkByTargetIdQuery(String id) {
        Term targetTerm = new Term(IndexConfiguration.FieldName.TARGET.name(), id);
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(isWebEntityLink);
        Query q2 = new TermQuery(targetTerm);
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     *
     * @param lru
     * @return
     */
    protected static Query getWebEntityCreationRuleByPrefixQuery(String lru) {
        if(lru == null) {
            lru = IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE;
        }
        Term lruTerm = new Term(IndexConfiguration.FieldName.LRU.name(), lru);
        BooleanQuery q = new BooleanQuery();
        Query q1 = new TermQuery(isWebEntityCreationRule);
        Query q2 = new TermQuery(lruTerm);
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     *
     * @param nodeLink
     * @return
     * @throws IndexException hmm
     */
    protected static Query getNodeLinkQuery(NodeLink nodeLink) throws IndexException {
        if(nodeLink == null) {
            throw new IndexException("nodeLink is null");
        }
        Term sourceTerm = new Term(IndexConfiguration.FieldName.SOURCE.name(), nodeLink.getSourceLRU());
        Term targetTerm = new Term(IndexConfiguration.FieldName.TARGET.name(), nodeLink.getTargetLRU());
        BooleanQuery q = new BooleanQuery();
        Query q2 = new TermQuery(sourceTerm);
        Query q3 = new TermQuery(targetTerm);
        q.add(isNodeLinkQuery, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        q.add(q3, BooleanClause.Occur.MUST);
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    /**
     * Query to search for WebEntity by ID.
     *
     * @param id
     * @return
     */
    protected static Query getWebEntityByIdQuery(String id) {
        Term idTerm = new Term(IndexConfiguration.FieldName.ID.name(), id);
        BooleanQuery q = new BooleanQuery();
        Query q2 = new TermQuery(idTerm);
        q.add(isWebEntityQuery, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
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
        Set<String> prefixes = webEntity.getLRUSet();
        BooleanQuery q = new BooleanQuery();
        q.add(isWebEntityQuery, BooleanClause.Occur.MUST);
        for(String prefix : prefixes) {
            Term forbiddenPrefixTerm = new Term(IndexConfiguration.FieldName.LRU.name(), prefix);
            Query forbiddenPrefixQuery = new TermQuery(forbiddenPrefixTerm);
            q.add(forbiddenPrefixQuery, BooleanClause.Occur.MUST_NOT);

            prefix = prefix + "?*";
            Term prefixTerm = new Term(IndexConfiguration.FieldName.LRU.name(), prefix);
            Query prefixQuery = new WildcardQuery(prefixTerm);
            q.add(prefixQuery, BooleanClause.Occur.MUST);
        }
        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    protected static Query getIndexObjectsByLRUQuery(String queriedField, String prefix) {
        BooleanQuery q = new BooleanQuery();
        Term prefixTerm = new Term(queriedField, prefix);
        Query prefixQuery, isObjectQuery;
        // wildcard query
        if(prefix.endsWith("*")) {
           prefixQuery = new PrefixQuery(prefixTerm);
        }
        if(prefix.contains("*") || prefix.contains("?")) {
            prefixQuery = new WildcardQuery(prefixTerm);
        }
        // no-wildcard query (faster)
        else {
            prefixQuery = new TermQuery(prefixTerm);
        }

        if (queriedField == IndexConfiguration.FieldName.LRU.name()) {
            isObjectQuery = (Query) new TermQuery(isWebEntity);
        } else {
            isObjectQuery = (Query) new TermQuery(isNodeLink);
        }
        q.add(isObjectQuery, BooleanClause.Occur.MUST);
        q.add(prefixQuery, BooleanClause.Occur.MUST);

        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    protected static Query getWebEntitiesByLRUQuery(String prefix) {
        return getIndexObjectsByLRUQuery(IndexConfiguration.FieldName.LRU.name(), prefix);
    }

    protected static Query getNodeLinksBySourceLRUQuery(String prefix) {
        return getIndexObjectsByLRUQuery(IndexConfiguration.FieldName.SOURCE.name(), prefix);
    }

    protected static Query getNodeLinksByTargetLRUQuery(String prefix) {
        return getIndexObjectsByLRUQuery(IndexConfiguration.FieldName.TARGET.name(), prefix);
    }

    protected static Query getWebEntityLinksBySourceId(String id) {
        Term sourceTerm = new Term(IndexConfiguration.FieldName.SOURCE.name(), id);
        BooleanQuery q = new BooleanQuery();
        Query isWebEntityLinkQuery = new TermQuery(isWebEntityLink);
        Query sourceQuery = new TermQuery(sourceTerm);
        q.add(isWebEntityLinkQuery, BooleanClause.Occur.MUST);
        q.add(sourceQuery, BooleanClause.Occur.MUST);

        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    protected static Query getWebEntityLinksByTargetId(String id) {
        Term sourceTerm = new Term(IndexConfiguration.FieldName.TARGET.name(), id);
        BooleanQuery q = new BooleanQuery();
        Query isWebEntityLinkQuery = new TermQuery(isWebEntityLink);
        Query sourceQuery = new TermQuery(sourceTerm);
        q.add(isWebEntityLinkQuery, BooleanClause.Occur.MUST);
        q.add(sourceQuery, BooleanClause.Occur.MUST);

        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    protected static Query getPageItemByLRUQuery(String lru) {
        BooleanQuery q = new BooleanQuery();
        Term lruTerm = new Term(IndexConfiguration.FieldName.LRU.name(), lru);
        Query lruQuery;
        // wildcard query
        if(lru.contains("*") || lru.contains("?")) {
            lruQuery = new WildcardQuery(lruTerm);
        }
        // no-wildcard query (faster)
        else {
            lruQuery = new TermQuery(lruTerm);
        }
        q.add(isPageItemQuery, BooleanClause.Occur.MUST);
        q.add(lruQuery, BooleanClause.Occur.MUST);

        if(logger.isDebugEnabled()) {
            logger.debug("Lucene query: " + q.toString());
        }
        return q;
    }

    protected static Query getPageItemMatchingWebEntityButNotMatchingSubWebEntities(WebEntity webEntity, List<WebEntity> subWebEntities) {
        BooleanQuery q = new BooleanQuery();
        q.add(isPageItemQuery, BooleanClause.Occur.MUST);

        Set<String> webEntityPrefixes = webEntity.getLRUSet();
        for(String webEntityPrefix : webEntityPrefixes) {
            webEntityPrefix = webEntityPrefix + "*";
            Term prefixTerm = new Term(IndexConfiguration.FieldName.LRU.name(), webEntityPrefix);
            Query prefixQuery = new WildcardQuery(prefixTerm);
            q.add(prefixQuery, BooleanClause.Occur.MUST);
        }
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
}
