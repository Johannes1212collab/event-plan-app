const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="?([^"\n]+)"?/);
const key = keyMatch ? keyMatch[1] : null;

const addressToGeocode = "Artworks - Arts Community Theatre - Live Entertainment - Artworks - Arts Community Theatre - Live Entertainment, Artworks theatre 2 Korora Rd, Oneroa, Waiheke Island";

const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeocode)}&key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        if (json.results && json.results.length > 0) {
            console.log("Geocoded to:", json.results[0].geometry.location);
        } else {
            console.log("Geocode failed. Status:", json.status);
            console.log("Response:", JSON.stringify(json, null, 2));
        }
    });
});
