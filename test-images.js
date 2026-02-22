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
const url = `https://serpapi.com/search.json?engine=google_events&q=events+near+${address}&hl=en&gl=nz&api_key=${key}`;

console.log("Fetching: " + url.replace(key, "HIDDEN_KEY"));

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        if (json.events_results) {
            // Log out the image-related fields of the first 3 events to see what our options are
            const samples = json.events_results.slice(0, 3).map(e => ({
                title: e.title,
                thumbnail: e.thumbnail,
                image: e.image,
                allKeys: Object.keys(e)
            }));
            console.log(JSON.stringify(samples, null, 2));
        }
    });
}).on("error", (err) => console.log("Error: " + err.message));
