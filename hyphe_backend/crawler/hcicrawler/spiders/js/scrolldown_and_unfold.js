/*
 * scrolldown_and_unfold.js
 *
 * -> tries to unveil the ajax-hidden content of a webpage:
 *   - by scrolling all the way up and down
 *   - by clicking on all clickable elements without changing webpage
 *   - by restarting all over every time a new Ajax request is intercepted
 * Takes 3 timeout arguments provided via the Selenium call:
 * - timeout: global timeout after which the script will always end whatever
 * - idle_timeout: time before stopping the script after scrolling & unfolding
 * - ajax_timeout: global timeout for all Ajax requests performed
 */

// Handle script with no argument for DEBUG as an artoo bookmarklet
if (typeof(arguments) == "undefined") {
    arguments = [60, 20, 15, function(){consolelog("FINISHED!");}];
    consolelog = console.log;
} else {
    consolelog = function(){};
}

(function(endScript, timeout, idle_timeout, ajax_timeout) {
    var timeout = Math.max(30, timeout) * 1000,
        idle_timeout = idle_timeout * 1000,
        ajax_timeout = ajax_timeout * 1000;

    // Forbid leaving current page while processing script
    window.onbeforeunload = function(){return "";};

    // Control each second whether script finished running or ran for too long
    // and trigger end of async selenium script if so
    var running_since = Date.now(),
        idling_since = Date.now(),
        finalize = function() {
            var now = Date.now(),
                timedout = now - running_since >= timeout;
            if ((scrolling || clicking || now - idling_since < idle_timeout) && 
              !timedout)
                return setTimeout(finalize, 1000);

            consolelog((timedout ? "FORCE STOPP" : "FINISH") +
              "ING script running since", Math.floor((now - running_since)/1000)+"s");

        // Clear all leftover running timeouts
            var maxTimeoutId = setTimeout(';') + 1000;
            for (var i=0; i<maxTimeoutId; i++) clearTimeout(i);

        // Reset regular leaving page behavior
            window.onbeforeunload = function(){return;};

        // Run Selenium async-script signal-stopper
            return endScript(timedout);
        };

    // Scroll the page screen by screen first
    // then back all the way up and down screen by screen once again
    var pageYPos = 0,
        maxYPos = 555000000000;
        scrolling = false,
        roundtrip = false,
        startScroller = function() {
            // Never run twice simultaneously
            if (scrolling) return;
            scrolling = true;
            roundtrip = false;
            consolelog("STARTING scroll session");

            // Let's scroll all the way up, down and back up before everything
            window.scroll(0, 0);
            window.scroll(0, maxYPos);
            window.scroll(0, 0);
            pageYPos = 0;

            return scroller();
        },
        getPageYPos = function() {
            return Math.max(
                pageYPos,
                window.pageYOffset || 0,
                window.scrollY || 0
            );
        },
        scroller = function() {
            var toscroll = Math.max(
                1000,
                window.scrollMaxY || 0,
                window.innerHeight || 0,
                window.outerHeight || 0
            );
            pageYPos = getPageYPos();
            window.scroll(0, pageYPos + toscroll);

            var newPos = getPageYPos();
            if (newPos != pageYPos) {
            // Scroll happenned, let's continue
                pageYPos = newPos;
                setTimeout(scroller, 50);
            } else if (!roundtrip) {
            // Scroll is finished, let's run it all over once more
                window.scroll(0, 0);
                pageYPos = 0;
                roundtrip = true;
                setTimeout(scroller, 500);
            } else {
            // Scroll is totally over, let's scroll back to top and idle
                window.scroll(0, maxYPos);
                scrolling = false;
                idling_since = Date.now();
            }
        };

    // Identify & click only once on clickable elements to trigger Ajax queries
    var clicking = false,
        relaunch = true,
        isClick = function(el){
            // Identify not already clicked clickable elements
            return !el.hasAttribute('hyphantomas_clicked') &&
              (el.href);
            // || el.onclick || el.ondblclick || el.onmousedown);
        },
        simulateClick = function(element) {
            // Try clicking all ways
            try { element.click(); } catch(e0) {
            try { element.onclick(); } catch(e1) {
            try { element.ondblclick(); } catch(e2) {
            try { element.onmousedown(); } catch(e3) {
            }}}}
        },
        unfold = function() {
            // Never run twice simultaneously, plan restart for concurrent calls
            if (clicking) {
                relaunch = true;
                return;
            }
            clicking = true;

            var allElements = document.querySelectorAll('*'),
                links = Array.prototype.slice.call(allElements).filter(isClick);
            consolelog("STARTING unfolding session for total links:", links.length);
            return clickAjax(links);
        },
        clickAjax = function(links) {
            if (links.length) {
            // Click successively on all identified clicks
                var link = links.pop();
                if (isClick(link)) {
                    consolelog("CLICKING", link.textContent);
                    link.setAttribute('hyphantomas_clicked', 'true');
                    simulateClick(link);
                }
                return setTimeout(function(){clickAjax(links)}, 100);
            } else {
                clicking = false;
                 if (relaunch) {
            // Restart if other calls were made concurrently
                    relaunch = false;
                    return setTimeout(unfold, 1000);
                } else {
            // Rerun scroller after unfold in case new scroll-triggers appeared
                    relaunch = false;
                    return startScroller();
                }
            }
        };

    // Override XMLHttpRequest to force timeouts and trigger scroller + unfolder
    var oldXHR = window.XMLHttpRequest,
        newXHR = function() {
            var realXHR = new oldXHR();
            realXHR.addEventListener("readystatechange", function() {
                consolelog("ajax intercepted");
                setTimeout(startScroller, 500);
                setTimeout(unfold, 750);
            }, false);

            realXHR.timeout = ajax_timeout;
            realXHR.ontimeout = function(){
                consolelog("ajax query timed out!!!");
            }
            return realXHR;
        };
    window.XMLHttpRequest = newXHR;

    setTimeout(startScroller, 500);
    setTimeout(unfold, 750);
    setTimeout(finalize, 1000);

})(arguments[arguments.length - 1], arguments[0], arguments[1], arguments[2]);
