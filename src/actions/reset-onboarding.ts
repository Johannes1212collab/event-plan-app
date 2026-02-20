"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export const resetOnboarding = async () => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.user.update({
            where: {
                id: session.user.id,
            },
            data: {
                hasSeenOnboarding: false,
            },
        });

        revalidatePath("/");
        revalidatePath("/dashboard");
        revalidatePath("/events/[id]");
        return { success: "Onboarding reset" };
    } catch (error) {
        console.error("Failed to reset onboarding:", error);
        return { error: "Failed to reset onboarding status" };
    }
};
