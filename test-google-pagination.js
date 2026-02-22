const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/SERPAPI_KEY="?([^"\n]+)"?/);
const key = keyMatch ? keyMatch[1] : null;

const address = "Auckland";
const dateChip = "date:next_month";

// Testing if google_events supports 'start' pagination or 'num'
const url = `https://serpapi.com/search.json?engine=google_events&q=events+near+${address}&hl=en&gl=nz&htichips=${dateChip}&api_key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        let events = [];
        if (json.events_results) {
            console.log("Returned", json.events_results.length, "events by default.");
            console.log("Next page token:", json.serpapi_pagination ? json.serpapi_pagination.next : "None");
        }
    });
}).on("error", (err) => console.log("Error: " + err.message));
