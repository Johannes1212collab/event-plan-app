"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { scanSurroundingEvents } from "@/actions/scanner";
import { ScannedEvent } from "@/types/scanner";
import LocationPicker from "@/components/events/location-picker";
import ScannedEventCard from "@/components/dashboard/scanned-event-card";
import { Loader2, Search, SlidersHorizontal, Calendar as CalendarIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function EventScanner() {
    const [selectedLat, setSelectedLat] = useState<number | null>(null);
    const [selectedLng, setSelectedLng] = useState<number | null>(null);
    const [address, setAddress] = useState<string>("");

    // Default 10km radius
    const [radius, setRadius] = useState<number>(10);

    // Default 7 days from now
    const [startDate, setStartDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState<string>(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));

    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<ScannedEvent[]>([]);
    const [hasScanned, setHasScanned] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLocationSelect = (addr: string, lat: number, lng: number) => {
        setAddress(addr);
        setSelectedLat(lat);
        setSelectedLng(lng);
    };

    const handleScan = async () => {
        if (!selectedLat || !selectedLng) return;

        setIsScanning(true);
        setError(null);
        setHasScanned(false);
        setResults([]);

        try {
            const events = await scanSurroundingEvents({
                lat: selectedLat,
                lng: selectedLng,
                radiusKm: radius,
                startDate,
                endDate
            });
            setResults(events);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsScanning(false);
            setHasScanned(true);
        }
    };

    return (
        <div className="w-full space-y-8">
            {/* Search Controls Form */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Search className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Event Scanner</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Location Column */}
                    <div className="md:col-span-12 lg:col-span-6 space-y-2">
                        <label className="text-sm font-medium">Search Center</label>
                        <LocationPicker onLocationSelect={handleLocationSelect} />
                    </div>

                    {/* Filters Column */}
                    <div className="md:col-span-12 lg:col-span-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center justify-between">
                                <span>Radius</span>
                                <span className="text-muted-foreground">{radius} km</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={radius}
                                onChange={(e) => setRadius(parseInt(e.target.value))}
                                className="w-full accent-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">End Date</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full py-6 text-lg"
                            disabled={!selectedLat || !selectedLng || isScanning}
                            onClick={handleScan}
                        >
                            {isScanning ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Scanning databases...
                                </>
                            ) : (
                                "Find Events"
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            {hasScanned && !isScanning && results.length === 0 && !error && (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground">No events found</h3>
                    <p className="text-muted-foreground">Try expanding your search radius or changing dates.</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">
                            Found {results.length} events
                        </h3>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            Sorted chronologically
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((event) => (
                            <ScannedEventCard key={event.id} event={event} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
