"use server";

import db from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/push";

/**
 * Toggles the ledger feature on or off for an event (Host or Participant)
 */
export async function toggleLedger(eventId: string, enabled: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const participant = await db.participant.findUnique({
            where: { userId_eventId: { userId: session.user.id, eventId } }
        });
        const event = await db.event.findUnique({ where: { id: eventId } });

        if (!participant && event?.hostId !== session.user.id) {
            return { error: "Only members can toggle the ledger." };
        }

        await db.event.update({
            where: { id: eventId },
            data: { isLedgerEnabled: enabled }
        });

        revalidatePath(`/events/${eventId}`);
        return { success: true };
    } catch (error) {
        console.error("Error toggling ledger:", error);
        return { error: "Failed to toggle ledger status." };
    }
}

/**
 * Creates a new expense and splits it among the provided user IDs (equally)
 */
export async function createExpense(data: { eventId: string; amount: number; description: string; splitBetweenUserIds: string[] }) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    if (!data.splitBetweenUserIds || data.splitBetweenUserIds.length === 0) {
        return { error: "You must split the expense with at least one person." };
    }

    if (data.amount <= 0) {
        return { error: "Amount must be greater than zero." };
    }

    try {
        // Verify user is part of event
        const participant = await db.participant.findUnique({
            where: { userId_eventId: { userId: session.user.id, eventId: data.eventId } }
        });
        const event = await db.event.findUnique({ where: { id: data.eventId } });

        if (!participant && event?.hostId !== session.user.id) {
            return { error: "You are not a participant of this event." };
        }

        if (!event?.isLedgerEnabled) {
            return { error: "The ledger module is not enabled for this event." };
        }

        const splitAmount = data.amount / data.splitBetweenUserIds.length;

        // Create Expense and Splits in a transaction
        const expense = await db.expense.create({
            data: {
                eventId: data.eventId,
                paidById: session.user.id,
                amount: data.amount,
                description: data.description,
                splits: {
                    create: data.splitBetweenUserIds.map((userId) => ({
                        userId,
                        amount: splitAmount
                    }))
                }
            },
            include: {
                paidBy: { select: { id: true, name: true, image: true } },
                splits: { include: { user: { select: { id: true, name: true, image: true } } } }
            }
        });

        revalidatePath(`/events/${data.eventId}`);

        // Send push notifications to all users who were split on this expense (except purchaser)
        const notifyUsers = data.splitBetweenUserIds.filter(id => id !== session.user!.id);
        if (notifyUsers.length > 0) {
            await sendPushNotification(notifyUsers, {
                title: `New Expense: ${event?.title}`,
                body: `${session.user!.name} added a $${data.amount.toFixed(2)} expense for "${data.description}".`,
                url: `/events/${data.eventId}?tab=ledger`
            });
        }

        return { expense };
    } catch (error) {
        console.error("Error creating expense:", error);
        return { error: "Failed to create expense." };
    }
}

/**
 * Deletes an expense (Only the person who paid it, or the host)
 */
export async function deleteExpense(expenseId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const expense = await db.expense.findUnique({
            where: { id: expenseId },
            include: { event: true }
        });

        if (!expense) return { error: "Expense not found." };

        if (expense.paidById !== session.user.id && expense.event.hostId !== session.user.id) {
            return { error: "Only the purchaser or host can delete this expense." };
        }

        await db.expense.delete({
            where: { id: expenseId }
        });

        revalidatePath(`/events/${expense.eventId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting expense:", error);
        return { error: "Failed to delete expense." };
    }
}

/**
 * Core Algorithm: Fetches all expenses and builds a simplified debt graph
 */
export async function getLedgerSummary(eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        // Fetch all expenses for the event
        const expenses = await db.expense.findMany({
            where: { eventId },
            include: {
                paidBy: { select: { id: true, name: true, image: true } },
                splits: { include: { user: { select: { id: true, name: true, image: true } } } }
            },
            orderBy: { createdAt: "desc" }
        });

        if (expenses.length === 0) {
            return { expenses: [], debts: [] };
        }

        // 1. Calculate net balances for each user
        // Positive means they are owed money. Negative means they owe money.
        const balances = new Map<string, { userId: string; user: any; netBalance: number }>();

        // Ensure all participants are in the map
        const event = await db.event.findUnique({
            where: { id: eventId },
            include: {
                participants: { include: { user: { select: { id: true, name: true, image: true } } } },
                host: { select: { id: true, name: true, image: true } }
            }
        });

        if (event) {
            balances.set(event.host.id, { userId: event.host.id, user: event.host, netBalance: 0 });
            event.participants.forEach((p: any) => {
                balances.set(p.user.id, { userId: p.user.id, user: p.user, netBalance: 0 });
            });
        }

        // Aggregate expenses
        for (const exp of expenses) {
            // Purchaser gets credited (+)
            const purchaserRecord = balances.get(exp.paidById);
            if (purchaserRecord) {
                purchaserRecord.netBalance += exp.amount;
            } else {
                balances.set(exp.paidById, { userId: exp.paidById, user: exp.paidBy, netBalance: exp.amount });
            }

            // Splitters get debited (-)
            for (const split of exp.splits) {
                const splitterRecord = balances.get(split.userId);
                if (splitterRecord) {
                    splitterRecord.netBalance -= split.amount;
                } else {
                    balances.set(split.userId, { userId: split.userId, user: split.user, netBalance: -split.amount });
                }
            }
        }

        // 2. Separate into Debtors and Creditors
        const debtors = Array.from(balances.values()).filter(b => b.netBalance < -0.01).sort((a, b) => a.netBalance - b.netBalance); // Owe money (Negative)
        const creditors = Array.from(balances.values()).filter(b => b.netBalance > 0.01).sort((a, b) => b.netBalance - a.netBalance); // Owed money (Positive)

        // 3. Greedy settling algorithm
        const debts: { from: any; to: any; amount: number }[] = [];
        let debtorIndex = 0;
        let creditorIndex = 0;

        while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
            const debtor = debtors[debtorIndex];
            const creditor = creditors[creditorIndex];

            // How much can we settle right now?
            const settleAmount = Math.min(Math.abs(debtor.netBalance), creditor.netBalance);

            if (settleAmount > 0.01) {
                debts.push({
                    from: debtor.user,
                    to: creditor.user,
                    amount: Number(settleAmount.toFixed(2)) // Round to 2 decimals
                });
            }

            debtor.netBalance += settleAmount; // Gets less negative
            creditor.netBalance -= settleAmount; // Gets less positive

            // Move pointers if settled
            if (Math.abs(debtor.netBalance) < 0.01) debtorIndex++;
            if (creditor.netBalance < 0.01) creditorIndex++;
        }

        return { expenses, debts };

    } catch (error) {
        console.error("Error generating ledger summary:", error);
        return { error: "Failed to generate ledger summary." };
    }
}

/**
 * Settles a debt between two participants by creating a specialized "Settlement" expense.
 */
export async function settleDebt(data: { eventId: string; debtorId: string; creditorId: string; amount: number }) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const event = await db.event.findUnique({
            where: { id: data.eventId }
        });

        if (!event) return { error: "Event not found" };

        const expense = await db.expense.create({
            data: {
                eventId: data.eventId,
                paidById: data.debtorId,
                amount: data.amount,
                description: "Settled up",
                isSettlement: true,
                splits: {
                    create: [
                        {
                            userId: data.creditorId,
                            amount: data.amount
                        }
                    ]
                }
            },
            include: {
                paidBy: { select: { id: true, name: true, image: true } },
                splits: { include: { user: { select: { id: true, name: true, image: true } } } }
            }
        });

        revalidatePath(`/events/${data.eventId}`);

        // Notify the creditor that they have been paid back
        if (data.creditorId !== session.user.id) {
            await sendPushNotification([data.creditorId], {
                title: `Debt Settled: ${event.title}`,
                body: `${session.user.name} settled their $${data.amount.toFixed(2)} debt with you.`,
                url: `/events/${data.eventId}?tab=ledger`
            });
        }
        // Notify the debtor if the creditor marked it as paid on their behalf
        if (data.debtorId !== session.user.id) {
            await sendPushNotification([data.debtorId], {
                title: `Debt Marked as Settled: ${event.title}`,
                body: `${session.user.name} marked your $${data.amount.toFixed(2)} debt as paid.`,
                url: `/events/${data.eventId}?tab=ledger`
            });
        }

        return { success: true, expense };
    } catch (error) {
        console.error("Error settling debt:", error);
        return { error: "Failed to settle debt." };
    }
}
