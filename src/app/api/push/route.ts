import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const subscription = await request.json();

        // Validate basic push subscription shape
        if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            return new NextResponse('Invalid subscription object', { status: 400 });
        }

        // Upsert the subscription ensuring we only keep one record per endpoint.
        await db.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                userId: session.user.id,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
            create: {
                userId: session.user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });

        return new NextResponse('Subscription saved', { status: 201 });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();

        if (!body.endpoint) {
            return new NextResponse('Missing endpoint', { status: 400 });
        }

        await db.pushSubscription.deleteMany({
            where: {
                endpoint: body.endpoint,
                userId: session.user.id, // Only let users delete their own
            },
        });

        return new NextResponse('Subscription deleted', { status: 200 });

    } catch (error) {
        console.error('Error deleting subscription:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
