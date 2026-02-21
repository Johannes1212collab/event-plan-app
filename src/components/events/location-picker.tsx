"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";

import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { useLoadScript } from "@react-google-maps/api";

// Dynamically import the map component to avoid SSR issues
const GoogleMapUI = dynamic(
    () => import("@/components/events/google-map"),
    {
        ssr: false,
        loading: () => <div className="h-full w-full bg-secondary animate-pulse flex items-center justify-center text-muted-foreground">Loading Map...</div>
    }
);

export default function LocationPicker({
    onLocationSelect,
}: {
    onLocationSelect: (address: string, lat: number, lng: number) => void;
}) {
    const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: ["places"],
    });

    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* optional options like radius, types */
        },
        debounce: 300,
    });

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = getLatLng(results[0]);

            setSelectedLocation([lat, lng]);
            onLocationSelect(address, lat, lng);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    if (loadError) return <div className="h-full w-full bg-red-50 text-red-500 font-medium flex items-center justify-center p-4 rounded-md">Error loading Google Maps</div>;
    if (!isLoaded) return <div className="h-full w-full bg-secondary animate-pulse flex items-center justify-center text-muted-foreground p-4 rounded-md">Loading Map Engine...</div>;

    return (
        <div className="space-y-4 relative z-50">
            <div className="relative z-50">
                <div className="relative">
                    <Input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Search for a venue (e.g. London)..."
                        className="pl-10"
                        disabled={!isLoaded || !ready}
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                {status === "OK" && (
                    <ul className="absolute z-[100] w-full bg-popover border border-border rounded-md shadow-xl mt-1 max-h-60 overflow-auto">
                        {data.map(({ place_id, description }) => (
                            <li
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="px-4 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm text-popover-foreground font-medium border-b border-border last:border-0"
                            >
                                {description}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="h-[200px] w-full rounded-md overflow-hidden border bg-secondary relative z-0">
                <GoogleMapUI
                    center={selectedLocation ? { lat: selectedLocation[0], lng: selectedLocation[1] } : { lat: 51.505, lng: -0.09 }}
                    markerPosition={selectedLocation ? { lat: selectedLocation[0], lng: selectedLocation[1] } : undefined}
                />
            </div>
        </div>
    );
}
