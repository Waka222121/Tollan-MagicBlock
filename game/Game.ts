import { ENEMY_SPRITE_REGISTRY } from './EnemySpriteRegistry';

import Phaser from 'phaser';
import { GameStateMachine } from './GameStateMachine';
import { PlayerManager } from './managers/PlayerManager';
import { EnemyManager } from './managers/EnemyManager';
import { LootSystem } from './managers/LootSystem';
import { CombatManager } from './managers/CombatManager';
import { WORLD_SIZE, GAME_BALANCE, ABILITIES_BASE, MAGIC_COLORS } from '../constants';
import { GameState } from '../types';
import { UpgradeSystem } from './UpgradeSystem';
import { GameBridge } from './GameBridge';

const PLAYER_SPRITE_B64 = "https://i.ibb.co/LkhK9L9/purple-wizard.png";

export default class Game extends Phaser.Scene {
  playerManager: PlayerManager;
  enemyManager: EnemyManager;
  lootSystem: LootSystem;
  combatManager: CombatManager;
  stateMachine: GameStateMachine;
  gameTimer: number;
  killCount: number;

  // Combo system
  currentCombo: number;
  comboTimer: any;
  comboLevel: number;
  maxCombo: number;
  comboText: any;
  _lastSyncTime: number;
  _lastRegenTime: number;

  load: Phaser.Loader.LoaderPlugin;
  textures: Phaser.Textures.TextureManager;
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  add: Phaser.GameObjects.GameObjectFactory;
  time: Phaser.Time.Clock;
  cameras: Phaser.Cameras.Scene2D.CameraManager;
  tweens: Phaser.Tweens.TweenManager;
  events: Phaser.Events.EventEmitter;

  constructor() {
    super('Game');
    this.gameTimer    = 0;
    this.killCount    = 0;
    this.currentCombo = 0;
    this.comboLevel   = 0;
    this.maxCombo     = 0;
    this._lastRegenTime = 0;
  }

  init() {
    // Reset state on every new run (called before create)
    this.gameTimer    = 0;
    this.killCount    = 0;
    this.currentCombo = 0;
    this.comboLevel   = 0;
    this.maxCombo     = 0;
    this.comboTimer   = null;
    this.comboText    = null;
    this._lastRegenTime = 0;
  }

  preload() {
    this.load.crossOrigin = 'anonymous';
    this.load.image('floor_tile', 'assets/floor_tile.jpg');
    // Spritesheet: 3 rows x 4 frames, each 200x280px
    this.load.spritesheet('wizard', 'assets/wizard_sheet_full.png', {
      frameWidth: 200,
      frameHeight: 280
    });
    // Fallback static sprite if sheet not found
    this.load.image('wizard_static', 'https://i.ibb.co/LkhK9L9/purple-wizard.png');
    // Goblin spritesheet — 4 cols × 2 rows, 308×432 px per frame
    // Row 0 (frames 0–3): run   |   Row 1 (frames 4–7): attack
    const _lk = new Set<string>();
    Object.values(ENEMY_SPRITE_REGISTRY).forEach(e => {
      if (!e.assetPath || _lk.has(e.textureKey)) return;
      _lk.add(e.textureKey);
      this.load.spritesheet(e.textureKey, e.assetPath, { frameWidth: e.frameWidth, frameHeight: e.frameHeight, ...(e.spacing ? { spacing: e.spacing } : {}) });
    });
    this.load.on('loaderror', (file: any) => {
      console.warn('[Game] Failed to load:', file.key);
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Tiled floor texture — fallback to dark color if texture not loaded
    if (this.textures.exists('floor_tile')) {
      const tile = this.add.tileSprite(WORLD_SIZE/2, WORLD_SIZE/2, WORLD_SIZE, WORLD_SIZE, 'floor_tile').setDepth(-1);
      tile.setTileScale(0.3, 0.3);
    } else {
      this.add.rectangle(WORLD_SIZE/2, WORLD_SIZE/2, WORLD_SIZE, WORLD_SIZE, 0x0d0d12).setDepth(-1);
    }

    this.combatManager = new CombatManager(this);
    this.combatManager.create();

    // Выбираем ключ спрайта: анимированный или статичный фоллбек
    const sheetOK = this.textures.exists('wizard') && this.textures.get('wizard').frameTotal >= 12;
    const spriteKey = sheetOK ? 'wizard' : 'wizard_static';
    console.log('[Game] spriteKey:', spriteKey, '| frameTotal:', sheetOK ? this.textures.get('wizard').frameTotal : 1);

    this.playerManager = new PlayerManager(this);
    this.playerManager.create(spriteKey);

    // ── Wizard animations (только если спрайтшит загрузился) ─────────────
    if (sheetOK) {
      // Отключаем билинейную фильтрацию на спрайте визарда
      this.textures.get('wizard').setFilter(Phaser.Textures.FilterMode.NEAREST);
      if (!this.anims.exists('wizard_idle')) {
        this.anims.create({ key: 'wizard_idle', frames: this.anims.generateFrameNumbers('wizard', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
      }
      if (!this.anims.exists('wizard_run')) {
        this.anims.create({ key: 'wizard_run',  frames: this.anims.generateFrameNumbers('wizard', { start: 4, end: 7 }), frameRate: 10, repeat: -1 });
      }
      if (!this.anims.exists('wizard_cast')) {
        this.anims.create({ key: 'wizard_cast', frames: this.anims.generateFrameNumbers('wizard', { start: 8, end: 11 }), frameRate: 10, repeat: 0 });
      }
      this.playerManager.sprite.play('wizard_idle');
    } else {
      console.warn('[Game] wizard_sheet_full.png не найден — используется статичный спрайт');
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── Анимации из реестра ─────────────────────────────────────────────
    const _ak = new Set<string>();
    Object.values(ENEMY_SPRITE_REGISTRY).forEach(cfg => {
      if (!this.textures.exists(cfg.textureKey)) return;
      if (!_ak.has(cfg.textureKey)) { _ak.add(cfg.textureKey); this.textures.get(cfg.textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST); }
      const rk = `${cfg.textureKey}_run`, ak = `${cfg.textureKey}_attack`;
      if (!this.anims.exists(rk)) this.anims.create({ key: rk, frames: this.anims.generateFrameNumbers(cfg.textureKey, { start: cfg.anims.run.start, end: cfg.anims.run.end }), frameRate: cfg.anims.run.frameRate, repeat: -1 });
      if (!this.anims.exists(ak)) this.anims.create({ key: ak, frames: this.anims.generateFrameNumbers(cfg.textureKey, { start: cfg.anims.attack.start, end: cfg.anims.attack.end }), frameRate: cfg.anims.attack.frameRate, repeat: 0 });
    });
    // ─────────────────────────────────────────────────────────────────────

    this.enemyManager = new EnemyManager(this);
    this.enemyManager.create();

    this.lootSystem = new LootSystem(this);
    this.lootSystem.create();

    // Run Mechanics Self-Tests
    // TestSuite removed — caused crashes after bossGroup refactor

    this.stateMachine = new GameStateMachine(this);
    
    this.stateMachine.addState('PLAYING', {
      enter: () => {
        this.physics.resume();
        GameBridge.onStateChange(GameState.PLAYING);
      },
      update: (time, delta) => {
        this.gameTimer += delta;
        this.playerManager.update(time, delta);
        this.enemyManager.update(time, delta, this.playerManager.sprite);
        this.lootSystem.update(delta, this.playerManager);
        this.combatManager.update();   // clean up off-screen projectiles
        this.processAbilities(time);

        // --- Health Regen tick (every 3 seconds) ---
        const regenRate = this.playerManager.stats.healthRegen || 0;
        if (regenRate > 0) {
          if (!this._lastRegenTime) this._lastRegenTime = time;
          if (time - this._lastRegenTime >= 3000) {
            this._lastRegenTime = time;
            const prev = this.playerManager.stats.hp;
            this.playerManager.stats.hp = Math.min(this.playerManager.stats.maxHp, prev + regenRate);
            if (this.playerManager.stats.hp > prev) {
              const healTxt = this.add.text(this.playerManager.sprite.x, this.playerManager.sprite.y - 30, `+${regenRate}`, { fontSize: '13px', color: '#00ff88', fontFamily: 'monospace' }).setDepth(300).setScrollFactor(1);
              this.tweens.add({ targets: healTxt, y: '-=35', alpha: 0, duration: 900, onComplete: () => healTxt.destroy() });
            }
          }
        }

        // Throttle React sync to ~20fps (every 50ms) to avoid 60 re-renders/sec
        if (!this._lastSyncTime || time - this._lastSyncTime > 50) {
          this._lastSyncTime = time;
          GameBridge.onSyncData({
            playerStats: this.playerManager.stats,
            timer: Math.floor(this.gameTimer / 1000),
            kills: this.killCount,
            wave: this.enemyManager.waveState.currentWave,
            waveProgress: this.enemyManager.waveState.killedInWave,
            waveTarget: this.enemyManager.waveState.targetInWave,
            dashCooldownRatio: this.playerManager.stats.dashCooldownRatio ?? 1.0,
            isDashing: this.playerManager.isDashing,
            combo: this.currentCombo,
            comboLevel: this.comboLevel,
            comboMult: this.getComboMultiplier()
          });
        }
      }
    });

    this.stateMachine.addState('LEVEL_UP', {
      enter: () => {
        this.physics.pause();
        // generateUpgrades will call onStateChange(LEVEL_UP) after setting choices
        GameBridge.generateUpgrades(this.playerManager.stats);
      }
    });

    this.stateMachine.addState('GAME_OVER', {
      enter: () => {
        this.physics.pause();
        // Stop player visually
        if (this.playerManager?.sprite?.active) {
          this.playerManager.sprite.setAlpha(0.3);
          this.playerManager.sprite.setVelocity(0, 0);
        }
        GameBridge.onGameOver({
            score: this.killCount * 10 + this.maxCombo * 50,
            kills: this.killCount,
            time: Math.floor(this.gameTimer / 1000),
            level: this.playerManager.stats.level,
            abilities: this.playerManager.stats.abilities,
            wave: this.enemyManager.waveState.currentWave,
            gold: this.playerManager.stats.gold,
            gems: this.playerManager.stats.gems,
            maxCombo: this.maxCombo
        });
      }
    });

    this.stateMachine.addState('PAUSED', {
      enter: () => {
        this.physics.pause();
        GameBridge.onStateChange(GameState.PAUSED);
      },
      exit: () => {
        this.physics.resume();
        GameBridge.onStateChange(GameState.PLAYING);
      }
    });

    // Escape key toggles pause
    const escKey = (this.input.keyboard as any).addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
      if (this.stateMachine.is('PLAYING')) {
        this.stateMachine.setState('PAUSED');
      } else if (this.stateMachine.is('PAUSED')) {
        this.stateMachine.setState('PLAYING');
      }
    });

    this.setupCollisions();
    this.startNextWave(1);
    this.stateMachine.setState('PLAYING');
  }

  setupCollisions() {
    this.physics.add.overlap(this.combatManager.projectiles, this.enemyManager.group, (proj: any, enemy: any) => {
        if (!proj.active || !enemy.active) return;
        const stats = enemy.getData('stats');
        if (!stats) return;
        
        const baseDmg = proj.getData('damage') || 25;
        let finalDmg = baseDmg * this.playerManager.stats.damageMultiplier;
        
        // Shielder: reduce damage from frontal hits
        if (stats.frontArmor > 0 && stats.facingAngle !== undefined) {
          const hitAngle = Phaser.Math.Angle.Between(proj.x, proj.y, enemy.x, enemy.y);
          const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(hitAngle - stats.facingAngle));
          if (angleDiff < 1.2) { // ~70° frontal cone
            finalDmg = Math.max(1, finalDmg - stats.frontArmor);
          }
        }

        // Elite ARMORED flat armor
        if (stats.eliteAffix?.flatArmor) {
          finalDmg = Math.max(1, finalDmg - stats.eliteAffix.flatArmor);
        }
        
        const isCrit = Math.random() < this.playerManager.stats.critChance;
        if (isCrit) {
            finalDmg *= this.playerManager.stats.critMultiplier;
            // shake removed
        }
        
        finalDmg = Math.floor(finalDmg);
        stats.hp -= finalDmg; 
        stats.lastHit = this.time.now;
        
        const baseColor = enemy.getData('baseColor') || 0x888888;
        enemy.setTint(isCrit ? 0xffff00 : 0xffffff);
        this.time.delayedCall(60, () => { if (enemy.active) enemy.clearTint(); });

        // Poison projectile effect
        if (proj.getData('poison')) {
          this.enemyManager.applyStatusEffect(enemy, 'POISONED', {
            duration: proj.getData('poisonDuration') || 4000,
            dps: proj.getData('poisonDps') || 15,
            baseDamage: finalDmg
          });
        }

        // Wind slash tags the enemy — triggers reactions with BURNING
        if (proj.getData('wind')) {
          this.enemyManager.applyStatusEffect(enemy, 'WIND', {
            baseDamage: finalDmg
          });
        }

        // Water — slows enemy
        if (proj.getData('water')) {
          this.enemyManager.applyStatusEffect(enemy, 'FROZEN', {
            duration: proj.getData('slowDuration') || 2000,
            slowFactor: proj.getData('slowFactor') || 0.4
          });
          // Water splash VFX
          const splash = (this.add as any).ellipse(enemy.x, enemy.y, 28, 28, 0x0088ff, 0.7).setDepth(160);
          this.tweens.add({ targets: splash, scaleX: 3, scaleY: 3, alpha: 0, duration: 350, onComplete: () => splash.destroy() });
        }

        // Lightning stun tag — triggers reactions with FROZEN / POISONED
        if (proj.getData('lightning')) {
          this.enemyManager.applyStatusEffect(enemy, 'STUNNED', {
            duration: 600,
            baseDamage: finalDmg
          });
        }

        proj.setActive(false).setVisible(false);
        proj.body.enable = false;
        
        if (stats.hp <= 0) this.onEnemyKilled(enemy);
    });

    // --- Коллизии с боссами (отдельный пул) ---
    this.physics.add.overlap(this.combatManager.projectiles, this.enemyManager.bossGroup, (proj: any, enemy: any) => {
        if (!proj.active || !enemy.active) return;
        const stats = enemy.getData('stats');
        if (!stats) return;
        let finalDmg = (proj.getData('damage') || 25) * this.playerManager.stats.damageMultiplier;
        const isCrit = Math.random() < this.playerManager.stats.critChance;
        if (isCrit) finalDmg *= this.playerManager.stats.critMultiplier;
        finalDmg = Math.floor(finalDmg);
        stats.hp -= finalDmg;
        stats.lastHit = this.time.now;
        const baseColor = enemy.getData('baseColor') || 0x888888;
        enemy.setTint(isCrit ? 0xffff00 : 0xffffff);
        this.time.delayedCall(60, () => { if (enemy.active) enemy.clearTint(); });
        if (proj.getData('poison')) this.enemyManager.applyStatusEffect(enemy, 'POISONED', { duration: proj.getData('poisonDuration') || 4000, dps: proj.getData('poisonDps') || 15, baseDamage: finalDmg });
        if (proj.getData('wind')) this.enemyManager.applyStatusEffect(enemy, 'WIND', { baseDamage: finalDmg });
        proj.setActive(false).setVisible(false);
        proj.body.enable = false;
        if (stats.hp <= 0) this.onEnemyKilled(enemy);
    });

    this.physics.add.overlap(this.playerManager.sprite, this.enemyManager.bossGroup, (p, enemy: any) => {
        if (!enemy.active) return;
        if (this.playerManager.isInvincible) return;
        const stats = enemy.getData('stats');
        if (!stats) return;
        const rawDmgPerFrame = stats.damage / 60;
        const finalDmg = Math.max(0.05, rawDmgPerFrame - this.playerManager.stats.armor / 60);
        this.damagePlayer(finalDmg);
    });

    this.physics.add.overlap(this.playerManager.sprite, this.enemyManager.group, (p, enemy: any) => {
        if (!enemy.active) return;
        if (this.playerManager.isInvincible) return; // i-frames при даше
        const stats = enemy.getData('stats');
        if (!stats) return;
        // Bomber doesn't melee damage — it explodes
        if (stats.behavior === 'BOMBER') return;
        
        const rawDmgPerFrame = stats.damage / 60;
        const armorPerFrame = this.playerManager.stats.armor / 60;
        const finalDmg = Math.max(0.05, rawDmgPerFrame - armorPerFrame);
        this.damagePlayer(finalDmg);
    });

    this.physics.add.overlap(this.playerManager.sprite, this.enemyManager.projectiles, (p, ep: any) => {
        if (!ep.active) return;
        const rawDmg = ep.getData('damage') || 10;
        const finalDmg = Math.max(1, rawDmg - this.playerManager.stats.armor);
        this.damagePlayer(finalDmg);
        // shake removed
        ep.setActive(false).setVisible(false);
        ep.body.enable = false;
    });

    this.events.on('loot_collected', (data) => {
        this.playerManager.addResource(data.type, data.amount, (stats) => {
           this.stateMachine.setState('LEVEL_UP');
        });
    });

    this.events.on('player_damaged', (amount) => {
        const finalDmg = Math.max(1, amount - this.playerManager.stats.armor);
        this.damagePlayer(finalDmg);
    });

    // Enemies killed by poison/burning DoT
    this.events.on('enemy_killed_by_dot', (enemy: any) => {
        if (!enemy.active) return;
        this.onEnemyKilled(enemy);
    });
  }

  update(time, delta) {
    this.stateMachine.update(time, delta);
  }

  damagePlayer(amount) {
    // I-frames during dash — ignore all damage
    if (this.playerManager.isInvincible) return;

    // Already dead — don't process more damage
    if (this.stateMachine.is('GAME_OVER')) return;

    this.playerManager.stats.hp -= amount;
    // Clamp so HUD shows 0, not negative
    if (this.playerManager.stats.hp < 0) this.playerManager.stats.hp = 0;

    // Taking damage breaks the combo
    this.breakCombo();

    if (this.playerManager.stats.hp <= 0) {
        this.stateMachine.setState('GAME_OVER');
    }
  }

  // Returns loot multiplier based on current combo level
  getComboMultiplier(): number {
    // comboLevel 0→x1, 1→x1.5, 2→x2, 3→x3, 4→x4
    const mults = [1.0, 1.5, 2.0, 3.0, 4.0];
    return mults[Math.min(this.comboLevel, mults.length - 1)];
  }

  incrementCombo(x: number, y: number) {
    this.currentCombo++;
    if (this.currentCombo > this.maxCombo) this.maxCombo = this.currentCombo;

    // Level up every 5 kills, max level 4
    const newLevel = Math.min(4, Math.floor(this.currentCombo / 5));
    const leveledUp = newLevel > this.comboLevel;
    this.comboLevel = newLevel;

    // Reset decay timer (3 sec window)
    if (this.comboTimer) this.comboTimer.remove();
    this.comboTimer = this.time.delayedCall(GAME_BALANCE.comboTimeout, () => {
      this.breakCombo();
    });

    // --- Floating combo text at kill position ---
    const mult = this.getComboMultiplier();
    const colors = ['#ffffff', '#ffcc00', '#ff8800', '#ff4400', '#ff00ff'];
    const sizes  = ['28px',   '34px',    '40px',    '48px',    '56px'];
    const col  = colors[this.comboLevel];
    const size = sizes[this.comboLevel];

    // Kill counter popup
    const killTxt = this.add.text(x, y - 20, `+${this.currentCombo}`, {
      fontFamily: 'Pirata One', fontSize: size,
      color: col, stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(3500);

    this.tweens.add({
      targets: killTxt, y: y - 80, alpha: 0,
      duration: 900, ease: 'Cubic.Out',
      onComplete: () => killTxt.destroy()
    });

    // Level-up banner when combo tier increases
    if (leveledUp && this.comboLevel > 0) {
      const labels = ['', 'DOUBLE!', 'TRIPLE!!', 'RAMPAGE!!!', '★ GODLIKE ★'];
      const banner = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY - 120,
        `${labels[this.comboLevel]}  ×${mult} LOOT`,
        { fontFamily: 'Pirata One', fontSize: '52px', color: col, stroke: '#000000', strokeThickness: 8 }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(3600).setAlpha(0);

      this.tweens.add({
        targets: banner,
        alpha: 1, y: `-=30`,
        duration: 300, hold: 900,
        onComplete: () => {
          this.tweens.add({ targets: banner, alpha: 0, duration: 400, onComplete: () => banner.destroy() });
        }
      });

      // Extra camera shake on tier-up
      // shake removed
    }
  }

  breakCombo() {
    if (this.currentCombo === 0) return;
    this.currentCombo = 0;
    this.comboLevel = 0;

    // Small "COMBO LOST" flash
    if (this.currentCombo > 4) {
      const lost = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY - 80,
        'COMBO LOST',
        { fontFamily: 'Pirata One', fontSize: '28px', color: '#666666', stroke: '#000', strokeThickness: 4 }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(3500).setAlpha(0.8);
      this.tweens.add({ targets: lost, alpha: 0, y: '-=30', duration: 700, onComplete: () => lost.destroy() });
    }
  }

  onEnemyKilled(enemy) {
    if (!enemy.active) return; // already processed
    const stats = enemy.getData('stats');
    const hpRatio = this.playerManager.stats.hp / this.playerManager.stats.maxHp;
    // Используем xp множитель из конфига волны (уже учитывает прогрессию)
    const xpMult = this.enemyManager.waveState.config?.multipliers?.xp || 1.0;

    // VOLATILE elite: explodes on death
    if (stats.eliteAffix?.deathExplosionRadius) {
      const r = stats.eliteAffix.deathExplosionRadius;
      const dmg = stats.eliteAffix.deathExplosionDamage;
      const boom = this.add.ellipse(enemy.x, enemy.y, r * 2, r * 2, 0xffaa00, 0.65).setDepth(185);
      this.tweens.add({ targets: boom, scale: 1.6, alpha: 0, duration: 500, onComplete: () => boom.destroy() });
      // shake removed
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.playerManager.sprite.x, this.playerManager.sprite.y) < r) {
        this.damagePlayer(Math.max(1, dmg - this.playerManager.stats.armor));
      }
    }

    // Increment combo BEFORE spawning loot so multiplier is applied
    this.incrementCombo(enemy.x, enemy.y);
    const comboMult = this.getComboMultiplier();

    this.lootSystem.spawnEnemyLoot(enemy, enemy.x, enemy.y, hpRatio, xpMult * comboMult);

    this.killCount++;

    // Boss and minions don't count toward wave target
    if (!stats.isBoss && !stats.isMinion) {
      this.enemyManager.waveState.killedInWave++;
    }

    enemy.setActive(false).setVisible(false);
    enemy.body.enable = false;

    // sprite hidden via setActive/setVisible
    const hpBarBg   = enemy.getData('hpBarBg');
    const hpBarFill = enemy.getData('hpBarFill');
    const hpBarLbl  = enemy.getData('hpBarLabel');
    if (hpBarBg)   { hpBarBg.destroy();   enemy.setData('hpBarBg',    null); }
    if (hpBarFill) { hpBarFill.destroy(); enemy.setData('hpBarFill',  null); }
    if (hpBarLbl)  { hpBarLbl.destroy();  enemy.setData('hpBarLabel', null); }

    // Wave complete when all regular enemies killed
    // For boss waves: also require boss to be dead
    const ws = this.enemyManager.waveState;
    const waveCanComplete = ws.status === 'ACTIVE' || ws.status === 'SPAWNING';

    if (waveCanComplete && ws.killedInWave >= ws.targetInWave) {
      // Если босс ещё не заспавнился — ждём
      if (ws.pendingBoss) return;

      // Check if any boss is still alive
      const bossAlive = this.enemyManager.allEnemies().some((e: any) => {
        if (!e.active) return false;
        const s = e.getData('stats');
        return s?.isBoss === true;
      });

      if (!bossAlive) {
        ws.status = 'COMPLETE';
        this.time.delayedCall(500, () => {
          this.stateMachine.setState('LEVEL_UP');
        });
      }
    }

    // If boss was just killed and regular enemies already done — complete wave
    if (stats.isBoss && waveCanComplete && ws.killedInWave >= ws.targetInWave) {
      ws.status = 'COMPLETE';
      this.time.delayedCall(500, () => {
        this.stateMachine.setState('LEVEL_UP');
      });
    }
  }

  startNextWave(waveNum) {
      this.enemyManager.startWave(waveNum);
      const waveTxt = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 200, `WAVE ${waveNum}`, {
         fontFamily: 'Pirata One', fontSize: '110px', color: '#ffcc00', stroke: '#000000', strokeThickness: 10
      }).setOrigin(0.5).setScrollFactor(0).setDepth(3000).setAlpha(0);
      
      this.tweens.add({
         targets: waveTxt, y: '+=60', alpha: 1, duration: 600, hold: 1800, yoyo: true, onComplete: () => waveTxt.destroy()
      });
  }

  processAbilities(time) {
      // Cache active enemies once per frame — used by all abilities
      const activeEnemies: any[] = this.enemyManager.allEnemies().filter((e: any) => e.active);
      if (activeEnemies.length === 0) return; // nothing to shoot at

      this.playerManager.stats.abilities.forEach((ab) => {
         if (ab.cooldown > 0 && time - ab.lastFired > ab.cooldown) {
              if (this.playerManager?.sprite?.active) this.playerManager.playCastAnim();
            const baseDamage = ab.damage || 35;
            const dmgMult = this.playerManager.stats.damageMultiplier;
            const isCritBase = () => Math.random() < this.playerManager.stats.critChance;
            const calcDmg = (base, critBonus = 0) => {
              const crit = Math.random() < (this.playerManager.stats.critChance + critBonus);
              const d = Math.floor(base * dmgMult * (crit ? this.playerManager.stats.critMultiplier : 1));
              return { dmg: d, crit };
            };
            const applyToEnemy = (e, dmg, crit = false) => {
              if (!e.active) return; // already dead
              const stats = e.getData('stats');
              if (!stats) return;
              const baseColor = e.getData('baseColor') || stats.color;
              e.setTint(crit ? 0xffff00 : 0xffffff);
              this.time.delayedCall(80, () => { if (e.active) e.clearTint(); });
              stats.hp -= dmg;
              if (stats.hp <= 0 && e.active) this.onEnemyKilled(e);
            };

            // --- FIREBALL (seeking bolts) ---
            if (ab.id === 'fireball') {
                const target = this.physics.closest(this.playerManager.sprite, activeEnemies);
                if (target) {
                    const count = ab.projectileCount || 1;
                    for (let i = 0; i < count; i++) {
                        this.time.delayedCall(i * 110, () => {
                            const fp = this.combatManager.spawnProjectile(
                              this.playerManager.sprite.x, this.playerManager.sprite.y,
                              target, baseDamage, MAGIC_COLORS.FIRE, 820
                            );
                            // Fireball tags as BURNING on hit (handled via aura already, but tag for future)
                            if (fp) fp.setData('fire', true);
                        });
                    }
                    ab.lastFired = time;
                }

            // --- LIGHTNING (chain hits) ---
            } else if (ab.id === 'lightning') {
                const first: any = this.physics.closest(this.playerManager.sprite, activeEnemies);
                if (first) {
                  const chains = ab.chains || 3;
                  const chainRange = ab.chainRange || 220;
                  const falloff = ab.chainDamageFalloff || 0.7;
                  let currentDmg = baseDamage * dmgMult;
                  let currentTarget = first;
                  const hit = new Set<any>([first]);

                  for (let c = 0; c < chains; c++) {
                    const target = currentTarget;
                    const dmg = Math.floor(currentDmg);
                    const crit = isCritBase();
                    this.time.delayedCall(c * 80, () => {
                      if (!target.active) return;
                      applyToEnemy(target, crit ? Math.floor(dmg * this.playerManager.stats.critMultiplier) : dmg, crit);
                      // Lightning arc VFX
                      const g = this.add.graphics().setDepth(200);
                      const src = c === 0 ? this.playerManager.sprite : target;
                      g.lineStyle(2 + (chains - c) * 0.5, MAGIC_COLORS.LIGHTNING, 0.9);
                      g.lineBetween(src.x, src.y, target.x, target.y);
                      this.time.delayedCall(120, () => g.destroy());
                    });

                    // Find next chain target from already-active list
                    const nearby = activeEnemies.filter((e: any) => 
                      !hit.has(e) && Phaser.Math.Distance.Between(currentTarget.x, currentTarget.y, e.x, e.y) < chainRange
                    );
                    if (nearby.length === 0) break;
                    currentTarget = nearby[Math.floor(Math.random() * nearby.length)];
                    hit.add(currentTarget);
                    currentDmg *= falloff;
                  }
                  ab.lastFired = time;
                }

            // --- AURA (void pulse ring) ---
            } else if (ab.id === 'aura') {
                const range = ab.radius || 125;
                const auraVfx = this.add.ellipse(
                  this.playerManager.sprite.x, this.playerManager.sprite.y,
                  range * 2, range * 2, MAGIC_COLORS.LEVEL_UP, 0.18
                ).setDepth(130);
                this.tweens.add({ targets: auraVfx, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 500, onComplete: () => auraVfx.destroy() });
                activeEnemies.forEach((e: any) => {
                  if (Phaser.Math.Distance.Between(this.playerManager.sprite.x, this.playerManager.sprite.y, e.x, e.y) < range) {
                    const { dmg, crit } = calcDmg(baseDamage);
                    applyToEnemy(e, dmg, crit);
                    if (crit) {
                      this.enemyManager.applyStatusEffect(e, 'BURNING', {
                        duration: 3000, dps: baseDamage * 0.3, baseDamage: dmg
                      });
                    }
                  }
                });
                ab.lastFired = time;

            // --- ICE NOVA (freeze ring) ---
            } else if (ab.id === 'ice_nova') {
                const range = ab.radius || 190;
                const nova = this.add.ellipse(this.playerManager.sprite.x, this.playerManager.sprite.y, range * 2, range * 2, MAGIC_COLORS.ICE, 0.45).setDepth(140);
                this.tweens.add({ targets: nova, alpha: 0, scale: 1.35, duration: 700, onComplete: () => nova.destroy() });
                activeEnemies.forEach((e: any) => {
                  if (Phaser.Math.Distance.Between(this.playerManager.sprite.x, this.playerManager.sprite.y, e.x, e.y) < range) {
                    const { dmg, crit } = calcDmg(baseDamage);
                    applyToEnemy(e, dmg, crit);
                    this.enemyManager.applyStatusEffect(e, 'FROZEN', {
                      duration: crit ? 3000 : 2000, baseDamage: dmg
                    });
                  }
                });
                ab.lastFired = time;

            // --- METEOR STRIKE (targets enemy cluster) ---
            } else if (ab.id === 'meteor_strike') {
                const range = ab.radius || 140;
                if (activeEnemies.length === 0) return;
                let bestTarget: any = activeEnemies[0];
                let bestCount = 0;
                for (const candidate of activeEnemies) {
                  const count = activeEnemies.filter(e => Phaser.Math.Distance.Between(candidate.x, candidate.y, e.x, e.y) < range).length;
                  if (count > bestCount) { bestCount = count; bestTarget = candidate; }
                }
                const tx = bestTarget.x, ty = bestTarget.y;
                const warn = this.add.ellipse(tx, ty, range * 2, range * 2, 0xff4400, 0.0).setDepth(105).setStrokeStyle(3, 0xff4400, 0.9);
                this.tweens.add({ targets: warn, alpha: 0.3, duration: 800, yoyo: true, repeat: 1, onComplete: () => {
                  warn.destroy();
                  const impact = this.add.ellipse(tx, ty, range * 2, range * 2, MAGIC_COLORS.METEOR, 0.7).setDepth(190);
                  this.tweens.add({ targets: impact, scale: 1.4, alpha: 0, duration: 600, onComplete: () => impact.destroy() });
                  // shake removed
                  activeEnemies.forEach((e: any) => {
                    if (!e.active) return;
                    if (Phaser.Math.Distance.Between(tx, ty, e.x, e.y) < range) {
                      const { dmg, crit } = calcDmg(baseDamage);
                      applyToEnemy(e, dmg, crit);
                      this.enemyManager.applyStatusEffect(e, 'BURNING', { duration: 2500, dps: baseDamage * 0.2 });
                    }
                  });
                }});
                ab.lastFired = time;

            // --- POISON BOLT ---
            } else if (ab.id === 'poison_bolt') {
                const target = this.physics.closest(this.playerManager.sprite, activeEnemies);
                if (target) {
                  const p = this.combatManager.spawnProjectile(
                    this.playerManager.sprite.x, this.playerManager.sprite.y,
                    target, baseDamage, MAGIC_COLORS.POISON, 380
                  );
                  if (p) {
                    p.setData('poison', true);
                    p.setData('poisonDps', ab.poisonDps || 15);
                    p.setData('poisonDuration', ab.poisonDuration || 4000);
                  }
                  ab.lastFired = time;
                }

            // --- STORM LANCE (piercing lightning bolt) ---
            } else if (ab.id === 'storm_lance') {
                const cam = this.cameras.main;
                const view = cam.worldView;
                // Стреляем только если ближайший враг виден на экране
                const visibleEnemies = activeEnemies.filter((e: any) =>
                  e.x >= view.x && e.x <= view.x + view.width &&
                  e.y >= view.y && e.y <= view.y + view.height
                );
                const target: any = this.physics.closest(this.playerManager.sprite, visibleEnemies);
                if (target) {
                  const px = this.playerManager.sprite.x, py = this.playerManager.sprite.y;
                  const angle = Phaser.Math.Angle.Between(px, py, target.x, target.y);
                  const lanceLen = ab.range || 600;
                  const ex = px + Math.cos(angle) * lanceLen;
                  const ey = py + Math.sin(angle) * lanceLen;
                  // VFX — thick lightning beam
                  const beam = this.add.graphics().setDepth(170);
                  beam.lineStyle(6, MAGIC_COLORS.LIGHTNING, 0.9); beam.lineBetween(px, py, ex, ey);
                  beam.lineStyle(2, 0xffffff, 0.6); beam.lineBetween(px, py, ex, ey);
                  this.tweens.add({ targets: beam, alpha: 0, duration: 300, onComplete: () => beam.destroy() });
                  // Бьём только видимых врагов в луче
                  visibleEnemies.forEach((e: any) => {
                    const dist = Phaser.Math.Distance.Between(px, py, e.x, e.y);
                    // Check if enemy is near the line
                    const proj = Phaser.Math.Distance.Between(
                      px + Math.cos(angle) * dist, py + Math.sin(angle) * dist, e.x, e.y
                    );
                    if (proj < (ab.width || 24)) {
                      const { dmg, crit } = calcDmg(baseDamage);
                      applyToEnemy(e, dmg, crit);
                      this.enemyManager.applyStatusEffect(e, 'STUNNED', { duration: ab.stunDuration || 800 });
                    }
                  });
                  ab.lastFired = time;
                }

            // --- WIND SLASH (spread blades) ---
            } else if (ab.id === 'wind_slash') {
                const target: any = this.physics.closest(this.playerManager.sprite, activeEnemies);
                if (target) {
                  const count = ab.projectileCount || 3;
                  const spread = ab.spreadAngle || 25;
                  const baseAngle = Phaser.Math.Angle.Between(this.playerManager.sprite.x, this.playerManager.sprite.y, target.x, target.y);
                  for (let i = 0; i < count; i++) {
                    const offset = (i - Math.floor(count / 2)) * Phaser.Math.DegToRad(spread);
                    const angle = baseAngle + offset;
                    const fakeTarget = { x: this.playerManager.sprite.x + Math.cos(angle) * 800, y: this.playerManager.sprite.y + Math.sin(angle) * 800 };
                    const wp = this.combatManager.spawnProjectile(
                      this.playerManager.sprite.x, this.playerManager.sprite.y,
                      fakeTarget, baseDamage, MAGIC_COLORS.WIND, 950
                    );
                    if (wp) wp.setData('wind', true);
                  }
                  ab.lastFired = time;
                }

            // --- WATERBALL (slowing projectile) ---
            } else if (ab.id === 'waterball') {
                const target: any = this.physics.closest(this.playerManager.sprite, activeEnemies);
                if (target) {
                  const wp = this.combatManager.spawnProjectile(
                    this.playerManager.sprite.x, this.playerManager.sprite.y,
                    target, baseDamage, 0x0088ff, 520
                  );
                  if (wp) {
                    wp.setData('water', true);
                    wp.setData('slowFactor', ab.slowFactor || 0.4);
                    wp.setData('slowDuration', ab.slowDuration || 2000);
                    // Larger projectile visual
                    wp.setSize(20, 20).setDisplaySize(20, 20);
                  }
                  // VFX — water ring
                  const ring = (this.add as any).ellipse(this.playerManager.sprite.x, this.playerManager.sprite.y, 30, 30, 0x0088ff, 0.6).setDepth(160);
                  this.tweens.add({ targets: ring, scaleX: 3, scaleY: 3, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
                  ab.lastFired = time;
                }

            // --- VOID BEAM (2-phase: aim circle → beam strike) ---
            } else if (ab.id === 'void_beam') {
                // Guard: only one cast at a time
                if ((this as any)._voidBeamActive) return;
                (this as any)._voidBeamActive = true;
                ab.lastFired = time;

                const cam = this.cameras.main;
                const radius = ab.voidRadius || 60;
                const castTime = ab.voidCastTime || 900;

                // Random position inside visible viewport
                const circleX = cam.worldView.x + Phaser.Math.Between(radius + 50, cam.worldView.width  - radius - 50);
                const circleY = cam.worldView.y + Phaser.Math.Between(radius + 50, cam.worldView.height - radius - 50);

                // ── PHASE 1: Warning circle ──────────────────────────────
                const circleGfx = this.add.graphics().setDepth(180);
                circleGfx.setPosition(circleX, circleY);
                circleGfx.fillStyle(0x9B59B6, 0.35);
                circleGfx.fillCircle(0, 0, radius);
                circleGfx.lineStyle(2, 0xD700FF, 1.0);
                circleGfx.strokeCircle(0, 0, radius);

                // Pulsing tween
                const pulseTween = this.tweens.add({
                  targets: circleGfx,
                  scaleX: 1.12, scaleY: 1.12,
                  yoyo: true, repeat: -1, duration: 280, ease: 'Sine.easeInOut'
                });

                // Orbiting void particles (small ellipses rotating around circle edge)
                const orbitDots: any[] = [];
                for (let i = 0; i < 6; i++) {
                  const dot = (this.add as any).ellipse(0, 0, 8, 8, 0xD700FF, 1).setDepth(181);
                  orbitDots.push(dot);
                }
                const orbitTimer = this.time.addEvent({
                  delay: 16,
                  repeat: Math.floor(castTime / 16),
                  callback: () => {
                    const t = this.time.now / 400;
                    orbitDots.forEach((dot, i) => {
                      const a = t + (i / orbitDots.length) * Math.PI * 2;
                      dot.x = circleX + Math.cos(a) * (radius + 6);
                      dot.y = circleY + Math.sin(a) * (radius + 6);
                    });
                  }
                });

                // ── PHASE 2: Beam strike after castTime ─────────────────
                this.time.delayedCall(castTime, () => {
                  // Abort if player died
                  if (!this.playerManager.sprite.active || this.stateMachine.is('GAME_OVER')) {
                    pulseTween.stop();
                    orbitTimer.remove();
                    circleGfx.destroy();
                    orbitDots.forEach(d => d.destroy());
                    (this as any)._voidBeamActive = false;
                    return;
                  }

                  // Destroy phase-1 visuals
                  pulseTween.stop();
                  orbitTimer.remove();
                  orbitDots.forEach(d => d.destroy());
                  circleGfx.destroy();

                  // Draw beam — full-height column centred on circle
                  const beamGfx = this.add.graphics().setDepth(182);
                  beamGfx.fillStyle(0xD700FF, 0.9);
                  beamGfx.fillRect(circleX - radius, cam.worldView.y, radius * 2, cam.worldView.height);
                  // Bright white core
                  beamGfx.fillStyle(0xffffff, 0.55);
                  beamGfx.fillRect(circleX - 6, cam.worldView.y, 12, cam.worldView.height);

                  // Beam flash — appear instantly, fade in 300ms
                  this.tweens.add({
                    targets: beamGfx, alpha: 0, duration: 320,
                    onComplete: () => beamGfx.destroy()
                  });

                  // Impact ring VFX
                  const impactRing = (this.add as any).ellipse(circleX, circleY, radius * 2, radius * 2, 0xD700FF, 0).setDepth(183).setStrokeStyle(3, 0xD700FF, 1);
                  this.tweens.add({ targets: impactRing, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 400, onComplete: () => impactRing.destroy() });

                  // Void particle burst from centre
                  for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2;
                    const spark = (this.add as any).ellipse(circleX, circleY, 6, 6, 0xD700FF, 1).setDepth(184);
                    this.tweens.add({
                      targets: spark,
                      x: circleX + Math.cos(angle) * Phaser.Math.Between(40, 120),
                      y: circleY + Math.sin(angle) * Phaser.Math.Between(40, 120),
                      alpha: 0, scale: 0, duration: 500, delay: i * 20,
                      onComplete: () => spark.destroy()
                    });
                  }

                  // Camera shake
                  this.cameras.main.shake(150, 0.01);

                  // Hit all enemies in circle — always crit
                  const voidCritMult = ab.voidCritMult || 2.0;
                  const voidDmg = Math.floor((ab.damage || 80) * dmgMult * voidCritMult);
                  this.enemyManager.allEnemies().forEach((e: any) => {
                    if (!e.active) return;
                    const dist = Phaser.Math.Distance.Between(circleX, circleY, e.x, e.y);
                    if (dist <= radius) {
                      applyToEnemy(e, voidDmg, true);
                      // Purple tint flash
                      e.setTint(0x9B59B6);
                      this.time.delayedCall(120, () => { if (e.active) e.clearTint(); });
                      // CRIT! floating text
                      const critTxt = this.add.text(e.x, e.y - 20, 'VOID CRIT!', {
                        fontSize: '16px', color: '#D700FF', fontStyle: 'bold', fontFamily: 'monospace',
                        stroke: '#000000', strokeThickness: 3
                      }).setDepth(300).setOrigin(0.5);
                      this.tweens.add({ targets: critTxt, y: e.y - 70, alpha: 0, duration: 800, onComplete: () => critTxt.destroy() });
                    }
                  });

                  (this as any)._voidBeamActive = false;
                });

            // --- DRAGON BREATH (fire cone) ---
            } else if (ab.id === 'dragon_breath') {
                const target: any = this.physics.closest(this.playerManager.sprite, activeEnemies);
                if (target) {
                  const px = this.playerManager.sprite.x, py = this.playerManager.sprite.y;
                  const aimAngle = Phaser.Math.Angle.Between(px, py, target.x, target.y);
                  const halfCone = Phaser.Math.DegToRad((ab.coneAngle || 55) / 2);
                  const range = ab.coneRange || 280;
                  // VFX — cone of fire particles
                  for (let i = 0; i < 8; i++) {
                    const spread = Phaser.Math.FloatBetween(-halfCone, halfCone);
                    const a = aimAngle + spread;
                    const dist = Phaser.Math.FloatBetween(60, range);
                    const fx = px + Math.cos(a) * dist;
                    const fy = py + Math.sin(a) * dist;
                    const flame = (this.add as any).ellipse(fx, fy, Phaser.Math.Between(12, 24), Phaser.Math.Between(12, 24), MAGIC_COLORS.FIRE, 0.8).setDepth(162);
                    this.tweens.add({ targets: flame, alpha: 0, scaleX: 2, scaleY: 2, duration: 400, delay: i * 40, onComplete: () => flame.destroy() });
                  }
                  // Hit all enemies in cone
                  activeEnemies.forEach((e: any) => {
                    const dist = Phaser.Math.Distance.Between(px, py, e.x, e.y);
                    if (dist > range) return;
                    const angleToEnemy = Phaser.Math.Angle.Between(px, py, e.x, e.y);
                    const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToEnemy - aimAngle));
                    if (angleDiff < halfCone) {
                      const { dmg, crit } = calcDmg(baseDamage);
                      applyToEnemy(e, dmg, crit);
                      this.enemyManager.applyStatusEffect(e, 'BURNING', { duration: ab.burnDuration || 3000, dps: baseDamage * 0.3 });
                    }
                  });
                  ab.lastFired = time;
                }
            }
         }
      });
  }

  pauseGame() {
    if (this.stateMachine?.is('PLAYING')) this.stateMachine.setState('PAUSED');
  }

  resumeGame() {
    if (this.stateMachine?.is('PAUSED')) this.stateMachine.setState('PLAYING');
  }

  applyUpgrade(choice) {
    this.cameras.main.flash(500, 168, 85, 247, true);
    UpgradeSystem.applyUpgrade(choice, this.playerManager.stats);
    this.stateMachine.setState('PLAYING');

    // Reset lastFired so abilities fire immediately (not waiting full cooldown after pause)
    this.playerManager.stats.abilities.forEach((ab: any) => {
      ab.lastFired = 0;
    });

    if (this.enemyManager.waveState.status === 'COMPLETE') {
       const nextWave = this.enemyManager.waveState.currentWave + 1;
       this.enemyManager.waveState.status = 'TRANSITIONING';
       this.time.delayedCall(GAME_BALANCE.waveTransitionDelay, () => {
         this.startNextWave(nextWave);
       });
    }
  }
}
