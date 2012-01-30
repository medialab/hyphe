package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import org.apache.commons.collections.CollectionUtils;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.LogByteSizeMergePolicy;
import org.apache.lucene.index.LogMergePolicy;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.util.Version;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.RunnableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 *
 * @author heikki doeleman
 */
public class AsyncIndexWriterTask implements RunnableFuture {

    private Logger logger = LoggerFactory.getLogger(AsyncIndexWriterTask.class);

    private static Version LUCENE_VERSION;
    private static IndexWriterConfig.OpenMode OPEN_MODE;
    private static int RAM_BUFFER_SIZE_MB;
    private static Analyzer ANALYZER;

    private List<?> objectsToWrite = null;
    private boolean isDone;
    private String name;
    private IndexWriter indexWriter;

    AsyncIndexWriterTask(String name, List<?> objectsToWrite, RAMDirectory directory, Version LuceneVersion,
                         IndexWriterConfig.OpenMode openMode, int ramBufferSize, Analyzer analyzer) {
        try {
            System.out.println("creating new AsyncIndexWriterTask indexing # " + objectsToWrite.size() + " objects with OPEN_MODE " + openMode.name() + " RAM_BUFFER_SIZE_MB " + ramBufferSize);
            LUCENE_VERSION = LuceneVersion;
            OPEN_MODE = openMode;
            RAM_BUFFER_SIZE_MB = ramBufferSize;
            ANALYZER = analyzer;

            this.name = name;
            this.objectsToWrite = objectsToWrite;
            this.indexWriter = newRAMWriter(directory);
            this.indexWriter.commit();
        }
        catch(Exception x) {
            System.err.println(x.getMessage());
            x.printStackTrace();
            throw new ExceptionInInitializerError(x);
        }
    }

    /**
     *
     * @param ramDirectory
     * @return
     * @throws java.io.IOException
     */
    private IndexWriter newRAMWriter(RAMDirectory ramDirectory) throws IOException {
        System.out.println("creating new RAM writer");
        IndexWriterConfig indexWriterConfig = new IndexWriterConfig(LUCENE_VERSION, ANALYZER);
        indexWriterConfig.setOpenMode(OPEN_MODE);
        indexWriterConfig.setRAMBufferSizeMB(RAM_BUFFER_SIZE_MB);
        LogMergePolicy logMergePolicy = new LogByteSizeMergePolicy();
        logMergePolicy.setUseCompoundFile(false);
        indexWriterConfig.setMergePolicy(logMergePolicy);
        return new IndexWriter(ramDirectory, indexWriterConfig);
    }

    public void run() {
        logger.debug("started run");
        try {
            if(CollectionUtils.isEmpty(objectsToWrite)) {
                this.isDone = true;
                return;
            }
            if(logger.isDebugEnabled()) {
                if(objectsToWrite.get(0) instanceof PageItem) {
                    logger.debug("AsyncIndexWriterTask run started for LRUItems");
                }
                else if(objectsToWrite.get(0) instanceof NodeLink) {
                    logger.debug("AsyncIndexWriterTask run started for NodeLinks");
                }
            }
            isDone = false;
            int written = 0;
            for(Object object : objectsToWrite) {
                boolean wasIndexed = false;
                if(object instanceof PageItem) {
                    PageItem pageItem = (PageItem) object;
                    Document pageDocument = IndexConfiguration.PageItemDocument(pageItem);
                    // it may be null if it's rejected (e.g. there is no value for LRU in the PageItem)
                    if(pageDocument != null) {
                        indexWriter.addDocument(pageDocument);
                        wasIndexed = true;
                    }
                }
                else if(object instanceof NodeLink) {
                    NodeLink nodeLink = (NodeLink) object;
                    Document nodelinkDocument = IndexConfiguration.NodeLinkDocument(nodeLink);
                    // it may be null if it's rejected (e.g. there is no value for LRU in the PageItem)
                    if(nodelinkDocument != null) {
                        indexWriter.addDocument(nodelinkDocument);
                        wasIndexed = true;
                    }
                }
                if(wasIndexed) {
                    written++;
                }
            }
            this.isDone = true;
            logger.debug("AsyncIndexWriterTask " + name + " run finished, wrote # " + written + " documents to Lucene index");
        }
        catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
        }
        finally {
            try {
                this.indexWriter.close();
            }
            catch (IOException x) {
                logger.error(x.getMessage());
                x.printStackTrace();
            }
            logger.debug("finished run");
        }
    }

    public boolean cancel(boolean mayInterruptIfRunning) {
        return false;
    }

    public boolean isCancelled() {
        return false;
    }

    public boolean isDone() {
        return this.isDone;
    }

    public Object get() throws InterruptedException, ExecutionException {
        return null;
    }

    public Object get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
        return null;
    }
}