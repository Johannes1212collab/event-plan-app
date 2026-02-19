"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import dynamic from "next/dynamic";

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

export function EventMap({ lat, lng }: { lat: number; lng: number }) {
    if (!lat || !lng) return null;

    return (
        <MapContainer
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
            dragging={false} // Read-only feel
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} />
        </MapContainer>
    );
}
