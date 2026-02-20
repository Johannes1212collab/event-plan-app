
import { Metadata } from "next";
import { auth, signOut } from "@/auth";
import { getEventById, getEventMedia } from "@/actions/event";
import { Chat } from "@/components/events/chat";
import { EventActionsMenu } from "@/components/events/event-actions-menu";
import { QRInvite } from "@/components/events/qr-invite";
import { EventMap } from "@/components/events/event-map";
import { MediaGallery } from "@/components/events/media-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, MapPin, User, LogOut, Share2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { OnboardingTour } from "@/components/onboarding-tour";
import { AutoJoiner } from "@/components/events/auto-joiner";


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

interface EventPageProps {
    params: Promise<{
        id: string;
    }>;
}

const EventPage = async (props: EventPageProps) => {
    const params = await props.params;
    const session = await auth();

    if (!session?.user?.id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p>You must be logged in to view this event.</p>
                <form action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                }}>
                    <Button>Sign In</Button>
                </form>
            </div>
        );
    }

    const event = await getEventById(params.id);
    const eventMedia = await getEventMedia(params.id);

    if (!event) {
        return <div>Event not found</div>;
    }

    // Fetch user to get fresh hasSeenOnboarding status
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { hasSeenOnboarding: true }
    });

    // Check if user is participant?
    // Access Code logic?
    // For now, assume if you have the link (and probably added to participant on creation or join)
    // We need a 'Join' flow if not participant. But let's keep it simple: if you see it, you can chat.
    // Or better: auto-join if you have the link?
    const isParticipant = event.participants.some((p: any) => p.userId === session?.user?.id);


    // ... existing imports ...

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <OnboardingTour hasSeenOnboarding={user?.hasSeenOnboarding ?? false} page="event" />
            {!isParticipant && <AutoJoiner eventId={event.id} />}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-x-2 font-bold text-lg hover:opacity-80 transition-opacity">
                        &larr; Back
                    </Link>
                    {session.user.id === event.hostId && (
                        <DeleteEventButton eventId={event.id} />
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event Details */}
                    <div className="lg:col-span-1 space-y-6" id="event-title-card">
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
                                            <EventActionsMenu event={event} />
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
        </div>
    );
}

export default EventPage;
