#!/usr/bin/env node
// Usage:
// npm run create:enemy-entry -- <ENEMY_TYPE> <textureKey> <assetPath> <frameWidth> <frameHeight> <scale> <runStart> <runEnd> <attackStart> <attackEnd> [runFps=8] [attackFps=10]
//
// Example:
// npm run create:enemy-entry -- RANGED_ARCHER enemy_archer assets/enemy_archer.png 220 250 0.30 0 3 4 7

function usage() {
  console.log('Usage: npm run create:enemy-entry -- <ENEMY_TYPE> <textureKey> <assetPath> <frameWidth> <frameHeight> <scale> <runStart> <runEnd> <attackStart> <attackEnd> [runFps=8] [attackFps=10]');
  console.log('');
  console.log('Example:');
  console.log('  npm run create:enemy-entry -- RANGED_ARCHER enemy_archer assets/enemy_archer.png 220 250 0.30 0 3 4 7');
}

const args = process.argv.slice(2);
if (args.length < 10) {
  usage();
  process.exit(1);
}

const [
  enemyType,
  textureKey,
  assetPath,
  frameWidth,
  frameHeight,
  scale,
  runStart,
  runEnd,
  attackStart,
  attackEnd,
  runFps = '8',
  attackFps = '10'
] = args;

const toNum = (v, name) => {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    console.error(`Invalid number for ${name}: ${v}`);
    process.exit(1);
  }
  return n;
};

const fw = toNum(frameWidth, 'frameWidth');
const fh = toNum(frameHeight, 'frameHeight');
const sc = toNum(scale, 'scale');

// Validate frame counts
const runS = toNum(runStart, 'runStart');
const runE = toNum(runEnd, 'runEnd');
const atkS = toNum(attackStart, 'attackStart');
const atkE = toNum(attackEnd, 'attackEnd');
const maxFrame = Math.max(runE, atkE);

console.log(`\n// Paste this block into game/EnemySpriteRegistry.ts inside ENEMY_SPRITE_REGISTRY:\n`);

const label = enemyType.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const entry = `  ${enemyType}: {
    enemyType:   '${enemyType}',
    label:       '${label}',
    textureKey:  '${textureKey}',
    assetPath:   '${assetPath}',
    frameWidth:  ${fw},
    frameHeight: ${fh},
    scale:       ${sc},
    anims: {
      run:    { start: ${runS}, end: ${runE}, frameRate: ${toNum(runFps, 'runFps')}  },
      attack: { start: ${atkS}, end: ${atkE}, frameRate: ${toNum(attackFps, 'attackFps')} },
    },
  },`;

console.log(entry);
console.log('\n// Then run: npm run check:assets');
