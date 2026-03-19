
import { ABILITIES_BASE, PASSIVE_UPGRADES, MAX_ABILITY_SLOTS } from '../constants';

// Element visual config
const ELEMENT_BADGE: Record<string, { icon: string; color: string; label: string }> = {
  fire:      { icon: '🔥', color: '#ff4422', label: 'FIRE'      },
  water:     { icon: '💧', color: '#0088ff', label: 'WATER'     },
  wind:      { icon: '🌪️', color: '#88ffcc', label: 'WIND'      },
  lightning: { icon: '⚡', color: '#ffdd00', label: 'LIGHTNING' },
  void:      { icon: '🔮', color: '#D700FF', label: 'VOID'      },
};

// Per-ability upgrade descriptions for each level
const LEVEL_UP_DESCRIPTIONS: Record<string, Record<number, string>> = {
  fireball:     { 2: '+25% dmg, -10% cooldown', 3: '+1 projectile', 4: '+25% dmg', 5: '+1 projectile, +25% dmg' },
  lightning:    { 2: '+25% dmg, -10% cooldown', 3: '+1 chain',      4: '+25% dmg', 5: '+1 chain, +25% dmg'      },
  aura:         { 2: '+25% dmg, -10% cooldown', 3: '+40 radius',    4: '+25% dmg', 5: '+40 radius, +25% dmg'    },
  ice_nova:     { 2: '+25% dmg, -10% cooldown', 3: '+50 radius',    4: '+25% dmg', 5: '+50 radius, +25% dmg'    },
  meteor_strike:{ 2: '+25% dmg, -10% cooldown', 3: '+40 radius',    4: '+25% dmg', 5: '+40 radius, +25% dmg'    },
  poison_bolt:  { 2: '+25% dmg, -10% cooldown', 3: 'Poison ×1.4, +1s', 4: '+25% dmg', 5: 'Poison ×1.4, +1s' },
  storm_lance:  { 2: '+25% dmg, -10% cooldown', 3: '+wider beam',   4: '+25% dmg', 5: '+25% dmg, +stun time'   },
  wind_slash:   { 2: '+25% dmg, -10% cooldown', 3: '+1 blade, +5% crit', 4: '+25% dmg', 5: '+1 blade, +5% crit' },
  waterball:    { 2: '+25% dmg, longer slow',   3: '+2 projectiles',4: '+25% dmg', 5: '+25% dmg, wider splash'  },
  dragon_breath:{ 2: '+25% dmg, wider cone',    3: '+longer range', 4: '+25% dmg', 5: '+25% dmg, +burn dps'    },
  void_beam:    { 2: 'dmg 115, radius 70, ×2.2 crit', 3: 'dmg 160, radius 85, ×2.5 crit', 4: 'dmg 210, radius 100, ×2.8 crit', 5: 'dmg 270, radius 120, ×3.2 crit' },
};

export class UpgradeSystem {
  /**
   * Генерирует 3 уникальных карточки улучшений на основе текущего состояния игрока.
   */
  static generateUpgradeChoices(playerStats, count = 3) {
    const pool = [];
    const acquiredIds = playerStats.abilities.map(a => a.id);
    
    // Приоритет 1: Новые способности (если есть пустые слоты) — добавляем 3x для частого появления
    if (acquiredIds.length < MAX_ABILITY_SLOTS) {
      const availableNew = Object.values(ABILITIES_BASE)
        .filter((base: any) => !acquiredIds.includes(base.id))
        .map((base: any) => {
          const elem = ELEMENT_BADGE[(base as any).element] || null;
          return {
            type: 'NEW_ABILITY',
            id: `new_${base.id}`,
            abilityId: base.id,
            name: base.name,
            description: base.description,
            icon: base.icon,
            element: (base as any).element,
            elementBadge: elem,
            rarity: 'Rare'
          };
        });
      pool.push(...availableNew, ...availableNew, ...availableNew);
    }

    // Приоритет 2: Апгрейды существующих — добавляем 2x
    playerStats.abilities.forEach((ab, index) => {
      if (ab.level < (ab.maxLevel || 5)) {
        const nextLevel = ab.level + 1;
        const levelDesc = LEVEL_UP_DESCRIPTIONS[ab.id]?.[nextLevel]
          || `+25% damage, -10% cooldown`;
        const elem = ELEMENT_BADGE[(ab as any).element] || null;
        const upg = {
          type: 'UPGRADE_ABILITY',
          id: `upg_${ab.id}_${ab.level}`,
          abilityId: ab.id,
          slot: index,
          name: `${ab.name}`,
          description: `Level ${nextLevel}: ${levelDesc}`,
          icon: ab.icon,
          element: (ab as any).element,
          elementBadge: elem,
          currentLevel: ab.level,
          nextLevel,
          rarity: 'Common'
        };
        pool.push(upg, upg); // 2x вес
      }
    });
    
    // Приоритет 3: Пассивки
    PASSIVE_UPGRADES.forEach(p => {
      const weight = (p as any).weight || 1;
      for (let w = 0; w < weight; w++) {
        pool.push({
          ...p,
          type: 'STAT_BOOST',
          id: `pass_${p.stat}_${w}`,
          name: p.description.split(':')[0],
          description: p.description.split(':')[1]?.trim() || p.description,
          rarity: 'Uncommon',
          elementBadge: null
        });
      }
    });

    // Выбираем уникальные элементы без дубликатов
    const shuffled = this.shuffle([...pool]);
    const selected = [];
    const seenIds = new Set();

    for (const item of shuffled) {
      if (!seenIds.has(item.id)) {
        selected.push(item);
        seenIds.add(item.id);
      }
      if (selected.length >= count) break;
    }

    return selected;
  }

  /**
   * Применяет выбранное улучшение к статистике игрока.
   */
  static applyUpgrade(choice, playerStats) {
    if (choice.type === 'NEW_ABILITY') {
      const base = ABILITIES_BASE[choice.abilityId];
      playerStats.abilities.push({
        ...base,
        level: 1,
        lastFired: 0,
        baseCooldown: base.baseCooldown,
        cooldown: base.baseCooldown * playerStats.cooldownMultiplier,
        trigger: 'auto'
      });
    } else if (choice.type === 'UPGRADE_ABILITY') {
      const ab = playerStats.abilities[choice.slot];
      if (ab) {
        ab.level++;
        ab.damage = (ab.damage || 10) * 1.25;
        ab.baseCooldown *= 0.9;
        ab.cooldown = ab.baseCooldown * playerStats.cooldownMultiplier;
        
        // Ability-specific level bonuses
        if (ab.id === 'fireball'      && (ab.level === 3 || ab.level === 5)) ab.projectileCount = (ab.projectileCount || 1) + 1;
        if (ab.id === 'lightning'     && (ab.level === 3 || ab.level === 5)) ab.chains = (ab.chains || 3) + 1;
        if (ab.id === 'ice_nova'      && (ab.level === 3 || ab.level === 5)) ab.radius = (ab.radius || 190) + 50;
        if (ab.id === 'aura'          && (ab.level === 3 || ab.level === 5)) ab.radius = (ab.radius || 125) + 40;
        if (ab.id === 'meteor_strike' && (ab.level === 3 || ab.level === 5)) ab.radius = (ab.radius || 140) + 40;
        if (ab.id === 'poison_bolt'   && (ab.level === 3 || ab.level === 5)) {
          ab.poisonDps = (ab.poisonDps || 15) * 1.4;
          ab.poisonDuration = (ab.poisonDuration || 4000) + 1000;
        }
        if (ab.id === 'wind_slash'    && (ab.level === 3 || ab.level === 5)) {
          ab.projectileCount = (ab.projectileCount || 3) + 1;
          ab.critBonus = (ab.critBonus || 0.15) + 0.05;
        }
        if (ab.id === 'waterball'     && (ab.level === 3 || ab.level === 5)) {
          ab.projectileCount = (ab.projectileCount || 1) + 2;
          ab.slowDuration = (ab.slowDuration || 2000) + 500;
        }
        if (ab.id === 'dragon_breath' && (ab.level === 3 || ab.level === 5)) {
          ab.coneAngle  = (ab.coneAngle  || 55) + 12;
          ab.coneRange  = (ab.coneRange  || 280) + 60;
        }
        // Void Beam — exact per-level stats from design doc
        if (ab.id === 'void_beam') {
          const voidLevels = [
            null,
            { damage: 80,  voidCritMult: 2.0, voidRadius: 60,  voidCastTime: 900, cooldown: 8000 },
            { damage: 115, voidCritMult: 2.2, voidRadius: 70,  voidCastTime: 850, cooldown: 7500 },
            { damage: 160, voidCritMult: 2.5, voidRadius: 85,  voidCastTime: 800, cooldown: 7000 },
            { damage: 210, voidCritMult: 2.8, voidRadius: 100, voidCastTime: 750, cooldown: 6500 },
            { damage: 270, voidCritMult: 3.2, voidRadius: 120, voidCastTime: 700, cooldown: 6000 },
          ];
          const lvlStats = voidLevels[ab.level];
          if (lvlStats) {
            ab.damage       = lvlStats.damage;
            ab.voidCritMult = lvlStats.voidCritMult;
            ab.voidRadius   = lvlStats.voidRadius;
            ab.voidCastTime = lvlStats.voidCastTime;
            ab.baseCooldown = lvlStats.cooldown;
            ab.cooldown     = lvlStats.cooldown * playerStats.cooldownMultiplier;
          }
        }
      }
    } else if (choice.type === 'STAT_BOOST') {
      const { stat, value, multiplier } = choice;
      
      if (stat === 'dashCooldown') {
        playerStats[stat] = Math.max(400, (playerStats[stat] || 1500) + value);
      } else if (stat === 'cooldownMultiplier') {
        playerStats[stat] *= (1 / (1 + value));
        playerStats.abilities.forEach(a => {
           a.cooldown = a.baseCooldown * playerStats.cooldownMultiplier;
        });
      } else if (stat === 'healthRegen') {
        playerStats.healthRegen = (playerStats.healthRegen || 0) + value;
      } else if (multiplier) {
        playerStats[stat] *= (1 + value);
      } else {
        playerStats[stat] += value;
      }
    }
  }

  private static shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
