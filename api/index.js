const express = require('express');
const { createPool } = require('@vercel/postgres');
const pool = createPool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
});
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-habit-key-for-vercel';

app.use(cors());
app.use(express.json());

// Run Migrations on startup
(async () => {
    try {
        await pool.sql`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user'
        )`;
        await pool.sql`CREATE TABLE IF NOT EXISTS user_data (
            user_id INTEGER PRIMARY KEY,
            habits_json TEXT,
            xp INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`;
        // In case tables already existed, add columns
        await pool.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'`;
        await pool.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS raw_password VARCHAR(255)`;
        await pool.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_requested BOOLEAN DEFAULT false`;
        await pool.sql`ALTER TABLE user_data ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0`;
    } catch(e) { console.error("Migration error:", e.message); }
})();

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        try {
            const { rows } = await pool.sql`SELECT role FROM users WHERE id = ${req.user.id}`;
            if (rows.length === 0 || rows[0].role !== 'admin') {
                return res.status(403).json({ error: 'Access denied: Admin only' });
            }
        } catch(e) {
            return res.status(500).json({ error: e.message });
        }
    }
    next();
};

// API: Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const { rows: countRows } = await pool.sql`SELECT COUNT(*) FROM users`;
        const isFirst = parseInt(countRows[0].count) === 0;
        const role = isFirst ? 'admin' : 'user';

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.sql`INSERT INTO users (username, password, role, raw_password) VALUES (${username}, ${hashedPassword}, ${role}, ${password})`;
        res.status(201).json({ message: 'User created successfully', role });
    } catch (err) {
        if (err.message.includes('unique constraint')) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// API: Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const { rows } = await pool.sql`SELECT * FROM users WHERE username = ${username}`;
        if (rows.length === 0) return res.status(400).json({ error: 'Cannot find user' });
        
        const user = rows[0];
        
        if (await bcrypt.compare(password, user.password)) {
            const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY);
            res.json({ accessToken: accessToken, role: user.role });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get Habits
app.get('/api/habits', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.sql`SELECT habits_json FROM user_data WHERE user_id = ${req.user.id}`;
        if (rows.length > 0 && rows[0].habits_json) {
            res.json(JSON.parse(rows[0].habits_json));
        } else {
            res.json([]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Save Habits & XP
app.post('/api/habits', authenticateToken, async (req, res) => {
    const { xp, ...appData } = req.body;
    const habitsJson = JSON.stringify(appData);
    const parsedXp = parseInt(xp) || 0;
    
    try {
        await pool.sql`
            INSERT INTO user_data (user_id, habits_json, xp) 
            VALUES (${req.user.id}, ${habitsJson}, ${parsedXp})
            ON CONFLICT (user_id) DO UPDATE SET habits_json = EXCLUDED.habits_json, xp = EXCLUDED.xp
        `;
        res.json({ message: 'Saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Leaderboard
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.sql`
            SELECT u.username, COALESCE(d.xp, 0) as xp 
            FROM users u 
            JOIN user_data d ON u.id = d.user_id 
            ORDER BY d.xp DESC 
            LIMIT 50
        `;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Admin View Users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { rows } = await pool.sql`
            SELECT u.id, u.username, u.role, u.raw_password, u.reset_requested, COALESCE(d.xp, 0) as xp
            FROM users u
            LEFT JOIN user_data d ON u.id = d.user_id
            ORDER BY u.id ASC
        `;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Admin Delete User
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetId = req.params.id;
        await pool.sql`DELETE FROM user_data WHERE user_id = ${targetId}`;
        await pool.sql`DELETE FROM users WHERE id = ${targetId}`;
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Admin Promote User
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetId = req.params.id;
        await pool.sql`UPDATE users SET role = 'admin' WHERE id = ${targetId}`;
        res.json({ message: 'User promoted to admin' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Forgot Password
app.post('/api/forgot-password', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    try {
        await pool.sql`UPDATE users SET reset_requested = true WHERE username = ${username}`;
        res.json({ message: 'If the username exists, a notification has been sent to the admin.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Admin Clear Reset Request
app.post('/api/admin/users/:id/clear-reset', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const targetId = req.params.id;
        await pool.sql`UPDATE users SET reset_requested = false WHERE id = ${targetId}`;
        res.json({ message: 'Reset request cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
