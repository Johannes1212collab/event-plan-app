"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { scanSurroundingEvents } from "@/actions/scanner";
import { ScannedEvent } from "@/types/scanner";
import LocationPicker from "@/components/events/location-picker";
import ScannedEventCard from "@/components/dashboard/scanned-event-card";
import { Loader2, Search, SlidersHorizontal, Calendar as CalendarIcon, X, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

    // Infinite Scroll Pagination States
    const [offset, setOffset] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    const [isLocating, setIsLocating] = useState(false);

    const handleLocationSelect = (addr: string, lat: number, lng: number) => {
        setAddress(addr);
        setSelectedLat(lat);
        setSelectedLng(lng);
    };

    const handleGeolocate = async () => {
        setIsLocating(true);
        toast.dismiss();

        const resolveAddress = async (lat: number, lng: number, fallbackCity = "My Location") => {
            try {
                const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`, { signal: AbortSignal.timeout(4000) });
                const data = await res.json();
                let foundAddress = fallbackCity;
                if (data.results && data.results.length > 0) {
                    const localityObj = data.results.find((r: any) => r.types.includes("locality"));
                    if (localityObj) {
                        foundAddress = localityObj.formatted_address;
                    } else {
                        foundAddress = data.results[0].formatted_address;
                    }
                }
                setAddress(foundAddress);
                setSelectedLat(lat);
                setSelectedLng(lng);
                setRadius(5);
            } catch (error) {
                console.error("Geocoding failed", error);
                setAddress(fallbackCity);
                setSelectedLat(lat);
                setSelectedLng(lng);
                setRadius(5);
            }
        };

        const tryIpFallback = async () => {
            try {
                const ipRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    if (ipData.latitude && ipData.longitude) {
                        await resolveAddress(ipData.latitude, ipData.longitude, `${ipData.city || 'Your Area'} (Approximate)`);
                        return true;
                    }
                }
            } catch (err) {
                console.error("IP Fallback Failed", err);
            }
            return false;
        };

        const getDeviceLocation = () => {
            return new Promise<GeolocationPosition>((resolve, reject) => {
                if (!("geolocation" in navigator)) {
                    reject(new Error("No Geolocation Support"));
                    return;
                }
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 4000, 
                    maximumAge: 60000
                });
            });
        };

        try {
            const position = await getDeviceLocation();
            await resolveAddress(position.coords.latitude, position.coords.longitude);
        } catch (deviceError) {
            console.warn("Device location rejected/timed out. Attempting IP fallback.", deviceError);
            const ipSuccess = await tryIpFallback();
            
            if (!ipSuccess) {
                toast.error("Could not determine your location. Please type a city manually.");
            }
        } finally {
            setIsLocating(false);
        }
    };

    const handleScan = async () => {
        if (!selectedLat || !selectedLng || !address) return;

        setIsScanning(true);
        setError(null);
        setHasScanned(false);
        setResults([]);
        setOffset(0);
        setHasMore(false);

        try {
            const { events, hasMore: moreAvailable } = await scanSurroundingEvents({
                address,
                lat: selectedLat,
                lng: selectedLng,
                radiusKm: radius,
                startDate,
                endDate,
                offset: 0
            });
            setResults(events);
            setHasMore(moreAvailable);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsScanning(false);
            setHasScanned(true);
        }
    };

    const loadMore = useCallback(async () => {
        if (!selectedLat || !selectedLng || !address || isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const nextOffset = offset + 10;

        try {
            const { events, hasMore: moreAvailable } = await scanSurroundingEvents({
                address,
                lat: selectedLat,
                lng: selectedLng,
                radiusKm: radius,
                startDate,
                endDate,
                offset: nextOffset
            });

            setResults(prev => {
                // Filter out any duplicate IDs to prevent rendering bugs if Google's pagination shifts mid-scroll
                const existingIds = new Set(prev.map(e => e.id));
                const newEvents = events.filter(e => !existingIds.has(e.id));
                return [...prev, ...newEvents];
            });
            setHasMore(moreAvailable);
            setOffset(nextOffset);
        } catch (err) {
            console.error("Failed to fetch more events:", err);
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [address, endDate, hasMore, isLoadingMore, offset, radius, selectedLat, selectedLng, startDate]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isScanning) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isScanning, loadMore]);

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
                        <div className="flex items-center justify-between pb-1">
                            <label className="text-sm font-medium">Search Center</label>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={handleGeolocate}
                                disabled={isLocating}
                            >
                                {isLocating ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                    <Navigation className="h-3 w-3 mr-1" />
                                )}
                                Around me
                            </Button>
                        </div>
                        <LocationPicker onLocationSelect={handleLocationSelect} />
                        {address && selectedLat && selectedLng && (
                            <p className="text-xs text-muted-foreground mt-1 text-right">
                                Active Center: <span className="font-semibold text-foreground">{address}</span>
                            </p>
                        )}
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
                            disabled={!selectedLat || !selectedLng || !address || isScanning}
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

                    {/* Infinite Scroll Trigger */}
                    <div ref={observerTarget} className="h-4 w-full" />

                    {isLoadingMore && (
                        <div className="flex justify-center items-center py-6 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Loading more events...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
