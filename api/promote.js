require('dotenv').config();
const { createPool } = require('@vercel/postgres');
const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
});

(async () => {
    try {
        await pool.sql`UPDATE users SET role = 'admin' WHERE username = 'akashti3004@gmail.com'`;
        console.log("Promoted user to admin");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
