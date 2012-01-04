package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
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
import org.apache.lucene.search.MatchAllDocsQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.search.TopScoreDocCollector;
import org.apache.lucene.search.TotalHitCountCollector;
import org.apache.lucene.search.WildcardQuery;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.util.Version;

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

	private FSDirectory diskDirectory;
    private final Analyzer analyzer = new KeywordAnalyzer();
    private IndexReader indexReader;
    private IndexSearcher indexSearcher;
    private IndexWriter indexWriter;

    /**
     * Execution service used for asynchronous batch index tasks.
     */
    private static ScheduledExecutorService executionService = Executors.newScheduledThreadPool(2);

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

    /**
     *
     * @param path
     */
	private LRUIndex(String path, IndexWriterConfig.OpenMode openMode) {
        System.out.println("creating LRUIndex");
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
            System.out.println("opening FSDirectory");
            this.diskDirectory = FSDirectory.open(indexDirectory);
            System.out.println("creating IndexWriter");
            this.indexWriter = createIndexWriter(this.diskDirectory);
            System.out.println("creating IndexReader");
            this.indexReader = IndexReader.open(this.indexWriter, false);
            System.out.println("creating IndexSearcher");
            this.indexSearcher = new IndexSearcher(indexReader);
            System.out.println("successfully created LRUIndex");
        }
        catch(Exception x) {
            System.err.println(x.getMessage());
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
        System.out.println("close: closing IndexReader and IndexWriter");
		if(indexReader != null) {
			indexReader.close();
		}
		if(indexWriter != null) {
			indexWriter.close();
		}
        executionService.shutdown();
	}

    /**
     * Adds a single PrecisionException to the index.
     *
     * @param precisionException
     * @throws IndexException hmm
     */
    public void indexPrecisionException(String precisionException) throws IndexException{
        try {
            Document precisionExceptionDocument = IndexConfiguration.PrecisionLimitDocument(precisionException);
            this.indexWriter.addDocument(precisionExceptionDocument);
            this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
            this.indexWriter.commit();
            this.indexSearcher = new IndexSearcher(this.indexReader);
        }
        catch(Exception x) {
            throw new IndexException(x);
        }
    }

    /**
     * Returns whether all schedulesFutures are done.
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
        if(objects == null || objects.size() == 0) {
            return;
        }
        int number = objects.size();
        System.out.println("batchIndex processing # " + number + " objects");

        long start = System.currentTimeMillis();

        int INDEXWRITER_MAX = 250000;
        List<RAMDirectory> ramDirectories = new ArrayList<RAMDirectory>();
        List<ScheduledFuture> scheduledFutures = new ArrayList<ScheduledFuture>();
        long delay = 0;
        int processedNumber = 0;
        while(processedNumber < number) {
            List<?> batch;
            if(number >= processedNumber + INDEXWRITER_MAX) {
                batch = objects.subList(processedNumber, processedNumber + INDEXWRITER_MAX);
            }
            else {
                batch = objects.subList(processedNumber, objects.size());
            }
            RAMDirectory ramDirectory = new RAMDirectory();
            ramDirectories.add(ramDirectory);
            ScheduledFuture scheduledFuture = executionService.schedule(new AsyncIndexWriterTask(UUID.randomUUID().toString(), batch,
                    ramDirectory, LUCENE_VERSION, OPEN_MODE, RAM_BUFFER_SIZE_MB, analyzer), delay, TimeUnit.SECONDS);
            scheduledFutures.add(scheduledFuture);
            processedNumber += INDEXWRITER_MAX;
        }

        while(! allDone(scheduledFutures)) {
            // wait a bit
            try {
                Thread.sleep(500);
            }
            catch (InterruptedException x) {
                x.printStackTrace();
            }
        }

        long end = System.currentTimeMillis();
        float duration = (end - start);
        float throughput = ((float) number / duration) * 1000;
        System.out.println("Indexed # " + number + " objects in " + duration + " ms, that's " + throughput + " docs/second");

        long start2 = System.currentTimeMillis();
        RAMDirectory[] ramsj = ramDirectories.toArray(new RAMDirectory[ramDirectories.size()]);
        this.indexWriter.addIndexes(ramsj);
        System.out.println("fsIndexWriter.numDocs(): " + this.indexWriter.numDocs());
        this.indexReader = IndexReader.openIfChanged(this.indexReader, this.indexWriter, false);
        this.indexSearcher = new IndexSearcher(this.indexReader);
        long end2 = System.currentTimeMillis();
        float duration2 = (end2 - start2);
        System.out.println("fs " + duration2 + " ms");
    }

    /**
     * Retrieves all precision exceptions.
     * @return
     */
    public List<String> retrievePrecisionExceptions() throws IndexException {
        try {
            List<String> results = new ArrayList<String>();
            Term term = new Term(IndexConfiguration.fieldName.TYPE.name(), IndexConfiguration.docType.PRECISION_EXCEPTION.name());
            TermDocs termDocs = this.indexReader.termDocs(term);
            while(termDocs.next()) {
                Document precisionExceptionDoc = indexReader.document(termDocs.doc());
                String precisionExceptionFound = precisionExceptionDoc.get(IndexConfiguration.fieldName.lRU.name());
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
     * Retrieves a particular precision exception.
     * @return
     */
    public String retrievePrecisionException(String precisionException) throws IndexException {
        try {
            String result = null;
            Term isPrecisionException = new Term(IndexConfiguration.fieldName.TYPE.name(), IndexConfiguration.docType.PRECISION_EXCEPTION.name());
            Term lru = new Term(IndexConfiguration.fieldName.lRU.name(), precisionException);
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
                result = doc.get(IndexConfiguration.fieldName.lRU.name());
            }
            return result;
        }
        catch(Exception x) {
            throw new IndexException(x);
        }
    }

    public LRUItem retrieveByLRU(String lru) {
        LRUItem result = null;
        try {
            Term term = new Term("lru", lru);

            long s1 = System.currentTimeMillis();

            Query query;
            // wildcard query
            if(lru.contains("*") || lru.contains("?")) {
                query = new WildcardQuery(term);
            }
            // no-wildcard query (faster)
            else {
                query = new TermQuery(term);
            }


            TopDocs topDocs = this.indexSearcher.search(query, 10);
            if(topDocs.scoreDocs.length > 0) {
                result = new LRUItem();//(topDocs.scoreDocs[0].toString());
            }

            long s2 = System.currentTimeMillis();

            float time = (float) s2 - s1;

            System.out.println("method 1 in " + time + " ms");

            //System.out.println("retrieveByLRU found # " + topDocs.totalHits + " matches");

            s1 = System.currentTimeMillis();

            TermDocs termDocs = this.indexReader.termDocs(term);

			if(termDocs.next()) {
				Document lruItemDoc = indexReader.document(termDocs.doc());
				String lruFound = lruItemDoc.get("lru");
				result = new LRUItem();//(lruFound);
			}

			termDocs.close();

            s2 = System.currentTimeMillis();

            time = (float) s2 - s1;

            System.out.println("method 1 in " + time + " ms");
        }
        catch(Exception x) {
            System.out.println(x.getMessage());
            x.printStackTrace();
        }
        return result;
    }

    /**
     * Returns total number of documents in the index.
     *
     * @return total number of docs in index
     * @throws Exception hmm
     */
    public int indexCount() throws Exception {
        try {
            MatchAllDocsQuery matchAllDocsQuery = new MatchAllDocsQuery();
            TotalHitCountCollector totalHitCountCollector = new TotalHitCountCollector();
            this.indexSearcher.search(matchAllDocsQuery, totalHitCountCollector);
            return totalHitCountCollector.getTotalHits();
        }
        catch(Exception x) {
            System.err.println(x.getMessage());
            x.printStackTrace();
            throw x;
        }
    }

}