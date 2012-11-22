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
import org.apache.lucene.index.TermDocs;
import org.apache.lucene.index.TieredMergePolicy;
import org.apache.lucene.search.Collector;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.Scorer;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.search.TopScoreDocCollector;
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

    //
    // singleton-ness
    //
    private static LRUIndex instance;
    public synchronized static LRUIndex getInstance(String path, IndexWriterConfig.OpenMode openMode) {
        if(instance == null) {
            //logger.trace("creating new LRUIndex object");
            instance = new LRUIndex(path, openMode);
        }
        else {
            //logger.trace("returning existing LRUIndex object");
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
            if(logger.isDebugEnabled()) {
            	logger.trace("clearing index");
            }
            this.indexWriter.deleteAll();
            //xx this.indexWriter.commit();
            this.indexReader = IndexReader.open(this.indexWriter, false);
            this.indexSearcher = new IndexSearcher(this.indexReader);
            if(logger.isDebugEnabled()) {
                logger.debug("index now has # " + indexCount() + " documents");
            }
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
            logger.info("opening Lucene FileSytemDirectory: " + indexDirectory.getAbsolutePath());
            FSDirectory diskDirectory = FSDirectory.open(indexDirectory);
            logger.trace("creating IndexWriter");
            this.indexWriter = createIndexWriter(diskDirectory);
            logger.trace("creating IndexReader");
            this.indexReader = IndexReader.open(this.indexWriter, false);
            logger.trace("creating IndexSearcher");
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
        
        //LogMergePolicy logMergePolicy = new LogByteSizeMergePolicy();
        //logMergePolicy.setUseCompoundFile(false);
        //indexWriterConfig.setMergePolicy(logMergePolicy);
        
        TieredMergePolicy tieredMergePolicy = new TieredMergePolicy();
        tieredMergePolicy.setUseCompoundFile(true);
        indexWriterConfig.setMergePolicy(tieredMergePolicy);
        
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
                logger.warn("not all threads terminated after 30s, trying to force shutdown");
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
     *
     * @param newId
     * @param lrus
     * @return
     * @throws IndexException hmm
     */
    private Set<String> alreadyExistingWebEntityLRUs(String newId, Set<String> lrus) throws IndexException {
        Set<String> result = new HashSet<String>();
        Set<WebEntity> existingWebEntities = retrieveWebEntities();
        for(WebEntity webEntity : existingWebEntities) {
            if(StringUtils.isNotEmpty(newId) && webEntity.getId().equals(newId)) {
                continue;
            }
            Set<String> existingLRUs = webEntity.getLRUSet();
            Set<String> intersection = new HashSet<String>(lrus);
            intersection.retainAll(existingLRUs);
            result.addAll(intersection);
        }
        if(logger.isDebugEnabled()) {
        	logger.trace("found # " + result.size() + " already existing webentity lrus");
        }
        return result;
    }

    public String indexWebEntity(WebEntity webEntity) throws IndexException{
        return indexWebEntity(webEntity, true);
    }

    /**
      * Adds or updates a WebEntity to the index. If ID is not empty, the existing WebEntity with that ID is retrieved
      * and this LRU is added to it; if no existing WebEntity with that ID is found, or if ID is empty, a new WebEntity
      * is created.
      *
      * TODO distinguish adding to LRUs or replacing LRUS in updates
      *
      * @param webEntity the webentity to index
      * @param checkExisting activates checking whether a webEntity with the same LRUprefix already exists
      * @throws IndexException hmm
      * @return id of indexed webentity
      */
    public String indexWebEntity(WebEntity webEntity, boolean checkExisting) throws IndexException{
        logger.trace("indexWebEntity");
        // validation
        if(webEntity == null) {
            throw new IndexException("WebEntity is null");
        }
        if(CollectionUtils.isEmpty(webEntity.getLRUSet())) {
            throw new IndexException("WebEntity has empty lru set");
        }

        // Ensure a webEntity lruprefix is unique in the web entity index
        if (checkExisting == true) {
            Set<String> existing = alreadyExistingWebEntityLRUs(webEntity.getId(), webEntity.getLRUSet());
            if(existing.size() > 0) {
                logger.error("ERROR / WARNING : WebEntity contains already existing LRUs: " + existing);
                throw new IndexException("WebEntity contains already existing LRUs: " + existing);
            }
        }
        try {
            boolean updating = false;
            String id = webEntity.getId();

            // id has no value: create new
            if(StringUtils.isEmpty(id)) {
                if(logger.isDebugEnabled()) {
                	logger.trace("indexing webentity with id null (new webentity will be created)");
                }
            }
            // id has a value
            else {
                if(logger.isDebugEnabled()) {
                	logger.trace("indexing webentity with id " + id);
                }
                // retrieve webEntity with that id
                WebEntity toUpdate = retrieveWebEntity(id);
                if(toUpdate != null) {
                	logger.trace("webentity found");
                    updating = true;
                } else {
                    if(logger.isDebugEnabled()) {
                    	logger.trace("did not find webentity with id " + id + " (new webentity will be created)");
                    }
                    updating = false;
                }
            }

            if(updating) {
               // delete old webentity before indexing
                if(logger.isDebugEnabled()) {
                	logger.trace("deleting existing webentity with id " + id);
                }
                Query q = LuceneQueryFactory.getWebEntityByIdQuery(id);
                this.indexWriter.deleteDocuments(q);
                this.indexWriter.commit();
            }

            Document webEntityDocument = IndexConfiguration.convertWebEntityToLuceneDocument(webEntity);
            this.indexWriter.addDocument(webEntityDocument);
            this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            //xx this.indexWriter.commit();
            this.indexSearcher = new IndexSearcher(this.indexReader);

            // return id of indexed webentity
            String indexedId = webEntityDocument.get(IndexConfiguration.FieldName.ID.name());
            if(logger.isDebugEnabled()){
            	logger.trace("indexed webentity with id " + indexedId);
            }

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
     *
     * @param prefix prefix to test
     * @return existing prefix or null
     * @throws IndexException hmm
     */
    private String alreadyExistingWebEntityCreationRulePrefixes(String prefix) throws IndexException {
        Set<WebEntityCreationRule> existingWebEntityCreationRules = retrieveWebEntityCreationRules();
        for(WebEntityCreationRule webEntityCreationRule : existingWebEntityCreationRules) {
            String existingPrefix = webEntityCreationRule.getLRU();
            if(existingPrefix.equals(prefix)) {
                if(logger.isDebugEnabled()) {
                	logger.trace("found already existing webentity creation rule prefix: " + prefix);
                }
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
            Query q = LuceneQueryFactory.getWebEntityCreationRuleByLRUQuery(webEntityCreationRule.getLRU());
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                if(logger.isDebugEnabled()) {
                    logger.debug("found # " + hits.length + " existing webentitycreationrules with lru " + webEntityCreationRule.getLRU());
                }
                int i = hits[0].doc;
                Document doc = indexSearcher.doc(i);
                existing = IndexConfiguration.convertLuceneDocumentToWebEntityCreationRule(doc);
            }
            if(existing != null) {
                update = true;
            }

            // update: first delete old webentitycreationrule
            if(update) {
                if(logger.isDebugEnabled()) {
                    logger.debug("deleting existing webentitycreationrule with lru " + webEntityCreationRule.getLRU());
                }
                this.indexWriter.deleteDocuments(q);
                this.indexWriter.commit();
            }

            Document webEntityCreationRuleDocument = IndexConfiguration.convertWebEntityCreationRuleToLuceneDocument(webEntityCreationRule);
            this.indexWriter.addDocument(webEntityCreationRuleDocument);
            this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            //xxthis.indexWriter.commit();
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

    public void deletePageItem(PageItem pageItem) throws IndexException {
        if(logger.isDebugEnabled()) {
            if(logger.isDebugEnabled()) {
                logger.debug("deleting pageitem with url " + pageItem.getUrl());
            }
        }
        try {
            Query q = LuceneQueryFactory.getPageItemByURLQuery(pageItem.getUrl());
            this.indexWriter.deleteDocuments(q);
            this.indexWriter.commit();
        }
        catch (CorruptIndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x);
        }
        catch (IOException x) {
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
                if(logger.isDebugEnabled()) {
                    logger.trace("not all scheduledfutures are done yet");
                }
                return false;
            }
        }
        logger.trace("all scheduledfutures are done");
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

            Set<Object> objectsSet = new HashSet<Object>(objects);

            if(objectsSet.size() != objects.size()) {
                logger.warn("There were # " + (objects.size() - objectsSet.size()) + " duplicates in the batch to index. These were removed.");
                objects = new ArrayList<Object>(objectsSet);
                batchSize = objects.size();
            }

            long startRAMIndexing = System.currentTimeMillis();

            Set<RAMDirectory> ramDirectories = new HashSet<RAMDirectory>();
            Set<ScheduledFuture> indexTasks = new HashSet<ScheduledFuture>();
            long delay = 0;
            int processedSoFar = 0;
            while(processedSoFar < batchSize) {
                List<Object> batch;
                int INDEXWRITER_MAX = 2500;
                if(batchSize >= processedSoFar + INDEXWRITER_MAX) {
                    batch = objects.subList(processedSoFar, processedSoFar + INDEXWRITER_MAX);
                }
                else {
                    batch = objects.subList(processedSoFar, objects.size());
                }
                RAMDirectory ramDirectory = new RAMDirectory();
                ramDirectories.add(ramDirectory);
                if(logger.isDebugEnabled()) {
                    logger.debug("about to create index task with RAMBUFFERSIZE " + RAM_BUFFER_SIZE_MB);
                    logger.debug("before creating task there are already # " + indexTasks.size() + " index tasks");
                }
                ScheduledFuture indexTask = executorService.schedule(
                        new AsyncIndexWriterTask(UUID.randomUUID().toString(), batch, ramDirectory, LUCENE_VERSION,
                                OPEN_MODE, RAM_BUFFER_SIZE_MB, analyzer, LRUIndex.getInstance()),
                        delay, TimeUnit.SECONDS);
                indexTasks.add(indexTask);
                if(logger.isDebugEnabled()) {
                    logger.debug("there are now # " + indexTasks.size() + " index tasks");
                }
                processedSoFar += INDEXWRITER_MAX;
            }

            while(! allDone(indexTasks)) {
                // wait a bit
                try {
                    Thread.sleep(100);
                }
                catch (InterruptedException x) {
                    x.printStackTrace();
                }
            }

            if(logger.isDebugEnabled()) {
                long endRAMIndexing = System.currentTimeMillis();
                float duration = (endRAMIndexing - startRAMIndexing);
                float throughput = ((float) batchSize / duration) * 1000;
                if(logger.isDebugEnabled()) {
                    logger.debug("Indexed # " + batchSize + " objects in " + duration + " ms, that's " + throughput + " docs/second");
                }
            }

            long start2 = System.currentTimeMillis();

            RAMDirectory[] ramsj = ramDirectories.toArray(new RAMDirectory[ramDirectories.size()]);
            if(logger.isDebugEnabled()) {
                logger.debug("# docs in filesystem index before adding the newly indexed objects: " + this.indexWriter.numDocs());
            }
            this.indexWriter.addIndexes(ramsj);
            if(logger.isDebugEnabled()) {
                logger.debug("# docs in filesystem index after adding the newly indexed objects: " + this.indexWriter.numDocs());
            }


            this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            //xx this.indexWriter.commit();
            this.indexSearcher = new IndexSearcher(this.indexReader);

            if(logger.isDebugEnabled()) {
                long end2 = System.currentTimeMillis();
                float duration2 = (end2 - start2);
                if(logger.isDebugEnabled()) {
                    logger.debug("Syncing RAM indexes to filesystem index took " + duration2 + " ms");
                }
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
     * Add precision exceptions.
     * @return
     * @throws IndexException hmm
     */
    public List<String> addPrecisionExceptions(List<String> precisionExceptions) throws IndexException {
        logger.debug("adding precisionexceptions");
        try {

            List<String> results = new ArrayList<String>();
            TermDocs termDocs = this.indexReader.termDocs(LuceneQueryFactory.typeEqualPrecisionException);
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
     * Retrieves all precision exceptions.
     * @return
     * @throws IndexException hmm
     */
    public List<String> retrievePrecisionExceptions() throws IndexException {
        logger.debug("retrieving precisionexceptions");
        try {
            List<String> results = new ArrayList<String>();
            TermDocs termDocs = this.indexReader.termDocs(LuceneQueryFactory.typeEqualPrecisionException);
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
     * Retrieves a particular WebEntity.
     * @param id
     * @return
     * @throws IndexException hmm
     */
    public WebEntity retrieveWebEntity(String id) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntity with id " + id);
        }
        try {
            WebEntity result = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            Query q = LuceneQueryFactory.getWebEntityByIdQuery(id);
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                if(logger.isDebugEnabled()) {
                    logger.debug("found # " + hits.length + " webentities");
                }
                int i = hits[0].doc;
                Document doc = indexSearcher.doc(i);
                result = IndexConfiguration.convertLuceneDocumentToWebEntity(doc);
            }
            if(logger.isDebugEnabled()) {
                if(result != null) {
                    logger.debug("retrieved webentity with name " + result.getName());
                }
                else {
                    logger.debug("failed to retrieve webentity with id " + id);
                }
            }
            return result;
        }
        catch(CorruptIndexException x) {
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
     * Retrieves a particular WebEntityLink.
     * @param id
     * @return
     * @throws IndexException hmm
     */
    public WebEntityLink retrieveWebEntityLink(WebEntityLink webEntityLink) throws IndexException {
        try {
            WebEntityLink result = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            Query q = LuceneQueryFactory.getWebEntityLinkBySourceAndTargetQuery(webEntityLink.getSourceId(), webEntityLink.getTargetId());
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                if(logger.isDebugEnabled()) {
                    logger.debug("found # " + hits.length + " webentitylinks");
                }
                int i = hits[0].doc;
                Document doc = indexSearcher.doc(i);
                result = IndexConfiguration.convertLuceneDocumentToWebEntityLink(doc);
            }
            if(result != null && logger.isDebugEnabled()) {
                logger.debug("retrieved webentitylink with id " + result.getId());
            }
            else {
                logger.debug("failed to retrieve webentitylink");
            }
            return result;
        }
        catch(CorruptIndexException x) {
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
     * Retrieves a particular NodeLink.
     *
     * @param nodeLink
     * @return
     * @throws IndexException hmm
     */
    public NodeLink retrieveNodeLink(NodeLink nodeLink) throws IndexException {
        logger.debug("retrieveNodeLink");
        try {
            NodeLink result = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            Query q = LuceneQueryFactory.getNodeLinkBySourceAndTargetQuery(nodeLink.getSourceLRU(), nodeLink.getTargetLRU());
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                if(logger.isDebugEnabled()) {
                    logger.debug("found # " + hits.length + " nodeLinks");
                }
                int i = hits[0].doc;
                Document doc = indexSearcher.doc(i);
                result = IndexConfiguration.convertLuceneDocumentToNodeLink(doc);
            }
            if(result != null && logger.isDebugEnabled()) {
                logger.debug("retrieved NodeLink with source " + nodeLink.getSourceLRU() + " and target " + nodeLink.getTargetLRU());
            }
            else {
                logger.debug("failed to retrieve NodeLink with source " + nodeLink.getSourceLRU() + " and target " + nodeLink.getTargetLRU());
            }
            return result;
        }
        catch(CorruptIndexException x) {
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
     * Retrieves all NodeLinks.
     *
     * @return
     * @throws IndexException hmm
     */
   public Set<NodeLink> retrieveNodeLinks() throws IndexException {
       logger.debug("retrieveNodeLinks");
       try {
            Set<NodeLink> result = new HashSet<NodeLink>();
            Query q = LuceneQueryFactory.getNodeLinksQuery();
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                    NodeLink nodeLink = IndexConfiguration.convertLuceneDocumentToNodeLink(hit);
                    result.add(nodeLink);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + result.size() + " nodelinks from index");
            }

            return result;
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
   }

   /**
    * Retrieves nodelinks corresponding to a specific webentity.
    *
    * @param webEntityId
    * @param includeFrontier
    * @return
    * @throws IndexException hmm
    */
   public Set<NodeLink> retrieveWebentityNodeLinks(String webEntityId, Boolean includeFrontier) throws IndexException {
       logger.debug("retrieveNodeLinks");
       try {
           WebEntity webEntity = retrieveWebEntity(webEntityId);
           List<WebEntity> subWebEntities = findSubWebEntities(webEntity);
           Set<NodeLink> result = new HashSet<NodeLink>();
           Query q;
           q = LuceneQueryFactory.getNodeLinksMatchingWebEntityButNotMatchingSubWebEntities(webEntity, subWebEntities, includeFrontier);
           final List<Document> hits = executeMultipleResultsQuery(q);
           for(Document hit: hits) {
               NodeLink nodeLink = IndexConfiguration.convertLuceneDocumentToNodeLink(hit);
               result.add(nodeLink);
           }
           if(logger.isDebugEnabled()) {
               logger.debug("retrieved # " + result.size() + " nodelinks from index");
           }

           return result;
       }
       catch(IOException x) {
           logger.error(x.getMessage());
           x.printStackTrace();
           throw new IndexException(x.getMessage(), x);
       }
   }

    /**
     * Retrieves all WebEntityLinks.
     *
     * @return
     * @throws IndexException hmm
     */
   public Set<WebEntityLink> retrieveWebEntityLinks() throws IndexException {
       logger.debug("retrieveWebEntityLinks");
       try {
            Set<WebEntityLink> result = new HashSet<WebEntityLink>();
            Query q = LuceneQueryFactory.getWebEntityLinksQuery();
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                    WebEntityLink webEntityLink = IndexConfiguration.convertLuceneDocumentToWebEntityLink(hit);
                    result.add(webEntityLink);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + result.size() + " webentitylinks from index");
            }
            return result;
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
   }

    /**
     * Retrieves all webentities.
     * @return
     * @throws IndexException hmm
     */
    public Set<WebEntity> retrieveWebEntities() throws IndexException {
        logger.debug("retrieveWebEntities");
        try {
            Set<WebEntity> result = new HashSet<WebEntity>();
            Query q = LuceneQueryFactory.getWebEntitiesQuery();
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                    WebEntity webEntity = IndexConfiguration.convertLuceneDocumentToWebEntity(hit);
                    result.add(webEntity);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("total webentities retrieved from index is  # " + result.size());
                for(WebEntity we : result) {
                    logger.debug("retrieved web entity: " + we.getName());
                }
            }
            return result;
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves all webentities.
     * @param listIDs
     * @return webentities
     * @throws IndexException hmm
     */
    public Set<WebEntity> retrieveWebEntitiesByIDs(List<String> listIDs) throws IndexException {
        logger.debug("retrieveWebEntitiesByIDs");
        try {
            Set<WebEntity> result = new HashSet<WebEntity>();
            Query q = LuceneQueryFactory.getWebEntitiesByIdsQuery(listIDs);
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                    WebEntity webEntity = IndexConfiguration.convertLuceneDocumentToWebEntity(hit);
                    result.add(webEntity);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("total webentities retrieved is  # " + result.size());
                for(WebEntity we : result) {
                    logger.debug("retrieved web entity: " + we.getName());
                }
            }
            return result;
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @return
     * @throws IndexException hmm
     */
    public Set<WebEntityCreationRule> retrieveWebEntityCreationRules() throws IndexException {
        logger.debug("retrieveWebEntityCreationRules");
        try {
            Set<WebEntityCreationRule> result = new HashSet<WebEntityCreationRule>();
            Query q = LuceneQueryFactory.getWebEntityCreationRulesQuery();
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                    WebEntityCreationRule webEntityCreationRule = IndexConfiguration.convertLuceneDocumentToWebEntityCreationRule(hit);
                    result.add(webEntityCreationRule);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + result.size() + " WebEntityCreationRules from index");
            }
            return result;
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     * Retrieves the default Web Entity Creation Rule.
     *
     * @return
     * @throws IndexException hmm
     */
    public WebEntityCreationRule retrieveDefaultWECR() throws IndexException {
        logger.debug("retrieve default webentity creation rule");
        try {
            WebEntityCreationRule result = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            Query q = LuceneQueryFactory.getDefaultWebEntityCreationRuleQuery();
            indexSearcher.search(q, collector);

            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(hits != null && hits.length > 0) {
                logger.debug("found # " + hits.length + " default webentity creation rules");
                int i = hits[0].doc;
                Document doc = indexSearcher.doc(i);
                result = IndexConfiguration.convertLuceneDocumentToWebEntityCreationRule(doc);
            }
            if(result != null && logger.isDebugEnabled()) {
                logger.debug("retrieved default Web Entity Creation Rule");
            }
            else {
                logger.debug("failed to retrieve default Web Entity Creation Rule");
            }
            return result;
        }
        catch(CorruptIndexException x) {
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
     * @return web entity having prefix in its list of lru prefixes
     * @throws IndexException hmm
     */
    public WebEntity retrieveWebEntityMatchingLRU(String lru) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityMatchingLRU: " + lru);
        }
        try {
            int lastIndex;
            String prefixLRU = lru;
            WebEntity webentity = null;
            final Pattern pattern = Pattern.compile("\\|[shpqft]:");
            while (webentity == null && prefixLRU.length() > 0) {
                webentity = retrieveWebEntityByLRUPrefix(prefixLRU);
                if (webentity == null) {
                    lastIndex = -1;
                    Matcher matcher = pattern.matcher(prefixLRU);
                    while (matcher.find()) {
                        lastIndex = matcher.start();
                    }
                    if (lastIndex != -1) {
                        prefixLRU = prefixLRU.substring(0, lastIndex);
                    } else {
                        prefixLRU = "";
                    }
                }
            }
            return webentity;
        }
        catch (IndexException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @param prefix
     * @return web entity having prefix in its list of lru prefixes
     * @throws IndexException hmm
     */
    public WebEntity retrieveWebEntityByLRUPrefix(String prefix) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityByLRUPrefix: " + prefix);
        }
        try {
            if(prefix == null) {
                logger.warn("attempted to retrieve web entity with null lruprefix");
                return null;
            }
            Query q = LuceneQueryFactory.getWebEntitiesByLRUQuery(prefix);
            final List<Document> hits = executeMultipleResultsQuery(q);
            if (hits.size() != 1) {
                return null;
            }
            WebEntity webEntity = IndexConfiguration.convertLuceneDocumentToWebEntity(hits.get(0));
            return webEntity;
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @param prefix
     * @return
     * @throws IndexException hmm
     */
    public Set<WebEntity> retrieveWebEntitiesStartingByLRUPrefix(String prefix) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntitiesByLRUPrefix: " + prefix);
        }
        try {
            Set<WebEntity> results = new HashSet<WebEntity>();
            if(prefix == null) {
                logger.warn("attempted to retrieve web entities with null lruprefix");
                return results;
            }
            prefix = prefix + "*";
            Query q = LuceneQueryFactory.getWebEntitiesByLRUQuery(prefix);
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                WebEntity webEntity = IndexConfiguration.convertLuceneDocumentToWebEntity(hit);
                results.add(webEntity);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " WebEntities with prefix " + prefix);
            }
            return results;
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @param prefix
     * @return
     * @throws IndexException hmm
     */
    public Set<NodeLink> retrieveNodeLinksBySourcePrefix(String prefix) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveNodeLinksBySourcePrefix: " + prefix);
        }
        try {
            Set<NodeLink> results = new HashSet<NodeLink>();
            if(prefix == null) {
                logger.warn("attempted to retrieve node links with null source prefix");
                return results;
            }
            prefix = prefix + "*";

            Query q = LuceneQueryFactory.getNodeLinksBySourceLRUQuery(prefix);
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                NodeLink nodeLink = IndexConfiguration.convertLuceneDocumentToNodeLink(hit);
                results.add(nodeLink);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " NodeLinks with source prefix " + prefix);
            }
            return results;

        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @param prefix
     * @return
     * @throws IndexException hmm
     */
    public Set<NodeLink> retrieveNodeLinksByTargetPrefix(String prefix) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveNodeLinksByTargetPrefix: " + prefix);
        }
        try {
            Set<NodeLink> results = new HashSet<NodeLink>();
            if(prefix == null) {
                logger.warn("attempted to retrieve node links with null target prefix");
                return results;
            }
            prefix = prefix + "*";
            Query q = LuceneQueryFactory.getNodeLinksByTargetLRUQuery(prefix);
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                NodeLink nodeLink = IndexConfiguration.convertLuceneDocumentToNodeLink(hit);
                results.add(nodeLink);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " NodeLinks with target prefix " + prefix);
            }
            return results;
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @param id
     * @return
     * @throws IndexException hmm
     */
    public Set<WebEntityLink> retrieveWebEntityLinksBySource(String id) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityLinksBySource: " + id);
        }
        try {
            Set<WebEntityLink> results = new HashSet<WebEntityLink>();
            if(id == null) {
                logger.warn("attempted to retrieve web entity links with null source id");
                return results;
            }
            Query q = LuceneQueryFactory.getWebEntityLinksBySourceQuery(id);
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                WebEntityLink webEntityLink = IndexConfiguration.convertLuceneDocumentToWebEntityLink(hit);
                results.add(webEntityLink);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " WebEntityLinks with source id " + id);
            }
            return results;
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @param id
     * @return
     * @throws IndexException hmm
     */
    public Set<WebEntityLink> retrieveWebEntityLinksByTarget(String id) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieveWebEntityLinksByTarget: " + id);
        }
        try {
            Set<WebEntityLink> results = new HashSet<WebEntityLink>();
            if(id == null) {
                logger.warn("attempted to retrieve web entity links with null target id");
                return results;
            }
            Query q = LuceneQueryFactory.getWebEntityLinksByTargetQuery(id);
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                WebEntityLink webEntityLink = IndexConfiguration.convertLuceneDocumentToWebEntityLink(hit);
                results.add(webEntityLink);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " WebEntityLinks with target id " + id);
            }
            return results;
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }



    /**
     *
     * @param prefix
     * @return
     * @throws IndexException hmm
     */
    public Set<PageItem> retrievePageItemsByLRUPrefix(String prefix) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrievePageItemsByLRUPrefix: " + prefix);
        }
        try {
            Set<PageItem> results = new HashSet<PageItem>();
            if(prefix == null) {
                logger.warn("attempted to retrieve pageitems with null lruprefix");
                return results;
            }
            prefix = prefix + "*";
            Query q = LuceneQueryFactory.getPageItemByLRUQuery(prefix);
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                PageItem pageItem = IndexConfiguration.convertLuceneDocumentToPageItem(hit);
                results.add(pageItem);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + results.size() + " PageItems with prefix " + prefix);
            }
            return results;
        }
        catch (IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @param url
     * @return
     * @throws IndexException hmm
     */
    public PageItem retrievePageItemByURL(String url) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieving PageItem by URL " + url);
        }
        Query q = LuceneQueryFactory.getPageItemByURLQuery(url);
        return retrievePageItemByFieldQuery(q);
    }

    /**
     *
     * @param url
     * @return
     * @throws IndexException hmm
     */
    public PageItem retrievePageItemByLRU(String lru) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("retrieving PageItem by LRU " + lru);
        }
        Query q = LuceneQueryFactory.getPageItemByLRUQuery(lru);
        return retrievePageItemByFieldQuery(q);
    }
    
    /**
     *
     * @param fieldQuery
     * @param fieldValue
     * @return
     * @throws IndexException hmm
     */
    public PageItem retrievePageItemByFieldQuery(Query fieldQuery) throws IndexException {
        try {
            PageItem result = null;
            TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
            indexSearcher.search(fieldQuery, collector);
            ScoreDoc[] hits = collector.topDocs().scoreDocs;
            if(logger.isDebugEnabled()) {
                logger.debug("retrieved # " + hits.length + " pageitems");
            }
            if(hits != null && hits.length > 0) {
                int id = hits[0].doc;
                Document doc = indexSearcher.doc(id);
                result = IndexConfiguration.convertLuceneDocumentToPageItem(doc);
            }
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
        if(logger.isDebugEnabled()) {
            logger.debug("deleting webEntityCreationRule with LRU " + webEntityCreationRule.getLRU());
        }
        try {
            Query q = LuceneQueryFactory.getWebEntityCreationRuleByLRUQuery(webEntityCreationRule.getLRU());
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
        if(logger.isDebugEnabled()) {
            logger.debug("deleting nodeLink with source " + nodeLink.getSourceLRU() + " and target " + nodeLink.getTargetLRU());
        }
        deleteObject(LuceneQueryFactory.getNodeLinkBySourceAndTargetQuery(nodeLink.getSourceLRU(), nodeLink.getTargetLRU()));
    }

    /**
     *
     * @param webEntity
     * @throws IndexException hmm
     */
     public void deleteWebEntity(WebEntity webEntity) throws IndexException {
         if(logger.isDebugEnabled()) {
             logger.debug("deleting webEntity with id " + webEntity.getId());
         }
         deleteObject(LuceneQueryFactory.getWebEntityByIdQuery(webEntity.getId()));
     }

   /**
    *
    * @param webEntityLink
    * @throws IndexException hmm
    */
    public void deleteWebEntityLink(WebEntityLink webEntityLink) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("deleting webEntityLink with source " + webEntityLink.getSourceId() + " and target " + webEntityLink.getTargetId());
        }
        deleteObject(LuceneQueryFactory.getWebEntityLinkBySourceAndTargetQuery(webEntityLink.getSourceId(), webEntityLink.getTargetId()));
    }

    /**
    *
    * @param nodeLink
    * @throws IndexException hmm
    */
    public void deleteObject(Query q) throws IndexException {
        try {
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

    public List<PageItem> retrievePageItems() throws IndexException {
        logger.debug("retrievePageItems");
        try {
            List<PageItem> results = new ArrayList<PageItem>();
            Query q = LuceneQueryFactory.getPageItemsQuery();
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                PageItem page = IndexConfiguration.convertLuceneDocumentToPageItem(hit);
                results.add(page);
            }
            return results;
        }
        catch(IOException x)  {
            throw new IndexException(x.getMessage(), x);
        }
    }

    private List<PageItem> findPagesMatchingWebEntityButNotMatchingSubWebEntities(WebEntity webEntity, List<WebEntity> subWebEntities) throws IndexException {
        if(logger.isDebugEnabled()) {
            logger.debug("findPagesMatchingWebEntityButNotMatchingSubWebEntities for webEntity " + webEntity.getName());
        }
        try {
            List<PageItem> results = new ArrayList<PageItem>();
            Query q = LuceneQueryFactory.getPageItemMatchingWebEntityButNotMatchingSubWebEntities(webEntity, subWebEntities);
            final List<Document> hits = executeMultipleResultsQuery(q);
            for(Document hit: hits) {
                PageItem pageItem = IndexConfiguration.convertLuceneDocumentToPageItem(hit);
                results.add(pageItem);
            }
            if(logger.isDebugEnabled()) {
                logger.debug("findPagesMatchingWebEntityButNotMatchingSubWebEntities returns # " + results.size() + " pages:");
                for(PageItem page : results) {
                    logger.debug("page " + page.getLru() + " with id " + page.getId());
                }
            }
            return results;
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

    /**
     *
     * @param id
     * @return
     * @throws IndexException hmm
     * @throws ObjectNotFoundException hmm
     */
    public List<PageItem> findPagesForWebEntity(String id) throws IndexException, ObjectNotFoundException {
        if(logger.isDebugEnabled()) {
            logger.debug("findPagesForWebEntity for id: " + id);
        }
        List<PageItem> results = new ArrayList<PageItem>();
        if(StringUtils.isEmpty(id)) {
            return results;
        }
        WebEntity webEntity = retrieveWebEntity(id);
        if(webEntity == null) {
            throw new ObjectNotFoundException().setMsg("Could not find webentity with id: " + id);
        }

        try {
            List<WebEntity> subWebEntities = findSubWebEntities(webEntity);
            results = findPagesMatchingWebEntityButNotMatchingSubWebEntities(webEntity, subWebEntities);
        }
        catch(IOException x) {
            throw new IndexException(x.getMessage(), x);
        }

        if(logger.isDebugEnabled()) {
            logger.debug("found " + results.size() + " pages for web entity " + webEntity.getName() + ":");
            for(PageItem p : results) {
                logger.debug(p.getLru());
            }
        }
        return results;
    }

    /**
     *
     * @param q
     * @return
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
     * Returns a list of a web-entity's sub-webentities (i.e. those web entities that have at least one prefix which
     * matches one of this web entity's prefixes).
     *
     * @param webEntity
     * @return
     * @throws IOException
     */
    public List<WebEntity> findSubWebEntities(WebEntity webEntity) throws IOException {
        if(logger.isDebugEnabled()) {
            logger.debug("findSubWebEntities for webEntity with name " + webEntity.getName());
        }
        Query q = LuceneQueryFactory.getSubWebEntitiesQuery(webEntity);
        List<Document> hits = executeMultipleResultsQuery(q);
        List<WebEntity> results = new ArrayList<WebEntity>(hits.size());
        for(Document hit: hits) {
            WebEntity subWebEntity = IndexConfiguration.convertLuceneDocumentToWebEntity(hit);
            if (subWebEntity.getId() != webEntity.getId()) {
                results.add(subWebEntity);
            }
        }
        if(logger.isDebugEnabled()) {
            logger.debug("findSubWebEntities for webEntity with name " + webEntity.getName() + " returns # " + results.size() + " subWebEntities:");
            for(WebEntity sub : results) {
                logger.debug("subWebEntity with name " + sub.getName());
            }
        }
        return results;
    }

    /**
     *
     * @throws IndexException hmm
     */
    public void generateWebEntityLinks() throws IndexException {
        try {
            logger.debug("generateWebEntityLinks");
            final Query nodeLinksQuery = LuceneQueryFactory.getNodeLinksQuery();
            final int batchSize = 500000;
            TopDocs results = indexSearcher.search(nodeLinksQuery, null, batchSize);
            final int totalResults = results.totalHits;
            logger.info("total # of nodelinks in index is " + totalResults);
            int doneDocs = 0;
            Map<String, WebEntityLink> webEntityLinksMap = new HashMap<String, WebEntityLink>();
            Map<String, WebEntity> lruToWebEntityMap = new HashMap<String, WebEntity>();
            this.indexWriter.deleteDocuments(LuceneQueryFactory.getWebEntityLinksQuery());
            this.indexWriter.commit();
            this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            this.indexSearcher = new IndexSearcher(this.indexReader);
            while (doneDocs < totalResults) {
                logger.info("Browsing links " + doneDocs + " to " + doneDocs+batchSize);
                results = indexSearcher.search(nodeLinksQuery, null, doneDocs+batchSize);
                ScoreDoc[] scoreDocs = results.scoreDocs;
                for (int i = doneDocs ; i < doneDocs + batchSize && i < totalResults ; i++) {
                    NodeLink nodeLink = IndexConfiguration.convertLuceneDocumentToNodeLink(indexSearcher.doc(scoreDocs[i].doc));
                    if(logger.isDebugEnabled()) {
	                    logger.debug("generating webentitylinks for nodelink from " + nodeLink.getSourceLRU() + " to " + nodeLink.getTargetLRU());
	                }
	                String source = nodeLink.getSourceLRU();
	                WebEntity sourceWE;
	                if (! lruToWebEntityMap.containsKey(source)) {
                        sourceWE = retrieveWebEntityMatchingLRU(source);
                        lruToWebEntityMap.put(source, sourceWE);
                        if (sourceWE == null) {
                            logger.warn("Warning couldn't retrieve WE for LRU source " + source);
                            continue;
                        }
	                } else {
                        sourceWE = lruToWebEntityMap.get(source);
	                }
	                String target = nodeLink.getTargetLRU();
	                WebEntity targetWE;
	                if (! lruToWebEntityMap.containsKey(target)) {
                        targetWE = retrieveWebEntityMatchingLRU(target);
                        lruToWebEntityMap.put(target, targetWE);
                        if (targetWE == null) {
                            logger.warn("Warning couldn't retrieve WE for LRU target " + target);
                            continue;
                        }
	                } else {
                        targetWE = lruToWebEntityMap.get(target);
	                }
	                if (targetWE == null || sourceWE == null) {
                        continue;
	                }
	                //
	                // if already exists a link between them, increase weight
	                //
	                String webEntityLinkId = sourceWE.getId()+"/"+targetWE.getId();
	                WebEntityLink webEntityLink = null;
	                int weight = nodeLink.getWeight();
	                Date now = new Date();
	                if (webEntityLinksMap.containsKey(webEntityLinkId)) {
                        webEntityLink = webEntityLinksMap.get(webEntityLinkId);
                        weight += webEntityLink.getWeight();
	                } else {
		                TopScoreDocCollector collector = TopScoreDocCollector.create(1, false);
		                Query q = LuceneQueryFactory.getWebEntityLinkBySourceAndTargetQuery(sourceWE.getId(), targetWE.getId());
		                indexSearcher.search(q, collector);
		                ScoreDoc[] hits = collector.topDocs().scoreDocs;
		                if(hits != null && hits.length > 0) {
		                    if(logger.isDebugEnabled()) {
		                        logger.debug("found # " + hits.length + " existing webentitylinks from source " + sourceWE.getId() + " to " + targetWE.getId());
		                    }
		                    int j = hits[0].doc;
		                    Document doc = indexSearcher.doc(j);
		                    webEntityLink = IndexConfiguration.convertLuceneDocumentToWebEntityLink(doc);
		                }
		                if(webEntityLink != null) {
		                    weight += webEntityLink.getWeight();
		                }
		                else {
		                    webEntityLink = new WebEntityLink();
		                    webEntityLink.setCreationDate(now.toString());
		                    webEntityLink.setLastModificationDate(now.toString());
		                    webEntityLink.setSourceId(sourceWE.getId());
		                    webEntityLink.setTargetId(targetWE.getId());
		                }
		                webEntityLinksMap.put(webEntityLinkId, webEntityLink);
	                }
	                webEntityLink.setLastModificationDate(now.toString());
	                webEntityLink.setWeight(weight);
                }
                doneDocs += batchSize;
            }
            logger.info("Saving " + webEntityLinksMap.size() + "WebEntityLinks");
            @SuppressWarnings({"unchecked"})
            List<Object> webEntityLinksList = new ArrayList(webEntityLinksMap.values());
            batchIndex(webEntityLinksList);
            logger.debug("saveNodeLinks finished indexing nodeLinks");
        }
        catch(IOException x) {
            logger.error(x.getMessage());
            x.printStackTrace();
            throw new IndexException(x.getMessage(), x);
        }
    }

}
