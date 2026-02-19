"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

interface LeafletMapProps {
    center: [number, number];
    markerPosition?: [number, number];
    interactive?: boolean;
}

export default function LeafletMap({
    center,
    markerPosition,
    interactive = true,
}: LeafletMapProps) {
    return (
        <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
            dragging={interactive}
            zoomControl={interactive}
            doubleClickZoom={interactive}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markerPosition && <Marker position={markerPosition} />}
            <ChangeView center={center} />
        </MapContainer>
    );
}
