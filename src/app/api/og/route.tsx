import { ImageResponse } from 'next/og';
// import db from '@/lib/db'; // TEMPORARILY DISABLED TO TEST MODULE LOAD
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const rawEventId = searchParams.get('eventId');
        const eventId = rawEventId?.trim();

        // TRACE MODE: Return early if specific trace requested
        if (eventId === 'trace_start') {
            const envCheck = {
                status: 'Trace OK',
                hasDbUrl: !!process.env.DATABASE_URL,
                hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
                dbUrlLength: process.env.DATABASE_URL?.length || 0,
                nodeEnv: process.env.NODE_ENV,
                // @ts-ignore
                runtime: process.release?.name || 'unknown'
            };
            return new Response(JSON.stringify(envCheck, null, 2), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (eventId === 'trace_render') {
            return new ImageResponse(
                (<div style={{ fontSize: 30, background: 'white', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Trace: Render OK</div>),
                { width: 1200, height: 630 }
            );
        }

        if (eventId === 'trace_data') {
            try {
                const { Pool } = await import('pg');
                const connectionString = process.env.DATABASE_URL;
                const pool = new Pool({
                    connectionString,
                    connectionTimeoutMillis: 5000,
                    ssl: { rejectUnauthorized: false }
                });

                // Hardcoded query WITH PARAM
                const query = `
                    SELECT e."title", e."date", u."name" as "hostName"
                    FROM "Event" e
                    LEFT JOIN "User" u ON e."hostId" = u."id"
                    WHERE e."id" = $1
                    LIMIT 1
                `;
                // Use a default ID or pass one
                const testId = 'cmlucwb66000004jx7ws702ey';
                const result = await pool.query(query, [testId]);
                await pool.end();

                return new Response(JSON.stringify({ status: 'Data OK (With Param)', rows: result.rows }, null, 2), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ status: 'Data Failed', error: e.message }, null, 2), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (eventId === 'debug') {
            return new ImageResponse(
                (<div style={{ fontSize: 30, background: 'white', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>EventHub: Debug Success</div>),
                { width: 1200, height: 630 }
            );
        }

        if (!eventId) {
            return new ImageResponse(
                (<div style={{ fontSize: 30, background: 'white' }}>Missing Event ID (Parsed OK)</div>),
                { width: 600, height: 300 }
            );
        }

        console.log(`[OG] Fetching event: ${eventId}`);

        let event;
        try {
            // RAW SQL MODE: Bypassing Prisma entirely
            const { Pool } = await import('pg');

            const connectionString = process.env.DATABASE_URL;
            if (!connectionString) {
                throw new Error("DATABASE_URL is missing");
            }

            const pool = new Pool({
                connectionString,
                connectionTimeoutMillis: 5000,
                ssl: { rejectUnauthorized: false } // Typical for Serverless Postgres
            });

            const query = `
                SELECT e."title", e."date", e."isFullDay", u."name" as "hostName"
                FROM "Event" e
                LEFT JOIN "User" u ON e."hostId" = u."id"
                WHERE e."id" = $1
                LIMIT 1
            `;

            const result = await pool.query(query, [eventId]);
            await pool.end();

            if (result.rows.length > 0) {
                const row = result.rows[0];
                event = {
                    title: row.title,
                    date: row.date,
                    isFullDay: row.isFullDay,
                    host: { name: row.hostName }
                };
                console.log(`[OG] Event data found for ${eventId}:`, event);
            }

        } catch (innerDbError: any) {
            console.error('[OG] Inner DB Error:', innerDbError);
            // Return RAW TEXT/JSON instead of ImageResponse to prevent rendering crashes
            return new Response(
                JSON.stringify({
                    error: "Database Error (Raw SQL)",
                    message: innerDbError.message,
                    name: innerDbError.name,
                    stack: innerDbError.stack
                }, null, 2),
                {
                    status: 200, // Return 200 to ensure browser displays it
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        if (!event) {
            console.error(`[OG] Event not found: ${eventId}`);
            return new ImageResponse(
                (
                    <div style={{
                        width: '100%', height: '100%', background: 'white',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <h1>Event Not Found</h1>
                        <p>ID: {eventId}</p>
                    </div>
                ),
                { width: 1200, height: 630 }
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

        // RESTORED DATA with Single String Child Fix
        const hostName = event.host?.name || "Unknown Host";
        const titleSafe = event.title || 'Untitled Event';

        console.log(`[OG] Rendering - EH Logo Design - Host: ${hostName}`);

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
                    {/* Header with EH Logo (CSS) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* EH Logo: Black Rounded Square with White Text */}
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
                        {/* SAFE MODE: All text nodes wrapped in template literals */}
                        <div style={{ fontSize: 36, fontWeight: 'bold', color: '#333' }}>{`${event.isFullDay ? dateStr : `${dateStr} at ${timeStr}`}`}</div>
                        <div style={{ fontSize: 28, color: '#666' }}>{`Hosted by ${hostName}`}</div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );

    } catch (e: any) {
        console.log(`${e.message}`);
        // GLOBAL ERROR CATCH: Return JSON so we can diagnose rendering/font failures
        return new Response(JSON.stringify({
            error: "Global Render Error",
            message: e.message,
            stack: e.stack
        }, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
