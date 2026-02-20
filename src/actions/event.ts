
"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const getEventMetadata = async (id: string) => {
    const event = await db.event.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            description: true,
            date: true,
            isFullDay: true,
            location: true,
            host: {
                select: {
                    name: true,
                }
            }
        }
    });
    return event;
};


export const createEvent = async (values: any) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    const { title, description, date, isFullDay, location, lat, lng } = values;

    if (!title || !date) {
        return { error: "Title and Date are required!" };
    }

    // Default to false if isFullDay is undefined
    const fullDay = isFullDay || false;

    // If it's a full day, we just want the date part, but the browser sends "YYYY-MM-DD".
    // We can parse it directly as a Date. It will be interpreted as midnight UTC.
    let parsedDate = new Date(date);

    // If it was just a date (length 10 like "2024-05-10"), the Date object is fine.
    // If we wanted to ensure zero time, we could do it here, but Date(dateString) for YYYY-MM-DD does midnight UTC.

    try {
        const event = await db.event.create({
            data: {
                title,
                description,
                date: parsedDate,
                isFullDay: fullDay,
                location,
                lat,
                lng,
                hostId: session.user.id,
                participants: {
                    create: {
                        userId: session.user.id,
                        role: "HOST",
                    },
                },
            },
        });

        revalidatePath("/dashboard");
        return { success: "Event created!", eventId: event.id };
    } catch (error) {
        console.error("Error creating event:", error);
        return { error: "Something went wrong!" };
    }
};

export const getEvents = async () => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return [];
    }

    const events = await db.event.findMany({
        where: {
            participants: {
                some: {
                    userId: session.user.id,
                },
            },
        },
        orderBy: {
            date: "asc",
        },
        include: {
            host: {
                select: {
                    name: true,
                    image: true
                }
            }
        }
    });

    return events;
};

export const getEventById = async (id: string) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return null; // Handle auth better?
    }

    const event = await db.event.findUnique({
        where: { id },
        include: {
            host: {
                select: { name: true, image: true, id: true }
            },
            participants: {
                include: {
                    user: {
                        select: { name: true, image: true, id: true }
                    }
                }
            },
            messages: {
                include: {
                    sender: {
                        select: { name: true, image: true, id: true }
                    }
                },
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });

    return event;
}

export const getEventMedia = async (eventId: string) => {
    const session = await auth();

    if (!session || !session.user) {
        return [];
    }

    try {
        const mediaMessages = await db.message.findMany({
            where: {
                eventId,
                NOT: {
                    mediaUrl: null,
                },
            },
            select: {
                id: true,
                mediaUrl: true,
                mediaType: true,
                createdAt: true,
                sender: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return mediaMessages;
    } catch (error) {
        console.error("Error fetching event media:", error);
        return [];
    }
};

export const deleteEvent = async (eventId: string) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        const event = await db.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return { error: "Event not found" };
        }

        if (event.hostId !== session.user.id) {
            return { error: "Only the host can delete this event" };
        }

        await db.event.delete({
            where: { id: eventId },
        });

        return { success: "Event deleted" };
    } catch (error) {
        console.error("Error deleting event:", error);
        return { error: "Failed to delete event" };
    }
};

export const joinEvent = async (eventId: string) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        const existingParticipant = await db.participant.findUnique({
            where: {
                userId_eventId: {
                    userId: session.user.id,
                    eventId: eventId,
                },
            },
        });

        if (existingParticipant) {
            return { success: "Already joined" };
        }

        await db.participant.create({
            data: {
                userId: session.user.id,
                eventId: eventId,
                role: "GUEST",
            },
        });

        revalidatePath(`/events/${eventId}`);
        revalidatePath("/dashboard");

        return { success: "Joined event successfully" };
    } catch (error) {
        console.error("Error joining event:", error);
        return { error: "Failed to join event" };
    }
};
