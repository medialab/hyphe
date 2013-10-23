package fr.sciencespo.medialab.hci.memorystructure.index;

import java.io.Reader;
import fr.sciencespo.medialab.hci.memorystructure.index.LRUIndex;
import org.apache.lucene.analysis.ReusableAnalyzerBase;
import org.apache.lucene.analysis.KeywordTokenizer;
import org.apache.lucene.analysis.Tokenizer;
import org.apache.lucene.analysis.LowerCaseFilter;


/**
 * Specific Lucene Analyzer to index and query fields in lowercase as a whole (no stem)
 *
 * @author benjamin ooghe-tabanou
 */

public final class LowercasedKeywordAnalyzer extends ReusableAnalyzerBase {

    @Override
    protected TokenStreamComponents createComponents(final String fieldName, final Reader reader) {
        final Tokenizer source = new KeywordTokenizer(reader);
        return new TokenStreamComponents(source, new LowerCaseFilter(LRUIndex.LUCENE_VERSION, source));
    }
}
