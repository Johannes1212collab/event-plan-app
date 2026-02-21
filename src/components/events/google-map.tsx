"use client";

import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { useMemo } from "react";

interface GoogleMapUIProps {
    center: { lat: number; lng: number };
    markerPosition?: { lat: number; lng: number };
    interactive?: boolean;
}

export default function GoogleMapUI({
    center,
    markerPosition,
    interactive = true,
}: GoogleMapUIProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries: ["places"], // Load places library alongside maps
    });

    const mapOptions = useMemo(
        () => ({
            disableDefaultUI: !interactive,
            clickableIcons: interactive,
            scrollwheel: interactive,
            draggable: interactive,
            zoomControl: interactive,
        }),
        [interactive]
    );

    if (loadError) return <div className="h-full w-full bg-red-50 text-red-500 font-medium flex items-center justify-center">Error loading Google Maps</div>;
    if (!isLoaded) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-muted-foreground">Loading Map...</div>;

    return (
        <GoogleMap
            zoom={13}
            center={center}
            mapContainerStyle={{ width: "100%", height: "100%" }}
            options={mapOptions}
        >
            {markerPosition && <Marker position={markerPosition} />}
        </GoogleMap>
    );
}
