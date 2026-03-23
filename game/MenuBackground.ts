import Phaser from 'phaser';
import { ENEMY_SPRITE_REGISTRY } from './EnemySpriteRegistry';

const WORLD = 4000;

interface Wanderer {
  sprite: any;
  vx: number;
  vy: number;
  timer: number;
  changeAt: number;
}

export default class MenuBackground extends Phaser.Scene {
  private wizard: any;
  private wanderers: Wanderer[] = [];
  private particles: any[] = [];
  private _lastParticle = 0;

  constructor() {
    super({ key: 'MenuBackground' });
  }

  preload() {
    this.load.image('floor_tile', 'assets/floor_tile.jpg');
    this.load.spritesheet('wizard', 'assets/wizard_sheet_full.png', { frameWidth: 200, frameHeight: 280 });

    // Load a couple enemy types for ambiance
    const toLoad = ['MELEE_GRUNT', 'RANGED_ARCHER', 'ELITE_DEMON'];
    const seen = new Set<string>();
    toLoad.forEach(type => {
      const e = ENEMY_SPRITE_REGISTRY[type];
      if (e && !seen.has(e.textureKey)) {
        seen.add(e.textureKey);
        this.load.spritesheet(e.textureKey, e.assetPath, { frameWidth: e.frameWidth, frameHeight: e.frameHeight });
      }
    });
  }

  create() {
    const cx = WORLD / 2;
    const cy = WORLD / 2;

    // ── Floor tile ────────────────────────────────────────────────────────
    if (this.textures.exists('floor_tile')) {
      const tile = this.add.tileSprite(cx, cy, WORLD, WORLD, 'floor_tile').setDepth(-1);
      tile.setTileScale(0.3, 0.3);
    } else {
      this.add.rectangle(cx, cy, WORLD, WORLD, 0x0d0d12).setDepth(-1);
    }

    // ── Wizard animations ─────────────────────────────────────────────────
    if (this.textures.exists('wizard') && this.textures.get('wizard').frameTotal >= 12) {
      this.textures.get('wizard').setFilter(Phaser.Textures.FilterMode.NEAREST);
      if (!this.anims.exists('mb_wizard_idle')) {
        this.anims.create({ key: 'mb_wizard_idle', frames: this.anims.generateFrameNumbers('wizard', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'mb_wizard_run',  frames: this.anims.generateFrameNumbers('wizard', { start: 4, end: 7 }), frameRate: 10, repeat: -1 });
      }
    }

    // ── Enemy animations ──────────────────────────────────────────────────
    const toAnim = ['MELEE_GRUNT', 'RANGED_ARCHER', 'ELITE_DEMON'];
    toAnim.forEach(type => {
      const e = ENEMY_SPRITE_REGISTRY[type];
      if (!e || !this.textures.exists(e.textureKey)) return;
      this.textures.get(e.textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
      const rk = `mb_${e.textureKey}_run`;
      if (!this.anims.exists(rk)) {
        this.anims.create({ key: rk, frames: this.anims.generateFrameNumbers(e.textureKey, { start: e.anims.run.start, end: e.anims.run.end }), frameRate: e.anims.run.frameRate, repeat: -1 });
      }
    });

    // ── Wizard sprite ─────────────────────────────────────────────────────
    const sprKey = this.textures.exists('wizard') && this.textures.get('wizard').frameTotal >= 12 ? 'wizard' : null;
    if (sprKey) {
      this.wizard = this.add.sprite(cx, cy, sprKey).setScale(0.4).setDepth(100);
      this.wizard.play('mb_wizard_idle');
    }

    // ── Enemy wanderers ───────────────────────────────────────────────────
    const enemyTypes = ['MELEE_GRUNT', 'MELEE_GRUNT', 'RANGED_ARCHER', 'ELITE_DEMON', 'MELEE_GRUNT', 'RANGED_ARCHER'];
    enemyTypes.forEach((type, i) => {
      const e = ENEMY_SPRITE_REGISTRY[type];
      if (!e || !this.textures.exists(e.textureKey)) return;
      const angle = (i / enemyTypes.length) * Math.PI * 2;
      const dist  = 250 + Math.random() * 350;
      const wx    = cx + Math.cos(angle) * dist;
      const wy    = cy + Math.sin(angle) * dist;
      const spr   = this.add.sprite(wx, wy, e.textureKey).setScale(e.scale).setDepth(10).setOrigin(0.5, 0.85);
      const rk    = `mb_${e.textureKey}_run`;
      if (this.anims.exists(rk)) spr.play(rk, true);
      this.wanderers.push({ sprite: spr, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, timer: 0, changeAt: 2000 + Math.random() * 3000 });
    });

    // ── Camera follows wizard slowly ──────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD, WORLD);
    this.cameras.main.setRoundPixels(true);
    if (this.wizard) {
      this.cameras.main.startFollow(this.wizard, true, 0.03, 0.03);
    } else {
      this.cameras.main.centerOn(cx, cy);
    }

    // ── Slow auto-move for wizard ─────────────────────────────────────────
    if (this.wizard) {
      this.wizard._vx = 40;
      this.wizard._vy = 20;
      this.wizard._changeAt = 3000;
      this.wizard._timer = 0;
    }
  }

  update(time: number, delta: number) {
    // ── Move wizard ───────────────────────────────────────────────────────
    if (this.wizard) {
      this.wizard._timer += delta;
      if (this.wizard._timer >= this.wizard._changeAt) {
        this.wizard._timer = 0;
        this.wizard._changeAt = 2000 + Math.random() * 3000;
        const angle = Math.random() * Math.PI * 2;
        const speed = 35 + Math.random() * 30;
        this.wizard._vx = Math.cos(angle) * speed;
        this.wizard._vy = Math.sin(angle) * speed;
      }
      this.wizard.x = Phaser.Math.Clamp(this.wizard.x + this.wizard._vx * (delta / 1000), 200, WORLD - 200);
      this.wizard.y = Phaser.Math.Clamp(this.wizard.y + this.wizard._vy * (delta / 1000), 200, WORLD - 200);
      this.wizard.setFlipX(this.wizard._vx < 0);
      const isMoving = Math.abs(this.wizard._vx) > 5 || Math.abs(this.wizard._vy) > 5;
      const cur = this.wizard.anims?.currentAnim?.key;
      if (isMoving && cur !== 'mb_wizard_run') this.wizard.play('mb_wizard_run', true);
      else if (!isMoving && cur !== 'mb_wizard_idle') this.wizard.play('mb_wizard_idle', true);
    }

    // ── Move wanderers ────────────────────────────────────────────────────
    this.wanderers.forEach(w => {
      if (!w.sprite?.active) return;
      w.timer += delta;
      if (w.timer >= w.changeAt) {
        w.timer = 0;
        w.changeAt = 2000 + Math.random() * 4000;
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 50;
        w.vx = Math.cos(angle) * speed;
        w.vy = Math.sin(angle) * speed;
      }
      w.sprite.x = Phaser.Math.Clamp(w.sprite.x + w.vx * (delta / 1000), 100, WORLD - 100);
      w.sprite.y = Phaser.Math.Clamp(w.sprite.y + w.vy * (delta / 1000), 100, WORLD - 100);
      w.sprite.setFlipX(w.vx < 0);
    });

    // ── Ambient purple particles ──────────────────────────────────────────
    if (this.wizard && time - this._lastParticle > 300) {
      this._lastParticle = time;
      const p = this.add.ellipse(
        this.wizard.x + (Math.random() - 0.5) * 40,
        this.wizard.y + (Math.random() - 0.5) * 40,
        6, 6, 0xa855f7, 0.7
      ).setDepth(90);
      this.tweens.add({ targets: p, y: p.y - 30 - Math.random() * 20, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 800 + Math.random() * 400, onComplete: () => p.destroy() });
    }
  }
}
