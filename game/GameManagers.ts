import { ENEMY_SPRITE_REGISTRY } from './EnemySpriteRegistry';

import Phaser from 'phaser';
import { 
  WORLD_SIZE, INITIAL_PLAYER, ABILITIES_BASE, MAGIC_COLORS, 
  ENEMY_TEMPLATES, BOSS_TEMPLATES, GAME_BALANCE, LOOT_CONFIG,
  ELITE_AFFIXES, STATUS_EFFECTS, ELEMENTAL_REACTIONS
} from '../constants';

// Менеджер игрока: управление вводом, движением, рывком и прокачкой
export class PlayerManager {
  scene: Phaser.Scene;
  sprite: any;
  stats: any;
  cursors: any;
  wasd: any;
  shiftKey: any;
  spaceKey: any;

  // Dash state
  isDashing: boolean = false;
  dashLastUsed: number = 0;
  dashDir: { x: number, y: number } = { x: 0, y: 1 };
  lastMoveDir: { x: number, y: number } = { x: 0, y: 1 };

  // Получаем ссылку на сцену Phaser
  constructor(scene) {
    this.scene = scene;
  }

  // Создаём спрайт игрока, настраиваем хитбокс и стартовые статы
  create(spriteKey) {
    this.sprite = this.scene.physics.add.sprite(WORLD_SIZE/2, WORLD_SIZE/2, spriteKey);
    this.sprite.setDepth(100);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setDrag(0);

    const isSheet = spriteKey === 'wizard';
    if (isSheet) {
      // frame 200x280, scale 0.4 -> 80x112px on screen
      this.sprite.setScale(0.4);
      this.sprite.body.setSize(120, 160, false);
      this.sprite.body.setOffset(40, 60);
    } else {
      // static fallback
      this.sprite.setScale(0.12);
    }

    this.stats = {
      ...INITIAL_PLAYER,
      id: 'p1', 
      pos: { x: WORLD_SIZE/2, y: WORLD_SIZE/2 },
      hp: INITIAL_PLAYER.maxHp, 
      level: 1, 
      xp: 0,
      gold: 0, 
      gems: 0,
      nextLevelXp: GAME_BALANCE.formulas.getXPForNextLevel(1),
      abilities: [
        { ...ABILITIES_BASE.fireball, level: 1, lastFired: 0, cooldown: ABILITIES_BASE.fireball.baseCooldown, baseCooldown: ABILITIES_BASE.fireball.baseCooldown, trigger: 'auto' }
      ],
      tusks: 0, 
      maxCombo: 0
    };

    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasd = this.scene.input.keyboard.addKeys('W,S,A,D');
    this.shiftKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.scene.cameras.main.startFollow(this.sprite, true, 1.0, 1.0);
    this.scene.cameras.main.setRoundPixels(true);
  }

  // Обновление каждый кадр: движение, рывок, анимации и cooldown для HUD
  update(time, delta) {
    if (!this.sprite.active) return;

    let moveX = 0;
    let moveY = 0;
    const speed = this.stats.speed * 60;

    if (this.cursors.left.isDown  || (this.wasd as any).A.isDown) moveX -= 1;
    if (this.cursors.right.isDown || (this.wasd as any).D.isDown) moveX += 1;
    if (this.cursors.up.isDown    || (this.wasd as any).W.isDown) moveY -= 1;
    if (this.cursors.down.isDown  || (this.wasd as any).S.isDown) moveY += 1;

    // Track last movement direction for dash when standing still
    if (moveX !== 0 || moveY !== 0) {
      const norm = new Phaser.Math.Vector2(moveX, moveY).normalize();
      this.lastMoveDir = { x: norm.x, y: norm.y };
    }

    // --- DASH INPUT ---
    const dashReady = time - this.dashLastUsed >= this.stats.dashCooldown;
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.shiftKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (dashPressed && dashReady && !this.isDashing) {
      this.startDash(time);
    }

    // --- MOVEMENT ---
    if (this.isDashing) {
      // During dash: lock velocity to dash direction, spawn ghost
      const dashSpeed = speed * this.stats.dashSpeedMult;
      this.sprite.setVelocity(
        this.dashDir.x * dashSpeed,
        this.dashDir.y * dashSpeed
      );
      this.spawnGhost();
    } else {
      const vector = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(speed);
      this.sprite.setVelocity(vector.x, vector.y);
    }

    // Округляем позицию — убирает субпиксельное размытие спрайта
    this.sprite.x = Math.round(this.sprite.x);
    this.sprite.y = Math.round(this.sprite.y);

    if (moveX < 0) this.sprite.setFlipX(true);
    else if (moveX > 0) this.sprite.setFlipX(false);

    // Switch animation based on movement (only if anims loaded)
    if (!(this as any)._castingAnim && this.scene.anims.exists('wizard_idle')) {
      const isMoving = moveX !== 0 || moveY !== 0;
      const cur = this.sprite.anims?.currentAnim?.key;
      if (isMoving && cur !== 'wizard_run')        this.sprite.play('wizard_run', true);
      else if (!isMoving && cur !== 'wizard_idle') this.sprite.play('wizard_idle', true);
    }

    this.stats.pos.x = this.sprite.x;
    this.stats.pos.y = this.sprite.y;

    // Sync cooldown ratio for HUD (1.0 = ready, 0.0 = just used)
    const elapsed = time - this.dashLastUsed;
    this.stats.dashCooldownRatio = Math.min(1.0, elapsed / this.stats.dashCooldown);
  }

  // Запускает рывок в последнем направлении движения
  startDash(time) {
    this.isDashing = true;
    this.dashLastUsed = time;
    this.dashDir = { ...this.lastMoveDir };

    // Visual: semi-transparent + white flash
    this.sprite.setAlpha(0.35);
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });

    // Camera micro-shake on dash
    // shake removed

    // End dash after dashDuration ms
    this.scene.time.delayedCall(this.stats.dashDuration, () => {
      this.isDashing = false;
      this.sprite.setAlpha(1.0);
      this.sprite.clearTint();
    });
  }

  // Рисует «шлейф» из призрачных эллипсов во время рывка
  spawnGhost() {
    // Spawn a fading ghost ellipse every 40ms during dash
    const now = this.scene.time.now;
    if (!this._lastGhostTime || now - this._lastGhostTime > 40) {
      this._lastGhostTime = now;
      const ghost = (this.scene.add as any).ellipse(
        this.sprite.x, this.sprite.y,
        32, 32,
        0xa855f7, 0.5
      ).setDepth(90);
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 280,
        onComplete: () => ghost.destroy()
      });
    }
  }

  // Аккуратно проигрывает анимацию каста, не ломая основную анимацию бега/остоя
  playCastAnim() {
    try {
      if ((this as any)._castingAnim) return;
      if (!this.scene.anims.exists('wizard_cast')) return;
      if (!this.sprite?.active) return;
      (this as any)._castingAnim = true;
      this.sprite.play('wizard_cast', true);
      this.sprite.once('animationcomplete-wizard_cast', () => {
        (this as any)._castingAnim = false;
      });
    } catch(e) {
      (this as any)._castingAnim = false;
    }
  }

  // Helper so Game.ts can check i-frames
  // Во время рывка игрок считается неуязвимым для урона
  get isInvincible() {
    return this.isDashing;
  }

  private _lastGhostTime: number = 0;

  // Добавление опыта и обработка возможного повышения уровня (может быть несколько уровней сразу)
  gainXp(amount, onLevelUp) {
    this.stats.xp += amount;
    while (this.stats.xp >= this.stats.nextLevelXp) {
      this.stats.xp -= this.stats.nextLevelXp;
      this.stats.level++;
      this.stats.nextLevelXp = GAME_BALANCE.formulas.getXPForNextLevel(this.stats.level);
      if (onLevelUp) onLevelUp(this.stats);
    }
  }

  // Любой лут конвертируется в ресурсы игрока (XP, GOLD, GEM, лечение HP)
  addResource(type, amount, onLevelUp) {
    switch(type) {
      case 'XP': this.gainXp(amount, onLevelUp); break;
      case 'GOLD': this.stats.gold += amount; break;
      case 'GEM': this.stats.gems += amount; break;
      case 'HP': this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount); break;
    }
  }
}

// Менеджер врагов: волны, спаун обычных и элитных врагов, боссы, статусы и реакции
export class EnemyManager {
  scene: Phaser.Scene;
  group: Phaser.Physics.Arcade.Group;
  bossGroup: Phaser.Physics.Arcade.Group;
  projectiles: Phaser.Physics.Arcade.Group;
  arrowProjectiles: Phaser.Physics.Arcade.Group;
  bossVisuals: Phaser.GameObjects.Group;
  waveState: any;

  // Полный reset объекта из пула, чтобы не "прилипали" scale/frame/flip/velocity от прошлой жизни
  private resetPooledEnemySprite(enemy: any, x: number, y: number) {
    // Visual defaults
    enemy.setVisible(false);
    enemy.setAlpha(1);
    enemy.setDepth(10);
    enemy.setScale(1);
    enemy.setFlipX(false);
    enemy.setFlipY(false);
    enemy.setRotation(0);
    enemy.setAngle(0);
    enemy.setOrigin(0.5, 0.5);
    if (typeof enemy.clearTint === 'function') enemy.clearTint();
    if (typeof enemy.setCrop === 'function') enemy.setCrop();

    // Animation defaults
    try { enemy.anims?.stop?.(); } catch {}
    enemy.off?.('animationcomplete');
    enemy.off?.('animationupdate');

    // Physics defaults
    if (enemy.body) {
      enemy.body.enable = true;
      enemy.body.allowGravity = false;
      enemy.body.setVelocity(0, 0);
      enemy.body.setAcceleration(0, 0);
      enemy.body.setDrag(0, 0);
      enemy.body.reset(x, y);
    } else {
      enemy.x = x;
      enemy.y = y;
    }

    // Data defaults — keep only what we set later
    enemy.setData('stats', null);
    enemy.setData('enemyType', null);
    enemy.setData('baseColor', null);
  }

  // Инициализируем состояние волн при создании менеджера
  constructor(scene) {
    this.scene = scene;
    this.waveState = {
      currentWave: 0,
      killedInWave: 0,
      targetInWave: 0,
      status: 'INACTIVE',
      spawnQueue: [],
      spawnTimer: 0,
      config: null,
      pendingBoss: null,
      pendingBossWave: 0
    };
  }

  // Создаём пулы объектов: обычные враги, снаряды, боссы и их визуальные элементы
  create() {
    this.group = this.scene.physics.add.group({
      classType: Phaser.GameObjects.Sprite,
      maxSize: GAME_BALANCE.maxEnemies,
      runChildUpdate: false
    });
    this.projectiles = this.scene.physics.add.group({
      classType: Phaser.GameObjects.Ellipse,
      maxSize: 100,
      runChildUpdate: false
    });
    // Отдельный пул стрел для лучника
    this.arrowProjectiles = this.scene.physics.add.group({
      classType: Phaser.GameObjects.Image,
      maxSize: 40,
      runChildUpdate: false
    });
    // Отдельный пул для боссов — никогда не конкурирует с обычными врагами
    this.bossGroup = this.scene.physics.add.group({
      classType: Phaser.GameObjects.Sprite,
      maxSize: 1,
      runChildUpdate: false
    });
    this.bossVisuals = this.scene.add.group();
  }

  // allEnemies — returns all enemies from both pools (regular + boss)
  // Удобный список «все враги», объединяющий обычных и боссов
  allEnemies(): any[] {
    const regular = this.group ? this.group.getChildren() : [];
    const bosses  = this.bossGroup ? this.bossGroup.getChildren() : [];
    return [...regular, ...bosses];
  }

  // Старт новой волны: генерируем конфиг, очередь спауна и, при необходимости, планируем босса
  startWave(waveNum) {
    const config = GAME_BALANCE.waveLogic.generateConfig(waveNum);
    this.waveState.currentWave    = waveNum;
    this.waveState.killedInWave   = 0;
    this.waveState.targetInWave   = config.totalEnemies;
    this.waveState.config         = config;
    this.waveState.status         = 'SPAWNING';
    this.waveState.spawnTimer     = 0;
    this.waveState.spawnQueue     = [];
    this.waveState.nextSpawnAt    = 0;

    // Явно деактивируем всё в bossGroup перед новой волной
    if (this.bossGroup) {
      this.bossGroup.getChildren().forEach((b: any) => {
        b.setActive(false).setVisible(false);
        if (b.body) b.body.enable = false;
      });
    }

    const interval = config.spawnInterval / config.spawnBurst;

    for (let i = 0; i < config.totalEnemies; i++) {
       let type = 'MELEE_GRUNT';
       const roll = Math.random();
       let cum = 0;
       for (const [t, w] of Object.entries(config.composition)) {
          cum += (w as number);
          if (roll < cum) { type = t; break; }
       }
       this.waveState.spawnQueue.push({ type, spawnTime: i * interval });
    }

    if (config.isBossWave) {
      const bossKey = config.bossKey || 'SERINAX';
      this.waveState.currentBossKey = bossKey;
      this.waveState.pendingBoss = bossKey; // флаг — босс ещё не заспавнен
      this.waveState.pendingBossWave = waveNum;
    }

    // Safety: if wave has 0 enemies somehow, immediately go ACTIVE
    if (config.totalEnemies === 0) {
      this.waveState.status = 'ACTIVE';
      // На случай если врагов 0 но есть босс
      if (this.waveState.pendingBoss) {
        const bossKey = this.waveState.pendingBoss;
        this.waveState.pendingBoss = null;
        this.scene.time.delayedCall(500, () => {
          this.spawnEnemy('BOSS', config.multipliers, true, bossKey);
        });
      }
    }

    return config.totalEnemies;
  }

  // Спаун одного врага / босса с учётом шаблона, множителей и элитных аффиксов
  spawnEnemy(type, multipliers, isBoss = false, bossKey = 'SERINAX') {
    let template = isBoss ? BOSS_TEMPLATES[bossKey] : ENEMY_TEMPLATES[type];
    if (!template) template = ENEMY_TEMPLATES.MELEE_GRUNT; 

    const cam = this.scene.cameras.main;
    const pad = 100;
    let x, y;
    const side = Math.floor(Math.random() * 4);
    const bounds = { x: cam.worldView.x, y: cam.worldView.y, w: cam.worldView.width, h: cam.worldView.height };
    
    switch(side) {
      case 0: x = bounds.x + Math.random() * bounds.w; y = bounds.y - pad; break; 
      case 1: x = bounds.x + bounds.w + pad; y = bounds.y + Math.random() * bounds.h; break;
      case 2: x = bounds.x + Math.random() * bounds.w; y = bounds.y + bounds.h + pad; break;
      case 3: x = bounds.x - pad; y = bounds.y + Math.random() * bounds.h; break;
      default: x = 0; y = 0;
    }
    
    x = Phaser.Math.Clamp(x, 0, WORLD_SIZE);
    y = Phaser.Math.Clamp(y, 0, WORLD_SIZE);

    // Боссы берутся из отдельного пула — никогда не блокируются обычными врагами
    const enemy: any = isBoss ? this.bossGroup.get(x, y) : this.group.get(x, y);
    if (!enemy) {
      console.warn(`[EnemyManager] Pool exhausted for type=${type} isBoss=${isBoss} — enemy skipped`);
      return null;
    }

    // СРАЗУ reset + скрываем до рендера — group.get() делает setActive/setVisible(true) автоматически
    this.resetPooledEnemySprite(enemy, x, y);

    // --- Elite affix roll ---
    const eliteChance = this.waveState.config?.eliteChance || 0;
    let eliteAffix = null;
    if (!isBoss && Math.random() < eliteChance) {
      const affixKeys = Object.keys(ELITE_AFFIXES);
      eliteAffix = ELITE_AFFIXES[affixKeys[Math.floor(Math.random() * affixKeys.length)]];
    }

    const hpMult   = isBoss ? 1.0 : (eliteAffix ? multipliers.hp * eliteAffix.hpMult   : multipliers.hp);
    const dmgMult  = isBoss ? 1.0 : (eliteAffix ? multipliers.damage * eliteAffix.damageMult : multipliers.damage);
    const spdMult  = eliteAffix ? multipliers.speed * eliteAffix.speedMult  : multipliers.speed;
    const xpMult   = isBoss ? 1.0 : (eliteAffix ? multipliers.xp * eliteAffix.xpMult   : multipliers.xp);
    const goldMult = eliteAffix ? eliteAffix.goldMult : 1.0;

    enemy.body.enable = true;
    enemy.setData('enemyType', type);

    // ── Текстура из реестра (обычные враги) или цвет босса ───────────────
    if (isBoss) {
      // Босс — спрайт если есть, иначе цветной квадрат
      const bossTemplate = BOSS_TEMPLATES[bossKey] || template;
      const bossSize = bossTemplate.size * 2;
      const bossTextureKey = bossKey.toLowerCase();
      const bossScales: Record<string, number> = { serinax: 0.35, vorgath: 0.28, nexarion: 0.30 };
      const bossOriginY: Record<string, number> = { serinax: 1.0, vorgath: 1.0, nexarion: 0.88 };
      const bossScale = bossScales[bossTextureKey] ?? 0.35;
      const bossOrigin = bossOriginY[bossTextureKey] ?? 1.0;
      if (this.scene.textures.exists(bossTextureKey)) {
        enemy.setTexture(bossTextureKey);
        enemy.setFrame(0);
        enemy.setScale(bossScale);
        enemy.setOrigin(0.5, bossOrigin);
        enemy.setDepth(10);
        enemy.setAlpha(1);
        enemy.clearTint();
        const runAnim = `${bossTextureKey}_run`;
        if (this.scene.anims.exists(runAnim)) enemy.play(runAnim, true);
      } else {
        enemy.setTexture('__DEFAULT');
        enemy.setDisplaySize(bossSize, bossSize);
        enemy.setOrigin(0.5, 1.0);
        enemy.setDepth(10);
        enemy.setAlpha(1);
        enemy.setTint(bossTemplate.color || 0xff0000);
      }
    } else {
      const sprEntry = ENEMY_SPRITE_REGISTRY[type];
      if (sprEntry && this.scene.textures.exists(sprEntry.textureKey)) {
        enemy.setTexture(sprEntry.textureKey);
        // ВАЖНО: при реюзе из пула мог остаться frame от другой текстуры
        enemy.setFrame(0);
        // scale выставляется ПОСЛЕ body.setSize ниже — не здесь
        enemy.setDepth(10);
        enemy.setAlpha(1);
        enemy.clearTint();
        (enemy as any).skipCull = true;
        // После окончания attack — возвращаемся на run (и текстуру если шиты раздельные)
        enemy.off('animationcomplete');
        enemy.on('animationcomplete', (anim: any) => {
          const rk = `${sprEntry.textureKey}_run`;
          if (anim.key === `${sprEntry.textureKey}_attack` && this.scene.anims.exists(rk)) {
            if ((sprEntry as any).textureKeyAtk) enemy.setTexture(sprEntry.textureKey);
            enemy.play(rk, true);
          }
        });
        const runKey = `${sprEntry.textureKey}_run`;
        if (this.scene.anims.exists(runKey)) enemy.play(runKey, true);
      } else {
        // Текстура не найдена — рендерим заметный цветной квадрат-заглушку
        console.warn(`[EnemyManager] Missing texture for type="${type}", key="${sprEntry?.textureKey ?? 'unknown'}". Using colored placeholder.`);
        enemy.setTexture('__DEFAULT');
        enemy.setDisplaySize(40, 40);  // явный размер — иначе 1×1 пиксель невидим
        enemy.setAlpha(1);
        enemy.setTint(eliteAffix ? eliteAffix.color : (template.color ?? 0xff00ff));
      }
    }
    // ─────────────────────────────────────────────────────────────────────
    const diameter = template.size * 2;
    if (enemy.body) {
      const sprEntry = isBoss ? null : ENEMY_SPRITE_REGISTRY[type];
      if (sprEntry) {
        // Для спрайтовых врагов: центрируем хитбокс относительно нативного фрейма.
        // body.setSize / setOffset работают в нативных (до масштаба) пикселях,
        // поэтому делим world-diameter на scale, чтобы получить нативный размер.
        // ВАЖНО: setScale вызывается здесь, после body.setSize — иначе пул объектов
        // может передать спрайт с чужим scale, что ломает хитбокс и визуал.
        enemy.setScale(sprEntry.scale);
        // TANK_BRUTE gets smaller from wave 10 onward
        if (type === 'TANK_BRUTE' && this.waveState.currentWave >= 10) {
          const reduction = Math.min(0.20, (this.waveState.currentWave - 9) * 0.02);
          enemy.setScale(sprEntry.scale - reduction);
        }
        const nativeBodySize = diameter / sprEntry.scale;
        const offsetX = (sprEntry.frameWidth  - nativeBodySize) / 2;
        const offsetY = (sprEntry.frameHeight - nativeBodySize) / 2;
        enemy.body.setSize(nativeBodySize, nativeBodySize, false);
        enemy.body.setOffset(offsetX, offsetY);
        // Общая "подошва" — чтобы разные спрайты стояли на одном уровне
        enemy.setOrigin(0.5, 0.85);
      } else {
        enemy.body.setSize(diameter, diameter, true);
        enemy.setOrigin(0.5, 0.5);
      }
      enemy.body.allowGravity = false;
      enemy.body.pushable = false;
    }
    // показываем только после настройки (и после scale/body reset)
    enemy.setActive(true).setVisible(true).setAlpha(1);
    const displayColor = eliteAffix ? eliteAffix.color : template.color;
    enemy.setData('baseColor', displayColor);

    const baseStats = {
      isBoss,
      name: isBoss ? template.name : (eliteAffix ? `${eliteAffix.name} ${type}` : type),
      hp: template.baseHP * hpMult,
      maxHp: template.baseHP * hpMult,
      damage: template.baseDamage * dmgMult,
      baseDamage: template.baseDamage * dmgMult,
      speed: Math.round(template.speed * spdMult),
      baseSpeed: Math.round(template.speed * spdMult),
      xp: template.xpReward * xpMult,
      gold: (template.goldReward || 0) * goldMult,
      behavior: template.behavior || 'CHASE',
      attackRange: template.attackRange || 0,
      attackRate: template.attackRate || 0,
      projectileSpeed: template.projectileSpeed || 0,
      explosionRadius: (template as any).explosionRadius || 0,
      frontArmor: (template as any).frontArmor || 0,
      eliteAffix: eliteAffix || null,
      lastAttack: 0,
      lastHit: 0,
      // Status effects map: effectId → { endTime, tickTime, dps, ... }
      statusEffects: {},
      facingAngle: 0   // for SHIELDER front-armor direction
    };

    enemy.setData('stats', baseStats);
    // Store original color for hit-flash restoration
    enemy.setData('baseColor', displayColor);

    if (isBoss) {
       enemy.setData('bossData', {
          phases: template.phases,
          thresholds: template.phaseThresholds,
          currentPhase: 0,
          abilities: template.abilities,
          timers: Object.fromEntries(template.abilities.map(a => [a, Phaser.Math.Between(4000, 8000)])),
          state: 'IDLE',
          stateTimer: 0
       });
       this.scene.cameras.main.flash(1000, 100, 0, 0);

       // Boss announcement banner
       const bossName = template.name;
       const bossAnnounce = this.scene.add.text(
         this.scene.cameras.main.centerX,
         this.scene.cameras.main.centerY,
         `⚠ ${bossName} ⚠`,
         { fontFamily: 'Pirata One', fontSize: '72px', color: '#ff0000', stroke: '#000', strokeThickness: 8 }
       ).setOrigin(0.5).setScrollFactor(0).setDepth(3100).setAlpha(0);
       this.scene.tweens.add({
         targets: bossAnnounce, alpha: 1, y: '-=80', duration: 600, hold: 2000,
         onComplete: () => { this.scene.tweens.add({ targets: bossAnnounce, alpha: 0, duration: 500, onComplete: () => bossAnnounce.destroy() }); }
       });
    }

    return enemy;
  }

  // Главный апдейт врагов: спаун по очереди, ИИ поведения, выстрелы и логика боссов
  update(time, delta, playerSprite) {
    if (this.waveState.status === 'SPAWNING') {
       this.waveState.spawnTimer += delta;
       while (this.waveState.spawnQueue.length > 0 &&
              this.waveState.spawnTimer >= this.waveState.spawnQueue[0].spawnTime) {
          const spawn = this.waveState.spawnQueue[0];
          const spawned = this.spawnEnemy(spawn.type, this.waveState.config.multipliers);
          // Удаляем из очереди только если спавн прошёл (или пул полон — иначе зависнем навсегда)
          this.waveState.spawnQueue.shift();
          if (spawned === null) {
            // Пул переполнен — попробуем снова через 200 мс, вернём в голову очереди
            // Чтобы не зависнуть: если пул реально полон, просто пропускаем этого врага
            console.warn(`[EnemyManager] Skipping spawn of type=${spawn.type} — pool full`);
          }
       }
       // All queued — switch to ACTIVE so wave-completion can trigger
       if (this.waveState.spawnQueue.length === 0) {
         if (this.waveState.status === 'SPAWNING') {
           this.waveState.status = 'ACTIVE';
           if (this.waveState.pendingBoss) {
             const bossKey = this.waveState.pendingBoss;
             this.waveState.pendingBoss = null;
             this.spawnEnemy('BOSS', this.waveState.config.multipliers, true, bossKey);
           }
         }
       }
    }

    // Clean up enemy projectiles that flew off-screen
    const cam = this.scene.cameras.main;
    const pad = 300;
    const camMinX = cam.worldView.x - pad, camMaxX = cam.worldView.x + cam.worldView.width + pad;
    const camMinY = cam.worldView.y - pad, camMaxY = cam.worldView.y + cam.worldView.height + pad;
    this.projectiles.getChildren().forEach((ep: any) => {
      if (!ep.active) return;
      if (ep.x < camMinX || ep.x > camMaxX || ep.y < camMinY || ep.y > camMaxY) {
        ep.setActive(false).setVisible(false);
        ep.body.enable = false;
      }
    });
    // Очистка стрел лучника
    this.arrowProjectiles.getChildren().forEach((arrow: any) => {
      if (!arrow.active) return;
      if (arrow.x < camMinX || arrow.x > camMaxX || arrow.y < camMinY || arrow.y > camMaxY) {
        arrow.setActive(false).setVisible(false);
        arrow.body.enable = false;
      }
    });

    this.allEnemies().forEach((e: any) => {
      if (!e.active) return;
      const stats = e.getData('stats');
      if (!stats) return;

      // ── Анимация спрайта врага (только Sprite-объекты) ─────────────
      if (typeof e.setFlipX === 'function') {
        e.x = Math.round(e.x); e.y = Math.round(e.y);
        const vx = e.body?.velocity?.x ?? 0;
        if (vx < -5) e.setFlipX(true); else if (vx > 5) e.setFlipX(false);
        if (!stats.isBoss) {
          const eType = e.getData('enemyType');
          const sprEntry = eType ? ENEMY_SPRITE_REGISTRY[eType] : null;
          const runKey = sprEntry ? `${sprEntry.textureKey}_run`    : 'enemy_grunt_run';
          const atkKey = sprEntry ? `${sprEntry.textureKey}_attack` : 'enemy_grunt_attack';
          const atkTexKey = sprEntry ? ((sprEntry as any).textureKeyAtk || sprEntry.textureKey) : sprEntry?.textureKey;
          const gDist = Phaser.Math.Distance.Between(e.x, e.y, playerSprite.x, playerSprite.y);
          const inRange = gDist < (stats.attackRange || 0) + 60;
          const curKey = e.anims?.currentAnim?.key;
          const isPlaying = e.anims?.isPlaying;
          if (typeof e.play === 'function') {
            if (inRange) {
              if (curKey !== atkKey && this.scene.anims.exists(atkKey)) {
                if (atkTexKey && e.texture.key !== atkTexKey) e.setTexture(atkTexKey);
                e.play(atkKey, true);
              }
            } else {
              if (!(curKey === atkKey && isPlaying) && curKey !== runKey && this.scene.anims.exists(runKey)) {
                if (sprEntry && (sprEntry as any).textureKeyAtk && e.texture.key !== sprEntry.textureKey) e.setTexture(sprEntry.textureKey);
                e.play(runKey, true);
              }
            }
            if (curKey === atkKey && !isPlaying && this.scene.anims.exists(runKey)) {
              if (sprEntry && (sprEntry as any).textureKeyAtk && e.texture.key !== sprEntry.textureKey) e.setTexture(sprEntry.textureKey);
              e.play(runKey, true);
            }
          }
        }
      }
      // ──────────────────────────────────────────────────────────────────
      if (stats.hp <= 0) {
        this.scene.events.emit('enemy_killed_by_dot', e);
        return;
      }

      // --- Process status effects ---
      this.processStatusEffects(e, stats, time, delta);

      const isFrozen  = !!stats.statusEffects['FROZEN'];
      const isStunned = !!stats.statusEffects['STUNNED'];
      if (isFrozen || isStunned) {
        e.body.setVelocity(0, 0);
      }

      // --- Elite regeneration ---
      if (stats.eliteAffix?.regenPerSec) {
        stats.hp = Math.min(stats.maxHp, stats.hp + stats.maxHp * stats.eliteAffix.regenPerSec * (delta / 1000));
      }

      const dist = Phaser.Math.Distance.Between(playerSprite.x, playerSprite.y, e.x, e.y);

    if (stats.isBoss) {
       this.handleBossLogic(e, time, delta, playerSprite);

       // Draw boss HP bar above the boss
       const barW = 120, barH = 8;
       const bx = e.x - barW / 2;
       const by = e.y - ((e.originY ?? 1.0) * e.displayHeight) - 12;
       const hpFrac = Math.max(0, stats.hp / stats.maxHp);
       if (!e.getData('hpBarBg')) {
         const bg = this.scene.add.rectangle(0, 0, barW, barH, 0x330000).setDepth(500).setOrigin(0, 0.5);
         const fill = this.scene.add.rectangle(0, 0, barW, barH, 0xff2222).setDepth(501).setOrigin(0, 0.5);
         const label = this.scene.add.text(0, 0, stats.name, { fontSize: '13px', color: '#ff4444', fontFamily: 'monospace' }).setDepth(502).setOrigin(0.5, 1);
         e.setData('hpBarBg', bg);
         e.setData('hpBarFill', fill);
         e.setData('hpBarLabel', label);
       }
       const bg = e.getData('hpBarBg');
       const fill = e.getData('hpBarFill');
       const lbl = e.getData('hpBarLabel');
       if (bg) { bg.x = bx; bg.y = by; }
       if (fill) { fill.x = bx; fill.y = by; fill.width = barW * hpFrac; }
       if (lbl) { lbl.x = e.x; lbl.y = by - 6; lbl.setText(`${stats.name}  ${Math.ceil(stats.hp)}/${stats.maxHp}`); }
    } else if (!isFrozen && !isStunned) {
        // Телепорт если враг застрял слишком далеко от игрока
        if (dist > 1800 && !stats.isBoss) {
          const angle = Math.random() * Math.PI * 2;
          const tpDist = 600 + Math.random() * 200;
          e.x = Phaser.Math.Clamp(playerSprite.x + Math.cos(angle) * tpDist, 50, 3950);
          e.y = Phaser.Math.Clamp(playerSprite.y + Math.sin(angle) * tpDist, 50, 3950);
        }
        if (stats.behavior === 'CHASE') {
          this.scene.physics.moveToObject(e, playerSprite, stats.speed);
        } else if (stats.behavior === 'KITE') {
          const ideal = stats.attackRange * 0.8;
          if (dist < ideal) {
            const angle = Phaser.Math.Angle.Between(playerSprite.x, playerSprite.y, e.x, e.y);
            e.body.setVelocity(Math.cos(angle) * stats.speed, Math.sin(angle) * stats.speed);
          } else if (dist > stats.attackRange) {
            this.scene.physics.moveToObject(e, playerSprite, stats.speed);
          } else {
            e.body.setVelocity(0);
          }
        } else if (stats.behavior === 'SUMMONER') {
          // Tries to stay at max range
          const keepRange = stats.attackRange * 0.9;
          if (dist < keepRange) {
            const angle = Phaser.Math.Angle.Between(playerSprite.x, playerSprite.y, e.x, e.y);
            e.body.setVelocity(Math.cos(angle) * stats.speed, Math.sin(angle) * stats.speed);
          } else {
            e.body.setVelocity(0);
          }
        } else if (stats.behavior === 'MIXED') {
          this.scene.physics.moveToObject(e, playerSprite, stats.speed);
        }

        // Track facing angle for SHIELDER
        if (stats.behavior === 'CHASE' || stats.behavior === 'MIXED') {
          stats.facingAngle = Phaser.Math.Angle.Between(e.x, e.y, playerSprite.x, playerSprite.y);
        }
      }

      // --- Ranged attacks ---
      if (stats.attackRange > 0 && dist < stats.attackRange && time - stats.lastAttack > stats.attackRate) {
        if (stats.behavior === 'SUMMONER') {
          // Summon 1-2 Melee Grunts nearby
          const count = Math.random() < 0.4 ? 2 : 1;
          for (let i = 0; i < count; i++) {
            const sx = e.x + Phaser.Math.Between(-60, 60);
            const sy = e.y + Phaser.Math.Between(-60, 60);
            const minion: any = this.group.get(sx, sy);
            if (minion) {
              // Миньоны тоже из пула — обязателен reset, иначе наследуют scale/frame/offset
              this.resetPooledEnemySprite(minion, sx, sy);
              minion.setActive(true).setVisible(true).setAlpha(1);
              const mt = ENEMY_TEMPLATES.MELEE_GRUNT;
              if (minion.body) {
                minion.body.setSize(mt.size * 2, mt.size * 2, true);
                minion.body.setOffset(0, 0);
              }
              minion.setTint(0xaa44ff);
              minion.setData('enemyType', 'MELEE_GRUNT');
              if (this.scene.textures.exists('enemy_grunt')) {
                minion.setTexture('enemy_grunt');
                minion.setFrame(0);
                // Используем реестр, чтобы не было "рандомного" масштаба
                const se = ENEMY_SPRITE_REGISTRY.MELEE_GRUNT;
                minion.setScale(se?.scale ?? 0.15);
                minion.setOrigin(0.5, 0.85);
                const rk = `${se.textureKey}_run`;
                if (this.scene.anims.exists(rk)) minion.play(rk, true);
              }
              const ms = { ...this.waveState.config?.multipliers };
              minion.setData('stats', {
                isBoss: false, isMinion: true, name: 'Minion', hp: mt.baseHP * (ms.hp || 1) * 0.5,
                maxHp: mt.baseHP * (ms.hp || 1) * 0.5, damage: mt.baseDamage * (ms.damage || 1),
                baseDamage: mt.baseDamage * (ms.damage || 1), speed: mt.speed * 1.1,
                baseSpeed: mt.speed * 1.1, xp: mt.xpReward * 0.3, gold: 1,
                behavior: 'CHASE', attackRange: 0, attackRate: 0, projectileSpeed: 0,
                explosionRadius: 0, frontArmor: 0, eliteAffix: null,
                lastAttack: 0, lastHit: 0, statusEffects: {}, facingAngle: 0
              });
              minion.setData('baseColor', 0xaa44ff);
              // Summon VFX
              const ring = (this.scene.add as any).ellipse(sx, sy, 60, 60, 0x7c3aed, 0).setDepth(120).setStrokeStyle(2, 0x7c3aed);
              this.scene.tweens.add({ targets: ring, scaleX: 2, scaleY: 2, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
            }
          }
        } else if (stats.projectileSpeed > 0) {
          const eType = e.getData('enemyType');
          if (eType === 'RANGED_ARCHER') {
            // Стрела — спрайт с поворотом в сторону игрока
            const arrow: any = this.arrowProjectiles.get(e.x, e.y);
            if (arrow) {
              arrow.setActive(true).setVisible(true);
              arrow.setTexture('arrow');
              arrow.setDepth(50);
              const dx = playerSprite.x - e.x;
              const dy = playerSprite.y - e.y;
              const angle = Math.atan2(dy, dx);
              arrow.setRotation(angle);
              arrow.setData('damage', stats.damage);
              const spd = stats.projectileSpeed;
              arrow.body.enable = true;
              arrow.body.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
            }
          } else {
            const ep: any = this.projectiles.get(e.x, e.y);
            if (ep) {
              ep.setActive(true).setVisible(true);
              ep.setSize(12, 12).setFillStyle(MAGIC_COLORS.ENEMY_PROJ);
              ep.setData('damage', stats.damage);
              this.scene.physics.moveToObject(ep, playerSprite, stats.projectileSpeed);
            }
          }
        }
        stats.lastAttack = time;
      }
    });
  }

  // Тики статусов (горение, яд, заморозка и т.д.) и их снятие
  processStatusEffects(enemy, stats, time, delta) {
    const toDelete: string[] = [];
    for (const [effectId, effect] of Object.entries(stats.statusEffects) as any) {
      if (time > effect.endTime) {
        toDelete.push(effectId);
        continue;
      }
      if (effectId === 'FROZEN') {
        stats.speed = stats.baseSpeed * STATUS_EFFECTS.FROZEN.slowFactor;
      }
      if ((effectId === 'BURNING' || effectId === 'POISONED') && effect.nextTick && time > effect.nextTick) {
        stats.hp -= effect.dps * (delta / 1000) * effect.tickInterval / 1000;
        effect.nextTick = time + effect.tickInterval;
      }
    }
    for (const id of toDelete) {
      delete stats.statusEffects[id];
      if (id === 'FROZEN' || id === 'STUNNED') stats.speed = stats.baseSpeed;
    }
  }

  // Ellipse shapes don't have setTint/clearTint — use setFillStyle instead
  // Унифицированно красим врага, независимо от типа объекта (Ellipse / Sprite)
  tintEnemy(enemy: any, color: number) {
    if (!enemy?.active) return;
    if (typeof enemy.setTint === 'function') {
      enemy.setTint(color);
    } else if (typeof enemy.setTint === 'function') {
      enemy.setTint(color);
    }
  }

  // Сбрасываем цвет врага к сохранённому базовому цвету
  clearTintEnemy(enemy: any) {
    if (!enemy?.active) return;
    const stats = enemy.getData('stats');
    if (typeof enemy.clearTint === 'function') {
      enemy.clearTint();
    } else if (typeof enemy.clearTint === 'function') {
      enemy.clearTint();
    }
  }

  // Вешаем один статус-эффект на врага и планируем его визуальное окончание
  applyStatusEffect(enemy, effectId, params: any = {}, fromReaction = false) {
    const stats = enemy.getData('stats');
    if (!stats) return;
    const cfg = STATUS_EFFECTS[effectId];
    if (!cfg) return;

    const now = this.scene.time.now;

    // Special: WIND is a tag-only effect (no visual), used for elemental reactions
    if (effectId === 'WIND') {
      stats.statusEffects['WIND'] = { endTime: now + 4000 };
      if (!fromReaction) this.checkElementalReaction(enemy, stats, 'WIND', params);
      return;
    }

    stats.statusEffects[effectId] = {
      endTime: now + (params.duration || cfg.duration),
      ...(cfg.tickInterval ? {
        tickInterval: cfg.tickInterval,
        nextTick: now + cfg.tickInterval,
        dps: params.dps || 10
      } : {}),
      ...(effectId === 'FROZEN' ? { slowFactor: cfg.slowFactor } : {})
    };

    // Visual: set status color, restore base color when effect ends
    this.tintEnemy(enemy, cfg.color);
    const duration = params.duration || cfg.duration;
    this.scene.time.delayedCall(duration, () => {
      this.clearTintEnemy(enemy);
    });

    // Only check reactions if not already inside one (prevents infinite recursion)
    if (!fromReaction) {
      this.checkElementalReaction(enemy, stats, effectId, params);
    }
  }

  // Проверяем, не сработала ли элементальная реакция от сочетания статусов
  checkElementalReaction(enemy, stats, newEffect: string, params: any = {}) {
    const active = Object.keys(stats.statusEffects);

    // Build all pairs of (newEffect + existing) and check reaction table
    for (const existing of active) {
      if (existing === newEffect) continue;

      // Key is always alphabetically sorted pair
      const key = [newEffect, existing].sort().join('+');
      const reaction = ELEMENTAL_REACTIONS[key];
      if (!reaction) continue;

      // REACTION TRIGGERED!
      this.triggerElementalReaction(enemy, stats, reaction, params.baseDamage || 30);
      break; // one reaction per hit
    }
  }

  // Обрабатываем конкретную реакцию: урон, контроль, VFX и вторичные эффекты
  triggerElementalReaction(enemy, stats, reaction: any, baseDamage: number) {
    if (!enemy.active) return;

    const x = enemy.x;
    const y = enemy.y;
    const scene = this.scene;

    // --- Floating reaction name banner ---
    const label = scene.add.text(x, y - 40, `${reaction.icon} ${reaction.name}`, {
      fontFamily: 'Pirata One',
      fontSize: '22px',
      color: '#' + reaction.color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(4000);
    scene.tweens.add({
      targets: label, y: y - 100, alpha: 0,
      duration: 1200, ease: 'Cubic.Out',
      onComplete: () => label.destroy()
    });

    // Flash the enemy in reaction color
    this.tintEnemy(enemy, reaction.color);
    scene.time.delayedCall(300, () => { this.clearTintEnemy(enemy); });

    // --- Instant burst damage ---
    const burstDmg = Math.floor(baseDamage * reaction.damageMult);
    stats.hp -= burstDmg;

    // Floating damage number
    const dmgTxt = scene.add.text(x + Phaser.Math.Between(-20, 20), y - 20, `-${burstDmg}`, {
      fontFamily: 'Pirata One', fontSize: '28px',
      color: '#' + reaction.color.toString(16).padStart(6, '0'),
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(4001);
    scene.tweens.add({
      targets: dmgTxt, y: y - 80, alpha: 0, duration: 800,
      onComplete: () => dmgTxt.destroy()
    });

    // --- VFX ring at enemy position ---
    const ring = (scene.add as any).ellipse(x, y, 60, 60, reaction.color, 0.0)
      .setDepth(160).setStrokeStyle(3, reaction.color, 1.0);
    scene.tweens.add({
      targets: ring,
      scaleX: reaction.aoeRadius ? reaction.aoeRadius / 30 : 4,
      scaleY: reaction.aoeRadius ? reaction.aoeRadius / 30 : 4,
      alpha: 0, duration: 600,
      onComplete: () => ring.destroy()
    });

    // --- Reaction-specific effects ---
    switch (reaction.id) {

      case 'SHATTER':
        // Stun the enemy
        stats.statusEffects['STUNNED'] = { endTime: scene.time.now + reaction.stunDuration };
        stats.speed = 0;
        // shake removed
        // Ice shards particle burst
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const shard = (scene.add as any).ellipse(x, y, 8, 16, 0x88eeff, 0.9).setDepth(161);
          scene.tweens.add({
            targets: shard,
            x: x + Math.cos(angle) * 80,
            y: y + Math.sin(angle) * 80,
            alpha: 0, scaleX: 0.3, scaleY: 0.3,
            duration: 500, onComplete: () => shard.destroy()
          });
        }
        // Remove conflicting effects
        delete stats.statusEffects['BURNING'];
        delete stats.statusEffects['FROZEN'];
        break;

      case 'FROZEN_SHOCK':
        // Stun + chain to nearby enemies
        stats.statusEffects['STUNNED'] = { endTime: scene.time.now + reaction.stunDuration };
        stats.speed = 0;
        // Chain lightning arcs to nearby enemies
        const chainRadius = reaction.chainRadius || 180;
        const chainDmg = Math.floor(burstDmg * reaction.chainDamageMult);
        this.allEnemies().forEach((other: any) => {
          if (!other.active || other === enemy) return;
          if (Phaser.Math.Distance.Between(x, y, other.x, other.y) < chainRadius) {
            const otherStats = other.getData('stats');
            if (!otherStats) return;
            otherStats.hp -= chainDmg;
            // Arc VFX
            const arc = (scene.add as any).graphics().setDepth(200);
            arc.lineStyle(2, 0x00ffff, 0.9);
            arc.lineBetween(x, y, other.x, other.y);
            scene.time.delayedCall(150, () => arc.destroy());
            // Stun chained enemies briefly
            otherStats.statusEffects['STUNNED'] = { endTime: scene.time.now + 800 };
          }
        });
        delete stats.statusEffects['FROZEN'];
        delete stats.statusEffects['STUNNED'];
        // shake removed
        break;

      case 'WILDFIRE':
        // Spread fire to all enemies in aoe radius
        const wfRadius = reaction.aoeRadius || 220;
        const wfBurnDps = reaction.burnDps || 20;
        // Big fire wave VFX
        const fireWave = (scene.add as any).ellipse(x, y, wfRadius * 2, wfRadius * 2, 0xff6600, 0.4).setDepth(155);
        scene.tweens.add({
          targets: fireWave, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 700,
          onComplete: () => fireWave.destroy()
        });
        // shake removed
        this.allEnemies().forEach((other: any) => {
          if (!other.active) return;
          if (Phaser.Math.Distance.Between(x, y, other.x, other.y) < wfRadius) {
            this.applyStatusEffect(other, 'BURNING', {
              duration: reaction.burnDuration || 4000,
              dps: wfBurnDps
            }, true); // fromReaction=true — no recursion
          }
        });
        delete stats.statusEffects['BURNING'];
        delete stats.statusEffects['WIND'];
        break;

      case 'TOXIC_BURST':
        // Poison explosion — spreads poison in aoe
        const tbRadius = reaction.aoeRadius || 160;
        const poisonWave = (scene.add as any).ellipse(x, y, tbRadius * 2, tbRadius * 2, 0x88ff44, 0.45).setDepth(155);
        scene.tweens.add({
          targets: poisonWave, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 600,
          onComplete: () => poisonWave.destroy()
        });
        // shake removed
        this.allEnemies().forEach((other: any) => {
          if (!other.active || other === enemy) return;
          if (Phaser.Math.Distance.Between(x, y, other.x, other.y) < tbRadius) {
            this.applyStatusEffect(other, 'POISONED', { duration: 3000, dps: 18 }, true);
          }
        });
        delete stats.statusEffects['POISONED'];
        delete stats.statusEffects['STUNNED'];
        break;

      case 'PLAGUE_FIRE':
        // Amplify existing poison DPS × poisonMult
        if (stats.statusEffects['POISONED']) {
          stats.statusEffects['POISONED'].dps *= (reaction.poisonMult || 3.0);
          stats.statusEffects['POISONED'].endTime += (reaction.poisonExtend || 3000);
        }
        // Smoky green-orange VFX
        for (let i = 0; i < 5; i++) {
          const smoke = (scene.add as any).ellipse(
            x + Phaser.Math.Between(-20, 20),
            y + Phaser.Math.Between(-20, 20),
            20, 20, 0xaaff00, 0.6
          ).setDepth(158);
          scene.tweens.add({
            targets: smoke, y: smoke.y - 50, alpha: 0, scaleX: 2, scaleY: 2,
            duration: 700 + i * 80, onComplete: () => smoke.destroy()
          });
        }
        delete stats.statusEffects['BURNING'];
        break;
    }

    // If enemy died from reaction damage — will be caught by hp≤0 check in main loop
  }


  // Общий ИИ босса: фазы по HP и выбор моментов для способностей
  handleBossLogic(boss, time, delta, player) {
     const stats = boss.getData('stats');
     const bossData = boss.getData('bossData');
     if (!bossData) return;

     const hpPercent = stats.hp / stats.maxHp;
     if (bossData.currentPhase < bossData.phases.length - 1) {
        const nextThreshold = bossData.thresholds[bossData.currentPhase + 1];
        if (hpPercent <= nextThreshold) {
           bossData.currentPhase++;
           const phaseConfig = bossData.phases[bossData.currentPhase];
           stats.speed = stats.baseSpeed * (phaseConfig.speedMultiplier || 1);
           stats.damage = stats.baseDamage * (phaseConfig.damageMultiplier || 1);
        }
     }

     if (bossData.state === 'IDLE') {
        this.scene.physics.moveToObject(boss, player, stats.speed);
        for (const ability of bossData.abilities) {
           bossData.timers[ability] -= delta;
           if (bossData.timers[ability] <= 0) {
              this.executeBossAbility(boss, ability, player);
              return;
           }
        }
     }
  }

  private castChainLightningAbility(boss: any, bossData: any, stats: any, player: any) {
    // Dodgeable lightning: short telegraph, then a fast bolt to the locked target position
    bossData.state = 'CASTING';
    this.tintEnemy(boss, MAGIC_COLORS.LIGHTNING);

    const damage = stats.damage * 0.8;
    const originX = boss.x;
    const originY = boss.y;
    const rawTargetX = player.x;
    const rawTargetY = player.y;

    // Limit lightning cast radius so Nexarion can't snipe from across the whole map
    const maxLightningRange = 460;
    const dx = rawTargetX - originX;
    const dy = rawTargetY - originY;
    const dist = Math.hypot(dx, dy);
    const rangeScale = dist > maxLightningRange ? (maxLightningRange / dist) : 1;
    const targetX = originX + dx * rangeScale;
    const targetY = originY + dy * rangeScale;

    // Telegraph where lightning will strike so player can react
    const warn = (this.scene.add as any).ellipse(targetX, targetY, 92, 92, 0xff2200, 0.2)
      .setDepth(209)
      .setStrokeStyle(4, 0xff2200, 1);
    this.scene.tweens.add({ targets: warn, alpha: 0.95, scaleX: 1.6, scaleY: 1.6, duration: 360, yoyo: true, onComplete: () => warn.destroy() });

    // Visual lightning beam (jagged + impact flash) at cast moment
    const lightningArc = (this.scene.add as any).graphics().setDepth(210);
    const lightningGlow = (this.scene.add as any).graphics().setDepth(209);
    lightningArc.lineStyle(10, 0xff2200, 1);
    lightningGlow.lineStyle(20, 0xff2200, 0.38);
    lightningArc.beginPath();
    lightningGlow.beginPath();
    lightningArc.moveTo(originX, originY);
    lightningGlow.moveTo(originX, originY);
    const segments = 6;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const ix = Phaser.Math.Linear(originX, targetX, t) + Phaser.Math.Between(-16, 16);
      const iy = Phaser.Math.Linear(originY, targetY, t) + Phaser.Math.Between(-16, 16);
      lightningArc.lineTo(ix, iy);
      lightningGlow.lineTo(ix, iy);
    }
    lightningArc.lineTo(targetX, targetY);
    lightningGlow.lineTo(targetX, targetY);
    lightningArc.strokePath();
    lightningGlow.strokePath();
    this.scene.tweens.add({ targets: [lightningArc, lightningGlow], alpha: 0, duration: 300, onComplete: () => { lightningArc.destroy(); lightningGlow.destroy(); } });

    // Fire after a short delay to make the ability dodgeable
    this.scene.time.delayedCall(180, () => {
      if (!boss.active) return;

      const bolt: any = this.projectiles.get(originX, originY);
      if (bolt) {
        bolt.setActive(true).setVisible(true);
        bolt.body.reset(originX, originY);
        bolt.body.enable = true;
        bolt.body.setVelocity(0, 0);
        if (bolt.setSize) bolt.setSize(18, 18);
        if (bolt.setFillStyle) bolt.setFillStyle(0xff2200, 1);
        else if (bolt.setTint) bolt.setTint(0xff2200);
        bolt.setDepth?.(130);
        bolt.setData('damage', damage);
        bolt.setData('poison', false);

        const angle = Phaser.Math.Angle.Between(originX, originY, targetX, targetY);
        const speed = 560;
        bolt.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        // Impact flash at locked target point (visual only)
        const impactFlash = (this.scene.add as any).ellipse(targetX, targetY, 52, 52, 0xff2200, 0.6).setDepth(211);
        this.scene.tweens.add({ targets: impactFlash, alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 280, onComplete: () => impactFlash.destroy() });

        // Despawn after travel time if it didn't hit anything
        const travelTime = Math.min(900, Math.max(280, (Math.hypot(targetX - originX, targetY - originY) / speed) * 1000 + 100));
        this.scene.time.delayedCall(travelTime, () => {
          if (!bolt.active) return;
          bolt.setActive(false).setVisible(false);
          if (bolt.body) bolt.body.enable = false;
        });
      }
    });

    this.scene.time.delayedCall(300, () => {
      if (boss.active) { this.clearTintEnemy(boss); bossData.state = 'IDLE'; }
    });
    bossData.timers['CHAIN_LIGHTNING'] = 4500;
  }

  private castTeleportAbility(boss: any, bossData: any, player: any) {
    // Teleports behind the player with telegraph + short recovery so player can react
    bossData.state = 'TELEPORTING';
    boss.body?.setVelocity?.(0, 0);

    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y) + Math.PI;
    const destinationX = Phaser.Math.Clamp(player.x + Math.cos(angle) * 170, 80, WORLD_SIZE - 80);
    const destinationY = Phaser.Math.Clamp(player.y + Math.sin(angle) * 170, 80, WORLD_SIZE - 80);

    const marker = (this.scene.add as any).ellipse(destinationX, destinationY, 44, 44, 0xff3355, 0.12)
      .setDepth(140)
      .setStrokeStyle(2, 0xff3355, 0.8);
    this.scene.tweens.add({ targets: marker, alpha: 0.9, scaleX: 1.8, scaleY: 1.8, duration: 260, yoyo: true, onComplete: () => marker.destroy() });

    this.scene.tweens.add({ targets: boss, alpha: 0, duration: 260, onComplete: () => {
      if (!boss.active) return;
      boss.x = destinationX;
      boss.y = destinationY;
      this.scene.tweens.add({ targets: boss, alpha: 1, duration: 260 });

      // Give player a brief escape window after teleport before contact damage can tick again
      boss.setData('lastContactDamageAt', this.scene.time.now + 450);
      bossData.state = 'RECOVERING';
      this.scene.time.delayedCall(520, () => {
        if (!boss.active) return;
        bossData.state = 'IDLE';
      });
    }});
    bossData.timers['TELEPORT'] = 9000;
  }

  // Конкретная реализация всех босс‑способностей (рывок, АоЕ, призыв, яд, молния, телепорт)
  executeBossAbility(boss, ability, player) {
     const bossData = boss.getData('bossData');
     const stats = boss.getData('stats');
     if (!bossData) return;

     // Play attack anim if boss has sprite
     const bossTextureKey = boss.texture?.key;
     const atkAnim = bossTextureKey ? `${bossTextureKey}_attack` : null;
     if (atkAnim && this.scene.anims.exists(atkAnim)) {
       boss.play(atkAnim, true);
       boss.once(`animationcomplete-${atkAnim}`, () => {
         const runAnim = `${bossTextureKey}_run`;
         if (boss.active && this.scene.anims.exists(runAnim)) boss.play(runAnim, true);
       });
     }

     switch(ability) {
        case 'CHARGE':
           bossData.state = 'CHARGING';
           this.tintEnemy(boss, MAGIC_COLORS.BOSS_CHARGE);
           this.scene.time.delayedCall(800, () => {
              if (!boss.active) return;
              const angle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
              boss.body.setVelocity(Math.cos(angle) * stats.speed * 4.5, Math.sin(angle) * stats.speed * 4.5);
              this.scene.time.delayedCall(1200, () => {
                 if (boss.active) {
                    boss.body.setVelocity(0);
                    bossData.state = 'IDLE';
                    this.clearTintEnemy(boss);
                    bossData.timers['CHARGE'] = 7000;
                 }
              });
           });
           break;

        case 'AOE_SLAM':
           bossData.state = 'SLAM';
           this.tintEnemy(boss, MAGIC_COLORS.BOSS_AOE);
           // Warning ring
           const warnRing = (this.scene.add as any).ellipse(boss.x, boss.y, 480, 480, 0x9900ff, 0.0)
             .setDepth(110).setStrokeStyle(3, 0x9900ff, 0.8);
           this.scene.tweens.add({ targets: warnRing, alpha: 1, scaleX: 1.2, scaleY: 1.2, duration: 900, onComplete: () => warnRing.destroy() });
           this.scene.time.delayedCall(1000, () => {
              if (boss.active) {
                 const dist = Phaser.Math.Distance.Between(boss.x, boss.y, player.x, player.y);
                 if (dist < 240) {
                    this.scene.events.emit('player_damaged', stats.damage * 1.5);
                    // shake removed
                 }
                 bossData.state = 'IDLE';
                 this.clearTintEnemy(boss);
                 bossData.timers['AOE_SLAM'] = 5000;
              }
           });
           break;

        case 'SUMMON_MINIONS':
           for (let i = 0; i < 3; i++) {
             const angle = (i / 3) * Math.PI * 2;
             const sx = boss.x + Math.cos(angle) * 120;
             const sy = boss.y + Math.sin(angle) * 120;
             this.spawnEnemy('MELEE_GRUNT', this.waveState.config?.multipliers || { hp: 1, damage: 1, speed: 1, xp: 1 });
           }
           bossData.timers['SUMMON_MINIONS'] = 10000;
           bossData.state = 'IDLE';
           break;

        case 'POISON_NOVA':
           // Fires 8 poison projectiles in all directions
           bossData.state = 'CASTING';
           this.tintEnemy(boss, MAGIC_COLORS.POISON);
           for (let i = 0; i < 8; i++) {
             const angle = (i / 8) * Math.PI * 2;
             const ep: any = this.projectiles.get(boss.x, boss.y);
             if (ep) {
               ep.setActive(true).setVisible(true);
               ep.setSize(18, 18).setFillStyle(MAGIC_COLORS.POISON);
               ep.setData('damage', stats.damage * 0.6);
               ep.setData('poison', true);
               const spd = 220;
               ep.body.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
             }
           }
           this.scene.time.delayedCall(400, () => {
             if (boss.active) { this.clearTintEnemy(boss); bossData.state = 'IDLE'; }
           });
           bossData.timers['POISON_NOVA'] = 6000;
           break;
        // Keep NEXARION-heavy abilities delegated to helpers to reduce merge-conflict surface.
        case 'CHAIN_LIGHTNING':
           this.castChainLightningAbility(boss, bossData, stats, player);
           break;

        case 'TELEPORT':
           this.castTeleportAbility(boss, bossData, player);
           break;

        default:
          bossData.timers[ability] = 5000;
          bossData.state = 'IDLE';
     }
  }
}

// Система лута: дроп с врагов, магнетизм и автоподбор
export class LootSystem {
  scene: Phaser.Scene;
  group: Phaser.Physics.Arcade.Group;

  // Сохраняем сцену, чтобы уметь спаунить физические объекты лута
  constructor(scene) {
    this.scene = scene;
  }

  // Пул эллипсов‑предметов, которые будут летать по карте
  create() {
    this.group = this.scene.physics.add.group({
      classType: Phaser.GameObjects.Ellipse
    });
  }

  // Спаун одного конкретного предмета лута указанного типа
  spawnDrop(type, amount, x, y) {
     const config = LOOT_CONFIG[type] || LOOT_CONFIG.XP;
     const drop: any = this.group.get(x, y);
     if (!drop) return;

     const r = config.radius;
     drop.setActive(true).setVisible(true);
     drop.setFillStyle(config.color);
     // Resize the ellipse geometry correctly for pooled objects
     drop.setSize(r * 2, r * 2);
     if (drop.geom) { drop.geom.setTo(0, 0, r * 2, r * 2); }
     drop.setData('loot', { type, amount, magnetRange: config.magnetRange, lifetime: 0 });
     drop.body.enable = true;
     drop.body.setSize(r * 2, r * 2);
     drop.body.reset(x, y);
     const scatterAngle = Math.random() * Math.PI * 2;
     const scatterSpeed = Phaser.Math.Between(50, 150);
     drop.body.setVelocity(Math.cos(scatterAngle) * scatterSpeed, Math.sin(scatterAngle) * scatterSpeed);
     drop.body.setDrag(150);
  }

  // Генерация набора дропа с одного врага (XP, золото, гемы, хилки)
  spawnEnemyLoot(enemy, x, y, playerHpRatio, waveMultiplier = 1) {
    const stats = enemy.getData('stats');
    
    // XP: 100%
    this.spawnDrop('XP', Math.floor(stats.xp * waveMultiplier), x, y);

    // GOLD: 60%
    if (Math.random() < 0.6) {
      this.spawnDrop('GOLD', stats.gold || 5, x, y);
    }

    // GEM: 5%
    if (Math.random() < 0.05) {
      this.spawnDrop('GEM', 1, x, y);
    }

    // HP: 3% + (1 - playerHP/maxHP) * 10%
    const hpChance = 0.03 + (1 - playerHpRatio) * 0.1;
    if (Math.random() < hpChance) {
      this.spawnDrop('HP', 15, x, y);
    }
  }

  // Обновление лута: затухание скорости, притягивание к игроку и автоподбор
  update(delta, playerManager) {
      const playerSprite = playerManager.sprite;
      const playerStats = playerManager.stats;
      // Pickup range bonus based on stats
      const playerBonus = Math.max(0, playerStats.pickupRange - 160);

      this.group.getChildren().forEach((item: any) => {
         if (!item.active) return;
         const data = item.getData('loot');
         if (!data) return;
         data.lifetime += delta;

         // Expire after 30 seconds
         if (data.lifetime > 30000) {
            item.setActive(false).setVisible(false);
            item.body.enable = false;
            return;
         }

         item.body.velocity.x *= 0.95;
         item.body.velocity.y *= 0.95;

         const dist = Phaser.Math.Distance.Between(item.x, item.y, playerSprite.x, playerSprite.y);
         const effectiveRange = (data.magnetRange || 80) + playerBonus;
         
         // Magnet effect — direct coordinate movement
         if (dist < effectiveRange) {
            const angle = Phaser.Math.Angle.Between(item.x, item.y, playerSprite.x, playerSprite.y);
            const magnetSpeed = 300 + (effectiveRange - dist) * 2;
            item.x += Math.cos(angle) * magnetSpeed * (delta / 1000);
            item.y += Math.sin(angle) * magnetSpeed * (delta / 1000);
         }

         // Pickup
         if (dist < 25) {
            this.scene.events.emit('loot_collected', data);
            item.setActive(false).setVisible(false);
            item.body.enable = false;
         }
      });
  }
}

// Менеджер боевых снарядов игрока
export class CombatManager {
    scene: Phaser.Scene;
    projectiles: Phaser.Physics.Arcade.Group;

    // Сохраняем ссылку на сцену для создания/движения снарядов
    constructor(scene) {
        this.scene = scene;
    }

    // Пул эллипсов‑снарядов игрока с ограничением по количеству
    create() {
        this.projectiles = this.scene.physics.add.group({ 
          classType: Phaser.GameObjects.Ellipse,
          maxSize: 150 
        });
    }

    // Создаёт один снаряд, запускает его к цели и возвращает объект
    spawnProjectile(x, y, target, damage, color = 0xff6600, speed = 800) {
        const p: any = this.projectiles.get(x, y);
        if (!p) return null;
        
        p.setActive(true).setVisible(true).setDepth(150);
        p.setSize(18, 18).setFillStyle(color);
        p.setData('damage', damage);
        p.setData('spawnTime', this.scene.time.now);
        p.body.reset(x, y);
        p.body.enable = true;
        // Большой хитбокс — компенсирует Shape physics desync
        p.body.setSize(36, 36);
        p.body.setOffset(-9, -9);
        const dx = target.x - x;
        const dy = target.y - y;
        const dist = Math.hypot(dx, dy) || 1;
        p.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        return p;
    }

    // Call every frame to kill projectiles that flew off-screen
    // Чистка снарядов: удаляем те, что улетели за экран или живут > 4 секунд
    update() {
        const now = this.scene.time.now;
        const cam = this.scene.cameras.main;
        const pad = 200;
        const minX = cam.worldView.x - pad, maxX = cam.worldView.x + cam.worldView.width  + pad;
        const minY = cam.worldView.y - pad, maxY = cam.worldView.y + cam.worldView.height + pad;

        this.projectiles.getChildren().forEach((p: any) => {
            if (!p.active) return;
            // Kill if out of camera view OR alive > 4 seconds
            if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY ||
                now - (p.getData('spawnTime') || 0) > 4000) {
                p.setActive(false).setVisible(false);
                p.body.enable = false;
                return;
            }
            // Снаряд летит строго по прямой — velocity задаётся один раз при спавне и не меняется
        });

        // Also clean enemy projectiles from EnemyManager
        // (accessed via scene event for decoupling)
    }
}
