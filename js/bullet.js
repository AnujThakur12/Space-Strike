class PlayerBullet {
    constructor(x, y, angle, type, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle || -Math.PI / 2;
        this.type = type || 'machinegun';
        this.damage = damage || 10;
        this.active = true;
        this.friendly = true;

        const configs = {
            machinegun: { speed: 600, size: 3, color: '#ffff00', lifetime: 1.5, sprite: 'weapon_machinegun' },
            laser: { speed: 800, size: 4, color: '#00ffff', lifetime: 0.8, sprite: 'weapon_laser' },
            rocket: { speed: 350, size: 6, color: '#ff4400', lifetime: 2.0, sprite: 'weapon_rocket' },
            plasma: { speed: 500, size: 8, color: '#aa00ff', lifetime: 1.2, sprite: 'weapon_plasma' },
            tripleshot: { speed: 600, size: 3, color: '#ffaa00', lifetime: 1.5, sprite: 'weapon_tripleshot' }
        };

        const cfg = configs[type] || configs.machinegun;
        this.speed = cfg.speed;
        this.size = cfg.size;
        this.color = cfg.color;
        this.lifetime = cfg.lifetime;
        this.maxLife = cfg.lifetime;
        this.spriteName = cfg.sprite;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        if (type === 'rocket') this.trailTimer = 0;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime -= dt;
        if (this.type === 'rocket') this.trailTimer += dt;
        if (this.lifetime <= 0 || this.x < -200 || this.x > 2000 || this.y < -200 || this.y > 2000) {
            this.active = false;
        }
    }

    render(ctx) {
        ctx.save();
        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage(this.spriteName) : null;

        if (sprite) {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle + Math.PI / 2);
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else if (this.type === 'laser') {
            const alpha = Math.min(1, this.lifetime / this.maxLife);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color;
            ctx.shadowBlur = 15; ctx.shadowColor = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            ctx.shadowBlur = 25; ctx.shadowColor = '#ffffff';
            ctx.lineWidth = 1; ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
        } else if (this.type === 'rocket') {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 12; ctx.shadowColor = this.color;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillRect(-3, -6, 6, 12);
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(-2, 5, 4, 4);
            ctx.restore();

            ctx.save();
            ctx.fillStyle = '#ff8800';
            ctx.shadowBlur = 8; ctx.shadowColor = '#ff8800';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(this.x - this.vx * 0.01, this.y - this.vy * 0.01, 4 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'plasma') {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 20; ctx.shadowColor = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 15; ctx.shadowColor = '#ffffff';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 8; ctx.shadowColor = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.size, y: this.y - this.size, w: this.size * 2, h: this.size * 2 };
    }
}

class EnemyBullet {
    constructor(x, y, vx, vy, size, color, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size || 4;
        this.color = color || '#ff4444';
        this.damage = damage || 10;
        this.active = true;
        this.friendly = false;
        this.lifetime = 3.0;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime -= dt;
        if (this.lifetime <= 0 || this.x < -200 || this.x > 2000 || this.y < -200 || this.y > 2000) {
            this.active = false;
        }
    }

    render(ctx) {
        ctx.save();
        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage('bullet_enemy') : null;
        if (sprite) {
            ctx.translate(this.x, this.y);
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10; ctx.shadowColor = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.size, y: this.y - this.size, w: this.size * 2, h: this.size * 2 };
    }
}

class SkyBulletManager {
    constructor() {
        this.playerBullets = [];
        this.enemyBullets = [];
    }

    firePlayer(x, y, angle, type, damage) {
        if (type === 'tripleshot') {
            const spread = 0.15;
            this.playerBullets.push(new PlayerBullet(x, y, angle - spread, 'machinegun', damage));
            this.playerBullets.push(new PlayerBullet(x, y, angle, 'machinegun', damage));
            this.playerBullets.push(new PlayerBullet(x, y, angle + spread, 'machinegun', damage));
        } else {
            this.playerBullets.push(new PlayerBullet(x, y, angle, type, damage));
        }
    }

    fireEnemy(x, y, vx, vy, size, color, damage) {
        this.enemyBullets.push(new EnemyBullet(x, y, vx, vy, size, color, damage));
    }

    fireEnemyAt(x, y, targetX, targetY, speed, size, color, damage) {
        const angle = Math.atan2(targetY - y, targetX - x);
        const vx = Math.cos(angle) * (speed || 300);
        const vy = Math.sin(angle) * (speed || 300);
        this.fireEnemy(x, y, vx, vy, size, color, damage);
    }

    update(dt) {
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            this.playerBullets[i].update(dt);
            if (!this.playerBullets[i].active) this.playerBullets.splice(i, 1);
        }
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            this.enemyBullets[i].update(dt);
            if (!this.enemyBullets[i].active) this.enemyBullets.splice(i, 1);
        }
    }

    render(ctx) {
        this.playerBullets.forEach(b => b.render(ctx));
        this.enemyBullets.forEach(b => b.render(ctx));
    }

    clear() {
        this.playerBullets = [];
        this.enemyBullets = [];
    }
}

window.PlayerBullet = PlayerBullet;
window.EnemyBullet = EnemyBullet;
window.SkyBulletManager = SkyBulletManager;
