package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.KeywordAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.CorruptIndexException;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.LogByteSizeMergePolicy;
import org.apache.lucene.index.LogMergePolicy;
import org.apache.lucene.index.Term;
import org.apache.lucene.index.TermDocs;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.Collector;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.Scorer;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 *
 * @author heikki doeleman
 */
public class LRUIndex {

    private static Logger logger = LoggerFactory.getLogger(LRUIndex.class);

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
            //logger.debug("creating new LRUIndex object");
            instance = new LRUIndex(path, openMode);
        }
        else {
            //logger.debug("returning existing LRUIndex object");
        }
        return instance;
    }
    @Override
    public Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException();
    }
    //
    // end singleton-ness
    //

    /**
     * Clears the index and re-opens indexreader and indexsearcher.
     *
     * @throws IndexException hmm
     */
    public synchronized void clearIndex() throws IndexException {
        try {
            logger.debug("clearing index");
            this.indexWriter.deleteAll();
            this.indexWriter.commit();
            this.indexReader = IndexReader.open(this.indexWriter, false);
            this.indexSearcher = new IndexSearcher(this.indexReader);
            logger.debug("index now has # " + indexCount() + " documents");
        }
        catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

    /**
     *
     * @param path path to the index
     * @param openMode how to open
     */
	private LRUIndex(String path, IndexWriterConfig.OpenMode openMode) {
        logger.info("creating LRUIndex, openMode is " + openMode.name() + ", path to Lucene index is " + path);
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
            FSDirectory diskDirectory = FSDirectory.open(indexDirectory);
            logger.debug("creating IndexWriter");
            this.indexWriter = createIndexWriter(diskDirectory);
            logger.debug("creating IndexReader");
            this.indexReader = IndexReader.open(this.indexWriter, false);
            logger.debug("creating IndexSearcher");
            this.indexSearcher = new IndexSearcher(this.indexReader);
            logger.info("successfully created LRUIndex");
        }
        catch(IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new ExceptionInInitializerError("can't create Lucene index, error: " + x.getMessage());
        }
        catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new ExceptionInInitializerError("can't create Lucene index, error: " + x.getMessage());
        }
        catch(IOException x) {
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
        LogMergePolicy logMergePolicy = new LogByteSizeMergePolicy();
        logMergePolicy.setUseCompoundFile(false);
        indexWriterConfig.setMergePolicy(logMergePolicy);
        try {
            return new IndexWriter(diskDirectory, indexWriterConfig);
        }
        catch(IOException x) {
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
                logger.warn("not all threads terminated after 30s");
                executorService.shutdownNow();
            }
            // pool didn't terminate after the second try
            if(!executorService.awaitTermination(30, TimeUnit.SECONDS)) {
                logger.warn("not all threads terminated after 60s. Not waiting any longer.");
            }
        }
        catch (InterruptedException x) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
	}

    /**
      * Adds or updates a WebEntity to the index. If ID is not empty, the existing WebEntity with that ID is retrieved
      * and this LRU is added to it; if no existing WebEntity with that ID is found, or if ID is empty, a new WebEntity
      * is created.
      *
      * TODO distinguish adding to LRUs or replacing LRUS in updates
      *
      * @param webEntity the webentity to index
      * @throws IndexException hmm
     * @return id of indexed webentity
      */
     public String indexWebEntity(WebEntity webEntity) throws IndexException{
         logger.debug("indexWebEntity");
         if(webEntity == null) {
             throw new IndexException("WebEntity is null");
         }
         if(CollectionUtils.isEmpty(webEntity.getLRUSet())) {
             throw new IndexException("WebEntity has empty lru set");
         }
         try {
             boolean updating = false;
             String id = webEntity.getId();

             // id has no value: create new
            if(StringUtils.isEmpty(id)) {
                 logger.debug("indexing webentity with id null (new webentity will be created)");
             }
             // id has a value
             else {
                 logger.debug("indexing webentity with id " + id);
                 // retieve webEntity with that id
                 WebEntity toUpdate = retrieveWebEntity(id);
                 if(toUpdate != null) {
                     logger.debug("webentity found");
                     updating = true;
                     // 'merge' existing webentity with the one requested for indexing: lrus may be added
                     webEntity.getLRUSet().addAll(toUpdate.getLRUSet());
                 }
                 else {
                     logger.debug("did not find webentity with id " + id + " (new webentity will be created)");
                     updating = false;
                 }
            }

             if(updating) {
                // delete old webentity before indexing
                 logger.debug("deleting existing webentity with id " + id);
                 Query q = findWebEntityQuery(id);
                 this.indexWriter.deleteDocuments(q);
                 this.indexWriter.commit();
            }

             Document webEntityDocument = IndexConfiguration.WebEntityDocument(webEntity);
             this.indexWriter.addDocument(webEntityDocument);
             this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
             this.indexWriter.commit();
             this.indexSearcher = new IndexSearcher(this.indexReader);

             // return id of indexed webentity
             String indexedId = webEntityDocument.get(IndexConfiguration.FieldName.ID.name());
             logger.debug("indexed webentity with id " + indexedId);
             return indexedId;

         }
        catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
        catch(IOException x) {
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
     * @param pageItem
     * @throws IndexException hmm
     */
    public String indexWebEntity(String id, PageItem pageItem) throws IndexException{
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
                        logger.debug("found webentity has # " + webEntity.getLRUSet().size() + " lrus");
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
                webEntity.setLRUSet(new HashSet<String>());
            }
            else {
                logger.debug("updating webentity with id " + id);
                updating = true;
            }
            webEntity.addToLRUSet(pageItem.getLru());

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
            logger.debug("indexed webentity with id " + indexedId);
            return indexedId;

        }
        catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
    }

    /**
     * Adds or updates a single WebEntityCreationRule to the index. If the rule's LRU is empty, it is set as the
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
            boolean update = false;
            WebEntityCreationRule existing = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            Query q = findWebEntityCreationRuleQuery(webEntityCreationRule.getLRU());
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                logger.debug("found # " + hits.length + " existing webentitycreationrules with lru " + webEntityCreationRule.getLRU());
                int i = hits[0].doc;
                Document doc = indexSearcher.doc(i);
                existing = IndexConfiguration.convertLuceneDocument2WebEntityCreationRule(doc);
            }
            if(existing != null) {
                update = true;
            }

            // update: first delete old webentitycreationrule
            if(update) {
                logger.debug("deleting existing webentitycreationrule with lru " + webEntityCreationRule.getLRU());
                this.indexWriter.deleteDocuments(q);
                this.indexWriter.commit();
            }

            Document webEntityCreationRuleDocument = IndexConfiguration.WebEntityCreationRuleDocument(webEntityCreationRule);
            this.indexWriter.addDocument(webEntityCreationRuleDocument);
            this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            this.indexWriter.commit();
            this.indexSearcher = new IndexSearcher(this.indexReader);
        }
        catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
        catch(IOException x) {
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
     * @return number of indexed objects
     * @throws Exception
     */
    public int batchIndex(List<Object> objects) throws IndexException {
        try {
            if(CollectionUtils.isEmpty(objects)) {
                logger.info("batchIndex received batch of 0 objects");
                return 0;
            }
            int batchSize = objects.size();
            logger.debug("batchIndex processing # " + batchSize + " objects");

            long startRAMIndexing = System.currentTimeMillis();

            Set<RAMDirectory> ramDirectories = new HashSet<RAMDirectory>();
            Set<ScheduledFuture> indexTasks = new HashSet<ScheduledFuture>();
            long delay = 0;
            int processedSoFar = 0;
            while(processedSoFar < batchSize) {
                List<Object> batch = new ArrayList<Object>();
                int INDEXWRITER_MAX = 250000;
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
            return batchSize;
        }
        catch (CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
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
        catch(CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
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
                result = IndexConfiguration.convertLuceneDocument2WebEntity(doc);
            }
            if(result != null) {
                logger.debug("retrieved webentity with id " + result.getId());
            }
            else {
                logger.debug("failed to retrieve webentity with id " + id);
            }
            return result;
        }
        catch(CorruptIndexException x) {
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
        catch (IOException x) {
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves all webentities.
     * @return
     */
    public Set<WebEntity> retrieveWebEntities() throws IndexException {
        try {
            Set<WebEntity> result = new HashSet<WebEntity>();
            Term isWebEntity = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY.name());
            TermQuery q = new TermQuery(isWebEntity);
            final List<Document> hits2 = new ArrayList<Document>();
            indexSearcher.search(q, new Collector() {
                private IndexReader reader;
                @Override
                public void setScorer(Scorer scorer) throws IOException {}

                @Override
                public void collect(int doc) throws IOException {
                    hits2.add(reader.document(doc));
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
            for(Document hit: hits2) {
                    WebEntity webEntity = IndexConfiguration.convertLuceneDocument2WebEntity(hit);
                    result.add(webEntity);
            }
            logger.debug("retrieved # " + result.size() + " webentities from index");
            return result;
        }
        catch(IOException x) {
            throw new IndexException(x.getMessage(), x);
        }
    }

    public Set<WebEntityCreationRule> retrieveWebEntityCreationRules() throws IndexException {
        try {
            Set<WebEntityCreationRule> result = new HashSet<WebEntityCreationRule>();
            Term isWebEntityCreationRule = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_CREATION_RULE.name());
            TermQuery q = new TermQuery(isWebEntityCreationRule);
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
            for(Document hit: hits) {
                    WebEntityCreationRule webEntityCreationRule = IndexConfiguration.convertLuceneDocument2WebEntityCreationRule(hit);
                    result.add(webEntityCreationRule);
            }
            logger.debug("retrieved # " + result.size() + " WebEntityCreationRules from index");
            return result;
        }
        catch(IOException x) {
            throw new IndexException(x.getMessage(), x);
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
            throw new IndexException(x.getMessage(), x);
        }
    }

    public PageItem retrieveByLRU(String lru) throws IndexException {
        logger.debug("retrieving LRU " + lru);
        try {
            PageItem result = null;

            Term isLRUTerm = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.PAGE_ITEM.name());
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
                    result = new PageItem().setLru(foundLRU);
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
     *
     * @param webEntityCreationRule
     * @throws IndexException hmm
     */
    public void deleteWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws IndexException {
        try {
            logger.debug("deleting webEntityCreationRule with LRU " + webEntityCreationRule.getLRU());
            Query q = findWebEntityCreationRuleQuery(webEntityCreationRule.getLRU());
            this.indexWriter.deleteDocuments(q);
            this.indexWriter.commit();
            IndexReader maybeChanged = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            // if not changed, that returns null
            if(maybeChanged != null) {
                this.indexReader = maybeChanged;
                this.indexSearcher = new IndexSearcher(this.indexReader);
            }
        }
        catch (CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @param lru
     * @return
     */
    private Query findWebEntityCreationRuleQuery(String lru) {
        if(lru == null) {
            lru = IndexConfiguration.DEFAULT_WEBENTITY_CREATION_RULE;
        }
        Term isWebEntityCreationRule = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_CREATION_RULE.name());
        Term lruTerm = new Term(IndexConfiguration.FieldName.LRU.name(), lru);
        BooleanQuery q = new BooleanQuery();
        TermQuery q1 = new TermQuery(isWebEntityCreationRule);
        TermQuery q2 = new TermQuery(lruTerm);
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        return q;
    }

    /**
     * Returns a map of matching LRUPrefixes and their WebEntity. If the same LRUPrefix occurs in more than one
     * WebEntity, they are all mapped.
     *
     * @param lru
     * @return
     * @throws IndexException
     */
    public Map<String, Set<WebEntity>> findMatchingWebEntityLRUPrefixes(String lru) throws IndexException {
        Map<String, Set<WebEntity>> matches = new HashMap<String, Set<WebEntity>>();
        if(!StringUtils.isEmpty(lru)) {
            Set<WebEntity> allWebEntities = retrieveWebEntities();
            for(WebEntity webEntity : allWebEntities) {
                Set<String> lruPrefixes = webEntity.getLRUSet();
                for(String lruPrefix : lruPrefixes) {
                    // TODO is it inefficient to compile these patterns everytime ? Better to keep them in memory ?

                    // lruPrefixes must escape |
                    String pipe = "\\|";
                    Pattern pipePattern = Pattern.compile(pipe);
                    Matcher pipeMatcher = pipePattern.matcher(lruPrefix);
                    String escapedPrefix = pipeMatcher.replaceAll("\\\\|");

                    Pattern pattern = Pattern.compile(escapedPrefix);
                    Matcher matcher = pattern.matcher(lru);
                    // it's  a match
                    if(matcher.find()) {
                        Set<WebEntity> webEntitiesWithPrefix = matches.get(lruPrefix);
                        if(webEntitiesWithPrefix == null) {
                            webEntitiesWithPrefix = new HashSet<WebEntity>();
                        }
                        webEntitiesWithPrefix.add(webEntity);
                        matches.put(lruPrefix, webEntitiesWithPrefix);
                    }
                }
            }
        }
        return matches;
    }

    public Map<String, Set<WebEntityCreationRule>> findMatchingWebEntityCreationRuleLRUPrefixes(String lru) throws IndexException {
        logger.debug("findMatchingWebEntityCreationRuleLRUPrefixes");
        Map<String, Set<WebEntityCreationRule>> matches = new HashMap<String, Set<WebEntityCreationRule>>();
        if(!StringUtils.isEmpty(lru)) {
            Set<WebEntityCreationRule> allWebEntityCreationRules = retrieveWebEntityCreationRules();
            for(WebEntityCreationRule webEntityCreationRule : allWebEntityCreationRules) {
                String lruPrefix = webEntityCreationRule.getLRU();
                // TODO is it inefficient to compile these patterns everytime ? Better to keep them in memory ?
                // lruPrefix must escape |
                String pipe = "\\|";
                Pattern pipePattern = Pattern.compile(pipe);
                Matcher pipeMatcher = pipePattern.matcher(lruPrefix);
                String escapedPrefix = pipeMatcher.replaceAll("\\\\|");

                Pattern pattern = Pattern.compile(escapedPrefix);
                Matcher matcher = pattern.matcher(lru);
                // it's  a match
                if(matcher.find()) {
                    Set<WebEntityCreationRule> webEntityCreationRulesWithPrefix = matches.get(lruPrefix);
                    if(webEntityCreationRulesWithPrefix == null) {
                        webEntityCreationRulesWithPrefix = new HashSet<WebEntityCreationRule>();
                    }
                    webEntityCreationRulesWithPrefix.add(webEntityCreationRule);
                    matches.put(lruPrefix, webEntityCreationRulesWithPrefix);
                }
            }
        }
        logger.debug("findMatchingWebEntityCreationRuleLRUPrefixes returns # " + matches.size() + " matches");
        return matches;
    }
}