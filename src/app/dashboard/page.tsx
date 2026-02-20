
import { auth, signOut } from "@/auth";
import { getEvents } from "@/actions/event";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, MapPin, Plus, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import db from "@/lib/db";
import { OnboardingTour } from "@/components/onboarding-tour";

const DashboardPage = async () => {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const events = await getEvents();

    // Fetch user to get fresh hasSeenOnboarding status
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { hasSeenOnboarding: true }
    });

    return (
        <div className="min-h-screen bg-slate-50">
            <OnboardingTour hasSeenOnboarding={user?.hasSeenOnboarding ?? false} page="dashboard" />
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-x-2">
                        <div className="h-8 w-8 bg-black rounded-lg text-white flex items-center justify-center font-bold">EH</div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">EventHub</h1>
                    </div>

                    <div className="flex items-center gap-x-4">
                        <form action={async () => {
                            "use server";
                            await import("@/actions/reset-onboarding").then(m => m.resetOnboarding());
                        }}>
                            <Button variant="secondary" size="sm">
                                Reset Tour
                            </Button>
                        </form>
                        <span className="text-sm font-medium text-slate-700">
                            {session.user.name}
                        </span>
                        <form action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/login" });
                        }}>
                            <Button variant="ghost" size="sm">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Your Events</h2>
                        <p className="text-slate-500 mt-1">Manage your upcoming events and invitations.</p>
                    </div>
                    <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow" id="new-event-btn">
                        <Link href="/events/create">
                            <Plus className="h-4 w-4 mr-2" />
                            New Event
                        </Link>
                    </Button>
                </div>

                {events.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300">
                        <div className="mx-auto h-12 w-12 text-slate-400">
                            <Calendar className="h-12 w-12" />
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">No events</h3>
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
                        {events.map((event: any) => (
                            <Card key={event.id} className="group hover:border-black/50 transition-colors cursor-pointer">
                                <Link href={`/events/${event.id}`}>
                                    <CardHeader>
                                        <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                                        <CardDescription className="flex items-center mt-1">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {new Date(event.date).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                                            {event.description || "No description provided."}
                                        </p>
                                        <div className="flex items-center mt-4 text-xs text-slate-500">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {event.location || "TBD"}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground border-t bg-slate-50/50 p-4">
                                        <span>Hosted by {event.host.name}</span>
                                    </CardFooter>
                                </Link>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default DashboardPage;
