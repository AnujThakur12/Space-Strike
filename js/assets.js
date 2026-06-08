class SkyAssets {
    constructor() {
        this.images = {};
        this.audioBuffers = {};
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.ready = false;
        this.onProgress = null;
        this.onComplete = null;
        this.audioCtx = null;
    }

    init(audioCtx) {
        this.audioCtx = audioCtx;
    }

    getImage(name) {
        return this.images[name] || null;
    }

    getAudioBuffer(name) {
        return this.audioBuffers[name] || null;
    }

    defineAssets() {
        const imgBase = 'assets/images';
        const audioBase = 'assets/audio';

        this.imageDefs = {
            // Players
            player_falcon: `${imgBase}/player_falcon.png`,
            player_eagle: `${imgBase}/player_eagle.png`,
            player_raptor: `${imgBase}/player_raptor.png`,
            player_phantom: `${imgBase}/player_phantom.png`,
            player_stealthx: `${imgBase}/player_stealth-x.png`,
            player_damaged: `${imgBase}/playerDamaged.png`,
            player_left: `${imgBase}/playerLeft.png`,
            player_right: `${imgBase}/playerRight.png`,
            // Enemies
            enemy_drone: `${imgBase}/enemy_drone.png`,
            enemy_fighter: `${imgBase}/enemy_fighter.png`,
            enemy_bomber: `${imgBase}/enemy_bomber.png`,
            enemy_stealth: `${imgBase}/enemy_stealth.png`,
            enemy_elite: `${imgBase}/enemy_elite.png`,
            // Bosses
            boss_missile_commander: `${imgBase}/boss_missile_commander.png`,
            boss_fortress_bomber: `${imgBase}/boss_fortress_bomber.png`,
            boss_stealth_titan: `${imgBase}/boss_stealth_titan.png`,
            boss_air_carrier: `${imgBase}/boss_air_carrier.png`,
            // Powerups
            powerup_health: `${imgBase}/powerup_health.png`,
            powerup_shield: `${imgBase}/powerup_shield.png`,
            powerup_double_damage: `${imgBase}/powerup_double_damage.png`,
            powerup_rapid_fire: `${imgBase}/powerup_rapid_fire.png`,
            powerup_coin_magnet: `${imgBase}/powerup_coin_magnet.png`,
            powerup_extra_life: `${imgBase}/powerup_extra_life.png`,
            powerup_coins: `${imgBase}/powerup_coins.png`,
            powerup_weapon_laser: `${imgBase}/powerup_weapon_laser.png`,
            powerup_weapon_rocket: `${imgBase}/powerup_weapon_rocket.png`,
            powerup_weapon_plasma: `${imgBase}/powerup_weapon_plasma.png`,
            powerup_weapon_triple: `${imgBase}/powerup_weapon_triple.png`,
            // Weapons
            weapon_machinegun: `${imgBase}/weapon_machinegun.png`,
            weapon_laser: `${imgBase}/weapon_laser.png`,
            weapon_rocket: `${imgBase}/weapon_rocket.png`,
            weapon_plasma: `${imgBase}/weapon_plasma.png`,
            weapon_tripleshot: `${imgBase}/weapon_tripleshot.png`,
            bullet_enemy: `${imgBase}/bullet_enemy.png`,
            // UI
            ui_shield: `${imgBase}/ui_shield.png`,
            ui_life: `${imgBase}/ui_life.png`,
            // Background
            bg_stars: `${imgBase}/Background/starBackground.png`,
        };

        this.audioDefs = {
            shoot: `${audioBase}/weapons/sfx_weapon_singleshot1.ogg`,
            laser: `${audioBase}/weapons/sfx_wpn_laser1.ogg`,
            rocket: `${audioBase}/weapons/sfx_wpn_cannon1.ogg`,
            explosion: `${audioBase}/explosions/sfx_exp_short_hard1.ogg`,
            big_explosion: `${audioBase}/explosions/sfx_exp_medium1.ogg`,
            player_hit: `${audioBase}/weapons/sfx_sounds_impact1.ogg`,
            powerup: `${audioBase}/powerups/sfx_coin_cluster1.ogg`,
            boss_warning: `${audioBase}/misc/sfx_alarm_loop1.ogg`,
            menu_click: `${audioBase}/menu/sfx_menu_select1.ogg`,
            menu_hover: `${audioBase}/menu/sfx_menu_move1.ogg`,
            game_over: `${audioBase}/misc/sfx_sounds_negative1.ogg`,
            victory: `${audioBase}/misc/sfx_sounds_fanfare1.ogg`,
            coin: `${audioBase}/powerups/sfx_coin_cluster1.ogg`,
        };
    }

    startLoading() {
        this.defineAssets();
        this.totalAssets = Object.keys(this.imageDefs).length + Object.keys(this.audioDefs).length;
        this.loadedAssets = 0;

        for (const [name, path] of Object.entries(this.imageDefs)) {
            this._loadImage(name, path);
        }
        for (const [name, path] of Object.entries(this.audioDefs)) {
            this._loadAudio(name, path);
        }
    }

    _loadImage(name, path) {
        const img = new Image();
        img.onload = () => {
            this.images[name] = img;
            this._onAssetLoaded();
        };
        img.onerror = () => {
            this._onAssetLoaded();
        };
        img.src = path;
    }

    _loadAudio(name, path) {
        if (!this.audioCtx) {
            this._onAssetLoaded();
            return;
        }
        fetch(path)
            .then(resp => {
                if (!resp.ok) throw new Error('fetch failed');
                return resp.arrayBuffer();
            })
            .then(buf => this.audioCtx.decodeAudioData(buf))
            .then(decoded => {
                this.audioBuffers[name] = decoded;
                this._onAssetLoaded();
            })
            .catch(() => {
                this._onAssetLoaded();
            });
    }

    _onAssetLoaded() {
        this.loadedAssets++;
        if (this.onProgress) {
            this.onProgress(this.loadedAssets, this.totalAssets);
        }
        if (this.loadedAssets >= this.totalAssets) {
            this.ready = true;
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    getProgress() {
        if (this.totalAssets === 0) return 1;
        return this.loadedAssets / this.totalAssets;
    }

    playSfx(name, volume) {
        const buf = this.audioBuffers[name];
        if (!buf || !this.audioCtx) return;
        const source = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        source.buffer = buf;
        gain.gain.value = volume || 0.5;
        source.connect(gain);
        gain.connect(this.audioCtx.destination);
        source.start(0);
    }
}

window.SkyAssets = SkyAssets;
