const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { SECRET_KEY } = require('../middleware/auth');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
        return res.status(400).json({ error: 'Nickname and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        const stmt = db.prepare('INSERT INTO users (id, nickname, password_hash) VALUES (?, ?, ?)');
        stmt.run(id, nickname, hashedPassword);

        res.status(201).json({ message: 'User created successfully.' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Nickname already exists.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
        return res.status(400).json({ error: 'Nickname and password are required.' });
    }

    try {
        const stmt = db.prepare('SELECT * FROM users WHERE nickname = ?');
        const user = stmt.get(nickname);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Generate tokens
        const accessToken = jwt.sign({ id: user.id, nickname: user.nickname }, SECRET_KEY, { expiresIn: '15m' });
        const refreshToken = uuidv4();

        // Store refresh token
        const updateStmt = db.prepare('UPDATE users SET refresh_token = ? WHERE id = ?');
        updateStmt.run(refreshToken, user.id);

        res.json({
            token: accessToken,
            refreshToken,
            user: { id: user.id, nickname: user.nickname }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required.' });
    }

    try {
        const stmt = db.prepare('SELECT * FROM users WHERE refresh_token = ?');
        const user = stmt.get(refreshToken);

        if (!user) {
            return res.status(403).json({ error: 'Invalid refresh token.' });
        }

        // Generate new access token
        const newAccessToken = jwt.sign({ id: user.id, nickname: user.nickname }, SECRET_KEY, { expiresIn: '15m' });

        res.json({ token: newAccessToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required.' });
    }

    try {
        const stmt = db.prepare('UPDATE users SET refresh_token = NULL WHERE refresh_token = ?');
        stmt.run(refreshToken);

        res.json({ message: 'Logged out successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
