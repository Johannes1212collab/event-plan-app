const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/SERPAPI_KEY="?([^"\n]+)"?/);
const key = keyMatch ? keyMatch[1] : null;

const address = "Auckland";
const q = `events near ${address} starting March 1, 2026`;
console.log("Querying:", q);

const url1 = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(q)}&hl=en&gl=nz&api_key=${key}&start=0`;
const url2 = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(q)}&hl=en&gl=nz&api_key=${key}&start=10`;

https.get(url1, (res1) => {
    let data1 = '';
    res1.on('data', (chunk) => data1 += chunk);
    res1.on('end', () => {
        const json1 = JSON.parse(data1);
        const firstTitles = json1.events_results ? json1.events_results.map(e => e.title).slice(0, 3) : [];
        console.log("Page 1 (start 0) first 3 events:", firstTitles);

        https.get(url2, (res2) => {
            let data2 = '';
            res2.on('data', (chunk) => data2 += chunk);
            res2.on('end', () => {
                const json2 = JSON.parse(data2);
                const secondTitles = json2.events_results ? json2.events_results.map(e => e.title).slice(0, 3) : [];
                console.log("Page 2 (start 10) first 3 events:", secondTitles);
            });
        });
    });
});
