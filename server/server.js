const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { getDb, close } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const IS_PROD = process.env.NODE_ENV === 'production';

if (IS_PROD && !JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required in production');
    process.exit(1);
}
if (IS_PROD && !ALLOWED_ORIGIN) {
    console.error('FATAL: ALLOWED_ORIGIN environment variable is required in production');
    process.exit(1);
}

app.use(helmet());
app.use(express.json({ limit: '100kb' }));

const corsOrigins = ALLOWED_ORIGIN ? ALLOWED_ORIGIN.split(',').map(s => s.trim()) : true;
app.use(cors({ origin: corsOrigins, credentials: true }));

if (IS_PROD) {
    app.set('trust proxy', 1);
}

app.use(express.static(path.join(__dirname, '..')));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { ok: false, error: 'Too many attempts. Try again in 15 minutes.' }
});

function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ ok: false, error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(header.slice(7), JWT_SECRET);
        req.userId = decoded.userId;
        req.email = decoded.email;
        next();
    } catch (e) {
        return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
    }
}

app.post('/api/register', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ ok: false, error: 'Email and password required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.json({ ok: false, error: 'Enter a valid Gmail address' });
        }
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            return res.json({ ok: false, error: 'Only Gmail addresses allowed' });
        }
        if (password.length < 4) {
            return res.json({ ok: false, error: 'Password must be at least 4 characters' });
        }

        const db = getDb();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.json({ ok: false, error: 'Account already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const now = Date.now();

        const info = db.prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)').run(email, passwordHash, now);
        const userId = info.lastInsertRowid;

        const defaults = {
            highScore: 0, coins: 0, totalKills: 0, bestSurvivalTime: 0,
            unlockedPlanes: ['falcon'], selectedPlane: 'falcon',
            upgrades: { health: 0, damage: 0, speed: 0, fireRate: 0, armor: 0 },
            settings: { musicVolume: 0.5, sfxVolume: 0.7, graphicsQuality: 'high', fullscreen: false, mobileVibration: true },
            leaderboard: []
        };
        db.prepare('INSERT INTO game_data (user_id, data, updated_at) VALUES (?, ?, ?)').run(userId, JSON.stringify(defaults), now);

        const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ ok: true, token, data: defaults });
    } catch (e) {
        console.error('Register error:', e);
        res.status(500).json({ ok: false, error: 'Server error' });
    }
});

app.post('/api/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ ok: false, error: 'Email and password required' });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.json({ ok: false, error: 'Account not found' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.json({ ok: false, error: 'Wrong password' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        const gameRow = db.prepare('SELECT data FROM game_data WHERE user_id = ?').get(user.id);
        const data = gameRow ? JSON.parse(gameRow.data) : {};

        res.json({ ok: true, token, data });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).json({ ok: false, error: 'Server error' });
    }
});

app.get('/api/verify', authMiddleware, (req, res) => {
    const db = getDb();
    const gameRow = db.prepare('SELECT data FROM game_data WHERE user_id = ?').get(req.userId);
    const data = gameRow ? JSON.parse(gameRow.data) : {};
    res.json({ ok: true, email: req.email, data });
});

app.get('/api/data', authMiddleware, (req, res) => {
    const db = getDb();
    const gameRow = db.prepare('SELECT data, updated_at FROM game_data WHERE user_id = ?').get(req.userId);
    if (!gameRow) {
        return res.json({ ok: false, error: 'No data found' });
    }
    res.json({ ok: true, data: JSON.parse(gameRow.data), updatedAt: gameRow.updated_at });
});

app.post('/api/data', authMiddleware, (req, res) => {
    try {
        const { data } = req.body;
        if (!data || typeof data !== 'object') {
            return res.json({ ok: false, error: 'Invalid data' });
        }

        const db = getDb();
        const now = Date.now();

        const existing = db.prepare('SELECT user_id FROM game_data WHERE user_id = ?').get(req.userId);
        if (existing) {
            db.prepare('UPDATE game_data SET data = ?, updated_at = ? WHERE user_id = ?').run(JSON.stringify(data), now, req.userId);
        } else {
            db.prepare('INSERT INTO game_data (user_id, data, updated_at) VALUES (?, ?, ?)').run(req.userId, JSON.stringify(data), now);
        }

        res.json({ ok: true, updatedAt: now });
    } catch (e) {
        console.error('Save data error:', e);
        res.status(500).json({ ok: false, error: 'Server error' });
    }
});

app.delete('/api/account', authMiddleware, (req, res) => {
    try {
        const db = getDb();
        db.prepare('DELETE FROM game_data WHERE user_id = ?').run(req.userId);
        db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);
        res.json({ ok: true });
    } catch (e) {
        console.error('Delete account error:', e);
        res.status(500).json({ ok: false, error: 'Server error' });
    }
});

app.get('/api/admin/users', (req, res) => {
    if (!ADMIN_KEY) {
        return res.status(403).json({ ok: false, error: 'Admin access not configured' });
    }
    const auth = req.headers.authorization;
    if (!auth || auth !== 'Bearer ' + ADMIN_KEY) {
        return res.status(403).json({ ok: false, error: 'Invalid admin key' });
    }
    const db = getDb();
    const users = db.prepare('SELECT id, email, password_hash, created_at FROM users').all();
    res.json({ ok: true, users });
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
});

app.listen(PORT, () => {
    console.log(`SkyStrike server running on port ${PORT} [${IS_PROD ? 'PRODUCTION' : 'DEV'}]`);
});

process.on('SIGTERM', () => { close(); process.exit(0); });
process.on('SIGINT', () => { close(); process.exit(0); });
