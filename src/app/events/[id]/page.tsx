
import { Metadata } from "next";
import { auth, signOut } from "@/auth";
import { getEventById, getEventMedia, getEventMetadata } from "@/actions/event";
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
import { EventChecklist } from "@/components/events/event-checklist";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    try {
        const { id } = await params;
        const event = await getEventMetadata(id);

        if (!event) {
            return {
                title: "Event Not Found",
                description: "The event you are looking for does not exist.",
            }
        }

        const eventDate = new Date(event.date);
        const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = event.isFullDay ? '' : ` at ${eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        const description = `${dateStr}${timeStr} • Hosted by ${event.host.name}. ${event.description ? event.description.slice(0, 50) + "..." : ""}`;

        return {
            title: event.title,
            description: description,
            openGraph: {
                title: event.title,
                description: description,
                url: `https://www.eventhub.community/events/${event.id}`,
                siteName: "EventHub",
                images: [
                    {
                        url: `https://www.eventhub.community/api/og?eventId=${event.id}`,
                        width: 1200,
                        height: 630,
                        alt: event.title,
                        type: "image/png",
                    }
                ],
                locale: "en_US",
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title: event.title,
                description: description,
                images: [
                    {
                        url: `https://www.eventhub.community/api/og?eventId=${event.id}`,
                        width: 1200,
                        height: 630,
                        alt: event.title,
                    }
                ],
            },
        }
    } catch (e: any) {
        return {
            title: "Metadata Error",
            openGraph: {
                title: "Error: " + e.message,
                description: String(e.stack).substring(0, 200),
            }
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

    // CRITICAL: Next.js streaming bug fix.
    // If we don't await the metadata cache here before awaiting auth(), 
    // the auth() check finishes instantly and streams the `<head>` before generateMetadata finishes.
    // This pushes all OpenGraph image tags to the bottom of the HTML payload, which breaks Messenger previews.
    await getEventMetadata(params.id);

    const session = await auth();

    if (!session?.user?.id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p>You must be logged in to view this event.</p>
                <form action={async () => {
                    "use server";
                    await signOut({ redirectTo: `/login?callbackUrl=/events/${params.id}` });
                }}>
                    <Button>Sign In</Button>
                </form>
            </div>
        );
    }

    const event = await getEventById(params.id);
    const eventMedia = await getEventMedia(params.id);

    if (!event) {
        const tombstone = await db.deletedEvent.findUnique({ where: { id: params.id } });
        if (tombstone) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
                    <Card className="max-w-md w-full text-center shadow-lg border-red-100">
                        <CardHeader>
                            <CardTitle className="text-xl text-red-600">Event Deleted</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">The creator has unfortunately cancelled and deleted this event.</p>
                            <Button asChild className="w-full mt-4">
                                <Link href="/dashboard">Return to Dashboard</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        return <div className="flex items-center justify-center min-h-screen">Event not found</div>;
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
            <header className="bg-background border-b sticky top-0 z-10">
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
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {new Date(event.date).toLocaleDateString()}
                                    {!event.isFullDay && ` at ${new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {event.location || "Location TBD"}
                                </div>
                                <div className="flex flex-col text-sm text-muted-foreground mt-4">
                                    <span className="font-semibold text-foreground mb-1">Description:</span>
                                    <div className="whitespace-pre-wrap break-words overflow-hidden max-w-full">
                                        {event.description ? (
                                            event.description.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                                                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                                                if (match) {
                                                    return (
                                                        <a
                                                            key={i}
                                                            href={match[2]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline break-all"
                                                        >
                                                            {match[1]}
                                                        </a>
                                                    );
                                                }
                                                return <span key={i}>{part}</span>;
                                            })
                                        ) : (
                                            "No description."
                                        )}
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-foreground">Actions</span>
                                        <div className="flex gap-2">
                                            <EventActionsMenu event={event} />
                                        </div>
                                    </div>
                                </div>
                                {event.lat && event.lng && (
                                    <div className="pt-4 space-y-3">
                                        <div className="h-[200px] w-full rounded-md overflow-hidden">
                                            <EventMap lat={event.lat} lng={event.lng} />
                                        </div>
                                        <Button asChild variant="secondary" className="w-full font-medium">
                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`} target="_blank" rel="noopener noreferrer">
                                                <MapPin className="mr-2 h-4 w-4" />
                                                Get Directions
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Event Checklist / Tasks */}
                        {isParticipant && (
                            <EventChecklist
                                eventId={event.id}
                                initialTasks={event.tasks as any}
                                currentUserId={session.user.id}
                                isHost={session.user.id === event.hostId}
                            />
                        )}

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
