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

        // DB CHECK
        // if (!db) {
        //     throw new Error("Database client (db) is undefined");
        // }

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

            // Note: Prisma tables are usually "ModelName" (quoted). Fields are "fieldName" (quoted).
            const query = `
                SELECT e."title", e."date", u."name" as "hostName"
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


        // DEBUGGING: Return JSON content to verify logic/db works before rendering
        /*
        return new Response(JSON.stringify({ 
            status: "Debug Logic OK", 
            event: event,
            dateStr,
            timeStr
        }, null, 2), {
             status: 200,
             headers: { 'Content-Type': 'application/json' }
        });
        */

        // SAFE PREMIUM DESIGN (Bisecting: Solid BG, No Absolute, No Truncation)
        return new ImageResponse(
            (
                <div
                    style={{
                        background: '#f8fafc', // SOLID COLOR ONLY
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'sans-serif',
                        // position: 'relative', // Removed relative/absolute context
                    }}
                >
                    {/* Logo - Moved to standard flow top */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: 40, // Spacing instead of absolute
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

                    {/* Main Content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '0 80px',
                            // maxWidth: '900px', // Removed max-width
                        }}
                    >
                        {/* Title */}
                        <div
                            style={{
                                fontSize: 72,
                                fontWeight: '800',
                                color: '#0f172a',
                                marginBottom: 24,
                                lineHeight: 1.1,
                                letterSpacing: '-0.02em',
                                // REMOVED TRUNCATION LOGIC
                            }}
                        >
                            {event.title}
                        </div>

                        {/* Date & Time */}
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

                        {/* Host Badge */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'white',
                                padding: '12px 24px',
                                borderRadius: 9999,
                                border: '1px solid #e2e8f0',
                            }}
                        >
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9999,
                                    background: '#cbd5e1',
                                    marginRight: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    color: 'white',
                                }}
                            >
                                {event.host?.name ? event.host.name[0].toUpperCase() : '?'}
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
