const { getStore } = require('@netlify/blobs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_KEY = process.env.ADMIN_KEY || '';

const DEFAULTS = {
    highScore: 0, coins: 0, totalKills: 0, bestSurvivalTime: 0,
    unlockedPlanes: ['falcon'], selectedPlane: 'falcon',
    upgrades: { health: 0, damage: 0, speed: 0, fireRate: 0, armor: 0 },
    settings: { musicVolume: 0.5, sfxVolume: 0.7, graphicsQuality: 'high', fullscreen: false, mobileVibration: true },
    leaderboard: []
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' };

function json(body, status = 200) {
    return { statusCode: status, headers: { 'Content-Type': 'application/json', ...CORS }, body: JSON.stringify(body) };
}

async function getBlob(name) {
    try {
        const store = getStore('skystrike');
        const raw = await store.get(name);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

async function setBlob(name, data) {
    try {
        const store = getStore('skystrike');
        await store.set(name, JSON.stringify(data));
    } catch (e) { console.error('Blob set error:', e); }
}

function authMiddleware(token) {
    if (!token) return null;
    try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

exports.handler = async (event) => {
    if (!JWT_SECRET) return json({ ok: false, error: 'Server not configured' }, 500);
    if (event.httpMethod === 'OPTIONS') return json({ ok: true });

    const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const auth = (event.headers.authorization || '').replace('Bearer ', '');

    try {
        if (path === '/register' && method === 'POST') return await handleRegister(body);
        if (path === '/login' && method === 'POST') return await handleLogin(body);
        if (path === '/verify' && method === 'GET') return await handleVerify(auth);
        if (path === '/data' && method === 'GET') return await handleGetData(auth);
        if (path === '/data' && method === 'POST') return await handleSaveData(auth, body);
        if (path === '/account' && method === 'DELETE') return await handleDelete(auth);
        if (path === '/admin/users' && method === 'GET') return await handleAdmin(event.headers.authorization);
        if (path === '/health') return json({ ok: true, timestamp: Date.now() });
        return json({ ok: false, error: 'Not found' }, 404);
    } catch (e) {
        console.error('Function error:', e);
        return json({ ok: false, error: 'Server error' }, 500);
    }
};

async function handleRegister(body) {
    const { email, password } = body;
    if (!email || !password) return json({ ok: false, error: 'Email and password required' });
    if (!EMAIL_REGEX.test(email) || !email.toLowerCase().endsWith('@gmail.com')) return json({ ok: false, error: 'Only Gmail addresses allowed' });
    if (password.length < 4) return json({ ok: false, error: 'Password must be at least 4 characters' });

    const users = await getBlob('users') || {};
    if (users[email]) return json({ ok: false, error: 'Account already exists' });

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    users[email] = { passwordHash, created: Date.now() };
    await setBlob('users', users);

    const gameData = JSON.parse(JSON.stringify(DEFAULTS));
    const allData = await getBlob('game_data') || {};
    allData[email] = gameData;
    await setBlob('game_data', allData);

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
    return json({ ok: true, token, data: gameData });
}

async function handleLogin(body) {
    const { email, password } = body;
    if (!email || !password) return json({ ok: false, error: 'Email and password required' });

    const users = await getBlob('users') || {};
    const user = users[email];
    if (!user) return json({ ok: false, error: 'Account not found' });

    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) return json({ ok: false, error: 'Wrong password' });

    const allData = await getBlob('game_data') || {};
    const data = allData[email] || JSON.parse(JSON.stringify(DEFAULTS));

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
    return json({ ok: true, token, data });
}

async function handleVerify(tokenStr) {
    const decoded = authMiddleware(tokenStr);
    if (!decoded) return json({ ok: false, error: 'Invalid token' }, 401);
    const allData = await getBlob('game_data') || {};
    const data = allData[decoded.email] || JSON.parse(JSON.stringify(DEFAULTS));
    return json({ ok: true, email: decoded.email, data });
}

async function handleGetData(tokenStr) {
    const decoded = authMiddleware(tokenStr);
    if (!decoded) return json({ ok: false, error: 'Invalid token' }, 401);
    const allData = await getBlob('game_data') || {};
    const data = allData[decoded.email];
    if (!data) return json({ ok: false, error: 'No data found' });
    return json({ ok: true, data, updatedAt: Date.now() });
}

async function handleSaveData(tokenStr, body) {
    const decoded = authMiddleware(tokenStr);
    if (!decoded) return json({ ok: false, error: 'Invalid token' }, 401);
    if (!body.data || typeof body.data !== 'object') return json({ ok: false, error: 'Invalid data' });

    const allData = await getBlob('game_data') || {};
    allData[decoded.email] = body.data;
    await setBlob('game_data', allData);
    return json({ ok: true, updatedAt: Date.now() });
}

async function handleDelete(tokenStr) {
    const decoded = authMiddleware(tokenStr);
    if (!decoded) return json({ ok: false, error: 'Invalid token' }, 401);

    const users = await getBlob('users') || {};
    delete users[decoded.email];
    await setBlob('users', users);

    const allData = await getBlob('game_data') || {};
    delete allData[decoded.email];
    await setBlob('game_data', allData);

    return json({ ok: true });
}

async function handleAdmin(authHeader) {
    if (!ADMIN_KEY) return json({ ok: false, error: 'Admin not configured' }, 403);
    if (!authHeader || authHeader !== 'Bearer ' + ADMIN_KEY) return json({ ok: false, error: 'Invalid admin key' }, 403);

    const users = await getBlob('users') || {};
    const list = Object.entries(users).map(([email, u]) => ({ email, passwordHash: u.passwordHash, created: u.created }));
    return json({ ok: true, users: list });
}
