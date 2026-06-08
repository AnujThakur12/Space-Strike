class SkyAudio {
    constructor(assets) {
        this.assets = assets;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.musicGain = null;
        this.musicPlaying = false;
        this.initialized = false;
        this.ctx = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.ctx.destination);
            this.initialized = true;
            if (this.assets) {
                this.assets.init(this.ctx);
            }
        } catch (e) {}
    }

    ensureResumed() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMusicVolume(v) {
        this.musicVolume = v;
        if (this.musicGain) this.musicGain.gain.value = v;
    }

    setSfxVolume(v) { this.sfxVolume = v; }

    _play(name, vol) {
        if (!this.ctx || !this.sfxEnabled) return;
        this.ensureResumed();
        if (this.assets && this.assets.ready) {
            this.assets.playSfx(name, (vol || 0.5) * this.sfxVolume);
        } else {
            this._fallbackPlay(name);
        }
    }

    _fallbackPlay(name) {
        switch (name) {
            case 'shoot':
                this.playTone(800, 0.05, 'square', 0.08);
                this.playTone(400, 0.05, 'square', 0.05);
                break;
            case 'laser':
                this._synthLaser();
                break;
            case 'rocket':
                this._synthRocket();
                break;
            case 'explosion':
                this.playNoise(0.3, 0.15, 1000);
                this.playTone(60, 0.2, 'sine', 0.12);
                break;
            case 'big_explosion':
                this.playNoise(0.6, 0.25, 800);
                this.playTone(40, 0.4, 'sine', 0.2);
                break;
            case 'player_hit':
                this.playTone(200, 0.1, 'square', 0.1);
                this.playTone(100, 0.15, 'square', 0.08);
                break;
            case 'powerup':
                this.playTone(600, 0.08, 'sine', 0.08);
                break;
            case 'boss_warning':
                this.playTone(200, 0.15, 'square', 0.12);
                break;
            case 'menu_click':
                this.playTone(660, 0.05, 'sine', 0.05);
                break;
            case 'menu_hover':
                this.playTone(880, 0.03, 'sine', 0.03);
                break;
            case 'game_over':
                this.playTone(400, 0.3, 'triangle', 0.1);
                break;
            case 'victory':
                this.playTone(523, 0.2, 'sine', 0.08);
                break;
            case 'coin':
                this.playTone(800, 0.08, 'sine', 0.08);
                break;
        }
    }

    playShoot() { this._play('shoot', 0.5); }
    playLaser() { this._play('laser', 0.4); }
    playRocket() { this._play('rocket', 0.5); }
    playExplosion() { this._play('explosion', 0.5); }
    playBigExplosion() { this._play('big_explosion', 0.6); }
    playPlayerHit() { this._play('player_hit', 0.5); }
    playPowerUp() { this._play('powerup', 0.5); }
    playBossWarning() { this._play('boss_warning', 0.5); }
    playMenuClick() { this._play('menu_click', 0.4); }
    playMenuHover() { this._play('menu_hover', 0.3); }
    playGameOver() { this._play('game_over', 0.5); }
    playVictory() { this._play('victory', 0.5); }
    playCoin() { this._play('coin', 0.5); }

    playTone(freq, duration, type, volume) {
        if (!this.ctx || !this.sfxEnabled) return;
        this.ensureResumed();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.value = freq;
        gain.gain.value = (volume || 0.1) * this.sfxVolume;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, volume, filterFreq) {
        if (!this.ctx || !this.sfxEnabled) return;
        this.ensureResumed();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = (volume || 0.1) * this.sfxVolume;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        if (filterFreq) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;
            source.connect(filter);
            filter.connect(gain);
        } else {
            source.connect(gain);
        }
        gain.connect(this.ctx.destination);
        source.start();
    }

    _synthLaser() {
        if (!this.ctx) return;
        this.ensureResumed();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);
        gain.gain.value = 0.06 * this.sfxVolume;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    _synthRocket() {
        if (!this.ctx) return;
        this.ensureResumed();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);
        gain.gain.value = 0.1 * this.sfxVolume;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    startMusic() {
        if (!this.ctx || !this.musicEnabled || this.musicPlaying) return;
        this.ensureResumed();
        this.musicPlaying = true;
        this.musicOscillators = [];
        this._playMusicLoop();
    }

    _playMusicLoop() {
        if (!this.musicPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bass.type = 'triangle';
        bass.frequency.value = 55;
        bassGain.gain.value = 0.08 * this.musicVolume;
        bass.connect(bassGain);
        bassGain.connect(this.musicGain);
        bass.start(now);
        bass.stop(now + 2);
        this.musicOscillators.push(bass);

        const beat = this.ctx.createOscillator();
        const beatGain = this.ctx.createGain();
        beat.type = 'square';
        beat.frequency.value = 80;
        beatGain.gain.value = 0.03 * this.musicVolume;
        beatGain.gain.setValueAtTime(0.03 * this.musicVolume, now);
        beatGain.gain.setValueAtTime(0, now + 0.1);
        beatGain.gain.setValueAtTime(0.03 * this.musicVolume, now + 0.5);
        beatGain.gain.setValueAtTime(0, now + 0.6);
        beat.connect(beatGain);
        beatGain.connect(this.musicGain);
        beat.start(now);
        beat.stop(now + 2);
        this.musicOscillators.push(beat);

        if (this.musicPlaying) {
            this._musicTimer = setTimeout(() => this._playMusicLoop(), 2000);
        }
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this._musicTimer) {
            clearTimeout(this._musicTimer);
            this._musicTimer = null;
        }
        (this.musicOscillators || []).forEach(osc => {
            try { osc.stop(); } catch (e) {}
        });
        this.musicOscillators = [];
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) this.startMusic();
        else this.stopMusic();
        return this.musicEnabled;
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }
}

window.SkyAudio = SkyAudio;
