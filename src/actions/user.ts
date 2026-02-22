"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export const completeOnboarding = async () => {
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
                hasSeenOnboarding: true,
            },
        });

        revalidatePath("/");
        revalidatePath("/dashboard");
        return { success: "Onboarding completed" };
    } catch (error) {
        console.error("Failed to complete onboarding:", error);
        return { error: "Failed to update onboarding status" };
    }
};

export const updateProfileImage = async (imageUrl: string) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.user.update({
            where: { id: session.user.id },
            data: { image: imageUrl }
        });

        revalidatePath("/dashboard");
        revalidatePath(`/user/${session.user.id}`);

        return { success: "Profile image updated successfully!" };
    } catch (error) {
        console.error("Failed to update profile image:", error);
        return { error: "Could not update profile image." };
    }
};
