"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/push";

/**
 * Toggles a follow relationship between the authenticated user and another user.
 * If currently following, it unfollows. If not following, it follows.
 */
export async function toggleFollow(targetUserId: string) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "You must be logged in to follow users." };
    }

    if (session.user.id === targetUserId) {
        return { error: "You cannot follow yourself." };
    }

    try {
        const followerId = session.user.id;

        // Check if the target user actually exists
        const targetUser = await db.user.findUnique({
            where: { id: targetUserId }
        });

        if (!targetUser) {
            return { error: "User not found." };
        }

        // Check if already following
        const existingFollow = await db.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: targetUserId
                }
            }
        });

        if (existingFollow) {
            // Unfollow
            await db.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId: targetUserId
                    }
                }
            });
            revalidatePath(`/user/${targetUserId}`);
            return { success: `You stopped following ${targetUser.name || 'this user'}.`, isFollowing: false };
        } else {
            // Follow
            await db.follows.create({
                data: {
                    followerId,
                    followingId: targetUserId
                }
            });
            revalidatePath(`/user/${targetUserId}`);

            // Notify the user being followed
            await sendPushNotification([targetUserId], {
                title: "New Follower",
                body: `${session.user.name || "Someone"} started following you!`,
                url: `/user/${session.user.id}`
            });

            return { success: `You are now following ${targetUser.name || 'this user'}.`, isFollowing: true };
        }

    } catch (error) {
        console.error("Error in toggleFollow:", error);
        return { error: "Something went wrong while trying to update follow status." };
    }
}
