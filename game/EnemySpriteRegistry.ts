// ─────────────────────────────────────────────────────────────────────────────
//  EnemySpriteRegistry.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface EnemyAnimDef {
  start:     number;
  end:       number;
  frameRate: number;
}

export interface EnemySpriteEntry {
  enemyType:    string;
  label:        string;
  textureKey:   string;
  textureKeyAtk?: string;   // отдельная текстура для attack (если шиты разделены)
  assetPath:    string;
  assetPathAtk?: string;    // путь к attack-шиту
  frameWidth:   number;
  frameHeight:  number;
  spacing?: number;
  scale:        number;
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
    // Измерено: sheet 2000x1400 → 4x2 кадра → frame 500x700
    // row 0 (frames 0–3): run | row 1 (frames 4–7): attack
    frameWidth:  500,
    frameHeight: 700,
    scale:       0.15,  // visual: 75x105px
    anims: {
      run:    { start: 0, end: 3, frameRate: 8  },
      attack: { start: 4, end: 7, frameRate: 10 },
    },
  },

  RANGED_ARCHER: {
    enemyType:   'RANGED_ARCHER',
    label:       'Ranged Archer',
    textureKey:  'enemy_archer',
    assetPath:   'assets/enemy_archer.png',
    // Измерено: sheet 1000x560 → 4x2 кадра → frame 250x280
    // row 0 (frames 0–3): run | row 1 (frames 4–7): attack
    frameWidth:  250,
    frameHeight: 280,
    scale:       0.28,  // visual: 70x78px — чуть меньше grunt
    anims: {
      run:    { start: 0, end: 3, frameRate: 8  },
      attack: { start: 4, end: 7, frameRate: 10 },
    },
  },

  TANK_BRUTE: {
    enemyType:    'TANK_BRUTE',
    label:        'Tank Brute',
    textureKey:   'tank_brute_run',
    textureKeyAtk:'tank_brute_attack',
    assetPath:    'assets/tank_brute_run.png',
    assetPathAtk: 'assets/tank_brute_attack.png',
    frameWidth:   180,
    frameHeight:  193,
    scale:        0.80,
    anims: {
      run:    { start: 0, end: 3, frameRate: 6 },
      attack: { start: 0, end: 3, frameRate: 8 },
    },
  },

  ELITE_DEMON: {
    enemyType:   'ELITE_DEMON',
    label:       'Elite Demon',
    textureKey:  'enemy_grunt',
    assetPath:   '',
    frameWidth:  500,
    frameHeight: 700,
    scale:       0.15,
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
    scale:       0.10,  // visual: 50x70px — маленький и юркий
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
    scale:       0.13,
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
