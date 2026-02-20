import { ImageResponse } from 'next/og'
import db from '@/lib/db'

// Route segment config
export const runtime = 'nodejs'

// Image metadata
export const alt = 'EventHub Event'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const event = await db.event.findUnique({
        where: { id },
        include: { host: true }
    })

    // Fallback if event is not found
    if (!event) {
        return new ImageResponse(
            (
                <div
                    style={{
                        background: 'white',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 48,
                        fontWeight: 'bold',
                        color: '#333',
                    }}
                >
                    EventHub
                </div>
            ),
            { ...size }
        )
    }

    // Formatting date
    const eventDate = new Date(event.date)
    const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const timeStr = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    return new ImageResponse(
        (
            // ImageResponse JSX element
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
                                color: '#64748b'
                            }}
                        >
                            {/* Using initial if image not available or hard to load in OG */}
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
            ...size,
        }
    )
}
