// ==UserScript==
// @name         Golf Booking Script
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Runs on golf booking page
// @author       Dennis Tan
// @match        https://gateway.keppelclub.com.sg/webclub*
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/dennistan95/golf-booking/refs/heads/main/golf-booking.js
// @updateURL    https://raw.githubusercontent.com/dennistan95/golf-booking/refs/heads/main/golf-booking.js
// ==/UserScript==

(function() {
    'use strict';
    // Define your target session date (e.g. 250516 for 2025 May 16)
    const targetDate = 250524

    // Define your target session times; Can be multiple choices (format must match exactly. See examples below)
    // e.g. 'F08:4318' for First tee slot at 08:43, 18 holes
    // e.g. 'B13:0218' for 10th tee slot at 13:02 (1:02pm), 18 holes
    const targetSessions = [
        // Morning slots
        /*
        'F07:5518'
        ,'B07:5618'
        ,'F08:1118',
        ,'B08:1218',
        ,'F08:1918',
        ,'B08:2018',
        ,'F08:2718',
        ,'B08:2818',
        ,'F08:4318'
        ,'B08:4418'
        ,'F08:5118'
        ,'B08:5218'
        ,'F08:5918'
        ,'B09:0018'
        */
        // Afternoon slots
        // /*
        'F13:0118'
        ,'B13:0218'
        ,'F13:1718'
        ,'B13:1818'
        ,'F13:2518'
        ,'B13:2618'
        ,'F13:3318'
        ,'B13:3418'
        ,'F13:4118'
        ,'B13:4218'
        ,'F13:4918'
        // */
    ];


    const url = window.location.href;
    const n = 0;
    function clickSession() {
        // Check if btnClick is defined, else wait and retry
        if (typeof btnClick === 'function') {
            // Replace this with the session date that you want to book
            btnClick(targetDate, 'OPEN', 2);
            console.log('btnClick executed');
        } else {
            // Retry after a short delay if btnClick not ready yet
            setTimeout(clickSession, 500);
        }
    }

    let currentHref = location.href;
    let navigationDetected = false;

    // Listen for navigation (page unload)
    window.addEventListener('beforeunload', function() {
        navigationDetected = true;
    });

    async function bookSlot(matchedSessions) {
        for (const s of matchedSessions) {
            console.log(`Clicking on session ${s}`);
            AutoSub(s,2);
            await new Promise(resolve => setTimeout(resolve, 100));
            // Check for navigation
            if (navigationDetected || location.href !== currentHref) {
                break;
            }
        }
    }

    function extractFirstAutoSubArg(str) {
        // Match AutoSub('SOMETHING',...) and capture the first argument
        const match = str.match(/AutoSub\s*\(\s*'([^']+)'/);
        return match ? match[1] : null;
    }

    function mainBookSlot() {
        // Find all session times that are bookable
        const bookableSessions = Array.from(document.querySelectorAll('[onclick*="AutoSub"]'));

        // Display the count
        console.log(`Found ${bookableSessions.length} session(s) that are bookable`);

        // Display the target session times
        console.log(`Target sessions: ${targetSessions}`);


        // Check through each bookable session
        let matchCount = 0;
        // Prepare an array to collect matched session times
        const matchedSessions = [];
        const cleanedSessions = [];
        bookableSessions.forEach(el => {
            el.style.outline = '3px solid red';
            const sessionContent = el.getAttribute('onclick');
            const sessionTime = extractFirstAutoSubArg(sessionContent);
            cleanedSessions.push(sessionTime);
        })

        targetSessions.forEach(el => {
            if (cleanedSessions.includes(el)) {
                matchCount++;
                matchedSessions.push(el); // <-- This line appends the matched sessionTime
            }
        })

        console.log(`Number of matched target session(s): ${matchCount}`);
        console.log(`Matched target session(s): ${matchedSessions}`);

        return {matchCount, matchedSessions}
    }

    async function checkSlotsOpen(refreshSlots, interval = 1000) {
        while (true) {
            const bookButton = document.getElementById('btnSubmitid');
            if (bookButton) {
                // Means successfully got into booking page
                break;
                // Exit the loop and book manually
            }

            // Wait for some time before checking again
            await new Promise(resolve => setTimeout(resolve, interval));

            // Means not yet in booking page, need to refresh and wait for slots
            refreshSlots();
        }
    }

    function clickTimeSlot() {
        const result = mainBookSlot();
        const matchCount = result.matchCount
        const matchedSessions = result.matchedSessions

        if (matchCount === 0) {
            // No slots matched. Go back one page and enter again to refresh
            console.log('No suitable timeslots found. Refreshing...');
            btnClick(2);
        } else {
            // Slots matched. Proceed to book slots
            // Loop through matched sessions and click them in order
            bookSlot(matchedSessions)
        }
    }

    function refreshSlots() {

        // If at the table to select date
        if (url.endsWith('clubgbslot.tbred') || url.endsWith('webpage=coubking')) {
            console.log('Selecting the date to book for...');
            clickSession();
        }

        // Wait until the page's readyState is 'complete' (fully loaded)
        document.addEventListener('readystatechange', () => {
            if (document.readyState === 'complete') {
                if (url.endsWith('clubgbsheet.tbred')) {
                    console.log('Session time table fully loaded');
                    clickTimeSlot();
                    }
            }
        });
    }

    if (url.endsWith('webpage=coubking')) {
        console.log('Running script');
        if (document.readyState === 'interactive') {
            // DOM is ready, safe to manipulate elements
            console.log('Selecting number of golfers');
            const dropdown = document.getElementById('form-field-field_8c037f5');
            if (dropdown != 4) {
                // Set number of golfers
                dropdown.value = 4;
                console.log('Dropdown value set to:', dropdown.value);
                // Set initialisation as done
            }
        }
        // Wait until the page's readyState is 'complete' (fully loaded)
        document.addEventListener('readystatechange', () => {
            if (document.readyState === 'complete') {
                console.log('Selecting public flights');
                document.getElementById('tab-public-flights').click();
                clickSession();
            }
        });
    }
    // Wait until the page's readyState is 'complete' (fully loaded)
        document.addEventListener('readystatechange', () => {
            if (document.readyState === 'complete') {
                if (url.endsWith('clubgbsheet.tbred')) {
                    clickTimeSlot();
                    }
            }
        });

    checkSlotsOpen(refreshSlots, 1000);


})();
