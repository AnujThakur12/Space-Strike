class SkyPowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.size = 15;
        this.speed = 60;
        this.elapsed = 0;
        this.floatOffset = Math.random() * Math.PI * 2;
        const spriteMap = {
            health: 'powerup_health',
            shield: 'powerup_shield',
            doubleDamage: 'powerup_double_damage',
            rapidFire: 'powerup_rapid_fire',
            coinMagnet: 'powerup_coin_magnet',
            extraLife: 'powerup_extra_life',
            weaponLaser: 'powerup_weapon_laser',
            weaponRocket: 'powerup_weapon_rocket',
            weaponPlasma: 'powerup_weapon_plasma',
            weaponTriple: 'powerup_weapon_triple',
            coins: 'powerup_coins'
        };
        this.spriteName = spriteMap[type] || `powerup_${type}`;

        const configs = {
            health: { color: '#00ff00', icon: '+', label: 'Health Pack' },
            shield: { color: '#00ffff', icon: 'S', label: 'Shield' },
            doubleDamage: { color: '#ff4400', icon: 'D', label: '2x Damage' },
            rapidFire: { color: '#ffff00', icon: 'R', label: 'Rapid Fire' },
            coinMagnet: { color: '#ffaa00', icon: 'M', label: 'Coin Magnet' },
            extraLife: { color: '#ff00ff', icon: 'L', label: 'Extra Life' },
            weaponLaser: { color: '#00ffff', icon: 'L', label: 'Laser' },
            weaponRocket: { color: '#ff4400', icon: 'R', label: 'Rockets' },
            weaponPlasma: { color: '#aa00ff', icon: 'P', label: 'Plasma' },
            weaponTriple: { color: '#ffaa00', icon: 'T', label: 'Triple Shot' },
            coins: { color: '#ffd700', icon: '$', label: 'Coins' }
        };

        const cfg = configs[type] || configs.health;
        this.color = cfg.color;
        this.icon = cfg.icon;
        this.label = cfg.label;
    }

    update(dt, canvasH) {
        this.y += this.speed * dt;
        this.elapsed += dt;
        if (this.y > (canvasH || 1300) + 100) this.active = false;
    }

    render(ctx) {
        ctx.save();
        const bob = Math.sin(this.elapsed * 3 + this.floatOffset) * 3;
        const pulse = Math.sin(this.elapsed * 4) * 0.1 + 1;

        ctx.translate(this.x, this.y + bob);

        const assets = window.gameAssets;
        let sprite = assets ? assets.getImage(this.spriteName) : null;

        if (sprite) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.globalAlpha = 0.3;
            const s = this.size * 1.3 * pulse;
            ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
            ctx.drawImage(sprite, -this.size, -this.size, this.size * 2, this.size * 2);
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 20; ctx.shadowColor = this.color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath(); ctx.arc(0, 0, this.size * 1.3 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = this.color;
            ctx.shadowBlur = 12; ctx.shadowColor = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 5; ctx.shadowColor = '#000000';
            ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(this.icon, 0, 0);
        }

        ctx.restore();
    }

    apply(player) {
        switch (this.type) {
            case 'health': player.heal(40); break;
            case 'shield': player.addShield(30); break;
            case 'doubleDamage': player.doubleDamageTimer = 8; break;
            case 'rapidFire': player.rapidFireTimer = 6; break;
            case 'coinMagnet': player.coinMagnetTimer = 10; break;
            case 'extraLife': player.health = player.maxHealth; break;
            case 'weaponLaser': player.switchWeapon('laser'); break;
            case 'weaponRocket': player.switchWeapon('rocket'); break;
            case 'weaponPlasma': player.switchWeapon('plasma'); break;
            case 'weaponTriple': player.switchWeapon('tripleshot'); break;
            case 'coins': player.addCoins(25); break;
        }
    }

    getBounds() {
        return { x: this.x - this.size, y: this.y - this.size, w: this.size * 2, h: this.size * 2 };
    }
}

class SkyPowerUpManager {
    constructor() {
        this.powerups = [];
        this.dropChance = 0.15;
    }

    spawnAt(x, y, forcedType) {
        const types = forcedType ? [forcedType] : [
            'health', 'shield', 'doubleDamage', 'rapidFire',
            'coinMagnet', 'coins', 'weaponLaser', 'weaponRocket',
            'weaponPlasma', 'weaponTriple'
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerups.push(new SkyPowerUp(x, y, type));
    }

    checkDrop(x, y) {
        if (Math.random() < this.dropChance) this.spawnAt(x, y);
    }

    update(dt, canvasH) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].update(dt, canvasH);
            if (!this.powerups[i].active) this.powerups.splice(i, 1);
        }
    }

    render(ctx) { this.powerups.forEach(p => p.render(ctx)); }
    clear() { this.powerups = []; }
    getCount() { return this.powerups.length; }
}

window.SkyPowerUp = SkyPowerUp;
window.SkyPowerUpManager = SkyPowerUpManager;
