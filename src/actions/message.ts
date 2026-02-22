
"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/push";

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
                // Fetch all other participants
                const otherParticipants = await db.participant.findMany({
                    where: {
                        eventId,
                        userId: { not: session.user!.id }
                    },
                    select: {
                        userId: true
                    }
                });

                const userIds = otherParticipants.map(p => p.userId);

                if (userIds.length > 0) {
                    const messagePreview = message.content
                        ? (message.content.length > 40 ? `${message.content.substring(0, 40)}...` : message.content)
                        : (message.mediaType === "IMAGE" ? "📸 Sent an image" : "🎥 Sent a video");

                    const payload = {
                        title: `New message from ${message.sender.name?.split(' ')[0] || 'someone'}`,
                        body: messagePreview,
                        icon: message.sender.image || '/icons/icon-192.png',
                        url: `/events/${eventId}#msg-${message.id}`,
                    };

                    await sendPushNotification(userIds, payload);
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
