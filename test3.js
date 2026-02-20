require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query("SELECT title FROM \"Event\" WHERE id = 'cmluv9xdk00004kztp9tn3ik'").then(res => {
    console.log(res.rows);
    pool.end();
});
