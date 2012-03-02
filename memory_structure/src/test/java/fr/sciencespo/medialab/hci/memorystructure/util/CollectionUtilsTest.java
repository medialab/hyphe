package fr.sciencespo.medialab.hci.memorystructure.util;

import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

import java.util.HashSet;
import java.util.Set;

/**
 * Test CollectionUtils.
 *
 * @author heikki doeleman
 */
public class CollectionUtilsTest extends TestCase {

    private static DynamicLogger logger = new DynamicLogger(CollectionUtilsTest.class, DynamicLogger.LogLevel.ERROR);

    /**
     * Tests findLongestString() with null input.
     */
    public void testFindLongestStringNullInput() {
        logger.debug("testFindLongestStringNullInput");
        Set<String> strings = null;
        Set<String> longest = CollectionUtils.findLongestString(strings);
        assertNotNull("Unexpected null set", longest);
        assertEquals("Unexpected result for null input", "", longest.iterator().next());
    }

    /**
     * Tests findLongestString() with empty input.
     */
    public void testFindLongestStringEmptyInput() {
        logger.debug("testFindLongestStringEmptyInput");
        Set<String> strings = new HashSet<String>();
        Set<String> longest = CollectionUtils.findLongestString(strings);
        assertNotNull("Unexpected null set", longest);
        assertEquals("Unexpected result for empty input", "", longest.iterator().next());
    }

    /**
     * Tests findLongestString() with single string input.
     */
    public void testFindLongestStringSingleStringInput() {
        logger.debug("testFindLongestStringSingleStringInput");
        Set<String> strings = new HashSet<String>();
        strings.add("one");
        Set<String> longest = CollectionUtils.findLongestString(strings);
        assertNotNull("Unexpected null set", longest);
        assertEquals("Unexpected result set size", 1, longest.size());
        assertEquals("Unexpected result for single string input", "one", longest.iterator().next());
    }

    /**
     * Tests findLongestString() with multiple string input.
     */
    public void testFindLongestStringMultipleStringInput() {
        logger.debug("testFindLongestStringMultipleStringInput");
        Set<String> strings = new HashSet<String>();
        strings.add("one");
        strings.add("onemore");
        strings.add("yetanotherone");
        Set<String> longest = CollectionUtils.findLongestString(strings);
        assertNotNull("Unexpected null set", longest);
        assertEquals("Unexpected result set size", 1, longest.size());
        assertEquals("Unexpected result for single string input", "yetanotherone", longest.iterator().next());
    }

    /**
     * Tests findLongestString() with multiple string input of same length.
     */
    public void testFindLongestStringMultipleStringSameLengthInput() {
        logger.debug("testFindLongestStringMultipleStringSameLengthInput");
        Set<String> strings = new HashSet<String>();
        strings.add("one");
        strings.add("ane");
        strings.add("ine");
        strings.add("x");
        Set<String> longest = CollectionUtils.findLongestString(strings);
        assertNotNull("Unexpected null set", longest);
        assertEquals("Unexpected result set size", 3, longest.size());
    }

    /**
     * Invoked before each test* method.
     */
    public void setUp() {
    }

    /**
     * Invoked after each test* method. Empties the index between tests.
     */
    public void tearDown() throws Exception {
    }

    /**
     * Creates the test case.
     *
     * @param testName name of the test case
     */
    public CollectionUtilsTest(String testName) {
        super( testName );
    }

    /**
     * @return the suite of tests being tested
     */
    public static Test suite() {
        return new TestSuite( CollectionUtilsTest.class );
    }

}