"use client";

import { useState, useMemo } from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const libraries: ("places")[] = ["places"];

export default function LocationPicker({
    onLocationSelect,
}: {
    onLocationSelect: (address: string, lat: number, lng: number) => void;
}) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: libraries,
    });

    if (!isLoaded) return <div>Loading Maps...</div>;

    return <MapSearch onLocationSelect={onLocationSelect} />;
}

function MapSearch({
    onLocationSelect,
}: {
    onLocationSelect: (address: string, lat: number, lng: number) => void;
}) {
    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete();

    const [selectedLocation, setSelectedLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            setSelectedLocation({ lat, lng });
            onLocationSelect(address, lat, lng);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="relative">
                    <Input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        disabled={!ready}
                        placeholder="Search for a venue..."
                        className="pl-10"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>

                {status === "OK" && (
                    <ul className="absolute z-50 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {data.map(({ place_id, description }) => (
                            <li
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                                {description}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="h-[200px] w-full rounded-md overflow-hidden border">
                <GoogleMap
                    zoom={15}
                    center={selectedLocation || { lat: 40.7128, lng: -74.0060 }} // Default to NYC
                    mapContainerClassName="w-full h-full"
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                    }}
                >
                    {selectedLocation && <Marker position={selectedLocation} />}
                </GoogleMap>
            </div>
        </div>
    );
}
