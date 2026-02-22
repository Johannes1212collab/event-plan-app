import { Calendar, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function MyEventsTab({ createdEvents, invitedEvents, pastEvents, archivedEvents }: any) {
    return (
        <div className="focus-visible:outline-none focus-visible:ring-0">
            {createdEvents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-300">
                    <div className="mx-auto h-12 w-12 text-slate-400">
                        <Calendar className="h-12 w-12" />
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No upcoming events</h3>
                    <p className="mt-1 text-sm text-slate-500">Get started by creating a new event.</p>
                    <div className="mt-6">
                        <Button asChild id="new-event-btn-empty">
                            <Link href="/events/create">
                                <Plus className="h-4 w-4 mr-2" />
                                New Event
                            </Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdEvents.map((event: any) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            )}

            {invitedEvents.length > 0 && (
                <div className="mt-16">
                    <div className="flex items-start justify-between mb-8 gap-4 border-t pt-8">
                        <div className="pr-4 sm:pr-0 max-w-[75%]">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Upcoming Invitations</h2>
                            <p className="text-slate-500 mt-1">Events you are attending or invited to.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invitedEvents.map((event: any) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </div>
            )}

            {pastEvents.length > 0 && (
                <div className="mt-16">
                    <div className="flex items-start justify-between mb-8 gap-4 border-t pt-8">
                        <div className="pr-4 sm:pr-0 max-w-[75%]">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Past Events</h2>
                            <p className="text-slate-500 mt-1">Events that happened within the last 3 days.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastEvents.map((event: any) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </div>
            )}

            {archivedEvents.length > 0 && (
                <div className="mt-16 bg-slate-100/50 p-6 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-8 gap-4">
                        <div className="pr-4 sm:pr-0 max-w-[75%]">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                Archived Events
                            </h2>
                            <p className="text-slate-500 mt-1">Older events you've hosted or attended.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 grayscale-[20%] hover:grayscale-0 transition-all">
                        {archivedEvents.map((event: any) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function EventCard({ event }: { event: any }) {
    return (
        <Card className="group hover:border-black/50 transition-colors cursor-pointer flex flex-col h-full shadow-sm hover:shadow-md">
            <Link href={`/events/${event.id}`} className="flex flex-col flex-grow">
                <CardHeader>
                    <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                        {event.description || "No description provided."}
                    </p>
                    <div className="flex items-center mt-4 text-xs text-slate-500 font-medium">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        <span className="truncate">{event.location || "Location TBD"}</span>
                    </div>
                </CardContent>
                <CardFooter className="mt-auto pt-0 flex justify-between items-center text-xs text-muted-foreground border-t bg-slate-50/80 p-4 rounded-b-lg">
                    <span>Hosted by {event.host?.name || "Unknown"}</span>
                </CardFooter>
            </Link>
        </Card>
    );
}
