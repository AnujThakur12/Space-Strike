class SkyControls {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.touches = {};
        this.joystick = { active: false, x: 0, y: 0, dx: 0, dy: 0 };
        this.firePressed = false;
        this.pausePressed = false;
        this.exitPressed = false;
        this.joystickTouchId = null;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickRadius = 65;
        this.joystickBaseRadius = 65;
        this.joystickBaseRadiusRef = 65;
        this.mobile = false;
        this.autoFire = false;
        this.logicalW = canvas.width;
        this.logicalH = canvas.height;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);

        this._addListeners();
        this._detectMobile();
    }

    _detectMobile() {
        this.mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (this.mobile) this.autoFire = true;
    }

    _addListeners() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
        this.canvas.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
        this.canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.firePressed = true; });
        this.canvas.addEventListener('mouseup', (e) => { if (e.button === 0) this.firePressed = false; });
        this.canvas.addEventListener('mouseleave', (e) => { this.firePressed = false; });
        this._mouseFireGuard = false;
    }

    removeListeners() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        this.canvas.removeEventListener('touchmove', this._onTouchMove);
        this.canvas.removeEventListener('touchend', this._onTouchEnd);
        this.canvas.removeEventListener('touchcancel', this._onTouchEnd);
    }

    _onKeyDown(e) {
        this.keys[e.key] = true;
        if (e.key === 'p' || e.key === 'P') {
            this.pausePressed = true;
        }
        if (e.key === ' ') {
            e.preventDefault();
        }
    }

    _onKeyUp(e) {
        this.keys[e.key] = false;
    }

    _onTouchStart(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.logicalW / rect.width;
        const scaleY = this.logicalH / rect.height;

        for (const touch of e.changedTouches) {
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;

            this.joystickTouchId = touch.identifier;
            this.joystick.active = true;
            this.joystickCenter.x = x;
            this.joystickCenter.y = y;
            this.joystick.x = x;
            this.joystick.y = y;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
            this.joystickRadius = this.joystickBaseRadiusRef * (this.logicalW / 1600);

            if (x < this.logicalW * 0.06 && y < this.logicalH * 0.07) {
                this.exitPressed = true;
            }
            if (x > this.logicalW * 0.94 && y < this.logicalH * 0.07) {
                this.pausePressed = true;
            }
        }
    }

    _onTouchMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.logicalW / rect.width;
        const scaleY = this.logicalH / rect.height;

        for (const touch of e.changedTouches) {
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;

            if (touch.identifier === this.joystickTouchId) {
                this.joystick.x = x;
                this.joystick.y = y;
                const dx = x - this.joystickCenter.x;
                const dy = y - this.joystickCenter.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = this.joystickRadius;
                if (dist > maxDist) {
                    this.joystick.x = this.joystickCenter.x + (dx / dist) * maxDist;
                    this.joystick.y = this.joystickCenter.y + (dy / dist) * maxDist;
                }
                this.joystick.dx = (this.joystick.x - this.joystickCenter.x) / maxDist;
                this.joystick.dy = (this.joystick.y - this.joystickCenter.y) / maxDist;
            }
        }
    }

    _onTouchEnd(e) {
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.joystickTouchId) {
                this.joystickTouchId = null;
                this.joystick.active = false;
                this.joystick.dx = 0;
                this.joystick.dy = 0;
            }
        }
    }

    isDown(key) {
        return !!this.keys[key];
    }

    getMovement() {
        if (this.joystick.active) {
            const deadzone = 0.15;
            let dx = Math.abs(this.joystick.dx) > deadzone ? this.joystick.dx : 0;
            let dy = Math.abs(this.joystick.dy) > deadzone ? this.joystick.dy : 0;
            return { dx, dy };
        }

        let dx = 0, dy = 0;
        if (this.isDown('ArrowLeft') || this.isDown('a') || this.isDown('A')) dx = -1;
        if (this.isDown('ArrowRight') || this.isDown('d') || this.isDown('D')) dx = 1;
        if (this.isDown('ArrowUp') || this.isDown('w') || this.isDown('W')) dy = -1;
        if (this.isDown('ArrowDown') || this.isDown('s') || this.isDown('S')) dy = 1;
        return { dx, dy };
    }

    isFiring() {
        return this.isDown(' ') || this.firePressed || this.autoFire;
    }

    resetFire() { this.firePressed = false; }

    isPausePressed() {
        if (this.pausePressed) {
            this.pausePressed = false;
            return true;
        }
        return false;
    }

    isExitPressed() {
        if (this.exitPressed) {
            this.exitPressed = false;
            return true;
        }
        return false;
    }

    getJoystickData() {
        return {
            active: this.joystick.active,
            centerX: this.joystickCenter.x,
            centerY: this.joystickCenter.y,
            knobX: this.joystick.x,
            knobY: this.joystick.y,
            radius: this.joystickRadius,
            baseRadius: this.joystickBaseRadius
        };
    }

    isMobile() { return this.mobile; }
}

window.SkyControls = SkyControls;
