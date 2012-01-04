package fr.sciencespo.medialab.hci.memorystructure.index;

import fr.sciencespo.medialab.hci.memorystructure.thrift.LRUItem;
import fr.sciencespo.medialab.hci.memorystructure.thrift.NodeLink;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.index.FieldInfo;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.LogByteSizeMergePolicy;
import org.apache.lucene.index.LogMergePolicy;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.util.Version;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.RunnableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 *
 * @author heikki doeleman
 */
public class AsyncIndexWriterTask implements RunnableFuture {

    private static Version LUCENE_VERSION;
    private static IndexWriterConfig.OpenMode OPEN_MODE;
    private static int RAM_BUFFER_SIZE_MB;
    private static Analyzer ANALYZER;

    private List<?> objectsToWrite = null;
    private boolean isDone;
    private String name;
    private IndexWriter indexWriter;

    AsyncIndexWriterTask(String name, List<?> objectsToWrite, RAMDirectory directory, Version LuceneVersion, IndexWriterConfig.OpenMode openMode, int ramBufferSize, Analyzer analyzer) {
        try {
            LUCENE_VERSION = LuceneVersion;
            OPEN_MODE = openMode;
            RAM_BUFFER_SIZE_MB = ramBufferSize;
            ANALYZER = analyzer;

            this.name = name;
            this.objectsToWrite = objectsToWrite;
            this.indexWriter = newRAMWriter(directory);
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
        IndexWriterConfig indexWriterConfig = new IndexWriterConfig(LUCENE_VERSION, ANALYZER);
        indexWriterConfig.setOpenMode(OPEN_MODE);
        indexWriterConfig.setRAMBufferSizeMB(RAM_BUFFER_SIZE_MB);
        LogMergePolicy logMergePolicy = new LogByteSizeMergePolicy();
        logMergePolicy.setUseCompoundFile(false);
        indexWriterConfig.setMergePolicy(logMergePolicy);
        return new IndexWriter(ramDirectory, indexWriterConfig);
    }

    public void run() {
        try {
            if(objectsToWrite == null || objectsToWrite.size() == 0 ) {
                isDone = true;
                return;
            }
            if(objectsToWrite.get(0) instanceof LRUItem) {
                System.out.println("AsyncIndexWriterTask run started for LRUItems");
            }
            else if(objectsToWrite.get(0) instanceof NodeLink) {
                System.out.println("AsyncIndexWriterTask run started for NodeLinks");
            }
            isDone = false;
            int written = 0;
            for(Object object : objectsToWrite) {
                if(object instanceof LRUItem) {
                    LRUItem lruItem = (LRUItem) object;
                    Document lruDocument = IndexConfiguration.LRUItemDocument(lruItem);
                    indexWriter.addDocument(lruDocument);
                }
                written++;
            }
            isDone = true;
            System.out.println("AsyncIndexWriterTask " + name + " run finished, wrote # " + written + " documents to Lucene index");
        }
        catch(Exception x) {
            System.out.println(x.getMessage());
            x.printStackTrace();
        }
        finally {
            try {
                this.indexWriter.close();
            }
            catch (IOException x) {
                System.err.println(x.getMessage());
                x.printStackTrace();
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
        return isDone;
    }

    public Object get() throws InterruptedException, ExecutionException {
        return null;
    }

    public Object get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
        return null;
    }
}