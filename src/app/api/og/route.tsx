import { ImageResponse } from 'next/og';
import db from '@/lib/db';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const rawEventId = searchParams.get('eventId');
        const eventId = rawEventId?.trim();

        if (eventId === 'debug') {
            return new ImageResponse(
                (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fff',
                            fontSize: 32,
                            fontWeight: 600,
                        }}
                    >
                        EventHub: Debug Success
                    </div>
                ),
                {
                    width: 1200,
                    height: 630,
                }
            );
        }

        if (!eventId) {
            return new ImageResponse(
                (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fff',
                            fontSize: 32,
                            fontWeight: 600,
                            padding: 40,
                            textAlign: 'center',
                        }}
                    >
                        <div>EventHub: Missing Event ID</div>
                        <div style={{ fontSize: 16, marginTop: 20, color: '#999', maxWidth: '80%', wordBreak: 'break-all' }}>
                            URL: {request.url}
                        </div>
                    </div>
                ),
                {
                    width: 1200,
                    height: 630,
                }
            );
        }

        console.log(`[OG] Fetching event: ${eventId}`);
        console.log(`[OG] Fetching event: ${eventId}`);
        let event;
        try {
            event = await db.event.findUnique({
                where: { id: eventId },
                include: { host: true },
            });
        } catch (dbError: any) {
            console.error("[OG] DB Error:", dbError);
            return new ImageResponse(
                (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontSize: 24,
                            fontWeight: 600,
                            padding: 40,
                            textAlign: 'center',
                        }}
                    >
                        <div>EventHub: Database Error</div>
                        <div style={{ fontSize: 16, marginTop: 20, maxWidth: '80%', wordBreak: 'break-all' }}>
                            {dbError.name}: {dbError.message}
                        </div>
                    </div>
                ),
                {
                    width: 1200,
                    height: 630,
                }
            );
        }

        if (!event) {
            console.error(`[OG] Event not found: ${eventId} (Len: ${eventId.length})`);
            return new ImageResponse(
                (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#fff',
                            fontSize: 32,
                            fontWeight: 600,
                            padding: 40,
                            textAlign: 'center',
                        }}
                    >
                        <div>EventHub: Event Not Found</div>
                        <div style={{ fontSize: 24, marginTop: 20, color: '#666' }}>
                            ID: {eventId}
                        </div>
                        <div style={{ fontSize: 16, marginTop: 10, color: '#999' }}>
                            Direct DB access
                        </div>
                    </div>
                ),
                {
                    width: 1200,
                    height: 630,
                }
            );
        }

        // Formatting date
        const eventDate = new Date(event.date);
        const dateStr = eventDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
        const timeStr = eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });


        // Font loading removed for stability
        const fontData = null;

        return new ImageResponse(
            (
                <div
                    style={{
                        background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'sans-serif',
                        position: 'relative',
                    }}
                >
                    {/* ... content ... */}
                    {/* Logo Top Left */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 40,
                            left: 40,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                background: '#0f172a',
                                borderRadius: 8,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                fontWeight: 'bold',
                                marginRight: 12,
                            }}
                        >
                            EH
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a' }}>EventHub</div>
                    </div>

                    {/* Content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '0 80px',
                            maxWidth: '900px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 72,
                                fontWeight: '800',
                                color: '#0f172a',
                                marginBottom: 24,
                                lineHeight: 1.1,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {event.title}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: 36,
                                color: '#475569',
                                marginBottom: 32,
                            }}
                        >
                            <div>{dateStr}</div>
                            <div style={{ margin: '0 16px', color: '#cbd5e1' }}>•</div>
                            <div>{timeStr}</div>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'white',
                                padding: '12px 24px',
                                borderRadius: 9999,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            }}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9999,
                                    background: '#e2e8f0',
                                    marginRight: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    color: '#64748b',
                                }}
                            >
                                {event.host?.name?.[0] || 'U'}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: '500', color: '#334155' }}>
                                Hosted by {event.host?.name || 'Unknown'}
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                // height: 630, // removed to match last version diff? No, keep it standard. Valid ImageResponse options.
            }
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#fff',
                        fontSize: 32,
                        fontWeight: 600,
                    }}
                >
                    EventHub: Failed to generate image
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    }
}
