const { Pool } = require('pg');

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Get generic user id
        const userRes = await pool.query('SELECT id FROM "User" LIMIT 1');
        const userId = userRes.rows[0].id;

        const eventId = "cmltest" + Date.now();
        const accessCode = "test" + Date.now();

        await pool.query(`
            INSERT INTO "Event" (id, title, description, date, "isFullDay", "accessCode", "hostId", "updatedAt")
            VALUES ($1, $2, $3, NOW(), false, $4, $5, NOW())
        `, [
            eventId,
            "Cold Start Bypass Victory Test",
            "This event was pre-warmed on the Vercel Edge CDN before Messenger ever saw it.",
            accessCode,
            userId
        ]);

        console.log('SUCCESS:', eventId);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
