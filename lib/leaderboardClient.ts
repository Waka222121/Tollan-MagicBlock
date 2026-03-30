import {
  fetchLeaderboardRows,
  isLeaderboardConfigured,
  submitLeaderboardRow,
  type WaveLeaderboardEntry,
} from './leaderboardService';

interface SubmitPayload {
  playerName: string;
  wave: number;
  score: number;
}

const LOCAL_KEY = 'mb_local_leaderboard_v2';

function normalizeName(name: string) {
  return String(name || '').trim().toLowerCase();
}

function isBetter(next: WaveLeaderboardEntry, prev: WaveLeaderboardEntry) {
  if (next.wave !== prev.wave) return next.wave > prev.wave;
  if (next.score !== prev.score) return next.score > prev.score;
  return next.created_at < prev.created_at;
}

function sortRows(rows: WaveLeaderboardEntry[]) {
  return [...rows].sort((a, b) => (b.wave - a.wave) || (b.score - a.score) || a.created_at.localeCompare(b.created_at));
}

function bestByPlayer(rows: WaveLeaderboardEntry[]) {
  const map = new Map<string, WaveLeaderboardEntry>();
  for (const row of rows) {
    const key = normalizeName(row.player_name);
    if (!key) continue;
    const prev = map.get(key);
    if (!prev || isBetter(row, prev)) map.set(key, row);
  }
  return [...map.values()];
}

function readLocalRows(): WaveLeaderboardEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalRows(rows: WaveLeaderboardEntry[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
}

export type { WaveLeaderboardEntry };

export async function fetchWaveLeaderboard(limit = 8): Promise<WaveLeaderboardEntry[]> {
  if (!isLeaderboardConfigured()) {
    return sortRows(bestByPlayer(readLocalRows())).slice(0, limit);
  }

  const remoteRows = await fetchLeaderboardRows(200);
  return sortRows(bestByPlayer(remoteRows)).slice(0, limit);
}

export async function submitWaveResult({ playerName, wave, score }: SubmitPayload): Promise<void> {
  if (!isLeaderboardConfigured()) {
    const localRows = readLocalRows();
    const incoming: WaveLeaderboardEntry = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      player_name: (playerName || 'YOU').trim().slice(0, 18),
      wave: Math.max(1, Math.floor(wave || 1)),
      score: Math.max(0, Math.floor(score || 0)),
      created_at: new Date().toISOString(),
    };
    const key = norm(payload.player_name);
    const idx = rows.findIndex(r => norm(r.player_name) === key);
    if (idx >= 0) { if (isBetter(entry, rows[idx])) rows[idx] = { ...rows[idx], ...entry }; }
    else rows.push(entry);
    saveLocal(sorted(dedup(rows)).slice(0, 64));
    return;
  }

    const key = normalizeName(incoming.player_name);
    const idx = localRows.findIndex((r) => normalizeName(r.player_name) === key);
    if (idx >= 0) {
      if (isBetter(incoming, localRows[idx])) localRows[idx] = incoming;
    } else {
      localRows.push(incoming);
    }

    writeLocalRows(sortRows(bestByPlayer(localRows)).slice(0, 64));
    return;
  }

  await submitLeaderboardRow({ playerName, wave, score });
}
