package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityLink;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import org.apache.commons.collections.CollectionUtils;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.TieredMergePolicy;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.util.Version;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.RunnableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 *
 * @author heikki doeleman
 */
public class AsyncIndexWriterTask implements RunnableFuture {

    private static DynamicLogger logger = new DynamicLogger(AsyncIndexWriterTask.class);

    private static Version LUCENE_VERSION;
    private static IndexWriterConfig.OpenMode OPEN_MODE;
    private static int RAM_BUFFER_SIZE_MB;
    private static Analyzer ANALYZER;

    private List<?> objectsToWrite = null;
    private boolean isDone;
    private String name;
    private IndexWriter indexWriter;
    private LRUIndex lruIndex;

    AsyncIndexWriterTask(String name, List<?> objectsToWrite, RAMDirectory directory, Version LuceneVersion,
                         IndexWriterConfig.OpenMode openMode, int ramBufferSize, Analyzer analyzer, LRUIndex lruIndex) {
        try {
            if(logger.isDebugEnabled()) {
                logger.debug("creating new AsyncIndexWriterTask indexing # " + objectsToWrite.size() + " objects with OPEN_MODE " + openMode.name() + " RAM_BUFFER_SIZE_MB " + ramBufferSize);
            }
            LUCENE_VERSION = LuceneVersion;
            OPEN_MODE = openMode;
            RAM_BUFFER_SIZE_MB = ramBufferSize;
            ANALYZER = analyzer;

            this.lruIndex = lruIndex;
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
        logger.debug("creating new RAM writer");
        IndexWriterConfig indexWriterConfig = new IndexWriterConfig(LUCENE_VERSION, ANALYZER);
        indexWriterConfig.setOpenMode(OPEN_MODE);
        indexWriterConfig.setRAMBufferSizeMB(RAM_BUFFER_SIZE_MB);
        //LogMergePolicy logMergePolicy = new LogByteSizeMergePolicy();
        //logMergePolicy.setUseCompoundFile(false);
        //indexWriterConfig.setMergePolicy(logMergePolicy);
        TieredMergePolicy tieredMergePolicy = new TieredMergePolicy();
        tieredMergePolicy.setUseCompoundFile(true);
        indexWriterConfig.setMergePolicy(tieredMergePolicy);
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

                    PageItem existing = lruIndex.retrievePageItemByLRU(pageItem.getLru());
                    if(existing != null) {
                        if(logger.isDebugEnabled()) {
                            logger.debug("PageItem " + pageItem.getLru() + " already exists in index - updating\n");
                        }
                        lruIndex.deletePageItem(pageItem);
                        Set<String> sources = existing.getSourceSet();
                        if (sources != null) {
                            pageItem.getSourceSet().addAll(existing.getSourceSet());
                        }
                        // TODO Replicate existing tags on pageitem
                    }
                    Document pageDocument = IndexConfiguration.convertPageItemToLuceneDocument(pageItem);
                    // it may be null if it's rejected (e.g. there is no value for LRU in the PageItem)
                    if(pageDocument != null) {
                        indexWriter.addDocument(pageDocument);
                        wasIndexed = true;
                    }
                }
                else if(object instanceof NodeLink) {
                    NodeLink nodeLink = (NodeLink) object;
                    
                    if(logger.isDebugEnabled()) {
                        logger.debug("nodelink to be indexed: source: " + nodeLink.getSourceLRU() + " target: " + nodeLink.getTargetLRU());
                    }

                    NodeLink existing = lruIndex.retrieveNodeLink(nodeLink);
                    int weight = nodeLink.getWeight();
                    if(existing != null) {
                        if(logger.isDebugEnabled()) {
                            logger.debug("NodeLink already existed - increasing weight");
                        }
                        weight += existing.getWeight();
                        lruIndex.deleteNodeLink(nodeLink);
                    }
                    nodeLink.setWeight(weight);
                    Document nodelinkDocument = IndexConfiguration.convertNodeLinkToLuceneDocument(nodeLink);
                    // it may be null if it's rejected (e.g. there is no value for LRU in the PageItem)
                    if(nodelinkDocument != null) {
                        indexWriter.addDocument(nodelinkDocument);
                        wasIndexed = true;
                    }
                }
                else if(object instanceof WebEntityLink) {
                    WebEntityLink webEntityLink = (WebEntityLink) object;
                    if(logger.isDebugEnabled()) {
                        logger.debug("nodelink to be indexed: source: " + webEntityLink.getSourceId() + " target: " + webEntityLink.getTargetId());
                    }

                    WebEntityLink existing = lruIndex.retrieveWebEntityLink(webEntityLink);
                    int weight = webEntityLink.getWeight();
                    if(existing != null) {
                        if(logger.isDebugEnabled()) {
                            logger.debug("NodeLink already existed - increasing weight");
                        }
                        weight += existing.getWeight();
                        lruIndex.deleteWebEntityLink(webEntityLink);
                    }
                    webEntityLink.setWeight(weight);
                    Document webEntityLinkDocument = IndexConfiguration.convertWebEntityLinkToLuceneDocument(webEntityLink);
                    // it may be null if it's rejected (e.g. there is no value for LRU in the PageItem)
                    if(webEntityLinkDocument != null) {
                        indexWriter.addDocument(webEntityLinkDocument);
                        wasIndexed = true;
                    }
                }
                if(wasIndexed) {
                    written++;
                }
            }
            this.isDone = true;
            if(logger.isDebugEnabled()) {
                logger.debug("AsyncIndexWriterTask " + name + " run finished, wrote # " + written + " documents to Lucene index");
            }
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
            if(logger.isDebugEnabled()) {
                if(logger.isDebugEnabled()) {
                    logger.debug("finished run");
                }
            }
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