"use client";

import { ScannedEvent } from "@/types/scanner";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, MapPin, Ticket, AlertCircle, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/actions/event";
import { toast } from "sonner";

export default function ScannedEventCard({ event }: { event: ScannedEvent }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateGroup = () => {
        setIsCreating(true);
        startTransition(async () => {
            try {
                // If it's a bare date from SerpAPI, the server parsed it as UTC Midnight.
                // We run a client-side regex on the 'displayTime' to explicitly extract and set the real local time.
                let finalDate = new Date(event.startDate);
                let isFullDay = finalDate.getHours() === 0 && finalDate.getMinutes() === 0;

                if (isFullDay && event.displayTime) {
                    // Look for patterns like "7 PM", "7:30 PM", "19:00"
                    const timeMatch = event.displayTime.match(/(\d{1,2})(:(\d{2}))?\s*(am|pm)?/i);
                    if (timeMatch) {
                        let hours = parseInt(timeMatch[1], 10);
                        const minutes = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
                        const modifier = timeMatch[4]?.toLowerCase();

                        if (modifier === 'pm' && hours < 12) hours += 12;
                        if (modifier === 'am' && hours === 12) hours = 0;

                        finalDate.setHours(hours, minutes, 0, 0);
                        isFullDay = false; // We found a specific time, so it's not a full day event
                    }
                }

                const payload = {
                    title: event.title,
                    description: `[View Original Event Details](${event.url})\n\nFound via ${event.source}.\n\n` + (event.description || ""),
                    date: finalDate.toISOString(),
                    isFullDay,
                    location: event.location.name + (event.location.address ? ` - ${event.location.address}` : ""),
                    lat: event.location.lat,
                    lng: event.location.lng,
                };

                const result = await createEvent(payload);

                if (result?.error) {
                    toast.error(result.error);
                    setIsCreating(false);
                } else if (result?.success && result.eventId) {
                    toast.success("Group created! Taking you there now...");
                    router.push(`/events/${result.eventId}`);
                }
            } catch (err) {
                toast.error("Failed to create event group. Please try again.");
                setIsCreating(false);
            }
        });
    };

    return (
        <div className="flex flex-col md:flex-row border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-card">
            {/* Image Section */}
            <div className="relative w-full md:w-48 h-48 md:h-auto bg-black/5 shrink-0">
                {event.imageUrl ? (
                    <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        className="object-contain"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-secondary/50">
                        <Calendar className="h-8 w-8 opacity-20" />
                    </div>
                )}
                {/* Source Badge */}
                <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-0 font-medium text-xs">
                        {event.source}
                    </Badge>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-5 overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-2">
                            {event.title}
                        </h3>
                        <p className="text-sm font-medium text-primary mb-3">
                            {event.displayTime || format(event.startDate, "EEEE, MMM d, yyyy \u2022 h:mm a")}
                        </p>
                    </div>
                    {event.isFree && (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
                            Free
                        </Badge>
                    )}
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">
                            <span className="font-medium text-foreground">{event.location.name}</span>
                            {event.location.address && ` • ${event.location.address}`}
                        </span>
                    </div>

                    {event.priceRange && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-2 py-1 w-fit">
                            <Ticket className="h-3.5 w-3.5" />
                            <span>{event.priceRange}</span>
                        </div>
                    )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {event.description}
                </p>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        {event.category && (
                            <Badge variant="outline" className="text-xs font-normal">
                                {event.category}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap ml-auto">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCreateGroup}
                            disabled={isCreating || isPending}
                        >
                            {(isCreating || isPending) ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <Users className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Plan Group
                        </Button>
                        <Button asChild size="sm">
                            <a href={event.url} target="_blank" rel="noopener noreferrer">
                                View {event.source} <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
