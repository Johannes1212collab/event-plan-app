const { Pool } = require('pg');

async function main() {
    console.log("Connecting database...");
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const u = await pool.query('SELECT id FROM "User" LIMIT 1');
        const eventId = 'cmld' + Date.now();
        await pool.query('INSERT INTO "Event" (id, title, description, date, "isFullDay", "accessCode", "hostId", "updatedAt") VALUES ($1, $2, $3, NOW(), false, $1, $4, NOW())', [eventId, 'Desktop Timeout Test', 'Testing Electron vs Mobile local caching strategies.', u.rows[0].id]);
        console.log('NEW EVENT:', eventId);
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        await pool.end();
    }
}

main();
