import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export const alt = 'EventHub Event'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

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
        console.error('[OG Native] Inner DB Error:', e);
        return new ImageResponse(
            (
                <div style={{
                    width: '100%', height: '100%', background: '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ fontSize: 30, color: '#333' }}>Error Loading Event</div>
                </div>
            ),
            { ...size }
        );
    }

    if (!event) {
        return new ImageResponse(
            (
                <div style={{
                    width: '100%', height: '100%', background: '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ fontSize: 30, color: '#333' }}>Event Not Found</div>
                </div>
            ),
            { ...size }
        );
    }

    const eventDate = new Date(event.date);
    const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = event.isFullDay ? '' : ` at ${eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const hostName = event.host?.name || "Unknown Host";
    const titleSafe = event.title || 'Untitled Event';

    return new ImageResponse(
        (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                background: 'white',
                color: 'black',
                padding: '60px',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'black',
                        color: 'white',
                        borderRadius: '12px',
                        width: '60px',
                        height: '60px',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        marginRight: '20px'
                    }}>
                        EH
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 'bold' }}>EventHub</div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{
                        fontSize: 72,
                        fontWeight: 'bold',
                        lineHeight: 1.1,
                    }}>
                        {titleSafe}
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}>
                    <div style={{ fontSize: 36, fontWeight: 'bold', color: '#333' }}>{`${event.isFullDay ? dateStr : `${dateStr} at ${timeStr}`}`}</div>
                    <div style={{ fontSize: 28, color: '#666' }}>{`Hosted by ${hostName}`}</div>
                </div>
            </div>
        ),
        {
            ...size
        }
    );
}
