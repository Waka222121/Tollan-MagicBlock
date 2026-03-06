// ─────────────────────────────────────────────────────────────────────────────
//  EnemySpriteRegistry.ts  —  чистый .ts без React
//  Импортируется в Game.ts и GameManagers.ts
//
//  Чтобы добавить спрайт для врага:
//    1. Положи PNG в public/assets/
//    2. Заполни assetPath и поменяй textureKey на уникальный
//    3. Укажи frameWidth / frameHeight / scale
// ─────────────────────────────────────────────────────────────────────────────

export interface EnemyAnimDef {
  start:     number;
  end:       number;
  frameRate: number;
}

export interface EnemySpriteEntry {
  enemyType:   string;   // ключ из ENEMY_TEMPLATES
  label:       string;   // читаемое имя
  textureKey:  string;   // ключ текстуры в Phaser
  assetPath:   string;   // путь к PNG (пустая строка = не загружать)
  frameWidth:  number;
  frameHeight: number;
  spacing?: number;
  scale:       number;
  anims: {
    run:    EnemyAnimDef;
    attack: EnemyAnimDef;
  };
}

export const ENEMY_SPRITE_REGISTRY: Record<string, EnemySpriteEntry> = {

  MELEE_GRUNT: {
    enemyType:   'MELEE_GRUNT',
    label:       'Melee Grunt',
    textureKey:  'enemy_grunt',
    assetPath:   'assets/enemy_grunt.png',
    frameWidth:  500,
    frameHeight: 700,
    scale:       0.14,
    anims: {
      run:    { start: 0, end: 3, frameRate: 8  },
      attack: { start: 4, end: 7, frameRate: 10 },
    },
  },

  // ── Ниже используют enemy_grunt как временный фоллбек ─────────────────
  // Замени textureKey + assetPath когда добавишь свой PNG в assets/

  RANGED_ARCHER: {
    enemyType:   'RANGED_ARCHER',
    label:       'Ranged Archer',
    textureKey:  'enemy_archer',
    assetPath:   'assets/enemy_archer.png',
    frameWidth:  500,
    frameHeight: 500,
    scale:       0.14,
    anims: {
      run:    { start: 0, end: 3, frameRate: 8  },
      attack: { start: 4, end: 7, frameRate: 10 },
    },
  },

  TANK_BRUTE: {
    enemyType:   'TANK_BRUTE',
    label:       'Tank Brute',
    textureKey:  'enemy_grunt',
    assetPath:   '',
    frameWidth:  500,
    frameHeight: 700,
    scale:       0.18,
    anims: {
      run:    { start: 0, end: 3, frameRate: 6  },
      attack: { start: 4, end: 7, frameRate: 8  },
    },
  },

  ELITE_DEMON: {
    enemyType:   'ELITE_DEMON',
    label:       'Elite Demon',
    textureKey:  'enemy_grunt',
    assetPath:   '',
    frameWidth:  500,
    frameHeight: 700,
    scale:       0.16,
    anims: {
      run:    { start: 0, end: 3, frameRate: 8  },
      attack: { start: 4, end: 7, frameRate: 10 },
    },
  },

  BOMBER: {
    enemyType:   'BOMBER',
    label:       'Void Bomber',
    textureKey:  'enemy_grunt',
    assetPath:   '',
    frameWidth:  500,
    frameHeight: 700,
    scale:       0.12,
    anims: {
      run:    { start: 0, end: 3, frameRate: 10 },
      attack: { start: 4, end: 7, frameRate: 12 },
    },
  },

  SUMMONER: {
    enemyType:   'SUMMONER',
    label:       'Shadow Summoner',
    textureKey:  'enemy_grunt',
    assetPath:   '',
    frameWidth:  500,
    frameHeight: 700,
    scale:       0.14,
    anims: {
      run:    { start: 0, end: 3, frameRate: 6  },
      attack: { start: 4, end: 7, frameRate: 8  },
    },
  },

  SHIELDER: {
    enemyType:   'SHIELDER',
    label:       'Iron Shielder',
    textureKey:  'enemy_grunt',
    assetPath:   '',
    frameWidth:  500,
    frameHeight: 700,
    scale:       0.15,
    anims: {
      run:    { start: 0, end: 3, frameRate: 7  },
      attack: { start: 4, end: 7, frameRate: 9  },
    },
  },
};
