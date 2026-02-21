"use server";

import { ScannedEvent } from "@/types/scanner";

interface ScannerParams {
    address: string;
    lat: number;
    lng: number;
    radiusKm: number;
    startDate: string; // ISO String (e.g. 2026-02-22)
    endDate: string;   // ISO String (e.g. 2026-03-01)
    offset?: number;
}

export async function scanSurroundingEvents(params: ScannerParams): Promise<{ events: ScannedEvent[], hasMore: boolean }> {
    const events: ScannedEvent[] = [];
    let hasMore = false;

    // Parallel execution of all our API scrapers
    const results = await Promise.allSettled([
        Promise.resolve([]), // DISABLED: fetchEventfindaEvents(params), waiting for API KEY
        fetchGoogleEvents(params),
    ]);

    // Push successful Eventfinda hits
    if (results[0].status === "fulfilled") {
        events.push(...results[0].value);
        if (results[0].value.length === 40) hasMore = true;
    } else {
        console.error("Eventfinda Scraper Failed:", results[0].reason);
    }

    // Push successful Google Events hits
    if (results[1].status === "fulfilled") {
        events.push(...results[1].value);
        if (results[1].value.length === 10) hasMore = true;
    } else {
        console.error("Google Events Scraper Failed:", results[1].reason);
    }

    // Strict Temporal Filtering (Google Events 'htichips' is imprecise and can return the entire month)
    const requestStart = new Date(params.startDate);
    const requestEnd = new Date(params.endDate);
    requestStart.setHours(0, 0, 0, 0);       // Include full start day
    requestEnd.setHours(23, 59, 59, 999);    // Include full end day

    const filteredEvents = events.filter(e => {
        return e.startDate >= requestStart && e.startDate <= requestEnd;
    });

    // Sort chronologically by Start Date
    const finalEvents = filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return { events: finalEvents, hasMore };
}

async function fetchEventfindaEvents({ lat, lng, radiusKm, startDate, endDate }: ScannerParams): Promise<ScannedEvent[]> {
    // Note: Eventfinda API expects "point=lat,lng" for spatial searches
    // Requires Basic Auth (username:password) encoded in base64
    const USERNAME = process.env.EVENTFINDA_USERNAME;
    const PASSWORD = process.env.EVENTFINDA_PASSWORD;

    if (!USERNAME || !PASSWORD) {
        console.warn("Eventfinda credentials missing. Skipping Eventfinda scraper.");
        return [];
    }

    const authString = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

    // Convert dates from YYYY-MM-DD to YYYY-MM-DD HH:MM:SS for Eventfinda format
    // or just YYYY-MM-DD
    const url = new URL("https://api.eventfinda.co.nz/v2/events.json");
    url.searchParams.append("point", `${lat},${lng}`);
    url.searchParams.append("radius", radiusKm.toString());
    url.searchParams.append("start_date", startDate);
    url.searchParams.append("end_date", endDate);
    url.searchParams.append("rows", "40"); // Grab top 40 results

    try {
        const response = await fetch(url.toString(), {
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/json",
            },
            next: { revalidate: 3600 } // Cache results for 1 hour to heavily save API credits
        });

        if (!response.ok) {
            throw new Error(`Eventfinda HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const rawEvents = data.events || [];

        return rawEvents.map((event: any): ScannedEvent => {
            // Eventfinda sometimes defines prices as null if it's completely free or TBD
            const isFree = event.is_free === true || event.price_type === "free";

            return {
                id: `ef_${event.id}`,
                source: "Eventfinda",
                title: event.name,
                description: event.description || event.summary || "No description provided.",
                url: event.url,
                startDate: new Date(event.datetime_start),
                endDate: event.datetime_end ? new Date(event.datetime_end) : undefined,
                imageUrl: event.images?.images?.[0]?.transforms?.transforms?.[0]?.url || undefined,
                location: {
                    name: event.location?.summary || "TBA",
                    address: event.location?.address || "",
                    lat: event.point?.lat || lat,
                    lng: event.point?.lng || lng,
                },
                category: event.category?.name,
                isFree,
                // Combine min/max if available nicely
                priceRange: isFree ? "Free" : undefined,
            };
        });

    } catch (err) {
        throw new Error(`Failed to scrape Eventfinda: ${(err as Error).message}`);
    }
}

async function fetchGoogleEvents({ lat, lng, address, startDate, endDate, offset }: ScannerParams): Promise<ScannedEvent[]> {
    const API_KEY = process.env.SERPAPI_KEY;

    if (!API_KEY) {
        console.warn("SerpAPI key missing. Skipping Google Events scraper.");
        return [];
    }

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.append("engine", "google_events");
    url.searchParams.append("hl", "en");
    url.searchParams.append("gl", "nz");
    url.searchParams.append("api_key", API_KEY);

    // Google Events API limits 'htichips' to the first 10 events.
    // To bypass this pagination dead-end for future dates, we format the strict requested 
    // Start Date into a human-readable string and inject it directly into the search query.
    // Example: "events near Auckland starting March 6, 2026"

    const startObj = new Date(startDate);
    const dateFormatted = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).format(startObj);

    const searchQuery = `events near ${address} starting ${dateFormatted}`;
    url.searchParams.append("q", searchQuery);

    if (offset) {
        url.searchParams.append("start", offset.toString());
    }

    try {
        const response = await fetch(url.toString(), {
            next: { revalidate: 3600 } // Cache API results per unique URL
        });

        if (!response.ok) {
            throw new Error(`SerpAPI HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.events_results || !Array.isArray(data.events_results)) {
            return [];
        }

        return data.events_results.map((event: any): ScannedEvent => {
            // Google Events provides relatively unstructured dates
            // Attempt to build a real JS Date object out of the string, falling back to today if unable to parse cleanly
            let parsedDate = new Date();
            if (event.date?.start_date) {
                // Often looks like "Feb 23"
                parsedDate = new Date(`${event.date.start_date}, ${new Date().getFullYear()}`);
                if (isNaN(parsedDate.getTime())) parsedDate = new Date();
            }

            return {
                id: `ge_${event.title.replace(/\s+/g, '-').slice(0, 15)}_${Math.random()}`,
                source: "Google Events" as any, // Typecast to bypass TS until the real type updates
                title: event.title,
                description: event.description || "View tickets and details via Google.",
                url: event.link,
                startDate: parsedDate,
                displayTime: event.date?.when,
                imageUrl: event.image || event.thumbnail,
                location: {
                    name: event.venue?.name || event.address?.join(", ") || "TBA",
                    address: event.address?.join(", ") || "",
                    lat, // Defaulting to search center since Google rarely provides explicit coordinates here
                    lng,
                },
                isFree: false, // Cannot reliably determine pricing from SERP snippet
            };
        });

    } catch (err) {
        throw new Error(`Failed to scrape Google Events: ${(err as Error).message}`);
    }
}
