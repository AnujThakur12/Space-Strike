class SkyUI {
    sx(x) { return (x / 1600) * this.canvas.width; }
    sy(y) { return (y / 900) * this.canvas.height; }
    sw(w) { return (w / 1600) * this.canvas.width; }
    sh(h) { return (h / 900) * this.canvas.height; }
    fi(x) { return Math.floor(x); }
    get REF_W() { return 1600; }
    get REF_H() { return 900; }

    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        this.animTime = 0;
        this.menuSelected = 0;
        this.settingsMenuSelected = 0;
        this.planeMenuSelected = 0;
        this.upgradeMenuSelected = 0;
        this.bossWarningTimer = 0;
        this.transitionAlpha = 0;
        this.transitioning = false;
        this.transitionCallback = null;
        this.notifications = [];
        this.menuItems = ['Start Game', 'Planes', 'Upgrades', 'High Scores', 'Settings', 'Account', 'About'];
        this.settingsItems = ['Music Volume', 'SFX Volume', 'Graphics', 'Fullscreen', 'Vibration', 'Reset Progress', 'Back'];
        this.accountState = 'profile';
        this.accountMenuSelected = 0;
        this.loginInput = '';
        this.passInput = '';
        this.registerInput = '';
        this.registerPassInput = '';
        this.registerPassConfirm = '';
        this.accountMessage = '';
        this.accountMessageColor = '#ffffff';
        this.loginField = 'username';
        this.registerField = 'username';
        this.bgScrollY = 0;
        this.bgStars = [];
        this.shootingStars = [];
        this.menuParticles = [];

        this.planeItems = ['Falcon', 'Eagle', 'Raptor', 'Phantom', 'Stealth-X'];
        this.planeIds = ['falcon', 'eagle', 'raptor', 'phantom', 'stealth-x'];
        this.planeCosts = [0, 500, 1500, 3000, 5000];
        this.upgradeItems = ['Health', 'Damage', 'Speed', 'Fire Rate', 'Armor'];
        this.upgradeKeys = ['health', 'damage', 'speed', 'fireRate', 'armor'];
        this.upgradeCosts = [100, 150, 100, 200, 150];
        this.levels = ['Desert', 'Ocean', 'City', 'Snow', 'Space', 'Volcano', 'Crystal', 'Storm', 'Nebula', 'Void'];
        this.bgProgress = 0;
    }

    update(dt) {
        this.animTime += dt;
        if (this.bossWarningTimer > 0) this.bossWarningTimer -= dt;
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            this.notifications[i].life -= dt;
            if (this.notifications[i].life <= 0) this.notifications.splice(i, 1);
        }
        for (let i = this.menuParticles.length - 1; i >= 0; i--) {
            const p = this.menuParticles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vy += 10 * dt;
            p.life -= dt;
            if (p.life <= 0) this.menuParticles.splice(i, 1);
        }
        const w = this.canvas.width; const isPlaying = this.game.state === 'playing';
        const maxParticles = isPlaying ? 50 : 30;
        if (this.menuParticles.length < maxParticles && Math.random() < (isPlaying ? 0.15 : 0.1)) {
            this.menuParticles.push({
                x: Math.random() * w,
                y: this.canvas.height + 10,
                vx: (Math.random() - 0.5) * (isPlaying ? 25 : 15),
                vy: -(isPlaying ? 30 + Math.random() * 50 : 20 + Math.random() * 30),
                size: 1 + Math.random() * (isPlaying ? 3 : 2.5),
                color: ['#4488ff', '#88bbff', '#ffd700', '#ff88ff', '#88ff88', '#ff8844'][Math.floor(Math.random() * 6)],
                life: 2 + Math.random() * 3,
                alpha: 0.3 + Math.random() * 0.4
            });
        }

    }

    notify(text, color) {
        this.notifications.push({ text, color: color || '#ffffff', life: 2, maxLife: 2 });
    }

    showBossWarning() { this.bossWarningTimer = 3; }

    transition(callback) {
        this.transitioning = true;
        this.transitionAlpha = 0;
        this.transitionCallback = callback;
    }

    updateTransition(dt) {
        if (!this.transitioning) return;
        this.transitionAlpha += dt * 2;
        if (this.transitionAlpha >= 1) {
            this.transitionAlpha = 1;
            if (this.transitionCallback) { this.transitionCallback(); this.transitionCallback = null; }
        }
        if (this.transitionAlpha > 0.5 && this.transitionCallback === null) {
            this.transitionAlpha -= dt * 2;
            if (this.transitionAlpha <= 0) { this.transitionAlpha = 0; this.transitioning = false; }
        }
    }
    renderWatermark() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowBlur = 4; ctx.shadowColor = '#000000';
        ctx.fillText('All Rights Reserved ~@Anuj Thakur', w / 2, h - 4);
        ctx.restore();
    }

    renderMainMenu() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(0, 0, w, h);

        const pulse = Math.sin(this.animTime * 2) * 0.15 + 0.85;
        const titleY = h * 0.2;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 40; ctx.shadowColor = '#4488ff';
        ctx.font = 'bold 48px monospace';
        ctx.fillStyle = `rgba(68,136,255,${pulse})`;
        ctx.fillText('SPACE STRIKE', w / 2, titleY);

        ctx.shadowBlur = 20; ctx.shadowColor = '#88bbff';
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = `rgba(136,187,255,${pulse * 0.8 + 0.2})`;
        ctx.fillText('ENDLESS SPACE', w / 2, titleY + 35);

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        for (let i = 0; i < this.menuItems.length; i++) {
            const bx = w / 2 - 140 + Math.sin(this.animTime * 0.5 + i * 1.2) * 3;
            const by = h * 0.45 + i * 42 - 18;
            ctx.fillRect(bx, by, 280, 36);
            ctx.strokeStyle = `rgba(68,136,255,${0.06 + Math.sin(this.animTime + i) * 0.03})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, 280, 36);
        }

        ctx.shadowBlur = 0;
        const startY = h * 0.45;
        const itemH = 42;

        if (this.game.state === 'menu') {
            for (let i = 0; i < this.menuItems.length; i++) {
                const y = startY + i * itemH;
                const isSelected = i === this.menuSelected;
                const arrowPulse = Math.sin(this.animTime * 3 + i * 0.7) * 3;
                ctx.fillStyle = isSelected ? '#4488ff' : 'rgba(255,255,255,0.7)';
                ctx.font = isSelected ? 'bold 22px monospace' : 'bold 18px monospace';
                ctx.shadowBlur = isSelected ? 10 : 0;
                ctx.shadowColor = isSelected ? '#4488ff' : 'transparent';
                ctx.fillText(this.menuItems[i], w / 2, y);
                if (isSelected) {
                    ctx.shadowBlur = 10; ctx.shadowColor = '#4488ff';
                    ctx.fillStyle = '#4488ff'; ctx.font = '18px monospace';
                    ctx.fillText('> ', w / 2 - 100 + arrowPulse, y);
                    ctx.fillText(' <', w / 2 + 100 - arrowPulse, y);
                }
            }
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('WASD/Arrows: Move | Space: Shoot | P: Pause', w / 2, h - 30);

        for (const p of this.menuParticles) {
            ctx.globalAlpha = p.alpha * (p.life / 4);
            ctx.shadowBlur = 8; ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        ctx.restore();
    }
    renderHighScores() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700';
        ctx.font = 'bold 32px monospace'; ctx.fillText('HIGH SCORES', w / 2, this.sy(60));
        ctx.shadowBlur = 0;
        const board = this.game.storage.getLeaderboard();
        if (board.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '18px monospace';
            ctx.fillText('No scores yet!', w / 2, h / 2);
        } else {
            const startY = this.sy(110); ctx.font = '14px monospace';
            board.forEach((entry, i) => {
                const y = startY + i * this.sy(30);
                ctx.fillStyle = i === 0 ? '#ffd700' : i < 3 ? '#ff8800' : '#ffffff';
                ctx.textAlign = 'left'; ctx.fillText(`${i + 1}.`, this.sx(50), y);
                ctx.fillText(entry.name || 'Pilot', this.sx(90), y);
                ctx.textAlign = 'right'; ctx.fillText(`${entry.score}`, w - this.sx(50), y);
            });
        }
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '14px monospace'; ctx.textAlign = 'center';
        ctx.fillText('[ Back ]', w / 2, h - this.sy(30));
        ctx.restore();
    }

    renderSettings() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4488ff'; ctx.shadowBlur = 15; ctx.shadowColor = '#4488ff';
        ctx.font = 'bold 32px monospace'; ctx.fillText('SETTINGS', w / 2, this.sy(60));
        ctx.shadowBlur = 0;
        const settings = this.game.storage.getSettings();
        const startY = this.sy(120); const itemH = this.sy(45);
        for (let i = 0; i < this.settingsItems.length; i++) {
            const y = startY + i * itemH;
            const selected = i === this.settingsMenuSelected;
            ctx.fillStyle = selected ? '#4488ff' : 'rgba(255,255,255,0.7)';
            ctx.font = selected ? 'bold 18px monospace' : '16px monospace';
            switch (i) {
                case 0:
                    ctx.textAlign = 'left'; ctx.fillText('Music Volume', this.sx(50), y);
                    const mw = this.sw(200); const mx = w / 2 - mw / 2 + this.sx(50);
                    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(mx, y - 8, mw, 8);
                    ctx.fillStyle = selected ? '#4488ff' : '#88bbff';
                    ctx.fillRect(mx, y - 8, mw * settings.musicVolume, 8);
                    ctx.textAlign = 'right'; ctx.fillStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.6)';
                    ctx.font = '12px monospace'; ctx.fillText(Math.round(settings.musicVolume * 100) + '%', w - this.sx(50), y);
                    break;
                case 1:
                    ctx.textAlign = 'left'; ctx.fillText('SFX Volume', this.sx(50), y);
                    const sw = this.sw(200); const sx = w / 2 - sw / 2 + this.sx(50);
                    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(sx, y - 8, sw, 8);
                    ctx.fillStyle = selected ? '#4488ff' : '#88bbff';
                    ctx.fillRect(sx, y - 8, sw * settings.sfxVolume, 8);
                    ctx.textAlign = 'right'; ctx.fillStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.6)';
                    ctx.font = '12px monospace'; ctx.fillText(Math.round(settings.sfxVolume * 100) + '%', w - this.sx(50), y);
                    break;
                case 2: ctx.textAlign = 'left'; ctx.fillText('Graphics: ' + settings.graphicsQuality.toUpperCase(), this.sx(50), y); break;
                case 3: ctx.textAlign = 'left'; ctx.fillText('Fullscreen: ' + (settings.fullscreen ? 'ON' : 'OFF'), this.sx(50), y); break;
                case 4: ctx.textAlign = 'left'; ctx.fillText('Mobile Vibration: ' + (settings.mobileVibration ? 'ON' : 'OFF'), this.sx(50), y); break;
                case 5: ctx.textAlign = 'center'; ctx.fillStyle = selected ? '#ff4444' : 'rgba(255,68,68,0.6)'; ctx.fillText('RESET PROGRESS', w / 2, y); break;
                case 6: ctx.textAlign = 'center'; ctx.fillStyle = selected ? '#4488ff' : 'rgba(255,255,255,0.7)'; ctx.fillText('Back', w / 2, y); break;
            }
        }
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
        ctx.fillText('Use Arrow Keys / WASD to navigate, Enter/Space to toggle', w / 2, h - this.sy(20));
        ctx.restore();
    }

    renderAccount() {
        if (this.game.storage.isLoggedIn()) this.renderAccountProfile();
        else if (this.accountState === 'register') this.renderAccountRegister();
        else this.renderAccountLogin();
    }

    renderAccountLogin() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save(); ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700';
        ctx.font = 'bold 28px monospace'; ctx.fillText('ACCOUNT', w / 2, this.sy(50));
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px monospace';
        ctx.fillText('Login', w / 2, this.sy(100));
        ctx.font = '14px monospace';
        ctx.fillStyle = '#88bbff'; ctx.textAlign = 'left';
        ctx.fillText('Email:', this.sx(350), this.sy(135));
        ctx.strokeStyle = this.loginField === 'username' ? '#4488ff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2; ctx.strokeRect(this.sx(480), this.sy(123), this.sw(250), this.sh(26));
        ctx.fillStyle = this.loginField === 'username' ? '#ffffff' : 'rgba(255,255,255,0.6)';
        const loginDisplay = this.loginInput ? this.loginInput : (this.loginField === 'username' ? '|' : '');
        ctx.fillText(loginDisplay, this.sx(486), this.sy(137));
        ctx.fillStyle = '#88bbff';
        ctx.fillText('Password:', this.sx(350), this.sy(175));
        ctx.strokeStyle = this.loginField === 'password' ? '#4488ff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2; ctx.strokeRect(this.sx(480), this.sy(163), this.sw(250), this.sh(26));
        ctx.fillStyle = this.loginField === 'password' ? '#ffffff' : 'rgba(255,255,255,0.6)';
        const passDisplay = '*'.repeat(this.passInput.length) + (this.loginField === 'password' ? '|' : '');
        ctx.fillText(passDisplay, this.sx(486), this.sy(177));
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '11px monospace';
        ctx.fillText('Tab to switch field | Enter to login', w / 2, this.sy(210));
        ctx.fillStyle = this.accountMessageColor; ctx.font = '14px monospace';
        ctx.fillText(this.accountMessage, w / 2, this.sy(240));
        ctx.fillStyle = '#4488ff'; ctx.font = 'bold 18px monospace';
        ctx.fillText('[ Login ]', w / 2, this.sy(280));
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '16px monospace';
        ctx.fillText('[ Register ]', w / 2, this.sy(320));
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '14px monospace';
        ctx.fillText('[ Back ]', w / 2, this.sy(360));
        ctx.restore();
    }

    renderAccountRegister() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save(); ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700';
        ctx.font = 'bold 28px monospace'; ctx.fillText('REGISTER', w / 2, this.sy(50));
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px monospace';
        ctx.fillText('Create Account', w / 2, this.sy(100));
        ctx.font = '14px monospace';
        ctx.fillStyle = '#88bbff'; ctx.textAlign = 'left';
        ctx.fillText('Email:', this.sx(300), this.sy(135));
        ctx.strokeStyle = this.registerField === 'username' ? '#4488ff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2; ctx.strokeRect(this.sx(420), this.sy(123), this.sw(250), this.sh(26));
        ctx.fillStyle = this.registerField === 'username' ? '#ffffff' : 'rgba(255,255,255,0.6)';
        const regDisplay = this.registerInput ? this.registerInput : (this.registerField === 'username' ? '|' : '');
        ctx.fillText(regDisplay, this.sx(426), this.sy(137));
        ctx.fillStyle = '#88bbff';
        ctx.fillText('Password:', this.sx(300), this.sy(175));
        ctx.strokeStyle = this.registerField === 'password' ? '#4488ff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2; ctx.strokeRect(this.sx(420), this.sy(163), this.sw(250), this.sh(26));
        ctx.fillStyle = this.registerField === 'password' ? '#ffffff' : 'rgba(255,255,255,0.6)';
        const regPassDisplay = '*'.repeat(this.registerPassInput.length) + (this.registerField === 'password' ? '|' : '');
        ctx.fillText(regPassDisplay, this.sx(426), this.sy(177));
        ctx.fillStyle = '#88bbff';
        ctx.fillText('Confirm:', this.sx(300), this.sy(215));
        ctx.strokeStyle = this.registerField === 'confirm' ? '#4488ff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2; ctx.strokeRect(this.sx(420), this.sy(203), this.sw(250), this.sh(26));
        ctx.fillStyle = this.registerField === 'confirm' ? '#ffffff' : 'rgba(255,255,255,0.6)';
        const confirmDisplay = '*'.repeat(this.registerPassConfirm.length) + (this.registerField === 'confirm' ? '|' : '');
        ctx.fillText(confirmDisplay, this.sx(426), this.sy(217));
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px monospace';
        ctx.fillText('Tab to switch field | Enter to register', w / 2, this.sy(250));
        ctx.fillStyle = this.accountMessageColor; ctx.font = '14px monospace';
        ctx.fillText(this.accountMessage, w / 2, this.sy(280));
        ctx.fillStyle = '#00ff88'; ctx.font = 'bold 18px monospace';
        ctx.fillText('[ Create Account ]', w / 2, this.sy(320));
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '14px monospace';
        ctx.fillText('[ Back ]', w / 2, this.sy(360));
        ctx.restore();
    }

    renderAccountProfile() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        const storage = this.game.storage;
        ctx.save(); ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700';
        ctx.font = 'bold 28px monospace'; ctx.fillText('PROFILE', w / 2, this.sy(50));
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px monospace';
        ctx.fillText(storage.getUsername(), w / 2, this.sy(95));
        ctx.fillStyle = '#ffd700'; ctx.font = '16px monospace';
        ctx.fillText(`Coins: ${storage.get('coins')}`, w / 2, this.sy(130));
        ctx.fillStyle = '#88bbff'; ctx.font = '16px monospace';
        ctx.fillText(`High Score: ${storage.get('highScore')}`, w / 2, this.sy(160));
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '14px monospace';
        ctx.fillText(`Total Kills: ${storage.get('totalKills')}`, w / 2, this.sy(190));
        ctx.fillText(`Planes Unlocked: ${storage.get('unlockedPlanes').length}/5`, w / 2, this.sy(215));
        ctx.fillStyle = '#00ff88'; ctx.font = 'bold 18px monospace';
        ctx.fillText('[ Logout ]', w / 2, this.sy(280));
        ctx.fillStyle = '#ff4444'; ctx.font = 'bold 16px monospace';
        ctx.fillText('[ Delete Account ]', w / 2, this.sy(320));
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '14px monospace';
        ctx.fillText('[ Back ]', w / 2, this.sy(360));
        ctx.restore();
    }

    renderAbout() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4488ff'; ctx.shadowBlur = 15; ctx.shadowColor = '#4488ff';
        ctx.font = 'bold 32px monospace'; ctx.fillText('ABOUT', w / 2, this.sy(50));
        ctx.shadowBlur = 0;
        const lines = [
            { text: 'SPACE STRIKE', color: '#ffffff', size: 'bold 20px' },
            { text: 'Endless Space', color: '#88bbff', size: '14px' },
            { text: '', color: '#ffffff', size: '14px' },
            { text: '─── GAME ───', color: '#4488ff', size: 'bold 14px' },
            { text: 'Genre: Arcade Space Shooter', color: '#cccccc', size: '13px' },
            { text: 'Platform: HTML5 Canvas', color: '#cccccc', size: '13px' },
            { text: 'Version: 1.0.0', color: '#cccccc', size: '13px' },
            { text: '', color: '#ffffff', size: '13px' },
            { text: '─── FEATURES ───', color: '#4488ff', size: 'bold 14px' },
            { text: '5 Enemy Types with unique AI behaviors', color: '#aaaaaa', size: '12px' },
            { text: '4 Epic Boss Battles every 5 levels', color: '#aaaaaa', size: '12px' },
            { text: '5 Weapon Systems to master', color: '#aaaaaa', size: '12px' },
            { text: '6 Power-ups & 5 Unlockable Planes', color: '#aaaaaa', size: '12px' },
            { text: 'Upgrade System with 10 levels each', color: '#aaaaaa', size: '12px' },
            { text: 'Endless procedural levels', color: '#aaaaaa', size: '12px' },
            { text: 'Parallax scrolling backgrounds', color: '#aaaaaa', size: '12px' },
            { text: 'Account system with secure save', color: '#aaaaaa', size: '12px' },
            { text: '', color: '#ffffff', size: '12px' },
            { text: '─── CONTROLS ───', color: '#4488ff', size: 'bold 14px' },
            { text: 'WASD / Arrows : Move', color: '#88bbff', size: '13px' },
            { text: 'Space / Click : Shoot', color: '#88bbff', size: '13px' },
            { text: 'P : Pause | ESC : Back', color: '#88bbff', size: '13px' },
            { text: '', color: '#ffffff', size: '13px' },
            { text: '─── CREDITS ───', color: '#4488ff', size: 'bold 14px' },
            { text: 'Game Design & Development', color: '#ffffff', size: 'bold 13px' },
            { text: 'Anuj Thakur', color: '#ffd700', size: '14px' },
            { text: '', color: '#ffffff', size: '14px' },
            { text: 'All Rights Reserved ~@Anuj Thakur', color: '#ffd700', size: 'bold 12px' },
        ];
        let y = this.sy(95);
        lines.forEach(line => {
            ctx.fillStyle = line.color;
            ctx.font = line.size + ' monospace';
            ctx.textAlign = 'center';
            ctx.fillText(line.text, w / 2, y);
            y += line.text ? this.sy(21) : this.sy(10);
        });
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '14px monospace';
        ctx.fillText('[ Back ]', w / 2, h - this.sy(30));
        ctx.restore();
    }

    renderPlaneSelect() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 15; ctx.shadowColor = '#ffd700';
        ctx.font = 'bold 28px monospace'; ctx.fillText('SELECT PLANE', w / 2, this.sy(50));
        ctx.shadowBlur = 0;
        const startY = this.sy(90); const itemH = this.sy(50);
        const storage = this.game.storage;
        for (let i = 0; i < this.planeItems.length; i++) {
            const y = startY + i * itemH;
            const selected = i === this.planeMenuSelected;
            const unlocked = storage.isPlaneUnlocked(this.planeIds[i]);
            const equipped = storage.get('selectedPlane') === this.planeIds[i];
            ctx.textAlign = 'left';
            if (selected) { ctx.fillStyle = '#4488ff'; ctx.shadowBlur = 8; ctx.shadowColor = '#4488ff'; }
            else { ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.6)'; }
            ctx.font = selected ? 'bold 18px monospace' : '16px monospace';
            ctx.fillText(this.planeItems[i], this.sx(80), y);
            if (equipped) { ctx.fillStyle = '#00ff00'; ctx.shadowBlur = 0; ctx.font = '14px monospace'; ctx.fillText('EQUIPPED', w - this.sx(150), y); }
            else if (unlocked) { ctx.fillStyle = '#88bbff'; ctx.shadowBlur = 0; ctx.font = '14px monospace'; ctx.fillText('UNLOCKED', w - this.sx(150), y); }
            else { ctx.fillStyle = '#ff4444'; ctx.shadowBlur = 0; ctx.font = '14px monospace'; ctx.fillText(`${this.planeCosts[i]} coins`, w - this.sx(150), y); }
        }
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
        ctx.fillText('Arrow keys to navigate, Enter to select/equip', w / 2, h - this.sy(40));
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '14px monospace';
        ctx.fillText('[ Back ]', w / 2, h - this.sy(15));
        ctx.restore();
    }

    renderUpgradeMenu() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff88'; ctx.shadowBlur = 15; ctx.shadowColor = '#00ff88';
        ctx.font = 'bold 28px monospace'; ctx.fillText('UPGRADES', w / 2, this.sy(50));
        ctx.shadowBlur = 0; ctx.fillStyle = '#ffd700'; ctx.font = '16px monospace';
        ctx.fillText(`Coins: ${this.game.player.coins}`, w / 2, this.sy(80));
        const startY = this.sy(110); const itemH = this.sy(50);
        const storage = this.game.storage;
        for (let i = 0; i < this.upgradeItems.length; i++) {
            const y = startY + i * itemH;
            const selected = i === this.upgradeMenuSelected;
            const level = storage.getUpgradeLevel(this.upgradeKeys[i]);
            const cost = this.upgradeCosts[i] * (level + 1);
            const canAfford = this.game.player.coins >= cost;
            ctx.textAlign = 'left';
            ctx.shadowBlur = selected ? 8 : 0; ctx.shadowColor = '#00ff88';
            ctx.fillStyle = selected ? '#00ff88' : 'rgba(255,255,255,0.7)';
            ctx.font = selected ? 'bold 18px monospace' : '16px monospace';
            ctx.fillText(`${this.upgradeItems[i]} Lv.${level}`, this.sx(80), y);
            ctx.textAlign = 'right';
            ctx.fillStyle = canAfford ? '#ffd700' : '#ff4444';
            ctx.font = '14px monospace';
            ctx.fillText(`${cost} coins`, w - this.sx(80), y);
            ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(this.sx(80), y + 8, w - this.sx(160), 6);
            ctx.fillStyle = '#00ff88'; ctx.fillRect(this.sx(80), y + 8, (w - this.sx(160)) * (level / 10), 6);
        }
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
        ctx.fillText('Arrow keys to navigate, Enter to buy', w / 2, h - this.sy(40));
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '14px monospace';
        ctx.fillText('[ Back ]', w / 2, h - this.sy(15));
        ctx.restore();
    }

    renderHUD() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height; const p = this.game.player;
        ctx.save();
        ctx.textBaseline = 'top';

        const hudH = this.sy(95);
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, w, hudH);
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, h - this.sy(30), w, this.sy(30));

        ctx.shadowBlur = 5; ctx.shadowColor = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(this.sx(10), this.sy(10), this.sw(200), this.sh(16));
        ctx.shadowBlur = 0;
        const hpRatio = p.health / p.maxHealth;
        const hpGrad = ctx.createLinearGradient(this.sx(12), 0, this.sx(208), 0);
        hpGrad.addColorStop(0, '#ff4444');
        hpGrad.addColorStop(0.5, '#ff8800');
        hpGrad.addColorStop(1, '#44ff44');
        ctx.fillStyle = hpGrad; ctx.fillRect(this.sx(12), this.sy(12), this.sw(196) * hpRatio, this.sh(12));
        ctx.shadowBlur = 8; ctx.shadowColor = hpRatio > 0.5 ? '#44ff44' : '#ff4444';
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`HP: ${Math.ceil(p.health)}/${p.maxHealth}`, this.sx(110), this.sy(11));
        ctx.shadowBlur = 0;
        if (p.shield > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(this.sx(10), this.sy(30), this.sw(200), this.sh(10));
            ctx.shadowBlur = 6; ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#00ffff'; ctx.fillRect(this.sx(12), this.sy(32), this.sw(196) * (p.shield / p.maxShield), this.sh(6));
            ctx.shadowBlur = 0;
        }
        ctx.shadowBlur = 4; ctx.shadowColor = '#000000';
        ctx.textAlign = 'right'; ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px monospace';
        ctx.fillText(`SCORE: ${p.score}`, w - this.sx(15), this.sy(10));
        ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 6;
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`COINS: ${p.coins}`, w - this.sx(15), this.sy(32));
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left'; ctx.fillStyle = p.getWeaponColor(); ctx.font = 'bold 12px monospace';
        ctx.shadowBlur = 4; ctx.shadowColor = '#000000';
        ctx.fillText(`WPN: ${p.getWeaponLabel()}`, this.sx(10), this.sy(52));
        ctx.fillStyle = '#88bbff'; ctx.font = 'bold 12px monospace';
        ctx.fillText(`LVL: ${this.game.currentLevel}`, this.sx(10), this.sy(70));
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText(`KILLS: ${p.kills}`, this.sx(10), this.sy(86));
        ctx.shadowBlur = 0;

        if (p.doubleDamageTimer > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(w/2-this.sw(80), this.sy(50), this.sw(160), this.sh(22));
            ctx.shadowBlur = 10; ctx.shadowColor = '#ff4400';
            ctx.fillStyle = '#ff4400'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
            ctx.fillText(`2X DMG ${Math.ceil(p.doubleDamageTimer)}s`, w / 2, this.sy(53));
            ctx.shadowBlur = 0;
        }
        if (p.rapidFireTimer > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(w/2-this.sw(80), this.sy(72), this.sw(160), this.sh(22));
            ctx.fillStyle = '#ffff00'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
            ctx.fillText(`RAPID ${Math.ceil(p.rapidFireTimer)}s`, w / 2, this.sy(75));
        }
        ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px monospace';
        ctx.fillText(`ENEMIES: ${this.game.enemyManager.getCount()}`, this.sx(10), h - this.sy(24));
        ctx.restore();
    }

    renderBossBar() {
        if (!this.game.boss || !this.game.boss.active) return;
        const ctx = this.ctx; const w = this.canvas.width; const boss = this.game.boss;
        ctx.save();
        ctx.textBaseline = 'middle';
        const barW = Math.min(this.sw(400), w - this.sx(40)); const barX = (w - barW) / 2; const barY = this.sy(45);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(barX, barY, barW, 14);
        if (boss.shieldHealth > 0) {
            ctx.shadowBlur = 8; ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#00ffff'; ctx.fillRect(barX, barY, barW * (boss.shieldHealth / boss.maxShield), 14);
        } else {
            ctx.shadowBlur = 8; ctx.shadowColor = boss.color;
            ctx.fillStyle = boss.color; ctx.fillRect(barX, barY, barW * (boss.health / boss.maxHealth), 14);
        }
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 3; ctx.shadowColor = '#000000';
        ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${boss.label}`, w / 2, barY + 11);
        ctx.restore();
    }

    renderBossWarning() {
        if (this.bossWarningTimer <= 0) return;
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        const alpha = Math.sin(this.bossWarningTimer * 8) * 0.5 + 0.5;
        ctx.save(); ctx.textBaseline = 'middle'; ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff0000'; ctx.shadowBlur = 40; ctx.shadowColor = '#ff0000';
        ctx.font = 'bold 48px monospace'; ctx.textAlign = 'center';
        ctx.fillText('⚠ WARNING ⚠', w / 2, h / 2 - 30);
        ctx.shadowBlur = 25; ctx.shadowColor = '#ff4400';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('BOSS INCOMING', w / 2, h / 2 + 20);
        ctx.shadowBlur = 0; ctx.restore();
    }

    renderGameOver() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height; const p = this.game.player;
        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20; ctx.shadowColor = '#ff4444';
        ctx.font = 'bold 40px monospace'; ctx.fillStyle = '#ff4444'; ctx.fillText('GAME OVER', w / 2, h * 0.15);
        ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px monospace';
        const stats = [
            `Final Score: ${p.score}`, `Enemies Defeated: ${p.kills}`,
            `Coins Earned: ${p.coins}`,
            `Accuracy: ${p.totalShots > 0 ? Math.round(p.hitsLanded / p.totalShots * 100) : 0}%`,
            `Survival Time: ${this._formatTime(p.survivalTime)}`,
            `Level Reached: ${this.game.currentLevel}`, `Plane: ${p.planeId}`
        ];
        const startY = h * 0.3;
        stats.forEach((stat, i) => { ctx.fillStyle = i === 0 ? '#ffd700' : '#ffffff'; ctx.fillText(stat, w / 2, startY + i * this.sy(30)); });
        const btnY = h * 0.75;
        ctx.shadowBlur = 10; ctx.shadowColor = '#4488ff';
        ctx.font = 'bold 20px monospace'; ctx.fillStyle = '#4488ff'; ctx.fillText('[ Play Again ]', w / 2, btnY);
        ctx.shadowBlur = 0; ctx.font = 'bold 16px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('[ Main Menu ]', w / 2, btnY + this.sy(40));
        ctx.restore();
    }

    renderPause() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save(); ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 20; ctx.shadowColor = '#ffffff';
        ctx.font = 'bold 36px monospace'; ctx.fillText('PAUSED', w / 2, this.sy(430));
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 16px monospace';
        ctx.fillText('Press P or ESC to resume', w / 2, this.sy(470));
        ctx.restore();
    }

    renderNotifications() {
        const ctx = this.ctx; const w = this.canvas.width;
        ctx.save(); ctx.textBaseline = 'middle';
        this.notifications.forEach((n, i) => {
            const alpha = n.life / n.maxLife; const y = 110 + i * 26;
            ctx.globalAlpha = alpha; ctx.fillStyle = n.color;
            ctx.shadowBlur = 10; ctx.shadowColor = n.color;
            ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
            ctx.fillText(n.text, w / 2, y);
        });
        ctx.restore();
    }

    renderMobileControls() {
        if (!this.game.controls.isMobile()) return;
        const ctx = this.ctx; const ctrl = this.game.controls; const jd = ctrl.getJoystickData();
        const w = this.canvas.width; const h = this.canvas.height;
        ctx.save();
        const jr = this.sw(65);
        const jx = this.sx(120); const jy = h - this.sy(130);
        if (jd.active) {
            ctx.globalAlpha = 0.4; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(jd.centerX, jd.centerY, jd.baseRadius, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 0.4; ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath(); ctx.arc(jd.centerX, jd.centerY, jd.baseRadius, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.6; ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.arc(jd.knobX, jd.knobY, this.sw(22), 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(jd.knobX, jd.knobY, this.sw(22), 0, Math.PI * 2); ctx.stroke();
        } else {
            ctx.globalAlpha = 0.25; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(jx, jy, jr, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 0.15; ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath(); ctx.arc(jx, jy, jr, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.15; ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath(); ctx.arc(jx, jy, this.sw(15), 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.15; ctx.font = '18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff'; ctx.fillText('+', jx, jy);
        }
        ctx.globalAlpha = 0.4; ctx.fillStyle = '#ffffff'; ctx.font = '24px monospace'; ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('∥', w - this.sw(28), this.sy(28));
        ctx.restore();
    }

    renderLevelTransition() {
        if (!this.game.levelTransition) return;
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        const pulse = Math.sin(this.animTime * 3) * 0.15 + 0.85;
        ctx.save(); ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';
        ctx.shadowBlur = 25; ctx.shadowColor = '#ffd700';
        ctx.fillStyle = `rgba(255,215,0,${pulse})`;
        ctx.font = 'bold 40px monospace';
        ctx.fillText(`LEVEL ${this.game.currentLevel}`, w / 2, h / 2 - 35);
        ctx.shadowBlur = 15; ctx.shadowColor = '#88bbff';
        ctx.fillStyle = '#88bbff'; ctx.font = 'bold 22px monospace';
        ctx.fillText(this.levels[(this.game.currentLevel - 1) % this.levels.length], w / 2, h / 2 + 15);
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '14px monospace';
        ctx.fillText('Get ready...', w / 2, h / 2 + 60);
        ctx.restore();
    }

    _initStars(w, h) {
        if (this.bgStars.length > 0) return;
        const colors = ['#ffffff', '#88bbff', '#ffd700', '#ff88ff', '#88ff88', '#ff8844'];
        for (let i = 0; i < 200; i++) {
            const isLarge = Math.random() < 0.05;
            this.bgStars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: isLarge ? 2 + Math.random() * 3 : 0.5 + Math.random() * 2,
                speed: isLarge ? 15 + Math.random() * 30 : 5 + Math.random() * 20,
                alpha: isLarge ? 0.4 + Math.random() * 0.5 : 0.15 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                glow: isLarge ? 12 : 0
            });
        }
    }

    renderBackground() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        const assets = window.gameAssets;
        this._initStars(w, h);

        const level = this.game.currentLevel;
        const bgType = (level - 1) % 10;
        let gradient;
        const gradients = [
            ['#0a0a2e', '#1a0a3e', '#0a0a1a'],
            ['#0a1628', '#0d284a', '#0a0a1a'],
            ['#1a1a2e', '#2a1a3e', '#0a0a1a'],
            ['#0a1a2e', '#1a2a4e', '#0a0a1e'],
            ['#0a0a1e', '#1a0a2e', '#0a0a2e'],
            ['#2e0a0a', '#4e1a0a', '#1a0a0a'],
            ['#0a2e1a', '#0a4e2a', '#0a1a0a'],
            ['#1a1a2e', '#3a3a5e', '#0a0a1e'],
            ['#1a0a2e', '#3a1a5e', '#0a0a2e'],
            ['#050510', '#0a0a20', '#000005']
        ];
        const g = gradients[bgType % gradients.length];
        gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, g[0]);
        gradient.addColorStop(0.5, g[1]);
        gradient.addColorStop(1, g[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        const bgSprite = assets ? assets.getImage('bg_stars') : null;
        if (bgSprite) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            const patternY = (this.bgScrollY * 0.3) % bgSprite.height;
            for (let y = -bgSprite.height + patternY; y < h; y += bgSprite.height) {
                for (let x = 0; x < w; x += bgSprite.width) {
                    ctx.drawImage(bgSprite, x, y);
                }
            }
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        ctx.save();
        const scrollSpeed = this.game.state === 'playing' ? 1 : 0.3;
        const time = this.animTime;

        if (this.game.state === 'playing' && Math.random() < 0.003) {
            this.shootingStars.push({
                x: Math.random() * w * 1.2 - w * 0.1,
                y: Math.random() * h * 0.3,
                speed: 400 + Math.random() * 600,
                length: 60 + Math.random() * 80,
                alpha: 0.6 + Math.random() * 0.4,
                life: 0.5 + Math.random() * 0.5
            });
        }
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const ss = this.shootingStars[i];
            ss.life -= 0.016;
            ss.x += ss.speed * 0.016;
            ss.y += ss.speed * 0.016 * 0.3;
            ss.alpha -= 0.016 * 1.5;
            if (ss.life <= 0 || ss.alpha <= 0) { this.shootingStars.splice(i, 1); continue; }
            ctx.globalAlpha = ss.alpha;
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.shadowBlur = 20; ctx.shadowColor = '#88bbff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(ss.x - ss.length * 0.3, ss.y - ss.length * 0.1);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2); ctx.fill();
        }

        for (const star of this.bgStars) {
            star.y += star.speed * 0.016 * scrollSpeed;
            if (star.y > h) { star.y = -2; star.x = Math.random() * w; }
            const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + star.twinkle);
            ctx.globalAlpha = star.alpha * twinkle;
            ctx.fillStyle = star.color || '#ffffff';
            if (star.glow > 0) {
                ctx.shadowBlur = star.glow;
                ctx.shadowColor = star.color;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        for (const p of this.menuParticles) {
            ctx.globalAlpha = p.alpha * (p.life / 4);
            ctx.shadowBlur = 8; ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    renderTransition() {
        if (!this.transitioning) return;
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = this.transitionAlpha > 0.5 ? (1 - this.transitionAlpha) * 2 : this.transitionAlpha * 2;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    _formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}

window.SkyUI = SkyUI;
