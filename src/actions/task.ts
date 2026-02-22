"use server";

import db from "@/lib/db";
import { auth } from "@/auth";
import { sendPushNotification } from "@/lib/push";

export async function getTasks(eventId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const tasks = await db.eventTask.findMany({
            where: { eventId },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: { id: true, name: true, image: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        return { tasks };
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return { error: "Failed to fetch tasks" };
    }
}

export async function createTask(data: { eventId: string; title: string; description?: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        // Verify user is part of the event
        const participant = await db.participant.findUnique({
            where: { userId_eventId: { userId: session.user.id, eventId: data.eventId } }
        });

        const event = await db.event.findUnique({ where: { id: data.eventId } });

        if (!participant && event?.hostId !== session.user.id) {
            return { error: "Not a participant" };
        }

        const task = await db.eventTask.create({
            data: {
                eventId: data.eventId,
                title: data.title,
                description: data.description,
            },
            include: {
                assignments: {
                    include: { user: { select: { id: true, name: true, image: true } } }
                }
            }
        });

        // Notify participants about the new checklist item
        if (event) {
            const participants = await db.participant.findMany({
                where: { eventId: data.eventId },
                select: { userId: true }
            });
            const participantIds = participants.map(p => p.userId).filter(id => id !== session.user!.id);
            if (participantIds.length > 0) {
                await sendPushNotification(participantIds, {
                    title: `New Checklist Item: ${event.title}`,
                    body: `${session.user.name || "Someone"} added "${data.title}" to the checklist.`,
                    url: `/events/${event.id}`
                });
            }
        }

        return { task };
    } catch (error) {
        console.error("Error creating task:", error);
        return { error: "Failed to create task" };
    }
}

export async function toggleTask(taskId: string, isCompleted: boolean) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const task = await db.eventTask.update({
            where: { id: taskId },
            data: { isCompleted },
            include: {
                assignments: {
                    include: { user: { select: { id: true, name: true, image: true } } }
                },
                event: { select: { title: true, id: true, participants: { select: { userId: true } } } }
            }
        });

        const participantIds = task.event.participants.map((p: any) => p.userId).filter((id: string) => id !== session.user!.id);
        if (participantIds.length > 0) {
            await sendPushNotification(participantIds, {
                title: `Checklist Update: ${task.event.title}`,
                body: `${session.user.name || "Someone"} marked "${task.title}" as ${isCompleted ? "completed" : "incomplete"}.`,
                url: `/events/${task.event.id}`
            });
        }

        return { task };
    } catch (error) {
        console.error("Error toggling task:", error);
        return { error: "Failed to update task" };
    }
}

export async function deleteTask(taskId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.eventTask.delete({
            where: { id: taskId }
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting task:", error);
        return { error: "Failed to delete task" };
    }
}

export async function assignTask(taskId: string, userId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const assignment = await db.taskAssignment.create({
            data: {
                taskId,
                userId
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
                task: { select: { title: true, eventId: true } }
            }
        });

        // Notify the assigned user
        if (userId !== session.user.id) {
            const event = await db.event.findUnique({ where: { id: assignment.task.eventId } });
            if (event) {
                await sendPushNotification([userId], {
                    title: `You were assigned a task!`,
                    body: `${session.user.name || "Someone"} assigned you to "${assignment.task.title}" for ${event.title}.`,
                    url: `/events/${event.id}`
                });
            }
        }

        return { assignment };
    } catch (error) {
        console.error("Error assigning task:", error);
        return { error: "Failed to assign task. User might already be assigned." };
    }
}

export async function unassignTask(taskId: string, userId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.taskAssignment.delete({
            where: {
                taskId_userId: { taskId, userId }
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error unassigning task:", error);
        return { error: "Failed to unassign task" };
    }
}
