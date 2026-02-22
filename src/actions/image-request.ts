import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export const requestImage = async (messageId: string) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        const message = await db.message.findUnique({
            where: { id: messageId },
            include: { sender: true }
        });

        if (!message) {
            return { error: "Message not found" };
        }

        if (message.senderId === session.user.id) {
            return { error: "You cannot request an image from yourself." };
        }

        // Check if an existing request exists
        const existingRequest = await db.imageRequest.findFirst({
            where: {
                messageId: messageId,
                requesterId: session.user.id
            }
        });

        if (existingRequest) {
            return { error: "You have already requested this image." };
        }

        const request = await db.imageRequest.create({
            data: {
                messageId: messageId,
                requesterId: session.user.id,
                ownerId: message.senderId,
                status: "PENDING"
            }
        });

        revalidatePath(`/events/${message.eventId}`);
        return { success: "Image request sent!", request };
    } catch (error) {
        console.error("Error requesting image:", error);
        return { error: "Failed to request image" };
    }
};

export const respondToImageRequest = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        const imageRequest = await db.imageRequest.findUnique({
            where: { id: requestId },
            include: { message: true }
        });

        if (!imageRequest) {
            return { error: "Request not found" };
        }

        if (imageRequest.ownerId !== session.user.id) {
            return { error: "Only the image owner can respond to this request." };
        }

        const updatedRequest = await db.imageRequest.update({
            where: { id: requestId },
            data: { status }
        });

        revalidatePath(`/events/${imageRequest.message.eventId}`);
        return { success: `Request ${status.toLowerCase()}`, request: updatedRequest };
    } catch (error) {
        console.error("Error responding to image request:", error);
        return { error: "Failed to respond" };
    }
};
