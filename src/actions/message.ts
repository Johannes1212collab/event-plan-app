
"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export const sendMessage = async (values: any) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    const { content, mediaUrl, mediaType, eventId } = values;

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
                mediaType,
                eventId,
                senderId: session.user.id,
            },
            include: {
                sender: {
                    select: {
                        name: true,
                        image: true,
                        id: true
                    }
                }
            }
        });

        revalidatePath(`/events/${eventId}`);
        return { success: "Message sent!", message };
    } catch (error) {
        console.error("Error sending message:", error);
        return { error: "Something went wrong!" };
    }
};
