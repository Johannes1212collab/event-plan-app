import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { del } from '@vercel/blob';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }

    try {
        // Find events that are older than 17 days
        // 3 days to become "Archived" + 14 days of retention
        const purgeThreshold = new Date();
        purgeThreshold.setDate(purgeThreshold.getDate() - 17);

        // Find messages with high-res media attached to old events
        const messagesToPurge = await db.message.findMany({
            where: {
                event: {
                    date: {
                        lt: purgeThreshold,
                    },
                },
                mediaUrl: {
                    not: null, // High res URL still exists
                },
                isMediaPurged: false, // Hasn't been marked as purged
            },
            select: {
                id: true,
                mediaUrl: true,
            },
        });

        if (messagesToPurge.length === 0) {
            return NextResponse.json({ message: 'No media to purge.' });
        }

        const urlsToDelete = messagesToPurge.map((m) => m.mediaUrl as string);
        const messageIds = messagesToPurge.map((m) => m.id);

        // 1. Delete blobs from Vercel
        await del(urlsToDelete);

        // 2. Update database records to NULL the mediaUrl, but KEEP thumbnailUrl if it exists
        await db.message.updateMany({
            where: {
                id: {
                    in: messageIds,
                },
            },
            data: {
                mediaUrl: null,
                isMediaPurged: true,
            },
        });

        return NextResponse.json({
            success: true,
            purgedCount: messagesToPurge.length,
        });
    } catch (error) {
        console.error('Error during media cron purge:', error);
        return NextResponse.json(
            { error: 'Failed to purge media' },
            { status: 500 }
        );
    }
}
