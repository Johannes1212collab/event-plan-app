"use client";

import dynamic from "next/dynamic";

const GoogleMapUI = dynamic(
    () => import("@/components/events/google-map"),
    {
        ssr: false,
        loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
    }
);

export function EventMap({ lat, lng }: { lat: number; lng: number }) {
    if (!lat || !lng) return null;

    return (
        <GoogleMapUI
            center={{ lat, lng }}
            markerPosition={{ lat, lng }}
            interactive={false}
        />
    );
}
