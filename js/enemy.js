class BaseEnemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.active = true;
        this.friendly = false;
        this.speed = config.speed || 100;
        this.health = config.health || 30;
        this.maxHealth = this.health;
        this.damage = config.damage || 10;
        this.score = config.score || 10;
        this.coins = config.coins || 5;
        this.size = config.size || 20;
        this.fireRate = config.fireRate || 0;
        this.fireTimer = Math.random() * (config.fireRate || 2);
        this.type = config.type || 'drone';
        this.color = config.color || '#ff4444';
        this.pattern = config.pattern || 'straight';
        this.spriteName = config.sprite || 'enemy_drone';
        this.elapsed = 0;
        this.hitFlash = 0;
    }

    update(dt, playerX, playerY, canvasW, canvasH, bulletManager) {
        this.elapsed += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 0.1;
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            return true;
        }
        return false;
    }

    isOffscreen(canvasW, canvasH) {
        return this.x < -100 || this.x > canvasW + 100 || this.y < -100 || this.y > canvasH + 100;
    }

    render(ctx) {
        ctx.save();
        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage(this.spriteName) : null;

        if (sprite) {
            ctx.translate(this.x, this.y);
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color || '#ff6666';
            if (this.hitFlash > 0) {
                ctx.globalAlpha = 0.7;
                ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
            }
            ctx.shadowBlur = 0;
        } else {
            if (this.hitFlash > 0) ctx.fillStyle = '#ffffff';
            else ctx.fillStyle = this.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.size);
            ctx.lineTo(this.x - this.size * 0.7, this.y - this.size * 0.3);
            ctx.lineTo(this.x - this.size * 0.3, this.y - this.size * 0.6);
            ctx.lineTo(this.x + this.size * 0.3, this.y - this.size * 0.6);
            ctx.lineTo(this.x + this.size * 0.7, this.y - this.size * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.size, y: this.y - this.size, w: this.size * 2, h: this.size * 2 };
    }
}

class Drone extends BaseEnemy {
    constructor(x, y, level) {
        super(x, y, {
            type: 'drone', speed: 60 + level * 5, health: 15 + level * 3,
            damage: 5, score: 10, coins: 3, size: 16,
            color: '#ff6666', pattern: 'straight', fireRate: 0, sprite: 'enemy_drone'
        });
        this.vx = (Math.random() - 0.5) * 30;
    }

    update(dt, playerX, playerY, canvasW, canvasH, bulletManager) {
        super.update(dt);
        this.y += this.speed * dt;
        this.x += Math.sin(this.elapsed * 2) * 60 * dt + this.vx * dt;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage('enemy_drone') : null;
        if (sprite) {
            if (this.hitFlash > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath();
                ctx.arc(0, 0, this.size + 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            if (this.hitFlash > 0) ctx.fillStyle = '#ffffff';
            else ctx.fillStyle = '#ff6666';
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#ff6666';
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#cc3333';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(0, 4, 3, 0, Math.PI);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Fighter extends BaseEnemy {
    constructor(x, y, level) {
        super(x, y, {
            type: 'fighter', speed: 80 + level * 5, health: 40 + level * 5,
            damage: 10, score: 25, coins: 8, size: 22,
            color: '#ff8800', pattern: 'straight', fireRate: 1.5 - level * 0.03,
            sprite: 'enemy_fighter'
        });
        this.fireRate = Math.max(0.5, this.config.fireRate);
        this.dir = Math.random() > 0.5 ? 1 : -1;
    }

    update(dt, playerX, playerY, canvasW, canvasH, bulletManager) {
        super.update(dt);
        this.y += this.speed * dt;
        this.x += Math.sin(this.elapsed * 1.5) * 100 * dt * this.dir;
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && this.y < canvasH - 50) {
            this.fireTimer = this.fireRate;
            if (bulletManager) {
                bulletManager.fireEnemyAt(this.x, this.y + 15, playerX, playerY, 250, 4, '#ff8800', this.damage);
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage('enemy_fighter') : null;
        if (sprite) {
            if (this.hitFlash > 0) { ctx.globalAlpha = 0.7; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            if (this.hitFlash > 0) ctx.fillStyle = '#ffffff';
            else ctx.fillStyle = '#ff8800';
            ctx.shadowBlur = 8; ctx.shadowColor = '#ff8800';
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(-this.size * 0.8, this.size * 0.4);
            ctx.lineTo(-this.size * 0.4, this.size * 0.6);
            ctx.lineTo(this.size * 0.4, this.size * 0.6);
            ctx.lineTo(this.size * 0.8, this.size * 0.4);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#cc6600';
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 0.5);
            ctx.lineTo(-this.size * 0.3, this.size * 0.2);
            ctx.lineTo(this.size * 0.3, this.size * 0.2);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath(); ctx.arc(0, this.size * 0.1, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

class Bomber extends BaseEnemy {
    constructor(x, y, level) {
        super(x, y, {
            type: 'bomber', speed: 40 + level * 3, health: 80 + level * 10,
            damage: 20, score: 40, coins: 15, size: 30,
            color: '#cc4444', pattern: 'straight', fireRate: 2.0, sprite: 'enemy_bomber'
        });
        this.dropTimer = this.fireRate;
    }

    update(dt, playerX, playerY, canvasW, canvasH, bulletManager) {
        super.update(dt);
        this.y += this.speed * dt;
        this.x = this.x + Math.sin(this.elapsed * 0.5) * 30 * dt;
        this.dropTimer -= dt;
        if (this.dropTimer <= 0 && this.y < canvasH - 30) {
            this.dropTimer = this.fireRate;
            if (bulletManager) {
                bulletManager.fireEnemy(this.x, this.y + this.size, 0, 200, 8, '#ff4400', this.damage);
                bulletManager.fireEnemy(this.x - 15, this.y + this.size, 0, 200, 6, '#ff4400', this.damage * 0.7);
                bulletManager.fireEnemy(this.x + 15, this.y + this.size, 0, 200, 6, '#ff4400', this.damage * 0.7);
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage('enemy_bomber') : null;
        if (sprite) {
            if (this.hitFlash > 0) { ctx.globalAlpha = 0.7; }
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            if (this.hitFlash > 0) ctx.fillStyle = '#ffffff';
            else ctx.fillStyle = '#cc4444';
            ctx.shadowBlur = 8; ctx.shadowColor = '#cc4444';
            ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#993333';
            ctx.fillRect(-this.size * 0.6, -this.size * 0.3, this.size * 1.2, this.size * 0.2);
            ctx.fillStyle = '#ff6666';
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath(); ctx.arc(i * this.size * 0.4, this.size * 0.2, 3, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();
    }
}

class StealthJet extends BaseEnemy {
    constructor(x, y, level) {
        super(x, y, {
            type: 'stealth', speed: 150 + level * 8, health: 25 + level * 4,
            damage: 15, score: 35, coins: 12, size: 18,
            color: '#44aaff', pattern: 'zigzag', fireRate: 0.8, sprite: 'enemy_stealth'
        });
        this.fireRate = Math.max(0.3, this.config.fireRate - level * 0.02);
        this.alpha = 0.3;
        this.phase = Math.random() * Math.PI * 2;
    }

    update(dt, playerX, playerY, canvasW, canvasH, bulletManager) {
        super.update(dt);
        this.y += this.speed * dt;
        this.x += Math.sin(this.elapsed * 4 + this.phase) * 200 * dt;
        this.alpha = 0.3 + Math.sin(this.elapsed * 3) * 0.2 + 0.2;
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && this.y < canvasH - 30) {
            this.fireTimer = this.fireRate;
            if (bulletManager) {
                const angle = Math.atan2(playerY - this.y, playerX - this.x);
                for (let i = -1; i <= 1; i++) {
                    const a = angle + i * 0.2;
                    bulletManager.fireEnemy(this.x, this.y, Math.cos(a) * 350, Math.sin(a) * 350, 3, '#44aaff', this.damage * 0.6);
                }
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha || 0.5;
        ctx.translate(this.x, this.y);
        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage('enemy_stealth') : null;
        if (sprite) {
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            if (this.hitFlash > 0) ctx.fillStyle = '#ffffff';
            else ctx.fillStyle = '#44aaff';
            ctx.shadowBlur = 5; ctx.shadowColor = '#44aaff';
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(-this.size * 0.9, this.size * 0.3);
            ctx.lineTo(-this.size * 0.5, this.size * 0.5);
            ctx.lineTo(this.size * 0.5, this.size * 0.5);
            ctx.lineTo(this.size * 0.9, this.size * 0.3);
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    }
}

class EliteEnemy extends BaseEnemy {
    constructor(x, y, level) {
        super(x, y, {
            type: 'elite', speed: 70 + level * 5, health: 100 + level * 15,
            damage: 18, score: 60, coins: 25, size: 28,
            color: '#ff00ff', pattern: 'advanced', fireRate: 1.0, sprite: 'enemy_elite'
        });
        this.fireRate = Math.max(0.4, this.config.fireRate - level * 0.02);
        this.phase = Math.random() * Math.PI * 2;
        this.movePattern = Math.floor(Math.random() * 3);
        this.shieldHealth = 30;
    }

    update(dt, playerX, playerY, canvasW, canvasH, bulletManager) {
        super.update(dt);
        if (this.movePattern === 0) {
            this.y += this.speed * 0.5 * dt;
            this.x += Math.sin(this.elapsed * 2 + this.phase) * 120 * dt;
        } else if (this.movePattern === 1) {
            this.y += this.speed * 0.3 * dt;
            this.x += Math.sin(this.elapsed * 3 + this.phase) * 150 * dt;
            this.x += Math.cos(this.elapsed * 1.5) * 50 * dt;
        } else {
            this.y += this.speed * 0.6 * dt;
            this.x = canvasW / 2 + Math.sin(this.elapsed * 0.8 + this.phase) * (canvasW * 0.35);
        }
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && this.y < canvasH - 50) {
            this.fireTimer = this.fireRate;
            if (bulletManager) {
                const angle = Math.atan2(playerY - this.y, playerX - this.x);
                for (let i = -2; i <= 2; i++) {
                    const a = angle + i * 0.15;
                    const spd = 200 + Math.random() * 100;
                    bulletManager.fireEnemy(this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd, 4, '#ff00ff', this.damage);
                }
            }
        }
    }

    takeDamage(amount) {
        if (this.shieldHealth > 0) {
            this.shieldHealth -= amount;
            this.hitFlash = 0.05;
            if (this.shieldHealth <= 0) this.shieldHealth = 0;
            return false;
        }
        return super.takeDamage(amount);
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage('enemy_elite') : null;
        if (sprite) {
            if (this.hitFlash > 0) { ctx.globalAlpha = 0.7; }
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
            ctx.globalAlpha = 1;
        } else {
            if (this.hitFlash > 0) ctx.fillStyle = '#ffffff';
            else ctx.fillStyle = '#ff00ff';
            ctx.shadowBlur = 12; ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(-this.size * 0.8, this.size * 0.4);
            ctx.lineTo(-this.size * 0.5, 0);
            ctx.lineTo(-this.size * 0.8, this.size * 0.7);
            ctx.lineTo(0, this.size * 0.4);
            ctx.lineTo(this.size * 0.8, this.size * 0.7);
            ctx.lineTo(this.size * 0.5, 0);
            ctx.lineTo(this.size * 0.8, this.size * 0.4);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ff66ff';
            ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        }
        if (this.shieldHealth > 0) {
            ctx.strokeStyle = '#ff88ff';
            ctx.shadowBlur = 10; ctx.shadowColor = '#ff88ff';
            ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.size, y: this.y - this.size, w: this.size * 2, h: this.size * 2 };
    }
}

class SkyEnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
        this.level = 1;
        this.difficulty = 1;
        this.maxEnemies = 15;
    }

    setLevel(level) {
        this.level = level;
        this.difficulty = 1 + (level - 1) * 0.18;
        this.spawnInterval = Math.max(0.2, 2.0 - level * 0.06);
        this.maxEnemies = Math.min(50, 15 + level * 3);
    }

    spawnEnemy(canvasW, canvasH) {
        const x = 50 + Math.random() * (canvasW - 100);
        const y = -40;
        const lvl = this.level;
        const types = [
            { type: 'drone', weight: 40 },
            { type: 'fighter', weight: 30 },
            { type: 'bomber', weight: 15 },
            { type: 'stealth', weight: 10 },
            { type: 'elite', weight: 5 }
        ];
        if (this.level < 2) { types[2].weight = 5; types[3].weight = 0; types[4].weight = 0; }
        else if (this.level < 3) { types[3].weight = 5; types[4].weight = 0; }
        else if (this.level < 4) { types[4].weight = 3; }
        else { types[4].weight = Math.min(20, 5 + this.level); }
        const totalWeight = types.reduce((s, t) => s + t.weight, 0);
        let r = Math.random() * totalWeight;
        let selected = types[0].type;
        for (const t of types) { r -= t.weight; if (r <= 0) { selected = t.type; break; } }
        switch (selected) {
            case 'drone': return new Drone(x, y, lvl);
            case 'fighter': return new Fighter(x, y, lvl);
            case 'bomber': return new Bomber(x, y, lvl);
            case 'stealth': return new StealthJet(x, y, lvl);
            case 'elite': return new EliteEnemy(x, y, lvl);
            default: return new Drone(x, y, lvl);
        }
    }

    update(dt, playerX, playerY, canvasW, canvasH, bulletManager) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.enemies.length < this.maxEnemies) {
            this.spawnTimer = this.spawnInterval;
            this.enemies.push(this.spawnEnemy(canvasW, canvasH));
        }
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, playerX, playerY, canvasW, canvasH, bulletManager);
            if (!e.active || e.isOffscreen(canvasW, canvasH)) {
                this.enemies.splice(i, 1);
            }
        }
    }

    render(ctx) { this.enemies.forEach(e => e.render(ctx)); }
    clear() { this.enemies = []; this.spawnTimer = 0; }
    getCount() { return this.enemies.length; }
}

window.Drone = Drone;
window.Fighter = Fighter;
window.Bomber = Bomber;
window.StealthJet = StealthJet;
window.EliteEnemy = EliteEnemy;
window.SkyEnemyManager = SkyEnemyManager;
