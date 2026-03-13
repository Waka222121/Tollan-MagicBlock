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
    enemyType:   'TANK_BRUTE',
    label:       'Tank Brute',
    textureKey:  'tank_brute',
    // Единый шит: 1456x720 → 4x2 кадра → frame 364x360
    // row 0 (frames 0–3): run | row 1 (frames 4–7): attack
    assetPath:   'assets/tank_brute.png',
    frameWidth:  364,
    frameHeight: 360,
    scale:       0.50,  // visual: ~182x180px — крупный танк
    anims: {
      run:    { start: 0, end: 3, frameRate: 7 },
      attack: { start: 4, end: 7, frameRate: 8 },
    },
  },

  ELITE_DEMON: {
    enemyType:   'ELITE_DEMON',
    label:       'Elite Demon',
    textureKey:  'elite_demon',
    // Единый шит: 1408x768 → 4x2 кадра → frame 352x384
    // row 0 (frames 0–3): run | row 1 (frames 4–7): attack
    assetPath:   'assets/elite_demon.png',
    frameWidth:  352,
    frameHeight: 384,
    scale:       0.28,  // visual: ~99x108px — чуть крупнее grunt
    anims: {
      run:    { start: 0, end: 3, frameRate: 8  },
      attack: { start: 4, end: 7, frameRate: 10 },
    },
  },

  SUMMONER: {
    enemyType:   'SUMMONER',
    label:       'Shadow Summoner',
    textureKey:  'summoner',
    // Единый шит: 1408x768 → 4x2 кадра → frame 352x384
    // row 0 (frames 0–3): walk | row 1 (frames 4–7): summon/cast
    assetPath:   'assets/summoner.png',
    frameWidth:  352,
    frameHeight: 384,
    scale:       0.26,  // visual: ~92x100px — чуть меньше grunt
    anims: {
      run:    { start: 0, end: 3, frameRate: 6  },
      attack: { start: 4, end: 7, frameRate: 8  },
    },
  },

  SHIELDER: {
    enemyType:   'SHIELDER',
    label:       'Iron Shielder',
    textureKey:  'shielder',
    // Единый шит: 1408x752 → 4x2 кадра → frame 352x376
    // row 0 (frames 0–3): march | row 1 (frames 4–7): attack
    assetPath:   'assets/shielder.png',
    frameWidth:  352,
    frameHeight: 376,
    scale:       0.30,  // visual: ~106x113px — крупнее grunt
    anims: {
      run:    { start: 0, end: 3, frameRate: 7  },
      attack: { start: 4, end: 7, frameRate: 9  },
    },
  },
};
