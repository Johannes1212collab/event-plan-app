const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/SERPAPI_KEY="?([^"\n]+)"?/);
const key = keyMatch ? keyMatch[1] : null;

if (!key) {
    console.error("COULD NOT FIND SERPAPI_KEY IN .env.local");
    process.exit(1);
}

const address = "Auckland";
const htichips = "date:next_month";
const url = `https://serpapi.com/search.json?engine=google_events&q=events+near+${address}&hl=en&gl=nz&htichips=${htichips}&api_key=${key}`;

console.log("Fetching test with " + htichips);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        if (json.events_results) {
            const samples = json.events_results.slice(0, 5).map(e => ({
                title: e.title,
                date: e.date,
            }));
            console.log(JSON.stringify(samples, null, 2));
        } else {
            console.log("No events found");
        }
    });
}).on("error", (err) => console.log("Error: " + err.message));
