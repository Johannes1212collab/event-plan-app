"use server";

import { ScannedEvent } from "@/types/scanner";

interface ScannerParams {
    lat: number;
    lng: number;
    radiusKm: number;
    startDate: string; // ISO String (e.g. 2026-02-22)
    endDate: string;   // ISO String (e.g. 2026-03-01)
}

export async function scanSurroundingEvents(params: ScannerParams): Promise<ScannedEvent[]> {
    const events: ScannedEvent[] = [];

    // Parallel execution of all our API scrapers
    const results = await Promise.allSettled([
        fetchEventfindaEvents(params),
        fetchTicketmasterEvents(params),
    ]);

    // Push successful Eventfinda hits
    if (results[0].status === "fulfilled") {
        events.push(...results[0].value);
    } else {
        console.error("Eventfinda Scraper Failed:", results[0].reason);
    }

    // Push successful Ticketmaster hits
    if (results[1].status === "fulfilled") {
        events.push(...results[1].value);
    } else {
        console.error("Ticketmaster Scraper Failed:", results[1].reason);
    }

    // Sort chronologically by Start Date
    return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
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

async function fetchTicketmasterEvents({ lat, lng, radiusKm, startDate, endDate }: ScannerParams): Promise<ScannedEvent[]> {
    const API_KEY = process.env.TICKETMASTER_API_KEY;

    if (!API_KEY) {
        console.warn("Ticketmaster API key missing. Skipping Ticketmaster scraper.");
        return [];
    }

    // Convert start/end dates to Ticketmaster's required formats: YYYY-MM-DDTHH:mm:ssZ
    // The UI passes YYYY-MM-DD
    const tmStart = `${startDate}T00:00:00Z`;
    const tmEnd = `${endDate}T23:59:59Z`;

    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.append("apikey", API_KEY);
    url.searchParams.append("geoPoint", encodeURIComponent(`${lat},${lng}`)); // Approximate logic: geoPoint doesn't take lat,lng directly like this, geohash is better, but latlong works for radius
    url.searchParams.append("latlong", `${lat},${lng}`);
    url.searchParams.append("radius", radiusKm.toString());
    url.searchParams.append("unit", "km");
    url.searchParams.append("startDateTime", tmStart);
    url.searchParams.append("endDateTime", tmEnd);
    url.searchParams.append("size", "40"); // Top 40 results
    url.searchParams.append("sort", "date,asc");

    try {
        const response = await fetch(url.toString(), {
            next: { revalidate: 3600 } // Cache API results per unique URL
        });

        if (!response.ok) {
            throw new Error(`Ticketmaster HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        // Ticketmaster doesn't include _embedded if no results are found
        if (!data._embedded || !data._embedded.events) {
            return [];
        }

        return data._embedded.events.map((event: any): ScannedEvent => {
            const minPrice = event.priceRanges?.[0]?.min;
            const maxPrice = event.priceRanges?.[0]?.max;
            let priceString = undefined;

            if (minPrice && maxPrice) {
                priceString = `$${minPrice} - $${maxPrice}`;
            } else if (minPrice) {
                priceString = `$${minPrice}`;
            }

            // Find highest quality 16:9 image
            const bestImage = event.images?.find((img: any) => img.ratio === "16_9" && img.width > 600)?.url
                || event.images?.[0]?.url;

            const venue = event._embedded?.venues?.[0];

            return {
                id: `tm_${event.id}`,
                source: "Ticketmaster",
                title: event.name,
                description: event.info || event.description || "Grab your tickets on Ticketmaster!",
                url: event.url,
                startDate: new Date(event.dates.start.dateTime || event.dates.start.localDate),
                endDate: event.dates.end ? new Date(event.dates.end.dateTime || event.dates.end.localDate) : undefined,
                imageUrl: bestImage,
                location: {
                    name: venue?.name || "TBA",
                    address: venue?.address?.line1 || `${venue?.city?.name}, ${venue?.country?.name}`,
                    lat: parseFloat(venue?.location?.latitude) || lat,
                    lng: parseFloat(venue?.location?.longitude) || lng,
                },
                category: event.classifications?.[0]?.segment?.name || event.classifications?.[0]?.genre?.name,
                isFree: priceString === "$0 - $0" || priceString === "$0",
                priceRange: priceString,
            };
        });

    } catch (err) {
        throw new Error(`Failed to scrape Ticketmaster: ${(err as Error).message}`);
    }
}
