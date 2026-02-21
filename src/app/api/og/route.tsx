import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export const alt = 'EventHub Event'
export const size = {
    width: 300,
    height: 157,
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('eventId');

    if (!id) {
        const defaultImageRes = new ImageResponse(
            (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    background: 'white',
                    color: 'black',
                    padding: '15px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'black',
                            color: 'white',
                            borderRadius: '6px',
                            width: '30px',
                            height: '30px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                        }}>
                            EH
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 'bold' }}>EventHub</div>
                    </div>

                    <div style={{ fontSize: 12, color: '#64748b' }}>
                        Plan Events. Invite Friends. Share Memories.
                    </div>
                </div>
            ),
            { ...size }
        );

        const defaultImageBuffer = await defaultImageRes.arrayBuffer();
        return new Response(defaultImageBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': String(defaultImageBuffer.byteLength),
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
            }
        });
    }

    let event;
    try {
        const { unstable_cache } = await import('next/cache');

        event = await unstable_cache(
            async () => {
                const { Pool } = await import('pg');
                const connectionString = process.env.DATABASE_URL;
                if (!connectionString) {
                    throw new Error("DATABASE_URL is missing");
                }

                const pool = new Pool({
                    connectionString,
                    connectionTimeoutMillis: 5000,
                    ssl: { rejectUnauthorized: false }
                });

                const query = `
                    SELECT e."title", e."date", e."isFullDay", u."name" as "hostName"
                    FROM "Event" e
                    LEFT JOIN "User" u ON e."hostId" = u."id"
                    WHERE e."id" = $1
                    LIMIT 1
                `;

                const result = await pool.query(query, [id]);
                await pool.end();

                if (result.rows.length > 0) {
                    const row = result.rows[0];
                    return {
                        title: row.title,
                        date: row.date,
                        isFullDay: row.isFullDay,
                        host: { name: row.hostName }
                    };
                }
                return null;
            },
            [`og-sql-event-native-${id}`],
            { revalidate: 3600, tags: [`event-${id}`] }
        )();
    } catch (e: any) {
        console.error('[OG API] Inner DB Error:', e);
        return new Response("Error loading event", { status: 500 });
    }

    if (!event) {
        return new Response("Event Not Found", { status: 404 });
    }

    const eventDate = new Date(event.date);
    const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = event.isFullDay ? '' : ` at ${eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const hostName = event.host?.name || "Unknown Host";
    const titleSafe = event.title || 'Untitled Event';

    const imageRes = new ImageResponse(
        (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                background: 'white',
                color: 'black',
                padding: '15px',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'black',
                        color: 'white',
                        borderRadius: '3px',
                        width: '15px',
                        height: '15px',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        marginRight: '5px'
                    }}>
                        EH
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 'bold' }}>EventHub</div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                }}>
                    <div style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        lineHeight: 1.1,
                    }}>
                        {titleSafe}
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                }}>
                    <div style={{ fontSize: 9, fontWeight: 'bold', color: '#333' }}>{`${event.isFullDay ? dateStr : `${dateStr} at ${timeStr}`}`}</div>
                    <div style={{ fontSize: 7, color: '#666' }}>{`Hosted by ${hostName}`}</div>
                </div>
            </div>
        ),
        {
            ...size
        }
    );

    const imageBuffer = await imageRes.arrayBuffer();

    return new Response(imageBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            'Content-Length': String(imageBuffer.byteLength),
            'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
        }
    });
}
