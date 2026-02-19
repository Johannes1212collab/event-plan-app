
"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const createEvent = async (values: any) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    const { title, description, date, location, lat, lng } = values;

    if (!title || !date) {
        return { error: "Title and Date are required!" };
    }

    try {
        const event = await db.event.create({
            data: {
                title,
                description,
                date: new Date(date),
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
