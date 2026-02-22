
import { auth, signOut } from "@/auth";
import { getEvents } from "@/actions/event";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, MapPin, Plus, LogOut, User } from "lucide-react";
import { redirect } from "next/navigation";

import db from "@/lib/db";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ShareSiteButton } from "@/components/share-site-button";
import { InstallPWAButton } from "@/components/install-pwa-button";
import { NotificationsManager } from "@/components/notifications-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventScanner from "@/components/dashboard/event-scanner";
import { ImageRequestsInbox } from "@/components/dashboard/image-requests-inbox";
import { MyEventsTab } from "@/components/dashboard/my-events-tab";

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

                        {/* Desktop Profile Link */}
                        <Link href={`/user/${session.user.id}`} id="user-profile-link-desktop" className="hidden sm:inline-flex text-sm font-medium text-slate-700 truncate max-w-none hover:underline">
                            {session.user.name}
                        </Link>

                        {/* Mobile Profile Link */}
                        <Button variant="ghost" size="icon" asChild className="sm:hidden" id="user-profile-link" title="Profile">
                            <Link href={`/user/${session.user.id}`}>
                                <User className="h-4 w-4" />
                            </Link>
                        </Button>

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
                        <MyEventsTab
                            createdEvents={createdEvents}
                            invitedEvents={invitedEvents}
                            pastEvents={pastEvents}
                            archivedEvents={archivedEvents}
                        />
                    </TabsContent>

                    <TabsContent value="discover" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <EventScanner />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

export default DashboardPage;
