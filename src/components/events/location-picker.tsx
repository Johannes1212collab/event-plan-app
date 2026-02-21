"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const LeafletMap = dynamic(
    () => import("@/components/events/leaflet-map"),
    {
        ssr: false,
        loading: () => <div className="h-full w-full bg-secondary animate-pulse flex items-center justify-center text-muted-foreground">Loading Map...</div>
    }
);

interface Place {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

export default function LocationPicker({
    onLocationSelect,
}: {
    onLocationSelect: (address: string, lat: number, lng: number) => void;
}) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Place[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Debouce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 2) {
                setIsSearching(true);
                try {
                    // Use OpenStreetMap Nominatim API
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                            query
                        )}&limit=5`
                    );
                    const data = await response.json();
                    setSuggestions(data);
                } catch (error) {
                    console.error("Error searching location:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (place: Place) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        setSelectedLocation([lat, lng]);
        setQuery(place.display_name);
        setSuggestions([]);
        onLocationSelect(place.display_name, lat, lng);
    };

    return (
        <div className="space-y-4 relative z-50">
            <div className="relative z-50">
                <div className="relative">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a venue (e.g. London)..."
                        className="pl-10"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                {suggestions.length > 0 && (
                    <ul className="absolute z-[100] w-full bg-popover border border-border rounded-md shadow-xl mt-1 max-h-60 overflow-auto">
                        {suggestions.map((place) => (
                            <li
                                key={place.place_id}
                                onClick={() => handleSelect(place)}
                                className="px-4 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm text-popover-foreground font-medium border-b border-border last:border-0"
                            >
                                {place.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="h-[200px] w-full rounded-md overflow-hidden border bg-secondary relative z-0">
                <LeafletMap
                    center={selectedLocation || [51.505, -0.09]}
                    markerPosition={selectedLocation || undefined}
                />
            </div>
        </div>
    );
}
