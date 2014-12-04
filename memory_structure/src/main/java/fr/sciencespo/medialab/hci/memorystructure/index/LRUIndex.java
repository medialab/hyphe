package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.Constants;
import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.ObjectNotFoundException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityNodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityLink;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import fr.sciencespo.medialab.hci.memorystructure.util.LRUUtil;
import fr.sciencespo.medialab.hci.memorystructure.index.LowercasedKeywordAnalyzer;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.KeywordAnalyzer;
import org.apache.lucene.analysis.PerFieldAnalyzerWrapper;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.CorruptIndexException;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.index.TermDocs;
import org.apache.lucene.index.TermEnum;
import org.apache.lucene.index.TieredMergePolicy;
import org.apache.lucene.search.Collector;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.Sort;
import org.apache.lucene.search.SortField;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.Scorer;
import org.apache.lucene.search.TopScoreDocCollector;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.util.Version;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import gnu.trove.map.hash.THashMap;
import gnu.trove.set.hash.THashSet;

/**
 *
 * @author heikki doeleman, benjamin ooghe-tabanou
 */
public class LRUIndex {

    private static DynamicLogger logger = new DynamicLogger(LRUIndex.class);

    // Lucene settings

    protected static final Version LUCENE_VERSION = Version.LUCENE_35;

    // OPEN MODE:
    // - CREATE - creates a new index or overwrites an existing one.
    // - CREATE_OR_APPEND - creates a new index if one does not exist, otherwise it opens the index and documents will be appended.
    // - APPEND - opens an existing index.
    protected static IndexWriterConfig.OpenMode OPEN_MODE;

    // TODO Adapt RAM per corpus
    protected static final int RAM_BUFFER_SIZE_MB = 512;

    // Lucene Analyzer to allow whole keywords lowercased search against all fields except case-sensitives ones (urls/lrus)
    protected static final Analyzer analyzer = new PerFieldAnalyzerWrapper(
        new LowercasedKeywordAnalyzer(),
        new HashMap<String, Analyzer>() {{
            put(IndexConfiguration.FieldName.LRU.name(), new KeywordAnalyzer());
            put(IndexConfiguration.FieldName.URL.name(), new KeywordAnalyzer());
            put(IndexConfiguration.FieldName.HOMEPAGE.name(), new KeywordAnalyzer());
            put(IndexConfiguration.FieldName.STARTPAGE.name(), new KeywordAnalyzer());
            put(IndexConfiguration.FieldName.SOURCE.name(), new KeywordAnalyzer());
            put(IndexConfiguration.FieldName.TARGET.name(), new KeywordAnalyzer());
        }});
    private IndexReader indexReader;
    private IndexWriter indexWriter;
    private IndexSearcher indexSearcher;

    // Executor service used for asynchronous batch index tasks.
    private static ScheduledExecutorService executorService = Executors.newScheduledThreadPool(Runtime.getRuntime().availableProcessors());

    // Ensure unicity (singleton-ness)
    private static LRUIndex instance;
    public synchronized static LRUIndex getInstance(String path, IndexWriterConfig.OpenMode openMode) {
        if(instance == null) {
            instance = new LRUIndex(path, openMode);
        }
        return instance;
    }
    public synchronized static LRUIndex getInstance() throws IndexException {
        if(instance == null) {
            throw new IndexException("LRUIndex not initialized");
        }
        return instance;
    }
    @Override
    public Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException();
    }
    // end singleton-ness

    /**
     * Clears the index and re-opens indexreader and indexsearcher.
     *
     * @throws IndexException hmm
     */
    public synchronized void clearIndex() throws IndexException {
        try {
            logger.info("Clearing index");
            this.indexWriter.deleteAll();
            this.indexWriter.commit();
            this.indexReader = IndexReader.open(this.indexWriter, false);
            this.indexSearcher = new IndexSearcher(this.indexReader);
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

    /**
     * Private constructor
     *
     * @param path path to the index
     * @param openMode how to open
     */
    private LRUIndex(String path, IndexWriterConfig.OpenMode openMode) {
        logger.info("creating LRUIndex, openMode is " + openMode.name() + ", path to Lucene index is " + path);
        try {
            OPEN_MODE = openMode;
            File indexDirectory = new File(path);
            if(! indexDirectory.exists()){
                indexDirectory.mkdirs();
            } else if(! indexDirectory.isDirectory()) {
                throw new ExceptionInInitializerError("can't create Lucene index in requested location " + path);
            }
            logger.info("opening Lucene FileSytemDirectory: " + indexDirectory.getAbsolutePath());
            FSDirectory diskDirectory = FSDirectory.open(indexDirectory);
            logger.trace("creating IndexWriter");
            this.indexWriter = createIndexWriter(diskDirectory);
            logger.trace("creating IndexReader");
            this.indexReader = IndexReader.open(this.indexWriter, false);
            logger.trace("creating IndexSearcher");
            this.indexSearcher = new IndexSearcher(this.indexReader);
            logger.info("successfully created LRUIndex");
        } catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new ExceptionInInitializerError("can't create Lucene index, error: " + x.getMessage());
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new ExceptionInInitializerError("can't create Lucene index, error: " + x.getMessage());
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new ExceptionInInitializerError("can't create Lucene index, error: " + x.getMessage());
        }
    }

    /**
     * Creates new directory.
     *
     * @param diskDirectory the directory on disk where the Lucene index is located
     * @return indexWriter
     * @throws IndexException hmm
     */
    private IndexWriter createIndexWriter(FSDirectory diskDirectory) throws IndexException {
        IndexWriterConfig indexWriterConfig = new IndexWriterConfig(LUCENE_VERSION, analyzer);
        indexWriterConfig.setOpenMode(OPEN_MODE);
        indexWriterConfig.setRAMBufferSizeMB(RAM_BUFFER_SIZE_MB);

        // TODO: Test best settings to avoid "Too Many Open Files" errors
        //
        //LogMergePolicy logMergePolicy = new LogByteSizeMergePolicy();
        //logMergePolicy.setUseCompoundFile(false);
        //indexWriterConfig.setMergePolicy(logMergePolicy);
        TieredMergePolicy tieredMergePolicy = new TieredMergePolicy();
        tieredMergePolicy.setUseCompoundFile(true);
        indexWriterConfig.setMergePolicy(tieredMergePolicy);

        try {
            return new IndexWriter(diskDirectory, indexWriterConfig);
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

    /**
     * Closes indexreader and indexwriter.
     *
     * @throws IOException hmm
     */
    public void close() throws IOException {
        logger.info("close: closing IndexReader and IndexWriter");
        if(indexReader != null) {
            indexReader.close();
        }
        if(indexWriter != null) {
            indexWriter.close();
        }
        executorService.shutdown();
        try {
            // pool didn't terminate after the first try
            if(!executorService.awaitTermination(30, TimeUnit.SECONDS)) {
                logger.warn("not all threads terminated after 30s, trying to force shutdown");
                executorService.shutdownNow();
            }
            // pool didn't terminate after the second try
            if(!executorService.awaitTermination(30, TimeUnit.SECONDS)) {
                logger.warn("not all threads terminated after 60s. Not waiting any longer.");
            }
        } catch (InterruptedException x) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    private void reloadIndexIfChange() throws IOException {
        // if not changed, openIfChanged returns null
         IndexReader maybeChanged = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
         if(maybeChanged != null) {
             this.indexReader = maybeChanged;
             this.indexSearcher = new IndexSearcher(this.indexReader);
         }
    }

    /**
     * Returns whether all scheduledFutures are done.
     *
     * @param scheduledFutures the scheduledfutures to check
     * @return whether they're all done
     */
    private boolean allDone(Collection<ScheduledFuture> scheduledFutures ) {
        for(ScheduledFuture scheduledFuture : scheduledFutures) {
            if(!scheduledFuture.isDone()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Indexes a batch of objects. To increase performance, the input batch is divided over a number of asynchronous
     * index-writing tasks that use a RAMDirectory each. When all are done, each of the RAM indexes is merged to the
     * persistent FSDirectory index.
     *
     * @param objects
     * @return number of indexed objects
     * @throws IndexException hmm
     */
    public int batchIndex(List<Object> objects) throws IndexException {
        try {
            if(CollectionUtils.isEmpty(objects)) {
                logger.warn("batchIndex received batch of 0 objects");
                return 0;
            }
            int batchSize = objects.size();
            if(logger.isDebugEnabled()) {
                logger.debug("batchIndex processing # " + batchSize + " objects");
            }
            long startRAMIndexing = System.currentTimeMillis();
            THashSet<RAMDirectory> ramDirectories = new THashSet<RAMDirectory>();
            THashSet<ScheduledFuture> indexTasks = new THashSet<ScheduledFuture>();
            long delay = 0;
            int processedSoFar = 0;
            while(processedSoFar < batchSize) {
                List<Object> batch;
                int INDEXWRITER_MAX = 25000;
                if(batchSize >= processedSoFar + INDEXWRITER_MAX) {
                    batch = objects.subList(processedSoFar, processedSoFar + INDEXWRITER_MAX);
                } else {
                    batch = objects.subList(processedSoFar, objects.size());
                }
                RAMDirectory ramDirectory = new RAMDirectory();
                ramDirectories.add(ramDirectory);
                if(logger.isDebugEnabled()) {
                    logger.debug("about to create index task with RAMBUFFERSIZE " + RAM_BUFFER_SIZE_MB);
                    if (indexTasks.size() > 0) {
                        logger.debug("before creating task there are already # " + indexTasks.size() + " index tasks");
                    }
                }
                ScheduledFuture indexTask = executorService.schedule(
                        new AsyncIndexWriterTask(UUID.randomUUID().toString(), batch, ramDirectory, LRUIndex.getInstance()),
                        delay, TimeUnit.SECONDS);
                indexTasks.add(indexTask);
                if(logger.isDebugEnabled()) {
                    logger.debug("there are now # " + indexTasks.size() + " index tasks");
                }
                processedSoFar += INDEXWRITER_MAX;
            }

            while(! allDone(indexTasks)) {
                try {   // wait a bit
                    Thread.sleep(100);
                } catch (InterruptedException x) {
                    x.printStackTrace();
                }
            }

            if(logger.isDebugEnabled()) {
                final float duration = (System.currentTimeMillis() - startRAMIndexing);
                final float throughput = ((float) batchSize / duration) * 1000;
                logger.debug("Indexed # " + batchSize + " objects in " + duration + " ms, that's " + throughput + " docs/second");
            }

            final long start2 = System.currentTimeMillis();
            RAMDirectory[] ramsj = ramDirectories.toArray(new RAMDirectory[ramDirectories.size()]);
            if(logger.isDebugEnabled()) {
                logger.debug("# docs in filesystem index before adding the newly indexed objects: " + this.indexWriter.numDocs());
            }
            this.indexWriter.addIndexes(ramsj);
            if(logger.isDebugEnabled()) {
                logger.debug("# docs in filesystem index after adding the newly indexed objects: " + this.indexWriter.numDocs());
            }

            // Commits the changes
            this.indexWriter.commit();
            reloadIndexIfChange();

            if(logger.isDebugEnabled()) {
                final float duration2 = (System.currentTimeMillis() - start2);
                logger.debug("Syncing RAM indexes to filesystem index took " + duration2 + " ms");
            }
            return batchSize;
        } catch (CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Returns total number of documents in the index.
     *
     * @return total number of docs in index
     * @throws IndexException hmm
     */
    public int indexCount() throws IndexException {
        try {
            return indexWriter.numDocs();
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Removes a bunch of objects in the index matching a specific Lucene Query
     *
     * @param q : the query to match
     * @param commit : a boolean declaring whether the changes should be committed right away or not
     * @throws IndexException hmm
     */
    public void deleteObjectsFromQuery(Query q, boolean commit) throws IndexException {
        try {
            this.indexWriter.deleteDocuments(q);
            if (commit) {
                this.indexWriter.commit();
            }
            reloadIndexIfChange();
        } catch (CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Returns a bunch of Lucene Documents matching a specific Lucene Query
     *
     * @param q : the Query to match
     * @return a List of Document objects
     * @throws IOException
     */
    private List<Document> executeMultipleResultsQuery(Query q) throws IOException {
        final List<Document> hits = new ArrayList<Document>();
        indexSearcher.search(q, new Collector() {
            private IndexReader reader;
            @Override
            public void setScorer(Scorer scorer) throws IOException {}
            @Override
            public void collect(int doc) throws IOException {
                hits.add(reader.document(doc));
            }
            @Override
            public void setNextReader(IndexReader reader, int docBase) throws IOException {
                this.reader = reader;
            }
            @Override
            public boolean acceptsDocsOutOfOrder() {
                return true;
            }
        });
        if(logger.isDebugEnabled()) {
            logger.debug("# hits: " + hits.size());
        }
        return hits;
    }

    /**
     * Returns a list of unique different values for a specific field in the index (facets)
     *
     * @param fieldName : the name of the field from IndexConfiguration.FieldName
     * @return a List of Document objects
     * @throws IOException
     */
    public List<String> getFieldValues(IndexConfiguration.FieldName fieldName) throws IOException {
        String name = fieldName.name();
        List<String> values = new ArrayList<String>();
        TermEnum te = indexReader.terms(new Term(name));
        if (te != null && te.term() != null && te.term().field() == name) {
            values.add(te.term().text());
            while (te.next()) {
                if (te.term().field() != name) {
                    break;
                }
                values.add(te.term().text());
            }
        }
        return values;
    }


    // PAGEITEMS

    /**
     * Removes all PageItems in the index
     *
     * @param nodeLink
     * @throws IndexException hmm
     */
    public void deletePageItems(PageItem pageItem) throws IndexException {
        logger.info("delete all existing PageItems");
        // Commit the IndexWriter
        deleteObjectsFromQuery(LuceneQueryFactory.getPageItemsQuery(), true);
    }

    /**
     * Removes a specific PageItem
     *
     * @param nodeLink
     * @throws IndexException hmm
     */
    public void deletePageItem(PageItem pageItem) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleting pageitem with LRU " + pageItem.getLru());
        }
        // This is ran during the AsyncIndexWriterTask which already commits the IndexWriter at the end
        deleteObjectsFromQuery(LuceneQueryFactory.getPageItemByLRUQuery(pageItem.getLru()), false);
    }

    /**
     * Retrieves a specific PageItem matching a specific Lucene Query
     *
     * @param query
     * @return a PageItem object
     * @throws IndexException hmm
     */
    public PageItem retrievePageItemByQuery(Query query) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrievePageItemByFieldQuery: " + query);
        }
        try {
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            indexSearcher.search(query, collector);
            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                return IndexConfiguration.convertLuceneDocumentToPageItem(indexSearcher.doc(hits[0].doc));
            }
            if (logger.isDebugEnabled()) {
                logger.debug("failed to retrieve PageItem for query " + query);
            }
            return null;
        } catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves a specific PageItem object having the input LRU
     *
     * @param LRU
     * @return a PageItem object
     * @throws IndexException hmm
     */
    public PageItem retrievePageItemByLRU(String LRU) throws IndexException {
        return retrievePageItemByQuery(LuceneQueryFactory.getPageItemByLRUQuery(LRU));
    }

    /**
     * Retrieves all PageItems matching a specific Lucene Query
     *
     * @param query
     * @return a List of PageItem objects
     * @throws IndexException hmm
     */
    public List<PageItem> retrievePageItemsByQuery(Query query) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrievePageItemsByQuery: " + query);
        }
        try {
            final List<Document> hits = executeMultipleResultsQuery(query);
            List<PageItem> results = new ArrayList<PageItem>(hits.size());
            for(Document hit: hits) {
                results.add(IndexConfiguration.convertLuceneDocumentToPageItem(hit));
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " PageItems for Query " + query);
            }
            return results;
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves all PageItems.
     *
     * @return a list of all the NodeLink objects in the index
     * @throws IndexException hmm
     */
    public List<PageItem> retrievePageItems() throws IndexException {
        if (logger.isDebugEnabled()) {
            logger.debug("retrievePageItems");
        }
        return retrievePageItemsByQuery(LuceneQueryFactory.getPageItemsQuery());
    }

    /**
     * Retrieves all the PageItems whose LRU start with the input LRU prefix
     *
     * @param prefix (an LRU formatted url)
     * @return a List of PageItem objects
     * @throws IndexException hmm
     */
    public List<PageItem> retrievePageItemsByLRUPrefix(String prefix) throws IndexException {
        if(prefix == null) {
            logger.warn("attempted to retrieve pageitems with null lruprefix");
            return new ArrayList<PageItem>();
        }
        return retrievePageItemsByQuery(LuceneQueryFactory.getPageItemByLRUPrefixQuery(prefix));
    }


    // NODELINKS

    /**
     * Removes all NodeLinks in index
     *
     * @throws IndexException hmm
     */
    public void deleteNodeLinks() throws IndexException {
        logger.info("delete all existing NodeLinks");
        // Commit the IndexWriter
        deleteObjectsFromQuery(LuceneQueryFactory.getNodeLinksQuery(), true);
    }

    /**
     * Removes a specific NodeLink
     *
     * @param nodeLink
     * @throws IndexException hmm
     */
    public void deleteNodeLink(NodeLink nodeLink) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleting NodeLink with source " + nodeLink.getSourceLRU() + " and target " + nodeLink.getTargetLRU());
        }
        // This is ran during the AsyncIndexWriterTask which already commits the IndexWriter at the end
        deleteObjectsFromQuery(LuceneQueryFactory.getNodeLinkBySourceAndTargetLRUsQuery(nodeLink.getSourceLRU(), nodeLink.getTargetLRU()), false);
    }

    /**
     * Retrieves a specific NodeLink from the index.
     *
     * @param nodeLink
     * @return a NodeLink object
     * @throws IndexException hmm
     */
    public NodeLink retrieveNodeLink(NodeLink nodeLink) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveNodeLink with source " + nodeLink.getSourceLRU() + " and target " + nodeLink.getTargetLRU());
        }
        try {
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            indexSearcher.search(LuceneQueryFactory.getNodeLinkBySourceAndTargetLRUsQuery(nodeLink.getSourceLRU(), nodeLink.getTargetLRU()), collector);
            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                return IndexConfiguration.convertLuceneDocumentToNodeLink(indexSearcher.doc(hits[0].doc));
            }
            if (logger.isDebugEnabled()) {
                logger.debug("failed to retrieve NodeLink with source " + nodeLink.getSourceLRU() + " and target " + nodeLink.getTargetLRU());
            }
            return null;
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves all NodeLinks matching a specific Lucene Query
     *
     * @param query
     * @return a List of NodeLink objects
     * @throws IndexException hmm
     */
    public List<NodeLink> retrieveNodeLinksByQuery(Query query) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveNodeLinksByQuery: " + query);
        }
        try {
            final List<Document> hits = executeMultipleResultsQuery(query);
            List<NodeLink> results = new ArrayList<NodeLink>(hits.size());
            for(Document hit: hits) {
                NodeLink nodeLink = IndexConfiguration.convertLuceneDocumentToNodeLink(hit);
                results.add(nodeLink);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " NodeLinks for Query " + query);
            }
            return results;
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves all NodeLinks.
     *
     * @return a list of all the NodeLink objects in the index
     * @throws IndexException hmm
     */
    public List<NodeLink> retrieveNodeLinks() throws IndexException {
        if (logger.isDebugEnabled()) {
            logger.debug("retrieveNodeLinks");
        }
        return retrieveNodeLinksByQuery(LuceneQueryFactory.getNodeLinksQuery());
    }

    /**
     * Retrieves all NodeLinks from the index being Source or Target of a specific LRU prefix
     *
     * @param prefix (LRU formatted) to match
     * @param type a string that should be either "target" or "source" expressing which match is desired
     * @return
     * @throws IndexException hmm
     */
    private List<NodeLink> retrieveNodeLinksByPrefixQuery(String prefix, String type) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveNodeLinksBy"+type+"Prefix: " + prefix);
        }
        List<NodeLink> results = new ArrayList<NodeLink>();
        if(prefix == null) {
            logger.warn("attempted to retrieve node links with null target prefix");
            return results;
        }
        Query q;
        if (type.equals("target")) {
            q = LuceneQueryFactory.getNodeLinksByTargetLRUPrefixQuery(prefix);
        } else if (type.equals("source")) {
            q = LuceneQueryFactory.getNodeLinksBySourceLRUPrefixQuery(prefix);
        } else {
            return results;
        }
        return retrieveNodeLinksByQuery(q);
    }

    public List<NodeLink> retrieveNodeLinksBySourcePrefix(String prefix) throws IndexException {
        return retrieveNodeLinksByPrefixQuery(prefix, "source");
    }

    public List<NodeLink> retrieveNodeLinksByTargetPrefix(String prefix) throws IndexException {
        return retrieveNodeLinksByPrefixQuery(prefix, "target");
    }


    // WEBENTITIES

    /**
     * Adds or updates a WebEntity to the index. If ID is not empty, the existing WebEntity with that ID is replaced.
     * If no existing WebEntity with that ID is found, or if ID is empty, a new WebEntity is created.
     *
     * @param webEntity the webentity to index
     * @param checkExisting activates checking whether a webEntity with the same LRUprefix already exists
     * @param commit Whether the written information should be committed right away or not
     * @throws IndexException hmm
     * @return id of indexed webentity
     */
    public String indexWebEntity(WebEntity webEntity, boolean checkExisting, boolean commit) throws IndexException{
        logger.trace("indexWebEntity");
        if (webEntity == null) {
            throw new IndexException("WebEntity is null");
        }
        if (CollectionUtils.isEmpty(webEntity.getLRUSet())) {
            throw new IndexException("WebEntity has empty lru set");
        }

        // Never store a prefix for a webentity ending with a trailing path slash (p:|):so clean prefixes before ever indexing a webentity
        Set<String> lruSet = new HashSet<String>(webEntity.getLRUSet().size());
        for (String lru : webEntity.getLRUSet()) {
            while (lru.endsWith("p:|")) {
                lru = lru.substring(0, lru.length()-3);
            }
            lruSet.add(lru);
        }
        webEntity.setLRUSet(lruSet);

        // Ensure a webEntity lruprefix is unique in the web entity index
        if (checkExisting == true) {
            String webentity_id = webEntity.getId();
            for (String lru : webEntity.getLRUSet()) {
                WebEntity existing = retrieveWebEntityByLRUPrefix(lru);
                if (existing != null && !(StringUtils.isNotEmpty(webentity_id) && webentity_id.equals(existing.getId())) ){
                    logger.error("ERROR / WARNING : WebEntity contains already existing LRU: " + lru);
                    throw new IndexException("WebEntity contains already existing LRUs: " + lru);
                }
            }
        }
        try {
            String id = webEntity.getId();
            if(StringUtils.isEmpty(id)) {
                if(logger.isDebugEnabled()) {
                    logger.trace("indexing webentity with id null (new webentity will be created)");
                }
            } else {
                if(logger.isDebugEnabled()) {
                    logger.trace("indexing webentity with id " + id + " ...");
                }
                WebEntity toUpdate = retrieveWebEntity(id);
                if(toUpdate == null) {
                    if(logger.isDebugEnabled()) {
                        logger.trace("...did not find webentity with id " + id + " (new webentity will be created)");
                    }
                } else {
                    if(logger.isDebugEnabled()) {
                        logger.trace("...deleting existing webentity with id " + id);
                    }
                    // Delete old web entity before indexing and commit
                    deleteObjectsFromQuery(LuceneQueryFactory.getWebEntityByIdQuery(id), true);
                }
            }

            Document webEntityDocument = IndexConfiguration.convertWebEntityToLuceneDocument(webEntity);
            this.indexWriter.addDocument(webEntityDocument);

            // Commit the addDocument
            if (commit) {
                this.indexWriter.commit();
            }
            reloadIndexIfChange();

            // return id of indexed webentity
            String indexedId = webEntityDocument.get(IndexConfiguration.FieldName.ID.name());
            if(logger.isDebugEnabled()){
                logger.trace("indexed webentity with id " + indexedId);
            }
            return indexedId;
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

    public String indexWebEntity(WebEntity webEntity) throws IndexException{
        return indexWebEntity(webEntity, true, true);
    }

    /**
     * Removes all WebEntities in index
     *
     * @throws IndexException hmm
     */
    public void deleteWebEntities() throws IndexException {
        logger.info("delete all existing WebEntities");
        // Commit the IndexWriter
        deleteObjectsFromQuery(LuceneQueryFactory.getWebEntitiesQuery(), true);
    }

    /**
     * Removes a specific WebEntity
     *
     * @param webEntity
     * @throws IndexException hmm
     */
    public void deleteWebEntity(WebEntity webEntity) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleting webEntity with id " + webEntity.getId());
        }
        // Commit as soon as ran
        deleteObjectsFromQuery(LuceneQueryFactory.getWebEntityByIdQuery(webEntity.getId()), true);
    }

    /**
     * Retrieves a specific WebEntity matching a Lucene Query
     *
     * @param query
     * @return a WebEntity object
     * @throws IndexException hmm
     */
    public WebEntity retrieveWebEntityByQuery(Query query) throws IndexException {
        try {
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            indexSearcher.search(query, collector);
            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                return IndexConfiguration.convertLuceneDocumentToWebEntity(indexSearcher.doc(hits[0].doc));
            }
            if(logger.isDebugEnabled()) {
                logger.debug("failed to retrieve WebEntity for query " + query);
            }
            return null;
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves a specific WebEntity by its ID.
     *
     * @param id
     * @return a WebEntity object
     * @throws IndexException hmm
     */
    public WebEntity retrieveWebEntity(String id) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntity with id " + id);
        }
        return retrieveWebEntityByQuery(LuceneQueryFactory.getWebEntityByIdQuery(id));
    }

    /**
     * Retrieves a specific WebEntity having a particular LRU prefix within its list of prefixes.
     * Picks first one and prints a Warning if two different WEs found for the prefix (should not happen)
     *
     * @param LRUPrefix
     * @return web entity having prefix in its list of LRU prefixes
     * @throws IndexException hmm
     */
    public WebEntity retrieveWebEntityByLRUPrefix(String LRUPrefix) throws IndexException {
        if (LRUPrefix == null) {
            logger.warn("attempted to retrieve web entity with null lruprefix");
            return null;
        } else if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityByLRUPrefix: " + LRUPrefix);
        }
        try {
            Query q = LuceneQueryFactory.getWebEntityByLRUPrefixQuery(LRUPrefix);
            final List<Document> hits = executeMultipleResultsQuery(q);
            if (hits.size() < 1) {
                return null;
            } else if (hits.size() > 1) {
                logger.warn("WARNING : " + hits.size() + "multiple WEs found for lru "+LRUPrefix);
            }
            WebEntity webEntity = IndexConfiguration.convertLuceneDocumentToWebEntity(hits.get(0));
            return webEntity;
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves the unique WebEntity matching a LRU
     * (meaning the WebEntity which has the longest LRU prefix matching the LRU)
     *
     * @param LRU
     * @return web entity having prefix in its list of lru prefixes
     * @throws IndexException hmm
     */
    public WebEntity retrieveWebEntityMatchingLRU(String LRU) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityMatchingLRU: " + LRU);
        }
        try {
            int lastIndex;
            String prefixLRU = LRU;
            WebEntity webentity = null;
            while (webentity == null && prefixLRU != null && prefixLRU.length() > 0) {
                webentity = retrieveWebEntityByLRUPrefix(prefixLRU);
                if (webentity == null) {
                    lastIndex = -1;
                    Matcher matcher = LRUUtil.LRU_STEM_PATTERN.matcher(prefixLRU);
                    while (matcher.find()) {
                        lastIndex = matcher.start();
                    }
                    if (lastIndex != -1) {
                        prefixLRU = prefixLRU.substring(0, lastIndex + 1);
                    } else {
                        prefixLRU = "";
                    }
                }
            }
            return webentity;
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves the ID of the unique WebEntity matching a LRU
     *
     * @param LRU
     * @return a String id of the matching WebEntity or null if no WE matches
     * @throws IndexException hmm
     */
    public String retrieveWebEntityIdMatchingLRU(String LRU) throws IndexException {
        WebEntity we = retrieveWebEntityMatchingLRU(LRU);
        if (we == null) {
            return null;
        }
        return we.getId();
    }


    /**
     * Retrieves all WebEntities matching a specific Lucene Query.
     *
     * @param query
     * @return a List of WebEntity objects
     * @throws IndexException hmm
     */
    public List<WebEntity> retrieveWebEntitiesByQuery(Query query) throws IndexException {
        try {
            final List<Document> hits = executeMultipleResultsQuery(query);
            List<WebEntity> results = new ArrayList<WebEntity>(hits.size());
            for(Document hit: hits) {
                results.add(IndexConfiguration.convertLuceneDocumentToWebEntity(hit));
            }
            if (logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " WebEntities for Query " + query);
            }
            return results;
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }


    /**
     * Retrieves all WebEntities.
     *
     * @return a List of WebEntity objects
     * @throws IndexException hmm
     */
    public List<WebEntity> retrieveWebEntities() throws IndexException {
        if (logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntities");
        }
        return retrieveWebEntitiesByQuery(LuceneQueryFactory.getWebEntitiesQuery());
    }


    /**
     * Retrieves all WebEntities that were defined by the user and not created automatically from WECreationRules.
     *
     * @return a List of WebEntity objects
     * @throws IndexException hmm
     */
    public List<WebEntity> retrieveUserDefinedWebEntities() throws IndexException {
        if (logger.isDebugEnabled()) {
            logger.debug("retrieveUserDefinedWebEntities");
        }
        return retrieveWebEntitiesByQuery(LuceneQueryFactory.getLinkedWebEntitiesQuery());
    }


    /**
     * Retrieves all WebEntities having ID within a list of IDs.
     *
     * @param listIDs
     * @return a List of WebEntity objects
     * @throws IndexException hmm
     */
    public List<WebEntity> retrieveWebEntitiesByIDs(List<String> listIDs) throws IndexException {
        if (logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntitiesByIDs");
        }
        return retrieveWebEntitiesByQuery(LuceneQueryFactory.getWebEntitiesByIdsQuery(listIDs));
    }


    /**
     * Retrieves all WebEntities matching a list of keywords on main text fields or on specific fields.
     * (see whole doc in LuceneQueryFactory.searchWebEntitiesByKeywords)
     *
     * @param allFieldsKeywords a List of values to search for in the WebEntities
     * @param fieldKeywords a List of pair of Strings (fieldName, fieldValue) to search for in the WebEntities
     * @return a List of WebEntity objects
     * @throws IndexException hmm
     */
    public List<WebEntity> retrieveWebEntitiesBySearchKeywords(List<String> allFieldsKeywords, List<List<String>> fieldKeywords) throws IndexException {
        if (logger.isDebugEnabled()) {
            logger.debug("searchWebEntitiesByKeywords");
        }
        return retrieveWebEntitiesByQuery(LuceneQueryFactory.searchWebEntitiesByKeywords(allFieldsKeywords, fieldKeywords));
    }


    /**
     * Retrieves all WebEntities being a WebEntity's sub-WebEntities
     * (i.e. the WebEntities having at least one LRUprefix starting with one of this WE's LRUprefixes).
     *
     * @param webEntity
     * @return a List of WebEntity objects
     * @throws IOException
     */
    public List<WebEntity> retrieveWebEntitySubWebEntities(WebEntity webEntity) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntitySubWebEntities for WebEntity with name " + webEntity.getName());
        }
        final List<WebEntity> subs = retrieveWebEntitiesByQuery(LuceneQueryFactory.getWebEntitySubWebEntitiesQuery(webEntity));
        List<WebEntity> results = new ArrayList<WebEntity>();
        for(WebEntity sub : subs) {
            if (sub.getId() == webEntity.getId()) {
                logger.warn("Found myself into my list of sub-WebEntities, should not happen");
            } else {
                if(logger.isDebugEnabled()) {
                    logger.debug("...found sub-WebEntity with name " + sub.getName());
                }
                results.add(sub);
            }
        }
        return results;
    }


    /**
     * Retrieves all WebEntities being a WebEntity's parent-WebEntities
     * (i.e. the WebEntities having a LRUprefix starting like one of this WE's LRUprefixes but with less stems).
     *
     * @param webEntity
     * @return a List of WebEntity objects
     * @throws IOException
     */
    public List<WebEntity> retrieveWebEntityParentWebEntities(WebEntity webEntity) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityParentWebEntities for WebEntity with name " + webEntity.getName());
        }
        try {
            int lastIndex;
            WebEntity parent = null;
            THashSet<WebEntity> parents = new THashSet<WebEntity>();
            for (String prefixLRU : webEntity.getLRUSet()) {
                while (prefixLRU.length() > 0) {
                    lastIndex = -1;
                    Matcher matcher = LRUUtil.LRU_STEM_PATTERN.matcher(prefixLRU);
                    while (matcher.find()) {
                        lastIndex = matcher.start();
                    }
                    if (lastIndex != -1) {
                        prefixLRU = prefixLRU.substring(0, lastIndex + 1);
                    } else {
                        prefixLRU = "";
                    }
                    parent = retrieveWebEntityByLRUPrefix(prefixLRU);
                    if (parent != null) {
                        if (!parent.getId().equals(webEntity.getId())) {
                            parents.add(parent);
                        }
                    }
                }
            }
            return new ArrayList<WebEntity>(parents);
        } catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves all Tag Values existing as metadataItems on the WebEntities in the index.
     * Returns it as a map of namespaces, each being a map of values per categories
     *
     * @return a Map of Map of Strings
     * @throws IndexException hmm
     */
    public Map<String, Map<String, List<String>>> retrieveWebEntitiesTags() throws IndexException {
        try {
            List<String> results = getFieldValues(IndexConfiguration.FieldName.TAG);
            return IndexConfiguration.convertTagStringsToTagsMap(results);
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }


    /**
     * Retrieves all PageItems corresponding to a specific WebEntity.
     *
     * @param webEntityId
     * @return a List of PageItem objects
     * @throws IndexException hmm
     * @throws ObjectNotFoundException hmm
     */
    public List<PageItem> retrieveWebEntityPageItems(String webEntityId, boolean onlyCrawled) throws IndexException, ObjectNotFoundException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityPageItems for webEntityId: " + webEntityId);
        }
        List<PageItem> results = new ArrayList<PageItem>();
        if(StringUtils.isEmpty(webEntityId)) {
            return results;
        }
        WebEntity webEntity = retrieveWebEntity(webEntityId);
        if(webEntity == null) {
            throw new ObjectNotFoundException().setMsg("Could not find webentity with id: " + webEntityId);
        }
        List<WebEntity> subWebEntities = retrieveWebEntitySubWebEntities(webEntity);
        Query q;
        if (onlyCrawled) {
        	q = LuceneQueryFactory.getCrawledPageItemMatchingWebEntityButNotMatchingSubWebEntities(webEntity, subWebEntities);
        } else {
        	q = LuceneQueryFactory.getPageItemMatchingWebEntityButNotMatchingSubWebEntities(webEntity, subWebEntities);
        }
        results = retrievePageItemsByQuery(q);
        if(logger.isDebugEnabled()) {
            logger.debug("found " + results.size() + " pages for web entity " + webEntity.getName() + ":");
        }
        return results;
    }

    /**
     * Retrieves all NodeLinks corresponding to a specific WebEntity (within and optionally external links).
     *
     * @param webEntityId
     * @param includeExternalLinks
     * @return a List of NodeLink objects
     * @throws IndexException hmm
     */
    public List<NodeLink> retrieveWebEntityNodeLinks(String webEntityId, Boolean includeExternalLinks) throws IndexException, ObjectNotFoundException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityNodeLinks for webEntityId: " + webEntityId + " ; externalLinks included: " + includeExternalLinks);
        }
        List<NodeLink> results = new ArrayList<NodeLink>();
        if(StringUtils.isEmpty(webEntityId)) {
            return results;
        }
        WebEntity webEntity = retrieveWebEntity(webEntityId);
        if(webEntity == null) {
            throw new ObjectNotFoundException().setMsg("Could not find webentity with id: " + webEntityId);
        }
        List<WebEntity> subWebEntities = retrieveWebEntitySubWebEntities(webEntity);
        results = retrieveNodeLinksByQuery(LuceneQueryFactory.getNodeLinksMatchingWebEntityButNotMatchingSubWebEntities(webEntity, subWebEntities, includeExternalLinks));
        if(logger.isDebugEnabled()) {
            logger.debug("found " + results.size() + " pages for web entity " + webEntity.getName() + ":");
        }
        return results;
    }


    // WEBENTITYLINKS

    /**
     * Removes all WebEntityLinks in index
     *
     * @throws IndexException hmm
     */
    public void deleteWebEntityLinks() throws IndexException {
        logger.info("delete all existing WebEntityLinks");
        // Commit the IndexWriter
        deleteObjectsFromQuery(LuceneQueryFactory.getWebEntityLinksQuery(), true);
    }

    /**
     * Removes a specific WebEntityLink
     *
     * @param webEntityLink
     * @throws IndexException hmm
     */
    public void deleteWebEntityLink(WebEntityLink webEntityLink) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleting webEntityLink with source " + webEntityLink.getSourceId() + " and target " + webEntityLink.getTargetId());
        }
        // This is ran during the AsyncIndexWriterTask which already commits the IndexWriter at the end
        deleteObjectsFromQuery(LuceneQueryFactory.getWebEntityLinkBySourceAndTargetWebEntitiesQuery(webEntityLink.getSourceId(), webEntityLink.getTargetId()), false);
    }

    /**
     * Retrieves a specific WebEntityLink.
     *
     * @param webEntityLink
     * @return a WebEntityLink object
     * @throws IndexException hmm
     */
    public WebEntityLink retrieveWebEntityLink(WebEntityLink webEntityLink) throws IndexException {
        try {
            WebEntityLink result = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            indexSearcher.search(LuceneQueryFactory.getWebEntityLinkBySourceAndTargetWebEntitiesQuery(webEntityLink.getSourceId(), webEntityLink.getTargetId()), collector);
            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                result = IndexConfiguration.convertLuceneDocumentToWebEntityLink(indexSearcher.doc(hits[0].doc));
            }
            if (logger.isDebugEnabled()) {
                logger.debug("failed to retrieve webentitylink");
            }
            return result;
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves all WebEntityLinks matching a specific Lucene Query
     *
     * @param id
     * @return
     * @throws IndexException hmm
     */
    public List<WebEntityLink> retrieveWebEntityLinksByQuery(Query query) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityLinksByQuery: " + query);
        }
        try {
            final List<Document> hits = executeMultipleResultsQuery(query);
            List<WebEntityLink> results = new ArrayList<WebEntityLink>(hits.size());
            for(Document hit: hits) {
                results.add(IndexConfiguration.convertLuceneDocumentToWebEntityLink(hit));
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " WebEntityLinks for query " + query);
            }
            return results;
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves all WebEntityLinks.
     *
     * @return a List of WebEntityLink objects
     * @throws IndexException hmm
     */
    public List<WebEntityLink> retrieveWebEntityLinks() throws IndexException {
        if (logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityLinks");
        }
        return retrieveWebEntityLinksByQuery(LuceneQueryFactory.getWebEntityLinksQuery());
    }

    /**
     * Retrieves all WebEntityLinks matching a specific Query on WELink's fields Source or Target.
     *
     * @param neighborsQuery
     * @param id the id of the desired source or target webEntity
     * @param type a String attribute giving the type of link desired (should be "target" or "source")
     * @return a List of WebEntityLink objects
     * @throws IndexException hmm
     */
    public List<WebEntityLink> retrieveWebEntityLinksByNeighborsQuery(Query neighborsQuery, String id, String type) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityLinksBy" + type + ": " + id);
        }
        if(StringUtils.isEmpty(id)) {
            logger.warn("attempted to retrieve web entity links with null "+type+" id");
            return new ArrayList<WebEntityLink>();
        }
        return retrieveWebEntityLinksByQuery(neighborsQuery);
    }

    /**
     * Retrieves all WebEntityLinks having a specific webEntity as Source.
     *
     * @param webEntityIdSource
     * @return a List of WebEntityLink objects
     * @throws IndexException hmm
     */
    public List<WebEntityLink> retrieveWebEntityLinksBySource(String webEntityIdSource) throws IndexException {
        return retrieveWebEntityLinksByNeighborsQuery(LuceneQueryFactory.getWebEntityLinksBySourceWebEntityQuery(webEntityIdSource), webEntityIdSource, "source");
    }

    /**
     * Retrieves all WebEntityLinks having a specific webEntity as Target.
     *
     * @param webEntityIdTarget
     * @return a List of WebEntityLink objects
     * @throws IndexException hmm
     */
    public List<WebEntityLink> retrieveWebEntityLinksByTarget(String webEntityIdTarget) throws IndexException {
        return retrieveWebEntityLinksByNeighborsQuery(LuceneQueryFactory.getWebEntityLinksByTargetWebEntityQuery(webEntityIdTarget), webEntityIdTarget, "target");
    }

    /**
     * Runs the generation of WebEntityLinks from the combination of WebEntities definition and the list of all NodeLinks.
     *
     * @return the List of all WebEntityLink objects created
     * @throws IndexException hmm
     */
    public List<WebEntityLink> generateWebEntityLinks() throws IndexException {
        long start = System.currentTimeMillis();
        try {
            final TopDocs results = indexSearcher.search(LuceneQueryFactory.getWebEntitiesQuery(), null, 1);
            List<WebEntityLink> res;
            String method = "HashMap";
            if (results.totalHits < 5000) {
                res = generateWebEntityLinksViaMap();
            } else {
                res = generateWebEntityLinksViaWENL();
                method = "WebEntityNodeLinks";
            }
            logger.info("Generated " + res.size() + " WebEntityLinks (method " + method + ") in " + (System.currentTimeMillis()-start)/1000 + "s");
            return res;
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Runs the generation of WebEntityLinks from the combination of WebEntities definition and the list of all NodeLinks.
     * Method Map: iterates over all WebEntities, search all NodeLinks having it as Target,
     * and maps everything in a three-layered HashMap to optimize resolving.
     * Most effective on smaller corpora, set as default method when there are less than 5000 WEs in the index
     *
     * @throws IndexException hmm
     */
    public List<WebEntityLink> generateWebEntityLinksViaMap() throws IndexException {
        try {
            logger.info("generateWebEntityLinksViaMap");
            final Query webEntityQuery = LuceneQueryFactory.getWebEntitiesQuery();
            TopDocs results = indexSearcher.search(webEntityQuery, null, 1);
            final int totalWebEntities = results.totalHits;
            final TopDocs nodelinks = indexSearcher.search(LuceneQueryFactory.getNodeLinksQuery(), null, 1);
            logger.info("total # of webentities in index : " + totalWebEntities);
            logger.info("total # of  nodelinks  in index : " + nodelinks.totalHits);
            List<WebEntityLink> webEntityLinks = new ArrayList<WebEntityLink>();
            if (totalWebEntities == 0 || nodelinks.totalHits == 0) {
                deleteWebEntityLinks();
                return webEntityLinks;
            }
            results = indexSearcher.search(webEntityQuery, null, totalWebEntities);
            final ScoreDoc[] scoreDocs = results.scoreDocs;
            THashMap<String, THashMap<String, THashMap<String, String>>> lruToWebEntityMap = new THashMap<String, THashMap<String, THashMap<String, String>>>();
            THashMap<String, THashMap<String, String>> tmpMapMap = new THashMap<String, THashMap<String, String>>();
            THashMap<String, String> tmpMap = new THashMap<String, String>();
            THashMap<String, WebEntityLink> webEntityLinksMap;
            int intern_weight = 0;
            String sourceId, sourceLRU, sourceNode, sourcePrefix, shortLRU;
            for (ScoreDoc doc : scoreDocs) {
                final WebEntity WE = IndexConfiguration.convertLuceneDocumentToWebEntity(indexSearcher.doc(doc.doc));
                if(logger.isDebugEnabled()) {
                    logger.debug("generating webentitylinks for webentity " + WE.getName() + " / " + WE.getId());
                }
                if (WE.getName() == null || WE.getName().equals(Constants.DEFAULT_WEBENTITY)) {
                    continue;
                }
                // TODO: handle WebEntities with too many subWebEntities making queries with too many clauses
                final List<WebEntity> subWEs = retrieveWebEntitySubWebEntities(WE);
                if (subWEs != null && subWEs.size() > 500) {
                    logger.warn("Skipping links generation for WebEntity " + WE.getId() + " (" + WE.getName() + ")");
                    continue;
                }
                List<NodeLink> links = retrieveNodeLinksByQuery(LuceneQueryFactory.getNodeLinksByTargetWebEntityQuery(WE, subWEs));
                if (links.size() > 0) {
                    webEntityLinksMap = new THashMap<String, WebEntityLink>();
                    intern_weight = 0;
                    for (NodeLink link : links) {
                        sourceLRU = link.getSourceLRU();
                        sourcePrefix = LRUUtil.getLRUHead(sourceLRU);
                        sourceNode = LRUUtil.getLimitedStemsLRU(sourceLRU, 1).replace(sourcePrefix, "");
                        shortLRU = sourceLRU.replace(sourcePrefix, "").replace(sourceNode, "");
                        tmpMapMap = lruToWebEntityMap.remove(sourcePrefix);
                        if (tmpMapMap == null) {
                            tmpMapMap = new THashMap<String, THashMap<String, String>>();
                        }
                        tmpMap = tmpMapMap.remove(sourceNode);
                        if (tmpMap == null) {
                            tmpMap = new THashMap<String, String>();
                        }
                        tmpMapMap.put(sourceNode, tmpMap);
                        lruToWebEntityMap.put(sourcePrefix, tmpMapMap);
                        if (LRUUtil.LRUBelongsToWebentity(sourceLRU, WE, subWEs)) {
                            tmpMapMap = lruToWebEntityMap.remove(sourcePrefix);
                            tmpMap = tmpMapMap.remove(sourceNode);
                            tmpMap.put(shortLRU, WE.getId());
                            tmpMapMap.put(sourceNode, tmpMap);
                            lruToWebEntityMap.put(sourcePrefix, tmpMapMap);
                            intern_weight += link.getWeight();
                        } else {
                            tmpMapMap = lruToWebEntityMap.remove(sourcePrefix);
                            tmpMap = tmpMapMap.remove(sourceNode);
                            sourceId = tmpMap.remove(shortLRU);
                            if (sourceId == null) {
                                sourceId = retrieveWebEntityIdMatchingLRU(sourceLRU);
                                if (sourceId == null) {
                                    logger.warn("Warning couldn't retrieve WE for LRU source " + sourceLRU);
                                    continue;
                                }
                            }
                            tmpMap.put(shortLRU, sourceId);
                            tmpMapMap.put(sourceNode, tmpMap);
                            lruToWebEntityMap.put(sourcePrefix, tmpMapMap);
                            final String now = String.valueOf(System.currentTimeMillis()/1000);
                            WebEntityLink webEntityLink = webEntityLinksMap.remove(sourceId);
                            if (webEntityLink == null) {
                                webEntityLink = new WebEntityLink();
                                webEntityLink.setCreationDate(now);
                                webEntityLink.setSourceId(sourceId);
                                webEntityLink.setTargetId(WE.getId());
                            }
                            webEntityLink.setLastModificationDate(now);
                            webEntityLink.setWeight(webEntityLink.getWeight()+link.getWeight());
                            webEntityLinksMap.put(sourceId, webEntityLink);
                        }
                    }
                    if (webEntityLinksMap.size() > 0) {
                        webEntityLinks.addAll(webEntityLinksMap.values());
                    }
                    if (intern_weight > 0) {
                        final String now = String.valueOf(System.currentTimeMillis()/1000);
                        webEntityLinks.add(new WebEntityLink(WE.getId(), WE.getId(), intern_weight, now, now));
                    }
                }
            }
            deleteWebEntityLinks();
            if (webEntityLinks.size() > 0) {
                if (logger.isDebugEnabled()) {
                    logger.trace("index reloaded, saving " + webEntityLinks.size() + " WebEntityLinks...");
                }
                @SuppressWarnings({"unchecked"})
                final List<Object> webEntityLinksList = new ArrayList(webEntityLinks);
                batchIndex(webEntityLinksList);
                logger.info("...WebEntityLinks saved.");
            }
            return webEntityLinks;
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Runs the generation of WebEntityLinks from the combination of WebEntities definition and the list of all NodeLinks.
     * Method WebEntityNodeLink: iterates over all user created WebEntities, find corresponding NodeLinks (having Source within the WE),
     * and creates temporary links between WebEntities and NodeLinks as WebEntityNodeLinks Lucene Objects
     * Then query these on their Target for each WebEntity and assemble them as WebEntityLinks
     * Most effective on big corpora, set as default method when there are more than 5000 WEs in the index
     *
     * @throws IndexException hmm
     */
    public List<WebEntityLink> generateWebEntityLinksViaWENL() throws IndexException {
        try {
            logger.info("generateWebEntityLinksViaWENL");
            final List<WebEntity> linkedWEs = retrieveUserDefinedWebEntities();
            logger.info("Total # of linked webentities in index is " + linkedWEs.size());
            List<WebEntityLink> webEntityLinks = new ArrayList<WebEntityLink>();
            logger.info("Regenerate WebEntityNodeLinks");
            deleteObjectsFromQuery(LuceneQueryFactory.getWebEntityNodeLinksQuery(), true);
            for (WebEntity WE : linkedWEs) {
                if (WE.getName().equals(Constants.DEFAULT_WEBENTITY)) {
                    continue;
                }
                final List<WebEntity> subWEs = retrieveWebEntitySubWebEntities(WE);
                // TODO: handle WebEntities with too many subWebEntities making queries with too many clauses
                if (subWEs != null && subWEs.size() > 500) {
                    logger.warn("Skipping links generation for WebEntity " + WE.getId() + " (" + WE.getName() + ")");
                    continue;
                }
                if (logger.isDebugEnabled()) {
                    logger.trace("generating webentitynodelinks for webentity " + WE.getName() + " / " + WE.getId() + " (" + subWEs.size() + " subs)");
                }
                final Query linksQuery = LuceneQueryFactory.getNodeLinksBySourceWebEntityQuery(WE, subWEs);
                TopDocs linksResults = indexSearcher.search(linksQuery, null, 1);
                final int totalLinksResults = linksResults.totalHits;
                int intern_weight = 0;
                List<WebEntityNodeLink> webEntityNodeLinks = new ArrayList<WebEntityNodeLink>();
                if (totalLinksResults > 0) {
                    linksResults = indexSearcher.search(linksQuery, null, totalLinksResults);
                    final ScoreDoc[] scoreDocs = linksResults.scoreDocs;
                    for (ScoreDoc doc : scoreDocs) {
                        final NodeLink link = IndexConfiguration.convertLuceneDocumentToNodeLink(indexSearcher.doc(doc.doc));
                        if (LRUUtil.LRUBelongsToWebentity(link.getTargetLRU(), WE, subWEs)) {
                            intern_weight += link.getWeight();
                        } else {
                            WebEntityNodeLink webEntityNodeLink = new WebEntityNodeLink();
                            webEntityNodeLink.setSourceId(WE.getId());
                            webEntityNodeLink.setTargetLRU(link.getTargetLRU());
                            webEntityNodeLink.setWeight(link.getWeight());
                            webEntityNodeLinks.add(webEntityNodeLink);
                        }
                    }
                    if (intern_weight > 0) {
                        String now = String.valueOf(System.currentTimeMillis()/1000);
                        webEntityLinks.add(new WebEntityLink(WE.getId(), WE.getId(), intern_weight, now, now));
                    }
                    if (webEntityNodeLinks.size() > 0) {
                        @SuppressWarnings({"unchecked"})
                        final List<Object> webEntityNodeLinksList = new ArrayList(webEntityNodeLinks);
                        batchIndex(webEntityNodeLinksList);
                    }
                }
            }

            THashMap<String, WebEntityLink> webEntityLinksMap;
            String sourceId;
            final Query query = LuceneQueryFactory.getWebEntitiesQuery();
            TopDocs results = indexSearcher.search(query, null, 1);
            final int totalResults = results.totalHits;
            logger.info("total # of webentities in index is " + totalResults);
            if (totalResults == 0) {
                return webEntityLinks;
            }
            results = indexSearcher.search(query, null, totalResults);
            ScoreDoc[] scoreDocs = results.scoreDocs;
            for (ScoreDoc doc : scoreDocs) {
                final WebEntity WE = IndexConfiguration.convertLuceneDocumentToWebEntity(indexSearcher.doc(doc.doc));
                if (WE.getName() != null && WE.getName().equals(Constants.DEFAULT_WEBENTITY)) {
                    continue;
                }
                List<WebEntity> subWEs = retrieveWebEntitySubWebEntities(WE);
                if (subWEs != null && subWEs.size() > 500) {
                    logger.warn("Skipping links generation for WebEntity " + WE.getId() + " (" + WE.getName() + ")");
                    continue;
                }
                if(logger.isDebugEnabled()) {
                    logger.debug("generating webentitylinks for webentity " + WE.getName() + " / " + WE.getId());
                }
                final Query linksQuery = LuceneQueryFactory.getWebEntityNodeLinksByTargetWebEntityQuery(WE, subWEs);
                TopDocs linksResults = indexSearcher.search(linksQuery, null, 1);
                final int totalLinksResults = linksResults.totalHits;
                if (totalLinksResults > 0) {
                    webEntityLinksMap = new THashMap<String, WebEntityLink>();
                    linksResults = indexSearcher.search(linksQuery, null, totalLinksResults);
                    final ScoreDoc[] linksScoreDocs = linksResults.scoreDocs;
                    for (ScoreDoc linkDoc : linksScoreDocs) {
                        final WebEntityNodeLink link = IndexConfiguration.convertLuceneDocumentToWebEntityNodeLink(indexSearcher.doc(linkDoc.doc));
                        final String now = String.valueOf(System.currentTimeMillis()/1000);
                        sourceId = link.getSourceId();
                        WebEntityLink webEntityLink = webEntityLinksMap.remove(sourceId);
                        if (webEntityLink == null) {
                            webEntityLink = new WebEntityLink();
                            webEntityLink.setCreationDate(now);
                            webEntityLink.setSourceId(sourceId);
                            webEntityLink.setTargetId(WE.getId());
                        }
                        webEntityLink.setLastModificationDate(now);
                        webEntityLink.setWeight(webEntityLink.getWeight()+link.getWeight());
                        webEntityLinksMap.put(sourceId, webEntityLink);
                    }
                    webEntityLinks.addAll(webEntityLinksMap.values());
                }
            }
            deleteWebEntityLinks();
            if (webEntityLinks.size() > 0) {
                if(logger.isDebugEnabled()) {
                    logger.trace("index reloaded, Saving " + webEntityLinks.size() + " WebEntityLinks");
                }
                @SuppressWarnings({"unchecked"})
                final List<Object> webEntityLinksList = new ArrayList(webEntityLinks);
                batchIndex(webEntityLinksList);
            }
            logger.info(webEntityLinks.size()+" webentitylinks saved");
            return webEntityLinks;
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    private WebEntity mapLRUtoWebEntity(final String LRU, THashMap<String, THashMap<String, THashMap<String, WebEntity>>> lruToWebEntityMap) throws IndexException {
    	String Prefix = LRUUtil.getLRUHead(LRU);
        String Node = LRUUtil.getLimitedStemsLRU(LRU, 1).replace(Prefix, "");
        String shortLRU = LRU.replace(Prefix, "").replace(Node, "");
       
        THashMap<String, THashMap<String, WebEntity>> tmpMapMap = lruToWebEntityMap.remove(Prefix);
    	if (tmpMapMap == null) {
            tmpMapMap = new THashMap<String, THashMap<String, WebEntity>>();
        }

    	THashMap<String, WebEntity> tmpMap = tmpMapMap.remove(Node);
        if (tmpMap == null) {
            tmpMap = new THashMap<String, WebEntity>();
        }

        WebEntity WE = tmpMap.remove(shortLRU);
        if (WE == null) {
    		WE = retrieveWebEntityMatchingLRU(LRU);
        	if (WE == null) {
                logger.warn("Warning couldn't retrieve WE for LRU " + LRU);
            }
        }
        
        if (WE != null) {
        	tmpMap.put(shortLRU, WE);
        	tmpMapMap.put(Node, tmpMap);
        	lruToWebEntityMap.put(Prefix, tmpMapMap);
        }
        return WE;
    }
    
    private void addWELink(final String sourceId, final String targetId, final int weight, THashMap<String, THashMap<String, WebEntityLink>> webEntityLinksMap) throws IndexException {
	    final String now = String.valueOf(System.currentTimeMillis()/1000);
	    THashMap<String, WebEntityLink> tmpMap = webEntityLinksMap.remove(sourceId);
    	if (tmpMap == null) {
            tmpMap = new THashMap<String, WebEntityLink>();
        }
	    WebEntityLink webEntityLink = tmpMap.remove(targetId);
	    if (webEntityLink == null) {
	        webEntityLink = new WebEntityLink();
	        webEntityLink.setCreationDate(now);
	        webEntityLink.setSourceId(sourceId);
	        webEntityLink.setTargetId(targetId);
	    }
	    webEntityLink.setLastModificationDate(now);
	    webEntityLink.setWeight(webEntityLink.getWeight() + weight);
	    tmpMap.put(targetId, webEntityLink);
	    webEntityLinksMap.put(sourceId, tmpMap);
    }
    
    /**
     * Runs the generation of new and modified WebEntityLinks from the combination of newly modified WebEntities and the list of new NodeLinks.
     * Method update via Map:
     *
     * @throws IndexException hmm
     */
    public int updateWebEntityLinks(final int lastTimestamp) throws IndexException {
        try {
            if(logger.isDebugEnabled()) {
            	logger.trace("updateWebEntityLinks");
            }
            THashSet<WebEntity> SourceWEsTodo = new THashSet<WebEntity>();
            THashSet<WebEntity> TargetWEsTodo = new THashSet<WebEntity>();
            List <WebEntity> WEsTodo = retrieveWebEntitiesByQuery(LuceneQueryFactory.getWebEntitiesModifiedSince(lastTimestamp));
            SourceWEsTodo.addAll(WEsTodo);
            TargetWEsTodo.addAll(WEsTodo);

            int newTimestamp = (int) (System.currentTimeMillis()/1000);
            
            logger.info("Total # of new and recently modified webentities in index is " + WEsTodo.size());
            THashMap<String, THashMap<String, THashMap<String, WebEntity>>> lruToWebEntityMap = new THashMap<String, THashMap<String, THashMap<String, WebEntity>>>();
            final Query linksQuery = LuceneQueryFactory.getNodeLinksModifiedSince(lastTimestamp);
            TopDocs linksResults = indexSearcher.search(linksQuery, null, 1);
            SortField sortSources = new SortField(IndexConfiguration.FieldName.SOURCE.name(), SortField.STRING, true);
            SortField sortTargets = new SortField(IndexConfiguration.FieldName.TARGET.name(), SortField.STRING, true);
            Sort sort = new Sort(sortSources, sortTargets);
            final int totalLinksResults = linksResults.totalHits;
            if (totalLinksResults > 0) {
                logger.info("Total # of new NodeLinks in index is " + totalLinksResults);
                linksResults = indexSearcher.search(linksQuery, null, totalLinksResults, sort);
                final ScoreDoc[] scoreDocs = linksResults.scoreDocs;
                for (ScoreDoc doc : scoreDocs) {
                    final NodeLink link = IndexConfiguration.convertLuceneDocumentToNodeLink(indexSearcher.doc(doc.doc));
                    SourceWEsTodo.add(mapLRUtoWebEntity(link.getSourceLRU(), lruToWebEntityMap));
                    TargetWEsTodo.add(mapLRUtoWebEntity(link.getTargetLRU(), lruToWebEntityMap));
                }
            }
            if(logger.isDebugEnabled()) {
            	logger.trace("Total # of WebEntities to re-link is " + (SourceWEsTodo.size() + TargetWEsTodo.size()) + ". Start processing...");
            }
            
            WebEntity sourceWE, targetWE;
            THashSet<String> WELinksDone = new THashSet<String>();
            THashMap<String, THashMap<String, WebEntityLink>> webEntityLinksMap = new THashMap<String, THashMap<String, WebEntityLink>>();
            for (WebEntity WE : SourceWEsTodo) {
	            if(logger.isDebugEnabled()) {
	                logger.debug("generating webentitylinks having webentity " + WE.getName() + " as source");
	            }
	            if (WE.getName() == null || WE.getName().equals(Constants.DEFAULT_WEBENTITY)) {
	                continue;
	            }
	            final List<WebEntity> subWEs = retrieveWebEntitySubWebEntities(WE);
	            final List<NodeLink> links = retrieveNodeLinksByQuery(LuceneQueryFactory.getNodeLinksBySourceWebEntityQuery(WE, subWEs));
	            if (links.size() > 0) {
	                for (NodeLink link : links) {
	                	targetWE = mapLRUtoWebEntity(link.getTargetLRU(), lruToWebEntityMap);
	                	if (targetWE == null) {
	                		continue;
	                	}
	                	WELinksDone.add(WE.getId()+"/"+targetWE.getId());
	                    addWELink(WE.getId(), targetWE.getId(), link.getWeight(), webEntityLinksMap);
	                }
	            }
            }
            
            for (WebEntity WE : TargetWEsTodo) {
	            if(logger.isDebugEnabled()) {
	            	logger.debug("generating webentitylinks having webentity " + WE.getName() + " as target");
	            }
	            if (WE.getName() == null || WE.getName().equals(Constants.DEFAULT_WEBENTITY)) {
	                continue;
	            }
	            final List<WebEntity> subWEs = retrieveWebEntitySubWebEntities(WE);
	            final List<NodeLink> links = retrieveNodeLinksByQuery(LuceneQueryFactory.getNodeLinksByTargetWebEntityQuery(WE, subWEs));
	            if (links.size() > 0) {
	                for (NodeLink link : links) {
	                	sourceWE = mapLRUtoWebEntity(link.getSourceLRU(), lruToWebEntityMap);
	                	if (sourceWE == null || WELinksDone.contains(sourceWE.getId()+"/"+WE.getId())) {
	                		continue;
	                	}
	                    addWELink(sourceWE.getId(), WE.getId(), link.getWeight(), webEntityLinksMap);
	                }
	            }
            }

            if(logger.isDebugEnabled()) {
            	logger.trace("Deleting preexisting corresponding webentitylinks");
            }
            List<String> deleteIDs = new ArrayList<String>();
        	if (SourceWEsTodo.size() > 0) {
        		for (WebEntity we : SourceWEsTodo) {
        			deleteIDs.add(we.getId());
        		}
        		deleteObjectsFromQuery(LuceneQueryFactory.getWebEntityLinksWithSourceInQuery(deleteIDs), true);
        	}
        	if (TargetWEsTodo.size() > 0) {
        		deleteIDs.clear();
        		for (WebEntity we : TargetWEsTodo) {
        			deleteIDs.add(we.getId());
        		}
            	deleteObjectsFromQuery(LuceneQueryFactory.getWebEntityLinksWithTargetInQuery(deleteIDs), true);
        	}

            if(logger.isDebugEnabled()) {
            	logger.debug("Saving updated WebEntityLinks");
            }
            List<WebEntityLink> webEntityLinks = new ArrayList<WebEntityLink>();
            if (webEntityLinksMap.size() > 0) {
            	for (THashMap<String, WebEntityLink> tmpMap : webEntityLinksMap.values()) {
            		webEntityLinks.addAll(tmpMap.values());
            	}
                @SuppressWarnings({"unchecked"})
                final List<Object> webEntityLinksList = new ArrayList(webEntityLinks);
                batchIndex(webEntityLinksList);
            }
            logger.info(webEntityLinks.size()+" webentitylinks saved");
            return newTimestamp;
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves all WebEntityNodeLinks matching a specific Lucene Query
     *
     * @param query
     * @return a List of WebEntityNodeLinks objects
     * @throws IndexException hmm
     */
    public List<WebEntityNodeLink> retrieveWebEntityNodeLinksByQuery(Query query) throws IndexException {
        try {
            final List<Document> hits = executeMultipleResultsQuery(query);
            List<WebEntityNodeLink> results = new ArrayList<WebEntityNodeLink>(hits.size());
            for(Document hit: hits) {
                results.add(IndexConfiguration.convertLuceneDocumentToWebEntityNodeLink(hit));
            }
            return results;
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }


    // WEBENTITYCREATIONRULES

    /**
     * Add or update a single WebEntityCreationRule to the index. If the rule's LRU is empty, it is set as the
     * default rule. If there exists already a rule with this rule's LRU, it is updated.
     *
     * @param webEntityCreationRule
     * @throws IndexException hmm
     */
    public void indexWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws IndexException{
        if(webEntityCreationRule == null) {
            throw new IndexException("webEntityCreationRule is null");
        }
        try {
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            Query q = LuceneQueryFactory.getWebEntityCreationRuleByLRUQuery(webEntityCreationRule.getLRU());
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                if(logger.isDebugEnabled()) {
                    logger.debug("found # " + hits.length + " existing webentitycreationrules with lru " + webEntityCreationRule.getLRU());
                }
                int i = hits[0].doc;
                Document doc = indexSearcher.doc(i);
                WebEntityCreationRule existing = IndexConfiguration.convertLuceneDocumentToWebEntityCreationRule(doc);
                if(existing != null) {
                    if(logger.isDebugEnabled()) {
                        logger.debug("deleting existing webentitycreationrule with lru " + webEntityCreationRule.getLRU());
                    }
                    deleteObjectsFromQuery(q, true);
                }
            }
            this.indexWriter.addDocument(IndexConfiguration.convertWebEntityCreationRuleToLuceneDocument(webEntityCreationRule));
            this.indexWriter.commit();
            reloadIndexIfChange();
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

    /**
     * Removes a specific WebEntityCreationRule
     *
     * @param webEntityCreationRule
     * @throws IndexException hmm
     */
    public void deleteWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleting webEntityCreationRule with LRU " + webEntityCreationRule.getLRU());
        }
        // Commit the IndexWriter
        deleteObjectsFromQuery(LuceneQueryFactory.getWebEntityCreationRuleByLRUQuery(webEntityCreationRule.getLRU()), true);
    }

    /**
     * Retrieves all WebEntityCreationRules
     *
     * @return a List of WebEntityCreationRule objects
     * @throws IndexException hmm
     */
    public List<WebEntityCreationRule> retrieveWebEntityCreationRules() throws IndexException {
        if (logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityCreationRules");
        }
        try {
            List<WebEntityCreationRule> result = new ArrayList<WebEntityCreationRule>();
            final List<Document> hits = executeMultipleResultsQuery(LuceneQueryFactory.getWebEntityCreationRulesQuery());
            for(Document hit: hits) {
                result.add(IndexConfiguration.convertLuceneDocumentToWebEntityCreationRule(hit));
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + result.size() + " WebEntityCreationRules from index");
            }
            return result;
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves the default Web Entity Creation Rule.
     *
     * @return a WebEntityCreationRule object
     * @throws IndexException hmm
     */
    public WebEntityCreationRule retrieveDefaultWECR() throws IndexException {
        if (logger.isDebugEnabled()) {
            logger.debug("retrieve default webentity creation rule");
        }
        try {
            WebEntityCreationRule result = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            indexSearcher.search(LuceneQueryFactory.getDefaultWebEntityCreationRuleQuery(), collector);
            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                result = IndexConfiguration.convertLuceneDocumentToWebEntityCreationRule(indexSearcher.doc(hits[0].doc));
            }
            if (logger.isDebugEnabled()) {
                logger.debug("failed to retrieve default Web Entity Creation Rule");
            }
            return result;
        } catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }


    // PRECISIONEXCEPTIONS

    /**
     * Retrieves all PrecisionExceptions.
     *
     * @return a List of PrecisionsExceptions as LRU Strings
     * @throws IndexException hmm
     */
    public List<String> retrievePrecisionExceptions() throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieving precisionexceptions");
        }
        try {
            THashSet<String> results = new THashSet<String>();
            TermDocs termDocs = this.indexReader.termDocs(LuceneQueryFactory.typeEqualPrecisionException);
            while(termDocs.next()) {
                results.add(indexReader.document(termDocs.doc()).get(IndexConfiguration.FieldName.LRU.name()));
            }
            termDocs.close();
            List<String> listRes = new ArrayList<String>(results);
            listRes.addAll(results);
            return listRes;
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Add a list of PrecisionExceptions.
     *
     * @param List of precision exceptions as string LRUs
     * @return
     * @throws IndexException hmm
     */
    public void indexPrecisionExceptions(List<String> precisionExceptions) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("indexPrecisionExceptions");
        }
        try {
            List<String> existing = retrievePrecisionExceptions();
            for (String lru : precisionExceptions) {
                if (!existing.contains(lru)) {
                    logger.info("adding precision exception for " + lru);
                    this.indexWriter.addDocument(IndexConfiguration.convertPrecisionExceptionToLuceneDocument(lru));
                    this.indexWriter.commit();
                    existing.add(lru);
                }
            }
            reloadIndexIfChange();
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Remove a list of PrecisionExceptions.
     *
     * @param List of precision exceptions as string LRUs
     * @return
     * @throws IndexException hmm
     */
    public void deletePrecisionExceptions(List<String> precisionExceptions) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("deletePrecisionExceptions");
        }
        try {
            List<String> existing = retrievePrecisionExceptions();
            for (String lru : precisionExceptions) {
                if (existing.contains(lru)) {
                    logger.info("removing precision exception for " + lru);
                    deleteObjectsFromQuery(LuceneQueryFactory.getPrecisionExceptionByLRUQuery(lru), false);
                    this.indexWriter.commit();
                    existing.remove(lru);
                }
            }
            reloadIndexIfChange();
        } catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        } catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

}
