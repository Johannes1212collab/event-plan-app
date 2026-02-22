const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const userMatch = env.match(/EVENTFINDA_USERNAME="?([^"\n]+)"?/);
const passMatch = env.match(/EVENTFINDA_PASSWORD="?([^"\n]+)"?/);
const username = userMatch ? userMatch[1] : null;
const password = passMatch ? passMatch[1] : null;

if (!username || !password) {
    console.error("Missing Eventfinda credentials.");
    process.exit(1);
}

const authString = Buffer.from(`${username}:${password}`).toString('base64');
const lat = -36.8485;
const lng = 174.7633;
const radius = 100;
const startDate = "2026-02-28";
const endDate = "2026-05-08";

const qs = `?point=${lat},${lng}&radius=${radius}&start_date=${startDate}&end_date=${endDate}&rows=40`;
const url = `https://api.eventfinda.co.nz/v2/events.json${qs}`;

console.log("Fetching Eventfinda:", url);

https.get(url, {
    headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/json",
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Returned Eventfinda Events:", json.events ? json.events.length : "None");
            if (json.events && json.events.length > 0) {
                console.log(json.events[0].name);
            } else {
                console.log(json);
            }
        } catch (e) {
            console.log("Parse Error:", e.message, "\nRaw:", data);
        }
    });
}).on("error", (err) => console.log("HTTP Error: " + err.message));
