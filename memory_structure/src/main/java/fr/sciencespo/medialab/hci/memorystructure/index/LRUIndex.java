package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.ObjectNotFoundException;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntity;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityCreationRule;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityLink;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
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

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
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

    private static DynamicLogger logger = new DynamicLogger(LRUIndex.class);

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

    private Set<String> alreadyExistingWebEntityLRUs(String newId, Set<String> lrus) throws IndexException {
        Set<String> result = new HashSet<String>();
        Set<WebEntity> existingWebEntities = retrieveWebEntities();
        for(WebEntity webEntity : existingWebEntities) {
            if(StringUtils.isNotEmpty(newId) && webEntity.getId().equals(newId)) {
                continue;
            }
            Set<String> existingLRUs = webEntity.getLRUSet();
            Set intersection = new HashSet(lrus);
            intersection.retainAll(existingLRUs);
            result.addAll(intersection);
        }
        logger.debug("found # " + result.size() + " already existing webentity lrus");
        return result;
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
         //
         // validation
         //
         if(webEntity == null) {
             throw new IndexException("WebEntity is null");
         }
         if(CollectionUtils.isEmpty(webEntity.getLRUSet())) {
             throw new IndexException("WebEntity has empty lru set");
         }
         // Ensure a webEntity lruprefix is unique in the web entity index
         Set<String> existing = alreadyExistingWebEntityLRUs(webEntity.getId(), webEntity.getLRUSet());
         if(existing.size() > 0) {
             throw new IndexException("WebEntity contains already existing LRUs: " + existing);
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
     * Updates a WebEntity to the index.
     *
     * @param id
     * @param lru
    * @throws IndexException hmm
    * @throws ObjectNotFoundException hmm
    * @return
     */
    public String indexWebEntity(String id, String lru) throws IndexException, ObjectNotFoundException {
        logger.debug("updating indexWebEntity with id: " + id);
        try {
            // validation
            if(StringUtils.isEmpty(id)) {
                throw new IndexException("indexWebEntity received empty id");
            }
            if(StringUtils.isEmpty(lru)) {
                throw new IndexException("indexWebEntity received empty lru");
            }
             // Ensure a webEntity lruprefix is unique in the web entity index
             Set<String> newLRU = new HashSet<String>();
             newLRU.add(lru);
             Set<String> existing = alreadyExistingWebEntityLRUs(id, newLRU);
             if(existing.size() > 0) {
                 throw new IndexException("WebEntity contains already existing LRUs: " + existing);
             }


            // retieve webEntity with that id
            WebEntity webEntity = retrieveWebEntity(id);

            // no webentity found with that id
            if(webEntity == null) {
                throw new ObjectNotFoundException().setMsg("Could not find WebEntity with id " + id);
            }
            webEntity.addToLRUSet(lru);

            // update: first delete old webentity
            logger.debug("deleting existing webentity with id " + id);
            Query q = findWebEntityQuery(id);
            this.indexWriter.deleteDocuments(q);
            this.indexWriter.commit();
            // index new webentity
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


    private String alreadyExistingWebEntityCreationRulePrefixes(String prefix) throws IndexException {
        Set<String> result = new HashSet<String>();
        Set<WebEntityCreationRule> existingWebEntityCreationRules = retrieveWebEntityCreationRules();
        for(WebEntityCreationRule webEntityCreationRule : existingWebEntityCreationRules) {
            String existingPrefix = webEntityCreationRule.getLRU();
            if(existingPrefix.equals(prefix)) {
                logger.debug("found already existing webentity creation rule prefix: " + prefix);
                return prefix;
            }
        }
        return null;
    }

    /**
     * Adds or updates a single WebEntityCreationRule to the index. If the rule's LRU is empty, it is set as the
     * default rule. If there exists already a rule with this rule's LRU, it is updated.
     *
     * @param webEntityCreationRule
     * @throws IndexException hmm
     */
    public void indexWebEntityCreationRule(WebEntityCreationRule webEntityCreationRule) throws IndexException{
        //
        // validation
        //
        if(webEntityCreationRule == null) {
            throw new IndexException("webEntityCreationRule is null");
        }
        // Ensure a LRU webEntity creation rule prefix is unique in the web entity creation rule index
        String existingPrefix = alreadyExistingWebEntityCreationRulePrefixes(webEntityCreationRule.getLRU());
        if(existingPrefix != null) {
            throw new IndexException("WebEntityCreationRule has already existing LRU prefix: " + existingPrefix);
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
                                OPEN_MODE, RAM_BUFFER_SIZE_MB, analyzer, LRUIndex.getInstance()),
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
     * Retrieves a particular NodeLink.
     *
     * @param nodeLink
     * @return
     */
    public NodeLink retrieveNodeLink(NodeLink nodeLink) throws IndexException {
        try {
            NodeLink result = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            Query q = findNodeLinkQuery(nodeLink);
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                logger.debug("found # " + hits.length + " nodeLinks");
                int i = hits[0].doc;
                Document doc = indexSearcher.doc(i);
                result = IndexConfiguration.convertLuceneDocument2NodeLink(doc);
            }
            if(result != null) {
                logger.debug("retrieved NodeLink with source " + nodeLink.getSourceLRU() + " and target " + nodeLink.getTargetLRU());
            }
            else {
                logger.debug("failed to retrieve NodeLink with source " + nodeLink.getSourceLRU() + " and target " + nodeLink.getTargetLRU());
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
     * Retrieves all NodeLinks.
     *
     * @return
     * @throws IndexException
     */
   public Set<NodeLink> retrieveNodeLinks() throws IndexException {
       try {
            Set<NodeLink> result = new HashSet<NodeLink>();
            Term isNodeLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.NODE_LINK.name());
            TermQuery q = new TermQuery(isNodeLink);
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
                    NodeLink nodeLink = IndexConfiguration.convertLuceneDocument2NodeLink(hit);
                    result.add(nodeLink);
            }
            logger.debug("retrieved # " + result.size() + " nodelinks from index");
            return result;
        }
        catch(IOException x) {
            throw new IndexException(x.getMessage(), x);
        }
   }

    /**
     * Retrieves all WebEntityLinks.
     *
     * @return
     * @throws IndexException
     */
   public Set<WebEntityLink> retrieveWebEntityLinks() throws IndexException {
       try {
            Set<WebEntityLink> result = new HashSet<WebEntityLink>();
            Query q = findAllWEntityLinksQuery();
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
                    WebEntityLink webEntityLink = IndexConfiguration.convertLuceneDocument2WebEntityLink(hit);
                    result.add(webEntityLink);
            }
            logger.debug("retrieved # " + result.size() + " webentitylinks from index");
            return result;
        }
        catch(IOException x) {
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
            logger.debug("total webentities retrieved from index is  # " + result.size());
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

    protected Set<PageItem> retrievePageItemsByLRUPrefix(String prefix) throws IndexException {
        logger.debug("retrievePageItemsByLRUPrefix: " + prefix);
        try {
            Set<PageItem> results = new HashSet<PageItem>();
            if(prefix == null) {
                logger.warn("attempted to retrieve pageitems with null lruprefix");
                return results;
            }
            Term isPageItemTerm = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.PAGE_ITEM.name());
            Term prefixTerm = new Term(IndexConfiguration.FieldName.LRU.name(), prefix);
            BooleanQuery q = new BooleanQuery();
            TermQuery isPageItemQuery = new TermQuery(isPageItemTerm);
            Query prefixQuery = new WildcardQuery(prefixTerm);
            q.add(isPageItemQuery, BooleanClause.Occur.MUST);
            q.add(prefixQuery, BooleanClause.Occur.MUST);

            logger.debug("Lucene query: " + q.toString());
            logger.debug("Lucene query (rewritten): " + q.rewrite(indexReader).toString());

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
            logger.debug("# hits: " + hits.size());
            for(Document hit: hits) {
                PageItem pageItem = IndexConfiguration.convertLuceneDocument2PageItem(hit);
                results.add(pageItem);
            }
            logger.debug("retrieved # " + results.size() + " PageItems with prefix " + prefix);
            return results;

        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    public PageItem retrievePageItemByLRU(String lru) throws IndexException {
        logger.debug("retrieving PageItem by LRU " + lru);
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

            logger.debug("retrievePageItemByLRU found # " + topDocs.totalHits + " matches");

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
     * @param nodeLink
     * @throws IndexException hmm
     */
    public void deleteNodeLink(NodeLink nodeLink) throws IndexException {
        try {
            logger.debug("deleting nodeLink with source " + nodeLink.getSourceLRU() + " and target " + nodeLink.getTargetLRU());
            Query q = findNodeLinkQuery(nodeLink);
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
     *
     * @param nodeLink
     * @return
     */
    private Query findNodeLinkQuery(NodeLink nodeLink) throws IndexException {
        if(nodeLink == null) {
            throw new IndexException("nodeLink is null");
        }
        Term isWebEntityCreationRule = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.NODE_LINK.name());
        Term sourceTerm = new Term(IndexConfiguration.FieldName.SOURCE.name(), nodeLink.getSourceLRU());
        Term targetTerm = new Term(IndexConfiguration.FieldName.TARGET.name(), nodeLink.getTargetLRU());
        BooleanQuery q = new BooleanQuery();
        TermQuery q1 = new TermQuery(isWebEntityCreationRule);
        TermQuery q2 = new TermQuery(sourceTerm);
        TermQuery q3 = new TermQuery(targetTerm);
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        q.add(q3, BooleanClause.Occur.MUST);
        return q;
    }

    /**
     *
     * @param source
     * @param target
     * @return
     */
    private Query findWebEntityLinkQuery(WebEntity source, WebEntity target) {
        Term isWebEntityLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_LINK.name());
        Term sourceTerm = new Term(IndexConfiguration.FieldName.SOURCE.name(), source.getId());
        Term targetTerm = new Term(IndexConfiguration.FieldName.TARGET.name(), target.getId());
        BooleanQuery q = new BooleanQuery();
        TermQuery q1 = new TermQuery(isWebEntityLink);
        TermQuery q2 = new TermQuery(sourceTerm);
        TermQuery q3 = new TermQuery(targetTerm);
        q.add(q1, BooleanClause.Occur.MUST);
        q.add(q2, BooleanClause.Occur.MUST);
        q.add(q3, BooleanClause.Occur.MUST);
        return q;
    }

    /**
     *
     * @return
     */
    private Query findAllWEntityLinksQuery() {
        Term isWebEntityLink = new Term(IndexConfiguration.FieldName.TYPE.name(), IndexConfiguration.DocType.WEBENTITY_LINK.name());
        return new TermQuery(isWebEntityLink);
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
            matches.putAll(findMatchingWebEntityLRUPrefixes(lru, allWebEntities, "lruPrefix"));
        }
        return matches;
    }

    private Map<String, Set<WebEntity>> findMatchingWebEntityLRUPrefixes(String lru, Set<WebEntity> webEntities, String mode) throws IndexException {
        logger.debug("findMatchingWebEntityLRUs for lru " + lru + " in # " + webEntities.size() + " webEntities");
        Map<String, Set<WebEntity>> matches = new HashMap<String, Set<WebEntity>>();
        if(!StringUtils.isEmpty(lru)) {
            for(WebEntity webEntity : webEntities) {
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
                        logger.debug("found match for lru " + lru + " and regexp " + escapedPrefix);
                        Set<WebEntity> webEntitiesWithPrefix = matches.get(lruPrefix);
                        if(webEntitiesWithPrefix == null) {
                            webEntitiesWithPrefix = new HashSet<WebEntity>();
                        }
                        webEntitiesWithPrefix.add(webEntity);
                        if(mode.equals("lruPrefix")) {
                            matches.put(lruPrefix, webEntitiesWithPrefix);
                        }
                        else if(mode.equals("lru")) {
                            matches.put(lru, webEntitiesWithPrefix);
                        }

                    }
                }
            }
        }
        return matches;
    }

    /**
     * Returns a map of matching LRUPrefixes and their WebEntity. If the same LRUPrefix occurs in more than one
     * WebEntity, they are all mapped.
     *
     * @param lrus
     * @return
     * @throws IndexException
     */
    private Map<String, Set<WebEntity>> findMatchingWebEntityLRUs(Set<String> lrus) throws IndexException {
        logger.debug("finding webentities for # " + lrus.size() + " lrus");
        Map<String, Set<WebEntity>> matches = new HashMap<String, Set<WebEntity>>();
        Set<WebEntity> allWebEntities = retrieveWebEntities();
        for(String lru : lrus) {
            matches.putAll(findMatchingWebEntityLRUPrefixes(lru, allWebEntities, "lru"));
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

    public List<PageItem> findPagesForWebEntity(String id) throws IndexException, ObjectNotFoundException {
        logger.debug("findPagesForWebEntity for id: " + id);
        System.out.println("\n\n\nxxxxx " + id);
        List<PageItem> results = new ArrayList<PageItem>();
        if(StringUtils.isEmpty(id)) {
            return results;
        }
        WebEntity webEntity = retrieveWebEntity(id);
        if(webEntity == null) {
            throw new ObjectNotFoundException().setMsg("Could not find webentity with id: " + id);
        }
        System.out.println("finding pages for web entity " + webEntity.getName());
        Set<WebEntity> allWebEntities = retrieveWebEntities();
        
        for(String prefixFromRequestedWebEntity : webEntity.getLRUSet()) {
            //TODO remove
            //results.addAll(retrievePageItemsByLRUPrefix(prefix + "*"));

            System.out.println("checking prefixFromRequestedWebEntity " + prefixFromRequestedWebEntity + " size " + prefixFromRequestedWebEntity.length());
            Set<PageItem> matches = retrievePageItemsByLRUPrefix(prefixFromRequestedWebEntity + "*");

            for(PageItem match : matches) {
                System.out.println("\nchecking matching page " + match.getLru());
                boolean keepMatch = false;
                boolean stop = false;
                for(WebEntity we : allWebEntities ) {
                    if(stop) break;
                    System.out.println("does it belong to we " + we.getName());
                    for(String lruPrefix : we.getLRUSet()) {
                        if(lruPrefix.length() >= prefixFromRequestedWebEntity.length()) {
                            lruPrefix = lruPrefix + "*";
                            System.out.println("checking we prefix " + lruPrefix);
                            // lruPrefix must escape |
                            String pipe = "\\|";
                            Pattern pipePattern = Pattern.compile(pipe);
                            Matcher pipeMatcher = pipePattern.matcher(lruPrefix);
                            String escapedPrefix = pipeMatcher.replaceAll("\\\\|");

                            Pattern pattern = Pattern.compile(escapedPrefix);
                            Matcher matcher = pattern.matcher(match.getLru());
                            if(matcher.find()) {
                                System.out.println("## " + we.getName() + " " + lruPrefix + " size " + lruPrefix.length() + " " + prefixFromRequestedWebEntity.length() );
                                if(prefixFromRequestedWebEntity.length() < (lruPrefix.length()-1)) {
                                    System.out.println("remote we is longer, don't keep");
                                    stop=true;
                                    break;
                                }
                                else {
                                    System.out.println("remote we is shorter: keep patch");
                                    keepMatch = true;
                                }
                            }
                            else {
                                System.out.println("no match");
                            }
                        }
                        else {
                            System.out.println("lruprefix too short, not checking " + lruPrefix);
                        }
                    }
                }
                if(keepMatch) {
                    results.add(match);
                }
            }
        }

        return results;
    }

    public void generateWebEntityLinks() throws IndexException {
        try {
            logger.debug("generateWebEntityLinks");
            List<WebEntityLink> webEntityLinks = new ArrayList<WebEntityLink>();
            Set<NodeLink> nodeLinks = retrieveNodeLinks();
            logger.debug("total # of nodelinks in index is " + nodeLinks.size());

            //
            // map all source and target LRUs in the Nodelinks to their matching WebEntities
            //
            Set<String> lrus = new HashSet<String>();
            for(NodeLink nodeLink : nodeLinks) {
                logger.debug("nodelink source " + nodeLink.getSourceLRU());
                lrus.add(nodeLink.getSourceLRU());
                logger.debug("nodelink target " + nodeLink.getTargetLRU());
                lrus.add(nodeLink.getTargetLRU());
            }
            logger.debug("total # of source and target LRUs in index is " + lrus.size());

            Map<String, Set<WebEntity>> webEntitiesMap = findMatchingWebEntityLRUs(lrus);
            logger.debug("webEntitiesMap size is # " + webEntitiesMap.size());
            for(String key : webEntitiesMap.keySet()) {
                logger.debug("webEntitiesMap key: " + key);
            }

            //
            // generate WebEntityLinks from NodeLinks
            //
            for(NodeLink nodeLink : nodeLinks) {
                logger.debug("generating webentitylinks for nodelink from " + nodeLink.getSourceLRU() + " to " + nodeLink.getTargetLRU());
                String source = nodeLink.getSourceLRU();
                String target = nodeLink.getTargetLRU();
                Set<WebEntity> sourceWEs = webEntitiesMap.get(source);
                //
                // find source WebEntity
                //
                WebEntity sourceWE;
                if(sourceWEs != null && sourceWEs.size() == 1) {
                    sourceWE = sourceWEs.iterator().next();
                }
                else {
                    if(sourceWEs == null) {
                        logger.error("sourceWEs is null for source " + source);
                        continue;
                    }
                    else {
                        logger.error("# sourceWEs: " + sourceWEs.size());
                        for(WebEntity webEntity : sourceWEs) {
                            logger.error("sourceWebentity: " + webEntity.getName());
                        }
                        throw new IndexException("Found more than 1 WebEntity for source LRU " + source);
                    }
                }
                //
                // find targetWebEntity
                //
                Set<WebEntity> targetWEs = webEntitiesMap.get(target);
                WebEntity targetWE;
                if(targetWEs != null && targetWEs.size() == 1) {
                    targetWE = targetWEs.iterator().next();
                }
                else {
                    if(targetWEs == null) {
                        logger.error("sourceWEs is null for target " + target);
                        continue;
                    }
                    else {
                        logger.error("# targetWEs: " + targetWEs.size());
                        for(WebEntity webEntity : targetWEs) {
                            logger.error("targetWebentity: " + webEntity.getName());
                        }
                        throw new IndexException("Found more than 1 WebEntity for target LRU " + target);
                    }
                }

                //
                // if already exists a link between them, increase weight
                //
                WebEntityLink webEntityLink = null;
                TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
                Query q = findWebEntityLinkQuery(sourceWE, targetWE);
                indexSearcher.search(q, collector);
                ScoreDoc[] hits = collector.topDocs().scoreDocs;
                if(hits != null && hits.length > 0) {
                    logger.debug("\n\n\nfound # " + hits.length + " existing webentitylinks from source " + sourceWE.getId() + " to " + targetWE.getId());
                    int i = hits[0].doc;
                    Document doc = indexSearcher.doc(i);
                    webEntityLink = IndexConfiguration.convertLuceneDocument2WebEntityLink(doc);
                }
                int weight = nodeLink.getWeight();
                Date now = new Date();
                if(webEntityLink != null) {
                    weight += webEntityLink.getWeight();
                    // update: first delete old webentitylink
                    logger.debug("deleting existing webentitylink from source " + sourceWE.getId() + " to " + targetWE.getId());
                    this.indexWriter.deleteDocuments(q);
                    this.indexWriter.commit();
                }
                else {
                    webEntityLink = new WebEntityLink();
                    webEntityLink.setCreationDate(now.toString());
                    webEntityLink.setLastModificationDate(now.toString());
                    webEntityLink.setSourceId(sourceWE.getId());
                    webEntityLink.setTargetId(targetWE.getId());
                }
                webEntityLink.setLastModificationDate(now.toString());
                webEntityLink.setWeight(weight);

                Document webEntityLinkDocument = IndexConfiguration.WebEntityLinkDocument(webEntityLink);

                // TODO index in memory and flush after loop

                logger.debug("@ adding webEntityLinkDocument");
                this.indexWriter.addDocument(webEntityLinkDocument);
                this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
                this.indexWriter.commit();
                this.indexSearcher = new IndexSearcher(this.indexReader);
            }
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }
}