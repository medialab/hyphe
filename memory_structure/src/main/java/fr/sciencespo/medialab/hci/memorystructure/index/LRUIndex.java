package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.KeywordAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.LogByteSizeMergePolicy;
import org.apache.lucene.index.LogMergePolicy;
import org.apache.lucene.index.Term;
import org.apache.lucene.index.TermDocs;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.TopScoreDocCollector;
import org.apache.lucene.search.WildcardQuery;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.util.Version;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 *
 * @author heikki doeleman
 */
public class LRUIndex {

    private Logger logger = LoggerFactory.getLogger(LRUIndex.class);

    //
    // Lucene settings
    //

    private static final Version LUCENE_VERSION = Version.LUCENE_35;

    // CREATE - creates a new index or overwrites an existing one.
    // CREATE_OR_APPEND - creates a new index if one does not exist, otherwise it opens the index and documents will be
    // appended.
    // APPEND - opens an existing index.
    private static IndexWriterConfig.OpenMode OPEN_MODE;

    // Lucene settings to be tested to optimize
    private static final int RAM_BUFFER_SIZE_MB = 512;

    /**
     * number of objects to be passed to a single indexwriter. // TODO test for optimal value
     */
    private static int INDEXWRITER_MAX = 250000;

	private FSDirectory diskDirectory;
    private final Analyzer analyzer = new KeywordAnalyzer();
    private IndexReader indexReader;
    private IndexSearcher indexSearcher;
    private IndexWriter indexWriter;

    /**
     * Executor service used for asynchronous batch index tasks.
     */
    private static ScheduledExecutorService executorService = Executors.newScheduledThreadPool(Runtime.getRuntime().availableProcessors());
    //        private static ScheduledExecutorService executorService = Executors.newScheduledThreadPool(50);

 //TODO   private static ScheduledExecutorService executorService2 = new ThreadPoolExecutor();
    //
    // singleton-ness
    //
    private static LRUIndex instance;
    public synchronized static LRUIndex getInstance(String path, IndexWriterConfig.OpenMode openMode) {
        if(instance == null) {
            instance = new LRUIndex(path, openMode);
        }
        return instance;
    }
    public Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException();
    }


    public synchronized void clearIndex() throws IndexException {
        try {
            logger.debug("clearing index");

            indexWriter.deleteAll();
            indexWriter.commit();
            logger.debug("index now has # " + indexCount() + " documents");
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

    /**
     *
     * @param path
     */
	private LRUIndex(String path, IndexWriterConfig.OpenMode openMode) {
        logger.info("creating LRUIndex");
        try {
            OPEN_MODE = openMode;
            File indexDirectory = new File(path);
            // path doesn't exist:
            if(! indexDirectory.exists()){
                // create directory
                indexDirectory.mkdirs();
            }
            // path exists but it's not a directory
            else if(! indexDirectory.isDirectory()) {
                throw new ExceptionInInitializerError("can't create Lucene index in requested location " + path);
            }
            logger.debug("opening FSDirectory");
            this.diskDirectory = FSDirectory.open(indexDirectory);
            logger.debug("creating IndexWriter");
            this.indexWriter = createIndexWriter(this.diskDirectory);
            logger.debug("creating IndexReader");
            this.indexReader = IndexReader.open(this.indexWriter, false);
            logger.debug("creating IndexSearcher");
            this.indexSearcher = new IndexSearcher(this.indexReader);
            logger.info("successfully created LRUIndex");
        }
        catch(Exception x) {
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
     * @throws Exception hmm
     */
    private IndexWriter createIndexWriter(FSDirectory diskDirectory) throws Exception {
        IndexWriterConfig indexWriterConfig = new IndexWriterConfig(LUCENE_VERSION, analyzer);
        indexWriterConfig.setOpenMode(OPEN_MODE);
        indexWriterConfig.setRAMBufferSizeMB(RAM_BUFFER_SIZE_MB);
        LogMergePolicy logMergePolicy = new LogByteSizeMergePolicy();
        logMergePolicy.setUseCompoundFile(false);
        indexWriterConfig.setMergePolicy(logMergePolicy);
        return new IndexWriter(diskDirectory, indexWriterConfig);
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
        /* TODO how to deal with threads taking very long to shutdown
        try {
            // pool didn't terminate after the first try
            if(!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
            // pool didn't terminate after the second try
            if(!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
            }
        }
        catch (InterruptedException ex) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
        */
	}

    /**
     * Adds a single PrecisionException to the index.
     *
     * @param precisionException
     * @throws IndexException hmm
     */
    public void indexPrecisionException(String precisionException) throws IndexException{
        try {
            Document precisionExceptionDocument = IndexConfiguration.PrecisionExceptionDocument(precisionException);
            this.indexWriter.addDocument(precisionExceptionDocument);
            this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            this.indexWriter.commit();
            this.indexSearcher = new IndexSearcher(this.indexReader);
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

   /**
     * Adds or updates a WebEntity to the index. If ID is not empty, the existing WebEntity with that ID is retrieved
     * and this LRU is added to it; if no existing WebEntity with that ID is found, or if ID is empty, a new WebEntity
     * is created.
     *
     * @param id
     * @param lruItem
     * @throws IndexException hmm
     */
    public String indexWebEntity(String id, LRUItem lruItem) throws IndexException{
        logger.debug("indexWebEntity id: " + id);
        try {
            WebEntity webEntity = null;
            boolean updating = false;

            // id has a value
            if(StringUtils.isNotEmpty(id)) {
                logger.debug("id is not null, retrieving existing webentity");
                // retieve webEntity with that id
                webEntity = retrieveWebEntity(id);
                if(logger.isDebugEnabled()) {
                    if(webEntity != null) {
                        logger.debug("webentity found");
                    }
                    else {
                        logger.debug("did not find webentity with id " + id);
                    }
                }
            }
            // id has no value or no webentity found with that id: create new
            if(webEntity == null) {
                logger.debug("creating new webentity");
                webEntity = new WebEntity();
                webEntity.setLRUlist(new ArrayList<String>());
            }
            else {
                logger.debug("updating webentity with id " + id);
                updating = true;
            }
            webEntity.addToLRUlist(lruItem.getLru());

            // update: first delete old webentity
            if(updating) {
                logger.debug("deleting existing webentity with id " + id);
                Query q = findWebEntityQuery(id);
                this.indexWriter.deleteDocuments(q);
                this.indexWriter.commit();
            }
            logger.debug("indexing webentity");
            Document webEntityDocument = IndexConfiguration.WebEntityDocument(webEntity);
            this.indexWriter.addDocument(webEntityDocument);
            this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            this.indexWriter.commit();
            this.indexSearcher = new IndexSearcher(this.indexReader);

            // return id of indexed webentity
            String indexedId = webEntityDocument.get(IndexConfiguration.FieldName.ID.name());
            logger.debug("indexed webentity with id " + id);
            return indexedId;

        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

    /**
     * Adds a single WebEntityCreationRule to the index.
     *
     * @param webEntityCreationRule
     * @throws IndexException hmm
     */
    public void indexWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws IndexException{
        try {
            Document webEntityCreationRuleDocument = IndexConfiguration.WebEntityCreationRuleDocument(webEntityCreationRule);
            this.indexWriter.addDocument(webEntityCreationRuleDocument);
            this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            this.indexWriter.commit();
            this.indexSearcher = new IndexSearcher(this.indexReader);
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
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
     * @throws Exception
     */
    public void batchIndex(List<?> objects) throws Exception {
        if(CollectionUtils.isEmpty(objects)) {
            logger.info("batchIndex received batch of 0 objects");
            return;
        }
        int batchSize = objects.size();
        logger.debug("batchIndex processing # " + batchSize + " objects");

        long startRAMIndexing = System.currentTimeMillis();

        List<RAMDirectory> ramDirectories = new ArrayList<RAMDirectory>();
        List<ScheduledFuture> indexTasks = new ArrayList<ScheduledFuture>();
        long delay = 0;
        int processedSoFar = 0;
        while(processedSoFar < batchSize) {
            List<?> batch;
            if(batchSize >= processedSoFar + INDEXWRITER_MAX) {
                batch = objects.subList(processedSoFar, processedSoFar + INDEXWRITER_MAX);
            }
            else {
                batch = objects.subList(processedSoFar, objects.size());
            }
            RAMDirectory ramDirectory = new RAMDirectory();
            ramDirectories.add(ramDirectory);
            logger.debug("about to create index task with RAMBUFFERSIZE " + RAM_BUFFER_SIZE_MB);
            logger.debug("before creating there are now # " + indexTasks.size() + " index tasks");
            ScheduledFuture indexTask = executorService.schedule(
                    new AsyncIndexWriterTask(UUID.randomUUID().toString(), batch, ramDirectory, LUCENE_VERSION,
                            OPEN_MODE, RAM_BUFFER_SIZE_MB, analyzer),
                    delay, TimeUnit.SECONDS);
            indexTasks.add(indexTask);
            logger.debug("there are now # " + indexTasks.size() + " index tasks");
            processedSoFar += INDEXWRITER_MAX;
        }

        while(! allDone(indexTasks)) {
            // wait a bit
            try {
                Thread.sleep(500);
            }
            catch (InterruptedException x) {
                x.printStackTrace();
            }
        }

        if(logger.isDebugEnabled()) {
            long endRAMIndexing = System.currentTimeMillis();
            float duration = (endRAMIndexing - startRAMIndexing);
            float throughput = ((float) batchSize / duration) * 1000;
            logger.debug("Indexed # " + batchSize + " objects in " + duration + " ms, that's " + throughput + " docs/second");
        }

        long start2 = System.currentTimeMillis();

        RAMDirectory[] ramsj = ramDirectories.toArray(new RAMDirectory[ramDirectories.size()]);
        logger.debug("# docs in filesystem index before adding the newly indexed objects: " + this.indexWriter.numDocs());
        this.indexWriter.addIndexes(ramsj);
        logger.debug("# docs in filesystem index after adding the newly indexed objects: " + this.indexWriter.numDocs());

        this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
        this.indexWriter.commit();
        this.indexSearcher = new IndexSearcher(this.indexReader);

        if(logger.isDebugEnabled()) {
            long end2 = System.currentTimeMillis();
            float duration2 = (end2 - start2);
            logger.debug("Syncing RAM indexes to filesystem index took " + duration2 + " ms");
        }
    }

    /**
     * Retrieves all precision exceptions.
     * @return
     */
    public List<String> retrievePrecisionExceptions() throws IndexException {
        try {
            List<String> results = new ArrayList<String>();
            Term term = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.PRECISION_EXCEPTION.name());
            TermDocs termDocs = this.indexReader.termDocs(term);
            while(termDocs.next()) {
                Document precisionExceptionDoc = indexReader.document(termDocs.doc());
                String precisionExceptionFound = precisionExceptionDoc.get(IndexConfiguration.FieldName.LRU.name());
                results.add(precisionExceptionFound);
            }
            termDocs.close();
            return results;
        }
        catch(Exception x) {
            throw new IndexException(x);
        }
    }

    /**
     * Query to search for WebEntity by ID.
     *
     * @param id
     * @return
     */
    private Query findWebEntityQuery(String id) {
        Term isWebEntity = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY.name());
        Term idTerm = new Term(IndexConfiguration.FieldName.ID.name(), id);

        BooleanQuery q = new BooleanQuery();
        TermQuery q1 = new TermQuery(isWebEntity);
        TermQuery q2 = new TermQuery(idTerm);
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);

        return q;
    }

    /**
     * Retrieves a particular WebEntity.
     * @param id
     * @return
     */
    public WebEntity retrieveWebEntity(String id) throws IndexException {
        try {
            WebEntity result = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            Query q = findWebEntityQuery(id);
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                logger.debug("found # " + hits.length + " webentities");
                int i = hits[0].doc;
                Document doc = indexSearcher.doc(i);
                result = IndexConfiguration.convertWebEntity(doc);
            }
            if(result != null) {
                logger.debug("retrieved webentity with id " + result.getId());
            }
            else {
                logger.debug("failed to retrieve webentity with id " + id);
            }
            return result;
        }
        catch(Exception x) {
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

    /**
     * Retrieves a particular precision exception.
     * @return
     */
    public String retrievePrecisionException(String precisionException) throws IndexException {
        try {
            String result = null;
            Term isPrecisionException = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.PRECISION_EXCEPTION.name());
            Term lru = new Term(IndexConfiguration.FieldName.LRU.name(), precisionException);
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);

            BooleanQuery q = new BooleanQuery();
            TermQuery q1 = new TermQuery(isPrecisionException);
            TermQuery q2 = new TermQuery(lru);
            q.add(q1, BooleanClause.Occur.MUST);
            q.add(q2, BooleanClause.Occur.MUST);
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                int id = hits[0].doc;
                Document doc = indexSearcher.doc(id);
                result = doc.get(IndexConfiguration.FieldName.LRU.name());
            }
            return result;
        }
        catch(Exception x) {
            throw new IndexException(x);
        }
    }

    public LRUItem retrieveByLRU(String lru) throws IndexException {
        logger.debug("retrieving LRU " + lru);
        try {
            LRUItem result = null;

            Term isLRUTerm = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.LRU_ITEM.name());
            Term lruTerm = new Term(IndexConfiguration.FieldName.LRU.name(), lru);
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);

            BooleanQuery q = new BooleanQuery();
            TermQuery isLRUQuery = new TermQuery(isLRUTerm);
            Query lruQuery;
            // wildcard query
            if(lru.contains("*") || lru.contains("?")) {
                logger.debug("creating wildcard query");
                 lruQuery = new WildcardQuery(lruTerm);
            }
            // no-wildcard query (faster)
            else {
                logger.debug("creating term query");
                lruQuery = new TermQuery(lruTerm);
            }

            q.add(isLRUQuery, BooleanClause.Occur.MUST);
            q.add(lruQuery, BooleanClause.Occur.MUST);

            logger.debug("Lucene query: " + q.toString());
            logger.debug("Lucene query (rewritten): " + q.rewrite(indexReader).toString());

            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            logger.debug("# " + hits.length + " hits");
            if(hits != null && hits.length > 0) {
                int id = hits[0].doc;
                Document doc = indexSearcher.doc(id);
                String foundLRU = doc.get(IndexConfiguration.FieldName.LRU.name());
                if(StringUtils.isNotEmpty(foundLRU)) {
                    result = new LRUItem().setLru(foundLRU);
                }
            }

            /*
            Term term = new Term("lru", lru);

            long start = System.currentTimeMillis();

            Query query;
            // wildcard query
            if(lru.contains("*") || lru.contains("?")) {
                logger.debug("creating wildcard query");
                query = new WildcardQuery(term);
            }
            // no-wildcard query (faster)
            else {
                logger.debug("creating term query");
                query = new TermQuery(term);
            }
            logger.debug("Lucene query: " + query.toString());
            logger.debug("Lucene query (rewritten): " + query.rewrite(indexReader).toString());

            TopDocs topDocs = this.indexSearcher.search(query, 10);
            if(topDocs.scoreDocs.length > 0) {
                result = new LRUItem().setLru(topDocs.scoreDocs[0].toString());
            }

            long end = System.currentTimeMillis();
            float time = (float) end - start;
            logger.debug("method 1 finished in " + time + " ms");

            logger.debug("retrieveByLRU found # " + topDocs.totalHits + " matches");

            start = System.currentTimeMillis();

            TermDocs termDocs = this.indexReader.termDocs(term);
			if(termDocs.next()) {
				Document lruItemDoc = indexReader.document(termDocs.doc());
				String lruFound = lruItemDoc.get("lru");
				result = new LRUItem().setLru(lruFound);
			}
			termDocs.close();

            end = System.currentTimeMillis();
            time = (float) end - start;
            logger.debug("method 2 finished in " + time + " ms");

            */

            return result;
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }

    }

    /**
     * Returns total number of documents in the index.
     *
     * @return total number of docs in index
     * @throws Exception hmm
     */
    public int indexCount() throws Exception {
        try {
            //MatchAllDocsQuery matchAllDocsQuery = new MatchAllDocsQuery();
            //TotalHitCountCollector totalHitCountCollector = new TotalHitCountCollector();
            //this.indexSearcher.search(matchAllDocsQuery, totalHitCountCollector);
            //return totalHitCountCollector.getTotalHits();
            return indexWriter.numDocs();
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw x;
        }
    }

}