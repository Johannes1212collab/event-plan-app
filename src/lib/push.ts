import webpush from "web-push";
import db from "@/lib/db";

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@eventhub.community',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
);

export const sendPushNotification = async (
    userIds: string[],
    payload: { title: string; body: string; url: string; icon?: string }
) => {
    try {
        const users = await db.user.findMany({
            where: { id: { in: userIds } },
            include: { pushSubscriptions: true }
        });

        const subscriptions = users.flatMap((u: any) => u.pushSubscriptions);

        if (subscriptions.length > 0) {
            await Promise.allSettled(subscriptions.map(async (sub: any) => {
                try {
                    await webpush.sendNotification({
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, JSON.stringify(payload));
                } catch (err: any) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
                    }
                }
            }));
        }
    } catch (error) {
        console.error("Failed to send push notifications process:", error);
    }
};
