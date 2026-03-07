import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function getPngSize(absPath) {
  const b = fs.readFileSync(absPath);
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  if (!b.subarray(0, 8).equals(sig)) throw new Error('Not a PNG');
  const ihdrLen = b.readUInt32BE(8);
  const ihdrType = b.subarray(12, 16).toString('ascii');
  if (ihdrType !== 'IHDR' || ihdrLen < 8) throw new Error('Invalid IHDR');
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function getJpegSize(absPath) {
  const b = fs.readFileSync(absPath);
  if (b[0] !== 0xff || b[1] !== 0xd8) throw new Error('Not a JPEG');
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    while (b[i] === 0xff) i++;
    const marker = b[i++];
    if (marker === 0xd8 || marker === 0xd9) continue;
    const segLen = (b[i] << 8) | b[i + 1];
    i += 2;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      i += 1;
      const height = (b[i] << 8) | b[i + 1];
      const width = (b[i + 2] << 8) | b[i + 3];
      return { width, height };
    }
    i += segLen - 2;
  }
  throw new Error('JPEG SOF marker not found');
}

function getImageSize(relPath) {
  const absPath = path.join(repoRoot, 'public', relPath);
  if (relPath.endsWith('.png')) return getPngSize(absPath);
  if (relPath.endsWith('.jpg') || relPath.endsWith('.jpeg')) return getJpegSize(absPath);
  throw new Error(`Unsupported format: ${relPath}`);
}

function parseWizardConfig(gameTs) {
  const m = gameTs.match(/load\.spritesheet\('wizard',\s*'assets\/wizard_sheet_full\.png',\s*\{\s*frameWidth:\s*(\d+),\s*frameHeight:\s*(\d+)/s);
  if (!m) throw new Error('wizard spritesheet config not found in game/Game.ts');
  return { frameWidth: Number(m[1]), frameHeight: Number(m[2]), requiredFrames: 12 };
}

function parseEnemyRegistry(regText) {
  const entries = [];
  const blockRegex = /([A-Z_]+):\s*\{([\s\S]*?)\n\s*\},/g;
  let block;
  while ((block = blockRegex.exec(regText)) !== null) {
    const enemyKey = block[1];
    const body = block[2];
    const assetPath = body.match(/assetPath:\s*'([^']*)'/)?.[1] ?? '';
    const textureKey = body.match(/textureKey:\s*'([^']+)'/)?.[1] ?? '';
    const fw = Number(body.match(/frameWidth:\s*(\d+)/)?.[1] ?? NaN);
    const fh = Number(body.match(/frameHeight:\s*(\d+)/)?.[1] ?? NaN);
    const runEnd = Number(body.match(/run:\s*\{[^}]*end:\s*(\d+)/s)?.[1] ?? NaN);
    const attackEnd = Number(body.match(/attack:\s*\{[^}]*end:\s*(\d+)/s)?.[1] ?? NaN);

    if (!assetPath) continue;
    entries.push({ enemyKey, textureKey, assetPath, frameWidth: fw, frameHeight: fh, maxFrame: Math.max(runEnd, attackEnd) });
  }
  return entries;
}

function checkSheet({ name, relPath, frameWidth, frameHeight, maxFrame }) {
  const { width, height } = getImageSize(relPath);
  const cols = Math.floor(width / frameWidth);
  const rows = Math.floor(height / frameHeight);
  const frames = cols * rows;
  const wastedX = width % frameWidth;
  const wastedY = height % frameHeight;

  const problems = [];
  if (!Number.isFinite(frameWidth) || !Number.isFinite(frameHeight) || frameWidth <= 0 || frameHeight <= 0) {
    problems.push('invalid frame size in config');
  }
  if (frames <= maxFrame) {
    problems.push(`not enough frames (${frames}) for max frame index ${maxFrame}`);
  }
  if (wastedX !== 0 || wastedY !== 0) {
    problems.push(`sprite sheet has unused remainder: ${wastedX}px x ${wastedY}px`);
  }

  return { name, relPath, width, height, frameWidth, frameHeight, cols, rows, frames, maxFrame, problems };
}

function main() {
  const gameTs = readText('game/Game.ts');
  const regText = readText('game/EnemySpriteRegistry.ts');

  const reports = [];

  const wizard = parseWizardConfig(gameTs);
  reports.push(checkSheet({
    name: 'wizard',
    relPath: 'assets/wizard_sheet_full.png',
    frameWidth: wizard.frameWidth,
    frameHeight: wizard.frameHeight,
    maxFrame: wizard.requiredFrames - 1,
  }));

  for (const entry of parseEnemyRegistry(regText)) {
    reports.push(checkSheet({
      name: `${entry.enemyKey}/${entry.textureKey}`,
      relPath: entry.assetPath,
      frameWidth: entry.frameWidth,
      frameHeight: entry.frameHeight,
      maxFrame: entry.maxFrame,
    }));
  }

  const floor = getImageSize('assets/floor_tile.jpg');

  console.log('Asset checks:');
  for (const r of reports) {
    const status = r.problems.length ? 'WARN' : 'OK';
    console.log(`- [${status}] ${r.name}: ${r.width}x${r.height}, frame ${r.frameWidth}x${r.frameHeight}, grid ${r.cols}x${r.rows}, frames=${r.frames}, required>${r.maxFrame}`);
< codex/check-models-and-textures-for-bugs-saqghz
    for (const p of r.problems) console.log(`    - ${p}`);

    for (const p of r.problems) console.log(`    • ${p}`);
 main
  }
  console.log(`- [OK] floor tile: ${floor.width}x${floor.height}`);

  const hardErrors = reports.flatMap(r => r.problems.filter(p => p.startsWith('invalid') || p.startsWith('not enough')));
  process.exit(hardErrors.length ? 1 : 0);
}

main();
