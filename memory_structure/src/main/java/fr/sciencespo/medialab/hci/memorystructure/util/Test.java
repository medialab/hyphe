package fr.sciencespo.medialab.hci.memorystructure.util;

import org.apache.commons.collections.CollectionUtils;

import java.util.HashSet;
import java.util.Set;


/**
 * Runnable class for small tests.
 *
 * @author heikki doeleman
 */
public class Test {

    public static void main(String [] args) {
        Test test = new Test();
        try {
            test.test();
        }
        catch(Throwable x) {
            System.err.println(x.getMessage());
            x.printStackTrace();
        }
    }

    private void test() {

        String a = "aaa";
        String b= "bbb";
        String c = "ccc";
        String d = "ddd";
        String e = "eee";
        String f = "fff";
        String g = "ggg";
        Set<String> big = new HashSet<String>();
        big.add(a);big.add(b);big.add(c);big.add(d);big.add(e);big.add(f);big.add(g);

        Set<String> small = new HashSet<String>();
        small.add(b);small.add(c);  small.add(g);

        long t1 = System.currentTimeMillis();
        Set<String> i1 = new HashSet<String>(big);
        i1.retainAll(small);
        long t2 = System.currentTimeMillis();
        System.out.println("1: " + i1);

        long t3 = System.currentTimeMillis();
        Set<String> i2 = new HashSet<String>(small);
        i2.retainAll(big);
        long t4 = System.currentTimeMillis();
        System.out.println("2: " + i2);

        Set<String> i3 = (Set)CollectionUtils.intersection(big, small);
        System.out.println("3: " + i3);
        System.out.println("4: " + CollectionUtils.intersection(small, big));




        /*
        String prefix = "s:http|h:fr|h:sciences-po";


        // default: top level domains
        String page = "s:http|h:www|h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php|q:title=Reverse_URLs|r:bottom";

        // only tld + domain
        //String regexp = "(s:[a-zA-Z]*|(h:www|)?h:[a-zA-Z]+|(h:[^|]*))";

        // all subdomains
        String regexp = "(s:[a-zA-Z]+\\|(h:www|)?h:[a-zA-Z]+(\\|h:[^|]+)+)";

        // blogspot subdomains
        //String page = "s:http|h:com|h:blogspot|h:evacrystal";
        //String regexp = "(s:http|h:com|h:blogspot|(h:.*)?)";

                String pipe = "\\|";
                Pattern pipePattern = Pattern.compile(pipe);
                Matcher pipeMatcher = pipePattern.matcher(regexp);
                String eregexp = pipeMatcher.replaceAll("\\\\|");

        Pattern p = Pattern.compile(regexp, Pattern.CASE_INSENSITIVE);

        Matcher m = p.matcher(page);

        System.out.println(m.find() + " : " + m.group());

        */

        /*
        String p = "\\|";
        String prefixlru = "a|b|c";
        Pattern pa = Pattern.compile(p);
        Matcher m = pa.matcher(prefixlru);

        System.out.println(m.replaceAll("\\\\|"));
        */

        /*
        String prefix = "s:http\\|h:fr\\|h:sciences-po";
        Pattern pattern = Pattern.compile(prefix);
        String matchMe = "h:fr|h:sciences-po|h:medialab|h:jiminy|p:hci|p:index.php|q:title=Reverse_URLs|r:bottom";

        //String prefix = "a";
        //Pattern pattern = Pattern.compile(prefix);
        //String matchMe = "abcdefgh";


        Matcher matcher = pattern.matcher(matchMe);

        System.out.println(matcher.lookingAt());

        for(int x = 10; x < 10; x++) {
            System.out.println("\n\n");

        long a = System.currentTimeMillis();
        for(int i = 0; i < 10000000; i++) {
            //Matcher matcher = pattern.matcher(matchMe+i);
            matcher.matches();
            matcher.reset();
        }
        long b = System.currentTimeMillis();
        System.out.println(b-a);

        a = System.currentTimeMillis();
        for(int i = 0; i < 10000000; i++) {
            //Matcher matcher = pattern.matcher(matchMe+i);
            matcher.find();
            matcher.reset();
        }
        b = System.currentTimeMillis();
        System.out.println(b-a);

        a = System.currentTimeMillis();
        for(int i = 0; i < 10000000; i++) {
            //Matcher matcher = pattern.matcher(matchMe+i);
            matcher.lookingAt();
            matcher.reset();
        }
        b = System.currentTimeMillis();
        System.out.println(b-a);

        }
        */
    }


}
