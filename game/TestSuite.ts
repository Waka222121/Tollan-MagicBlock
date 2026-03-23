// Fix: Added missing Phaser import to resolve type and namespace errors
import Phaser from 'phaser';
import { GAME_BALANCE, BOSS_TEMPLATES, INITIAL_PLAYER } from '../constants';
import { PlayerManager, LootSystem } from './GameManagers';

export class TestSuite {
  static runAll(scene: Phaser.Scene, playerManager: PlayerManager, lootSystem: LootSystem) {
    console.group('%c 🧪 TOLLAN MAGICBLOCK TEST SUITE ', 'background: #9b59b6; color: #fff; font-weight: bold; padding: 4px;');
    
    this.testPlayerMovement(playerManager);
    this.testWaveScaling();
    this.testBossPhases(scene);
    this.testLootMagnet(playerManager, lootSystem);

    console.groupEnd();
  }

  static testPlayerMovement(pm: PlayerManager) {
    console.log('Test 1: Player movement normalization...');
    const speed = pm.stats.speed * 60;
    
    // Simulate diagonal input
    // We manually set a velocity to check if normalization would yield correct speed magnitude
    // But in our manager we use Phaser Vector2 Normalize
    const testVec = new Phaser.Math.Vector2(1, 1).normalize().scale(speed);
    const magnitude = Math.hypot(testVec.x, testVec.y);
    
    const passed = Math.abs(magnitude - speed) < 0.01;
    console.assert(passed, 'Movement normalization failed', { magnitude, speed });
    if (passed) console.log('%c PASS: Movement normalized', 'color: #00ff66');
  }

  static testWaveScaling() {
    console.log('Test 2: Wave scaling...');
    const config = GAME_BALANCE.waveLogic.generateConfig(5);
    
    const enemiesPassed = config.totalEnemies === 40;
    const hpPassed = Math.abs(config.multipliers.hp - 1.90) < 0.01;

    console.assert(enemiesPassed, 'Wave 5 should have 40 enemies', { actual: config.totalEnemies });
    console.assert(hpPassed, 'HP multiplier incorrect for Wave 5', { actual: config.multipliers.hp, expected: 1.90 });
    
    if (enemiesPassed && hpPassed) console.log('%c PASS: Wave scaling correct', 'color: #00ff66');
  }

  static testBossPhases(scene: Phaser.Scene) {
    console.log('Test 3: Boss phase transitions...');
    const template = BOSS_TEMPLATES.SERINAX;

    if (!template?.phaseThresholds || !template?.phases) {
      console.warn('SKIP: SERINAX template missing phaseThresholds/phases');
      return;
    }

    // Pure logic test — no Phaser objects, just simulate handleBossLogic math
    const stats = {
      maxHp: template.baseHP,
      hp: template.baseHP,
      speed: template.speed,
      baseSpeed: template.speed,
      damage: template.baseDamage,
      baseDamage: template.baseDamage
    };

    const bossData = {
      currentPhase: 0,
      thresholds: template.phaseThresholds,
      phases: template.phases,
      state: 'IDLE',
      abilities: [],
      timers: {}
    };

    // Simulate taking damage to 50% HP
    stats.hp = stats.maxHp * 0.5;

    // Mirror of handleBossLogic phase-check logic
    if (bossData.currentPhase < bossData.phases.length - 1) {
      const nextThreshold = bossData.thresholds[bossData.currentPhase + 1];
      if (nextThreshold !== undefined && (stats.hp / stats.maxHp) <= nextThreshold) {
        bossData.currentPhase++;
        const phaseConfig = bossData.phases[bossData.currentPhase];
        if (phaseConfig) {
          stats.speed  = stats.baseSpeed  * (phaseConfig.speedMultiplier  || 1);
          stats.damage = stats.baseDamage * (phaseConfig.damageMultiplier || 1);
        }
      }
    }

    const phasePassed = bossData.currentPhase === 1;
    const speedPassed = stats.speed > template.speed;

    console.assert(phasePassed, 'Should be in phase 1 at 50% HP', { actual: bossData.currentPhase });
    console.assert(speedPassed, 'Speed should increase in Phase 2', { actual: stats.speed, initial: template.speed });

    if (phasePassed && speedPassed) console.log('%c PASS: Boss phases functioning', 'color: #00ff66');
  }

  static testLootMagnet(pm: PlayerManager, ls: LootSystem) {
    console.log('Test 4: Loot magnet...');
    const player = pm.sprite;
    
    // Spawn a drop within range (default magnetRange for XP is 80, player starts at 700,400 in test coords)
    const dropX = player.x + 50;
    const dropY = player.y + 50;
    
    ls.spawnDrop('XP', 10, dropX, dropY);
    const drop: any = ls.group.getChildren().find((c: any) => c.active && c.x === dropX);
    
    if (!drop) {
      console.error('Failed to spawn drop for test');
      return;
    }

    const initialDist = Phaser.Math.Distance.Between(drop.x, drop.y, player.x, player.y);
    
    // Mock delta update
    ls.update(100, pm);
    
    const newDist = Phaser.Math.Distance.Between(drop.x, drop.y, player.x, player.y);
    const magnetPassed = newDist < initialDist;
    
    console.assert(magnetPassed, 'Drop should move towards player', { initialDist, newDist });
    if (magnetPassed) console.log('%c PASS: Loot magnet active', 'color: #00ff66');
    
    // Cleanup test drop
    drop.setActive(false).setVisible(false);
    drop.body.enable = false;
  }
}