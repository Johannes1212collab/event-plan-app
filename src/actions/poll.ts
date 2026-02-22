"use server";

import db from "@/lib/db";
import { auth } from "@/auth";
import { sendPushNotification } from "@/lib/push";

export async function createPoll(data: { eventId: string; question: string; isMultipleChoice: boolean; options: string[] }) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const participant = await db.participant.findUnique({
            where: { userId_eventId: { userId: session.user.id, eventId: data.eventId } }
        });
        const event = await db.event.findUnique({ where: { id: data.eventId }, include: { participants: { include: { user: true } } } });

        if (!participant && event?.hostId !== session.user.id) {
            return { error: "Not a participant" };
        }

        const poll = await db.poll.create({
            data: {
                eventId: data.eventId,
                question: data.question,
                isMultipleChoice: data.isMultipleChoice,
                options: {
                    create: data.options.map(text => ({ text }))
                }
            },
            include: {
                options: {
                    include: {
                        votes: {
                            include: { user: { select: { id: true, name: true, image: true } } }
                        }
                    }
                }
            }
        });

        // Trigger Web Push to active users to notify about new poll
        if (event && session.user) {
            const allUserIds = [
                ...event.participants.map(p => p.user.id),
                ...(event.hostId !== session.user.id ? [event.hostId] : [])
            ].filter(id => id !== session.user!.id);

            // Background push job
            Promise.resolve(sendPushNotification(allUserIds, {
                title: "New Event Poll",
                body: `Someone is asking: "${data.question}"`,
                url: `/events/${event.id}`,
                icon: "/icons/icon-192.png"
            })).catch(console.error);
        }

        return { poll };
    } catch (error) {
        console.error("Error creating poll:", error);
        return { error: "Failed to create poll" };
    }
}

export async function votePoll(pollId: string, optionId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const poll = await db.poll.findUnique({ where: { id: pollId } });
        if (!poll) return { error: "Poll not found" };

        if (!poll.isMultipleChoice) {
            // Remove previous votes from this user on this poll
            const userPreviousVotes = await db.pollVote.findMany({
                where: { userId: session.user.id, option: { pollId: poll.id } }
            });
            for (const p of userPreviousVotes) {
                await db.pollVote.delete({ where: { id: p.id } });
            }
        }

        const vote = await db.pollVote.create({
            data: {
                optionId,
                userId: session.user.id
            },
            include: {
                user: { select: { id: true, name: true, image: true } }
            }
        });

        return { vote };
    } catch (error) {
        // Prisma code P2002 means unique constraint failed (already voted for this option)
        if ((error as any).code === 'P2002') {
            return { error: "You already voted for this option" };
        }
        console.error("Error voting:", error);
        return { error: "Failed to cast vote" };
    }
}

export async function deletePollVote(optionId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.pollVote.delete({
            where: {
                optionId_userId: { optionId, userId: session.user.id }
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error unvoting:", error);
        return { error: "Failed to remove vote" };
    }
}

export async function deletePoll(pollId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const poll = await db.poll.findUnique({
            where: { id: pollId },
            include: { event: true }
        });
        if (!poll) return { error: "Not found" };

        if (poll.event.hostId !== session.user.id) {
            return { error: "Only host can delete poll" };
        }

        await db.poll.delete({ where: { id: pollId } });
        return { success: true };
    } catch (error) {
        console.error("Error deleting poll:", error);
        return { error: "Failed to delete poll" };
    }
}
