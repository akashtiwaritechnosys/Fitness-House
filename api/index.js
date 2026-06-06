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

// API: Init DB (Run this endpoint once to create tables)
app.get('/api/init', async (req, res) => {
    try {
        await pool.sql`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )`;
        await pool.sql`CREATE TABLE IF NOT EXISTS user_data (
            user_id INTEGER PRIMARY KEY,
            habits_json TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`;
        res.status(200).json({ message: 'Database initialized successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.sql`INSERT INTO users (username, password) VALUES (${username}, ${hashedPassword})`;
        res.status(201).json({ message: 'User created successfully' });
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
            const accessToken = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
            res.json({ accessToken: accessToken });
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

// API: Save Habits
app.post('/api/habits', authenticateToken, async (req, res) => {
    const habitsJson = JSON.stringify(req.body);
    
    try {
        await pool.sql`
            INSERT INTO user_data (user_id, habits_json) 
            VALUES (${req.user.id}, ${habitsJson})
            ON CONFLICT (user_id) DO UPDATE SET habits_json = EXCLUDED.habits_json
        `;
        res.json({ message: 'Saved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
