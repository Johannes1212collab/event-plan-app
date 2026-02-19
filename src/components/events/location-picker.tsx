"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import dynamic from "next/dynamic";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const useMap = dynamic(
    () => import("react-leaflet").then((mod) => mod.useMap),
    { ssr: false }
);

interface Place {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

// Helper component to move map center
function ChangeView({ center }: { center: [number, number] }) {
    const map = require("react-leaflet").useMap();
    map.setView(center);
    return null;
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
        <div className="space-y-4">
            <div className="relative">
                <div className="relative">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for a venue (e.g. London)..."
                        className="pl-10"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>

                {suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {suggestions.map((place) => (
                            <li
                                key={place.place_id}
                                onClick={() => handleSelect(place)}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                                {place.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="h-[200px] w-full rounded-md overflow-hidden border bg-slate-100 relative">
                {/* We default to London if no selection, just to show a map */}
                <MapContainer
                    center={selectedLocation || [51.505, -0.09]}
                    zoom={13}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {selectedLocation && (
                        <>
                            <Marker position={selectedLocation} />
                            <ChangeView center={selectedLocation} />
                        </>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
