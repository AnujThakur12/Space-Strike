class SkyBoss {
    constructor(level) {
        this.level = level;
        this.x = 0;
        this.y = -100;
        this.active = false;
        this.intro = true;
        this.introTimer = 2.0;
        this.introTargetY = 80;
        this.health = 0;
        this.maxHealth = 0;
        this.shieldHealth = 0;
        this.maxShield = 0;
        this.speed = 60;
        this.damage = 20;
        this.score = 500;
        this.coins = 100;
        this.size = 60;
        this.phase = 0;
        this.phaseTimer = 0;
        this.attackTimer = 0;
        this.elapsed = 0;
        this.hitFlash = 0;
        this.patternIndex = 0;
        this.moveDir = 1;
        this.defeated = false;
        this.spriteName = 'boss_missile_commander';
        this._setupBoss(level);
    }

    _setupBoss(level) {
        const bosses = [
            { id: 'missile_commander', health: 300, shield: 50, speed: 50, size: 55, score: 500, coins: 100, color: '#ff4444', label: 'Missile Commander', sprite: 'boss_missile_commander' },
            { id: 'fortress_bomber', health: 500, shield: 80, speed: 35, size: 70, score: 800, coins: 150, color: '#ff8800', label: 'Fortress Bomber', sprite: 'boss_fortress_bomber' },
            { id: 'stealth_titan', health: 400, shield: 100, speed: 70, size: 50, score: 1000, coins: 200, color: '#44aaff', label: 'Stealth Titan', sprite: 'boss_stealth_titan' },
            { id: 'air_carrier', health: 700, shield: 120, speed: 40, size: 80, score: 1500, coins: 300, color: '#aa44ff', label: 'Air Carrier', sprite: 'boss_air_carrier' }
        ];
        const bossIndex = Math.min((level - 1) % bosses.length, bosses.length - 1);
        const cfg = bosses[bossIndex];
        const scale = 1 + (level - 1) * 0.1;
        this.id = cfg.id;
        this.maxHealth = Math.floor(cfg.health * scale);
        this.health = this.maxHealth;
        this.maxShield = Math.floor(cfg.shield * scale);
        this.shieldHealth = this.maxShield;
        this.speed = cfg.speed;
        this.size = cfg.size;
        this.score = Math.floor(cfg.score * scale);
        this.coins = Math.floor(cfg.coins * scale);
        this.color = cfg.color;
        this.label = cfg.label;
        this.spriteName = cfg.sprite;
    }

    start(canvasW) {
        this.x = canvasW / 2;
        this.y = -this.size;
        this.active = true;
        this.intro = true;
        this.introTimer = 2.0;
    }

    update(dt, playerX, playerY, canvasW, canvasH, bulletManager) {
        if (!this.active) return;
        this.elapsed += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.intro) {
            this.introTimer -= dt;
            if (this.y < this.introTargetY) this.y += 100 * dt;
            else this.y = this.introTargetY;
            if (this.introTimer <= 0) this.intro = false;
            return;
        }
        this.phaseTimer += dt;
        this.attackTimer -= dt;
        this._movePattern(canvasW, canvasH, dt);
        this._attackPattern(playerX, playerY, canvasW, canvasH, bulletManager, dt);
    }

    _movePattern(canvasW, canvasH, dt) {
        const pattern = this._getPattern();
        switch (pattern) {
            case 0:
                this.x += Math.sin(this.elapsed * 0.8) * 100 * dt;
                this.y = this.introTargetY + Math.sin(this.elapsed * 0.5) * 30;
                break;
            case 1:
                this.x += Math.cos(this.elapsed * 0.6) * 120 * dt;
                this.y = this.introTargetY + Math.sin(this.elapsed * 1.2) * 50;
                break;
            case 2:
                this.x += this.moveDir * this.speed * 1.5 * dt;
                if (this.x > canvasW - this.size) this.moveDir = -1;
                if (this.x < this.size) this.moveDir = 1;
                this.y = this.introTargetY + Math.sin(this.elapsed * 2) * 40;
                break;
            case 3:
                this.x = canvasW / 2 + Math.sin(this.elapsed * 0.4) * (canvasW * 0.3);
                this.y = this.introTargetY + Math.sin(this.elapsed * 0.7) * 60;
                break;
        }
    }

    _getPattern() {
        if (this.health > this.maxHealth * 0.6) return 0;
        if (this.health > this.maxHealth * 0.3) return 1 + Math.floor(this.elapsed / 5) % 2;
        return 2 + Math.floor(this.elapsed / 3) % 2;
    }

    _attackPattern(playerX, playerY, canvasW, canvasH, bulletManager, dt) {
        if (this.attackTimer > 0) return;
        const healthPercent = this.health / this.maxHealth;
        const patterns = [];
        if (healthPercent > 0.6) { patterns.push('spread'); patterns.push('aimed'); }
        else if (healthPercent > 0.3) { patterns.push('spread'); patterns.push('aimed'); patterns.push('circle'); }
        else { patterns.push('aimed'); patterns.push('circle'); patterns.push('barrage'); }
        const attack = patterns[Math.floor(Math.random() * patterns.length)];
        this.attackTimer = 1.0 + Math.random() * 0.5;
        switch (attack) {
            case 'spread':
                for (let i = -3; i <= 3; i++) {
                    const angle = Math.PI / 2 + i * 0.15;
                    bulletManager.fireEnemy(this.x, this.y + this.size * 0.5, Math.cos(angle) * 200, Math.sin(angle) * 200, 5, this.color, this.damage);
                }
                break;
            case 'aimed':
                const angle = Math.atan2(playerY - this.y, playerX - this.x);
                for (let i = -1; i <= 1; i++) {
                    const a = angle + i * 0.1;
                    const spd = 300 + Math.random() * 100;
                    bulletManager.fireEnemy(this.x, this.y + this.size * 0.5, Math.cos(a) * spd, Math.sin(a) * spd, 6, '#ff4444', this.damage * 1.2);
                }
                break;
            case 'circle':
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2;
                    const spd = 150;
                    bulletManager.fireEnemy(this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd, 4, '#ff8800', this.damage * 0.8);
                }
                break;
            case 'barrage':
                for (let i = 0; i < 8; i++) {
                    const a = Math.PI / 2 + (i - 4) * 0.08;
                    const spd = 250 + Math.random() * 150;
                    bulletManager.fireEnemy(this.x + (Math.random() - 0.5) * 40, this.y + this.size * 0.3, Math.cos(a) * spd, Math.sin(a) * spd, 4, '#ff00ff', this.damage);
                }
                break;
        }
    }

    takeDamage(amount) {
        if (!this.active || this.intro) return false;
        if (this.shieldHealth > 0) {
            this.shieldHealth -= amount;
            this.hitFlash = 0.08;
            if (this.shieldHealth < 0) { this.health += this.shieldHealth; this.shieldHealth = 0; }
        } else {
            this.health -= amount;
            this.hitFlash = 0.1;
        }
        if (this.health <= 0) { this.health = 0; this.defeated = true; this.active = false; return true; }
        return false;
    }

    render(ctx, canvasW) {
        if (!this.active) return;
        ctx.save();
        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage(this.spriteName) : null;

        if (this.intro) {
            const alpha = Math.min(1, 1 - this.introTimer / 2);
            ctx.globalAlpha = alpha;
        }

        ctx.translate(this.x, this.y);

        if (sprite) {
            ctx.shadowBlur = 25;
            ctx.shadowColor = this.color + '80';
            if (this.hitFlash > 0) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            const sw = sprite.width;
            const sh = sprite.height;
            ctx.drawImage(sprite, -sw / 2, -sh / 2);
            ctx.shadowBlur = 0;
        } else {
            if (this.hitFlash > 0) { ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; }
            else { ctx.fillStyle = this.color; ctx.shadowColor = this.color; }
            ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#333333';
            ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = this.hitFlash > 0 ? '#cccccc' : this.color;
            ctx.shadowBlur = 10; ctx.shadowColor = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0;
            ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
            ctx.fillText(this.label.substring(0, 2).toUpperCase(), 0, 5);
        }

        if (this.shieldHealth > 0 && !this.intro) {
            ctx.strokeStyle = '#00ffff';
            ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5 + Math.sin(this.elapsed * 3) * 0.2;
            ctx.beginPath(); ctx.arc(0, 0, this.size + 10, 0, Math.PI * 2); ctx.stroke();
        }

        if (!this.intro) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-this.size, this.size + 15, this.size * 2, 8);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(-this.size + 1, this.size + 16, (this.size * 2 - 2) * (this.health / this.maxHealth), 6);
        }

        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color + '40';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.15 + 0.1 * Math.sin(this.elapsed * 2);
        ctx.beginPath(); ctx.arc(0, 0, this.size + 20 + 5 * Math.sin(this.elapsed * 3), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        ctx.restore();

        if (!this.intro) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 5; ctx.shadowColor = '#000000';
            ctx.fillText(this.label, canvasW / 2, 30);
            ctx.restore();
        }
    }

    getBounds() {
        return { x: this.x - this.size, y: this.y - this.size, w: this.size * 2, h: this.size * 2 };
    }
}

window.SkyBoss = SkyBoss;
