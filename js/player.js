class SkyPlayer {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 40;
        this.height = 50;
        this.radius = 20;
        this.baseSpeed = 300;
        this.speed = this.baseSpeed;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxShield = 50;
        this.shield = 0;
        this.baseDamage = 10;
        this.damage = this.baseDamage;
        this.baseFireRate = 0.15;
        this.fireRate = this.baseFireRate;
        this.fireTimer = 0;
        this.armor = 0;
        this.weapon = 'machinegun';
        this.planeId = 'falcon';
        this.alive = true;
        this.invulnerableTimer = 0;
        this.doubleDamageTimer = 0;
        this.rapidFireTimer = 0;
        this.coinMagnetTimer = 0;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 100;
        this.score = 0;
        this.coins = 0;
        this.kills = 0;
        this.totalShots = 0;
        this.hitsLanded = 0;
        this.survivalTime = 0;
        this.engineFlicker = 0;
        this.assets = null;
    }

    init(canvasW, canvasH) {
        this.x = canvasW / 2;
        this.y = canvasH - 80;
    }

    setPlaneStats(planeId) {
        const planes = {
            falcon: { speed: 300, health: 100, damage: 10, fireRate: 0.15, armor: 0, label: 'Falcon' },
            eagle: { speed: 340, health: 120, damage: 12, fireRate: 0.14, armor: 1, label: 'Eagle' },
            raptor: { speed: 320, health: 110, damage: 14, fireRate: 0.13, armor: 2, label: 'Raptor' },
            phantom: { speed: 360, health: 130, damage: 15, fireRate: 0.12, armor: 3, label: 'Phantom' },
            'stealth-x': { speed: 400, health: 100, damage: 18, fireRate: 0.10, armor: 2, label: 'Stealth-X' }
        };
        const stats = planes[planeId] || planes.falcon;
        this.baseSpeed = stats.speed;
        this.maxHealth = stats.health;
        this.baseDamage = stats.damage;
        this.baseFireRate = stats.fireRate;
        this.armor = stats.armor;
        this.planeId = planeId;
    }

    applyUpgrades(upgrades) {
        this.maxHealth += upgrades.health * 10;
        this.baseDamage += upgrades.damage * 3;
        this.baseSpeed += upgrades.speed * 15;
        this.baseFireRate = Math.max(0.05, this.baseFireRate - upgrades.fireRate * 0.01);
        this.armor += upgrades.armor;
        this.health = this.maxHealth;
    }

    update(dt, controls, canvasW, canvasH) {
        if (!this.alive) return;
        this.survivalTime += dt;
        const move = controls.getMovement();
        const speed = this.speed * dt;
        this.x += move.dx * speed;
        this.y += move.dy * speed;
        this.x = Math.max(25, Math.min(canvasW - 25, this.x));
        this.y = Math.max(25, Math.min(canvasH - 25, this.y));
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
        if (this.doubleDamageTimer > 0) {
            this.doubleDamageTimer -= dt;
            this.damage = this.baseDamage * 2;
            if (this.doubleDamageTimer <= 0) this.damage = this.baseDamage;
        }
        if (this.rapidFireTimer > 0) {
            this.rapidFireTimer -= dt;
            this.fireRate = this.baseFireRate * 0.5;
            if (this.rapidFireTimer <= 0) this.fireRate = this.baseFireRate;
        }
        if (this.coinMagnetTimer > 0) this.coinMagnetTimer -= dt;
        this.engineFlicker += dt * 10;
    }

    canFire(dt) {
        if (!this.alive) return false;
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            this.fireTimer = this.fireRate;
            this.totalShots++;
            return true;
        }
        return false;
    }

    getFirePosition() {
        return { x: this.x, y: this.y - 25 };
    }

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return false;
        const dmg = Math.max(1, amount - this.armor);
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, dmg);
            this.shield -= absorbed;
            if (dmg > absorbed) {
                this.health -= (dmg - absorbed);
            }
        } else {
            this.health -= dmg;
        }
        this.invulnerableTimer = 0.5;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
        return true;
    }

    heal(amount) { this.health = Math.min(this.maxHealth, this.health + amount); }
    addShield(amount) { this.shield = Math.min(this.maxShield, this.shield + amount); }
    addScore(amount) { this.score += amount; }
    addCoins(amount) { this.coins += amount; }

    addXP(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = Math.floor(this.xpToNext * 1.3);
            return true;
        }
        return false;
    }

    switchWeapon(type) { this.weapon = type; }

    getWeaponColor() {
        const colors = {
            machinegun: '#ffff00', laser: '#00ffff', rocket: '#ff4400',
            plasma: '#aa00ff', tripleshot: '#ffaa00'
        };
        return colors[this.weapon] || '#ffff00';
    }

    getWeaponLabel() {
        const labels = {
            machinegun: 'Machine Gun', laser: 'Laser Cannon', rocket: 'Rockets',
            plasma: 'Plasma Cannon', tripleshot: 'Triple Shot'
        };
        return labels[this.weapon] || 'Machine Gun';
    }

    _getSpriteName() {
        const map = { 'falcon': 'falcon', 'eagle': 'eagle', 'raptor': 'raptor', 'phantom': 'phantom', 'stealth-x': 'stealthx' };
        return `player_${map[this.planeId] || 'falcon'}`;
    }

    render(ctx) {
        if (!this.alive) return;
        const s = { x: this.x, y: this.y };

        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.save();

        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage(this._getSpriteName()) : null;

        if (sprite) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#4488ff';
            const sw = sprite.width;
            const sh = sprite.height;
            ctx.drawImage(sprite, s.x - sw / 2, s.y - sh / 2);
            ctx.shadowBlur = 0;
        } else {
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#4488ff';
            ctx.fillStyle = '#335588';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y - 25);
            ctx.lineTo(s.x - 20, s.y + 5);
            ctx.lineTo(s.x - 12, s.y + 10);
            ctx.lineTo(s.x - 12, s.y + 20);
            ctx.lineTo(s.x + 12, s.y + 20);
            ctx.lineTo(s.x + 12, s.y + 10);
            ctx.lineTo(s.x + 20, s.y + 5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#5588cc';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y - 18);
            ctx.lineTo(s.x - 12, s.y + 5);
            ctx.lineTo(s.x + 12, s.y + 5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#88bbff';
            ctx.beginPath();
            ctx.arc(s.x, s.y - 8, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(s.x - 2, s.y - 20, 4, 8);
        }

        const flicker = Math.sin(this.engineFlicker) * 0.3 + 0.7;
        ctx.fillStyle = '#ff6600';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff6600';
        ctx.globalAlpha = flicker;
        ctx.beginPath();
        ctx.moveTo(s.x - 8, s.y + 22);
        ctx.lineTo(s.x, s.y + 38);
        ctx.lineTo(s.x + 8, s.y + 22);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (this.shield > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 30, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    reset(canvasW, canvasH) {
        this.x = canvasW / 2;
        this.y = canvasH - 80;
        this.health = this.maxHealth;
        this.shield = 0;
        this.alive = true;
        this.invulnerableTimer = 1.5;
        this.doubleDamageTimer = 0;
        this.rapidFireTimer = 0;
        this.coinMagnetTimer = 0;
        this.fireTimer = 0;
        this.damage = this.baseDamage;
        this.fireRate = this.baseFireRate;
        this.speed = this.baseSpeed;
    }
}

window.SkyPlayer = SkyPlayer;
