
export const WORLD_SIZE = 4000;
export const SCREEN_PADDING = 100;

export const INITIAL_PLAYER = {
  radius: 16,
  speed: 4.5,
  maxHp: 100,
  armor: 2,
  damageMultiplier: 1.0,
  cooldownMultiplier: 1.0,
  critChance: 0.05,
  critMultiplier: 2.0,
  pickupRange: 160,
  dashCooldown: 1500,
  dashDuration: 200,
  dashSpeedMult: 5.0
};

export const MAX_ABILITY_SLOTS = 6;

// Elite enemy affixes — randomly applied to ~20-35% of enemies in later waves
export const ELITE_AFFIXES = {
  BERSERKER: {
    name: 'Berserker',
    color: 0xff2200,
    hpMult: 1.5,
    damageMult: 1.6,
    speedMult: 1.3,
    xpMult: 2.0,
    goldMult: 2.0
  },
  ARMORED: {
    name: 'Armored',
    color: 0x8899aa,
    hpMult: 2.5,
    damageMult: 1.1,
    speedMult: 0.85,
    flatArmor: 15,     // absorbs 15 flat damage per hit
    xpMult: 2.0,
    goldMult: 2.0
  },
  REGENERATING: {
    name: 'Regenerating',
    color: 0x00ff88,
    hpMult: 1.8,
    damageMult: 1.0,
    speedMult: 1.0,
    regenPerSec: 0.01, // % of maxHP per second
    xpMult: 2.5,
    goldMult: 2.5
  },
  VOLATILE: {
    name: 'Volatile',
    color: 0xffaa00,
    hpMult: 0.8,
    damageMult: 1.2,
    speedMult: 1.1,
    deathExplosionRadius: 100,
    deathExplosionDamage: 40,
    xpMult: 2.2,
    goldMult: 2.2
  }
};

// Status effect configs
export const STATUS_EFFECTS = {
  BURNING: {
    id: 'BURNING',
    duration: 3000,
    tickInterval: 500,
    color: 0xff4400,
    icon: '🔥'
  },
  FROZEN: {
    id: 'FROZEN',
    duration: 2000,
    slowFactor: 0.35,
    color: 0x00ffff,
    icon: '❄️'
  },
  POISONED: {
    id: 'POISONED',
    duration: 4000,
    tickInterval: 500,
    color: 0x00ff44,
    icon: '☠️'
  },
  STUNNED: {
    id: 'STUNNED',
    duration: 1200,
    color: 0xffff00,
    icon: '⚡'
  },
  // Tag-only — no visual tint, just marks enemy for WILDFIRE reaction
  WIND: {
    id: 'WIND',
    duration: 4000,
    color: 0xecf0f1,
    icon: '🌪️'
  }
};

// Elemental reactions: triggered when two elements meet on the same enemy
// key = "EFFECT_A + EFFECT_B" (always sorted alphabetically)
export const ELEMENTAL_REACTIONS = {
  // 🔥 + ❄️ = SHATTER — ice shatters under heat: massive burst + stun
  'BURNING+FROZEN': {
    id: 'SHATTER',
    name: 'SHATTER',
    icon: '💥❄️',
    color: 0x88eeff,
    damageMult: 3.0,       // instant burst = base dmg × 3
    stunDuration: 1500,
    aoeRadius: 0,          // no splash
    description: 'Ice shatters under fire — massive burst + stun'
  },
  // ❄️ + ⚡ = FROZEN SHOCK — conducts through frozen body, chains to nearby
  'FROZEN+STUNNED': {
    id: 'FROZEN_SHOCK',
    name: 'FROZEN SHOCK',
    icon: '⚡❄️',
    color: 0x00ffff,
    damageMult: 2.0,
    stunDuration: 2000,
    chainRadius: 180,      // arcs to enemies within 180px
    chainDamageMult: 0.6,
    description: 'Lightning conducts through ice — chains to nearby enemies'
  },
  // 🔥 + 🌪️ = WILDFIRE — wind fans the flames into an area blaze
  'BURNING+WIND': {
    id: 'WILDFIRE',
    name: 'WILDFIRE',
    icon: '🔥🌪️',
    color: 0xff6600,
    damageMult: 1.5,
    aoeRadius: 220,        // fire spreads outward
    burnDuration: 4000,    // applies burning to all in radius
    burnDps: 20,
    description: 'Wind fans flames into a spreading wildfire'
  },
  // ☠️ + ⚡ = TOXIC BURST — venom detonates, spreading poison
  'POISONED+STUNNED': {
    id: 'TOXIC_BURST',
    name: 'TOXIC BURST',
    icon: '☠️⚡',
    color: 0x88ff44,
    damageMult: 2.5,
    aoeRadius: 160,
    spreadPoison: true,    // applies POISONED to all in radius
    description: 'Electric charge detonates venom in an area'
  },
  // 🔥 + ☠️ = PLAGUE FIRE — burning accelerates poison to lethal rate
  'BURNING+POISONED': {
    id: 'PLAGUE_FIRE',
    name: 'PLAGUE FIRE',
    icon: '🔥☠️',
    color: 0xaaff00,
    damageMult: 1.0,
    poisonMult: 3.0,       // multiplies existing poison DPS
    poisonExtend: 3000,    // adds 3s to poison duration
    description: 'Fire accelerates poison to lethal rate'
  }
};

export const XP_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450
];

export const MAGIC_COLORS = {
  FIRE: 0xff6600,
  WATER: 0x00aaff,
  LIGHTNING: 0x00ddff,
  WIND: 0xecf0f1,
  VOID: 0xD700FF,
  XP: 0x00ff66,
  STAT: 0xffcc00,
  CRIT: 0xffff00,
  BOSS: 0xff00ff,
  LEVEL_UP: 0xa855f7,
  ENEMY_PROJ: 0xff3333,
  BOSS_CHARGE: 0xff4400,
  BOSS_AOE: 0x9900ff,
  GOLD: 0xffcc00,
  GEM: 0x4488ff,
  HP_DROP: 0xff4444,
  POISON: 0x00ff00,
  ICE: 0x00ffff,
  METEOR: 0xff4400
};

export const LOOT_CONFIG = {
  XP:   { color: 0x00ff66, magnetRange: 80, radius: 6 },
  GOLD: { color: 0xffcc00, magnetRange: 80, radius: 5 },
  GEM:  { color: 0x4488ff, magnetRange: 100, radius: 7 },
  HP:   { color: 0xff4444, magnetRange: 60, radius: 8 }
};

export const ENEMY_TEMPLATES = {
  MELEE_GRUNT: {
    name: "Melee Grunt",
    baseHP: 35,
    baseDamage: 10,
    speed: 150,
    size: 28,  // fix: было 16 (32px hitbox = 30% visual) → теперь 56px = 53% visual
    xpReward: 8,
    goldReward: 3,
    behavior: 'CHASE',
    color: 0x4e6b3e
  },
  RANGED_ARCHER: {
    name: "Ranged Archer",
    baseHP: 25,
    baseDamage: 14,
    speed: 110,
    size: 23,  // fix: было 14 (28px hitbox = 33% visual) → теперь 46px = 55% visual
    xpReward: 12,
    goldReward: 5,
    behavior: 'KITE',
    attackRange: 320,
    attackRate: 1800, 
    projectileSpeed: 380,
    color: 0x3b82f6
  },
  TANK_BRUTE: {
    name: "Tank Brute",
    baseHP: 220,
    baseDamage: 28,
    speed: 80,
    size: 32,
    xpReward: 30,
    goldReward: 12,
    behavior: 'CHASE',
    color: 0x1f2937
  },
  ELITE_DEMON: {
    name: "Elite Demon",
    baseHP: 550,
    baseDamage: 45,
    speed: 125,
    size: 24,
    xpReward: 55,
    goldReward: 20,
    behavior: 'MIXED',
    attackRange: 200,
    attackRate: 1500,
    color: 0xef4444
  },
  SUMMONER: {
    name: "Shadow Summoner",
    baseHP: 80,
    baseDamage: 8,
    speed: 70,
    size: 20,
    xpReward: 25,
    goldReward: 10,
    behavior: 'SUMMONER',
    attackRange: 400,
    attackRate: 4000,
    color: 0x7c3aed
  },
  SHIELDER: {
    name: "Iron Shielder",
    baseHP: 180,
    baseDamage: 20,
    speed: 90,
    size: 22,
    xpReward: 20,
    goldReward: 8,
    behavior: 'CHASE',
    frontArmor: 25,
    color: 0x94a3b8
  }
};

export const BOSS_TEMPLATES = {
  SERINAX: {
    name: "SERINAX",
    baseHP: 5000,
    baseDamage: 40,
    speed: 95,
    size: 32,
    color: 0xff0000,
    xpReward: 1000,
    behavior: 'BOSS_AI',
    phaseThresholds: [1.0, 0.6, 0.2],
    phases: [
      { speedMultiplier: 1.0, damageMultiplier: 1.0, message: "SERINAX AWAKENS" },
      { speedMultiplier: 1.2, damageMultiplier: 1.3, message: "PHASE 2: UNLEASHED" },
      { speedMultiplier: 1.5, damageMultiplier: 1.8, message: "FINAL STAND: TERMINAL" }
    ],
    abilities: ['CHARGE', 'AOE_SLAM', 'SUMMON_MINIONS']
  },
  VORGATH: {
    name: "VORGATH",
    baseHP: 10000,
    baseDamage: 45,
    speed: 85,
    size: 36,
    color: 0x44aa22,        // болотно-зелёный
    xpReward: 2000,
    goldReward: 180,
    behavior: 'BOSS_AI',
    phaseThresholds: [1.0, 0.6, 0.3],
    phases: [
      { speedMultiplier: 1.0, damageMultiplier: 1.0, message: "VORGATH EMERGES" },
      { speedMultiplier: 1.3, damageMultiplier: 1.2, message: "THE SWARM AWAKENS" },
      { speedMultiplier: 1.6, damageMultiplier: 1.5, message: "VORGATH — PLAGUE FORM" }
    ],
    abilities: ['SUMMON_MINIONS', 'POISON_NOVA']
  },
  NEXARION: {
    name: "NEXARION",
    baseHP: 15000,
    baseDamage: 50,
    speed: 120,
    size: 28,
    color: 0x0044ff,        // электрический синий
    xpReward: 3000,
    goldReward: 250,
    behavior: 'BOSS_AI',
    phaseThresholds: [1.0, 0.5, 0.25],
    phases: [
      { speedMultiplier: 1.0, damageMultiplier: 1.0, message: "NEXARION MANIFESTS" },
      { speedMultiplier: 1.4, damageMultiplier: 1.3, message: "STATIC OVERLOAD: ENGAGED" },
      { speedMultiplier: 1.8, damageMultiplier: 1.7, message: "NEXARION — FULL DISCHARGE" }
    ],
    abilities: ['CHAIN_LIGHTNING', 'TELEPORT']
  }
};

export const GAME_BALANCE = {
  comboTimeout: 3000,
  maxProjectiles: 150,
  maxEnemies: 400,
  invincibilityDuration: 100,
  waveTransitionDelay: 2000,
  formulas: {
    getXPForNextLevel: (currentLevel) => {
      if (currentLevel < XP_THRESHOLDS.length) {
        return XP_THRESHOLDS[currentLevel];
      }
      return XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + (currentLevel - XP_THRESHOLDS.length + 1) * 1000;
    },
  },
  waveLogic: {
    generateConfig: (wave) => {
      const difficultyStep = 0.12;  // было 0.225 — слишком быстрый рост HP
      const hpMult = 1.0 + (wave - 1) * difficultyStep;
      const dmgMult = 1.0 + (wave - 1) * 0.08;  // было 0.15
      
      // Boss waves: 5=SERINAX, 10=VORGATH, 15=NEXARION, затем повторяются каждые 5
      const bossOrder = ['SERINAX', 'VORGATH', 'NEXARION'];
      const isBossWave = wave % 5 === 0;
      const bossKey = isBossWave ? bossOrder[Math.floor(wave / 5 - 1) % bossOrder.length] : null;

      // New enemies unlock progressively
      const hasSummoner = wave >= 4;
      const hasShielder = wave >= 5;

      return {
        waveNumber: wave,
        totalEnemies: 15 + wave * 5,
        bossKey,
        composition: {
          MELEE_GRUNT:   Math.max(0.05, 0.75 - wave * 0.04),
          RANGED_ARCHER: Math.min(0.30, 0.08 + wave * 0.03),
          TANK_BRUTE:    wave >= 3 ? Math.min(0.20, (wave - 2) * 0.04) : 0,
          ELITE_DEMON:   wave >= 6 ? Math.min(0.20, (wave - 5) * 0.04) : 0,
          SUMMONER:      hasSummoner ? Math.min(0.15, (wave - 3) * 0.025) : 0,
          SHIELDER:      hasShielder ? Math.min(0.15, (wave - 4) * 0.025) : 0,
        },
        spawnInterval: Math.max(150, 2000 - wave * 100),
        spawnBurst: Math.min(8, 1 + Math.floor(wave / 2.5)),
        multipliers: {
          hp:     hpMult,
          damage: dmgMult,
          speed:  Math.min(2.0, 1.0 + (wave - 1) * 0.04),
          xp:     1.0 + (wave - 1) * 0.05
        },
        isBossWave,
        eliteChance: wave >= 3 ? Math.min(0.35, (wave - 2) * 0.05) : 0
      };
    }
  }
};

export const ABILITIES_BASE = {
  fireball: {
    id: 'fireball',
    name: 'Ignis Bolt',
    description: 'Launches seeking shards of burning light.',
    damage: 32,
    baseCooldown: 1100,
    icon: '🔥',
    type: 'weapon',
    element: 'fire',
    projectileCount: 1,
    maxLevel: 5
  },
  lightning: {
    id: 'lightning',
    name: 'Chain Lightning',
    description: 'Strikes an enemy and chains to 3 nearby foes.',
    damage: 55,
    baseCooldown: 2800,
    icon: '⚡',
    type: 'weapon',
    element: 'lightning',
    chains: 3,
    chainRange: 220,
    chainDamageFalloff: 0.7,
    maxLevel: 5
  },
  aura: {
    id: 'aura',
    name: 'Void Pulse',
    description: 'Periodically damages all enemies in radius. Burns on crit.',
    damage: 12,
    baseCooldown: 1400,
    icon: '🔮',
    type: 'weapon',
    element: 'lightning',
    radius: 125,
    maxLevel: 5
  },
  ice_nova: {
    id: 'ice_nova',
    name: 'Frost Nova',
    description: 'Explodes in a ring of ice, slowing nearby enemies.',
    damage: 45,
    baseCooldown: 4500,
    radius: 190,
    icon: '❄️',
    type: 'weapon',
    element: 'water',
    maxLevel: 5
  },
  meteor_strike: {
    id: 'meteor_strike',
    name: 'Starfall',
    description: 'Calls down a massive meteor on the nearest enemy cluster.',
    damage: 180,
    baseCooldown: 7000,
    radius: 140,
    icon: '☄️',
    type: 'weapon',
    element: 'fire',
    maxLevel: 5
  },
  poison_bolt: {
    id: 'poison_bolt',
    name: 'Venom Lash',
    description: 'Fires a slow toxic projectile that poisons on hit for 4 sec.',
    damage: 20,
    baseCooldown: 2000,
    icon: '☠️',
    type: 'weapon',
    element: 'wind',
    poisonDps: 15,
    poisonDuration: 4000,
    maxLevel: 5
  },
  storm_lance: {
    id: 'storm_lance',
    name: 'Storm Lance',
    description: 'Fires a piercing lightning bolt through all enemies in sight. Stuns on hit.',
    damage: 65,
    baseCooldown: 2200,
    icon: '⚡🗡️',
    type: 'weapon',
    element: 'lightning',
    piercing: true,
    width: 24,
    stunDuration: 800,
    maxLevel: 5
  },
  wind_slash: {
    id: 'wind_slash',
    name: 'Gale Cut',
    description: 'Fires 3 fast wind blades in a spread. High crit chance.',
    damage: 28,
    baseCooldown: 1800,
    icon: '🌪️',
    type: 'weapon',
    element: 'wind',
    projectileCount: 3,
    spreadAngle: 25,
    critBonus: 0.15,
    maxLevel: 5
  },
  waterball: {
    id: 'waterball',
    name: 'Tidal Surge',
    description: 'Launches a water projectile that slows enemies on hit for 2 sec.',
    damage: 38,
    baseCooldown: 1600,
    icon: '💧',
    type: 'weapon',
    element: 'water',
    slowFactor: 0.4,
    slowDuration: 2000,
    maxLevel: 5
  },
  dragon_breath: {
    id: 'dragon_breath',
    name: 'Dragon Breath',
    description: 'Exhales a cone of fire burning all enemies in front for 3 sec.',
    damage: 18,
    baseCooldown: 3200,
    icon: '🐉',
    type: 'weapon',
    element: 'fire',
    coneAngle: 55,
    coneRange: 280,
    burnDuration: 3000,
    maxLevel: 5
  },
  void_beam: {
    id: 'void_beam',
    name: 'Void Beam',
    description: 'Marks a random location then strikes with a devastating void beam. Always crits.',
    damage: 80,
    baseCooldown: 8000,
    icon: '🔮',
    type: 'weapon',
    element: 'void',
    voidCritMult: 2.0,
    voidRadius: 60,
    voidCastTime: 900,
    maxLevel: 5
  }
};

export const PASSIVE_UPGRADES = [
  { stat: 'maxHp',             value: 20,   description: 'Integrity: Max HP +20',          icon: '❤️',  weight: 1 },
  { stat: 'damageMultiplier',  value: 0.15, description: 'Power: Damage +15%',              icon: '⚔️',  weight: 1, multiplier: true },
  { stat: 'cooldownMultiplier',value: 0.1,  description: 'Haste: Attack Speed +10%',        icon: '⏳',  weight: 1, multiplier: true },
  { stat: 'speed',             value: 0.5,  description: 'Agility: Move Speed +15%',        icon: '👟',  weight: 1, multiplier: true },
  { stat: 'critChance',        value: 0.05, description: 'Focus: Crit Chance +5%',          icon: '🎯',  weight: 1 },
  { stat: 'critMultiplier',    value: 0.25, description: 'Lethality: Crit Damage +25%',     icon: '💥',  weight: 1, multiplier: true },
  { stat: 'armor',             value: 5,    description: 'Plating: Armor +5',               icon: '🛡️',  weight: 1 },
  { stat: 'pickupRange',       value: 40,   description: 'Magnetism: Pickup Range +40',     icon: '🧲',  weight: 1 },
  { stat: 'dashCooldown',      value: -250, description: 'Blink: Dash Cooldown -250ms',     icon: '💨',  weight: 1 },
  { stat: 'healthRegen',       value: 2,    description: 'Regeneration: +2 HP every 3 sec', icon: '💚',  weight: 1 },
  { stat: 'pickupRange',       value: 80,   description: 'XP Magnet: Pickup Range ×1.5',    icon: '✨',  weight: 1 },
];
