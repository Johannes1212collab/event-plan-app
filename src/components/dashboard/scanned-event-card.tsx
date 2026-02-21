import { ScannedEvent } from "@/types/scanner";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, MapPin, Ticket, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ScannedEventCard({ event }: { event: ScannedEvent }) {
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
                            {format(event.startDate, "EEEE, MMM d, yyyy \u2022 h:mm a")}
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

                <div className="mt-auto flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                        {event.category && (
                            <Badge variant="outline" className="text-xs font-normal">
                                {event.category}
                            </Badge>
                        )}
                    </div>
                    <Button asChild size="sm">
                        <a href={event.url} target="_blank" rel="noopener noreferrer">
                            View {event.source} <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
