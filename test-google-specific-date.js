const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/SERPAPI_KEY="?([^"\n]+)"?/);
const key = keyMatch ? keyMatch[1] : null;

const address = "Auckland";
const targetDate = new Date("2026-03-06");
const dateFormatted = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(targetDate);
const q = `events near ${address} starting ${dateFormatted}`;
console.log("Querying:", q);

const url = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(q)}&hl=en&gl=nz&api_key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        let events = [];
        if (json.events_results) {
            console.log("Returned", json.events_results.length, "events natively.");
            json.events_results.slice(0, 5).forEach(e => console.log(e.title, "->", e.date?.start_date, e.date?.when));
        } else {
            console.log("No events found");
        }
    });
}).on("error", (err) => console.log("Error: " + err.message));
