/**
 * ============================================================
 *  SpriteConfig.ts — универсальный реестр спрайтов
 * ============================================================
 *
 *  КАК ДОБАВИТЬ НОВУЮ МОДЕЛЬКУ:
 *  1. Загрузи спрайтшит в Game.ts → preload()
 *  2. Добавь запись в SPRITE_CONFIGS ниже
 *  3. Всё остальное (масштаб, хитбокс, анимации, округление) — автоматически
 *
 *  Структура спрайтшита ожидается такая:
 *    Строка 0: idle    (frames 0..idleFrames-1)
 *    Строка 1: run     (следующие runFrames штук)
 *    Строка 2: cast/attack (следующие castFrames штук)
 *    ... доп. строки по желанию
 * ============================================================
 */

export interface AnimDef {
  key: string;         // имя анимации в Phaser, напр. 'wizard_idle'
  startFrame: number;  // индекс первого кадра в спрайтшите
  endFrame: number;    // индекс последнего кадра
  frameRate: number;   // fps анимации
  repeat: number;      // -1 = зациклить, 0 = один раз
}

export interface SpriteConfig {
  // --- Текстура ---
  textureKey: string;       // ключ спрайтшита, напр. 'wizard'
  frameWidth: number;       // ширина одного кадра в пикселях
  frameHeight: number;      // высота одного кадра в пикселях

  // --- Рендер ---
  scale: number;            // масштаб на экране (0.4 = 40% от оригинала)
  depth?: number;           // z-слой (по умолчанию 100)

  // --- Физический хитбокс (в координатах ДО масштабирования) ---
  hitboxW: number;          // ширина хитбокса
  hitboxH: number;          // высота хитбокса
  hitboxOffsetX: number;    // смещение хитбокса по X от левого края кадра
  hitboxOffsetY: number;    // смещение хитбокса по Y от верхнего края кадра

  // --- Анимации ---
  anims: AnimDef[];

  // --- Ключи стандартных состояний (для автопереключения) ---
  idleAnim?: string;        // имя анимации простоя
  runAnim?: string;         // имя анимации бега
  castAnim?: string;        // имя анимации атаки/каста

  // --- Округление позиции (anti-shake) ---
  roundPixels?: boolean;    // true по умолчанию — всегда включай!
}

// ============================================================
//  РЕЕСТР ВСЕХ СПРАЙТОВ
//  Добавляй сюда новые модельки — больше ничего менять не надо
// ============================================================
export const SPRITE_CONFIGS: Record<string, SpriteConfig> = {

  // ── Главный герой — Волшебник ──────────────────────────────
  wizard: {
    textureKey:   'wizard',
    frameWidth:   200,
    frameHeight:  280,
    scale:        0.4,         // итого ~80×112px на экране
    depth:        100,
    hitboxW:      80,
    hitboxH:      110,
    hitboxOffsetX: 60,
    hitboxOffsetY: 130,
    roundPixels:  true,
    anims: [
      { key: 'wizard_idle', startFrame: 0,  endFrame: 0,  frameRate: 6,  repeat: -1 },
      { key: 'wizard_run',  startFrame: 4,  endFrame: 7,  frameRate: 10, repeat: -1 },
      { key: 'wizard_cast', startFrame: 8,  endFrame: 11, frameRate: 10, repeat:  0 },
    ],
    idleAnim: 'wizard_idle',
    runAnim:  'wizard_run',
    castAnim: 'wizard_cast',
  },

  // ── Враг — Гоблин ──────────────────────────────────────────
  enemy_grunt: {
    textureKey:   'enemy_grunt',
    frameWidth:   500,
    frameHeight:  700,
    scale:        0.16,
    depth:        10,
    hitboxW:      60,
    hitboxH:      80,
    hitboxOffsetX: 220,
    hitboxOffsetY: 350,
    roundPixels:  true,
    anims: [
      { key: 'goblin_run',    startFrame: 0, endFrame: 3, frameRate: 8,  repeat: -1 },
      { key: 'goblin_attack', startFrame: 4, endFrame: 7, frameRate: 10, repeat:  0 },
    ],
    idleAnim: 'goblin_run',
    runAnim:  'goblin_run',
    castAnim: 'goblin_attack',
  },

  // ── ШАБЛОН для новой модельки — скопируй и заполни ────────
  // new_hero: {
  //   textureKey:    'new_hero',      // ключ из this.load.spritesheet(...)
  //   frameWidth:    128,             // ширина одного кадра
  //   frameHeight:   128,             // высота одного кадра
  //   scale:         0.5,             // подбери под нужный размер
  //   depth:         100,
  //   hitboxW:       40,              // хитбокс уже самого спрайта
  //   hitboxH:       60,
  //   hitboxOffsetX: 44,              // (frameWidth - hitboxW) / 2
  //   hitboxOffsetY: 68,              // frameHeight - hitboxH - небольшой отступ снизу
  //   roundPixels:   true,            // ВСЕГДА true — убирает тряску
  //   anims: [
  //     { key: 'new_hero_idle', startFrame: 0, endFrame: 3, frameRate: 6,  repeat: -1 },
  //     { key: 'new_hero_run',  startFrame: 4, endFrame: 7, frameRate: 10, repeat: -1 },
  //     { key: 'new_hero_cast', startFrame: 8, endFrame: 11, frameRate: 10, repeat: 0 },
  //   ],
  //   idleAnim: 'new_hero_idle',
  //   runAnim:  'new_hero_run',
  //   castAnim: 'new_hero_cast',
  // },
};

// ============================================================
//  УТИЛИТЫ — используются в PlayerManager и EnemyManager
// ============================================================

/**
 * Регистрирует все анимации из конфига в Phaser (если ещё не созданы).
 * Вызывать один раз после загрузки текстуры, напр. в create().
 */
export function registerAnims(scene: Phaser.Scene, cfg: SpriteConfig): void {
  for (const anim of cfg.anims) {
    if (!scene.anims.exists(anim.key)) {
      scene.anims.create({
        key:       anim.key,
        frames:    scene.anims.generateFrameNumbers(cfg.textureKey, {
          start: anim.startFrame,
          end:   anim.endFrame,
        }),
        frameRate: anim.frameRate,
        repeat:    anim.repeat,
      });
    }
  }
}

/**
 * Применяет масштаб, хитбокс и глубину к спрайту по конфигу.
 * Вызывать сразу после создания спрайта.
 */
export function applyPhysicsConfig(sprite: any, cfg: SpriteConfig): void {
  sprite.setScale(cfg.scale);
  sprite.setDepth(cfg.depth ?? 100);
  sprite.body.setSize(cfg.hitboxW, cfg.hitboxH, false);
  sprite.body.setOffset(cfg.hitboxOffsetX, cfg.hitboxOffsetY);
}

/**
 * Округляет позицию спрайта до целого пикселя.
 * Вызывать каждый кадр в update() — убирает субпиксельное дрожание.
 */
export function snapToPixel(sprite: any): void {
  sprite.x = Math.round(sprite.x);
  sprite.y = Math.round(sprite.y);
}

/**
 * Переключает анимацию idle ↔ run в зависимости от движения.
 * Не прерывает анимацию каста.
 */
export function updateMoveAnim(
  sprite: any,
  cfg: SpriteConfig,
  isMoving: boolean,
  isCasting: boolean,
): void {
  if (isCasting) return;
  if (!cfg.idleAnim || !cfg.runAnim) return;

  const cur = sprite.anims?.currentAnim?.key;

  if (isMoving && cur !== cfg.runAnim) {
    sprite.play(cfg.runAnim, true);
  } else if (!isMoving && cur !== cfg.idleAnim) {
    sprite.play(cfg.idleAnim, true);
  }
}

/**
 * Запускает анимацию каста один раз и возвращает управление idle/run по окончании.
 * Использует флаг _castingAnim на самом спрайте — не нужно хранить отдельно.
 */
export function playCastAnim(sprite: any, cfg: SpriteConfig): void {
  try {
    if (sprite._castingAnim) return;
    if (!cfg.castAnim) return;
    if (!sprite?.active) return;

    sprite._castingAnim = true;
    sprite.play(cfg.castAnim, true);
    sprite.once(`animationcomplete-${cfg.castAnim}`, () => {
      sprite._castingAnim = false;
    });
  } catch (e) {
    sprite._castingAnim = false;
  }
}
