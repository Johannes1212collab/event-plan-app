import db from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Image as ImageIcon } from "lucide-react";
import { respondToImageRequest } from "@/actions/image-request";
import { revalidatePath } from "next/cache";

export async function ImageRequestsInbox({ userId }: { userId: string }) {
    // Fetch pending requests where this user is the owner
    const pendingRequests = await db.imageRequest.findMany({
        where: {
            ownerId: userId,
            status: "PENDING"
        },
        include: {
            requester: {
                select: {
                    name: true,
                    image: true
                }
            },
            message: {
                include: {
                    event: {
                        select: {
                            title: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    if (pendingRequests.length === 0) {
        return null;
    }

    return (
        <div className="mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6 flex items-center gap-2">
                <ImageIcon className="h-6 w-6 text-primary" />
                Image Requests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRequests.map((request: any) => (
                    <Card key={request.id} className="bg-amber-50/50 border-amber-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                {request.requester.image ? (
                                    <img src={request.requester.image} alt="" className="h-6 w-6 rounded-full" />
                                ) : (
                                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                                        {request.requester.name?.charAt(0) || "U"}
                                    </div>
                                )}
                                {request.requester.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Requested an original photo from <span className="font-semibold text-slate-700">{request.message.event.title}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <form action={async () => {
                                    "use server";
                                    await respondToImageRequest(request.id, "APPROVED");
                                    revalidatePath('/dashboard');
                                }} className="flex-1">
                                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                                        <Check className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                </form>
                                <form action={async () => {
                                    "use server";
                                    await respondToImageRequest(request.id, "REJECTED");
                                    revalidatePath('/dashboard');
                                }} className="flex-1">
                                    <Button size="sm" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                                        <X className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
