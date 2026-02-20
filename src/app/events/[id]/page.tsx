
import { Metadata } from "next";
import { auth, signOut } from "@/auth";
import { getEventById, getEventMedia } from "@/actions/event";
import { Chat } from "@/components/events/chat";
import { AddToCalendar } from "@/components/events/add-to-calendar";
import { QRInvite } from "@/components/events/qr-invite";
import { EventMap } from "@/components/events/event-map";
import { MediaGallery } from "@/components/events/media-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, MapPin, User, LogOut, Share2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteEventButton } from "@/components/events/delete-event-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
        return {
            title: "Event Not Found",
            description: "The event you are looking for does not exist.",
        }
    }

    return {
        title: `${event.title} - EventHub`,
        description: `Join ${event.host.name} for ${event.title} on ${new Date(event.date).toLocaleDateString()}. ${event.description || ""}`,
        openGraph: {
            title: event.title,
            description: `Hosted by ${event.host.name}. ${event.description ? event.description.slice(0, 100) + "..." : ""}`,
            // url is automatically handled relative to metadataBase in layout.tsx
        }
    }
}

const EventPage = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || !session.user.id) {
        redirect(`/login?callbackUrl=/events/${id}`);
    }

    const event = await getEventById(id);
    const eventMedia = await getEventMedia(id);

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-xl font-semibold">Event not found</p>
                <Button asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    // Check if user is participant?
    // Access Code logic?
    // For now, assume if you have the link (and probably added to participant on creation or join)
    // We need a 'Join' flow if not participant. But let's keep it simple: if you see it, you can chat.
    // Or better: auto-join if you have the link?

    // ... existing imports ...

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-x-2 font-bold text-lg hover:opacity-80 transition-opacity">
                        &larr; Back
                    </Link>
                    {session.user.id === event.hostId && (
                        <DeleteEventButton eventId={event.id} />
                    )}
                </div>
            </header >

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event Details */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{event.title}</CardTitle>
                                <CardDescription>Hosted by {event.host.name}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center text-sm text-slate-600">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {event.location || "Location TBD"}
                                </div>
                                <div className="flex items-start text-sm text-slate-600">
                                    <span className="font-semibold mr-2">Description:</span>
                                    <p>{event.description || "No description."}</p>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-slate-700">Actions</span>
                                        <div className="flex gap-2">
                                            <AddToCalendar event={event} />
                                            <QRInvite />
                                        </div>
                                    </div>
                                </div>
                                {event.lat && event.lng && (
                                    <div className="pt-4 border-t h-[200px] w-full rounded-md overflow-hidden">
                                        <EventMap lat={event.lat} lng={event.lng} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Participants ({event.participants.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {event.participants.map((p: any) => (
                                        <div key={p.id} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                                            <div className="h-6 w-6 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold">
                                                {p.user.name?.[0] || "?"}
                                            </div>
                                            <span className="text-xs font-medium truncate max-w-[100px]">{p.user.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Media Gallery Section */}
                        <MediaGallery initialMedia={eventMedia} />
                    </div>

                    {/* Chat Section */}
                    <div className="lg:col-span-2">
                        <Chat
                            eventId={event.id}
                            initialMessages={event.messages}
                            currentUserId={session.user.id}
                        />
                    </div>
                </div>
            </main>
        </div >
    );
}

export default EventPage;
