class SkyEffects {
    constructor() {
        this.particles = [];
        this.trails = [];
        this.flashes = [];
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.gravity || 0) * dt;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.trails.length - 1; i >= 0; i--) {
            const t = this.trails[i];
            t.life -= dt;
            t.alpha = Math.max(0, t.life / t.maxLife);
            if (t.life <= 0) {
                this.trails.splice(i, 1);
            }
        }

        for (let i = this.flashes.length - 1; i >= 0; i--) {
            this.flashes[i].life -= dt;
            if (this.flashes[i].life <= 0) {
                this.flashes.splice(i, 1);
            }
        }

        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
        }
    }

    emitExplosion(x, y, count, color, size, big) {
        const colors = color || ['#ff4400', '#ff8800', '#ffcc00', '#ffffff'];
        const cArr = Array.isArray(colors) ? colors : [colors];
        for (let i = 0; i < (count || 20); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (50 + Math.random() * 150) * (big ? 1.5 : 1);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.4 + Math.random() * 0.4,
                maxLife: 0.8,
                alpha: 1,
                size: (size || 3) * (0.5 + Math.random()) * (big ? 1.5 : 1),
                color: cArr[Math.floor(Math.random() * cArr.length)],
                gravity: big ? 30 : 0
            });
        }
        if (big) {
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 20 + Math.random() * 60;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.8 + Math.random() * 0.6,
                    maxLife: 1.4,
                    alpha: 1,
                    size: 6 + Math.random() * 8,
                    color: '#888888',
                    gravity: 20
                });
            }
        }
    }

    emitEngineTrail(x, y, dir, color) {
        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 4,
                y: y + (dir || -1) * 20,
                vx: (Math.random() - 0.5) * 10,
                vy: (dir || -1) * (80 + Math.random() * 60),
                life: 0.2 + Math.random() * 0.2,
                maxLife: 0.4,
                alpha: 1,
                size: 2 + Math.random() * 2,
                color: color || '#ff6600',
                gravity: 0
            });
        }
    }

    emitBulletTrail(x, y, color) {
        this.trails.push({
            x, y,
            life: 0.15,
            maxLife: 0.15,
            alpha: 1,
            color: color || '#ffff00'
        });
    }

    addScreenFlash(x, y, color, duration) {
        this.flashes.push({
            x, y,
            life: duration || 0.15,
            maxLife: duration || 0.15,
            color: color || '#ffffff'
        });
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = duration;
    }

    getShakeOffset() {
        if (this.shakeTimer <= 0) return { x: 0, y: 0 };
        const factor = this.shakeTimer / this.shakeDuration;
        const intensity = this.shakeIntensity * factor;
        return {
            x: (Math.random() - 0.5) * intensity * 2,
            y: (Math.random() - 0.5) * intensity * 2
        };
    }

    render(ctx) {
        const shake = this.getShakeOffset();

        for (const flash of this.flashes) {
            const alpha = flash.life / flash.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = flash.color;
            const size = 100 * (1 - alpha) + 20;
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        for (const t of this.trails) {
            ctx.save();
            ctx.globalAlpha = t.alpha * 0.5;
            ctx.fillStyle = t.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = t.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x + shake.x, p.y + shake.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    clear() {
        this.particles = [];
        this.trails = [];
        this.flashes = [];
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
    }
}

window.SkyEffects = SkyEffects;
