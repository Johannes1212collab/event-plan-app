
"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import webpush from "web-push";

// Configure Web Push with our new VAPID keys
// This ensures Google/Apple accepts our push payloads
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@eventhub.community',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
);

export const sendMessage = async (values: any) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    const { content, mediaUrl, thumbnailUrl, mediaType, eventId, replyToId } = values;

    if (!eventId) {
        return { error: "Event ID is required!" };
    }

    if (!content && !mediaUrl) {
        return { error: "Message content or media is required!" };
    }

    try {
        const message = await db.message.create({
            data: {
                content,
                mediaUrl,
                thumbnailUrl,
                mediaType,
                eventId,
                senderId: session.user.id,
                replyToId,
            },
            include: {
                sender: {
                    select: {
                        name: true,
                        image: true,
                        id: true
                    }
                },
                replyTo: {
                    include: {
                        sender: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Background task: Deliver Push Notifications to all other participants
        // We do this asynchronously so the sender's Chat UI updates instantly
        (async () => {
            try {
                // Fetch all other participants who have push subscriptions
                const otherParticipants = await db.participant.findMany({
                    where: {
                        eventId,
                        userId: { not: session.user!.id }
                    },
                    select: {
                        user: {
                            select: {
                                pushSubscriptions: true
                            }
                        }
                    }
                });

                const subscriptions = otherParticipants.flatMap((p: any) => p.user.pushSubscriptions);

                if (subscriptions.length > 0) {
                    const messagePreview = message.content
                        ? (message.content.length > 40 ? `${message.content.substring(0, 40)}...` : message.content)
                        : (message.mediaType === "IMAGE" ? "📸 Sent an image" : "🎥 Sent a video");

                    const pushPayload = JSON.stringify({
                        title: `New message from ${message.sender.name?.split(' ')[0] || 'someone'}`,
                        body: messagePreview,
                        icon: message.sender.image || '/icons/icon-192.png',
                        url: `/events/${eventId}#msg-${message.id}`,
                    });

                    await Promise.allSettled(subscriptions.map(async (sub: any) => {
                        try {
                            await webpush.sendNotification({
                                endpoint: sub.endpoint,
                                keys: { p256dh: sub.p256dh, auth: sub.auth }
                            }, pushPayload);
                        } catch (err: any) {
                            // If the subscription is gone/expired (410, 404), prune it from our DB
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
                            }
                        }
                    }));
                }
            } catch (err) {
                console.error("Push Notification Delivery Error:", err);
            }
        })();

        revalidatePath(`/events/${eventId}`);
        return { success: "Message sent!", message };
    } catch (error) {
        console.error("Error sending message:", error);
        return { error: "Something went wrong!" };
    }
};

export const getMessages = async (eventId: string) => {
    try {
        const messages = await db.message.findMany({
            where: {
                eventId,
            },
            include: {
                sender: {
                    select: {
                        name: true,
                        image: true,
                        id: true,
                    },
                },
                replyTo: {
                    include: {
                        sender: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "asc", // Already returning ascending order typically? Let's make it explicitly ascending
            },
        });

        return { messages };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { error: "Failed to fetch messages" };
    }
};
