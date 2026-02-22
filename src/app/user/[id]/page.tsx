import { auth } from "@/auth";
import db from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, ArrowLeft, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { EditableAvatar } from "@/components/user/editable-avatar";
import { toggleFollow } from "@/actions/follow";
import { revalidatePath } from "next/cache";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            participating: {
                include: {
                    event: {
                        include: {
                            host: true
                        }
                    }
                }
            },
            followers: true,
            following: true,
        } as any // Bypass strict Prisma typings which haven't caught up to generated client
    });

    if (!user) {
        notFound();
    }

    const now = new Date();
    // 3 days ago
    const archiveThreshold = new Date();
    archiveThreshold.setDate(now.getDate() - 3);

    // Get all events the user participated in that are older than the archive threshold
    const pastAttendedEvents = user.participating
        .map((p: any) => p.event)
        .filter((e: any) => e.date < archiveThreshold)
        .sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

    const isSelf = session.user!.id === user.id;
    const isFollowing = (user as any).followers.some((f: any) => f.followerId === session.user!.id);

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b sticky top-0 z-10 px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold text-slate-900">User Profile</h1>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm border p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="flex-shrink-0">
                        <EditableAvatar
                            userId={user.id}
                            initialImage={user.image}
                            name={user.name}
                            isOwner={isSelf}
                        />
                    </div>

                    <div className="text-center md:text-left flex-grow">
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900">{user.name}</h2>
                                <p className="text-slate-500 mt-2 text-sm italic">Joined {user.createdAt.toLocaleDateString()}</p>
                            </div>

                            {!isSelf && (
                                <form action={async () => {
                                    "use server";
                                    await toggleFollow(user.id);
                                    revalidatePath(`/user/${user.id}`);
                                }}>
                                    <Button
                                        type="submit"
                                        variant={isFollowing ? "outline" : "default"}
                                        className="w-full md:w-auto"
                                    >
                                        {isFollowing ? (
                                            <>
                                                <UserMinus className="mr-2 h-4 w-4" /> Unfollow
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="mr-2 h-4 w-4" /> Follow
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="bg-slate-50 px-4 py-2 rounded-lg border text-center min-w-[100px]">
                                <p className="text-2xl font-bold text-slate-800">{user.participating.length}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Events</p>
                            </div>
                            <div className="bg-slate-50 px-4 py-2 rounded-lg border text-center min-w-[100px]">
                                <p className="text-2xl font-bold text-primary">{(user as any).followers.length}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Followers</p>
                            </div>
                            <div className="bg-slate-50 px-4 py-2 rounded-lg border text-center min-w-[100px]">
                                <p className="text-2xl font-bold text-slate-800">{(user as any).following.length}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Following</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-slate-500" />
                        Events History
                    </h3>

                    {pastAttendedEvents.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                            <p className="text-slate-500">This user hasn't completed any events recently.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pastAttendedEvents.map((event: any) => (
                                <Card key={event.id} className="group hover:border-black/50 transition-colors shadow-sm bg-white/80 backdrop-blur-sm">
                                    <Link href={`/events/${event.id}`} className="flex flex-col h-full">
                                        <CardHeader>
                                            <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{event.title}</CardTitle>
                                            <CardDescription className="flex items-center mt-1">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {new Date(event.date).toLocaleDateString()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <div className="flex items-center text-xs text-slate-500 font-medium">
                                                <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                                                <span className="truncate">{event.location || "Location TBD"}</span>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="mt-auto pt-0 flex justify-between items-center text-xs text-muted-foreground border-t bg-slate-50 rounded-b-lg p-3">
                                            <span>Hosted by {event.host?.name || "Unknown"}</span>
                                        </CardFooter>
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
