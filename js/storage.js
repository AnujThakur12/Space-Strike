class SkyStorage {
    constructor() {
        this.prefix = 'skystrike_';
        this.sessionKey = this.prefix + 'session';
        this.tokenKey = this.prefix + 'api_token';
        this.defaults = {
            highScore: 0,
            coins: 0,
            totalKills: 0,
            bestSurvivalTime: 0,
            unlockedPlanes: ['falcon'],
            selectedPlane: 'falcon',
            upgrades: { health: 0, damage: 0, speed: 0, fireRate: 0, armor: 0 },
            settings: {
                musicVolume: 0.5,
                sfxVolume: 0.7,
                graphicsQuality: 'high',
                fullscreen: false,
                mobileVibration: true
            },
            leaderboard: []
        };
        this.serverUrl = (window.SKYSTRIKE_API_URL !== undefined ? window.SKYSTRIKE_API_URL : 'http://localhost:3001').replace(/\/+$/, '');
        this._currentUser = null;
        this._token = null;
        this.data = {};
        this._apiMode = false;
        this._init();
    }

    async _init() {
        this._loadGuestData();
        const token = this._getStoredToken();
        if (token) {
            try {
                const res = await this._fetch('/api/verify', { method: 'GET', token });
                if (res.ok) {
                    this._token = token;
                    this._currentUser = res.email;
                    this._apiMode = true;
                    if (res.data) {
                        this.data = this._mergeData(res.data);
                    }
                    return;
                }
            } catch (e) {}
            this._clearStoredToken();
        }
        this._loadGuestData();
    }

    _getStoredToken() {
        try { return localStorage.getItem(this.tokenKey); } catch (e) { return null; }
    }

    _storeToken(token) {
        try { localStorage.setItem(this.tokenKey, token); } catch (e) {}
    }

    _clearStoredToken() {
        try { localStorage.removeItem(this.tokenKey); } catch (e) {}
        this._token = null;
    }

    async _fetch(path, opts = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (opts.token) headers['Authorization'] = 'Bearer ' + opts.token;
        else if (this._token) headers['Authorization'] = 'Bearer ' + this._token;
        try {
            const res = await fetch(this.serverUrl + path, {
                method: opts.method || 'POST',
                headers,
                body: opts.body ? JSON.stringify(opts.body) : undefined
            });
            return await res.json();
        } catch (e) {
            return { ok: false, error: 'Cannot connect to server' };
        }
    }

    _mergeData(serverData) {
        const merged = JSON.parse(JSON.stringify(this.defaults));
        for (const key of Object.keys(this.defaults)) {
            if (serverData && serverData[key] !== undefined) {
                merged[key] = serverData[key];
            } else if (this.data && this.data[key] !== undefined) {
                merged[key] = this.data[key];
            }
        }
        return merged;
    }

    async register(username, password) {
        if (!username || !password) return { ok: false, error: 'Email and password required' };
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(username)) return { ok: false, error: 'Enter a valid Gmail address' };
        if (!username.toLowerCase().endsWith('@gmail.com')) return { ok: false, error: 'Only Gmail addresses allowed' };
        if (password.length < 4) return { ok: false, error: 'Password must be at least 4 characters' };

        const res = await this._fetch('/api/register', { body: { email: username, password } });
        if (res.ok) {
            this._token = res.token;
            this._currentUser = username;
            this._apiMode = true;
            this._storeToken(res.token);
            const guestCoins = this.data.coins || 0;
            const guestHighScore = this.data.highScore || 0;
            this.data = res.data || JSON.parse(JSON.stringify(this.defaults));
            if (guestCoins > this.data.coins) this.data.coins = guestCoins;
            if (guestHighScore > this.data.highScore) this.data.highScore = guestHighScore;
            this._syncData();
        }
        return res;
    }

    async login(username, password) {
        const res = await this._fetch('/api/login', { body: { email: username, password } });
        if (res.ok) {
            this._token = res.token;
            this._currentUser = username;
            this._apiMode = true;
            this._storeToken(res.token);
            const guestCoins = this.data.coins || 0;
            const guestHighScore = this.data.highScore || 0;
            this.data = res.data ? this._mergeData(res.data) : JSON.parse(JSON.stringify(this.defaults));
            if (guestCoins > this.data.coins) this.data.coins = guestCoins;
            if (guestHighScore > this.data.highScore) this.data.highScore = guestHighScore;
            this._syncData();
        }
        return res;
    }

    async logout() {
        if (this._apiMode && this._token) {
            await this._syncData();
        }
        this._clearStoredToken();
        this._currentUser = null;
        this._apiMode = false;
        this._token = null;
        this._loadGuestData();
    }

    async deleteAccount() {
        if (!this._apiMode || !this._token) return;
        const res = await this._fetch('/api/account', { method: 'DELETE' });
        if (res.ok) {
            this._clearStoredToken();
            this._currentUser = null;
            this._apiMode = false;
            this._token = null;
            this._loadGuestData();
        }
        return res;
    }

    async _syncData() {
        if (!this._apiMode || !this._token) return;
        await this._fetch('/api/data', { method: 'POST', body: { data: this.data } });
    }

    isLoggedIn() { return this._apiMode && !!this._currentUser; }
    getUsername() { return this._currentUser || 'Guest'; }

    _loadGuestData() {
        this._currentUser = null;
        this.data = this._loadAll();
    }

    _loadAll() {
        const data = {};
        for (const key in this.defaults) {
            const value = this._load(key);
            data[key] = value !== null ? value : JSON.parse(JSON.stringify(this.defaults[key]));
        }
        return data;
    }

    _load(key) {
        try {
            const raw = localStorage.getItem(this.getKey(key));
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    getKey(key) { return this.prefix + key; }

    _save() {
        if (this._apiMode && this._token) {
            this._syncData();
        } else {
            this._saveAll();
        }
    }

    _saveAll() {
        for (const key in this.defaults) {
            try {
                localStorage.setItem(this.getKey(key), JSON.stringify(this.data[key]));
            } catch (e) {}
        }
    }

    get(key) { return this.data[key]; }
    set(key, value) {
        this.data[key] = value;
        this._save();
    }

    addScore(score) {
        if (score > this.data.highScore) {
            this.set('highScore', score);
        }
    }

    addCoins(amount) {
        this.set('coins', this.data.coins + amount);
    }

    spendCoins(amount) {
        if (this.data.coins >= amount) {
            this.set('coins', this.data.coins - amount);
            return true;
        }
        return false;
    }

    unlockPlane(planeId) {
        const planes = this.data.unlockedPlanes;
        if (!planes.includes(planeId)) {
            planes.push(planeId);
            this.set('unlockedPlanes', planes);
        }
    }

    isPlaneUnlocked(planeId) {
        return this.data.unlockedPlanes.includes(planeId);
    }

    selectPlane(planeId) {
        if (this.isPlaneUnlocked(planeId)) {
            this.set('selectedPlane', planeId);
            return true;
        }
        return false;
    }

    getUpgradeLevel(upgrade) {
        return this.data.upgrades[upgrade] || 0;
    }

    setUpgradeLevel(upgrade, level) {
        const upgrades = this.data.upgrades;
        upgrades[upgrade] = level;
        this.set('upgrades', upgrades);
    }

    addToLeaderboard(entry) {
        const board = this.data.leaderboard;
        if (this._currentUser) entry.name = this._currentUser;
        board.push(entry);
        board.sort((a, b) => b.score - a.score);
        if (board.length > 10) board.length = 10;
        this.set('leaderboard', board);
    }

    getLeaderboard() {
        return this.data.leaderboard;
    }

    resetProgress() {
        for (const key in this.defaults) {
            this.data[key] = JSON.parse(JSON.stringify(this.defaults[key]));
        }
        this._save();
    }

    getSettings() { return this.data.settings; }

    updateSettings(settings) {
        const current = this.data.settings;
        for (const key in settings) {
            current[key] = settings[key];
        }
        this.set('settings', current);
    }
}

window.SkyStorage = SkyStorage;
