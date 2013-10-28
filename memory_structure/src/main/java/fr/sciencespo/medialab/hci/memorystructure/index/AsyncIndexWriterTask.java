package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.PageItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityLink;
import fr.sciencespo.medialab.hci.memorystructure.thrift.WebEntityNodeLink;
import fr.sciencespo.medialab.hci.memorystructure.util.DynamicLogger;
import org.apache.commons.collections.CollectionUtils;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.TieredMergePolicy;
import org.apache.lucene.store.RAMDirectory;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.RunnableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 *
 * @author heikki doeleman, benjamin ooghe-tabanou
 */
public class AsyncIndexWriterTask implements RunnableFuture {

    private static DynamicLogger logger = new DynamicLogger(AsyncIndexWriterTask.class);

    private List<?> objectsToWrite = null;
    private boolean isDone;
    private String id;
    private IndexWriter indexWriter;
    private LRUIndex lruIndex;

    AsyncIndexWriterTask(String id, List<?> objectsToWrite, RAMDirectory directory, LRUIndex lruIndex) {
        try {
            if(logger.isDebugEnabled()) {
                logger.debug("creating new AsyncIndexWriterTask indexing # " + objectsToWrite.size() + " objects with OPEN_MODE " + LRUIndex.OPEN_MODE.name() + " RAM_BUFFER_SIZE_MB " + LRUIndex.RAM_BUFFER_SIZE_MB);
            }
            this.lruIndex = lruIndex;
            this.id = id;
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
        if (logger.isDebugEnabled()) {
            logger.debug("creating new RAM writer");
        }
        IndexWriterConfig indexWriterConfig = new IndexWriterConfig(LRUIndex.LUCENE_VERSION, LRUIndex.analyzer);
        indexWriterConfig.setOpenMode(LRUIndex.OPEN_MODE);
        indexWriterConfig.setRAMBufferSizeMB(LRUIndex.RAM_BUFFER_SIZE_MB);
        // TODO: Test best settings to avoid "Too Many Open Files" errors
        //
        // LogMergePolicy logMergePolicy = new LogByteSizeMergePolicy();
        // logMergePolicy.setUseCompoundFile(false);
        // indexWriterConfig.setMergePolicy(logMergePolicy);
        TieredMergePolicy tieredMergePolicy = new TieredMergePolicy();
        tieredMergePolicy.setUseCompoundFile(true);
        indexWriterConfig.setMergePolicy(tieredMergePolicy);
        return new IndexWriter(ramDirectory, indexWriterConfig);
    }

    public void run() {
        if(CollectionUtils.isEmpty(objectsToWrite)) {
            this.isDone = true;
            return;
        }
        if(logger.isDebugEnabled()) {
            if(objectsToWrite.get(0) instanceof PageItem) {
                logger.debug("AsyncIndexWriterTask run started for LRUItems");
            } else if(objectsToWrite.get(0) instanceof NodeLink) {
                logger.debug("AsyncIndexWriterTask run started for NodeLinks");
            } else if(objectsToWrite.get(0) instanceof WebEntityNodeLink) {
                logger.debug("AsyncIndexWriterTask run started for WebEntityNodeLinks");
            } else if(objectsToWrite.get(0) instanceof WebEntityLink) {
                logger.debug("AsyncIndexWriterTask run started for WebEntityLinks");
            }
        }
        try {
            isDone = false;
            int written = 0;
            for(Object object : objectsToWrite) {
                Document luceneDoc = null;
                if(object instanceof PageItem) {
                    PageItem pageItem = (PageItem) object;
                    PageItem existing = lruIndex.retrievePageItemByLRU(pageItem.getLru());
                    if(existing != null) {
                        if(logger.isDebugEnabled()) {
                            logger.trace("PageItem " + pageItem.getLru() + " already exists in index - updating");
                        }
                        lruIndex.deletePageItem(pageItem);
                        Set<String> sources = existing.getSourceSet();
                        if (sources != null) {
                            pageItem.getSourceSet().addAll(sources);
                        }
                        // TODO Replicate existing tags on pageitem
                    }
                    luceneDoc = IndexConfiguration.convertPageItemToLuceneDocument(pageItem);
                } else if(object instanceof NodeLink) {
                    NodeLink nodeLink = (NodeLink) object;
                    NodeLink existing = lruIndex.retrieveNodeLink(nodeLink);
                    if(existing != null) {
                        if(logger.isDebugEnabled()) {
                            logger.trace("NodeLink with source: " + nodeLink.getSourceLRU() + " and target: " + nodeLink.getTargetLRU() + " already existed - increasing weight");
                        }
                        lruIndex.deleteNodeLink(nodeLink);
                        nodeLink.setWeight(nodeLink.getWeight() + existing.getWeight());
                    }
                    luceneDoc = IndexConfiguration.convertNodeLinkToLuceneDocument(nodeLink);
                } else if(object instanceof WebEntityNodeLink) {
                    WebEntityNodeLink webEntityNodeLink = (WebEntityNodeLink) object;
                    luceneDoc = IndexConfiguration.convertWebEntityNodeLinkToLuceneDocument(webEntityNodeLink);
                } else if(object instanceof WebEntityLink) {
                    WebEntityLink webEntityLink = (WebEntityLink) object;
            /*
             *      TODO : Optionnalize this part for opti if update webentitylinks instead of only recreating all of them
             *      Don't increment weight since such updates supposes to remove these specific links before
             *
                    WebEntityLink existing = lruIndex.retrieveWebEntityLink(webEntityLink);
                    if(existing != null) {
                        lruIndex.deleteWebEntityLink(webEntityLink);
                    }
            */
                    luceneDoc = IndexConfiguration.convertWebEntityLinkToLuceneDocument(webEntityLink);
                }
                // it may be null if it's rejected (e.g. there is no value for LRU in the PageItem)
                if(luceneDoc != null) {
                    indexWriter.addDocument(luceneDoc);
                    written++;
                }
            }
            this.isDone = true;
            if(logger.isDebugEnabled()) {
                logger.debug("AsyncIndexWriterTask " + id + " run finished, wrote # " + written + " documents to Lucene index");
            }
        } catch(Exception x) {
            logger.error(x.getMessage());
            x.printStackTrace();
        } finally {
            try {
                this.indexWriter.close();
            } catch (IOException x) {
                logger.error(x.getMessage());
                x.printStackTrace();
            }
            if(logger.isDebugEnabled()) {
                logger.debug("finished run");
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
