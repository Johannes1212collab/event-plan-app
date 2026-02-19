"use client";

import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

const libraries: ("places")[] = ["places"];

export function EventMap({ lat, lng }: { lat: number; lng: number }) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: libraries,
    });

    if (!isLoaded || !lat || !lng) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400"><MapPin className="h-8 w-8" /></div>;

    return (
        <GoogleMap
            zoom={15}
            center={{ lat, lng }}
            mapContainerClassName="w-full h-full"
            options={{
                disableDefaultUI: true,
                zoomControl: true,
            }}
        >
            <Marker position={{ lat, lng }} />
        </GoogleMap>
    );
}
