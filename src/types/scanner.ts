export interface ScannedEvent {
    id: string;             // Unique ID from the source (e.g., ticketmaster_123)
    source: "Eventfinda" | "Google Events";
    title: string;          // Name of the event
    description: string;    // Short summary/description
    url: string;            // Direct link to buy tickets or view details
    startDate: Date;        // Starting time
    endDate?: Date;         // Ending time (optional)
    imageUrl?: string;      // Hero image for the card
    location: {
        name: string;       // Venue Name (e.g., "Spark Arena")
        address: string;    // Full address
        lat: number;
        lng: number;
        distanceKm?: number;// How far it is from the search center
    };
    category?: string;      // e.g., "Music", "Sports", "Festival"
    isFree: boolean;        // Is this event free?
    priceRange?: string;    // e.g., "$50 - $150"
}
