import { execSync } from 'node:child_process';

const pattern = '^<<<<<<<|^=======|^>>>>>>>|>>>> main|<<<<<<< ';
const cmd = `rg "${pattern}" -n --glob '!dist/**' --glob '!node_modules/**' --glob '!scripts/check-merge-markers.mjs'`;

try {
  const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (out) {
    console.error('❌ Merge conflict markers found:\n');
    console.error(out);
    process.exit(1);
  }
} catch (err) {
  // rg exits with code 1 when nothing found
  if (typeof err?.status === 'number' && err.status === 1) {
    console.log('✅ No merge conflict markers found');
    process.exit(0);
  }
  console.error('❌ Failed to run merge marker check');
  console.error(err?.stderr?.toString?.() || err?.message || err);
  process.exit(2);
}
