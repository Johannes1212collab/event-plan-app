const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/SERPAPI_KEY="?([^"\n]+)"?/);
const key = keyMatch ? keyMatch[1] : null;

const address = "Auckland";
const startDateStr = "2026-02-28";
const endDateStr = "2026-05-08";

const startObj = new Date(startDateStr);
const now = new Date();
const diffTime = startObj.getTime() - now.getTime();
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

let dateChip = "date:this_month";
if (diffDays <= 0) dateChip = "date:today";
else if (diffDays === 1) dateChip = "date:tomorrow";
else if (diffDays <= 7) dateChip = "date:this_week";
else if (diffDays <= 14) dateChip = "date:next_week";
else if (diffDays <= 30) dateChip = "date:this_month";
else dateChip = "date:next_month";

console.log("Chips decided:", dateChip, "diffDays:", diffDays);

const url = `https://serpapi.com/search.json?engine=google_events&q=events+near+${address}&hl=en&gl=nz&htichips=${dateChip}&api_key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        let events = [];
        if (json.events_results) {
            events = json.events_results.map(event => {
                let parsedDate = new Date();
                if (event.date?.start_date) {
                    parsedDate = new Date(`${event.date.start_date}, ${new Date().getFullYear()}`);
                    if (isNaN(parsedDate.getTime())) parsedDate = new Date();
                }
                return { title: event.title, startDate: parsedDate, rawDate: event.date?.start_date };
            });
        }

        console.log("Returned raw events:", events.length);
        events.slice(0, 3).forEach(e => console.log(e));

        const requestStart = new Date(startDateStr);
        const requestEnd = new Date(endDateStr);
        requestStart.setHours(0, 0, 0, 0);
        requestEnd.setHours(23, 59, 59, 999);

        const filteredEvents = events.filter(e => {
            return e.startDate >= requestStart && e.startDate <= requestEnd;
        });

        console.log("\nFiltered events:", filteredEvents.length);
        filteredEvents.slice(0, 3).forEach(e => console.log(e));

    });
}).on("error", (err) => console.log("Error: " + err.message));
