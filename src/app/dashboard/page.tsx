
import { auth, signOut } from "@/auth";
import { getEvents } from "@/actions/event";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, MapPin, Plus, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import db from "@/lib/db";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ShareSiteButton } from "@/components/share-site-button";
import { InstallPWAButton } from "@/components/install-pwa-button";
import { NotificationsManager } from "@/components/notifications-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventScanner from "@/components/dashboard/event-scanner";
import { ImageRequestsInbox } from "@/components/dashboard/image-requests-inbox";

const DashboardPage = async ({ searchParams }: { searchParams: Promise<{ tab?: string }> }) => {
    const session = await auth();
    const { tab } = await searchParams;
    const defaultTab = tab === "discover" ? "discover" : "my-events";

    if (!session?.user?.id) {
        redirect("/login");
    }

    const { upcomingEvents, pastEvents, archivedEvents } = await getEvents();

    // Fetch user to get fresh hasSeenOnboarding status
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { hasSeenOnboarding: true }
    });

    const createdEvents = upcomingEvents.filter((e: any) => e.hostId === session.user!.id);
    const invitedEvents = upcomingEvents.filter((e: any) => e.hostId !== session.user!.id);

    return (
        <div className="min-h-screen bg-slate-50">
            <OnboardingTour hasSeenOnboarding={user?.hasSeenOnboarding ?? false} page="dashboard" />
            {tab === "discover" && <OnboardingTour hasSeenOnboarding={false} page="discover" />}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <InstallPWAButton />

                    <div className="flex items-center gap-x-2 sm:gap-x-4">
                        <NotificationsManager />
                        <ShareSiteButton />
                        <span className="hidden sm:block text-sm font-medium text-slate-700 truncate max-w-none">
                            <Link href={`/user/${session.user.id}`} className="hover:underline" id="user-profile-link">
                                {session.user.name}
                            </Link>
                        </span>
                        <form action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/login" });
                        }}>
                            <Button variant="ghost" size="icon" title="Sign Out">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Image Requests Inbox */}
                <ImageRequestsInbox userId={session.user.id} />
                <Tabs defaultValue={defaultTab} className="w-full">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <TabsList className="h-11 px-1 bg-slate-200/50">
                            <TabsTrigger value="my-events" className="text-sm px-6 h-9 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md asChild">
                                <Link href="/dashboard?tab=my-events" className="block w-full h-full pt-1.5 focus:outline-none">
                                    My Events
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger value="discover" id="discover-tab" className="text-sm px-6 h-9 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-medium text-primary data-[state=active]:text-primary focus:text-primary asChild">
                                <Link href="/dashboard?tab=discover" className="block w-full h-full pt-1.5 focus:outline-none">
                                    Discover
                                </Link>
                            </TabsTrigger>
                        </TabsList>

                        <Button asChild className="shrink-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow mt-1" id="new-event-btn">
                            <Link href="/events/create">
                                <Plus className="h-4 w-4 mr-2" />
                                New Event
                            </Link>
                        </Button>
                    </div>

                    <TabsContent value="my-events" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
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
                    </TabsContent>

                    <TabsContent value="discover" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <EventScanner />
                    </TabsContent>
                </Tabs>
            </main>
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

export default DashboardPage;
