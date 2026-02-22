const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/SERPAPI_KEY="?([^"\n]+)"?/);
const key = keyMatch ? keyMatch[1] : null;

const address = "Auckland";
const q = `events near ${address} starting March 1, 2026`;
console.log("Querying:", q);

// Test page 1
const url1 = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(q)}&hl=en&gl=nz&api_key=${key}`;

https.get(url1, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log("Page 1 returned", json.events_results ? json.events_results.length : 0, "events.");
        if (json.serpapi_pagination) {
            console.log("Pagination info:", json.serpapi_pagination);

            // Try page 2
            if (json.serpapi_pagination.start) {
                const url2 = `${url1}&start=${json.serpapi_pagination.start}`;
                console.log("Fetching Page 2 with start=" + json.serpapi_pagination.start);
                https.get(url2, (res2) => {
                    let data2 = '';
                    res2.on('data', (chunk) => data2 += chunk);
                    res2.on('end', () => {
                        const json2 = JSON.parse(data2);
                        console.log("Page 2 returned", json2.events_results ? json2.events_results.length : 0, "events.");
                        if (json2.events_results) {
                            console.log("First event on page 2:", json2.events_results[0].title);
                        }
                    });
                });
            }
        } else {
            console.log("No pagination info found.");
        }
    });
});
